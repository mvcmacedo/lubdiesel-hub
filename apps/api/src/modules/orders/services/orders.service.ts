import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryMovementType, OrderSource, OrderStatus, Prisma } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { round2 } from '../../../common/utils/money.util';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { CompaniesService } from '../../companies/services/companies.service';
import { ContactsService } from '../../contacts/services/contacts.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { ProductsService } from '../../products/services/products.service';
import { ChangeOrderStatusDto } from '../dto/change-order-status.dto';
import { CreateOrderItemDto } from '../dto/create-order-item.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrdersRepository, OrderWithRelations } from '../repositories/orders.repository';

const EDITABLE_STATUSES = new Set<OrderStatus>([OrderStatus.DRAFT, OrderStatus.PENDING]);

interface BuiltItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly contactsService: ContactsService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(dto: CreateOrderDto, userId?: string): Promise<OrderWithRelations> {
    await this.validateParties(dto.contactId, dto.companyId);

    const discount = dto.discount ?? 0;
    const items = await Promise.all(dto.items.map((item) => this.buildItem(item)));
    const subtotal = round2(items.reduce((sum, item) => sum + item.subtotal, 0));
    const total = round2(Math.max(subtotal - discount, 0));

    const data: Prisma.OrderCreateInput = {
      source: dto.source ?? OrderSource.DIRECT,
      discount,
      subtotal,
      total,
      ...(dto.notes ? { notes: dto.notes } : {}),
      ...(dto.contactId ? { contact: { connect: { id: dto.contactId } } } : {}),
      ...(dto.companyId ? { company: { connect: { id: dto.companyId } } } : {}),
      ...(userId ? { createdBy: { connect: { id: userId } } } : {}),
      items: {
        create: items.map((item) => ({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          subtotal: item.subtotal,
        })),
      },
    };

    return this.ordersRepository.create(data);
  }

  async findAll(query: OrderQueryDto): Promise<PaginatedResponse<OrderWithRelations>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.ordersRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }

  findOne(id: string): Promise<OrderWithRelations> {
    return this.getExisting(id);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderWithRelations> {
    await this.getEditable(id);
    await this.validateParties(dto.contactId, dto.companyId);

    const data: Prisma.OrderUpdateInput = {
      ...(dto.source ? { source: dto.source } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.contactId ? { contact: { connect: { id: dto.contactId } } } : {}),
      ...(dto.companyId ? { company: { connect: { id: dto.companyId } } } : {}),
      ...(dto.discount !== undefined ? { discount: dto.discount } : {}),
    };

    await this.ordersRepository.update(id, data);
    return this.recalculate(id);
  }

  async addItem(id: string, dto: CreateOrderItemDto): Promise<OrderWithRelations> {
    await this.getEditable(id);
    const item = await this.buildItem(dto);
    await this.ordersRepository.createItem({
      order: { connect: { id } },
      product: { connect: { id: item.productId } },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      subtotal: item.subtotal,
    });
    return this.recalculate(id);
  }

  async removeItem(id: string, itemId: string): Promise<OrderWithRelations> {
    await this.getEditable(id);
    const item = await this.ordersRepository.findItem(id, itemId);
    if (!item) {
      throw new NotFoundException('Order item not found');
    }
    await this.ordersRepository.deleteItem(itemId);
    return this.recalculate(id);
  }

  async changeStatus(
    id: string,
    dto: ChangeOrderStatusDto,
    userId?: string,
  ): Promise<OrderWithRelations> {
    const order = await this.getExisting(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('A completed order cannot change status');
    }

    if (dto.status === OrderStatus.COMPLETED) {
      return this.complete(order, userId);
    }

    return this.ordersRepository.update(id, { status: dto.status });
  }

  async remove(id: string): Promise<void> {
    const order = await this.getExisting(id);
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('A completed order cannot be deleted');
    }
    await this.ordersRepository.softDelete(id);
  }

  /** Completes an order: validates stock, then atomically sets status and writes SALE movements. */
  private async complete(order: OrderWithRelations, userId?: string): Promise<OrderWithRelations> {
    if (order.items.length === 0) {
      throw new BadRequestException('Cannot complete an order without items');
    }

    for (const item of order.items) {
      const { balance } = await this.inventoryService.getProductBalance(item.productId);
      if (balance < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${item.product.sku}`);
      }
    }

    const movements: Prisma.InventoryMovementCreateManyInput[] = order.items.map((item) => ({
      productId: item.productId,
      type: InventoryMovementType.SALE,
      quantity: item.quantity,
      unit: 'unit',
      reason: `Order ${order.id} completed`,
      referenceId: order.id,
      createdById: userId ?? null,
    }));

    return this.ordersRepository.completeWithStockMovements(order.id, movements);
  }

  private async recalculate(id: string): Promise<OrderWithRelations> {
    const order = await this.getExisting(id);
    const subtotal = round2(order.items.reduce((sum, item) => sum + Number(item.subtotal), 0));
    const total = round2(Math.max(subtotal - Number(order.discount), 0));
    return this.ordersRepository.update(id, { subtotal, total });
  }

  private async buildItem(dto: CreateOrderItemDto): Promise<BuiltItem> {
    const product = await this.productsService.getEntity(dto.productId);
    const unitPrice = dto.unitPrice ?? Number(product.salePrice);
    const costPrice = Number(product.costPrice);
    const subtotal = round2(unitPrice * dto.quantity);
    return { productId: product.id, quantity: dto.quantity, unitPrice, costPrice, subtotal };
  }

  private async validateParties(contactId?: string, companyId?: string): Promise<void> {
    if (contactId && !(await this.contactsService.exists(contactId))) {
      throw new BadRequestException('contactId does not reference an existing contact');
    }
    if (companyId && !(await this.companiesService.exists(companyId))) {
      throw new BadRequestException('companyId does not reference an existing company');
    }
  }

  private async getExisting(id: string): Promise<OrderWithRelations> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private async getEditable(id: string): Promise<OrderWithRelations> {
    const order = await this.getExisting(id);
    if (!EDITABLE_STATUSES.has(order.status)) {
      throw new BadRequestException('Only DRAFT or PENDING orders can be edited');
    }
    return order;
  }
}
