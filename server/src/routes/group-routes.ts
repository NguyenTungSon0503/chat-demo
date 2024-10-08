import express, { Router } from 'express';
import prisma from '../third-party/prisma';

const router: Router = express.Router();

router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    const newGroup = await prisma.group.create({ data: { name } });
    res.json(newGroup);
  } catch (error) {
    res.status(500).json({ error: 'Could not create room' });
  }
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Fetch groups
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: Number(userId),
          },
        },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        members: {
          select: {
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

    const transformedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      imageUrl: group.imageUrl,
      members: group.members.map((member) => ({
        userId: member.user.id,
        username: member.user.username,
      })),
      type: 'group',
    }));

    // Fetch direct messages
    const direct = await prisma.message.findMany({
      where: {
        OR: [{ senderId: Number(userId) }, { recipientId: Number(userId) }],
      },
      select: {
        id: true,
        recipient: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        sender: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    const removeDuplicatesDirect = direct.filter(
      (message, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.recipient.id === message.recipient.id ||
            t.sender.id === message.sender.id ||
            t.recipient.id === message.sender.id ||
            t.sender.id === message.recipient.id,
        ),
    );

    const transformedDirect = removeDuplicatesDirect.map((message) => ({
      id: message.id,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        profileImage: message.sender.profileImage,
      },
      recipient: {
        id: message.recipient.id,
        username: message.recipient.username,
        profileImage: message.recipient.profileImage,
      },
      type: 'direct',
    }));

    res.json([...transformedGroups, ...transformedDirect]);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve messages' });
  }
});

export default router;
