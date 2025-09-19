import { test, expect } from '@playwright/test';

test.describe('UTM Parameter Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the link creation page
    await page.goto('/links/new');

    // Ensure we're authenticated (mock auth if needed in test environment)
    // This assumes test environment has auth bypassed or test user auto-login
  });

  test('should auto-extract UTM parameters from pasted URL', async ({ page }) => {
    // Paste a URL with UTM parameters
    const urlWithUtm = 'https://example.com/page?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale';

    await page.fill('input[id="url"]', urlWithUtm);

    // Wait for UTM section to auto-expand
    await page.waitForSelector('text=Campaign Tracking', { state: 'visible' });

    // Verify UTM parameters were extracted
    const sourceInput = await page.inputValue('input[placeholder*="source"]');
    const mediumInput = await page.inputValue('input[placeholder*="medium"]');
    const campaignInput = await page.inputValue('input[placeholder*="campaign"]');

    expect(sourceInput).toBe('google');
    expect(mediumInput).toBe('cpc');
    expect(campaignInput).toBe('summer_sale');
  });

  test('should create and apply UTM template', async ({ page }) => {
    // Open UTM section
    await page.click('text=Campaign Tracking');

    // Fill UTM parameters
    await page.fill('input[placeholder*="source"]', 'facebook');
    await page.fill('input[placeholder*="medium"]', 'paid-social');
    await page.fill('input[placeholder*="campaign"]', 'product-launch');

    // Save as template
    await page.click('text=Save as Template');

    // Fill template details
    await page.fill('input[placeholder*="Facebook Campaign"]', 'Facebook Product Launch');
    await page.fill('textarea[placeholder*="Describe when"]', 'Use for all Facebook product launch campaigns');

    // Save template
    await page.click('button:has-text("Save Template")');

    // Wait for success message
    await page.waitForSelector('text=UTM template saved!');

    // Clear the form
    await page.click('text=Clear All');

    // Apply the saved template
    await page.click('text=Select a template');
    await page.click('text=Facebook Product Launch');

    // Verify template was applied
    const sourceValue = await page.inputValue('input[placeholder*="source"]');
    const mediumValue = await page.inputValue('input[placeholder*="medium"]');
    const campaignValue = await page.inputValue('input[placeholder*="campaign"]');

    expect(sourceValue).toBe('facebook');
    expect(mediumValue).toBe('paid-social');
    expect(campaignValue).toBe('product-launch');
  });

  test('should validate UTM parameters and show warnings', async ({ page }) => {
    // Open UTM section
    await page.click('text=Campaign Tracking');

    // Enter invalid UTM parameter (with space)
    await page.fill('input[placeholder*="source"]', 'google ads');
    await page.press('input[placeholder*="source"]', 'Tab');

    // Check for validation error
    await page.waitForSelector('text=Only letters, numbers, underscores, and hyphens allowed');

    // Fix the error
    await page.fill('input[placeholder*="source"]', 'google');

    // Enter uppercase value
    await page.fill('input[placeholder*="medium"]', 'CPC');

    // Create link
    await page.fill('input[id="url"]', 'https://example.com');
    await page.click('button:has-text("Create Link")');

    // Verify link was created with UTM parameters
    await page.waitForSelector('text=Link Created Successfully!');
  });

  test('should display UTM parameters in link details', async ({ page }) => {
    // Create a link with UTM parameters
    await page.fill('input[id="url"]', 'https://example.com');

    // Open UTM section
    await page.click('text=Campaign Tracking');

    // Fill UTM parameters
    await page.fill('input[placeholder*="source"]', 'twitter');
    await page.fill('input[placeholder*="medium"]', 'social');
    await page.fill('input[placeholder*="campaign"]', 'awareness');

    // Create the link
    await page.click('button:has-text("Create Link")');
    await page.waitForSelector('text=Link Created Successfully!');

    // Navigate to links list
    await page.click('text=View All Links');

    // Click on the created link to view details (assuming it's the first one)
    await page.click('table tbody tr:first-child a');

    // Verify UTM parameters are displayed
    await page.waitForSelector('text=UTM Campaign Parameters');
    await expect(page.locator('text=twitter')).toBeVisible();
    await expect(page.locator('text=social')).toBeVisible();
    await expect(page.locator('text=awareness')).toBeVisible();
  });

  test('should filter analytics by UTM parameters', async ({ page }) => {
    // Navigate to analytics page for a link
    await page.goto('/workspace/test/analytics/test-link-id');

    // Wait for analytics to load
    await page.waitForSelector('text=Link Analytics');

    // Open click events section
    await page.waitForSelector('text=Recent Click Events');

    // Apply UTM filter
    await page.fill('input[placeholder="Search events..."]', 'utm_source: google');

    // Verify filtered results
    const filteredEvents = await page.locator('text=utm_source: google').count();
    expect(filteredEvents).toBeGreaterThan(0);

    // Select UTM source from dropdown filter (if available)
    if (await page.isVisible('select:has-option[value="google"]')) {
      await page.selectOption('select:has-option[value="google"]', 'google');

      // Verify all displayed events have the selected UTM source
      const events = await page.locator('[data-testid="click-event"]').all();
      for (const event of events) {
        await expect(event.locator('text=google')).toBeVisible();
      }
    }
  });

  test('should export analytics with UTM data', async ({ page }) => {
    // Navigate to analytics page
    await page.goto('/workspace/test/analytics/test-link-id');

    // Click export button
    await page.click('button:has-text("Export")');

    // Select CSV format
    await page.click('text=CSV');

    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    // Verify download filename contains 'analytics'
    expect(download.suggestedFilename()).toContain('analytics');

    // Read the CSV content
    const content = await download.path().then(async path => {
      if (path) {
        const fs = await import('fs');
        return fs.readFileSync(path, 'utf-8');
      }
      return '';
    });

    // Verify CSV contains UTM columns
    expect(content).toContain('utm_source');
    expect(content).toContain('utm_medium');
    expect(content).toContain('utm_campaign');
  });

  test('should show UTM parameter suggestions', async ({ page }) => {
    // Open UTM section
    await page.click('text=Campaign Tracking');

    // Click on source dropdown
    await page.click('button[role="combobox"]:has-text("Select source")');

    // Verify common source suggestions are shown
    await expect(page.locator('text=google')).toBeVisible();
    await expect(page.locator('text=facebook')).toBeVisible();
    await expect(page.locator('text=twitter')).toBeVisible();
    await expect(page.locator('text=email')).toBeVisible();

    // Select a suggestion
    await page.click('text=google');

    // Verify it was applied
    const sourceValue = await page.inputValue('input[placeholder*="source"]');
    expect(sourceValue).toBe('google');

    // Click on medium dropdown
    await page.click('button[role="combobox"]:has-text("Select medium")');

    // Verify common medium suggestions
    await expect(page.locator('text=cpc')).toBeVisible();
    await expect(page.locator('text=email')).toBeVisible();
    await expect(page.locator('text=social')).toBeVisible();
  });

  test('should preview final URL with UTM parameters', async ({ page }) => {
    // Enter base URL
    await page.fill('input[id="url"]', 'https://example.com/product');

    // Open UTM section
    await page.click('text=Campaign Tracking');

    // Fill UTM parameters
    await page.fill('input[placeholder*="source"]', 'newsletter');
    await page.fill('input[placeholder*="medium"]', 'email');
    await page.fill('input[placeholder*="campaign"]', 'weekly-digest');

    // Wait for preview to update
    await page.waitForSelector('text=Final URL with UTM');

    // Verify the preview shows correct URL
    const previewText = await page.locator('text=Final URL with UTM').locator('..').textContent();
    expect(previewText).toContain('https://example.com/product');
    expect(previewText).toContain('utm_source=newsletter');
    expect(previewText).toContain('utm_medium=email');
    expect(previewText).toContain('utm_campaign=weekly-digest');
  });
});