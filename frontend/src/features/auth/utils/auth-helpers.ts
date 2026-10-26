export function extractClerkErrorMessage(
  err: unknown,
  fallback = 'An unexpected authentication error occurred.',
): string {
  const clerkError = (
    err as {
      errors?: { code?: string; longMessage?: string; message?: string }[];
    }
  )?.errors?.[0];

  return (
    clerkError?.longMessage ||
    clerkError?.message ||
    (err instanceof Error ? err.message : '') ||
    fallback
  );
}

interface GoogleSSOResultLike {
  createdSessionId?: string | null;
  signIn?: {
    createdSessionId?: string | null;
    identifier?: string | null;
  } | null;
  signUp?: {
    createdSessionId?: string | null;
    emailAddress?: string | null;
    firstName?: string | null;
    status?: string | null;
    missingFields?: string[] | null;
  } | null;
}

export function resolveGoogleSessionId(
  result: GoogleSSOResultLike,
): string | null {
  return (
    result.createdSessionId ||
    result.signIn?.createdSessionId ||
    result.signUp?.createdSessionId ||
    null
  );
}

export function getGoogleFallbackUser(result: GoogleSSOResultLike): {
  email: string;
  name: string;
} {
  const rawEmail =
    result.signIn?.identifier ||
    result.signUp?.emailAddress ||
    'google.user@clerk.dev';
  const rawName = result.signUp?.firstName?.trim() || 'Google User';

  return {
    email: rawEmail.trim().toLowerCase(),
    name: rawName,
  };
}

export function buildMissingProfileUpdate(
  missingFields: string[],
  uniqueId: string = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
): { username?: string; firstName?: string; lastName?: string } {
  const update: { username?: string; firstName?: string; lastName?: string } =
    {};

  if (missingFields.includes('username')) {
    update.username = `user_${uniqueId}`;
  }
  if (missingFields.includes('first_name')) {
    update.firstName = 'Monevo';
  }
  if (missingFields.includes('last_name')) {
    update.lastName = 'User';
  }

  return update;
}
