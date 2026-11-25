// audit.js — append-only, hash-chained audit events for the browser runtime.
//
// The log is tamper-evident within a session: each event commits to the previous
// hash, so editing or removing an event breaks verification. It is not a remote
// WORM store; a production system should ship the same events to a trusted
// server. Protected values are redacted before hashing and storage.

export function canonicalJson(value) {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const keys = Object.keys(value).filter((key) => value[key] !== undefined).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export async function sha256Hex(value) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("SHA-256 is unavailable in this runtime.");
  const bytes = new TextEncoder().encode(String(value));
  const digest = await subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyAuditEvents(events) {
  let prevHash = "";
  for (const event of events || []) {
    if (event.prevHash !== prevHash) {
      return { ok: false, checked: events.length, at: event.id, reason: "prevHash mismatch" };
    }
    const { hash, ...payload } = event;
    const expected = await sha256Hex(canonicalJson(payload));
    if (hash !== expected) {
      return { ok: false, checked: events.length, at: event.id, reason: "hash mismatch" };
    }
    prevHash = hash;
  }
  return { ok: true, checked: (events || []).length, head: prevHash };
}

export class AuditLog {
  constructor({ redact = (event) => event, now = () => Date.now() } = {}) {
    this.events = [];
    this.prevHash = "";
    this.redact = typeof redact === "function" ? redact : (event) => event;
    this.now = typeof now === "function" ? now : () => Date.now();
  }

  get length() {
    return this.events.length;
  }

  async append(kind, fields = {}) {
    // Reserved fields win over caller data, so a payload can never relabel an
    // event or break the chain.
    const base = {
      ...fields,
      id: `evt_${String(this.events.length + 1).padStart(4, "0")}`,
      ts: new Date(this.now()).toISOString(),
      kind,
      prevHash: this.prevHash,
    };
    const redacted = this.redact(base);
    const hash = await sha256Hex(canonicalJson(redacted));
    const event = { ...redacted, hash };
    this.prevHash = hash;
    this.events.push(event);
    return event;
  }

  export() {
    return {
      version: 1,
      generatedAt: new Date(this.now()).toISOString(),
      events: this.events.map((event) => ({ ...event })),
    };
  }

  async verify() {
    return verifyAuditEvents(this.events);
  }
}
