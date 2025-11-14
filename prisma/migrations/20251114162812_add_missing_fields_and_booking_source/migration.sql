-- CreateEnum for Gender
DO $$ BEGIN
    CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for OtpStatus
DO $$ BEGIN
    CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for OtpType
DO $$ BEGIN
    CREATE TYPE "OtpType" AS ENUM ('REGISTRATION', 'LOGIN', 'PASSWORD_RESET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable User - Add birthDate and gender columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" "Gender";

-- AlterTable Admin - Add birthDate and gender columns
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "gender" "Gender";

-- AlterTable Customer - Add birthDate and gender columns
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "gender" "Gender";

-- AlterTable Driver - Add birthDate and gender columns
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "gender" "Gender";

-- AlterTable PaymentProof - Add bookingSource column
ALTER TABLE "PaymentProof" ADD COLUMN IF NOT EXISTS "bookingSource" "BookingSource" NOT NULL DEFAULT 'CUSTOMER_APP';

-- CreateTable Otp
CREATE TABLE IF NOT EXISTS "Otp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable TokenBlacklist
CREATE TABLE IF NOT EXISTS "TokenBlacklist" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for Otp table
CREATE INDEX IF NOT EXISTS "Otp_phone_idx" ON "Otp"("phone");
CREATE INDEX IF NOT EXISTS "Otp_code_idx" ON "Otp"("code");
CREATE INDEX IF NOT EXISTS "Otp_status_idx" ON "Otp"("status");
CREATE INDEX IF NOT EXISTS "Otp_expiresAt_idx" ON "Otp"("expiresAt");
CREATE INDEX IF NOT EXISTS "Otp_createdAt_idx" ON "Otp"("createdAt");

-- CreateIndex for TokenBlacklist table
CREATE UNIQUE INDEX IF NOT EXISTS "TokenBlacklist_token_key" ON "TokenBlacklist"("token");
CREATE INDEX IF NOT EXISTS "TokenBlacklist_token_idx" ON "TokenBlacklist"("token");
CREATE INDEX IF NOT EXISTS "TokenBlacklist_userId_idx" ON "TokenBlacklist"("userId");
CREATE INDEX IF NOT EXISTS "TokenBlacklist_expiresAt_idx" ON "TokenBlacklist"("expiresAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "TokenBlacklist" ADD CONSTRAINT "TokenBlacklist_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
