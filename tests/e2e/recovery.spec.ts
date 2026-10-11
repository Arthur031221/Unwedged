import { expect, test } from "@playwright/test";
import { presets } from "../../src/core/presets";
import { exportJson } from "../../src/core/serialize";

const clearDraft = (page: import("@playwright/test").Page) =>
  page.addInitScript(() => {
    if (sessionStorage.getItem("recovery-test-initialized")) return;
    sessionStorage.setItem("recovery-test-initialized", "1");
    localStorage.removeItem("unwedged-draft");
  });

test("numeric focus sessions undo and redo as one edit, including shortcuts", async ({
  page,
}) => {
  await clearDraft(page);
  await page.goto("/");
  const width = page.locator("#furniture").getByLabel("Width");
  await width.fill("81");
  await width.fill("93");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(width).toHaveValue("74");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(width).toHaveValue("93");
  await page.locator(".canvas-head").click();
  await page.keyboard.press("Control+z");
  await expect(width).toHaveValue("74");
  await page.keyboard.press("Control+Shift+z");
  await expect(width).toHaveValue("93");
});

test("an obstacle drag is one undo step and a new edit branches redo", async ({
  page,
}) => {
  await clearDraft(page);
  await page.goto("/");
  const width = page.locator("#furniture").getByLabel("Width");
  await width.fill("81");
  const wall = page.locator(".wall-shape");
  const box = await wall.boundingBox();
  if (!box) throw new Error("Obstacle is not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 45,
    box.y + box.height / 2 + 20,
    { steps: 3 },
  );
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const draft = JSON.parse(
          localStorage.getItem("unwedged-draft") ?? "{}",
        );
        return draft.project?.rects?.[0]?.x;
      }),
    )
    .not.toBe(presets[1]!.rects[0]!.x);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unwedged-draft") ?? "{}").project
            ?.rects?.[0]?.x,
      ),
    )
    .toBe(presets[1]!.rects[0]!.x);
  await expect(width).toHaveValue("81");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(width).toHaveValue("74");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(width).toHaveValue("81");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unwedged-draft") ?? "{}").project
            ?.rects?.[0]?.x,
      ),
    )
    .not.toBe(presets[1]!.rects[0]!.x);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.locator("#furniture").getByLabel("Width").fill("80");
  await page.locator(".canvas-head").click();
  await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();
});

test("geometry undo invalidates a route and a running stale search", async ({
  page,
}) => {
  await clearDraft(page);
  await page.goto("/");
  await page
    .locator("#route-panel")
    .getByRole("button", { name: /Find route/ })
    .click();
  await expect(page.locator("#route-panel")).toContainText("Route ready", {
    timeout: 30000,
  });
  await expect(page.locator(".route-line")).toHaveCount(1);
  await page.locator("#furniture").getByLabel("Width").fill("76");
  await expect(page.locator(".route-line")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".route-line")).toHaveCount(0);
  await page
    .locator("#route-panel")
    .getByRole("button", { name: /Find route/ })
    .click();
  await page.locator("#furniture").getByLabel("Length").fill("151");
  await page.waitForTimeout(500);
  await expect(page.locator(".route-line")).toHaveCount(0);
  await expect(page.locator("#route-panel")).not.toContainText("Route ready");
});

test("reload restores validated measurements, while corrupt storage falls back safely", async ({
  page,
}) => {
  await clearDraft(page);
  await page.goto("/");
  await page.locator("#furniture").getByLabel("Width").fill("91");
  await page.locator(".canvas-head").click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("unwedged-draft")))
    .toContain('"width": 91');
  await page.reload();
  await expect(page.locator("#furniture").getByLabel("Width")).toHaveValue(
    "91",
  );
  await expect(page.locator(".autosave-status")).toContainText(
    "Measurements restored",
  );
  await page.evaluate(() => localStorage.setItem("unwedged-draft", "{broken"));
  await page.reload();
  await expect(page.locator("#furniture").getByLabel("Width")).toHaveValue(
    "74",
  );
});

test("storage denial keeps editing available and advises saving a project", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    });
    Object.defineProperty(Storage.prototype, "getItem", { value: () => null });
  });
  await page.goto("/");
  const width = page.locator("#furniture").getByLabel("Width");
  await width.fill("82");
  await width.press("Tab");
  await expect(width).toHaveValue("82");
  await expect(page.locator(".autosave-status")).toContainText(
    "Autosave unavailable",
  );
  await expect(page.locator(".autosave-status")).toContainText("Save project");
});

test("shared URL takes precedence over a local draft", async ({ page }) => {
  await clearDraft(page);
  await page.goto("/");
  await page.locator("#furniture").getByLabel("Width").fill("88");
  await page.getByRole("button", { name: /Share/ }).click();
  const local = structuredClone(presets[1]!);
  local.furniture.width = 111;
  await page.evaluate(
    (raw) => localStorage.setItem("unwedged-draft", raw),
    exportJson(local),
  );
  await page.reload();
  await expect(page.locator("#furniture").getByLabel("Width")).toHaveValue(
    "88",
  );
  await expect(
    page.getByRole("status").filter({ hasText: "Measurements restored" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("unwedged-draft")),
  ).toBe(exportJson(local));
  const width = page.locator("#furniture").getByLabel("Width");
  await width.fill("89");
  await width.press("Tab");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unwedged-draft") ?? "{}").project
            ?.furniture?.width,
      ),
    )
    .toBe(89);
});

test("an invalid hash does not overwrite the existing draft", async ({
  page,
}) => {
  const saved = structuredClone(presets[1]!);
  saved.furniture.width = 102;
  await page.addInitScript(
    (raw) => localStorage.setItem("unwedged-draft", raw),
    exportJson(saved),
  );
  await page.goto("/#not-valid-base64%%%");
  await expect(page.locator("#route-panel")).toContainText(
    "Invalid project file",
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("unwedged-draft")))
    .toBe(exportJson(saved));
  await expect(page.locator("#furniture").getByLabel("Width")).toHaveValue(
    "102",
  );
  await page.locator("#furniture").getByLabel("Length").fill("151");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unwedged-draft") ?? "{}").project
            ?.furniture?.width,
      ),
    )
    .toBe(102);
});
