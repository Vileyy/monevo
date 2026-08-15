import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @GetUser('id') userId: string,
    @Body() createDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, createDto);
  }

  @Get()
  findAll(
    @GetUser('id') userId: string,
    @Query() queryDto: QueryTransactionDto,
  ) {
    return this.transactionsService.findAll(userId, queryDto);
  }

  @Get(':id')
  findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.transactionsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, id, updateDto);
  }

  @Delete(':id')
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.transactionsService.remove(userId, id);
  }
}
