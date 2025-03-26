import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reservation, ReservationStatus } from '../schemas/reservation.schema';
import { Model } from 'mongoose';
import { AutomobileService } from '../../automobile/services/automobile.service';
import { ClientService } from '../../client/services/client.service';
import { NotFoundException } from '@nestjs/common';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationModel: Model<Reservation>;
  let automobileService: AutomobileService;
  let clientService: ClientService;

  const mockReservationModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockAutomobileService = {
    findOne: jest.fn(),
  };

  const mockClientService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
        {
          provide: AutomobileService,
          useValue: mockAutomobileService,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationModel = module.get<Model<Reservation>>(getModelToken(Reservation.name));
    automobileService = module.get<AutomobileService>(AutomobileService);
    clientService = module.get<ClientService>(ClientService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated reservations', async () => {
      const mockReservations = [
        { _id: '1', client: 'client1' },
        { _id: '2', client: 'client2' },
      ];

      mockReservationModel.countDocuments.mockResolvedValue(2);
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservations),
      });

      const result = await service.findAll(1, 10);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('findByCategory', () => {
    it('should return reservations by category', async () => {
      const mockReservations = [
        { _id: '1', category: 'category1' },
      ];

      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservations),
      });

      const result = await service.findByCategory('category1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReservations);
    });
  });

  describe('SetPending', () => {
    it('should set reservation status to pending', async () => {
      const mockReservation = {
        _id: 'reservation-id',
        status: ReservationStatus.PENDING,
      };

      mockReservationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReservation),
      });

      const result = await service.SetPending('reservation-id');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(ReservationStatus.PENDING);
    });
  });

  describe('remove', () => {
    it('should remove reservation successfully', async () => {
      const mockReservation = {
        _id: 'reservation-id',
      };

      mockReservationModel.findByIdAndDelete.mockResolvedValue(mockReservation);

      const result = await service.remove('reservation-id');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Réservation supprimée avec succès');
    });
  });

  describe('updateStatus', () => {
    it('should update status successfully', async () => {
      const mockReservation = {
        _id: 'reservation-id',
        status: ReservationStatus.CONFIRMED,
      };

      mockReservationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReservation),
      });

      const result = await service.updateStatus('reservation-id', ReservationStatus.CONFIRMED);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(ReservationStatus.CONFIRMED);
    });
  });

  describe('confirm', () => {
    it('should confirm reservation successfully', async () => {
      const mockReservation = {
        _id: 'reservation-id',
        status: ReservationStatus.CONFIRMED,
      };

      mockReservationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReservation),
      });

      const result = await service.confirm('reservation-id');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(ReservationStatus.CONFIRMED);
    });
  });

  describe('complete', () => {
    it('should complete reservation successfully', async () => {
      const mockReservation = {
        _id: 'reservation-id',
        status: ReservationStatus.COMPLETED,
      };

      mockReservationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReservation),
      });

      const result = await service.complete('reservation-id');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(ReservationStatus.COMPLETED);
    });
  });
}); 