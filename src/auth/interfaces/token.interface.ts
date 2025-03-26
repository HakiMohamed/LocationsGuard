import { UserRole } from '../enums/role.enum';

export interface TokenPayload {
    sub: string;
    email: string;
    role?: UserRole;
}

export interface EmailVerificationPayload extends TokenPayload {
    type: 'email-verification';
}

export interface PasswordResetPayload extends TokenPayload {
    type: 'password-reset';
}

export interface PhoneVerificationPayload extends TokenPayload {
    type: 'phone-verification';
    phoneNumber: string;
}

export interface Tokens {
    access_token: string;
    refresh_token: string;
}