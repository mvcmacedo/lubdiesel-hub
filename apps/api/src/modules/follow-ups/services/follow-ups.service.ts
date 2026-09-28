import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FollowUp, FollowUpStatus, Prisma } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { ContactsService } from '../../contacts/services/contacts.service';
import { LeadsService } from '../../leads/services/leads.service';
import { UsersService } from '../../users/services/users.service';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { FollowUpQueryDto } from '../dto/follow-up-query.dto';
import { UpdateFollowUpDto } from '../dto/update-follow-up.dto';
import { FollowUpsRepository } from '../repositories/follow-ups.repository';

export interface FollowUpSummary {
  today: number;
  overdue: number;
  upcoming: number;
}

@Injectable()
export class FollowUpsService {
  constructor(
    private readonly followUpsRepository: FollowUpsRepository,
    private readonly contactsService: ContactsService,
    private readonly leadsService: LeadsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateFollowUpDto, userId?: string): Promise<FollowUp> {
    const assignedUserId = dto.assignedUserId ?? userId;
    await this.validateRelations(dto.contactId, dto.leadId, assignedUserId);

    const data: Prisma.FollowUpCreateInput = {
      type: dto.type,
      scheduledAt: new Date(dto.scheduledAt),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(assignedUserId ? { assignedUser: { connect: { id: assignedUserId } } } : {}),
      ...(dto.leadId ? { lead: { connect: { id: dto.leadId } } } : {}),
      ...(dto.contactId ? { contact: { connect: { id: dto.contactId } } } : {}),
    };

    return this.followUpsRepository.create(data);
  }

  async findAll(query: FollowUpQueryDto): Promise<PaginatedResponse<FollowUp>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.followUpsRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }

  findOne(id: string): Promise<FollowUp> {
    return this.getExisting(id);
  }

  async update(id: string, dto: UpdateFollowUpDto): Promise<FollowUp> {
    await this.getExisting(id);
    if (dto.assignedUserId) {
      await this.validateRelations(undefined, undefined, dto.assignedUserId);
    }

    const data: Prisma.FollowUpUpdateInput = {
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.assignedUserId ? { assignedUser: { connect: { id: dto.assignedUserId } } } : {}),
    };

    return this.followUpsRepository.update(id, data);
  }

  async complete(id: string): Promise<FollowUp> {
    await this.getExisting(id);
    return this.followUpsRepository.update(id, {
      status: FollowUpStatus.COMPLETED,
      completedAt: new Date(),
    });
  }

  async cancel(id: string): Promise<FollowUp> {
    await this.getExisting(id);
    return this.followUpsRepository.update(id, { status: FollowUpStatus.CANCELLED });
  }

  async summary(assignedUserId?: string): Promise<FollowUpSummary> {
    const [today, overdue, upcoming] = await Promise.all([
      this.followUpsRepository.countScope('today', assignedUserId),
      this.followUpsRepository.countScope('overdue', assignedUserId),
      this.followUpsRepository.countScope('upcoming', assignedUserId),
    ]);
    return { today, overdue, upcoming };
  }

  private async validateRelations(
    contactId?: string,
    leadId?: string,
    assignedUserId?: string,
  ): Promise<void> {
    if (contactId && !(await this.contactsService.exists(contactId))) {
      throw new BadRequestException('contactId does not reference an existing contact');
    }
    if (leadId && !(await this.leadsService.exists(leadId))) {
      throw new BadRequestException('leadId does not reference an existing lead');
    }
    if (assignedUserId && !(await this.usersService.findEntityById(assignedUserId))) {
      throw new BadRequestException('assignedUserId does not reference an existing user');
    }
  }

  private async getExisting(id: string): Promise<FollowUp> {
    const followUp = await this.followUpsRepository.findById(id);
    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }
    return followUp;
  }
}
