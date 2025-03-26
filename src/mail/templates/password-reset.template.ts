export const passwordResetTemplate = (firstName: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Inter', sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background-color: #2563eb; padding: 32px 24px; text-align: center;">
                <h1 style="color: white; font-size: 24px; font-weight: 700; margin: 0;">LocationGuard</h1>
                <p style="color: #bfdbfe; margin-top: 8px; margin-bottom: 0;">Password Reset Request</p>
            </div>

            <div style="padding: 32px;">
                <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin-bottom: 16px;">Reset Your Password</h2>
                <p style="color: #4b5563; margin-bottom: 8px;">Hello ${firstName},</p>
                <p style="color: #4b5563; margin-bottom: 24px;">We received a request to reset your password for your LocationGuard account. Click the button below to create a new password:</p>

                <div style="text-align: center; margin-bottom: 32px;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 32px; 
                              text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                        Reset Password
                    </a>
                </div>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Or copy this link to your browser:</p>
                    <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${resetUrl}</p>
                </div>

                <!-- Security Notes -->
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 24px;">
                    <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 24px;">
                        <li style="margin-bottom: 8px;">This link will expire in 1 hour</li>
                        <li style="margin-bottom: 8px;">If you didn't request this reset, please ignore this email</li>
                        <li style="margin-bottom: 8px;">For security, this link can only be used once</li>
                    </ul>
                </div>
            </div>

            <div style="background-color: #f9fafb; padding: 16px 32px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LocationGuard. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`; 