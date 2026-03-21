import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { getUncachableStripeClient, MEMBER_SLICE_PCT } from "../lib/stripeClient";

const router: IRouter = Router();

// ─── In-memory stores (MVP) ────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "Member" | "Dealer" | "Runner";
  stripeConnectId: string | null;
  connectStatus: "connected" | "pending" | "not_connected";
  bankLast4: string | null;
}

interface SliceTransaction {
  id: string;
  taskId: string;
  taskTitle: string;
  vehicle: string;
  taskPayout: number;
  memberSlice: number;
  slicePct: number;
  status: "paid" | "pending" | "processing";
  createdAt: string;
  paidAt: string | null;
  stripeTransferId: string | null;
  runnerName: string;
}

interface MemberWallet {
  memberId: string;
  totalEarned: number;
  pendingAmount: number;
  availableForPayout: number;
  lastPayoutAt: string | null;
  transactions: SliceTransaction[];
}

const members: Member[] = [
  {
    id: "mem-001",
    name: "Alexander Harrington",
    email: "a.harrington@priv.com",
    avatar: "AH",
    role: "Member",
    stripeConnectId: "acct_1OtestHarrington",
    connectStatus: "connected",
    bankLast4: "4821",
  },
  {
    id: "mem-002",
    name: "Vivienne Moreau",
    email: "v.moreau@private.io",
    avatar: "VM",
    role: "Member",
    stripeConnectId: null,
    connectStatus: "pending",
    bankLast4: null,
  },
  {
    id: "mem-003",
    name: "Natasha Worthington",
    email: "n.worthington@nwgroup.com",
    avatar: "NW",
    role: "Member",
    stripeConnectId: "acct_1OtestWorthington",
    connectStatus: "connected",
    bankLast4: "9012",
  },
];

const wallets: Record<string, MemberWallet> = {
  "mem-001": {
    memberId: "mem-001",
    totalEarned: 9_890,
    pendingAmount: 1_340,
    availableForPayout: 8_550,
    lastPayoutAt: "2026-03-18T14:22:00Z",
    transactions: [
      {
        id: "txn-001", taskId: "task-001", taskTitle: "Dealer Swap",
        vehicle: "2023 Rolls-Royce Ghost Extended",
        taskPayout: 48_000, memberSlice: 2_400, slicePct: 5,
        status: "paid", createdAt: "2026-03-18T12:00:00Z",
        paidAt: "2026-03-18T14:22:00Z",
        stripeTransferId: "tr_3OtestRR1234", runnerName: "Marcus Webb",
      },
      {
        id: "txn-002", taskId: "task-003", taskTitle: "Port Pickup",
        vehicle: "2024 Bentley Bentayga EWB",
        taskPayout: 35_000, memberSlice: 1_750, slicePct: 5,
        status: "paid", createdAt: "2026-03-15T09:30:00Z",
        paidAt: "2026-03-15T11:00:00Z",
        stripeTransferId: "tr_3OtestBT5678", runnerName: "Demarco Tate",
      },
      {
        id: "txn-003", taskId: "task-008", taskTitle: "Client Delivery",
        vehicle: "2023 Ferrari Roma",
        taskPayout: 26_800, memberSlice: 1_340, slicePct: 5,
        status: "pending", createdAt: "2026-03-21T10:00:00Z",
        paidAt: null, stripeTransferId: null, runnerName: "Priya Rao",
      },
    ],
  },
  "mem-003": {
    memberId: "mem-003",
    totalEarned: 14_620,
    pendingAmount: 0,
    availableForPayout: 14_620,
    lastPayoutAt: "2026-03-20T09:00:00Z",
    transactions: [
      {
        id: "txn-004", taskId: "task-005", taskTitle: "Auction Transport",
        vehicle: "2022 Lamborghini Huracán EVO",
        taskPayout: 92_500, memberSlice: 4_625, slicePct: 5,
        status: "paid", createdAt: "2026-03-20T07:00:00Z",
        paidAt: "2026-03-20T09:00:00Z",
        stripeTransferId: "tr_3OtestLB9012", runnerName: "Nikolai Petrov",
      },
      {
        id: "txn-005", taskId: "task-006", taskTitle: "Client Delivery",
        vehicle: "2023 Maserati MC20",
        taskPayout: 52_000, memberSlice: 2_600, slicePct: 5,
        status: "paid", createdAt: "2026-03-19T11:00:00Z",
        paidAt: "2026-03-19T13:30:00Z",
        stripeTransferId: "tr_3OtestMC3456", runnerName: "Shelby Connors",
      },
    ],
  },
};

// ─── GET /api/wallet/members ──────────────────────────────────────────────────
router.get("/wallet/members", (_req: Request, res: Response) => {
  res.json({ members });
});

// ─── GET /api/wallet/:memberId ────────────────────────────────────────────────
router.get("/wallet/:memberId", (req: Request, res: Response) => {
  const member = members.find((m) => m.id === req.params.memberId);
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  const wallet = wallets[member.id] ?? {
    memberId: member.id, totalEarned: 0, pendingAmount: 0,
    availableForPayout: 0, lastPayoutAt: null, transactions: [],
  };
  res.json({ member, wallet });
});

// ─── POST /api/wallet/payout  — trigger 5% Member Slice after task completes ──
router.post("/wallet/payout", async (req: Request, res: Response) => {
  const { taskId, taskTitle, vehicle, taskPayout, referrerId, runnerName } = req.body as {
    taskId: string; taskTitle: string; vehicle: string;
    taskPayout: number; referrerId: string; runnerName: string;
  };

  if (!taskId || !taskPayout || !referrerId) {
    res.status(400).json({ error: "taskId, taskPayout, referrerId required" });
    return;
  }

  const member = members.find((m) => m.id === referrerId);
  if (!member) { res.status(404).json({ error: "Referrer member not found" }); return; }

  const memberSlice = Math.round(taskPayout * MEMBER_SLICE_PCT * 100) / 100;
  const amountCents = Math.round(memberSlice * 100);
  const stripe = await getUncachableStripeClient();

  let stripeTransferId: string | null = null;
  let status: SliceTransaction["status"] = "pending";

  // Attempt real Stripe Connect transfer if client + connected account exist
  if (stripe && member.stripeConnectId && member.connectStatus === "connected") {
    try {
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: "usd",
        destination: member.stripeConnectId,
        transfer_group: `TASK_${taskId}`,
        metadata: {
          taskId,
          vehicle,
          memberSlicePct: String(MEMBER_SLICE_PCT * 100),
          originalPayout: String(taskPayout),
        },
      });
      stripeTransferId = transfer.id;
      status = "paid";
      req.log.info({ transfer: transfer.id, memberId: referrerId }, "Stripe Connect transfer created");
    } catch (err) {
      req.log.error({ err }, "Stripe transfer failed — recording as pending");
    }
  } else if (!stripe) {
    req.log.info({ memberId: referrerId, amountCents }, "Stripe not configured — recording payout as pending");
  }

  const txn: SliceTransaction = {
    id: `txn-${crypto.randomBytes(4).toString("hex")}`,
    taskId, taskTitle, vehicle, taskPayout,
    memberSlice, slicePct: MEMBER_SLICE_PCT * 100,
    status,
    createdAt: new Date().toISOString(),
    paidAt: status === "paid" ? new Date().toISOString() : null,
    stripeTransferId,
    runnerName,
  };

  // Append to wallet
  if (!wallets[referrerId]) {
    wallets[referrerId] = {
      memberId: referrerId, totalEarned: 0, pendingAmount: 0,
      availableForPayout: 0, lastPayoutAt: null, transactions: [],
    };
  }
  const w = wallets[referrerId];
  w.transactions.unshift(txn);
  w.totalEarned += memberSlice;
  if (status === "paid") {
    w.availableForPayout += memberSlice;
    w.lastPayoutAt = txn.paidAt;
  } else {
    w.pendingAmount += memberSlice;
  }

  res.json({ success: true, transaction: txn, memberSlice, stripeTransferId });
});

// ─── POST /api/wallet/connect/onboard  — Stripe Connect Express onboarding ───
router.post("/wallet/connect/onboard", async (req: Request, res: Response) => {
  const { memberId } = req.body as { memberId: string };
  const member = members.find((m) => m.id === memberId);
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }

  const stripe = await getUncachableStripeClient();

  if (stripe) {
    try {
      // Create Express connected account
      let accountId = member.stripeConnectId;
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          email: member.email,
          capabilities: { transfers: { requested: true } },
          metadata: { memberId: member.id, platform: "3c-onyx" },
        });
        accountId = account.id;
        member.stripeConnectId = accountId;
        member.connectStatus = "pending";
      }

      const origin = `${req.protocol}://${req.get("host")}`;
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/wallet`,
        return_url: `${origin}/wallet?connected=true`,
        type: "account_onboarding",
      });

      res.json({ onboardingUrl: link.url, accountId });
      return;
    } catch (err) {
      req.log.error({ err }, "Stripe Connect onboarding failed");
    }
  }

  // Simulate onboarding when Stripe not configured
  member.connectStatus = "pending";
  res.json({
    onboardingUrl: null,
    simulated: true,
    message: "Connect Stripe to enable real payouts. Your account is marked as pending.",
  });
});

// ─── POST /api/wallet/connect/simulate  — simulate a connected account ────────
router.post("/wallet/connect/simulate", (req: Request, res: Response) => {
  const { memberId } = req.body as { memberId: string };
  const member = members.find((m) => m.id === memberId);
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  member.stripeConnectId = `acct_sim_${crypto.randomBytes(6).toString("hex")}`;
  member.connectStatus = "connected";
  member.bankLast4 = String(Math.floor(1000 + Math.random() * 9000));
  res.json({ member, simulated: true });
});

// ─── GET /api/wallet/stripe/status ───────────────────────────────────────────
router.get("/wallet/stripe/status", async (_req: Request, res: Response) => {
  const stripe = await getUncachableStripeClient();
  res.json({ configured: !!stripe, mode: stripe ? "live" : "demo" });
});

export default router;
