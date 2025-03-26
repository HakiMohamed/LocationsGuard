import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Connection, Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from './category.schema';
import { ReservationSchema } from '../../reservation/schemas/reservation.schema';

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

export enum InsuranceType {
    TIERS_SIMPLE = 'TIERS_SIMPLE',           // Responsabilité Civile de base
    TIERS_ETENDU = 'TIERS_ETENDU',          // RC + Incendie + Vol
    TOUS_RISQUES = 'TOUS_RISQUES',          // Couverture complète
    TOUS_RISQUES_PLUS = 'TOUS_RISQUES_PLUS' // Couverture complète + options supplémentaires
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

    @Prop()
    lastVidangeDate: Date;

    @Prop({ 
        type: String, 
        enum: InsuranceType, 
        required: true, 
        default: InsuranceType.TIERS_SIMPLE 
    })
    insuranceType: InsuranceType;
}

export type AutomobileDocument = Automobile & Document;
export const AutomobileSchema = SchemaFactory.createForClass(Automobile);

// Correction du middleware de pré-suppression
AutomobileSchema.pre('deleteOne', { document: false, query: true }, async function() {
    const automobileId = this.getQuery()['_id'];
    const connection: Connection = this.model.db;
    const ReservationModel = connection.model('Reservation', ReservationSchema);
    await ReservationModel.deleteMany({ automobile: automobileId }).exec();
});
