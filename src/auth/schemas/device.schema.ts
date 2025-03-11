import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Device {
    @Prop({ required: true })
    deviceId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    ip: string;

    @Prop({ required: true, default: true })
    isActive: boolean;

    @Prop({ required: true })
    lastLogin: Date;

    @Prop({ required: true })
    fingerprint: string;

    @Prop()
    refreshToken?: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);


