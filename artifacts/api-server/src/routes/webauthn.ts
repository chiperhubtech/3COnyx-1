import { Router, type Request, type Response } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { signToken } from "../lib/jwt";
import { writeAudit } from "../lib/auditService";
import crypto from "crypto";

const router = Router();

const RP_NAME = "3C ONYX";

const ALLOWED_RP_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
]);

function getRpId(req: Request): string {
  const host = req.hostname;
  if (ALLOWED_RP_HOSTS.has(host)) return host;
  if (host.endsWith(".replit.dev") || host.endsWith(".replit.app")) return host;
  return host;
}

function getOrigin(req: Request): string | string[] {
  const rpId = getRpId(req);
  if (rpId === "localhost" || rpId === "127.0.0.1") {
    return `http://${req.headers.host}`;
  }
  return `https://${req.headers.host}`;
}

const challengeStore = new Map<string, { challenge: string; userId: number | null; type: "reg" | "auth"; expiresAt: number }>();

function createChallengeSession(challenge: string, type: "reg" | "auth", userId: number | null): string {
  const sessionId = crypto.randomBytes(32).toString("hex");
  challengeStore.set(sessionId, {
    challenge,
    userId,
    type,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  for (const [key, entry] of challengeStore) {
    if (Date.now() > entry.expiresAt) challengeStore.delete(key);
  }

  return sessionId;
}

function consumeChallenge(sessionId: string, type: "reg" | "auth"): { challenge: string; userId: number | null } | null {
  const entry = challengeStore.get(sessionId);
  if (!entry) return null;
  challengeStore.delete(sessionId);
  if (Date.now() > entry.expiresAt) return null;
  if (entry.type !== type) return null;
  return { challenge: entry.challenge, userId: entry.userId };
}

async function getUserCredentials(userId: number) {
  try {
    const rows = await db.execute(sql`
      SELECT id, public_key, counter, transports, device_type, friendly_name, created_at, last_used_at
      FROM webauthn_credentials WHERE user_id = ${userId}
    `);
    return rows.rows as Array<{
      id: string;
      public_key: string;
      counter: number;
      transports: string | null;
      device_type: string;
      friendly_name: string | null;
      created_at: string;
      last_used_at: string | null;
    }>;
  } catch {
    return [];
  }
}

router.post("/webauthn/register/options", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user!.sub);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const existingCreds = await getUserCredentials(userId);
    const rpID = getRpId(req);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userID: new TextEncoder().encode(String(userId)),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      excludeCredentials: existingCreds.map((c) => ({
        id: c.id,
        transports: c.transports ? (JSON.parse(c.transports) as AuthenticatorTransportFuture[]) : undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    const sessionId = createChallengeSession(options.challenge, "reg", userId);
    res.json({ ...options, sessionId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate registration options" });
  }
});

router.post("/webauthn/register/verify", requireAuth, async (req: Request, res: Response) => {
  const userId = Number(req.user!.sub);
  const { response: attResp, friendlyName, sessionId } = req.body as {
    response: RegistrationResponseJSON;
    friendlyName?: string;
    sessionId?: string;
  };

  if (!sessionId) {
    res.status(400).json({ error: "Missing session. Please try again." });
    return;
  }

  const session = consumeChallenge(sessionId, "reg");
  if (!session || session.userId !== userId) {
    res.status(400).json({ error: "Challenge expired or invalid. Please try again." });
    return;
  }

  const rpID = getRpId(req);
  const origin = getOrigin(req);

  try {
    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: session.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: "Biometric verification failed" });
      return;
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    const publicKeyBase64 = Buffer.from(credential.publicKey).toString("base64");
    const transportsJson = credential.transports ? JSON.stringify(credential.transports) : null;
    const deviceLabel = friendlyName || (credentialDeviceType === "singleDevice" ? "This Device" : "Synced Passkey");

    await db.execute(sql`
      INSERT INTO webauthn_credentials (id, user_id, public_key, counter, device_type, backed_up, transports, friendly_name)
      VALUES (${credential.id}, ${userId}, ${publicKeyBase64}, ${credential.counter}, ${credentialDeviceType}, ${credentialBackedUp}, ${transportsJson}, ${deviceLabel})
    `);

    await writeAudit({
      eventType: "AUTH",
      action: `Biometric credential registered: ${deviceLabel} (${credentialDeviceType})`,
      actorId: userId,
      severity: "INFO",
    });

    res.json({ verified: true, deviceType: credentialDeviceType, friendlyName: deviceLabel });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Registration verification failed" });
  }
});

router.post("/webauthn/authenticate/options", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    const rpID = getRpId(req);

    if (email) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
      if (!user) {
        res.status(400).json({ error: "No biometric credentials available" });
        return;
      }

      const creds = await getUserCredentials(user.id);
      if (creds.length === 0) {
        res.status(400).json({ error: "No biometric credentials available" });
        return;
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: creds.map((c) => ({
          id: c.id,
          transports: c.transports ? (JSON.parse(c.transports) as AuthenticatorTransportFuture[]) : undefined,
        })),
        userVerification: "preferred",
      });

      const sessionId = createChallengeSession(options.challenge, "auth", user.id);
      res.json({ ...options, sessionId });
    } else {
      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
      });

      const sessionId = createChallengeSession(options.challenge, "auth", null);
      res.json({ ...options, sessionId });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate authentication options" });
  }
});

router.post("/webauthn/authenticate/verify", async (req: Request, res: Response) => {
  const { response: authResp, sessionId } = req.body as {
    response: AuthenticationResponseJSON;
    sessionId?: string;
  };

  if (!sessionId) {
    res.status(400).json({ error: "Missing session. Please try again." });
    return;
  }

  const session = consumeChallenge(sessionId, "auth");
  if (!session) {
    res.status(400).json({ error: "Challenge expired. Please try again." });
    return;
  }

  const credentialId = authResp.id;

  try {
    const credRows = await db.execute(sql`
      SELECT id, user_id, public_key, counter, transports
      FROM webauthn_credentials WHERE id = ${credentialId}
    `);

    if (credRows.rows.length === 0) {
      res.status(401).json({ error: "Authentication failed" });
      return;
    }

    const cred = credRows.rows[0] as { id: string; user_id: number; public_key: string; counter: number; transports: string | null };
    const userId = cred.user_id;

    if (session.userId !== null && session.userId !== userId) {
      res.status(401).json({ error: "Authentication failed" });
      return;
    }

    const rpID = getRpId(req);
    const origin = getOrigin(req);

    const publicKeyUint8 = new Uint8Array(Buffer.from(cred.public_key, "base64"));

    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge: session.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.id,
        publicKey: publicKeyUint8,
        counter: cred.counter,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      },
    });

    if (!verification.verified) {
      res.status(401).json({ error: "Authentication failed" });
      return;
    }

    await db.execute(sql`
      UPDATE webauthn_credentials
      SET counter = ${verification.authenticationInfo.newCounter}, last_used_at = NOW()
      WHERE id = ${credentialId}
    `);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !user.isActive) {
      res.status(403).json({ error: "Account is not active" });
      return;
    }

    await db.update(usersTable)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    const token = await signToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await writeAudit({
      eventType: "AUTH",
      action: `Biometric login: ${user.email} (${user.role})`,
      actorId: user.id,
      severity: "INFO",
    });

    const { passwordHash: _, ...publicUser } = user;
    res.json({ token, user: publicUser });
  } catch (err: any) {
    res.status(401).json({ error: "Authentication failed" });
  }
});

router.get("/webauthn/credentials", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user!.sub);
    const creds = await getUserCredentials(userId);
    res.json({
      credentials: creds.map((c) => ({
        id: c.id,
        deviceType: c.device_type,
        friendlyName: c.friendly_name,
        createdAt: c.created_at,
        lastUsedAt: c.last_used_at,
      })),
    });
  } catch {
    res.json({ credentials: [] });
  }
});

router.delete("/webauthn/credentials/:credentialId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user!.sub);
    const { credentialId } = req.params;
    await db.execute(sql`DELETE FROM webauthn_credentials WHERE id = ${credentialId} AND user_id = ${userId}`);
    await writeAudit({ eventType: "AUTH", action: `Biometric credential removed: ${credentialId}`, actorId: userId, severity: "INFO" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to remove credential" });
  }
});

export default router;
