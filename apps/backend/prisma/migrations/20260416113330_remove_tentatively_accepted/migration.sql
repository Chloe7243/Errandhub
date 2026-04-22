/*
  Warnings:

  - The values [TENTATIVELY_ACCEPTED] on the enum `ErrandStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ErrandStatus_new" AS ENUM ('POSTED', 'ACCEPTED', 'IN_PROGRESS', 'REVIEWING', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'DISPUTED');
ALTER TABLE "public"."Errand" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Errand" ALTER COLUMN "status" TYPE "ErrandStatus_new" USING ("status"::text::"ErrandStatus_new");
ALTER TYPE "ErrandStatus" RENAME TO "ErrandStatus_old";
ALTER TYPE "ErrandStatus_new" RENAME TO "ErrandStatus";
DROP TYPE "public"."ErrandStatus_old";
ALTER TABLE "Errand" ALTER COLUMN "status" SET DEFAULT 'POSTED';
COMMIT;
