import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as UAParser from 'ua-parser-js';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        // Log des secrets au démarrage
        console.log('Service initialized with secrets:', {
            jwtSecret: this.configService.get('JWT_SECRET'),
            refreshSecret: this.configService.get('JWT_REFRESH_SECRET'),
        });
    }

    async register(registerDto: RegisterDto): Promise<any> {
        const { email, phoneNumber, password } = registerDto;

        if (!email && !phoneNumber) {
            throw new BadRequestException('Email or phone number is required');
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this.userModel.findOne({
            $or: [
                { email: email?.toLowerCase() },
                { phoneNumber },
            ],
        });

        if (existingUser) {
            throw new BadRequestException('User already exists');
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer le nouvel utilisateur
        const newUser = await this.userModel.create({
            ...registerDto,
            email: email?.toLowerCase(),
            password: hashedPassword,
        });

        // Générer le token JWT
        const token = this.generateToken(newUser);

        return {
            user: this.sanitizeUser(newUser),
            token,
        };
    }

    async login(loginDto: LoginDto, req: Request): Promise<any> {
        const user = await this.validateUser(loginDto);
        const tokens = this.generateTokens(user);
        const device = await this.saveDevice(user._id.toString(), tokens.refreshToken, req);

        return {
            user: this.sanitizeUser(user),
            device,
            ...tokens,
        };
    }

    private generateToken(user: UserDocument): string {
        return this.jwtService.sign({
            sub: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
        });
    }

    private sanitizeUser(user: UserDocument) {
        const sanitized = user.toObject();
        delete sanitized.password;
        return sanitized;
    }

    private generateTokens(user: UserDocument) {
        const payload = { sub: user._id, email: user.email };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        console.log('Generated tokens with secrets:', {
            jwtSecret: this.configService.get('JWT_SECRET'),
            refreshSecret: this.configService.get('JWT_REFRESH_SECRET'),
        });

        return { accessToken, refreshToken };
    }

    async refreshToken(refreshToken: string) {
        try {
            console.log('Attempting to refresh with token:', refreshToken);
            console.log('Using refresh secret:', this.configService.get('JWT_REFRESH_SECRET'));

            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            console.log('Token payload:', payload);

            const user = await this.userModel.findById(payload.sub);
            console.log('User found:', user?._id);
            console.log('Stored refresh tokens:', user?.refreshTokens);

            if (!user || !user.refreshTokens.includes(refreshToken)) {
                console.log('Token validation failed: User not found or token not in stored tokens');
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = this.generateTokens(user);
            await this.rotateRefreshToken(user._id.toString(), refreshToken, tokens.refreshToken);

            return tokens;
        } catch (error) {
            console.error('Refresh token error:', error);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string, refreshToken: string) {
        // Supprimer le refresh token
        await this.userModel.updateOne(
            { _id: userId },
            { $pull: { refreshTokens: refreshToken } }
        );
    }

    private async saveRefreshToken(userId: string, refreshToken: string) {
        await this.userModel.findByIdAndUpdate(
            userId,
            { refreshTokens: [refreshToken] },
            { new: true }
        );
    }

    private async rotateRefreshToken(userId: string, _oldToken: string, newToken: string) {
        await this.userModel.findByIdAndUpdate(
            userId,
            { refreshTokens: [newToken] },
            { new: true }
        );
    }

    async googleLogin(user: any) {
        const existingUser = await this.userModel.findOne({ email: user.email });

        if (existingUser) {
            const tokens = this.generateTokens(existingUser);
            await this.saveRefreshToken(existingUser._id.toString(), tokens.refreshToken);
            return { user: this.sanitizeUser(existingUser), ...tokens };
        }

        const newUser = await this.userModel.create({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: true,
            googleId: user.googleId,
        });

        const tokens = this.generateTokens(newUser);
        await this.saveRefreshToken(newUser._id.toString(), tokens.refreshToken);
        return { user: this.sanitizeUser(newUser), ...tokens };
    }

    async getProfile(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return this.sanitizeUser(user);
    }

    private async saveDevice(userId: string, refreshToken: string, req: Request) {
        const parser = new (UAParser as any)();
        const result = parser.setUA(req.headers['user-agent']).getResult();

        const device = {
            deviceId: req.headers['device-id']?.toString() || crypto.randomUUID(),
            deviceName: req.headers['device-name']?.toString() || 'Unknown Device',
            deviceType: result.device.type || 'Desktop',
            browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`,
            os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`,
            lastLogin: new Date(),
            refreshToken,
            lastIp: req.ip,
            knownIps: [req.ip]
        };

        const existingDevice = await this.userModel.findOne({
            _id: userId,
            'devices.deviceId': device.deviceId
        });

        if (existingDevice) {
            // Mettre à jour l'appareil existant
            await this.userModel.updateOne(
                {
                    _id: userId,
                    'devices.deviceId': device.deviceId
                },
                {
                    $set: {
                        'devices.$.lastLogin': device.lastLogin,
                        'devices.$.refreshToken': device.refreshToken,
                        'devices.$.lastIp': device.lastIp,
                    },
                    $addToSet: {
                        'devices.$.knownIps': device.lastIp
                    }
                }
            );
        } else {
            // Ajouter un nouvel appareil
            await this.userModel.findByIdAndUpdate(
                userId,
                {
                    $push: { devices: device }
                },
                { new: true }
            );
        }

        return device;
    }

    async getDevices(userId: string, req: Request) {
        const user = await this.userModel.findById(userId);
        return user.devices.map(device => ({
            ...device,
            isCurrentDevice: device.lastIp === req.ip,
            lastLoginFormatted: new Date(device.lastLogin).toLocaleString()
        }));
    }

    async logoutDevice(userId: string, deviceId: string) {
        await this.userModel.findByIdAndUpdate(
            userId,
            {
                $pull: { devices: { deviceId } },
            },
            { new: true }
        );
    }

    async logoutAllDevices(userId: string) {
        await this.userModel.findByIdAndUpdate(
            userId,
            {
                devices: [],
            },
            { new: true }
        );
    }

    private getDeviceType(userAgent: string): string {
        if (!userAgent) return 'Unknown';
        if (userAgent.includes('Mobile')) return 'Mobile';
        if (userAgent.includes('Tablet')) return 'Tablet';
        return 'Desktop';
    }

    private async validateUser(loginDto: LoginDto): Promise<UserDocument> {
        const { email, phoneNumber, password } = loginDto;

        const user = await this.userModel.findOne({
            $or: [
                { email: email?.toLowerCase() },
                { phoneNumber }
            ]
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }
} 