import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Automobile } from './automobile.schema';

export enum MaintenanceType {
    ROUTINE = 'ROUTINE',
    REPAIR = 'REPAIR',
    INSPECTION = 'INSPECTION',
    INSURANCE = 'INSURANCE',
    VIGNETTE = 'VIGNETTE',
    OTHER = 'OTHER'
}

export enum MaintenanceStatus {
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

@Schema({ timestamps: true })
export class Maintenance {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Automobile', required: true })
    automobile: Automobile;

    @Prop({ type: String, enum: MaintenanceType, required: true })
    type: MaintenanceType;

    @Prop({ type: String, enum: MaintenanceStatus, default: MaintenanceStatus.PLANNED })
    status: MaintenanceStatus;

    @Prop({ required: true })
    title: string;

    @Prop()
    description?: string;

    @Prop({ required: true })
    scheduledDate: Date;

    @Prop()
    completedDate?: Date;

    @Prop({ required: true })
    cost: number;

    @Prop()
    documents?: string[];

    @Prop()
    nextMaintenanceDate?: Date;

    @Prop()
    mileageAtMaintenance?: number;

    @Prop()
    notificationSent: boolean;
}

export type MaintenanceDocument = Maintenance & Document;
export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance); 