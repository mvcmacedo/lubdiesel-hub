import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Lead, LeadSource, LeadStatus, Prisma } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { ContactsService } from '../../contacts/services/contacts.service';
import { UsersService } from '../../users/services/users.service';
import { ChangeLeadStageDto } from '../dto/change-lead-stage.dto';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { LeadQueryDto } from '../dto/lead-query.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { LeadsRepository } from '../repositories/leads.repository';

export interface BoardFilters {
  source?: LeadSource;
  assignedUserId?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly leadsRepository: LeadsRepository,
    private readonly contactsService: ContactsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateLeadDto, userId?: string): Promise<Lead> {
    if (!(await this.contactsService.exists(dto.contactId))) {
      throw new BadRequestException('contactId does not reference an existing contact');
    }
    await this.validateAssignedUser(dto.assignedUserId);

    const data: Prisma.LeadCreateInput = {
      contact: { connect: { id: dto.contactId } },
      source: dto.source,
      status: dto.status ?? LeadStatus.NEW,
      ...(dto.estimatedValue != null ? { estimatedValue: dto.estimatedValue } : {}),
      ...(dto.assignedUserId ? { assignedUser: { connect: { id: dto.assignedUserId } } } : {}),
    };

    return this.leadsRepository.createWithHistory(data, userId);
  }

  async findAll(query: LeadQueryDto): Promise<PaginatedResponse<Lead>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.leadsRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }

  findOne(id: string): Promise<Lead> {
    return this.getExisting(id);
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    await this.getExisting(id);
    await this.validateAssignedUser(dto.assignedUserId);

    const data: Prisma.LeadUpdateInput = {
      ...(dto.source ? { source: dto.source } : {}),
      ...(dto.estimatedValue != null ? { estimatedValue: dto.estimatedValue } : {}),
      ...(dto.assignedUserId ? { assignedUser: { connect: { id: dto.assignedUserId } } } : {}),
    };

    return this.leadsRepository.update(id, data);
  }

  async changeStage(id: string, dto: ChangeLeadStageDto, userId?: string): Promise<Lead> {
    const lead = await this.getExisting(id);
    const fromStatus = lead.status;
    const toStatus = dto.status;

    if (toStatus === LeadStatus.LOST && !dto.lostReason) {
      throw new BadRequestException('lostReason is required when marking a lead as LOST');
    }

    const update: Prisma.LeadUpdateInput = { status: toStatus };

    if (toStatus === LeadStatus.LOST) {
      update.lostReason = dto.lostReason;
    } else {
      update.lostReason = null;
    }

    let convertContactId: string | undefined;
    if (toStatus === LeadStatus.WON) {
      update.convertedAt = new Date();
      convertContactId = lead.contactId;
    }

    return this.leadsRepository.applyStageChange(
      id,
      update,
      { fromStatus, toStatus, changedById: userId, note: dto.note },
      convertContactId,
    );
  }

  async remove(id: string): Promise<void> {
    await this.getExisting(id);
    await this.leadsRepository.softDelete(id);
  }

  exists(id: string): Promise<boolean> {
    return this.leadsRepository.exists(id);
  }

  getBoardLeads(filters: BoardFilters): Promise<Lead[]> {
    const where: Prisma.LeadWhereInput = {
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
    };
    return this.leadsRepository.findManyForBoard(where);
  }

  private async validateAssignedUser(assignedUserId?: string): Promise<void> {
    if (assignedUserId && !(await this.usersService.findEntityById(assignedUserId))) {
      throw new BadRequestException('assignedUserId does not reference an existing user');
    }
  }

  private async getExisting(id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findById(id);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }
}
