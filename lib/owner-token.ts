import "server-only";
import { randomBytes, createHash } from "crypto";

/** Generate a high-entropy owner token (raw value lives only in the cookie). */
export function generateOwnerToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash the token for storage in Convex; we never store the raw token. */
export function hashOwnerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cookie name for a given slug's ownership token. */
export function ownerCookieName(slug: string): string {
  return `portal_token_${slug}`;
}
