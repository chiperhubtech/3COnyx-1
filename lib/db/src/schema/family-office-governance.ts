/**
 * 3C ONYX — Family Office Governance Engine Schema
 *
 * Stores family mission statements, AI governance analyses, and tracked assets.
 * Powers the ONYX Sovereign Wealth layer for Dynasty-tier members.
 */
import { pgTable, serial, integer, text, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

// ─── Family Mission Statement ──────────────────────────────────────────────────
export const familyMissionsTable = pgTable("family_missions", {
  id:               serial("id").primaryKey(),
  userId:           integer("user_id").notNull(),
  familyName:       text("family_name").notNull().default("My Family Office"),
  missionStatement: text("mission_statement").notNull(),
  pillarOne:        text("pillar_one"),   // e.g. "Preservation"
  pillarTwo:        text("pillar_two"),   // e.g. "Growth"
  pillarThree:      text("pillar_three"), // e.g. "Legacy"
  pillarOneDesc:    text("pillar_one_desc"),
  pillarTwoDesc:    text("pillar_two_desc"),
  pillarThreeDesc:  text("pillar_three_desc"),
  coreValues:       text("core_values"),  // comma-separated: "Stewardship, Sovereignty, ..."
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FamilyMission    = typeof familyMissionsTable.$inferSelect;
export type NewFamilyMission = typeof familyMissionsTable.$inferInsert;

// ─── Governance Analysis Results ──────────────────────────────────────────────
export const familyGovernanceAnalysesTable = pgTable("family_governance_analyses", {
  id:                   serial("id").primaryKey(),
  userId:               integer("user_id").notNull(),
  missionId:            integer("mission_id"),
  proposedAction:       text("proposed_action").notNull(),
  assetName:            text("asset_name"),
  assetType:            text("asset_type"), // "real_estate" | "business" | "investment" | "vehicle" | "other"
  assetValue:           numeric("asset_value", { precision: 18, scale: 2 }),
  /** 1–10 alignment score from ONYX Neural */
  alignmentScore:       numeric("alignment_score", { precision: 3, scale: 1 }),
  alignmentRationale:   text("alignment_rationale"),
  /** Array of specific charter conflicts as JSON string */
  charterConflicts:     text("charter_conflicts"),
  trustGuardrail:       text("trust_guardrail"),
  charterIntegration:   text("charter_integration"),
  /** "Dynasty Trust" | "LLC" | "GRAT" | "Irrevocable Trust" | "S-Corp" */
  trustStructure:       text("trust_structure"),
  trustRationale:       text("trust_rationale"),
  taxAdvantage:         text("tax_advantage"),
  /** JSON array of 3 execution steps */
  officeExecutionSteps: text("office_execution_steps"),
  aiProvider:           text("ai_provider"),
  analyzedAt:           timestamp("analyzed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FamilyGovernanceAnalysis    = typeof familyGovernanceAnalysesTable.$inferSelect;
export type NewFamilyGovernanceAnalysis = typeof familyGovernanceAnalysesTable.$inferInsert;

// ─── Family Asset Registry ─────────────────────────────────────────────────────
export const familyAssetsTable = pgTable("family_assets", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull(),
  name:           text("name").notNull(),
  assetType:      text("asset_type").notNull(),
  estimatedValue: numeric("estimated_value", { precision: 18, scale: 2 }),
  trustStructure: text("trust_structure"),
  /** "pending" | "active" | "divesting" | "exited" */
  status:         text("status").notNull().default("active"),
  notes:          text("notes"),
  analysisId:     integer("analysis_id"),
  acquiredAt:     timestamp("acquired_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FamilyAsset    = typeof familyAssetsTable.$inferSelect;
export type NewFamilyAsset = typeof familyAssetsTable.$inferInsert;
