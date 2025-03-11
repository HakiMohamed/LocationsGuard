export function generateVerificationCode(length: number = 6): string {
    return Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, '0');
}

export function generateDeviceId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 