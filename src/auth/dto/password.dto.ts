import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RequestPasswordResetDto {
    @IsString()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    newPassword: string;
} 