import { pgTable, text, integer, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

export const engineDecisions = pgTable("engine_decisions", {
  id:              integer("id").generatedAlwaysAsIdentity().primaryKey(),
  decisionId:      text("decision_id").notNull().unique(),
  entityType:      text("entity_type").notNull(),
  entityId:        text("entity_id").notNull(),
  recommendation:  text("recommendation").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  reasoning:       jsonb("reasoning").notNull().$type<string[]>(),
  flags:           jsonb("flags").notNull().$type<string[]>(),
  estimatedSavings: numeric("estimated_savings"),
  scores:          jsonb("scores").notNull().$type<Record<string, number>>(),
  source:          text("source").notNull().default("engine"),
  userAction:      text("user_action"),
  outcome:         text("outcome"),
  outcomeValue:    numeric("outcome_value"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  resolvedAt:      timestamp("resolved_at"),
});
