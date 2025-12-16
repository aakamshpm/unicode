import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/modules/users/users.service';
import { RedisService } from 'src/redis/redis.service';
import { JwtConfig } from '../../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private redisService: RedisService,
    private usersService: UsersService,
  ) {
    const jwtConfig = configService.get<JwtConfig>('jwt')!;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: { sub: string; sessionId: string }) {
    const userId = await this.redisService.getSession(payload.sessionId);
    if (!userId || userId !== payload.sub)
      throw new UnauthorizedException('Session expired or invalid');

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    return { ...user, sessionId: payload.sessionId };
  }
}
