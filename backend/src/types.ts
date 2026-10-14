export type GameCategory = string;

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt?: string;
}

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
  createdAt?: string;
  updatedAt?: string;
}
