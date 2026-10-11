import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "assets/social-card.png");
const server = await createServer({
  configFile: resolve(root, "vite.config.ts"),
  root,
  server: { host: "127.0.0.1", port: 4176, strictPort: true },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
  });
  const app = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  await app.goto("http://127.0.0.1:4176/", { waitUntil: "networkidle" });
  await app
    .locator("#route-panel")
    .getByRole("button", { name: /Find route/ })
    .click();
  await app
    .locator("#route-panel")
    .locator(".result.success")
    .waitFor({ timeout: 20000 });
  await app
    .locator(".main-panel")
    .screenshot({ path: resolve(root, "assets/social-card-capture.png") });
  const card = await browser.newPage({
    viewport: { width: 1200, height: 675 },
    deviceScaleFactor: 1,
  });
  await card.goto(pathToFileURL(resolve(root, "assets/social-card.html")).href);
  await card.screenshot({ path: output, fullPage: true });
  await copyFile(output, resolve(root, "public/social-card.png"));
} finally {
  await browser?.close();
  await server.close();
}
