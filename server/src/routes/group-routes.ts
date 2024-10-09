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
    // Fetch the groups the user has joined
    const userGroups = await prisma.group.findMany({
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

    const transformedGroups = userGroups.map((group) => ({
      id: group.id,
      name: group.name,
      imageUrl: group.imageUrl,
      members: group.members.map((member) => ({
        userId: member.user.id,
        username: member.user.username,
      })),
      type: 'group',
    }));

    // Fetch direct message contacts, ensuring uniqueness
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
        senderId: true,
        sender: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    const uniqueContacts = {};
    direct.forEach((msg) => {
      const contact =
        msg.senderId === Number(userId) ? msg.recipient : msg.sender;

      if (contact && !uniqueContacts[contact.id]) {
        uniqueContacts[contact.id] = {
          recipientId: contact.id,
          name: contact.username,
          profileImage: contact.profileImage,
          type: 'direct',
        };
      }
    });

    const uniqueContactsArray = Object.values(uniqueContacts);

    res.json([...transformedGroups, ...uniqueContactsArray]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
