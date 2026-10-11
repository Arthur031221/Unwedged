import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "assets/demo.gif");
const temp = await mkdtemp(join(tmpdir(), "unwedged-demo-"));
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

  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 1,
    recordVideo: { dir: temp, size: { width: 1280, height: 1000 } },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4176/", { waitUntil: "networkidle" });
  await page
    .locator("#furniture")
    .getByLabel("Width")
    .waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "New empty plan" }).click();
  const planName = page.getByLabel("Plan name");
  await planName.fill("Entry plan");
  await planName.press("Tab");
  await page.waitForTimeout(1700);

  await page
    .getByLabel("Measured layout")
    .selectOption({ label: "Corner landing" });
  await page.waitForTimeout(900);
  await page.locator(".quick-find").click();
  await page
    .locator("#route-panel")
    .getByText("Route ready")
    .waitFor({ timeout: 30000 });
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Play route" }).click();
  await page.waitForTimeout(4200);
  await context.close();
  await browser.close();
  browser = undefined;

  const recording = (await readdir(temp)).find((name) =>
    name.endsWith(".webm"),
  );
  if (!recording) throw new Error("Browser did not write a video recording");
  const converted = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      "0.5",
      "-i",
      join(temp, recording),
      "-t",
      "24",
      "-filter_complex",
      "fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
      output,
    ],
    { stdio: "inherit" },
  );
  if (converted.status !== 0) throw new Error("ffmpeg GIF conversion failed");
  const info = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size",
      "-of",
      "default=noprint_wrappers=1",
      output,
    ],
    { encoding: "utf8" },
  );
  if (info.status !== 0) throw new Error("ffprobe could not inspect the GIF");
  const values = Object.fromEntries(
    info.stdout
      .trim()
      .split("\n")
      .map((line) => line.split("=")),
  );
  const size = Number(values.size);
  if (size >= 10 * 1024 * 1024) throw new Error("GIF exceeds 10 MB");
  console.log(
    `Wrote ${output} (${Number(values.duration).toFixed(2)} seconds, ${size} bytes).`,
  );
} finally {
  if (browser) await browser.close();
  await server.close();
  await rm(temp, { recursive: true, force: true });
}
