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
    ) {}

    async create(createCategoryDto: CreateCategoryDto, file?: Express.Multer.File): Promise<Category> {
        try {
            let imageUrl: string | undefined;
            if (file) {
                imageUrl = this.fileService.createImageURL(file.filename, 'categories');
            }

            const categoryData = {
                ...createCategoryDto,
                imageUrl
            };

            const category = new this.categoryModel(categoryData);
            const savedCategory = await category.save();
            return savedCategory;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Category name already exists');
            }
            throw error;
        }
    }

    async findAll(): Promise<Category[]> {
        return await this.categoryModel.find().exec();
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryModel.findById(id).exec();
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto, file?: Express.Multer.File): Promise<Category> {
        if (file) {
            const imageUrl = this.fileService.createImageURL(file.filename, 'categories');
            updateCategoryDto.imageUrl = imageUrl;
        }

        const category = await this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true })
            .exec();
        
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async remove(id: string): Promise<void> {
        const result = await this.categoryModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
    }
}