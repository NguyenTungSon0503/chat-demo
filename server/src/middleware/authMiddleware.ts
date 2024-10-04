import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { IUser, UserAuth } from '../interface/user_interface';
import getUserInfor from '../utils/getUserInfor';
import ApiError from '../utils/ApiError';

const { access_key } = config.jwt;

const ROLE_HIERARCHY = {
  Admin: 2,
  Trainer: 1,
  User: 0,
};

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token;
  if (req?.headers?.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, access_key) as UserAuth;
        const user = await getUserInfor(next, decoded?.email);
        if (!user) {
          return res.status(StatusCodes.NOT_FOUND).send({
            message: `User not found`,
          });
        }
        req.user = user;
        next();
      }
    } catch (error: any) {
      return res.status(StatusCodes.UNAUTHORIZED).send({
        message: error.message,
      });
    }
  } else {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send({ message: 'There is no token attached to header' });
  }
};

const requireRole = (requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user: IUser = req.user;

      const userHighestRoleLevel = Math.max(
        ...user.roles.map((role) => ROLE_HIERARCHY[role] || 0),
      );

      const requiredRoleLevel = Math.min(
        ...requiredRoles.map((role) => ROLE_HIERARCHY[role] || 0),
      );

      if (userHighestRoleLevel < requiredRoleLevel) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'You not allowed to access this',
        });
      }

      next();
    } catch (error: any) {
      next(error);
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };
};

const requirePermission = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user: IUser = req.user;

      const hasRequiredPermissions = requiredPermissions.every(
        (requiredPermission: string) =>
          user.permissions?.some(
            (userPermission: string) => userPermission === requiredPermission,
          ),
      );

      if (!hasRequiredPermissions) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'You not allowed to do this action',
        });
      }

      next();
    } catch (error: any) {
      next(error);
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };
};

export { authMiddleware, requireRole, requirePermission };
