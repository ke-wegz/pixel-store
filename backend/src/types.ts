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
  createdAt?: string;
  updatedAt?: string;
}
