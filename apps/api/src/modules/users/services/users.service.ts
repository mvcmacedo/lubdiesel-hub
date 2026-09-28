import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { HashingService } from '../../../common/security/hashing.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashingService: HashingService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await this.hashingService.hash(dto.password);
    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.USER,
    });

    return UserResponseDto.fromEntity(user);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.usersRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return paginate(items.map(UserResponseDto.fromEntity), total, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.getExistingUser(id);
    return UserResponseDto.fromEntity(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.getExistingUser(id);

    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const passwordHash = dto.password ? await this.hashingService.hash(dto.password) : undefined;

    const user = await this.usersRepository.update(id, {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      active: dto.active,
      ...(passwordHash ? { passwordHash } : {}),
    });

    return UserResponseDto.fromEntity(user);
  }

  async remove(id: string): Promise<void> {
    await this.getExistingUser(id);
    await this.usersRepository.softDelete(id);
  }

  /** Returns the raw entity (including password hash) for authentication. */
  findByEmailWithSecret(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  /** Returns the raw entity by id (used by the token refresh flow). */
  findEntityById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  private async getExistingUser(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
