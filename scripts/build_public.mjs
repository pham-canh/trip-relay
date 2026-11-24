import { cp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "dist-pages");
const airline = new URL(`${(process.env.AIRLINE_URL || "https://pham-canh.github.io/trip-relay").replace(/\/$/, "")}/`);
const peer = new URL(`${(process.env.PEER_URL || "https://pham-canh.github.io./").replace(/\/$/, "")}/`);

if (airline.origin === peer.origin) {
  console.error("AIRLINE_URL and PEER_URL must have different origins.");
  process.exit(1);
}

const airlineBase = airline.href.replace(/\/$/, "");
const peerBase = peer.href.replace(/\/$/, "");
const text = new Set([".html", ".js", ".mjs", ".json", ".hocon", ".css", ".txt", ".md", ".svg", ".yml", ".yaml"]);

async function rewrite(dir, replacements) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await rewrite(file, replacements);
    else if (entry.isFile() && text.has(path.extname(entry.name).toLowerCase())) {
      const before = await readFile(file, "utf8");
      let after = before;
      for (const [from, to] of replacements) after = after.replaceAll(from, to);
      if (after !== before) await writeFile(file, after);
    }
  }
}

async function requireFiles(dir, files) {
  for (const file of files) {
    const info = await stat(path.join(dir, file)).catch(() => null);
    if (!info?.isFile()) {
      console.error(`Missing public build file: ${path.relative(root, path.join(dir, file))}`);
      process.exit(1);
    }
  }
}

const airlineDir = path.join(out, "airline");
const peerDir = path.join(out, "peer");
await rm(out, { recursive: true, force: true });
await cp(path.join(root, "site"), airlineDir, { recursive: true });
await cp(path.join(root, "peer"), peerDir, { recursive: true });
await rewrite(airlineDir, [
  ["http://localhost:8081/harbor_hotel", `${peerBase}/harbor_hotel`],
  ["http://localhost:8081/", `${peerBase}/`],
  ["http://localhost:8081", peer.origin],
  ["http://127.0.0.1:8080", airline.origin],
]);
await rewrite(peerDir, [
  ["http://127.0.0.1:8080/", `${airlineBase}/`],
  ["http://127.0.0.1:8080", airline.origin],
  ["http://localhost:8081", peer.origin],
]);
await requireFiles(airlineDir, ["index.html", "agent-manifest.json", "skyline_air.network.json"]);
await requireFiles(peerDir, ["index.html", "agent-manifest.json", "harbor_hotel.network.json"]);

console.log(`Airline build: ${airlineDir}`);
console.log(`Peer build: ${peerDir}`);
console.log(`Airline URL: ${airline.href}`);
console.log(`Peer URL: ${peer.href}`);
