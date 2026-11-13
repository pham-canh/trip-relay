// Registers Linden Pharmacy's operations with the agent runtime.
// Only the names in agent-manifest.json "actions.agentTools" become website_* tools.
import { App } from "./app.js";

class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.readStateAction());
    actions.register(SiteActions.requestRefillAction());
  }

  static readStateAction() {
    return {
      name: "get_pharmacy_state",
      description: "Read Linden Pharmacy's services, hours, delivery policy, existing demo refill requests and the current version.",
      effect: "read",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: () => App.page.getState(),
    };
  }

  static requestRefillAction() {
    return {
      name: "request_refill",
      description: "Start a prescription refill request for the named patient. The browser asks the visitor to confirm. Returns a reference code. Does not dispense or deliver anything.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["patientName", "medication", "expectedVersion"],
        properties: {
          patientName: {
            type: "string",
            minLength: 1,
            maxLength: 80,
            description: "The patient's name, as the visitor gave it.",
          },
          medication: {
            type: "string",
            minLength: 1,
            maxLength: 120,
            description: "The medication and strength, such as Amoxicillin 500 mg.",
          },
          expectedVersion: {
            type: "integer",
            minimum: 0,
            description: "The latest version from website_get_pharmacy_state.",
          },
        },
      },
      execute: (args) => App.page.requestRefill(args),
    };
  }
}

export const registerActions = SiteActions.registerActions;
