// dlp.js — deterministic data-loss-prevention checks for the consent boundary.
//
// This is a policy and evidence layer, not a server-side security boundary. It
// scans values that are about to cross an origin or trust boundary: the request
// sent to a peer, sly_data, coded-tool arguments, and the peer's response. A
// block returns a refusal; the caller must not fetch, invoke, or render.
//
// The rules are deliberately small and testable: a per-run canary, email
// addresses, router/API tokens, bearer tokens, and private-key blocks. The
// scanner normalizes Unicode, zero-width characters, URL encoding, and one level
// of base64 so a trivially encoded value is still caught.

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const SECRET_RULES = [
  { rule: "otari-key", re: /\botk_[A-Za-z0-9_-]{8,}\b/ },
  { rule: "openai-key", re: /\bsk-[A-Za-z0-9_-]{8,}\b/ },
  { rule: "bearer-token", re: /\bBearer\s+[A-Za-z0-9._~+/-]{8,}=*/i },
  { rule: "private-key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
const BASE64 = /[A-Za-z0-9+/]{12,}={0,2}/g;

function normalizeText(value) {
  let text = String(value ?? "");
  text = text.normalize("NFKC").replace(ZERO_WIDTH, "");
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(text);
      if (decoded === text) break;
      text = decoded;
    } catch {
      break;
    }
  }
  return text;
}

function decodeBase64Candidates(text) {
  const out = [];
  const atobFn = globalThis.atob;
  if (typeof atobFn !== "function") return out;
  for (const match of text.matchAll(BASE64)) {
    try {
      const decoded = atobFn(match[0]);
      if (/[\x20-\x7e]/.test(decoded)) out.push(decoded);
    } catch {
      // Not base64; ignore.
    }
  }
  return out;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createDlp({ canary = "", blockEmail = true } = {}) {
  const canaryText = String(canary || "");
  const canaryLower = normalizeText(canaryText).toLowerCase();
  const canaryPattern = canaryText ? new RegExp(escapeRegExp(canaryText), "gi") : null;

  const scanText = (value, { boundary = "unknown" } = {}) => {
    const original = String(value ?? "");
    const candidates = [original, ...decodeBase64Candidates(original)];
    for (const candidate of candidates) {
      const normalized = normalizeText(candidate);
      const lower = normalized.toLowerCase();
      if (canaryLower && lower.includes(canaryLower)) {
        return { action: "block", rule: "canary", boundary, match: "[redacted-canary]" };
      }
      if (blockEmail && EMAIL.test(normalized)) {
        return { action: "block", rule: "email", boundary, match: "[redacted-email]" };
      }
      for (const { rule, re } of SECRET_RULES) {
        if (re.test(normalized)) return { action: "block", rule, boundary, match: "[redacted-secret]" };
      }
    }
    return { action: "allow", rule: null, boundary };
  };

  const scan = (value, options = {}) => {
    const walk = (node, path) => {
      if (typeof node === "string") {
        const verdict = scanText(node, options);
        return verdict.action === "block" ? { ...verdict, path: path || "$" } : null;
      }
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i += 1) {
          const found = walk(node[i], `${path}[${i}]`);
          if (found) return found;
        }
        return null;
      }
      if (node && typeof node === "object") {
        for (const [key, child] of Object.entries(node)) {
          const found = walk(child, path ? `${path}.${key}` : key);
          if (found) return found;
        }
      }
      return null;
    };
    return walk(value, "") || { action: "allow", rule: null, boundary: options.boundary || "unknown" };
  };

  const redactText = (value) => {
    let text = String(value ?? "");
    if (canaryPattern) text = text.replace(canaryPattern, "[redacted-canary]");
    text = text.replace(EMAIL, "[redacted-email]");
    for (const { re } of SECRET_RULES) text = text.replace(re, "[redacted-secret]");
    return text;
  };

  const redact = (value) => {
    if (typeof value === "string") return redactText(value);
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === "object") {
      const out = {};
      for (const [key, child] of Object.entries(value)) out[key] = redact(child);
      return out;
    }
    return value;
  };

  return {
    canary: canaryText,
    scan,
    scanText,
    redact,
    redactText,
  };
}
