import { useState, useEffect, useCallback } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db, BUNDLES_COLLECTION, isFirebaseConfigured } from "../lib/firebase";
import type { Bundle } from "../types";

export function useBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, BUNDLES_COLLECTION),
      (snapshot) => {
        const list: Bundle[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || d.id),
            nameAr: data.nameAr ? String(data.nameAr) : undefined,
            description: data.description ? String(data.description) : "",
            price: Number(data.price || 0),
            gameIds: Array.isArray(data.gameIds)
              ? data.gameIds.map((g: unknown) => String(g))
              : [],
            coverImage: data.coverImage ? String(data.coverImage) : "",
            badge: data.badge ? String(data.badge) : "",
            inStock: data.inStock !== false,
            featured: Boolean(data.featured),
            createdAt: data.createdAt ? String(data.createdAt) : undefined,
            updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
          };
        });
        setBundles(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Bundles snapshot error:", err);
        setError(err.message);
        setBundles([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const saveBundle = useCallback(async (bundle: Bundle) => {
    const id = bundle.id.trim();
    if (!id || !bundle.name.trim()) {
      throw new Error("Bundle ID and Name are required.");
    }
    if (!bundle.gameIds || bundle.gameIds.length === 0) {
      throw new Error("Please select at least one game to bundle.");
    }

    const now = new Date().toISOString();
    const cleanBundle: Bundle = {
      ...bundle,
      id,
      name: bundle.name.trim(),
      nameAr: bundle.nameAr?.trim() || undefined,
      description: bundle.description?.trim() || "",
      price: Number(bundle.price) || 0,
      gameIds: bundle.gameIds,
      coverImage: bundle.coverImage?.trim() || "",
      badge: bundle.badge?.trim() || "",
      inStock: bundle.inStock !== false,
      featured: Boolean(bundle.featured),
      createdAt: bundle.createdAt || now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      const payload: Record<string, unknown> = {
        name: cleanBundle.name,
        nameAr: cleanBundle.nameAr || null,
        description: cleanBundle.description || null,
        price: cleanBundle.price,
        gameIds: cleanBundle.gameIds,
        coverImage: cleanBundle.coverImage || null,
        badge: cleanBundle.badge || null,
        inStock: cleanBundle.inStock,
        featured: cleanBundle.featured,
        createdAt: cleanBundle.createdAt,
        updatedAt: cleanBundle.updatedAt,
      };
      await setDoc(doc(db, BUNDLES_COLLECTION, id), payload, { merge: true });
    }

    setBundles((prev) => {
      const exists = prev.some((b) => b.id === id);
      return exists
        ? prev.map((b) => (b.id === id ? cleanBundle : b))
        : [cleanBundle, ...prev];
    });
  }, []);

  const deleteBundle = useCallback(async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, BUNDLES_COLLECTION, id));
    }
    setBundles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    bundles,
    loading,
    error,
    saveBundle,
    deleteBundle,
  };
}

