import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const clearDraft = (page: import("@playwright/test").Page) =>
  page.addInitScript(() => {
    if (sessionStorage.getItem("custom-plans-test-initialized")) return;
    sessionStorage.setItem("custom-plans-test-initialized", "1");
    localStorage.removeItem("unwedged-draft");
  });

test("creating an empty plan is one undo step and restores a version 2 doorway", async ({
  page,
}) => {
  await clearDraft(page);
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  await page.locator(".door-editor").getByLabel("Opening offset").fill("10");
  await page.locator(".door-editor").getByLabel("Opening offset").press("Tab");
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("unwedged-draft")!).schemaVersion,
      ),
    )
    .toBe(2);
  await page.getByRole("button", { name: "Draw obstacle" }).click();
  await page.getByRole("button", { name: "New empty plan" }).click();
  await expect(page.getByLabel("Plan name")).toHaveValue("Untitled plan");
  await expect(page.getByLabel("Measured layout")).toHaveValue("custom");
  await expect(page.locator(".wall-shape")).toHaveCount(0);
  await expect(page.locator(".floorplan")).not.toHaveClass(/placing/);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".wall-shape")).toHaveCount(2);
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  await expect(
    page.locator(".door-editor").getByLabel("Opening offset"),
  ).toHaveValue("10");
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("unwedged-draft")!).schemaVersion,
      ),
    )
    .toBe(2);
});

test("empty plans accept Unicode names, autosave, solve, rename, reload and save/open", async ({
  page,
}) => {
  await clearDraft(page);
  await page.goto("/");
  await page.getByRole("button", { name: "New empty plan" }).click();
  const planName = page.getByLabel("Plan name");
  await planName.fill("搬入計画 台北");
  await planName.press("Tab");
  await expect(page.getByLabel("Measured layout")).toHaveValue("custom");
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("unwedged-draft")!).project.name,
      ),
    )
    .toBe("搬入計画 台北");
  await page
    .locator("#route-panel")
    .getByRole("button", { name: /Find route/ })
    .click();
  await expect(page.locator(".route-line")).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator("#route-panel")).toContainText("Route ready");
  await page.getByRole("button", { name: /Share/ }).click();
  await expect(page).toHaveURL(/#.+/);
  await planName.fill("搬入計画 最終版");
  await planName.press("Tab");
  await expect(page.locator(".route-line")).toHaveCount(1);
  await expect(page).not.toHaveURL(/#.+/);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(planName).toHaveValue("搬入計画 台北");
  await expect(page.locator(".route-line")).toHaveCount(1);
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(planName).toHaveValue("搬入計画 最終版");
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("unwedged-draft")!).project.name,
      ),
    )
    .toBe("搬入計画 最終版");
  await page.reload();
  await expect(page.getByLabel("Plan name")).toHaveValue("搬入計画 最終版");
  await expect(page.getByLabel("Measured layout")).toHaveValue("custom");
  await page
    .locator("#route-panel")
    .getByRole("button", { name: /Find route/ })
    .click();
  await expect(page.locator(".route-line")).toHaveCount(1, { timeout: 15000 });

  const download = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: "Save project" })
    .click();
  const file = await download;
  const project = await readFile(await file.path(), "utf8");
  await page.locator('input[type="file"]').setInputFiles({
    name: "custom-plan.json",
    mimeType: "application/json",
    buffer: Buffer.from(project),
  });
  await expect(page.locator(".route-line")).toHaveCount(1, { timeout: 15000 });
  await expect(page.getByLabel("Plan name")).toHaveValue("搬入計画 最終版");
  await expect(page.getByLabel("Measured layout")).toHaveValue("custom");
});

test("empty plan controls fit a narrow viewport and work from the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const newPlan = page.getByRole("button", { name: "New empty plan" });
  await newPlan.focus();
  await page.keyboard.press("Enter");
  const name = page.getByLabel("Plan name");
  await expect(name).toHaveValue("Untitled plan");
  for (const control of [newPlan, name]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  await name.focus();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("計画 台北");
  await expect(name).toHaveValue("計画 台北");
});

test("custom measurements keep the custom selector even with an example name", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New empty plan" }).click();
  await page.getByLabel("Plan name").fill("Corner landing");
  await page.getByLabel("Plan name").press("Tab");
  await expect(page.getByLabel("Measured layout")).toHaveValue("custom");
  await page.reload();
  await expect(page.getByLabel("Measured layout")).toHaveValue("custom");
  await page.getByLabel("Measured layout").selectOption("1");
  await expect(page.getByLabel("Measured layout")).toHaveValue("1");
  await page.locator("#furniture").getByLabel("Width").fill("80");
  await page.locator("#furniture").getByLabel("Width").press("Tab");
  await expect(page.getByLabel("Measured layout")).toHaveValue("custom");
});
