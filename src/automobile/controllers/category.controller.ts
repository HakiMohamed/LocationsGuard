import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, FileTypeValidator } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../../common/services/file.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService,
        private readonly fileService: FileService
    ) {}

    @Post()
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: './uploads/categories',
            filename: (req, file, cb) => {
                const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extname(file.originalname)}`;
                cb(null, filename);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new Error('Only image files are allowed!'), false);
            }
            cb(null, true);
        }
    }))
    async create(
        @Body() createCategoryDto: CreateCategoryDto,
        @UploadedFile(new ParseFilePipe({
            validators: [
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
            ],
            fileIsRequired: false,
        })) file?: Express.Multer.File
    ) {
      
        return this.categoryService.create(createCategoryDto, file);
    }

    @Get()
    findAll() {
        return this.categoryService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoryService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: './uploads/categories',
            filename: (req, file, cb) => {
                const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extname(file.originalname)}`;
                cb(null, filename);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new Error('Only image files are allowed!'), false);
            }
            cb(null, true);
        }
    }))
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
        @UploadedFile(new ParseFilePipe({
            validators: [
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
            ],
            fileIsRequired: false,
        })) file?: Express.Multer.File
    ) {
        console.log('Controller - Received update request for ID:', id);
        return this.categoryService.update(id, updateCategoryDto, file);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.categoryService.remove(id);
    }
} 