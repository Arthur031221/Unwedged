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
  await offset.fill("10");
  await expect(offset).toHaveValue("10");
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
