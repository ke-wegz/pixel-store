import { X, Layers, Sparkles, MessageCircle, ShoppingBag } from "lucide-react";
import { Instagram } from "./icons/Instagram";
import { useLanguage } from "../context/LanguageContext";
import { waLink, openInstagramDirect, copyTextToClipboard } from "../lib/messaging";
import { type Bundle, type Game, getActivePrice } from "../types";

interface BundleModalProps {
  bundle: Bundle | null;
  allGames: Game[];
  onClose: () => void;
  onAddBundle: (bundle: Bundle, gamesInBundle: Game[]) => void;
}

export function BundleModal({
  bundle,
  allGames,
  onClose,
  onAddBundle,
}: BundleModalProps) {
  const { isAr, t } = useLanguage();

  if (!bundle) return null;

  // Resolve games included in this bundle
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

  const orderMessage = isAr
    ? `مرحباً متجر بيكسل! أود طلب حزمة الألعاب: "${bundleTitle}" (${bundle.price.toFixed(
        2
      )} د.أ).\nالألعاب المتضمنة:\n${bundledGames
        .map((g) => `• ${g.title}`)
        .join("\n")}`
    : `Hello Pixel Store! I would like to order the bundle: "${bundle.name}" (${bundle.price.toFixed(
        2
      )} JOD).\nIncluded games:\n${bundledGames
        .map((g) => `• ${g.title}`)
        .join("\n")}`;

  async function handleInstagramCheckout() {
    await copyTextToClipboard(orderMessage);
    openInstagramDirect(orderMessage);
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:p-0">
        <button
          type="button"
          aria-label="Close bundle modal"
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <div className="relative inline-block align-bottom bg-cyber-surface border border-cyber-border rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 ${
              isAr ? "left-4" : "right-4"
            } z-20 p-2 rounded-full bg-black/60 text-cyber-muted hover:text-white transition-colors border border-white/10`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Header */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#4a154b] via-[#240b36] to-[#0d0417] border-b border-cyber-border/70 overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-cyber-neonPink/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-cyber-purple/20 blur-2xl pointer-events-none" />

            <div className="relative z-10" dir={isAr ? "rtl" : "ltr"}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-cyber-neonPink bg-cyber-neonPink/20 px-2.5 py-1 rounded-full border border-cyber-neonPink/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {bundle.badge || "SPECIAL BUNDLE"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-cyber-electricBlue bg-black/50 px-2.5 py-1 rounded-full border border-white/10">
                  {bundledGames.length}{" "}
                  {isAr ? "ألعاب في الحزمة" : "Games Included"}
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-black text-white">
                {bundleTitle}
              </h3>
              {bundle.description && (
                <p className="text-xs sm:text-sm text-cyber-muted mt-2 max-w-xl leading-relaxed">
                  {bundle.description}
                </p>
              )}
            </div>
          </div>

          {/* Games List in Bundle */}
          <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between pb-1 border-b border-cyber-border/50">
              <span className="font-mono text-xs uppercase tracking-wider text-cyber-electricBlue font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {t.includedGames} ({bundledGames.length})
              </span>
              <span className="text-[11px] font-mono text-cyber-muted">
                {isAr ? "تفعيل أوفلاين فوري لكل لعبة" : "Instant offline activation"}
              </span>
            </div>

            <div className="space-y-3">
              {bundledGames.map((game, index) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-cyber-card border border-cyber-border/80 hover:border-cyber-purple/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-lg bg-gradient-to-br ${game.coverClass} border border-cyber-border flex items-center justify-center font-mono font-black text-xs text-white/90 shrink-0 shadow-inner`}
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-cyber-muted font-bold">
                          #{index + 1}
                        </span>
                        <h4 className="font-bold text-white text-sm">{game.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {(game.categories && game.categories.length > 0
                          ? game.categories
                          : [game.category]
                        ).map((catId) => (
                          <span
                            key={catId}
                            className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/40 text-cyber-lightBlue border border-cyber-border/50"
                          >
                            {catId}
                          </span>
                        ))}
                        {game.specs && (
                          <span className="text-[10px] text-cyber-muted hidden sm:inline">
                            • {game.specs}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="font-mono text-right shrink-0">
                    <span className="text-xs text-cyber-muted block">
                      {isAr ? "السعر المنفرد" : "Regular"}
                    </span>
                    <span className="text-xs font-bold text-cyber-pureWhite">
                      {getActivePrice(game).toFixed(2)} {t.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Footer Actions */}
          <div
            className="p-6 bg-cyber-card/90 border-t border-cyber-border/80 flex flex-col sm:flex-row items-center justify-between gap-4"
            dir={isAr ? "rtl" : "ltr"}
          >
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-3xl font-black text-cyber-neonPink">
                  {bundle.price.toFixed(2)} {t.currency}
                </span>
                {individualTotal > bundle.price && (
                  <span className="font-mono text-sm text-cyber-muted line-through">
                    {individualTotal.toFixed(2)} {t.currency}
                  </span>
                )}
                {savingsPct > 0 && (
                  <span className="font-mono text-xs font-bold text-white bg-gradient-to-r from-cyber-neonPink to-cyber-purple px-2 py-0.5 rounded shadow-neon-pink">
                    -{savingsPct}% OFF
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-[11px] font-mono text-emerald-400 mt-1">
                  ✓ {isAr ? "توفر مع هذه الحزمة" : "You save"}{" "}
                  {savings.toFixed(2)} {t.currency}!
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={waLink(orderMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                title="Order directly on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleInstagramCheckout}
                className="p-2.5 rounded-xl border border-cyber-border bg-cyber-surface hover:border-cyber-neonPink text-cyber-muted hover:text-white transition-all"
                title="Order on Instagram"
              >
                <Instagram className="w-4 h-4 text-cyber-neonPink" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddBundle(bundle, bundledGames);
                  onClose();
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyber-neonPink to-cyber-purple hover:opacity-95 text-white font-bold text-xs shadow-neon-pink transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.addBundleBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
