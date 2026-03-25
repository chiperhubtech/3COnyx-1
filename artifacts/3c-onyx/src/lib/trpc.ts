/**
 * 3C Onyx — tRPC Client
 *
 * Type-safe client for the 3C Onyx tRPC API.
 * The router shape mirrors artifacts/api-server/src/lib/trpc.ts.
 * Update both files when adding new procedures.
 */
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const getApiBase = () => {
  const base = (import.meta.env.BASE_URL as string)?.replace(/\/$/, "") ?? "";
  return `${base}/api/trpc`;
};

export const trpc = createTRPCProxyClient<any>({
  links: [
    httpBatchLink({
      url: getApiBase(),
    }),
  ],
});

export function createTRPCClient() {
  return createTRPCProxyClient<any>({
    links: [
      httpBatchLink({
        url: getApiBase(),
      }),
    ],
  });
}

export const trpcUrl = getApiBase;
