import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { Device } from './schemas/device.schema';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { DeviceResponseDto, DeviceListResponseDto } from './dto/device.dto';
import { Tokens } from './types/tokens.type';
import { DeviceType } from './enums/device-type.enum';
import { MailService } from '../mail/mail.service';
import { EmailVerificationPayload, PasswordResetPayload } from './types/verification-token.type';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService
    ) { }

    async register(registerDto: RegisterDto): Promise<any> {
        const { email, password, firstName, lastName } = registerDto;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        // Créer le nouvel utilisateur
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await this.userModel.create({
            ...registerDto,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        // Générer le token de vérification
        const verificationToken = await this.generateEmailVerificationToken(newUser);

        // Envoyer l'email de vérification
        await this.mailService.sendEmailVerification(newUser, verificationToken);

        return {
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                _id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            }
        };
    }

    async verifyEmail(token: string): Promise<any> {
        try {
            const payload = await this.jwtService.verifyAsync<EmailVerificationPayload>(
                token,
                {
                    secret: this.configService.get<string>('JWT_VERIFICATION_SECRET')
                }
            );

            if (payload.type !== 'email-verification') {
                throw new BadRequestException('Invalid token type');
            }

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

    async requestPasswordReset(email: string): Promise<any> {
        const user = await this.userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Pour des raisons de sécurité, nous ne révélons pas si l'email existe
            return { message: 'If the email exists, a password reset link will be sent.' };
        }

        const resetToken = await this.generatePasswordResetToken(user);
        await this.mailService.sendPasswordResetLink(user, resetToken);

        return { message: 'If the email exists, a password reset link will be sent.' };
    }

    async resetPassword(token: string, newPassword: string): Promise<any> {
        try {
            const payload = await this.jwtService.verifyAsync<PasswordResetPayload>(
                token,
                {
                    secret: this.configService.get<string>('JWT_RESET_SECRET')
                }
            );

            if (payload.type !== 'password-reset') {
                throw new BadRequestException('Invalid token type');
            }

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
            await this.deactivateAllDevices(user._id.toString());
            await user.save();

            return { message: 'Password reset successful' };
        } catch (error) {
            console.error('Reset password error:', error);
            if (error.name === 'TokenExpiredError') {
                throw new BadRequestException('Reset token has expired');
            }
            throw new BadRequestException('Invalid reset token');
        }
    }

    private async generateEmailVerificationToken(user: UserDocument): Promise<string> {
        const payload: EmailVerificationPayload = {
            sub: user._id.toString(),
            email: user.email,
            type: 'email-verification'
        };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_VERIFICATION_SECRET'),
            expiresIn: '24h'
        });
    }

    private async generatePasswordResetToken(user: UserDocument): Promise<string> {
        const payload: PasswordResetPayload = {
            sub: user._id.toString(),
            email: user.email,
            type: 'password-reset'
        };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_RESET_SECRET'),
            expiresIn: '1h'
        });
    }

    async login(loginDto: LoginDto, req: Request) {
        console.log(req.headers);
        const user = await this.validateUser(loginDto);
        const tokens = await this.getTokens(user);

        const existingDevice = user.devices?.find(device =>
            device.deviceId === (req.headers['device-id']?.toString() || '')
        );

        const device = await this.saveDevice(
            user._id.toString(),
            tokens.refresh_token,
            req,
            existingDevice
        );

        // Mettre à jour les informations de dernière connexion
        await this.userModel.updateOne(
            { _id: user._id },
            {
                lastLogin: new Date(),
                lastLoginIp: req.ip
            }
        );

        // Retourner uniquement les informations nécessaires
        return {
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                avatarUrl: user.avatarUrl
            },
            tokens,
            device
        };
    }

    async refreshToken(refreshToken: string, req: Request) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET')
            });

            const user = await this.userModel.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            const deviceWithToken = user.devices?.find(
                device => device.refreshToken === refreshToken && device.isActive
            );

            if (!deviceWithToken) {
                throw new UnauthorizedException('Invalid session');
            }

            const tokens = await this.getTokens(user);

            // Mettre à jour le refresh token du device
            await this.updateDeviceToken(
                user._id.toString(),
                deviceWithToken.deviceId,
                tokens.refresh_token,
                req.ip
            );

            return { tokens };
        } catch (error) {
            throw new UnauthorizedException('Invalid session');
        }
    }

    private async getTokens(user: UserDocument): Promise<Tokens> {
        const payload = {
            sub: user._id.toString(),
            email: user.email
        };

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: '1h'
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d'
            })
        ]);

        return { access_token, refresh_token };
    }

    private async validateUser(loginDto: LoginDto): Promise<UserDocument> {
        const { email, password } = loginDto;
        const user = await this.userModel.findOne({ email: email.toLowerCase() });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    private async generateDeviceFingerprint(req: Request): Promise<string> {
        const parser = new UAParser(req.headers['user-agent'] as string);
        const result = parser.getResult();

        // Combinaison de paramètres uniques pour identifier le device
        const fingerprintData = {
            userAgent: req.headers['user-agent'],
            browser: {
                name: result.browser.name,
                version: result.browser.version,
                major: result.browser.major,
            },
            engine: result.engine,
            os: {
                name: result.os.name,
                version: result.os.version,
            },
            device: result.device,
            cpu: result.cpu,
            screen: req.headers['sec-ch-device-memory'],
            language: req.headers['accept-language'],
            platform: req.headers['sec-ch-ua-platform'],
            mobile: req.headers['sec-ch-ua-mobile'],
            colorDepth: req.headers['sec-ch-color-depth'],
            timezone: req.headers['timezone'],
            ip: req.ip
        };

        // Créer un hash unique basé sur ces informations
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(fingerprintData))
            .digest('hex');
    }

    private async saveDevice(
        userId: string,
        refreshToken: string,
        req: Request,
        existingDevice?: Device
    ): Promise<DeviceResponseDto> {
        const parser = new UAParser(req.headers['user-agent'] as string);
        const result = parser.getResult();

        // Générer le fingerprint
        const deviceFingerprint = await this.generateDeviceFingerprint(req);

        // Chercher un device existant avec ce fingerprint
        const deviceData = {
            deviceId: deviceFingerprint,
            deviceName: this.getDeviceName(result),
            deviceType: this.getDeviceType(result),
            browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`,
            os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`,
            cpu: result.cpu.architecture || 'Unknown',
            screenResolution: req.headers['sec-ch-device-memory'] || 'Unknown',
            deviceMemory: req.headers['device-memory'] || 'Unknown',
            platform: result.os.name || 'Unknown',
            isMobile: result.device.type === 'mobile',
            lastLogin: new Date(),
            refreshToken,
            lastIp: req.ip,
            knownIps: existingDevice ?
                [...new Set([...existingDevice.knownIps, req.ip])] :
                [req.ip],
            isActive: true,
            fingerprint: deviceFingerprint
        };

        if (existingDevice) {
            await this.userModel.updateOne(
                {
                    _id: userId,
                    'devices.fingerprint': deviceFingerprint
                },
                {
                    $set: {
                        'devices.$': deviceData
                    }
                }
            );
        } else {
            await this.userModel.updateOne(
                { _id: userId },
                {
                    $push: { devices: deviceData }
                }
            );
        }

        const { refreshToken: _, fingerprint: __, ...deviceResponse } = deviceData;
        return deviceResponse;
    }

    private getDeviceName(result: UAParser.IResult): string {
        const device = result.device;
        if (device.vendor && device.model) {
            return `${device.vendor} ${device.model}`;
        }
        if (device.type) {
            return `${device.type.charAt(0).toUpperCase() + device.type.slice(1)} Device`;
        }
        return 'Unknown Device';
    }

    private getDeviceType(result: UAParser.IResult): DeviceType {
        if (!result.device.type) {
            return DeviceType.DESKTOP;
        }
        switch (result.device.type.toLowerCase()) {
            case 'mobile':
                return DeviceType.MOBILE;
            case 'tablet':
                return DeviceType.TABLET;
            default:
                return DeviceType.DESKTOP;
        }
    }

    private async updateDeviceToken(
        userId: string,
        deviceId: string,
        newRefreshToken: string,
        ip: string
    ): Promise<void> {
        await this.userModel.updateOne(
            {
                _id: userId,
                'devices.deviceId': deviceId
            },
            {
                $set: {
                    'devices.$.refreshToken': newRefreshToken,
                    'devices.$.lastLogin': new Date(),
                    'devices.$.lastIp': ip
                },
                $addToSet: {
                    'devices.$.knownIps': ip
                }
            }
        );
    }

    async getDevices(userId: string): Promise<DeviceListResponseDto> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const devices = user.devices.map(device => {
            const { refreshToken: _, ...deviceData } = device as any;
            return deviceData;
        });

        return {
            devices,
            total: devices.length,
            active: devices.filter(d => d.isActive).length
        };
    }

    async deactivateDevice(userId: string, deviceId: string): Promise<void> {
        const result = await this.userModel.updateOne(
            {
                _id: userId,
                'devices.deviceId': deviceId
            },
            {
                $set: {
                    'devices.$.isActive': false
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundException('Device not found');
        }
    }

    async deactivateAllDevices(userId: string, exceptDeviceId?: string): Promise<void> {
        const updateQuery = exceptDeviceId
            ? {
                $set: {
                    'devices.$[device].isActive': false
                }
            }
            : {
                $set: {
                    'devices.$[].isActive': false
                }
            };

        const options = exceptDeviceId
            ? {
                arrayFilters: [{ 'device.deviceId': { $ne: exceptDeviceId } }]
            }
            : {};

        await this.userModel.updateOne(
            { _id: userId },
            updateQuery,
            options
        );
    }

    async reactivateDevice(userId: string, deviceId: string): Promise<void> {
        const result = await this.userModel.updateOne(
            {
                _id: userId,
                'devices.deviceId': deviceId
            },
            {
                $set: {
                    'devices.$.isActive': true,
                    'devices.$.lastLogin': new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundException('Device not found');
        }
    }

    async getProfile(userId: string): Promise<any> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return {
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                role: user.role,
                avatarUrl: user.avatarUrl,
                bannerUrl: user.bannerUrl
            }
        };
    }

    async resendVerificationEmail(userId: string): Promise<any> {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        // Générer un nouveau token
        const verificationToken = await this.generateEmailVerificationToken(user);

        // Envoyer le nouvel email
        await this.mailService.sendEmailVerification(user, verificationToken);

        return {
            message: 'Verification email has been resent. Please check your inbox.'
        };
    }
} 