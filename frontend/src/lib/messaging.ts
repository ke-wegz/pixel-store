const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "962775862269";
export const WHATSAPP_NUMBER = String(rawNumber).replace(/\D/g, "");

const rawIg = import.meta.env.VITE_INSTAGRAM_USERNAME || "pixelstore.jo";
export const INSTAGRAM_USERNAME = String(rawIg).replace(/^@/, "").trim();

export function waLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}


export function igDirectLink(text?: string): string {
  const base = `https://ig.me/m/${INSTAGRAM_USERNAME}`;
  if (text) {
    return `${base}?text=${encodeURIComponent(text)}`;
  }
  return base;
}

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
