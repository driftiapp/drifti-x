import { Schema, model, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  location: {
    city: string;
    country: string;
    region: string;
    timezone: string;
    org: string;
  };
  device: {
    type: string;
    os: {
      name: string;
      version: string;
    };
    browser: {
      name: string;
      version: string;
    };
    platform: string;
    language?: string;
    screen?: {
      width: number;
      height: number;
    };
  };
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'role_change',
      'status_change',
      'password_reset',
      'profile_update'
    ]
  },
  details: {
    type: Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  location: {
    city: String,
    country: String,
    region: String,
    timezone: String,
    org: String
  },
  device: {
    type: String,
    os: {
      name: String,
      version: String
    },
    browser: {
      name: String,
      version: String
    },
    platform: String,
    language: String,
    screen: {
      width: Number,
      height: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for faster queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ 'device.type': 1, createdAt: -1 });
activityLogSchema.index({ 'location.country': 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema); 