-- Store monetary values as fixed-precision decimals instead of floating point.

ALTER TABLE "Wallet"
  ALTER COLUMN "balance" TYPE DECIMAL(18, 2) USING "balance"::numeric(18, 2),
  ALTER COLUMN "balance" SET DEFAULT 0;

ALTER TABLE "Transaction"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 2) USING "amount"::numeric(18, 2);

ALTER TABLE "Budget"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 2) USING "amount"::numeric(18, 2);

ALTER TABLE "Reminder"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 2) USING "amount"::numeric(18, 2);
