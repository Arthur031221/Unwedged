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

  const prep = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await prep.goto("http://127.0.0.1:4176/", { waitUntil: "networkidle" });
  await prep.getByRole("button", { name: /Find route/ }).click();
  await prep
    .locator("#route-panel")
    .getByText("Route ready")
    .waitFor({ timeout: 20000 });
  await prep.getByRole("button", { name: /Share/ }).click();
  const link = prep.url();
  await prep.close();

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    recordVideo: { dir: temp, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  await page.goto(link, { waitUntil: "networkidle" });
  await page
    .locator(".route-line")
    .waitFor({ state: "attached", timeout: 20000 });
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Play route" }).click();
  await page.waitForTimeout(2200);
  const scrubber = page.locator('.transport-controls input[type="range"]');
  await scrubber.fill("650");
  await page.waitForTimeout(800);
  await page.locator("#furniture").getByLabel("Width").fill("75");
  await page.getByRole("button", { name: /Find route/ }).click();
  await page
    .locator("#route-panel")
    .getByText("Route ready")
    .waitFor({ timeout: 20000 });
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Play route" }).click();
  await page.waitForTimeout(2300);
  await page.waitForTimeout(4400);
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
      "0.8",
      "-i",
      join(temp, recording),
      "-t",
      "18",
      "-filter_complex",
      "fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer",
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
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      output,
    ],
    { encoding: "utf8" },
  );
  console.log(
    `Wrote ${output} (${Number(info.stdout.trim()).toFixed(2)} seconds).`,
  );
} finally {
  if (browser) await browser.close();
  await server.close();
  await rm(temp, { recursive: true, force: true });
}
