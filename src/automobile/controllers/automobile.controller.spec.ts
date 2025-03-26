import { Test, TestingModule } from '@nestjs/testing';
import { AutomobileController } from './automobile.controller';
import { AutomobileService } from '../services/automobile.service';
import { ConfigService } from '@nestjs/config';
import { CreateAutomobileDto } from '../dto/create-automobile.dto';
import { UpdateAutomobileDto } from '../dto/update-automobile.dto';

describe('AutomobileController', () => {
  let controller: AutomobileController;
  let service: AutomobileService;

  const mockAutomobileService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateAvailability: jest.fn(),
    findByCategory: jest.fn(),
    getCategoryCount: jest.fn(),
    getMostReservedAutomobiles: jest.fn(),
    getLeastReservedAutomobiles: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomobileController],
      providers: [
        { provide: AutomobileService, useValue: mockAutomobileService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AutomobileController>(AutomobileController);
    service = module.get<AutomobileService>(AutomobileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an automobile', async () => {
      const createDto = new CreateAutomobileDto();
      const mockImages = [{ filename: 'test.jpg' }] as Array<Express.Multer.File>;
      const expectedResult = { success: true, data: { id: '1' } };

      mockAutomobileService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockImages);

      expect(result).toEqual(expectedResult);
      expect(createDto.images).toContain('http://localhost:3000/uploads/automobiles/test.jpg');
    });
  });

  describe('findAll', () => {
    it('should return all automobiles', async () => {
      const expectedResult = { success: true, data: [] };
      mockAutomobileService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMostReservedAutomobiles', () => {
    it('should return most reserved automobiles with default limit', async () => {
      const expectedResult = { success: true, data: [] };
      mockAutomobileService.getMostReservedAutomobiles.mockResolvedValue(expectedResult);

      const result = await controller.getMostReservedAutomobiles();

      expect(result).toEqual(expectedResult);
      expect(mockAutomobileService.getMostReservedAutomobiles).toHaveBeenCalledWith(5);
    });
  });
}); 