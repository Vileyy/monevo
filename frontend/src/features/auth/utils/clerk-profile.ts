import { displayableEmail } from '@/lib/user-profile';
import type { User } from '@/store/auth.store';

export interface ClerkProfileLike {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
}

const PLACEHOLDER_NAMES = new Set([
  'Google User',
  'Member',
  'Monevo User',
  'Monevo Member',
]);

export function buildClerkProfileUpdates(
  current: Pick<User, 'email' | 'name' | 'avatarUrl'>,
  clerkUser: ClerkProfileLike,
): Partial<User> {
  const updates: Partial<User> = {};

  const name =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ');
  if (name && (!current.name || PLACEHOLDER_NAMES.has(current.name))) {
    updates.name = name;
  }

  if (clerkUser.imageUrl && current.avatarUrl !== clerkUser.imageUrl) {
    updates.avatarUrl = clerkUser.imageUrl;
  }

  const email = displayableEmail(clerkUser.primaryEmailAddress?.emailAddress);
  if (email && current.email !== email) {
    updates.email = email;
  }

  return updates;
}
