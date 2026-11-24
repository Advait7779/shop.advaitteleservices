CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_categories_sortOrder_id_idx" ON "product_categories"("sortOrder", "id");

INSERT INTO "product_categories" ("id", "label", "sortOrder", "updatedAt") VALUES
    ('vehicle-gps', 'Vehicle GPS', 0, CURRENT_TIMESTAMP),
    ('magnetic-trackers', 'Magnetic Trackers', 1, CURRENT_TIMESTAMP),
    ('fuel-sensors', 'Fuel Sensors', 2, CURRENT_TIMESTAMP),
    ('personal-gps', 'Personal GPS', 3, CURRENT_TIMESTAMP),
    ('solar-cctv', 'Solar CCTV', 4, CURRENT_TIMESTAMP);
