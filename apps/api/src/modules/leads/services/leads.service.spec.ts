import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Lead, LeadSource, LeadStatus, LostReason } from '@prisma/client';
import { ContactsService } from '../../contacts/services/contacts.service';
import { UsersService } from '../../users/services/users.service';
import { LeadsRepository } from '../repositories/leads.repository';
import { LeadsService } from './leads.service';

const buildLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-1',
  contactId: 'contact-1',
  status: LeadStatus.NEW,
  source: LeadSource.WHATSAPP,
  estimatedValue: null,
  assignedUserId: null,
  lostReason: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  convertedAt: null,
  deletedAt: null,
  ...overrides,
});

describe('LeadsService', () => {
  let service: LeadsService;
  let repository: jest.Mocked<LeadsRepository>;
  let contactsService: jest.Mocked<ContactsService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: LeadsRepository,
          useValue: {
            findById: jest.fn(),
            exists: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            createWithHistory: jest.fn(),
            applyStageChange: jest.fn(),
            findManyForBoard: jest.fn(),
            findManyPaginated: jest.fn(),
          },
        },
        { provide: ContactsService, useValue: { exists: jest.fn() } },
        { provide: UsersService, useValue: { findEntityById: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(LeadsService);
    repository = moduleRef.get(LeadsRepository);
    contactsService = moduleRef.get(ContactsService);
  });

  describe('create', () => {
    it('creates a lead and records the initial stage history', async () => {
      contactsService.exists.mockResolvedValue(true);
      repository.createWithHistory.mockResolvedValue(buildLead());

      await service.create({ contactId: 'contact-1', source: LeadSource.WHATSAPP }, 'user-1');

      expect(repository.createWithHistory).toHaveBeenCalledTimes(1);
      const [data, changedById] = repository.createWithHistory.mock.calls[0];
      expect(data.status).toBe(LeadStatus.NEW);
      expect(changedById).toBe('user-1');
    });

    it('rejects a lead for a non-existent contact', async () => {
      contactsService.exists.mockResolvedValue(false);

      await expect(
        service.create({ contactId: 'missing', source: LeadSource.WHATSAPP }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.createWithHistory).not.toHaveBeenCalled();
    });
  });

  describe('changeStage', () => {
    it('requires a reason when marking as LOST', async () => {
      repository.findById.mockResolvedValue(buildLead());

      await expect(
        service.changeStage('lead-1', { status: LeadStatus.LOST }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.applyStageChange).not.toHaveBeenCalled();
    });

    it('stores the loss reason when moving to LOST', async () => {
      repository.findById.mockResolvedValue(buildLead());
      repository.applyStageChange.mockResolvedValue(buildLead({ status: LeadStatus.LOST }));

      await service.changeStage('lead-1', {
        status: LeadStatus.LOST,
        lostReason: LostReason.PRICE,
      });

      const [, update, history] = repository.applyStageChange.mock.calls[0];
      expect(update.lostReason).toBe(LostReason.PRICE);
      expect(history.fromStatus).toBe(LeadStatus.NEW);
      expect(history.toStatus).toBe(LeadStatus.LOST);
    });

    it('converts the contact and sets convertedAt when won', async () => {
      repository.findById.mockResolvedValue(buildLead({ status: LeadStatus.NEGOTIATION }));
      repository.applyStageChange.mockResolvedValue(buildLead({ status: LeadStatus.WON }));

      await service.changeStage('lead-1', { status: LeadStatus.WON }, 'user-1');

      const [, update, history, convertContactId] = repository.applyStageChange.mock.calls[0];
      expect(update.convertedAt).toBeInstanceOf(Date);
      expect(convertContactId).toBe('contact-1');
      expect(history.changedById).toBe('user-1');
    });
  });
});
