import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, UploadedFiles, Query, BadRequestException } from '@nestjs/common';
import { AutomobileService } from '../services/automobile.service';
import { CreateAutomobileDto } from '../dto/create-automobile.dto';
import { UpdateAutomobileDto } from '../dto/update-automobile.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@Controller('automobiles')
export class AutomobileController {
    constructor(
        private readonly automobileService: AutomobileService,
        private readonly configService: ConfigService, // Inject ConfigService to access environment variables
    ) {}

    @Post()
    @UseInterceptors(FilesInterceptor('images', 10, {
        storage: diskStorage({
            destination: (req, file, callback) => {
                // Dynamically determine the upload directory based on the entity
                const uploadDir = './uploads/automobiles';
                callback(null, uploadDir);
            },
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                const filename = `${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
    }))
    async create(
        @Body() createAutomobileDto: CreateAutomobileDto,
        @UploadedFiles() images: Array<Express.Multer.File>,
    ) {
        if (images && images.length > 0) {
            // Get the base URL from the environment variable
            const appUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
            // Prepend the base URL to the image filenames
            createAutomobileDto.images = images.map(image => `${appUrl}/uploads/automobiles/${image.filename}`);
        }
        
        return this.automobileService.create(createAutomobileDto);
    }

    @Put(':id')
    @UseInterceptors(FilesInterceptor('images', 10, {
        storage: diskStorage({
            destination: (req, file, callback) => {
                // Dynamically determine the upload directory based on the entity
                const uploadDir = './uploads/automobiles';
                callback(null, uploadDir);
            },
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                const filename = `${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
    }))
    async update(
        @Param('id') id: string,
        @Body() updateAutomobileDto: UpdateAutomobileDto,
        @UploadedFiles() images: Array<Express.Multer.File>,
    ) {
        if (images && images.length > 0) {
            // Get the base URL from the environment variable
            const appUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
            // Prepend the base URL to the image filenames
            updateAutomobileDto.images = images.map(image => `${appUrl}/uploads/automobiles/${image.filename}`);
        }
        return this.automobileService.update(id, updateAutomobileDto);
    }

    @Get()
    async findAll() {
        return this.automobileService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.automobileService.findOne(id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.automobileService.remove(id);
    }


    @Put(':id/availability')
    async updateAvailability(@Param('id') id: string, @Body() updateAutomobileDto: UpdateAutomobileDto) {
        return this.automobileService.updateAvailability(id, updateAutomobileDto);
    }

    @Get('category/:categoryId')
    async findByCategory(@Param('categoryId') categoryId: string) {
        return this.automobileService.findByCategory(categoryId);
    }

    @Get('category/:categoryId/count')
    async getCategoryCount(@Param('categoryId') categoryId: string) {
        return this.automobileService.getCategoryCount(categoryId);
    }

    @Get('stats/most-reserved')
    async getMostReservedAutomobiles(@Query('limit') limitStr?: string) {
        const limit = limitStr ? parseInt(limitStr, 10) : 5;
        if (isNaN(limit) || limit <= 0) {
            throw new BadRequestException('Limit must be a positive number');
        }
        return this.automobileService.getMostReservedAutomobiles(limit);
    }

    @Get('stats/least-reserved')
    async getLeastReservedAutomobiles(@Query('limit') limitStr?: string) {
        const limit = limitStr ? parseInt(limitStr, 10) : 5;
        if (isNaN(limit) || limit <= 0) {
            throw new BadRequestException('Limit must be a positive number');
        }
        return this.automobileService.getLeastReservedAutomobiles(limit);
    }
}