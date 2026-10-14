export type GameCategory = string;

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "action", nameEn: "Action", nameAr: "أكشن" },
  { id: "story", nameEn: "Story", nameAr: "قصة" },
  { id: "strategy", nameEn: "Strategy", nameAr: "استراتيجية" },
];

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
  salePrice?: number;
  discountPercent?: number;
}

export interface ShortlistItem extends Game {
  qty: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  story: "Story",
  action: "Action",
  strategy: "Strategy",
};

/**
 * Returns the effective price to charge the customer.
 * - If on sale with a salePrice, returns salePrice.
 * - If on sale with discountPercent, calculates it from price.
 * - Otherwise returns the base/original price.
 */
export function getActivePrice(game: {
  price: number;
  onSale?: boolean;
  salePrice?: number;
  discountPercent?: number;
  originalPrice?: number;
}): number {
  if (game.onSale) {
    if (typeof game.salePrice === "number" && game.salePrice > 0 && game.salePrice < game.price) {
      return game.salePrice;
    }
    if (typeof game.discountPercent === "number" && game.discountPercent > 0) {
      return Number((game.price * (1 - game.discountPercent / 100)).toFixed(2));
    }
    // Backward compatibility if an old document had originalPrice > price where price was already the sale price:
    if (typeof game.originalPrice === "number" && game.originalPrice > game.price) {
      return game.price;
    }
  }
  return game.price;
}

/**
 * Returns the original / regular price before any discount.
 */
export function getOriginalPrice(game: {
  price: number;
  onSale?: boolean;
  originalPrice?: number;
}): number {
  if (game.onSale && typeof game.originalPrice === "number" && game.originalPrice > game.price) {
    return game.originalPrice;
  }
  return game.price;
}

/**
 * Returns the discount percentage (e.g. 30 for 30%).
 */
export function getDiscountPercent(game: {
  price: number;
  onSale?: boolean;
  salePrice?: number;
  discountPercent?: number;
  originalPrice?: number;
}): number {
  if (!game.onSale) return 0;
  if (typeof game.discountPercent === "number" && game.discountPercent > 0) {
    return Math.round(game.discountPercent);
  }
  const active = getActivePrice(game);
  const orig = getOriginalPrice(game);
  if (orig > active && orig > 0) {
    return Math.round((1 - active / orig) * 100);
  }
  return 0;
}
