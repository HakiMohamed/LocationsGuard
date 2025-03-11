import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { FileService } from '../../common/services/file.service';

@Injectable()
export class CategoryService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        private readonly fileService: FileService
    ) {
        console.log('Service - CategoryService initialized');
    }

    async create(createCategoryDto: CreateCategoryDto, file?: Express.Multer.File): Promise<Category> {
        try {
            console.log('Service - Creating category with DTO:', createCategoryDto);
            console.log('Service - Received file:', file);

            let imageUrl: string | undefined;
            if (file) {
                imageUrl = this.fileService.createImageURL(file.filename, 'categories');
                console.log('Service - Generated image URL:', imageUrl);
            }

            const categoryData = {
                ...createCategoryDto,
                imageUrl
            };

            console.log('Service - Final category data:', categoryData);
            const category = new this.categoryModel(categoryData);
            const savedCategory = await category.save();
            console.log('Service - Saved category:', savedCategory);
            return savedCategory;
        } catch (error) {
            console.error('Service - Error creating category:', error);
            if (error.code === 11000) {
                throw new ConflictException('Category name already exists');
            }
            throw error;
        }
    }

    async findAll(): Promise<Category[]> {
        console.log('Service - Finding all categories');
        const categories = await this.categoryModel.find().exec();
        console.log('Service - Found categories:', categories);
        return categories;
    }

    async findOne(id: string): Promise<Category> {
        console.log('Category Service - Finding category with ID:', id);
        const category = await this.categoryModel.findById(id).exec();
        if (!category) {
            console.log('Category Service - Category not found with ID:', id);
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        console.log('Category Service - Found category:', category);
        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto, file?: Express.Multer.File): Promise<Category> {
        console.log('Service - Updating category with ID:', id);
        console.log('Service - Update DTO:', updateCategoryDto);
        console.log('Service - Received file:', file);

        if (file) {
            const imageUrl = this.fileService.createImageURL(file.filename, 'categories');
            console.log('Service - Generated image URL:', imageUrl);
            updateCategoryDto.imageUrl = imageUrl;
        }

        console.log('Service - Final update data:', updateCategoryDto);
        const category = await this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true })
            .exec();
        
        if (!category) {
            console.log('Service - Category not found after update with ID:', id);
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        console.log('Service - Updated category:', category);
        return category;
    }

    async remove(id: string): Promise<void> {
        console.log('Service - Removing category with ID:', id);
        const result = await this.categoryModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            console.log('Service - Category not found for removal with ID:', id);
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        console.log('Service - Successfully removed category with ID:', id);
    }
} 