import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { SmsModule } from './sms/sms.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import * as cookieParser from 'cookie-parser';
import { AutomobileModule } from './automobile/automobile.module';
import { MulterModule } from '@nestjs/platform-express';
import { ClientModule } from './client/client.module';
import { UsersModule } from './users/users.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            
            inject: [ConfigService],
        }),
        AuthModule,
        MailModule,
        SmsModule,
        AutomobileModule,
        MulterModule.register({
            dest: './uploads',
        }),
        ClientModule,
        UsersModule,
        ReservationModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(cookieParser())
            .forRoutes('*');
    }
}
