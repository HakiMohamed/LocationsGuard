import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DeviceType } from '../enums/device-type.enum';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
    @Prop({ type: Object })
    location?: {
        city: string;
        country: string;
        latitude?: number;
        longitude?: number;
    };

    @Prop({ required: true })
    deviceId: string;

    @Prop({ required: true })
    deviceName: string;

    @Prop({ type: String, enum: DeviceType, default: DeviceType.UNKNOWN })
    deviceType: DeviceType;

    @Prop()
    browser: string;

    @Prop()
    os: string;

    @Prop()
    cpu: string;

    @Prop()
    screenResolution: string;

    @Prop()
    deviceMemory: string;

    @Prop()
    platform: string;

    @Prop()
    isMobile: boolean;

    @Prop({ required: true })
    lastLogin: Date;

    @Prop({ required: true })
    refreshToken: string;

    @Prop({ required: true })
    lastIp: string;

    @Prop({ type: [String], default: [] })
    knownIps: string[];

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ required: true })
    fingerprint: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device); 