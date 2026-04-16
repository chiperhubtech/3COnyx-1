CREATE TYPE "public"."user_role" AS ENUM('Member', 'Dealer', 'Runner', 'Specialist', 'Admin');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('Available', 'Reserved', 'In Transit', 'Sold', 'Maintenance');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('car', 'motorcycle', 'scooter', 'atv', 'rv', 'boat', 'truck', 'suv', 'van', 'trailer', 'jet_ski', 'snowmobile', 'golf_cart', 'other');--> statement-breakpoint
CREATE TYPE "public"."gig_task_status" AS ENUM('Open', 'Claimed', 'In Progress', 'Completed', 'Cancelled', 'Disputed');--> statement-breakpoint
CREATE TYPE "public"."gig_task_type" AS ENUM('Delivery', 'Inspection', 'Photography', 'Detailing', 'Transport', 'Concierge', 'Other');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_status" AS ENUM('Pending', 'Approved', 'Paid', 'Failed', 'Voided');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('Referral', 'GigCompletion', 'Bonus', 'Clawback', 'Adjustment');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('AUTH', 'DB_CHANGE', 'API_CALL', 'PAYOUT', 'DELIVERY', 'ADMIN', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('INFO', 'WARN', 'CRIT');--> statement-breakpoint
CREATE TYPE "public"."bgc_status" AS ENUM('pending', 'clear', 'consider', 'suspended', 'dispute');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('DELIVERY', 'BGC', 'PAYOUT', 'RUNNER', 'ALERT', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."tx_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."tx_type" AS ENUM('PURCHASE', 'PAYOUT', 'REFERRAL', 'SUBSCRIPTION', 'REFUND', 'PLATFORM_FEE', 'TRANSPORT_FEE', 'PENALTY');--> statement-breakpoint
CREATE TYPE "public"."waitlist_role" AS ENUM('Member', 'Dealer', 'Runner', 'Specialist', 'Investor');--> statement-breakpoint
CREATE TYPE "public"."bay_tx_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."bay_slot_status" AS ENUM('QUEUED', 'GPS_INCOMING', 'IN_PROGRESS', 'WAITING_PARTS', 'QC', 'READY', 'DISPATCHED');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('NOT_STARTED', 'PENDING', 'REQUIRES_INPUT', 'VERIFIED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."ip_asset_type" AS ENUM('AI_INTERACTION', 'AR_ANCHOR', 'ALGORITHM', 'FEATURE_SPEC', 'TRADE_SECRET', 'BRAND_ASSET', 'CODE_MODULE', 'DATASET');--> statement-breakpoint
CREATE TYPE "public"."tax_id_type" AS ENUM('SSN', 'EIN', 'ITIN');--> statement-breakpoint
CREATE TYPE "public"."w9_status" AS ENUM('NOT_SUBMITTED', 'SUBMITTED', 'VERIFIED', 'INVALID');--> statement-breakpoint
CREATE TYPE "public"."source_bid_status" AS ENUM('PENDING', 'SHORTLISTED', 'AWARDED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."source_category" AS ENUM('VEHICLE_PURCHASE', 'VEHICLE_TRANSPORT', 'VEHICLE_SERVICE', 'VEHICLE_INSURANCE', 'LEGAL_SERVICES', 'FINANCIAL_SERVICES', 'CONCIERGE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."source_fee_structure" AS ENUM('FIXED', 'HOURLY', 'HYBRID', 'ANY');--> statement-breakpoint
CREATE TYPE "public"."source_request_status" AS ENUM('OPEN', 'IN_REVIEW', 'AWARDED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('Pending', 'Contacted', 'Qualified', 'DealOpen', 'Closed', 'Settled', 'Expired', 'Voided');--> statement-breakpoint
CREATE TYPE "public"."warranty_status" AS ENUM('Active', 'Expired', 'ExpiringSoon', 'Unknown', 'Extended', 'Voided');--> statement-breakpoint
CREATE TYPE "public"."warranty_type" AS ENUM('Bumper-to-Bumper', 'Powertrain', 'Extended', 'CPO', 'PaintProtection', 'TireWheel', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."vault_bundle_status" AS ENUM('Assembling', 'Sealed', 'Submitted', 'FundingApproved', 'FundingDenied', 'Funded', 'Voided');--> statement-breakpoint
CREATE TYPE "public"."service_node_status" AS ENUM('Active', 'Inactive', 'Suspended', 'Pending', 'Verified');--> statement-breakpoint
CREATE TYPE "public"."service_node_type" AS ENUM('Paint', 'Rims', 'Customization', 'Detailing', 'Tires', 'Upholstery', 'Wrapping', 'PPF', 'WindowTint', 'AudioVideo', 'Mechanic', 'BodyShop', 'Storage', 'Other');--> statement-breakpoint
CREATE TYPE "public"."bank_node_status" AS ENUM('Invited', 'Pending', 'Verified', 'Active', 'Suspended', 'Inactive');--> statement-breakpoint
CREATE TYPE "public"."bank_node_tier" AS ENUM('Tier1', 'Tier2', 'Tier3', 'Pilot');--> statement-breakpoint
CREATE TYPE "public"."partner_node_category" AS ENUM('Bank', 'WarrantyAdmin', 'Insurance', 'TitleAgency', 'Government');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('QuoteRequested', 'ProviderAssigned', 'PickupScheduled', 'VehiclePickedUp', 'InTransit', 'CrossedStateLine', 'FinalMileDelivery', 'Delivered', 'DVPStamped', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."shipment_type" AS ENUM('OpenCarrier', 'EnclosedCarrier', 'DriveAway', 'RailTransport', 'FinalMileOnly');--> statement-breakpoint
CREATE TYPE "public"."deal_commission_status" AS ENUM('Pending', 'Approved', 'Paid', 'Held', 'Clawback');--> statement-breakpoint
CREATE TYPE "public"."deal_status" AS ENUM('Open', 'In_Progress', 'Pending_Finance', 'Pending_Insurance', 'Pending_DMV', 'Pending_Recon', 'Funded', 'Delivered', 'Unwound', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."deal_type" AS ENUM('New_Sale', 'Used_Sale', 'Lease', 'Wholesale', 'Trade_In');--> statement-breakpoint
CREATE TYPE "public"."df_department" AS ENUM('DMV', 'Parts', 'Service', 'Finance', 'Logistics', 'Sales', 'Customer_Service', 'General');--> statement-breakpoint
CREATE TYPE "public"."df_initiator_tier" AS ENUM('Authenticated', 'Lot_Attendant', 'Detailer', 'Customer', 'External_Vendor', 'Anonymous');--> statement-breakpoint
CREATE TYPE "public"."df_intake_type" AS ENUM('Scan', 'SMS', 'Email', 'Manual', 'Phone', 'Walk_In', 'Vision_Scan', 'Omni_Node');--> statement-breakpoint
CREATE TYPE "public"."df_priority" AS ENUM('Critical', 'High', 'Medium', 'Low');--> statement-breakpoint
CREATE TYPE "public"."df_task_scope" AS ENUM('Internal', 'External');--> statement-breakpoint
CREATE TYPE "public"."df_task_status" AS ENUM('Open', 'In_Progress', 'Waiting', 'Pending_Approval', 'Pending_External', 'Completed', 'Escalated', 'Cancelled', 'Blocked');--> statement-breakpoint
CREATE TYPE "public"."scan_doc_type" AS ENUM('Invoice', 'DMV_Form', 'Title', 'Registration', 'Mopar_Sheet', 'Parts_Order', 'Warranty_Claim', 'Insurance_Doc', 'Bill_of_Sale', 'Other');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('Processing', 'Completed', 'Failed', 'Routed');--> statement-breakpoint
CREATE TYPE "public"."ticket_category" AS ENUM('Registration', 'Title', 'Parts_Status', 'Service_Update', 'Delivery', 'Warranty', 'Billing', 'General');--> statement-breakpoint
CREATE TYPE "public"."ticket_channel" AS ENUM('SMS', 'Email', 'Phone', 'Walk_In', 'App', 'WhatsApp');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('New', 'Open', 'In_Progress', 'Waiting_Customer', 'Resolved', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."trust_tier" AS ENUM('Unverified', 'Contributor', 'Verified_Node', 'Trusted_Node', 'Keyholder');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('None', 'Pending', 'Verified', 'Rejected', 'Suspended');--> statement-breakpoint
CREATE TYPE "public"."api_key_status" AS ENUM('Active', 'Revoked', 'Expired', 'Rate_Limited', 'Suspended');--> statement-breakpoint
CREATE TYPE "public"."developer_tier" AS ENUM('Free', 'Builder', 'Enterprise', 'Partner', 'Sovereign');--> statement-breakpoint
CREATE TYPE "public"."federation_node_status" AS ENUM('Bootstrapping', 'Syncing', 'Active', 'Degraded', 'Offline', 'Decommissioned');--> statement-breakpoint
CREATE TYPE "public"."federation_region" AS ENUM('NA_EAST', 'NA_WEST', 'NA_CENTRAL', 'EU_WEST', 'EU_CENTRAL', 'APAC_EAST', 'APAC_SOUTH', 'LATAM', 'MEA', 'GLOBAL');--> statement-breakpoint
CREATE TYPE "public"."currency_code" AS ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL', 'MXN', 'KRW', 'AED', 'SGD', 'ZAR', 'NGN', 'SAR', 'HKD', 'SEK', 'NOK');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('Pending', 'Processing', 'Settled', 'Failed', 'Reversed', 'Held');--> statement-breakpoint
CREATE TYPE "public"."plugin_category" AS ENUM('Analytics', 'Payments', 'Inventory', 'CRM', 'Logistics', 'Insurance', 'Compliance', 'Marketing', 'AI_Agent', 'IoT', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."plugin_status" AS ENUM('Draft', 'Review', 'Published', 'Suspended', 'Deprecated');--> statement-breakpoint
CREATE TYPE "public"."telemetry_source" AS ENUM('OBD2', 'Telematics', 'Connected_Car_API', 'Manual_Entry', 'Fleet_Gateway', 'AR_Headset', 'Robotics_Node', 'Sensor_Mesh');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_status" AS ENUM('Active', 'Pending_Approval', 'Restricted', 'Blocked', 'Under_Review');--> statement-breakpoint
CREATE TYPE "public"."intelligence_report_type" AS ENUM('Market_Pricing', 'Demand_Forecast', 'Supply_Analysis', 'Regional_Trend', 'Segment_Deep_Dive', 'Competitive_Intel', 'Predictive_Maintenance', 'Fleet_Analytics', 'Revenue_Forecast', 'Network_Health');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('Available', 'Sent', 'Claimed', 'Expired', 'Revoked');--> statement-breakpoint
CREATE TYPE "public"."node_role" AS ENUM('Referral', 'Service', 'Logistics', 'Hosting', 'Hybrid');--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('Bank_Payoff', 'DMV_Run', 'Vehicle_Inspection', 'Mechanic_Service', 'Detailing', 'Tire_Service', 'Oil_Change', 'Transport', 'Parts_Pickup', 'Document_Delivery', 'Warranty_Claim', 'Insurance_Quote', 'Title_Transfer', 'Registration', 'Roadside_Assist', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."task_state" AS ENUM('Open', 'Matching', 'Matched', 'Confirmed', 'En_Route', 'Executing', 'Verifying', 'Completed', 'Paid', 'Cancelled', 'Disputed');--> statement-breakpoint
CREATE TYPE "public"."task_urgency" AS ENUM('Standard', 'Priority', 'Urgent', 'Emergency');--> statement-breakpoint
CREATE TYPE "public"."split_status" AS ENUM('Calculated', 'Pending_Proof', 'Proof_Verified', 'Processing', 'Distributed', 'Failed', 'Reversed');--> statement-breakpoint
CREATE TYPE "public"."payoff_status" AS ENUM('Initiated', 'Lender_Contacted', 'Payoff_Quote_Received', 'Funding_Requested', 'Funded', 'Lien_Released', 'Title_Clear', 'Completed', 'Failed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."tx_category" AS ENUM('Referral_Payout', 'Service_Payout', 'Logistics_Payout', 'Location_Payout', 'Deal_Payout', 'Split_Distribution', 'Commission', 'Remittance_In', 'Remittance_Out', 'Platform_Fee', 'Withdrawal', 'Deposit', 'Bonus', 'Adjustment');--> statement-breakpoint
CREATE TYPE "public"."tx_direction" AS ENUM('Credit', 'Debit');--> statement-breakpoint
CREATE TYPE "public"."wallet_status" AS ENUM('Active', 'Frozen', 'Suspended', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."club_member_role" AS ENUM('President', 'VicePresident', 'Treasurer', 'Secretary', 'Admin', 'Member');--> statement-breakpoint
CREATE TYPE "public"."club_status" AS ENUM('pending', 'verified', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."club_tier" AS ENUM('Crew', 'Chapter', 'Organization', 'International');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('car_meet', 'bike_night', 'cruise', 'show_and_shine', 'swap_meet', 'drag_race', 'track_day', 'charity_ride', 'auction', 'pop_up_shop', 'workshop', 'club_meeting', 'custom');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('parking_lot', 'dealership', 'warehouse', 'track', 'park', 'fairgrounds', 'mall_lot', 'private_property', 'public_space', 'garage');--> statement-breakpoint
CREATE TYPE "public"."proof_event_type" AS ENUM('GENESIS', 'DEAL_CREATED', 'DEAL_STATUS_CHANGED', 'PAYMENT_COMPLETED', 'PAYOUT_SPLIT', 'VEHICLE_VERIFIED', 'VEHICLE_REGISTERED', 'NODE_JOINED', 'NODE_ATTRIBUTED', 'REFERRAL_CREDITED', 'SERVICE_DISPATCHED', 'SERVICE_COMPLETED', 'LOGISTICS_DISPATCHED', 'LOGISTICS_DELIVERED', 'FINANCE_SUBMITTED', 'FINANCE_APPROVED', 'INCENTIVE_APPLIED', 'KYC_VERIFIED', 'WALLET_CREDIT', 'WALLET_DEBIT', 'REMITTANCE_SENT', 'QR_SCANNED', 'AGENT_ACTION', 'ESCALATION_CREATED', 'SYSTEM_EVENT');--> statement-breakpoint
CREATE TYPE "public"."story_status" AS ENUM('Draft', 'Published', 'Featured', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('pending', 'escrowed', 'in_transit', 'delivered', 'released', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('none', 'pending', 'processing', 'completed', 'failed', 'retry_scheduled');--> statement-breakpoint
CREATE TABLE "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "password_hash" text,
        "role" "user_role" DEFAULT 'Member' NOT NULL,
        "phone" text,
        "avatar_url" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "is_verified" boolean DEFAULT false NOT NULL,
        "stripe_customer_id" text,
        "stripe_sub_id" text,
        "subscription_tier" text DEFAULT 'free',
        "subscription_status" text DEFAULT 'inactive',
        "subscription_ends_at" timestamp with time zone,
        "checkr_candidate_id" text,
        "push_token" text,
        "push_token_updated_at" timestamp with time zone,
        "onboarding_role" text,
        "community_role" text DEFAULT 'Member' NOT NULL,
        "referral_code" text,
        "referred_by" integer,
        "points" integer DEFAULT 0 NOT NULL,
        "birthday" date,
        "auth_provider" text,
        "auth_provider_id" text,
        "last_login_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email"),
        CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
        "id" serial PRIMARY KEY NOT NULL,
        "vin" text NOT NULL,
        "vehicle_type" "vehicle_type" DEFAULT 'car' NOT NULL,
        "year" integer NOT NULL,
        "make" text NOT NULL,
        "model" text NOT NULL,
        "trim" text,
        "color" text,
        "mileage" integer DEFAULT 0 NOT NULL,
        "price_usd" numeric(12, 2),
        "status" "vehicle_status" DEFAULT 'Available' NOT NULL,
        "dealer_id" integer,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "vehicles_vin_unique" UNIQUE("vin")
);
--> statement-breakpoint
CREATE TABLE "gig_tasks" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "task_type" "gig_task_type" NOT NULL,
        "status" "gig_task_status" DEFAULT 'Open' NOT NULL,
        "vehicle_id" integer,
        "assigned_runner_id" integer,
        "posted_by_dealer_id" integer,
        "payout_usd" text DEFAULT '0.00' NOT NULL,
        "due_at" timestamp with time zone,
        "completed_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_ledger" (
        "id" serial PRIMARY KEY NOT NULL,
        "entry_type" "ledger_entry_type" NOT NULL,
        "status" "ledger_entry_status" DEFAULT 'Pending' NOT NULL,
        "recipient_id" integer NOT NULL,
        "vehicle_id" integer,
        "gig_task_id" integer,
        "referred_by_user_id" integer,
        "amount_usd" numeric(12, 2) NOT NULL,
        "note" text,
        "paid_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "event_type" "audit_event_type" NOT NULL,
        "action" text NOT NULL,
        "actor_id" text,
        "actor_role" text,
        "resource_type" text,
        "resource_id" text,
        "method" text,
        "path" text,
        "status_code" integer,
        "severity" "audit_severity" DEFAULT 'INFO' NOT NULL,
        "metadata" jsonb,
        "ip_address" text,
        "sha256_hash" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialist_applications" (
        "id" serial PRIMARY KEY NOT NULL,
        "applicant_name" text NOT NULL,
        "email" text NOT NULL,
        "dl_state" text,
        "checkr_candidate_id" text,
        "checkr_invitation_id" text,
        "bgc_status" "bgc_status" DEFAULT 'pending' NOT NULL,
        "simulated" boolean DEFAULT false NOT NULL,
        "privacy_consent_at" timestamp with time zone,
        "applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "type" "notification_type" DEFAULT 'SYSTEM' NOT NULL,
        "title" text NOT NULL,
        "body" text NOT NULL,
        "read" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
        "id" serial PRIMARY KEY NOT NULL,
        "vehicle_label" text NOT NULL,
        "inspector_name" text NOT NULL,
        "condition_front" integer DEFAULT 5 NOT NULL,
        "condition_rear" integer DEFAULT 5 NOT NULL,
        "condition_driver_side" integer DEFAULT 5 NOT NULL,
        "condition_passenger_side" integer DEFAULT 5 NOT NULL,
        "condition_interior" integer DEFAULT 5 NOT NULL,
        "odometer_confirmed" integer,
        "notes" text,
        "signed" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" text DEFAULT 'demo' NOT NULL,
        "vin_masked" text NOT NULL,
        "heading" text NOT NULL,
        "make" text NOT NULL,
        "model" text NOT NULL,
        "year" integer NOT NULL,
        "listed_price" integer,
        "target_price" integer,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "type" "tx_type" NOT NULL,
        "status" "tx_status" DEFAULT 'PENDING' NOT NULL,
        "amount_cents" integer NOT NULL,
        "currency" text DEFAULT 'usd' NOT NULL,
        "from_user_id" integer,
        "to_user_id" integer,
        "vehicle_vin" text,
        "stripe_payment_id" text,
        "stripe_transfer_id" text,
        "description" text,
        "metadata" text,
        "completed_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "name" text,
        "waitlist_role" "waitlist_role" DEFAULT 'Member' NOT NULL,
        "referred_by" text,
        "city" text,
        "invite_code" text,
        "is_invited" boolean DEFAULT false NOT NULL,
        "invited_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "founding_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "member_number" serial NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "stripe_checkout_session_id" text,
        "stripe_payment_intent_id" text,
        "stripe_customer_id" text,
        "status" text DEFAULT 'pending' NOT NULL,
        "amount_paid" integer DEFAULT 9900,
        "referral_code" text,
        "referred_by" text,
        "is_founder" boolean DEFAULT true NOT NULL,
        "confirmed_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "founding_members_email_unique" UNIQUE("email"),
        CONSTRAINT "founding_members_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
        "id" serial PRIMARY KEY NOT NULL,
        "event" text NOT NULL,
        "session_id" text,
        "user_id" text,
        "referral_code" text,
        "payload" jsonb,
        "ip" text,
        "user_agent" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blockchain_records" (
        "id" serial PRIMARY KEY NOT NULL,
        "entry_id" varchar(36) NOT NULL,
        "vehicle_id" varchar(100) NOT NULL,
        "vin_masked" varchar(50),
        "type" varchar(50) NOT NULL,
        "actor" varchar(200) NOT NULL,
        "actor_role" varchar(100) NOT NULL,
        "data" jsonb NOT NULL,
        "sha256" varchar(64) NOT NULL,
        "previous_hash" varchar(64) NOT NULL,
        "block_index" integer NOT NULL,
        "timestamp" timestamp with time zone NOT NULL,
        "hmac_signature" varchar(64) NOT NULL,
        "eth_tx_hash" varchar(100),
        "eth_block" integer,
        "verified" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "blockchain_records_entry_id_unique" UNIQUE("entry_id"),
        CONSTRAINT "blockchain_records_sha256_unique" UNIQUE("sha256")
);
--> statement-breakpoint
CREATE TABLE "engine_decisions" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "engine_decisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
        "decision_id" text NOT NULL,
        "entity_type" text NOT NULL,
        "entity_id" text NOT NULL,
        "recommendation" text NOT NULL,
        "confidence_score" integer NOT NULL,
        "reasoning" jsonb NOT NULL,
        "flags" jsonb NOT NULL,
        "estimated_savings" numeric,
        "scores" jsonb NOT NULL,
        "source" text DEFAULT 'engine' NOT NULL,
        "user_action" text,
        "outcome" text,
        "outcome_value" numeric,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "resolved_at" timestamp,
        CONSTRAINT "engine_decisions_decision_id_unique" UNIQUE("decision_id")
);
--> statement-breakpoint
CREATE TABLE "sdv_ota_events" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sdv_ota_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
        "vehicle_id" text NOT NULL,
        "vin" text,
        "from_version" text,
        "to_version" text NOT NULL,
        "update_type" text NOT NULL,
        "description" text,
        "sdv_score_delta" integer DEFAULT 0,
        "blockchain_hash" text,
        "installed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sdv_profiles" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sdv_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
        "vehicle_id" text NOT NULL,
        "vin" text,
        "make" text,
        "model" text,
        "year" integer,
        "sdv_tier" integer DEFAULT 0 NOT NULL,
        "sdv_score" integer DEFAULT 0 NOT NULL,
        "has_ota_capability" boolean DEFAULT false,
        "has_vehicle_api" boolean DEFAULT false,
        "has_v2x" boolean DEFAULT false,
        "has_remote_access" boolean DEFAULT false,
        "sensor_types" jsonb DEFAULT '[]'::jsonb,
        "v2x_protocols" jsonb DEFAULT '[]'::jsonb,
        "in_vehicle_apps" jsonb DEFAULT '[]'::jsonb,
        "software_version" text,
        "software_architecture" text,
        "ota_updates_count" integer DEFAULT 0,
        "last_ota_at" timestamp,
        "last_ota_version" text,
        "last_telemetry_at" timestamp,
        "latest_telemetry" jsonb,
        "sdv_value_premium" numeric DEFAULT '0',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "sdv_profiles_vehicle_id_unique" UNIQUE("vehicle_id")
);
--> statement-breakpoint
CREATE TABLE "sdv_telemetry" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sdv_telemetry_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
        "vehicle_id" text NOT NULL,
        "vin" text,
        "speed" numeric,
        "battery_level" numeric,
        "range" numeric,
        "latitude" numeric,
        "longitude" numeric,
        "diagnostic_codes" jsonb DEFAULT '[]'::jsonb,
        "sensor_data" jsonb,
        "received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bay_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "qr_code" text NOT NULL,
        "specialist_id" integer NOT NULL,
        "runner_id" integer,
        "vehicle_vin" text,
        "service_type" text NOT NULL,
        "service_label" text NOT NULL,
        "gross_amount_cents" integer NOT NULL,
        "fee_cents" integer NOT NULL,
        "net_amount_cents" integer NOT NULL,
        "dividend_cents" integer DEFAULT 0 NOT NULL,
        "stripe_payment_id" text,
        "stripe_payment_url" text,
        "status" "bay_tx_status" DEFAULT 'PENDING' NOT NULL,
        "customer_name" text,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "paid_at" timestamp with time zone,
        CONSTRAINT "bay_transactions_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "bay_slots" (
        "id" serial PRIMARY KEY NOT NULL,
        "bay_number" integer DEFAULT 1 NOT NULL,
        "specialist_id" integer NOT NULL,
        "vehicle_vin" text,
        "vehicle_label" text NOT NULL,
        "customer_name" text NOT NULL,
        "customer_phone" text,
        "service_type" text NOT NULL,
        "status" "bay_slot_status" DEFAULT 'QUEUED' NOT NULL,
        "eta_minutes" integer,
        "gps_triggered" boolean DEFAULT false NOT NULL,
        "rush_requested" boolean DEFAULT false NOT NULL,
        "tech_approved" boolean DEFAULT false NOT NULL,
        "started_at" timestamp with time zone,
        "completed_at" timestamp with time zone,
        "cycle_seconds" integer,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vin_passports" (
        "id" serial PRIMARY KEY NOT NULL,
        "vin" text NOT NULL,
        "make" text,
        "model" text,
        "year" integer,
        "trim" text,
        "body_class" text,
        "drive_type" text,
        "engine_type" text,
        "fuel_type" text,
        "doors" integer,
        "raw_nhtsa" jsonb,
        "ai_summary_en" text,
        "ai_summary_es" text,
        "recall_count" integer DEFAULT 0,
        "has_open_recalls" boolean DEFAULT false,
        "blockchain_hash" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "vin_passports_vin_unique" UNIQUE("vin")
);
--> statement-breakpoint
CREATE TABLE "member_charters" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "charter_version" text DEFAULT 'v1.0.0-2026' NOT NULL,
        "signature_hash" text NOT NULL,
        "slice_ackd" boolean DEFAULT false NOT NULL,
        "data_ackd" boolean DEFAULT false NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_verifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "stripe_verif_session_id" text NOT NULL,
        "status" "kyc_status" DEFAULT 'NOT_STARTED' NOT NULL,
        "id_number_last4" text,
        "document_type" text,
        "issuing_country" text,
        "failure_reason" text,
        "verified_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "kyc_verifications_stripe_verif_session_id_unique" UNIQUE("stripe_verif_session_id")
);
--> statement-breakpoint
CREATE TABLE "ip_anchors" (
        "id" serial PRIMARY KEY NOT NULL,
        "anchored_by" integer,
        "asset_type" "ip_asset_type" NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "content_hash" text NOT NULL,
        "anchor_hash" text NOT NULL,
        "previous_hash" text DEFAULT 'GENESIS' NOT NULL,
        "eth_tx_hash" text,
        "assignee" text DEFAULT 'CUXTOMCANDYCLUB LLC' NOT NULL,
        "anchored_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_tax_info" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "tax_id_type" "tax_id_type",
        "tax_id_encrypted" text,
        "tax_id_iv" text,
        "tax_id_tag" text,
        "last4" text,
        "w9_status" "w9_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
        "w9_submitted_at" timestamp with time zone,
        "threshold_1099_reached" boolean DEFAULT false NOT NULL,
        "annual_earnings_cents" integer DEFAULT 0 NOT NULL,
        "tax_year" integer DEFAULT 2026 NOT NULL,
        "form_1099k_ref" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "user_tax_info_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "token_blacklist" (
        "id" serial PRIMARY KEY NOT NULL,
        "jti" varchar(64) NOT NULL,
        "user_id" integer NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "token_blacklist_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL,
        "ip_address" varchar(64) NOT NULL,
        "user_agent" text,
        "success" boolean DEFAULT false NOT NULL,
        "fail_reason" varchar(64),
        "attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alibaba_products" (
        "id" serial PRIMARY KEY NOT NULL,
        "alibaba_product_id" text,
        "title" text NOT NULL,
        "price_usd" text,
        "price_min" text,
        "price_max" text,
        "image_url" text,
        "detail_url" text,
        "supplier_name" text,
        "supplier_id" text,
        "supplier_country" text,
        "moq" integer DEFAULT 1,
        "has_trade_assurance" boolean DEFAULT false,
        "category" text,
        "sub_category" text,
        "keywords" text,
        "star_rating" text,
        "orders_count" integer,
        "raw_payload" jsonb,
        "imported_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "alibaba_products_alibaba_product_id_unique" UNIQUE("alibaba_product_id")
);
--> statement-breakpoint
CREATE TABLE "family_assets" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "name" text NOT NULL,
        "asset_type" text NOT NULL,
        "estimated_value" numeric(18, 2),
        "trust_structure" text,
        "status" text DEFAULT 'active' NOT NULL,
        "notes" text,
        "analysis_id" integer,
        "acquired_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_governance_analyses" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "mission_id" integer,
        "proposed_action" text NOT NULL,
        "asset_name" text,
        "asset_type" text,
        "asset_value" numeric(18, 2),
        "alignment_score" numeric(3, 1),
        "alignment_rationale" text,
        "charter_conflicts" text,
        "trust_guardrail" text,
        "charter_integration" text,
        "trust_structure" text,
        "trust_rationale" text,
        "tax_advantage" text,
        "office_execution_steps" text,
        "ai_provider" text,
        "analyzed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_missions" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "family_name" text DEFAULT 'My Family Office' NOT NULL,
        "mission_statement" text NOT NULL,
        "pillar_one" text,
        "pillar_two" text,
        "pillar_three" text,
        "pillar_one_desc" text,
        "pillar_two_desc" text,
        "pillar_three_desc" text,
        "core_values" text,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_bids" (
        "id" serial PRIMARY KEY NOT NULL,
        "request_id" integer NOT NULL,
        "vendor_id" integer NOT NULL,
        "proposal_text" text NOT NULL,
        "price_cents" integer NOT NULL,
        "fee_structure" "source_fee_structure" DEFAULT 'FIXED' NOT NULL,
        "delivery_days" integer DEFAULT 7 NOT NULL,
        "credentials" text,
        "ai_score" integer DEFAULT 0,
        "ai_reasoning" text,
        "status" "source_bid_status" DEFAULT 'PENDING' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "member_id" integer NOT NULL,
        "category" "source_category" NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "budget_min_cents" integer DEFAULT 0 NOT NULL,
        "budget_max_cents" integer NOT NULL,
        "fee_structure_pref" "source_fee_structure" DEFAULT 'ANY' NOT NULL,
        "anonymous_token" text NOT NULL,
        "is_anonymous" boolean DEFAULT true NOT NULL,
        "deadline" timestamp with time zone NOT NULL,
        "status" "source_request_status" DEFAULT 'OPEN' NOT NULL,
        "awarded_bid_id" integer,
        "platform_fee_cents" integer DEFAULT 0,
        "ai_top_bid_id" integer,
        "ai_summary" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_covenants" (
        "id" serial PRIMARY KEY NOT NULL,
        "member_id" integer NOT NULL,
        "covenant_version" text DEFAULT '1.0' NOT NULL,
        "signed_at" timestamp with time zone DEFAULT now() NOT NULL,
        "ip_address" text NOT NULL,
        "user_agent" text,
        "device_fingerprint" text,
        "acknowledged" boolean DEFAULT true NOT NULL,
        "covenant_hash" text NOT NULL,
        "covenant_text" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_campaigns" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "brief_text" text,
        "target_platforms" text,
        "target_min_grade" text DEFAULT 'B',
        "commission_pct" numeric(5, 2) DEFAULT '10.00',
        "shout_campaign_id" text,
        "status" text DEFAULT 'draft' NOT NULL,
        "launch_date" text,
        "talking_points" text,
        "member_benefits" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_outreach_log" (
        "id" serial PRIMARY KEY NOT NULL,
        "creator_id" integer NOT NULL,
        "campaign_id" integer,
        "ai_message" text NOT NULL,
        "delivery_channel" text DEFAULT 'email' NOT NULL,
        "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
        "response_status" text DEFAULT 'awaiting' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
        "id" serial PRIMARY KEY NOT NULL,
        "platform" text NOT NULL,
        "handle" text NOT NULL,
        "follower_count" integer DEFAULT 0 NOT NULL,
        "grade" text DEFAULT 'N/A' NOT NULL,
        "sb_rank" integer,
        "niche" text,
        "contact_email" text,
        "contact_phone" text,
        "outreach_status" text DEFAULT 'not_contacted' NOT NULL,
        "referral_code" text,
        "campaign_id" integer,
        "discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "uq_creator_platform_handle" UNIQUE("platform","handle")
);
--> statement-breakpoint
CREATE TABLE "referral_ledger" (
        "id" serial PRIMARY KEY NOT NULL,
        "referral_id" text NOT NULL,
        "vin" text NOT NULL,
        "vehicle_label" text,
        "referring_node_id" integer,
        "referring_node_name" text NOT NULL,
        "referring_node_type" text DEFAULT 'ServiceNode' NOT NULL,
        "buyer_member_id" integer,
        "buyer_name" text,
        "status" "referral_status" DEFAULT 'Pending' NOT NULL,
        "commission_pct_bps" integer DEFAULT 300 NOT NULL,
        "deal_value_usd" numeric(14, 2),
        "commission_usd" numeric(12, 2),
        "stripe_payout_id" text,
        "settled_at" timestamp with time zone,
        "closed_at" timestamp with time zone,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "referral_ledger_referral_id_unique" UNIQUE("referral_id")
);
--> statement-breakpoint
CREATE TABLE "warranty_records" (
        "id" serial PRIMARY KEY NOT NULL,
        "vin" text NOT NULL,
        "vehicle_label" text,
        "warranty_type" "warranty_type" NOT NULL,
        "provider_name" text NOT NULL,
        "contract_number" text,
        "in_service_date" timestamp with time zone,
        "in_service_odometer" integer,
        "current_odometer" integer,
        "expires_date" timestamp with time zone,
        "expires_odometer" integer,
        "status" "warranty_status" DEFAULT 'Unknown' NOT NULL,
        "coverage_details" jsonb,
        "is_transferable" boolean DEFAULT false NOT NULL,
        "deductible_usd" numeric(8, 2),
        "last_checked_at" timestamp with time zone DEFAULT now() NOT NULL,
        "guardian_verified" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_vault" (
        "id" serial PRIMARY KEY NOT NULL,
        "bundle_id" text NOT NULL,
        "deal_id" text NOT NULL,
        "vin" text NOT NULL,
        "vehicle_label" text,
        "buyer_name" text,
        "status" "vault_bundle_status" DEFAULT 'Assembling' NOT NULL,
        "lender_name" text,
        "lender_contact" text,
        "funding_rep" text,
        "deal_amount_usd" numeric(14, 2),
        "documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "bundle_hash" text,
        "sealed_at" timestamp with time zone,
        "submitted_at" timestamp with time zone,
        "funding_approved_at" timestamp with time zone,
        "funded_at" timestamp with time zone,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "document_vault_bundle_id_unique" UNIQUE("bundle_id")
);
--> statement-breakpoint
CREATE TABLE "service_nodes" (
        "id" serial PRIMARY KEY NOT NULL,
        "owner_id" integer,
        "name" text NOT NULL,
        "node_type" "service_node_type" NOT NULL,
        "status" "service_node_status" DEFAULT 'Pending' NOT NULL,
        "address" text NOT NULL,
        "city" text NOT NULL,
        "state" text NOT NULL,
        "zip" text NOT NULL,
        "lat" real,
        "lng" real,
        "distance_miles_from_milford_hub" real,
        "phone" text,
        "email" text,
        "website" text,
        "contact_name" text,
        "services_offered" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "capacity_per_day" integer DEFAULT 4 NOT NULL,
        "reputation_score" real DEFAULT 80 NOT NULL,
        "total_jobs_completed" integer DEFAULT 0 NOT NULL,
        "tech_fee_rate_bps" integer DEFAULT 300 NOT NULL,
        "stripe_connect_id" text,
        "is_hub_node" boolean DEFAULT false NOT NULL,
        "metadata" jsonb,
        "verified_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_nodes" (
        "id" serial PRIMARY KEY NOT NULL,
        "node_category" "partner_node_category" DEFAULT 'Bank' NOT NULL,
        "institution_name" text NOT NULL,
        "rep_name" text NOT NULL,
        "rep_title" text,
        "rep_email" text,
        "rep_phone" text,
        "tier" "bank_node_tier" DEFAULT 'Pilot' NOT NULL,
        "status" "bank_node_status" DEFAULT 'Invited' NOT NULL,
        "rep_portal_key" text,
        "key_generated_at" timestamp with time zone,
        "key_expires_at" timestamp with time zone,
        "region" text,
        "deals_reviewed" integer DEFAULT 0 NOT NULL,
        "deals_funded" integer DEFAULT 0 NOT NULL,
        "avg_funding_days_traditional" real DEFAULT 3.5,
        "avg_funding_hours_3c" real,
        "total_funded_usd" numeric(16, 2) DEFAULT '0',
        "referred_nodes" integer DEFAULT 0 NOT NULL,
        "is_pilot_node" boolean DEFAULT false NOT NULL,
        "invited_at" timestamp with time zone,
        "verified_at" timestamp with time zone,
        "last_active_at" timestamp with time zone,
        "invited_by" text DEFAULT 'Ronald Antonio Cadet — 3C ONYX',
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "bank_nodes_rep_portal_key_unique" UNIQUE("rep_portal_key")
);
--> statement-breakpoint
CREATE TABLE "shipment_orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "shipment_id" text NOT NULL,
        "vin" text NOT NULL,
        "vehicle_label" text,
        "buyer_name" text,
        "buyer_phone" text,
        "buyer_email" text,
        "origin_dealer_id" text,
        "origin_address" text,
        "origin_city" text,
        "origin_state" text,
        "origin_zip" text,
        "origin_lat" numeric(9, 6),
        "origin_lng" numeric(9, 6),
        "dest_address" text,
        "dest_city" text,
        "dest_state" text,
        "dest_zip" text,
        "dest_lat" numeric(9, 6),
        "dest_lng" numeric(9, 6),
        "distance_miles" numeric(10, 2),
        "is_interstate" boolean DEFAULT false NOT NULL,
        "crossed_states" jsonb,
        "best_path" text,
        "provider_name" text,
        "provider_rating" numeric(3, 2),
        "provider_dot" text,
        "provider_phone" text,
        "shipment_type" "shipment_type" DEFAULT 'OpenCarrier',
        "quoted_cost_usd" numeric(10, 2),
        "final_cost_usd" numeric(10, 2),
        "dynasty_logistics_fee_usd" numeric(10, 2),
        "fee_rate_pct" numeric(5, 2) DEFAULT '3.00',
        "deal_bundle_id" text,
        "status" "shipment_status" DEFAULT 'QuoteRequested' NOT NULL,
        "compliance_notes" jsonb,
        "dvp_verified" boolean DEFAULT false NOT NULL,
        "title_state_reqs" text,
        "timeline_events" jsonb DEFAULT '[]'::jsonb,
        "quote_requested_at" timestamp with time zone DEFAULT now(),
        "provider_assigned_at" timestamp with time zone,
        "picked_up_at" timestamp with time zone,
        "delivered_at" timestamp with time zone,
        "dvp_stamped_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "shipment_orders_shipment_id_unique" UNIQUE("shipment_id")
);
--> statement-breakpoint
CREATE TABLE "deals" (
        "id" serial PRIMARY KEY NOT NULL,
        "deal_number" text NOT NULL,
        "deal_type" "deal_type" DEFAULT 'Used_Sale' NOT NULL,
        "status" "deal_status" DEFAULT 'Open' NOT NULL,
        "customer_name" text NOT NULL,
        "customer_phone" text,
        "customer_email" text,
        "vin" text,
        "vehicle_label" text,
        "vehicle_id" integer,
        "sale_price" numeric(14, 2),
        "gross_profit" numeric(14, 2),
        "back_end_profit" numeric(14, 2),
        "salesperson_id" integer,
        "salesperson_name" text,
        "finance_manager_id" integer,
        "sales_manager_id" integer,
        "commission_amount" numeric(12, 2),
        "commission_status" "deal_commission_status" DEFAULT 'Pending' NOT NULL,
        "commission_paid_at" timestamp with time zone,
        "lender_name" text,
        "funded_at" timestamp with time zone,
        "delivered_at" timestamp with time zone,
        "dealership_id" integer,
        "participants" jsonb,
        "tech_fee_usd" numeric(12, 2),
        "tech_fee_percent" numeric(5, 2) DEFAULT '3.00',
        "proof_hash" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "deals_deal_number_unique" UNIQUE("deal_number")
);
--> statement-breakpoint
CREATE TABLE "dealerflow_audit_log" (
        "id" serial PRIMARY KEY NOT NULL,
        "task_id" integer NOT NULL,
        "user_id" integer,
        "user_name" text,
        "user_role" text,
        "action_type" text NOT NULL,
        "previous_status" text,
        "new_status" text,
        "details" jsonb,
        "ip_address" text,
        "architect" text DEFAULT 'Ronald Antonio Cadet' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealerflow_tasks" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "department" "df_department" NOT NULL,
        "priority" "df_priority" DEFAULT 'Medium' NOT NULL,
        "status" "df_task_status" DEFAULT 'Open' NOT NULL,
        "intake_type" "df_intake_type" DEFAULT 'Manual' NOT NULL,
        "task_scope" "df_task_scope" DEFAULT 'Internal' NOT NULL,
        "vin" text,
        "deal_id" integer,
        "vehicle_id" integer,
        "customer_id" integer,
        "assigned_to_id" integer,
        "dealership_id" integer,
        "initiator_id" integer,
        "initiator_name" text,
        "initiator_tier" "df_initiator_tier" DEFAULT 'Authenticated',
        "owner_id" integer,
        "authorizer_id" integer,
        "authorized_at" timestamp with time zone,
        "tracking_code" text,
        "sla_minutes" integer DEFAULT 480 NOT NULL,
        "sla_due_at" timestamp with time zone,
        "routed_by_agent" text,
        "routing_confidence" text,
        "depends_on_task_id" integer,
        "metadata" jsonb,
        "resolved_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "dealerflow_tasks_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "document_scans" (
        "id" serial PRIMARY KEY NOT NULL,
        "document_type" "scan_doc_type" DEFAULT 'Other' NOT NULL,
        "status" "scan_status" DEFAULT 'Processing' NOT NULL,
        "image_url" text,
        "raw_ocr_text" text,
        "extracted_data" jsonb,
        "extracted_vin" text,
        "extracted_customer_name" text,
        "extracted_part_numbers" jsonb,
        "routed_to_department" text,
        "routed_to_task_id" integer,
        "scanned_by_id" integer,
        "dealership_id" integer,
        "confidence" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tickets" (
        "id" serial PRIMARY KEY NOT NULL,
        "subject" text NOT NULL,
        "description" text,
        "status" "ticket_status" DEFAULT 'New' NOT NULL,
        "channel" "ticket_channel" DEFAULT 'App' NOT NULL,
        "category" "ticket_category" DEFAULT 'General' NOT NULL,
        "customer_id" integer,
        "customer_name" text,
        "customer_phone" text,
        "customer_email" text,
        "assigned_to_id" integer,
        "dealership_id" integer,
        "related_task_id" integer,
        "related_vin" text,
        "last_message" text,
        "auto_response" text,
        "metadata" jsonb,
        "resolved_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_event_log" (
        "id" serial PRIMARY KEY NOT NULL,
        "trust_score_id" integer NOT NULL,
        "event_type" text NOT NULL,
        "previous_score" numeric(6, 3),
        "new_score" numeric(6, 3),
        "score_delta" numeric(6, 3),
        "reason" text,
        "task_id" integer,
        "deal_id" integer,
        "metadata" jsonb,
        "architect" text DEFAULT 'Ronald Antonio Cadet' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_scores" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer,
        "external_fingerprint" text,
        "display_name" text,
        "tier" "trust_tier" DEFAULT 'Unverified' NOT NULL,
        "verification_status" "verification_status" DEFAULT 'None' NOT NULL,
        "trust_score" numeric(6, 3) DEFAULT '50.000' NOT NULL,
        "total_submissions" integer DEFAULT 0 NOT NULL,
        "accepted_submissions" integer DEFAULT 0 NOT NULL,
        "rejected_submissions" integer DEFAULT 0 NOT NULL,
        "spam_flagged" integer DEFAULT 0 NOT NULL,
        "deals_sourced" integer DEFAULT 0 NOT NULL,
        "deals_closed" integer DEFAULT 0 NOT NULL,
        "total_commission_earned_usd" numeric(14, 2) DEFAULT '0.00' NOT NULL,
        "avg_response_quality" numeric(5, 3) DEFAULT '0.000',
        "consecutive_good_submissions" integer DEFAULT 0 NOT NULL,
        "last_activity_at" timestamp with time zone,
        "verified_at" timestamp with time zone,
        "verification_data" jsonb,
        "metadata" jsonb,
        "architect" text DEFAULT 'Ronald Antonio Cadet' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "trust_scores_user_id_unique" UNIQUE("user_id"),
        CONSTRAINT "trust_scores_external_fingerprint_unique" UNIQUE("external_fingerprint")
);
--> statement-breakpoint
CREATE TABLE "onyx_api_keys" (
        "id" serial PRIMARY KEY NOT NULL,
        "app_id" integer NOT NULL,
        "key_hash" text NOT NULL,
        "key_prefix" text NOT NULL,
        "label" text,
        "status" "api_key_status" DEFAULT 'Active' NOT NULL,
        "permissions" jsonb DEFAULT '[]'::jsonb,
        "rate_limit_per_minute" integer DEFAULT 60 NOT NULL,
        "rate_limit_per_day" integer DEFAULT 10000 NOT NULL,
        "total_calls" integer DEFAULT 0 NOT NULL,
        "last_used_at" timestamp with time zone,
        "expires_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "onyx_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "developer_apps" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "app_name" text NOT NULL,
        "app_slug" text NOT NULL,
        "description" text,
        "tier" "developer_tier" DEFAULT 'Free' NOT NULL,
        "website_url" text,
        "callback_urls" jsonb DEFAULT '[]'::jsonb,
        "logo_url" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "is_verified" boolean DEFAULT false NOT NULL,
        "total_requests" integer DEFAULT 0 NOT NULL,
        "monthly_requests" integer DEFAULT 0 NOT NULL,
        "revenue_share_pct" numeric(5, 2) DEFAULT '0.00',
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "developer_apps_app_slug_unique" UNIQUE("app_slug")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
        "id" serial PRIMARY KEY NOT NULL,
        "endpoint_id" integer NOT NULL,
        "event" text NOT NULL,
        "payload" jsonb,
        "response_status" integer,
        "response_body" text,
        "delivered_at" timestamp with time zone,
        "attempts" integer DEFAULT 0 NOT NULL,
        "next_retry_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
        "id" serial PRIMARY KEY NOT NULL,
        "app_id" integer NOT NULL,
        "url" text NOT NULL,
        "events" jsonb NOT NULL,
        "secret_hash" text NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "failure_count" integer DEFAULT 0 NOT NULL,
        "last_delivered_at" timestamp with time zone,
        "last_failed_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cross_region_sync" (
        "id" serial PRIMARY KEY NOT NULL,
        "source_node_id" text NOT NULL,
        "target_node_id" text NOT NULL,
        "sync_type" text NOT NULL,
        "record_count" integer DEFAULT 0 NOT NULL,
        "bytes_transferred" integer DEFAULT 0 NOT NULL,
        "duration_ms" integer,
        "status" text DEFAULT 'pending' NOT NULL,
        "error_message" text,
        "started_at" timestamp with time zone DEFAULT now() NOT NULL,
        "completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "federation_nodes" (
        "id" serial PRIMARY KEY NOT NULL,
        "node_id" text NOT NULL,
        "node_name" text NOT NULL,
        "region" "federation_region" NOT NULL,
        "status" "federation_node_status" DEFAULT 'Bootstrapping' NOT NULL,
        "endpoint" text NOT NULL,
        "public_key" text,
        "jurisdictions" jsonb DEFAULT '[]'::jsonb,
        "capabilities" jsonb DEFAULT '[]'::jsonb,
        "max_throughput_tps" integer DEFAULT 1000 NOT NULL,
        "current_load_pct" numeric(5, 2) DEFAULT '0.00',
        "total_transactions_processed" integer DEFAULT 0 NOT NULL,
        "last_heartbeat_at" timestamp with time zone,
        "last_sync_at" timestamp with time zone,
        "sync_lag_ms" integer DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "federation_nodes_node_id_unique" UNIQUE("node_id")
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
        "id" serial PRIMARY KEY NOT NULL,
        "base_currency" text DEFAULT 'USD' NOT NULL,
        "quote_currency" text NOT NULL,
        "rate" numeric(12, 6) NOT NULL,
        "source" text DEFAULT 'ecb' NOT NULL,
        "valid_from" timestamp with time zone DEFAULT now() NOT NULL,
        "valid_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settlement_ledger" (
        "id" serial PRIMARY KEY NOT NULL,
        "transaction_ref" text NOT NULL,
        "from_user_id" integer,
        "to_user_id" integer,
        "amount_local" numeric(18, 4) NOT NULL,
        "currency_local" "currency_code" DEFAULT 'USD' NOT NULL,
        "amount_usd" numeric(18, 4) NOT NULL,
        "fx_rate" numeric(12, 6) DEFAULT '1.000000',
        "fx_provider" text DEFAULT 'internal',
        "platform_fee_usd" numeric(14, 4) DEFAULT '0.0000',
        "net_amount_usd" numeric(18, 4) NOT NULL,
        "status" "settlement_status" DEFAULT 'Pending' NOT NULL,
        "settlement_method" text DEFAULT 'stripe',
        "region" text,
        "jurisdiction" text,
        "compliance_flags" jsonb DEFAULT '[]'::jsonb,
        "metadata" jsonb,
        "settled_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "settlement_ledger_transaction_ref_unique" UNIQUE("transaction_ref")
);
--> statement-breakpoint
CREATE TABLE "plugin_installs" (
        "id" serial PRIMARY KEY NOT NULL,
        "plugin_id" integer NOT NULL,
        "installed_by" integer NOT NULL,
        "config" jsonb,
        "is_active" boolean DEFAULT true NOT NULL,
        "installed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugins" (
        "id" serial PRIMARY KEY NOT NULL,
        "app_id" integer NOT NULL,
        "plugin_slug" text NOT NULL,
        "name" text NOT NULL,
        "version" text DEFAULT '1.0.0' NOT NULL,
        "description" text,
        "category" "plugin_category" DEFAULT 'Custom' NOT NULL,
        "status" "plugin_status" DEFAULT 'Draft' NOT NULL,
        "entry_point" text NOT NULL,
        "permissions" jsonb DEFAULT '[]'::jsonb,
        "config_schema" jsonb,
        "icon_url" text,
        "install_count" integer DEFAULT 0 NOT NULL,
        "rating" integer DEFAULT 0,
        "is_sandboxed" boolean DEFAULT true NOT NULL,
        "max_memory_mb" integer DEFAULT 128,
        "timeout_ms" integer DEFAULT 30000,
        "metadata" jsonb,
        "published_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "plugins_plugin_slug_unique" UNIQUE("plugin_slug")
);
--> statement-breakpoint
CREATE TABLE "predictive_maintenance" (
        "id" serial PRIMARY KEY NOT NULL,
        "vin" text NOT NULL,
        "component" text NOT NULL,
        "health_score" numeric(5, 2) NOT NULL,
        "predicted_failure_date" timestamp with time zone,
        "confidence_pct" numeric(5, 2),
        "recommended_action" text,
        "estimated_cost_usd" numeric(10, 2),
        "priority" text DEFAULT 'medium',
        "resolved_at" timestamp with time zone,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_data_points" (
        "id" serial PRIMARY KEY NOT NULL,
        "stream_id" text NOT NULL,
        "metric_type" text NOT NULL,
        "value" numeric(14, 4),
        "unit" text,
        "latitude" numeric(10, 7),
        "longitude" numeric(10, 7),
        "dtc_codes" jsonb,
        "raw" jsonb,
        "recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
        "ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_streams" (
        "id" serial PRIMARY KEY NOT NULL,
        "stream_id" text NOT NULL,
        "user_id" integer,
        "vin" text,
        "device_id" text,
        "source" "telemetry_source" DEFAULT 'OBD2' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "last_data_at" timestamp with time zone,
        "total_data_points" integer DEFAULT 0 NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "telemetry_streams_stream_id_unique" UNIQUE("stream_id")
);
--> statement-breakpoint
CREATE TABLE "compliance_jurisdictions" (
        "id" serial PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "name" text NOT NULL,
        "country" text NOT NULL,
        "region" text,
        "status" "jurisdiction_status" DEFAULT 'Active' NOT NULL,
        "regulatory_body" text,
        "license_required" boolean DEFAULT false NOT NULL,
        "license_number" text,
        "tax_rate_pct" text,
        "requirements" jsonb DEFAULT '[]'::jsonb,
        "restrictions" jsonb DEFAULT '[]'::jsonb,
        "supported_currencies" jsonb DEFAULT '["USD"]'::jsonb,
        "data_residency_required" boolean DEFAULT false NOT NULL,
        "consent_model" text DEFAULT 'opt-in',
        "activated_at" timestamp with time zone,
        "last_audit_at" timestamp with time zone,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "compliance_jurisdictions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
        "id" serial PRIMARY KEY NOT NULL,
        "jurisdiction_code" text NOT NULL,
        "report_type" text NOT NULL,
        "reporting_period" text NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "transaction_count" integer DEFAULT 0,
        "total_volume_usd" text,
        "findings" jsonb,
        "generated_by" text DEFAULT 'system',
        "submitted_at" timestamp with time zone,
        "approved_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligence_reports" (
        "id" serial PRIMARY KEY NOT NULL,
        "report_id" text NOT NULL,
        "report_type" "intelligence_report_type" NOT NULL,
        "title" text NOT NULL,
        "summary" text,
        "region" text,
        "segment" text,
        "data_point_count" integer DEFAULT 0,
        "confidence_score" numeric(5, 3),
        "insights" jsonb,
        "charts" jsonb,
        "recommendations" jsonb,
        "model_version" text DEFAULT 'ONYX-Intelligence-v3.0',
        "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "expires_at" timestamp with time zone,
        "metadata" jsonb,
        CONSTRAINT "intelligence_reports_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "market_data_snapshots" (
        "id" serial PRIMARY KEY NOT NULL,
        "make" text NOT NULL,
        "model" text NOT NULL,
        "year" integer NOT NULL,
        "trim" text,
        "region" text DEFAULT 'US',
        "avg_price_usd" numeric(12, 2),
        "median_price_usd" numeric(12, 2),
        "listing_count" integer DEFAULT 0,
        "avg_days_on_market" integer,
        "demand_index" numeric(5, 2),
        "supply_index" numeric(5, 2),
        "price_change_percent_30d" numeric(6, 2),
        "snapshot_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_tree" (
        "id" serial PRIMARY KEY NOT NULL,
        "inviter_user_id" integer NOT NULL,
        "invite_code" text NOT NULL,
        "invite_hash" text NOT NULL,
        "status" "invite_status" DEFAULT 'Available' NOT NULL,
        "claimed_by_user_id" integer,
        "sent_to_email" text,
        "sent_to_phone" text,
        "depth" integer DEFAULT 0 NOT NULL,
        "chain_signature" text,
        "metadata" jsonb,
        "claimed_at" timestamp with time zone,
        "expires_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "invite_tree_invite_code_unique" UNIQUE("invite_code"),
        CONSTRAINT "invite_tree_invite_hash_unique" UNIQUE("invite_hash")
);
--> statement-breakpoint
CREATE TABLE "node_profiles" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "onyx_id" text NOT NULL,
        "primary_role" "node_role" DEFAULT 'Referral' NOT NULL,
        "active_roles" jsonb DEFAULT '["Referral"]'::jsonb,
        "invites_remaining" integer DEFAULT 5 NOT NULL,
        "invites_used" integer DEFAULT 0 NOT NULL,
        "total_nodes_recruited" integer DEFAULT 0 NOT NULL,
        "lifetime_earnings_usd" text DEFAULT '0.00',
        "tree_depth" integer DEFAULT 0 NOT NULL,
        "parent_node_id" integer,
        "geo_hash" text,
        "latitude" text,
        "longitude" text,
        "service_radius_miles" integer DEFAULT 25,
        "is_available" boolean DEFAULT true NOT NULL,
        "last_active_at" timestamp with time zone,
        "capabilities" jsonb DEFAULT '[]'::jsonb,
        "certifications" jsonb DEFAULT '[]'::jsonb,
        "rating" integer DEFAULT 100,
        "tasks_completed" integer DEFAULT 0 NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "node_profiles_user_id_unique" UNIQUE("user_id"),
        CONSTRAINT "node_profiles_onyx_id_unique" UNIQUE("onyx_id")
);
--> statement-breakpoint
CREATE TABLE "task_matching" (
        "id" serial PRIMARY KEY NOT NULL,
        "task_ref" text NOT NULL,
        "category" "task_category" NOT NULL,
        "state" "task_state" DEFAULT 'Open' NOT NULL,
        "urgency" "task_urgency" DEFAULT 'Standard' NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "requested_by_user_id" integer NOT NULL,
        "assigned_node_id" integer,
        "vin" text,
        "geo_hash" text,
        "latitude" numeric(10, 7),
        "longitude" numeric(10, 7),
        "radius_miles" integer DEFAULT 25,
        "estimated_payout_usd" numeric(10, 2),
        "actual_payout_usd" numeric(10, 2),
        "platform_fee_usd" numeric(10, 2),
        "matched_at" timestamp with time zone,
        "confirmed_at" timestamp with time zone,
        "execution_started_at" timestamp with time zone,
        "verified_at" timestamp with time zone,
        "completed_at" timestamp with time zone,
        "paid_at" timestamp with time zone,
        "cancelled_at" timestamp with time zone,
        "cancel_reason" text,
        "proof_hashes" jsonb DEFAULT '[]'::jsonb,
        "agent_routing" text,
        "split_payment_id" integer,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "task_matching_task_ref_unique" UNIQUE("task_ref")
);
--> statement-breakpoint
CREATE TABLE "split_payments" (
        "id" serial PRIMARY KEY NOT NULL,
        "split_ref" text NOT NULL,
        "task_ref" text,
        "deal_ref" text,
        "total_amount_usd" numeric(14, 4) NOT NULL,
        "platform_fee_usd" numeric(14, 4) NOT NULL,
        "platform_fee_pct" numeric(5, 2) NOT NULL,
        "status" "split_status" DEFAULT 'Calculated' NOT NULL,
        "proof_of_completion" text,
        "proof_hash" text,
        "proof_type" text,
        "blockchain_tx_id" text,
        "metadata" jsonb,
        "calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "proof_verified_at" timestamp with time zone,
        "distributed_at" timestamp with time zone,
        CONSTRAINT "split_payments_split_ref_unique" UNIQUE("split_ref")
);
--> statement-breakpoint
CREATE TABLE "split_recipients" (
        "id" serial PRIMARY KEY NOT NULL,
        "split_id" integer NOT NULL,
        "user_id" integer,
        "role" text NOT NULL,
        "label" text NOT NULL,
        "amount_usd" numeric(14, 4) NOT NULL,
        "percent_of_total" numeric(5, 2) NOT NULL,
        "payout_method" text DEFAULT 'wallet',
        "payout_status" text DEFAULT 'pending',
        "paid_at" timestamp with time zone,
        "transaction_ref" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_payoffs" (
        "id" serial PRIMARY KEY NOT NULL,
        "payoff_ref" text NOT NULL,
        "requested_by_user_id" integer NOT NULL,
        "vin" text NOT NULL,
        "lender_name" text NOT NULL,
        "lender_phone" text,
        "lender_address" text,
        "account_number_masked" text,
        "current_payoff_amount" numeric(12, 2),
        "good_through_date" timestamp with time zone,
        "per_diem_rate" numeric(8, 2),
        "funding_source" text,
        "status" "payoff_status" DEFAULT 'Initiated' NOT NULL,
        "agent_assigned" text DEFAULT 'Finance Agent',
        "proof_hash" text,
        "lien_release_doc_url" text,
        "title_clear_doc_url" text,
        "automation_log" jsonb DEFAULT '[]'::jsonb,
        "metadata" jsonb,
        "initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "completed_at" timestamp with time zone,
        CONSTRAINT "bank_payoffs_payoff_ref_unique" UNIQUE("payoff_ref")
);
--> statement-breakpoint
CREATE TABLE "warranty_intel" (
        "id" serial PRIMARY KEY NOT NULL,
        "vin" text NOT NULL,
        "make" text NOT NULL,
        "model" text NOT NULL,
        "year" integer NOT NULL,
        "warranty_status" text DEFAULT 'Unknown' NOT NULL,
        "factory_warranty_expiry" timestamp with time zone,
        "powertrain_expiry" timestamp with time zone,
        "extended_warranty_provider" text,
        "extended_warranty_expiry" timestamp with time zone,
        "recall_count" integer DEFAULT 0,
        "open_recalls" jsonb DEFAULT '[]'::jsonb,
        "coverage_details" jsonb,
        "verified_at" timestamp with time zone,
        "verification_source" text DEFAULT 'ONYX-Warranty-Intel',
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "warranty_intel_vin_unique" UNIQUE("vin")
);
--> statement-breakpoint
CREATE TABLE "onyx_wallets" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "balance_usd" numeric(14, 4) DEFAULT '0.0000' NOT NULL,
        "pending_usd" numeric(14, 4) DEFAULT '0.0000' NOT NULL,
        "lifetime_earned_usd" numeric(14, 4) DEFAULT '0.0000' NOT NULL,
        "lifetime_withdrawn_usd" numeric(14, 4) DEFAULT '0.0000' NOT NULL,
        "currency" text DEFAULT 'USD' NOT NULL,
        "status" "wallet_status" DEFAULT 'Active' NOT NULL,
        "stripe_connect_id" text,
        "payout_method" text DEFAULT 'instant',
        "last_payout_at" timestamp with time zone,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "onyx_wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "wallet_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "tx_ref" text NOT NULL,
        "direction" "tx_direction" NOT NULL,
        "category" "tx_category" NOT NULL,
        "amount_usd" numeric(14, 4) NOT NULL,
        "balance_after" numeric(14, 4) NOT NULL,
        "description" text,
        "source_ref" text,
        "counterparty_user_id" integer,
        "proof_hash" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "wallet_transactions_tx_ref_unique" UNIQUE("tx_ref")
);
--> statement-breakpoint
CREATE TABLE "location_nodes" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "location_ref" text NOT NULL,
        "name" text NOT NULL,
        "type" text DEFAULT 'other' NOT NULL,
        "address" text,
        "city" text,
        "state" text,
        "zip" text,
        "country" text DEFAULT 'US',
        "latitude" numeric(10, 7),
        "longitude" numeric(10, 7),
        "geo_hash" text,
        "qr_code" text,
        "qr_scans" integer DEFAULT 0 NOT NULL,
        "signups_generated" integer DEFAULT 0 NOT NULL,
        "transactions_generated" integer DEFAULT 0 NOT NULL,
        "revenue_generated_usd" numeric(14, 4) DEFAULT '0.0000' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "operating_hours" jsonb,
        "photos" jsonb DEFAULT '[]'::jsonb,
        "rating" integer DEFAULT 100,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "location_nodes_location_ref_unique" UNIQUE("location_ref")
);
--> statement-breakpoint
CREATE TABLE "remittance_transfers" (
        "id" serial PRIMARY KEY NOT NULL,
        "transfer_ref" text NOT NULL,
        "sender_user_id" integer NOT NULL,
        "recipient_user_id" integer,
        "recipient_name" text,
        "recipient_contact" text,
        "sender_currency" text DEFAULT 'USD' NOT NULL,
        "recipient_currency" text DEFAULT 'USD' NOT NULL,
        "send_amount_original" numeric(14, 4) NOT NULL,
        "receive_amount_converted" numeric(14, 4) NOT NULL,
        "fx_rate" numeric(12, 6),
        "platform_fee_usd" numeric(10, 4) NOT NULL,
        "purpose" text NOT NULL,
        "service_type" text,
        "vin" text,
        "status" text DEFAULT 'Initiated' NOT NULL,
        "payment_rail" text DEFAULT 'Stripe',
        "proof_hash" text,
        "completed_at" timestamp with time zone,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "remittance_transfers_transfer_ref_unique" UNIQUE("transfer_ref")
);
--> statement-breakpoint
CREATE TABLE "offline_sync_queue" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "action_type" text NOT NULL,
        "payload" jsonb NOT NULL,
        "client_timestamp" timestamp with time zone NOT NULL,
        "synced" boolean DEFAULT false NOT NULL,
        "synced_at" timestamp with time zone,
        "conflict_resolution" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_theme_prefs" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "theme_id" text DEFAULT 'onyx-default' NOT NULL,
        "dark_mode" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "user_theme_prefs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "oem_incentives" (
        "id" serial PRIMARY KEY NOT NULL,
        "manufacturer" text NOT NULL,
        "program_name" text NOT NULL,
        "program_code" text,
        "incentive_type" text NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "percent_off" numeric(5, 2),
        "eligible_models" jsonb,
        "eligible_years" jsonb,
        "eligible_zip_codes" jsonb,
        "purchase_types" jsonb,
        "customer_requirements" jsonb,
        "stackable" boolean DEFAULT true,
        "start_date" timestamp,
        "end_date" timestamp,
        "verification_status" text DEFAULT 'active',
        "region" text DEFAULT 'US',
        "description" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_memberships" (
        "id" serial PRIMARY KEY NOT NULL,
        "club_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" "club_member_role" DEFAULT 'Member' NOT NULL,
        "joined_via" text,
        "earnings_cents" integer DEFAULT 0 NOT NULL,
        "contribution_cents" integer DEFAULT 0 NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_treasury" (
        "id" serial PRIMARY KEY NOT NULL,
        "club_id" integer NOT NULL,
        "amount_cents" integer NOT NULL,
        "type" text NOT NULL,
        "description" text,
        "source_user_id" integer,
        "transaction_ref" text,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "logo_url" text,
        "banner_url" text,
        "tier" "club_tier" DEFAULT 'Crew' NOT NULL,
        "status" "club_status" DEFAULT 'pending' NOT NULL,
        "president_id" integer,
        "qr_code" text,
        "referral_code" text,
        "vehicle_types" jsonb DEFAULT '["car"]'::jsonb,
        "city" text,
        "state" text,
        "country" text DEFAULT 'US',
        "website" text,
        "instagram" text,
        "treasury_balance_cents" integer DEFAULT 0 NOT NULL,
        "treasury_lifetime_cents" integer DEFAULT 0 NOT NULL,
        "community_bonus_pct" integer DEFAULT 10 NOT NULL,
        "member_count" integer DEFAULT 0 NOT NULL,
        "verified" boolean DEFAULT false NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "clubs_slug_unique" UNIQUE("slug"),
        CONSTRAINT "clubs_qr_code_unique" UNIQUE("qr_code"),
        CONSTRAINT "clubs_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "event_attendees" (
        "id" serial PRIMARY KEY NOT NULL,
        "event_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "status" text DEFAULT 'registered' NOT NULL,
        "role" text DEFAULT 'attendee' NOT NULL,
        "vehicle_info" text,
        "ticket_ref" text,
        "paid_cents" integer DEFAULT 0,
        "checked_in_at" timestamp with time zone,
        "registered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "type" "event_type" DEFAULT 'car_meet' NOT NULL,
        "status" "event_status" DEFAULT 'draft' NOT NULL,
        "organizer_id" integer,
        "club_id" integer,
        "venue_id" integer,
        "cover_image_url" text,
        "vehicle_types" jsonb DEFAULT '["car"]'::jsonb,
        "address" text,
        "city" text,
        "state" text,
        "zip_code" text,
        "country" text DEFAULT 'US',
        "lat" numeric(10, 7),
        "lng" numeric(10, 7),
        "starts_at" timestamp with time zone NOT NULL,
        "ends_at" timestamp with time zone NOT NULL,
        "max_attendees" integer,
        "entry_fee_cents" integer DEFAULT 0,
        "vendor_fee_cents" integer DEFAULT 0,
        "permit_number" text,
        "permit_status" text,
        "insurance_cert_url" text,
        "compliance_notes" text,
        "attendee_count" integer DEFAULT 0 NOT NULL,
        "revenue_cents" integer DEFAULT 0 NOT NULL,
        "rules" jsonb,
        "tags" jsonb,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "venues" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "type" "venue_type" DEFAULT 'parking_lot' NOT NULL,
        "owner_id" integer,
        "business_name" text,
        "contact_name" text,
        "contact_phone" text,
        "contact_email" text,
        "address" text NOT NULL,
        "city" text NOT NULL,
        "state" text NOT NULL,
        "zip_code" text,
        "country" text DEFAULT 'US',
        "lat" numeric(10, 7),
        "lng" numeric(10, 7),
        "capacity" integer,
        "hourly_rate_cents" integer,
        "after_hours_available" boolean DEFAULT false NOT NULL,
        "after_hours_start" text,
        "after_hours_end" text,
        "amenities" jsonb,
        "rules" jsonb,
        "images" jsonb,
        "permit_required" boolean DEFAULT false NOT NULL,
        "insurance_required" boolean DEFAULT false NOT NULL,
        "verified" boolean DEFAULT false NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "total_events_hosted" integer DEFAULT 0 NOT NULL,
        "total_revenue_cents" integer DEFAULT 0 NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "proof_chain" (
        "id" serial PRIMARY KEY NOT NULL,
        "chain_index" integer NOT NULL,
        "event_type" "proof_event_type" NOT NULL,
        "entity_type" text NOT NULL,
        "entity_id" text NOT NULL,
        "actor_id" text,
        "actor_role" text,
        "agent_id" text,
        "payload_hash" text NOT NULL,
        "previous_hash" text NOT NULL,
        "proof_hash" text NOT NULL,
        "hmac_signature" text NOT NULL,
        "payload" jsonb,
        "participants" jsonb,
        "confidence_score" integer,
        "is_verified" boolean DEFAULT true NOT NULL,
        "architect_signature" text DEFAULT 'RONALD_ANTONIO_CADET::CUXTOMCANDYCLUB_LLC::3CONYX_SOVEREIGN' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "proof_chain_proof_hash_unique" UNIQUE("proof_hash")
);
--> statement-breakpoint
CREATE TABLE "success_stories" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer,
        "display_name" text NOT NULL,
        "location" text NOT NULL,
        "avatar_url" text,
        "previous_job" text NOT NULL,
        "previous_income" integer,
        "current_role" text NOT NULL,
        "total_earnings" integer DEFAULT 0 NOT NULL,
        "monthly_avg" integer DEFAULT 0 NOT NULL,
        "months_on_platform" integer DEFAULT 1 NOT NULL,
        "deals_completed" integer DEFAULT 0 NOT NULL,
        "headline" text NOT NULL,
        "story" text NOT NULL,
        "quote" text,
        "tags" text DEFAULT '[]' NOT NULL,
        "status" "story_status" DEFAULT 'Draft' NOT NULL,
        "is_featured" boolean DEFAULT false NOT NULL,
        "is_verified" boolean DEFAULT false NOT NULL,
        "published_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow_orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_id" text NOT NULL,
        "vehicle_id" text NOT NULL,
        "vehicle_name" text NOT NULL,
        "vin" text NOT NULL,
        "buyer_id" integer,
        "buyer_email" text NOT NULL,
        "price_cents" integer NOT NULL,
        "platform_fee_cents" integer NOT NULL,
        "total_amount_cents" integer NOT NULL,
        "payment_intent_id" text,
        "status" "escrow_status" DEFAULT 'pending' NOT NULL,
        "seller_id" integer,
        "runner_id" text,
        "seller_connected_account_id" text,
        "runner_connected_account_id" text,
        "blockchain_hash" text,
        "stripe_transfer_id" text,
        "runner_payout_transfer_id" text,
        "payout_status" "payout_status" DEFAULT 'none' NOT NULL,
        "payout_retry_count" integer DEFAULT 0 NOT NULL,
        "payout_last_error" text,
        "payout_next_retry_at" timestamp with time zone,
        "delivered_at" timestamp with time zone,
        "released_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "escrow_orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_dealer_id_users_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_tasks" ADD CONSTRAINT "gig_tasks_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_tasks" ADD CONSTRAINT "gig_tasks_assigned_runner_id_users_id_fk" FOREIGN KEY ("assigned_runner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_tasks" ADD CONSTRAINT "gig_tasks_posted_by_dealer_id_users_id_fk" FOREIGN KEY ("posted_by_dealer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_gig_task_id_gig_tasks_id_fk" FOREIGN KEY ("gig_task_id") REFERENCES "public"."gig_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_referred_by_user_id_users_id_fk" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_bids" ADD CONSTRAINT "source_bids_request_id_source_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."source_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_bids" ADD CONSTRAINT "source_bids_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_requests" ADD CONSTRAINT "source_requests_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_covenants" ADD CONSTRAINT "member_covenants_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_ledger" ADD CONSTRAINT "referral_ledger_referring_node_id_users_id_fk" FOREIGN KEY ("referring_node_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_ledger" ADD CONSTRAINT "referral_ledger_buyer_member_id_users_id_fk" FOREIGN KEY ("buyer_member_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_nodes" ADD CONSTRAINT "service_nodes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_finance_manager_id_users_id_fk" FOREIGN KEY ("finance_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_sales_manager_id_users_id_fk" FOREIGN KEY ("sales_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_dealership_id_users_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_audit_log" ADD CONSTRAINT "dealerflow_audit_log_task_id_dealerflow_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."dealerflow_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_audit_log" ADD CONSTRAINT "dealerflow_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_dealership_id_users_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_authorizer_id_users_id_fk" FOREIGN KEY ("authorizer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerflow_tasks" ADD CONSTRAINT "dealerflow_tasks_depends_on_task_id_dealerflow_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."dealerflow_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_scans" ADD CONSTRAINT "document_scans_scanned_by_id_users_id_fk" FOREIGN KEY ("scanned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_scans" ADD CONSTRAINT "document_scans_dealership_id_users_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tickets" ADD CONSTRAINT "customer_tickets_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tickets" ADD CONSTRAINT "customer_tickets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tickets" ADD CONSTRAINT "customer_tickets_dealership_id_users_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_event_log" ADD CONSTRAINT "trust_event_log_trust_score_id_trust_scores_id_fk" FOREIGN KEY ("trust_score_id") REFERENCES "public"."trust_scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_scores" ADD CONSTRAINT "trust_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onyx_api_keys" ADD CONSTRAINT "onyx_api_keys_app_id_developer_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."developer_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_apps" ADD CONSTRAINT "developer_apps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_app_id_developer_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."developer_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_ledger" ADD CONSTRAINT "settlement_ledger_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_ledger" ADD CONSTRAINT "settlement_ledger_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installs" ADD CONSTRAINT "plugin_installs_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugins" ADD CONSTRAINT "plugins_app_id_developer_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."developer_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_streams" ADD CONSTRAINT "telemetry_streams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tree" ADD CONSTRAINT "invite_tree_inviter_user_id_users_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tree" ADD CONSTRAINT "invite_tree_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_profiles" ADD CONSTRAINT "node_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_matching" ADD CONSTRAINT "task_matching_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_matching" ADD CONSTRAINT "task_matching_assigned_node_id_users_id_fk" FOREIGN KEY ("assigned_node_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_recipients" ADD CONSTRAINT "split_recipients_split_id_split_payments_id_fk" FOREIGN KEY ("split_id") REFERENCES "public"."split_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_recipients" ADD CONSTRAINT "split_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_payoffs" ADD CONSTRAINT "bank_payoffs_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onyx_wallets" ADD CONSTRAINT "onyx_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_onyx_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."onyx_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_nodes" ADD CONSTRAINT "location_nodes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remittance_transfers" ADD CONSTRAINT "remittance_transfers_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remittance_transfers" ADD CONSTRAINT "remittance_transfers_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_sync_queue" ADD CONSTRAINT "offline_sync_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_theme_prefs" ADD CONSTRAINT "user_theme_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_treasury" ADD CONSTRAINT "club_treasury_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_treasury" ADD CONSTRAINT "club_treasury_source_user_id_users_id_fk" FOREIGN KEY ("source_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_president_id_users_id_fk" FOREIGN KEY ("president_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_orders" ADD CONSTRAINT "escrow_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_orders" ADD CONSTRAINT "escrow_orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicles_dealer_id_idx" ON "vehicles" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicles_make_model_idx" ON "vehicles" USING btree ("make","model");--> statement-breakpoint
CREATE INDEX "vehicles_type_idx" ON "vehicles" USING btree ("vehicle_type");--> statement-breakpoint
CREATE INDEX "gig_tasks_vehicle_id_idx" ON "gig_tasks" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "gig_tasks_runner_id_idx" ON "gig_tasks" USING btree ("assigned_runner_id");--> statement-breakpoint
CREATE INDEX "gig_tasks_dealer_id_idx" ON "gig_tasks" USING btree ("posted_by_dealer_id");--> statement-breakpoint
CREATE INDEX "gig_tasks_status_idx" ON "gig_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "commission_recipient_id_idx" ON "commission_ledger" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "commission_vehicle_id_idx" ON "commission_ledger" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "commission_status_idx" ON "commission_ledger" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_resource_id_idx" ON "audit_logs" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_event_type_idx" ON "audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "analytics_user_id_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_session_id_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analytics_event_idx" ON "analytics_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "analytics_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_email_idx" ON "login_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "login_attempts_at_idx" ON "login_attempts" USING btree ("attempted_at");--> statement-breakpoint
CREATE INDEX "shipment_vin_idx" ON "shipment_orders" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "shipment_status_idx" ON "shipment_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipment_created_at_idx" ON "shipment_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deals_status_idx" ON "deals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deals_salesperson_idx" ON "deals" USING btree ("salesperson_id");--> statement-breakpoint
CREATE INDEX "deals_dealership_idx" ON "deals" USING btree ("dealership_id");--> statement-breakpoint
CREATE INDEX "deals_vin_idx" ON "deals" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "deals_deal_number_idx" ON "deals" USING btree ("deal_number");--> statement-breakpoint
CREATE INDEX "deals_commission_status_idx" ON "deals" USING btree ("commission_status");--> statement-breakpoint
CREATE INDEX "df_audit_task_idx" ON "dealerflow_audit_log" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "df_audit_user_idx" ON "dealerflow_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "df_audit_action_idx" ON "dealerflow_audit_log" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "df_audit_created_idx" ON "dealerflow_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "df_tasks_department_idx" ON "dealerflow_tasks" USING btree ("department");--> statement-breakpoint
CREATE INDEX "df_tasks_status_idx" ON "dealerflow_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "df_tasks_assigned_idx" ON "dealerflow_tasks" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "df_tasks_dealer_idx" ON "dealerflow_tasks" USING btree ("dealership_id");--> statement-breakpoint
CREATE INDEX "df_tasks_priority_idx" ON "dealerflow_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "df_tasks_vin_idx" ON "dealerflow_tasks" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "df_tasks_sla_due_idx" ON "dealerflow_tasks" USING btree ("sla_due_at");--> statement-breakpoint
CREATE INDEX "df_tasks_scope_idx" ON "dealerflow_tasks" USING btree ("task_scope");--> statement-breakpoint
CREATE INDEX "df_tasks_deal_idx" ON "dealerflow_tasks" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "df_tasks_depends_on_idx" ON "dealerflow_tasks" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX "df_tasks_initiator_idx" ON "dealerflow_tasks" USING btree ("initiator_id");--> statement-breakpoint
CREATE INDEX "df_tasks_owner_idx" ON "dealerflow_tasks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "df_tasks_tracking_idx" ON "dealerflow_tasks" USING btree ("tracking_code");--> statement-breakpoint
CREATE INDEX "doc_scans_type_idx" ON "document_scans" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "doc_scans_status_idx" ON "document_scans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "doc_scans_dealer_idx" ON "document_scans" USING btree ("dealership_id");--> statement-breakpoint
CREATE INDEX "doc_scans_vin_idx" ON "document_scans" USING btree ("extracted_vin");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "customer_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_customer_idx" ON "customer_tickets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "tickets_assigned_idx" ON "customer_tickets" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "tickets_dealer_idx" ON "customer_tickets" USING btree ("dealership_id");--> statement-breakpoint
CREATE INDEX "tickets_category_idx" ON "customer_tickets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "trust_event_score_idx" ON "trust_event_log" USING btree ("trust_score_id");--> statement-breakpoint
CREATE INDEX "trust_event_type_idx" ON "trust_event_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "trust_event_created_idx" ON "trust_event_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trust_user_idx" ON "trust_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trust_tier_idx" ON "trust_scores" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "trust_score_idx" ON "trust_scores" USING btree ("trust_score");--> statement-breakpoint
CREATE INDEX "trust_fingerprint_idx" ON "trust_scores" USING btree ("external_fingerprint");--> statement-breakpoint
CREATE INDEX "trust_verification_idx" ON "trust_scores" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "api_key_app_idx" ON "onyx_api_keys" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "api_key_hash_idx" ON "onyx_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_key_status_idx" ON "onyx_api_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dev_app_user_idx" ON "developer_apps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dev_app_slug_idx" ON "developer_apps" USING btree ("app_slug");--> statement-breakpoint
CREATE INDEX "dev_app_tier_idx" ON "developer_apps" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "webhook_delivery_endpoint_idx" ON "webhook_deliveries" USING btree ("endpoint_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_event_idx" ON "webhook_deliveries" USING btree ("event");--> statement-breakpoint
CREATE INDEX "webhook_app_idx" ON "webhook_endpoints" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "sync_source_idx" ON "cross_region_sync" USING btree ("source_node_id");--> statement-breakpoint
CREATE INDEX "sync_target_idx" ON "cross_region_sync" USING btree ("target_node_id");--> statement-breakpoint
CREATE INDEX "sync_status_idx" ON "cross_region_sync" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fed_node_id_idx" ON "federation_nodes" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "fed_node_region_idx" ON "federation_nodes" USING btree ("region");--> statement-breakpoint
CREATE INDEX "fed_node_status_idx" ON "federation_nodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fx_pair_idx" ON "fx_rates" USING btree ("base_currency","quote_currency");--> statement-breakpoint
CREATE INDEX "settlement_ref_idx" ON "settlement_ledger" USING btree ("transaction_ref");--> statement-breakpoint
CREATE INDEX "settlement_from_idx" ON "settlement_ledger" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "settlement_to_idx" ON "settlement_ledger" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "settlement_status_idx" ON "settlement_ledger" USING btree ("status");--> statement-breakpoint
CREATE INDEX "settlement_currency_idx" ON "settlement_ledger" USING btree ("currency_local");--> statement-breakpoint
CREATE INDEX "settlement_region_idx" ON "settlement_ledger" USING btree ("region");--> statement-breakpoint
CREATE INDEX "plugin_install_plugin_idx" ON "plugin_installs" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "plugin_install_user_idx" ON "plugin_installs" USING btree ("installed_by");--> statement-breakpoint
CREATE INDEX "plugin_app_idx" ON "plugins" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "plugin_slug_idx" ON "plugins" USING btree ("plugin_slug");--> statement-breakpoint
CREATE INDEX "plugin_category_idx" ON "plugins" USING btree ("category");--> statement-breakpoint
CREATE INDEX "plugin_status_idx" ON "plugins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pm_vin_idx" ON "predictive_maintenance" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "pm_component_idx" ON "predictive_maintenance" USING btree ("component");--> statement-breakpoint
CREATE INDEX "pm_priority_idx" ON "predictive_maintenance" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tdp_stream_idx" ON "telemetry_data_points" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "tdp_metric_idx" ON "telemetry_data_points" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "tdp_recorded_idx" ON "telemetry_data_points" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "telemetry_stream_id_idx" ON "telemetry_streams" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "telemetry_user_idx" ON "telemetry_streams" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "telemetry_vin_idx" ON "telemetry_streams" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "telemetry_device_idx" ON "telemetry_streams" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "jurisdiction_code_idx" ON "compliance_jurisdictions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "jurisdiction_country_idx" ON "compliance_jurisdictions" USING btree ("country");--> statement-breakpoint
CREATE INDEX "jurisdiction_status_idx" ON "compliance_jurisdictions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_report_jurisdiction_idx" ON "compliance_reports" USING btree ("jurisdiction_code");--> statement-breakpoint
CREATE INDEX "compliance_report_type_idx" ON "compliance_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "compliance_report_period_idx" ON "compliance_reports" USING btree ("reporting_period");--> statement-breakpoint
CREATE INDEX "intel_report_id_idx" ON "intelligence_reports" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "intel_report_type_idx" ON "intelligence_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "intel_report_region_idx" ON "intelligence_reports" USING btree ("region");--> statement-breakpoint
CREATE INDEX "intel_report_generated_idx" ON "intelligence_reports" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "mds_make_model_idx" ON "market_data_snapshots" USING btree ("make","model");--> statement-breakpoint
CREATE INDEX "mds_year_idx" ON "market_data_snapshots" USING btree ("year");--> statement-breakpoint
CREATE INDEX "mds_region_idx" ON "market_data_snapshots" USING btree ("region");--> statement-breakpoint
CREATE INDEX "mds_snapshot_date_idx" ON "market_data_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "invite_inviter_idx" ON "invite_tree" USING btree ("inviter_user_id");--> statement-breakpoint
CREATE INDEX "invite_code_idx" ON "invite_tree" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "invite_status_idx" ON "invite_tree" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invite_claimed_by_idx" ON "invite_tree" USING btree ("claimed_by_user_id");--> statement-breakpoint
CREATE INDEX "node_user_idx" ON "node_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "node_onyx_id_idx" ON "node_profiles" USING btree ("onyx_id");--> statement-breakpoint
CREATE INDEX "node_role_idx" ON "node_profiles" USING btree ("primary_role");--> statement-breakpoint
CREATE INDEX "node_geo_idx" ON "node_profiles" USING btree ("geo_hash");--> statement-breakpoint
CREATE INDEX "node_available_idx" ON "node_profiles" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "node_parent_idx" ON "node_profiles" USING btree ("parent_node_id");--> statement-breakpoint
CREATE INDEX "task_ref_idx" ON "task_matching" USING btree ("task_ref");--> statement-breakpoint
CREATE INDEX "task_state_idx" ON "task_matching" USING btree ("state");--> statement-breakpoint
CREATE INDEX "task_category_idx" ON "task_matching" USING btree ("category");--> statement-breakpoint
CREATE INDEX "task_requester_idx" ON "task_matching" USING btree ("requested_by_user_id");--> statement-breakpoint
CREATE INDEX "task_assigned_idx" ON "task_matching" USING btree ("assigned_node_id");--> statement-breakpoint
CREATE INDEX "task_geo_idx" ON "task_matching" USING btree ("geo_hash");--> statement-breakpoint
CREATE INDEX "task_urgency_idx" ON "task_matching" USING btree ("urgency");--> statement-breakpoint
CREATE INDEX "split_ref_idx" ON "split_payments" USING btree ("split_ref");--> statement-breakpoint
CREATE INDEX "split_task_idx" ON "split_payments" USING btree ("task_ref");--> statement-breakpoint
CREATE INDEX "split_deal_idx" ON "split_payments" USING btree ("deal_ref");--> statement-breakpoint
CREATE INDEX "split_status_idx" ON "split_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recipient_split_idx" ON "split_recipients" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "recipient_user_idx" ON "split_recipients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipient_role_idx" ON "split_recipients" USING btree ("role");--> statement-breakpoint
CREATE INDEX "recipient_status_idx" ON "split_recipients" USING btree ("payout_status");--> statement-breakpoint
CREATE INDEX "payoff_ref_idx" ON "bank_payoffs" USING btree ("payoff_ref");--> statement-breakpoint
CREATE INDEX "payoff_user_idx" ON "bank_payoffs" USING btree ("requested_by_user_id");--> statement-breakpoint
CREATE INDEX "payoff_vin_idx" ON "bank_payoffs" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "payoff_status_idx" ON "bank_payoffs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payoff_lender_idx" ON "bank_payoffs" USING btree ("lender_name");--> statement-breakpoint
CREATE INDEX "warranty_vin_idx" ON "warranty_intel" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "warranty_status_idx" ON "warranty_intel" USING btree ("warranty_status");--> statement-breakpoint
CREATE INDEX "warranty_make_idx" ON "warranty_intel" USING btree ("make");--> statement-breakpoint
CREATE INDEX "wallet_user_idx" ON "onyx_wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_status_idx" ON "onyx_wallets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wtx_wallet_idx" ON "wallet_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "wtx_user_idx" ON "wallet_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wtx_ref_idx" ON "wallet_transactions" USING btree ("tx_ref");--> statement-breakpoint
CREATE INDEX "wtx_direction_idx" ON "wallet_transactions" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "wtx_category_idx" ON "wallet_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "wtx_created_idx" ON "wallet_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "loc_user_idx" ON "location_nodes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "loc_ref_idx" ON "location_nodes" USING btree ("location_ref");--> statement-breakpoint
CREATE INDEX "loc_type_idx" ON "location_nodes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "loc_geo_idx" ON "location_nodes" USING btree ("geo_hash");--> statement-breakpoint
CREATE INDEX "loc_active_idx" ON "location_nodes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "loc_city_idx" ON "location_nodes" USING btree ("city");--> statement-breakpoint
CREATE INDEX "rem_ref_idx" ON "remittance_transfers" USING btree ("transfer_ref");--> statement-breakpoint
CREATE INDEX "rem_sender_idx" ON "remittance_transfers" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "rem_recipient_idx" ON "remittance_transfers" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "rem_status_idx" ON "remittance_transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rem_purpose_idx" ON "remittance_transfers" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "sync_user_idx" ON "offline_sync_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_synced_idx" ON "offline_sync_queue" USING btree ("synced");--> statement-breakpoint
CREATE INDEX "sync_action_idx" ON "offline_sync_queue" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "theme_user_idx" ON "user_theme_prefs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "theme_id_idx" ON "user_theme_prefs" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "club_memberships_club_idx" ON "club_memberships" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_memberships_user_idx" ON "club_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "club_treasury_club_idx" ON "club_treasury" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_treasury_created_idx" ON "club_treasury" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "clubs_president_idx" ON "clubs" USING btree ("president_id");--> statement-breakpoint
CREATE INDEX "clubs_status_idx" ON "clubs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clubs_slug_idx" ON "clubs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "clubs_referral_code_idx" ON "clubs" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "event_attendees_event_idx" ON "event_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_idx" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_organizer_idx" ON "events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "events_club_idx" ON "events" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "venues_owner_idx" ON "venues" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "venues_city_state_idx" ON "venues" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "venues_slug_idx" ON "venues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "proof_chain_entity_idx" ON "proof_chain" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "proof_chain_event_type_idx" ON "proof_chain" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "proof_chain_actor_idx" ON "proof_chain" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "proof_chain_created_idx" ON "proof_chain" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "proof_chain_proof_hash_idx" ON "proof_chain" USING btree ("proof_hash");--> statement-breakpoint
CREATE INDEX "proof_chain_chain_index_idx" ON "proof_chain" USING btree ("chain_index");--> statement-breakpoint
CREATE INDEX "escrow_order_id_idx" ON "escrow_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "escrow_buyer_id_idx" ON "escrow_orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "escrow_status_idx" ON "escrow_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "escrow_payment_intent_idx" ON "escrow_orders" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "escrow_payout_status_idx" ON "escrow_orders" USING btree ("payout_status");