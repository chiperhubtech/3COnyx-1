/**
 * Stripe Agent — Dynasty Wallet + Subscription Engine
 * ─────────────────────────────────────────────────────
 * Handles:
 *   AUTHORIZE_REPAIR     — Authorize repair payment via Dynasty triple-split
 *   ESCROW               — Create vehicle purchase escrow
 *   CREATE_SUBSCRIPTION  — $99/mo member subscription
 *   PROVISION_WALLET     — Create Stripe Connect accounts for member wallet slices
 *   WEBHOOK              — Inbound Stripe webhook events
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import Stripe from "stripe";

const sm     = new SecretsManagerClient({});
const dynamo = new DynamoDBClient({});

type StripeAction =
  | "AUTHORIZE_REPAIR"
  | "ESCROW"
  | "CREATE_SUBSCRIPTION"
  | "PROVISION_WALLET"
  | "WEBHOOK";

interface StripeInput {
  action:     StripeAction;
  memberId?:  string;
  amount?:    number;   // cents
  currency?:  string;
  vin?:       string;
  dealerId?:  string;
  referrerId?: string;
  estimate?:  { totalMin: number; totalMax: number };
  // Subscription
  email?:     string;
  paymentMethodId?: string;
  // Webhook
  body?:      string;
  headers?:   Record<string, string>;
}

export const handler = async (event: StripeInput | Record<string, unknown>) => {
  const isApiEvent = "requestContext" in event;

  let input: StripeInput;
  if (isApiEvent) {
    const apiEvent = event as { body?: string; headers?: Record<string, string>; queryStringParameters?: Record<string, string> };
    // Stripe webhook arrives as raw body
    if (apiEvent.queryStringParameters?.action === "WEBHOOK" ||
        apiEvent.headers?.["stripe-signature"]) {
      input = { action: "WEBHOOK", body: apiEvent.body ?? "", headers: apiEvent.headers ?? {} };
    } else {
      const body = JSON.parse(apiEvent.body ?? "{}");
      input = { action: body.action, ...body };
    }
  } else {
    input = event as StripeInput;
  }

  const secret = await sm.send(new GetSecretValueCommand({ SecretId: process.env["3C_PROD_STRIPE_ARN"] }));
  const { apiKey, webhookSecret } = JSON.parse(secret.SecretString ?? "{}");
  const stripe = new Stripe(apiKey, { apiVersion: "2024-12-18.acacia" });

  switch (input.action) {
    case "AUTHORIZE_REPAIR":    return await authorizeRepair(stripe, input);
    case "ESCROW":              return await createEscrow(stripe, input);
    case "CREATE_SUBSCRIPTION": return await createSubscription(stripe, input);
    case "PROVISION_WALLET":    return await provisionWallet(stripe, input);
    case "WEBHOOK":             return await handleWebhook(stripe, input, webhookSecret);
    default:
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  }
};

// Dynasty triple-split: 85% dealer / 13% platform / 2% referrer
const SPLIT = { dealer: 0.85, platform: 0.13, referrer: 0.02 };

async function createEscrow(stripe: Stripe, input: StripeInput) {
  if (!input.amount || !input.memberId) throw new Error("amount + memberId required");

  const dealerAmount   = Math.floor(input.amount * SPLIT.dealer);
  const platformAmount = Math.floor(input.amount * SPLIT.platform);
  const referrerAmount = input.amount - dealerAmount - platformAmount;

  // Create payment intent with manual capture (escrow pattern)
  const pi = await stripe.paymentIntents.create({
    amount:               input.amount,
    currency:             input.currency ?? "usd",
    capture_method:       "manual",   // funds held, not captured until title transfer
    metadata: {
      memberId:       input.memberId,
      vin:            input.vin ?? "",
      dealerSlice:    String(dealerAmount),
      platformSlice:  String(platformAmount),
      referrerSlice:  String(referrerAmount),
      splitVersion:   "dynasty-v2",
    },
    description: `3C Dynasty Wallet — Vehicle Purchase Escrow (VIN: ${input.vin})`,
  });

  // Record in DynamoDB
  const now = new Date().toISOString();
  await dynamo.send(new PutItemCommand({
    TableName: process.env.WALLET_TABLE_NAME ?? "3c-dynasty-wallet",
    Item: {
      pk:              { S: `WALLET#${input.memberId}` },
      sk:              { S: `SPLIT#${pi.id}` },
      paymentIntentId: { S: pi.id },
      amount:          { N: String(input.amount) },
      dealerSlice:     { N: String(dealerAmount) },
      platformSlice:   { N: String(platformAmount) },
      referrerSlice:   { N: String(referrerAmount) },
      status:          { S: "ESCROWED" },
      vin:             { S: input.vin ?? "" },
      createdAt:       { S: now },
    },
  }));

  return {
    paymentIntentId:  pi.id,
    clientSecret:     pi.client_secret,
    escrowBreakdown: { dealerAmount, platformAmount, referrerAmount },
    status:           pi.status,
    timestamp:        now,
  };
}

async function authorizeRepair(stripe: Stripe, input: StripeInput) {
  const amount = Math.round(((input.estimate?.totalMin ?? 0) + (input.estimate?.totalMax ?? 0)) / 2);
  return await createEscrow(stripe, { ...input, amount });
}

async function createSubscription(stripe: Stripe, input: StripeInput) {
  if (!input.email || !input.paymentMethodId) throw new Error("email + paymentMethodId required");

  // Upsert customer
  const existingCustomers = await stripe.customers.list({ email: input.email, limit: 1 });
  let customer = existingCustomers.data[0];
  if (!customer) {
    customer = await stripe.customers.create({
      email:    input.email,
      metadata: { memberId: input.memberId ?? "", platform: "3C-Onyx" },
    });
  }

  // Attach payment method
  await stripe.paymentMethods.attach(input.paymentMethodId, { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: input.paymentMethodId },
  });

  // $99/mo subscription — price must be created in Stripe dashboard as "3C-Onyx-Pro"
  // or use the price ID directly:
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items:    [{ price: process.env.STRIPE_PRICE_ID ?? "price_3C_ONYX_99_MONTHLY" }],
    metadata: { memberId: input.memberId ?? "", plan: "3C-Onyx-Pro" },
    expand:   ["latest_invoice.payment_intent"],
  });

  return {
    subscriptionId: subscription.id,
    status:         subscription.status,
    customerId:     customer.id,
    currentPeriodEnd: new Date((subscription.current_period_end ?? 0) * 1000).toISOString(),
  };
}

async function provisionWallet(stripe: Stripe, input: StripeInput) {
  if (!input.memberId || !input.email) throw new Error("memberId + email required");

  // Create Stripe Connect Express account for member
  const account = await stripe.accounts.create({
    type:          "express",
    email:         input.email,
    capabilities:  { transfers: { requested: true } },
    business_type: "individual",
    metadata:      { memberId: input.memberId, platform: "3C-Onyx" },
  });

  const now = new Date().toISOString();
  await dynamo.send(new UpdateItemCommand({
    TableName: process.env.WALLET_TABLE_NAME ?? "3c-dynasty-wallet",
    Key: {
      pk: { S: `WALLET#${input.memberId}` },
      sk: { S: "CONNECT_ACCOUNT" },
    },
    UpdateExpression: "SET stripeAccountId = :aid, createdAt = :ts",
    ExpressionAttributeValues: {
      ":aid": { S: account.id },
      ":ts":  { S: now },
    },
  }));

  return { accountId: account.id, status: "PROVISIONED", timestamp: now };
}

async function handleWebhook(stripe: Stripe, input: StripeInput, webhookSecret: string) {
  let webhookEvent: Stripe.Event;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      input.body ?? "",
      input.headers?.["stripe-signature"] ?? "",
      webhookSecret,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid signature" }) };
  }

  const now = new Date().toISOString();

  switch (webhookEvent.type) {
    case "payment_intent.succeeded": {
      const pi = webhookEvent.data.object as Stripe.PaymentIntent;
      await dynamo.send(new UpdateItemCommand({
        TableName: process.env.WALLET_TABLE_NAME ?? "3c-dynasty-wallet",
        Key: {
          pk: { S: `WALLET#${pi.metadata.memberId}` },
          sk: { S: `SPLIT#${pi.id}` },
        },
        UpdateExpression: "SET #s = :s, capturedAt = :ts",
        ExpressionAttributeNames:  { "#s": "status" },
        ExpressionAttributeValues: { ":s": { S: "CAPTURED" }, ":ts": { S: now } },
      }));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = webhookEvent.data.object as Stripe.Subscription;
      console.log({ event: "SUBSCRIPTION_CANCELLED", customerId: sub.customer, memberId: sub.metadata.memberId });
      break;
    }
    default:
      console.log({ webhookType: webhookEvent.type, note: "unhandled — add case as needed" });
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
