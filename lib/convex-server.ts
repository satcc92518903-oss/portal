import { ConvexHttpClient } from "convex/browser";

/** A fresh HTTP client for server-side reads/writes (server components, actions, routes). */
export function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}
