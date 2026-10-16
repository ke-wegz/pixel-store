import { ChevronLeft, ChevronRight, Heart, Plus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { type Game, getActivePrice, getOriginalPrice, getDiscountPercent } from "../types";

interface GameCardProps {
  game: Game;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onDetails: (id: string) => void;
  onAdd: (game: Game) => void;
}

export function GameCard({ game, isFav, onToggleFav, onDetails, onAdd }: GameCardProps) {
  const { isAr, t } = useLanguage();

  const displayCategories =
    game.categories && game.categories.length > 0
      ? game.categories
      : [game.category];

  const discount = getDiscountPercent(game);
  const activePrice = getActivePrice(game);
  const originalPrice = getOriginalPrice(game);

  return (
    <article
      className="glass-card group overflow-hidden rounded-2xl flex flex-col justify-between"
      data-testid={`card-product-${game.id}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div
        className={`relative aspect-[1.35/1] p-5 sm:p-6 bg-gradient-to-br ${game.coverClass} overflow-hidden border-b border-cyber-border/40`}
      >
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : null}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-cyber-purple/20 blur-xl" />
        <div className="relative z-10 flex items-start justify-between gap-1">
          <div className="flex flex-wrap gap-1 max-w-[70%]">
            {displayCategories.map((cId) => {
              const label =
                cId === "story"
                  ? t.story
                  : cId === "strategy"
                  ? t.strategy
                  : cId === "action"
                  ? t.action
                  : cId.toUpperCase();
              return (
                <span
                  key={cId}
                  className="font-mono rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white"
                >
                  {label}
                </span>
              );
            })}
          </div>
          <span className="font-mono text-xs font-bold text-cyber-electricBlue shrink-0">{t.offlineTag}</span>
        </div>

        <div className="absolute left-5 right-5 top-12 z-10 flex flex-wrap gap-1 sm:left-6 sm:right-6">
          {game.featured && (
            <span className="rounded bg-cyber-purple/80 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
              {t.featuredTag}
            </span>
          )}
          {game.isNew && (
            <span className="rounded bg-cyber-electricBlue/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-cyber-bg">
              {t.newTag}
            </span>
          )}
          {game.onSale && (
            <span className="rounded bg-cyber-neonPink px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white shadow-neon-pink">
              {t.saleTag}
              {discount > 0 ? ` -${discount}%` : ""}
            </span>
          )}
          {!game.inStock && (
            <span className="rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
              {t.outOfStock}
            </span>
          )}
        </div>

        <div className="absolute inset-x-5 bottom-4 z-10 sm:inset-x-6 sm:bottom-5">
          <div className="font-mono mb-1 text-[10px] uppercase tracking-widest text-cyber-muted">
            {game.tagCode}
          </div>
          <h3 className="font-display max-w-[12ch] text-2xl sm:text-3xl font-extrabold leading-none tracking-tight text-white group-hover:text-cyber-electricBlue transition-colors">
            {game.title}
          </h3>
        </div>

        <div
          className={`absolute -bottom-6 ${
            isAr ? "-left-2" : "-right-2"
          } font-mono text-[7rem] font-black leading-none text-white/5 pointer-events-none select-none`}
        >
          {game.abbrev}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-cyber-card/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-sans text-base font-bold text-white">{game.title}</h4>
            <p className="mt-1 text-xs text-cyber-muted">{game.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onToggleFav(game.id)}
            aria-label={`Save ${game.title}`}
            className="rounded-full p-2 text-cyber-muted hover:bg-cyber-purple/20 hover:text-cyber-neonPink transition-colors shrink-0"
          >
            <Heart
              className={`w-4 h-4 ${isFav ? "fill-cyber-neonPink text-cyber-neonPink" : ""}`}
            />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-cyber-border/60">
          <div>
            {game.onSale && discount > 0 ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span
                  className="font-mono text-lg font-extrabold text-cyber-neonPink"
                  data-testid={`text-price-${game.id}`}
                >
                  {activePrice.toFixed(2)} {t.currency}
                </span>
                <span className="font-mono text-xs text-cyber-muted line-through">
                  {originalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span
                className={`font-mono text-lg font-bold ${
                  game.onSale ? "text-cyber-neonPink" : "text-cyber-electricBlue"
                }`}
                data-testid={`text-price-${game.id}`}
              >
                {activePrice.toFixed(2)} {t.currency}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onDetails(game.id)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-cyber-border bg-cyber-surface text-cyber-muted hover:border-cyber-electricBlue hover:text-cyber-electricBlue transition-all"
              title="View details"
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              type="button"
              disabled={!game.inStock}
              onClick={() => onAdd(game)}
              className="flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold bg-gradient-to-r from-cyber-neonPink to-cyber-purple hover:from-cyber-electricBlue hover:to-cyber-neonPink text-white shadow-neon-pink transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{game.inStock ? t.addToShortlistBtn : t.outOfStock}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
