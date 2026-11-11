import de from "./content/de.json";
import en from "./content/en.json";

export type Lang = "de" | "en";
export type PageKey = "home" | "consulting" | "agency" | "office" | "imprint" | "privacy";

export const content = { de, en } as const;

// German is the default language and lives at the root. The root is the house page
// ("Warum Shruggie") with the doors to both brands.
export const routes: Record<PageKey, Record<Lang, string>> = {
  home: { de: "/", en: "/en/" },
  consulting: { de: "/consulting/", en: "/en/consulting/" },
  agency: { de: "/agentur/", en: "/en/agency/" },
  office: { de: "/agentur/office/", en: "/en/agency/office/" },
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
        "Shruggie ist ein kleines Haus mit zwei Shops: Consulting für unabhängige Agenturen und eine Agentur für Marken. Wir probieren lieber aus, als alles zu Tode zu denken.",
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
      title: "Shruggie Agency — dein Marketing-Team",
      description:
        "Dein Marketing-Team ohne eigene Abteilung: eine eingespielte Agentur aus München, die sich jeden Monat um das kümmert, was gerade am meisten bringt. Video, Anzeigen, Website, Recruiting und Marke.",
      ogImage: "/og/home.png",
      siteName: "Shruggie Agency",
    },
    en: {
      title: "Shruggie Agency — your marketing team",
      description:
        "Your marketing team without hiring one: a tight Munich agency that works each month on whatever brings the most. Video, ads, websites, recruiting and brand.",
      ogImage: "/og/home.png",
      siteName: "Shruggie Agency",
    },
  },
  office: {
    de: {
      title: "Live aus dem Office — Shruggie Agency",
      description: "Unsere KI-Agenten in einem kleinen Pixel-Office, live: wer gerade Code schreibt, wer recherchiert und wer auf dem Sofa auf uns wartet. Henry ist auch da.",
      ogImage: "/og/home.png",
      siteName: "Shruggie Agency",
    },
    en: {
      title: "Live from the office — Shruggie Agency",
      description: "Our AI agents in a little pixel office, live: who's writing code, who's doing research and who's waiting on the sofa for us. Henry is there too.",
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
