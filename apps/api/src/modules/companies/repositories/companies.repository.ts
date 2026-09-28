import { Injectable } from '@nestjs/common';
import { Company, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CompanyQueryDto } from '../dto/company-query.dto';

const SORTABLE_FIELDS = new Set(['name', 'type', 'city', 'state', 'createdAt', 'updatedAt']);

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Company | null> {
    return this.prisma.company.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.prisma.company.create({ data });
  }

  update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return this.prisma.company.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Company> {
    return this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.company.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async findManyPaginated(
    query: CompanyQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: Company[]; total: number }> {
    const where: Prisma.CompanyWhereInput = {
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
      ...(query.state ? { state: { equals: query.state, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { legalName: { contains: query.search, mode: 'insensitive' } },
              { document: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderByField =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'createdAt';
    const orderBy: Prisma.CompanyOrderByWithRelationInput = { [orderByField]: query.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({ where, orderBy, skip, take }),
      this.prisma.company.count({ where }),
    ]);

    return { items, total };
  }
}
