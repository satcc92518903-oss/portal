"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Hourly cleanup: delete expired (and stale pending) objects from R2, then
 * hard-delete their Convex rows. R2 credentials must be set in the Convex
 * deployment environment (not just in the Next.js app).
 */
export const purgeExpired = internalAction({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.runQuery(internal.files.listExpired, {});
    if (rows.length === 0) return;

    const accountId = process.env.R2_ACCOUNT_ID!;
    const bucket = process.env.R2_BUCKET_NAME!;

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    for (const row of rows) {
      try {
        await s3.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: row.r2Key }),
        );
      } catch (err) {
        // Even if the object is already gone, remove the row so we don't loop.
        console.log("[v0] R2 delete failed for", row.r2Key, err);
      }
      await ctx.runMutation(internal.files.deleteRow, { id: row._id });
    }
  },
});
