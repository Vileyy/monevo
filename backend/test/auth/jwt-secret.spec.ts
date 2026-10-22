import {
  DEVELOPMENT_JWT_FALLBACK,
  resolveJwtSecret,
} from '../../src/auth/jwt-secret';

function configWith(secret?: string) {
  return {
    get: (key: string) => (key === 'JWT_SECRET' ? secret : undefined),
  };
}

describe('resolveJwtSecret', () => {
  it('returns the configured secret', () => {
    expect(resolveJwtSecret(configWith('super-secret'), 'production')).toBe(
      'super-secret',
    );
  });

  it('uses the fallback in development and tests', () => {
    expect(resolveJwtSecret(configWith(undefined), 'development')).toBe(
      DEVELOPMENT_JWT_FALLBACK,
    );
    expect(resolveJwtSecret(configWith('   '), 'test')).toBe(
      DEVELOPMENT_JWT_FALLBACK,
    );
  });

  it('refuses to boot in production without a real secret', () => {
    expect(() => resolveJwtSecret(configWith(undefined), 'production')).toThrow(
      'JWT_SECRET is required in production',
    );
    expect(() => resolveJwtSecret(configWith(''), 'production')).toThrow(
      'JWT_SECRET is required in production',
    );
  });
});
