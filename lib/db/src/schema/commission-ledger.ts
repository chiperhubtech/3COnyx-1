import { pgTable, text, serial, integer, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { vehiclesTable } from "./vehicles";
import { gigTasksTable } from "./gig-tasks";

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "Referral",
  "GigCompletion",
  "Bonus",
  "Clawback",
  "Adjustment",
]);

export const ledgerEntryStatusEnum = pgEnum("ledger_entry_status", [
  "Pending",
  "Approved",
  "Paid",
  "Failed",
  "Voided",
]);

export const commissionLedgerTable = pgTable("commission_ledger", {
  id: serial("id").primaryKey(),
  entryType: ledgerEntryTypeEnum("entry_type").notNull(),
  status: ledgerEntryStatusEnum("status").notNull().default("Pending"),

  recipientId: integer("recipient_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),

  vehicleId: integer("vehicle_id").references(() => vehiclesTable.id, { onDelete: "set null" }),
  gigTaskId: integer("gig_task_id").references(() => gigTasksTable.id, { onDelete: "set null" }),

  referredByUserId: integer("referred_by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),

  amountUsd: numeric("amount_usd", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),

  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommissionLedgerSchema = createInsertSchema(commissionLedgerTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCommissionLedgerSchema = createSelectSchema(commissionLedgerTable);

export type InsertCommissionLedger = z.infer<typeof insertCommissionLedgerSchema>;
export type CommissionLedger = typeof commissionLedgerTable.$inferSelect;
