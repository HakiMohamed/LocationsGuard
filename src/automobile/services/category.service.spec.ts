import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { FileService } from '../../common/services/file.service';
import { getModelToken } from '@nestjs/mongoose';
import { Category } from '../schemas/category.schema';
import { Model } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateCategoryDto } from '../dto/category.dto';

describe('CategoryService', () => {
  let service: CategoryService;
  let fileService: FileService;
  let categoryModel: Model<Category>;

  const mockCategoryModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockFileService = {
    createImageURL: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    fileService = module.get<FileService>(FileService);
    categoryModel = module.get<Model<Category>>(getModelToken(Category.name));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a category if found', async () => {
      const mockCategory = { id: '1', name: 'Test Category' };
      mockCategoryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      });

      const result = await service.findOne('1');
      expect(result).toEqual(mockCategory);
      expect(mockCategoryModel.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(mockCategoryModel.findById).toHaveBeenCalledWith('1');
    });

    it('should throw BadRequestException if id is invalid', async () => {
      mockCategoryModel.findById.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(service.findOne('invalid-id')).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' },
      ];
      mockCategoryModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategories),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockCategories);
      expect(mockCategoryModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no categories exist', async () => {
      mockCategoryModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(mockCategoryModel.find).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      const updateDto: UpdateCategoryDto = { name: 'Updated Category' };
      const updatedCategory = { id: '1', ...updateDto };
      
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedCategory),
      });

      const result = await service.update('1', updateDto);
      expect(result).toEqual(updatedCategory);
      expect(mockCategoryModel.findByIdAndUpdate).toHaveBeenCalledWith('1', updateDto, { new: true });
    });

    it('should throw NotFoundException if category to update not found', async () => {
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });

    it('should update category with image URL when file is provided', async () => {
      const updateDto: UpdateCategoryDto = { name: 'Updated Category' };
      const mockFile = { filename: 'test.jpg' } as Express.Multer.File;
      const imageUrl = 'http://example.com/test.jpg';
      const updatedCategory = { id: '1', ...updateDto, imageUrl };

      mockFileService.createImageURL.mockReturnValue(imageUrl);
      mockCategoryModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedCategory),
      });

      const result = await service.update('1', updateDto, mockFile);
      
      expect(result).toEqual(updatedCategory);
      expect(mockFileService.createImageURL).toHaveBeenCalledWith(mockFile.filename, 'categories');
      expect(mockCategoryModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { ...updateDto, imageUrl }, { new: true });
    });
  });

  describe('remove', () => {
    it('should remove a category successfully', async () => {
      mockCategoryModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.remove('1');
      expect(mockCategoryModel.deleteOne).toHaveBeenCalledWith({ _id: '1' });
    });

    it('should throw NotFoundException if category to remove not found', async () => {
      mockCategoryModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(mockCategoryModel.deleteOne).toHaveBeenCalledWith({ _id: '1' });
    });

    it('should throw BadRequestException if delete operation fails', async () => {
      mockCategoryModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Delete failed')),
      });

      await expect(service.remove('1')).rejects.toThrow();
    });
  });
}); 