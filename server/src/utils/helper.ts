import { AVATAR_CONTAINER, CONTENT_CONTAINER } from '../config/constant';
import {
  generateBlobClient,
  getSignedAvatarUrl,
  getSignedUrl,
} from '../third-party/azure';
import prisma from '../third-party/prisma';

export async function getEmailOfUser(userIds: string[]) {
  const receiverList = await Promise.all(
    userIds.map(async (id) => {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });
      return { email: user?.email, username: user?.username };
    }),
  );
  return receiverList;
}

export async function streamToBuffer(readableStream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data: any) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

export async function generateThumbnailWithSAS(thumbnail: string | null) {
  const blobContainer = await generateBlobClient(
    CONTENT_CONTAINER,
    thumbnail?.split('/').slice(4).join('/') || '',
  );
  return getSignedUrl(blobContainer);
}

export async function generateAvatar(userId: string) {
  const blobContainer = await generateBlobClient(AVATAR_CONTAINER, userId);
  return getSignedAvatarUrl(blobContainer);
}

export function isTrainerOfCourse(trainerId: string, currentUserId: string) {
  return trainerId === currentUserId;
}

export const extractPart = (url: string) => {
  const contentIndex = url.indexOf(`${CONTENT_CONTAINER}/`);
  if (contentIndex !== -1) {
    const extractedText = url.substring(
      contentIndex + `${CONTENT_CONTAINER}/`.length,
    );
    return extractedText;
  }
  return null;
};

export const extractAndReplace = (url: string, replacement: string) => {
  let parts = url.split('/');

  parts[parts.length - 2] = replacement;

  return parts.join('/');
};

export const isThumbnail = (
  databaseUrl: string | null | undefined,
  url: string | null,
) => {
  return url === databaseUrl;
};

export const isEnrolled = async (courseId: string, userId: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      UserCourse: {
        select: {
          userId: true,
        },
      },
    },
  });
  const isEnrolled = course?.UserCourse.some((user) => user.userId === userId);
  return isEnrolled;
};

export function getUniqueValues<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
