import { Router, type Request, type Response } from "express";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, BUNDLES_COLLECTION, isFirebaseConfigured } from "../config/firebase.js";
import { seedBundles } from "../data/seedGames.js";
import type { Bundle } from "../types.js";

export const bundlesRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// In-memory fallback catalog if Firestore is not reachable
let inMemoryBundles: Bundle[] = [...seedBundles];

// GET /api/bundles - List all bundles
bundlesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, BUNDLES_COLLECTION));
      if (!snap.empty) {
        const bundles = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Bundle[];
        return res.json({ success: true, count: bundles.length, source: "firestore", data: bundles });
      }
    }
    return res.json({
      success: true,
      count: inMemoryBundles.length,
      source: "seed_fallback",
      data: inMemoryBundles,
    });
  } catch (error) {
    console.error("Error fetching bundles from Firestore:", error);
    return res.json({
      success: true,
      count: inMemoryBundles.length,
      source: "seed_fallback",
      data: inMemoryBundles,
    });
  }
});

// GET /api/bundles/:id - Get single bundle
bundlesRouter.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, BUNDLES_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return res.json({ success: true, data: { id: snap.id, ...snap.data() } });
      }
    }

    const found = inMemoryBundles.find((b) => b.id === id);
    if (found) {
      return res.json({ success: true, data: found });
    }
    return res.status(404).json({ success: false, message: `Bundle with id '${id}' not found.` });
  } catch (error) {
    console.error(`Error fetching bundle ${id}:`, error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/bundles - Create new bundle
bundlesRouter.post("/", async (req: Request, res: Response) => {
  const bundleData = req.body as Partial<Bundle>;
  if (!bundleData.name) {
    return res.status(400).json({ success: false, message: "Bundle name is required." });
  }
  if (!bundleData.gameIds || bundleData.gameIds.length === 0) {
    return res.status(400).json({ success: false, message: "At least one game ID is required." });
  }

  const id = bundleData.id || slugify(bundleData.name);
  const now = new Date().toISOString();
  const newBundle: Bundle = {
    id,
    name: bundleData.name,
    nameAr: bundleData.nameAr || undefined,
    description: bundleData.description || "",
    price: Number(bundleData.price) || 0,
    gameIds: bundleData.gameIds,
    coverImage: bundleData.coverImage || "",
    badge: bundleData.badge || "MEGA DEAL",
    inStock: bundleData.inStock ?? true,
    featured: bundleData.featured ?? false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, BUNDLES_COLLECTION, id), newBundle, { merge: true });
    }
    inMemoryBundles = [newBundle, ...inMemoryBundles.filter((b) => b.id !== id)];
    return res.status(201).json({ success: true, message: "Bundle created successfully.", data: newBundle });
  } catch (error) {
    console.error("Error creating bundle:", error);
    return res.status(500).json({ success: false, message: "Failed to create bundle in database." });
  }
});

// PUT /api/bundles/:id - Update bundle
bundlesRouter.put("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updates = req.body as Partial<Bundle>;

  try {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, BUNDLES_COLLECTION, id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    }

    inMemoryBundles = inMemoryBundles.map((b) =>
      b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
    );
    return res.json({ success: true, message: `Bundle '${id}' updated successfully.` });
  } catch (error) {
    console.error(`Error updating bundle ${id}:`, error);
    return res.status(500).json({ success: false, message: "Failed to update bundle." });
  }
});

// DELETE /api/bundles/:id - Delete bundle
bundlesRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, BUNDLES_COLLECTION, id));
    }
    inMemoryBundles = inMemoryBundles.filter((b) => b.id !== id);
    return res.json({ success: true, message: `Bundle '${id}' deleted successfully.` });
  } catch (error) {
    console.error(`Error deleting bundle ${id}:`, error);
    return res.status(500).json({ success: false, message: "Failed to delete bundle." });
  }
});
