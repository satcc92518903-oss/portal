import { SkyScene, CloudDivider } from "@/components/paper-art";
import { UploadFlow } from "@/components/upload-flow";

export const metadata = {
  title: "Portal — Send files like folded paper",
  description:
    "Drop a file, name your portal, share a link. No account needed. It closes itself after 24 hours.",
};

export default function Home() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* layered papercut night-sky backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[68vh] min-h-[420px]">
        <SkyScene className="h-full w-full" />
      </div>

      <section className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 pt-16 pb-8 text-center sm:pt-24">
        <span className="rounded-full bg-[var(--paper-moon)]/15 px-4 py-1.5 text-sm font-medium text-[var(--paper-moon)] backdrop-blur-sm">
          Account-free · 500MB · gone in 24 hours
        </span>
        <h1 className="mt-6 font-serif text-4xl font-semibold text-balance text-[var(--paper-moon)] sm:text-6xl">
          Send files like folded paper
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-pretty text-[var(--paper-moon)]/80">
          Drop a file, name your portal, and share a single link. The portal
          folds itself shut after a day — no trace left behind.
        </p>
      </section>

      <div className="relative z-10 -mb-px">
        <CloudDivider className="h-16 w-full sm:h-24" />
      </div>

      <section className="relative z-10 bg-background pb-24">
        <div className="mx-auto -mt-2 max-w-xl px-4">
          <UploadFlow appUrl={appUrl} />
        </div>

        <ol className="mx-auto mt-12 grid max-w-3xl gap-4 px-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="paper-card paper-grain flex flex-col items-center gap-2 p-5 text-center"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--paper-vermillion)] font-serif text-sm font-bold text-[var(--paper-moon)]">
                {i + 1}
              </span>
              <h3 className="font-serif text-lg font-semibold text-[var(--paper-ink)]">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--paper-ink)]/65">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

const STEPS = [
  {
    title: "Drop & name",
    body: "Pick any file up to 500MB and give your portal a readable name.",
  },
  {
    title: "Share the link",
    body: "Copy it, email it, or send it over WhatsApp in a tap.",
  },
  {
    title: "It closes itself",
    body: "After 24 hours the file and every trace of it are gone.",
  },
];
