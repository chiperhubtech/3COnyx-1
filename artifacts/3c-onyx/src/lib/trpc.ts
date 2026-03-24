// @ts-nocheck
/**
 * 3C Onyx — tRPC Client
 *
 * Type-safe client for the 3C Onyx tRPC API.
 * The router shape mirrors artifacts/api-server/src/lib/trpc.ts.
 * Update both files when adding new procedures.
 */
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";

type AnyProcedure = {
  _def: { $types: { output: unknown; input: unknown } };
};

type OnyxRouter = AnyRouter;

export const trpc = createTRPCReact<OnyxRouter>();

const getApiBase = () => {
  const base = (import.meta.env.BASE_URL as string)?.replace(/\/$/, "") ?? "";
  return `${base}/api/trpc`;
};

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getApiBase(),
      }),
    ],
  });
}

export const trpcUrl = getApiBase;
