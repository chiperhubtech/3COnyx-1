// Stripe client using Replit Stripe connector
// Ref: connection:conn_stripe_01KM6ZQD4B1897DR0PZVDYNB4N

import Stripe from "stripe";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    return null; // Not in Replit connector environment
  }

  const connectorName = "stripe";
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", connectorName);
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": xReplitToken,
    },
  });

  const data = await response.json() as { items?: typeof connectionSettings[] };
  connectionSettings = data.items?.[0];

  if (
    !connectionSettings ||
    !connectionSettings.settings?.publishable ||
    !connectionSettings.settings?.secret
  ) {
    return null;
  }

  return {
    publishableKey: connectionSettings.settings.publishable as string,
    secretKey: connectionSettings.settings.secret as string,
  };
}

// WARNING: Never cache this client. Always call fresh.
export async function getUncachableStripeClient(): Promise<Stripe | null> {
  const creds = await getCredentials();
  if (!creds) return null;
  return new Stripe(creds.secretKey, {
    apiVersion: "2025-08-27.basil" as any,
  });
}

export async function getStripePublishableKey(): Promise<string | null> {
  const creds = await getCredentials();
  return creds?.publishableKey ?? null;
}

// 5% Member Slice constant
export const MEMBER_SLICE_PCT = 0.05;
