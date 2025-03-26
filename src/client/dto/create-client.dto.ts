import { IsEmail, IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateClientDto {
 
    @IsString()
    @IsOptional()
    id?: string;    

    @IsEmail()
    email: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;


    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    bannerUrl?: string;

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

export class UpdateClientDto extends PartialType(CreateClientDto) {}
