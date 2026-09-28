import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, Product } from '@prisma/client';
import { CompaniesService } from '../../companies/services/companies.service';
import { ContactsService } from '../../contacts/services/contacts.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { ProductsService } from '../../products/services/products.service';
import { OrdersRepository, OrderWithRelations } from '../repositories/orders.repository';
import { OrdersService } from './orders.service';

const buildProduct = (): Product =>
  ({ id: 'p1', sku: 'LUB-060', salePrice: 10, costPrice: 6 }) as unknown as Product;

const buildOrder = (overrides: Partial<OrderWithRelations> = {}): OrderWithRelations =>
  ({
    id: 'o1',
    status: OrderStatus.PENDING,
    discount: 0,
    subtotal: 0,
    total: 0,
    items: [],
    ...overrides,
  }) as unknown as OrderWithRelations;

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: jest.Mocked<OrdersRepository>;
  let productsService: jest.Mocked<ProductsService>;
  let inventoryService: jest.Mocked<InventoryService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findItem: jest.fn(),
            update: jest.fn(),
            createItem: jest.fn(),
            deleteItem: jest.fn(),
            softDelete: jest.fn(),
            completeWithStockMovements: jest.fn(),
            findManyPaginated: jest.fn(),
          },
        },
        { provide: ProductsService, useValue: { getEntity: jest.fn(), exists: jest.fn() } },
        { provide: InventoryService, useValue: { getProductBalance: jest.fn() } },
        { provide: ContactsService, useValue: { exists: jest.fn().mockResolvedValue(true) } },
        { provide: CompaniesService, useValue: { exists: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
    repository = moduleRef.get(OrdersRepository);
    productsService = moduleRef.get(ProductsService);
    inventoryService = moduleRef.get(InventoryService);
  });

  describe('create', () => {
    it('snapshots prices and computes totals with discount', async () => {
      productsService.getEntity.mockResolvedValue(buildProduct());
      repository.create.mockResolvedValue(buildOrder());

      await service.create({ items: [{ productId: 'p1', quantity: 2 }], discount: 5 }, 'user-1');

      const [data] = repository.create.mock.calls[0];
      expect(data.subtotal).toBe(20);
      expect(data.total).toBe(15);
      const created = (data.items as unknown as { create: Array<Record<string, unknown>> }).create;
      expect(created[0]).toMatchObject({ quantity: 2, unitPrice: 10, costPrice: 6, subtotal: 20 });
    });
  });

  describe('changeStatus', () => {
    it('blocks changes on a completed order', async () => {
      repository.findById.mockResolvedValue(buildOrder({ status: OrderStatus.COMPLETED }));

      await expect(
        service.changeStatus('o1', { status: OrderStatus.CANCELLED }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects completion when stock is insufficient', async () => {
      repository.findById.mockResolvedValue(
        buildOrder({
          items: [{ productId: 'p1', quantity: 5, product: { sku: 'LUB-060' } }] as never,
        }),
      );
      inventoryService.getProductBalance.mockResolvedValue({ productId: 'p1', balance: 1 });

      await expect(
        service.changeStatus('o1', { status: OrderStatus.COMPLETED }, 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.completeWithStockMovements).not.toHaveBeenCalled();
    });

    it('completes and writes SALE movements when stock is sufficient', async () => {
      repository.findById.mockResolvedValue(
        buildOrder({
          items: [{ productId: 'p1', quantity: 2, product: { sku: 'LUB-060' } }] as never,
        }),
      );
      inventoryService.getProductBalance.mockResolvedValue({ productId: 'p1', balance: 10 });
      repository.completeWithStockMovements.mockResolvedValue(
        buildOrder({ status: OrderStatus.COMPLETED }),
      );

      await service.changeStatus('o1', { status: OrderStatus.COMPLETED }, 'user-1');

      const [orderId, movements] = repository.completeWithStockMovements.mock.calls[0];
      expect(orderId).toBe('o1');
      expect(movements[0]).toMatchObject({
        productId: 'p1',
        type: 'SALE',
        quantity: 2,
        referenceId: 'o1',
      });
    });
  });
});
