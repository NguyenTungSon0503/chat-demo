import morgan from 'morgan';
import logger from '../utils/logger';
import config from '../config/config';

const { NODE_ENV } = config.env;

const stream = {
  write: (message: string) => {
    const data = JSON.parse(message);
    const sendData = { ...data, message: 'Incoming request' };
    logger.http(sendData);
  },
};

const skip = () => {
  const env = NODE_ENV || 'development';
  return env !== 'development';
};

const morganMiddleware = morgan(
  function (tokens, req, res) {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res) || '0'),
      content_length: tokens.res(req, res, 'content-length'),
      response_time: Number.parseFloat(
        tokens['response-time'](req, res) || '0',
      ),
    });
  },
  { stream, skip },
);

export default morganMiddleware;
