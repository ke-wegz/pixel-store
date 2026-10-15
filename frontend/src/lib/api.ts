import type { Game } from "../types";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  source?: string;
  data?: T;
}

const rawApiUrl = import.meta.env.VITE_API_URL || "";
const BASE_URL = rawApiUrl ? `${rawApiUrl.replace(/\/$/, "")}/api` : "/api";

export const api = {
  async getGames(): Promise<{ games: Game[]; source?: string }> {
    const res = await fetch(`${BASE_URL}/games`);
    if (!res.ok) {
      throw new Error(`Failed to load games: ${res.statusText}`);
    }
    const json: ApiResponse<Game[]> = await res.json();
    return { games: json.data || [], source: json.source };
  },

  async getGame(id: string): Promise<Game> {
    const res = await fetch(`${BASE_URL}/games/${id}`);
    if (!res.ok) {
      throw new Error(`Game not found`);
    }
    const json: ApiResponse<Game> = await res.json();
    if (!json.data) throw new Error("Game not found");
    return json.data;
  },

  async createGame(game: Partial<Game>): Promise<Game> {
    const res = await fetch(`${BASE_URL}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(game),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Failed to create game");
    }
    return json.data;
  },

  async updateGame(id: string, updates: Partial<Game>): Promise<void> {
    const res = await fetch(`${BASE_URL}/games/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Failed to update game");
    }
  },

  async deleteGame(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/games/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Failed to delete game");
    }
  },

  async seedCatalog(): Promise<{ count: number; message: string }> {
    const res = await fetch(`${BASE_URL}/games/seed`, {
      method: "POST",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Failed to seed catalog");
    }
    return { count: json.count || 0, message: json.message || "Seeded" };
  },

  async login(password: string): Promise<{ token: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Invalid admin password");
    }
    return { token: json.token };
  },

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
