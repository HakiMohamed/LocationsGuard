export const newDeviceNotificationTemplate = (firstName: string, device: any) => `
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
                <p style="color: #bfdbfe; margin-top: 8px; margin-bottom: 0;">Security Alert</p>
            </div>

            <div style="padding: 32px;">
                <!-- Alert Banner -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 20px; margin-right: 12px;">⚠️</span>
                        <p style="color: #92400e; margin: 0; font-size: 14px;">New device detected accessing your account</p>
                    </div>
                </div>

                <p style="color: #4b5563; margin-bottom: 8px;">Hello ${firstName},</p>
                <p style="color: #4b5563; margin-bottom: 24px;">We detected a new login to your LocationGuard account from an unrecognized device.</p>

                <!-- Device Details -->
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Device Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Device Name:</td>
                            <td style="color: #1f2937; font-weight: 500; padding: 8px 0;">${device.deviceName}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Browser:</td>
                            <td style="color: #1f2937; font-weight: 500; padding: 8px 0;">${device.browser}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Location:</td>
                            <td style="color: #1f2937; font-weight: 500; padding: 8px 0;">${device.location?.city || 'Unknown'}, ${device.location?.country || 'Unknown'}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">IP Address:</td>
                            <td style="color: #1f2937; font-weight: 500; padding: 8px 0;">${device.network.ip}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Time:</td>
                            <td style="color: #1f2937; font-weight: 500; padding: 8px 0;">${new Date(device.lastLogin).toLocaleString()}</td>
                        </tr>
                    </table>
                </div>

                <!-- Security Warning -->
                <div style="background-color: #fef2f2; border-radius: 8px; padding: 24px;">
                    <h3 style="color: #991b1b; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">If This Wasn't You</h3>
                    <ul style="color: #dc2626; margin: 0; padding-left: 24px;">
                        <li style="margin-bottom: 8px;">Change your password immediately</li>
                        <li style="margin-bottom: 8px;">Enable two-factor authentication</li>
                        <li style="margin-bottom: 8px;">Review your recent account activity</li>
                        <li style="margin-bottom: 8px;">Contact our support team</li>
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