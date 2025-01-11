import { IsEmail, IsString, IsOptional, IsPhoneNumber, MinLength } from 'class-validator';

export class LoginDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsPhoneNumber()
    phoneNumber?: string;

    @IsString()
    @MinLength(6)
    password: string;
}

export class RegisterDto extends LoginDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;
} 