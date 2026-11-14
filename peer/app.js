const HOTEL = {
  name: "Harbor Hotel",
  address: "12 Harbor Quay, Da Nang",
  phone: "+84 236 5550 0142",
  hours: "Front desk 24/7",
  checkIn: "14:00",
  checkOut: "12:00",
  shuttle: "Free airport shuttle, 07:00–22:00",
};

const ROOMS = [
  { id: "harbor-double", name: "Harbor Double", rate: 84, detail: "Queen bed · city side · 24 m² · breakfast" },
  { id: "skyline-king", name: "Skyline King", rate: 112, detail: "King bed · harbor view · 32 m² · breakfast" },
  { id: "family-suite", name: "Family Suite", rate: 156, detail: "Two rooms · breakfast for four · 48 m²" },
];

const POLICIES = {
  cancellation: "Free cancellation until 48 hours before check-in",
  checkIn: "Check-in from 14:00",
  checkOut: "Check-out by 12:00",
  shuttle: "Free airport shuttle, 07:00–22:00",
  payment: "No payment is taken in this demo",
};

const state = {
  version: 0,
  requests: [],
};

function refusal(reason, field) {
  return field ? { ok: false, reason, field } : { ok: false, reason };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function localDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function futureDateKey(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function dayNumber(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof key === "string" ? key : "");
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    return null;
  }
  return Math.floor(utc.getTime() / 86400000);
}

function todayNumber() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
}

function roomById(id) {
  return ROOMS.find((room) => room.id === id) || null;
}

function reference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(4);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return `HBR-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

/**
 * The page object the hotel assistant and the manual UI share.
 */
export class App {
  static page = {
    hotel: HOTEL,
    rooms: ROOMS,
    policies: POLICIES,

    roomIds() {
      return ROOMS.map((room) => room.id);
    },

    getState() {
      return {
        version: state.version,
        hotel: HOTEL,
        rooms: ROOMS,
        policies: POLICIES,
        requests: state.requests,
        today: localDateKey(new Date()),
        note: "No live room inventory or payment is exposed here.",
      };
    },

    checkRoom(args = {}) {
      const guestName = typeof args.guestName === "string" ? args.guestName.trim() : "";
      if (guestName.length < 1 || guestName.length > 80) {
        return refusal("Enter the guest's name, between 1 and 80 characters.", "guestName");
      }
      const room = roomById(args.roomType);
      if (!room) {
        return refusal("Choose a room type from the current list.", "roomType");
      }
      const checkInDay = dayNumber(args.checkIn);
      if (checkInDay === null) {
        return refusal("Choose a check-in date, such as 2026-12-12.", "checkIn");
      }
      const checkOutDay = dayNumber(args.checkOut);
      if (checkOutDay === null) {
        return refusal("Choose a check-out date, such as 2026-12-14.", "checkOut");
      }
      if (checkInDay < todayNumber()) {
        return refusal("Check-in must be today or later.", "checkIn");
      }
      const nights = checkOutDay - checkInDay;
      if (nights < 1) {
        return refusal("Check-out must be after check-in.", "checkOut");
      }
      if (nights > 14) {
        return refusal("This demo takes stays of up to 14 nights.", "checkOut");
      }
      if (!Number.isInteger(args.expectedVersion)) {
        return refusal("Read the current hotel state first; expectedVersion is required.", "expectedVersion");
      }
      if (args.expectedVersion !== state.version) {
        return refusal("The page changed. Read the current hotel state again.", "expectedVersion");
      }
      return { ok: true, guestName, room, checkIn: args.checkIn, checkOut: args.checkOut, nights, total: room.rate * nights };
    },

    requestRoom(args = {}) {
      const check = App.page.checkRoom(args);
      if (!check.ok) {
        return check;
      }
      const request = {
        reference: reference(),
        guestName: check.guestName,
        roomId: check.room.id,
        roomName: check.room.name,
        checkIn: check.checkIn,
        checkOut: check.checkOut,
        nights: check.nights,
        total: check.total,
        requestedAt: new Date().toISOString(),
      };
      state.requests.push(request);
      state.version += 1;
      render();
      return {
        ok: true,
        reference: request.reference,
        guest: request.guestName,
        room: request.roomName,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        nights: request.nights,
        total: request.total,
        version: state.version,
        note: "This demo does not reserve a room. A real front desk would confirm the request.",
      };
    },

    reset() {
      state.version += 1;
      state.requests = [];
      render();
      return this.getState();
    },
  };
}

function render() {
  const requests = document.querySelector("#requests");
  if (!requests) {
    return;
  }
  requests.replaceChildren(
    ...state.requests.map((request) => {
      const receipt = document.createElement("p");
      receipt.className = "receipt";
      const text = document.createElement("span");
      text.textContent = `${request.roomName} · ${request.checkIn} → ${request.checkOut} · ${request.guestName}`;
      const code = document.createElement("strong");
      code.textContent = request.reference;
      receipt.append(text, code);
      return receipt;
    }),
  );
}

function wirePage() {
  render();
  const checkIn = document.querySelector("#check-in");
  const checkOut = document.querySelector("#check-out");
  if (checkIn && !checkIn.value) {
    checkIn.value = futureDateKey(1);
  }
  if (checkOut && !checkOut.value) {
    checkOut.value = futureDateKey(3);
  }
  const form = document.querySelector("#request-form");
  if (!form) {
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const guest = document.querySelector("#guest-name");
    const room = document.querySelector("#room-type");
    const result = App.page.requestRoom({
      guestName: guest ? guest.value : "",
      roomType: room ? room.value : "",
      checkIn: checkIn ? checkIn.value : "",
      checkOut: checkOut ? checkOut.value : "",
      expectedVersion: state.version,
    });
    if (!result.ok) {
      window.alert(result.reason);
      return;
    }
    if (guest) {
      guest.value = "";
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wirePage);
} else {
  wirePage();
}
