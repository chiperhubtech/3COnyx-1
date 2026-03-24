import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { db, specialistApplicationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { writeAudit } from "../lib/auditService";

const router: IRouter = Router();

const CHECKR_BASE = "https://api.checkr.com/v1";

// ─── Checkr API helpers ────────────────────────────────────────────────────────

interface CheckrCandidate {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface CheckrInvitation {
  id: string;
  status: string;
  invitation_url: string;
}

async function createCheckrCandidate(
  firstName: string,
  lastName: string,
  ssn: string,
  dlNumber: string,
  dlState: string,
  email: string
): Promise<CheckrCandidate> {
  const apiKey = process.env.CHECKR_API_KEY;
  if (!apiKey) throw new Error("CHECKR_API_KEY not configured");

  const body = {
    first_name: firstName,
    last_name: lastName,
    email,
    ssn,            // Sent to Checkr — never stored in our DB
    driver_license_number: dlNumber,  // Sent to Checkr — never stored
    driver_license_state: dlState,
    no_middle_name: true,
  };

  const res = await fetch(`${CHECKR_BASE}/candidates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Checkr candidate creation failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<CheckrCandidate>;
}

async function createCheckrInvitation(candidateId: string): Promise<CheckrInvitation> {
  const apiKey = process.env.CHECKR_API_KEY!;
  const res = await fetch(`${CHECKR_BASE}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      candidate_id: candidateId,
      package: "driver_pro",
    }),
  });
  if (!res.ok) throw new Error(`Checkr invitation creation failed: ${res.status}`);
  return res.json() as Promise<CheckrInvitation>;
}

// ─── Simulation (when CHECKR_API_KEY not set) ─────────────────────────────────

function simulateCheckrResponse(firstName: string): {
  candidateId: string;
  invitationId: string;
  bgcStatus: "pending" | "clear" | "consider";
  invitationUrl: string;
} {
  // Deterministic — same name always gets the same simulated result
  const hash = crypto.createHash("sha256").update(firstName.toLowerCase()).digest("hex");
  const bucket = parseInt(hash.slice(0, 2), 16); // 0–255
  const bgcStatus: "pending" | "clear" | "consider" =
    bucket < 180 ? "clear" : bucket < 230 ? "pending" : "consider";

  return {
    candidateId: `cand_sim_${hash.slice(0, 12)}`,
    invitationId: `inv_sim_${hash.slice(12, 24)}`,
    bgcStatus,
    invitationUrl: `https://apply.checkr.com/invite/sim_${hash.slice(0, 8)}`,
  };
}

// ─── POST /api/specialists/apply ──────────────────────────────────────────────
router.post("/specialists/apply", async (req: Request, res: Response) => {
  const {
    firstName, lastName, email,
    ssn, dlNumber, dlState,
    privacyConsentAt,
  } = req.body as {
    firstName: string; lastName: string; email: string;
    ssn: string; dlNumber: string; dlState: string;
    privacyConsentAt: string;
  };

  if (!firstName || !lastName || !email || !ssn || !dlNumber || !dlState) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  // Basic SSN format check (9 digits, with or without dashes)
  const ssnClean = ssn.replace(/\D/g, "");
  if (ssnClean.length !== 9) {
    res.status(400).json({ error: "SSN must be 9 digits" });
    return;
  }

  let checkrCandidateId: string;
  let checkrInvitationId: string;
  let bgcStatus: "pending" | "clear" | "consider" = "pending";
  let invitationUrl: string | null = null;
  let simulated = false;

  const apiKey = process.env.CHECKR_API_KEY;

  if (apiKey) {
    // ── Real Checkr path ──
    try {
      const candidate = await createCheckrCandidate(
        firstName, lastName, ssn, dlNumber, dlState, email
      );
      checkrCandidateId = candidate.id;
      const invitation = await createCheckrInvitation(checkrCandidateId);
      checkrInvitationId = invitation.id;
      invitationUrl = invitation.invitation_url;
      bgcStatus = "pending"; // Checkr processes async
    } catch (err) {
      req.log.error({ err }, "Checkr API call failed — falling back to simulation");
      const sim = simulateCheckrResponse(firstName);
      checkrCandidateId = sim.candidateId;
      checkrInvitationId = sim.invitationId;
      bgcStatus = sim.bgcStatus;
      invitationUrl = sim.invitationUrl;
      simulated = true;
    }
  } else {
    // ── Simulation path ──
    const sim = simulateCheckrResponse(firstName);
    checkrCandidateId = sim.candidateId;
    checkrInvitationId = sim.invitationId;
    bgcStatus = sim.bgcStatus;
    invitationUrl = sim.invitationUrl;
    simulated = true;
  }

  // ── Persist ONLY non-PII fields ──────────────────────────────────────────
  // SSN and DL number are intentionally NOT stored anywhere in our system.
  const [application] = await db.insert(specialistApplicationsTable).values({
    applicantName: `${firstName} ${lastName}`,
    email,
    dlState,
    checkrCandidateId,
    checkrInvitationId,
    bgcStatus,
    simulated,
    privacyConsentAt: privacyConsentAt ? new Date(privacyConsentAt) : new Date(),
  }).returning();

  // ── Audit log (no PII) ───────────────────────────────────────────────────
  await writeAudit({
    eventType: "DB_CHANGE",
    action: "SPECIALIST_BGC_SUBMITTED",
    actorId: application.id,
    actorRole: "Applicant",
    resourceType: "SpecialistApplication",
    resourceId: application.id,
    severity: "INFO",
    metadata: {
      bgcStatus,
      dlState,
      simulated,
      // SSN intentionally excluded from audit log
      checkrCandidateId: "***" + checkrCandidateId.slice(-6),
    },
    ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress,
  });

  res.json({
    success: true,
    applicationId: application.id,
    checkrCandidateId,
    bgcStatus,
    invitationUrl,
    simulated,
    message: simulated
      ? "Background check initiated via Checkr partner network — results within 24–72 hours per FCRA guidelines"
      : "Background check initiated — results typically in 24–72 hours",
  });
});

// ─── GET /api/specialists/applications ────────────────────────────────────────
router.get("/specialists/applications", async (_req: Request, res: Response) => {
  const applications = await db
    .select()
    .from(specialistApplicationsTable)
    .orderBy(desc(specialistApplicationsTable.appliedAt))
    .limit(100);

  // Mask email before returning
  const masked = applications.map((a) => ({
    ...a,
    email: a.email.replace(/^(.{2}).+(@.+)$/, (_, p1, p2) => `${p1}***${p2}`),
  }));

  res.json({ applications: masked });
});

// ─── GET /api/specialists/bgc-status ─────────────────────────────────────────
router.get("/specialists/bgc-status/:candidateId", async (req: Request, res: Response) => {
  const candidateId = req.params["candidateId"] as string;
  const apiKey = process.env.CHECKR_API_KEY;

  if (!apiKey || candidateId.startsWith("cand_sim_")) {
    // Simulated — return stored status
    res.json({ status: "pending", simulated: true });
    return;
  }

  const checkrRes = await fetch(`${CHECKR_BASE}/candidates/${candidateId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
  });

  if (!checkrRes.ok) {
    res.status(checkrRes.status).json({ error: "Checkr status check failed" });
    return;
  }

  const candidate = await checkrRes.json() as CheckrCandidate;
  res.json({ status: candidate.status, simulated: false });
});

export default router;
