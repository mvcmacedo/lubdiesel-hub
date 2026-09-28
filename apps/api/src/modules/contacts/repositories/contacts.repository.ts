import { Injectable } from '@nestjs/common';
import { Contact, ContactType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ContactQueryDto } from '../dto/contact-query.dto';

const SORTABLE_FIELDS = new Set([
  'firstName',
  'lastName',
  'type',
  'city',
  'state',
  'createdAt',
  'updatedAt',
]);

@Injectable()
export class ContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Contact | null> {
    return this.prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include: { company: true, assignedUser: { select: { id: true, name: true, email: true } } },
    });
  }

  /** Contact with its full commercial history (leads, interactions, follow-ups, orders). */
  findByIdWithHistory(id: string): Promise<Contact | null> {
    return this.prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        leads: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { stageHistory: { orderBy: { createdAt: 'asc' } } },
        },
        interactions: { orderBy: { createdAt: 'desc' }, take: 100 },
        followUps: { orderBy: { scheduledAt: 'desc' } },
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          },
        },
      },
    });
  }

  create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return this.prisma.contact.create({ data });
  }

  update(id: string, data: Prisma.ContactUpdateInput): Promise<Contact> {
    return this.prisma.contact.update({ where: { id }, data });
  }

  setType(id: string, type: ContactType): Promise<Contact> {
    return this.prisma.contact.update({ where: { id }, data: { type } });
  }

  softDelete(id: string): Promise<Contact> {
    return this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.contact.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async findManyPaginated(
    query: ContactQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: Contact[]; total: number }> {
    const where: Prisma.ContactWhereInput = {
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.state ? { state: { equals: query.state, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { whatsapp: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderByField =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'createdAt';
    const orderBy: Prisma.ContactOrderByWithRelationInput = { [orderByField]: query.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { company: { select: { id: true, name: true } } },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { items, total };
  }
}
