"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, MessageCircle, Trash2 } from "lucide-react";
import { sendEmail, sendWhatsApp, deleteUpload } from "@/app/actions";
import { Countdown } from "@/components/countdown";

type Notice = { kind: "ok" | "error"; text: string } | null;

/**
 * Post-upload share panel: copy link, email, WhatsApp, live countdown and an
 * owner "delete now" control. Rendered as a stack of cut-paper sheets.
 */
export function SharePanel({
  slug,
  shareUrl,
  expiresAt,
  onDeleted,
}: {
  slug: string;
  shareUrl: string;
  expiresAt: number;
  onDeleted?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice({ kind: "error", text: "Couldn't copy — select it manually." });
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setSendingEmail(true);
    setNotice(null);
    const res = await sendEmail(slug, email);
    setSendingEmail(false);
    if (res.ok) {
      setNotice({ kind: "ok", text: "Sent. The portal is on its way." });
      setEmail("");
    } else {
      setNotice({ kind: "error", text: res.error });
    }
  }

  async function onWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    setSendingWa(true);
    setNotice(null);
    const res = await sendWhatsApp(slug, phone);
    setSendingWa(false);
    if (res.ok) {
      setNotice({ kind: "ok", text: "Shared over WhatsApp." });
      setPhone("");
    } else {
      setNotice({ kind: "error", text: res.error });
    }
  }

  async function onDelete() {
    setDeleting(true);
    setNotice(null);
    const res = await deleteUpload(slug);
    setDeleting(false);
    if (res.ok) {
      onDeleted?.();
    } else {
      setNotice({ kind: "error", text: res.error });
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--paper-sand)] bg-[var(--paper-ivory)] px-3 py-2.5 text-[var(--paper-ink)] outline-none placeholder:text-[var(--paper-ink)]/40 focus:border-[var(--paper-vermillion)] focus:ring-2 focus:ring-[var(--paper-vermillion)]/20";

  return (
    <div className="paper-card paper-grain flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full bg-[var(--paper-sage)]/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--paper-teal-deep)]">
          Portal open
        </span>
        <h2 className="font-serif text-2xl font-semibold text-[var(--paper-ink)]">
          Your portal is ready to share
        </h2>
      </div>

      {/* copy link */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--paper-ink)]/80">
          Share link
        </label>
        <div className="flex items-stretch gap-2">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className={`${inputCls} font-mono text-sm`}
            aria-label="Share link"
          />
          <button
            type="button"
            onClick={copyLink}
            className="paper-element-sm inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--paper-ink)] px-4 font-medium text-[var(--paper-moon)] transition-transform hover:-translate-y-0.5"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* email */}
        <form onSubmit={onEmail} className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--paper-ink)]/80">
            <Mail className="size-4 text-[var(--paper-teal-deep)]" /> Email it
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className={inputCls}
          />
          <button
            type="submit"
            disabled={sendingEmail}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--paper-teal)] px-4 py-2.5 font-medium text-[var(--paper-moon)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {sendingEmail && <Loader2 className="size-4 animate-spin" />}
            Send email
          </button>
        </form>

        {/* whatsapp */}
        <form onSubmit={onWhatsApp} className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--paper-ink)]/80">
            <MessageCircle className="size-4 text-[var(--paper-sage)]" /> WhatsApp
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 1234"
            className={inputCls}
          />
          <button
            type="submit"
            disabled={sendingWa}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--paper-sage)] px-4 py-2.5 font-medium text-[var(--paper-moon)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {sendingWa && <Loader2 className="size-4 animate-spin" />}
            Send WhatsApp
          </button>
        </form>
      </div>

      {notice && (
        <p
          role="status"
          className={`text-center text-sm ${
            notice.kind === "ok"
              ? "text-[var(--paper-teal-deep)]"
              : "text-[var(--paper-vermillion-deep)]"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="flex flex-col items-center gap-4 border-t border-[var(--paper-sand)] pt-5 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-xs uppercase tracking-wide text-[var(--paper-ink)]/50">
            Closes in
          </span>
          <Countdown expiresAt={expiresAt} />
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--paper-vermillion)]/40 px-4 py-2 text-sm font-medium text-[var(--paper-vermillion-deep)] transition-colors hover:bg-[var(--paper-vermillion)]/10 disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete now
        </button>
      </div>
    </div>
  );
}
