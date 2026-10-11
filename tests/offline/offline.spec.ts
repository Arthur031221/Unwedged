import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test("offline readiness follows activation after the first controller change", async ({
  page,
}) => {
  const original = await readFile("dist/sw.js", "utf8");
  const delayed = original.replace(
    "await self.clients.claim();",
    "await self.clients.claim(); await new Promise(resolve => setTimeout(resolve, 1500));",
  );
  expect(delayed).not.toBe(original);
  try {
    await writeFile("dist/sw.js", delayed);
    await page.goto("http://127.0.0.1:4176/Unwedged/");
    await expect
      .poll(() =>
        page.evaluate(() => navigator.serviceWorker.controller?.state),
      )
      .toBe("activating");
    await expect(page.locator(".offline-ready")).toBeHidden();
    await expect(
      page.getByText("Offline ready", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller?.state),
    ).toBe("activated");
  } finally {
    await writeFile("dist/sw.js", original);
  }
});

test("production app, fonts and route worker work offline under /Unwedged/", async ({
  page,
  context,
}) => {
  await page.goto("http://127.0.0.1:4176/Unwedged/");
  await expect(page.locator(".canvas-head h2")).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await document.fonts.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller !== null),
    )
    .toBe(true);
  await expect(page.getByText("Offline ready")).toBeVisible();
  expect(
    await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans"')),
  ).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".canvas-head h2")).toBeVisible();
  expect(await page.evaluate(() => location.pathname)).toBe("/Unwedged/");
  expect(
    await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans"')),
  ).toBe(true);
  await page.getByRole("button", { name: /Find route/ }).click();
  await expect(
    page.locator("#route-panel").getByText("Route ready"),
  ).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  await page.setViewportSize({ width: 320, height: 740 });
  const picker = page.locator(".toolbar select");
  for (const locale of [
    "en",
    "zh-TW",
    "zh-CN",
    "ja",
    "ko",
    "es",
    "fr",
    "de",
    "pt-BR",
  ]) {
    await picker.selectOption(locale);
    await expect(page.locator(".offline-ready")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    const box = await page.locator(".toolbar").boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    const textRight = await page
      .locator(".brand strong")
      .evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect().right;
      });
    const undoBox = await page.locator(".history-btn").first().boundingBox();
    expect(textRight).toBeLessThanOrEqual(undoBox!.x - 4);
    const shown = await picker.locator("option:checked").textContent();
    expect(shown).not.toBe(locale);
  }
});

test("an update waits for existing tabs and preserves their offline worker", async ({
  page,
  context,
}) => {
  const original = await readFile("dist/sw.js", "utf8");
  const version = original.match(/const VERSION = "([^"]+)"/)![1]!;
  const nextVersion = version + "-update-test";
  try {
    await page.goto("http://127.0.0.1:4176/Unwedged/");
    await expect(
      page.getByText("Offline ready", { exact: true }),
    ).toBeVisible();
    const oldCache = await page.evaluate(() => caches.keys());
    await writeFile("dist/sw.js", original.replace(version, nextVersion));
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration!.update();
    });
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            (await navigator.serviceWorker.getRegistration())?.waiting?.state,
        ),
      )
      .toBe("installed");
    const cachesWithUpdate = await page.evaluate(() => caches.keys());
    expect(cachesWithUpdate).toEqual(expect.arrayContaining(oldCache));
    expect(cachesWithUpdate.some((name) => name.endsWith(nextVersion))).toBe(
      true,
    );
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: "Find route" }).click();
    await expect(
      page.locator("#route-panel").getByText("Route ready"),
    ).toBeVisible();
    await page.close();
    const reopened = await context.newPage();
    await reopened.goto("http://127.0.0.1:4176/Unwedged/");
    await expect(
      reopened.getByText("Offline ready", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => reopened.evaluate(() => caches.keys()))
      .toEqual([`unwedged:/Unwedged/:${nextVersion}`]);
    await reopened.getByRole("button", { name: "Find route" }).click();
    await expect(
      reopened.locator("#route-panel").getByText("Route ready"),
    ).toBeVisible();
    await reopened.close();
  } finally {
    await context.setOffline(false);
    await writeFile("dist/sw.js", original);
  }
});
