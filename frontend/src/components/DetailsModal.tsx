import { X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { type Game, getActivePrice, getOriginalPrice, getDiscountPercent } from "../types";

interface DetailsModalProps {
  game: Game | null;
  onClose: () => void;
  onAdd: (game: Game) => void;
}

export function DetailsModal({ game, onClose, onAdd }: DetailsModalProps) {
  const { isAr, t } = useLanguage();

  if (!game) return null;

  const discount = getDiscountPercent(game);
  const activePrice = getActivePrice(game);
  const originalPrice = getOriginalPrice(game);

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
          aria-label="Close details"
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />
        <div className="relative inline-block align-bottom bg-cyber-surface border border-cyber-border rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 ${
              isAr ? "left-4" : "right-4"
            } z-10 p-1.5 rounded-full bg-black/60 text-cyber-muted hover:text-white transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
          <div className={`p-6 sm:p-8 bg-gradient-to-br ${game.coverClass} relative`}>
            {game.coverImage ? (
              <img
                src={game.coverImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            ) : null}
            <div className="relative text-left" dir={isAr ? "rtl" : "ltr"}>
              <div className="flex flex-wrap items-center gap-1.5">
                {(game.categories && game.categories.length > 0
                  ? game.categories
                  : [game.category]
                ).map((cId) => (
                  <span
                    key={cId}
                    className="font-mono text-[10px] uppercase tracking-wider text-cyber-electricBlue bg-black/60 px-2.5 py-1 rounded border border-white/10"
                  >
                    {cId}
                  </span>
                ))}
                <span className="font-mono text-[10px] uppercase tracking-wider text-cyber-neonPink bg-black/60 px-2.5 py-1 rounded border border-white/10">
                  {t.detailsOfflineBadge}
                </span>
              </div>
              <h3 className="font-display text-3xl font-extrabold text-white mt-3">{game.title}</h3>
              <p className="font-mono text-xs text-cyber-muted mt-1">{game.tagCode}</p>
            </div>
          </div>
          <div className="p-6 space-y-4 bg-cyber-surface text-left" dir={isAr ? "rtl" : "ltr"}>
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-cyber-muted">
                {t.detailsOverview}
              </h4>
              <p className="text-xs leading-relaxed text-gray-300 mt-1">{game.description}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-cyber-neonPink block mb-1">
                {t.detailsSpecs}:
              </span>
              <span className="text-cyber-lightBlue font-mono">{game.specs}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-cyber-border">
              <div>
                <span className="text-[10px] font-mono text-cyber-muted uppercase">
                  {t.totalPrice}:
                </span>
                {game.onSale && discount > 0 ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-black text-cyber-neonPink">
                      {activePrice.toFixed(2)} {t.currency}
                    </span>
                    <span className="font-mono text-xs text-cyber-muted line-through">
                      {originalPrice.toFixed(2)} {t.currency}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-cyber-neonPink bg-cyber-neonPink/20 px-1.5 py-0.5 rounded">
                      -{discount}%
                    </span>
                  </div>
                ) : (
                  <div
                    className={`font-mono text-2xl font-bold ${
                      game.onSale ? "text-cyber-neonPink" : "text-cyber-electricBlue"
                    }`}
                  >
                    {activePrice.toFixed(2)} {t.currency}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={!game.inStock}
                onClick={() => {
                  onAdd(game);
                  onClose();
                }}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyber-neonPink to-cyber-purple hover:opacity-95 text-xs font-bold text-white shadow-neon-pink disabled:opacity-40 transition-all"
              >
                {game.inStock ? t.addShortlist : t.outOfStock}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
