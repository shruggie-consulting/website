# shruggie.consulting

Static site built with [Astro](https://astro.build). Every page is plain HTML at build time; the only JavaScript is the cookie banner and Google Analytics, which loads only after a visitor clicks Accept, plus the pixel office on /agentur/office.

## Where things live

| What | File |
|---|---|
| All copy (German / English) | `src/content/de.json`, `src/content/en.json` |
| Page titles, descriptions, URLs | `src/i18n.ts` |
| Colours, fonts, layout | `src/styles/global.css` |
| Homepage / legal page structure | `src/components/HomePage.astro`, `src/components/LegalPage.astro` |
| Consent + analytics | `src/scripts/consent.ts` |
| Fonts, favicons, link-preview images | `public/` |
| Live office (/agentur/office) | `src/components/v2/OfficeV2.astro`; the pixel office itself is `public/office/office.js`, a copy of `~/Test/agent-office/public/office.js` (edit there, copy here). Data: `workspace.shruggie.consulting/api/public/office` (anonymised: role names, rooms, first names) |

German lives at `/`, English at `/en/`. Long German words in headings carry soft hyphens (`­`) so they break cleanly on phones.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`). Pull requests only run the build.
