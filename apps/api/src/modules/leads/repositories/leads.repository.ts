import { Injectable } from '@nestjs/common';
import { Lead, LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { LeadQueryDto } from '../dto/lead-query.dto';

const LEAD_INCLUDE = {
  contact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      whatsapp: true,
      type: true,
    },
  },
  assignedUser: { select: { id: true, name: true, email: true } },
  stageHistory: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.LeadInclude;

const BOARD_INCLUDE = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  assignedUser: { select: { id: true, name: true } },
} satisfies Prisma.LeadInclude;

const SORTABLE_FIELDS = new Set(['status', 'source', 'estimatedValue', 'createdAt', 'updatedAt']);

export interface StageHistoryEntry {
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  changedById?: string;
  note?: string;
}

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Lead | null> {
    return this.prisma.lead.findFirst({ where: { id, deletedAt: null }, include: LEAD_INCLUDE });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.lead.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  update(id: string, data: Prisma.LeadUpdateInput): Promise<Lead> {
    return this.prisma.lead.update({ where: { id }, data, include: LEAD_INCLUDE });
  }

  softDelete(id: string): Promise<Lead> {
    return this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createWithHistory(data: Prisma.LeadCreateInput, changedById?: string): Promise<Lead> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({ data });
      await tx.leadStageHistory.create({
        data: {
          leadId: created.id,
          fromStatus: null,
          toStatus: created.status,
          changedById: changedById ?? null,
        },
      });
      return tx.lead.findFirstOrThrow({ where: { id: created.id }, include: LEAD_INCLUDE });
    });
  }

  async applyStageChange(
    id: string,
    update: Prisma.LeadUpdateInput,
    history: StageHistoryEntry,
    convertContactId?: string,
  ): Promise<Lead> {
    return this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: update });
      await tx.leadStageHistory.create({
        data: {
          leadId: id,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          changedById: history.changedById ?? null,
          note: history.note ?? null,
        },
      });
      if (convertContactId) {
        await tx.contact.update({ where: { id: convertContactId }, data: { type: 'CUSTOMER' } });
      }
      return tx.lead.findFirstOrThrow({ where: { id }, include: LEAD_INCLUDE });
    });
  }

  findManyForBoard(where: Prisma.LeadWhereInput): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: BOARD_INCLUDE,
    });
  }

  async findManyPaginated(
    query: LeadQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: Lead[]; total: number }> {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.search
        ? {
            contact: {
              OR: [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const orderByField =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'createdAt';
    const orderBy: Prisma.LeadOrderByWithRelationInput = { [orderByField]: query.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({ where, orderBy, skip, take, include: LEAD_INCLUDE }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total };
  }
}
