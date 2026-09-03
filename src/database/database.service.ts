import { createClient } from '@libsql/client';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

export type Database = LibSQLDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private client!: ReturnType<typeof createClient>;

  readonly db!: Database;

  async onModuleInit(): Promise<void> {
    const url = process.env.DATABASE_URL ?? 'file:./data/cards.db';
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    this.client = createClient({ url, authToken });
    (this as { db: Database }).db = drizzle({
      client: this.client,
      schema,
      casing: 'snake_case',
    });
    this.logger.log(`Database target: ${url}`);
  }

  onModuleDestroy(): void {
    this.client.close();
  }
}
