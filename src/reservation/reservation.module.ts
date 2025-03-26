import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationController } from './controllers/reservation.controller';
import { ReservationService } from './services/reservation.service';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { AutomobileModule } from '../automobile/automobile.module';
import { ClientModule } from '../client/client.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Reservation.name, schema: ReservationSchema }
        ]),
        AutomobileModule,
        ClientModule
    ],
    controllers: [ReservationController],
    providers: [ReservationService],
    exports: [ReservationService]
})
export class ReservationModule {} 