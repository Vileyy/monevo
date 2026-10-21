import { of } from 'rxjs';
import { Prisma } from '../../generated/prisma/client';
import { DecimalSerializerInterceptor } from '../../src/common/interceptors/decimal-serializer.interceptor';

describe('DecimalSerializerInterceptor', () => {
  const interceptor = new DecimalSerializerInterceptor();

  const run = (payload: unknown) =>
    new Promise((resolve) => {
      interceptor
        .intercept({} as never, { handle: () => of(payload) } as never)
        .subscribe(resolve);
    });

  it('serializes Decimal values as numbers', async () => {
    const result = await run({
      id: 't1',
      amount: new Prisma.Decimal('12.50'),
      wallet: { balance: new Prisma.Decimal('1000.00') },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(result).toEqual({
      id: 't1',
      amount: 12.5,
      wallet: { balance: 1000 },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('serializes Decimal values inside arrays', async () => {
    await expect(
      run([new Prisma.Decimal('1.10'), new Prisma.Decimal('2.20')]),
    ).resolves.toEqual([1.1, 2.2]);
  });
});
