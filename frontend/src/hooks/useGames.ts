import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, GAMES_COLLECTION, isFirebaseConfigured } from "../lib/firebase";
import { gameFromDoc } from "../lib/gameMapper";
import { seedGames } from "../data/seedGames";
import type { Game } from "../types";

const LOCAL_STORAGE_KEY = "pixel_store_games";

export function useGames() {
  const [games, setGames] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return seedGames;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const listenToFirestore = useCallback(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const unsub = onSnapshot(
      collection(db, GAMES_COLLECTION),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((docSnap) =>
            gameFromDoc(docSnap.id, docSnap.data())
          );
          setGames(loaded);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loaded));
          } catch {
            // ignore
          }
        }
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore snapshot error (using fallback games):", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = listenToFirestore();
    return () => unsub();
  }, [listenToFirestore]);

  return {
    games,
    loading,
    error,
    configured: isFirebaseConfigured,
    refresh: listenToFirestore,
  };
}
