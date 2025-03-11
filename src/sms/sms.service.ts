import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as twilio from 'twilio';
import { User, UserDocument } from '../auth/schemas/user.schema';

@Injectable()
export class SmsService {
    private client: twilio.Twilio | null = null;
    private readonly logger = new Logger(SmsService.name);
    private readonly twilioPhoneNumber: string;

    constructor(
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {
        const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        this.twilioPhoneNumber = this.configService.get('TWILIO_PHONE_NUMBER');

        if (accountSid?.startsWith('AC') && authToken) {
            this.client = twilio(accountSid, authToken);
        } else {
            this.logger.warn('Twilio credentials not properly configured. SMS features will be disabled.');
        }
    }

    async sendVerificationCode(userId: string, phoneNumber: string): Promise<void> {
        if (!this.client || !this.twilioPhoneNumber) {
            this.logger.warn('SMS service not configured. Skipping SMS sending.');
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresIn = new Date(Date.now() + 10 * 60 * 1000);

        try {
            await this.client.messages.create({
                body: `Your LocationGuard verification code is: ${code}. Valid for 10 minutes.`,
                from: this.twilioPhoneNumber,
                to: phoneNumber
            });

            await this.userModel.updateOne(
                { _id: userId },
                {
                    phoneNumber,
                    phoneVerificationCode: code,
                    phoneVerificationCodeExpires: expiresIn
                }
            );
        } catch (error) {
            console.log('failed to send verification code', error);
            throw new Error('Failed to send verification code');
        }
    }

    async verifyCode(userId: string, code: string): Promise<boolean> {
        const user = await this.userModel.findOne({
            _id: userId,
            phoneVerificationCode: code,
            phoneVerificationCodeExpires: { $gt: new Date() }
        });

        if (!user) {
            return false;
        }

        // Code valide, marquer le numéro comme vérifié et effacer le code
        await this.userModel.updateOne(
            { _id: userId },
            {
                isPhoneVerified: true,
                $unset: {
                    phoneVerificationCode: 1,
                    phoneVerificationCodeExpires: 1
                }
            }
        );

        return true;
    }

    async sendMessage(phoneNumber: string, message: string): Promise<void> {
        if (!this.client || !this.twilioPhoneNumber) {
            this.logger.warn('SMS service not configured. Skipping SMS sending.');
            return;
        }

        try {
            await this.client.messages.create({
                body: message,
                from: this.twilioPhoneNumber,
                to: phoneNumber
            });
        } catch (error) {
            this.logger.error('Failed to send SMS message', error.stack);
            throw new Error('Failed to send SMS message');
        }
    }
}