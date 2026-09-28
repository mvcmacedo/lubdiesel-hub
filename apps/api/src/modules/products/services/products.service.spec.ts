import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Product } from '@prisma/client';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductsService } from './products.service';

const buildProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'prod-1',
    sku: 'LUB-060',
    name: 'Lubdiesel 60 ml',
    description: null,
    volumeMl: 60,
    costPrice: '10' as unknown as Product['costPrice'],
    salePrice: '25' as unknown as Product['salePrice'],
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  }) as Product;

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            findById: jest.fn(),
            findBySku: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            exists: jest.fn(),
            findManyPaginated: jest.fn(),
            findAllBasic: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
    repository = moduleRef.get(ProductsRepository);
  });

  it('rejects a duplicate SKU on create', async () => {
    repository.findBySku.mockResolvedValue(buildProduct());

    await expect(
      service.create({ sku: 'LUB-060', name: 'Dup', volumeMl: 60, costPrice: 10, salePrice: 25 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates a product when the SKU is free', async () => {
    repository.findBySku.mockResolvedValue(null);
    repository.create.mockResolvedValue(buildProduct());

    const result = await service.create({
      sku: 'LUB-060',
      name: 'Lubdiesel 60 ml',
      volumeMl: 60,
      costPrice: 10,
      salePrice: 25,
    });

    expect(result.sku).toBe('LUB-060');
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('throws NotFound for a missing product', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
