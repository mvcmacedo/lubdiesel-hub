import { Injectable } from '@nestjs/common';
import { LeadStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { getMonthBounds, startOfDaysAgo, toDateKey } from '../../../common/utils/date.util';
import { FollowUpsService } from '../../follow-ups/services/follow-ups.service';
import { InventoryService } from '../../inventory/services/inventory.service';

/** Pipeline stages shown on the dashboard (LOST excluded). */
const PIPELINE_STAGES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.INTERESTED,
  LeadStatus.NEGOTIATION,
  LeadStatus.WAITING,
  LeadStatus.WON,
];

export interface DashboardSummary {
  cards: {
    leadsNew: number;
    leadsNegotiation: number;
    customers: number;
    resellers: number;
    salesThisMonth: number;
    revenueThisMonth: number;
    stock60ml: number;
    stock1L: number;
  };
  pipeline: { status: LeadStatus; count: number }[];
  followUps: { today: number; overdue: number; upcoming: number };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly followUpsService: FollowUpsService,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const { startOfMonth, endOfMonth } = getMonthBounds();

    const [
      leadsNew,
      leadsNegotiation,
      customers,
      resellers,
      monthlyOrders,
      stock60ml,
      stock1L,
      pipelineGroups,
      followUps,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { status: LeadStatus.NEW, deletedAt: null } }),
      this.prisma.lead.count({ where: { status: LeadStatus.NEGOTIATION, deletedAt: null } }),
      this.prisma.contact.count({ where: { type: 'CUSTOMER', deletedAt: null } }),
      this.prisma.contact.count({ where: { type: 'RESELLER', deletedAt: null } }),
      this.prisma.order.aggregate({
        where: {
          status: OrderStatus.COMPLETED,
          completedAt: { gte: startOfMonth, lt: endOfMonth },
          deletedAt: null,
        },
        _count: true,
        _sum: { total: true },
      }),
      this.inventoryService.getBalanceBySku('LUB-060'),
      this.inventoryService.getBalanceBySku('LUB-1000'),
      this.prisma.lead.groupBy({ by: ['status'], where: { deletedAt: null }, _count: true }),
      this.followUpsService.summary(),
    ]);

    const pipelineCounts = new Map(pipelineGroups.map((group) => [group.status, group._count]));

    return {
      cards: {
        leadsNew,
        leadsNegotiation,
        customers,
        resellers,
        salesThisMonth: monthlyOrders._count,
        revenueThisMonth: Number(monthlyOrders._sum.total ?? 0),
        stock60ml,
        stock1L,
      },
      pipeline: PIPELINE_STAGES.map((status) => ({
        status,
        count: pipelineCounts.get(status) ?? 0,
      })),
      followUps,
    };
  }

  async getLeadSources(): Promise<{ source: string; count: number }[]> {
    const groups = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { deletedAt: null },
      _count: true,
    });
    return groups
      .map((group) => ({ source: group.source, count: group._count }))
      .sort((a, b) => b.count - a.count);
  }

  async getLossReasons(): Promise<{ reason: string; count: number }[]> {
    const groups = await this.prisma.lead.groupBy({
      by: ['lostReason'],
      where: { status: LeadStatus.LOST, deletedAt: null, lostReason: { not: null } },
      _count: true,
    });
    return groups
      .map((group) => ({ reason: group.lostReason as string, count: group._count }))
      .sort((a, b) => b.count - a.count);
  }

  async getSales(days: number): Promise<{ date: string; total: number; count: number }[]> {
    const from = startOfDaysAgo(days - 1);
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.COMPLETED, completedAt: { gte: from }, deletedAt: null },
      select: { completedAt: true, total: true },
    });

    const buckets = new Map<string, { total: number; count: number }>();
    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(from);
      day.setDate(from.getDate() + offset);
      buckets.set(toDateKey(day), { total: 0, count: 0 });
    }

    for (const order of orders) {
      if (!order.completedAt) continue;
      const key = toDateKey(order.completedAt);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.total += Number(order.total);
        bucket.count += 1;
      }
    }

    return Array.from(buckets.entries()).map(([date, value]) => ({
      date,
      total: Math.round(value.total * 100) / 100,
      count: value.count,
    }));
  }
}
