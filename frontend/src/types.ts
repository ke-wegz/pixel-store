export type GameCategory = "story" | "action" | "strategy";

export interface Game {
  id: string;
  title: string;
  tagCode: string;
  abbrev: string;
  category: GameCategory;
  categoryLabel: string;
  subtitle: string;
  price: number;
  coverClass: string;
  accentColor: string;
  description: string;
  specs: string;
  coverImage: string;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  onSale: boolean;
  originalPrice?: number;
}

export interface ShortlistItem extends Game {
  qty: number;
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  story: "Story",
  action: "Action",
  strategy: "Strategy",
};
