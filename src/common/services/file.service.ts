import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

@Injectable()
export class FileService {
    private readonly baseUploadPath = './uploads';

    constructor() {
        // Créer les dossiers nécessaires
        this.ensureDirectoryExists(this.baseUploadPath);
        this.ensureDirectoryExists(join(this.baseUploadPath, 'automobiles'));
        this.ensureDirectoryExists(join(this.baseUploadPath, 'categories'));
    }

    private ensureDirectoryExists(path: string): void {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }
    }

    createImageURL(filename: string, folder: string): string {
        if (!filename) return null;
        return `${process.env.API_URL}/uploads/${folder}/${filename}`;
    }

    generateFilename(file: Express.Multer.File): string {
        return `${Date.now()}-${Math.round(Math.random() * 1E9)}${extname(file.originalname)}`;
    }

    getDestination(folder: string): string {
        return join(this.baseUploadPath, folder);
    }
} 