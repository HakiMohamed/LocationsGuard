import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    drivingLicenseNumber?: string;

    @IsString()
    @IsOptional()
    drivingLicenseDate?: string;

    @IsString()
    @IsOptional()
    drivingLicenseExpirationDate?: string;

    @IsString()
    @IsOptional()   
    drivingLicenseImage?: string;
} 