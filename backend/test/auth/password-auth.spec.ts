import { resolvePasswordAuthEnabled } from '../../src/auth/password-auth';

function configWith(value?: string) {
  return {
    get: (key: string) => (key === 'PASSWORD_AUTH_ENABLED' ? value : undefined),
  };
}

describe('resolvePasswordAuthEnabled', () => {
  it('honours an explicit enable', () => {
    expect(resolvePasswordAuthEnabled(configWith('true'), 'production')).toBe(
      true,
    );
  });

  it('honours an explicit disable', () => {
    expect(resolvePasswordAuthEnabled(configWith('false'), 'development')).toBe(
      false,
    );
  });

  it('is disabled by default in production', () => {
    expect(
      resolvePasswordAuthEnabled(configWith(undefined), 'production'),
    ).toBe(false);
  });

  it('stays enabled for local development and tests', () => {
    expect(
      resolvePasswordAuthEnabled(configWith(undefined), 'development'),
    ).toBe(true);
    expect(resolvePasswordAuthEnabled(configWith(undefined), 'test')).toBe(
      true,
    );
  });
});
