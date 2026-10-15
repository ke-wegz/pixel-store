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
import { db, GAMES_COLLECTION, isFirebaseConfigured } from "../config/firebase.js";
import { seedGames } from "../data/seedGames.js";
import type { Game } from "../types.js";

export const gamesRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// In-memory fallback catalog if Firestore is not reachable
let inMemoryGames: Game[] = [...seedGames];

// GET /api/games - List all games
gamesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, GAMES_COLLECTION));
      if (!snap.empty) {
        const games = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Game[];
        return res.json({ success: true, count: games.length, source: "firestore", data: games });
      }
    }
    // Return fallback if Firestore empty or unconfigured
    return res.json({ success: true, count: inMemoryGames.length, source: "seed_fallback", data: inMemoryGames });
  } catch (error) {
    console.error("Error fetching games from Firestore:", error);
    return res.json({ success: true, count: inMemoryGames.length, source: "seed_fallback", data: inMemoryGames });
  }
});

// GET /api/games/:id - Get single game
gamesRouter.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, GAMES_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return res.json({ success: true, data: { id: snap.id, ...snap.data() } });
      }
    }

    const found = inMemoryGames.find((g) => g.id === id);
    if (found) {
      return res.json({ success: true, data: found });
    }
    return res.status(404).json({ success: false, message: `Game with id '${id}' not found.` });
  } catch (error) {
    console.error(`Error fetching game ${id}:`, error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/games - Create new game
gamesRouter.post("/", async (req: Request, res: Response) => {
  const gameData = req.body as Partial<Game>;
  if (!gameData.title) {
    return res.status(400).json({ success: false, message: "Game title is required." });
  }

  const id = gameData.id || slugify(gameData.title);
  const newGame: Game = {
    id,
    title: gameData.title,
    tagCode: gameData.tagCode || "N/S",
    abbrev: gameData.abbrev || "GM",
    category: gameData.category || "action",
    categoryLabel: gameData.categoryLabel || "Action",
    subtitle: gameData.subtitle || "",
    price: Number(gameData.price) || 2.0,
    coverClass: gameData.coverClass || "from-[#17204a] to-[#0c0926]",
    accentColor: gameData.accentColor || "#00d2ff",
    description: gameData.description || "",
    specs: gameData.specs || "Win 10/11, Offline Steam activation",
    coverImage: gameData.coverImage || "",
    inStock: gameData.inStock ?? true,
    featured: gameData.featured ?? false,
    isNew: gameData.isNew ?? false,
    onSale: gameData.onSale ?? false,
    originalPrice:
      gameData.originalPrice !== undefined && gameData.originalPrice !== null
        ? Number(gameData.originalPrice)
        : undefined,
    salePrice:
      gameData.salePrice !== undefined && gameData.salePrice !== null
        ? Number(gameData.salePrice)
        : undefined,
    discountPercent:
      gameData.discountPercent !== undefined && gameData.discountPercent !== null
        ? Number(gameData.discountPercent)
        : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, GAMES_COLLECTION, id), newGame, { merge: true });
    }
    inMemoryGames = [newGame, ...inMemoryGames.filter((g) => g.id !== id)];
    return res.status(201).json({ success: true, message: "Game created successfully.", data: newGame });
  } catch (error) {
    console.error("Error creating game:", error);
    return res.status(500).json({ success: false, message: "Failed to create game in database." });
  }
});

// PUT /api/games/:id - Update game
gamesRouter.put("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updates = req.body as Partial<Game>;

  try {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, GAMES_COLLECTION, id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    }

    inMemoryGames = inMemoryGames.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g));
    return res.json({ success: true, message: `Game '${id}' updated successfully.` });
  } catch (error) {
    console.error(`Error updating game ${id}:`, error);
    return res.status(500).json({ success: false, message: "Failed to update game." });
  }
});

// DELETE /api/games/:id - Delete game
gamesRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, GAMES_COLLECTION, id));
    }
    inMemoryGames = inMemoryGames.filter((g) => g.id !== id);
    return res.json({ success: true, message: `Game '${id}' deleted successfully.` });
  } catch (error) {
    console.error(`Error deleting game ${id}:`, error);
    return res.status(500).json({ success: false, message: "Failed to delete game." });
  }
});

// POST /api/games/seed - Seed original 13 games
gamesRouter.post("/seed", async (_req: Request, res: Response) => {
  try {
    if (isFirebaseConfigured && db) {
      const firestore = db;
      await Promise.all(
        seedGames.map((game) =>
          setDoc(doc(firestore, GAMES_COLLECTION, game.id), game, { merge: true })
        )
      );
      return res.json({
        success: true,
        message: `Successfully seeded ${seedGames.length} games into Firestore!`,
        count: seedGames.length,
      });
    }

    inMemoryGames = [...seedGames];
    return res.json({
      success: true,
      message: `Seeded ${seedGames.length} games into local memory (Firestore not connected).`,
      count: seedGames.length,
    });
  } catch (error) {
    console.error("Error seeding games:", error);
    return res.status(500).json({ success: false, message: "Failed to seed games into Firestore." });
  }
});
