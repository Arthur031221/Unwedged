import { expect, test } from "@playwright/test";

test("the last section stays current at the bottom of long viewports", async ({
  page,
}) => {
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto("/");
    if (width === 320)
      await page.getByRole("button", { name: /Measurements/ }).click();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate((mobile) => {
      const scroller = mobile
        ? document.querySelector(".sidebar")!
        : document.scrollingElement!;
      scroller.scrollTop = scroller.scrollHeight;
    }, width === 320);
    await expect(
      page
        .locator(".step-tabs")
        .getByRole("button", { name: "Route", exact: true }),
    ).toHaveAttribute("aria-current", "location");
  }
});

test("desktop section navigation follows keyboard focus and real scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto("/");

  const tabs = page.locator(".step-tabs");
  const furnitureTab = tabs.getByRole("button", { name: "Furniture" });
  const furniture = page.locator("#furniture");
  await furniture.evaluate((element) => element.scrollIntoView());
  await expect(furnitureTab).toHaveAttribute("aria-current", "location");
  await furnitureTab.focus();
  await page.keyboard.press("Enter");
  await expect(furniture).toBeFocused();
  await expect(furniture).toHaveCSS("outline-style", "solid");
  await expect(furnitureTab).toHaveAttribute("aria-current", "location");

  const routeTab = tabs.getByRole("button", { name: "Route" });
  const route = page.locator("#route-panel");
  await routeTab.focus();
  await page.keyboard.press("Enter");
  await expect(route).toBeFocused();
  await expect(routeTab).toHaveAttribute("aria-current", "location");

  const layoutTab = tabs.getByRole("button", { name: "Layout" });
  const layout = page.locator("#layout");
  await layoutTab.focus();
  await page.keyboard.press("Enter");
  await expect(layout).toBeFocused();
  await expect(layoutTab).toHaveAttribute("aria-current", "location");
  expect(new URL(page.url()).hash).toBe("");
  await expect(
    layout.getByRole("heading", { name: "Floor dimensions" }),
  ).toBeVisible();
});

test("mobile section buttons keep Measurements open and focus their targets", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await page.getByRole("button", { name: /Measurements/ }).click();
    const drawer = page.getByRole("dialog", { name: "Measurements" });
    await expect(drawer.getByRole("button", { name: "Close" })).toBeFocused();
    const tabs = drawer.locator(".step-tabs");

    for (const [label, selector] of [
      ["Furniture", "#furniture"],
      ["Route", "#route-panel"],
      ["Layout", "#layout"],
    ]) {
      const tab = tabs.getByRole("button", { name: label });
      await tab.focus();
      await page.keyboard.press("Enter");
      const target = page.locator(selector);
      await expect(target).toBeFocused();
      await expect(target).toBeInViewport({ ratio: 0.01 });
      await expect(drawer).toBeVisible();
      await expect(tab).toHaveAttribute("aria-current", "location");
    }
    await expect(
      page
        .locator("#layout")
        .getByRole("heading", { name: "Floor dimensions" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("section navigation uses smooth scrolling unless reduced motion is requested", async ({
  browser,
}) => {
  for (const [reducedMotion, expected] of [
    ["no-preference", "smooth"],
    ["reduce", "auto"],
  ] as const) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion,
    });
    const page = await context.newPage();
    try {
      await page.goto("/");
      await page.evaluate(() => {
        const original = Element.prototype.scrollIntoView;
        (
          window as Window & { scrollBehavior?: ScrollBehavior }
        ).scrollBehavior = undefined;
        Element.prototype.scrollIntoView = function (options) {
          (
            window as Window & { scrollBehavior?: ScrollBehavior }
          ).scrollBehavior =
            typeof options === "object" ? options.behavior : undefined;
          original.call(this, options);
        };
      });
      await page.getByRole("button", { name: "Furniture" }).click();
      await expect(page.locator("#furniture")).toBeFocused();
      await expect(page.locator("#furniture")).toHaveCSS(
        "outline-style",
        "none",
      );
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as Window & { scrollBehavior?: ScrollBehavior })
                .scrollBehavior,
          ),
        )
        .toBe(expected);
    } finally {
      await context.close();
    }
  }
});

test("localized coordinate guidance explains pose and obstacle positions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".coordinate-guidance").first()).toContainText(
    "X/Y values locate centers",
  );
  await expect(page.locator(".coordinate-guidance").first()).toContainText(
    "Positive angles rotate counterclockwise",
  );
  await page.getByLabel("Language").selectOption("es");
  await expect(page.locator(".coordinate-guidance").first()).toContainText(
    "X/Y",
  );
  await expect(page.locator(".coordinate-guidance").first()).not.toContainText(
    "Positive angles rotate counterclockwise",
  );
  await page.getByRole("button", { name: "Añadir obstáculo" }).click();
  await expect(page.locator(".obstacle-coordinate-guidance")).toBeVisible();
  await expect(page.locator(".obstacle-coordinate-guidance")).toContainText(
    "centro",
  );
});

test("measurement navigation fits a 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page.getByRole("button", { name: /Measurements/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Measurements" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("closing the drawer during navigation keeps section feedback working", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".mobile-measure").click();
  await page.evaluate(() => {
    Element.prototype.scrollIntoView = () => {};
  });
  const tabs = page.locator(".step-tabs");
  await tabs.getByRole("button", { name: "Route", exact: true }).click();
  await expect(
    tabs.getByRole("button", { name: "Route", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await page.keyboard.press("Escape");
  await page.locator(".mobile-measure").click();
  await page.locator(".sidebar").evaluate((panel) => {
    panel.scrollTop = 0;
    panel.dispatchEvent(new Event("scroll"));
  });
  await expect(
    tabs.getByRole("button", { name: "Layout", exact: true }),
  ).toHaveAttribute("aria-current", "location");
});

test("mobile inline measurements track page scrolling with the drawer closed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator("#furniture")
    .evaluate((section) => section.scrollIntoView({ behavior: "instant" }));
  await expect(page.locator(".sidebar")).not.toHaveClass(/\bopen\b/);
  await expect(
    page.locator(".step-tabs").getByRole("button", { name: "Furniture" }),
  ).toHaveAttribute("aria-current", "location");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(
    page.locator(".step-tabs").getByRole("button", { name: "Layout" }),
  ).toHaveAttribute("aria-current", "location");
});

for (const completion of ["scrollend", "timeout"] as const) {
  test(`interrupted section navigation follows its actual position after ${completion}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto("/");
    await page.evaluate(() => {
      Element.prototype.scrollIntoView = () => {};
    });
    const tabs = page.locator(".step-tabs");
    await tabs.getByRole("button", { name: "Route", exact: true }).click();
    await expect(
      tabs.getByRole("button", { name: "Route", exact: true }),
    ).toHaveAttribute("aria-current", "location");
    await page.evaluate((completion) => {
      window.dispatchEvent(new Event("scroll"));
      if (completion === "scrollend")
        document.dispatchEvent(new Event("scrollend"));
    }, completion);
    await expect(
      tabs.getByRole("button", { name: "Layout", exact: true }),
    ).toHaveAttribute("aria-current", "location");
  });
}
