import { createClient } from '@libsql/client';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

export type Database = LibSQLDatabase<typeof schema>;

/**
 * Provides the Drizzle ORM handle for the configured database. The same code
 * runs against a local SQLite file, a local `turso dev` server, or Turso
 * Cloud — the environment is selected purely through env vars
 * (DATABASE_URL / DATABASE_AUTH_TOKEN).
 *
 * Schema changes are applied with the `db:generate` / `db:migrate` scripts,
 * never automatically on startup.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly client: ReturnType<typeof createClient>;

  readonly db: Database;

  constructor() {
    const url = process.env.DATABASE_URL ?? 'file:./data/cards.db';
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    this.client = createClient({ url, authToken });
    this.db = drizzle({ client: this.client, schema, casing: 'snake_case' });
    this.logger.log(`Database target: ${url}`);
  }

  onModuleDestroy(): void {
    this.client.close();
  }
}
