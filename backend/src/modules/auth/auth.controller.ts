import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { CheckUsernameDto } from './dto/check-username.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Passport handles redirect to Github
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: unknown, @Res() res: Response) {
    const user = (
      req as { user: { email: string; displayName: string; avatarUrl: string } }
    ).user;
    const result = await this.authService.handleGithubCallback(user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (result.isNewUser)
      return res.redirect(
        `${frontendUrl}/auth/complete?tempToken=${result.tempToken}`,
      );

    return res.redirect(
      `${frontendUrl}/auth/sucess?token=${result.accessToken}`,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('complete')
  async completeRegistration(@Body() dto: CompleteRegistrationDto) {
    return this.authService.completeRegistration(dto.tempToken, dto.username);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 per minute
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: unknown) {
    const user = (req as { user: { sessionId: string } }).user;
    await this.authService.logout(user.sessionId);
    return { message: 'Logged out successfully' };
  }
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 per minute
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: unknown) {
    const user = (req as { user: { id: string } }).user;
    await this.authService.logoutAll(user.id);
    return { message: 'All sessions terminated' };
  }
}
