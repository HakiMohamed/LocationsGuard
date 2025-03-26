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
        
        // Extraire le bon userId depuis le token JWT
        const actualUserId = typeof userId === 'object' && userId.sub ? userId.sub.toString() : userId.toString();
      

        // Vérifier l'état avant la mise à jour
        const beforeUser = await this.userModel.findOne({
            _id: actualUserId,
            'devices.deviceId': deviceId
        });
       
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

      

        // Vérifier l'état après la mise à jour
        const afterUser = await this.userModel.findOne({
            _id: actualUserId,
            'devices.deviceId': deviceId
        });
        
        const updatedDevice = afterUser?.devices.find(d => d.deviceId === deviceId);

        if (result.matchedCount === 0) {
            throw new NotFoundException('Device not found');
        }

        if (result.modifiedCount === 0) {
            throw new NotFoundException('Failed to deactivate device');
        }

        // Vérifier si le device a bien été désactivé
        if (updatedDevice && updatedDevice.isActive === true) {
            throw new Error('Failed to deactivate device');
        }

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
        

        let actualUserId;
        if (typeof userId === 'object' && userId.sub) {
            actualUserId = userId.sub.toString();
        } else {
            actualUserId = userId.toString();
        }

        
        const fingerprint = await this.fingerprintService.generateSimpleFingerprint(req);

        const user = await this.userModel.findById(actualUserId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

      

        const currentDevice = user.devices?.find(device => 
            device.fingerprint === fingerprint && device.isActive
        );

        return currentDevice;
    }

    async removeDevice(userId: string | any, deviceId: string): Promise<void> {
      

        try {
            // Extraire le bon userId depuis le token JWT
            let actualUserId;
            if (typeof userId === 'object' && userId.sub) {
                actualUserId = userId.sub.toString();
            } else {
                actualUserId = userId.toString();
            }

           
            // Vérifier l'état avant la mise à jour
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
           
            throw error;
        }
    }
}