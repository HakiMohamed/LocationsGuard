import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './controllers/category.controller';
import { AutomobileController } from './controllers/automobile.controller';
import { CategoryService } from './services/category.service';
import { AutomobileService } from './services/automobile.service';
import { Category, CategorySchema } from './schemas/category.schema';
import { Automobile, AutomobileSchema } from './schemas/automobile.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { CommonModule } from '../common/common.module';
import { FileService } from '../common/services/file.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Reservation, ReservationSchema } from '../reservation/schemas/reservation.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Category.name, schema: CategorySchema },
            { name: Automobile.name, schema: AutomobileSchema },
            { name: User.name, schema: UserSchema },
            { name: Reservation.name, schema: ReservationSchema }
        ]),
        ScheduleModule.forRoot(), // Pour les tâches planifiées
        AuthModule,
        MailModule,
        SmsModule,
        CommonModule
    ],
    controllers: [
        CategoryController,
        AutomobileController,
    ],
    providers: [
        CategoryService,
        AutomobileService,
        FileService
    ],
    exports: [
        CategoryService,
        AutomobileService,
    ]
})
export class AutomobileModule {} 