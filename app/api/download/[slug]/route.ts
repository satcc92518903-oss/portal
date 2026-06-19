import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { presignGet } from "@/lib/r2";
import { normalizeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

/**
 * Recipient download. Keeps the bucket private: we look the portal up, confirm
 * it's ready and unexpired, then 302-redirect to a short-lived presigned GET
 * URL instead of streaming the (potentially large) file through the server.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw);

  const convex = getConvexClient();
  const row = await convex.query(api.files.getBySlug, { slug });

  if (!row || row.status !== "ready") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!row.expiresAt || row.expiresAt <= Date.now()) {
    return NextResponse.json({ error: "This portal has closed" }, {
      status: 410,
    });
  }

  // getBySlug intentionally omits r2Key; fetch the storage key for download.
  const key = await convex.query(api.files.getR2Key, { slug });
  if (!key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = await presignGet(key, row.fileName ?? "file");
  return NextResponse.redirect(url, 302);
}
