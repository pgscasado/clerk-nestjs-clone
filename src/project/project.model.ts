import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { User } from 'src/user/user.model';

export const Project = pgTable('projects', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name').notNull(),
  ownerUserId: integer('owner_user_id')
    .notNull()
    .references(() => User.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Project = typeof Project.$inferSelect;
