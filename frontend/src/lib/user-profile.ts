export function displayableEmail(email?: string | null): string | null {
  if (!email || !email.includes("@") || email.endsWith("@clerk.user")) {
    return null;
  }
  return email;
}

export function getInitials(
  name?: string | null,
  email?: string | null,
): string {
  const trimmedName = name?.trim();

  if (trimmedName) {
    const parts = trimmedName.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  if (email) {
    return email.substring(0, 2).toUpperCase();
  }

  return "ME";
}
