import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ChangeOrderStatusDto } from '../dto/change-order-status.dto';
import { CreateOrderItemDto } from '../dto/create-order-item.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrdersService } from '../services/orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order with items' })
  create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List orders (filter by status/source/customer)' })
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order with its items' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order (DRAFT/PENDING only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add an item to an order (DRAFT/PENDING only)' })
  addItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateOrderItemDto) {
    return this.ordersService.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove an item from an order (DRAFT/PENDING only)' })
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.ordersService.removeItem(id, itemId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change order status (COMPLETED writes stock movements)' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.changeStatus(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an order (not allowed when COMPLETED)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }
}
