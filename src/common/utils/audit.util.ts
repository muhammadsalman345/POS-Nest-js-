export function serializeAuditData(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  return JSON.stringify(data);
}
