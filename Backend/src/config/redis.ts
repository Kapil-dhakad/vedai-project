import Redis from 'ioredis';

interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
  enableReadyCheck: boolean;
  tls?: Record<string, unknown>;
  retryStrategy?: (times: number) => number | null;
}

const buildConnectionOptions = (): RedisConnectionOptions => {
  const opts: RedisConnectionOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      if (times > 10) return null;
      return Math.min(times * 200, 3000);
    },
  };

  if (process.env.REDIS_PASSWORD) {
    opts.password = process.env.REDIS_PASSWORD;
  }

  if (process.env.REDIS_TLS === 'true') {
    opts.tls = {};
  }

  return opts;
};

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(buildConnectionOptions() as any);
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    redisClient.on('ready', () => console.log('✅ Redis ready'));
    redisClient.on('error', (err: Error) => console.error('❌ Redis error:', err.message));
    redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
  }
  return redisClient;
};


export const createRedisConnection = (): any => buildConnectionOptions();

export default getRedisClient;
