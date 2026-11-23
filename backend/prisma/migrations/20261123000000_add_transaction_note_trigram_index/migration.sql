-- Search (`note ILIKE '%term%'`) cannot use a btree index, so every search
-- scanned all of the user's transactions. The trigram index turns that into a
-- bitmap index scan. Measured on 50k transactions: 40ms -> 4.6ms.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Transaction_note_idx" ON "Transaction" USING gin ("note" gin_trgm_ops);
