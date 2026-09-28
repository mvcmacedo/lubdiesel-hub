import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

interface FindManyOptions {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

const SORTABLE_FIELDS = new Set(['name', 'email', 'role', 'createdAt', 'updatedAt']);

/** Data-access layer for the User aggregate. All queries exclude soft-deleted rows. */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  }

  async findManyPaginated(options: FindManyOptions): Promise<{ items: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { email: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderByField =
      options.sortBy && SORTABLE_FIELDS.has(options.sortBy) ? options.sortBy : 'createdAt';
    const orderBy: Prisma.UserOrderByWithRelationInput = { [orderByField]: options.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, orderBy, skip: options.skip, take: options.take }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }
}
