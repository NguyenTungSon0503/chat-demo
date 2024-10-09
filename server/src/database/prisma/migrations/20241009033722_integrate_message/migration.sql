/*
  Warnings:

  - You are about to drop the column `groupMessageId` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `groupMessageId` on the `reactions` table. All the data in the column will be lost.
  - You are about to drop the `group_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_groupMessageId_fkey";

-- DropForeignKey
ALTER TABLE "group_messages" DROP CONSTRAINT "group_messages_groupId_fkey";

-- DropForeignKey
ALTER TABLE "group_messages" DROP CONSTRAINT "group_messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "reactions" DROP CONSTRAINT "reactions_groupMessageId_fkey";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "groupMessageId";

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "groupId" TEXT,
ALTER COLUMN "recipientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reactions" DROP COLUMN "groupMessageId";

-- DropTable
DROP TABLE "group_messages";

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
