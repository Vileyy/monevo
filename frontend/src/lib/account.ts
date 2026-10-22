import { apiClient } from "@/services/api/client";

export type DeleteAccountResult = {
  deleted: boolean;
};

/**
 * Permanently delete the signed-in user. The API cascades the delete to
 * wallets, categories, transactions, budgets and reminders.
 */
export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  const response = await apiClient.delete<DeleteAccountResult>("/users/me");
  return response.data;
}
