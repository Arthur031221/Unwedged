import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/offline",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:4176/Unwedged/",
    launchOptions: { executablePath: process.env.CHROME_PATH },
  },
  webServer: {
    command:
      "npm run build -- --base=/Unwedged/ && node scripts/serve-prefix.mjs",
    url: "http://127.0.0.1:4176/Unwedged/",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
