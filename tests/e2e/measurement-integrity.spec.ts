import { expect, test } from "@playwright/test";
import { presets } from "../../src/core/presets";

test("untouched inch fields preserve exact measurements and a closed doorway", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  const height = page.locator("#furniture").getByLabel("Carry height");
  await height.fill("190");
  await height.press("Tab");
  const wall = page.locator(".wall-shape").filter({ hasText: "pinch" });
  await expect(wall.locator("rect")).toHaveCount(1);
  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(height).toHaveValue("74.8");
  await height.focus();
  await height.press("Tab");
  await expect(wall.locator("rect")).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unwedged-draft")!).project.furniture
            .height,
      ),
    )
    .toBe(190);

  await page.getByLabel("Measured layout").selectOption("1");
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  const length = page.locator("#furniture").getByLabel("Length");
  await expect(length).toHaveValue("59.06");
  await length.focus();
  await length.press("Tab");
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unwedged-draft")!).project.furniture
            .length,
      ),
    )
    .toBe(150);
});

test("a rejected draft stays with its obstacle instead of changing another", async ({
  page,
}) => {
  await page.goto("/");
  const project = structuredClone(presets[0]!);
  project.rects.push({
    id: "same-sized-solid",
    x: 80,
    y: 80,
    width: 26,
    height: 132,
    kind: "obstacle",
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "two-obstacles.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ format: "unwedged", schemaVersion: 1, project }),
    ),
  });
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  let depth = page.locator(".door-editor").getByLabel("Depth");
  await depth.fill("60");
  await depth.press("Tab");
  await expect(depth).toHaveAttribute("aria-invalid", "true");
  await page
    .locator(".obstacle-row")
    .filter({ hasText: "same-sized-solid" })
    .click();
  depth = page.locator(".door-editor").getByLabel("Depth");
  await expect(depth).toHaveValue("132");
  await expect(depth).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator(".quick-find")).toBeEnabled();
  await depth.focus();
  await depth.press("Tab");
  const persisted = await page.evaluate(
    () => JSON.parse(localStorage.getItem("unwedged-draft")!).project,
  );
  expect(
    persisted.rects.find((rect: { id: string }) => rect.id === "pinch"),
  ).toMatchObject({ height: 132, door: { width: 92 } });
  expect(
    persisted.rects.find(
      (rect: { id: string }) => rect.id === "same-sized-solid",
    ),
  ).toMatchObject({ height: 132 });
});

test("changed dependent bounds restore a rejected field's accepted measurement", async ({
  page,
}) => {
  await page.goto("/");
  const floor = page.locator(".form-section").filter({
    has: page.getByRole("combobox", { name: "Measured layout" }),
  });
  const width = floor.getByLabel("Width", { exact: true });
  const depth = floor.getByLabel("Depth", { exact: true });
  await width.fill("2000");
  await width.press("Tab");
  await depth.fill("1001");
  await depth.press("Tab");
  await expect(depth).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".quick-find")).toBeDisabled();
  await width.fill("1000");
  await width.press("Tab");
  await expect(depth).toHaveValue("390");
  await expect(depth).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator(".field-error")).toHaveCount(0);
  await expect(page.locator(".quick-find")).toBeEnabled();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("unwedged-draft")!).project.floor,
      ),
    )
    .toEqual({ width: 1000, height: 390 });
  await depth.fill("1001");
  await depth.press("Tab");
  await expect(depth).toHaveAttribute("aria-invalid", "false");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unwedged-draft")!).project.floor
            .height,
      ),
    )
    .toBe(1001);
});

test("moving an imported wall preserves a narrow jamb and its exact opening", async ({
  page,
}) => {
  await page.goto("/");
  const project = structuredClone(presets[0]!);
  const wall = project.rects.find((rect) => rect.id === "pinch")!;
  wall.door!.width = 131.95;
  await page.locator('input[type="file"]').setInputFiles({
    name: "narrow-jamb.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ format: "unwedged", schemaVersion: 1, project }),
    ),
  });
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  const x = page.locator(".door-editor").getByLabel("X", { exact: true });
  await x.fill("281");
  await x.press("Tab");
  await expect(
    page.locator(".door-editor").getByLabel("Opening width"),
  ).toHaveValue("131.95");
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("unwedged-draft")!).project.rects.find(
          (rect: { id: string }) => rect.id === "pinch",
        ),
      ),
    )
    .toMatchObject({ x: 281, door: { width: 131.95 } });
});

test("editing an imported obstacle doorway preserves exact measurements", async ({
  page,
}) => {
  await page.goto("/");
  const project = structuredClone(presets[0]!);
  const obstacle = project.rects.find((rect) => rect.id === "pinch")!;
  project.schemaVersion = 2;
  obstacle.kind = "obstacle";
  obstacle.door = { width: 92, height: 190, offset: 10 };
  await page.locator('input[type="file"]').setInputFiles({
    name: "obstacle-doorway.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ format: "unwedged", schemaVersion: 2, project }),
    ),
  });
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  const editor = page.locator(".door-editor");
  await expect(editor.getByLabel("Opening width")).toHaveValue("92");
  await expect(editor.getByLabel("Opening height")).toHaveValue("190");
  await expect(editor.getByLabel("Opening offset")).toHaveValue("10");
  await editor.getByLabel("X", { exact: true }).fill("281");
  await editor.getByLabel("X", { exact: true }).press("Tab");
  await editor.getByLabel("Width", { exact: true }).fill("30");
  await editor.getByLabel("Width", { exact: true }).press("Tab");
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("unwedged-draft")!).project.rects.find(
      (rect: { id: string }) => rect.id === "pinch",
    ),
  );
  expect(persisted).toMatchObject({
    kind: "obstacle",
    x: 281,
    width: 30,
    door: { width: 92, height: 190, offset: 10 },
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Save project/ }).click();
  const download = await downloadPromise;
  const savedPath = await download.path();
  expect(savedPath).not.toBeNull();
  await page
    .getByRole("button", { name: "New empty plan", exact: true })
    .click();
  await page.locator('input[type="file"]').setInputFiles(savedPath!);
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  await expect(editor.getByLabel("X", { exact: true })).toHaveValue("281");
  await expect(editor.getByLabel("Width", { exact: true })).toHaveValue("30");
  await expect(editor.getByLabel("Opening width")).toHaveValue("92");
  await expect(editor.getByLabel("Opening height")).toHaveValue("190");
  await expect(editor.getByLabel("Opening offset")).toHaveValue("10");
  await page.reload();
  await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
  const reloadedEditor = page.locator(".door-editor");
  await expect(reloadedEditor.getByLabel("Opening width")).toHaveValue("92");
  await expect(reloadedEditor.getByLabel("Opening height")).toHaveValue("190");
  await expect(reloadedEditor.getByLabel("Opening offset")).toHaveValue("10");
});

for (const [field, value] of [
  ["Opening height", "200"],
  ["Opening offset", "0.01"],
  ["Width", "27"],
  ["Depth", "132.01"],
] as const) {
  test(`editing ${field} preserves every other imported measurement`, async ({
    page,
  }) => {
    await page.goto("/");
    const project = structuredClone(presets[0]!);
    const wall = project.rects.find((rect) => rect.id === "pinch")!;
    wall.door!.width = 131.95;
    await page.locator('input[type="file"]').setInputFiles({
      name: "narrow-jamb.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ format: "unwedged", schemaVersion: 1, project }),
      ),
    });
    await page.locator(".obstacle-row").filter({ hasText: "pinch" }).click();
    const input = page
      .locator(".door-editor")
      .getByLabel(field, { exact: true });
    await input.fill(value);
    await input.press("Tab");
    await expect(input).toHaveValue(value);
    await expect(input).toHaveAttribute("aria-invalid", "false");
    await expect(
      page.locator(".door-editor").getByLabel("Opening width"),
    ).toHaveValue("131.95");
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("unwedged-draft")!).project.rects.find(
        (rect: { id: string }) => rect.id === "pinch",
      ),
    );
    expect(saved.door.width).toBe(131.95);
    expect(saved.door.height).toBe(field === "Opening height" ? 200 : 190);
    expect(saved.door.offset ?? 0).toBe(field === "Opening offset" ? 0.01 : 0);
    expect(saved.width).toBe(field === "Width" ? 27 : 26);
    expect(saved.height).toBe(field === "Depth" ? 132.01 : 132);
    await expect(page.locator(".quick-find")).toBeEnabled();
  });
}

test("invalid drafts reset across units, history, presets, imports and new plans", async ({
  page,
}) => {
  await page.goto("/");
  const width = page.locator("#furniture").getByLabel("Width", { exact: true });
  const reject = async () => {
    await width.fill("2500");
    await width.press("Tab");
    await expect(width).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(".quick-find")).toBeDisabled();
  };
  await reject();
  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(width).toHaveValue("29.13");
  await expect(width).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: "cm", exact: true }).click();
  await reject();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(width).toHaveValue("74");
  await expect(page.locator(".quick-find")).toBeEnabled();
  await reject();
  await page.getByLabel("Measured layout").selectOption("0");
  await expect(width).toHaveValue("82");
  await expect(page.locator(".quick-find")).toBeEnabled();
  await reject();
  await page.locator('input[type="file"]').setInputFiles({
    name: "reset-drafts.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "unwedged",
        schemaVersion: 1,
        project: presets[1],
      }),
    ),
  });
  await expect(width).toHaveValue("74");
  await expect(page.locator(".quick-find")).toBeEnabled();
  await reject();
  await page
    .getByRole("button", { name: "New empty plan", exact: true })
    .click();
  await expect(width).toHaveValue("70");
  await expect(page.locator(".quick-find")).toBeEnabled();
  await expect(page.locator(".field-error")).toHaveCount(0);
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
});

test("Undo discards an invalid draft and restores the previous committed measurement", async ({
  page,
}) => {
  await page.goto("/");
  const width = page.locator("#furniture").getByLabel("Width", { exact: true });
  await expect(width).toHaveValue("74");
  await width.fill("75");
  await width.press("Tab");
  await expect(width).toHaveValue("75");
  await width.fill("2500");
  await width.press("Tab");
  await expect(width).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(width).toHaveValue("74");
  await expect(width).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator(".quick-find")).toBeEnabled();
});
