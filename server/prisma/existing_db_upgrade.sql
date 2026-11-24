-- For databases created from the original schema with `prisma db push`.
-- Back up and review the existing schema before applying this script.
ALTER TABLE "otp_verifications" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "otp_verifications_mobileNumber_createdAt_idx" ON "otp_verifications"("mobileNumber", "createdAt");
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkoutKey" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cartSnapshot" JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_checkoutKey_key" ON "orders"("checkoutKey");
