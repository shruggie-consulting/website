import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://shruggie.consulting",
  trailingSlash: "always",
  build: {
    format: "directory",
    // One small stylesheet: inline it so pages render without an extra request.
    inlineStylesheets: "always",
  },
  devToolbar: { enabled: false },
});
