import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { PayReminderDto } from './dto/pay-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReminderDto) {
    if (dto.walletId) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: dto.walletId },
      });
      if (!wallet || wallet.userId !== userId) {
        throw new NotFoundException('Wallet not found');
      }
    }

    return this.prisma.reminder.create({
      data: {
        userId,
        title: dto.title,
        amount: dto.amount,
        dueDate: dto.dueDate,
        frequency: dto.frequency || 'MONTHLY',
        category: dto.category || 'OTHER',
        walletId: dto.walletId || null,
      },
      include: {
        wallet: true,
      },
    });
  }

  async findAll(userId: string) {
    const reminders = await this.prisma.reminder.findMany({
      where: { userId },
      include: {
        wallet: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const today = now.getDate();

    return reminders.map((r) => {
      const isPaidThisMonth = r.lastPaidAt
        ? r.lastPaidAt.getMonth() === curMonth &&
          r.lastPaidAt.getFullYear() === curYear
        : false;

      const daysUntilDue = r.dueDate - today;

      let status: 'PAID' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'UPCOMING' =
        'UPCOMING';

      if (isPaidThisMonth) {
        status = 'PAID';
      } else if (daysUntilDue < 0) {
        status = 'OVERDUE';
      } else if (daysUntilDue === 0) {
        status = 'DUE_TODAY';
      } else if (daysUntilDue <= 3) {
        status = 'DUE_SOON';
      } else {
        status = 'UPCOMING';
      }

      return {
        ...r,
        isPaidThisMonth,
        daysUntilDue,
        status,
      };
    });
  }

  async findOne(userId: string, id: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        wallet: true,
      },
    });

    if (!reminder || reminder.userId !== userId) {
      throw new NotFoundException('Reminder not found');
    }

    return reminder;
  }

  async pay(userId: string, id: string, payDto: PayReminderDto) {
    const reminder = await this.findOne(userId, id);

    let targetWalletId = payDto.walletId || reminder.walletId;

    if (!targetWalletId) {
      const firstWallet = await this.prisma.wallet.findFirst({
        where: { userId },
      });
      if (!firstWallet) {
        throw new BadRequestException(
          'Please create a wallet before paying reminders',
        );
      }
      targetWalletId = firstWallet.id;
    } else {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: targetWalletId },
      });
      if (!wallet || wallet.userId !== userId) {
        throw new NotFoundException('Wallet not found');
      }
    }

    // Find or create default expense category for this reminder
    let category = await this.prisma.category.findFirst({
      where: {
        userId,
        type: 'EXPENSE',
      },
    });

    if (!category) {
      category = await this.prisma.category.create({
        data: {
          name: 'Hóa đơn / Tiền thuốc',
          type: 'EXPENSE',
          userId,
        },
      });
    }

    // Execute atomic payment
    return this.prisma.$transaction(async (tx) => {
      // 1. Decrement wallet balance
      await tx.wallet.update({
        where: { id: targetWalletId },
        data: {
          balance: {
            decrement: reminder.amount,
          },
        },
      });

      // 2. Create Transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: targetWalletId,
          categoryId: category.id,
          amount: reminder.amount,
          type: 'EXPENSE',
          note: `Đã đóng: ${reminder.title}`,
          date: new Date(),
        },
      });

      // 3. Mark reminder as paid
      const updatedReminder = await tx.reminder.update({
        where: { id },
        data: {
          lastPaidAt: new Date(),
        },
        include: {
          wallet: true,
        },
      });

      return {
        reminder: updatedReminder,
        transaction,
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateReminderDto) {
    await this.findOne(userId, id);

    if (dto.walletId) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: dto.walletId },
      });
      if (!wallet || wallet.userId !== userId) {
        throw new NotFoundException('Wallet not found');
      }
    }

    return this.prisma.reminder.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.walletId !== undefined && { walletId: dto.walletId }),
      },
      include: {
        wallet: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.reminder.delete({
      where: { id },
    });
  }
}
