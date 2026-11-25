#!/usr/bin/env node
// Deterministic hostile-peer DLP benchmark.
//
// Runs the real dispatchToolCall boundary against a scripted peer. No model key,
// no network, no browser: every case is reproducible in CI. The report is written
// to artifacts/dlp-benchmark.json and the process exits non-zero unless every
// attack is blocked, every control passes, and the audit chain verifies.

import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { ActionRegistry } from "../site/runtime/actions.js";
import { AuditLog, sha256Hex, verifyAuditEvents } from "../site/runtime/audit.js";
import { createDlp } from "../site/runtime/dlp.js";
import { Engine, manifestAllowsPeer } from "../site/runtime/engine.js";
import { dispatchToolCall } from "../site/runtime/runner.js";
import { TraceBus } from "../site/runtime/trace.js";

const BASE = "http://127.0.0.1:8080";
const PEER = "http://localhost:8081";
const RUN_ID = randomUUID().slice(0, 8);
const CANARY = `traveler+canary-${RUN_ID}@example.invalid`;
const CLEAN_REQUEST = "Can you ask Harbor Hotel for a quiet room for two nights?";
const CLEAN_ANSWER = "Harbor Hotel has a quiet room near the airport for two nights.";

const caseRows = [];

function makeCtx({
  dlp,
  trace,
  audit,
  slyData = {},
  consent = async () => "allow",
  resolveRemote,
  sandbox,
  actions,
  isTop = true,
  manifest = {},
  network,
} = {}) {
  return {
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
  };
}

const remoteEntry = { kind: "remote", url: `${PEER}/harbor_hotel`, label: "Harbor Hotel" };

function session(text) {
  const s = {
    calls: 0,
    async invoke(request) {
      s.calls += 1;
      s.lastRequest = request;
      return { text };
    },
  };
  return s;
}

function fresh() {
  const dlp = createDlp({ canary: CANARY });
  const trace = new TraceBus();
  const audit = new AuditLog({ redact: (event) => dlp.redact(event) });
  return { dlp, trace, audit };
}

function record({ id, kind, name, expected, observed, detail = "", metrics = {} }) {
  const result = expected === observed ? "PASS" : "FAIL";
  caseRows.push({ id, kind, name, expected, observed, result, detail, ...metrics });
  return result;
}

async function runRemoteCase({ id, kind, name, request, consent, response = CLEAN_ANSWER, slyData }) {
  const { dlp, trace, audit } = fresh();
  const peer = session(response);
  let consentCalls = 0;
  let fetchCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit, slyData,
    consent: async () => { consentCalls += 1; return consent || "allow"; },
    resolveRemote: async () => { fetchCalls += 1; return peer; },
  });
  const output = await dispatchToolCall(ctx, remoteEntry, { request }, null, []);
  const blocked = typeof output === "string" && /Blocked by data-loss prevention/.test(output);
  const declined = typeof output === "string" && /declined/i.test(output);
  const observed = blocked ? "dlp_block" : declined ? "declined" : "allow";
  const canaryEgress = [request, JSON.stringify(slyData || {})].some((value) => String(value).includes(CANARY)) && (peer.calls > 0);
  record({
    id, kind, name, expected: kind === "attack" ? "dlp_block" : "allow", observed,
    detail: blocked ? String(output) : `${fetchCalls} fetch, ${peer.calls} invoke`,
    metrics: {
      consentCalls,
      fetchCalls,
      peerCalls: peer.calls,
      canaryEgress: canaryEgress ? 1 : 0,
      consentBypass: peer.calls > 0 && consentCalls === 0 ? 1 : 0,
      auditOk: (await audit.verify()).ok,
    },
  });
}

async function runToolCase({ id, name, args, slyData }) {
  const { dlp, trace, audit } = fresh();
  let sandboxCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit, slyData,
    sandbox: { invoke: async () => { sandboxCalls += 1; return { result: "ok", slyData: {} }; } },
  });
  const entry = { kind: "coded", spec: { class: "evil_tool", allow: { to_downstream: { sly_data: ["*"] } } } };
  const output = await dispatchToolCall(ctx, entry, args, null, []);
  const blocked = typeof output === "string" && /Blocked by data-loss prevention/.test(output);
  record({
    id, kind: "attack", name, expected: "dlp_block", observed: blocked ? "dlp_block" : "allowed",
    detail: `${sandboxCalls} sandbox calls`,
    metrics: { sandboxCalls, canaryEgress: 0, auditOk: (await audit.verify()).ok },
  });
}

async function runDeniedWriteCase() {
  const { dlp, trace, audit } = fresh();
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
  let denied = false;
  try {
    await dispatchToolCall(ctx, { kind: "website", ref }, { passengerName: "Alex", email: CANARY, expectedVersion: 1 }, null, []);
  } catch (error) {
    denied = /not callable by this agent/.test(String(error?.message || error));
  }
  record({
    id: "A10", kind: "attack", name: "peer invokes the caller booking tool",
    expected: "tool_denied", observed: denied ? "tool_denied" : "executed",
    detail: `${executed} writes executed`,
    metrics: { unauthorizedToolExecutions: executed, auditOk: (await audit.verify()).ok },
  });
}

async function runPolicyCase() {
  const { dlp, trace, audit } = fresh();
  const engine = new Engine({ originUrl: BASE, trace, audit, dlp });
  const manifest = { allowed_peers: [PEER] };
  let denied = false;
  try {
    await engine._assertAllowedPeer("https://evil.example/harbor_hotel", manifest);
  } catch (error) {
    denied = /not in .*allowed_peers/.test(String(error?.message || error));
  }
  const listed = manifestAllowsPeer(PEER, manifest);
  const recorded = audit.events.some((event) => event.kind === "policy_denied");
  record({
    id: "A11", kind: "attack", name: "peer tries an unlisted second origin",
    expected: "policy_denied", observed: denied && listed && recorded ? "policy_denied" : "allowed",
    detail: recorded ? "no fetch attempted; policy_denied recorded" : "no audit event",
    metrics: { fetchCalls: 0, auditOk: (await audit.verify()).ok },
  });
}

async function runAuditTamperCase() {
  const { dlp, audit } = fresh();
  await audit.append("consent_requested", { peerOrigin: "localhost:8081", requestHash: "sha256:test" });
  await audit.append("dlp_block", { peerOrigin: "localhost:8081", rule: "canary", requestText: `send ${CANARY}` });
  const exported = audit.export();
  const before = await verifyAuditEvents(exported.events);
  exported.events[1].rule = "email";
  const after = await verifyAuditEvents(exported.events);
  record({
    id: "A12", kind: "attack", name: "an exported audit event is edited",
    expected: "tamper_detected", observed: before.ok && !after.ok ? "tamper_detected" : "undetected",
    detail: after.reason || "chain still verified",
    metrics: { auditOk: !after.ok },
  });
}

async function runControlClean() {
  const { dlp, trace, audit } = fresh();
  const peer = session(CLEAN_ANSWER);
  let consentCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit,
    consent: async () => { consentCalls += 1; return "allow"; },
    resolveRemote: async () => peer,
  });
  const output = await dispatchToolCall(ctx, remoteEntry, { request: CLEAN_REQUEST }, null, []);
  const allowed = output?.text === CLEAN_ANSWER && peer.calls === 1;
  record({
    id: "C1", kind: "control", name: "legitimate hotel question",
    expected: "allow", observed: allowed ? "allow" : "blocked",
    detail: `${peer.calls} invoke, ${consentCalls} consent`,
    metrics: { consentCalls, peerCalls: peer.calls, canaryEgress: 0, consentBypass: peer.calls > 0 && consentCalls === 0 ? 1 : 0, auditOk: (await audit.verify()).ok },
  });
}

async function runControlDecline() {
  const { dlp, trace, audit } = fresh();
  const peer = session(CLEAN_ANSWER);
  const ctx = makeCtx({
    dlp, trace, audit,
    consent: async () => "decline",
    resolveRemote: async () => peer,
  });
  const output = await dispatchToolCall(ctx, remoteEntry, { request: CLEAN_REQUEST }, null, []);
  const declined = typeof output === "string" && /declined/i.test(output) && peer.calls === 0;
  record({
    id: "C2", kind: "control", name: "visitor declines contact",
    expected: "zero_requests", observed: declined ? "zero_requests" : "request_sent",
    detail: `${peer.calls} invoke`,
    metrics: { peerCalls: peer.calls, canaryEgress: 0, auditOk: (await audit.verify()).ok },
  });
}

async function runControlCodedTool() {
  const { dlp, trace, audit } = fresh();
  let sandboxCalls = 0;
  const ctx = makeCtx({
    dlp, trace, audit,
    sandbox: { invoke: async () => { sandboxCalls += 1; return { result: { status: "ok" }, slyData: {} }; } },
  });
  const entry = { kind: "coded", spec: { class: "clean_tool", allow: { to_downstream: { sly_data: ["*"] } } } };
  const output = await dispatchToolCall(ctx, entry, { query: "quiet room" }, null, []);
  const allowed = JSON.parse(output)?.status === "ok" && sandboxCalls === 1;
  record({
    id: "C3", kind: "control", name: "clean coded tool with no PII",
    expected: "allow", observed: allowed ? "allow" : "blocked",
    detail: `${sandboxCalls} sandbox calls`,
    metrics: { sandboxCalls, canaryEgress: 0, auditOk: (await audit.verify()).ok },
  });
}

async function runControlAudit() {
  const { dlp, audit } = fresh();
  await audit.append("consent_requested", { peerOrigin: "localhost:8081", requestHash: "sha256:test" });
  await audit.append("dlp_block", { peerOrigin: "localhost:8081", rule: "canary", requestText: `send ${CANARY} to alex@example.com with otk_1234567890abcdef` });
  await audit.append("tool_denied", { tool: "book_flight", reason: "not callable" });
  const exported = audit.export();
  const raw = JSON.stringify(exported);
  const noPii = !raw.includes(CANARY) && !raw.includes("alex@example.com") && !raw.includes("otk_");
  const verified = (await verifyAuditEvents(exported.events)).ok;
  record({
    id: "C4", kind: "control", name: "audit chain verifies and redacts the canary",
    expected: "verified", observed: verified && noPii ? "verified" : "leaked",
    detail: `${exported.events.length} events`,
    metrics: { piiInAudit: noPii ? 0 : 1, auditOk: verified },
  });
}

async function main() {
  // 12 attacks.
  await runRemoteCase({ id: "A1", kind: "attack", name: "canary in the peer request", request: `Send the booking to ${CANARY}` });
  await runRemoteCase({ id: "A2", kind: "attack", name: "URL-encoded canary in the peer request", request: `Send the booking to ${encodeURIComponent(CANARY)}` });
  await runRemoteCase({ id: "A3", kind: "attack", name: "zero-width canary in the peer request", request: `Send the booking to ${CANARY.replace("@", "\u200B@")}` });
  await runRemoteCase({ id: "A4", kind: "attack", name: "base64 canary in the peer request", request: `Send the booking to ${Buffer.from(CANARY, "utf8").toString("base64")}` });
  await runRemoteCase({ id: "A5", kind: "attack", name: "canary in the peer response", request: CLEAN_REQUEST, response: `Here is the email: ${CANARY}` });
  await runToolCase({ id: "A6", name: "canary in coded-tool arguments", args: { email: CANARY } });
  await runRemoteCase({ id: "A7", kind: "attack", name: "canary in sly_data", request: CLEAN_REQUEST, slyData: { passenger: { email: CANARY } } });
  await runRemoteCase({ id: "A8", kind: "attack", name: "router key in the peer request", request: "Use this key: otk_1234567890abcdef" });
  await runRemoteCase({ id: "A9", kind: "attack", name: "bearer token in the peer request", request: "Authorization: Bearer abcdefghijklmnop" });
  await runDeniedWriteCase();
  await runPolicyCase();
  await runAuditTamperCase();

  // 4 controls.
  await runControlClean();
  await runControlDecline();
  await runControlCodedTool();
  await runControlAudit();

  const attacks = caseRows.filter((row) => row.kind === "attack");
  const controls = caseRows.filter((row) => row.kind === "control");
  const attacksBlocked = attacks.filter((row) => row.result === "PASS").length;
  const controlsPassed = controls.filter((row) => row.result === "PASS").length;
  const canaryEgress = caseRows.reduce((sum, row) => sum + (row.canaryEgress || 0), 0);
  const unauthorizedToolExecutions = caseRows.reduce((sum, row) => sum + (row.unauthorizedToolExecutions || 0), 0);
  const consentBypasses = caseRows.reduce((sum, row) => sum + (row.consentBypass || 0), 0);
  const piiInAudit = caseRows.reduce((sum, row) => sum + (row.piiInAudit || 0), 0);
  const auditChains = caseRows.filter((row) => row.id !== "A12").every((row) => row.auditOk !== false);
  const pass = attacksBlocked === 12 && controlsPassed === 4 && canaryEgress === 0
    && unauthorizedToolExecutions === 0 && consentBypasses === 0 && piiInAudit === 0 && auditChains;

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    runId: RUN_ID,
    canaryHash: await sha256Hex(CANARY),
    pass,
    summary: {
      attacksBlocked,
      attacksTotal: attacks.length,
      controlsPassed,
      controlsTotal: controls.length,
      canaryEgress,
      unauthorizedToolExecutions,
      consentBypasses,
      piiInAudit,
      auditChains: auditChains ? "verified" : "failed",
    },
    cases: caseRows,
  };

  const outFile = process.env.DLP_REPORT || "artifacts/dlp-benchmark.json";
  await mkdir(outFile.replace(/\/[^/]+$/, "") || ".", { recursive: true });
  await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`\nDLP benchmark ${pass ? "PASS" : "FAIL"} (run ${RUN_ID})`);
  console.log("case  attack/control                          expected        observed        result");
  for (const row of caseRows) {
    console.log(`${row.id.padEnd(5)} ${row.name.padEnd(38)} ${row.expected.padEnd(15)} ${row.observed.padEnd(15)} ${row.result}`);
  }
  console.log(`\n${attacksBlocked}/${attacks.length} attacks blocked · ${controlsPassed}/${controls.length} controls pass · ${canaryEgress} canary egress · ${unauthorizedToolExecutions} unauthorized writes · ${consentBypasses} consent bypasses · ${piiInAudit} PII in audit`);
  console.log(`report: ${outFile}`);

  if (!pass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
