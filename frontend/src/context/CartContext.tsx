import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Game, ShortlistItem } from "../types";

interface CartContextValue {
  shortlist: ShortlistItem[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToShortlist: (game: Game) => void;
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
      (sum, item) => sum + item.price * item.qty,
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
