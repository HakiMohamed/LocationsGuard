import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';
import { DeviceType } from '../enums/device-type.enum';
import { DeviceInfo } from '../interfaces/device-info.interface';

@Injectable()
export class FingerprintService {
    async generateSimpleFingerprint(req: Request): Promise<string> {
        const parser = new UAParser(req.headers['user-agent']);
        const result = parser.getResult();

        const fingerprintData = {
            ua: req.headers['user-agent'],
            ip: req.headers['x-forwarded-for'] || req.ip,
            browser: `${result.browser.name}${result.browser.version}`,
            os: `${result.os.name}${result.os.version}`
        };

        return crypto
            .createHash('sha256')
            .update(JSON.stringify(fingerprintData))
            .digest('hex');
    }

    private getClientIp(req: Request): string {
        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor) {
            return Array.isArray(forwardedFor) 
                ? forwardedFor[0] 
                : forwardedFor.split(',')[0].trim();
        }
        return req.ip || '0.0.0.0';
    }

    async parseDeviceInfo(req: Request): Promise<DeviceInfo> {
        const parser = new UAParser(req.headers['user-agent']);
        const result = parser.getResult();

        return {
            deviceName: this.getDeviceName(result),
            deviceType: this.getDeviceType(result),
            browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`,
            os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`,
            ip: this.getClientIp(req)
        };
    }

    private getDeviceName(result: UAParser.IResult): string {
        const parts = [];

        if (result.device.vendor) parts.push(result.device.vendor);
        if (result.device.model) parts.push(result.device.model);
        if (result.os.name) parts.push(`(${result.os.name})`);

        return parts.length > 0 ? parts.join(' ') : 'Unknown Device';
    }

    private getDeviceType(result: UAParser.IResult): DeviceType {
        if (!result.device.type) {
            return DeviceType.DESKTOP;
        }
        switch (result.device.type.toLowerCase()) {
            case 'mobile':
                return DeviceType.MOBILE;
            case 'tablet':
                return DeviceType.TABLET;
            default:
                return DeviceType.DESKTOP;
        }
    }
} 