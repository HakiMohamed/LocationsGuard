import { UserRole } from '../enums/role.enum';
import { DeviceResponseDto } from '../dto/device.dto';

export interface AuthResponse {
    user: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
        avatarUrl?: string;
    };
    tokens: {
        access_token: string;
        refresh_token: string;
    };
    device: DeviceResponseDto;
}

export interface VerificationResponse {
    message: string;
}

export interface TokenResponse {
    tokens: {
        access_token: string;
        refresh_token: string;
    };
}

export interface DeviceListResponse {
    devices: DeviceResponseDto[];
    total: number;
    active: number;
}