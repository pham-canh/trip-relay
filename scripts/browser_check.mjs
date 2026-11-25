#!/usr/bin/env node
// Browser checks for the Trip Relay pair, with a scripted SSE router.
//
//   npm run check:browser        # local pair: 15 page/receipt checks + 12 consent checks
//   npm run check:browser:live   # hosted pair: 12 consent/receipt checks
//
// Start the local pair first:
//
//   npm run serve:airline
//   npm run serve:hotel
//
// The checks need Chrome and playwright-core. Install the dev dependency once:
//
//   npm install
//
// Override the targets or the browser with AIRLINE_URL, PEER_URL, and CHROME_PATH.
// The model is a scripted OpenAI-compatible endpoint, not a live provider: these
// checks prove the protocol and the consent boundary without spending tokens.

import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");
const pagesOnly = args.has("--pages");
const consentOnly = args.has("--consent") || (live && !args.has("--pages"));

const AIRLINE_URL = process.env.AIRLINE_URL
  || (live ? "https://pham-canh.github.io/trip-relay/" : "http://127.0.0.1:8080/");
const PEER_URL = process.env.PEER_URL
  || (live ? "https://pham-canh.github.io./" : "http://localhost:8081/");
const PEER_HOST = new URL(PEER_URL).host;
const PEER_ORIGIN = new URL(PEER_URL).origin;

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("This check needs playwright-core. Run `npm install` once, then retry.");
  process.exit(2);
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

async function reachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

const chromePath = process.env.CHROME_PATH
  || (existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "");

const browser = await chromium.launch(
  chromePath ? { executablePath: chromePath, headless: true } : { channel: "chrome", headless: true },
);

try {
  if (!consentOnly) {
    await runPageChecks();
  }
  if (!pagesOnly) {
    await runConsentChecks();
  }
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

async function runPageChecks() {
  console.log(`\nPage and receipt checks: ${AIRLINE_URL}\n`);
  if (!(await reachable(AIRLINE_URL)) || !(await reachable(PEER_URL))) {
    console.error("Start the local pair first: npm run serve:airline and npm run serve:hotel");
    process.exit(2);
  }

  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(AIRLINE_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#privacy-receipt", { timeout: 15000 });
  check("airline page boots", (await page.title()).includes("Skyline Air"));
  check("nine flights render", await page.locator("#flight-list .flight").count() === 9,
    `${await page.locator("#flight-list .flight").count()} flights`);
  check("privacy receipt starts empty",
    (await page.locator("#receipt-count").textContent()).includes("no boundary events"),
    await page.locator("#receipt-count").textContent());

  // Manual booking, the no-key path a judge can use.
  await page.locator("#flight-list .flight").nth(1).click();
  await page.fill("#passenger-name", "Alex Nguyen");
  await page.fill("#passenger-email", "alex@example.com");
  await page.click("#book-button");
  await page.waitForTimeout(200);
  const bookingText = await page.locator("#bookings").textContent();
  check("manual booking returns a reference", /SKY-[A-Z0-9]{4}/.test(bookingText), bookingText.trim());

  // Exercise the receipt UI with boundary events through the exposed engine.
  const appended = await page.evaluate(async () => {
    const { engine } = window.__nsweb;
    await engine.audit.append("consent_requested", { origin: "airline.test", peerOrigin: "hotel.test", consentKind: "network", phase: "invoke", requestHash: "sha256:test" });
    await engine.audit.append("consent_allowed", { origin: "airline.test", peerOrigin: "hotel.test", consentKind: "network", phase: "invoke", requestHash: "sha256:test", decision: "allow" });
    await engine.audit.append("peer_fetch", { origin: "airline.test", peerOrigin: "hotel.test", network: "harbor_hotel" });
    await engine.audit.append("dlp_block", { origin: "airline.test", peerOrigin: "hotel.test", boundary: "peer_egress", rule: "email", requestHash: "sha256:test" });
    return engine.audit.events.length;
  });
  check("receipt accepts boundary events", appended === 4, `${appended} events`);
  await page.waitForTimeout(100);
  const countText = await page.locator("#receipt-count").textContent();
  check("receipt count shows the block", countText.includes("1 blocked") && countText.includes("4 events"), countText);

  await page.locator("#privacy-receipt summary").click();
  await page.waitForTimeout(150);
  const rows = await page.locator("#receipt-events li").allTextContents();
  check("receipt lists the block",
    rows.some((row) => row.includes("Data blocked") && row.includes("email address") && row.includes("before the hotel request")),
    rows.at(-1));
  check("receipt lists the consent and fetch",
    rows.some((row) => row.includes("Consent asked")) && rows.some((row) => row.includes("Peer loaded")),
    `${rows.length} rows`);

  await page.click("#receipt-verify");
  await page.waitForTimeout(150);
  const verifyText = await page.locator("#receipt-status").textContent();
  check("chain verifies in the page", verifyText.includes("Chain verified: 4 events"), verifyText);

  const downloadPromise = page.waitForEvent("download");
  await page.click("#receipt-download");
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile(await download.path(), "utf8"));
  check("download contains the chain", exported.events.length === 4 && exported.events[3].kind === "dlp_block");
  check("download has no email or key",
    !JSON.stringify(exported).includes("alex@example.com") && !JSON.stringify(exported).includes("otk_"));

  const shots = path.resolve("artifacts", "browser-check");
  await mkdir(shots, { recursive: true });
  await page.screenshot({ path: path.join(shots, "airline-receipt.png"), fullPage: true });

  // The hotel page boots on its own origin and keeps its manual path.
  const hotel = await context.newPage();
  const hotelErrors = [];
  hotel.on("console", (message) => { if (message.type() === "error") hotelErrors.push(message.text()); });
  hotel.on("pageerror", (error) => hotelErrors.push(error.message));
  await hotel.goto(PEER_URL, { waitUntil: "networkidle" });
  check("hotel page boots", (await hotel.locator(".brand strong").textContent()).includes("Harbor Hotel"),
    await hotel.locator(".brand strong").textContent());
  check("hotel renders three rooms", await hotel.locator("#rooms .steps li").count() === 3,
    `${await hotel.locator("#rooms .steps li").count()} rooms`);

  check("airline has no console errors", errors.length === 0, errors.join(" | "));
  check("hotel has no console errors", hotelErrors.length === 0, hotelErrors.join(" | "));

  await context.close();
}

async function runConsentChecks() {
  console.log(`\nConsent checks: ${AIRLINE_URL} -> ${PEER_URL}\n`);
  if (!(await reachable(AIRLINE_URL)) || !(await reachable(PEER_URL))) {
    console.error("Start the local pair first: npm run serve:airline and npm run serve:hotel");
    process.exit(2);
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("nsweb-byok-tab-key", "test-key");
    sessionStorage.setItem("nsweb-byok-router", "http://mock.local/v1");
    sessionStorage.setItem("nsweb-byok-model", "test-model");
  });

  await context.route("http://mock.local/agent-manifest.json", (route) =>
    route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: '{"networks":[]}' }));
  await context.route("http://mock.local/v1/models", (route) =>
    route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: '{"data":[{"id":"test-model"}]}' }));

  const sse = (chunks) => `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`;
  const text = (content) => sse([
    { model: "test-model", choices: [{ delta: { content }, finish_reason: null }] },
    { model: "test-model", choices: [{ delta: {}, finish_reason: "stop" }] },
  ]);
  const tool = (name, toolArgs) => sse([
    { model: "test-model", choices: [{ delta: { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name, arguments: JSON.stringify(toolArgs) } }] }, finish_reason: null }] },
    { model: "test-model", choices: [{ delta: {}, finish_reason: "tool_calls" }] },
  ]);

  await context.route("http://mock.local/v1/chat/completions", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    const system = body.messages?.find((message) => message.role === "system")?.content || "";
    const toolMessages = (body.messages || []).filter((message) => message.role === "tool");
    const toolNames = (body.tools || []).map((entry) => entry.function?.name).filter(Boolean);
    let response;
    if (system.includes("Harbor Hotel website")) {
      response = text("Harbor Hotel has a quiet room near the airport: the Harbor Double is $84 a night, with breakfast and the free airport shuttle. Check-in is from 14:00.");
    } else if (system.includes("Skyline Air website")) {
      const peerResult = toolMessages.find((message) => message.name === "harbor_hotel");
      if (peerResult && /declined/i.test(String(peerResult.content))) {
        response = text("You declined, so I did not contact Harbor Hotel. No request left this page.");
      } else if (peerResult) {
        response = text("Harbor Hotel has a quiet room near the airport. The Harbor Double is $84 a night, including breakfast and the free airport shuttle. Check-in starts at 14:00.");
      } else if (toolNames.includes("harbor_hotel")) {
        response = tool("harbor_hotel", { request: "Does Harbor Hotel have a quiet room near the airport? What does it cost?" });
      } else {
        response = text("I can help with flights and with a hotel question after you approve the contact.");
      }
    } else {
      response = text("OK.");
    }
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" }, body: response });
  });

  // Allow path.
  const page = await context.newPage();
  const errors = [];
  const peerRequests = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (request.url().startsWith(PEER_ORIGIN)) peerRequests.push(request.url()); });

  await page.goto(AIRLINE_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#ns-input");
  check("assistant is ready with a test key",
    (await page.locator("#assistant-status").textContent()).includes("connected"),
    await page.locator("#assistant-status").textContent());
  await page.fill("#ns-input", "Can you ask Harbor Hotel whether it has a quiet room near the airport for two nights?");
  await page.click("#ns-send");
  await page.waitForSelector(".ns-consent", { timeout: 15000 });
  const card = await page.locator(".ns-consent").last().textContent();
  check("consent card names the hotel origin", card.includes(PEER_HOST),
    card.replace(/\s+/g, " ").trim().slice(0, 180));
  check("zero hotel requests before the decision", peerRequests.length === 0, `${peerRequests.length} requests`);
  await page.locator('.ns-consent [data-d="allow"]').last().click();
  await page.waitForFunction(() => document.querySelector("#ns-msgs")?.textContent.includes("Harbor Double"), null, { timeout: 20000 });
  check("allow loads the hotel and returns its answer", peerRequests.length > 0, `${peerRequests.length} hotel requests`);
  const answer = await page.locator("#ns-msgs").textContent();
  check("the answer keeps the hotel's facts", answer.includes("$84") || answer.includes("Harbor Double"),
    answer.replace(/\s+/g, " ").trim().slice(-220));

  await page.locator("#privacy-receipt summary").click();
  await page.waitForTimeout(200);
  const receipt = await page.locator("#receipt-events").textContent();
  check("receipt records the real consent and fetch",
    receipt.includes("Consent asked") && receipt.includes("Contact allowed") && receipt.includes("Peer loaded"),
    receipt.replace(/\s+/g, " ").trim().slice(0, 260));
  await page.click("#receipt-verify");
  await page.waitForTimeout(150);
  check("real chain verifies", (await page.locator("#receipt-status").textContent()).includes("Chain verified"),
    await page.locator("#receipt-status").textContent());
  check("allow path has no console errors", errors.length === 0, errors.join(" | "));

  // Decline path, fresh page and fresh audit.
  const declined = await context.newPage();
  const declinedRequests = [];
  const declinedErrors = [];
  declined.on("console", (message) => { if (message.type() === "error") declinedErrors.push(message.text()); });
  declined.on("pageerror", (error) => declinedErrors.push(error.message));
  declined.on("request", (request) => { if (request.url().startsWith(PEER_ORIGIN)) declinedRequests.push(request.url()); });
  await declined.goto(AIRLINE_URL, { waitUntil: "networkidle" });
  await declined.fill("#ns-input", "Can you ask Harbor Hotel whether it has a quiet room near the airport for two nights?");
  await declined.click("#ns-send");
  await declined.waitForSelector(".ns-consent", { timeout: 15000 });
  await declined.locator('.ns-consent [data-d="decline"]').last().click();
  await declined.waitForTimeout(800);
  check("decline sends zero hotel requests", declinedRequests.length === 0, `${declinedRequests.length} requests`);
  const declinedText = await declined.locator("#ns-msgs").textContent();
  check("decline is reported, not retried",
    /did not contact/i.test(declinedText) && !declinedText.includes("$84")
      && await declined.locator(".ns-consent").count() === 1,
    declinedText.replace(/\s+/g, " ").trim().slice(-200));
  await declined.locator("#privacy-receipt summary").click();
  await declined.waitForTimeout(150);
  const declinedReceipt = await declined.locator("#receipt-events").textContent();
  check("receipt records the decline",
    declinedReceipt.includes("Contact declined") && !declinedReceipt.includes("Peer loaded"),
    declinedReceipt.replace(/\s+/g, " ").trim().slice(0, 220));
  check("decline path has no console errors", declinedErrors.length === 0, declinedErrors.join(" | "));

  await context.close();
}
