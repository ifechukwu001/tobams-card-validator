import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:./data/cards.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
