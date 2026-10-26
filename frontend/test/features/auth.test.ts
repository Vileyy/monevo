import {
  buildMissingProfileUpdate,
  extractClerkErrorMessage,
  getGoogleFallbackUser,
  resolveGoogleSessionId,
} from '../../src/features/auth/utils/auth-helpers';
import { buildClerkProfileUpdates } from '../../src/features/auth/utils/clerk-profile';

describe('auth feature validation', () => {
  it('should extract appropriate Clerk error messages', () => {
    expect(
      extractClerkErrorMessage({
        errors: [{ message: 'Custom message' }],
      }),
    ).toBe('Custom message');

    expect(extractClerkErrorMessage(new Error('Plain error'))).toBe(
      'Plain error',
    );

    expect(extractClerkErrorMessage({}, 'Fallback message')).toBe(
      'Fallback message',
    );
  });
});

describe('Google SSO helpers', () => {
  it('resolves the session id from the SSO result', () => {
    expect(resolveGoogleSessionId({ createdSessionId: 'sess_1' })).toBe(
      'sess_1',
    );
    expect(
      resolveGoogleSessionId({
        createdSessionId: null,
        signIn: { createdSessionId: 'sess_2' },
      }),
    ).toBe('sess_2');
    expect(
      resolveGoogleSessionId({
        createdSessionId: null,
        signIn: { createdSessionId: null },
        signUp: { createdSessionId: 'sess_3' },
      }),
    ).toBe('sess_3');
    expect(resolveGoogleSessionId({ createdSessionId: null })).toBeNull();
  });

  it('builds a fallback user from the SSO result', () => {
    expect(
      getGoogleFallbackUser({
        signIn: { identifier: '  User@Example.com ' },
        signUp: { firstName: '  An ' },
      }),
    ).toEqual({ email: 'user@example.com', name: 'An' });

    expect(
      getGoogleFallbackUser({
        signIn: { identifier: null },
        signUp: { emailAddress: 'google@example.com', firstName: null },
      }),
    ).toEqual({ email: 'google@example.com', name: 'Google User' });

    expect(getGoogleFallbackUser({})).toEqual({
      email: 'google.user@clerk.dev',
      name: 'Google User',
    });
  });

  it('fills only the profile fields Clerk reports as missing', () => {
    expect(buildMissingProfileUpdate(['username'], '123_abcd')).toEqual({
      username: 'user_123_abcd',
    });

    expect(
      buildMissingProfileUpdate(
        ['first_name', 'last_name', 'username'],
        '123_abcd',
      ),
    ).toEqual({
      username: 'user_123_abcd',
      firstName: 'Monevo',
      lastName: 'User',
    });

    expect(buildMissingProfileUpdate([], '123_abcd')).toEqual({});
  });
});

describe('Clerk profile sync', () => {
  const storedUser = {
    email: 'user_abc@clerk.user',
    name: 'Monevo Member',
  };

  it('fills the real email, default name and avatar from Clerk', () => {
    expect(
      buildClerkProfileUpdates(storedUser, {
        fullName: 'Hieu Nguyen',
        imageUrl: 'https://img.clerk.com/avatar.png',
        primaryEmailAddress: { emailAddress: 'hieu.nguyen@gmail.com' },
      }),
    ).toEqual({
      name: 'Hieu Nguyen',
      avatarUrl: 'https://img.clerk.com/avatar.png',
      email: 'hieu.nguyen@gmail.com',
    });
  });

  it('keeps the values the user already has', () => {
    expect(
      buildClerkProfileUpdates(
        {
          email: 'hieu.nguyen@gmail.com',
          name: 'Hieu',
          avatarUrl: 'https://img.clerk.com/avatar.png',
        },
        {
          fullName: 'Hieu Nguyen',
          imageUrl: 'https://img.clerk.com/avatar.png',
          primaryEmailAddress: { emailAddress: 'hieu.nguyen@gmail.com' },
        },
      ),
    ).toEqual({});
  });

  it('ignores placeholder addresses and truncated names', () => {
    expect(
      buildClerkProfileUpdates(storedUser, {
        firstName: '',
        lastName: '',
        primaryEmailAddress: { emailAddress: 'user_abc@clerk.user' },
      }),
    ).toEqual({});
    expect(buildClerkProfileUpdates(storedUser, {})).toEqual({});
  });
});
