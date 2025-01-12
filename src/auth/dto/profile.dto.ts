import { UserRole } from '../enums/role.enum';

export class DeviceDto {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    browser: string;
    os: string;
    lastLogin: Date;
    lastLoginFormatted: string;
    lastIp: string;
    isCurrentDevice: boolean;
}

export class UserProfileDto {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: Date;
    avatarUrl?: string;
    bannerUrl?: string;
    role: string;
}

export class ProfileResponseDto {
    user: UserProfileDto;
} 