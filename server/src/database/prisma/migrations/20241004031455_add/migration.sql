/*
  Warnings:

  - Changed the type of `type` on the `messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'media');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "fileUrl" TEXT,
ALTER COLUMN "content" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "MessageType" NOT NULL;
