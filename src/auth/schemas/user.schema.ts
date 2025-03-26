import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../enums/role.enum';
import { Device } from './device.schema';

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    phoneNumber?: string;

    @Prop()
    phoneVerificationCode?: string;

    @Prop()
    phoneVerificationCodeExpires?: Date;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ default: false })
    isPhoneVerified: boolean;

    @Prop({ type: String, enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop()
    avatarUrl?: string;

    @Prop()
    bannerUrl?: string;

    @Prop({ type: [Object], default: [] })
    devices: Device[];

    @Prop()
    lastLogin?: Date;

    @Prop()
    lastLoginIp?: string;


    @Prop()
    drivingLicenseNumber?: string;

    @Prop()
    drivingLicenseDate?: Date;

    @Prop()
    drivingLicenseExpirationDate?: Date;

    @Prop()
    drivingLicenseImage?: string;

    @Prop()
    city?: string;

    @Prop()
    address?: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
