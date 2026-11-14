// Registers Skyline Air's operations with the agent runtime.
// Only the names in agent-manifest.json "actions.agentTools" become website_* tools.
import { App } from "./app.js";

class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.readStateAction());
    actions.register(SiteActions.selectFlightAction());
    actions.register(SiteActions.bookFlightAction());
  }

  static readStateAction() {
    return {
      name: "get_airline_state",
      description: "Read Skyline Air's route, flights, fares, the currently selected flight, existing bookings and the hotel link. Returns version, which a booking needs.",
      effect: "read",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: () => App.page.getState(),
    };
  }

  static selectFlightAction() {
    return {
      name: "select_flight",
      description: "Select one flight and fare on the page. Reversible. Returns the updated state with a new version. Does not book.",
      effect: "write",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string",
            enum: App.page.flightIds(),
            description: "A flight id from website_get_airline_state.",
          },
        },
      },
      execute: (args) => App.page.selectFlight(args.id),
    };
  }

  static bookFlightAction() {
    return {
      name: "book_flight",
      description: "Book the selected flight for the named passenger. The browser asks the visitor to confirm. Refuses a stale expectedVersion. Returns a reference code. Takes no payment.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["passengerName", "email", "expectedVersion"],
        properties: {
          passengerName: {
            type: "string",
            minLength: 1,
            maxLength: 80,
            description: "The passenger's name, as the visitor gave it.",
          },
          email: {
            type: "string",
            minLength: 3,
            maxLength: 120,
            description: "The email for the ticket, as the visitor gave it.",
          },
          expectedVersion: {
            type: "integer",
            minimum: 0,
            description: "The latest version from website_get_airline_state, read in this turn.",
          },
        },
      },
      execute: (args) => App.page.bookFlight(args),
    };
  }
}

export const registerActions = SiteActions.registerActions;
