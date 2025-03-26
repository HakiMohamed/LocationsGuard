import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from '../services/reservation.service';
import { ReservationStatus } from '../schemas/reservation.schema';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

describe('ReservationController', () => {
  let controller: ReservationController;
  let service: ReservationService;

  const mockReservationService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByAutomobile: jest.fn(),
    findByClient: jest.fn(),
    findByCategory: jest.fn(),
    updateStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
    cancel: jest.fn(),
    confirm: jest.fn(),
    complete: jest.fn(),
    SetPending: jest.fn(),
    remove: jest.fn(),
    generateContract: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        {
          provide: ReservationService,
          useValue: mockReservationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReservationController>(ReservationController);
    service = module.get<ReservationService>(ReservationService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated reservations', async () => {
      const mockResult = {
        success: true,
        data: [
          { _id: '1', client: 'client1' },
          { _id: '2', client: 'client2' },
        ],
        pagination: {
          total: 2,
          page: 1,
          pages: 1,
        },
      };

      mockReservationService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10);
      expect(result).toBe(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe('findByAutomobile', () => {
    it('should return reservations for an automobile', async () => {
      const mockResult = {
        success: true,
        data: [{ _id: '1', automobile: 'auto1' }],
      };

      mockReservationService.findByAutomobile.mockResolvedValue(mockResult);

      const result = await controller.findByAutomobile('auto1');
      expect(result).toBe(mockResult);
    });
  });

  describe('findByClient', () => {
    it('should return client reservations', async () => {
      const mockResult = {
        success: true,
        data: [{ _id: '1', client: 'client1' }],
      };

      mockReservationService.findByClient.mockResolvedValue(mockResult);

      const result = await controller.findByClient('client1');
      expect(result).toBe(mockResult);
    });
  });

  describe('findByCategory', () => {
    it('should return reservations by category', async () => {
      const mockResult = {
        success: true,
        data: [{ _id: '1', category: 'category1' }],
      };

      mockReservationService.findByCategory.mockResolvedValue(mockResult);

      const result = await controller.findByCategory('category1');
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a specific reservation', async () => {
      const mockResult = {
        success: true,
        data: { _id: '1', client: 'client1' },
      };

      mockReservationService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');
      expect(result).toBe(mockResult);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const mockResult = {
        success: true,
        message: 'Statut de paiement mis à jour avec succès',
        data: { _id: '1', isPaid: true },
      };

      mockReservationService.updatePaymentStatus.mockResolvedValue(mockResult);

      const result = await controller.updatePaymentStatus('1', true);
      expect(result).toBe(mockResult);
    });
  });

  describe('cancel', () => {
    it('should cancel reservation', async () => {
      const mockResult = {
        success: true,
        message: 'Réservation annulée avec succès',
        data: { _id: '1', status: ReservationStatus.CANCELLED },
      };

      mockReservationService.cancel.mockResolvedValue(mockResult);

      const result = await controller.cancel('1', 'Annulation client');
      expect(result).toBe(mockResult);
    });
  });

  describe('confirm', () => {
    it('should confirm reservation', async () => {
      const mockResult = {
        success: true,
        message: 'Réservation confirmée avec succès',
        data: { _id: '1', status: ReservationStatus.CONFIRMED },
      };

      mockReservationService.confirm.mockResolvedValue(mockResult);

      const result = await controller.confirm('1');
      expect(result).toBe(mockResult);
    });
  });

  describe('complete', () => {
    it('should complete reservation', async () => {
      const mockResult = {
        success: true,
        message: 'Réservation terminée avec succès',
        data: { _id: '1', status: ReservationStatus.COMPLETED },
      };

      mockReservationService.complete.mockResolvedValue(mockResult);

      const result = await controller.complete('1');
      expect(result).toBe(mockResult);
    });
  });

  describe('pending', () => {
    it('should set reservation to pending', async () => {
      const mockResult = {
        success: true,
        message: 'Réservation mise en attente avec succès',
        data: { _id: '1', status: ReservationStatus.PENDING },
      };

      mockReservationService.SetPending.mockResolvedValue(mockResult);

      const result = await controller.pending('1');
      expect(result).toBe(mockResult);
    });
  });
}); 