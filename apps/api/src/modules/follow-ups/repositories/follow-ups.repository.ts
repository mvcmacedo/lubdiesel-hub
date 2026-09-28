import { Injectable } from '@nestjs/common';
import { FollowUp, FollowUpStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { getDayBounds } from '../../../common/utils/date.util';
import { FollowUpQueryDto, FollowUpScope } from '../dto/follow-up-query.dto';

const FOLLOW_UP_INCLUDE = {
  assignedUser: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  lead: { select: { id: true, status: true } },
} satisfies Prisma.FollowUpInclude;

function scopeWhere(scope: FollowUpScope): Prisma.FollowUpWhereInput {
  const { startOfToday, endOfToday } = getDayBounds();
  switch (scope) {
    case 'overdue':
      return { status: FollowUpStatus.PENDING, scheduledAt: { lt: startOfToday } };
    case 'today':
      return { status: FollowUpStatus.PENDING, scheduledAt: { gte: startOfToday, lt: endOfToday } };
    case 'upcoming':
      return { status: FollowUpStatus.PENDING, scheduledAt: { gte: endOfToday } };
  }
}

@Injectable()
export class FollowUpsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.FollowUpCreateInput): Promise<FollowUp> {
    return this.prisma.followUp.create({ data, include: FOLLOW_UP_INCLUDE });
  }

  findById(id: string): Promise<FollowUp | null> {
    return this.prisma.followUp.findUnique({ where: { id }, include: FOLLOW_UP_INCLUDE });
  }

  update(id: string, data: Prisma.FollowUpUpdateInput): Promise<FollowUp> {
    return this.prisma.followUp.update({ where: { id }, data, include: FOLLOW_UP_INCLUDE });
  }

  countScope(scope: FollowUpScope, assignedUserId?: string): Promise<number> {
    return this.prisma.followUp.count({
      where: { ...scopeWhere(scope), ...(assignedUserId ? { assignedUserId } : {}) },
    });
  }

  async findManyPaginated(
    query: FollowUpQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: FollowUp[]; total: number }> {
    const where: Prisma.FollowUpWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.scope ? scopeWhere(query.scope) : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.followUp.findMany({
        where,
        orderBy: { scheduledAt: query.sortOrder },
        skip,
        take,
        include: FOLLOW_UP_INCLUDE,
      }),
      this.prisma.followUp.count({ where }),
    ]);

    return { items, total };
  }
}
