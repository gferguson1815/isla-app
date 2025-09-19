import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestUser } from '../helpers/auth'
import { createTestWorkspace } from '../helpers/workspace'
import { createTestLink } from '../helpers/link'

test.describe('Tagging and Filtering', () => {
  let testUser: any
  let testWorkspace: any

  test.beforeAll(async () => {
    testUser = await createTestUser()
    testWorkspace = await createTestWorkspace(testUser.id)
  })

  test.afterAll(async () => {
    await cleanupTestUser(testUser.id)
  })

  test('should add tags to a link during creation', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard')

    // Navigate to create link
    await page.click('text=New Link')

    // Fill in link details
    await page.fill('input[name="url"]', 'https://example.com')
    await page.fill('input[name="title"]', 'Test Link with Tags')

    // Add tags
    const tagInput = page.locator('input[placeholder*="Add tags"]')
    await tagInput.click()
    await tagInput.fill('javascript')
    await tagInput.press('Enter')
    await tagInput.fill('tutorial')
    await tagInput.press('Enter')

    // Save the link
    await page.click('button:has-text("Create Link")')

    // Verify tags are displayed
    await expect(page.locator('text=javascript')).toBeVisible()
    await expect(page.locator('text=tutorial')).toBeVisible()
  })

  test('should filter links by tags', async ({ page }) => {
    // Create test links with different tags
    await createTestLink(testWorkspace.id, {
      url: 'https://react.dev',
      title: 'React Documentation',
      tags: ['react', 'javascript', 'documentation'],
    })
    await createTestLink(testWorkspace.id, {
      url: 'https://vuejs.org',
      title: 'Vue.js',
      tags: ['vue', 'javascript'],
    })
    await createTestLink(testWorkspace.id, {
      url: 'https://python.org',
      title: 'Python',
      tags: ['python', 'programming'],
    })

    await page.goto('/dashboard')

    // Click on javascript tag to filter
    await page.click('.tag-filter-bar text=javascript')

    // Verify filtered results
    await expect(page.locator('text=React Documentation')).toBeVisible()
    await expect(page.locator('text=Vue.js')).toBeVisible()
    await expect(page.locator('text=Python')).not.toBeVisible()

    // Add another filter
    await page.click('.tag-filter-bar text=react')

    // With AND mode, only React link should show
    await expect(page.locator('text=React Documentation')).toBeVisible()
    await expect(page.locator('text=Vue.js')).not.toBeVisible()

    // Switch to OR mode
    await page.click('button:has-text("AND")')
    await page.click('text=Match any tag (OR)')

    // Both JavaScript links should show
    await expect(page.locator('text=React Documentation')).toBeVisible()
    await expect(page.locator('text=Vue.js')).toBeVisible()

    // Clear filters
    await page.click('button:has-text("Clear")')

    // All links should be visible
    await expect(page.locator('text=React Documentation')).toBeVisible()
    await expect(page.locator('text=Vue.js')).toBeVisible()
    await expect(page.locator('text=Python')).toBeVisible()
  })

  test('should manage tags on tag management page', async ({ page }) => {
    await page.goto(`/${testWorkspace.slug}/tags`)

    // Create a new tag
    await page.fill('input[placeholder="Enter tag name..."]', 'new-tag')
    await page.click('button:has-text("Create Tag")')

    await expect(page.locator('text=new-tag')).toBeVisible()

    // Rename a tag
    await page.click('button[aria-label="Rename new-tag"]')
    await page.fill('input[value="new-tag"]', 'renamed-tag')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=renamed-tag')).toBeVisible()
    await expect(page.locator('text=new-tag')).not.toBeVisible()

    // Delete a tag
    await page.click('button[aria-label="Delete renamed-tag"]')
    await page.click('button:has-text("Delete Tag")')

    await expect(page.locator('text=renamed-tag')).not.toBeVisible()
  })

  test('should perform bulk tag operations', async ({ page }) => {
    // Create test links
    const link1 = await createTestLink(testWorkspace.id, {
      url: 'https://link1.com',
      title: 'Link 1',
      tags: [],
    })
    const link2 = await createTestLink(testWorkspace.id, {
      url: 'https://link2.com',
      title: 'Link 2',
      tags: [],
    })

    await page.goto('/dashboard')

    // Select multiple links
    await page.click(`input[data-link-id="${link1.id}"]`)
    await page.click(`input[data-link-id="${link2.id}"]`)

    // Open bulk actions menu
    await page.click('button:has-text("Bulk Actions")')
    await page.click('text=Add Tags')

    // Add tags in bulk
    const bulkTagInput = page.locator('.bulk-tag-dialog input[placeholder*="Add tags"]')
    await bulkTagInput.fill('bulk-tag')
    await bulkTagInput.press('Enter')
    await bulkTagInput.fill('test')
    await bulkTagInput.press('Enter')

    await page.click('button:has-text("Add 2 Tags")')

    // Verify tags were added
    const link1Card = page.locator(`[data-link-id="${link1.id}"]`)
    await expect(link1Card.locator('text=bulk-tag')).toBeVisible()
    await expect(link1Card.locator('text=test')).toBeVisible()

    const link2Card = page.locator(`[data-link-id="${link2.id}"]`)
    await expect(link2Card.locator('text=bulk-tag')).toBeVisible()
    await expect(link2Card.locator('text=test')).toBeVisible()
  })

  test('should autocomplete tags when typing', async ({ page }) => {
    // Pre-create some tags
    await createTestLink(testWorkspace.id, {
      url: 'https://test.com',
      title: 'Test',
      tags: ['javascript', 'typescript', 'java'],
    })

    await page.goto('/links/new')

    // Start typing in tag input
    const tagInput = page.locator('input[placeholder*="Add tags"]')
    await tagInput.click()
    await tagInput.fill('jav')

    // Verify autocomplete suggestions
    await expect(page.locator('text=javascript')).toBeVisible()
    await expect(page.locator('text=java')).toBeVisible()
    await expect(page.locator('text=typescript')).not.toBeVisible()

    // Select from autocomplete
    await page.click('text=javascript')

    // Verify tag was added
    await expect(page.locator('.tag-pill:has-text("javascript")')).toBeVisible()
  })

  test('should merge tags on tag management page', async ({ page }) => {
    // Create links with tags
    await createTestLink(testWorkspace.id, {
      url: 'https://test1.com',
      title: 'Test 1',
      tags: ['frontend', 'web'],
    })
    await createTestLink(testWorkspace.id, {
      url: 'https://test2.com',
      title: 'Test 2',
      tags: ['front-end'],
    })

    await page.goto(`/${testWorkspace.slug}/tags`)

    // Merge front-end into frontend
    const frontEndRow = page.locator('tr:has-text("front-end")')
    await frontEndRow.locator('button[aria-label="Merge"]').click()

    await page.click('button:has-text("frontend")')

    // Verify merge completed
    await expect(page.locator('text=Tags merged successfully')).toBeVisible()
    await expect(page.locator('text=front-end')).not.toBeVisible()

    // Verify usage count increased
    const frontendRow = page.locator('tr:has-text("frontend")')
    await expect(frontendRow.locator('td').nth(1)).toContainText('2')
  })
})