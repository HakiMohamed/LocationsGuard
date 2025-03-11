import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsService } from './sms.service';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ])
    ],
    providers: [SmsService],
    exports: [SmsService]
})
export class SmsModule { } 