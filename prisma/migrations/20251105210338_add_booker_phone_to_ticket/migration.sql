-- AlterTable: Add bookerPhone column as nullable first
ALTER TABLE "Ticket" ADD COLUMN "bookerPhone" TEXT;

-- Populate bookerPhone from customer's phone for existing tickets
UPDATE "Ticket" t
SET "bookerPhone" = c.phone
FROM "Customer" c
WHERE t."customerId" = c.id AND t."bookerPhone" IS NULL;

-- For tickets without customer (booked by admin), use a temporary value
-- These should be updated manually or by admin
UPDATE "Ticket"
SET "bookerPhone" = 'UPDATE_REQUIRED_' || "ticketNumber"
WHERE "bookerPhone" IS NULL;

-- Now make bookerPhone NOT NULL
ALTER TABLE "Ticket" ALTER COLUMN "bookerPhone" SET NOT NULL;

-- Create index on bookerPhone for faster lookups
CREATE INDEX "Ticket_bookerPhone_idx" ON "Ticket"("bookerPhone");
