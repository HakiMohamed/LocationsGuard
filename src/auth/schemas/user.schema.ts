import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Device } from './device.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({ unique: true, sparse: true })
    phoneNumber?: string;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ default: false })
    isPhoneVerified: boolean;

    @Prop({ type: [String], default: [] })
    refreshTokens: string[];

    @Prop({ type: [Object] })
    devices: Device[];
}

export const UserSchema = SchemaFactory.createForClass(User); 