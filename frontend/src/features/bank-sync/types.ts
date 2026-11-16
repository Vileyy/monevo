export type BankCode =
  | 'VCB'
  | 'TCB'
  | 'MB'
  | 'VPB'
  | 'ACB'
  | 'TPB'
  | 'BIDV'
  | 'CTG'
  | 'MOMO'
  | 'ZALOPAY'
  | 'GENERIC';

export interface BankMetadata {
  code: BankCode;
  name: string;
  shortName: string;
  packageNames: string[];
  brandColor: string;
  badgeBg: string;
}

export interface ParsedBankTransaction {
  id: string;
  bankCode: BankCode;
  bankName: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  note: string;
  accountNumber?: string | null;
  balance?: number | null;
  suggestedCategoryName: string;
  timestamp: string;
  rawText: string;
}

export interface PendingBankTransaction extends ParsedBankTransaction {
  targetWalletId?: string | null;
  targetCategoryId?: string | null;
  createdAt: string;
}

export interface RawNotificationPayload {
  packageName?: string;
  title?: string;
  text?: string;
  subText?: string;
  timestamp?: number | string;
}
