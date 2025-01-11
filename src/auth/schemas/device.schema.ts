import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
    @Prop({ required: true })
    deviceId: string;  // Identifiant unique généré côté client

    @Prop({ required: true })
    deviceName: string;

    @Prop()
    deviceType: string;

    @Prop()
    browser: string;

    @Prop()
    os: string;

    @Prop()
    lastLogin: Date;

    @Prop()
    refreshToken: string;

    @Prop()
    lastIp: string;  // Dernier IP connu

    @Prop({ type: [String] })
    knownIps: string[];  // Historique des IPs
}

export const DeviceSchema = SchemaFactory.createForClass(Device); 