import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Public lookup used both for live slug-availability checks during upload
 * and for the recipient page. Returns a minimal, safe view of the row.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db
      .query("files")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!row) return null;

    return {
      slug: row.slug,
      status: row.status,
      fileName: row.fileName,
      fileSize: row.fileSize,
      fileType: row.fileType,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    };
  },
});

/**
 * Transactional reserve: re-checks the slug is free and inserts a pending row.
 * Convex mutations are atomic, so this prevents two uploaders racing for the
 * same slug. Stores the hashed owner token; the raw token lives in a cookie.
 */
export const reserveSlug = mutation({
  args: {
    slug: v.string(),
    r2Key: v.string(),
    ownerTokenHash: v.string(),
  },
  handler: async (ctx, { slug, r2Key, ownerTokenHash }) => {
    const existing = await ctx.db
      .query("files")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new Error("SLUG_TAKEN");
    }

    const id = await ctx.db.insert("files", {
      slug,
      status: "pending",
      r2Key,
      ownerTokenHash,
      createdAt: Date.now(),
    });

    return { id, slug, r2Key };
  },
});

/** Mark an upload complete and start its 24h lifespan. */
export const markReady = mutation({
  args: {
    slug: v.string(),
    ownerTokenHash: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("files")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!row) throw new Error("NOT_FOUND");
    if (row.ownerTokenHash !== args.ownerTokenHash) throw new Error("FORBIDDEN");

    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "ready",
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      expiresAt: now + DAY_MS,
    });

    return { slug: args.slug, expiresAt: now + DAY_MS };
  },
});

/**
 * Owner-initiated delete. Verifies the hashed token, returns the r2Key so the
 * caller (a server action) can delete the object, then removes the row.
 */
export const deleteOwn = mutation({
  args: { slug: v.string(), ownerTokenHash: v.string() },
  handler: async (ctx, { slug, ownerTokenHash }) => {
    const row = await ctx.db
      .query("files")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!row) throw new Error("NOT_FOUND");
    if (row.ownerTokenHash !== ownerTokenHash) throw new Error("FORBIDDEN");

    const r2Key = row.r2Key;
    await ctx.db.delete(row._id);
    return { r2Key };
  },
});

/** Internal: list rows whose lifespan has ended, plus stale pending rows. */
export const listExpired = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("files")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", now))
      // expiresAt may be undefined for pending rows; index orders those first.
      .collect();

    const readyExpired = expired.filter(
      (r) => r.expiresAt !== undefined && r.expiresAt <= now,
    );

    // Pending rows that were reserved but never uploaded within 24h.
    const stalePending = await ctx.db
      .query("files")
      .withIndex("by_status_createdAt", (q) =>
        q.eq("status", "pending").lte("createdAt", now - DAY_MS),
      )
      .collect();

    const all = [...readyExpired, ...stalePending];
    return all.map((r) => ({ _id: r._id, r2Key: r.r2Key }));
  },
});

/** Internal: hard-delete a single row (called after its R2 object is gone). */
export const deleteRow = internalMutation({
  args: { id: v.id("files") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
