import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { DeviceTrust } from '../models/deviceTrust.model';
import { ActivityLogService } from './activityLog.service';
import crypto from 'crypto';

export class DeviceTrustService {
  private static instance: DeviceTrustService;
  private deviceTrust: DeviceTrust;
  private activityLogService: ActivityLogService;

  private constructor() {
    this.deviceTrust = DeviceTrust.getInstance();
    this.activityLogService = ActivityLogService.getInstance();
  }

  public static getInstance(): DeviceTrustService {
    if (!DeviceTrustService.instance) {
      DeviceTrustService.instance = new DeviceTrustService();
    }
    return DeviceTrustService.instance;
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
  ) {
    try {
      const existingDevice = await this.deviceTrust.findByUserIdAndDeviceId(userId, deviceInfo.deviceId);
      
      if (existingDevice) {
        await this.deviceTrust.updateLastSeen(existingDevice.token, deviceInfo.ip);
        return existingDevice;
      }

      const deviceTrust = await this.deviceTrust.createDeviceTrust(userId, deviceInfo, isTrusted);

      // Log device trust creation
      await this.activityLogService.logActivity({
        userId,
        action: 'device_trust_created',
        details: `New device trust created for ${deviceInfo.deviceType} (${deviceInfo.os})`,
        ipAddress: deviceInfo.ip
      });

      return deviceTrust;
    } catch (error) {
      logger.error('Error in createDeviceTrust:', error);
      throw error;
    }
  }

  public async validateDeviceTrust(token: string, ip: string): Promise<boolean> {
    try {
      const deviceTrust = await this.deviceTrust.findByToken(token);
      
      if (!deviceTrust) {
        return false;
      }

      if (deviceTrust.tokenExpires < new Date()) {
        await this.deviceTrust.deleteDeviceTrust(token);
        return false;
      }

      await this.deviceTrust.updateLastSeen(token, ip);
      return deviceTrust.isTrusted;
    } catch (error) {
      logger.error('Error validating device trust:', error);
      return false;
    }
  }

  public async setDeviceTrustStatus(token: string, isTrusted: boolean, userId: string, ip: string): Promise<void> {
    try {
      const deviceTrust = await this.deviceTrust.findByToken(token);
      
      if (!deviceTrust) {
        throw new AppError('Device trust not found', 404);
      }

      if (deviceTrust.userId.toString() !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      await this.deviceTrust.setTrustStatus(token, isTrusted);

      // Log trust status change
      await this.activityLogService.logActivity({
        userId,
        action: 'device_trust_updated',
        details: `Device trust status set to ${isTrusted ? 'trusted' : 'untrusted'}`,
        ipAddress: ip
      });
    } catch (error) {
      logger.error('Error setting device trust status:', error);
      throw error;
    }
  }

  public async deleteDeviceTrust(token: string, userId: string, ip: string): Promise<void> {
    try {
      const deviceTrust = await this.deviceTrust.findByToken(token);
      
      if (!deviceTrust) {
        throw new AppError('Device trust not found', 404);
      }

      if (deviceTrust.userId.toString() !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      await this.deviceTrust.deleteDeviceTrust(token);

      // Log device trust deletion
      await this.activityLogService.logActivity({
        userId,
        action: 'device_trust_deleted',
        details: 'Device trust removed',
        ipAddress: ip
      });
    } catch (error) {
      logger.error('Error deleting device trust:', error);
      throw error;
    }
  }

  public async getUserDevices(userId: string): Promise<any[]> {
    try {
      const devices = await this.deviceTrust.getUserDevices(userId);
      return devices.map(device => ({
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        os: device.os,
        browser: device.browser,
        lastIp: device.lastIp,
        lastSeen: device.lastSeen,
        firstSeen: device.firstSeen,
        isTrusted: device.isTrusted
      }));
    } catch (error) {
      logger.error('Error getting user devices:', error);
      throw error;
    }
  }
} 