import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  FolderPlus,
  Trash2,
  Package,
  Layers,
  Search,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import iconSvg from "../assets/icon.svg";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db, GAMES_COLLECTION } from "../lib/firebase";
import { emptyGame, gameToPayload, slugify } from "../lib/gameMapper";
import { useAuth } from "../hooks/useAuth";
import { useGames } from "../hooks/useGames";
import { useBundles } from "../hooks/useBundles";
import { useCategories } from "../hooks/useCategories";
import {
  type Game,
  type Bundle,
  getActivePrice,
  getOriginalPrice,
  getDiscountPercent,
} from "../types";

const fieldClass =
  "w-full rounded-xl border border-cyber-border bg-cyber-surface px-3 py-2 text-sm text-white outline-none focus:border-cyber-electricBlue transition-colors";

interface BundleFormState {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  price: number;
  badge: string;
  coverImage: string;
  gameIds: string[];
  inStock: boolean;
  featured: boolean;
}

const emptyBundleForm: BundleFormState = {
  id: "",
  name: "",
  nameAr: "",
  description: "",
  price: 4.0,
  badge: "MEGA DEAL",
  coverImage: "",
  gameIds: [],
  inStock: true,
  featured: false,
};

export function AdminPage() {
  const { user, login, logout, configured } = useAuth();
  const { games, loading, error: firestoreError } = useGames();
  const { bundles, saveBundle, deleteBundle } = useBundles();
  const { categories, addCategory, deleteCategory } = useCategories();

  // Local bypass mode if Firebase keys are not yet added to .env
  const [localMode, setLocalMode] = useState(!configured);

  // Active Admin Panel Tab
  const [activeTab, setActiveTab] = useState<"games" | "bundles" | "categories">("games");

  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Game form state
  const [form, setForm] = useState<Game>(emptyGame());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bundle form state
  const [bundleForm, setBundleForm] = useState<BundleFormState>(emptyBundleForm);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [bundleSearch, setBundleSearch] = useState("");
  const [bundleCatFilter, setBundleCatFilter] = useState("all");
  const [bundleNotice, setBundleNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bundleBusy, setBundleBusy] = useState(false);

  // Category management state
  const [newCatEn, setNewCatEn] = useState("");
  const [newCatAr, setNewCatAr] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [catNotice, setCatNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    try {
      await login(email, password);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : "Firebase Authentication failed. Check your email and password."
      );
    }
  }

  // --- GAME ACTIONS ---
  async function saveGame(e: FormEvent) {
    e.preventDefault();
    const id = editingId || form.id || slugify(form.title);
    if (!id || !form.title.trim()) {
      setNotice({ type: "error", text: "Game Title is required." });
      return;
    }

    const selectedCats =
      form.categories && form.categories.length > 0
        ? form.categories
        : [form.category || "action"];

    setBusy(true);
    setNotice(null);
    try {
      const payloadGame: Game = {
        ...form,
        id,
        categories: selectedCats,
        category: selectedCats[0] || "action",
        categoryLabel:
          form.categoryLabel ||
          selectedCats
            .map((id) => categories.find((c) => c.id === id)?.nameEn || id)
            .join(" / "),
        price: Number(form.price),
        originalPrice: Number(form.price),
        salePrice: form.onSale
          ? Number(
              form.salePrice ??
                (form.price * (1 - (form.discountPercent || 25) / 100)).toFixed(2)
            )
          : undefined,
        discountPercent: form.onSale ? Number(form.discountPercent || 25) : undefined,
      };

      if (db) {
        await setDoc(doc(db, GAMES_COLLECTION, id), gameToPayload(payloadGame), {
          merge: true,
        });
      } else {
        const currentGames = [...games];
        const exists = currentGames.some((g) => g.id === id);
        const nextGames = exists
          ? currentGames.map((g) => (g.id === id ? payloadGame : g))
          : [payloadGame, ...currentGames];
        localStorage.setItem("pixel_store_games", JSON.stringify(nextGames));
      }

      const actionName = editingId ? "updated" : "added";
      setNotice({
        type: "success",
        text: `✓ Game '${form.title}' successfully ${actionName}.`,
      });
      setForm(emptyGame());
      setEditingId(null);
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? `Save error: ${err.message}` : "Failed to save game.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeGame(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete '${title}' (${id})?`)) return;
    setBusy(true);
    setNotice(null);
    try {
      if (db) {
        await deleteDoc(doc(db, GAMES_COLLECTION, id));
      } else {
        const nextGames = games.filter((g) => g.id !== id);
        localStorage.setItem("pixel_store_games", JSON.stringify(nextGames));
      }
      if (editingId === id) {
        setForm(emptyGame());
        setEditingId(null);
      }
      setNotice({ type: "success", text: `✓ Game '${title}' deleted.` });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? `Delete error: ${err.message}` : "Failed to delete game.",
      });
    } finally {
      setBusy(false);
    }
  }

  function editGame(game: Game) {
    const cats =
      game.categories && game.categories.length > 0
        ? game.categories
        : [game.category || "action"];

    if (game.onSale && game.originalPrice && game.originalPrice > game.price && !game.salePrice) {
      const orig = game.originalPrice;
      const sale = game.price;
      const pct = Math.round((1 - sale / orig) * 100);
      setForm({
        ...game,
        categories: cats,
        price: orig,
        originalPrice: orig,
        salePrice: sale,
        discountPercent: pct,
      });
    } else {
      const orig = game.price;
      const pct =
        game.discountPercent ||
        (game.salePrice && orig > 0 ? Math.round((1 - game.salePrice / orig) * 100) : 25);
      const sale =
        game.salePrice ??
        (game.onSale ? Number((orig * (1 - pct / 100)).toFixed(2)) : undefined);
      setForm({
        ...game,
        categories: cats,
        price: orig,
        originalPrice: orig,
        salePrice: sale,
        discountPercent: pct,
      });
    }
    setEditingId(game.id);
    setActiveTab("games");
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(emptyGame());
    setEditingId(null);
    setNotice(null);
  }

  function patch<K extends keyof Game>(key: K, value: Game[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // --- BUNDLE MAKER ACTIONS ---
  async function saveBundleForm(e: FormEvent) {
    e.preventDefault();
    if (!bundleForm.name.trim()) {
      setBundleNotice({ type: "error", text: "Bundle Name is required." });
      return;
    }
    if (bundleForm.gameIds.length === 0) {
      setBundleNotice({
        type: "error",
        text: "Please select at least one game to include in the bundle.",
      });
      return;
    }

    const id = editingBundleId || bundleForm.id.trim() || slugify(bundleForm.name);
    setBundleBusy(true);
    setBundleNotice(null);
    try {
      await saveBundle({
        ...bundleForm,
        id,
        price: Number(bundleForm.price),
      });
      setBundleNotice({
        type: "success",
        text: `✓ Bundle "${bundleForm.name}" successfully ${
          editingBundleId ? "updated" : "created"
        }!`,
      });
      setBundleForm(emptyBundleForm);
      setEditingBundleId(null);
    } catch (err) {
      setBundleNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save bundle.",
      });
    } finally {
      setBundleBusy(false);
    }
  }

  function editBundle(b: Bundle) {
    setBundleForm({
      id: b.id,
      name: b.name,
      nameAr: b.nameAr || "",
      description: b.description || "",
      price: b.price,
      badge: b.badge || "MEGA DEAL",
      coverImage: b.coverImage || "",
      gameIds: b.gameIds,
      inStock: b.inStock,
      featured: Boolean(b.featured),
    });
    setEditingBundleId(b.id);
    setActiveTab("bundles");
    setBundleNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeBundle(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete bundle "${name}"?`)) return;
    setBundleBusy(true);
    try {
      await deleteBundle(id);
      if (editingBundleId === id) {
        setBundleForm(emptyBundleForm);
        setEditingBundleId(null);
      }
      setBundleNotice({ type: "success", text: `✓ Bundle "${name}" deleted.` });
    } catch (err) {
      setBundleNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete bundle.",
      });
    } finally {
      setBundleBusy(false);
    }
  }

  function toggleGameInBundle(gameId: string) {
    setBundleForm((prev) => {
      const exists = prev.gameIds.includes(gameId);
      const nextIds = exists
        ? prev.gameIds.filter((id) => id !== gameId)
        : [...prev.gameIds, gameId];
      return { ...prev, gameIds: nextIds };
    });
  }

  // --- CATEGORY ACTIONS ---
  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCatEn.trim()) return;
    setCatBusy(true);
    setCatNotice(null);
    try {
      await addCategory({
        id: newCatId.trim() || slugify(newCatEn),
        nameEn: newCatEn.trim(),
        nameAr: newCatAr.trim() || newCatEn.trim(),
      });
      setCatNotice({ type: "success", text: `✓ Category "${newCatEn}" added successfully!` });
      setNewCatEn("");
      setNewCatAr("");
      setNewCatId("");
      setTimeout(() => setCatNotice(null), 4000);
    } catch (err) {
      setCatNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to add category.",
      });
    } finally {
      setCatBusy(false);
    }
  }

  async function handleRemoveCategory(id: string, name: string) {
    const count = games.filter((g) => {
      const cats = g.categories || [g.category];
      return cats.some((c) => c.toLowerCase() === id.toLowerCase() || c.toLowerCase() === name.toLowerCase());
    }).length;
    const confirmMsg =
      count > 0
        ? `Category "${name}" is currently used by ${count} game(s). Are you sure you want to delete it?`
        : `Delete category "${name}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      await deleteCategory(id);
      setCatNotice({ type: "success", text: `✓ Category "${name}" deleted.` });
      setTimeout(() => setCatNotice(null), 4000);
    } catch (err) {
      setCatNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete category.",
      });
    }
  }

  // Calculate live sum for selected bundle games
  const bundleSelectedGames = bundleForm.gameIds
    .map((id) => games.find((g) => g.id === id))
    .filter((g): g is Game => Boolean(g));

  const bundleSumRegular = bundleSelectedGames.reduce(
    (sum, g) => sum + getActivePrice(g),
    0
  );
  const bundleSavings = Math.max(0, bundleSumRegular - bundleForm.price);
  const bundleSavingsPct =
    bundleSumRegular > 0 ? Math.round((bundleSavings / bundleSumRegular) * 100) : 0;

  // Filter games for database game selector inside bundle maker
  const filteredCatalogForBundle = games.filter((g) => {
    const q = bundleSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.tagCode.toLowerCase().includes(q) ||
      g.id.toLowerCase().includes(q);

    const cats = (g.categories || [g.category]).map((c) => c.toLowerCase());
    const matchCat =
      bundleCatFilter === "all" || cats.includes(bundleCatFilter.toLowerCase());

    return matchSearch && matchCat;
  });

  const isAuthenticated = Boolean(user || localMode);

  return (
    <div className="min-h-screen bg-cyber-bg px-4 py-8 text-white cyber-grid selection:bg-cyber-neonPink selection:text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border/70 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-cyber-neonPink via-cyber-purple to-cyber-electricBlue p-[2px] shadow-neon-pink">
              <div className="h-full w-full bg-cyber-surface rounded-[10px] flex items-center justify-center p-1.5 overflow-hidden">
                <img src={iconSvg} alt="Pixel Store" className="h-full w-full object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyber-electricBlue animate-pulse"></span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-cyber-electricBlue font-bold">
                  Pixel Store / Catalog Manager
                </p>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                Admin Dashboard
              </h1>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-cyber-border bg-cyber-surface/80 px-4 py-2 text-xs font-semibold text-cyber-muted hover:border-cyber-electricBlue hover:text-cyber-electricBlue transition-all"
          >
            ← View Live Store
          </Link>
        </div>

        {/* Authentication Card (if not logged in and not in local mode) */}
        {!isAuthenticated && (
          <div className="mx-auto max-w-md rounded-2xl border border-cyber-border bg-cyber-surface p-8 shadow-2xl">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-white">Admin Authentication</h2>
              <p className="text-xs text-cyber-muted mt-1 leading-5">
                Sign in with your Admin credentials to manage catalog games, bundles, and categories.
              </p>
            </div>

            {configured ? (
              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-cyber-muted block mb-1">Admin Email</label>
                  <input
                    className={fieldClass}
                    type="email"
                    placeholder="admin@pixelstore.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-cyber-muted block mb-1">Password</label>
                  <input
                    className={fieldClass}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {authError && (
                  <div className="rounded-xl border border-cyber-neonPink/40 bg-cyber-neonPink/10 p-3 text-xs text-cyber-neonPink font-medium">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-cyber-neonPink to-cyber-purple py-3 text-sm font-bold shadow-neon-pink hover:opacity-95 transition-opacity"
                >
                  Sign In to Dashboard
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-cyber-electricBlue/40 bg-cyber-electricBlue/10 p-4 text-xs text-cyber-lightBlue leading-5">
                  <p className="font-bold text-white">Local Storage Mode Active</p>
                  <p className="mt-1">
                    Firebase credentials are not configured in your .env file. You can enter the dashboard in Local Mode to test game management, the Bundle Maker, and multiple categories checklist!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalMode(true)}
                  className="w-full rounded-xl bg-gradient-to-r from-cyber-electricBlue to-cyber-purple py-3 text-sm font-bold text-white shadow-neon-blue hover:opacity-95 transition-opacity"
                >
                  Enter Dashboard (Local Mode)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Authenticated Admin Workspace */}
        {isAuthenticated && (
          <div className="space-y-6">
            {/* Session Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyber-border bg-cyber-surface/90 px-5 py-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-cyber-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Session:</span>
                <span className="font-mono font-bold text-cyber-electricBlue">
                  {user ? user.email : "Local Storage Mode (Preview)"}
                </span>
              </div>
              {user && (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-xl border border-cyber-border px-3.5 py-1.5 text-xs font-semibold text-cyber-muted hover:border-cyber-neonPink hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>

            {/* Navigation Panels / Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-cyber-border/70 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("games")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === "games"
                    ? "bg-gradient-to-r from-cyber-neonPink to-cyber-purple text-white shadow-neon-pink"
                    : "bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-electricBlue"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Games Catalog & Editor ({games.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bundles")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === "bundles"
                    ? "bg-gradient-to-r from-cyber-electricBlue to-cyber-neonPurple text-white shadow-neon-blue"
                    : "bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-electricBlue"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Bundle Maker (صانع الحزم) ({bundles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === "categories"
                    ? "bg-gradient-to-r from-cyber-purple to-cyber-neonPink text-white shadow-neon-pink"
                    : "bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-electricBlue"
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Manage Categories ({categories.length})</span>
              </button>
            </div>

            {/* Notification Banner */}
            {notice && (
              <div
                className={`rounded-xl border p-3.5 text-xs font-semibold animate-fadeIn ${
                  notice.type === "success"
                    ? "border-cyber-electricBlue/40 bg-cyber-electricBlue/10 text-cyber-electricBlue"
                    : "border-cyber-neonPink/40 bg-cyber-neonPink/10 text-cyber-neonPink"
                }`}
              >
                {notice.text}
              </div>
            )}

            {firestoreError && (
              <div className="rounded-xl border border-cyber-neonPink/40 bg-cyber-neonPink/10 p-3.5 text-xs text-cyber-neonPink">
                Firestore listener note: {firestoreError}. (Local catalog is active).
              </div>
            )}

            {/* ======================================================== */}
            {/* PANEL 1: GAMES CATALOG & EDITOR                          */}
            {/* ======================================================== */}
            {activeTab === "games" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Form: Add or Edit a Game */}
                <form
                  onSubmit={saveGame}
                  className="rounded-2xl border border-cyber-border bg-cyber-surface/90 p-6 sm:p-8 shadow-2xl relative"
                >
                  <div className="flex items-center justify-between border-b border-cyber-border/70 pb-4 mb-5">
                    <div>
                      <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-cyber-neonPink" />
                        {editingId ? `Edit Game: ${form.title || editingId}` : "Add Game to Catalog"}
                      </h2>
                      <p className="text-xs text-cyber-muted mt-0.5">
                        Fill in game metadata, assign multiple categories via the checklist, and configure prices.
                      </p>
                    </div>
                    {editingId && (
                      <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-cyber-neonPink/20 text-cyber-neonPink font-bold border border-cyber-neonPink/40">
                        Editing Mode
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs text-cyber-muted font-medium">
                      Game Title *
                      <input
                        className={`${fieldClass} mt-1`}
                        value={form.title}
                        onChange={(e) => {
                          patch("title", e.target.value);
                          if (!editingId && !form.id) {
                            patch("abbrev", e.target.value.slice(0, 3).toUpperCase());
                          }
                        }}
                        placeholder="e.g. Cyberpunk 2077"
                        required
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium">
                      Document ID (Slug)
                      <input
                        className={`${fieldClass} mt-1 font-mono`}
                        value={editingId ?? form.id}
                        disabled={Boolean(editingId)}
                        onChange={(e) => patch("id", e.target.value)}
                        placeholder="Auto-generated if empty (e.g. cyberpunk-2077)"
                      />
                    </label>

                    {/* MULTI-CATEGORY CHECKLIST */}
                    <div className="text-xs text-cyber-muted font-medium sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          Categories Checklist (اختر تصنيف أو أكثر) *
                        </span>
                        <span className="font-mono text-[11px] text-cyber-electricBlue font-bold">
                          {form.categories?.length || 0} selected
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 rounded-xl border border-cyber-border bg-cyber-card/70">
                        {categories.map((cat) => {
                          const isChecked = form.categories?.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                isChecked
                                  ? "border-cyber-electricBlue bg-cyber-electricBlue/15 text-white font-semibold shadow-sm"
                                  : "border-cyber-border/80 bg-cyber-surface/70 text-cyber-muted hover:border-cyber-border hover:text-white"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(isChecked)}
                                onChange={(e) => {
                                  const current =
                                    form.categories && form.categories.length > 0
                                      ? form.categories
                                      : [form.category || "action"];
                                  let next: string[];
                                  if (e.target.checked) {
                                    next = current.includes(cat.id) ? current : [...current, cat.id];
                                  } else {
                                    next = current.filter((id) => id !== cat.id);
                                  }
                                  const primary = next[0] || cat.id;
                                  const labels = next
                                    .map((id) => categories.find((c) => c.id === id)?.nameEn || id)
                                    .join(" / ");
                                  setForm((prev) => ({
                                    ...prev,
                                    categories: next,
                                    category: primary,
                                    categoryLabel: labels || "Action",
                                  }));
                                }}
                                className="rounded accent-cyber-electricBlue h-4 w-4"
                              />
                              <span className="truncate">{cat.nameEn}</span>
                              <span className="text-[10px] text-cyber-muted">({cat.nameAr})</span>
                            </label>
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-cyber-muted block mt-1">
                        A game can belong to multiple categories. Customers on the store page will be able to filter using any or multiple of these tags.
                      </span>
                    </div>

                    <label className="text-xs text-cyber-muted font-medium">
                      Price in JOD (Original / Regular Price) *
                      <input
                        className={`${fieldClass} mt-1 font-mono`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value);
                          const currentPct = form.discountPercent || 25;
                          const calculatedSale = form.onSale
                            ? Number((newPrice * (1 - currentPct / 100)).toFixed(2))
                            : undefined;
                          setForm((prev) => ({
                            ...prev,
                            price: newPrice,
                            originalPrice: newPrice,
                            salePrice: calculatedSale,
                          }));
                        }}
                        required
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium">
                      Tag Code
                      <input
                        className={`${fieldClass} mt-1 font-mono`}
                        value={form.tagCode}
                        onChange={(e) => patch("tagCode", e.target.value)}
                        placeholder="e.g. N/S CP"
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium">
                      Abbrev Badge
                      <input
                        className={`${fieldClass} mt-1 font-mono`}
                        value={form.abbrev}
                        onChange={(e) => patch("abbrev", e.target.value)}
                        placeholder="e.g. CP"
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium">
                      Subtitle / One-line Hook
                      <input
                        className={`${fieldClass} mt-1`}
                        value={form.subtitle}
                        onChange={(e) => patch("subtitle", e.target.value)}
                        placeholder="e.g. Neon nights in Night City"
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium sm:col-span-2">
                      Cover Image URL (optional)
                      <input
                        className={`${fieldClass} mt-1 font-mono`}
                        value={form.coverImage}
                        onChange={(e) => patch("coverImage", e.target.value)}
                        placeholder="https://... (leave empty for cyber gradient)"
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium">
                      Cover Gradient Classes
                      <input
                        className={`${fieldClass} mt-1 font-mono`}
                        value={form.coverClass}
                        onChange={(e) => patch("coverClass", e.target.value)}
                        placeholder="e.g. from-[#380e30] to-[#130419]"
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium">
                      Accent Color Hex
                      <input
                        className={`${fieldClass} mt-1 font-mono`}
                        value={form.accentColor}
                        onChange={(e) => patch("accentColor", e.target.value)}
                        placeholder="e.g. #ff2a85"
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium sm:col-span-2">
                      Description
                      <textarea
                        className={`${fieldClass} mt-1 min-h-24`}
                        value={form.description}
                        onChange={(e) => patch("description", e.target.value)}
                        placeholder="Full game synopsis and story overview..."
                      />
                    </label>

                    <label className="text-xs text-cyber-muted font-medium sm:col-span-2">
                      System Specs & Activation Note
                      <input
                        className={`${fieldClass} mt-1`}
                        value={form.specs}
                        onChange={(e) => patch("specs", e.target.value)}
                        placeholder="e.g. Win 10/11, Offline Steam activation, SSD recommended"
                      />
                    </label>

                    {/* SALE PRICING */}
                    <div className="sm:col-span-2 rounded-2xl border border-cyber-neonPink/40 bg-gradient-to-br from-cyber-neonPink/10 via-cyber-surface to-cyber-surface p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyber-neonPink/30 pb-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-cyber-neonPink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.onSale}
                            onChange={(e) => {
                              const active = e.target.checked;
                              const pct = form.discountPercent || 25;
                              const sale = active
                                ? Number((form.price * (1 - pct / 100)).toFixed(2))
                                : undefined;
                              setForm((prev) => ({
                                ...prev,
                                onSale: active,
                                originalPrice: prev.price,
                                salePrice: sale,
                                discountPercent: active ? pct : undefined,
                              }));
                            }}
                            className="rounded accent-cyber-neonPink h-4 w-4"
                          />
                          <span>Activate Sale Pricing (تفعيل التخفيض)</span>
                        </label>
                      </div>

                      {form.onSale ? (
                        <div className="space-y-4 pt-1">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-cyber-surface/90 border border-cyber-border/80 p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs text-cyber-lightBlue font-semibold">
                                  Discount Percentage (نسبة الخصم)
                                </label>
                                <span className="font-mono text-xs font-extrabold text-cyber-neonPink">
                                  {form.discountPercent || 25}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="90"
                                step="5"
                                value={form.discountPercent || 25}
                                onChange={(e) => {
                                  const pct = Number(e.target.value);
                                  const calculatedSale = Number((form.price * (1 - pct / 100)).toFixed(2));
                                  setForm((prev) => ({
                                    ...prev,
                                    discountPercent: pct,
                                    salePrice: calculatedSale,
                                    originalPrice: prev.price,
                                  }));
                                }}
                                className="w-full accent-cyber-neonPink cursor-pointer"
                              />
                            </div>

                            <div className="rounded-xl bg-cyber-surface/90 border border-cyber-border/80 p-3.5 space-y-2">
                              <label className="text-xs text-cyber-lightBlue font-semibold block">
                                Flat Sale Price in JOD (السعر المخفض المباشر)
                              </label>
                              <input
                                className={`${fieldClass} mt-1 font-mono`}
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={
                                  form.salePrice !== undefined && form.salePrice !== null
                                    ? form.salePrice
                                    : Number((form.price * (1 - (form.discountPercent || 25) / 100)).toFixed(2))
                                }
                                onChange={(e) => {
                                  const sp = Number(e.target.value);
                                  const pct =
                                    form.price > 0
                                      ? Math.max(1, Math.min(99, Math.round((1 - sp / form.price) * 100)))
                                      : 0;
                                  setForm((prev) => ({
                                    ...prev,
                                    salePrice: sp,
                                    discountPercent: pct,
                                    originalPrice: prev.price,
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-cyber-muted">
                          Check the box above to activate sale pricing. You will be able to set a discount percentage slider or enter a flat sale price.
                        </p>
                      )}
                    </div>

                    {/* Flags */}
                    <fieldset className="sm:col-span-2 grid grid-cols-2 gap-3 rounded-xl border border-cyber-border p-4 sm:grid-cols-4 bg-cyber-card/30">
                      <legend className="px-2 font-mono text-[10px] uppercase tracking-wider text-cyber-neonPink font-bold">
                        Store Status Flags
                      </legend>
                      {(
                        [
                          ["inStock", "In Stock"],
                          ["featured", "Featured"],
                          ["isNew", "New Release"],
                          ["onSale", "On Sale"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={(e) => patch(key, e.target.checked)}
                            className="rounded accent-cyber-neonPink h-4 w-4"
                          />
                          {label}
                        </label>
                      ))}
                    </fieldset>

                    <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-xl bg-gradient-to-r from-cyber-neonPink via-cyber-purple to-cyber-electricBlue px-6 py-3 text-sm font-bold shadow-neon-pink hover:opacity-95 transition-all disabled:opacity-50"
                      >
                        {busy ? "Saving..." : editingId ? "Save Game Changes" : "+ Add Game to Catalog"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl border border-cyber-border px-5 py-3 text-sm font-semibold text-cyber-muted hover:text-white"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                {/* Live Games Catalog Table */}
                <div className="rounded-2xl border border-cyber-border bg-cyber-surface/90 overflow-hidden shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyber-border px-6 py-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">Live Games Catalog</h3>
                      <p className="text-xs text-cyber-muted mt-0.5">
                        Showing all game documents stored in your database catalog.
                      </p>
                    </div>
                    <span className="font-mono text-xs px-3 py-1 rounded-full border border-cyber-electricBlue/40 bg-cyber-electricBlue/10 text-cyber-electricBlue font-bold">
                      {games.length} {games.length === 1 ? "game" : "games"}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-cyber-card/60 font-mono uppercase text-cyber-muted border-b border-cyber-border">
                        <tr>
                          <th className="px-5 py-3.5">Title / ID</th>
                          <th className="px-5 py-3.5">Categories</th>
                          <th className="px-5 py-3.5">Price</th>
                          <th className="px-5 py-3.5">Flags</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/50">
                        {loading && (
                          <tr>
                            <td className="px-5 py-10 text-center text-cyber-muted" colSpan={5}>
                              Loading games...
                            </td>
                          </tr>
                        )}

                        {!loading && games.length === 0 && (
                          <tr>
                            <td className="px-5 py-12 text-center" colSpan={5}>
                              <p className="font-display text-base font-bold text-white">No games in catalog yet</p>
                            </td>
                          </tr>
                        )}

                        {!loading &&
                          games.map((game) => (
                            <tr
                              key={game.id}
                              className={`hover:bg-cyber-card/50 transition-colors ${
                                editingId === game.id ? "bg-cyber-purple/20 border-l-4 border-l-cyber-neonPink" : ""
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="font-bold text-white text-sm">{game.title}</div>
                                <div className="font-mono text-[10px] text-cyber-muted">{game.id}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {(game.categories && game.categories.length > 0
                                    ? game.categories
                                    : [game.category]
                                  ).map((cId) => (
                                    <span
                                      key={cId}
                                      className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border border-cyber-border bg-cyber-card text-cyber-lightBlue font-semibold"
                                    >
                                      {categories.find((c) => c.id === cId)?.nameEn || cId}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-5 py-4 font-mono font-bold text-sm">
                                {game.onSale && getDiscountPercent(game) > 0 ? (
                                  <div>
                                    <div className="text-cyber-neonPink font-extrabold flex items-center gap-1.5">
                                      <span>{getActivePrice(game).toFixed(2)} JOD</span>
                                      <span className="text-[10px] bg-cyber-neonPink/20 text-cyber-neonPink px-1 py-0.2 rounded font-bold">
                                        -{getDiscountPercent(game)}%
                                      </span>
                                    </div>
                                    <div className="text-cyber-muted text-[11px] line-through font-normal">
                                      was {getOriginalPrice(game).toFixed(2)} JOD
                                    </div>
                                  </div>
                                ) : (
                                  <span className={game.onSale ? "text-cyber-neonPink font-bold" : "text-cyber-electricBlue"}>
                                    {getActivePrice(game).toFixed(2)} JOD
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-cyber-muted">
                                <div className="flex flex-wrap gap-1">
                                  {game.inStock && (
                                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 font-semibold">
                                      In Stock
                                    </span>
                                  )}
                                  {!game.inStock && (
                                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400 font-semibold">
                                      Out of Stock
                                    </span>
                                  )}
                                  {game.featured && (
                                    <span className="rounded bg-cyber-neonPurple/20 px-1.5 py-0.5 text-[10px] text-cyber-neonPurple font-semibold">
                                      Featured
                                    </span>
                                  )}
                                  {game.isNew && (
                                    <span className="rounded bg-cyber-electricBlue/20 px-1.5 py-0.5 text-[10px] text-cyber-electricBlue font-semibold">
                                      New
                                    </span>
                                  )}
                                  {game.onSale && (
                                    <span className="rounded bg-cyber-neonPink/20 px-1.5 py-0.5 text-[10px] text-cyber-neonPink font-semibold">
                                      Sale
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right space-x-3">
                                <button
                                  type="button"
                                  className="font-semibold text-cyber-electricBlue hover:underline"
                                  onClick={() => editGame(game)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="font-semibold text-cyber-neonPink hover:underline"
                                  onClick={() => void removeGame(game.id, game.title)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PANEL 2: BUNDLE MAKER (صانع الحزم والعروض)                */}
            {/* ======================================================== */}
            {activeTab === "bundles" && (
              <div className="space-y-8 animate-fadeIn">
                {bundleNotice && (
                  <div
                    className={`rounded-xl border p-3.5 text-xs font-semibold animate-fadeIn ${
                      bundleNotice.type === "success"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-cyber-neonPink/40 bg-cyber-neonPink/10 text-cyber-neonPink"
                    }`}
                  >
                    {bundleNotice.text}
                  </div>
                )}

                {/* Bundle Maker Creation / Edit Form */}
                <form
                  onSubmit={saveBundleForm}
                  className="rounded-2xl border border-cyber-border bg-cyber-surface/90 p-6 sm:p-8 shadow-2xl relative space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between border-b border-cyber-border/70 pb-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyber-electricBlue" />
                        {editingBundleId ? `Edit Bundle: ${bundleForm.name}` : "Bundle Maker (صانع الحزم والعروض)"}
                      </h2>
                      <p className="text-xs text-cyber-muted mt-0.5">
                        Select games from your catalog database, set a discounted bundle price in JOD, and publish the bundle to the store.
                      </p>
                    </div>
                    {editingBundleId && (
                      <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-cyber-electricBlue/20 text-cyber-electricBlue font-bold border border-cyber-electricBlue/40">
                        Editing Bundle
                      </span>
                    )}
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
                    {/* Left: Bundle Metadata */}
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs text-cyber-muted font-medium">
                          Bundle Name (English) *
                          <input
                            className={`${fieldClass} mt-1`}
                            value={bundleForm.name}
                            onChange={(e) => {
                              setBundleForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                                id: editingBundleId ? prev.id : slugify(e.target.value),
                              }));
                            }}
                            placeholder="e.g. Cyberpunk & Blade Duo"
                            required
                          />
                        </label>

                        <label className="text-xs text-cyber-muted font-medium">
                          Bundle Name (Arabic / بالعربية)
                          <input
                            className={`${fieldClass} mt-1`}
                            value={bundleForm.nameAr}
                            onChange={(e) =>
                              setBundleForm((prev) => ({ ...prev, nameAr: e.target.value }))
                            }
                            placeholder="e.g. حزمة السيبربانك والقتال"
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs text-cyber-muted font-medium">
                          Bundle Document ID (Slug)
                          <input
                            className={`${fieldClass} mt-1 font-mono`}
                            value={editingBundleId ?? bundleForm.id}
                            disabled={Boolean(editingBundleId)}
                            onChange={(e) =>
                              setBundleForm((prev) => ({ ...prev, id: e.target.value }))
                            }
                            placeholder="Auto-generated (e.g. cyberpunk-blade-duo)"
                          />
                        </label>

                        <label className="text-xs text-cyber-muted font-medium">
                          Custom Badge Tag
                          <input
                            className={`${fieldClass} mt-1 font-mono`}
                            value={bundleForm.badge}
                            onChange={(e) =>
                              setBundleForm((prev) => ({ ...prev, badge: e.target.value }))
                            }
                            placeholder="e.g. MEGA DEAL, SAVE 40%"
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs text-cyber-muted font-medium">
                          Bundle Price in JOD *
                          <input
                            className={`${fieldClass} mt-1 font-mono text-base font-bold text-cyber-neonPink`}
                            type="number"
                            step="0.01"
                            min="0.1"
                            value={bundleForm.price}
                            onChange={(e) =>
                              setBundleForm((prev) => ({
                                ...prev,
                                price: Number(e.target.value),
                              }))
                            }
                            required
                          />
                        </label>

                        <label className="text-xs text-cyber-muted font-medium">
                          Custom Cover Image URL (optional)
                          <input
                            className={`${fieldClass} mt-1 font-mono`}
                            value={bundleForm.coverImage}
                            onChange={(e) =>
                              setBundleForm((prev) => ({ ...prev, coverImage: e.target.value }))
                            }
                            placeholder="https://... (or auto stack covers)"
                          />
                        </label>
                      </div>

                      <label className="text-xs text-cyber-muted font-medium block">
                        Bundle Description / Overview
                        <textarea
                          className={`${fieldClass} mt-1 min-h-20`}
                          value={bundleForm.description}
                          onChange={(e) =>
                            setBundleForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Short summary of this bundle pack for customers..."
                        />
                      </label>

                      {/* Live Calculation Preview Card */}
                      <div className="rounded-xl bg-gradient-to-br from-cyber-card via-cyber-surface to-cyber-card border border-cyber-electricBlue/40 p-4 space-y-2.5 shadow-lg">
                        <div className="flex items-center justify-between border-b border-cyber-border/60 pb-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-cyber-lightBlue font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyber-electricBlue" />
                            Live Bundle Value Calculation
                          </span>
                          {bundleSavingsPct > 0 && (
                            <span className="font-mono text-xs font-black text-white bg-cyber-neonPink px-2 py-0.5 rounded shadow-neon-pink">
                              SAVE {bundleSavingsPct}%
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-baseline gap-4 font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-cyber-muted block">Selected Games</span>
                            <span className="font-bold text-white text-base">
                              {bundleForm.gameIds.length} {bundleForm.gameIds.length === 1 ? "game" : "games"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-cyber-muted block">Individual Total</span>
                            <span className="font-bold text-cyber-lightBlue text-base">
                              {bundleSumRegular.toFixed(2)} JOD
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-cyber-muted block">Bundle Offer Price</span>
                            <span className="font-black text-cyber-neonPink text-xl">
                              {bundleForm.price.toFixed(2)} JOD
                            </span>
                          </div>
                        </div>

                        {bundleSavings > 0 && (
                          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                            ✓ Customer saves {bundleSavings.toFixed(2)} JOD compared to individual purchases!
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={bundleForm.inStock}
                            onChange={(e) =>
                              setBundleForm((prev) => ({ ...prev, inStock: e.target.checked }))
                            }
                            className="rounded accent-cyber-electricBlue h-4 w-4"
                          />
                          <span>In Stock</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={bundleForm.featured}
                            onChange={(e) =>
                              setBundleForm((prev) => ({ ...prev, featured: e.target.checked }))
                            }
                            className="rounded accent-cyber-neonPink h-4 w-4"
                          />
                          <span>Featured on Storefront</span>
                        </label>
                      </div>
                    </div>

                    {/* Right: Database Game Picker */}
                    <div className="rounded-xl border border-cyber-border bg-cyber-card/60 p-4 space-y-3.5 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-wider text-cyber-electricBlue font-bold flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Choose Database Games ({bundleForm.gameIds.length} Selected)
                        </span>
                        {bundleForm.gameIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setBundleForm((prev) => ({ ...prev, gameIds: [] }))}
                            className="text-[10px] font-mono text-cyber-neonPink hover:underline"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>

                      {/* Selected Games Tray */}
                      {bundleSelectedGames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-cyber-surface/90 border border-cyber-electricBlue/30 max-h-24 overflow-y-auto">
                          {bundleSelectedGames.map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-cyber-electricBlue/15 text-white border border-cyber-electricBlue/40"
                            >
                              <span className="truncate max-w-[120px] font-bold">{g.title}</span>
                              <span className="text-cyber-lightBlue font-mono">({getActivePrice(g)} JOD)</span>
                              <button
                                type="button"
                                onClick={() => toggleGameInBundle(g.id)}
                                className="text-cyber-muted hover:text-cyber-neonPink ml-0.5"
                                title="Remove from bundle"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Search & Category Filter for DB Games */}
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                          <input
                            value={bundleSearch}
                            onChange={(e) => setBundleSearch(e.target.value)}
                            placeholder="Search catalog games..."
                            className="h-8 w-full rounded-lg border border-cyber-border bg-cyber-surface pl-8 pr-2.5 text-xs text-white outline-none focus:border-cyber-electricBlue"
                          />
                        </div>
                        <select
                          value={bundleCatFilter}
                          onChange={(e) => setBundleCatFilter(e.target.value)}
                          className="h-8 rounded-lg border border-cyber-border bg-cyber-surface px-2.5 text-xs text-white outline-none"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Scrollable list of selectable database games */}
                      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                        {filteredCatalogForBundle.map((g) => {
                          const isIn = bundleForm.gameIds.includes(g.id);
                          return (
                            <div
                              key={g.id}
                              onClick={() => toggleGameInBundle(g.id)}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isIn
                                  ? "border-cyber-electricBlue bg-cyber-electricBlue/15 shadow-sm"
                                  : "border-cyber-border/70 bg-cyber-surface/70 hover:border-cyber-border hover:bg-cyber-card"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`h-8 w-8 rounded bg-gradient-to-br ${g.coverClass} border border-white/20 flex items-center justify-center font-mono font-bold text-[9px] text-white shrink-0`}
                                >
                                  {g.abbrev}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs leading-tight">{g.title}</div>
                                  <div className="text-[10px] text-cyber-muted font-mono mt-0.5">
                                    {getActivePrice(g).toFixed(2)} JOD • {g.category}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono transition-colors ${
                                  isIn
                                    ? "bg-cyber-electricBlue text-cyber-bg"
                                    : "bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white"
                                }`}
                              >
                                {isIn ? "✓ Added" : "+ Add"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-cyber-border/70">
                    <button
                      type="submit"
                      disabled={bundleBusy || bundleForm.gameIds.length === 0}
                      className="rounded-xl bg-gradient-to-r from-cyber-electricBlue via-cyber-neonPurple to-cyber-neonPink px-6 py-3 text-sm font-bold shadow-neon-blue hover:opacity-95 transition-all disabled:opacity-50 text-white"
                    >
                      {bundleBusy
                        ? "Saving Bundle..."
                        : editingBundleId
                        ? "Save Bundle Changes"
                        : "+ Create Bundle"}
                    </button>

                    {editingBundleId && (
                      <button
                        type="button"
                        onClick={() => {
                          setBundleForm(emptyBundleForm);
                          setEditingBundleId(null);
                        }}
                        className="rounded-xl border border-cyber-border px-5 py-3 text-sm font-semibold text-cyber-muted hover:text-white"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Existing Bundles Table */}
                <div className="rounded-2xl border border-cyber-border bg-cyber-surface/90 overflow-hidden shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyber-border px-6 py-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyber-neonPink" />
                        Active Bundles on Storefront
                      </h3>
                      <p className="text-xs text-cyber-muted mt-0.5">
                        These bundles appear in the dedicated Bundles section on the user page.
                      </p>
                    </div>
                    <span className="font-mono text-xs px-3 py-1 rounded-full border border-cyber-neonPink/40 bg-cyber-neonPink/10 text-cyber-neonPink font-bold">
                      {bundles.length} {bundles.length === 1 ? "bundle" : "bundles"}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-cyber-card/60 font-mono uppercase text-cyber-muted border-b border-cyber-border">
                        <tr>
                          <th className="px-5 py-3.5">Bundle Name / ID</th>
                          <th className="px-5 py-3.5">Included Games</th>
                          <th className="px-5 py-3.5">Price & Savings</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/50">
                        {bundles.length === 0 && (
                          <tr>
                            <td className="px-5 py-12 text-center text-cyber-muted" colSpan={5}>
                              No bundles created yet. Use the Bundle Maker form above to create your first bundle!
                            </td>
                          </tr>
                        )}
                        {bundles.map((b) => {
                          const gamesInThis = b.gameIds
                            .map((id) => games.find((g) => g.id === id))
                            .filter((g): g is Game => Boolean(g));
                          const sumReg = gamesInThis.reduce(
                            (sum, g) => sum + getActivePrice(g),
                            0
                          );
                          const sav = Math.max(0, sumReg - b.price);
                          const savPct = sumReg > 0 ? Math.round((sav / sumReg) * 100) : 0;

                          return (
                            <tr
                              key={b.id}
                              className={`hover:bg-cyber-card/50 transition-colors ${
                                editingBundleId === b.id
                                  ? "bg-cyber-purple/20 border-l-4 border-l-cyber-electricBlue"
                                  : ""
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="font-bold text-white text-sm">{b.name}</div>
                                {b.nameAr && (
                                  <div className="text-xs text-cyber-muted">{b.nameAr}</div>
                                )}
                                <div className="font-mono text-[10px] text-cyber-muted mt-0.5">
                                  #{b.id}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="space-y-1 max-w-[240px]">
                                  <span className="font-mono text-[10px] text-cyber-electricBlue font-bold block">
                                    {gamesInThis.length} games:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {gamesInThis.map((g) => (
                                      <span
                                        key={g.id}
                                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white border border-cyber-border"
                                      >
                                        {g.title}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 font-mono">
                                <div className="text-cyber-neonPink font-extrabold text-sm">
                                  {b.price.toFixed(2)} JOD
                                </div>
                                {sumReg > b.price && (
                                  <div className="text-cyber-muted text-[11px] line-through">
                                    was {sumReg.toFixed(2)} JOD
                                  </div>
                                )}
                                {savPct > 0 && (
                                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                    Save {sav.toFixed(2)} JOD (-{savPct}%)
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {b.inStock ? (
                                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 font-semibold">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400 font-semibold">
                                      Disabled
                                    </span>
                                  )}
                                  {b.featured && (
                                    <span className="rounded bg-cyber-neonPink/20 px-1.5 py-0.5 text-[10px] text-cyber-neonPink font-semibold">
                                      Featured
                                    </span>
                                  )}
                                  {b.badge && (
                                    <span className="rounded bg-cyber-electricBlue/20 px-1.5 py-0.5 text-[10px] text-cyber-electricBlue font-semibold">
                                      {b.badge}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right space-x-3">
                                <button
                                  type="button"
                                  className="font-semibold text-cyber-electricBlue hover:underline"
                                  onClick={() => editBundle(b)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="font-semibold text-cyber-neonPink hover:underline"
                                  onClick={() => void removeBundle(b.id, b.name)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PANEL 3: CATEGORIES MANAGER                              */}
            {/* ======================================================== */}
            {activeTab === "categories" && (
              <div className="rounded-2xl border border-cyber-border bg-cyber-surface/90 p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyber-border/70 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                      <FolderPlus className="w-5 h-5 text-cyber-electricBlue" />
                      Manage Game Categories (تصنيفات الألعاب)
                    </h2>
                    <p className="text-xs text-cyber-muted mt-0.5">
                      Create custom categories. They will immediately appear in the game editor checklist and in the storefront multi-category toolbar.
                    </p>
                  </div>
                  <span className="font-mono text-xs px-3 py-1 rounded-full border border-cyber-electricBlue/40 bg-cyber-electricBlue/10 text-cyber-electricBlue font-bold">
                    {categories.length} Categories Active
                  </span>
                </div>

                {catNotice && (
                  <div
                    className={`rounded-xl border p-3 text-xs font-semibold animate-fadeIn ${
                      catNotice.type === "success"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-cyber-neonPink/40 bg-cyber-neonPink/10 text-cyber-neonPink"
                    }`}
                  >
                    {catNotice.text}
                  </div>
                )}

                {/* Add Category Form */}
                <form
                  onSubmit={handleCreateCategory}
                  className="grid gap-3.5 sm:grid-cols-3 bg-cyber-card/60 p-4 rounded-xl border border-cyber-border/70 items-end"
                >
                  <label className="text-xs text-cyber-muted font-medium">
                    Category Name (English) *
                    <input
                      className={`${fieldClass} mt-1`}
                      placeholder="e.g. Racing, RPG, Horror"
                      value={newCatEn}
                      onChange={(e) => {
                        setNewCatEn(e.target.value);
                        if (!newCatId) setNewCatId(slugify(e.target.value));
                      }}
                      required
                    />
                  </label>
                  <label className="text-xs text-cyber-muted font-medium">
                    Category Name (Arabic / بالعربية) *
                    <input
                      className={`${fieldClass} mt-1`}
                      placeholder="e.g. سباقات، تقمص أدوار، رعب"
                      value={newCatAr}
                      onChange={(e) => setNewCatAr(e.target.value)}
                      required
                    />
                  </label>
                  <div>
                    <label className="text-xs text-cyber-muted font-medium block mb-1">
                      Category ID (Slug)
                    </label>
                    <div className="flex gap-2">
                      <input
                        className={`${fieldClass} font-mono`}
                        placeholder="e.g. racing"
                        value={newCatId}
                        onChange={(e) => setNewCatId(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={catBusy || !newCatEn.trim()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyber-electricBlue to-cyber-neonPurple hover:opacity-95 text-white font-bold text-xs shrink-0 transition-all disabled:opacity-40 shadow-neon-blue"
                      >
                        {catBusy ? "Adding..." : "+ Add"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Existing Categories Cards */}
                <div className="space-y-2.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-cyber-muted font-semibold block">
                    Active Categories:
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((cat) => {
                      const gameCount = games.filter((g) => {
                        const cats = (g.categories || [g.category]).map((c) => c.toLowerCase());
                        return cats.includes(cat.id.toLowerCase()) || cats.includes(cat.nameEn.toLowerCase());
                      }).length;

                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-cyber-card border border-cyber-border/80 hover:border-cyber-electricBlue/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">{cat.nameEn}</span>
                              <span className="text-xs text-cyber-muted">({cat.nameAr})</span>
                            </div>
                            <div className="font-mono text-[10px] text-cyber-lightBlue mt-0.5">
                              #{cat.id} •{" "}
                              <span className="text-cyber-muted">
                                {gameCount} {gameCount === 1 ? "game" : "games"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat.id, cat.nameEn)}
                            className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-neonPink hover:bg-cyber-neonPink/10 transition-colors"
                            title={`Delete category ${cat.nameEn}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
