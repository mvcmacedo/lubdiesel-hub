import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ProductQueryDto } from '../dto/product-query.dto';

const SORTABLE_FIELDS = new Set(['sku', 'name', 'salePrice', 'createdAt', 'updatedAt']);

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { id, deletedAt: null } });
  }

  findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { sku, deletedAt: null } });
  }

  findAllBasic(): Promise<{ id: string; sku: string; name: string }[]> {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, sku: true, name: true },
      orderBy: { sku: 'asc' },
    });
  }

  create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async findManyPaginated(
    query: ProductQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.search
        ? {
            OR: [
              { sku: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderByField =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'createdAt';
    const orderBy: Prisma.ProductOrderByWithRelationInput = { [orderByField]: query.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, skip, take }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }
}
