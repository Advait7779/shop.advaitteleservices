ALTER TABLE "users" ADD COLUMN "adminAccess" TEXT,
ADD COLUMN "totpSecret" TEXT,
ADD COLUMN "totpLastStep" INTEGER;

CREATE TABLE "auth_sessions" (
    "tokenHash" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "kind" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idleUntil" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "auth_sessions_userId_kind_idx" ON "auth_sessions"("userId", "kind");
CREATE INDEX "auth_sessions_idleUntil_idx" ON "auth_sessions"("idleUntil");

CREATE TABLE "auth_rate_limits" (
    "key" TEXT PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "auth_rate_limits_expiresAt_idx" ON "auth_rate_limits"("expiresAt");
CREATE INDEX "otp_verifications_expiresAt_idx" ON "otp_verifications"("expiresAt");
