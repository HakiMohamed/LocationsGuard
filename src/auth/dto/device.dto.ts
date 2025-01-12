import { IsString, IsOptional } from 'class-validator';

export class DeviceDto {
    @IsString()
    @IsOptional()
    deviceId?: string;

    @IsString()
    @IsOptional()
    deviceName?: string;
}

export class DeviceResponseDto {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    browser: string;
    os: string;
    lastLogin: Date;
    lastIp: string;
    isActive: boolean;
}

export class DeviceListResponseDto {
    devices: DeviceResponseDto[];
    total: number;
    active: number;
} 