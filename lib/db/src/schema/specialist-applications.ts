// SOC2: SSN and DL numbers are NEVER persisted here.
// Only Checkr's reference IDs and BGC status are stored.
import { pgTable, text, serial, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const bgcStatusEnum = pgEnum("bgc_status", [
  "pending",
  "clear",
  "consider",
  "suspended",
  "dispute",
]);

export const specialistApplicationsTable = pgTable("specialist_applications", {
  id: serial("id").primaryKey(),
  applicantName: text("applicant_name").notNull(),
  email: text("email").notNull(),
  dlState: text("dl_state"),              // DL state only — number never stored
  checkrCandidateId: text("checkr_candidate_id"),
  checkrInvitationId: text("checkr_invitation_id"),
  bgcStatus: bgcStatusEnum("bgc_status").notNull().default("pending"),
  simulated: boolean("simulated").notNull().default(false),
  privacyConsentAt: timestamp("privacy_consent_at", { withTimezone: true }),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
});

export const selectSpecialistApplicationSchema = createSelectSchema(specialistApplicationsTable);
export type SpecialistApplication = typeof specialistApplicationsTable.$inferSelect;
