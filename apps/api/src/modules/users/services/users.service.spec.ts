import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import { HashingService } from '../../../common/security/hashing.service';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from './users.service';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Maria Silva',
  email: 'maria@lubdiesel.com.br',
  passwordHash: 'hashed',
  role: UserRole.USER,
  active: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let hashing: jest.Mocked<HashingService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findManyPaginated: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    repository = moduleRef.get(UsersRepository);
    hashing = moduleRef.get(HashingService);
  });

  describe('create', () => {
    it('hashes the password and returns a user without the hash', async () => {
      repository.findByEmail.mockResolvedValue(null);
      hashing.hash.mockResolvedValue('hashed-password');
      repository.create.mockResolvedValue(buildUser({ passwordHash: 'hashed-password' }));

      const result = await service.create({
        name: 'Maria Silva',
        email: 'maria@lubdiesel.com.br',
        password: 'StrongPass123!',
      });

      expect(hashing.hash).toHaveBeenCalledWith('StrongPass123!');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('maria@lubdiesel.com.br');
    });

    it('throws when the email is already taken', async () => {
      repository.findByEmail.mockResolvedValue(buildUser());

      await expect(
        service.create({ name: 'X', email: 'maria@lubdiesel.com.br', password: 'StrongPass123!' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFound when the user does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing user', async () => {
      repository.findById.mockResolvedValue(buildUser());
      repository.softDelete.mockResolvedValue(buildUser({ deletedAt: new Date(), active: false }));

      await service.remove('user-1');

      expect(repository.softDelete).toHaveBeenCalledWith('user-1');
    });
  });
});
