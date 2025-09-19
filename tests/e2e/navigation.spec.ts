import { test, expect } from "@playwright/test";

test.describe("Navigation System", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the public home page which should be accessible
    await page.goto("/");
  });

  test.describe("Global Navigation", () => {
    test("should display global navigation bar", async ({ page }) => {
      await expect(page.locator("nav")).toBeVisible();
      await expect(page.getByRole("link", { name: /Dashboard/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Links/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Analytics/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Settings/i })).toBeVisible();
    });

    test("should navigate between pages", async ({ page }) => {
      await page.getByRole("link", { name: /Links/i }).click();
      await expect(page).toHaveURL("/links");

      await page.getByRole("link", { name: /Analytics/i }).click();
      await expect(page).toHaveURL("/analytics");

      await page.getByRole("link", { name: /Dashboard/i }).click();
      await expect(page).toHaveURL("/dashboard");
    });

    test("should display workspace selector", async ({ page }) => {
      await expect(page.getByRole("combobox")).toBeVisible();
    });

    test("should display user menu", async ({ page }) => {
      const avatarButton = page
        .locator("button")
        .filter({ has: page.locator('[class*="avatar"]') });
      await expect(avatarButton).toBeVisible();

      await avatarButton.click();
      await expect(page.getByText(/Profile/i)).toBeVisible();
      await expect(page.getByText(/Sign Out/i)).toBeVisible();
    });
  });

  test.describe("Command Palette", () => {
    test("should open command palette with keyboard shortcut", async ({ page }) => {
      await page.keyboard.press("Meta+k");
      await expect(page.getByPlaceholder(/Type a command or search/i)).toBeVisible();
    });

    test("should open command palette with button click", async ({ page }) => {
      const commandButton = page.getByRole("button", { name: /⌘K/i });
      if (await commandButton.isVisible()) {
        await commandButton.click();
        await expect(page.getByPlaceholder(/Type a command or search/i)).toBeVisible();
      }
    });

    test("should search and filter commands", async ({ page }) => {
      await page.keyboard.press("Meta+k");
      const searchInput = page.getByPlaceholder(/Type a command or search/i);
      await searchInput.fill("link");

      await expect(page.getByText(/Create New Link/i)).toBeVisible();
      await expect(page.getByText(/Search Links/i)).toBeVisible();
    });

    test("should execute command on selection", async ({ page }) => {
      await page.keyboard.press("Meta+k");
      const searchInput = page.getByPlaceholder(/Type a command or search/i);
      await searchInput.fill("dashboard");

      await page.getByText(/Go to Dashboard/i).click();
      await expect(page).toHaveURL("/dashboard");
    });

    test("should close with Escape key", async ({ page }) => {
      await page.keyboard.press("Meta+k");
      await expect(page.getByPlaceholder(/Type a command or search/i)).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByPlaceholder(/Type a command or search/i)).not.toBeVisible();
    });
  });

  test.describe("Keyboard Shortcuts", () => {
    test("should open help dialog with ? key", async ({ page }) => {
      await page.keyboard.press("Shift+?");
      await expect(page.getByText(/Keyboard Shortcuts/i)).toBeVisible();
      await expect(page.getByText(/Open command palette/i)).toBeVisible();
    });

    test("should open quick create dialog with c key", async ({ page }) => {
      await page.keyboard.press("c");
      await expect(page.getByText(/Quick Create Link/i)).toBeVisible();
      await expect(page.getByPlaceholder(/https:\/\/example.com/i)).toBeVisible();
    });

    test("should focus search with / key", async ({ page }) => {
      await page.goto("/links");
      await page.keyboard.press("/");

      // Check if search input is focused
      const searchInput = page.getByPlaceholder(/Search everything/i);
      await expect(searchInput).toBeFocused();
    });
  });

  test.describe("Quick Link Creation", () => {
    test("should create link from quick create dialog", async ({ page }) => {
      await page.keyboard.press("c");

      const urlInput = page.getByPlaceholder(/https:\/\/example.com/i);
      await urlInput.fill("https://example.com/test");

      const slugInput = page.getByPlaceholder(/my-custom-link/i);
      await slugInput.fill("test-slug");

      await page.getByRole("button", { name: /Create Link/i }).click();

      // Verify success state
      await expect(page.getByText(/Your short link/i)).toBeVisible();
    });

    test("should generate random slug", async ({ page }) => {
      await page.keyboard.press("c");

      const urlInput = page.getByPlaceholder(/https:\/\/example.com/i);
      await urlInput.fill("https://example.com/test");

      await page.getByRole("button", { name: /Generate random slug/i }).click();

      const slugInput = page.getByPlaceholder(/my-custom-link/i);
      const slugValue = await slugInput.inputValue();
      expect(slugValue).not.toBe("");
    });

    test("should close dialog on cancel", async ({ page }) => {
      await page.keyboard.press("c");
      await expect(page.getByText(/Quick Create Link/i)).toBeVisible();

      await page.getByRole("button", { name: /Cancel/i }).click();
      await expect(page.getByText(/Quick Create Link/i)).not.toBeVisible();
    });
  });

  test.describe("Universal Search", () => {
    test("should open search popover on focus", async ({ page }) => {
      await page.goto("/links");
      const searchInput = page.getByPlaceholder(/Search everything/i);
      await searchInput.click();

      await expect(page.getByText(/Recent Searches/i)).toBeVisible();
    });

    test("should search across different types", async ({ page }) => {
      await page.goto("/links");
      const searchInput = page.getByPlaceholder(/Search everything/i);
      await searchInput.click();
      await searchInput.fill("analytics");

      await expect(page.getByText(/Analytics Overview/i)).toBeVisible();
    });

    test("should navigate on result selection", async ({ page }) => {
      await page.goto("/links");
      const searchInput = page.getByPlaceholder(/Search everything/i);
      await searchInput.click();
      await searchInput.fill("settings");

      await page.getByText(/Workspace Settings/i).click();
      await expect(page).toHaveURL("/settings/workspace");
    });

    test("should save search history", async ({ page }) => {
      await page.goto("/links");
      const searchInput = page.getByPlaceholder(/Search everything/i);
      await searchInput.click();
      await searchInput.fill("test search");
      await page.keyboard.press("Enter");

      // Reopen search
      await searchInput.click();
      await searchInput.clear();

      await expect(page.getByText(/test search/i)).toBeVisible();
    });
  });

  test.describe("Breadcrumbs", () => {
    test("should display breadcrumbs on pages", async ({ page }) => {
      await page.goto("/links");
      await expect(page.getByRole("navigation", { name: /Breadcrumb/i })).toBeVisible();
      await expect(page.getByText(/Home/i)).toBeVisible();
      await expect(page.getByText(/Links/i)).toBeVisible();
    });

    test("should navigate via breadcrumb links", async ({ page }) => {
      await page.goto("/links");
      await page.getByRole("link", { name: /Home/i }).click();
      await expect(page).toHaveURL("/dashboard");
    });
  });

  test.describe("Mobile Navigation", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should display mobile menu button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Menu/i })).toBeVisible();
    });

    test("should open mobile navigation drawer", async ({ page }) => {
      await page.getByRole("button", { name: /Menu/i }).click();
      await expect(page.getByText(/Navigation/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /Dashboard/i })).toBeVisible();
    });

    test("should navigate and close drawer on mobile", async ({ page }) => {
      await page.getByRole("button", { name: /Menu/i }).click();
      await page.getByRole("link", { name: /Links/i }).click();

      await expect(page).toHaveURL("/links");
      await expect(page.getByText(/Navigation/i)).not.toBeVisible();
    });
  });
});
