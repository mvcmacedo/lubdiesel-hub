import { NodeEnv } from './env.validation';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  databaseUrl: string;
  frontendUrl: string;
  logLevel: string;
  bcryptSaltRounds: number;
  redisUrl?: string;
  jwt: JwtConfig;
  throttle: ThrottleConfig;
}

/**
 * Maps validated environment variables into a typed, nested configuration object.
 * Access via `ConfigService.get<...>('jwt', { infer: true })` etc.
 */
export default (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV as NodeEnv) ?? NodeEnv.Development,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL as string,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  redisUrl: process.env.REDIS_URL || undefined,
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL ?? 60),
    limit: Number(process.env.THROTTLE_LIMIT ?? 10),
  },
});
