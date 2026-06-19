import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sweep every hour: remove files past their 24h life and stale reservations.
crons.interval(
  "purge expired portals",
  { hours: 1 },
  internal.cleanup.purgeExpired,
  {},
);

export default crons;
