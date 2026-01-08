import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService, ITokenPair } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  TEMP_TOKEN_COOKIE,
  TEMP_TOKEN_MAX_AGE,
} from './auth.constants';

interface IOAuthUser {
  email: string;
  displayName: string;
  avatarUrl: string;
}

interface IAuthenticatedUser {
  userId: string;
  sessionId: string;
}

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;
  private readonly frontendUrl: string;
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.isProduction = configService.get('NODE_ENV') === 'production';
    this.frontendUrl = configService.get<string>('FRONTEND_URL')!;
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Passport handles redirect to Github
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as IOAuthUser;
    const result = await this.authService.handleGithubCallback(user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (result.isNewUser && result.tempToken) {
      // New user: set tempToken cookie and redirect user to complete their registration
      this.setTempTokenCookie(res, result.tempToken);
      return res.redirect(`${frontendUrl}/auth/complete`);
    }

    if (result.tokens) {
      // both access and refrsh token are set in cookies and user is logged in
      this.setAuthCookies(res, result.tokens);
      return res.redirect(`${frontendUrl}`);
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('complete')
  async completeRegistration(
    @Body() dto: CompleteRegistrationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tempToken = req.cookies?.[TEMP_TOKEN_COOKIE];

    if (!tempToken)
      throw new BadRequestException(
        'Registration session not found. Please login again',
      );

    const tokens = await this.authService.completeRegistration(
      tempToken,
      dto.username,
    );

    this.clearTempTokenCookie(res);
    this.setAuthCookies(res, tokens);

    return { message: 'Registration completed successfully' };
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken)
      throw new BadRequestException('Refresh token not found in request');

    // validate and extract refresh token from payload
    const payload = this.authService.validateRefreshToken(refreshToken);
    const result = await this.authService.refreshAccessToken(payload.refreshId);

    this.setAccessTokenCookie(res, result.accessToken);

    // if renewed, set refresh token also
    if (result.renewed && result.refreshToken)
      this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      message: 'Token refreshed successfully',
      renewed: result.renewed,
    };
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 request per minute
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as IAuthenticatedUser;
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    let refreshId: string | undefined;
    if (refreshToken) {
      const payload = this.authService.validateRefreshToken(refreshToken);
      refreshId = payload.refreshId;
    }

    await this.authService.logout(user.sessionId, refreshId);
    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as IAuthenticatedUser;
    await this.authService.logoutAll(user.userId);
    this.clearAuthCookies(res);

    return { message: 'All sessions terminated successfully' };
  }

  // Cookie Helpers //

  private setAuthCookies(res: Response, tokens: ITokenPair): void {
    this.setAccessTokenCookie(res, tokens.accessToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
  }

  private setAccessTokenCookie(res: Response, token: string): void {
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/auth',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  private setTempTokenCookie(res: Response, token: string): void {
    res.cookie(TEMP_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/auth',
      maxAge: TEMP_TOKEN_MAX_AGE,
    });
  }
  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/auth' });
  }
  private clearTempTokenCookie(res: Response): void {
    res.clearCookie(TEMP_TOKEN_COOKIE, { path: '/' });
  }
}
