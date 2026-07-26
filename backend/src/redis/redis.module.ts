import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
          console.warn('REDIS_URL not set in env, initializing Redis mock');
          return null;
        }
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            return Math.min(times * 50, 2000);
          },
        });

        client.on('error', (err) => {
          console.warn('[Redis] Connection error:', err.message);
        });

        client.on('connect', () => {
          console.log('[Redis] Successfully connected to Railway Redis proxy.');
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
