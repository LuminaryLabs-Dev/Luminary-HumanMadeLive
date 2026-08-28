import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

export class RecordLog {
  constructor(filePath) { this.filePath = filePath; }
  async load() {
    try { return (await readFile(this.filePath, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line)); }
    catch { return []; }
  }
  async append(entry) { await mkdir(dirname(this.filePath), { recursive: true }); await appendFile(this.filePath, `${JSON.stringify(entry)}\n`, "utf8"); }
}
