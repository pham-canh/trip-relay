const ROUTE = {
  from: "Ho Chi Minh City (SGN)",
  to: "Da Nang (DAD)",
  code: "SGN → DAD",
};

const AIRLINE = {
  name: "Skyline Air",
  hub: "Da Nang (DAD)",
  phone: "+84 28 5550 0102",
  hours: "Daily, 05:00–23:00",
};

const HOTEL = {
  name: "Harbor Hotel",
  origin: "https://pham-canh.github.io.",
  network: "https://pham-canh.github.io./harbor_hotel",
};

const DEPARTURES = [
  { depart: "08:10", arrive: "09:35", number: "SKY 210", fare: "Eco", price: 68 },
  { depart: "13:40", arrive: "15:05", number: "SKY 214", fare: "Eco", price: 74 },
  { depart: "18:20", arrive: "19:45", number: "SKY 218", fare: "Flex", price: 96 },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function localDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function makeFlights() {
  const flights = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let offset = 1; offset <= 3; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    for (const departure of DEPARTURES) {
      flights.push({
        id: `flight-${localDateKey(day)}-${departure.depart.replace(":", "")}`,
        date: localDateKey(day),
        dateLabel: day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        from: ROUTE.from,
        to: ROUTE.to,
        ...departure,
      });
    }
  }
  return flights;
}

const FLIGHTS = makeFlights();

const state = {
  version: 0,
  selectedFlightId: null,
  bookings: [],
};

function flightById(id) {
  return FLIGHTS.find((flight) => flight.id === id) || null;
}

function availableFlights() {
  const booked = new Set(state.bookings.map((booking) => booking.flightId));
  return FLIGHTS.filter((flight) => !booked.has(flight.id));
}

function selectedFlight() {
  return state.selectedFlightId ? flightById(state.selectedFlightId) : null;
}

function reference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(5);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return `SKY-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

function refusal(reason, field) {
  return field ? { ok: false, reason, field } : { ok: false, reason };
}

/**
 * The page object the assistant and the manual UI share.
 *
 * Every method returns plain JSON data so the runtime can use it as a tool result.
 */
export class App {
  static page = {
    airline: AIRLINE,
    route: ROUTE,
    hotel: HOTEL,

    flightIds() {
      return availableFlights().map((flight) => flight.id);
    },

    getState() {
      return {
        version: state.version,
        airline: AIRLINE,
        route: ROUTE,
        flights: availableFlights(),
        selected: selectedFlight(),
        bookings: state.bookings,
        hotel: {
          name: HOTEL.name,
          origin: HOTEL.origin,
          network: HOTEL.network,
          note: "A separate agentic website. The airline assistant asks it what it offers; it cannot see this chat, the passenger's email, or the booking.",
        },
      };
    },

    selectFlight(id) {
      if (typeof id !== "string" || id.length === 0) {
        return refusal("Choose a flight id from the current schedule.", "id");
      }
      const flight = flightById(id);
      if (!flight) {
        return refusal("That flight is not on this schedule. Read the current flights again.", "id");
      }
      if (state.bookings.some((booking) => booking.flightId === id)) {
        return refusal("That flight was just booked. Choose another one.", "id");
      }
      state.selectedFlightId = id;
      state.version += 1;
      render();
      return this.getState();
    },

    checkBooking(args = {}) {
      const passengerName = typeof args.passengerName === "string" ? args.passengerName.trim() : "";
      const email = typeof args.email === "string" ? args.email.trim() : "";
      if (passengerName.length < 1 || passengerName.length > 80) {
        return refusal("Enter the passenger's name, between 1 and 80 characters.", "passengerName");
      }
      if (email.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return refusal("Enter an email for the ticket, such as alex@example.com.", "email");
      }
      if (!Number.isInteger(args.expectedVersion)) {
        return refusal("Read the current flight state first; expectedVersion is required.", "expectedVersion");
      }
      if (args.expectedVersion !== state.version) {
        return refusal("The page changed. Read the current flight state again before booking.", "expectedVersion");
      }
      const flight = selectedFlight();
      if (!flight) {
        return refusal("No flight is selected. Select a flight before booking.", "id");
      }
      if (state.bookings.some((booking) => booking.flightId === flight.id)) {
        return refusal("That flight was just booked. Choose another one.", "id");
      }
      return { ok: true, passengerName, email, flight };
    },

    bookFlight(args = {}) {
      const check = App.page.checkBooking(args);
      if (!check.ok) {
        return check;
      }
      const flight = check.flight;
      const receipt = {
        reference: reference(),
        passengerName: check.passengerName,
        email: check.email,
        flightId: flight.id,
        number: flight.number,
        route: ROUTE.code,
        date: flight.dateLabel,
        depart: flight.depart,
        arrive: flight.arrive,
        fare: flight.fare,
        price: flight.price,
        bookedAt: new Date().toISOString(),
      };
      state.bookings.push(receipt);
      state.selectedFlightId = null;
      state.version += 1;
      render();
      return {
        ok: true,
        reference: receipt.reference,
        passenger: receipt.passengerName,
        flight: {
          number: receipt.number,
          route: receipt.route,
          date: receipt.date,
          depart: receipt.depart,
          arrive: receipt.arrive,
          fare: receipt.fare,
          price: receipt.price,
        },
        version: state.version,
      };
    },

    reset() {
      state.version += 1;
      state.selectedFlightId = null;
      state.bookings = [];
      render();
      return this.getState();
    },
  };
}

function flightButton(flight) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "flight";
  button.dataset.flightId = flight.id;
  button.setAttribute("aria-pressed", String(state.selectedFlightId === flight.id));
  const day = document.createElement("span");
  day.className = "day";
  day.textContent = flight.dateLabel;
  const time = document.createElement("span");
  time.className = "time";
  time.textContent = `${flight.depart} → ${flight.arrive}`;
  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = `${flight.number} · ${flight.fare} · $${flight.price}`;
  button.append(day, time, meta);
  button.addEventListener("click", () => {
    App.page.selectFlight(flight.id);
  });
  return button;
}

function render() {
  const list = document.querySelector("#flight-list");
  const empty = document.querySelector("#flight-empty");
  const selection = document.querySelector("#selection");
  const bookButton = document.querySelector("#book-button");
  const bookings = document.querySelector("#bookings");
  if (!list || !empty || !selection || !bookButton || !bookings) {
    return;
  }

  const open = availableFlights();
  list.replaceChildren(...open.map(flightButton));
  empty.hidden = open.length > 0;
  list.hidden = open.length === 0;

  const flight = selectedFlight();
  selection.textContent = flight
    ? `Selected: ${flight.dateLabel}, ${flight.depart}–${flight.arrive}, ${flight.number} (${flight.fare}, $${flight.price}).`
    : "No flight selected yet.";
  bookButton.disabled = !flight;

  bookings.replaceChildren(
    ...state.bookings.map((booking) => {
      const receipt = document.createElement("p");
      receipt.className = "receipt";
      const text = document.createElement("span");
      text.textContent = `${booking.date} ${booking.depart} · ${booking.number} · ${booking.passengerName}`;
      const code = document.createElement("strong");
      code.textContent = booking.reference;
      receipt.append(text, code);
      return receipt;
    }),
  );
}

function wirePage() {
  render();
  const form = document.querySelector("#booking-form");
  if (!form) {
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#passenger-name");
    const email = document.querySelector("#passenger-email");
    const result = App.page.bookFlight({
      passengerName: name ? name.value : "",
      email: email ? email.value : "",
      expectedVersion: state.version,
    });
    if (!result.ok) {
      window.alert(result.reason);
      return;
    }
    if (name) {
      name.value = "";
    }
    if (email) {
      email.value = "";
    }
  });
  const reset = document.querySelector("#reset-demo");
  if (reset) {
    reset.addEventListener("click", () => App.page.reset());
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wirePage);
} else {
  wirePage();
}
