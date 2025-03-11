import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [
        ConfigModule,
        SharedModule,
    ],
    providers: [MailService],
    exports: [MailService]
})
export class MailModule { } 