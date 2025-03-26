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

interface MaintenanceReminderEmailParams {
    to: string;
    subject: string;
    maintenanceType: string;
    daysUntilDue: number;
    vehicle: string;
    dueDate: Date;
    estimatedMileage: number;
    currentMileage: number;
    mileageUntilDue: number;
    maintenanceDetails: string;
}

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
        const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

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
        const subject = `Maintenance programmée pour ${automobile.brand} ${automobile.model} `;
        
        let maintenanceType = '';
        switch(maintenance.type) {
            case 'OIL_CHANGE': maintenanceType = 'Vidange d\'huile'; break;
            case 'TIRE_CHANGE': maintenanceType = 'Changement de pneus'; break;
            case 'BRAKE_SERVICE': maintenanceType = 'Entretien des freins'; break;
            case 'FILTER_CHANGE': maintenanceType = 'Changement de filtres'; break;
            case 'BATTERY_REPLACEMENT': maintenanceType = 'Remplacement de batterie'; break;
            case 'GENERAL_INSPECTION': maintenanceType = 'Inspection générale'; break;
            default: maintenanceType = maintenance.type;
        }
        
        const html = `
            <h1>Rappel de maintenance</h1>
            <p>Une maintenance est programmée pour le véhicule suivant :</p>
            <ul>
                <li><strong>Marque :</strong> ${automobile.brand}</li>
                <li><strong>Modèle :</strong> ${automobile.model}</li>
                <li><strong>Année :</strong> ${automobile.year}</li>
                <li><strong>Immatriculation :</strong> ${automobile.licensePlate}</li>
            </ul>
            <p><strong>Type de maintenance :</strong> ${maintenanceType}</p>
            <p><strong>Date programmée :</strong> ${new Date(maintenance.scheduledDate).toLocaleDateString()}</p>
            <p><strong>Kilométrage actuel :</strong> ${automobile.mileage} km</p>
            ${maintenance.description ? `<p><strong>Description :</strong> ${maintenance.description}</p>` : ''}
            ${maintenance.notes ? `<p><strong>Notes :</strong> ${maintenance.notes}</p>` : ''}
            <p>Veuillez prendre les dispositions nécessaires pour effectuer cette maintenance.</p>
        `;
        
        await this.sendMail(process.env.ADMIN_EMAIL, subject, html);
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

    async sendMail(to: string, subject: string, html: string): Promise<void> {
        await this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html
        });
    }

    async sendMaintenanceReminderEmail(params: MaintenanceReminderEmailParams) {
        const template = `
            <h2>Rappel de maintenance</h2>
            <p>Une maintenance est prévue dans ${params.daysUntilDue} jours.</p>
            <h3>Détails :</h3>
            <ul>
                <li>Véhicule : ${params.vehicle}</li>
                <li>Type de maintenance : ${params.maintenanceType}</li>
                <li>Date prévue : ${params.dueDate.toLocaleDateString()}</li>
                <li>Kilométrage actuel : ${params.currentMileage} km</li>
                <li>Kilométrage prévu : ${params.estimatedMileage} km</li>
                <li>Kilométrage restant : ${params.mileageUntilDue} km</li>
            </ul>
            <p><strong>Description : </strong>${params.maintenanceDetails}</p>
        `;

        await this.sendMail(params.to, params.subject, template);
    }
} 