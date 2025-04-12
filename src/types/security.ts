import { Types } from 'mongoose';
import { z } from 'zod';

export enum SecurityAlertType {
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_IP = 'suspicious_ip',
  MULTIPLE_DEVICES = 'multiple_devices',
  UNUSUAL_ACTIVITY = 'unusual_activity'
}

export enum SecurityAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SecurityAlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive'
}

export interface ILocation {
  country?: string;
  city?: string;
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ISecurityAlert {
  _id: Types.ObjectId;
  type: SecurityAlertType;
  severity: SecurityAlertSeverity;
  userId: Types.ObjectId;
  email: string;
  ipAddress: string;
  location: ILocation;
  details: Map<string, unknown>;
  status: SecurityAlertStatus;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export enum AdminRole {
  ADMIN = 'admin',
  BUSINESS_OWNER = 'business_owner',
  STORE_OWNER = 'store_owner'
}

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed'
}

export interface IAdminLoginLog {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  email: string;
  role: AdminRole;
  loginTime: Date;
  ipAddress: string;
  status: LoginStatus;
  failureReason?: string;
  userAgent: string;
  location: ILocation;
  createdAt: Date;
  updatedAt: Date;
}

// Validation schemas
export const securityAlertSchema = z.object({
  type: z.nativeEnum(SecurityAlertType),
  severity: z.nativeEnum(SecurityAlertSeverity),
  userId: z.instanceof(Types.ObjectId),
  email: z.string().email(),
  ipAddress: z.string().ip(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  details: z.record(z.unknown()),
  status: z.nativeEnum(SecurityAlertStatus),
  resolvedAt: z.date().optional(),
  resolvedBy: z.instanceof(Types.ObjectId).optional()
});

export const adminLoginLogSchema = z.object({
  userId: z.instanceof(Types.ObjectId).optional(),
  email: z.string().email(),
  role: z.nativeEnum(AdminRole),
  loginTime: z.date(),
  ipAddress: z.string().ip(),
  status: z.nativeEnum(LoginStatus),
  failureReason: z.string().optional(),
  userAgent: z.string(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional()
  })
}); 