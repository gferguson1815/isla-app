import { test, expect } from "@playwright/test";
import path from "path";

test.describe("CSV Import Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - adjust based on your auth implementation
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button:has-text("Sign In")');
    
    // Navigate to CSV import page
    await page.goto("/workspace/test-workspace/links/import");
  });

  test("should complete full CSV import flow", async ({ page }) => {
    // Click import button
    await page.click('button:has-text("Select CSV File")');
    
    // Upload CSV file
    const csvContent = `destination_url,custom_slug,title,tags
https://example.com,promo-2024,Summer Promo,"marketing,summer"
https://blog.com/post,,Blog Post,content
https://docs.com/guide,docs-guide,Documentation,docs`;
    
    const buffer = Buffer.from(csvContent, "utf-8");
    const fileName = "test-import.csv";
    
    // Set file input
    await page.setInputFiles('input[type="file"]', {
      name: fileName,
      mimeType: "text/csv",
      buffer: buffer,
    });
    
    // Wait for file to be processed
    await expect(page.locator("text=Column Mapping")).toBeVisible();
    
    // Column mapping should be auto-detected
    await expect(page.locator('select[name="destination_url"]')).toHaveValue("destination_url");
    
    // Click continue to preview
    await page.click('button:has-text("Continue to Preview")');
    
    // Verify preview table is shown
    await expect(page.locator("text=3 valid")).toBeVisible();
    await expect(page.locator("text=0 warnings")).toBeVisible();
    await expect(page.locator("text=0 errors")).toBeVisible();
    
    // Start import
    await page.click('button:has-text("Start Import")');
    
    // Wait for import to complete
    await expect(page.locator("text=Successfully imported 3 links!")).toBeVisible({
      timeout: 10000,
    });
    
    // Verify confetti animation (optional)
    await expect(page.locator("canvas")).toBeVisible();
    
    // Click view imported links
    await page.click('button:has-text("View Imported Links")');
    
    // Verify redirect to links page
    await expect(page).toHaveURL(/\/workspace\/test-workspace\/links/);
    
    // Verify imported links are visible
    await expect(page.locator("text=Summer Promo")).toBeVisible();
    await expect(page.locator("text=Blog Post")).toBeVisible();
    await expect(page.locator("text=Documentation")).toBeVisible();
  });

  test("should handle CSV with validation errors", async ({ page }) => {
    await page.click('button:has-text("Select CSV File")');
    
    const csvContent = `destination_url,custom_slug
invalid-url,test1
https://example.com,valid-slug
https://example2.com,invalid slug!
https://example3.com,valid-slug`;
    
    const buffer = Buffer.from(csvContent, "utf-8");
    
    await page.setInputFiles('input[type="file"]', {
      name: "test-errors.csv",
      mimeType: "text/csv",
      buffer: buffer,
    });
    
    await page.click('button:has-text("Continue to Preview")');
    
    // Check validation results
    await expect(page.locator("text=2 valid")).toBeVisible();
    await expect(page.locator("text=1 warnings")).toBeVisible(); // Duplicate slug
    await expect(page.locator("text=1 errors")).toBeVisible(); // Invalid URL
    
    // Error rows should be highlighted
    await expect(page.locator("tr.bg-red-50")).toHaveCount(1);
    await expect(page.locator("tr.bg-yellow-50")).toHaveCount(1);
    await expect(page.locator("tr.bg-green-50")).toHaveCount(2);
    
    // Download error report
    await page.click('button:has-text("Download Errors")');
    
    // Start import (should skip error rows)
    await page.click('button:has-text("Start Import")');
    
    await expect(page.locator("text=Imported 2 links, 2 failed")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should enforce plan limits", async ({ page }) => {
    // Mock workspace with free plan (10 link limit)
    await page.goto("/workspace/free-workspace/links/import");
    
    await page.click('button:has-text("Select CSV File")');
    
    // Create CSV with more than 10 links
    const links = Array.from({ length: 15 }, (_, i) => 
      `https://example${i}.com,slug-${i},Title ${i}`
    );
    const csvContent = `destination_url,custom_slug,title\n${links.join("\n")}`;
    
    const buffer = Buffer.from(csvContent, "utf-8");
    
    await page.setInputFiles('input[type="file"]', {
      name: "large-import.csv",
      mimeType: "text/csv",
      buffer: buffer,
    });
    
    await page.click('button:has-text("Continue to Preview")');
    
    // Should show plan limit warning
    await expect(page.locator("text=Your free plan allows importing up to 10 links at once")).toBeVisible();
  });

  test("should show import history", async ({ page }) => {
    // Switch to history tab
    await page.click('button:has-text("History")');
    
    // Check if history table is visible
    await expect(page.locator("table")).toBeVisible();
    
    // Check table headers
    await expect(page.locator("th:has-text('File Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
    await expect(page.locator("th:has-text('Success')")).toBeVisible();
    await expect(page.locator("th:has-text('Errors')")).toBeVisible();
  });

  test("should pause and resume import", async ({ page }) => {
    await page.click('button:has-text("Select CSV File")');
    
    // Create CSV with many links to test pause
    const links = Array.from({ length: 50 }, (_, i) => 
      `https://example${i}.com,slug-${i},Title ${i}`
    );
    const csvContent = `destination_url,custom_slug,title\n${links.join("\n")}`;
    
    const buffer = Buffer.from(csvContent, "utf-8");
    
    await page.setInputFiles('input[type="file"]', {
      name: "pauseable-import.csv",
      mimeType: "text/csv",
      buffer: buffer,
    });
    
    await page.click('button:has-text("Continue to Preview")');
    await page.click('button:has-text("Start Import")');
    
    // Wait for import to start
    await expect(page.locator("text=Importing link")).toBeVisible();
    
    // Click pause
    await page.click('button:has-text("Pause")');
    await expect(page.locator("text=Paused at link")).toBeVisible();
    
    // Click resume
    await page.click('button:has-text("Resume")');
    await expect(page.locator("text=Importing link")).toBeVisible();
  });

  test("should handle cancel during import", async ({ page }) => {
    await page.click('button:has-text("Select CSV File")');
    
    const csvContent = `destination_url,custom_slug
https://example1.com,slug-1
https://example2.com,slug-2
https://example3.com,slug-3`;
    
    const buffer = Buffer.from(csvContent, "utf-8");
    
    await page.setInputFiles('input[type="file"]', {
      name: "cancel-test.csv",
      mimeType: "text/csv",
      buffer: buffer,
    });
    
    await page.click('button:has-text("Continue to Preview")');
    await page.click('button:has-text("Start Import")');
    
    // Wait for import to start then cancel
    await expect(page.locator("text=Importing link")).toBeVisible();
    await page.click('button:has-text("Cancel")');
    
    await expect(page.locator("text=Import cancelled")).toBeVisible();
  });
});