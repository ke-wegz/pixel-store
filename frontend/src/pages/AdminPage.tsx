import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Flame, Tag } from "lucide-react";
import iconSvg from "../assets/icon.svg";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db, GAMES_COLLECTION } from "../lib/firebase";
import { emptyGame, gameToPayload, slugify } from "../lib/gameMapper";
import { useAuth } from "../hooks/useAuth";
import { useGames } from "../hooks/useGames";
import type { Game, GameCategory } from "../types";

const fieldClass =
  "w-full rounded-xl border border-cyber-border bg-cyber-surface px-3 py-2 text-sm text-white outline-none focus:border-cyber-electricBlue transition-colors";

export function AdminPage() {
  const { user, ready, login, logout, configured } = useAuth();
  const { games, loading, error: firestoreError } = useGames();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [form, setForm] = useState<Game>(emptyGame());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      await setDoc(doc(db, GAMES_COLLECTION, id), gameToPayload({ ...form, id }), {
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
    setForm(game);
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
                  Category
                  <select
                    className={`${fieldClass} mt-1`}
                    value={form.category}
                    onChange={(e) => patch("category", e.target.value as GameCategory)}
                  >
                    <option value="action">Action</option>
                    <option value="story">Story</option>
                    <option value="strategy">Strategy</option>
                  </select>
                </label>

                <label className="text-xs text-cyber-muted font-medium">
                  Price in JOD *
                  <input
                    className={`${fieldClass} mt-1 font-mono`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => patch("price", Number(e.target.value))}
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
                <div className="sm:col-span-2 rounded-xl border border-cyber-neonPink/40 bg-cyber-card/60 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyber-border/70 pb-3">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.onSale}
                        onChange={(e) => patch("onSale", e.target.checked)}
                        className="rounded accent-cyber-neonPink h-4 w-4"
                      />
                      <span className="text-cyber-neonPink font-mono uppercase tracking-wider text-sm flex items-center gap-1.5 font-extrabold">
                        <Flame className="w-4 h-4 text-cyber-neonPink animate-pulse" />
                        Put this game On Sale (تفعيل الخصم)
                      </span>
                    </label>
                    {form.onSale && (
                      <span className="rounded-full bg-cyber-neonPink/20 border border-cyber-neonPink/60 px-3 py-0.5 font-mono text-[11px] font-bold text-cyber-neonPink shadow-neon-pink">
                        🔥 SALE ACTIVE
                      </span>
                    )}
                  </div>

                  {form.onSale ? (
                    <div className="grid gap-4 sm:grid-cols-2 pt-1">
                      <label className="text-xs text-cyber-muted font-medium">
                        Original / Regular Price in JOD (قبل الخصم)
                        <input
                          className={`${fieldClass} mt-1 font-mono`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 3.50 (regular price)"
                          value={form.originalPrice ?? ""}
                          onChange={(e) =>
                            patch(
                              "originalPrice",
                              e.target.value === "" ? undefined : Number(e.target.value)
                            )
                          }
                        />
                        <span className="text-[10px] text-cyber-muted block mt-1">
                          The regular crossed-out price shown to customers.
                        </span>
                      </label>

                      <div className="flex flex-col justify-between rounded-xl bg-cyber-surface/90 border border-cyber-border p-3 text-xs font-mono">
                        <span className="text-cyber-muted uppercase text-[10px] font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-cyber-neonPink" /> Discount Calculation Logic
                        </span>
                        {form.originalPrice && form.originalPrice > form.price ? (
                          <div className="space-y-1 mt-1.5">
                            <div className="text-cyber-neonPink font-extrabold text-sm flex items-center gap-1.5">
                              <span>Save {Math.round((1 - form.price / form.originalPrice) * 100)}%</span>
                              <span className="text-cyber-lightBlue text-xs font-normal">
                                ({(form.originalPrice - form.price).toFixed(2)} JOD off)
                              </span>
                            </div>
                            <div className="text-cyber-muted text-[11px]">
                              Was <span className="line-through">{form.originalPrice.toFixed(2)} JOD</span> → Sale Price:{" "}
                              <span className="text-white font-bold">{form.price.toFixed(2)} JOD</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-cyber-muted text-[11px] mt-1.5 leading-relaxed">
                            Sale price: <span className="text-cyber-neonPink font-bold">{form.price.toFixed(2)} JOD</span>
                            {form.originalPrice && form.originalPrice <= form.price ? (
                              <span className="text-amber-400 block mt-1 font-semibold">
                                ⚠ Original price must be higher than sale price ({form.price.toFixed(2)} JOD) to display discount badge.
                              </span>
                            ) : (
                              <span className="block mt-0.5 text-cyber-muted">
                                Enter the original price on the left to show the strikethrough discount!
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-cyber-muted">
                      Check the box above to activate sale pricing, set an original crossed-out price, and highlight this title in the “On Sale” shelf filter.
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
                            {game.onSale && game.originalPrice && game.originalPrice > game.price ? (
                              <div>
                                <div className="text-cyber-neonPink font-extrabold flex items-center gap-1.5">
                                  <span>{game.price.toFixed(2)} JOD</span>
                                  <span className="text-[10px] bg-cyber-neonPink/20 text-cyber-neonPink px-1 py-0.2 rounded font-bold">
                                    -{Math.round((1 - game.price / game.originalPrice) * 100)}%
                                  </span>
                                </div>
                                <div className="text-cyber-muted text-[11px] line-through font-normal">
                                  was {game.originalPrice.toFixed(2)} JOD
                                </div>
                              </div>
                            ) : (
                              <span className={game.onSale ? "text-cyber-neonPink font-bold" : "text-cyber-electricBlue"}>
                                {game.price.toFixed(2)} JOD
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
