import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    slug: v.string(),
    status: v.union(v.literal("pending"), v.literal("ready")),
    r2Key: v.string(),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileType: v.optional(v.string()),
    ownerTokenHash: v.string(),
    createdAt: v.number(),
    // set only once the upload is marked ready
    expiresAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_expiresAt", ["expiresAt"])
    .index("by_status_createdAt", ["status", "createdAt"]),
});
