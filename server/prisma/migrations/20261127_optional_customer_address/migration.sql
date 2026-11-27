-- A verified customer may create an account before entering a delivery address.
ALTER TABLE "users" ALTER COLUMN "addressLine1" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "city" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "pincode" DROP NOT NULL;
