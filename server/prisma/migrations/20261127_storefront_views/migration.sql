CREATE TABLE "storefront_view_counters" (
    "id" TEXT PRIMARY KEY,
    "recorded" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "storefront_view_counters" ("id") VALUES ('storefront');

CREATE TABLE "storefront_visits" (
    "id" UUID PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "storefront_visits_createdAt_idx" ON "storefront_visits"("createdAt");
