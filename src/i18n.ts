import de from "./content/de.json";
import en from "./content/en.json";

export type Lang = "de" | "en";
export type PageKey = "home" | "consulting" | "agency" | "imprint" | "privacy";

export const content = { de, en } as const;

// German is the default language and lives at the root. The root is the house page
// ("Warum Shruggie") with the doors to both brands.
export const routes: Record<PageKey, Record<Lang, string>> = {
  home: { de: "/", en: "/en/" },
  consulting: { de: "/consulting/", en: "/en/consulting/" },
  agency: { de: "/agentur/", en: "/en/agency/" },
  imprint: { de: "/impressum/", en: "/en/imprint/" },
  privacy: { de: "/datenschutz/", en: "/en/privacy/" },
};

export const otherLang = (lang: Lang): Lang => (lang === "de" ? "en" : "de");

interface Meta {
  title: string;
  description: string;
  ogImage: string;
  noindex?: boolean;
  /** og:site_name; Shruggie Consulting unless the page belongs to the agency. */
  siteName?: string;
}

export const meta: Record<PageKey, Record<Lang, Meta>> = {
  home: {
    de: {
      title: "Shruggie — Consulting für Agenturen, eine Agentur für Marken",
      description:
        "Shruggie ist ein kleines Haus mit zwei Läden: Consulting für unabhängige Agenturen und eine Agentur für Marken. Wir probieren lieber aus, als alles zu Tode zu denken.",
      ogImage: "/og/home.png",
      siteName: "Shruggie",
    },
    en: {
      title: "Shruggie — Consulting for agencies, an agency for brands",
      description:
        "Shruggie is a small house with two shops: consulting for independent agencies and an agency for brands. We'd rather try something than think it to death.",
      ogImage: "/og/home.png",
      siteName: "Shruggie",
    },
  },
  consulting: {
    de: {
      title: "Shruggie Consulting — Klarheit für unabhängige Agenturen",
      description:
        "Für unabhängige Agenturen, die gute Arbeit machen und im Chaos laufen: saubere Zahlen, echtes Account Management, ein Rhythmus, der hält. Ohne Bürokratie, ohne 10x-Versprechen.",
      ogImage: "/og/home.png",
    },
    en: {
      title: "Shruggie Consulting — Clarity for independent agencies",
      description:
        "For independent agencies that do good work and run on chaos: clean numbers, proper account management, a rhythm that holds. No bureaucracy, no 10x promises.",
      ogImage: "/og/home.png",
    },
  },
  agency: {
    de: {
      title: "Shruggie Agency — Marke, Kampagnen und Content",
      description:
        "Eine kleine Agentur aus München für Marken, die gesehen werden wollen: Marke, Kampagnen, Content und Performance, und du sprichst immer mit den Leuten, die auch die Arbeit machen.",
      ogImage: "/og/home.png",
      siteName: "Shruggie Agency",
    },
    en: {
      title: "Shruggie Agency — Brand, campaigns and content",
      description:
        "A small Munich agency for brands that want to be seen: brand, campaigns, content and performance, and you always talk to the people doing the work.",
      ogImage: "/og/home.png",
      siteName: "Shruggie Agency",
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
      description: "Datenschutzerklärung von Shruggie Consulting: welche Daten anfallen, Reichweitenmessung ohne Cookies, und Ihre Rechte.",
      ogImage: "/og/datenschutz.png",
      noindex: true,
    },
    en: {
      title: "Privacy — Shruggie Consulting",
      description: "Privacy policy of Shruggie Consulting: what data is processed, cookieless visitor statistics, and your rights.",
      ogImage: "/og/privacy.png",
      noindex: true,
    },
  },
};

// Interface strings that aren't part of the page copy.
/** Sign-in page of the client portal, opened in the visitor's language. */
export const workspaceUrl = (lang: Lang) => `https://workspace.shruggie.consulting/login?lang=${lang}`;

export const ui = {
  de: {
    skip: "Zum Inhalt springen",
    homeLabel: "Shruggie – Startseite",
    langSwitch: "Sprache",
    nav: "Hauptnavigation",
    menu: "Menü",
    clientWorkspace: "Client Workspace",
    clientWorkspaceLabel: "Client Workspace: Anmeldung für Kunden",
  },
  en: {
    skip: "Skip to content",
    homeLabel: "Shruggie – home",
    langSwitch: "Language",
    nav: "Main navigation",
    menu: "Menu",
    clientWorkspace: "Client Workspace",
    clientWorkspaceLabel: "Client Workspace: sign-in for clients",
  },
} as const;
