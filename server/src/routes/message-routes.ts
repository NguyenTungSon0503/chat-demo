import { Router } from 'express';
import prisma from '../third-party/prisma';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

const getDirectMessages = async (userId: string, recipientId: string) => {
  return await prisma.message.findMany({
    where: {
      OR: [
        { senderId: Number(userId), recipientId: Number(recipientId) },
        { senderId: Number(recipientId), recipientId: Number(userId) },
      ],
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          username: true,
        },
      },
      reactions: {
        select: {
          id: true,
          emoji: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });
};

const getGroupMessages = async (groupId: string) => {
  return await prisma.message.findMany({
    where: { groupId: groupId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          username: true,
        },
      },
      reactions: {
        select: {
          id: true,
          emoji: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });
};

router.get('/direct', authMiddleware, async (req, res) => {
  const { recipientId } = req.query;
  const userId = req.user?.id;

  if (!recipientId) {
    return res.status(400).json({ error: 'Missing userId or recipientId' });
  }

  try {
    const directMessages = await getDirectMessages(
      userId as string,
      recipientId as string,
    );
    res.json(directMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/group', async (req, res) => {
  const { groupId } = req.query;

  if (!groupId) {
    return res.status(400).json({ error: 'Missing groupId' });
  }

  try {
    const groupMessages = await getGroupMessages(groupId as string);
    res.json(groupMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
