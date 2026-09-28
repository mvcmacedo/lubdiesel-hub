import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { InventoryRepository } from './inventory.repository';

describe('InventoryRepository (balance signs)', () => {
  let repository: InventoryRepository;
  const groupBy = jest.fn();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryRepository,
        { provide: PrismaService, useValue: { inventoryMovement: { groupBy } } },
      ],
    }).compile();

    repository = moduleRef.get(InventoryRepository);
    groupBy.mockReset();
  });

  it('adds inbound, subtracts outbound and applies signed adjustments', async () => {
    groupBy.mockResolvedValue([
      { type: 'PURCHASE', _sum: { quantity: 100 } },
      { type: 'RETURN', _sum: { quantity: 10 } },
      { type: 'SALE', _sum: { quantity: 30 } },
      { type: 'GIFT', _sum: { quantity: 5 } },
      { type: 'ADJUSTMENT', _sum: { quantity: -5 } },
    ]);

    // 100 + 10 - 30 - 5 + (-5) = 70
    await expect(repository.balanceForProduct('prod-1')).resolves.toBe(70);
  });

  it('returns 0 when there are no movements', async () => {
    groupBy.mockResolvedValue([]);
    await expect(repository.balanceForProduct('prod-1')).resolves.toBe(0);
  });
});
