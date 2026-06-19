"use server";

import { cookies } from "next/headers";
import { Resend } from "resend";
import { getConvexClient } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { presignPut, deleteR2Object } from "@/lib/r2";
import {
  generateOwnerToken,
  hashOwnerToken,
  ownerCookieName,
} from "@/lib/owner-token";
import { validateSlug, normalizeSlug } from "@/lib/slug";

const MAX_BYTES = 500 * 1024 * 1024; // 500MB
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

type ReserveResult =
  | { ok: true; uploadUrl: string; r2Key: string; slug: string }
  | { ok: false; error: string };

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

/**
 * Reserve the slug immediately (creating the pending DB row so the name is
 * saved), set the owner cookie, and return a presigned PUT URL for the browser
 * to upload the file directly to R2.
 */
export async function reserveUpload(input: {
  slug: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}): Promise<ReserveResult> {
  const slug = normalizeSlug(input.slug);
  const slugError = validateSlug(slug);
  if (slugError) return { ok: false, error: slugError };

  if (!input.fileSize || input.fileSize <= 0) {
    return { ok: false, error: "That file looks empty." };
  }
  if (input.fileSize > MAX_BYTES) {
    return { ok: false, error: "Files must be 500MB or smaller." };
  }

  const safeName = sanitizeFileName(input.fileName);
  const r2Key = `${slug}/${Date.now()}-${safeName}`;
  const contentType = input.fileType || "application/octet-stream";

  const ownerToken = generateOwnerToken();
  const ownerTokenHash = hashOwnerToken(ownerToken);

  const convex = getConvexClient();
  try {
    await convex.mutation(api.files.reserveSlug, {
      slug,
      r2Key,
      ownerTokenHash,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("SLUG_TAKEN")) {
      return { ok: false, error: "That portal name was just taken." };
    }
    return { ok: false, error: "Could not reserve this portal. Try again." };
  }

  // Owner cookie: httpOnly so only the server can read it for delete/controls.
  const jar = await cookies();
  jar.set(ownerCookieName(slug), ownerToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  let uploadUrl: string;
  try {
    uploadUrl = await presignPut(r2Key, contentType);
  } catch {
    return { ok: false, error: "Could not start the upload. Try again." };
  }

  return { ok: true, uploadUrl, r2Key, slug };
}

/** Mark the upload ready (starts the 24h countdown). Verifies owner cookie. */
export async function completeUpload(input: {
  slug: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}): Promise<{ ok: true; expiresAt: number } | { ok: false; error: string }> {
  const jar = await cookies();
  const token = jar.get(ownerCookieName(input.slug))?.value;
  if (!token) return { ok: false, error: "Your upload session expired." };

  const convex = getConvexClient();
  try {
    const res = await convex.mutation(api.files.markReady, {
      slug: input.slug,
      ownerTokenHash: hashOwnerToken(token),
      fileName: sanitizeFileName(input.fileName),
      fileSize: input.fileSize,
      fileType: input.fileType || "application/octet-stream",
    });
    return { ok: true, expiresAt: res.expiresAt };
  } catch {
    return { ok: false, error: "Could not finalize the upload." };
  }
}

/** Owner deletes their file early. Reads cookie, removes row + R2 object. */
export async function deleteUpload(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const jar = await cookies();
  const token = jar.get(ownerCookieName(slug))?.value;
  if (!token) return { ok: false, error: "You are not the owner of this portal." };

  const convex = getConvexClient();
  try {
    const { r2Key } = await convex.mutation(api.files.deleteOwn, {
      slug,
      ownerTokenHash: hashOwnerToken(token),
    });
    await deleteR2Object(r2Key).catch(() => {});
    jar.delete(ownerCookieName(slug));
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete this portal." };
  }
}

/** Whether the current visitor owns the given portal (drives owner-only UI). */
export async function isOwner(slug: string): Promise<boolean> {
  const jar = await cookies();
  return Boolean(jar.get(ownerCookieName(slug))?.value);
}

function buildShareUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return `${base}/${slug}`;
}

/** Email the share link via Resend. */
export async function sendEmail(
  slug: string,
  to: string,
  message?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "That email address looks off." };
  }
  const url = buildShareUrl(slug);
  const resend = new Resend(process.env.RESEND_API_KEY!);
  try {
    await resend.emails.send({
      from: process.env.PORTAL_FROM_EMAIL!,
      to,
      subject: "A Portal has been shared with you",
      html: `
        <div style="font-family: Georgia, serif; background:#f4e4c8; padding:32px; color:#3a2c1f;">
          <h1 style="font-size:24px; margin:0 0 8px;">Someone opened a Portal for you</h1>
          <p style="margin:0 0 16px; line-height:1.6;">
            ${message ? escapeHtml(message) : "A file is waiting behind this paper door. It closes in 24 hours."}
          </p>
          <a href="${url}" style="display:inline-block; background:#d6502f; color:#faf2e2; text-decoration:none; padding:12px 22px; border-radius:10px; font-family:Arial, sans-serif; font-weight:bold;">
            Open the Portal
          </a>
          <p style="margin:18px 0 0; font-size:13px; color:#7a6a55;">${url}</p>
        </div>
      `,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send the email." };
  }
}

/** Share the link via the WhatsApp Cloud API template (dynamic URL button). */
export async function sendWhatsApp(
  slug: string,
  phone: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = phone.replace(/[^\d]/g, "");
  if (to.length < 8) {
    return { ok: false, error: "Enter a full number with country code." };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_TOKEN!;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME!;
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: lang },
            components: [
              {
                type: "button",
                sub_type: "url",
                index: "0",
                // The template's dynamic URL button appends {{1}} to its base.
                parameters: [{ type: "text", text: slug }],
              },
            ],
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.log("[v0] WhatsApp send failed:", res.status, body);
      return { ok: false, error: "WhatsApp could not deliver the message." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "WhatsApp could not deliver the message." };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
