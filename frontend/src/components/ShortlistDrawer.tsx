import { useState } from "react";
import { Check, Copy, MessageCircle, ShoppingBag, X } from "lucide-react";
import { Instagram } from "./icons/Instagram";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { waLink, igDirectLink, copyTextToClipboard } from "../lib/messaging";
import { getActivePrice, getOriginalPrice, getDiscountPercent } from "../types";

export function ShortlistDrawer() {
  const { drawerOpen, closeDrawer, shortlist, updateQty, clear, totalPrice } = useCart();
  const { isAr, t } = useLanguage();
  const [platform, setPlatform] = useState<"whatsapp" | "instagram">("whatsapp");
  const [copied, setCopied] = useState(false);

  if (!drawerOpen) return null;

  const orderMessage =
    shortlist.length === 0
      ? isAr
        ? "مرحباً متجر بيكسل! أود الاستفسار عن الألعاب المتوفرة للطلب."
        : "Hello Pixel Store! I want to order."
      : isAr
      ? `مرحباً متجر بيكسل! أود طلب الألعاب التالية:\n${shortlist
          .map((i) => `• ${i.title} (${i.qty}x) - ${(getActivePrice(i) * i.qty).toFixed(2)} د.أ`)
          .join("\n")}\n\nالمجموع الإجمالي: ${totalPrice.toFixed(2)} د.أ`
      : `Hello Pixel Store! I would like to order:\n${shortlist
          .map((i) => `• ${i.title} (${i.qty}x) - ${(getActivePrice(i) * i.qty).toFixed(2)} JOD`)
          .join("\n")}\n\nTotal: ${totalPrice.toFixed(2)} JOD`;

  const waHref = waLink(orderMessage);
  const igHref = igDirectLink(orderMessage);

  async function handleManualCopy() {
    await copyTextToClipboard(orderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" dir={isAr ? "rtl" : "ltr"}>
      <button
        type="button"
        aria-label="Close shortlist"
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />
      <div className={`fixed inset-y-0 ${isAr ? "left-0 pr-10" : "right-0 pl-10"} max-w-full flex pointer-events-none`}>
        <div
          className={`w-screen max-w-md bg-cyber-surface ${
            isAr ? "border-r" : "border-l"
          } border-cyber-border p-6 flex flex-col shadow-2xl relative pointer-events-auto`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-cyber-border/70">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-cyber-neonPink" />
              <h2 className="font-display font-bold text-lg text-white uppercase">{t.drawerTitle}</h2>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-1 rounded-lg text-cyber-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {shortlist.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-cyber-border mx-auto mb-3" />
                <p className="text-xs text-cyber-muted">{t.drawerEmpty}</p>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyber-purple text-xs font-bold text-white hover:bg-cyber-neonPurple transition-all"
                >
                  {t.browseGames}
                </button>
              </div>
            ) : (
              shortlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-cyber-card border border-cyber-border"
                >
                  <div className={`flex-1 ${isAr ? "pl-3" : "pr-3"}`}>
                    <div className="text-xs font-bold text-white">{item.title}</div>
                    <div className="font-mono text-xs text-cyber-electricBlue mt-0.5 flex items-center gap-2">
                      <span className={item.onSale ? "text-cyber-neonPink font-extrabold" : ""}>
                        {getActivePrice(item).toFixed(2)} {t.currency}
                      </span>
                      {item.onSale && getDiscountPercent(item) > 0 && (
                        <span className="text-[10px] text-cyber-muted line-through">
                          {getOriginalPrice(item).toFixed(2)} {t.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 rounded bg-cyber-surface border border-cyber-border text-white text-xs flex items-center justify-center hover:border-cyber-neonPink transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs text-white">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 rounded bg-cyber-surface border border-cyber-border text-white text-xs flex items-center justify-center hover:border-cyber-electricBlue transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-cyber-border/70 pt-4 space-y-3.5">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-cyber-muted uppercase">{t.totalPrice}:</span>
              <span className="font-display font-black text-xl text-cyber-electricBlue">
                {totalPrice.toFixed(2)} {t.currency}
              </span>
            </div>

            {/* Exclusive Choice: WhatsApp OR Instagram (One, but not both) */}
            <div className="space-y-1.5 rounded-xl border border-cyber-border/80 bg-cyber-card/60 p-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyber-muted">
                <span className="uppercase tracking-wider font-semibold">{t.orderPlatform}:</span>
                <span className="text-[10px] text-cyber-lightBlue font-bold">
                  {platform === "whatsapp" ? "WhatsApp" : "Instagram"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-cyber-surface border border-cyber-border/60">
                <button
                  type="button"
                  onClick={() => setPlatform("whatsapp")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                    platform === "whatsapp"
                      ? "bg-[#25D366] text-black shadow-md shadow-[#25D366]/20 font-extrabold"
                      : "text-cyber-muted hover:text-white"
                  }`}
                  aria-pressed={platform === "whatsapp"}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("instagram")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                    platform === "instagram"
                      ? "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-md shadow-[#fd1d1d]/20 font-extrabold"
                      : "text-cyber-muted hover:text-white"
                  }`}
                  aria-pressed={platform === "instagram"}
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </button>
              </div>
            </div>

            {/* Action Button: WhatsApp vs Instagram */}
            {platform === "whatsapp" ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:brightness-110 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-[#25D366]/25 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t.checkoutWhatsApp}</span>
              </a>
            ) : (
              <div className="space-y-2">
                <a
                  href={igHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    void copyTextToClipboard(orderMessage);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-[#fd1d1d]/25 transition-all flex items-center justify-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{t.checkoutInstagram}</span>
                </a>
                <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-cyber-muted">
                  <span className="leading-tight">{t.instagramNote}</span>
                  <button
                    type="button"
                    onClick={handleManualCopy}
                    className="shrink-0 flex items-center gap-1 rounded-md border border-cyber-border bg-cyber-card px-2 py-1 text-[10px] font-mono font-semibold text-cyber-lightBlue hover:text-white hover:border-cyber-electricBlue transition-all"
                    title={t.copyOrderBtn}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">{t.orderCopied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.copyOrderBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {copied && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-300 animate-fadeIn">
                {t.copiedOrderToast}
              </div>
            )}

            <button
              type="button"
              onClick={clear}
              className="w-full text-center font-mono text-[11px] text-cyber-muted hover:text-cyber-neonPink transition-colors"
            >
              {t.clearList}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
