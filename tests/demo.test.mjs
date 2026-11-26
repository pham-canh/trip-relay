// The keyless demo: the browser mock is read-only, picks the peer for a hotel
// question, and summarizes tool output instead of calling every tool in turn.
import assert from "node:assert/strict";
import test from "node:test";
import { selectTopRouter } from "../site/runtime/engine.js";
import { browserMockCompletion } from "../site/runtime/llm.js";

const tool = (name, properties = {}, required = []) => ({
  type: "function",
  function: { name, parameters: { type: "object", properties, required } },
});
const user = (content) => [{ role: "user", content }];

test("the scripted demo router is a real mock and needs no key", () => {
  const selected = selectTopRouter({ llm_router: { base_url: "https://api.example/v1", mock: false } }, "browser://mock", "", "mock-1");
  assert.equal(selected.baseUrl, "browser://mock");
  assert.equal(selected.mock, true);
});

test("a hotel question calls the hotel peer first, never a write tool", () => {
  const tools = [
    tool("book_flight", { request: { type: "string" } }, ["request"]),
    tool("harbor_hotel", { request: { type: "string" } }, ["request"]),
  ];
  const result = browserMockCompletion(user("Can you ask Harbor Hotel about a quiet room?"), tools);
  assert.equal(result.finishReason, "tool_calls");
  assert.equal(result.toolCalls[0].function.name, "harbor_hotel");
  assert.match(result.toolCalls[0].function.arguments, /quiet room/);
});

test("a booking request does not call an irreversible tool in the demo", () => {
  const tools = [tool("book_flight", { request: { type: "string" } }, ["request"])];
  const result = browserMockCompletion(user("Book the morning flight for Alex."), tools);
  assert.equal(result.finishReason, "stop");
  assert.equal(result.toolCalls.length, 0);
  assert.match(result.content, /scripted demo/i);
});

test("the demo summarizes hotel facts from a read tool instead of calling another tool", () => {
  const tools = [tool("harbor_hotel", { request: { type: "string" } }, ["request"])];
  const messages = [
    { role: "user", content: "What rooms does the hotel have?" },
    { role: "tool", name: "harbor_hotel", content: JSON.stringify({ status: "succeeded", result: { rooms: [{ name: "Harbor Double", rate: 84 }] } }) },
  ];
  const result = browserMockCompletion(messages, tools);
  assert.equal(result.finishReason, "stop");
  assert.equal(result.toolCalls.length, 0);
  assert.match(result.content, /Harbor Double at \$84 a night/);
});

test("the demo reports a blocked or failed tool without retrying", () => {
  const blocked = browserMockCompletion([
    { role: "user", content: "Ask the hotel." },
    { role: "tool", name: "harbor_hotel", content: "Blocked by data-loss prevention: the peer_response contained a protected email. Nothing was sent or executed." },
  ], [tool("harbor_hotel", {}, [])]);
  assert.equal(blocked.toolCalls.length, 0);
  assert.match(blocked.content, /blocked a protected value/i);

  const failed = browserMockCompletion([
    { role: "user", content: "Ask the hotel." },
    { role: "tool", name: "harbor_hotel", content: "Error from tool 'harbor_hotel': Could not reach hotel.test (network or CORS error)." },
  ], [tool("harbor_hotel", {}, [])]);
  assert.equal(failed.toolCalls.length, 0);
  assert.match(failed.content, /could not complete/i);
});
