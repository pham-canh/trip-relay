// Audit-chain restore, tamper refusal, and clear. The browser stores the same
// redacted events in IndexedDB; these tests cover the log's own contract.
import assert from "node:assert/strict";
import test from "node:test";
import { AuditLog, verifyAuditEvents } from "../site/runtime/audit.js";

const redact = (event) => {
  const copy = { ...event };
  if (typeof copy.requestText === "string") copy.requestText = copy.requestText.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[redacted-email]");
  return copy;
};

test("a stored chain restores, keeps verifying and continues from its head", async () => {
  const first = new AuditLog({ redact, now: () => 1_700_000_000_000 });
  await first.append("consent_requested", { peerOrigin: "hotel.test", requestText: "alex@example.com" });
  await first.append("consent_allowed", { peerOrigin: "hotel.test" });
  const stored = first.export().events;

  const restored = new AuditLog({ redact, now: () => 1_700_000_001_000 });
  const result = await restored.restore(stored);
  assert.equal(result.ok, true);
  assert.equal(restored.length, 2);
  assert.equal(restored.prevHash, stored[1].hash);
  assert.equal(JSON.stringify(restored.events).includes("alex@example.com"), false);

  await restored.append("peer_fetch", { peerOrigin: "hotel.test", network: "harbor_hotel" });
  assert.equal(restored.length, 3);
  assert.equal((await restored.verify()).ok, true);
  assert.equal(restored.events[2].prevHash, stored[1].hash);
});

test("a tampered stored chain is refused and leaves the live log empty", async () => {
  const source = new AuditLog({ now: () => 1_700_000_000_000 });
  await source.append("consent_requested", { peerOrigin: "hotel.test" });
  await source.append("consent_allowed", { peerOrigin: "hotel.test" });
  const stored = source.export().events;
  stored[0].peerOrigin = "evil.test";

  const restored = new AuditLog();
  const result = await restored.restore(stored);
  assert.equal(result.ok, false);
  assert.equal(restored.length, 0);
  assert.equal(restored.prevHash, "");
  assert.equal((await verifyAuditEvents(stored)).ok, false);
});

test("clear resets the chain so a new receipt starts at the first event", async () => {
  const log = new AuditLog({ now: () => 1_700_000_000_000 });
  await log.append("consent_requested", { peerOrigin: "hotel.test" });
  log.clear();
  assert.equal(log.length, 0);
  assert.equal(log.prevHash, "");
  const event = await log.append("dlp_block", { boundary: "peer_egress", rule: "email" });
  assert.equal(event.id, "evt_0001");
  assert.equal(event.prevHash, "");
  assert.equal((await log.verify()).ok, true);
});
