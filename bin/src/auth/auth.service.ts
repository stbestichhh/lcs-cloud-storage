import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { db, tableName } from '../../db';
import { handleError } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { UserDto } from './dto';
import bcrypt from 'bcrypt';
import path from 'path';
import { FolderService, storageRoot } from '../filesystem';

export const getUser = async (req: Request, res: Response) => {
  return res.status(200).json(req.user);
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const hash = await hashPassword(password);

    const userDto: UserDto = {
      uuid: uuidv4(),
      name,
      email,
      password: hash,
    };

    const userRow = path.join(tableName, userDto.email);
    const user: UserDto | boolean = await db.getObjectDefault<
      UserDto | boolean
    >(userRow, false);

    if (!user) {
      await db.push(userRow, userDto);
      await createUserDirectory(userDto);
      return res.status(201).json({ message: 'Successfully signed up.' });
    }

    return res.status(403).json({ error: 'Email already registered.' });
  } catch (error) {
    await handleError(error, 500, res);
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const userRow = path.join(tableName, email);
    const user: UserDto = await db.getObject<UserDto>(userRow);

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      const authentication_token = await signToken(user);
      return res
        .status(200)
        .json({ message: 'Successfully signed in.', authentication_token });
    }
    return res.status(400).json({ Error: 'Credentials are incorrect.' });
  } catch (error) {
    await handleError(error, 404, res, 'Not found');
  }
};

export const signToken = async (user: UserDto): Promise<string> => {
  const payload: JwtPayload = {
    sub: user.uuid,
    email: user.email,
  };

  const jwt_key = process.env.SECRET_KEY;
  if (!jwt_key) {
    throw Error(
      `No jwt_key for authentication provided. Run lcs --config SECRET_KEY=""`,
    );
  }
  return jwt.sign(payload, jwt_key, { expiresIn: '30d' });
};

export const hashPassword = async (password: string): Promise<string> => {
  const hashRounds = 10;
  return bcrypt.hash(password, hashRounds);
};

export const createUserDirectory = async (
  userDto: UserDto,
): Promise<string | undefined> => {
  return await new FolderService(userDto.uuid).create(storageRoot);
};
