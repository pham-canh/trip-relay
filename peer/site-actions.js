// Registers Harbor Hotel's operations with the agent runtime.
// Only the names in agent-manifest.json "actions.agentTools" become website_* tools.
import { App } from "./app.js";

class SiteActions {
  static registerActions(actions) {
    actions.register(SiteActions.readStateAction());
    actions.register(SiteActions.requestRoomAction());
  }

  static readStateAction() {
    return {
      name: "get_hotel_state",
      description: "Read Harbor Hotel's rooms, rates, policies, existing demo room requests and the current version.",
      effect: "read",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: () => App.page.getState(),
    };
  }

  static requestRoomAction() {
    return {
      name: "request_room",
      description: "Start a room request for the named guest, dates and room type. The browser asks the visitor to confirm. Returns a reference code. Does not reserve or charge anything.",
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["guestName", "checkIn", "checkOut", "roomType", "expectedVersion"],
        properties: {
          guestName: {
            type: "string",
            minLength: 1,
            maxLength: 80,
            description: "The guest's name, as the visitor gave it.",
          },
          checkIn: {
            type: "string",
            format: "date",
            description: "Check-in date, YYYY-MM-DD.",
          },
          checkOut: {
            type: "string",
            format: "date",
            description: "Check-out date, YYYY-MM-DD.",
          },
          roomType: {
            type: "string",
            enum: App.page.roomIds(),
            description: "A room id from website_get_hotel_state.",
          },
          expectedVersion: {
            type: "integer",
            minimum: 0,
            description: "The latest version from website_get_hotel_state.",
          },
        },
      },
      execute: (args) => App.page.requestRoom(args),
    };
  }
}

export const registerActions = SiteActions.registerActions;
