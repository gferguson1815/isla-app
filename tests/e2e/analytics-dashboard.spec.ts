import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-workspace/analytics/test-link-id');
  });

  test('should load the analytics dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Link Analytics' })).toBeVisible();
    await expect(page.getByText('Performance insights for your link')).toBeVisible();
  });

  test('should display key metrics cards', async ({ page }) => {
    await expect(page.getByText('Total Clicks')).toBeVisible();
    await expect(page.getByText('Unique Visitors')).toBeVisible();
    await expect(page.getByText('Avg. Click Rate')).toBeVisible();
    await expect(page.getByText('Top Country')).toBeVisible();
  });

  test('should have date range selector', async ({ page }) => {
    const dateRangeButton = page.getByRole('button', { name: /Last 7 days/i });
    await expect(dateRangeButton).toBeVisible();

    await dateRangeButton.click();
    await expect(page.getByText('Last 24 hours')).toBeVisible();
    await expect(page.getByText('Last 30 days')).toBeVisible();
    await expect(page.getByText('Custom range')).toBeVisible();
  });

  test('should have export button', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export CSV/i });
    await expect(exportButton).toBeVisible();
  });

  test('should display time series chart', async ({ page }) => {
    await expect(page.getByText('Click Activity')).toBeVisible();
    await expect(page.getByText('Click trends over time')).toBeVisible();
  });

  test('should display geographic distribution', async ({ page }) => {
    await expect(page.getByText('Geographic Distribution')).toBeVisible();
    await expect(page.getByText('Clicks by country')).toBeVisible();
  });

  test('should display top referrers', async ({ page }) => {
    await expect(page.getByText('Top Referrers')).toBeVisible();
    await expect(page.getByText('Where your traffic comes from')).toBeVisible();
  });

  test('should display device breakdown', async ({ page }) => {
    await expect(page.getByText('Device Breakdown')).toBeVisible();
    await expect(page.getByText('Click distribution by device type')).toBeVisible();
  });

  test('should display browser breakdown', async ({ page }) => {
    await expect(page.getByText('Browser Breakdown')).toBeVisible();
    await expect(page.getByText('Click distribution by browser')).toBeVisible();
  });

  test('should display click timeline', async ({ page }) => {
    await expect(page.getByText('Recent Click Events')).toBeVisible();
    await expect(page.getByText('Individual click event details')).toBeVisible();
  });

  test('should be able to filter click events', async ({ page }) => {
    await page.getByPlaceholder('Search events...').fill('test');

    const deviceFilter = page.getByRole('combobox').first();
    await deviceFilter.click();
    await page.getByText('Desktop').click();

    await expect(page.getByText(/Showing \d+ of \d+ total events/)).toBeVisible();
  });

  test('should update dashboard when date range changes', async ({ page }) => {
    const dateRangeButton = page.getByRole('button', { name: /Last 7 days/i });
    await dateRangeButton.click();
    await page.getByText('Last 24 hours').click();

    await expect(page.getByText('Today')).toBeVisible();
  });

  test('should handle export CSV action', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('button', { name: /Export CSV/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('analytics');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should show real-time status indicator', async ({ page }) => {
    await expect(page.getByText('Real-time updates active')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByRole('heading', { name: 'Link Analytics' })).toBeVisible();

    const cards = page.locator('[class*="card"]');
    const cardsCount = await cards.count();
    expect(cardsCount).toBeGreaterThan(0);
  });

  test('performance: should load dashboard in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/test-workspace/analytics/test-link-id');
    await page.waitForSelector('text=Link Analytics');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await page.goto('/test-workspace/analytics/large-dataset-link');

    await expect(page.getByText('Recent Click Events')).toBeVisible();

    const timelineContainer = page.locator('[class*="timeline"]').first();
    await timelineContainer.scrollTo({ behavior: 'smooth', top: 1000 });

    await expect(page.getByText(/Showing \d+ of \d+ total events/)).toBeVisible();
  });
});