import { content, type Lang } from "../../i18n";
import type { Brand } from "./brand";

/** wa.me link to our WhatsApp Business number, with a first line that says where the visitor came from. */
export function whatsappLink(lang: Lang, brand: Brand) {
  const w = content[lang].home.contact.whatsapp;
  const digits = w.number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(w.messages[brand])}`;
}
