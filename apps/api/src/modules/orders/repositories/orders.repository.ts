import { Injectable } from '@nestjs/common';
import { Order, OrderItem, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { OrderQueryDto } from '../dto/order-query.dto';

const ORDER_INCLUDE = {
  items: { include: { product: { select: { id: true, sku: true, name: true } } } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OrderCreateInput): Promise<OrderWithRelations> {
    return this.prisma.order.create({ data, include: ORDER_INCLUDE });
  }

  findById(id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findFirst({ where: { id, deletedAt: null }, include: ORDER_INCLUDE });
  }

  findItem(orderId: string, itemId: string): Promise<OrderItem | null> {
    return this.prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  }

  update(id: string, data: Prisma.OrderUpdateInput): Promise<OrderWithRelations> {
    return this.prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE });
  }

  createItem(data: Prisma.OrderItemCreateInput): Promise<OrderItem> {
    return this.prisma.orderItem.create({ data });
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.prisma.orderItem.delete({ where: { id: itemId } });
  }

  softDelete(id: string): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async completeWithStockMovements(
    orderId: string,
    movements: Prisma.InventoryMovementCreateManyInput[],
  ): Promise<OrderWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
      });
      if (movements.length > 0) {
        await tx.inventoryMovement.createMany({ data: movements });
      }
      return tx.order.findFirstOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
    });
  }

  async findManyPaginated(
    query: OrderQueryDto,
    skip: number,
    take: number,
  ): Promise<{ items: OrderWithRelations[]; total: number }> {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: query.sortOrder },
        skip,
        take,
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total };
  }
}
