import type { DocumentData } from "firebase/firestore";
import { CATEGORY_LABELS, type Game } from "../types";

function asCategory(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().toLowerCase();
  }
  return "action";
}

export function gameFromDoc(id: string, data: DocumentData): Game {
  const category = asCategory(data.category);
  return {
    id,
    title: String(data.title ?? ""),
    tagCode: String(data.tagCode ?? ""),
    abbrev: String(data.abbrev ?? ""),
    category,
    categoryLabel: String(data.categoryLabel ?? CATEGORY_LABELS[category] ?? category),
    subtitle: String(data.subtitle ?? ""),
    price: Number(data.price ?? 0),
    coverClass: String(data.coverClass ?? "from-[#2b1747] to-[#130726]"),
    accentColor: String(data.accentColor ?? "#00d2ff"),
    description: String(data.description ?? ""),
    specs: String(data.specs ?? ""),
    coverImage: String(data.coverImage ?? ""),
    inStock: data.inStock !== false,
    featured: Boolean(data.featured),
    isNew: Boolean(data.isNew),
    onSale: Boolean(data.onSale),
    originalPrice:
      data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== ""
        ? Number(data.originalPrice)
        : undefined,
    salePrice:
      data.salePrice !== undefined && data.salePrice !== null && data.salePrice !== ""
        ? Number(data.salePrice)
        : undefined,
    discountPercent:
      data.discountPercent !== undefined && data.discountPercent !== null && data.discountPercent !== ""
        ? Number(data.discountPercent)
        : undefined,
  };
}

export function gameToPayload(game: Game): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: game.title,
    tagCode: game.tagCode,
    abbrev: game.abbrev,
    category: game.category,
    categoryLabel: CATEGORY_LABELS[game.category],
    subtitle: game.subtitle,
    price: Number(game.price),
    coverClass: game.coverClass,
    accentColor: game.accentColor,
    description: game.description,
    specs: game.specs,
    coverImage: game.coverImage,
    inStock: game.inStock,
    featured: game.featured,
    isNew: game.isNew,
    onSale: game.onSale,
  };
  if (game.originalPrice !== undefined && game.originalPrice !== null && !isNaN(game.originalPrice)) {
    payload.originalPrice = Number(game.originalPrice);
  } else {
    payload.originalPrice = null;
  }
  if (game.salePrice !== undefined && game.salePrice !== null && !isNaN(game.salePrice)) {
    payload.salePrice = Number(game.salePrice);
  } else {
    payload.salePrice = null;
  }
  if (game.discountPercent !== undefined && game.discountPercent !== null && !isNaN(game.discountPercent)) {
    payload.discountPercent = Number(game.discountPercent);
  } else {
    payload.discountPercent = null;
  }
  return payload;
}

export function emptyGame(): Game {
  return {
    id: "",
    title: "",
    tagCode: "",
    abbrev: "",
    category: "action",
    categoryLabel: "Action",
    subtitle: "",
    price: 2,
    coverClass: "from-[#2b1747] to-[#130726]",
    accentColor: "#00d2ff",
    description: "",
    specs: "Win 10/11, Offline Steam activation",
    coverImage: "",
    inStock: true,
    featured: false,
    isNew: false,
    onSale: false,
    originalPrice: undefined,
    salePrice: undefined,
    discountPercent: undefined,
  };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
