// Mounts the assistant inside the existing page. Load it with:
//   <script type="module" src="site.js"></script>
// The page needs the mount markup from index.html. reviewDetails() reads the
// page object from app.js to show the visitor what the action will write.
import { App } from "./app.js";

/**
 * Boots the browser runtime in the page's assistant section.
 *
 * It points the runtime at this folder, so the manifest, network and actions load from
 * the same place as the page. Before each irreversible action, it shows its own
 * confirmation dialog, written for the visitor.
 */
export class AssistantMount {
  /**
   * The first chat message once the visitor has a key: what the assistant can do here.
   */
  static GREETING = "I can find a flight, hold a fare, and book it with your confirmation. I can also ask Harbor Hotel what it offers, but only after you approve the contact.";

  /**
   * The confirmation dialog's words for each irreversible action. Name each button after
   * what it does, so that "Cancel" never has two meanings. With no irreversible action,
   * leave this empty.
   */
  static DIALOGS = {
    book_flight: {
      title: "Book this flight?",
      sentence: "This writes a booking and returns a reference code. The demo takes no payment and has no undo.",
      confirm: "Book the flight",
      decline: "Keep looking",
    },
  };

  /**
   * Visitor-facing names for the audit events and DLP rules shown in the receipt.
   */
  static RECEIPT_LABELS = {
    consent_requested: "Consent asked",
    consent_allowed: "Contact allowed",
    consent_declined: "Contact declined",
    consent_reused: "Approval reused",
    peer_fetch: "Peer loaded",
    dlp_block: "Data blocked",
    tool_denied: "Tool denied",
    policy_denied: "Origin denied",
    write_confirmed: "Write confirmed",
    write_refused: "Write refused",
  };

  static RECEIPT_RULES = {
    canary: "test canary",
    email: "email address",
    "otari-key": "API key",
    "openai-key": "API key",
    "bearer-token": "bearer token",
    "private-key": "private key",
  };

  static RECEIPT_BOUNDARIES = {
    peer_egress: "before the hotel request",
    peer_response: "in the hotel reply",
    peer_sly_data: "in private context",
    coded_tool: "before a coded tool",
    mcp_egress: "before an MCP call",
    presentation: "in a presentation",
  };

  /**
   * Boot the runtime and report the result in the status line.
   *
   * :return: The runtime engine, or null when boot failed.
   */
  static async start() {
    const status = document.querySelector("#assistant-status");
    const siteBase = new URL("./", import.meta.url).href;
    try {
      // Load the runtime here, so a missing or broken runtime is reported too.
      const { boot } = await import("./runtime/index.js");
      const booted = await boot("#agent-app", {
        originUrl: siteBase,
        sandboxWorkerUrl: new URL("runtime/sandbox-worker.js", siteBase).href,
      });
      AssistantMount.engine = booted.engine;
      AssistantMount.defaultReview = booted.engine.onActionConfirm;
      booted.engine.onActionConfirm = AssistantMount.review;
      AssistantMount.defaultConsent = booted.engine.onConsent;
      booted.engine.onConsent = AssistantMount.consent;
      AssistantMount.mountReceipt(booted.engine);
      // Without a key the chat cannot answer yet. This is the same test as the
      // runtime's "API key required" badge in runtime/ui.js.
      const needsKey = !booted.engine.mockLLM
        && (!booted.engine.byokKey || booted.engine.byokKey === "demo");
      status.textContent = needsKey
        ? "Assistant needs your AI provider key. Add it in AI model settings below."
        : "Assistant connected to this page.";
      if (!needsKey) {
        AssistantMount.greet();
      }
      return booted.engine;
    } catch (error) {
      // The page must keep working without the assistant.
      status.textContent = "The assistant could not load. You can still use the page directly.";
      console.error("Assistant startup failed", error);
      return null;
    }
  }

  /**
   * Replace the runtime's general first chat message with GREETING. "New chat" keeps the
   * first message, so the greeting stays for the whole visit.
   */
  static greet() {
    const first = document.querySelector("#ns-msgs .ns-msg.bot");
    if (first) {
      first.textContent = AssistantMount.GREETING;
    }
  }

  /**
   * Ask the visitor to confirm actions before they run. One of this page's actions listed
   * in DIALOGS gets this page's dialog. Anything else, such as a partner site's action,
   * gets the runtime's own dialog.
   *
   * :param items: The actions waiting for confirmation, each with action, origin, effect
   *   and arguments.
   * :return: True when the visitor confirms.
   * :raises Error: The site's reason, when its own check refuses the action, or when a
   *   chat form bundles one of this page's DIALOGS actions with other actions.
   */
  static async review(items) {
    let confirmed = false;
    const pageOrigin = new URL(document.URL).origin;
    // This page's dialog shows one action with its details and runs the site's own check.
    // A chat form that bundles such an action with others would skip both, so nothing
    // runs.
    if (items.length > 1) {
      for (const item of items) {
        if (item.origin === pageOrigin && Object.hasOwn(AssistantMount.DIALOGS, item.action)) {
          throw new Error(`Nothing ran. "${AssistantMount.DIALOGS[item.action].confirm}" needs its own confirmation, so ask the assistant to do that on its own.`);
        }
      }
    }
    // A partner's action can have the same name as one of this page's. It gets the
    // runtime's dialog, which names the partner's origin, and this page's check never runs.
    const own = items.length === 1 && items[0].origin === pageOrigin;
    if (own && Object.hasOwn(AssistantMount.DIALOGS, items[0].action)) {
      const content = AssistantMount.dialogContent(items[0]);
      if (content.refusal) {
        // A dialog would offer a button that cannot work. The runtime runs nothing
        // and gives the agent this reason as an "Error from tool" message.
        throw new Error(content.refusal);
      }
      confirmed = await new Promise(AssistantMount.openDialog.bind(null, content));
    } else {
      confirmed = await AssistantMount.defaultReview(items);
    }
    AssistantMount.keepFocusInChat();
    return confirmed;
  }

  /**
   * Ask the visitor, with the runtime's consent card, whether to contact a partner site.
   * Focus the card while it waits, then put focus back in the chat.
   *
   * :param info: What the card shows, such as the partner's label and host and the request.
   * :return: The card's answer, unchanged: "allow", "always" or "decline". The runtime
   *   allows the call when this returns nothing.
   */
  static async consent(info) {
    // defaultConsent() adds the card at once. The card has no role, and the stylesheet
    // hides the status line while it waits, so name the card and focus its title.
    const answer = AssistantMount.defaultConsent(info);
    AssistantMount.focusConsentCard();
    const decision = await answer;
    // Answering the card removes its buttons, so focus may fall to the page body.
    AssistantMount.keepFocusInChat();
    return decision;
  }

  /**
   * Name the newest consent card after its title, for screen readers. Move focus to that
   * title when focus is in the chat or on the page body, not from the page's own form.
   */
  static focusConsentCard() {
    const cards = document.querySelectorAll("#ns-msgs .ns-consent");
    const card = cards[cards.length - 1];
    const title = card ? card.querySelector(".ns-consent-title") : null;
    if (!title) {
      return;
    }
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", title.textContent);
    // A visitor typing in the page's own form keeps focus, and their keystrokes.
    const active = document.activeElement;
    if (active && active !== document.body && !active.closest("#agent-app")) {
      return;
    }
    // tabIndex -1 lets the title take focus. Enter cannot activate a title, so a stray
    // Enter answers nothing.
    title.tabIndex = -1;
    title.focus();
  }

  /**
   * Work out what the dialog says for one action: its words from DIALOGS, the readable
   * details and the exact call. This is plain data, so tests can check it.
   *
   * :param item: An action waiting for confirmation, with action, origin, effect and
   *   arguments.
   * :return: The title, sentence, button labels, details, exact call text and the
   *   site's refusal, if any.
   */
  static dialogContent(item) {
    let details = {};
    try {
      details = AssistantMount.reviewDetails(item.action, item.arguments) || {};
    } catch (error) {
      // The dialog then opens the exact call, and the visitor decides.
      console.error("Could not add details to the confirmation dialog", error);
    }
    return {
      ...AssistantMount.DIALOGS[item.action],
      details: details,
      refusal: details.refusal,
      exact: `${item.action} on ${item.origin} (${item.effect})\n${JSON.stringify(item.arguments, null, 2)}`,
    };
  }

  /**
   * Give the readable details of one irreversible action, such as items, total, name,
   * email and what undoing it would cost, from the page's own read-only operations, so
   * no rule is copied here. When the operation's own check refuses the call, return
   * {refusal: reason}, and review() opens no dialog.
   *
   * :param action: The action name.
   * :param args: The action's arguments.
   * :return: Details by label, {refusal: reason}, or {} when the action has none.
   */
  static reviewDetails(action, args) {
    if (action === "book_flight") {
      const check = App.page.checkBooking(args);
      if (!check.ok) {
        return { refusal: check.reason };
      }
      return {
        "Passenger": check.passengerName,
        "Email": check.email,
        "Flight": `${check.flight.number} · ${check.flight.from} → ${check.flight.to}`,
        "When": `${check.flight.dateLabel}, ${check.flight.depart}–${check.flight.arrive}`,
        "Fare": `${check.flight.fare} · $${check.flight.price}`,
      };
    }
    return {};
  }

  /**
   * Mount the visitor-facing privacy receipt under the assistant. It reads the same
   * hash-chained audit log the runtime writes, and patches append() so a new boundary
   * event appears without a reload. The log stays in this tab.
   *
   * :param engine: The booted runtime engine.
   */
  static mountReceipt(engine) {
    const details = document.querySelector("#privacy-receipt");
    const list = document.querySelector("#receipt-events");
    const count = document.querySelector("#receipt-count");
    const status = document.querySelector("#receipt-status");
    const verifyButton = document.querySelector("#receipt-verify");
    const downloadButton = document.querySelector("#receipt-download");
    if (!details || !list || !count || !status || !engine?.audit) {
      return;
    }
    const LIMIT = 12;
    let verifyToken = 0;

    const label = (kind) => AssistantMount.RECEIPT_LABELS[kind] || kind.replaceAll("_", " ");
    const ruleName = (rule) => AssistantMount.RECEIPT_RULES[rule] || rule || "protected value";
    const boundaryName = (boundary) => AssistantMount.RECEIPT_BOUNDARIES[boundary] || boundary || "boundary";
    const describe = (event) => {
      const peer = event.peerOrigin ? `Harbor Hotel at ${event.peerOrigin}` : "";
      switch (event.kind) {
        case "consent_requested":
          return peer ? `Asked before contacting ${peer}` : "Asked for consent";
        case "consent_allowed":
          return peer ? `You allowed contact with ${peer}` : "Contact allowed";
        case "consent_declined":
          return peer ? `You declined contact with ${peer}` : "Contact declined";
        case "consent_reused":
          return peer ? `Reused the scoped approval for ${peer}` : "Scoped approval reused";
        case "peer_fetch":
          return [event.network ? `Loaded ${event.network}` : "Loaded peer network", peer].filter(Boolean).join(" from ");
        case "dlp_block":
          return `${ruleName(event.rule)} blocked ${boundaryName(event.boundary)}`;
        case "tool_denied":
          return `Denied ${event.tool || "a tool"}: ${event.reason || "not callable here"}`;
        case "policy_denied":
          return `Denied ${event.peerOrigin || "an unlisted origin"}: ${event.reason || "not in allowed_peers"}`;
        case "write_confirmed":
          return `Confirmed ${event.tool || "a write"}`;
        case "write_refused":
          return `Refused ${event.tool || "a write"}: ${event.reason || "check failed"}`;
        default:
          return Object.entries(event)
            .filter(([key]) => !["id", "ts", "kind", "prevHash", "hash"].includes(key))
            .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
            .join(" · ");
      }
    };
    const render = () => {
      const events = engine.audit.events;
      const blocked = events.filter((event) => event.kind === "dlp_block").length;
      count.textContent = events.length
        ? `${blocked ? `${blocked} blocked · ` : ""}${events.length} event${events.length === 1 ? "" : "s"}`
        : "no boundary events yet";
      count.classList.toggle("blocked", blocked > 0);
      const shown = events.slice(-LIMIT);
      list.replaceChildren(...shown.map((event) => {
        const item = document.createElement("li");
        item.classList.toggle("block", event.kind === "dlp_block" || event.kind === "policy_denied");
        const time = document.createElement("time");
        time.dateTime = event.ts;
        time.textContent = new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const name = document.createElement("strong");
        name.textContent = label(event.kind);
        const detail = document.createElement("span");
        detail.textContent = describe(event);
        item.append(time, name, detail);
        return item;
      }));
      if (events.length > LIMIT) {
        const more = document.createElement("li");
        const blank = document.createElement("time");
        const note = document.createElement("span");
        note.textContent = `${events.length - LIMIT} earlier event${events.length - LIMIT === 1 ? "" : "s"} in the download`;
        more.append(blank, note);
        list.append(more);
      }
      if (!events.length) {
        status.textContent = "No boundary event yet. Ask the assistant to contact Harbor Hotel.";
        status.className = "receipt-status";
      }
    };
    const verify = async () => {
      const token = ++verifyToken;
      const result = await engine.audit.verify();
      if (token !== verifyToken) return;
      if (!result.ok) {
        status.textContent = `Tamper detected at ${result.at}: ${result.reason}. Download the log before reloading.`;
        status.className = "receipt-status bad";
        return;
      }
      status.textContent = result.checked
        ? `Chain verified: ${result.checked} event${result.checked === 1 ? "" : "s"}, head ${result.head.slice(0, 12)}…`
        : "Nothing to verify yet.";
      status.className = "receipt-status ok";
    };
    const originalAppend = engine.audit.append.bind(engine.audit);
    engine.audit.append = async (kind, fields) => {
      const event = await originalAppend(kind, fields);
      render();
      if (details.open) await verify();
      return event;
    };
    verifyButton?.addEventListener("click", verify);
    downloadButton?.addEventListener("click", () => {
      const exported = engine.audit.export();
      const blob = new Blob([`${JSON.stringify(exported, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trip-relay-audit-${new Date().toISOString().replaceAll(":", "-").replace(/\..+$/, "")}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = `Exported ${exported.events.length} event${exported.events.length === 1 ? "" : "s"} as JSON.`;
      status.className = "receipt-status ok";
    });
    details.addEventListener("toggle", () => {
      if (details.open) verify();
    });
    render();
  }

  /**
   * Open the confirmation dialog: a question, a plain sentence, the readable details,
   * the exact call under "Technical details", and two buttons.
   *
   * :param content: What the dialog says, from dialogContent().
   * :param resolve: Receives true when the visitor confirms, and false otherwise.
   */
  static openDialog(content, resolve) {
    const dialog = document.createElement("dialog");
    dialog.className = "assistant-review";
    dialog.setAttribute("aria-labelledby", "assistant-review-title");
    const heading = document.createElement("h2");
    heading.id = "assistant-review-title";
    heading.textContent = content.title;
    // Start on the heading, which Enter cannot activate, so a stray Enter confirms nothing.
    heading.tabIndex = -1;
    heading.autofocus = true;
    const sentence = document.createElement("p");
    sentence.textContent = content.sentence;
    dialog.append(heading, sentence);
    const exact = document.createElement("details");
    const exactLabel = document.createElement("summary");
    exactLabel.textContent = "Technical details";
    const exactText = document.createElement("pre");
    exactText.textContent = content.exact;
    exact.append(exactLabel, exactText);
    const entries = Object.entries(content.details);
    if (entries.length) {
      const list = document.createElement("dl");
      for (const [label, value] of entries) {
        const term = document.createElement("dt");
        term.textContent = label;
        const description = document.createElement("dd");
        description.textContent = String(value);
        list.append(term, description);
      }
      dialog.append(list);
    } else {
      // Without readable details, open the exact call, so the visitor still sees it.
      exact.open = true;
    }
    const confirmButton = document.createElement("button");
    confirmButton.textContent = content.confirm;
    confirmButton.addEventListener("click", dialog.close.bind(dialog, "confirm"));
    const declineButton = document.createElement("button");
    declineButton.className = "assistant-decline";
    declineButton.textContent = content.decline;
    declineButton.addEventListener("click", dialog.close.bind(dialog, "decline"));
    // Escape also closes the dialog, without "confirm".
    dialog.addEventListener("close", AssistantMount.finishDialog.bind(null, dialog, resolve));
    dialog.append(exact, confirmButton, declineButton);
    document.body.append(dialog);
    dialog.showModal();
  }

  /**
   * Remove the closed dialog and report the visitor's choice.
   *
   * :param dialog: The dialog that just closed.
   * :param resolve: Receives true when the visitor pressed the confirm button.
   */
  static finishDialog(dialog, resolve) {
    dialog.remove();
    resolve(dialog.returnValue === "confirm");
  }

  /**
   * Put focus back in the chat input when a dialog or the consent card left it on the
   * page body. A chat form disables its controls when it is sent, so focus can fall to
   * the body, and the next Tab would start at the top of the page.
   */
  static keepFocusInChat() {
    if (document.activeElement === document.body || document.activeElement === null) {
      document.querySelector("#ns-input")?.focus();
    }
  }
}

// Boot only in a browser. Node tests import this file to check the dialog's words.
if (typeof window !== "undefined") {
  await AssistantMount.start();
}
