import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { DeviceService } from './services/device.service';
import { VerificationService } from './services/verification.service';
import { FingerprintService } from './services/fingerprint.service';

import { User, UserSchema } from './schemas/user.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: `${configService.get('ACCESS_TOKEN_EXPIRATION')}m`,
                },
            }),
        }),
        ConfigModule,
        MailModule,
        SmsModule
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        TokenService,
        DeviceService,
        VerificationService,
        FingerprintService,
        JwtStrategy,
        JwtRefreshStrategy
    ],
    exports: [AuthService, TokenService]
})
export class AuthModule { }