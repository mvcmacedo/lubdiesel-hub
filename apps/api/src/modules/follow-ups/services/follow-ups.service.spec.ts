import { Test } from '@nestjs/testing';
import { FollowUp, FollowUpStatus, FollowUpType } from '@prisma/client';
import { ContactsService } from '../../contacts/services/contacts.service';
import { LeadsService } from '../../leads/services/leads.service';
import { UsersService } from '../../users/services/users.service';
import { FollowUpsRepository } from '../repositories/follow-ups.repository';
import { FollowUpsService } from './follow-ups.service';

const buildFollowUp = (overrides: Partial<FollowUp> = {}): FollowUp => ({
  id: 'fu-1',
  leadId: null,
  contactId: 'contact-1',
  assignedUserId: 'user-1',
  type: FollowUpType.WHATSAPP,
  scheduledAt: new Date('2026-10-05T14:00:00Z'),
  completedAt: null,
  notes: null,
  status: FollowUpStatus.PENDING,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

describe('FollowUpsService', () => {
  let service: FollowUpsService;
  let repository: jest.Mocked<FollowUpsRepository>;
  let contactsService: jest.Mocked<ContactsService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FollowUpsService,
        {
          provide: FollowUpsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            countScope: jest.fn(),
            findManyPaginated: jest.fn(),
          },
        },
        { provide: ContactsService, useValue: { exists: jest.fn().mockResolvedValue(true) } },
        { provide: LeadsService, useValue: { exists: jest.fn().mockResolvedValue(true) } },
        { provide: UsersService, useValue: { findEntityById: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = moduleRef.get(FollowUpsService);
    repository = moduleRef.get(FollowUpsRepository);
    contactsService = moduleRef.get(ContactsService);
    usersService = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('defaults the owner to the current user', async () => {
      repository.create.mockResolvedValue(buildFollowUp());

      await service.create(
        { type: FollowUpType.CALL, scheduledAt: '2026-10-05T14:00:00Z', contactId: 'contact-1' },
        'user-9',
      );

      expect(usersService.findEntityById).toHaveBeenCalledWith('user-9');
      expect(contactsService.exists).toHaveBeenCalledWith('contact-1');
      expect(repository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('complete', () => {
    it('marks the follow-up as completed with a timestamp', async () => {
      repository.findById.mockResolvedValue(buildFollowUp());
      repository.update.mockResolvedValue(buildFollowUp({ status: FollowUpStatus.COMPLETED }));

      await service.complete('fu-1');

      const [id, data] = repository.update.mock.calls[0];
      expect(id).toBe('fu-1');
      expect(data.status).toBe(FollowUpStatus.COMPLETED);
      expect(data.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('summary', () => {
    it('aggregates today/overdue/upcoming counts', async () => {
      repository.countScope
        .mockResolvedValueOnce(2) // today
        .mockResolvedValueOnce(5) // overdue
        .mockResolvedValueOnce(3); // upcoming

      const result = await service.summary();

      expect(result).toEqual({ today: 2, overdue: 5, upcoming: 3 });
    });
  });
});
