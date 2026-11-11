import { content, type Lang } from "../../i18n";
import type { Brand } from "./brand";

/** wa.me link to our WhatsApp Business number, with a first line that says where the visitor came from. */
export function whatsappLink(lang: Lang, brand: Brand) {
  const w = content[lang].home.contact.whatsapp;
  const digits = w.number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(w.messages[brand])}`;
}

// The WhatsApp glyph (32×32 viewBox), shared by the floating button and the contact row.
export const WHATSAPP_PATH =
  "M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.53 1.74 6.5L3 29l6.68-1.75A12.95 12.95 0 0 0 16.04 29C23.2 29 29.03 23.18 29.03 16S23.2 3 16.04 3Zm0 23.7c-1.95 0-3.86-.52-5.53-1.52l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.66 10.66 0 0 1 5.33 16c0-5.9 4.8-10.7 10.71-10.7 5.9 0 10.69 4.8 10.69 10.7 0 5.9-4.8 10.7-10.69 10.7Zm5.87-8.01c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.01 1.25-.19.21-.37.24-.7.08-.32-.16-1.35-.5-2.58-1.6-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.15-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.09 1.3 3.3.16.21 2.25 3.43 5.44 4.81.76.33 1.35.52 1.81.67.76.24 1.46.2 2 .12.61-.09 1.9-.78 2.16-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z";
