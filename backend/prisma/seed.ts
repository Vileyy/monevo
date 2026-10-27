/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const DEMO_EMAIL = (process.env.DEMO_EMAIL ?? 'demo@monevo.app').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const DEMO_NAME = process.env.DEMO_NAME ?? 'Monevo Demo';

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }
  if (!DEMO_PASSWORD) {
    throw new Error(
      'DEMO_PASSWORD is required. Set it to a unique value in deploy/.env, then use the same value in Play Console.',
    );
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        name: DEMO_NAME,
        password: passwordHash,
      },
      create: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        password: passwordHash,
      },
    });

    const walletCount = await prisma.wallet.count({
      where: { userId: user.id },
    });

    if (walletCount > 0) {
      console.log(
        `[seed] Demo account already has data (${DEMO_EMAIL}). Password refreshed.`,
      );
      return;
    }

    const [cash, bank, card] = await Promise.all([
      prisma.wallet.create({
        data: {
          userId: user.id,
          name: 'Daily Cash',
          type: 'CASH',
          balance: '3200000.00',
        },
      }),
      prisma.wallet.create({
        data: {
          userId: user.id,
          name: 'Everyday Bank',
          type: 'BANK',
          balance: '24500000.00',
        },
      }),
      prisma.wallet.create({
        data: {
          userId: user.id,
          name: 'Credit Card',
          type: 'CREDIT_CARD',
          balance: '0.00',
        },
      }),
    ]);

    const [salary, food, transport, shopping, bills, entertainment] =
      await Promise.all([
        prisma.category.create({
          data: { userId: user.id, name: 'Salary', type: 'INCOME' },
        }),
        prisma.category.create({
          data: { userId: user.id, name: 'Food & Dining', type: 'EXPENSE' },
        }),
        prisma.category.create({
          data: { userId: user.id, name: 'Transport', type: 'EXPENSE' },
        }),
        prisma.category.create({
          data: { userId: user.id, name: 'Shopping', type: 'EXPENSE' },
        }),
        prisma.category.create({
          data: { userId: user.id, name: 'Bills & Utilities', type: 'EXPENSE' },
        }),
        prisma.category.create({
          data: { userId: user.id, name: 'Entertainment', type: 'EXPENSE' },
        }),
      ]);

    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          walletId: bank.id,
          categoryId: salary.id,
          type: 'INCOME',
          amount: '25000000.00',
          note: 'Monthly salary',
          date: daysAgo(9),
        },
        {
          userId: user.id,
          walletId: cash.id,
          categoryId: food.id,
          type: 'EXPENSE',
          amount: '150000.00',
          note: 'Dinner with friends',
          date: daysAgo(6),
        },
        {
          userId: user.id,
          walletId: cash.id,
          categoryId: transport.id,
          type: 'EXPENSE',
          amount: '45000.00',
          note: 'Ride to office',
          date: daysAgo(5),
        },
        {
          userId: user.id,
          walletId: bank.id,
          categoryId: shopping.id,
          type: 'EXPENSE',
          amount: '890000.00',
          note: 'New running shoes',
          date: daysAgo(4),
        },
        {
          userId: user.id,
          walletId: bank.id,
          categoryId: bills.id,
          type: 'EXPENSE',
          amount: '850000.00',
          note: 'Electricity bill',
          date: daysAgo(3),
        },
        {
          userId: user.id,
          walletId: card.id,
          categoryId: entertainment.id,
          type: 'EXPENSE',
          amount: '220000.00',
          note: 'Cinema tickets',
          date: daysAgo(2),
        },
        {
          userId: user.id,
          walletId: cash.id,
          categoryId: food.id,
          type: 'EXPENSE',
          amount: '65000.00',
          note: 'Morning coffee',
          date: daysAgo(1),
        },
      ],
    });

    const now = new Date();
    await Promise.all([
      prisma.budget.create({
        data: {
          userId: user.id,
          categoryId: food.id,
          amount: '3000000.00',
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      }),
      prisma.reminder.create({
        data: {
          userId: user.id,
          title: 'Electricity bill',
          amount: '850000.00',
          dueDate: 15,
          frequency: 'MONTHLY',
          category: 'ELECTRICITY',
          walletId: bank.id,
        },
      }),
    ]);

    console.log(`[seed] Demo account ready: ${DEMO_EMAIL}`);
    console.log(`[seed] Wallets: 3, categories: 6, transactions: 7.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[seed] Failed:', error);
  process.exitCode = 1;
});
