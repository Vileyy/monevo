import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { recordDatabaseQuery } from '../common/profiling/request-timing';

interface QueryEvent {
  duration: number;
}

/**
 * Set `DB_TIMING_ENABLED=false` to drop the per-query event listener. It is on
 * by default so `Server-Timing` always reports a real database split; the
 * listener only costs an object allocation per query.
 */
const dbTimingEnabled = process.env.DB_TIMING_ENABLED !== 'false';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({
      adapter,
      ...(dbTimingEnabled
        ? { log: [{ emit: 'event' as const, level: 'query' as const }] }
        : {}),
    });

    if (dbTimingEnabled) {
      this.$on('query' as never, (event: QueryEvent) =>
        recordDatabaseQuery(event.duration),
      );
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
