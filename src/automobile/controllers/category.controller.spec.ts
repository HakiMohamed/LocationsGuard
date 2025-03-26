import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from '../services/category.service';
import { FileService } from '../../common/services/file.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockCategoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockFileService = {
    createImageURL: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createDto = new CreateCategoryDto();
      const mockFile = { filename: 'test.jpg' } as Express.Multer.File;
      const expectedResult = { id: '1', ...createDto };

      mockCategoryService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockFile);

      expect(result).toEqual(expectedResult);
      expect(mockCategoryService.create).toHaveBeenCalledWith(createDto, mockFile);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const expectedResult = [{ id: '1', name: 'Category 1' }];
      mockCategoryService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
    });
  });
}); 