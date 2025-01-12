import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Device, DeviceSchema } from './device.schema';
import { UserRole } from '../enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, trim: true })
    firstName: string;

    @Prop({ required: true, trim: true })
    lastName: string;

    @Prop({ unique: true, sparse: true, trim: true })
    phoneNumber?: string;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ default: false })
    isPhoneVerified: boolean;

    @Prop({ type: [DeviceSchema], default: [] })
    devices: Device[];

    @Prop({ type: String, enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop({ type: String, required: false })
    avatarUrl?: string;

    @Prop({ type: String, required: false })
    bannerUrl?: string;

    // Pour le tracking
    @Prop({ type: Date })
    lastLogin?: Date;

    @Prop({ type: String })
    lastLoginIp?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index pour la recherche
UserSchema.index({ email: 1, phoneNumber: 1 });

// Méthode pour masquer les champs sensibles
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
}; 