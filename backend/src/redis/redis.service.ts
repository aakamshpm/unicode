import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async setSession(
    userId: string,
    sessionId: string,
    ttl: number = 7 * 24 * 60 * 60,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    const userSessionsKey = `user_sessions:${userId}`;

    await this.redis.set(key, userId, 'EX', ttl);
    await this.redis.sadd(userSessionsKey, sessionId);
    await this.redis.expire(userSessionsKey, ttl);
  }

  async getSession(sessionId: string): Promise<string | null> {
    return this.redis.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const userId = await this.getSession(sessionId);

    if (userId) {
      await this.redis.del(`sessionId:${sessionId}`);
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

  async setOAuthProfile(
    tempToken: string,
    profile: { email: string; displayName: string; avatarUrl: string },
  ): Promise<void> {
    await this.redis.set(
      `oauth:${tempToken}`,
      JSON.stringify(profile),
      'EX',
      300,
    );
  }

  async getOAuthProfile(
    tempToken: string,
  ): Promise<{ email: string; displayName: string; avatarUrl: string } | null> {
    const data = await this.redis.get(`oauth:${tempToken}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteOAuthProfile(tempToken: string): Promise<void> {
    await this.redis.del(`oauth:${tempToken}`);
  }
}
