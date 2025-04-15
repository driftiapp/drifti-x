import { Request, Response } from 'express';
import { IUser } from './user';
import { JwtPayload } from 'jsonwebtoken';

export type ControllerMethod = (req: Request & { user?: IUser & JwtPayload }, res: Response) => Promise<void>;

export interface IController {
  [key: string]: ControllerMethod | any;
} 