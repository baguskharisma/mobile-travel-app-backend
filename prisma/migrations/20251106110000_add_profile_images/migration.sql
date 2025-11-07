-- AlterTable: Add profileImageUrl to Admin, Customer, and Driver tables
ALTER TABLE "Admin" ADD COLUMN "profileImageUrl" TEXT;
ALTER TABLE "Customer" ADD COLUMN "profileImageUrl" TEXT;
ALTER TABLE "Driver" ADD COLUMN "profileImageUrl" TEXT;
