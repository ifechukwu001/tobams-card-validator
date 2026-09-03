import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * One row per validated card. The card number is the natural primary key;
 * the generated cardholder name and the expiry/CVV the card was first
 * validated with are pinned to it.
 */
export const cards = sqliteTable('cards', {
  cardNumber: text('card_number').primaryKey(),
  cardholderName: text('cardholder_name').notNull(),
  expiryDate: text('expiry_date').notNull(),
  cvv: text('cvv').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
