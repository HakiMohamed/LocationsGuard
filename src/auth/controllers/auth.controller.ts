import { Controller, Post, Body, Get, UseGuards, Req, Query, Param, Delete, HttpCode, HttpStatus,ParseBoolPipe, Res, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { DeviceService } from '../services/device.service';
import { VerificationService } from '../services/verification.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
    LoginDto,
    RegisterDto,
    ResetPasswordDto,
    VerifyPhoneDto,
    InitiatePhoneVerificationDto
} from '../dto/auth.dto';
import { UserDto } from '../dto/user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly deviceService: DeviceService,
        private readonly verificationService: VerificationService
    ) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto, 
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        
        return this.authService.login(loginDto, req, res);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.refreshToken(req, res);
    }

    @Get('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Query('token') token: string) {
        return this.verificationService.verifyEmail(token);
    }

    @Post('verify-phone/initiate')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async initiatePhoneVerification(
        @CurrentUser('sub') userId: string,
        @Body() dto: InitiatePhoneVerificationDto
    ) {
        return this.verificationService.initiatePhoneVerification(
            userId,
            dto.phoneNumber
        );
    }

    @Post('verify-phone/verify')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async verifyPhone(
        @CurrentUser('sub') userId: string,
        @Body() dto: VerifyPhoneDto
    ) {
        return this.verificationService.verifyPhone(userId, dto);
    }

    @Post('request-password-reset')
    @HttpCode(HttpStatus.OK)
    async requestPasswordReset(@Body('email') email: string) {
        return this.verificationService.requestPasswordReset(email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.verificationService.resetPassword(
            resetPasswordDto.token,
            resetPasswordDto.newPassword
        );
    }

    @Get('devices')
    @UseGuards(JwtAuthGuard)
    async getDevices(@CurrentUser() user: any) {
        return this.deviceService.getDevices(user);
    }

    @Delete('devices/:deviceId')
    @UseGuards(JwtAuthGuard)
    async deactivateDevice(
        @CurrentUser() user: any,
        @Param('deviceId') deviceId: string
    ) {
        return this.deviceService.deactivateDevice(user, deviceId);
    }

    @Delete('devices')
    @UseGuards(JwtAuthGuard)
    async deactivateAllDevices(
        @CurrentUser() userId: string,
        @Query('exceptCurrent', ParseBoolPipe) exceptCurrent?: boolean
    ) {
        return this.deviceService.deactivateAllDevices(userId, exceptCurrent);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(
        @CurrentUser('sub') userId: string,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        
        try {
            // Obtenir l'appareil actuel
            const currentDevice = await this.deviceService.getCurrentDevice(userId, req);

            if (currentDevice) {
                // Supprimer complètement l'appareil actuel
                await this.deviceService.removeDevice(userId, currentDevice.deviceId);
            } else {
                throw new NotFoundException('No active device found for current session');
            }

            // Clear refresh token cookie
            res.cookie('refresh_token', '', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 0,
                path: '/'
            });

            res.setHeader('Clear-Access-Token', 'true');

            return { message: 'Logged out successfully and device removed' };
        } catch (error) {
            throw error;
        }
    }

    @Post('logout/all-devices')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logoutAllDevices(
        @CurrentUser('sub') userId: string,
        @Query('exceptCurrent') exceptCurrent?: boolean
    ) {
        await this.deviceService.deactivateAllDevices(userId, exceptCurrent);
        return { message: 'Logged out from all devices' };
    }


    @Get('user')
    @UseGuards(JwtAuthGuard)
    async getUser(@CurrentUser('sub') userId: string): Promise<UserDto> {
        return this.authService.getUserById(userId);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    async resendVerification(@Body('email') email: string) {
        return this.verificationService.resendVerificationEmail(email);
    }
} 