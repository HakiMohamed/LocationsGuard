import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Model } from 'mongoose';
import { MailService } from '../../mail/mail.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { UserRole } from '../../auth/enums/role.enum';
import * as bcrypt from 'bcryptjs';

describe('ClientService', () => {
  let service: ClientService;
  let userModel: Model<User>;
  let mailService: MailService;

  const mockUserModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockMailService = {
    sendClientCredentials: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createClientDto = {
      email: 'client@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+33123456789',
    };

    it('should successfully create a client', async () => {
      const mockCreatedClient = {
        _id: 'client-id',
        ...createClientDto,
        role: UserRole.CLIENT,
        isEmailVerified: true,
      };

      mockUserModel.create.mockResolvedValue(mockCreatedClient);
      mockMailService.sendClientCredentials.mockResolvedValue(true);

      const result = await service.create(createClientDto);

      expect(result).toEqual({
        _id: mockCreatedClient._id,
        email: mockCreatedClient.email,
        firstName: mockCreatedClient.firstName,
        lastName: mockCreatedClient.lastName,
        phoneNumber: mockCreatedClient.phoneNumber,
      });
      expect(mockMailService.sendClientCredentials).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserModel.create.mockRejectedValue({ code: 11000 });

      await expect(service.create(createClientDto))
        .rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if email sending fails', async () => {
      const mockCreatedClient = {
        _id: 'client-id',
        ...createClientDto,
      };

      mockUserModel.create.mockResolvedValue(mockCreatedClient);
      mockMailService.sendClientCredentials.mockRejectedValue(new Error());
      mockUserModel.findByIdAndDelete.mockResolvedValue(true);

      await expect(service.create(createClientDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all clients', async () => {
      const mockClients = [
        { _id: '1', email: 'client1@example.com', role: UserRole.CLIENT },
        { _id: '2', email: 'client2@example.com', role: UserRole.CLIENT },
      ];

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockClients),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockClients);
      expect(mockUserModel.find).toHaveBeenCalledWith({ role: UserRole.CLIENT });
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      const mockClient = {
        _id: 'client-id',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockClient),
        }),
      });

      const result = await service.findOne('client-id');
      expect(result).toEqual(mockClient);
    });

    it('should throw BadRequestException if client not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('non-existent-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const updateClientDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const mockUpdatedClient = {
        _id: 'client-id',
        ...updateClientDto,
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedClient);

      const result = await service.update('client-id', updateClientDto);
      expect(result).toEqual(mockUpdatedClient);
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      const mockDeletedClient = {
        _id: 'client-id',
        email: 'client@example.com',
      };

      mockUserModel.findByIdAndDelete.mockResolvedValue(mockDeletedClient);

      const result = await service.remove('client-id');
      expect(result).toEqual(mockDeletedClient);
    });
  });

  describe('search', () => {
    it('should search clients by criteria', async () => {
      const mockClients = [
        { _id: '1', firstName: 'John', email: 'john@example.com' },
        { _id: '2', firstName: 'Jane', email: 'jane@example.com' },
      ];

      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClients),
      });

      const result = await service.search('john');
      expect(result).toEqual(mockClients);
      expect(mockUserModel.find).toHaveBeenCalledWith({
        role: UserRole.CLIENT,
        $or: expect.any(Array),
      });
    });
  });

  describe('getClientRentals', () => {
    it('should return client rentals', async () => {
      const result = await service.getClientRentals('client-id');
      expect(result).toEqual([]);
    });
  });

  describe('getClientStatistics', () => {
    it('should return client statistics', async () => {
      const result = await service.getClientStatistics('client-id');
      expect(result).toEqual({});
    });
  });
}); 