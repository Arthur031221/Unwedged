import { expect, test } from "@playwright/test";

test("start coordinates accept signed decimal keyboard input", async ({
  page,
}) => {
  await page.goto("/");
  const startX = page.locator(".pose-inputs fieldset").first().getByLabel("X");
  await startX.focus();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("-25.5");

  await expect(startX).toHaveAttribute("type", "number");
  await expect(startX).toHaveValue("-25.5");
});

test("clearing a field keeps its accepted measurement until retyped", async ({
  page,
}) => {
  await page.goto("/");
  const width = page.locator("#furniture").getByLabel("Width");
  await width.fill("120");
  await width.fill("");
  await expect(width).toHaveValue("");
  await width.press("Tab");
  await expect(width).toHaveValue("120");
});

test("clamped measurements normalize to the accepted value on blur", async ({
  page,
}) => {
  await page.goto("/");
  const length = page.locator("#furniture").getByLabel("Length");
  await length.fill("2500");
  await expect(length).toHaveValue("2500");
  await length.press("Tab");
  await expect(length).toHaveValue("2000");
});

test("changing units refreshes an in-progress field draft", async ({
  page,
}) => {
  await page.goto("/");
  const startX = page.locator(".pose-inputs fieldset").first().getByLabel("X");
  await startX.fill("");
  await expect(startX).toHaveValue("");

  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(startX).toHaveValue("37.4");
  await expect(startX).toHaveAttribute("aria-description", "in");
});
