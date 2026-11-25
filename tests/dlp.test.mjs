// Hostile-peer DLP benchmark. Runs the real runner against a scripted peer and
// checks the boundary, consent ordering, tool denial, and the audit chain.
// Run from the repository root: node --test tests/dlp.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { ActionRegistry } from "../site/runtime/actions.js";
import { AuditLog, sha256Hex, verifyAuditEvents } from "../site/runtime/audit.js";
import { createDlp } from "../site/runtime/dlp.js";
import { Engine, manifestAllowsPeer } from "../site/runtime/engine.js";
import { dispatchToolCall } from "../site/runtime/runner.js";
import { TraceBus } from "../site/runtime/trace.js";

const BASE = "http://127.0.0.1:8080";
const PEER = "http://localhost:8081";
const CANARY = "traveler+canary-7f3a@example.invalid";

const makeCtx = ({ dlp, trace, audit, slyData = {}, consent = async () => "allow", resolveRemote, sandbox, actions, isTop = true, manifest = {}, network } = {}) => ({
  network: network || {
    name: "skyline_air",
    findFrontMan: () => "front",
    getAgentSpec: () => ({ allow: { to_downstream: { sly_data: ["*"] } } }),
  },
  manifest,
  actions: actions || { entries: new Map() },
  baseOrigin: BASE,
  displayOrigin: "127.0.0.1:8080",
  trace,
  audit,
  dlp,
  slyData,
  composition: null,
  isTop,
  frontMan: "front",
  sandbox,
  requestConsent: consent,
  resolveRemote,
  confirmWebsiteActions: async () => true,
});

const remoteEntry = { kind: "remote", url: `${PEER}/harbor_hotel`, label: "Harbor Hotel" };

const session = (text) => ({
  invoke: async (request) => {
    session.lastRequest = request;
    return { text };
  },
});

test("DLP catches the canary through plain, encoded, zero-width and base64 forms", () => {
  const dlp = createDlp({ canary: CANARY });
  const encoded = encodeURIComponent(CANARY);
  const zeroWidth = CANARY.replace("@", "\u200B@");
  const base64 = Buffer.from(CANARY, "utf8").toString("base64");
  for (const value of [CANARY, encoded, zeroWidth, base64]) {
    const verdict = dlp.scanText(value, { boundary: "peer_egress" });
    assert.equal(verdict.action, "block", `expected a block for ${value}`);
    assert.equal(verdict.rule, "canary");
  }
  assert.equal(dlp.scanText("Can you ask Harbor Hotel for a quiet room for two nights?", { boundary: "peer_egress" }).action, "allow");
});

test("DLP catches email and secret patterns but allows a clean travel request", () => {
  const dlp = createDlp();
  assert.equal(dlp.scanText("alex@example.com").rule, "email");
  assert.equal(dlp.scanText("otk_1234567890abcdef").rule, "otari-key");
  assert.equal(dlp.scanText("sk-1234567890abcdef").rule, "openai-key");
  assert.equal(dlp.scanText("Bearer abcdefghijklmnop").rule, "bearer-token");
  assert.equal(dlp.scanText("-----BEGIN PRIVATE KEY-----").rule, "private-key");
  assert.equal(dlp.scanText("Harbor Hotel has a quiet room near the airport.").action, "allow");
});

test("a peer egress request with the canary is blocked before consent and fetch", async () => {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  let consentCalls = 0;
  let resolveCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit,
    consent: async () => { consentCalls += 1; return "allow"; },
    resolveRemote: async () => { resolveCalls += 1; return session("ok"); },
  });
  const result = await dispatchToolCall(ctx, remoteEntry, { request: `Send the booking to ${CANARY}` }, null, []);
  assert.match(result, /Blocked by data-loss prevention/);
  assert.equal(consentCalls, 0);
  assert.equal(resolveCalls, 0);
  const block = trace.events.find((event) => event.kind === "dlp_block");
  assert.ok(block);
  assert.equal(block.boundary, "peer_egress");
  const exported = JSON.stringify(audit.export());
  assert.ok(!exported.includes(CANARY));
  assert.equal((await audit.verify()).ok, true);
});

test("sly_data with the canary is blocked after consent but before invoke", async () => {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  let consentCalls = 0;
  let resolveCalls = 0;
  let invokeCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit,
    slyData: { passenger: { email: CANARY } },
    consent: async () => { consentCalls += 1; return "allow"; },
    resolveRemote: async () => {
      resolveCalls += 1;
      return { invoke: async () => { invokeCalls += 1; return { text: "ok" }; } };
    },
  });
  const result = await dispatchToolCall(ctx, remoteEntry, { request: "Can you ask Harbor Hotel for a quiet room for two nights?" }, null, []);
  assert.match(result, /Blocked by data-loss prevention/);
  assert.equal(consentCalls, 1);
  assert.equal(resolveCalls, 1);
  assert.equal(invokeCalls, 0);
  assert.ok(trace.events.some((event) => event.kind === "dlp_block" && event.boundary === "peer_sly_data"));
  assert.equal((await audit.verify()).ok, true);
});

test("a peer response that contains the canary is not rendered", async () => {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  const ctx = makeCtx({
    dlp, trace, audit,
    resolveRemote: async () => session(`Here is the email: ${CANARY}`),
  });
  const result = await dispatchToolCall(ctx, remoteEntry, { request: "Can you ask Harbor Hotel for a quiet room for two nights?" }, null, []);
  assert.match(result, /Blocked by data-loss prevention/);
  assert.ok(trace.events.some((event) => event.kind === "dlp_block" && event.boundary === "peer_response"));
});

test("a coded tool cannot receive the canary in its arguments", async () => {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  let sandboxCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit,
    sandbox: { invoke: async () => { sandboxCalls += 1; return { result: "ok", slyData: {} }; } },
  });
  const entry = { kind: "coded", spec: { class: "evil_tool", allow: { to_downstream: { sly_data: ["*"] } } } };
  const result = await dispatchToolCall(ctx, entry, { email: CANARY }, null, []);
  assert.match(result, /Blocked by data-loss prevention/);
  assert.equal(sandboxCalls, 0);
  assert.ok(trace.events.some((event) => event.kind === "dlp_block" && event.boundary === "coded_tool"));
});

test("declining consent makes zero peer calls and writes a declined event", async () => {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  let resolveCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit,
    consent: async () => "decline",
    resolveRemote: async () => { resolveCalls += 1; return session("ok"); },
  });
  const result = await dispatchToolCall(ctx, remoteEntry, { request: "Can you ask Harbor Hotel for a quiet room for two nights?" }, null, []);
  assert.match(result, /declined/i);
  assert.equal(resolveCalls, 0);
  assert.ok(trace.events.some((event) => event.kind === "consent" && event.decision === "declined"));
  assert.equal((await audit.verify()).ok, true);
});

test("a non-top caller cannot execute the airline write tool", async () => {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  const actions = new ActionRegistry();
  let executed = 0;
  const ref = actions.register({ base: BASE, network: "skyline_air" }, {
    name: "book_flight",
    description: "Book the selected flight.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["passengerName", "email", "expectedVersion"],
      properties: {
        passengerName: { type: "string" },
        email: { type: "string", format: "email" },
        expectedVersion: { type: "integer" },
      },
    },
    effect: "irreversible",
    availability: "local-only",
    execute: async () => { executed += 1; return { ok: true }; },
  });
  const ctx = makeCtx({
    dlp, trace, audit, actions, isTop: false,
    manifest: { actions: { agentTools: ["book_flight"] } },
    network: { name: "skyline_air", findFrontMan: () => "front", getAgentSpec: () => ({}) },
  });
  await assert.rejects(
    dispatchToolCall(ctx, { kind: "website", ref }, { passengerName: "Alex", email: CANARY, expectedVersion: 1 }, null, []),
    /not callable by this agent/,
  );
  assert.equal(executed, 0);
  assert.ok(trace.events.some((event) => event.kind === "tool_denied"));
  assert.equal((await audit.verify()).ok, true);
});

test("a legitimate hotel request still reaches the peer", async () => {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  let resolveCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit,
    resolveRemote: async () => { resolveCalls += 1; return session("Harbor Hotel has a quiet room near the airport."); },
  });
  const result = await dispatchToolCall(ctx, remoteEntry, { request: "Can you ask Harbor Hotel for a quiet room for two nights?" }, null, []);
  assert.match(result.text, /quiet room/);
  assert.equal(resolveCalls, 1);
  assert.equal((await audit.verify()).ok, true);
});

test("the audit chain verifies, redacts the canary and detects tampering", async () => {
  const dlp = createDlp({ canary: CANARY });
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  await audit.append("consent_requested", { peerOrigin: "localhost:8081", requestHash: "sha256:test" });
  await audit.append("dlp_block", { peerOrigin: "localhost:8081", rule: "canary", requestText: `send ${CANARY}` });
  await audit.append("tool_denied", { tool: "book_flight", reason: "not callable" });
  const exported = audit.export();
  assert.equal(exported.events.length, 3);
  assert.ok(!JSON.stringify(exported).includes(CANARY));
  assert.equal((await audit.verify()).ok, true);
  exported.events[1].rule = "email";
  assert.equal((await verifyAuditEvents(exported.events)).ok, false);
  assert.equal((await audit.verify()).ok, true);
});

test("an unlisted peer origin is refused by the caller's published policy", () => {
  const manifest = { allowed_peers: ["http://localhost:8081"] };
  assert.equal(manifestAllowsPeer("http://localhost:8081", manifest), true);
  assert.equal(manifestAllowsPeer("https://evil.example", manifest), false);
  assert.equal(manifestAllowsPeer("http://localhost:8082", manifest), false);
  const open = { peer_policy: { mode: "open", deny_origins: ["https://evil.example"] } };
  assert.equal(manifestAllowsPeer("https://hotel.example", open), true);
  assert.equal(manifestAllowsPeer("https://evil.example", open), false);
});

test("always allow is bound to one exact request, origin and phase", async () => {
  const dlp = createDlp({ canary: CANARY });
  const audit = new AuditLog({ redact: (event) => dlp.redact(event), now: () => 1_700_000_000_000 });
  const engine = new Engine({ originUrl: BASE, dlp, audit });
  let prompts = 0;
  engine.onConsent = async () => { prompts += 1; return "always"; };
  const info = { peerOrigin: "localhost:8081", kind: "remote", phase: "invoke", requestText: "one quiet room" };
  assert.equal(await engine.requestConsent(info), "allow");
  assert.equal(prompts, 1);
  assert.equal(await engine.requestConsent(info), "allow");
  assert.equal(prompts, 1, "the same request reuses the approval");
  assert.equal(await engine.requestConsent({ ...info, requestText: "two quiet rooms" }), "allow");
  assert.equal(prompts, 2, "a different request asks again");
  assert.equal(await engine.requestConsent({ ...info, peerOrigin: "localhost:8082" }), "allow");
  assert.equal(prompts, 3, "a different origin asks again");
  assert.equal(await engine.requestConsent({ ...info, phase: "discover" }), "allow");
  assert.equal(prompts, 4, "a different phase asks again");
  const key = engine.consentKey(info, await sha256Hex(info.requestText));
  engine.consent.set(key, Date.now() - 1);
  assert.equal(await engine.requestConsent(info), "allow");
  assert.equal(prompts, 5, "an expired approval asks again");
  assert.ok(audit.events.some((event) => event.kind === "consent_reused"));
  assert.equal((await audit.verify()).ok, true);
});

test("benchmark matrix: hostile payloads block and clean travel text allows", () => {
  const dlp = createDlp({ canary: CANARY });
  const cases = [
    ["canary", CANARY, "block"],
    ["url-encoded canary", encodeURIComponent(CANARY), "block"],
    ["zero-width canary", CANARY.replace("@", "\u200B@"), "block"],
    ["base64 canary", Buffer.from(CANARY, "utf8").toString("base64"), "block"],
    ["email", "alex@example.com", "block"],
    ["otari key", "otk_1234567890abcdef", "block"],
    ["openai key", "sk-1234567890abcdef", "block"],
    ["bearer token", "Bearer abcdefghijklmnop", "block"],
    ["private key", "-----BEGIN PRIVATE KEY-----", "block"],
    ["clean hotel request", "Can you ask Harbor Hotel for a quiet room for two nights?", "allow"],
    ["clean flight request", "Find a flight from Ho Chi Minh City to Da Nang tomorrow.", "allow"],
    ["clean room request", "I would like a harbor double for two nights.", "allow"],
  ];
  const rows = cases.map(([name, value, expected]) => {
    const verdict = dlp.scanText(value, { boundary: "peer_egress" });
    assert.equal(verdict.action, expected, name);
    return { name, expected, observed: verdict.action, rule: verdict.rule };
  });
  console.log("\ncase                          expected  observed  rule");
  for (const row of rows) {
    console.log(`${row.name.padEnd(28)}  ${row.expected.padEnd(8)}  ${row.observed.padEnd(8)}  ${row.rule || "-"}`);
  }
});
