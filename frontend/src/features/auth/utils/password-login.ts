import { apiClient } from "@/services/api/client";

export interface PasswordLoginUser {
  id: string;
  email: string;
  name?: string;
}

export interface PasswordLoginResponse {
  user: PasswordLoginUser;
  accessToken: string;
}

/**
 * Email + password sign-in. This is the path Play reviewers use with the
 * seeded demo account, and a fallback for users who cannot receive email OTPs.
 */
export async function loginWithPassword(
  email: string,
  password: string,
): Promise<PasswordLoginResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Please enter your email address.");
  }
  if (!password) {
    throw new Error("Please enter your password.");
  }

  const response = await apiClient.post<PasswordLoginResponse>("/auth/login", {
    email: normalizedEmail,
    password,
  });

  return response.data;
}
