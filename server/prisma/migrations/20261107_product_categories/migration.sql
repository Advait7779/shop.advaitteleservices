ALTER TABLE "products" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'vehicle-gps';

UPDATE "products" SET "category" = CASE
  WHEN "title" ILIKE '%MAGNETIC%' THEN 'magnetic-trackers'
  WHEN "title" ILIKE '%FUEL SENSOR%' THEN 'fuel-sensors'
  WHEN "title" ILIKE '%ID CARD%' THEN 'personal-gps'
  WHEN "title" ILIKE '%CCTV%' OR "title" ILIKE '%CAMERA%' THEN 'solar-cctv'
  ELSE 'vehicle-gps'
END;

CREATE INDEX "products_inStock_category_createdAt_id_idx" ON "products"("inStock", "category", "createdAt", "id");
