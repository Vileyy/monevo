import {
  buildEmailAuthPayload,
  emailAuthErrorMessage,
  normalizeEmail,
  validateEmailAuthInput,
} from '../../src/features/auth/utils/credentials';

describe('email/password auth helpers', () => {
  it('normalizes email addresses', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });

  it('rejects missing or malformed credentials', () => {
    expect(
      validateEmailAuthInput({
        mode: 'signin',
        email: '',
        password: 'secret1',
      }),
    ).toBe('Enter your email address.');

    expect(
      validateEmailAuthInput({
        mode: 'signin',
        email: 'not-an-email',
        password: 'secret1',
      }),
    ).toBe('Enter a valid email address.');

    expect(
      validateEmailAuthInput({
        mode: 'signin',
        email: 'user@example.com',
        password: '',
      }),
    ).toBe('Enter your password.');

    expect(
      validateEmailAuthInput({
        mode: 'signin',
        email: 'user@example.com',
        password: '12345',
      }),
    ).toBe('Password must be at least 6 characters.');
  });

  it('accepts valid sign-in and sign-up credentials', () => {
    expect(
      validateEmailAuthInput({
        mode: 'signin',
        email: ' user@example.com ',
        password: 'secret1',
      }),
    ).toBeNull();

    expect(
      validateEmailAuthInput({
        mode: 'signup',
        email: 'new@example.com',
        password: 'secret1',
        name: '  An  ',
      }),
    ).toBeNull();
  });

  it('builds a normalized payload and only sends a name on sign-up', () => {
    expect(
      buildEmailAuthPayload({
        mode: 'signin',
        email: ' User@Example.com ',
        password: 'secret1',
        name: 'Ignored',
      }),
    ).toEqual({ email: 'user@example.com', password: 'secret1' });

    expect(
      buildEmailAuthPayload({
        mode: 'signup',
        email: ' New@Example.com ',
        password: 'secret1',
        name: '  An  ',
      }),
    ).toEqual({
      email: 'new@example.com',
      password: 'secret1',
      name: 'An',
    });
  });

  it('maps common auth failures to friendly messages', () => {
    expect(emailAuthErrorMessage({ response: { status: 401 } }, 'signin')).toBe(
      'Email or password is incorrect.',
    );

    expect(emailAuthErrorMessage({ response: { status: 409 } }, 'signup')).toBe(
      'An account with this email already exists. Try signing in instead.',
    );

    expect(emailAuthErrorMessage(new Error('boom'), 'signin')).toBe(
      'Could not sign you in. Please try again.',
    );
    expect(emailAuthErrorMessage(new Error('boom'), 'signup')).toBe(
      'Could not create your account. Please try again.',
    );
  });
});
