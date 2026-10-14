import { useState, useEffect, useCallback } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { DEFAULT_CATEGORIES, type Category } from "../types";
import { slugify } from "../lib/gameMapper";

export const CATEGORIES_COLLECTION = "categories";
const LOCAL_STORAGE_KEY = "pixel_store_custom_categories";

function mergeWithDefaults(remoteList: Array<Category & { deleted?: boolean }>): Category[] {
  const map = new Map<string, Category>();

  // 1. Seed base default categories
  for (const def of DEFAULT_CATEGORIES) {
    map.set(def.id.toLowerCase(), { ...def });
  }

  // 2. Overlay / add / delete from remote Firestore collection
  for (const item of remoteList) {
    const key = item.id.toLowerCase();
    if (item.deleted) {
      map.delete(key);
    } else {
      map.set(key, {
        id: item.id,
        nameEn: item.nameEn || item.id,
        nameAr: item.nameAr || item.nameEn || item.id,
        createdAt: item.createdAt,
      });
    }
  }

  return Array.from(map.values());
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeWithDefaults(parsed);
        }
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
          const remoteList: Array<Category & { deleted?: boolean }> = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              nameEn: String(data.nameEn || d.id),
              nameAr: String(data.nameAr || data.nameEn || d.id),
              createdAt: data.createdAt,
              deleted: Boolean(data.deleted),
            };
          });
          const merged = mergeWithDefaults(remoteList);
          setCategories(merged);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
        } else {
          // If empty in Firestore, use defaults
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
      const rawId = item.id?.trim() || nameEn;
      const id = slugify(rawId) || `cat-${Date.now()}`;

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
        await setDoc(
          doc(db, CATEGORIES_COLLECTION, id),
          {
            ...newCat,
            deleted: false,
          },
          { merge: true }
        );
      }

      setCategories((prev) => {
        const next = mergeWithDefaults([...prev, newCat]);
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
    const isDefault = DEFAULT_CATEGORIES.some((c) => c.id.toLowerCase() === id.toLowerCase());
    if (isFirebaseConfigured && db) {
      if (isDefault) {
        await setDoc(doc(db, CATEGORIES_COLLECTION, id), { deleted: true }, { merge: true });
      } else {
        await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
      }
    }
    setCategories((prev) => {
      const next = prev.filter((c) => c.id.toLowerCase() !== id.toLowerCase());
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
