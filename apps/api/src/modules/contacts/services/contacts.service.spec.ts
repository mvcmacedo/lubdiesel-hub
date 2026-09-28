import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Contact, ContactType } from '@prisma/client';
import { CompaniesService } from '../../companies/services/companies.service';
import { UsersService } from '../../users/services/users.service';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactsService } from './contacts.service';

const buildContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: 'contact-1',
  firstName: 'Carlos',
  lastName: 'Pereira',
  phone: null,
  whatsapp: null,
  email: null,
  city: null,
  state: null,
  type: ContactType.LEAD,
  source: null,
  notes: null,
  assignedUserId: null,
  companyId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
  ...overrides,
});

describe('ContactsService', () => {
  let service: ContactsService;
  let repository: jest.Mocked<ContactsRepository>;
  let companiesService: jest.Mocked<CompaniesService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: ContactsRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            setType: jest.fn(),
            exists: jest.fn(),
            findManyPaginated: jest.fn(),
          },
        },
        { provide: CompaniesService, useValue: { exists: jest.fn() } },
        { provide: UsersService, useValue: { findEntityById: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ContactsService);
    repository = moduleRef.get(ContactsRepository);
    companiesService = moduleRef.get(CompaniesService);
    usersService = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('creates a contact with valid relations', async () => {
      companiesService.exists.mockResolvedValue(true);
      usersService.findEntityById.mockResolvedValue({ id: 'user-1' } as never);
      repository.create.mockResolvedValue(buildContact());

      await service.create({
        firstName: 'Carlos',
        companyId: 'company-1',
        assignedUserId: 'user-1',
      });

      expect(repository.create).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown company', async () => {
      companiesService.exists.mockResolvedValue(false);

      await expect(
        service.create({ firstName: 'Carlos', companyId: 'missing' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws when the contact does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
