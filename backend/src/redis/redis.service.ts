import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { IOAuthProfile } from '../modules/auth/interfaces/oauth-profile.interface';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  TEMP_TOKEN_TTL,
} from 'src/modules/auth/auth.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // Access Token Session (valid for 15min)

  async setSession(
    userId: string,
    sessionId: string,
    ttl: number = ACCESS_TOKEN_TTL,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    const userSessionsKey = `user_sessions:${userId}`;

    await this.redis.set(key, userId, 'EX', ttl);
    await this.redis.sadd(userSessionsKey, sessionId);
    // Set the user_sessions set to expire after refresh token TTL
    // This ensures cleanup even if individual sessions expire
    await this.redis.expire(userSessionsKey, REFRESH_TOKEN_TTL);
  }

  async getSession(sessionId: string): Promise<string | null> {
    return this.redis.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const userId = await this.getSession(sessionId);

    if (userId) {
      await this.redis.del(`session:${sessionId}`);
      await this.redis.srem(`user_sessions:${userId}`, sessionId);
    }
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const sessionsKey = `user_sessions:${userId}`; // user_sessions:ab123
    const sessionIds = await this.redis.smembers(sessionsKey); // ["sess-123", "sess-234"]

    if (sessionIds.length > 0) {
      const sessionKeys = sessionIds.map((id) => `session:${id}`); // construct individual session token list
      await this.redis.del(...sessionKeys);
      await this.redis.del(sessionsKey); // delete the main set
    }
  }

  // Refresh Token Sessions (7days validity)
  async setRefreshSession(
    userId: string,
    refreshId: string,
    ttl: number = REFRESH_TOKEN_TTL,
  ): Promise<void> {
    const key = `refresh:${refreshId}`;
    const userRefreshKey = `user_refresh_tokens:${userId}`;

    await this.redis.set(key, userId, 'EX', ttl);

    await this.redis.sadd(userRefreshKey, refreshId);
    await this.redis.expire(userRefreshKey, ttl);
  }

  async getRefreshToken(refreshId: string): Promise<string | null> {
    return this.redis.get(`refresh:${refreshId}`); // returns userId
  }

  async getRefreshTokenTTL(refreshId: string): Promise<number> {
    return this.redis.ttl(`refresh:${refreshId}`);
  }

  async deleteRefreshToken(refreshId: string): Promise<void> {
    const userId = await this.getRefreshToken(refreshId);

    if (userId) {
      await this.redis.del(`refresh:${refreshId}`);
      await this.redis.srem(`user_refresh_tokens:${userId}`, refreshId);
    }
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    const refreshKey = `user_refresh_tokens:${userId}`;
    const refreshIds = await this.redis.smembers(refreshKey);

    if (refreshIds.length > 0) {
      const refreshKeys = refreshIds.map((id) => `refresh:${id}`);
      await this.redis.del(...refreshKeys); // delete all refresh session for that user with key: refresh:userId
      await this.redis.del(refreshKey); // delete the main user_refresh_tokens set for userId
    }
  }

  async setOAuthProfile(
    tempToken: string,
    profile: IOAuthProfile,
  ): Promise<void> {
    await this.redis.set(
      `oauth:${tempToken}`,
      JSON.stringify(profile),
      'EX',
      TEMP_TOKEN_TTL,
    );

    await this.redis.set(
      `oauth_email:${profile.email}`,
      tempToken,
      'EX',
      TEMP_TOKEN_TTL,
    );
  }

  async getOAuthProfile(tempToken: string): Promise<IOAuthProfile | null> {
    const data = await this.redis.get(`oauth:${tempToken}`);
    return data ? JSON.parse(data) : null;
  }

  async getOAuthProfileByEmail(
    email: string,
  ): Promise<{ tempToken: string; profile: IOAuthProfile } | null> {
    const tempToken = await this.redis.get(`oauth_email:${email}`);
    if (!tempToken) return null;

    const profile = await this.getOAuthProfile(tempToken);
    if (!profile) return null;

    return { tempToken, profile };
  }

  async deleteOAuthProfile(tempToken: string): Promise<void> {
    const profile = await this.getOAuthProfile(tempToken);
    if (profile) {
      await this.redis.del(`oauth_email:${profile.email}`);
    }
    await this.redis.del(`oauth:${tempToken}`);
  }
}
