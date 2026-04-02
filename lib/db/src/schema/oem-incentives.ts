import { pgTable, text, serial, integer, timestamp, jsonb, numeric, boolean } from "drizzle-orm/pg-core";

export const oemIncentivesTable = pgTable("oem_incentives", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(),
  programName: text("program_name").notNull(),
  programCode: text("program_code"),
  incentiveType: text("incentive_type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  percentOff: numeric("percent_off", { precision: 5, scale: 2 }),
  eligibleModels: jsonb("eligible_models").$type<string[]>(),
  eligibleYears: jsonb("eligible_years").$type<number[]>(),
  eligibleZipCodes: jsonb("eligible_zip_codes").$type<string[]>(),
  purchaseTypes: jsonb("purchase_types").$type<string[]>(),
  customerRequirements: jsonb("customer_requirements").$type<Record<string, string>>(),
  stackable: boolean("stackable").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  verificationStatus: text("verification_status").default("active"),
  region: text("region").default("US"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OemIncentive = typeof oemIncentivesTable.$inferSelect;
export type NewOemIncentive = typeof oemIncentivesTable.$inferInsert;
