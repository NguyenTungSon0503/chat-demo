import express, { Router } from 'express';
import prisma from '../third-party/prisma';
import { generateSASTokenWithUrl } from '../third-party/azure';

const router: Router = express.Router();

router.post('/rooms', async (req, res) => {
  const { name } = req.body;
  try {
    const room = await prisma.room.create({ data: { name } });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Could not create room' });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve rooms' });
  }
});

router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { roomId: Number(roomId) },
      select: {
        id: true,
        content: true,
        createdAt: true,
        type: true,
        user: { select: { id: true, username: true } },
        room: { select: { name: true } },
        fileName: true,
      },
    });

    const transformedMessages = await Promise.all(
      messages.map(async (message) => ({
        id: message.id,
        content: message.content,
        user: {
          userId: message.user.id,
          username: message.user.username,
        },
        createdAt: message.createdAt,
        fileName: message.fileName,
        type: message.type,
        fileUrl: message.fileName
          ? await generateSASTokenWithUrl(
              message.room.name,
              message.fileName,
              'r',
            )
          : null,
      })),
    );

    res.json(transformedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve messages' });
  }
});

export default router;
