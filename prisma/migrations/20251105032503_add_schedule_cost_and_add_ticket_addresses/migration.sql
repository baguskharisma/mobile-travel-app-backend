/*
  Warnings:

  - Added the required column `dropoffAddress` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupAddress` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "driverWage" INTEGER,
ADD COLUMN     "fuelCost" INTEGER,
ADD COLUMN     "snackCost" INTEGER;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "dropoffAddress" TEXT NOT NULL,
ADD COLUMN     "pickupAddress" TEXT NOT NULL;
