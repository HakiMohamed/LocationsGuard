export class RegisterResponseDto {
    user: {
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
} 