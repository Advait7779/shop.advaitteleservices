CREATE TABLE "quote_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quote_requests_createdAt_id_idx" ON "quote_requests"("createdAt", "id");
CREATE INDEX "quote_requests_status_createdAt_id_idx" ON "quote_requests"("status", "createdAt", "id");
