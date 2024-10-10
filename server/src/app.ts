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
import jwt from 'jsonwebtoken';
import { UserAuth } from './interface/user_interface';

const { access_key } = config.jwt;
interface CustomSocket extends Socket {
  userId?: number;
}

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
  origin: '*',
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

io.use(async (socket: CustomSocket, next) => {
  const token = socket.handshake.auth.accessToken;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, access_key) as UserAuth;
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    next();
  } catch (error: any) {
    console.log(error);
    return next(new Error('Authentication error'));
  }
});

app.use(errorHandlingMiddleware);

const handleJoinRoom =
  (socket: CustomSocket) =>
  async ({ groupId }) => {
    const userId = socket.userId;
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
      console.log(`User ${userId} joined room: ${groupId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

const handleLeaveRoom = (socket: CustomSocket) => (roomId) => {
  const userId = socket.userId;
  socket.leave(roomId);
  console.log(`User ${userId} left room: ${roomId}`);
};

const handleSendMessage = (socket: CustomSocket) => async (messageData) => {
  const userId = socket.userId;

  if (!userId) return;

  const { content, recipientId, groupId } = messageData;
  if (groupId) {
    try {
      const createdMessage = await prisma.message.create({
        data: { content, senderId: userId, groupId: groupId },
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
      io.to(groupId).emit('newMessage', message);
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  }
  if (recipientId) {
    try {
      const createdMessage = await prisma.message.create({
        data: {
          content,
          senderId: userId,
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
          recipientId: createdMessage.recipient?.id,
          username: createdMessage.recipient?.username,
        },
        mediaUrl: createdMessage.mediaUrl,
        isRead: createdMessage.isRead,
        createdAt: createdMessage.createdAt,
        reactions: createdMessage.reactions,
      };

      const recipientSocketId = userIdToSocketId[recipientId];
      const senderSocketId = userIdToSocketId[userId];

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newMessage', message);
      }
      io.to(senderSocketId).emit('newMessage', message);
    } catch (error) {
      console.error('Error sending direct message:', error);
    }
  }
};

const handleReaction =
  (socket: CustomSocket) =>
  async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
    const userId = socket.userId;
    if (!userId) return;

    try {
      const userReaction = await prisma.reaction.findFirst({
        where: { messageId, userId },
      });

      if (userReaction) {
        if (userReaction.emoji === reaction) {
          await prisma.reaction.delete({ where: { id: userReaction.id } });
        } else {
          await prisma.reaction.update({
            where: { id: userReaction.id },
            data: { emoji: reaction },
          });
        }
      } else {
        await prisma.reaction.create({
          data: { emoji: reaction, messageId, userId },
        });
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          groupId: true,
          sender: { select: { id: true, username: true } },
          recipient: { select: { id: true, username: true } },
          reactions: {
            select: {
              id: true,
              emoji: true,
              user: { select: { id: true, username: true } },
            },
          },
        },
      });

      if (!message) return;

      const reactorSocketId = userIdToSocketId[userId];
      const reactedSocketId = userIdToSocketId[message.sender.id];

      if (reactedSocketId) {
        io.to(reactedSocketId).emit('newReaction', message);
      }
      io.to(reactorSocketId).emit('newReaction', message);

      if (message.groupId) {
        io.to(message.groupId).emit('newReaction', message);
      }
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  };

const socketIdToUserId = {};
const userIdToSocketId = {};

const initializeSocket = (io: Server) => {
  io.on('connection', (socket: CustomSocket) => {
    const userId = socket.userId;

    if (!userId) {
      return;
    }

    // Map socket ID to user ID and vice versa
    socketIdToUserId[socket.id] = userId;
    userIdToSocketId[userId] = socket.id;

    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

    socket.on('joinRoom', handleJoinRoom(socket));
    socket.on('leaveRoom', handleLeaveRoom(socket));
    socket.on('sendMessage', handleSendMessage(socket));
    socket.on('addReaction', handleReaction(socket));

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
