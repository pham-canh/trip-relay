// Registers Riverside Clinic's operations with the agent runtime.
// Only the names in agent-manifest.json "actions.agentTools" become website_* tools.
import { App } from "./app.js";

class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.readStateAction());
    actions.register(SiteActions.selectSlotAction());
    actions.register(SiteActions.bookSlotAction());
  }

  static readStateAction() {
    return {
      name: "get_clinic_state",
      description: "Read Riverside Clinic's doctors, open appointment slots, the currently selected slot, existing bookings and the pharmacy link. Returns version, which a booking needs.",
      effect: "read",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: () => App.page.getState(),
    };
  }

  static selectSlotAction() {
    return {
      name: "select_slot",
      description: "Select one open appointment slot on the page. Reversible. Returns the updated state with a new version. Does not book.",
      effect: "write",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string",
            enum: App.page.slotIds(),
            description: "A slot id from website_get_clinic_state.",
          },
        },
      },
      execute: (args) => App.page.selectSlot(args.id),
    };
  }

  static bookSlotAction() {
    return {
      name: "book_slot",
      description: "Book the selected appointment for the named patient. The browser asks the visitor to confirm. Refuses a stale expectedVersion. Returns a reference code.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["patientName", "expectedVersion"],
        properties: {
          patientName: {
            type: "string",
            minLength: 1,
            maxLength: 80,
            description: "The patient's name, as the visitor gave it.",
          },
          expectedVersion: {
            type: "integer",
            minimum: 0,
            description: "The latest version from website_get_clinic_state, read in this turn.",
          },
        },
      },
      execute: (args) => App.page.bookSlot(args),
    };
  }
}

export const registerActions = SiteActions.registerActions;
