import { Schema, model, Types } from 'mongoose';
import { 
  ISecurityAlert, 
  SecurityAlertType, 
  SecurityAlertSeverity, 
  SecurityAlertStatus,
  IAdminLoginLog,
  AdminRole,
  LoginStatus
} from '../types/security';

const securityAlertSchema = new Schema<ISecurityAlert>({
  type: {
    type: String,
    required: true,
    enum: Object.values(SecurityAlertType)
  },
  severity: {
    type: String,
    required: true,
    enum: Object.values(SecurityAlertSeverity)
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    country: String,
    city: String,
    region: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  details: {
    type: Map,
    of: Schema.Types.Mixed
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(SecurityAlertStatus),
    default: SecurityAlertStatus.ACTIVE
  },
  resolvedAt: Date,
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
securityAlertSchema.index({ userId: 1, status: 1 });
securityAlertSchema.index({ type: 1, severity: 1 });
securityAlertSchema.index({ createdAt: -1 });

const adminLoginLogSchema = new Schema<IAdminLoginLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for failed login attempts
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(AdminRole),
    required: true
  },
  loginTime: {
    type: Date,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(LoginStatus),
    required: true,
    default: LoginStatus.SUCCESS
  },
  failureReason: {
    type: String,
    required: function(this: IAdminLoginLog): boolean {
      return this.status === LoginStatus.FAILED;
    }
  },
  userAgent: {
    type: String,
    required: true
  },
  location: {
    country: String,
    city: String,
    region: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
adminLoginLogSchema.index({ email: 1, loginTime: -1 });
adminLoginLogSchema.index({ ipAddress: 1, loginTime: -1 });
adminLoginLogSchema.index({ status: 1, loginTime: -1 });

export const SecurityAlert = model<ISecurityAlert>('SecurityAlert', securityAlertSchema);
export const AdminLoginLog = model<IAdminLoginLog>('AdminLoginLog', adminLoginLogSchema); 