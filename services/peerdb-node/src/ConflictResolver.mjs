export function compareRecords(current, incoming) {
  if (!current) return 1;
  if ((incoming.version || 0) !== (current.version || 0)) return (incoming.version || 0) > (current.version || 0) ? 1 : -1;
  if ((incoming.updatedAt || "") !== (current.updatedAt || "")) return (incoming.updatedAt || "") > (current.updatedAt || "") ? 1 : -1;
  return (incoming.recordId || "") > (current.recordId || "") ? 1 : -1;
}
