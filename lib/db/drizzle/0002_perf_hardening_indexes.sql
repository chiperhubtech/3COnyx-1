-- Performance Hardening — high-frequency lookup indexes
CREATE INDEX IF NOT EXISTS "users_stripe_customer_id_idx" ON "users" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "users_referral_code_idx" ON "users" ("referral_code");
CREATE INDEX IF NOT EXISTS "users_referred_by_idx" ON "users" ("referred_by");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "users_subscription_status_idx" ON "users" ("subscription_status");

CREATE INDEX IF NOT EXISTS "transactions_stripe_payment_id_idx" ON "transactions" ("stripe_payment_id");
CREATE INDEX IF NOT EXISTS "transactions_from_user_id_idx" ON "transactions" ("from_user_id");
CREATE INDEX IF NOT EXISTS "transactions_to_user_id_idx" ON "transactions" ("to_user_id");
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions" ("status");
CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions" ("type");
CREATE INDEX IF NOT EXISTS "transactions_vehicle_vin_idx" ON "transactions" ("vehicle_vin");
CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions" ("created_at");

-- proof_chain: dedicated entity_id index (composite (entity_type, entity_id) doesn't
-- cover entity_id-only lookups efficiently in postgres).
CREATE INDEX IF NOT EXISTS "proof_chain_entity_id_idx" ON "proof_chain" ("entity_id");

-- The following indexes are already declared in their respective schema files
-- (re-declared here as IF NOT EXISTS so this migration is the canonical
-- record of the perf hardening index set):
CREATE INDEX IF NOT EXISTS "deals_status_idx" ON "deals" ("status");
CREATE INDEX IF NOT EXISTS "deals_vin_idx" ON "deals" ("vin");
CREATE INDEX IF NOT EXISTS "commission_recipient_id_idx" ON "commission_ledger" ("recipient_id");
CREATE INDEX IF NOT EXISTS "commission_status_idx" ON "commission_ledger" ("status");
