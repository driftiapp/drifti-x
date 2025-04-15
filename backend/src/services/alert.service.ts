import { logger } from '../utils/logger';
import { config } from '../config/config';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';

interface DeviceAlert {
  userId: string;
  userEmail: string;
  deviceInfo: {
    deviceId: string;
    deviceType: string;
    os: string;
    browser: string;
    ip: string;
  };
  eventType: 'new_device' | 'device_revoked' | 'validation_failed';
  timestamp: Date;
}

export class AlertService {
  private static instance: AlertService;
  private slackService: SlackService;
  private emailService: EmailService;

  private constructor() {
    this.slackService = SlackService.getInstance();
    this.emailService = EmailService.getInstance();
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  private async sendSlackAlert(alert: DeviceAlert): Promise<void> {
    try {
      const message = this.formatSlackMessage(alert);
      await this.slackService.sendMessage(message);
    } catch (error) {
      logger.error('Error sending Slack alert:', error);
    }
  }

  private async sendEmailAlert(alert: DeviceAlert): Promise<void> {
    try {
      const { subject, html } = this.formatEmailContent(alert);
      await this.emailService.sendEmail({
        to: alert.userEmail,
        subject,
        html,
      });
    } catch (error) {
      logger.error('Error sending email alert:', error);
    }
  }

  private formatSlackMessage(alert: DeviceAlert): string {
    const eventMessages = {
      new_device: 'New device login detected',
      device_revoked: 'Device access revoked',
      validation_failed: 'Device validation failed',
    };

    return `
*${eventMessages[alert.eventType]}*
User: ${alert.userEmail}
Device: ${alert.deviceInfo.deviceType} (${alert.deviceInfo.os})
Browser: ${alert.deviceInfo.browser}
IP: ${alert.deviceInfo.ip}
Time: ${alert.timestamp.toISOString()}
    `.trim();
  }

  private formatEmailContent(alert: DeviceAlert): { subject: string; html: string } {
    const eventSubjects = {
      new_device: 'New Device Login Alert',
      device_revoked: 'Device Access Revoked',
      validation_failed: 'Device Validation Failed',
    };

    const eventDescriptions = {
      new_device: 'A new device has logged into your account',
      device_revoked: 'A device has been removed from your trusted devices',
      validation_failed: 'A device validation attempt has failed',
    };

    const subject = eventSubjects[alert.eventType];
    const html = `
      <h2>${eventDescriptions[alert.eventType]}</h2>
      <p><strong>Device Details:</strong></p>
      <ul>
        <li>Type: ${alert.deviceInfo.deviceType}</li>
        <li>OS: ${alert.deviceInfo.os}</li>
        <li>Browser: ${alert.deviceInfo.browser}</li>
        <li>IP Address: ${alert.deviceInfo.ip}</li>
        <li>Time: ${alert.timestamp.toLocaleString()}</li>
      </ul>
      <p>If you did not perform this action, please secure your account immediately.</p>
      <p>You can manage your trusted devices in your account settings.</p>
    `.trim();

    return { subject, html };
  }

  public async sendDeviceAlert(alert: DeviceAlert): Promise<void> {
    try {
      // Send alerts in parallel
      await Promise.all([
        this.sendSlackAlert(alert),
        this.sendEmailAlert(alert),
      ]);
    } catch (error) {
      logger.error('Error sending device alerts:', error);
    }
  }
} 