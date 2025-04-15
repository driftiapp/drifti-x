import mongoose, { Document, Schema } from 'mongoose';
import { logger } from '../utils/logger';

export interface IDeviceTrust extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os: string;
  browser: string;
  lastIp: string;
  lastSeen: Date;
  firstSeen: Date;
  isTrusted: boolean;
  token: string;
  tokenExpires: Date;
}

const deviceTrustSchema = new Schema<IDeviceTrust>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String, required: true },
  deviceName: { type: String },
  deviceType: { type: String, required: true },
  os: { type: String, required: true },
  browser: { type: String, required: true },
  lastIp: { type: String, required: true },
  lastSeen: { type: Date, default: Date.now },
  firstSeen: { type: Date, default: Date.now },
  isTrusted: { type: Boolean, default: false },
  token: { type: String, required: true, unique: true },
  tokenExpires: { type: Date, required: true }
}, {
  timestamps: true
});

// Indexes for faster queries
deviceTrustSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
deviceTrustSchema.index({ token: 1 });
deviceTrustSchema.index({ lastSeen: 1 });

export const DeviceTrustModel = mongoose.model<IDeviceTrust>('DeviceTrust', deviceTrustSchema);

export class DeviceTrust {
  private static instance: DeviceTrust;
  private model: typeof DeviceTrustModel;

  private constructor() {
    this.model = DeviceTrustModel;
  }

  public static getInstance(): DeviceTrust {
    if (!DeviceTrust.instance) {
      DeviceTrust.instance = new DeviceTrust();
    }
    return DeviceTrust.instance;
  }

  public async createDeviceTrust(
    userId: string,
    deviceInfo: {
      deviceId: string;
      deviceName?: string;
      deviceType: string;
      os: string;
      browser: string;
      ip: string;
    },
    isTrusted: boolean = false
  ): Promise<IDeviceTrust> {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date();
      tokenExpires.setDate(tokenExpires.getDate() + 30); // 30 days expiration

      const deviceTrust = await this.model.create({
        userId: new mongoose.Types.ObjectId(userId),
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        lastIp: deviceInfo.ip,
        isTrusted,
        token,
        tokenExpires
      });

      return deviceTrust;
    } catch (error) {
      logger.error('Error creating device trust:', error);
      throw error;
    }
  }

  public async findByToken(token: string): Promise<IDeviceTrust | null> {
    try {
      return await this.model.findOne({ token });
    } catch (error) {
      logger.error('Error finding device trust by token:', error);
      throw error;
    }
  }

  public async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<IDeviceTrust | null> {
    try {
      return await this.model.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        deviceId
      });
    } catch (error) {
      logger.error('Error finding device trust by user and device:', error);
      throw error;
    }
  }

  public async updateLastSeen(token: string, ip: string): Promise<void> {
    try {
      await this.model.updateOne(
        { token },
        { 
          lastSeen: new Date(),
          lastIp: ip
        }
      );
    } catch (error) {
      logger.error('Error updating device trust last seen:', error);
      throw error;
    }
  }

  public async setTrustStatus(token: string, isTrusted: boolean): Promise<void> {
    try {
      await this.model.updateOne(
        { token },
        { isTrusted }
      );
    } catch (error) {
      logger.error('Error updating device trust status:', error);
      throw error;
    }
  }

  public async deleteDeviceTrust(token: string): Promise<void> {
    try {
      await this.model.deleteOne({ token });
    } catch (error) {
      logger.error('Error deleting device trust:', error);
      throw error;
    }
  }

  public async getUserDevices(userId: string): Promise<IDeviceTrust[]> {
    try {
      return await this.model.find({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ lastSeen: -1 });
    } catch (error) {
      logger.error('Error getting user devices:', error);
      throw error;
    }
  }
} 