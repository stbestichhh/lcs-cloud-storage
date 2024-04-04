import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { handleError } from '../../utils';

interface IUserRequest extends Request {
  user: JwtPayload;
}

export const loginValidation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const header = req.headers.authorization || req.cookies.auth;
  const token = header.split(' ')[1];
  const jwt_key = process.env.SECRET_KEY;
  if (!jwt_key) {
    throw new Error(
      `No jwt_key for authentication provided. Run lcs --config SECRET_KEY=""`,
    );
  }
  jwt.verify(token, jwt_key, async (error: unknown, decoded: unknown) => {
    await handleError(error, 500, res);
    (req as IUserRequest).user = (decoded as JwtPayload);
    next();
  });
};