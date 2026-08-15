import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createDto: CreateTransactionDto) {
    const { walletId, categoryId, amount, type, note, date } = createDto;

    // Verify wallet belongs to user
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundException(`Wallet with ID "${walletId}" not found`);
    }

    // Verify category belongs to user
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.userId !== userId) {
      throw new NotFoundException(`Category with ID "${categoryId}" not found`);
    }

    // Validate category type matches transaction type
    if (category.type !== type) {
      throw new BadRequestException(
        `Transaction type (${type}) does not match category type (${category.type})`,
      );
    }

    const transactionDate = date ? new Date(date) : new Date();

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount,
          type,
          note,
          date: transactionDate,
          walletId,
          categoryId,
          userId,
        },
      });

      // 2. Adjust Wallet Balance
      const balanceChange = type === 'INCOME' ? amount : -amount;
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      return transaction;
    });
  }

  async findAll(userId: string, queryDto: QueryTransactionDto) {
    const { walletId, categoryId, type, startDate, endDate } = queryDto;
    const where: Prisma.TransactionWhereInput = { userId };

    if (walletId) where.walletId = walletId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        wallet: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        wallet: true,
        category: true,
      },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }

    return transaction;
  }

  async update(userId: string, id: string, updateDto: UpdateTransactionDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch current transaction and verify owner
      const currentTx = await tx.transaction.findUnique({ where: { id } });
      if (!currentTx || currentTx.userId !== userId) {
        throw new NotFoundException(`Transaction with ID "${id}" not found`);
      }

      const finalWalletId = updateDto.walletId || currentTx.walletId;
      const finalCategoryId = updateDto.categoryId || currentTx.categoryId;
      const finalType = updateDto.type || currentTx.type;
      const finalAmount =
        updateDto.amount !== undefined ? updateDto.amount : currentTx.amount;

      // If wallet is changing, verify new wallet belongs to user
      if (updateDto.walletId && updateDto.walletId !== currentTx.walletId) {
        const newWallet = await tx.wallet.findUnique({
          where: { id: updateDto.walletId },
        });
        if (!newWallet || newWallet.userId !== userId) {
          throw new NotFoundException(
            `Wallet with ID "${updateDto.walletId}" not found`,
          );
        }
      }

      // If category is changing, verify new category belongs to user & types match
      if (
        updateDto.categoryId &&
        updateDto.categoryId !== currentTx.categoryId
      ) {
        const newCategory = await tx.category.findUnique({
          where: { id: updateDto.categoryId },
        });
        if (!newCategory || newCategory.userId !== userId) {
          throw new NotFoundException(
            `Category with ID "${updateDto.categoryId}" not found`,
          );
        }
        if (newCategory.type !== finalType) {
          throw new BadRequestException(
            `Transaction type (${finalType}) does not match category type (${newCategory.type})`,
          );
        }
      }

      // 2. Revert current transaction's balance impact on the old wallet
      const oldRevertChange =
        currentTx.type === 'INCOME' ? -currentTx.amount : currentTx.amount;
      await tx.wallet.update({
        where: { id: currentTx.walletId },
        data: { balance: { increment: oldRevertChange } },
      });

      // 3. Apply new transaction's balance impact on the target wallet
      const newApplyChange =
        finalType === 'INCOME' ? finalAmount : -finalAmount;
      await tx.wallet.update({
        where: { id: finalWalletId },
        data: { balance: { increment: newApplyChange } },
      });

      // 4. Save updated transaction
      return tx.transaction.update({
        where: { id },
        data: {
          amount: finalAmount,
          type: finalType,
          note: updateDto.note !== undefined ? updateDto.note : currentTx.note,
          date: updateDto.date ? new Date(updateDto.date) : currentTx.date,
          walletId: finalWalletId,
          categoryId: finalCategoryId,
        },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch current transaction and verify owner
      const transaction = await tx.transaction.findUnique({ where: { id } });
      if (!transaction || transaction.userId !== userId) {
        throw new NotFoundException(`Transaction with ID "${id}" not found`);
      }

      // 2. Revert wallet balance
      const balanceChange =
        transaction.type === 'INCOME'
          ? -transaction.amount
          : transaction.amount;
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      // 3. Delete Transaction
      return tx.transaction.delete({
        where: { id },
      });
    });
  }
}
