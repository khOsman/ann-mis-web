import { useEffect, useState } from "react";
import { subscribeToCollection, subscribeToDocument } from "./liveQueryController";

/**
 * Live-updating collection query. Same { data, loading, error } shape as
 * the app's older one-time-fetch hooks, so most pages need no changes
 * beyond swapping the hook import.
 *
 * @param {string|null|undefined} cacheKey - pass null/undefined to skip subscribing
 * @param {() => import("firebase/firestore").Query} queryFactory
 * @param {(doc: import("firebase/firestore").QueryDocumentSnapshot) => any} mapFn
 * @param {any[]} deps - effect dependencies (should include cacheKey)
 */
export function useLiveCollection(cacheKey, queryFactory, mapFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cacheKey) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToCollection(cacheKey, queryFactory, mapFn, (docs, err) => {
      setError(err || null);
      if (!err) setData(docs || []);
      setLoading(false);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

/**
 * Live-updating single-document subscription.
 *
 * @param {string|null|undefined} cacheKey - pass null/undefined to skip subscribing
 * @param {() => import("firebase/firestore").DocumentReference} docRefFactory
 * @param {any[]} deps - effect dependencies (should include cacheKey)
 */
export function useLiveDocument(cacheKey, docRefFactory, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cacheKey) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToDocument(cacheKey, docRefFactory, (doc, err) => {
      setError(err || null);
      if (!err) setData(doc);
      setLoading(false);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
