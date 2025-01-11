import { Controller, Post, Body, UseGuards, Get, Req, HttpCode, HttpStatus, Delete, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto, @Req() req: Request) {
        return this.authService.login(loginDto, req);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleAuth() { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleAuthCallback(@Req() req) {
        return this.authService.googleLogin(req.user);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req, @Body() refreshTokenDto: RefreshTokenDto) {
        await this.authService.logout(req.user.userId, refreshTokenDto.refreshToken);
        return { message: 'Logged out successfully' };
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @Get('devices')
    @UseGuards(JwtAuthGuard)
    async getDevices(@Req() req) {
        return this.authService.getDevices(req.user.userId, req);
    }

    @Delete('devices/:deviceId')
    @UseGuards(JwtAuthGuard)
    async logoutDevice(@Req() req, @Param('deviceId') deviceId: string) {
        await this.authService.logoutDevice(req.user.userId, deviceId);
        return { message: 'Device logged out successfully' };
    }

    @Delete('devices')
    @UseGuards(JwtAuthGuard)
    async logoutAllDevices(@Req() req) {
        await this.authService.logoutAllDevices(req.user.userId);
        return { message: 'All devices logged out successfully' };
    }
} 