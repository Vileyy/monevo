/** Request/response shapes from Monevo OpenAPI (`/api-json`). */

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  email: string;
  password: string;
  name?: string;
};

export type WalletType = "CASH" | "BANK" | "CREDIT_CARD" | string;

export type CreateWalletBody = {
  name: string;
  type: WalletType;
  balance?: number;
};

export type UpdateWalletBody = Partial<CreateWalletBody>;

export type TransactionType = "INCOME" | "EXPENSE";

export type CreateCategoryBody = {
  name: string;
  type: TransactionType;
  icon?: string;
};

export type UpdateCategoryBody = Partial<CreateCategoryBody>;

export type CreateTransactionBody = {
  amount: number;
  type: TransactionType;
  walletId: string;
  categoryId: string;
  note?: string;
  date?: string;
};

export type UpdateTransactionBody = Partial<CreateTransactionBody>;
