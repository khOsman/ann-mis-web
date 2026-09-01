import { onSnapshot } from "firebase/firestore";

// One Firestore listener per distinct cacheKey, shared by every consumer in
// this browser tab (a modal and its parent page asking for the same data
// reuse one listener instead of opening two). Listener is torn down the
// moment the last subscriber unsubscribes, so idle/unmounted pages don't
// keep costing reads.
const registry = new Map();

function getOrCreateEntry(cacheKey, attach) {
  let entry = registry.get(cacheKey);

  if (!entry) {
    entry = {
      subscribers: new Set(),
      latestData: undefined,
      latestError: null,
      hasData: false,
      unsubscribeFn: null,
    };
    registry.set(cacheKey, entry);
    entry.unsubscribeFn = attach(entry);
  }

  return entry;
}

function subscribe(cacheKey, entry, onUpdate) {
  entry.subscribers.add(onUpdate);

  // Replay the last-known snapshot immediately so a late subscriber isn't
  // stuck "loading" while an already-attached listener sits between events.
  if (entry.hasData || entry.latestError) {
    onUpdate(entry.latestData, entry.latestError);
  }

  return () => {
    entry.subscribers.delete(onUpdate);

    if (entry.subscribers.size === 0) {
      entry.unsubscribeFn();
      registry.delete(cacheKey);
    }
  };
}

/**
 * Subscribes to a Firestore collection/compound query, deduped by cacheKey.
 * @param {string} cacheKey - unique identifier for this exact query shape
 * @param {() => import("firebase/firestore").Query} queryFactory
 * @param {(doc: import("firebase/firestore").QueryDocumentSnapshot) => any} mapFn
 * @param {(data: any[] | undefined, error: Error | null) => void} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeToCollection(cacheKey, queryFactory, mapFn, onUpdate) {
  const entry = getOrCreateEntry(cacheKey, (entry) =>
    onSnapshot(
      queryFactory(),
      (snapshot) => {
        entry.latestData = snapshot.docs.map(mapFn);
        entry.latestError = null;
        entry.hasData = true;
        entry.subscribers.forEach((cb) => cb(entry.latestData, null));
      },
      (error) => {
        console.error(`Live collection listener failed [${cacheKey}]:`, error);
        entry.latestError = error;
        entry.subscribers.forEach((cb) => cb(entry.latestData, error));
      }
    )
  );

  return subscribe(cacheKey, entry, onUpdate);
}

/**
 * Subscribes to a single Firestore document, deduped by cacheKey.
 * @param {string} cacheKey - unique identifier for this document
 * @param {() => import("firebase/firestore").DocumentReference} docRefFactory
 * @param {(data: object | null, error: Error | null) => void} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeToDocument(cacheKey, docRefFactory, onUpdate) {
  const entry = getOrCreateEntry(cacheKey, (entry) =>
    onSnapshot(
      docRefFactory(),
      (snapshot) => {
        entry.latestData = snapshot.exists()
          ? { ...snapshot.data(), id: snapshot.id }
          : null;
        entry.latestError = null;
        entry.hasData = true;
        entry.subscribers.forEach((cb) => cb(entry.latestData, null));
      },
      (error) => {
        console.error(`Live document listener failed [${cacheKey}]:`, error);
        entry.latestError = error;
        entry.subscribers.forEach((cb) => cb(entry.latestData, error));
      }
    )
  );

  return subscribe(cacheKey, entry, onUpdate);
}
