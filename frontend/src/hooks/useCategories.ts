import { useState, useEffect, useCallback } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import type { Category } from "../types";
import { slugify } from "../lib/gameMapper";

export const CATEGORIES_COLLECTION = "categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore realtime sync: pull pure categories from database
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      setCategories([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, CATEGORIES_COLLECTION),
      (snapshot) => {
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
        setLoading(false);
      },
      (err) => {
        console.error("Categories snapshot error:", err);
        setCategories([]);
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
        await setDoc(doc(db, CATEGORIES_COLLECTION, id), newCat, { merge: true });
      }

      setCategories((prev) => {
        const exists = prev.some((c) => c.id.toLowerCase() === id.toLowerCase());
        return exists
          ? prev.map((c) => (c.id.toLowerCase() === id.toLowerCase() ? newCat : c))
          : [...prev, newCat];
      });
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    }
    setCategories((prev) => prev.filter((c) => c.id.toLowerCase() !== id.toLowerCase()));
  }, []);

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
  };
}

