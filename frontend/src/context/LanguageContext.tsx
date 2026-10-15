import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Language } from "../lib/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  isAr: boolean;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("pixel_store_lang");
    return saved === "ar" ? "ar" : "en";
  });

  useEffect(() => {
    localStorage.setItem("pixel_store_lang", lang);
  }, [lang]);

  function toggleLang() {
    setLang((prev) => (prev === "en" ? "ar" : "en"));
  }

  const isAr = lang === "ar";
  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isAr, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
