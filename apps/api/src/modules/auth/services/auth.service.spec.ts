import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import { HashingService } from '../../../common/security/hashing.service';
import { UsersService } from '../../users/services/users.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AuthService } from './auth.service';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Admin',
  email: 'admin@lubdiesel.com.br',
  passwordHash: 'hashed',
  role: UserRole.ADMIN,
  active: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let hashing: jest.Mocked<HashingService>;
  let jwt: jest.Mocked<JwtService>;
  let refreshRepo: jest.Mocked<RefreshTokenRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmailWithSecret: jest.fn(), findEntityById: jest.fn() },
        },
        { provide: HashingService, useValue: { hash: jest.fn(), compare: jest.fn() } },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed-token'),
            verifyAsync: jest.fn(),
            decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
          },
        },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('secret') } },
        {
          provide: RefreshTokenRepository,
          useValue: {
            create: jest.fn(),
            findValid: jest.fn(),
            revokeById: jest.fn(),
            revokeAllForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
    hashing = moduleRef.get(HashingService);
    jwt = moduleRef.get(JwtService);
    refreshRepo = moduleRef.get(RefreshTokenRepository);
  });

  describe('login', () => {
    it('returns tokens and a safe user for valid credentials', async () => {
      usersService.findByEmailWithSecret.mockResolvedValue(buildUser());
      hashing.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'admin@lubdiesel.com.br',
        password: 'ChangeMe123!',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(refreshRepo.create).toHaveBeenCalledTimes(1);
      expect(jwt.signAsync).toHaveBeenCalledTimes(2);
    });

    it('rejects invalid passwords', async () => {
      usersService.findByEmailWithSecret.mockResolvedValue(buildUser());
      hashing.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@lubdiesel.com.br', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects inactive users', async () => {
      usersService.findByEmailWithSecret.mockResolvedValue(buildUser({ active: false }));

      await expect(
        service.login({ email: 'admin@lubdiesel.com.br', password: 'ChangeMe123!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates a valid refresh token', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'admin@lubdiesel.com.br',
        role: UserRole.ADMIN,
      });
      refreshRepo.findValid.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: null,
        createdAt: new Date(),
      });
      usersService.findEntityById.mockResolvedValue(buildUser());

      const result = await service.refresh({ refreshToken: 'a-valid-refresh-token' });

      expect(refreshRepo.revokeById).toHaveBeenCalledWith('rt-1');
      expect(result.accessToken).toBe('signed-token');
    });

    it('rejects an unknown/revoked refresh token', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'admin@lubdiesel.com.br',
        role: UserRole.ADMIN,
      });
      refreshRepo.findValid.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'a-valid-refresh-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
