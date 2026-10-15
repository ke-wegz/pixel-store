import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, GAMES_COLLECTION, isFirebaseConfigured } from "../lib/firebase";
import { gameFromDoc } from "../lib/gameMapper";
import type { Game } from "../types";

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const listenToFirestore = useCallback(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      setError("Firebase is not configured.");
      return () => {};
    }

    setLoading(true);
    const unsub = onSnapshot(
      collection(db, GAMES_COLLECTION),
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) =>
          gameFromDoc(docSnap.id, docSnap.data())
        );
        setGames(loaded);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
        setError(err.message);
        setGames([]);
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
