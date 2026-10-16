import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Game, type Bundle, type ShortlistItem, getActivePrice } from "../types";

interface CartContextValue {
  shortlist: ShortlistItem[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToShortlist: (game: Game) => void;
  addBundleToShortlist: (bundle: Bundle, gamesInBundle: Game[]) => void;
  updateQty: (id: string, delta: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    const totalCount = shortlist.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = shortlist.reduce(
      (sum, item) => sum + getActivePrice(item) * item.qty,
      0,
    );

    return {
      shortlist,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addToShortlist: (game) => {
        setShortlist((prev) => {
          const existing = prev.find((item) => item.id === game.id);
          if (existing) {
            return prev.map((item) =>
              item.id === game.id ? { ...item, qty: item.qty + 1 } : item,
            );
          }
          return [...prev, { ...game, qty: 1 }];
        });
        setDrawerOpen(true);
      },
      addBundleToShortlist: (bundle, gamesInBundle) => {
        const bundleTitle = `🎁 [Bundle] ${bundle.name}`;
        const gameTitles = gamesInBundle.map((g) => g.title).join(", ");
        const bundleItem: ShortlistItem = {
          id: `bundle-${bundle.id}`,
          title: `${bundleTitle} (${gameTitles})`,
          tagCode: "BUNDLE",
          abbrev: "BDL",
          category: "bundle",
          categoryLabel: "Bundle",
          categories: ["bundle"],
          subtitle: `${gamesInBundle.length} games included in pack`,
          price: bundle.price,
          coverClass: "from-[#4a154b] to-[#120726]",
          accentColor: "#f43f5e",
          description: bundle.description || "",
          specs: "Full offline Steam activation for all games",
          coverImage: bundle.coverImage || "",
          inStock: true,
          featured: Boolean(bundle.featured),
          isNew: false,
          onSale: false,
          qty: 1,
        };

        setShortlist((prev) => {
          const existing = prev.find((item) => item.id === bundleItem.id);
          if (existing) {
            return prev.map((item) =>
              item.id === bundleItem.id ? { ...item, qty: item.qty + 1 } : item,
            );
          }
          return [...prev, bundleItem];
        });
        setDrawerOpen(true);
      },
      updateQty: (id, delta) => {
        setShortlist((prev) =>
          prev
            .map((item) =>
              item.id === id ? { ...item, qty: item.qty + delta } : item,
            )
            .filter((item) => item.qty > 0),
        );
      },
      clear: () => setShortlist([]),
      totalCount,
      totalPrice,
    };
  }, [shortlist, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
