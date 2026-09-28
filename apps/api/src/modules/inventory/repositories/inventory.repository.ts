import { Injectable } from '@nestjs/common';
import { InventoryMovement, InventoryMovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { MovementQueryDto } from '../dto/movement-query.dto';

/** Movement types that decrease stock. INBOUND (PURCHASE/RETURN) and ADJUSTMENT (signed) increase it. */
const OUTBOUND_TYPES = new Set<InventoryMovementType>([
  InventoryMovementType.SALE,
  InventoryMovementType.SAMPLE,
  InventoryMovementType.INTERNAL_USE,
  InventoryMovementType.GIFT,
  InventoryMovementType.LOSS,
]);

function signFor(type: InventoryMovementType): 1 | -1 {
  return OUTBOUND_TYPES.has(type) ? -1 : 1;
}

function computeBalance(entries: { type: InventoryMovementType; sum: number }[]): number {
  return entries.reduce((total, entry) => total + signFor(entry.type) * entry.sum, 0);
}

const MOVEMENT_INCLUDE = {
  product: { select: { id: true, sku: true, name: true } },
} satisfies Prisma.InventoryMovementInclude;

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.InventoryMovementCreateInput): Promise<InventoryMovement> {
    return this.prisma.inventoryMovement.create({ data, include: MOVEMENT_INCLUDE });
  }

  async balanceForProduct(productId: string): Promise<number> {
    const grouped = await this.prisma.inventoryMovement.groupBy({
      by: ['type'],
      where: { productId },
      _sum: { quantity: true },
    });
    return computeBalance(grouped.map((g) => ({ type: g.type, sum: g._sum.quantity ?? 0 })));
  }

  async balancesByProduct(): Promise<Map<string, number>> {
    const grouped = await this.prisma.inventoryMovement.groupBy({
      by: ['productId', 'type'],
      _sum: { quantity: true },
    });

    const byProduct = new Map<string, { type: InventoryMovementType; sum: number }[]>();
    for (const entry of grouped) {
      const list = byProduct.get(entry.productId) ?? [];
      list.push({ type: entry.type, sum: entry._sum.quantity ?? 0 });
      byProduct.set(entry.productId, list);
    }

    const balances = new Map<string, number>();
    for (const [productId, entries] of byProduct) {
      balances.set(productId, computeBalance(entries));
    }
    return balances;
  }

  async findManyPaginated(
    query: MovementQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: InventoryMovement[]; total: number }> {
    const where: Prisma.InventoryMovementWhereInput = {
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: query.sortOrder },
        skip,
        take,
        include: MOVEMENT_INCLUDE,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return { items, total };
  }
}
