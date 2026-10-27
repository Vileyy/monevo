import { apiErrorMessage } from '@/lib/api-error';

export type EmailAuthMode = 'signin' | 'signup';

export interface EmailAuthInput {
  mode: EmailAuthMode;
  email: string;
  password: string;
  name?: string;
}

export interface EmailAuthPayload {
  email: string;
  password: string;
  name?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Keep validation in one place so the screen and the tests agree on the rules.
 * The minimum password length mirrors the backend DTO.
 */
export function validateEmailAuthInput(input: EmailAuthInput): string | null {
  const email = normalizeEmail(input.email);

  if (!email) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  if (!input.password) return 'Enter your password.';
  if (input.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}

export function buildEmailAuthPayload(input: EmailAuthInput): EmailAuthPayload {
  const payload: EmailAuthPayload = {
    email: normalizeEmail(input.email),
    password: input.password,
  };

  const name = input.name?.trim();
  if (input.mode === 'signup' && name) {
    payload.name = name;
  }

  return payload;
}

export function emailAuthErrorMessage(
  error: unknown,
  mode: EmailAuthMode,
): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;

    if (status === 401) {
      return 'Email or password is incorrect.';
    }
    if (status === 409) {
      return 'An account with this email already exists. Try signing in instead.';
    }
  }

  return apiErrorMessage(
    error,
    mode === 'signup'
      ? 'Could not create your account. Please try again.'
      : 'Could not sign you in. Please try again.',
  );
}
