import { Test, TestingModule } from '@nestjs/testing';
import { AutomobileService } from './automobile.service';
import { getModelToken } from '@nestjs/mongoose';
import { Automobile } from '../schemas/automobile.schema';
import { Reservation } from '../../../src/reservation/schemas/reservation.schema';
import { Model } from 'mongoose';
import { CreateAutomobileDto } from '../dto/create-automobile.dto';
import { NotFoundException } from '@nestjs/common';

describe('AutomobileService', () => {
  let service: AutomobileService;
  let automobileModel: Model<Automobile>;
  let reservationModel: Model<Reservation>;

  const mockAutomobileModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockReservationModel = {
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomobileService,
        {
          provide: getModelToken(Automobile.name),
          useValue: mockAutomobileModel
        },
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel
        },
      ],
    }).compile();

    service = module.get<AutomobileService>(AutomobileService);
    automobileModel = module.get<Model<Automobile>>(getModelToken(Automobile.name));
    reservationModel = module.get<Model<Reservation>>(getModelToken(Reservation.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an automobile if found', async () => {
      const mockAutomobile = { id: '1', brand: 'Test' };
      mockAutomobileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAutomobile)
      });

      const result = await service.findOne('1');
      expect(result.success).toBeTruthy();
      expect(result.data).toEqual(mockAutomobile);
    });

    it('should throw NotFoundException if automobile not found', async () => {
      mockAutomobileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all automobiles', async () => {
      const mockAutomobiles = [
        { id: '1', brand: 'Test1' },
        { id: '2', brand: 'Test2' }
      ];

      mockAutomobileModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAutomobiles)
      });

      const result = await service.findAll();
      expect(result.success).toBeTruthy();
      expect(result.data).toEqual(mockAutomobiles);
    });
  });

  describe('getMostReservedAutomobiles', () => {
    it('should return most reserved automobiles', async () => {
      const mockAggregateResult = [
        { _id: '1', reservationCount: 5, automobile: { brand: 'Test1' } },
        { _id: '2', reservationCount: 3, automobile: { brand: 'Test2' } }
      ];

      mockReservationModel.aggregate.mockResolvedValue(mockAggregateResult);

      const result = await service.getMostReservedAutomobiles(2);
      expect(result.success).toBeTruthy();
      expect(result.data).toHaveLength(2);
    });
  });
}); 