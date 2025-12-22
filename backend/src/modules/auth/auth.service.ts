import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RedisService } from 'src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { IOAuthProfile } from './interfaces/oauth-profile.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async handleGithubCallback(profile: IOAuthProfile): Promise<{
    needsUsername: boolean;
    tempToken?: string;
    accessToken?: string;
  }> {
    if (!profile.email)
      throw new BadRequestException(
        'Github account must have a public email. Please update your Github settings.',
      );

    const existingUser = await this.usersService.findByEmail(profile.email);

    if (existingUser) {
      await this.usersService.updateLastLogin(existingUser.id);
      const accessToken = await this.createSession(existingUser.id);
      return { needsUsername: false, accessToken };
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
      avatarUrl: profile.avatarUrl || '',
    });

    this.logger.debug(
      `New registration flow started for: ${profile.email}, tempToken: ${tempToken.substring(0, 8)}...`,
    );
    return { needsUsername: true, tempToken };
  }

  async completeRegistration(
    tempToken: string,
    username: string,
  ): Promise<{ accessToken: string }> {
    const profile = await this.redisService.getOAuthProfile(tempToken);
    if (!profile)
      throw new BadRequestException(
        'Registratin session expired. Please login again.',
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

    const accessToken = await this.createSession(user.id);
    return { accessToken };
  }

  async createSession(id: string): Promise<string> {
    const sessionId = uuidv4();
    await this.redisService.setSession(id, sessionId);

    // we return a JWT with both userid and sessionId
    return this.jwtService.sign({
      sub: id,
      sessionId,
    });
  }

  async logout(sessionId: string): Promise<void> {
    await this.redisService.deleteSession(sessionId);
  }
  async logoutAll(userId: string): Promise<void> {
    await this.redisService.deleteAllUserSessions(userId);
  }
}
