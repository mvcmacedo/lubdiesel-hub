import { Injectable, NotFoundException } from '@nestjs/common';
import { Company } from '@prisma/client';
import type { PaginatedResponse } from '@lubdiesel/shared';
import { paginate, toSkipTake } from '../../../common/utils/pagination.util';
import { CompanyQueryDto } from '../dto/company-query.dto';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompaniesRepository } from '../repositories/companies.repository';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  create(dto: CreateCompanyDto): Promise<Company> {
    return this.companiesRepository.create({ ...dto });
  }

  async findAll(query: CompanyQueryDto): Promise<PaginatedResponse<Company>> {
    const { skip, take } = toSkipTake({ page: query.page, pageSize: query.pageSize });
    const { items, total } = await this.companiesRepository.findManyPaginated(query, skip, take);
    return paginate(items, total, { page: query.page, pageSize: query.pageSize });
  }

  findOne(id: string): Promise<Company> {
    return this.getExisting(id);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.getExisting(id);
    return this.companiesRepository.update(id, { ...dto });
  }

  async remove(id: string): Promise<void> {
    await this.getExisting(id);
    await this.companiesRepository.softDelete(id);
  }

  exists(id: string): Promise<boolean> {
    return this.companiesRepository.exists(id);
  }

  private async getExisting(id: string): Promise<Company> {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }
}
