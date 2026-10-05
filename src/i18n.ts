import de from "./content/de.json";
import en from "./content/en.json";

export type Lang = "de" | "en";
export type PageKey = "home" | "imprint" | "privacy";

export const content = { de, en } as const;

// German is the default language and lives at the root.
export const routes: Record<PageKey, Record<Lang, string>> = {
  home: { de: "/", en: "/en/" },
  imprint: { de: "/impressum/", en: "/en/imprint/" },
  privacy: { de: "/datenschutz/", en: "/en/privacy/" },
};

export const otherLang = (lang: Lang): Lang => (lang === "de" ? "en" : "de");

interface Meta {
  title: string;
  description: string;
  ogImage: string;
  noindex?: boolean;
}

export const meta: Record<PageKey, Record<Lang, Meta>> = {
  home: {
    de: {
      title: "Shruggie Consulting — Client Service & Kundenführung für Agenturen",
      description:
        "Ich helfe kleinen und mittelgroßen Agenturen, Client Service sauber aufzustellen: Account-Leads, die die Beziehung führen, Meetings, auf die Kunden sich freuen, und keine Überraschungen vor der Verlängerung.",
      ogImage: "/og/home.png",
    },
    en: {
      title: "Shruggie Consulting — Client Service & Account Leadership for Agencies",
      description:
        "I help small and mid-size agencies run client service properly: account leads who own the relationship, meetings clients look forward to, and no surprises before a renewal.",
      ogImage: "/og/home.png",
    },
  },
  imprint: {
    de: {
      title: "Impressum — Shruggie Consulting",
      description: "Impressum und Anbieterkennzeichnung gemäß § 5 DDG für Shruggie Consulting, Benjamin Birkelbach, München.",
      ogImage: "/og/impressum.png",
      noindex: true,
    },
    en: {
      title: "Imprint — Shruggie Consulting",
      description: "Legal notice under § 5 DDG for Shruggie Consulting, Benjamin Birkelbach, Munich.",
      ogImage: "/og/imprint.png",
      noindex: true,
    },
  },
  privacy: {
    de: {
      title: "Datenschutz — Shruggie Consulting",
      description: "Datenschutzerklärung von Shruggie Consulting: welche Daten anfallen, Google Analytics nur mit Einwilligung, und Ihre Rechte.",
      ogImage: "/og/datenschutz.png",
      noindex: true,
    },
    en: {
      title: "Privacy — Shruggie Consulting",
      description: "Privacy policy of Shruggie Consulting: what data is processed, Google Analytics only with consent, and your rights.",
      ogImage: "/og/privacy.png",
      noindex: true,
    },
  },
};

// Interface strings that aren't part of the page copy.
export const ui = {
  de: {
    skip: "Zum Inhalt springen",
    homeLabel: "Shruggie Consulting – Startseite",
    langSwitch: "Sprache",
    cookieRegion: "Cookie-Einstellungen",
    consentWithdrawn: "Ihre Einwilligung wurde widerrufen.",
    nav: "Hauptnavigation",
  },
  en: {
    skip: "Skip to content",
    homeLabel: "Shruggie Consulting – home",
    langSwitch: "Language",
    cookieRegion: "Cookie settings",
    consentWithdrawn: "Your consent has been withdrawn.",
    nav: "Main navigation",
  },
} as const;
