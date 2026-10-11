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
  await startX.press("Tab");
});

test("clearing a field keeps its accepted measurement until retyped", async ({
  page,
}) => {
  await page.goto("/");
  const width = page.locator("#furniture").getByLabel("Width");
  await width.fill("120");
  await width.press("Tab");
  await expect(width).toHaveValue("120");
  await width.fill("");
  await expect(width).toHaveValue("");
  await width.press("Tab");
  await expect(width).toHaveValue("120");
});

test("unsupported measurements stay visible, explain the limit, and block actions", async ({
  page,
}) => {
  await page.goto("/");
  const length = page.locator("#furniture").getByLabel("Length");
  await length.fill("2500");
  await expect(length).toHaveValue("2500");
  await length.press("Tab");
  await expect(length).toHaveValue("2500");
  await expect(length).toHaveAttribute("aria-invalid", "true");
  await expect(length).toHaveAttribute("aria-describedby", /error/);
  await expect(page.locator(".field-error").first()).toContainText("2000");
  await expect(page.locator(".primary-btn")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Share" })).toBeDisabled();
  await expect(
    page.locator(".side-footer").getByRole("button", { name: "Save project" }),
  ).toBeDisabled();
  await expect(
    page
      .locator(".side-footer")
      .getByRole("button", { name: "Export route sheet" }),
  ).toBeDisabled();
  await length.fill("150");
  await expect(length).toHaveAttribute("aria-invalid", "false");
  await length.press("Tab");
  await expect(length).toHaveValue("150");
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

test("negative safety margin is rejected and a cleared edit cancels on blur", async ({
  page,
}) => {
  await page.goto("/");
  const margin = page.locator("#furniture").getByLabel("Safety margin");
  await margin.fill("-1");
  await margin.press("Tab");
  await expect(margin).toHaveValue("-1");
  await expect(margin).toHaveAttribute("aria-invalid", "true");
  await margin.fill("2");
  await margin.press("Tab");
  await expect(margin).toHaveValue("2");
});

test("floor area limit is reported without changing the accepted floor", async ({
  page,
}) => {
  await page.goto("/");
  const floor = page.locator(".form-section").first();
  const width = floor.getByLabel("Width");
  const depth = floor.getByLabel("Depth");
  await width.fill("2000");
  await width.press("Tab");
  await expect(width).toHaveValue("2000");
  await depth.fill("1001");
  await depth.press("Tab");
  await expect(depth).toHaveValue("1001");
  await expect(depth).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".field-error").last()).toContainText("1000");
  await depth.fill("300");
  await depth.press("Tab");
  await expect(depth).toHaveValue("300");
});

test("mobile search explains invalid measurements after closing the panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.locator(".mobile-measure").click();
  await page.locator("#furniture").getByLabel("Length").fill("2500");
  await page.keyboard.press("Escape");
  await expect(page.locator(".quick-find")).toBeDisabled();
  await expect(page.locator(".canvas-status")).toHaveText(
    "Correct the highlighted measurements before searching.",
  );
  await page.locator(".mobile-measure").click();
  const length = page.locator("#furniture").getByLabel("Length");
  await expect(length).toHaveValue("2500");
  await length.fill("190");
  await length.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.locator(".quick-find")).toBeEnabled();
});

test("measurement errors follow the selected language without discarding the draft", async ({
  page,
}) => {
  await page.goto("/");
  const length = page.locator("#furniture input").first();
  await length.fill("2500");
  await length.press("Tab");
  await page.locator(".toolbar select").selectOption("zh-TW");
  await expect(length).toHaveValue("2500");
  await expect(length).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".field-error")).toContainText("請輸入");
  await expect(page.locator(".canvas-status")).toHaveText(
    "請先修正標示的量測值，再尋找路線。",
  );
  await page.locator(".toolbar select").selectOption("en");
  await expect(page.locator(".field-error")).toContainText("Enter a value");
});
