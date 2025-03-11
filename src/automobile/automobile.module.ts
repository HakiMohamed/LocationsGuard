import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './controllers/category.controller';
import { AutomobileController } from './controllers/automobile.controller';
import { MaintenanceController } from './controllers/maintenance.controller';
import { CategoryService } from './services/category.service';
import { AutomobileService } from './services/automobile.service';
import { MaintenanceService } from './services/maintenance.service';
import { Category, CategorySchema } from './schemas/category.schema';
import { Automobile, AutomobileSchema } from './schemas/automobile.schema';
import { Maintenance, MaintenanceSchema } from './schemas/maintenance.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { CommonModule } from '../common/common.module';
import { FileService } from '../common/services/file.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Category.name, schema: CategorySchema },
            { name: Automobile.name, schema: AutomobileSchema },
            { name: Maintenance.name, schema: MaintenanceSchema },
            { name: User.name, schema: UserSchema }
        ]),
        AuthModule,
        MailModule,
        SmsModule,
        CommonModule
    ],
    controllers: [
        CategoryController,
        AutomobileController,
        MaintenanceController
    ],
    providers: [
        CategoryService,
        AutomobileService,
        MaintenanceService,
        FileService
    ],
    exports: [
        CategoryService,
        AutomobileService,
        MaintenanceService
    ]
})
export class AutomobileModule {} 