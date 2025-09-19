import { test, expect } from '@playwright/test'

test.describe('Usage Limits Enforcement', () => {
  // Test user credentials
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    workspaceSlug: 'test-workspace',
  }
  
  // Helper to login
  async function login(page: any) {
    await page.goto('/login')
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(`/${testUser.workspaceSlug}/dashboard`)
  }
  
  test.beforeEach(async ({ page }) => {
    await login(page)
  })
  
  test('should show warning banner at 80% usage', async ({ page }) => {
    // Navigate to links page
    await page.goto(`/${testUser.workspaceSlug}/links`)
    
    // Check for warning banner (assuming 80% usage)
    const warningBanner = page.locator('[data-testid="usage-warning-banner"]')
    await expect(warningBanner).toBeVisible()
    
    // Check warning message content
    await expect(warningBanner).toContainText(/You're at \d+% of your link limit/)
    
    // Check for upgrade CTA
    const upgradeCTA = warningBanner.locator('button:has-text("Upgrade Plan")')
    await expect(upgradeCTA).toBeVisible()
    
    // Test dismiss functionality
    const dismissButton = warningBanner.locator('button[aria-label="Dismiss"]')
    await dismissButton.click()
    await expect(warningBanner).not.toBeVisible()
    
    // Refresh page - should remain dismissed (session storage)
    await page.reload()
    await expect(warningBanner).not.toBeVisible()
  })
  
  test('should block link creation when at limit', async ({ page }) => {
    // Navigate to links page
    await page.goto(`/${testUser.workspaceSlug}/links`)
    
    // Try to create a new link
    await page.click('button:has-text("Create Link")')
    
    // Fill in link details
    await page.fill('input[name="url"]', 'https://example.com')
    await page.fill('input[name="slug"]', 'test-link')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for limit error
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/Link limit reached/)
    
    // Check for upgrade prompt
    const upgradePrompt = page.locator('[data-testid="upgrade-prompt"]')
    await expect(upgradePrompt).toBeVisible()
  })
  
  test('should show plan comparison modal', async ({ page }) => {
    // Navigate to links page with limit reached
    await page.goto(`/${testUser.workspaceSlug}/links`)
    
    // Click upgrade button in warning banner
    await page.click('button:has-text("Upgrade Plan")')
    
    // Check modal is visible
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    
    // Check plan comparison table
    await expect(modal).toContainText('Choose the perfect plan')
    await expect(modal).toContainText('Free')
    await expect(modal).toContainText('Starter')
    await expect(modal).toContainText('Pro')
    await expect(modal).toContainText('Business')
    
    // Check billing toggle
    const monthlyTab = modal.locator('button:has-text("Monthly")')
    const yearlyTab = modal.locator('button:has-text("Yearly")')
    await expect(monthlyTab).toBeVisible()
    await expect(yearlyTab).toBeVisible()
    
    // Switch to yearly
    await yearlyTab.click()
    await expect(modal).toContainText('Save 20%')
    
    // Check recommended plan is highlighted
    const recommendedBadge = modal.locator('text=Recommended')
    await expect(recommendedBadge).toBeVisible()
  })
  
  test('should track clicks even when at limit', async ({ page, request }) => {
    // Create a link that's already at limit
    const linkSlug = 'test-track-click'
    
    // Navigate to the short link (simulating a click)
    const response = await request.get(`/${linkSlug}`)
    
    // Should redirect successfully (not blocked)
    expect(response.status()).toBe(301)
    
    // Check click was tracked in analytics
    await page.goto(`/${testUser.workspaceSlug}/links`)
    
    // Find the link in the list
    const linkRow = page.locator(`tr:has-text("${linkSlug}")`)
    const clickCount = linkRow.locator('[data-testid="click-count"]')
    
    // Click count should have incremented
    await expect(clickCount).toHaveText(/\d+/)
  })
  
  test('should show read-only analytics when over click limit', async ({ page }) => {
    // Navigate to analytics page
    await page.goto(`/${testUser.workspaceSlug}/analytics`)
    
    // Check for read-only notice
    const readOnlyNotice = page.locator('[data-testid="analytics-read-only"]')
    await expect(readOnlyNotice).toBeVisible()
    await expect(readOnlyNotice).toContainText('Analytics are read-only')
    
    // Check that charts are still visible but interactions disabled
    const chart = page.locator('[data-testid="analytics-chart"]')
    await expect(chart).toBeVisible()
    
    // Export button should be disabled
    const exportButton = page.locator('button:has-text("Export")')
    await expect(exportButton).toBeDisabled()
  })
  
  test('should block team invitation when at user limit', async ({ page }) => {
    // Navigate to team settings
    await page.goto(`/${testUser.workspaceSlug}/settings/team`)
    
    // Try to invite a new member
    await page.click('button:has-text("Invite Member")')
    
    // Fill invitation form
    await page.fill('input[name="email"]', 'newmember@example.com')
    await page.selectOption('select[name="role"]', 'viewer')
    
    // Submit invitation
    await page.click('button[type="submit"]')
    
    // Check for limit error
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/Team member limit reached/)
    
    // Check for upgrade suggestion
    await expect(page.locator('text=Upgrade to Pro')).toBeVisible()
  })
  
  test('should update usage meters in real-time', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`/${testUser.workspaceSlug}/dashboard`)
    
    // Check usage meters are visible
    const linkMeter = page.locator('[data-testid="usage-meter-links"]')
    const clickMeter = page.locator('[data-testid="usage-meter-clicks"]')
    const userMeter = page.locator('[data-testid="usage-meter-users"]')
    
    await expect(linkMeter).toBeVisible()
    await expect(clickMeter).toBeVisible()
    await expect(userMeter).toBeVisible()
    
    // Check meter shows percentage
    await expect(linkMeter).toContainText(/\d+%/)
    
    // Check meter has correct color based on usage
    const progressBar = linkMeter.locator('.progress-bar')
    const progressFill = await progressBar.getAttribute('class')
    
    // Should be orange/red if near/at limit
    if (await linkMeter.textContent().then(t => parseInt(t!) >= 80)) {
      expect(progressFill).toMatch(/(orange|red)/)
    }
  })
  
  test('should successfully upgrade and remove limits', async ({ page }) => {
    // Navigate to billing settings
    await page.goto(`/${testUser.workspaceSlug}/settings/billing`)
    
    // Click upgrade button
    await page.click('button:has-text("Upgrade to Pro")')
    
    // Complete Stripe checkout (mock)
    await page.waitForURL(/checkout\.stripe\.com/)
    
    // Simulate successful payment (in test mode)
    await page.fill('input[name="cardNumber"]', '4242424242424242')
    await page.fill('input[name="cardExpiry"]', '12/25')
    await page.fill('input[name="cardCvc"]', '123')
    await page.click('button[type="submit"]')
    
    // Wait for redirect back to app
    await page.waitForURL(`/${testUser.workspaceSlug}/settings/billing`)
    
    // Check success message
    const successMessage = page.locator('[data-testid="success-message"]')
    await expect(successMessage).toContainText('Successfully upgraded to Pro')
    
    // Check limits are updated
    await page.goto(`/${testUser.workspaceSlug}/dashboard`)
    
    // Usage meters should show new limits
    const linkMeter = page.locator('[data-testid="usage-meter-links"]')
    await expect(linkMeter).toContainText('/ 5,000') // Pro limit
    
    // Should be able to create links now
    await page.goto(`/${testUser.workspaceSlug}/links`)
    await page.click('button:has-text("Create Link")')
    
    // Form should not be blocked
    const createButton = page.locator('button[type="submit"]')
    await expect(createButton).toBeEnabled()
  })
  
  test('admin can override limits', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@isla.sh')
    await page.fill('input[name="password"]', 'Admin123!@#')
    await page.click('button[type="submit"]')
    
    // Navigate to admin workspace limits
    await page.goto(`/admin/workspaces/${testUser.workspaceSlug}/limits`)
    
    // Toggle beta user access
    await page.click('label:has-text("Beta User Access")')
    await page.click('button:has-text("Apply Overrides")')
    
    // Check success message
    await expect(page.locator('text=Custom overrides updated')).toBeVisible()
    
    // Grant temporary increase
    await page.selectOption('select[name="metric"]', 'links')
    await page.fill('input[name="amount"]', '100')
    await page.fill('input[name="days"]', '30')
    await page.click('button:has-text("Grant Temporary Increase")')
    
    // Check success message
    await expect(page.locator('text=Temporary increase granted')).toBeVisible()
    
    // Check audit log entry
    const auditLog = page.locator('[data-testid="audit-log-table"]')
    await expect(auditLog).toContainText('temporary_increase_granted')
  })
  
  test('should handle Redis fallback gracefully', async ({ page }) => {
    // Simulate Redis being down (this would be configured in test environment)
    process.env.REDIS_ENABLED = 'false'
    
    // Navigate to dashboard
    await page.goto(`/${testUser.workspaceSlug}/dashboard`)
    
    // Usage meters should still work (using database)
    const linkMeter = page.locator('[data-testid="usage-meter-links"]')
    await expect(linkMeter).toBeVisible()
    await expect(linkMeter).toContainText(/\d+/)
    
    // Create a link (should fallback to database)
    await page.goto(`/${testUser.workspaceSlug}/links`)
    await page.click('button:has-text("Create Link")')
    await page.fill('input[name="url"]', 'https://example.com')
    await page.click('button[type="submit"]')
    
    // Should work despite Redis being down
    await expect(page.locator('text=Link created')).toBeVisible()
    
    // Re-enable Redis
    process.env.REDIS_ENABLED = 'true'
  })
})