// remote.js — the RemoteNetworkLoader intrinsic: fetch a peer origin's published
// agent network (manifest + HOCON + coded-tool bundle) and make it runnable
// locally. This is the "fetch-and-run-locally" cross-origin composition model:
// there is no agent server — the caller's browser runs the peer's published files.

const FETCH_TIMEOUT_MS = 8000;

function hostOf(url) {
  try { return new URL(url).host; } catch { return String(url || "the peer"); }
}

async function request(url, options = {}) {
  const timeout = typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(FETCH_TIMEOUT_MS) : undefined;
  try {
    return await fetch(url, { ...options, signal: options.signal || timeout });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    const reason = timedOut ? `timed out after ${FETCH_TIMEOUT_MS / 1000}s` : "network or CORS error";
    throw new Error(`Could not reach ${hostOf(url)} (${reason}). The peer may be offline, or its CORS policy may block this origin.`);
  }
}

export async function fetchManifest(originUrl) {
  const base = originUrl.replace(/\/$/, "");
  const url = `${base}/agent-manifest.json`;
  const resp = await request(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`The peer at ${hostOf(url)} returned HTTP ${resp.status} for agent-manifest.json.`);
  let manifest;
  try {
    manifest = await resp.json();
  } catch {
    throw new Error(`The peer at ${hostOf(url)} did not return valid JSON for agent-manifest.json.`);
  }
  if (!manifest || !Array.isArray(manifest.networks)) {
    throw new Error(`The peer at ${hostOf(url)} published an agent-manifest.json without a networks list.`);
  }
  return { manifest, base, url };
}

export async function fetchText(url) {
  const resp = await request(url);
  if (!resp.ok) throw new Error(`The peer at ${hostOf(url)} returned HTTP ${resp.status} for ${new URL(url).pathname}.`);
  return resp.text();
}

// Resolve a relative path against an origin base.
export function resolveUrl(base, path) {
  if (/^https?:\/\//i.test(path)) return path;
  return base.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
}

// Caches compiled peer sessions and enforces cycle + depth limits across hops.
export class RemoteRegistry {
  constructor({ maxDepth = 5, trace } = {}) {
    this.maxDepth = maxDepth;
    this.trace = trace;
    this.cache = new Map(); // key: `${origin}::${agentName}` -> Session
  }

  cacheKey(origin, agentName) {
    return `${origin}::${agentName}`;
  }

  get(origin, agentName) {
    return this.cache.get(this.cacheKey(origin, agentName));
  }

  set(origin, agentName, session) {
    this.cache.set(this.cacheKey(origin, agentName), session);
  }

  checkCycle(chain, origin, agentName) {
    const key = this.cacheKey(origin, agentName);
    if (chain.includes(key)) {
      const error = new Error(`composition cycle detected: ${[...chain, key].join(" -> ")}`);
      error.code = "COMPOSITION_CYCLE";
      throw error;
    }
    if (chain.length >= this.maxDepth) {
      const error = new Error(`composition depth limit (${this.maxDepth}) exceeded`);
      error.code = "COMPOSITION_DEPTH";
      throw error;
    }
  }
}
