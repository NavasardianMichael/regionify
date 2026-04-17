-- Rename subscription tier enum and user column: Plan/plan -> Badge/badge
ALTER TYPE "Plan" RENAME TO "Badge";
ALTER TABLE "users" RENAME COLUMN "plan" TO "badge";
