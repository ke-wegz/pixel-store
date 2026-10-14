import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Flame, Tag, FolderPlus, Trash2, Layers } from "lucide-react";
import iconSvg from "../assets/icon.svg";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db, GAMES_COLLECTION } from "../lib/firebase";
import { emptyGame, gameToPayload, slugify } from "../lib/gameMapper";
import { useAuth } from "../hooks/useAuth";
import { useGames } from "../hooks/useGames";
import { useCategories } from "../hooks/useCategories";
import { type Game, type GameCategory, getActivePrice, getOriginalPrice, getDiscountPercent } from "../types";

const fieldClass =
  "w-full rounded-xl border border-cyber-border bg-cyber-surface px-3 py-2 text-sm text-white outline-none focus:border-cyber-electricBlue transition-colors";

export function AdminPage() {
  const { user, ready, login, logout, configured } = useAuth();
  const { games, loading, error: firestoreError } = useGames();
  const { categories, addCategory, deleteCategory } = useCategories();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [form, setForm] = useState<Game>(emptyGame());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  async function saveGame(e: FormEvent) {
    e.preventDefault();
    if (!db) {
      setNotice({ type: "error", text: "Firestore database is not connected." });
      return;
    }
    const id = editingId || form.id || slugify(form.title);
    if (!id || !form.title.trim()) {
      setNotice({ type: "error", text: "Game Title is required." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const payloadGame: Game = {
        ...form,
        id,
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
      await setDoc(doc(db, GAMES_COLLECTION, id), gameToPayload(payloadGame), {
        merge: true,
      });
      const actionName = editingId ? "updated" : "added";
      setNotice({
        type: "success",
        text: `✓ Game '${form.title}' successfully ${actionName} in Firestore.`,
      });
      setForm(emptyGame());
      setEditingId(null);
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? `Firestore save error: ${err.message}` : "Failed to save game.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeGame(id: string, title: string) {
    if (!db) return;
    if (!confirm(`Are you sure you want to delete '${title}' (${id}) from Firestore?`)) return;
    setBusy(true);
    setNotice(null);
    try {
      await deleteDoc(doc(db, GAMES_COLLECTION, id));
      if (editingId === id) {
        setForm(emptyGame());
        setEditingId(null);
      }
      setNotice({ type: "success", text: `✓ Game '${title}' deleted from Firestore.` });
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
    // If game has old format where originalPrice was greater than price:
    if (game.onSale && game.originalPrice && game.originalPrice > game.price && !game.salePrice) {
      const orig = game.originalPrice;
      const sale = game.price;
      const pct = Math.round((1 - sale / orig) * 100);
      setForm({
        ...game,
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
        price: orig,
        originalPrice: orig,
        salePrice: sale,
        discountPercent: pct,
      });
    }
    setEditingId(game.id);
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
    const count = games.filter((g) => g.category.toLowerCase() === id.toLowerCase()).length;
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

  return (
    <div className="min-h-screen bg-cyber-bg px-4 py-8 text-white cyber-grid selection:bg-cyber-neonPink selection:text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-cyber-border/70 pb-5">
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
                  Pixel Store / Firestore Database Manager
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

        {/* Firebase Config Notice */}
        {!configured && (
          <div className="rounded-2xl border border-cyber-neonPink/40 bg-cyber-surface p-6 text-sm leading-6 text-cyber-muted mb-6">
            <p className="font-bold text-white">Firebase is not configured in .env.</p>
            <p className="text-xs mt-1">Ensure your Firebase project keys are placed inside .env.</p>
          </div>
        )}

        {/* Authentication Card */}
        {configured && ready && !user && (
          <div className="mx-auto max-w-md rounded-2xl border border-cyber-border bg-cyber-surface p-8 shadow-2xl">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-white">Firebase Authentication</h2>
              <p className="text-xs text-cyber-muted mt-1 leading-5">
                Sign in with the Admin email and password created in your Firebase Console to manage your live game catalog.
              </p>
            </div>

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
          </div>
        )}

        {/* Authenticated Admin Workspace */}
        {user && (
          <div className="space-y-8">
            {/* Session Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyber-border bg-cyber-surface/90 px-5 py-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-cyber-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Firebase Admin:</span>
                <span className="font-mono font-bold text-cyber-electricBlue">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-xl border border-cyber-border px-3.5 py-1.5 text-xs font-semibold text-cyber-muted hover:border-cyber-neonPink hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Notification Banner */}
            {notice && (
              <div
                className={`rounded-xl border p-3.5 text-xs font-semibold ${
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
                Firestore listener error: {firestoreError}. Make sure your Firestore Rules allow read operations!
              </div>
            )}

            {/* Form: Add or Edit a Game */}
            <form
              onSubmit={saveGame}
              className="rounded-2xl border border-cyber-border bg-cyber-surface/90 p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-cyber-border/70 pb-4 mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {editingId ? `Edit Game: ${form.title || editingId}` : "Add Game to Firestore"}
                  </h2>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    {editingId
                      ? "Update game fields and save changes directly to Firebase Firestore."
                      : "Fill in the details below to publish a new game entry directly into Firebase."}
                  </p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-cyber-border px-3 py-1.5 text-xs font-semibold text-cyber-muted hover:text-white"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs text-cyber-muted font-medium">
                  Title *
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

                <label className="text-xs text-cyber-muted font-medium">
                  Category *
                  <select
                    className={`${fieldClass} mt-1`}
                    value={form.category}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = categories.find((c) => c.id === selectedId);
                      patch("category", selectedId);
                      patch("categoryLabel", matched?.nameEn || selectedId);
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn} ({cat.nameAr})
                      </option>
                    ))}
                  </select>
                </label>

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
                  <span className="text-[10px] text-cyber-muted block mt-1">
                    Standard regular price for this game.
                  </span>
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

                <label className="text-xs text-cyber-muted font-medium sm:col-span-2">
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

                {/* Dedicated Sale Field & Required Logic */}
                <div className="sm:col-span-2 rounded-xl border border-cyber-neonPink/40 bg-cyber-card/60 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyber-border/70 pb-3">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.onSale}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const pct = form.discountPercent || 25;
                          const sale = checked
                            ? Number((form.price * (1 - pct / 100)).toFixed(2))
                            : undefined;
                          setForm((prev) => ({
                            ...prev,
                            onSale: checked,
                            discountPercent: checked ? pct : undefined,
                            salePrice: sale,
                            originalPrice: prev.price,
                          }));
                        }}
                        className="rounded accent-cyber-neonPink h-4 w-4"
                      />
                      <span className="text-cyber-neonPink font-mono uppercase tracking-wider text-sm flex items-center gap-1.5 font-extrabold">
                        <Flame className="w-4 h-4 text-cyber-neonPink animate-pulse" />
                        Put this game On Sale (تفعيل الخصم)
                      </span>
                    </label>
                    {form.onSale && (
                      <span className="rounded-full bg-cyber-neonPink/20 border border-cyber-neonPink/60 px-3 py-0.5 font-mono text-[11px] font-bold text-cyber-neonPink shadow-neon-pink">
                        🔥 SALE ACTIVE: {form.discountPercent || 25}% OFF
                      </span>
                    )}
                  </div>

                  {form.onSale ? (
                    <div className="space-y-4 pt-1">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Option 1: Percentage Sale Slider */}
                        <div className="rounded-xl bg-cyber-surface/90 border border-cyber-border/80 p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-cyber-lightBlue font-semibold flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-cyber-neonPink" />
                              Sale Percentage Slider (نسبة الخصم)
                            </span>
                            <span className="font-mono font-extrabold text-cyber-neonPink text-sm bg-cyber-neonPink/20 border border-cyber-neonPink/40 px-2 py-0.5 rounded-lg shadow-sm">
                              {form.discountPercent || 25}% OFF
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
                            className="w-full accent-cyber-neonPink cursor-pointer h-2.5 bg-cyber-card rounded-lg"
                          />

                          <div className="flex justify-between text-[10px] font-mono text-cyber-muted px-0.5">
                            <span>5%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>90%</span>
                          </div>
                        </div>

                        {/* Option 2: Flat Sale Price Input */}
                        <div className="rounded-xl bg-cyber-surface/90 border border-cyber-border/80 p-3.5 space-y-2">
                          <label className="text-xs text-cyber-lightBlue font-semibold block">
                            Flat Sale Price in JOD (السعر المخفض المباشر)
                          </label>
                          <input
                            className={`${fieldClass} mt-1 font-mono`}
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={form.price > 0 ? form.price : undefined}
                            placeholder="e.g. 1.50"
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
                          <span className="text-[10px] text-cyber-muted block">
                            Either slide the percentage on the left or type a flat sale price here.
                          </span>
                        </div>
                      </div>

                      {/* Live Calculation & Breakdown */}
                      <div className="rounded-xl bg-gradient-to-r from-cyber-card via-cyber-surface to-cyber-card border border-cyber-neonPink/40 p-3.5 text-xs font-mono">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyber-border/60 pb-2">
                          <span className="text-cyber-muted uppercase text-[10px] font-bold">
                            Live Customer Price Preview
                          </span>
                          <span className="rounded bg-cyber-neonPink px-2 py-0.5 text-[10px] font-extrabold text-white shadow-neon-pink">
                            SALE -{form.discountPercent || 25}%
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-baseline gap-3">
                          <span className="text-cyber-neonPink font-extrabold text-2xl">
                            {(
                              form.salePrice ??
                              Number((form.price * (1 - (form.discountPercent || 25) / 100)).toFixed(2))
                            ).toFixed(2)}{" "}
                            JOD
                          </span>
                          <span className="text-cyber-muted line-through text-sm">
                            was {form.price.toFixed(2)} JOD
                          </span>
                          <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded">
                            Customer saves{" "}
                            {(
                              form.price -
                              (form.salePrice ??
                                Number((form.price * (1 - (form.discountPercent || 25) / 100)).toFixed(2)))
                            ).toFixed(2)}{" "}
                            JOD ({form.discountPercent || 25}% off)
                          </span>
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
                    {busy ? "Saving to Firestore..." : editingId ? "Save Game Changes" : "+ Add Game to Firestore"}
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

            {/* Separate Section: Manage Game Categories */}
            <div className="rounded-2xl border border-cyber-border bg-cyber-surface/90 p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyber-border/70 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-cyber-electricBlue" />
                    Manage Game Categories (تصنيفات الألعاب)
                  </h2>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    Separate section to create custom categories. New categories will instantly appear in the game editor dropdown and on the store shelf toolbar.
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
                  Active Categories on Shelf:
                </span>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat) => {
                    const gameCount = games.filter(
                      (g) => g.category.toLowerCase() === cat.id.toLowerCase()
                    ).length;
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

            {/* Live Firestore Catalog Table */}
            <div className="rounded-2xl border border-cyber-border bg-cyber-surface/90 overflow-hidden shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyber-border px-6 py-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Live Firestore Games</h3>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    Showing all document entries currently stored in your Firebase Firestore database.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-3 py-1 rounded-full border border-cyber-electricBlue/40 bg-cyber-electricBlue/10 text-cyber-electricBlue font-bold">
                    {games.length} {games.length === 1 ? "game" : "games"} in Firestore
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cyber-card/60 font-mono uppercase text-cyber-muted border-b border-cyber-border">
                    <tr>
                      <th className="px-5 py-3.5">Title / ID</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Price</th>
                      <th className="px-5 py-3.5">Flags</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/50">
                    {loading && (
                      <tr>
                        <td className="px-5 py-10 text-center text-cyber-muted" colSpan={5}>
                          <div className="flex items-center justify-center gap-2">
                            <span className="h-3 w-3 rounded-full border-2 border-cyber-electricBlue border-t-transparent animate-spin"></span>
                            <span>Connecting and streaming documents from Firestore...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!loading && games.length === 0 && (
                      <tr>
                        <td className="px-5 py-12 text-center" colSpan={5}>
                          <div className="max-w-md mx-auto space-y-2">
                            <p className="font-display text-base font-bold text-white">No games in Firestore yet</p>
                            <p className="text-xs text-cyber-muted leading-5">
                              Your Firestore database is currently empty. Use the form above to add your very first game!
                            </p>
                          </div>
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
                            <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded-full border border-cyber-border bg-cyber-card text-cyber-lightBlue">
                              {game.category}
                            </span>
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
      </div>
    </div>
  );
}
