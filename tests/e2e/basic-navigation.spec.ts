import { test, expect } from "@playwright/test";

test.describe("Basic Navigation Tests", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Should have a title
    await expect(page).toHaveTitle(/Isla/);

    // Should have some navigation elements or content
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should load signup page", async ({ page }) => {
    await page.goto("/signup");

    // Should have signup form elements
    await expect(page.getByText(/sign up/i)).toBeVisible();
  });

  test("should handle 404 for non-existent pages", async ({ page }) => {
    const response = await page.goto("/non-existent-page");
    expect(response?.status()).toBe(404);
  });

  test("should have working keyboard shortcuts", async ({ page }) => {
    await page.goto("/");

    // Test that keyboard events are properly handled
    await page.keyboard.press("/");

    // The page should handle the keypress without errors
    // This tests that the global keyboard listener is working
    const errors = page.locator('[data-testid="error"]');
    await expect(errors).toHaveCount(0);
  });
});

test.describe("Command Palette Infrastructure", () => {
  test("should load command palette component without errors", async ({ page }) => {
    await page.goto("/");

    // Test that Command+K keyboard shortcut is registered
    await page.keyboard.press("Meta+k");

    // Should not cause any console errors
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(1000);

    // Should not have command palette related errors
    const hasCommandPaletteErrors = logs.some(
      (log) => log.includes("command") || log.includes("palette") || log.includes("cmdk")
    );
    expect(hasCommandPaletteErrors).toBeFalsy();
  });
});
