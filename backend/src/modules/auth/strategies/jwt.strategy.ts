import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from 'src/redis/redis.service';
import { JwtConfig } from '../../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    const jwtConfig = configService.get<JwtConfig>('jwt')!;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  /**
   * Validates the JWT session against Redis.
   * Returns userId and sessionId for use in route handlers.
   * User existence was already verified at login time.
   */
  async validate(payload: { sub: string; sessionId: string }) {
    const userId = await this.redisService.getSession(payload.sessionId);

    if (!userId || userId !== payload.sub) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    return { userId, sessionId: payload.sessionId };
  }
}
