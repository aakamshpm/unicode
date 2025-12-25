import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RedisService } from 'src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { IOAuthProfile } from './interfaces/oauth-profile.interface';
import { JwtConfig } from 'src/config/jwt.config';
import { StringValue } from 'ms';
import { GRACE_PERIOD_TTL } from './auth.constants';
import { ConfigService } from '@nestjs/config';

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface IRefreshResult {
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
  renewed: boolean;
}

export interface IGithubCallbackResult {
  isNewUser: boolean;
  tempToken?: string;
  tokens?: ITokenPair;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtConfig: JwtConfig;
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt')!;
  }

  async handleGithubCallback(
    profile: IOAuthProfile,
  ): Promise<IGithubCallbackResult> {
    if (!profile.email)
      throw new BadRequestException(
        'Github account must have a public email. Please update your Github settings.',
      );

    const existingUser = await this.usersService.findByEmail(profile.email);

    if (existingUser) {
      // Existing user: just login and update timestamp
      await this.usersService.updateLastLogin(existingUser.id);
      const tokens = await this.createSession(existingUser.id);
      return { isNewUser: false, tokens };
    }

    // New user: we need to check if they have a pending registration
    const existingProfile = await this.redisService.getOAuthProfileByEmail(
      profile.email,
    );

    // If pending registration found, dump that token and create a new one
    if (existingProfile) {
      // DELETE old tempToken to invalidate it
      await this.redisService.deleteOAuthProfile(existingProfile.tempToken);

      // Log:  User resumed registration
      this.logger.log(
        `User resuming registration:  ${profile.email} (old token invalidated)`,
      );
    }

    // Create a new user with temp profile (this handles both pending and new registrations)
    const tempToken = uuidv4();
    await this.redisService.setOAuthProfile(tempToken, {
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl || null,
    });

    this.logger.debug(
      `New registration flow started for: ${profile.email}, tempToken: ${tempToken.substring(0, 8)}...`,
    );
    return { isNewUser: true, tempToken };
  }

  async completeRegistration(
    tempToken: string,
    username: string,
  ): Promise<ITokenPair> {
    const profile = await this.redisService.getOAuthProfile(tempToken);
    if (!profile)
      throw new BadRequestException(
        'Registration session expired. Please login again.',
      );

    const { email, avatarUrl: avatar_url, displayName: display_name } = profile;
    if (!email) throw new BadRequestException('Email is not provided');

    const isAvailable = await this.usersService.isUsernameAvailable(username);

    if (!isAvailable) throw new ConflictException('Username already taken');

    const user = await this.usersService.create({
      email,
      avatar_url,
      display_name,
      username,
      oauth_provider: 'github',
    });

    // clean up temp profile after successful registration
    await this.redisService.deleteOAuthProfile(tempToken);

    return await this.createSession(user.id);
  }

  async createSession(id: string): Promise<ITokenPair> {
    const sessionId = uuidv4();
    const refreshId = uuidv4();

    await this.redisService.setSession(id, sessionId);
    await this.redisService.setRefreshSession(id, refreshId);

    // we return access token and refres token JWT's with both userid and sessionId
    const accessToken = await this.signAccessToken(id, sessionId);
    const refreshToken = await this.signRefreshToken(id, refreshId);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshId: string): Promise<IRefreshResult> {
    const userId = await this.redisService.getRefreshToken(refreshId); // this function returns corresponding userId

    if (!userId)
      throw new UnauthorizedException('Invalid or expired refresh token');

    const ttl = await this.redisService.getRefreshTokenTTL(refreshId);

    // Grace period: refresh token expiring within 24 hours
    // Renew both tokens to keep user logged in
    if (ttl > 0 && ttl <= GRACE_PERIOD_TTL) {
      this.logger.debug(
        `Refresh token in grace period (TTL: ${ttl}s), renewing both tokens for user: ${userId}`,
      );

      // Delete old refresh token
      // Access token will be already expired, so no checking needed
      await this.redisService.deleteRefreshToken(refreshId);

      const tokens = await this.createSession(userId);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        renewed: true,
        sessionId: this.extractSessionId(tokens.accessToken),
      };
    }

    // Normal refresh: generate a new access token
    const sessionId = uuidv4();
    await this.redisService.setSession(userId, sessionId);
    const accessToken = await this.signAccessToken(userId, sessionId);

    return { accessToken, sessionId, renewed: false };
  }

  /**
   * Logs out from current session (invalidates both access and refresh tokens)
   */
  async logout(sessionId: string, refreshId?: string): Promise<void> {
    await this.redisService.deleteSession(sessionId);
    if (refreshId) {
      await this.redisService.deleteRefreshToken(refreshId);
    }
  }

  /**
   * Logs out from all sessions (invalidates all access and refresh tokens)
   */
  async logoutAll(userId: string): Promise<void> {
    await this.redisService.deleteAllUserSessions(userId);
    await this.redisService.deleteAllUserRefreshTokens(userId);
  }

  validateRefreshToken(token: string): { sub: string; refreshId: string } {
    try {
      return this.jwtService.verify(token, {
        secret: this.jwtConfig.refreshToken.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async signAccessToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    return await this.jwtService.signAsync({ sub: userId, sessionId });
  }

  private async signRefreshToken(
    userId: string,
    refreshId: string,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      { sub: userId, refreshId },
      {
        secret: this.jwtConfig.refreshToken.secret,
        expiresIn: this.jwtConfig.refreshToken.expiresIn as StringValue,
      },
    );
  }

  private extractSessionId(accessToken: string): string {
    const decoded = this.jwtService.decode(accessToken) as {
      sessionId: string;
    };
    return decoded.sessionId;
  }
}
