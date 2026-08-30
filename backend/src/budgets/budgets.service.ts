import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdate(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }

    const budget = await this.prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
      update: {
        amount: dto.amount,
      },
      create: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
      },
      include: {
        category: true,
      },
    });

    return budget;
  }

  async findAll(userId: string, query: QueryBudgetDto) {
    const now = new Date();
    const month = query.month || now.getMonth() + 1;
    const year = query.year || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [budgets, transactions] = await Promise.all([
      this.prisma.budget.findMany({
        where: {
          userId,
          month,
          year,
        },
        include: {
          category: true,
        },
        orderBy: {
          amount: 'desc',
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          categoryId: true,
          amount: true,
        },
      }),
    ]);

    // Aggregate spending per category
    const categorySpentMap: Record<string, number> = {};
    for (const tx of transactions) {
      categorySpentMap[tx.categoryId] =
        (categorySpentMap[tx.categoryId] || 0) + tx.amount;
    }

    let totalBudget = 0;
    let totalSpent = 0;

    const items = budgets.map((b) => {
      const spent = categorySpentMap[b.categoryId] || 0;
      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;

      totalBudget += b.amount;
      totalSpent += spent;

      return {
        ...b,
        spent,
        remaining,
        percentage: Number(percentage.toFixed(1)),
      };
    });

    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage =
      totalBudget > 0
        ? Number(((totalSpent / totalBudget) * 100).toFixed(1))
        : 0;

    return {
      month,
      year,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        overallPercentage,
      },
      items,
    };
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    const startDate = new Date(budget.year, budget.month - 1, 1);
    const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    const spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = budget.amount - spent;
    const percentage =
      budget.amount > 0
        ? Number(((spent / budget.amount) * 100).toFixed(1))
        : 0;

    return {
      ...budget,
      spent,
      remaining,
      percentage,
    };
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budget.delete({
      where: { id },
    });
  }
}
