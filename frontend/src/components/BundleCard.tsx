import { Sparkles, Plus, Eye } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { type Bundle, type Game, getActivePrice } from "../types";

interface BundleCardProps {
  bundle: Bundle;
  allGames: Game[];
  onInspect: (bundle: Bundle) => void;
  onAdd: (bundle: Bundle, gamesInBundle: Game[]) => void;
}

export function BundleCard({
  bundle,
  allGames,
  onInspect,
  onAdd,
}: BundleCardProps) {
  const { isAr, t } = useLanguage();

  const bundledGames = bundle.gameIds
    .map((id) => allGames.find((g) => g.id === id))
    .filter((g): g is Game => Boolean(g));

  const individualTotal = bundledGames.reduce(
    (sum, g) => sum + getActivePrice(g),
    0
  );
  const savings = Math.max(0, individualTotal - bundle.price);
  const savingsPct =
    individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

  const bundleTitle = isAr && bundle.nameAr ? bundle.nameAr : bundle.name;

  return (
    <article
      className="glass-card group overflow-hidden rounded-2xl flex flex-col justify-between border border-cyber-border hover:border-cyber-neonPink/60 transition-all duration-300 relative shadow-xl hover:shadow-neon-pink/20"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Visual Top Header */}
      <div className="relative p-5 sm:p-6 bg-gradient-to-br from-[#380e30] via-[#1a0826] to-[#0c0414] overflow-hidden border-b border-cyber-border/40">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-cyber-neonPink/20 blur-xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-cyber-purple/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-cyber-neonPink bg-cyber-neonPink/20 px-2.5 py-1 rounded-full border border-cyber-neonPink/40 flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
            {bundle.badge || "SPECIAL BUNDLE"}
          </span>

          <span className="font-mono text-[10px] uppercase font-bold text-cyber-electricBlue bg-black/60 px-2 py-0.5 rounded border border-white/10">
            {bundledGames.length} {isAr ? "ألعاب" : "Games"}
          </span>
        </div>

        <div className="relative z-10 mt-4">
          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white group-hover:text-cyber-electricBlue transition-colors line-clamp-1">
            {bundleTitle}
          </h3>
          {bundle.description && (
            <p className="text-xs text-cyber-muted mt-1 line-clamp-2 leading-relaxed">
              {bundle.description}
            </p>
          )}
        </div>

        {/* Mini Game Avatars / Thumbnails Stack */}
        <div className="relative z-10 mt-4 flex items-center gap-1.5 overflow-hidden">
          {bundledGames.slice(0, 4).map((game) => (
            <div
              key={game.id}
              className={`h-9 w-9 rounded-lg bg-gradient-to-br ${game.coverClass} border border-white/20 flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0 shadow`}
              title={game.title}
            >
              {game.coverImage ? (
                <img
                  src={game.coverImage}
                  alt=""
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                game.abbrev
              )}
            </div>
          ))}
          {bundledGames.length > 4 && (
            <div className="h-9 w-9 rounded-lg bg-cyber-surface border border-white/20 flex items-center justify-center font-mono font-bold text-[10px] text-cyber-electricBlue shrink-0">
              +{bundledGames.length - 4}
            </div>
          )}
          <span className="font-mono text-[10px] text-cyber-muted truncate ml-1">
            {bundledGames.map((g) => g.title).slice(0, 2).join(", ")}
            {bundledGames.length > 2 ? "..." : ""}
          </span>
        </div>
      </div>

      {/* Card Content & Action Bar */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-cyber-card/60 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-cyber-muted uppercase block">
              {t.bundlePrice}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-2xl font-black text-cyber-neonPink">
                {bundle.price.toFixed(2)} {t.currency}
              </span>
              {individualTotal > bundle.price && (
                <span className="font-mono text-xs text-cyber-muted line-through">
                  {individualTotal.toFixed(2)} {t.currency}
                </span>
              )}
            </div>
          </div>

          {savingsPct > 0 && (
            <span className="font-mono text-[11px] font-extrabold text-white bg-gradient-to-r from-cyber-neonPink to-cyber-purple px-2 py-1 rounded shadow-neon-pink">
              -{savingsPct}% OFF
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyber-border/60">
          <button
            type="button"
            onClick={() => onInspect(bundle)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-cyber-border bg-cyber-surface hover:border-cyber-electricBlue hover:text-cyber-electricBlue text-xs font-semibold text-white transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.inspectBundle}</span>
          </button>

          <button
            type="button"
            onClick={() => onAdd(bundle, bundledGames)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyber-neonPink to-cyber-purple hover:opacity-95 text-xs font-bold text-white shadow-neon-pink transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addBundleBtn}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
