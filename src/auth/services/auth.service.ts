import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { User, UserDocument } from '../schemas/user.schema';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { TokenService } from './token.service';
import { DeviceService } from './device.service';
import { VerificationService } from './verification.service';
import { MailService } from '../../mail/mail.service';
import { MongoServerError } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../dto/user.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private tokenService: TokenService,
        private deviceService: DeviceService,
        private verificationService: VerificationService,
        private mailService: MailService,
        private configService: ConfigService
    ) { }

    async register(registerDto: RegisterDto): Promise<any> {
        const { email, password} = registerDto;

        try {
            const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                throw new BadRequestException('Email already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await this.userModel.create({
                ...registerDto,
                email: email.toLowerCase(),
                password: hashedPassword
            });

            const verificationToken = await this.verificationService.generateEmailVerificationToken(newUser);
            await this.mailService.sendEmailVerification(newUser, verificationToken);

            return {
                message: 'Registration successful. Please check your email to verify your account.'
            };
        } catch (error) {
            if (error instanceof MongoServerError && error.code === 11000) {
                // Vérifier quel champ est dupliqué
                const duplicatedField = Object.keys(error.keyPattern)[0];

                if (duplicatedField === 'phoneNumber') {
                    throw new ConflictException({
                        message: 'Phone number already registered',
                        field: 'phoneNumber',
                        error: 'PHONE_NUMBER_EXISTS'
                    });
                }

                if (duplicatedField === 'email') {
                    throw new ConflictException({
                        message: 'Email already registered',
                        field: 'email',
                        error: 'EMAIL_EXISTS'
                    });
                }

                throw new ConflictException({
                    message: `This ${duplicatedField} is already in use`,
                    field: duplicatedField,
                    error: 'DUPLICATE_FIELD'
                });
            }

            // Si c'est une autre erreur que nous avons déjà gérée (comme BadRequestException)
            if (error instanceof BadRequestException || error instanceof ConflictException) {
                throw error;
            }

            // Pour toute autre erreur inattendue
            throw new BadRequestException({
                message: 'Registration failed. Please try again.',
                error: 'REGISTRATION_FAILED'
            });
        }
    }

    async login(loginDto: LoginDto, req: Request, res: Response): Promise<any> {
        const user = await this.validateUser(loginDto);
        if (!user.isEmailVerified) {
            throw new UnauthorizedException({
                message: 'Please verify your email before logging in',
                error: 'EMAIL_NOT_VERIFIED'
            });
        }

        const tokens = await this.tokenService.generateTokens(user);
        const device = await this.deviceService.handleLoginDevice(user, tokens.refresh_token, req);

        // Set refresh token cookie
        this.setRefreshTokenCookie(res, tokens.refresh_token);

        // Log pour debug
        console.log('Login successful, refresh token cookie should be set');

        return {
           
                user: {
                    _id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                access_token: tokens.access_token,
                device,
                message: 'Login successful'
           
        };
    }

    async refreshToken(req: Request, res: Response) {
        console.log('Refresh token request received');
        console.log('Cookies:', req.cookies);

        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        try {
            const decoded = await this.tokenService.validateRefreshToken(refreshToken);
            const user = await this.userModel.findById(decoded.user._id);

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            const tokens = await this.tokenService.generateTokens(user);
            this.setRefreshTokenCookie(res, tokens.refresh_token);

            return {
                
                    access_token: tokens.access_token,
                    message: 'Token refreshed successfully'
              
                
            };
        } catch (error) {
            console.error('Refresh token error:', error);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private setRefreshTokenCookie(res: Response, token: string) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'none' as const,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        };
    
        res.cookie('refresh_token', token, cookieOptions);
    
        // Utiliser l'origine du frontend depuis la config
        res.header('Access-Control-Allow-Origin', frontendUrl);
        res.header('Access-Control-Allow-Credentials', 'true');
    
        console.log('Setting refresh token cookie with options:', cookieOptions);
    }

    private async validateUser(loginDto: LoginDto): Promise<UserDocument> {
        const { email, password } = loginDto;
        const user = await this.userModel.findOne({ email: email.toLowerCase() });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    async getUserById(userId: string): Promise<UserDto> {
        const user = await this.userModel.findById(userId).select('email firstName lastName phoneNumber isEmailVerified isPhoneVerified role devices createdAt updatedAt ').lean();
    
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        return plainToInstance(UserDto, user);
    }
}