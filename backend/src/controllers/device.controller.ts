import { Request, Response } from 'express';
import { DeviceTrustService } from '../services/deviceTrust.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { IController } from '../types/controller';

export class DeviceController implements IController {
  private static instance: DeviceController;
  private service: DeviceTrustService;

  private constructor() {
    this.service = DeviceTrustService.getInstance();
  }

  public static getInstance(): DeviceController {
    if (!DeviceController.instance) {
      DeviceController.instance = new DeviceController();
    }
    return DeviceController.instance;
  }

  private getClientIp(req: Request): string {
    return req.ip || 
           req.headers['x-forwarded-for'] as string || 
           req.socket.remoteAddress || 
           'unknown';
  }

  public async getUserDevices(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const devices = await this.service.getUserDevices(userId);
      res.json(devices);
    } catch (error) {
      logger.error('Error getting user devices:', error);
      throw error;
    }
  }

  public async revokeDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { deviceId } = req.params;
      await this.service.deleteDeviceTrust(
        deviceId,
        userId,
        this.getClientIp(req)
      );

      res.json({ message: 'Device access revoked successfully' });
    } catch (error) {
      logger.error('Error revoking device:', error);
      throw error;
    }
  }
} 