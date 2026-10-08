export function isValidEmailFormat(inputEmail: string): boolean {
  const trimmed = inputEmail.trim().toLowerCase();
  if (!trimmed) return false;
  return /\S+@\S+\.\S+/.test(trimmed);
}

export function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const clerkErrors = (
    err as {
      errors?: { code?: string; message?: string; longMessage?: string }[];
    }
  )?.errors;

  if (Array.isArray(clerkErrors)) {
    for (const e of clerkErrors) {
      if (e.code === "too_many_requests") return true;
      const combined =
        `${e.message || ""} ${e.longMessage || ""}`.toLowerCase();
      if (
        combined.includes("too many requests") ||
        combined.includes("try again in a bit") ||
        combined.includes("rate limit")
      ) {
        return true;
      }
    }
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("too many requests") ||
      msg.includes("try again in a bit") ||
      msg.includes("rate limit")
    ) {
      return true;
    }
  }

  return false;
}

export function isUserNotFoundError(err: unknown): boolean {
  if (!err) return false;
  const clerkErrors = (
    err as {
      errors?: { code?: string; message?: string; longMessage?: string }[];
    }
  )?.errors;

  if (Array.isArray(clerkErrors)) {
    for (const e of clerkErrors) {
      if (
        e.code === "form_identifier_not_found" ||
        e.code === "user_not_found"
      ) {
        return true;
      }
      const combined =
        `${e.message || ""} ${e.longMessage || ""}`.toLowerCase();
      if (
        combined.includes("not found") ||
        combined.includes("doesn't exist") ||
        combined.includes("does not exist")
      ) {
        return true;
      }
    }
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("not found") ||
      msg.includes("doesn't exist") ||
      msg.includes("does not exist")
    ) {
      return true;
    }
  }

  return false;
}

export function isUserExistsError(err: unknown): boolean {
  if (!err) return false;
  const clerkErrors = (
    err as {
      errors?: { code?: string; message?: string; longMessage?: string }[];
    }
  )?.errors;

  if (Array.isArray(clerkErrors)) {
    for (const e of clerkErrors) {
      if (
        e.code === "form_identifier_exists" ||
        e.code === "identifier_already_signed_in"
      ) {
        return true;
      }
      const combined =
        `${e.message || ""} ${e.longMessage || ""}`.toLowerCase();
      if (
        combined.includes("already exists") ||
        combined.includes("already taken")
      ) {
        return true;
      }
    }
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("already exists") || msg.includes("already taken")) {
      return true;
    }
  }

  return false;
}

export function isSessionExistsError(err: unknown): boolean {
  if (!err) return false;
  const clerkErrors = (
    err as {
      errors?: { code?: string; message?: string; longMessage?: string }[];
    }
  )?.errors;

  if (Array.isArray(clerkErrors)) {
    for (const e of clerkErrors) {
      if (e.code === "session_exists") return true;
      const combined =
        `${e.message || ""} ${e.longMessage || ""}`.toLowerCase();
      if (combined.includes("already signed in")) return true;
    }
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("already signed in") || msg.includes("session exists")) {
      return true;
    }
  }

  return false;
}

export function extractClerkErrorMessage(
  err: unknown,
  fallback = "An unexpected authentication error occurred.",
): string {
  const clerkError = (
    err as {
      errors?: { code?: string; longMessage?: string; message?: string }[];
    }
  )?.errors?.[0];

  return (
    clerkError?.longMessage ||
    clerkError?.message ||
    (err instanceof Error ? err.message : "") ||
    fallback
  );
}
