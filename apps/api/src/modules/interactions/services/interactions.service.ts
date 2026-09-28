import { BadRequestException, Injectable } from '@nestjs/common';
import { Interaction, Prisma } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { ContactsService } from '../../contacts/services/contacts.service';
import { LeadsService } from '../../leads/services/leads.service';
import { CreateInteractionDto } from '../dto/create-interaction.dto';
import { InteractionQueryDto } from '../dto/interaction-query.dto';
import { InteractionsRepository } from '../repositories/interactions.repository';

@Injectable()
export class InteractionsService {
  constructor(
    private readonly interactionsRepository: InteractionsRepository,
    private readonly contactsService: ContactsService,
    private readonly leadsService: LeadsService,
  ) {}

  async create(dto: CreateInteractionDto, userId?: string): Promise<Interaction> {
    if (!dto.contactId && !dto.leadId) {
      throw new BadRequestException('An interaction must reference a contact or a lead');
    }
    if (dto.contactId && !(await this.contactsService.exists(dto.contactId))) {
      throw new BadRequestException('contactId does not reference an existing contact');
    }
    if (dto.leadId && !(await this.leadsService.exists(dto.leadId))) {
      throw new BadRequestException('leadId does not reference an existing lead');
    }

    const data: Prisma.InteractionCreateInput = {
      type: dto.type,
      description: dto.description,
      ...(dto.contactId ? { contact: { connect: { id: dto.contactId } } } : {}),
      ...(dto.leadId ? { lead: { connect: { id: dto.leadId } } } : {}),
      ...(userId ? { createdBy: { connect: { id: userId } } } : {}),
    };

    return this.interactionsRepository.create(data);
  }

  async findAll(query: InteractionQueryDto): Promise<PaginatedResponse<Interaction>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.interactionsRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }
}
