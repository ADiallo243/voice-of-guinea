import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:43873",
    headless: true,
    reducedMotion: "reduce",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.0.0 Safari/537.36",
  },
  webServer: [
    {
      command:
        "NEWSLETTER_POPUP_ENABLED=true VOICE_OF_GUINEA_DEMO_CONTENT=true npm run dev -- --port 43873",
      url: "http://localhost:43873",
      reuseExistingServer: false,
    },
    {
      command: "npx next dev tests/fixture --port 43874",
      url: "http://localhost:43874",
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    {
      name: "mobile",
      use: { viewport: { width: 375, height: 812 }, isMobile: true },
    },
  ],
});
