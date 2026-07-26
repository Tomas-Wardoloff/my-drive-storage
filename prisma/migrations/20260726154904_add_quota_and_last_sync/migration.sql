-- AlterTable
ALTER TABLE "GoogleAccount" ADD COLUMN "lastSyncAt" DATETIME;
ALTER TABLE "GoogleAccount" ADD COLUMN "quotaTotal" BIGINT;
ALTER TABLE "GoogleAccount" ADD COLUMN "quotaUsed" BIGINT;
