-- Member service desk requests and owner-scoped status events.
CREATE TYPE "service_request_type" AS ENUM ('INSURANCE', 'ROADSIDE', 'RENTAL', 'BODY_WORK');
CREATE TYPE "service_request_status" AS ENUM ('NEW', 'IN_PROGRESS', 'FULFILLED');

CREATE TABLE "service_requests" (
  "id" serial PRIMARY KEY,
  "member_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "service_request_type" NOT NULL,
  "status" "service_request_status" NOT NULL DEFAULT 'NEW',
  "vehicle_year" integer NOT NULL,
  "vehicle_make" text NOT NULL,
  "vehicle_model" text NOT NULL,
  "location" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "service_requests_member_created_idx" ON "service_requests" ("member_id", "created_at");
CREATE INDEX "service_requests_status_created_idx" ON "service_requests" ("status", "created_at");

CREATE TABLE "service_request_events" (
  "id" serial PRIMARY KEY,
  "request_id" integer NOT NULL REFERENCES "service_requests"("id") ON DELETE CASCADE,
  "member_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "actor_id" integer NOT NULL REFERENCES "users"("id"),
  "from_status" "service_request_status",
  "to_status" "service_request_status" NOT NULL,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "service_request_events_member_created_idx" ON "service_request_events" ("member_id", "created_at");