import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { PayReminderDto } from './dto/pay-reminder.dto';

@ApiTags('reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  create(
    @GetUser('id') userId: string,
    @Body() createReminderDto: CreateReminderDto,
  ) {
    return this.remindersService.create(userId, createReminderDto);
  }

  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.remindersService.findAll(userId);
  }

  @Get(':id')
  findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.remindersService.findOne(userId, id);
  }

  @Post(':id/pay')
  pay(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() payReminderDto: PayReminderDto,
  ) {
    return this.remindersService.pay(userId, id, payReminderDto);
  }

  @Patch(':id')
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    return this.remindersService.update(userId, id, updateReminderDto);
  }

  @Delete(':id')
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.remindersService.remove(userId, id);
  }
}
