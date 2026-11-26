// audit-store.js — keep the redacted receipt across reloads in this tab.
//
// The audit log itself is hash-chained and redacts protected values before it
// hashes or stores an event. This module only persists those already-redacted
// events in IndexedDB. It is not a remote WORM store: the browser profile can
// still delete the database, and a production system should ship the same
// events to a trusted server.
//
// Each tab gets a session id in sessionStorage. The id survives a reload, so a
// reload restores that tab's receipt, while a new tab starts with an empty one.

const DB_NAME = "trip-relay-receipts";
const STORE_NAME = "receipts";
const DB_VERSION = 1;
const SESSION_ITEM = "nsweb-audit-session";

function canUseIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      // A newer version in another tab must not leave this connection blocking it.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error || new Error("Could not open the receipt store."));
    request.onblocked = () => reject(new Error("The receipt store is blocked by another tab."));
  });
}

/**
 * The stable id for this tab. A reload keeps it; a new tab gets a new one.
 */
export function auditSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ITEM);
    if (!id) {
      const random = globalThis.crypto?.randomUUID?.()
        || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      id = `aud_${random}`;
      sessionStorage.setItem(SESSION_ITEM, id);
    }
    return id;
  } catch {
    return "";
  }
}

/**
 * Read this tab's stored events, or null when there is nothing to restore.
 *
 * @param {string} sessionId
 * @returns {Promise<Array<object>|null>}
 */
export async function loadAudit(sessionId) {
  if (!canUseIndexedDb() || !sessionId) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(sessionId);
    request.onsuccess = () => {
      const record = request.result;
      resolve(Array.isArray(record?.events) ? record.events : null);
    };
    request.onerror = () => reject(request.error || new Error("Could not read the receipt."));
  });
}

/**
 * Store the current events for this tab. Callers pass the live audit array;
 * every event has already been redacted and hash-chained.
 *
 * @param {string} sessionId
 * @param {Array<object>} events
 */
export async function saveAudit(sessionId, events) {
  if (!canUseIndexedDb() || !sessionId) return false;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      version: 1,
      sessionId,
      savedAt: Date.now(),
      events: (events || []).map((event) => ({ ...event })),
    }, sessionId);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("Could not save the receipt."));
    tx.onabort = () => reject(tx.error || new Error("Could not save the receipt."));
  });
}

/**
 * Delete this tab's stored receipt.
 *
 * @param {string} sessionId
 */
export async function clearAudit(sessionId) {
  if (!canUseIndexedDb() || !sessionId) return false;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(sessionId);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("Could not clear the receipt."));
    tx.onabort = () => reject(tx.error || new Error("Could not clear the receipt."));
  });
}
