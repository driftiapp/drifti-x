import { Types } from 'mongoose';
import { IAddress } from './delivery';

export enum UserRole {
  ADMIN = 'admin',
  BUSINESS_OWNER = 'business_owner',
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  RESTAURANT = 'restaurant',
  STORE = 'store'
}

export interface IUser {
  _id?: Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  addresses?: IAddress[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  _id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface IAuthResponse {
  token: string;
  user: IUserResponse;
}

export type LeanUser = Omit<IUser, 'password'>; 