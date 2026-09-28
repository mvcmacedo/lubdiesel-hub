import { validateEnv } from './env.validation';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: '3001',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: '0123456789012345',
  JWT_REFRESH_SECRET: '0123456789abcdef',
  BCRYPT_SALT_ROUNDS: '4',
  THROTTLE_TTL: '60',
  THROTTLE_LIMIT: '100',
  FRONTEND_URL: 'http://localhost:3000',
  LOG_LEVEL: 'warn',
};

describe('validateEnv', () => {
  it('coerces numeric string values (as provided by process.env) into numbers', () => {
    const result = validateEnv({ ...baseEnv });

    expect(result.PORT).toBe(3001);
    expect(typeof result.PORT).toBe('number');
    expect(result.BCRYPT_SALT_ROUNDS).toBe(4);
    expect(result.THROTTLE_TTL).toBe(60);
    expect(result.THROTTLE_LIMIT).toBe(100);
  });

  it('applies defaults for optional fields', () => {
    const { LOG_LEVEL, ...withoutLogLevel } = baseEnv;
    void LOG_LEVEL;
    const result = validateEnv(withoutLogLevel);

    expect(result.LOG_LEVEL).toBe('info');
  });

  it('throws when a required secret is too short', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_SECRET: 'short' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('throws when PORT is out of range', () => {
    expect(() => validateEnv({ ...baseEnv, PORT: '70000' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
