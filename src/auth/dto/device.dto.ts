import { IsString, IsOptional } from 'class-validator';

export class DeviceDto {
    @IsString()
    @IsOptional()
    deviceId?: string;

    @IsString()
    @IsOptional()
    deviceName?: string;
} 