/** Human-readable file size. Pure function — safe on client & server. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Short label for a mime type (e.g. "image/png" -> "PNG"). */
export function fileKindLabel(fileType?: string, fileName?: string): string {
  if (fileType) {
    const sub = fileType.split("/").pop() ?? "";
    if (sub && sub.length <= 5) return sub.toUpperCase();
    const main = fileType.split("/")[0];
    if (main) return main.toUpperCase();
  }
  const ext = fileName?.split(".").pop();
  if (ext && ext.length <= 5) return ext.toUpperCase();
  return "FILE";
}
