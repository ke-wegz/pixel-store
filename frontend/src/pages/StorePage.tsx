import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Flame,
  Frown,
  Gamepad2,
  HelpCircle,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import iconSvg from "../assets/icon.svg";
import { Header } from "../components/Header";
import { GameCard } from "../components/GameCard";
import { DetailsModal } from "../components/DetailsModal";
import { ShortlistDrawer } from "../components/ShortlistDrawer";
import { useCart } from "../context/CartContext";
import { useGames } from "../hooks/useGames";
import { useLanguage } from "../context/LanguageContext";
import { faqsData } from "../lib/translations";
import { waLink } from "../lib/messaging";
import { useCategories } from "../hooks/useCategories";
import type { GameCategory } from "../types";

type ShelfFilter = "all" | "sale" | GameCategory;

export function StorePage() {
  const { games, loading, error } = useGames();
  const { categories } = useCategories();
  const { addToShortlist } = useCart();
  const { isAr, lang, t } = useLanguage();

  const [category, setCategory] = useState<ShelfFilter>("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = faqsData[lang];

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: games.length,
      sale: games.filter((g) => g.onSale).length,
    };
    categories.forEach((cat) => {
      map[cat.id] = games.filter(
        (g) => g.category.toLowerCase() === cat.id.toLowerCase()
      ).length;
    });
    return map;
  }, [games, categories]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return games.filter((game) => {
      const matchCat =
        category === "all"
          ? true
          : category === "sale"
          ? Boolean(game.onSale)
          : game.category.toLowerCase() === category.toLowerCase();
      const matchQuery =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.subtitle.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [games, category, query]);

  const detailsGame = games.find((g) => g.id === detailsId) ?? null;

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function padCount(n: number) {
    return n < 10 ? `0${n}` : String(n);
  }

  const tabClass = (id: ShelfFilter) =>
    category === id
      ? "shelf-tab whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-all bg-cyber-neonPink text-white shadow-neon-pink"
      : "shelf-tab whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-all bg-cyber-surface text-cyber-muted hover:text-white border border-cyber-border";

  return (
    <div
      className="cyber-grid min-h-screen relative overflow-x-hidden selection:bg-cyber-neonPink selection:text-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="ambient-glow bg-cyber-purple top-10 -left-20" />
      <div className="ambient-glow bg-cyber-electricBlue top-96 -right-20" />
      <div className="ambient-glow bg-cyber-neonPink bottom-96 left-1/3" />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 relative z-20">
        <Header />

        {error && (
          <div className="mb-4 rounded-xl border border-cyber-electricBlue/40 bg-cyber-surface/80 px-4 py-3 text-xs text-cyber-muted">
            {isAr
              ? `تعذر تحميل أحدث الألعاب من قاعدة البيانات (${error}). يتم التحقق من الاتصال.`
              : `Could not load latest games from database (${error}). Check your Firestore rules.`}
          </div>
        )}

        {/* Hero Section */}
        <section className="relative grid min-h-[580px] items-center py-10 sm:py-16 lg:min-h-[640px] lg:grid-cols-[1.05fr_.95fr] lg:gap-12 lg:py-18">
          <div className="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full bg-cyber-purple/15 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-cyber-surface border border-cyber-neonPink/40 text-cyber-neonPink font-mono text-xs uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyber-neonPink opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyber-neonPink" />
              </span>
              {t.heroBadge}
            </div>

            <h1 className="font-display mt-6 text-[clamp(3.5rem,8vw,7.2rem)] font-extrabold leading-[.9] tracking-tight text-cyber-pureWhite">
              {t.heroTitle1}
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyber-electricBlue via-cyber-neonPurple to-cyber-neonPink text-glow-pink">
                {t.heroTitle2}
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-cyber-muted sm:text-lg">
              {t.heroDesc}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#shelf"
                className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyber-neonPink via-cyber-purple to-cyber-electricBlue px-6 py-4 text-sm font-bold text-white shadow-neon-pink transition-all hover:scale-105"
              >
                {t.browseShelf}
                <ArrowDownRight
                  className={`w-4 h-4 transition-transform ${isAr ? "rotate-90 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
                    } group-hover:translate-y-0.5`}
                />
              </a>
              <a
                href={waLink(
                  isAr
                    ? "مرحباً متجر بيكسل! هل يمكنكم مساعدتي في اختيار لعبة لسهرة اليوم؟"
                    : "Hello! Can you help me pick a game tonight?"
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-cyber-border bg-cyber-surface/80 px-5 py-4 text-sm font-semibold text-cyber-pureWhite transition-all hover:border-cyber-electricBlue hover:text-cyber-electricBlue hover:shadow-neon-blue"
              >
                <MessageCircle className="w-4 h-4 text-cyber-electricBlue" /> {t.askForPick}
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] text-cyber-muted">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyber-electricBlue" /> {t.trustPrice}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyber-neonPink" /> {t.trustReply}
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyber-neonPurple" /> {t.trustOffline}
              </span>
            </div>
          </div>

          <div className="relative mx-auto mt-12 w-full max-w-[600px] lg:mt-0">
            <div className="absolute -inset-4 rounded-[2.5rem] border border-cyber-purple/20 sm:-inset-6 pointer-events-none" />
            <div className="relative grid grid-cols-2 gap-3.5 sm:gap-4">
              <div className="col-span-2 aspect-[2.1/1] overflow-hidden rounded-2xl border border-cyber-border bg-gradient-to-br from-[#260f4d] via-[#16082e] to-[#0c0419] p-6 shadow-2xl relative">
                <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-cyber-electricBlue/20 blur-2xl" />
                <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-cyber-neonPink/20 blur-2xl" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyber-electricBlue font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyber-electricBlue animate-pulse" />{" "}
                      {isAr ? "إشارة السهرة" : "Tonight’s signal"}
                    </span>
                    <Sparkles className="w-5 h-5 text-cyber-neonPink" />
                  </div>
                  <div>
                    <p className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
                      {isAr ? "سهرتك مستمرة؟" : "You’re still up."}
                    </p>
                    <p className="mt-2 text-xs font-mono text-cyber-lightBlue">
                      {isAr
                        ? "اختر لعبتك الآن. تفعيل فوري لمنصة ستيم."
                        : "Make it worth it. Instant Steam setup."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="font-mono mt-5 text-center text-[10px] uppercase tracking-[.2em] text-cyber-muted flex items-center justify-center gap-1">
              {isAr ? "مرر للأسفل لاكتشاف الألعاب" : "scroll for the good part"}{" "}
              <ChevronDown className="w-3.5 h-3.5 animate-bounce text-cyber-electricBlue" />
            </p>
          </div>
        </section>

        {/* The Shelf Section */}
        <section id="shelf" className="scroll-mt-8 border-t border-cyber-border/70 py-16 sm:py-24">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyber-neonPink font-bold">
                <span className="h-0.5 w-6 bg-cyber-neonPink" />
                {t.shelfBadge}
              </div>
              <h2 className="font-display mt-3 max-w-lg text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                {t.shelfTitle1}
                <br />
                <span className="text-cyber-electricBlue text-glow-blue">{t.shelfTitle2}</span>
              </h2>
            </div>
            <div className="max-w-xs text-sm leading-6 text-cyber-muted">{t.shelfSubtitle}</div>
          </div>

          {/* Toolbar */}
          <div className="mt-10 flex flex-col gap-4 border-y border-cyber-border/80 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 font-mono text-xs" role="tablist">
              <button type="button" onClick={() => setCategory("all")} className={tabClass("all")}>
                {t.allGames} <span className="ml-1 text-[10px] opacity-80">{counts.all}</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory("sale")}
                className={
                  category === "sale"
                    ? "shelf-tab whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-all bg-gradient-to-r from-cyber-neonPink to-cyber-purple text-white shadow-neon-pink flex items-center gap-1.5"
                    : "shelf-tab whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-all bg-cyber-surface text-cyber-neonPink hover:text-white border border-cyber-neonPink/40 hover:border-cyber-neonPink flex items-center gap-1.5"
                }
              >
                <Flame className="w-3.5 h-3.5 text-cyber-neonPink animate-pulse" />
                <span>{t.onSaleTab}</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyber-neonPink/20 text-white font-mono">
                  {padCount(counts.sale)}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={tabClass(cat.id)}
                >
                  {isAr ? cat.nameAr : cat.nameEn}{" "}
                  <span className="ml-1 text-[10px] opacity-80">
                    {padCount(counts[cat.id] || 0)}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative block shrink-0 lg:w-72">
              <Search
                className={`w-4 h-4 absolute ${isAr ? "right-3.5" : "left-3.5"
                  } top-1/2 -translate-y-1/2 text-cyber-muted pointer-events-none`}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`h-10 w-full rounded-xl border border-cyber-border bg-cyber-surface/90 ${isAr ? "pr-10 pl-3.5" : "pl-10 pr-3.5"
                  } text-xs text-white placeholder-cyber-muted outline-none focus:border-cyber-electricBlue focus:ring-1 focus:ring-cyber-electricBlue transition-all`}
                type="search"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-wider text-cyber-electricBlue font-semibold">
              {loading ? (isAr ? "جاري تحميل الرف..." : "Loading shelf…") : t.gamesCount(filtered.length)}
            </p>
            <span className="font-mono text-[11px] text-cyber-muted">{t.instantActivation}</span>
          </div>

          {/* Grid */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFav={favorites.has(game.id)}
                onToggleFav={toggleFav}
                onDetails={setDetailsId}
                onAdd={addToShortlist}
              />
            ))}
          </div>

          {/* Empty States */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 border border-dashed border-cyber-border rounded-2xl mt-6">
              <Frown className="w-12 h-12 text-cyber-neonPink mx-auto mb-3" />
              <h3 className="font-display text-xl font-bold text-white">
                {games.length === 0 ? t.emptyStockTitle : t.noMatchTitle}
              </h3>
              <p className="text-xs text-cyber-muted mt-1">
                {games.length === 0 ? t.emptyStockDesc : t.noMatchDesc}
              </p>
              {games.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("all");
                    setQuery("");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyber-purple hover:bg-cyber-neonPurple text-white text-xs font-semibold"
                >
                  {t.showAll(games.length)}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Why Us Section */}
        <section id="late-night" className="scroll-mt-8 grid gap-10 border-t border-cyber-border/70 py-16 sm:py-24 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyber-neonPurple font-bold">
              <span className="h-0.5 w-6 bg-cyber-neonPurple" />
              {t.whyBadge}
            </div>
            <h2 className="font-display mt-3 max-w-md text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {t.whyTitle1}
              <br />
              <span className="text-cyber-neonPink text-glow-pink">{t.whyTitle2}</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-cyber-muted">{t.whyDesc}</p>
            <a
              href={waLink(
                isAr
                  ? "مرحباً! لدي استفسار بخصوص الألعاب والأسعار."
                  : "Hello! I have questions about your games."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-cyber-electricBlue hover:text-white transition-colors"
            >
              {t.talkToHuman}{" "}
              <ArrowUpRight className={`w-4 h-4 ${isAr ? "rotate-[-90deg]" : ""}`} />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyber-neonPink/40 p-6 bg-gradient-to-br from-cyber-neonPink via-[#b5179e] to-cyber-purple text-white shadow-neon-pink flex flex-col justify-between">
              <div className="mb-8">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">{t.benefit1Title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/85">{t.benefit1Desc}</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div className="mb-8 text-cyber-electricBlue">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">{t.benefit2Title}</h3>
                <p className="mt-2 text-xs leading-5 text-cyber-muted">{t.benefit2Desc}</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div className="mb-8 text-cyber-neonPink">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">{t.benefit3Title}</h3>
                <p className="mt-2 text-xs leading-5 text-cyber-muted">{t.benefit3Desc}</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div className="mb-8 text-cyber-neonPurple">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">{t.benefit4Title}</h3>
                <p className="mt-2 text-xs leading-5 text-cyber-muted">{t.benefit4Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="scroll-mt-8 border-t border-cyber-border/70 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyber-electricBlue font-bold">
                <span className="h-0.5 w-6 bg-cyber-electricBlue" />
                {t.howBadge}
              </div>
              <h2 className="font-display mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {t.howTitle}
              </h2>
            </div>

            <div className="grid border-t border-cyber-border/70 sm:grid-cols-3 sm:border-t-0">
              {[
                [t.step1Num, "text-cyber-neonPink", t.step1Title, t.step1Desc],
                [t.step2Num, "text-cyber-electricBlue", t.step2Title, t.step2Desc],
                [t.step3Num, "text-cyber-neonPurple", t.step3Title, t.step3Desc],
              ].map(([n, color, title, body]) => (
                <div
                  key={n}
                  className={`border-b border-cyber-border/70 py-6 sm:border-b-0 sm:py-2 ${isAr ? "sm:border-r first:sm:border-r-0 sm:pr-6" : "sm:border-l first:sm:border-l-0 sm:pl-6"
                    }`}
                >
                  <span className={`font-mono text-sm font-bold ${color}`}>{n}</span>
                  <h3 className="font-display mt-8 text-xl font-bold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-cyber-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="pixel-faq" className="grid gap-10 border-t border-cyber-border/70 py-16 sm:py-24 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyber-neonPink font-bold">
              <span className="h-0.5 w-6 bg-cyber-neonPink" />
              {t.faqBadge}
            </div>
            <h2 className="font-display mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {t.faqTitle1}
              <br />
              <span className="text-cyber-muted">{t.faqTitle2}</span>
            </h2>
            <p className="mt-6 text-sm leading-6 text-cyber-muted">{t.faqDesc}</p>
          </div>

          <div className="border-t border-cyber-border/70 divide-y divide-cyber-border/70">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 text-left group"
                >
                  <span className="flex items-center gap-3 text-sm font-bold text-white group-hover:text-cyber-electricBlue transition-colors">
                    <HelpCircle
                      className={`w-4 h-4 ${faq.icon === "pink"
                        ? "text-cyber-neonPink"
                        : faq.icon === "purple"
                          ? "text-cyber-neonPurple"
                          : "text-cyber-electricBlue"
                        }`}
                    />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openFaq === index ? "rotate-180 text-cyber-neonPink" : "text-cyber-muted"
                      }`}
                  />
                </button>
                {openFaq === index && (
                  <div className={`mt-3 ${isAr ? "pr-7" : "pl-7"} text-xs leading-6 text-cyber-muted`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1f093d] via-cyber-purple to-[#3f1068] border border-cyber-neonPink/40 px-6 py-12 text-white sm:px-12 sm:py-16 shadow-2xl">
          <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[28px] border-cyber-neonPink/20 blur-sm pointer-events-none" />
          <div className="absolute bottom-[-90px] right-40 h-48 w-48 rounded-full border-[20px] border-cyber-electricBlue/20 blur-sm pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-cyber-electricBlue">
              <span className="h-0.5 w-6 bg-cyber-electricBlue" />
              {t.ctaBadge}
            </div>
            <h2 className="font-display mt-4 max-w-[12ch] text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-cyber-muted">{t.ctaDesc}</p>
            <a
              href={waLink(
                isAr
                  ? "مرحباً متجر بيكسل! أنا جاهز لتأكيد طلبي."
                  : "Hello Pixel Store! I am ready to order."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-sm font-bold text-cyber-bg transition-transform hover:-translate-y-1 shadow-neon-pink"
            >
              <MessageCircle className="w-4 h-4 text-cyber-neonPink" />
              {t.startChat}
              <ArrowUpRight className={`w-4 h-4 text-cyber-bg ${isAr ? "rotate-[-90deg]" : ""}`} />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col justify-between gap-5 border-t border-cyber-border/70 py-8 text-xs text-cyber-muted sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-cyber-surface border border-cyber-border/80 p-1.5 shadow-sm">
              <img src={iconSvg} alt="Pixel Store" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-white">{t.brand}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-cyber-electricBlue">
                {t.tagline}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>{t.footerText}</span>
          </div>
        </footer>
      </div>

      <ShortlistDrawer />
      <DetailsModal
        game={detailsGame}
        onClose={() => setDetailsId(null)}
        onAdd={addToShortlist}
      />
    </div>
  );
}
