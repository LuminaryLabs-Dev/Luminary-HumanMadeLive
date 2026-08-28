import { RecordLog } from "./RecordLog.mjs";
import { compareRecords } from "./ConflictResolver.mjs";

export class PeerDatabase {
  constructor(filePath) { this.log = new RecordLog(filePath); this.records = new Map(); this.tombstones = new Map(); }
  async open() {
    for (const entry of await this.log.load()) {
      if (entry.deleted) {
        this.records.delete(entry.recordId);
        this.tombstones.set(entry.recordId, { recordId: entry.recordId, version: entry.version || 0, updatedAt: entry.updatedAt || "" });
      } else if (compareRecords(this.records.get(entry.recordId), entry.record) > 0 && compareRecords(this.tombstones.get(entry.recordId), entry.record) > 0) {
        this.records.set(entry.recordId, entry.record);
      }
    }
  }
  async upsert(record) {
    const current = this.records.get(record.recordId) || this.tombstones.get(record.recordId);
    if (compareRecords(current, record) <= 0) return false;
    this.tombstones.delete(record.recordId);
    this.records.set(record.recordId, record);
    await this.log.append({ recordId: record.recordId, record });
    return true;
  }
  async remove(recordId, version) {
    const tombstone = { recordId, version: version || 0, updatedAt: new Date().toISOString() };
    this.records.delete(recordId);
    this.tombstones.set(recordId, tombstone);
    await this.log.append({ ...tombstone, deleted: true });
  }
  list(worldId) { return [...this.records.values()].filter((record) => !worldId || record.worldId === worldId); }
}
