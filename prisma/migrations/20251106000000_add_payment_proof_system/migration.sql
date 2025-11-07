-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum: Add new values to TicketStatus and remove PENDING
-- First, rename old enum
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";

-- Create new enum with all values
CREATE TYPE "TicketStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED');

-- Update the column, mapping PENDING to PENDING_PAYMENT
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus" USING (
  CASE status::text
    WHEN 'PENDING' THEN 'PENDING_PAYMENT'
    ELSE status::text
  END)::"TicketStatus";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'::"TicketStatus";

-- Drop old enum
DROP TYPE "TicketStatus_old";

-- CreateTable: PaymentProof
CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL,
    "proofNumber" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookerPhone" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "totalPassengers" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "paymentProofUrl" TEXT NOT NULL,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "ticketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentProofPassenger
CREATE TABLE "PaymentProofPassenger" (
    "id" TEXT NOT NULL,
    "paymentProofId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identityNumber" TEXT,
    "phone" TEXT,
    "seatNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProofPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProof_proofNumber_key" ON "PaymentProof"("proofNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProof_ticketId_key" ON "PaymentProof"("ticketId");

-- CreateIndex
CREATE INDEX "PaymentProof_proofNumber_idx" ON "PaymentProof"("proofNumber");

-- CreateIndex
CREATE INDEX "PaymentProof_scheduleId_idx" ON "PaymentProof"("scheduleId");

-- CreateIndex
CREATE INDEX "PaymentProof_customerId_idx" ON "PaymentProof"("customerId");

-- CreateIndex
CREATE INDEX "PaymentProof_status_idx" ON "PaymentProof"("status");

-- CreateIndex
CREATE INDEX "PaymentProof_createdAt_idx" ON "PaymentProof"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentProof_reviewedBy_idx" ON "PaymentProof"("reviewedBy");

-- CreateIndex
CREATE INDEX "PaymentProofPassenger_paymentProofId_idx" ON "PaymentProofPassenger"("paymentProofId");

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProofPassenger" ADD CONSTRAINT "PaymentProofPassenger_paymentProofId_fkey" FOREIGN KEY ("paymentProofId") REFERENCES "PaymentProof"("id") ON DELETE CASCADE ON UPDATE CASCADE;
