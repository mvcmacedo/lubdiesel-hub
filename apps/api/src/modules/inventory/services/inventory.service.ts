import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryMovement, InventoryMovementType, Prisma } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { ProductsService } from '../../products/services/products.service';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { MovementQueryDto } from '../dto/movement-query.dto';
import { InventoryRepository } from '../repositories/inventory.repository';

export interface ProductBalance {
  productId: string;
  sku: string;
  name: string;
  balance: number;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productsService: ProductsService,
  ) {}

  async createMovement(dto: CreateMovementDto, userId?: string): Promise<InventoryMovement> {
    if (!(await this.productsService.exists(dto.productId))) {
      throw new BadRequestException('productId does not reference an existing product');
    }
    if (dto.type !== InventoryMovementType.ADJUSTMENT && dto.quantity < 0) {
      throw new BadRequestException('Only ADJUSTMENT movements may have a negative quantity');
    }

    const data: Prisma.InventoryMovementCreateInput = {
      product: { connect: { id: dto.productId } },
      type: dto.type,
      quantity: dto.quantity,
      unit: dto.unit ?? 'unit',
      ...(dto.reason ? { reason: dto.reason } : {}),
      ...(dto.referenceId ? { referenceId: dto.referenceId } : {}),
      ...(userId ? { createdBy: { connect: { id: userId } } } : {}),
    };

    return this.inventoryRepository.create(data);
  }

  async listMovements(query: MovementQueryDto): Promise<PaginatedResponse<InventoryMovement>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.inventoryRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }

  async getProductBalance(productId: string): Promise<{ productId: string; balance: number }> {
    if (!(await this.productsService.exists(productId))) {
      throw new BadRequestException('productId does not reference an existing product');
    }
    const balance = await this.inventoryRepository.balanceForProduct(productId);
    return { productId, balance };
  }

  async getBalances(): Promise<ProductBalance[]> {
    const [products, balances] = await Promise.all([
      this.productsService.listBasic(),
      this.inventoryRepository.balancesByProduct(),
    ]);
    return products.map((product) => ({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      balance: balances.get(product.id) ?? 0,
    }));
  }

  async getBalanceBySku(sku: string): Promise<number> {
    const product = await this.productsService.findEntityBySku(sku);
    if (!product) {
      return 0;
    }
    return this.inventoryRepository.balanceForProduct(product.id);
  }
}
