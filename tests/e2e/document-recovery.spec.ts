import { expect, test } from "@playwright/test";
import { presets } from "../../src/core/presets";
import { exportJson } from "../../src/core/serialize";

test("opening a plan is recoverable and the same file can be selected again", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Plan name").fill("Measured apartment");
  await page.locator("#furniture").getByLabel("Width").fill("99");
  await page.locator("#furniture").getByLabel("Width").press("Tab");
  const input = page.locator('input[type="file"]');
  const upload = {
    name: "hallway.json",
    mimeType: "application/json",
    buffer: Buffer.from(exportJson(presets[0]!)),
  };
  await input.setInputFiles(upload);
  await expect(page.locator(".canvas-head h2")).toHaveText("Apartment hallway");
  await expect(input).toHaveValue("");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByLabel("Plan name")).toHaveValue("Measured apartment");
  await expect(page.locator("#furniture").getByLabel("Width")).toHaveValue(
    "99",
  );
  await page.getByRole("button", { name: "Redo" }).click();
  await page.locator("#furniture").getByLabel("Width").fill("85");
  await page.locator("#furniture").getByLabel("Width").press("Tab");
  await input.setInputFiles(upload);
  await expect(page.locator("#furniture").getByLabel("Width")).toHaveValue(
    "82",
  );
  await expect(input).toHaveValue("");
  await page.reload();
  await expect(page.locator(".canvas-head h2")).toHaveText("Apartment hallway");
  await expect(page.locator("#furniture").getByLabel("Width")).toHaveValue(
    "82",
  );
});

test("rejecting an invalid file preserves the current certified route and measurements", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  const route = await page.locator(".route-line").getAttribute("points");
  const input = page.locator('input[type="file"]');
  for (const raw of [
    "{invalid",
    JSON.stringify({
      format: "unwedged",
      schemaVersion: 1,
      project: { ...presets[0], floor: { width: -1, height: 300 } },
    }),
  ]) {
    await input.setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(raw),
    });
    await expect(page.locator(".canvas-status")).toHaveText(
      "Invalid project file",
    );
    await expect(page.locator(".route-line")).toHaveAttribute("points", route!);
    await expect(page.locator(".canvas-head h2")).toHaveText("Corner landing");
    await expect(
      page
        .locator(".side-footer")
        .getByRole("button", { name: "Export route sheet" }),
    ).toBeEnabled();
    await expect(input).toHaveValue("");
  }
});
