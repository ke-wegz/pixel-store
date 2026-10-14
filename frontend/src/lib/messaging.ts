const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "962775862269";
export const WHATSAPP_NUMBER = String(rawNumber).replace(/\D/g, "");

const rawIg = import.meta.env.VITE_INSTAGRAM_USERNAME || "pixelstore.jo";
export const INSTAGRAM_USERNAME = String(rawIg).replace(/^@/, "").trim();

export function waLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}


export type PlatformType = "desktop" | "android" | "ios";

export function getMobilePlatform(): PlatformType {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "desktop";
  }
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  if (/android/i.test(ua)) {
    return "android";
  }
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return "desktop";
}

export function igDirectWebLink(textOrUrl?: string): string {
  if (textOrUrl && (textOrUrl.startsWith("http://") || textOrUrl.startsWith("https://"))) {
    return textOrUrl;
  }
  const base = `https://ig.me/m/${INSTAGRAM_USERNAME}`;
  if (textOrUrl) {
    return `${base}?text=${encodeURIComponent(textOrUrl)}`;
  }
  return base;
}

export function getAndroidInstagramIntent(textOrUrl?: string, fallbackUrl?: string): string {
  const webUrl = fallbackUrl || igDirectWebLink(textOrUrl);
  const hostAndPath = webUrl.replace(/^https?:\/\//, "");
  return `intent://${hostAndPath}#Intent;package=com.instagram.android;scheme=https;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
}

export function igDirectLink(textOrUrl?: string): string {
  const webUrl = igDirectWebLink(textOrUrl);
  const platform = getMobilePlatform();
  if (platform === "android") {
    return getAndroidInstagramIntent(undefined, webUrl);
  }
  return webUrl;
}

/**
 * Opens Instagram / ig.me direct link with cross-platform fallback:
 * - Desktop: Open the web link in a new tab (window.open(webUrl, '_blank')). Do not use app schemes.
 * - Android: Use the Android Intent URI (intent://...) with a built-in web fallback URL to open the Instagram app directly.
 * - iOS: Try instagram:// first; if document.hidden is still false after 1.5 seconds, redirect to the web URL.
 */
export function openInstagramDirect(textOrUrl?: string): void {
  const webUrl = igDirectWebLink(textOrUrl);
  const platform = getMobilePlatform();

  if (platform === "desktop") {
    window.open(webUrl, "_blank");
    return;
  }

  if (platform === "android") {
    const intentUrl = getAndroidInstagramIntent(undefined, webUrl);
    window.location.href = intentUrl;
    return;
  }

  if (platform === "ios") {
    window.location.href = "instagram://";
    setTimeout(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        window.location.href = webUrl;
      }
    }, 1500);
    return;
  }
}

export const openInstagram = openInstagramDirect;
export const openInstagramLink = openInstagramDirect;

export function igProfileLink(): string {
  return `https://instagram.com/${INSTAGRAM_USERNAME}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}
