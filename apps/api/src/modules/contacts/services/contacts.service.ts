import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Contact, ContactType, Prisma } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { CompaniesService } from '../../companies/services/companies.service';
import { UsersService } from '../../users/services/users.service';
import { ContactQueryDto } from '../dto/contact-query.dto';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactsRepository } from '../repositories/contacts.repository';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactsRepository: ContactsRepository,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateContactDto): Promise<Contact> {
    await this.validateRelations(dto.assignedUserId, dto.companyId);
    return this.contactsRepository.create(this.toCreateInput(dto));
  }

  async findAll(query: ContactQueryDto): Promise<PaginatedResponse<Contact>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.contactsRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }

  findOne(id: string): Promise<Contact> {
    return this.getExisting(id);
  }

  /** Returns the contact together with its commercial history. */
  async getHistory(id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findByIdWithHistory(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async update(id: string, dto: UpdateContactDto): Promise<Contact> {
    await this.getExisting(id);
    await this.validateRelations(dto.assignedUserId, dto.companyId);
    return this.contactsRepository.update(id, this.toUpdateInput(dto));
  }

  async remove(id: string): Promise<void> {
    await this.getExisting(id);
    await this.contactsRepository.softDelete(id);
  }

  exists(id: string): Promise<boolean> {
    return this.contactsRepository.exists(id);
  }

  /** Promotes a contact to CUSTOMER (used when a lead is won). */
  markAsCustomer(id: string): Promise<Contact> {
    return this.contactsRepository.setType(id, ContactType.CUSTOMER);
  }

  private toCreateInput(dto: CreateContactDto): Prisma.ContactCreateInput {
    const { assignedUserId, companyId, type, ...rest } = dto;
    return {
      ...rest,
      type: type ?? ContactType.LEAD,
      ...(assignedUserId ? { assignedUser: { connect: { id: assignedUserId } } } : {}),
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
    };
  }

  private toUpdateInput(dto: UpdateContactDto): Prisma.ContactUpdateInput {
    const { assignedUserId, companyId, ...rest } = dto;
    return {
      ...rest,
      ...(assignedUserId ? { assignedUser: { connect: { id: assignedUserId } } } : {}),
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
    };
  }

  private async validateRelations(assignedUserId?: string, companyId?: string): Promise<void> {
    if (assignedUserId && !(await this.usersService.findEntityById(assignedUserId))) {
      throw new BadRequestException('assignedUserId does not reference an existing user');
    }
    if (companyId && !(await this.companiesService.exists(companyId))) {
      throw new BadRequestException('companyId does not reference an existing company');
    }
  }

  private async getExisting(id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findById(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }
}
