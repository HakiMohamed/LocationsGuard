import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../auth/schemas/user.schema';
import { Device } from '../auth/schemas/device.schema';
import { DeviceResponseDto } from '../auth/dto/device.dto';
import { verificationEmailTemplate } from './templates/verification-email.template';
import { newDeviceNotificationTemplate } from './templates/new-device-notification.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { S3Service } from '../shared/services/s3.service';
import { maintenanceNotificationTemplate } from './templates/maintenance-notification.template';
import { clientCredentialsTemplate } from './templates/client-credentials.template';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);
    private readonly frontendUrl: string;

    constructor(
        private configService: ConfigService,
        private s3Service: S3Service,
    ) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get('MAIL_PORT'),
            secure: false,
            auth: {
                user: this.configService.get('MAIL_USERNAME'),
                pass: this.configService.get('MAIL_PASSWORD'),
            },
        });

        this.frontendUrl = this.configService.get('FRONTEND_URL');
    }

    private get mailFrom(): string {
        return `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM_ADDRESS')}>`;
    }

    async sendEmailVerification(user: User, token: string): Promise<void> {
        const logoUrl = this.s3Service.getFileUrl('logo.png');
        const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${token}`;

        try {
            await this.transporter.sendMail({
                from: this.mailFrom,
                to: user.email,
                subject: 'Verify your email address - LocationGuard',
                html: verificationEmailTemplate(user.firstName, verificationUrl, logoUrl)
            });
            this.logger.log(`Verification email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${user.email}`, error.stack);
            throw error;
        }
    }

    async sendNewDeviceNotification(user: User, device: Partial<Device> | DeviceResponseDto): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.mailFrom,
                to: user.email,
                subject: 'Security Alert - New Device Login Detected - LocationGuard',
                html: newDeviceNotificationTemplate(user.firstName, device)
            });
            this.logger.log(`New device notification sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send new device notification to ${user.email}`, error.stack);
            throw error;
        }
    }

    async sendPasswordResetLink(user: User, token: string): Promise<void> {
        const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}`;

        try {
            await this.transporter.sendMail({
                from: this.mailFrom,
                to: user.email,
                subject: 'Password Reset Request - LocationGuard',
                html: passwordResetTemplate(user.firstName, resetUrl)
            });
            this.logger.log(`Password reset email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${user.email}`, error.stack);
            throw error;
        }
    }

    async sendMaintenanceNotification(automobile: any, maintenance: any): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.mailFrom,
                to: this.configService.get('ADMIN_EMAIL'),
                subject: `Maintenance Programmée - ${automobile.brand} ${automobile.model}`,
                html: maintenanceNotificationTemplate(maintenance, automobile)
            });
            this.logger.log(`Maintenance notification sent for ${automobile.brand} ${automobile.model}`);
        } catch (error) {
            this.logger.error(`Failed to send maintenance notification`, error.stack);
            throw error;
        }
    }

    async sendClientCredentials(user: User, password: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.mailFrom,
                to: user.email,
                subject: 'Vos identifiants de connexion - Location de voitures',
                html: clientCredentialsTemplate(user.firstName, user.email, password)
            });
            this.logger.log(`Credentials email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send credentials email to ${user.email}`, error.stack);
            throw error;
        }
    }
} 