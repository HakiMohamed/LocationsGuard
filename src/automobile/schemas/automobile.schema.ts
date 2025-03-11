import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from './category.schema';

export enum FuelType {
    GASOLINE = 'GASOLINE',
    DIESEL = 'DIESEL',
    ELECTRIC = 'ELECTRIC',
    HYBRID = 'HYBRID',
    PLUG_IN_HYBRID = 'PLUG_IN_HYBRID'
}

export enum TransmissionType {
    MANUAL = 'MANUAL',
    AUTOMATIC = 'AUTOMATIC',
    SEMI_AUTOMATIC = 'SEMI_AUTOMATIC'
}

@Schema({ timestamps: true })
export class Automobile {
    @Prop({ required: true })
    brand: string;

    @Prop({ required: true })
    model: string;

    @Prop({ required: true })
    year: number;

    @Prop({ 
        type: MongooseSchema.Types.ObjectId, 
        ref: 'Category', 
        required: true,
        onDelete: 'CASCADE'
    })
    category: Category;

    @Prop({ required: true })
    dailyRate: number;

    @Prop({ type: String, enum: FuelType, required: true })
    fuelType: FuelType;

    @Prop({ type: String, enum: TransmissionType, required: true })
    transmission: TransmissionType;

    @Prop({ required: true })
    seats: number;

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop([String])
    images?: string[];

    @Prop()
    licensePlate: string;

    @Prop()
    mileage: number;

    @Prop()
    color: string;

    @Prop()
    engineCapacity: number;

    @Prop()
    fuelConsumption: number;

    @Prop()
    features: string[];

    @Prop()
    description?: string;


}

export type AutomobileDocument = Automobile & Document;
export const AutomobileSchema = SchemaFactory.createForClass(Automobile);

