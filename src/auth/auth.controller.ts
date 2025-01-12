import {
    Controller,
    Post,
    Body,
    Req,
    Get,
    UseGuards,
    Param,
    HttpCode,
    HttpStatus,
    Delete,
    Put,
    Query,
    UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './enums/role.enum';
import { Request } from 'express';
import { GetUser } from './decorators/get-user.decorator';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto, @Req() req: Request) {
        const result = await this.authService.login(loginDto, req);
        return {
            user: result.user,
            tokens: result.tokens,
            device: result.device
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(
        @Body('refresh_token') refreshToken: string,
        @Req() req: Request
    ) {
        return this.authService.refreshToken(refreshToken, req);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@GetUser('userId') userId: string) {
        return this.authService.getProfile(userId);
    }

    @Get('devices')
    @UseGuards(JwtAuthGuard)
    async getDevices(@GetUser('userId') userId: string) {
        return this.authService.getDevices(userId);
    }

    @Delete('devices/:deviceId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deactivateDevice(
        @GetUser('userId') userId: string,
        @Param('deviceId') deviceId: string
    ) {
        await this.authService.deactivateDevice(userId, deviceId);
    }

    @Delete('devices')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deactivateAllDevices(
        @GetUser('userId') userId: string,
        @Body('exceptDeviceId') exceptDeviceId?: string
    ) {
        await this.authService.deactivateAllDevices(userId, exceptDeviceId);
    }

    @Put('devices/:deviceId/reactivate')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async reactivateDevice(
        @GetUser('userId') userId: string,
        @Param('deviceId') deviceId: string
    ) {
        await this.authService.reactivateDevice(userId, deviceId);
    }

    // Routes d'administration
    @Get('users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SOUS_ADMIN)
    async getUsers() {
        // TODO: Implémenter la logique d'administration des utilisateurs
        return [];
    }

    @Get('users/:userId/devices')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SOUS_ADMIN)
    async getUserDevices(@Param('userId') userId: string) {
        return this.authService.getDevices(userId);
    }

    @Get('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Query('token') token: string) {
        if (!token) {
            throw new UnauthorizedException('Verification token is required');
        }
        return this.authService.verifyEmail(token);
    }

    @Post('request-password-reset')
    @HttpCode(HttpStatus.OK)
    async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(
        @Query('token') token: string,
        @Body('newPassword') newPassword: string
    ) {
        if (!token) {
            throw new UnauthorizedException('Reset token is required');
        }
        return this.authService.resetPassword(token, newPassword);
    }

    @Post('resend-verification')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async resendVerification(@Req() req: Request) {
        return this.authService.resendVerificationEmail(req.user['sub']);
    }
} 