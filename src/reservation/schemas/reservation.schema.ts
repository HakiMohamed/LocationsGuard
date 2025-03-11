import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Automobile } from '../../automobile/schemas/automobile.schema';
import { Category } from '../../automobile/schemas/category.schema';

export enum ReservationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

@Schema({ timestamps: true })
export class Reservation {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    client: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Automobile', required: true })
    automobile: Automobile;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true })
    totalPrice: number;

    @Prop({ type: String, enum: ReservationStatus, default: ReservationStatus.PENDING })
    status: ReservationStatus;

    @Prop()
    notes?: string;

    @Prop({ default: false })
    isPaid: boolean;

    @Prop()
    paymentDate?: Date;

    @Prop()
    cancellationReason?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
    category: Category;
}

export type ReservationDocument = Reservation & Document;
export const ReservationSchema = SchemaFactory.createForClass(Reservation); 