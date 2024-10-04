import winston, { format, transports, Logger, error } from 'winston';
import config from '../config/config';

const { NODE_ENV } = config.env;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const env = NODE_ENV || 'development';
const isDevelopment = env === 'development';

// Determine log level based on the environment
const level = (): string => {
  return isDevelopment ? 'debug' : 'warn';
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define the log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// Define console log formats based on level
const consoleFormat = {
  info: format.combine(
    format.colorize({ all: true }),
    format.errors({ stack: true }),
    logFormat,
  ),
  http: format.combine(
    format.colorize({ all: true }),
    format.errors({ stack: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      (info) =>
        `${info.timestamp} ${info.level}: ${info.method} ${info.status} ${info.url} ${info.response_time} ${info.content_length}`,
    ),
  ),
  error: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      (error) => `${error.timestamp} ${error.level}: ${error.message}`,
    ),
  ),
};

// Define filters for different log levels
const filter = (level: string) =>
  format((info) => {
    return info.level === level ? info : false;
  })();

// Configure transports
const loggerTransports = [
  new transports.Console({
    level: 'info',
    format: format.combine(filter('info'), consoleFormat.info),
  }),
  new transports.Console({
    level: 'http',
    format: format.combine(filter('http'), consoleFormat.http),
  }),
  new transports.Console({
    level: 'error',
    format: format.combine(filter('error'), consoleFormat.error),
  }),
];

// Create the main logger
const logger: Logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: loggerTransports,
  exitOnError: false,
});

export default logger;
