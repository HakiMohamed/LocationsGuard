import { DeviceType } from '../enums/device-type.enum';

export class LocationDto {
    country: string;
    city: string;
    timezone: string;
    latitude: number;
    longitude: number;
    region: string;
}

export class NetworkDto {
    ip: string;
    proxy: boolean;
    vpn: boolean;
}

export class BrowserDetailsDto {
    language: string;
    plugins: string;
    doNotTrack: boolean;
    cookiesEnabled: boolean;
}

export class DeviceResponseDto {
    deviceId: string;
    name: string;
    type: string;
    ip: string;
    isActive: boolean;
    lastLogin: Date;
}

export class DeviceListResponseDto {
    devices: DeviceResponseDto[];
    total: number;
    active: number;
}

export class DeviceDto {
    deviceId: string;
    name: string;
    type: string;
    ip: string;
    isActive: boolean;
    lastLogin: Date;
    fingerprint: string;
}