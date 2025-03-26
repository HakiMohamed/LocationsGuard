import { DeviceDto } from './device.dto';

export class UserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    address?: string;
    city?: string;
    drivingLicenseNumber?: string;
    drivingLicenseDate?: string;
    drivingLicenseExpirationDate?: string;
    drivingLicenseImage?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    phoneNumber?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    role: string;
    devices: DeviceDto[];
    createdAt: Date;
    updatedAt: Date;
} 