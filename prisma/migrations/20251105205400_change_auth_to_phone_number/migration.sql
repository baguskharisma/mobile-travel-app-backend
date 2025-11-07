-- AlterTable: Add phone column as nullable first
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Populate phone numbers from related tables based on role
UPDATE "User" u
SET "phone" = c.phone
FROM "Customer" c
WHERE u.id = c."userId" AND u.role = 'CUSTOMER';

UPDATE "User" u
SET "phone" = a.phone
FROM "Admin" a
WHERE u.id = a."userId" AND u.role = 'ADMIN';

UPDATE "User" u
SET "phone" = d.phone
FROM "Driver" d
WHERE u.id = d."userId" AND u.role = 'DRIVER';

-- For SUPER_ADMIN users without related records, set a temporary phone
-- (You may need to manually update these with real phone numbers)
UPDATE "User"
SET "phone" = 'TEMP_' || id
WHERE "phone" IS NULL AND role = 'SUPER_ADMIN';

-- Now make phone NOT NULL and UNIQUE
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- Make email optional (nullable) if it wasn't already
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Create index on phone for faster lookups
DROP INDEX IF EXISTS "User_email_idx";
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_email_idx" ON "User"("email");
