// llm.js — the LlmClient intrinsic: an OpenAI-compatible chat-completions client.

import { assertModelForRouter, normalizeModelName } from "./model.js";
import { ProviderError } from "./provider-error.js";

function hostOf(url) {
  try { return new URL(url).host; } catch { return url || "?"; }
}

export function isMockResponse(configuredMock, routeKind, model) {
  return !!configuredMock || routeKind === "mock" || /neuro-san-mock/.test(model || "");
}

export function browserMockCompletion(messages = [], tools = []) {
  const toolMessages = messages.filter((m) => m?.role === "tool");
  const called = new Set(toolMessages.map((m) => m.name).filter(Boolean));
  const available = (tools || []).map((tool) => tool?.function).filter((fn) => fn?.name);
  const lastUser = [...messages].reverse().find((m) => m?.role === "user");
  const request = typeof lastUser?.content === "string" ? lastUser.content : JSON.stringify(lastUser?.content || "");
  const system = messages.find((m) => m?.role === "system")?.content || "";
  const siteName = system.match(/You are the assistant on the (.+?) website\./i)?.[1] || "";
  const isPeer = !!siteName && !/skyline air/i.test(siteName);
  const isSubagent = /^You help the .+ assistant/mi.test(system);
  if (isPeer) {
    // A peer runs without its own website tools, so the demo answers from the
    // published facts in its prompt. This is the same text the hotel's own page
    // publishes, not a live read.
    const facts = system.split("\n").find((line) => /rooms and rates:/i.test(line));
    const content = facts
      ? `Harbor Hotel's published facts: ${facts.replace(/^-\s*/, "").trim()}`
      : "I can share this site's published facts; its own page has the details.";
    return { content, toolCalls: [], finishReason: "stop", usage: null, model: "neuro-san-mock-browser" };
  }
  if (isSubagent) {
    return {
      content: "The scripted demo is read-only. Use the page's own form to book a flight.",
      toolCalls: [],
      finishReason: "stop",
      usage: null,
      model: "neuro-san-mock-browser",
    };
  }
  const wantsHotel = /hotel|room|harbor|stay|shuttle|breakfast/i.test(request);
  const wantsFlight = /flight|fly|fare|book|seat|airline/i.test(request);
  const readTool = (name) => /^(?:website_)?(?:get_|list_|read_|search|find|lookup|state|catalog)/i.test(name)
    || /hotel|harbor|fare_agent/i.test(name);
  const writeTool = (name) => /(?:^|_)(?:book|request|select|create|delete|update|confirm|pay|reserve)(?:_|$)/i.test(name);
  const usable = (fn) => !called.has(fn.name) && !writeTool(fn.name);
  const choose = () => {
    if (wantsHotel) {
      const hotel = available.find((fn) => usable(fn) && /hotel|harbor/i.test(fn.name));
      if (hotel) return hotel;
    }
    if (wantsFlight) {
      const flight = available.find((fn) => usable(fn) && /fare|flight/i.test(fn.name));
      if (flight) return flight;
    }
    return available.find((fn) => usable(fn) && readTool(fn.name)) || null;
  };
  // The keyless demo is read-only: it calls one read or peer tool, then summarizes.
  // It never calls a write tool, so a demo visitor cannot book or request a room.
  const next = toolMessages.length ? null : choose();
  if (next) {
    const args = {};
    const schema = next.parameters || {};
    for (const name of schema.required || []) args[name] = request;
    for (const name of ["request", "inquiry", "search_terms", "query", "input"]) {
      if (schema.properties?.[name] || (schema.required || []).includes(name)) args[name] ??= request;
    }
    return {
      content: "",
      toolCalls: [{
        id: `call_${next.name}`,
        type: "function",
        function: { name: next.name, arguments: JSON.stringify(args) },
      }],
      finishReason: "tool_calls",
      usage: null,
      model: "neuro-san-mock-browser",
    };
  }
  const content = toolMessages.length
    ? mockSummary(toolMessages.map((message) => String(message.content || "")))
    : "(scripted demo) Ask about a flight or Harbor Hotel. This demo uses fixed tool calls and a deterministic summary, not a live model.";
  return { content, toolCalls: [], finishReason: "stop", usage: null, model: "neuro-san-mock-browser" };
}

function mockSummary(results) {
  for (const result of results) {
    if (/Blocked by data-loss prevention/i.test(result)) {
      return "The scripted demo blocked a protected value. Open the privacy receipt to see the boundary and the rule. Nothing from that value was sent or shown.";
    }
    if (/Error from tool|Could not reach|returned HTTP|did not return valid|timed out/i.test(result)) {
      return `The scripted demo could not complete that request: ${result.replace(/\s+/g, " ").slice(0, 300)}`;
    }
  }
  for (const result of results) {
    let parsed = null;
    try { parsed = JSON.parse(result); } catch { /* plain text */ }
    if (parsed === null) {
      if (result.trim()) return result.trim().slice(0, 700);
      continue;
    }
    const value = parsed?.result && typeof parsed.result === "object" ? parsed.result : parsed;
    const rooms = value?.rooms;
    if (Array.isArray(rooms) && rooms.length) {
      return `Harbor Hotel lists ${rooms.map((room) => `${room.name} at $${room.rate} a night`).join(", ")}. Breakfast and the airport shuttle are included. This is a scripted demo; the page has the full details.`;
    }
    const flights = value?.flights;
    if (Array.isArray(flights) && flights.length) {
      const first = flights[0];
      return `Skyline Air lists ${flights.length} flights, including ${first.number || first.id} at ${first.depart || "the published time"}. This is a scripted demo; the page has the full schedule.`;
    }
    if (typeof value?.text === "string" && value.text.trim()) return value.text.trim().slice(0, 700);
  }
  return `The scripted demo read ${results.length} page tool${results.length === 1 ? "" : "s"}. Open the privacy receipt to see the boundary events.`;
}

//
// In production this is @langchain/openai's ChatOpenAI pointed at a router base
// URL. Here it is a direct fetch to any OpenAI-compatible endpoint (LiteLLM,
// OpenRouter, vLLM, Ollama, Docker Model Runner, or the demo mock router). The
// BYOK key is never put in the URL and is sent only to the chosen router as
// Authorization.

export class LlmClient {
  constructor({ baseUrl, apiKey, trace, mock }) {
    this.baseUrl = (baseUrl || "").replace(/\/$/, "");
    this.apiKey = apiKey || "";
    this.trace = trace;
    this.mock = !!mock;
  }

  // messages: [{role, content, tool_calls?, tool_call_id?, name?}]
  // tools: [{type:'function', function:{name, description, parameters}}]
  // onContentDelta: (text) => void  — streamed natural-language tokens
  async chat({ model, messages, tools, origin, parentSpan, onContentDelta, signal }) {
    model = normalizeModelName(model);
    // A real (non-mock) router with no API key: refuse rather than forward the
    // placeholder "demo" to a live provider (which returns a confusing 401). This
    // happens e.g. when a shared/reloaded URL keeps the proxy router but no saved
    // BYOK profile/key is available in this browser.
    if (!this.mock && (!this.apiKey || this.apiKey === "demo")) {
      throw new Error(`An AI provider key is required for ${hostOf(this.baseUrl) || "the configured provider"}. Open ⚙ AI model settings, paste your key, then select Save and start. Your key stays in this browser and is sent only to the configured provider.`);
    }
    assertModelForRouter(model, this.mock, hostOf(this.baseUrl));
    const span = this.trace?.start("model_call", {
      parent: parentSpan,
      origin,
      model,
      mock: this.mock,
      routerHost: hostOf(this.baseUrl),
      endpoint: `${this.baseUrl}/chat/completions`,
      keySource: this.apiKey ? "local BYOK (not shown)" : "none",
      toolNames: (tools || []).map((t) => t.function.name),
    });

    const body = {
      model,
      messages,
      stream: true,
    };
    if (tools && tools.length) {
      body.tools = tools;
      body.tool_choice = "auto";
    }

    try {
      if (this.baseUrl === "browser://mock") {
        signal?.throwIfAborted?.();
        const result = browserMockCompletion(messages, tools);
        if (result.content) {
          onContentDelta?.(result.content);
          this.trace?.update(span, { streamChunk: result.content });
        }
        this.trace?.end(span, {
          finishReason: result.finishReason,
          contentChars: result.content.length,
          toolCalls: result.toolCalls.map((t) => t.function.name),
          usage: null,
          mock: true,
          verifiedReal: false,
          respModel: result.model,
          routeKind: "browser-mock",
        });
        return result;
      }
      const headers = {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      };
      if (hostOf(this.baseUrl) === "api.anthropic.com") {
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      }
      const resp = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`LLM HTTP ${resp.status}: ${txt.slice(0, 300)}`);
      }

      const routeKind = resp.headers.get("X-Nsdeploy-LLM-Route") || "";
      const result = await this._readSse(resp, onContentDelta, span, signal);
      const respMock = isMockResponse(this.mock, routeKind, result.model);
      this.trace?.end(span, {
        finishReason: result.finishReason,
        contentChars: result.content.length,
        toolCalls: result.toolCalls.map((t) => t.function.name),
        usage: result.usage,
        mock: respMock,
        verifiedReal: !respMock && !!result.model,
        respModel: result.model,
        routeKind,
      });
      return result;
    } catch (err) {
      const friendlyError = ProviderError.friendly(err, this.baseUrl);
      if (err?.name === "AbortError" && signal?.aborted) {
        this.trace?.end(span, { status: "steered", interrupted: true });
      } else {
        this.trace?.fail(span, friendlyError);
      }
      throw friendlyError;
    }
  }

  async _readSse(resp, onContentDelta, span, signal) {
    const reader = resp.body.getReader();
    const cancel = () => reader.cancel(signal?.reason).catch(() => {});
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) {
      await cancel();
      signal.throwIfAborted();
    }
    const dec = new TextDecoder();
    let buf = "";
    let content = "";
    const toolCalls = []; // assembled by index
    let finishReason = null;
    let usage = null;
    let model = null;

    const handleChunk = (json) => {
      if (json.model) model = json.model;
      if (json.usage) usage = json.usage;
      const choice = json.choices?.[0];
      if (!choice) return;
      const delta = choice.delta || {};
      if (delta.content) {
        content += delta.content;
        if (!signal?.aborted) {
          onContentDelta?.(delta.content);
          this.trace?.update(span, { streamChunk: delta.content });
        }
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCalls[idx]) toolCalls[idx] = { id: tc.id, type: "function", function: { name: "", arguments: "" } };
          if (tc.id) toolCalls[idx].id = tc.id;
          if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
          if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
        }
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    };

    try {
      for (;;) {
        const { value, done } = await reader.read();
        signal?.throwIfAborted();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line || !line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            handleChunk(JSON.parse(payload));
          } catch {
            /* ignore malformed keep-alive lines */
          }
        }
      }
    } finally {
      signal?.removeEventListener("abort", cancel);
    }

    return { content, toolCalls: toolCalls.filter(Boolean), finishReason, usage, model };
  }
}
