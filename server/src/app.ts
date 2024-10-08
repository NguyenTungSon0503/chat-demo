import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import express, { Express } from 'express';
import http from 'http';
import { DefaultEventsMap, Server, Socket } from 'socket.io';
import config from './config/config';
import errorHandlingMiddleware from './middleware/errorHandling.middleware';
import morganMiddleware from './middleware/morgan.middleware';
import prisma from './third-party/prisma';
import uploadRouter from './routes/upload-routes';
import authRouter from './routes/auth-routes';
import messageRouter from './routes/message-routes';
import groupRouter from './routes/group-routes';
import { generateSASTokenWithUrl } from './third-party/azure';

const { URL, NODE_ENV } = config.env;
const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const corsOptions: CorsOptions = {
  credentials: true,
  origin: URL,
};

// if (NODE_ENV === 'development') {
//   app.use(morganMiddleware);
// }

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/health-check', (_, res) => res.send('OK'));
app.use('/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/messages', messageRouter);
app.use('/api/groups', groupRouter);

app.use(errorHandlingMiddleware);

const handleJoinRoom =
  (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) =>
  async ({ groupId, userId }) => {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          name: true,
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

      // if (!group) {
      //   return;
      // }

      // const isUserInGroup = group.members.some(
      //   (member) => member.user.id === Number(userId),
      // );

      // console.log('isUserInGroup:', isUserInGroup);

      // if (!isUserInGroup) {
      //   await prisma.group.update({
      //     where: { id: groupId },
      //     data: {
      //       members: {
      //         create: {
      //           user: {
      //             connect: { id: Number(userId) },
      //           },
      //         },
      //       },
      //     },
      //   });

      //   group = await prisma.group.findUnique({
      //     where: { id: groupId },
      //     select: {
      //       id: true,
      //       name: true,
      //       members: {
      //         select: {
      //           user: {
      //             select: {
      //               id: true,
      //               username: true,
      //             },
      //           },
      //         },
      //       },
      //     },
      //   });
      // }

      // if (!group) {
      //   return;
      // }
      socket.join(groupId);
      console.log(`User joined room: ${groupId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

const handleLeaveRoom =
  (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) =>
  (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  };

const handleSendDirectMessage =
  (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) =>
  async (messageData) => {
    const { content, senderId, recipientId } = messageData;
    try {
      const createdMessage = await prisma.message.create({
        data: {
          content,
          senderId: Number(senderId),
          recipientId: Number(recipientId),
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
          recipient: {
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
          isRead: true,
          mediaUrl: true,
        },
      });

      const message = {
        id: createdMessage.id,
        content: createdMessage.content,
        sender: {
          id: createdMessage.sender.id,
          username: createdMessage.sender.username,
        },
        recipient: {
          recipientId: createdMessage.recipient.id,
          username: createdMessage.recipient.username,
        },
        mediaUrl: createdMessage.mediaUrl,
        isRead: createdMessage.isRead,
        createdAt: createdMessage.createdAt,
      };

      const recipientSocketId = userIdToSocketId[recipientId];
      const senderSocketId = userIdToSocketId[senderId];

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newDirectMessage', message);
      }
      io.to(senderSocketId).emit('newDirectMessage', message);
    } catch (error) {
      console.error('Error sending direct message:', error);
    }
  };

const handleSendGroupMessage =
  (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) =>
  async (messageData) => {
    const { content, senderId, groupId } = messageData;
    try {
      const createdMessage = await prisma.groupMessage.create({
        data: { content, senderId: Number(senderId), groupId: groupId },
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

      const message = {
        id: createdMessage.id,
        content: createdMessage.content,
        sender: {
          id: createdMessage.sender.id,
          username: createdMessage.sender.username,
        },
        createdAt: createdMessage.createdAt,
        reactions: createdMessage.reactions,
      };
      io.to(groupId).emit('newGroupMessage', message);
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  };

const socketIdToUserId = {};
const userIdToSocketId = {};

const initializeSocket = (io: Server) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;
    // Map socket ID to user ID and vice versa
    socketIdToUserId[socket.id] = userId;
    userIdToSocketId[userId] = socket.id;

    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

    socket.on('joinRoom', handleJoinRoom(socket));
    socket.on('leaveRoom', handleLeaveRoom(socket));
    socket.on('sendDirectMessage', handleSendDirectMessage(socket));
    socket.on('sendGroupMessage', handleSendGroupMessage(socket));

    socket.on('disconnect', () => {
      const userId = socketIdToUserId[socket.id];
      delete socketIdToUserId[socket.id];
      delete userIdToSocketId[userId];
      console.log('User disconnected');
    });
  });
};

initializeSocket(io);

export default server;
