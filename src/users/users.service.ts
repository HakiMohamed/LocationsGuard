import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {}

    async getProfile(userId: string) {
        const user = await this.userModel.findById(userId)
            .select('-password -devices -__v')
            .lean();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        try {
            const updatedUser = await this.userModel.findByIdAndUpdate(
                userId,
                { $set: updateProfileDto },
                { new: true }
            ).select('-password -devices -__v');

            return updatedUser;
        } catch (error) {
            throw new BadRequestException('Failed to update profile');
        }
    }

    async deleteProfile(userId: string) {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userModel.findByIdAndDelete(userId);
        return { message: 'Profile deleted successfully' };
    }

    async getUserById(userId: string) {
        const user = await this.userModel.findById(userId)
            .select('-password -devices -__v')
            .lean();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }
} 