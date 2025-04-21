import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const User = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: varchar().unique().notNull(),
  passwordHash: varchar().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof User.$inferSelect;
