"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import {
  Check,
  FileUp,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { reserveUpload, completeUpload } from "@/app/actions";
import {
  generateSlug,
  normalizeSlug,
  validateSlug,
} from "@/lib/slug";
import { formatBytes } from "@/lib/format";
import { PaperMoon } from "@/components/paper-art";
import { SharePanel } from "@/components/share-panel";

const MAX_BYTES = 500 * 1024 * 1024;

type Phase = "choose" | "naming" | "uploading" | "done";

export function UploadFlow({ appUrl }: { appUrl: string }) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // initialise a readable slug once on mount
  useEffect(() => {
    setSlug(generateSlug());
  }, []);

  const normalized = useMemo(() => normalizeSlug(slug), [slug]);
  const formatError = useMemo(() => validateSlug(normalized), [normalized]);

  // Live availability — only query when the slug is well-formed.
  const existing = useQuery(
    api.files.getBySlug,
    formatError ? "skip" : { slug: normalized },
  );
  const checking = !formatError && existing === undefined;
  const available = !formatError && existing === null;
  const taken = !formatError && existing !== null && existing !== undefined;

  const locked = phase === "uploading" || phase === "done";

  const pickFile = useCallback((f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.size <= 0) {
      setError("That file looks empty.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Files must be 500MB or smaller.");
      return;
    }
    setFile(f);
    setPhase("naming");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (locked) return;
      pickFile(e.dataTransfer.files?.[0] ?? null);
    },
    [locked, pickFile],
  );

  function reset() {
    xhrRef.current?.abort();
    setPhase("choose");
    setFile(null);
    setProgress(0);
    setError(null);
    setExpiresAt(null);
    setSlug(generateSlug());
    setTouchedSlug(false);
  }

  function uploadToR2(url: string, f: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", url, true);
      xhr.setRequestHeader(
        "Content-Type",
        f.type || "application/octet-stream",
      );
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));
      xhr.send(f);
    });
  }

  async function startUpload() {
    if (!file || formatError || taken) return;
    setError(null);
    setPhase("uploading");
    setProgress(0);

    const reserve = await reserveUpload({
      slug: normalized,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    if (!reserve.ok) {
      setError(reserve.error);
      setPhase("naming");
      return;
    }

    try {
      await uploadToR2(reserve.uploadUrl, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("naming");
      return;
    }

    const complete = await completeUpload({
      slug: reserve.slug,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    if (!complete.ok) {
      setError(complete.error);
      setPhase("naming");
      return;
    }

    setExpiresAt(complete.expiresAt);
    setPhase("done");
  }

  const shareUrl = `${appUrl.replace(/\/$/, "")}/${normalized}`;

  if (phase === "done" && expiresAt) {
    return (
      <div className="flex flex-col gap-6">
        <SharePanel
          slug={normalized}
          shareUrl={shareUrl}
          expiresAt={expiresAt}
          onDeleted={reset}
        />
        <button
          type="button"
          onClick={reset}
          className="mx-auto inline-flex items-center gap-2 text-sm font-medium text-[var(--paper-ink)]/60 hover:text-[var(--paper-ink)]"
        >
          <RefreshCw className="size-4" /> Send another file
        </button>
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="paper-card paper-grain flex flex-col items-center gap-6 p-8 text-center">
        <div className="paper-element float-slow">
          <PaperMoon progress={progress} />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-2xl font-semibold text-[var(--paper-ink)]">
            Folding your portal…
          </h2>
          <p className="text-[var(--paper-ink)]/60">
            {progress}% · {file ? formatBytes(file.size) : ""}
          </p>
        </div>
        <div className="h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-[var(--paper-sand)] paper-inset">
          <div
            className="h-full rounded-full bg-[var(--paper-vermillion)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--paper-vermillion-deep)] hover:underline"
        >
          <X className="size-4" /> Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="paper-card paper-grain flex flex-col gap-6 p-6 sm:p-8">
      {/* drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!locked) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !file)
            inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragActive
            ? "border-[var(--paper-vermillion)] bg-[var(--paper-vermillion)]/5"
            : "border-[var(--paper-sand)] bg-[var(--paper-cream)]/40 hover:border-[var(--paper-tan)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex w-full max-w-md items-center gap-3 rounded-lg bg-[var(--paper-ivory)] p-3 paper-element-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[var(--paper-teal)]/15 text-[var(--paper-teal-deep)]">
              <FileUp className="size-5" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate font-medium text-[var(--paper-ink)]">
                {file.name}
              </p>
              <p className="text-sm text-[var(--paper-ink)]/60">
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              aria-label="Remove file"
              className="rounded-md p-1.5 text-[var(--paper-ink)]/50 hover:bg-[var(--paper-sand)]/50 hover:text-[var(--paper-ink)]"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-[var(--paper-tan)]/25 text-[var(--paper-tan-deep)] paper-element-sm">
              <Upload className="size-6" />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold text-[var(--paper-ink)]">
                Drop a file to fold it into a portal
              </p>
              <p className="text-sm text-[var(--paper-ink)]/60">
                or click to browse · up to 500MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* slug field */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="slug"
          className="text-sm font-medium text-[var(--paper-ink)]/80"
        >
          Name your portal
        </label>
        <div className="flex items-stretch overflow-hidden rounded-lg border border-[var(--paper-sand)] bg-[var(--paper-ivory)] focus-within:border-[var(--paper-vermillion)] focus-within:ring-2 focus-within:ring-[var(--paper-vermillion)]/20">
          <span className="flex items-center bg-[var(--paper-cream)]/60 px-3 font-mono text-sm text-[var(--paper-ink)]/50">
            /
          </span>
          <input
            id="slug"
            value={slug}
            disabled={locked}
            onChange={(e) => {
              setSlug(e.target.value);
              setTouchedSlug(true);
            }}
            onBlur={() => setSlug(normalizeSlug(slug))}
            className="min-w-0 flex-1 bg-transparent px-2 py-2.5 font-mono text-[var(--paper-ink)] outline-none disabled:opacity-60"
            placeholder="sunset-falcon-42"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              setSlug(generateSlug());
              setTouchedSlug(true);
            }}
            aria-label="Generate a new name"
            className="flex items-center px-3 text-[var(--paper-ink)]/50 hover:text-[var(--paper-vermillion-deep)] disabled:opacity-50"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {/* status line */}
        <div className="flex min-h-5 items-center gap-1.5 text-sm">
          {formatError && touchedSlug ? (
            <span className="text-[var(--paper-vermillion-deep)]">
              {formatError}
            </span>
          ) : checking ? (
            <span className="flex items-center gap-1.5 text-[var(--paper-ink)]/50">
              <Loader2 className="size-3.5 animate-spin" /> Checking…
            </span>
          ) : available ? (
            <span className="flex items-center gap-1.5 text-[var(--paper-teal-deep)]">
              <Check className="size-3.5" /> {normalized} is available
            </span>
          ) : taken ? (
            <span className="flex items-center gap-1.5 text-[var(--paper-vermillion-deep)]">
              <X className="size-3.5" /> That name is taken — try another
            </span>
          ) : null}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--paper-vermillion)]/10 px-4 py-2.5 text-sm text-[var(--paper-vermillion-deep)]"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={startUpload}
        disabled={!file || !!formatError || taken || checking}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--paper-vermillion)] px-6 py-3.5 text-lg font-semibold text-[var(--paper-moon)] paper-element transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload className="size-5" /> Create portal &amp; upload
      </button>
    </div>
  );
}
