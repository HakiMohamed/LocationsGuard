import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../auth/schemas/user.schema';
import { Device } from '../auth/schemas/device.schema';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly appUrl: string;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get('MAIL_PORT'),
            secure: false,
            auth: {
                user: this.configService.get('MAIL_USERNAME'),
                pass: this.configService.get('MAIL_PASSWORD'),
            },
        });

        this.appUrl = this.configService.get('APP_URL');
        if (!this.appUrl) {
            throw new Error('APP_URL environment variable is not defined');
        }
    }

    async sendEmailVerification(user: User, token: string): Promise<void> {
        const verificationUrl = `${this.appUrl}/auth/verify-email?token=${token}`;

        await this.transporter.sendMail({
            from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
            to: user.email,
            subject: 'Verify your email address',
            html: `
                <h1>Welcome to LocationGuard!</h1>
                <p>Hi ${user.firstName},</p>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="${verificationUrl}" style="
                    background-color: #4CAF50;
                    border: none;
                    color: white;
                    padding: 15px 32px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                ">Verify Email</a>
                <p>Or copy and paste this link in your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
            `
        });
    }

    async sendNewDeviceNotification(user: User, device: Device): Promise<void> {
        const location = device.location || { city: 'Unknown', country: 'Unknown' };

        await this.transporter.sendMail({
            from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
            to: user.email,
            subject: 'New Device Login Detected',
            html: `
                <h1>New Device Login Alert</h1>
                <p>Hi ${user.firstName},</p>
                <p>We detected a new login to your account from a device we haven't seen before.</p>
                <h2>Device Details:</h2>
                <ul>
                    <li>Device: ${device.deviceName}</li>
                    <li>Browser: ${device.browser}</li>
                    <li>Operating System: ${device.os}</li>
                    <li>Location: ${location.city}, ${location.country}</li>
                    <li>IP Address: ${device.lastIp}</li>
                    <li>Time: ${device.lastLogin}</li>
                </ul>
                <p>If this was you, you can ignore this email.</p>
                <p>If you don't recognize this activity, please:</p>
                <ol>
                    <li>Change your password immediately</li>
                    <li>Review your recent activity</li>
                    <li>Contact support if needed</li>
                </ol>
            `
        });
    }

    async sendSuspiciousActivityAlert(user: User, device: Device, changes: any): Promise<void> {
        await this.transporter.sendMail({
            from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
            to: user.email,
            subject: '🚨 Suspicious Activity Detected',
            html: `
                <h1>Suspicious Activity Alert</h1>
                <p>Hi ${user.firstName},</p>
                <p>We've detected some unusual activity on your account.</p>
                <h2>Details:</h2>
                <ul>
                    <li>Device: ${device.deviceName}</li>
                    <li>Location: ${device.location?.city}, ${device.location?.country}</li>
                    <li>Time: ${new Date().toLocaleString()}</li>
                </ul>
                <h2>Changes Detected:</h2>
                <ul>
                    ${Object.entries(changes).map(([key, value]) => `
                        <li>${key}: ${value}</li>
                    `).join('')}
                </ul>
                <p>If this wasn't you, please:</p>
                <ol>
                    <li>Change your password immediately</li>
                    <li>Review your recent activity</li>
                    <li>Contact our support team</li>
                </ol>
            `
        });
    }

    async sendPasswordResetLink(user: User, token: string): Promise<void> {
        const resetUrl = `${this.appUrl}/auth/reset-password?token=${token}`;

        await this.transporter.sendMail({
            from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
            to: user.email,
            subject: 'Reset Your Password',
            html: `
                <h1>Password Reset Request</h1>
                <p>Hi ${user.firstName},</p>
                <p>You recently requested to reset your password. Click the button below to proceed:</p>
                <a href="${resetUrl}" style="
                    background-color: #4CAF50;
                    border: none;
                    color: white;
                    padding: 15px 32px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                ">Reset Password</a>
                <p>Or copy and paste this link in your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
    }
} 