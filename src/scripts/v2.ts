// Behaviour shared by the v2 pages (Consulting home and Agency): contact form, header,
// mobile menu and the typed line in the hero.
import { initContactForm } from "./contact-form";

export function initV2() {
  initContactForm();

  // Header: transparent over the hero, solid once the page scrolls.
  const header = document.querySelector<HTMLElement>("[data-v2-header]");
  const onScroll = () => header?.classList.toggle("is-solid", window.scrollY > 40 || toggle?.getAttribute("aria-expanded") === "true");
  addEventListener("scroll", onScroll, { passive: true });

  // Small screens: the menu opens from the button.
  const toggle = document.querySelector<HTMLButtonElement>("[data-v2-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-v2-menu]");
  onScroll();
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    menu?.classList.toggle("is-open", open);
    onScroll();
  });
  menu?.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a[href^='#']")) {
      toggle?.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      onScroll();
    }
  });

  // The typed line: deletes and types the topics one after another (not with reduced motion).
  const typed = document.querySelector<HTMLElement>("[data-typed]");
  if (typed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const words = JSON.parse(typed.dataset.words ?? "[]") as string[];
    let w = 0;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      for (;;) {
        await sleep(2200);
        for (let i = typed.textContent!.length; i >= 0; i--) {
          typed.textContent = words[w].slice(0, i);
          await sleep(45);
        }
        w = (w + 1) % words.length;
        for (let i = 1; i <= words[w].length; i++) {
          typed.textContent = words[w].slice(0, i);
          await sleep(90);
        }
      }
    })();
  }
}
