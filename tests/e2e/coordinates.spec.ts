import { expect, test } from "@playwright/test";

test("center coordinates rise from the lower left and positive angles turn counterclockwise", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "New empty plan", exact: true })
    .click();
  const start = page.locator(".pose-inputs fieldset").first();
  const y = start.getByLabel("Y", { exact: true });
  await expect(y).toHaveValue("150");
  await y.fill("80");
  await y.press("Tab");
  const marker = page.locator(".pose-marker circle");
  const lowerPosition = Number(await marker.getAttribute("cy"));
  await y.fill("180");
  await y.press("Tab");
  await expect
    .poll(async () => Number(await marker.getAttribute("cy")))
    .toBeLessThan(lowerPosition);

  const angle = start.getByLabel("Angle", { exact: true });
  await angle.fill("30");
  await angle.press("Tab");
  const direction = page.locator(".pivot-line");
  await expect
    .poll(async () => {
      const values = await direction.evaluate((line) => [
        Number(line.getAttribute("x1")),
        Number(line.getAttribute("y1")),
        Number(line.getAttribute("x2")),
        Number(line.getAttribute("y2")),
      ]);
      return values[2]! > values[0]! && values[3]! < values[1]!;
    })
    .toBe(true);
});
