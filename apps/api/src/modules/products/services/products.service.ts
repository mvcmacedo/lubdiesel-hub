import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productsRepository.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException('A product with this SKU already exists');
    }
    return this.productsRepository.create({ ...dto });
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedResponse<Product>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.productsRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }

  findOne(id: string): Promise<Product> {
    return this.getExisting(id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.getExisting(id);
    if (dto.sku) {
      const existing = await this.productsRepository.findBySku(dto.sku);
      if (existing && existing.id !== id) {
        throw new ConflictException('A product with this SKU already exists');
      }
    }
    return this.productsRepository.update(id, { ...dto });
  }

  async remove(id: string): Promise<void> {
    await this.getExisting(id);
    await this.productsRepository.softDelete(id);
  }

  exists(id: string): Promise<boolean> {
    return this.productsRepository.exists(id);
  }

  /** Returns the product entity (or throws) — used by orders to snapshot prices. */
  getEntity(id: string): Promise<Product> {
    return this.getExisting(id);
  }

  findEntityBySku(sku: string): Promise<Product | null> {
    return this.productsRepository.findBySku(sku);
  }

  listBasic(): Promise<{ id: string; sku: string; name: string }[]> {
    return this.productsRepository.findAllBasic();
  }

  private async getExisting(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
