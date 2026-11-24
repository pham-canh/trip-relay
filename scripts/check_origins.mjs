#!/usr/bin/env node
// Verify that the deployed pair is two browser origins, not two paths on one
// origin, and that the hotel publishes the public artifacts the caller needs.
//
// The browser is the authority on origins; this script checks the same URLs
// with the URL parser, then checks the deployment's CORS and peer policy.
// It does not need a model key and it does not call a model.
//
//   npm run check:origins
//   AIRLINE_URL=http://127.0.0.1:8080/ PEER_URL=http://localhost:8081/ npm run check:origins
//
// The browser evidence (location.origin, localStorage isolation, the consent
// flow) is recorded in docs/ORIGIN.md.

const AIRLINE = `${(process.env.AIRLINE_URL || "https://pham-canh.github.io/trip-relay").replace(/\/+$/, "")}/`;
const PEER = `${(process.env.PEER_URL || "https://pham-canh.github.io.").replace(/\/+$/, "")}/`;

const airline = new URL(AIRLINE);
const peer = new URL(PEER);

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

async function getJson(url) {
  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${url} returned ${res.status} but not JSON`);
  }
  return { res, json };
}

console.log(`Airline: ${airline.href}`);
console.log(`Hotel:   ${peer.href}`);
console.log(`Airline origin: ${airline.origin}`);
console.log(`Hotel origin:   ${peer.origin}`);
console.log("");

check(airline.origin !== peer.origin, "the two sites have different origins",
  airline.origin === peer.origin ? "a path or a trailing slash does not create an origin" : "");
if (airline.origin === peer.origin) {
  console.error("\nThe hotel URL must be a different origin. Do not drop the trailing dot from pham-canh.github.io.");
  process.exit(1);
}

let airlineManifest;
let peerManifest;
try {
  const [a, p] = await Promise.all([
    getJson(new URL("agent-manifest.json", airline)),
    getJson(new URL("agent-manifest.json", peer)),
  ]);
  airlineManifest = a;
  peerManifest = p;

  check(a.res.status === 200, "airline manifest is reachable", `HTTP ${a.res.status}`);
  check(p.res.status === 200, "hotel manifest is reachable", `HTTP ${p.res.status}`);
  check(typeof a.json.brand === "string" && a.json.brand.length > 0, "airline manifest has a brand", a.json.brand);
  check(typeof p.json.brand === "string" && p.json.brand.length > 0, "hotel manifest has a brand", p.json.brand);
  check(Array.isArray(a.json.networks) && a.json.networks.some((n) => n.name === "skyline_air"),
    "airline publishes skyline_air");
  check(Array.isArray(p.json.networks) && p.json.networks.some((n) => n.name === "harbor_hotel"),
    "hotel publishes harbor_hotel");

  const cors = p.res.headers.get("access-control-allow-origin");
  check(cors === "*" || cors === airline.origin, "hotel manifest is CORS-readable from the airline",
    cors || "no Access-Control-Allow-Origin header");

  const allowed = (a.json.allowed_peers || []).map((value) => {
    try { return new URL(value).origin; } catch { return value; }
  });
  check(allowed.includes(peer.origin), "airline allows exactly this hotel origin",
    allowed.length ? allowed.join(", ") : "allowed_peers is empty");

  const peerAllowed = p.json.allowed_peers || [];
  check(peerAllowed.length === 0, "hotel allows no further peers", peerAllowed.join(", ") || "closed");
} catch (error) {
  check(false, "manifests are readable", error.message);
}

if (peerManifest) {
  try {
    const network = await getJson(new URL("harbor_hotel.network.json", peer));
    check(network.res.status === 200 && network.json && typeof network.json === "object",
      "hotel network is reachable", `HTTP ${network.res.status}`);
    const toolCount = network.json?.tools?.length ?? 0;
    check(Array.isArray(network.json?.tools) && toolCount > 0,
      "hotel network has tools", `${toolCount} tool${toolCount === 1 ? "" : "s"}`);
  } catch (error) {
    check(false, "hotel network is readable", error.message);
  }
}

console.log("");
if (failures) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed.`);
  process.exit(1);
}
console.log("PASS: the two sites are distinct origins and the hotel publishes the caller's artifacts.");
console.log("Open the airline page in a browser and confirm location.origin on both pages; see docs/ORIGIN.md.");
