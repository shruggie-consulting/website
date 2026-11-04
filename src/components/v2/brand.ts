import type { PageKey } from "../../i18n";

/**
 * Who a v2 page speaks for: the house (the root, "Warum Shruggie"), Shruggie Consulting
 * (the default theme) or Shruggie Agency (the endorsed sub-brand).
 */
export type Brand = "house" | "consulting" | "agency";

export const PAGE_OF: Record<Brand, PageKey> = { house: "home", consulting: "consulting", agency: "agency" };
