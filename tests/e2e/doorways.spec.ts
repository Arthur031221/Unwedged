import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("editing an opening offset moves the wall gap and persists as version 2", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  const editor = page.locator(".door-editor");
  const offset = editor.getByLabel("Opening offset");
  await expect(offset).toHaveValue("0");
  await expect(offset).toHaveAttribute(
    "aria-description",
    /cm.*\+X right.*\+Y up/,
  );
  const offsetBox = await offset.boundingBox();
  expect(offsetBox!.width).toBeGreaterThan(50);
  await expect(page.locator(".field-help")).toBeVisible();
  const annotation = page.locator(".door-label");
  const centeredY = Number(await annotation.getAttribute("y"));
  await offset.fill("-10");
  await offset.press("Tab");
  await expect(offset).toHaveValue("-10");
  await offset.fill("10");
  await expect(offset).toHaveValue("10");
  await offset.press("Tab");
  expect(Number(await annotation.getAttribute("y"))).toBeLessThan(centeredY);

  const wallParts = page
    .locator(".wall-shape")
    .filter({ hasText: "pinch" })
    .locator("rect");
  await expect(wallParts).toHaveCount(2);
  const y = await wallParts.evaluateAll((rects) =>
    rects.map((rect) => Number(rect.getAttribute("y"))).sort((a, b) => a - b),
  );
  const scale = await wallParts
    .first()
    .getAttribute("width")
    .then((width) => Number(width) / 26);
  expect((y[1]! - y[0]!) / scale).toBeCloseTo(102);

  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("unwedged-draft")!).schemaVersion,
      ),
    )
    .toBe(2);
  await page.reload();
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  await expect(
    page.locator(".door-editor").getByLabel("Opening offset"),
  ).toHaveValue("10");

  const download = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: "Save project" })
    .click();
  const file = await (await download).path();
  const data = JSON.parse(await readFile(file!, "utf8"));
  expect(data.schemaVersion).toBe(2);
  expect(data.project.schemaVersion).toBe(2);
  expect(
    data.project.rects.find((rect: { id: string }) => rect.id === "pinch").door
      .offset,
  ).toBe(10);
});

test("wall dimensions commit atomically in both orientations and units", async ({
  page,
}) => {
  for (const unit of ["cm", "in"] as const) {
    for (const dimension of ["Width", "Depth"] as const) {
      await page.goto("/");
      await page.evaluate(() => localStorage.removeItem("unwedged-draft"));
      await page.reload();
      await page
        .getByRole("combobox", { name: "Measured layout" })
        .selectOption("0");
      if (unit === "in")
        await page.getByRole("button", { name: "in", exact: true }).click();
      await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
      const editor = page.locator(".door-editor");
      const offset = editor.getByLabel("Opening offset");
      await offset.fill(unit === "cm" ? "10" : "3.94");
      await offset.press("Tab");
      const field = editor.getByLabel(dimension, { exact: true });
      await field.focus();
      await page.keyboard.press("Control+A");
      await page.keyboard.type(unit === "cm" ? "200" : "78.74");
      await expect(field).toHaveValue(unit === "cm" ? "200" : "78.74");
      await field.press("Tab");
      await expect(editor.getByLabel("Opening width")).toHaveValue(
        unit === "cm" ? "92" : "36.22",
      );
      await expect(editor.getByLabel("Opening offset")).toHaveValue(
        unit === "cm" ? "10" : "3.94",
      );
      const persisted = await page.evaluate(() => {
        const draft = JSON.parse(localStorage.getItem("unwedged-draft")!);
        const wall = draft.project.rects.find(
          (rect: { id: string }) => rect.id === "pinch",
        );
        return {
          width: wall.width,
          height: wall.height,
          offset: wall.door.offset,
        };
      });
      expect(persisted.width).toBeCloseTo(dimension === "Width" ? 200 : 26);
      expect(persisted.height).toBeCloseTo(dimension === "Depth" ? 200 : 132);
      expect(persisted.offset).toBeCloseTo(10, 1);

      await page.reload();
      await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
      const reloadedEditor = page.locator(".door-editor");
      await expect(
        reloadedEditor.getByLabel(dimension, { exact: true }),
      ).toHaveValue(unit === "cm" ? "200" : "78.74");
      await expect(reloadedEditor.getByLabel("Opening width")).toHaveValue(
        unit === "cm" ? "92" : "36.22",
      );
      await expect(reloadedEditor.getByLabel("Opening offset")).toHaveValue(
        unit === "cm" ? "10" : "3.94",
      );
    }
  }
});

test("one undo restores a wall's original depth after digit by digit entry", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  const editor = page.locator(".door-editor");
  const depth = editor.getByLabel("Depth");
  await depth.focus();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("200");
  await depth.press("Tab");
  await expect(depth).toHaveValue("200");
  await expect(editor.getByLabel("Opening width")).toHaveValue("92");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(depth).toHaveValue("132");
  await expect(editor.getByLabel("Opening width")).toHaveValue("92");
});

test("a wall cannot silently shrink its measured opening", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  const depth = page.locator(".door-editor").getByLabel("Depth");
  await depth.fill("60");
  await depth.press("Tab");
  await expect(depth).toHaveValue("60");
  await expect(depth).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".field-error").last()).toContainText(
    "alter the doorway width or offset",
  );
  await expect(
    page.locator(".door-editor").getByLabel("Opening width"),
  ).toHaveValue("92");
  await depth.fill("132");
  await depth.press("Tab");
  await expect(depth).toHaveAttribute("aria-invalid", "false");
});

test("opening width cannot silently move an offset doorway", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  const editor = page.locator(".door-editor");
  await editor.getByLabel("Opening offset").fill("10");
  await editor.getByLabel("Opening offset").press("Tab");
  const width = editor.getByLabel("Opening width");
  await width.fill("115");
  await width.press("Tab");
  await expect(width).toHaveAttribute("aria-invalid", "true");
  await expect(editor.getByLabel("Opening offset")).toHaveValue("10");
  await width.fill("110");
  await width.press("Tab");
  await expect(width).toHaveValue("110");
  await expect(editor.getByLabel("Opening offset")).toHaveValue("10");
  const project = await page.evaluate(
    () => JSON.parse(localStorage.getItem("unwedged-draft")!).project,
  );
  expect(
    project.rects.find((rect: { id: string }) => rect.id === "pinch").door,
  ).toMatchObject({ width: 110, offset: 10 });
});
