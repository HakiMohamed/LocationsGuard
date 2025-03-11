export const verificationEmailTemplate = (firstName: string, verificationUrl: string, logoUrl: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%); font-family: 'Plus Jakarta Sans', sans-serif;">
    <div style="width: 100%; margin: 0 auto; padding: 20px;">
        <!-- Main Container -->
        <div style="background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -1px rgba(0, 0, 0, 0.2);">
            <!-- Modern Header with Gradient -->
            <div style="background: linear-gradient(145deg, #000000 0%, #1a1a1a 100%); padding: 48px 24px; text-align: center; position: relative;">
                <!-- Decorative Elements -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%);"></div>
                
                <div style="position: relative;">
                    <!-- Logo Container -->
                    <div style="margin-bottom: 20px;">
                        <img src="${logoUrl}" alt="LocationGuard" style="width: 200px; height: auto;">
                    </div>
                    <p style="color: #ff6b00; margin: 0; font-size: 18px; font-weight: 500; letter-spacing: 0.5px;">Car Services</p>
                </div>
            </div>

            <!-- Content Section -->
            <div style="padding: 48px 32px;">
                <!-- Icon and Title -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="width: 90px; height: 90px; margin: 0 auto 24px; background: linear-gradient(145deg, #ff6b00 0%, #ff8533 100%); border-radius: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 24px -8px rgba(255, 107, 0, 0.3);">
                        <span style="font-size: 40px;">✨</span>
                    </div>
                    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin: 0 0 12px;">Welcome Aboard!</h2>
                    <p style="color: #4a4a4a; font-size: 18px; margin: 0; font-weight: 500;">Let's verify your email address</p>
                </div>

                <!-- Greeting & Message -->
                <div style="background: linear-gradient(145deg, #f8f8f8 0%, #f1f1f1 100%); border-radius: 16px; padding: 32px; margin-bottom: 40px;">
                    <p style="color: #2d2d2d; margin: 0; font-size: 17px; line-height: 1.7;">Hello ${firstName},</p>
                    <p style="color: #2d2d2d; margin: 16px 0 0; font-size: 17px; line-height: 1.7;">Please verify your email address to complete your account setup.</p>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: linear-gradient(145deg, #ff6b00 0%, #ff8533 100%); 
                              color: white; padding: 20px 48px; text-decoration: none; font-weight: 600; 
                              border-radius: 16px; font-size: 18px; transition: all 0.3s ease;
                              box-shadow: 0 12px 24px -8px rgba(255, 107, 0, 0.4);">
                        Verify My Email
                    </a>
                </div>

                <!-- Alternative Link -->
                <div style="background: #ffffff; border: 1px solid #e2e2e2; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <p style="color: #4a4a4a; font-size: 15px; margin: 0 0 12px;">Or copy this verification link:</p>
                    <p style="color: #ff6b00; font-size: 14px; margin: 0; word-break: break-all; font-family: monospace; background: #f8f8f8; padding: 16px; border-radius: 12px; border: 1px solid #e2e2e2;">${verificationUrl}</p>
                </div>

                <!-- Security Notes -->
                <div style="margin-top: 40px; background: linear-gradient(145deg, #f8f8f8 0%, #f1f1f1 100%); border-radius: 16px; padding: 24px;">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                        <span style="font-size: 24px; margin-right: 14px;">🔒</span>
                        <p style="color: #2d2d2d; margin: 0; font-weight: 600; font-size: 16px;">Security Note</p>
                    </div>
                    <p style="color: #4a4a4a; font-size: 15px; margin: 0; line-height: 1.6;">
                        This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
                    </p>
                </div>
            </div>

            <!-- Modern Footer -->
            <div style="background: linear-gradient(145deg, #000000 0%, #1a1a1a 100%); padding: 32px; text-align: center;">
                <p style="color: #ffffff; font-size: 15px; margin: 0 0 8px;">Questions? Contact our support team</p>
                <p style="color: #808080; font-size: 13px; margin: 0;">© ${new Date().getFullYear()} LocationGuard. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;