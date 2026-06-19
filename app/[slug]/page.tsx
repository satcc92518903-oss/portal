import { SkyScene, CloudDivider } from "@/components/paper-art";
import { RecipientView } from "@/components/recipient-view";
import { ClosedPortal, StateMessage } from "@/components/state-message";
import { getConvexClient } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { isOwner } from "@/app/actions";
import { normalizeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] min-h-[280px]">
        <SkyScene className="h-full w-full" />
      </div>
      <div className="relative z-10 -mb-px pt-[34vh] sm:pt-[30vh]">
        <CloudDivider className="h-14 w-full sm:h-20" />
      </div>
      <section className="relative z-10 bg-background pb-24">
        <div className="mx-auto -mt-2 max-w-xl px-4">{children}</div>
      </section>
    </main>
  );
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw);

  const convex = getConvexClient();
  const row = await convex.query(api.files.getBySlug, { slug });
  const owner = await isOwner(slug);

  if (!row) {
    return (
      <Shell>
        <StateMessage
          art={<ClosedPortal tone="tan" />}
          title="This portal doesn't exist"
          body="We couldn't find anything behind this paper door. Double-check the link, or open your own portal."
        />
      </Shell>
    );
  }

  if (row.status === "pending") {
    return (
      <Shell>
        <StateMessage
          art={<ClosedPortal tone="teal" />}
          title="This file isn't ready yet"
          body="The sender reserved this portal but hasn't finished uploading. Give it a moment and refresh."
        />
      </Shell>
    );
  }

  const expiresAt = row.expiresAt ?? 0;
  if (!expiresAt || expiresAt <= Date.now()) {
    return (
      <Shell>
        <StateMessage
          art={<ClosedPortal />}
          title="This portal has closed"
          body="Its 24 hours are up, so the file is gone for good. Ask the sender to open a new one."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <RecipientView
        slug={slug}
        fileName={row.fileName ?? "file"}
        fileSize={row.fileSize ?? 0}
        fileType={row.fileType ?? "application/octet-stream"}
        expiresAt={expiresAt}
        isOwner={owner}
      />
    </Shell>
  );
}
