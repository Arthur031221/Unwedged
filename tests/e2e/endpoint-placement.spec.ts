import { expect, test } from "@playwright/test";

test("destination footprint and endpoint warnings track committed measurements", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Measured layout")
    .selectOption({ label: "Corner landing" });
  const warnings = page.locator(".endpoint-warnings");
  await expect(warnings).toHaveAttribute("role", "status");
  const warningRegion = await warnings.elementHandle();
  const goalX = page.locator(".pose-inputs fieldset").nth(1).getByLabel("X");
  await expect(page.locator(".goal-footprint")).toHaveCount(1);
  await page.locator(".quick-find").click();
  await expect(page.locator(".route-line")).toHaveAttribute("points", /\d/);

  await goalX.fill("450");
  await expect(page.locator(".endpoint-warnings")).toBeEmpty();
  await goalX.press("Tab");
  await expect(page.locator(".route-line")).toHaveCount(0);
  await expect(page.locator(".endpoint-warnings")).toContainText("Destination");
  expect(await warningRegion!.evaluate((element) => element.isConnected)).toBe(
    true,
  );
  await expect(page.locator(".goal-footprint")).toHaveClass(/endpoint-warning/);

  await goalX.fill("390");
  await expect(page.locator(".endpoint-warnings")).toBeEmpty();
  await expect(page.locator(".goal-footprint")).not.toHaveClass(
    /endpoint-warning/,
  );
  await goalX.press("Tab");
  await expect(page.locator(".endpoint-warnings")).toBeEmpty();
  await expect(page.locator(".goal-footprint")).not.toHaveClass(
    /endpoint-warning/,
  );

  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(goalX).toHaveValue("153.54");
  await goalX.fill("180");
  await goalX.press("Tab");
  await expect(page.locator(".endpoint-warnings")).toContainText(
    "Required safety margin 0.8 in",
  );
});

test("positive clearance below the margin is distinguished from a collision", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "New empty plan", exact: true })
    .click();
  const margin = page.getByLabel("Safety margin", { exact: true });
  await margin.fill("30");
  await margin.press("Tab");
  const warnings = page.locator(".endpoint-warnings");
  await expect(warnings).toContainText("clearance 25.0 cm");
  await expect(warnings).toContainText("Required safety margin 30.0 cm");
  await expect(warnings.locator("p")).toHaveCount(2);
  await expect(warnings).not.toContainText("touches");
  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(warnings).toContainText("clearance 9.8 in");
  await expect(warnings).toContainText("11.8 in");
  await expect(margin).toHaveValue("11.81");
  await margin.fill("0.5");
  await margin.press("Tab");
  await expect(warnings).toBeEmpty();
});

test("mobile measurement drawer can correct an endpoint warning", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.locator(".mobile-measure").click();
  const goalX = page.locator(".pose-inputs fieldset").nth(1).getByLabel("X");
  await goalX.fill("450");
  await goalX.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.locator(".endpoint-warnings")).toContainText("Destination");
  await page.locator(".mobile-measure").click();
  await goalX.fill("390");
  await goalX.press("Tab");
  await expect(page.locator(".endpoint-warnings")).toBeEmpty();
});
