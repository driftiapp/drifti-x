import { User } from '../../models/user.model';
import { IUser } from '../../models/user.model';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { app } from '../../app';

export interface AuthResponse {
  token: string;
  user: IUser;
}

export const createUserAndLogin = async (
  userData: Partial<IUser> = {}
): Promise<AuthResponse> => {
  const hashedPassword = await bcrypt.hash(userData.password || 'password123', 10);
  const user = await User.create({
    email: userData.email || 'test@example.com',
    password: hashedPassword,
    role: userData.role || 'user',
    isActive: userData.isActive ?? true,
    ...userData
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: userData.password || 'password123'
    });

  return {
    token: response.body.token,
    user: response.body.user
  };
};

export const createAdminUser = async (): Promise<AuthResponse> => {
  return createUserAndLogin({
    email: 'admin@example.com',
    role: 'admin',
    password: 'admin123'
  });
};

export const createBusinessOwner = async (): Promise<AuthResponse> => {
  return createUserAndLogin({
    email: 'owner@example.com',
    role: 'business_owner',
    password: 'owner123'
  });
};

export const createDriver = async (): Promise<AuthResponse> => {
  return createUserAndLogin({
    email: 'driver@example.com',
    role: 'driver',
    password: 'driver123'
  });
};

export const makeAuthenticatedRequest = async (
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  token: string,
  data: any = {}
) => {
  const requestBuilder = request(app)[method](url)
    .set('Authorization', `Bearer ${token}`);

  if (['post', 'put'].includes(method)) {
    return requestBuilder.send(data);
  }

  return requestBuilder;
};

export const expectForbidden = async (
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  token: string,
  data: any = {}
) => {
  const response = await makeAuthenticatedRequest(method, url, token, data);
  expect(response.status).toBe(403);
  expect(response.body).toHaveProperty('message', 'Forbidden');
};

export const expectUnauthorized = async (
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data: any = {}
) => {
  const response = await request(app)[method](url).send(data);
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('message', 'No token provided');
}; 