import { logger } from '../utils/logger';
import { config } from '../config/config';
import axios from 'axios';

interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
  }>;
}

export class SlackService {
  private static instance: SlackService;
  private webhookUrl: string;

  private constructor() {
    this.webhookUrl = config.slack.webhookUrl;
  }

  public static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  public async sendMessage(message: SlackMessage): Promise<void> {
    try {
      await axios.post(this.webhookUrl, message);
    } catch (error) {
      logger.error('Error sending Slack message:', error);
      throw error;
    }
  }

  public async sendAlert(title: string, message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<boolean> {
    const color = {
      info: '#36a64f',
      warning: '#f2c744',
      error: '#dc3545'
    }[severity];

    return this.sendMessage({
      text: `*${title}*\n${message}`,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }]
    });
  }

  public async sendActivityLog(activity: {
    user: string;
    action: string;
    details: string;
    timestamp: Date;
  }): Promise<boolean> {
    return this.sendMessage({
      text: `*Activity Log*\nUser: ${activity.user}\nAction: ${activity.action}\nDetails: ${activity.details}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Activity Log*`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*User:*\n${activity.user}`
            },
            {
              type: 'mrkdwn',
              text: `*Action:*\n${activity.action}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:*\n${activity.details}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Timestamp: ${activity.timestamp.toISOString()}`
            }
          ]
        }
      ]
    });
  }

  public async sendSecurityAlert(event: {
    type: string;
    user?: string;
    ip?: string;
    details: string;
  }): Promise<boolean> {
    return this.sendMessage({
      text: `*Security Alert*\nType: ${event.type}\nUser: ${event.user || 'Unknown'}\nIP: ${event.ip || 'Unknown'}\nDetails: ${event.details}`,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Security Alert*\nType: ${event.type}\nUser: ${event.user || 'Unknown'}\nIP: ${event.ip || 'Unknown'}\nDetails: ${event.details}`
        }
      }]
    });
  }
} 