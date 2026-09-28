import { Injectable } from '@nestjs/common';
import { Interaction, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { InteractionQueryDto } from '../dto/interaction-query.dto';

const INTERACTION_INCLUDE = {
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.InteractionInclude;

@Injectable()
export class InteractionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.InteractionCreateInput): Promise<Interaction> {
    return this.prisma.interaction.create({ data, include: INTERACTION_INCLUDE });
  }

  async findManyPaginated(
    query: InteractionQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: Interaction[]; total: number }> {
    const where: Prisma.InteractionWhereInput = {
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.interaction.findMany({
        where,
        orderBy: { createdAt: query.sortOrder },
        skip,
        take,
        include: INTERACTION_INCLUDE,
      }),
      this.prisma.interaction.count({ where }),
    ]);

    return { items, total };
  }
}
