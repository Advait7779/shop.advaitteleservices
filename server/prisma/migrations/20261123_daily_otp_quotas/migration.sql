CREATE TABLE "otp_request_quotas" (
    "scope" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "otp_request_quotas_pkey" PRIMARY KEY ("scope","identityHash","day")
);

CREATE INDEX "otp_request_quotas_day_idx" ON "otp_request_quotas"("day");
