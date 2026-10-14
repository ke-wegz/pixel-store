const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "962775862269";
export const WHATSAPP_NUMBER = String(rawNumber).replace(/\D/g, "");

const rawIg = import.meta.env.VITE_INSTAGRAM_USERNAME || "pixelstore.jo";
export const INSTAGRAM_USERNAME = String(rawIg).replace(/^@/, "").trim();

export function waLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}


export function igDirectLink(usernameOrText?: string): string {
  const username =
    usernameOrText && !usernameOrText.includes(" ") && !usernameOrText.includes("\n") && !usernameOrText.startsWith("http")
      ? usernameOrText.replace(/^@/, "").trim()
      : INSTAGRAM_USERNAME;
  return `https://www.instagram.com/${username}/`;
}

export function igProfileLink(username: string = INSTAGRAM_USERNAME): string {
  return `https://www.instagram.com/${username}/`;
}

/**
 * Opens Instagram directly using the execution pattern:
 * - Mobile (Android / iOS): Attempts native protocol (instagram://user?username=...) with 1.5s fallback to web page
 * - Desktop: Standard web open in new tab (window.open(webUrl, '_blank', 'noopener,noreferrer'))
 */
export function openInstagramDirect(usernameOrText?: string): void {
  const username =
    usernameOrText && !usernameOrText.includes(" ") && !usernameOrText.includes("\n") && !usernameOrText.startsWith("http")
      ? usernameOrText.replace(/^@/, "").trim()
      : INSTAGRAM_USERNAME;

  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const appUrl = `instagram://user?username=${username}`;
  const webUrl = `https://www.instagram.com/${username}/`;

  if (isAndroid || isIOS) {
    // 1. Direct location change to the custom protocol
    window.location.href = appUrl;

    // 2. Fallback to web page only if the user is still on this tab
    const start = Date.now();
    setTimeout(() => {
      // If the Instagram app opened, the tab went to background (document.hidden = true)
      if (typeof document !== "undefined" && !document.hidden && Date.now() - start < 2500) {
        window.location.href = webUrl;
      }
    }, 1500);
  } else {
    // Desktop: standard web open
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }
}

export const openInstagram = openInstagramDirect;
export const openInstagramLink = openInstagramDirect;

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
