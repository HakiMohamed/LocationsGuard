import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { TokenService } from './token.service';
import { DeviceService } from './device.service';
import { VerificationService } from './verification.service';
import { MailService } from '../../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { UserRole } from '../enums/role.enum';
import { DeviceType } from '../enums/device-type.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<User>;
  let tokenService: TokenService;
  let deviceService: DeviceService;
  let verificationService: VerificationService;
  let mailService: MailService;

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockTokenService = {
    generateTokens: jest.fn(),
    validateRefreshToken: jest.fn(),
    blacklistToken: jest.fn(),
  };

  const mockDeviceService = {
    handleLoginDevice: jest.fn(),
    getCurrentDevice: jest.fn(),
    removeDevice: jest.fn(),
  };

  const mockVerificationService = {
    generateEmailVerificationToken: jest.fn(),
  };

  const mockMailService = {
    sendEmailVerification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: TokenService, useValue: mockTokenService },
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: VerificationService, useValue: mockVerificationService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    tokenService = module.get<TokenService>(TokenService);
    deviceService = module.get<DeviceService>(DeviceService);
    verificationService = module.get<VerificationService>(VerificationService);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = await bcrypt.hash(registerDto.password, 12);
      const newUser = {
        ...registerDto,
        _id: 'user-id',
        password: hashedPassword,
        role: UserRole.USER,
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(newUser);
      mockVerificationService.generateEmailVerificationToken.mockResolvedValue('verification-token');

      const result = await service.register(registerDto);

      expect(result.message).toBe('Registration successful. Please check your email to verify your account.');
      expect(mockMailService.sendEmailVerification).toHaveBeenCalledWith(newUser, 'verification-token');
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: registerDto.email });
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is too weak', async () => {
      const weakPasswordDto = {
        ...registerDto,
        password: '123',
      };
      
      await expect(service.register(weakPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
      device: {
        name: 'Chrome Browser',
        type: DeviceType.DESKTOP,
        browser: 'Chrome',
        os: 'Windows'
      }
    };

    const mockRequest = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '127.0.0.1'
      },
      ip: '127.0.0.1'
    } as unknown as Request;

    const mockResponse = {
      cookie: jest.fn(),
      header: jest.fn(),
    } as unknown as Response;

    it('should successfully login a verified user', async () => {
      const mockUser = {
        _id: 'user-id',
        email: loginDto.email,
        password: await bcrypt.hash(loginDto.password, 12),
        isEmailVerified: true,
        role: UserRole.USER,
        firstName: 'John',
        lastName: 'Doe'
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockTokenService.generateTokens.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      mockDeviceService.handleLoginDevice.mockResolvedValue({
        deviceId: 'device-1',
        name: 'Chrome Browser',
        type: DeviceType.DESKTOP,
      });

      const result = await service.login(loginDto, mockRequest, mockResponse);

      expect(result).toEqual({
        user: {
          _id: mockUser._id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        },
        access_token: 'access-token',
        device: expect.objectContaining({
          deviceId: 'device-1',
          name: 'Chrome Browser',
          type: DeviceType.DESKTOP,
        }),
        message: 'Login successful'
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      await expect(service.login(loginDto, mockRequest, mockResponse))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = {
        email: loginDto.email,
        password: await bcrypt.hash('differentPassword', 12),
        isEmailVerified: true
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      await expect(service.login(loginDto, mockRequest, mockResponse))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email is not verified', async () => {
      const mockUser = {
        email: loginDto.email,
        password: await bcrypt.hash(loginDto.password, 12),
        isEmailVerified: false
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      await expect(service.login(loginDto, mockRequest, mockResponse))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const mockRequest = {
      cookies: { refresh_token: 'valid-refresh-token' }
    } as any as Request;

    const mockResponse = {
      cookie: jest.fn(),
      header: jest.fn(),
    } as any as Response;

    it('should successfully refresh tokens', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        role: UserRole.USER
      };

      mockTokenService.validateRefreshToken.mockResolvedValue({
        user: mockUser
      });

      mockUserModel.findById.mockResolvedValue(mockUser);

      mockTokenService.generateTokens.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });

      const result = await service.refreshToken(mockRequest, mockResponse);

      expect(result).toEqual({
        access_token: 'new-access-token',
        message: 'Token refreshed successfully'
      });
      expect(mockResponse.cookie).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const requestWithoutToken = { cookies: {} } as any as Request;
      await expect(service.refreshToken(requestWithoutToken, mockResponse))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token validation fails', async () => {
      mockTokenService.validateRefreshToken.mockRejectedValue(new Error());
      await expect(service.refreshToken(mockRequest, mockResponse))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserById', () => {
    it('should return user data when found', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        isEmailVerified: true,
        isPhoneVerified: false,
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser)
        })
      });

      const result = await service.getUserById('user-id');
      expect(result).toEqual(expect.objectContaining({
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      }));
    });

    it('should throw BadRequestException if userId is invalid', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(service.getUserById('invalid-id')).rejects.toThrow();
    });
  });
});