const PHARMACY = {
  name: "Linden Pharmacy",
  address: "4 Linden Lane, District 2",
  phone: "+84 28 5550 0421",
  hours: "Mon–Sat 08:00–19:00 · Sun 10:00–16:00",
  delivery: "Same-day in the district for requests before 15:00",
};

const SERVICES = [
  { name: "Prescription refill intake", detail: "A pharmacist reviews the request before anything is prepared." },
  { name: "Medication review", detail: "A 15-minute conversation about current medicines, timing and side effects." },
  { name: "Local delivery", detail: "Same-day delivery in the district for requests before 15:00." },
];

const state = {
  version: 0,
  requests: [],
};

function refusal(reason, field) {
  return field ? { ok: false, reason, field } : { ok: false, reason };
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
  return `LP-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

/**
 * The page object the pharmacy assistant and the manual UI share.
 */
export class App {
  static page = {
    pharmacy: PHARMACY,
    services: SERVICES,

    getState() {
      return {
        version: state.version,
        pharmacy: PHARMACY,
        services: SERVICES,
        requests: state.requests,
        note: "No live stock, prices, insurance checks or controlled-substance requests are exposed here.",
      };
    },

    checkRefill(args = {}) {
      const patientName = typeof args.patientName === "string" ? args.patientName.trim() : "";
      const medication = typeof args.medication === "string" ? args.medication.trim() : "";
      if (patientName.length < 1 || patientName.length > 80) {
        return refusal("Enter the patient's name, between 1 and 80 characters.", "patientName");
      }
      if (medication.length < 1 || medication.length > 120) {
        return refusal("Enter the medication and strength, between 1 and 120 characters.", "medication");
      }
      if (!Number.isInteger(args.expectedVersion)) {
        return refusal("Read the current pharmacy state first; expectedVersion is required.", "expectedVersion");
      }
      if (args.expectedVersion !== state.version) {
        return refusal("The page changed. Read the current pharmacy state again.", "expectedVersion");
      }
      return { ok: true, patientName, medication };
    },

    requestRefill(args = {}) {
      const check = App.page.checkRefill(args);
      if (!check.ok) {
        return check;
      }
      const request = {
        reference: reference(),
        patientName: check.patientName,
        medication: check.medication,
        requestedAt: new Date().toISOString(),
      };
      state.requests.push(request);
      state.version += 1;
      render();
      return {
        ok: true,
        reference: request.reference,
        medication: request.medication,
        version: state.version,
        note: "This demo does not send the request to a pharmacy. A real intake would now wait for a pharmacist.",
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
      text.textContent = `${request.medication} · ${request.patientName}`;
      const code = document.createElement("strong");
      code.textContent = request.reference;
      receipt.append(text, code);
      return receipt;
    }),
  );
}

function wirePage() {
  render();
  const form = document.querySelector("#refill-form");
  if (!form) {
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#patient-name");
    const medication = document.querySelector("#medication");
    const result = App.page.requestRefill({
      patientName: name ? name.value : "",
      medication: medication ? medication.value : "",
      expectedVersion: state.version,
    });
    if (!result.ok) {
      window.alert(result.reason);
      return;
    }
    if (name) {
      name.value = "";
    }
    if (medication) {
      medication.value = "";
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wirePage);
} else {
  wirePage();
}
