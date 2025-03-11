import { Injectable, BadRequestException, NotFoundException, Catch } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';
import { MailService } from '../../mail/mail.service';
import { SmsService } from '../../sms/sms.service';
import { VerifyPhoneDto } from '../dto/auth.dto';

@Injectable()
export class VerificationService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService,
        private smsService: SmsService
    ) { }

    async verifyEmail(token: string): Promise<any> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_VERIFICATION_SECRET')
            });

            const user = await this.userModel.findOne({
                _id: payload.sub,
                email: payload.email,
                isEmailVerified: false
            });

            if (!user) {
                throw new BadRequestException('Invalid token or email already verified');
            }

            user.isEmailVerified = true;
            await user.save();

            return { message: 'Email verified successfully' };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new BadRequestException('Verification token has expired');
            }
            throw new BadRequestException('Invalid verification token');
        }
    }

    async initiatePhoneVerification(userId: string, phoneNumber: string): Promise<any> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isPhoneVerified && user.phoneNumber === phoneNumber) {
            throw new BadRequestException('Phone number already verified');
        }
        try {
            await this.smsService.sendVerificationCode(userId, phoneNumber);
            return { message: 'Verification code sent successfully' };
        } catch (error) {
            console.log('failed to send verification code', error);
            throw new BadRequestException('Failed to send verification code');
        }
    }



    async verifyPhone(userId: string, verifyPhoneDto: VerifyPhoneDto): Promise<any> {
        const isValid = await this.smsService.verifyCode(userId, verifyPhoneDto.code);

        if (!isValid) {
            throw new BadRequestException('Invalid or expired verification code');
        }

        return { message: 'Phone number verified successfully' };
    }

    async resendVerificationEmail(email: string): Promise<any> {
        const user = await this.userModel.findOne({
            email: email.toLowerCase(),
            isEmailVerified: false
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const verificationToken = await this.generateEmailVerificationToken(user);
        await this.mailService.sendEmailVerification(user, verificationToken);

        return { message: 'If the email exists and is not verified, a new verification link will be sent.' };
    }

    async requestPasswordReset(email: string): Promise<any> {
        const user = await this.userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new BadRequestException('Email not found');
        }

        const resetToken = await this.generatePasswordResetToken(user);
        await this.mailService.sendPasswordResetLink(user, resetToken);

        return { message: 'Password reset link sent successfully' };
    }

    async resetPassword(token: string, newPassword: string): Promise<any> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_RESET_SECRET')
            });

            const user = await this.userModel.findOne({
                _id: payload.sub,
                email: payload.email
            });

            if (!user) {
                throw new BadRequestException('Invalid token');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedPassword;

            // Déconnecter tous les appareils
            user.devices = user.devices.map(device => ({
                ...device,
                isActive: false
            }));

            await user.save();

            return { message: 'Password reset successful' };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new BadRequestException('Reset token has expired');
            }
            throw new BadRequestException('Invalid reset token');
        }
    }

    public async generateEmailVerificationToken(user: UserDocument): Promise<string> {
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            type: 'email-verification' as const
        };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_VERIFICATION_SECRET'),
            expiresIn: `${this.configService.get<number>('VERIFICATION_TOKEN_EXPIRATION')}m`
        });
    }

    private async generatePasswordResetToken(user: UserDocument): Promise<string> {
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            type: 'password-reset'
        };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_RESET_SECRET'),
            expiresIn: `${this.configService.get<number>('RESET_TOKEN_EXPIRATION')}m`
        });
    }
}