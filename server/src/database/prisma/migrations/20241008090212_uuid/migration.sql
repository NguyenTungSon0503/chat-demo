/*
  Warnings:

  - The primary key for the `group_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `messages` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_groupMessageId_fkey";

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_messageId_fkey";

-- DropForeignKey
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_groupId_fkey";

-- DropForeignKey
ALTER TABLE "group_messages" DROP CONSTRAINT "group_messages_groupId_fkey";

-- DropForeignKey
ALTER TABLE "reactions" DROP CONSTRAINT "reactions_groupMessageId_fkey";

-- DropForeignKey
ALTER TABLE "reactions" DROP CONSTRAINT "reactions_messageId_fkey";

-- AlterTable
ALTER TABLE "files" ALTER COLUMN "messageId" SET DATA TYPE TEXT,
ALTER COLUMN "groupMessageId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "group_members" ALTER COLUMN "groupId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "group_messages" DROP CONSTRAINT "group_messages_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "groupId" SET DATA TYPE TEXT,
ADD CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "group_messages_id_seq";

-- AlterTable
ALTER TABLE "groups" DROP CONSTRAINT "groups_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "groups_id_seq";

-- AlterTable
ALTER TABLE "messages" DROP CONSTRAINT "messages_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "messages_id_seq";

-- AlterTable
ALTER TABLE "reactions" ALTER COLUMN "messageId" SET DATA TYPE TEXT,
ALTER COLUMN "groupMessageId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_groupMessageId_fkey" FOREIGN KEY ("groupMessageId") REFERENCES "group_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_groupMessageId_fkey" FOREIGN KEY ("groupMessageId") REFERENCES "group_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
