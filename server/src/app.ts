import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import express, { Express } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import config from './config/config';
import errorHandlingMiddleware from './middleware/errorHandling.middleware';
import morganMiddleware from './middleware/morgan.middleware';
import prisma from './third-party/prisma';
import uploadRouter from './routes/upload-routes';
import authRouter from './routes/auth-routes';
import messageRouter from './routes/message-routes';
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

if (NODE_ENV === 'development') {
  app.use(morganMiddleware);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/health-check', (_, res) => res.send('OK'));
app.use('/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/messages', messageRouter);

app.use(errorHandlingMiddleware);

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  socket.on('sendMessage', async (messageData) => {
    const { content, userId, roomId, type, fileName } = messageData;
    try {
      const createdMessage = await prisma.message.create({
        data: { content, userId: Number(userId), roomId, type, fileName },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          room: {
            select: {
              name: true,
            },
          },
          fileName: true,
          type: true,
        },
      });

      const message = {
        id: createdMessage.id,
        content: createdMessage.content,
        user: {
          userId: createdMessage.user.id,
          username: createdMessage.user.username,
        },
        fileName: createdMessage.fileName,
        type: createdMessage.type,
        createdAt: createdMessage.createdAt,
        fileUrl: createdMessage.fileName
          ? await generateSASTokenWithUrl(
              createdMessage.room.name,
              createdMessage.fileName,
              'r',
            )
          : null,
      };
      io.to(roomId).emit('newMessage', message);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

export default server;
