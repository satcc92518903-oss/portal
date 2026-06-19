"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileDown, Loader2, Trash2 } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { ClosedPortal, StateMessage } from "@/components/state-message";
import { deleteUpload } from "@/app/actions";
import { formatBytes, fileKindLabel } from "@/lib/format";

/**
 * Recipient-facing card for a ready portal. Handles the live countdown,
 * download (via the redirect route), the expiry transition and the owner's
 * delete control.
 */
export function RecipientView({
  slug,
  fileName,
  fileSize,
  fileType,
  expiresAt,
  isOwner,
}: {
  slug: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  expiresAt: number;
  isOwner: boolean;
}) {
  const [expired, setExpired] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleted) {
    return (
      <StateMessage
        art={<ClosedPortal tone="teal" />}
        title="This portal is closed"
        body="The file has been removed. Nothing remains behind the paper door."
      />
    );
  }

  if (expired) {
    return (
      <StateMessage
        art={<ClosedPortal />}
        title="This portal has closed"
        body="Its 24 hours are up, so the file is gone for good. Ask the sender to open a new one."
      />
    );
  }

  async function onDelete() {
    setDeleting(true);
    const res = await deleteUpload(slug);
    setDeleting(false);
    if (res.ok) setDeleted(true);
  }

  return (
    <div className="paper-card paper-grain flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full bg-[var(--paper-sage)]/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--paper-teal-deep)]">
          A portal opened for you
        </span>
        <h1 className="font-serif text-2xl font-semibold text-[var(--paper-ink)]">
          Someone shared a file
        </h1>
      </div>

      {/* file card */}
      <div className="flex items-center gap-4 rounded-xl bg-[var(--paper-cream)]/50 p-4 paper-inset">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[var(--paper-vermillion)]/15 font-mono text-xs font-bold text-[var(--paper-vermillion-deep)] paper-element-sm">
          {fileKindLabel(fileType, fileName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--paper-ink)]">
            {fileName}
          </p>
          <p className="text-sm text-[var(--paper-ink)]/60">
            {formatBytes(fileSize)}
          </p>
        </div>
      </div>

      <a
        href={`/api/download/${encodeURIComponent(slug)}`}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--paper-vermillion)] px-6 py-3.5 text-lg font-semibold text-[var(--paper-moon)] paper-element transition-transform hover:-translate-y-0.5"
      >
        <FileDown className="size-5" /> Download file
      </a>

      <div className="flex flex-col items-center gap-3 border-t border-[var(--paper-sand)] pt-5">
        <span className="text-xs uppercase tracking-wide text-[var(--paper-ink)]/50">
          This portal closes in
        </span>
        <Countdown expiresAt={expiresAt} onExpire={() => setExpired(true)} />
      </div>

      {isOwner && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="mx-auto inline-flex items-center gap-2 rounded-lg border border-[var(--paper-vermillion)]/40 px-4 py-2 text-sm font-medium text-[var(--paper-vermillion-deep)] transition-colors hover:bg-[var(--paper-vermillion)]/10 disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete this portal now
        </button>
      )}

      <Link
        href="/"
        className="mx-auto inline-flex items-center gap-2 text-sm font-medium text-[var(--paper-ink)]/60 hover:text-[var(--paper-ink)]"
      >
        <Download className="size-4 rotate-180" /> Open your own portal
      </Link>
    </div>
  );
}
