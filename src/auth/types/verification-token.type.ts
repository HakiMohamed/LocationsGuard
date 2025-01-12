export type EmailVerificationPayload = {
    sub: string;
    email: string;
    type: 'email-verification';
};

export type PasswordResetPayload = {
    sub: string;
    email: string;
    type: 'password-reset';
}; 