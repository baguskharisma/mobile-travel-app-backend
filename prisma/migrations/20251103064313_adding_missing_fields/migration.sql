-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CoinRequest" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT;

-- AlterTable
ALTER TABLE "TravelDocument" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Admin_deletedAt_idx" ON "Admin"("deletedAt");

-- CreateIndex
CREATE INDEX "CoinRequest_rejectedBy_idx" ON "CoinRequest"("rejectedBy");

-- CreateIndex
CREATE INDEX "CoinRequest_rejectedAt_idx" ON "CoinRequest"("rejectedAt");

-- CreateIndex
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");

-- CreateIndex
CREATE INDEX "Driver_deletedAt_idx" ON "Driver"("deletedAt");

-- CreateIndex
CREATE INDEX "Schedule_cancelledAt_idx" ON "Schedule"("cancelledAt");

-- CreateIndex
CREATE INDEX "Ticket_cancelledAt_idx" ON "Ticket"("cancelledAt");

-- CreateIndex
CREATE INDEX "Ticket_cancelledBy_idx" ON "Ticket"("cancelledBy");

-- CreateIndex
CREATE INDEX "TravelDocument_cancelledAt_idx" ON "TravelDocument"("cancelledAt");
