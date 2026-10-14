import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Globe,
  MessageCircle,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { Instagram } from "./icons/Instagram";
import iconSvg from "../assets/icon.svg";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { waLink, igDirectLink, openInstagramDirect } from "../lib/messaging";

export function Header() {
  const { totalCount, openDrawer } = useCart();
  const { toggleLang, isAr, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-panel mt-3 rounded-2xl border-b border-cyber-border/70 py-3.5 px-4 sm:px-8 mb-4 transition-all">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5" data-testid="brand-pixel-store">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-cyber-neonPink via-cyber-purple to-cyber-electricBlue p-[2px] shadow-neon-pink group-hover:shadow-neon-blue transition-all">
              <div className="h-full w-full bg-cyber-surface rounded-[10px] flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src={iconSvg}
                  alt="Pixel Store"
                  className="h-full w-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
            <div>
              <p className="font-display text-[15px] sm:text-[17px] font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-cyber-electricBlue to-cyber-neonPink">
                {t.brand}
              </p>
              <p className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[.22em] text-cyber-lightBlue font-semibold">
                {t.tagline}
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-6 lg:gap-8 text-xs font-semibold uppercase tracking-wider text-cyber-muted md:flex"
          aria-label="Primary navigation"
        >
          <a href="#shelf" className="transition-colors hover:text-cyber-electricBlue flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyber-electricBlue" /> {t.shelf}
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-cyber-neonPink flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyber-neonPink" /> {t.howItWorks}
          </a>
          <a href="#late-night" className="transition-colors hover:text-cyber-neonPurple flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyber-neonPurple" /> {t.whyUs}
          </a>
          <a href="#pixel-faq" className="transition-colors hover:text-white flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> {t.faq}
          </a>
          <Link to="/admin" className="transition-colors hover:text-cyber-electricBlue">
            {t.admin}
          </Link>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Toggle (Visible on Desktop AND Mobile!) */}
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-full border border-cyber-border bg-cyber-card/80 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-cyber-pureWhite transition-all hover:border-cyber-electricBlue hover:text-cyber-electricBlue hover:shadow-neon-blue"
            aria-label="Switch language"
            title={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe className="w-3.5 h-3.5 text-cyber-lightBlue" />
            <span className="font-bold">{t.langBtn}</span>
          </button>

          {/* Desktop WhatsApp & Instagram Chat Links */}
          <div className="hidden sm:flex items-center gap-1.5">
            <a
              href={waLink(
                isAr
                  ? "مرحباً متجر بيكسل! أود الاستفسار عن الألعاب المتوفرة للطلب."
                  : "Hello Pixel Store! I want to order an offline game."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-cyber-card/70 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-white shadow-sm"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
            <a
              href={igDirectLink(
                isAr
                  ? "مرحباً متجر بيكسل! أود الاستفسار عن الألعاب المتوفرة للطلب."
                  : "Hello Pixel Store! I want to order an offline game."
              )}
              onClick={(e) => {
                e.preventDefault();
                openInstagramDirect(
                  isAr
                    ? "مرحباً متجر بيكسل! أود الاستفسار عن الألعاب المتوفرة للطلب."
                    : "Hello Pixel Store! I want to order an offline game."
                );
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-cyber-neonPink/40 bg-cyber-card/70 px-3 py-1.5 text-xs font-semibold text-cyber-neonPink transition-all hover:border-cyber-neonPink hover:bg-cyber-neonPink/20 hover:text-white shadow-sm cursor-pointer"
              title="Message on Instagram"
            >
              <Instagram className="w-3.5 h-3.5 text-cyber-neonPink" />
              <span>Instagram</span>
            </a>
          </div>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={openDrawer}
            className="relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl border border-cyber-electricBlue/40 bg-cyber-card text-cyber-pureWhite transition-all hover:border-cyber-electricBlue hover:shadow-neon-blue"
            aria-label={t.shortlist}
          >
            <ShoppingBag className="w-4 h-4 text-cyber-electricBlue" />
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyber-neonPink text-[10px] font-bold text-white shadow-neon-pink">
              {totalCount}
            </span>
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl border border-cyber-border bg-cyber-card text-cyber-muted hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-cyber-border/80 mt-3 space-y-2.5 animate-fadeIn">

          <a
            href="#shelf"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-cyber-purple/30"
          >
            {t.shelf}
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-cyber-purple/30"
          >
            {t.howItWorks}
          </a>
          <a
            href="#late-night"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-cyber-purple/30"
          >
            {t.whyUs}
          </a>
          <a
            href="#pixel-faq"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-cyber-purple/30"
          >
            {t.faq}
          </a>
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-semibold text-cyber-electricBlue hover:bg-cyber-purple/30"
          >
            {t.admin}
          </Link>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={waLink(
                isAr
                  ? "مرحباً متجر بيكسل! أود الاستفسار عن الألعاب."
                  : "Hello Pixel Store! I want to order."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 rounded-lg bg-[#25D366] text-center font-bold text-xs text-black shadow-sm flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href={igDirectLink(
                isAr
                  ? "مرحباً متجر بيكسل! أود الاستفسار عن الألعاب."
                  : "Hello Pixel Store! I want to order."
              )}
              onClick={(e) => {
                e.preventDefault();
                openInstagramDirect(
                  isAr
                    ? "مرحباً متجر بيكسل! أود الاستفسار عن الألعاب."
                    : "Hello Pixel Store! I want to order."
                );
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 rounded-lg bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-center font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
