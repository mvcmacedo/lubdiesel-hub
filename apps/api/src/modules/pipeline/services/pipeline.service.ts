import { Injectable } from '@nestjs/common';
import { Lead, LeadStatus } from '@prisma/client';
import { ChangeLeadStageDto } from '../../leads/dto/change-lead-stage.dto';
import { BoardFilters, LeadsService } from '../../leads/services/leads.service';
import { PipelineBoardQueryDto } from '../dto/pipeline-board-query.dto';

/** Ordered board columns (LOST is intentionally excluded from the pipeline view). */
const BOARD_STAGES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.INTERESTED,
  LeadStatus.NEGOTIATION,
  LeadStatus.WAITING,
  LeadStatus.WON,
];

const STAGE_LABELS: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contato realizado',
  INTERESTED: 'Interessado',
  NEGOTIATION: 'Negociação',
  WAITING: 'Aguardando',
  WON: 'Venda',
  LOST: 'Perdido',
};

export interface PipelineColumn {
  status: LeadStatus;
  label: string;
  count: number;
  leads: Lead[];
}

@Injectable()
export class PipelineService {
  constructor(private readonly leadsService: LeadsService) {}

  async getBoard(query: PipelineBoardQueryDto): Promise<{ columns: PipelineColumn[] }> {
    const filters: BoardFilters = { source: query.source, assignedUserId: query.assignedUserId };
    const leads = await this.leadsService.getBoardLeads(filters);

    const columns = BOARD_STAGES.map<PipelineColumn>((status) => {
      const stageLeads = leads.filter((lead) => lead.status === status);
      return { status, label: STAGE_LABELS[status], count: stageLeads.length, leads: stageLeads };
    });

    return { columns };
  }

  move(leadId: string, dto: ChangeLeadStageDto, userId?: string): Promise<Lead> {
    return this.leadsService.changeStage(leadId, dto, userId);
  }
}
