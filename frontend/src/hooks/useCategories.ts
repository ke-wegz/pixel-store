import { useState, useEffect, useCallback } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { DEFAULT_CATEGORIES, type Category } from "../types";
import { slugify } from "../lib/gameMapper";

export const CATEGORIES_COLLECTION = "categories";
const LOCAL_STORAGE_KEY = "pixel_store_custom_categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_CATEGORIES;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore realtime sync
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, CATEGORIES_COLLECTION),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Category[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              nameEn: String(data.nameEn || d.id),
              nameAr: String(data.nameAr || data.nameEn || d.id),
              createdAt: data.createdAt,
            };
          });
          setCategories(list);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
          } catch {
            // ignore
          }
        } else {
          // If empty in Firestore, seed defaults locally and show defaults
          setCategories(DEFAULT_CATEGORIES);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Categories snapshot warning (using defaults):", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const addCategory = useCallback(
    async (item: { id?: string; nameEn: string; nameAr: string }) => {
      const nameEn = item.nameEn.trim();
      const nameAr = item.nameAr.trim() || nameEn;
      const id = slugify(item.id?.trim() || nameEn);

      if (!id || !nameEn) {
        throw new Error("Category name is required.");
      }

      const newCat: Category = {
        id,
        nameEn,
        nameAr,
        createdAt: new Date().toISOString(),
      };

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, CATEGORIES_COLLECTION, id), newCat, { merge: true });
      }

      setCategories((prev) => {
        const exists = prev.some((c) => c.id === id);
        const next = exists ? prev.map((c) => (c.id === id ? newCat : c)) : [...prev, newCat];
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    }
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
  };
}
