import { StatusCodes } from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import config from '../config/config';

const { NODE_ENV } = config.env;
export default function errorHandlingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  const responseError = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode],
    stack: err.stack,
  };
  res.status(responseError.statusCode).json(responseError);
}
