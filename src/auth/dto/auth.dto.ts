import { IsEmail, IsString, MinLength, IsOptional, Matches, IsPhoneNumber, IsUrl, MaxLength, IsObject } from 'class-validator';
import { UserRole } from '../enums/role.enum';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    bannerUrl?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsObject()
    @IsOptional()
    device?: {
      name: string;
      type: string;
      browser: string;
      os: string;
    };
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    bannerUrl?: string;
}

export class ChangePasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}

export class ResetPasswordDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}

export class VerifyPhoneDto {
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;
}

export class InitiatePhoneVerificationDto {
    @IsPhoneNumber()
    phoneNumber: string;
}

export class ResendVerificationDto {
    @IsEmail()
    email: string;
}