import { test, expect } from "@playwright/test";

test.describe("Trace QA smoke tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
