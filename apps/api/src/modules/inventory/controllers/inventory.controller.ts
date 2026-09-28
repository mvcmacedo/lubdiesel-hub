import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { MovementQueryDto } from '../dto/movement-query.dto';
import { InventoryService } from '../services/inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('movements')
  @ApiOperation({ summary: 'Register a stock movement' })
  createMovement(@Body() dto: CreateMovementDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.createMovement(dto, userId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'List stock movements (filter by product/type)' })
  listMovements(@Query() query: MovementQueryDto) {
    return this.inventoryService.listMovements(query);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Current balance for every product' })
  getBalances() {
    return this.inventoryService.getBalances();
  }

  @Get('products/:id/balance')
  @ApiOperation({ summary: 'Current balance for a single product' })
  getProductBalance(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.getProductBalance(id);
  }
}
