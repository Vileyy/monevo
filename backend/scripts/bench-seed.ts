/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';

/**
 * Fills a database with a realistic amount of history for one user so the API
 * can be benchmarked. Point DATABASE_URL at a throwaway database, never at
 * production: transactions for the bench user are deleted first.
 *
 *   DATABASE_URL=postgresql://... BENCH_PASSWORD=secret \
 *     pnpm --filter backend bench:seed
 */
const BENCH_EMAIL = (
  process.env.BENCH_EMAIL ?? 'bench@monevo.app'
).toLowerCase();
const BENCH_PASSWORD = process.env.BENCH_PASSWORD ?? 'bench-password';
const TRANSACTION_COUNT = Number(process.env.BENCH_TRANSACTIONS ?? 50_000);
const MONTHS_OF_HISTORY = Number(process.env.BENCH_MONTHS ?? 24);

const WALLETS = [
  { name: 'Cash', type: 'CASH' },
  { name: 'Vietcombank', type: 'BANK' },
  { name: 'Techcombank', type: 'BANK' },
  { name: 'Credit Card', type: 'CREDIT_CARD' },
  { name: 'Savings', type: 'BANK' },
  { name: 'MoMo', type: 'BANK' },
];

const EXPENSE_CATEGORIES = [
  'Food',
  'Coffee',
  'Groceries',
  'Transport',
  'Fuel',
  'Rent',
  'Electricity',
  'Water',
  'Internet',
  'Phone',
  'Health',
  'Medicine',
  'Shopping',
  'Entertainment',
  'Travel',
  'Education',
  'Gifts',
  'Insurance',
];

const INCOME_CATEGORIES = ['Salary', 'Bonus', 'Freelance', 'Interest'];

const NOTES = [
  'lunch with team',
  'grab ride to office',
  'monthly rent',
  'coffee at the corner',
  'supermarket run',
  'electricity bill',
  'phone top up',
  'pharmacy',
  'cinema tickets',
  'book purchase',
  'fuel refill',
  'gym membership',
];

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randomAmount(): number {
  // 10,000 - 2,000,000 VND, rounded to the nearest 1,000.
  return (10 + randomInt(1990)) * 1_000;
}

function randomDate(months: number): Date {
  const now = Date.now();
  const monthsAgo = randomInt(months);
  const date = new Date(now);
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(1 + randomInt(28));
  date.setHours(randomInt(24), randomInt(60), randomInt(60), 0);
  return date;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const password = await bcrypt.hash(BENCH_PASSWORD, 10);
    const user = await prisma.user.upsert({
      where: { email: BENCH_EMAIL },
      update: { password, name: 'Bench User' },
      create: {
        email: BENCH_EMAIL,
        name: 'Bench User',
        password,
      },
    });

    await prisma.transaction.deleteMany({ where: { userId: user.id } });

    const existingWallets = await prisma.wallet.count({
      where: { userId: user.id },
    });
    if (existingWallets === 0) {
      await prisma.wallet.createMany({
        data: WALLETS.map((wallet) => ({ ...wallet, userId: user.id })),
      });
    }

    const existingCategories = await prisma.category.count({
      where: { userId: user.id },
    });
    if (existingCategories === 0) {
      await prisma.category.createMany({
        data: [
          ...EXPENSE_CATEGORIES.map((name) => ({
            name,
            type: 'EXPENSE',
            icon: 'tag',
            userId: user.id,
          })),
          ...INCOME_CATEGORIES.map((name) => ({
            name,
            type: 'INCOME',
            icon: 'wallet',
            userId: user.id,
          })),
        ],
      });
    }

    const [wallets, categories] = await Promise.all([
      prisma.wallet.findMany({ where: { userId: user.id } }),
      prisma.category.findMany({ where: { userId: user.id } }),
    ]);

    const expenses = categories.filter((c) => c.type === 'EXPENSE');
    const incomes = categories.filter((c) => c.type === 'INCOME');

    const batchSize = 5_000;
    for (let offset = 0; offset < TRANSACTION_COUNT; offset += batchSize) {
      const size = Math.min(batchSize, TRANSACTION_COUNT - offset);
      const rows: Prisma.TransactionCreateManyInput[] = [];

      for (let i = 0; i < size; i += 1) {
        const isIncome = Math.random() < 0.1;
        const category = isIncome
          ? incomes[randomInt(incomes.length)]
          : expenses[randomInt(expenses.length)];

        rows.push({
          amount: new Prisma.Decimal(
            isIncome ? randomAmount() * 12 : randomAmount(),
          ),
          type: isIncome ? 'INCOME' : 'EXPENSE',
          note: `${NOTES[randomInt(NOTES.length)]} #${offset + i}`,
          date: randomDate(MONTHS_OF_HISTORY),
          userId: user.id,
          walletId: wallets[randomInt(wallets.length)].id,
          categoryId: category.id,
        });
      }

      await prisma.transaction.createMany({ data: rows });
      process.stdout.write(
        `\rseeded ${Math.min(offset + size, TRANSACTION_COUNT)}/${TRANSACTION_COUNT} transactions`,
      );
    }

    process.stdout.write('\n');
    console.log(
      `ready: ${BENCH_EMAIL} / ${BENCH_PASSWORD} (${TRANSACTION_COUNT} transactions)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
