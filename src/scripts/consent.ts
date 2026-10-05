// Cookie consent + Google Analytics.
// The privacy policy promises GA is only loaded after explicit consent, so nothing
// Google-related is requested until the visitor clicks Accept.

const KEY = "shruggie-consent";
const GA_ID = "G-FBRHEGH53B";

type Decision = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const readDecision = (): Decision | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
};

const writeDecision = (v: Decision) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* storage blocked: decision just won't persist */
  }
};

let gaLoaded = false;
function loadAnalytics() {
  if (gaLoaded) return;
  gaLoaded = true;
  (window as any)[`ga-disable-${GA_ID}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // gtag.js expects the arguments object, not an array.
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { anonymize_ip: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

function stopAnalytics() {
  (window as any)[`ga-disable-${GA_ID}`] = true;
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  // Remove _ga cookies for this host and the registrable domain.
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const name of document.cookie.split(";").map((c) => c.split("=")[0].trim())) {
    if (!name.startsWith("_ga")) continue;
    for (const d of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
    }
  }
}

const track = (name: string, params: Record<string, string> = {}) => {
  if (gaLoaded && readDecision() === "granted") window.gtag?.("event", name, params);
};

const banner = document.querySelector<HTMLElement>("[data-cookie-banner]");

function showBanner(focus = false) {
  if (!banner) return;
  banner.hidden = false;
  if (focus) banner.querySelector<HTMLButtonElement>("button")?.focus();
}

function decide(v: Decision) {
  writeDecision(v);
  if (banner) banner.hidden = true;
  if (v === "granted") loadAnalytics();
  else stopAnalytics();
}

const initial = readDecision();
if (initial === "granted") loadAnalytics();
if (initial === null) showBanner();

document.addEventListener("click", (e) => {
  const target = e.target as Element | null;
  if (!target) return;

  const consentBtn = target.closest<HTMLElement>("[data-consent]");
  if (consentBtn) {
    decide(consentBtn.dataset.consent as Decision);
    return;
  }
  if (target.closest("[data-consent-open]")) {
    showBanner(true);
    return;
  }
  const withdraw = target.closest<HTMLElement>("[data-consent-withdraw]");
  if (withdraw) {
    decide("denied");
    const status = document.querySelector<HTMLElement>("[data-consent-status]");
    if (status) status.textContent = withdraw.dataset.consentWithdraw ?? "";
    return;
  }

  const a = target.closest<HTMLAnchorElement>("a[href]");
  if (!a) return;
  const href = a.getAttribute("href") ?? "";
  const text = (a.textContent ?? "").trim();
  if (a.hasAttribute("data-lang-switch")) track("language_toggle", { language: a.lang });
  else if (href.startsWith("mailto:")) track("email_click", { link_url: href, link_text: text });
  else if (/linkedin|xing|instagram|twitter|x\.com/i.test(href)) track("social_click", { link_url: href, link_text: text });
  else if (href.startsWith("#") && href.length > 1) track("nav_click", { section: href.slice(1), link_text: text });
});
