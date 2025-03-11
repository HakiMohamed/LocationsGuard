import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
    private s3Client: S3Client;

    constructor(private configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            },
        });
    }

    async uploadFile(file: Buffer, key: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.configService.get('AWS_S3_BUCKET'),
            Key: key,
            Body: file,
            ACL: 'public-read', // Rend le fichier publiquement accessible
        });

        await this.s3Client.send(command);
        return `https://${this.configService.get('AWS_S3_BUCKET')}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
    }

    getFileUrl(key: string): string {
        return `https://${this.configService.get('AWS_S3_BUCKET')}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
    }
} 