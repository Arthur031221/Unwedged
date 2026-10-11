import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { presets } from "../../src/core/presets";

const findLabels: Record<string, string> = {
  en: "Find route",
  "zh-TW": "尋找路線",
  "zh-CN": "查找路线",
  ja: "経路を検索",
  ko: "경로 찾기",
  es: "Buscar ruta",
  fr: "Chercher un trajet",
  de: "Route suchen",
  "pt-BR": "Encontrar rota",
};

test("turn route can be solved, shared, reopened, replayed and exported", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Corner landing" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Find route/ }).click();
  await expect(
    page.locator("#route-panel").getByText("Route ready"),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  await expect(page.locator(".route-ghost")).toHaveCount(4);
  const download = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: /Export route sheet/ })
    .click();
  const svg = await download;
  expect(svg.suggestedFilename()).toBe("unwedged-route.svg");
  const svgContents = await readFile((await svg.path())!, "utf8");
  expect(svgContents).toContain("Conservative clearance");
  expect(svgContents).toContain("460.0 cm × 390.0 cm");
  await page.getByRole("button", { name: /Share/ }).click();
  expect(new URL(page.url()).hash.length).toBeGreaterThan(10);
  await page.reload();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);
  await page.getByRole("button", { name: "Play route" }).click();
  await expect(page.locator(".progress-number")).not.toHaveText("0%");
});

test("edits invalidate synchronously and cancel terminates the current search", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Find route/ }).click();
  await page.locator("#furniture").getByLabel("Width").fill("75");
  await expect(page.locator(".route-line")).toHaveCount(0);
  await expect(
    page
      .locator(".side-footer")
      .getByRole("button", { name: /Export route sheet/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Find route/ }).click();
  await expect(
    page.getByRole("button", { name: "Cancel search" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel search" }).click();
  await expect(page.locator("#route-panel")).toContainText("Search cancelled");
  await expect(page.locator(".route-line")).toHaveCount(0);
});

test("valid imports are rechecked and endpoint tampering is rejected", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Find route/ }).click();
  await expect(
    page.locator("#route-panel").getByText("Route ready"),
  ).toBeVisible({ timeout: 15000 });
  const save = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: /Save project/ })
    .click();
  const projectFile = await save;
  const valid = JSON.parse(await readFile((await projectFile.path())!, "utf8"));
  await page.locator('input[type="file"]').setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(valid)),
  });
  await page.waitForTimeout(1000);
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/, {
    timeout: 5000,
  });

  valid.route.poses.at(-1).x += 30;
  await page.locator('input[type="file"]').setInputFiles({
    name: "tampered.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(valid)),
  });
  await expect(page.locator("#route-panel")).toContainText(
    "Invalid project file",
  );
  await expect(page.locator(".route-line")).toHaveCount(0);
});

test("all nine saved locales expose a translated search action", async ({
  page,
}) => {
  await page.goto("/");
  const picker = page.locator(".toolbar select");
  for (const [locale, label] of Object.entries(findLabels)) {
    await picker.selectOption(locale);
    await expect(page.getByRole("button", { name: label })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  }
  await picker.selectOption("zh-TW");
  await page.getByTitle("深色").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("inches convert to internal centimetres and numeric fields remain keyboard editable", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#furniture").getByLabel("Length").fill("150");
  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(page.locator("#furniture").getByLabel("Length")).toHaveValue(
    "59.06",
  );
  await expect(page.locator(".ruler-x text").nth(1)).toHaveText("19.7");
  await expect(page.locator(".ruler-y text").nth(1)).toHaveText("19.7");
  await page.locator("#furniture").getByLabel("Length").fill("60");
  await page.getByRole("button", { name: "cm", exact: true }).click();
  await expect(page.locator("#furniture").getByLabel("Length")).toHaveValue(
    "152.4",
  );
  const startX = page.locator(".pose-inputs fieldset").first().getByLabel("X");
  await startX.focus();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("105");
  await expect(startX).toHaveValue("105");
});

test("mobile drawer and canvas remain usable in light and dark themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".floorplan")).toBeVisible();
  await expect(page.locator(".main-panel")).toBeInViewport();
  const bounds = await page.locator(".floorplan").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: /Measurements/ }).click();
  await expect(page.locator(".sidebar.open")).toBeVisible();
  await expect(page.locator(".primary-btn")).toBeVisible();
  await page.getByTitle("Dark").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".floorplan")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
  await page.getByTitle("Light").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("canvas placement and wall dragging follow the SVG matrix in a letterboxed viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.addStyleTag({
    content:
      ".floorplan { width: 500px !important; height: 300px !important; }",
  });
  const svg = page.locator(".floorplan");
  const letterboxed = await svg.evaluate((element) => {
    const svg = element as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const view = svg.viewBox.baseVal;
    return Math.abs(rect.width / rect.height - view.width / view.height) > 0.1;
  });
  expect(letterboxed).toBe(true);
  const clientPoint = async (x: number, y: number) =>
    svg.evaluate(
      (element, world) => {
        const svgElement = element as SVGSVGElement;
        const floor = svgElement.querySelector("rect")!;
        const ox = Number(floor.getAttribute("x"));
        const top = Number(floor.getAttribute("y"));
        const scale = Number(floor.getAttribute("width")) / 460;
        const point = svgElement.createSVGPoint();
        point.x = ox + world.x * scale;
        point.y = top + Number(floor.getAttribute("height")) - world.y * scale;
        const mapped = point.matrixTransform(svgElement.getScreenCTM()!);
        return { x: mapped.x, y: mapped.y };
      },
      { x, y },
    );
  await page.getByRole("button", { name: /Draw obstacle/ }).click();
  const origin = await clientPoint(220, 180);
  await svg.dispatchEvent("pointerdown", {
    clientX: origin.x,
    clientY: origin.y,
    pointerId: 1,
    bubbles: true,
  });
  const row = page.locator(".obstacle-row").filter({ hasText: "obstacle-" });
  await expect(row).toHaveCount(1);
  const start = await clientPoint(220, 180);
  const end = await clientPoint(250, 205);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
  const editor = page.locator(".door-editor");
  await expect(editor.getByLabel("X")).toHaveValue("250");
  await expect(editor.getByLabel("Y", { exact: true })).toHaveValue("205");
});

test("canvas closes a doorway when carry height equals its opening", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  const pinch = page.locator(".obstacle-row").filter({ hasText: "pinch" });
  await pinch.click();
  const doorHeight = page.locator(".door-editor").getByLabel("Opening height");
  await expect(page.locator(".door-label")).toHaveCount(1);
  const jambs = page
    .locator(".wall-shape")
    .filter({ hasText: "pinch" })
    .locator("rect");
  await expect(jambs).toHaveCount(2);
  const pieces = await jambs.evaluateAll((elements) =>
    elements
      .map((element) => ({
        y: Number(element.getAttribute("y")),
        height: Number(element.getAttribute("height")),
        width: Number(element.getAttribute("width")),
      }))
      .sort((a, b) => a.y - b.y),
  );
  const scale = pieces[0]!.width / 26;
  expect(pieces[0]!.height / scale).toBeCloseTo(20);
  expect((pieces[1]!.y - pieces[0]!.y - pieces[0]!.height) / scale).toBeCloseTo(
    92,
  );
  await doorHeight.fill("74");
  await expect(jambs).toHaveCount(1);
  await expect(page.locator(".door-label")).toHaveCount(0);
  await doorHeight.fill("74.1");
  await expect(page.locator(".door-label")).toHaveCount(1);
});

test("downloaded SVG preserves the measured doorway gap", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Measured layout").selectOption("0");
  await page.getByRole("button", { name: /Find route/ }).click();
  await expect(
    page.locator("#route-panel").getByText("Route ready"),
  ).toBeVisible({ timeout: 15000 });
  const download = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: /Export route sheet/ })
    .click();
  const svg = await download;
  const contents = await readFile((await svg.path())!, "utf8");
  const jambs = [
    ...contents.matchAll(
      /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" fill="#50697c"\/>/g,
    ),
  ];
  expect(jambs).toHaveLength(3);
  const doorwayWall = jambs.filter(
    (match) => match[1] === "448.5" && match[3] === "39" && match[4] === "30",
  );
  const positions = doorwayWall
    .map((match) => Number(match[2]))
    .sort((a, b) => a - b);
  expect(positions[1]! - positions[0]! - 30).toBe(138);
});

test("new walls support removable doors and survive save and reopen after resizing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Draw obstacle" }).click();
  await page.locator(".floorplan").click({ position: { x: 140, y: 140 } });
  const editor = page.locator(".door-editor");
  await editor.getByLabel("Structure type").selectOption("wall");
  await editor.getByRole("checkbox", { name: "Centered doorway" }).check();
  await editor.getByLabel("Width", { exact: true }).fill("20");
  await editor.getByLabel("Depth", { exact: true }).fill("10");
  const saved = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: "Save project" })
    .click();
  const contents = await readFile((await (await saved).path())!, "utf8");
  const data = JSON.parse(contents);
  const wall = data.project.rects.find(
    (rect: { id: string }) => rect.id === "obstacle-1",
  );
  expect(wall.kind).toBe("wall");
  expect(wall.door.width).toBeLessThan(20);
  await page.getByLabel("Measured layout").selectOption("0");
  await page.locator('input[type="file"]').setInputFiles({
    name: "resized.json",
    mimeType: "application/json",
    buffer: Buffer.from(contents),
  });
  await expect(
    page.getByRole("heading", { name: "Corner landing" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /obstacle-1/ }).click();
  await page
    .locator(".door-editor")
    .getByRole("checkbox", { name: "Centered doorway" })
    .uncheck();
  await expect(
    page.locator(".door-editor").getByLabel("Opening width"),
  ).toHaveCount(0);
  const removed = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: "Save project" })
    .click();
  const after = JSON.parse(
    await readFile((await (await removed).path())!, "utf8"),
  );
  expect(
    after.project.rects.find((rect: { id: string }) => rect.id === "obstacle-1")
      .door,
  ).toBeUndefined();
});

test("README five-line project example imports and solves in the real app", async ({
  page,
}) => {
  const readme = await readFile("README.md", "utf8");
  const example = readme.match(/```json\n([\s\S]*?)\n```/)?.[1];
  expect(example).toBeDefined();
  expect(example!.split("\n")).toHaveLength(5);
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "room.json",
    mimeType: "application/json",
    buffer: Buffer.from(example!),
  });
  await expect(page.getByRole("heading", { name: "Small room" })).toBeVisible();
  await page.getByRole("button", { name: "Find route" }).click();
  await expect(
    page.locator("#route-panel").getByText("Route ready"),
  ).toBeVisible();
});

test("status messages follow a language change after cancellation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Find route" }).click();
  await page.getByRole("button", { name: "Cancel search" }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("zh-TW");
  await expect(page.locator("#route-panel")).toContainText("搜尋已取消。");
});

test("a narrow route sheet keeps every localized header line within its SVG", async ({
  page,
  context,
}) => {
  const project = {
    format: "unwedged",
    schemaVersion: 1,
    project: {
      schemaVersion: 1,
      name: "Narrow room",
      floor: { width: 100, height: 160 },
      furniture: { length: 30, width: 20, height: 50 },
      margin: 2,
      rects: [],
      start: { x: 25, y: 50, angle: 0 },
      goal: { x: 75, y: 110, angle: 0 },
    },
  };
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "narrow.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await expect(
    page.getByRole("heading", { name: "Narrow room" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find route" }).click();
  await expect(
    page.locator("#route-panel").getByText("Route ready"),
  ).toBeVisible();
  await page.getByLabel("Language", { exact: true }).selectOption("zh-TW");
  const download = page.waitForEvent("download");
  await page
    .locator(".side-footer")
    .getByRole("button", { name: "匯出路線圖" })
    .click();
  const svg = await readFile((await (await download).path())!, "utf8");
  const sheet = await context.newPage();
  try {
    await sheet.goto(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );
    await sheet.evaluate(() => document.fonts.ready);
    const outside = await sheet.evaluate(() => {
      const root = document.querySelector("svg")!;
      return [...root.querySelectorAll("text")].filter((text) => {
        const box = text.getBBox();
        return box.x < 0 || box.x + box.width > root.viewBox.baseVal.width;
      }).length;
    });
    expect(outside).toBe(0);
  } finally {
    await sheet.close();
  }
});

test("saved half-turn and high-subdivision routes reopen through the actual import worker", async ({
  page,
}) => {
  const halfTurn = structuredClone(presets[0]!);
  halfTurn.name = "Saved half-turn regression";
  halfTurn.floor = { width: 500, height: 500 };
  halfTurn.furniture = { length: 100, width: 10, height: 10 };
  halfTurn.start = { x: 150, y: 250, angle: 3 * Math.PI };
  halfTurn.goal = { x: 350, y: 250, angle: 4 * Math.PI };
  halfTurn.rects = [
    { id: "corner", x: 165, y: 285, width: 6, height: 6, kind: "obstacle" },
  ];
  const nearMargin = structuredClone(presets[0]!);
  nearMargin.name = "Saved near-margin regression";
  nearMargin.rects = [];
  nearMargin.start.y = nearMargin.goal.y = 43.01;
  await page.goto("/");
  for (const project of [halfTurn, nearMargin]) {
    await page.locator('input[type="file"]').setInputFiles({
      name: "regression.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ format: "unwedged", schemaVersion: 1, project }),
      ),
    });
    await expect(
      page.getByRole("heading", { name: project.name, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Find route/ }).click();
    await expect(
      page.locator("#route-panel").getByText("Route ready"),
    ).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: /Save project/ }).click();
    const saved = await readFile((await (await downloaded).path())!);
    await page.locator("#furniture").getByLabel("Width").fill("12");
    await expect(page.locator(".route-line")).toHaveCount(0);
    await page.locator('input[type="file"]').setInputFiles({
      name: "saved.json",
      mimeType: "application/json",
      buffer: saved,
    });
    await expect(
      page.locator("#route-panel").getByText("Route ready"),
    ).toBeVisible();
    await expect(page.locator(".route-line")).toHaveCount(1);
  }
});
