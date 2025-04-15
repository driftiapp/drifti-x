import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    if (!config.smtp) {
      throw new AppError('SMTP configuration is missing', 'CONFIGURATION_ERROR');
    }

    if (!config.smtp.port) {
      throw new AppError('SMTP port is not configured', 'CONFIGURATION_ERROR');
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: Number(config.smtp.port),
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!config.smtp?.from) {
        throw new AppError('SMTP from address is not configured', 'CONFIGURATION_ERROR');
      }

      const mailOptions = {
        from: config.smtp.from,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  public async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationUrl = `${config.appUrl}/verify-email?token=${token}`;
    const html = `
      <h1>Email Verification</h1>
      <p>Please click the following link to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `;
    await this.sendEmail(to, 'Verify Your Email', html);
  }

  public async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${config.appUrl}/reset-password?token=${token}`;
    const html = `
      <h1>Password Reset</h1>
      <p>Please click the following link to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
    `;
    await this.sendEmail(to, 'Reset Your Password', html);
  }

  public async sendWelcomeEmail(email: string): Promise<void> {
    const html = `
      <h1>Welcome to Driftix!</h1>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `;
    await this.sendEmail(email, 'Welcome to Driftix!', html);
  }
}