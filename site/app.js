const DOCTORS = [
  { id: "linh", name: "Dr. Linh Tran", specialty: "Cardiology" },
  { id: "minh", name: "Dr. Minh Pham", specialty: "General practice" },
  { id: "an", name: "Dr. An Vo", specialty: "Dermatology" },
];

const SPECIALTIES = ["Cardiology", "General practice", "Dermatology"];

const CLINIC = {
  name: "Riverside Clinic",
  address: "18 Riverside Walk, District 2",
  phone: "+84 28 5550 0188",
  hours: "Mon–Sat, 08:00–17:00",
};

const PEER = {
  name: "Linden Pharmacy",
  origin: "http://localhost:8081",
  network: "http://localhost:8081/pharmacy",
  services: [
    "Prescription refill intake",
    "Medication review with a pharmacist",
    "Same-day local delivery (order before 15:00)",
  ],
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function localDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function makeSlots() {
  const slots = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  let index = 0;
  for (let offset = 1; offset < 15 && slots.length < 9; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    if (day.getDay() === 0) {
      continue;
    }
    for (const time of ["09:00", "10:30", "14:00"]) {
      if (slots.length >= 9) {
        break;
      }
      const doctor = DOCTORS[index % DOCTORS.length];
      slots.push({
        id: `slot-${localDateKey(day)}-${time.replace(":", "")}`,
        date: localDateKey(day),
        dateLabel: day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
      });
      index += 1;
    }
  }
  return slots;
}

const SLOTS = makeSlots();

const state = {
  version: 0,
  selectedSlotId: null,
  bookings: [],
};

function slotById(id) {
  return SLOTS.find((slot) => slot.id === id) || null;
}

function availableSlots() {
  const booked = new Set(state.bookings.map((booking) => booking.slotId));
  return SLOTS.filter((slot) => !booked.has(slot.id));
}

function selectedSlot() {
  return state.selectedSlotId ? slotById(state.selectedSlotId) : null;
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
  return `RVC-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
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
    clinic: CLINIC,
    peer: PEER,

    slotIds() {
      return availableSlots().map((slot) => slot.id);
    },

    getState() {
      return {
        version: state.version,
        clinic: CLINIC,
        specialties: SPECIALTIES,
        doctors: DOCTORS,
        slots: availableSlots(),
        selected: selectedSlot(),
        bookings: state.bookings,
        pharmacy: {
          name: PEER.name,
          origin: PEER.origin,
          network: PEER.network,
          services: PEER.services,
          note: "A separate agentic website. The clinic assistant asks it what it offers; it cannot see this chat or the booking.",
        },
      };
    },

    selectSlot(id) {
      if (typeof id !== "string" || id.length === 0) {
        return refusal("Choose a slot id from the current schedule.", "id");
      }
      const slot = slotById(id);
      if (!slot) {
        return refusal("That slot is not on this schedule. Read the current slots again.", "id");
      }
      if (state.bookings.some((booking) => booking.slotId === id)) {
        return refusal("That slot was just booked. Choose another one.", "id");
      }
      state.selectedSlotId = id;
      state.version += 1;
      render();
      return this.getState();
    },

    checkBooking(args = {}) {
      const patientName = typeof args.patientName === "string" ? args.patientName.trim() : "";
      if (patientName.length < 1 || patientName.length > 80) {
        return refusal("Enter the patient's name, between 1 and 80 characters.", "patientName");
      }
      if (!Number.isInteger(args.expectedVersion)) {
        return refusal("Read the current clinic state first; expectedVersion is required.", "expectedVersion");
      }
      if (args.expectedVersion !== state.version) {
        return refusal("The page changed. Read the current clinic state again before booking.", "expectedVersion");
      }
      const slot = selectedSlot();
      if (!slot) {
        return refusal("No slot is selected. Select a slot before booking.", "id");
      }
      if (state.bookings.some((booking) => booking.slotId === slot.id)) {
        return refusal("That slot was just booked. Choose another one.", "id");
      }
      return { ok: true, patientName, slot };
    },

    bookSlot(args = {}) {
      const check = App.page.checkBooking(args);
      if (!check.ok) {
        return check;
      }
      const slot = check.slot;
      const patientName = check.patientName;
      const receipt = {
        reference: reference(),
        patientName,
        slotId: slot.id,
        doctorName: slot.doctorName,
        specialty: slot.specialty,
        date: slot.dateLabel,
        time: slot.time,
        bookedAt: new Date().toISOString(),
      };
      state.bookings.push(receipt);
      state.selectedSlotId = null;
      state.version += 1;
      render();
      return {
        ok: true,
        reference: receipt.reference,
        slot: {
          doctorName: slot.doctorName,
          specialty: slot.specialty,
          date: slot.dateLabel,
          time: slot.time,
        },
        version: state.version,
      };
    },

    reset() {
      state.version += 1;
      state.selectedSlotId = null;
      state.bookings = [];
      render();
      return this.getState();
    },
  };
}

function slotButton(slot) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slot";
  button.dataset.slotId = slot.id;
  button.setAttribute("aria-pressed", String(state.selectedSlotId === slot.id));
  const day = document.createElement("span");
  day.className = "day";
  day.textContent = slot.dateLabel;
  const time = document.createElement("span");
  time.className = "time";
  time.textContent = slot.time;
  const doctor = document.createElement("span");
  doctor.className = "doctor";
  doctor.textContent = `${slot.doctorName} · ${slot.specialty}`;
  button.append(day, time, doctor);
  button.addEventListener("click", () => {
    App.page.selectSlot(slot.id);
  });
  return button;
}

function render() {
  const list = document.querySelector("#slot-list");
  const empty = document.querySelector("#slot-empty");
  const selection = document.querySelector("#selection");
  const bookButton = document.querySelector("#book-button");
  const bookings = document.querySelector("#bookings");
  if (!list || !empty || !selection || !bookButton || !bookings) {
    return;
  }

  list.replaceChildren(...availableSlots().map(slotButton));
  const open = availableSlots();
  empty.hidden = open.length > 0;
  list.hidden = open.length === 0;

  const slot = selectedSlot();
  selection.textContent = slot
    ? `Selected: ${slot.dateLabel} at ${slot.time} with ${slot.doctorName}.`
    : "No slot selected yet.";
  bookButton.disabled = !slot;

  bookings.replaceChildren(
    ...state.bookings.map((booking) => {
      const receipt = document.createElement("p");
      receipt.className = "receipt";
      const text = document.createElement("span");
      text.textContent = `${booking.date} at ${booking.time} · ${booking.doctorName} · ${booking.patientName}`;
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
    const input = document.querySelector("#patient-name");
    const result = App.page.bookSlot({
      patientName: input ? input.value : "",
      expectedVersion: state.version,
    });
    if (!result.ok) {
      window.alert(result.reason);
      return;
    }
    if (input) {
      input.value = "";
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
