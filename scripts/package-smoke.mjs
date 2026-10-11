import { chromium, expect } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import net from "node:net";
import { once } from "node:events";

const root = new URL("../", import.meta.url);
const workspace = await mkdtemp(join(tmpdir(), "unwedged-package-smoke-"));
let server;
let browser;
try {
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  execFileSync(
    "npm",
    ["pack", "--ignore-scripts", "--pack-destination", workspace],
    { cwd: root, stdio: "inherit" },
  );
  const archives = (await readdir(workspace)).filter((name) =>
    name.endsWith(".tgz"),
  );
  if (archives.length !== 1) throw new Error("Expected one package archive");
  const archive = join(workspace, archives[0]);
  const isolated = join(workspace, "consumer");
  execFileSync("npm", ["init", "-y"], { cwd: workspace, stdio: "ignore" });
  await import("node:fs/promises").then(({ mkdir }) => mkdir(isolated));
  execFileSync("npm", ["init", "-y"], { cwd: isolated, stdio: "ignore" });
  execFileSync("npm", ["install", archive], {
    cwd: isolated,
    stdio: "inherit",
  });
  const packageRoot = join(isolated, "node_modules", "unwedged");
  const readmes = (await readdir(packageRoot)).filter((name) =>
    /^README(?:\.[A-Za-z-]+)?\.md$/.test(name),
  );
  for (const name of readmes) {
    const markdown = await readFile(join(packageRoot, name), "utf8");
    const links = [
      ...markdown.matchAll(/\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g),
      ...markdown.matchAll(/\b(?:src|href)=["']([^"']+)["']/g),
    ];
    for (const match of links) {
      const target = match[1];
      if (/^(?:https?:|mailto:|#)/.test(target)) continue;
      try {
        await access(
          resolve(packageRoot, decodeURIComponent(target.split("#")[0])),
        );
      } catch {
        throw new Error(`Missing packaged link in ${name}: ${target}`);
      }
    }
  }
  console.log(`Packaged README links checked in ${readmes.length} languages`);
  const executable = join(isolated, "node_modules", ".bin", "unwedged");
  execFileSync(executable, ["--help"], { cwd: isolated, stdio: "inherit" });
  const portProbe = net.createServer();
  await new Promise((resolve, reject) =>
    portProbe.listen(0, "127.0.0.1", resolve).once("error", reject),
  );
  const port = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  server = spawn(executable, ["--port", String(port)], {
    cwd: isolated,
    stdio: "ignore",
  });
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(origin);
      if (response.ok && (await response.text()).includes("Unwedged")) {
        ready = true;
        break;
      }
    } catch {
      /* The packaged server is still starting. */
    }
    await delay(250);
  }
  if (!ready) throw new Error("Packaged server did not start on IPv4 loopback");
  const traversal = await fetch(`${origin}/%2e%2e%2fpackage.json`);
  if (traversal.status !== 403)
    throw new Error(`Traversal returned ${traversal.status}, expected 403`);
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole("heading", { name: "Corner landing" }).waitFor();
  await expect(page.locator(".offline-ready")).toBeVisible({ timeout: 15000 });
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/, {
    timeout: 15000,
  });
  const download = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: "Save project" })
    .click();
  const saved = await readFile(await (await download).path());
  await page.locator("#furniture").getByLabel("Width").fill("75");
  await page.locator("#furniture").getByLabel("Width").press("Tab");
  await expect(page.locator(".route-line")).toHaveCount(0);
  await page.locator('input[type="file"]').setInputFiles({
    name: "saved-route.json",
    mimeType: "application/json",
    buffer: saved,
  });
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  await page.context().setOffline(true);
  await page.reload();
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/, {
    timeout: 15000,
  });
  expect(errors).toEqual([]);
  console.log(
    "Package smoke passed: isolated install, loopback serving, route solve, save and reopen, offline solve and traversal rejection.",
  );
} finally {
  await browser?.close();
  if (server && server.exitCode === null && server.signalCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
  await rm(workspace, { recursive: true, force: true });
}
