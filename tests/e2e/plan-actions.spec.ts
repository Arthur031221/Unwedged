import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { messages, type Locale } from "../../src/locales";

test("the visible plan action solves and cancels through the existing worker", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");
  const action = page.locator(".quick-find");
  const bounds = await action.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThan(900);
  await action.click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  await page.locator("#furniture").getByLabel("Width").fill("75");
  await action.click();
  await expect(action).toHaveText("Cancel search");
  await action.click();
  await expect(page.locator("#route-panel")).toContainText("Search cancelled");
  await expect(page.locator(".route-line")).toHaveCount(0);
  await expect(action).toHaveText("Find route");
});

test("long names and every locale fit a narrow screen with a usable search action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "long-name.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "unwedged",
        schemaVersion: 1,
        project: {
          schemaVersion: 1,
          name: "A".repeat(100),
          floor: { width: 500, height: 300 },
          furniture: { length: 150, width: 70, height: 70 },
          margin: 2,
          rects: [],
          start: { x: 100, y: 150, angle: 0 },
          goal: { x: 400, y: 150, angle: 0 },
        },
      }),
    ),
  });
  await expect(page.locator(".canvas-head h2")).toHaveText("A".repeat(100));
  for (const locale of Object.keys(messages) as Locale[]) {
    await page.locator(".toolbar select").selectOption(locale);
    await expect(page.locator(".quick-find")).toHaveText(messages[locale].find);
    const bounds = await page.locator(".quick-find").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    expect(
      await page.evaluate(() => document.body.scrollWidth),
    ).toBeLessThanOrEqual(320);
  }
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
});

for (const clipboard of ["allowed", "denied", "missing"] as const) {
  test(`sharing a ready route reports ${clipboard} clipboard access and reopens`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value:
          mode === "missing"
            ? undefined
            : {
                writeText: (url: string) => {
                  if (mode === "denied")
                    return Promise.reject(
                      new DOMException("Permission denied", "NotAllowedError"),
                    );
                  sessionStorage.setItem("copied-link", url);
                  return Promise.resolve();
                },
              },
      });
    }, clipboard);
    await page.goto("/");
    await page
      .locator("#route-panel")
      .getByRole("button", { name: "Find route" })
      .click();
    await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
    await page.getByRole("button", { name: /Share/ }).click();
    await expect(page.locator(".share-notice")).toHaveText(
      clipboard === "allowed" ? messages.en.copied : messages.en.shareReady,
    );
    if (clipboard === "allowed")
      expect(
        await page.evaluate(() => sessionStorage.getItem("copied-link")),
      ).toBe(page.url());
    expect(new URL(page.url()).hash.length).toBeGreaterThan(10);
    await expect(page.locator("#route-panel")).toContainText("Route ready");
    await page.reload();
    await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  });
}

test("a late clipboard completion cannot report a link for edited measurements", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            (window as typeof window & { finishCopy: () => void }).finishCopy =
              resolve;
          }),
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Share/ }).click();
  await expect(page.locator(".share-notice")).toHaveText(
    messages.en.shareReady,
  );
  await page.getByLabel("Plan name").fill("Changed after sharing");
  await page.evaluate(() =>
    (window as typeof window & { finishCopy: () => void }).finishCopy(),
  );
  await expect(page.locator(".share-notice")).toBeEmpty();
  expect(new URL(page.url()).hash).toBe("");
  await page.getByRole("button", { name: /Share/ }).click();
  await expect(page.locator(".share-notice")).toHaveText(
    messages.en.shareReady,
  );
  await page.locator("#furniture").getByLabel("Width").fill("75");
  await page.evaluate(() =>
    (window as typeof window & { finishCopy: () => void }).finishCopy(),
  );
  await expect(page.locator(".share-notice")).toBeEmpty();
  expect(new URL(page.url()).hash).toBe("");
});

test("unit headings and the exported sheet identify the named plan", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Plan name").fill('Apartment <A> & "B"');
  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(page.locator(".canvas-head .eyebrow")).toHaveText(
    "Measured interior / INCHES",
  );
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  const download = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: "Export route sheet" })
    .click();
  const svg = await readFile((await (await download).path())!, "utf8");
  expect(svg).toContain("Apartment &lt;A&gt; &amp; &quot;B&quot;");
  expect(svg).toContain("181.1 in × 153.5 in");
  await page.getByRole("button", { name: "cm", exact: true }).click();
  await expect(page.locator(".canvas-head .eyebrow")).toHaveText(
    "Measured interior / CENTIMETRES",
  );
});

test("mobile sharing stays named and both themes have readable filled controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Share", exact: true }),
  ).toBeVisible();
  const contrast = async (selector: string) =>
    page.locator(selector).evaluate((element) => {
      const style = getComputedStyle(element);
      const luminance = (color: string) => {
        const channels = color
          .match(/\d+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => v / 255)
          .map((v) =>
            v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
          );
        return (
          channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
        );
      };
      const a = luminance(style.color),
        b = luminance(style.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  for (const dark of [false, true]) {
    if (dark)
      await page.getByRole("button", { name: "Dark", exact: true }).click();
    expect(await contrast(".quick-find")).toBeGreaterThanOrEqual(4.5);
    await page.getByRole("button", { name: /Measurements/ }).click();
    expect(await contrast(".unit-pills .picked")).toBeGreaterThanOrEqual(4.5);
    expect(await contrast("#route-panel .primary-btn")).toBeGreaterThanOrEqual(
      4.5,
    );
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }
});
