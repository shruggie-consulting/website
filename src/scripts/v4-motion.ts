// Motion shared by the v4 pages: the one reveal, the strike-through that draws when its row
// comes into view, and the scroll-linked parts. Every one rests on a finished static state,
// so without this script (or with reduced motion) the page simply stands there complete.
export function initMotion() {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const seen = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        seen.unobserve(e.target);
      }
    }),
    { rootMargin: "0px 0px -12% 0px" },
  );
  document.querySelectorAll("[data-reveal], [data-strike]").forEach((el) => seen.observe(el));

  // Each [data-scrub] gets its progress (0 to 1) as --p, and the styles do the rest. "pin"
  // runs over a tall section whose content holds still; "view" runs while an element crosses
  // the screen. Without this --p stays 1, the finished state.
  const wide = matchMedia("(min-width: 60rem)");
  const scrubbed = [...document.querySelectorAll<HTMLElement>("[data-scrub]")];
  if (calm || !scrubbed.length) return;
  let queued = false;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const update = () => {
    queued = false;
    const vh = innerHeight;
    for (const el of scrubbed) {
      const r = el.getBoundingClientRect();
      let p = 1;
      if (el.dataset.scrub === "pin") {
        // Only where the section is tall and held (wide screens); a focused link shows it all.
        if (wide.matches && !el.matches(":focus-within")) p = clamp(-r.top / Math.max(1, r.height - vh));
      } else {
        p = clamp((vh * 0.9 - r.top) / (vh * 0.55));
      }
      el.style.setProperty("--p", p.toFixed(4));
    }
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  document.addEventListener("focusin", queue);
  update();
}
