import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from '../schemas/user.schema';
import { DeviceResponseDto, DeviceListResponseDto } from '../dto/device.dto';
import { FingerprintService } from './fingerprint.service';
import { generateDeviceId } from '../../shared/utils/code.utils';

@Injectable()
export class DeviceService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private fingerprintService: FingerprintService
    ) { }

    async handleLoginDevice(
        user: UserDocument,
        refreshToken: string,
        req: Request
    ): Promise<DeviceResponseDto> {
        console.log('=== Handling Login Device ===');
        console.log('Device info from frontend:', req.body);
        const deviceInfo = await this.fingerprintService.parseDeviceInfo(req);
        const fingerprint = await this.fingerprintService.generateSimpleFingerprint(req);

        const existingDevice = user.devices?.find(device =>
            device.fingerprint === fingerprint && device.isActive
        );

        const deviceData = {
            deviceId: existingDevice?.deviceId || generateDeviceId(),
            name: deviceInfo.deviceName,
            type: deviceInfo.deviceType,
            ip: deviceInfo.ip,
            isActive: true,
            lastLogin: new Date(),
            fingerprint,
            refreshToken
        };

        if (existingDevice) {
            await this.userModel.updateOne(
                {
                    _id: user._id,
                    'devices.fingerprint': fingerprint
                },
                {
                    $set: {
                        'devices.$': deviceData
                    }
                }
            );
        } else {
            await this.userModel.updateOne(
                { _id: user._id },
                { $push: { devices: deviceData } }
            );
        }

        const { refreshToken: _, fingerprint: __, ...deviceResponse } = deviceData;
        return deviceResponse as DeviceResponseDto;
    }

    async getDevices(userId: string | any): Promise<DeviceListResponseDto> {
        const actualUserId = typeof userId === 'object' ? userId.sub : userId;

        const user = await this.userModel.findById(actualUserId)
            .select('devices');

        if (!user) throw new NotFoundException('User not found');

        const devices = user.devices.map(device => ({
            deviceId: device.deviceId,
            name: device.name,
            type: device.type,
            ip: device.ip,
            isActive: device.isActive,
            lastLogin: device.lastLogin
        }));

        return {
            devices,
            total: devices.length,
            active: devices.filter(d => d.isActive).length
        };
    }

    async getDeviceById(userId: string | any, deviceId: string): Promise<DeviceResponseDto> {
        const actualUserId = typeof userId === 'object' ? userId.sub : userId;

        const user = await this.userModel.findOne({
            _id: actualUserId,
            'devices.deviceId': deviceId
        });

        if (!user) throw new NotFoundException('Device not found');

        const device = user.devices.find(d => d.deviceId === deviceId);
        const { refreshToken: _, fingerprint: __, ...deviceData } = device;
        return deviceData;
    }

    async deactivateDevice(userId: string | any, deviceId: string): Promise<void> {
        console.log('=== Deactivating Device - Detailed Debug ===');
        console.log('UserId:', userId);
        console.log('DeviceId:', deviceId);

        // Extraire le bon userId depuis le token JWT
        const actualUserId = typeof userId === 'object' && userId.sub ? userId.sub.toString() : userId.toString();
        console.log('Actual UserId:', actualUserId);

        // Vérifier l'état avant la mise à jour
        const beforeUser = await this.userModel.findOne({
            _id: actualUserId,
            'devices.deviceId': deviceId
        });
        console.log('Device state BEFORE update:', beforeUser?.devices.find(d => d.deviceId === deviceId));

        // Effectuer la mise à jour
        const result = await this.userModel.updateOne(
            {
                _id: actualUserId,
                'devices.deviceId': deviceId
            },
            {
                $set: {
                    'devices.$.isActive': false,
                    'devices.$.refreshToken': null,
                    'devices.$.lastLogout': new Date()
                }
            }
        );

        console.log('MongoDB update result:', {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            acknowledged: result.acknowledged
        });

        // Vérifier l'état après la mise à jour
        const afterUser = await this.userModel.findOne({
            _id: actualUserId,
            'devices.deviceId': deviceId
        });
        
        const updatedDevice = afterUser?.devices.find(d => d.deviceId === deviceId);
        console.log('Device state AFTER update:', updatedDevice);

        if (result.matchedCount === 0) {
            console.error('No matching device found for deactivation');
            throw new NotFoundException('Device not found');
        }

        if (result.modifiedCount === 0) {
            console.warn('Device found but no modifications were made');
            throw new NotFoundException('Failed to deactivate device');
        }

        // Vérifier si le device a bien été désactivé
        if (updatedDevice && updatedDevice.isActive === true) {
            console.error('Device is still active after update!');
            throw new Error('Failed to deactivate device');
        }

        console.log('=== Device Deactivation Complete ===');
    }

    async deactivateAllDevices(userId: string | any, exceptCurrent?: boolean): Promise<void> {
        const actualUserId = typeof userId === 'object' ? userId.sub : userId;

        if (exceptCurrent) {
            await this.userModel.updateOne(
                { _id: actualUserId },
                {
                    $set: {
                        'devices.$[device].isActive': false,
                        'devices.$[device].refreshToken': null,
                        'devices.$[device].lastLogout': new Date()
                    }
                },
                {
                    arrayFilters: [{ 'device.isActive': true }]
                }
            );
        } else {
            await this.userModel.updateOne(
                { _id: actualUserId },
                {
                    $set: {
                        'devices.$[].isActive': false,
                        'devices.$[].refreshToken': null,
                        'devices.$[].lastLogout': new Date()
                    }
                }
            );
        }
    }

    async updateDeviceRefreshToken(
        userId: string,
        deviceId: string,
        newRefreshToken: string
    ): Promise<void> {
        await this.userModel.updateOne(
            {
                _id: userId,
                'devices.deviceId': deviceId
            },
            {
                $set: {
                    'devices.$.refreshToken': newRefreshToken,
                    'devices.$.lastLogin': new Date()
                }
            }
        );
    }

    async updateDeviceInfo(
        userId: string | any,
        deviceId: string,
        req: Request
    ): Promise<DeviceResponseDto> {
        const actualUserId = typeof userId === 'object' ? userId.sub : userId;
        const deviceInfo = await this.fingerprintService.parseDeviceInfo(req);

        const user = await this.userModel.findOneAndUpdate(
            {
                _id: actualUserId,
                'devices.deviceId': deviceId
            },
            {
                $set: {
                    'devices.$.lastLogin': new Date(),
                    'devices.$.lastIp': deviceInfo.ip,
                    'devices.$.name': deviceInfo.deviceName,
                    'devices.$.type': deviceInfo.deviceType,
                    'devices.$.browser': deviceInfo.browser,
                    'devices.$.os': deviceInfo.os
                },
                $addToSet: { 'devices.$.knownIps': deviceInfo.ip }
            },
            { new: true }
        );

        if (!user) throw new NotFoundException('Device not found');

        const device = user.devices.find(d => d.deviceId === deviceId);
        const { refreshToken: _, fingerprint: __, ...deviceData } = device;
        return deviceData;
    }

    async getCurrentDeviceFingerprint(req: Request): Promise<string> {
        return this.fingerprintService.generateSimpleFingerprint(req);
    }

    async getCurrentDevice(userId: string | any, req: Request): Promise<any> {
        console.log('=== Getting Current Device - Debug ===');
        console.log('Raw userId:', userId);
        console.log('Type of userId:', typeof userId);
        console.log('Request user:', req.user);

        let actualUserId;
        if (typeof userId === 'object' && userId.sub) {
            actualUserId = userId.sub.toString();
            console.log('Using sub from object:', actualUserId);
        } else {
            actualUserId = userId.toString();
            console.log('Using userId directly:', actualUserId);
        }

        console.log('Final actualUserId:', actualUserId);
        
        const fingerprint = await this.fingerprintService.generateSimpleFingerprint(req);
        console.log('Current fingerprint:', fingerprint);

        const user = await this.userModel.findById(actualUserId);
        if (!user) {
            console.log('No user found with id:', actualUserId);
            throw new NotFoundException('User not found');
        }

        console.log('Found user:', {
            userId: user._id,
            deviceCount: user.devices?.length
        });

        const currentDevice = user.devices?.find(device => 
            device.fingerprint === fingerprint && device.isActive
        );

        console.log('Found device:', currentDevice);
        return currentDevice;
    }

    async removeDevice(userId: string | any, deviceId: string): Promise<void> {
        console.log('=== Removing Device - Detailed Debug ===');
        console.log('Raw UserId:', userId);
        console.log('Type of userId:', typeof userId);
        console.log('Has sub property:', 'sub' in userId);
        console.log('Sub value:', userId.sub);
        console.log('Type of sub:', typeof userId.sub);
        console.log('DeviceId:', deviceId);

        try {
            // Extraire le bon userId depuis le token JWT
            let actualUserId;
            if (typeof userId === 'object' && userId.sub) {
                actualUserId = userId.sub.toString();
                console.log('Using sub from object:', actualUserId);
            } else {
                actualUserId = userId.toString();
                console.log('Using userId directly:', actualUserId);
            }

            console.log('Final actualUserId:', actualUserId);
            console.log('Type of actualUserId:', typeof actualUserId);

            // Vérifier l'état avant la mise à jour
            console.log('Attempting to find user with _id:', actualUserId);
            const beforeUser = await this.userModel.findOne({
                _id: actualUserId,
                'devices.deviceId': deviceId
            });
            
            if (beforeUser) {
                console.log('Found user before update:', {
                    userId: beforeUser._id,
                    deviceCount: beforeUser.devices?.length,
                    targetDevice: beforeUser.devices?.find(d => d.deviceId === deviceId)
                });
            } else {
                console.log('No user found before update');
            }

            // Effectuer la mise à jour
            console.log('Attempting update with _id:', actualUserId);
            const result = await this.userModel.updateOne(
                { _id: actualUserId },
                {
                    $pull: {
                        devices: { deviceId: deviceId }
                    }
                }
            );

            console.log('MongoDB update result:', {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                acknowledged: result.acknowledged
            });

            // Vérification finale
            const afterUser = await this.userModel.findOne({
                _id: actualUserId,
                'devices.deviceId': deviceId
            });

            if (afterUser) {
                console.log('User state after update:', {
                    userId: afterUser._id,
                    deviceCount: afterUser.devices?.length,
                    targetDevice: afterUser.devices?.find(d => d.deviceId === deviceId)
                });
            } else {
                console.log('No user found after update');
            }

            if (result.matchedCount === 0) {
                throw new NotFoundException('User not found');
            }

            if (result.modifiedCount === 0) {
                throw new NotFoundException('Device not found');
            }

            console.log('=== Device Removal Complete ===');
        } catch (error) {
            console.error('Error in removeDevice:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}