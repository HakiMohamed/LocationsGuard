import { DeviceType } from '../enums/device-type.enum';

export interface DeviceInfo {
    deviceName: string;
    deviceType: string;
    browser: string;
    os: string;
    ip: string;
} 