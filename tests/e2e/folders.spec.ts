import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Folder Organization System E2E', () => {
  const testWorkspaceId = uuidv4();
  const testUserId = uuidv4();

  test.beforeEach(async ({ page }) => {
    // Mock authentication and workspace context
    await page.goto('/dashboard');
    await page.evaluate((workspaceId) => {
      localStorage.setItem('workspace_id', workspaceId);
    }, testWorkspaceId);
  });

  test('should create a new folder', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard/links');

    // Open create folder dialog
    await page.click('[data-testid="create-folder-btn"]');

    // Fill in folder details
    await page.fill('[data-testid="folder-name-input"]', 'Marketing Materials');
    await page.fill('[data-testid="folder-description-input"]', 'Folder for marketing campaign links');

    // Submit form
    await page.click('[data-testid="create-folder-submit"]');

    // Verify folder appears in sidebar
    await expect(page.locator('[data-testid="folder-tree"]')).toContainText('Marketing Materials');
  });

  test('should create nested folders up to 3 levels', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create parent folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Parent Folder');
    await page.click('[data-testid="create-folder-submit"]');

    // Create child folder (level 2)
    await page.click('[data-testid="folder-tree"] >> text=Parent Folder');
    await page.click('[data-testid="create-subfolder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Child Folder');
    await page.click('[data-testid="create-folder-submit"]');

    // Create grandchild folder (level 3)
    await page.click('[data-testid="folder-tree"] >> text=Child Folder');
    await page.click('[data-testid="create-subfolder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Grandchild Folder');
    await page.click('[data-testid="create-folder-submit"]');

    // Verify all folders are visible
    await expect(page.locator('[data-testid="folder-tree"]')).toContainText('Parent Folder');
    await expect(page.locator('[data-testid="folder-tree"]')).toContainText('Child Folder');
    await expect(page.locator('[data-testid="folder-tree"]')).toContainText('Grandchild Folder');

    // Attempt to create 4th level folder (should fail)
    await page.click('[data-testid="folder-tree"] >> text=Grandchild Folder');
    const createButton = page.locator('[data-testid="create-subfolder-btn"]');
    await expect(createButton).toBeDisabled();
  });

  test('should drag and drop link into folder', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create a folder first
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Target Folder');
    await page.click('[data-testid="create-folder-submit"]');

    // Wait for folder to appear
    await page.waitForSelector('[data-testid="folder-tree"] >> text=Target Folder');

    // Drag a link to the folder
    const link = page.locator('[data-testid="link-card"]:first-child');
    const folder = page.locator('[data-testid="folder-tree"] >> text=Target Folder');

    await link.dragTo(folder);

    // Click on folder to view its contents
    await folder.click();

    // Verify link is in the folder
    await expect(page.locator('[data-testid="folder-breadcrumb"]')).toContainText('Target Folder');
    await expect(page.locator('[data-testid="link-card"]')).toBeVisible();
  });

  test('should bulk move multiple links to folder', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create a folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Bulk Target');
    await page.click('[data-testid="create-folder-submit"]');

    // Select multiple links
    await page.click('[data-testid="link-checkbox-0"]');
    await page.click('[data-testid="link-checkbox-1"]');
    await page.click('[data-testid="link-checkbox-2"]');

    // Open bulk actions menu
    await page.click('[data-testid="bulk-actions-btn"]');
    await page.click('[data-testid="bulk-move-to-folder"]');

    // Select target folder
    await page.click('[data-testid="folder-select"] >> text=Bulk Target');
    await page.click('[data-testid="confirm-bulk-move"]');

    // Navigate to folder
    await page.click('[data-testid="folder-tree"] >> text=Bulk Target');

    // Verify all 3 links are in the folder
    const linkCount = await page.locator('[data-testid="link-card"]').count();
    expect(linkCount).toBeGreaterThanOrEqual(3);
  });

  test('should edit folder name and description', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create a folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Original Name');
    await page.fill('[data-testid="folder-description-input"]', 'Original Description');
    await page.click('[data-testid="create-folder-submit"]');

    // Right-click on folder for context menu
    await page.click('[data-testid="folder-tree"] >> text=Original Name', { button: 'right' });
    await page.click('[data-testid="edit-folder-menu-item"]');

    // Edit folder details
    await page.fill('[data-testid="folder-name-input"]', 'Updated Name');
    await page.fill('[data-testid="folder-description-input"]', 'Updated Description');
    await page.click('[data-testid="save-folder-changes"]');

    // Verify changes
    await expect(page.locator('[data-testid="folder-tree"]')).toContainText('Updated Name');
    await expect(page.locator('[data-testid="folder-tree"]')).not.toContainText('Original Name');
  });

  test('should delete folder with cascade option', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create parent and child folders
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'To Delete');
    await page.click('[data-testid="create-folder-submit"]');

    // Add some links to the folder (assuming they exist)
    // ... drag and drop operations ...

    // Delete folder
    await page.click('[data-testid="folder-tree"] >> text=To Delete', { button: 'right' });
    await page.click('[data-testid="delete-folder-menu-item"]');

    // Check cascade option
    await page.check('[data-testid="cascade-delete-checkbox"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');

    // Verify folder is deleted
    await expect(page.locator('[data-testid="folder-tree"]')).not.toContainText('To Delete');
  });

  test('should delete folder and preserve links', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Temporary Folder');
    await page.click('[data-testid="create-folder-submit"]');

    // Add a link to folder (drag and drop)
    const link = page.locator('[data-testid="link-card"]:first-child');
    const folder = page.locator('[data-testid="folder-tree"] >> text=Temporary Folder');
    await link.dragTo(folder);

    // Delete folder without cascade
    await page.click('[data-testid="folder-tree"] >> text=Temporary Folder', { button: 'right' });
    await page.click('[data-testid="delete-folder-menu-item"]');

    // Don't check cascade option
    await expect(page.locator('[data-testid="cascade-delete-checkbox"]')).not.toBeChecked();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');

    // Verify folder is deleted
    await expect(page.locator('[data-testid="folder-tree"]')).not.toContainText('Temporary Folder');

    // Verify link still exists in uncategorized
    await page.click('[data-testid="uncategorized-links"]');
    await expect(page.locator('[data-testid="link-card"]')).toBeVisible();
  });

  test('should navigate folder hierarchy with breadcrumbs', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create nested folders
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Level 1');
    await page.click('[data-testid="create-folder-submit"]');

    await page.click('[data-testid="folder-tree"] >> text=Level 1');
    await page.click('[data-testid="create-subfolder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Level 2');
    await page.click('[data-testid="create-folder-submit"]');

    await page.click('[data-testid="folder-tree"] >> text=Level 2');
    await page.click('[data-testid="create-subfolder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Level 3');
    await page.click('[data-testid="create-folder-submit"]');

    // Navigate to deepest level
    await page.click('[data-testid="folder-tree"] >> text=Level 3');

    // Verify breadcrumb shows full path
    await expect(page.locator('[data-testid="folder-breadcrumb"]')).toContainText('Level 1');
    await expect(page.locator('[data-testid="folder-breadcrumb"]')).toContainText('Level 2');
    await expect(page.locator('[data-testid="folder-breadcrumb"]')).toContainText('Level 3');

    // Click breadcrumb to navigate back
    await page.click('[data-testid="folder-breadcrumb"] >> text=Level 1');

    // Verify we're at Level 1
    await expect(page.locator('[data-testid="folder-breadcrumb"]')).toContainText('Level 1');
    await expect(page.locator('[data-testid="folder-breadcrumb"]')).not.toContainText('Level 2');
  });

  test('should show link counts per folder', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Counting Folder');
    await page.click('[data-testid="create-folder-submit"]');

    // Initially should show 0 links
    await expect(page.locator('[data-testid="folder-tree"] >> text=Counting Folder')).toContainText('0');

    // Add links to folder
    for (let i = 0; i < 3; i++) {
      const link = page.locator(`[data-testid="link-card"]:nth-child(${i + 1})`);
      const folder = page.locator('[data-testid="folder-tree"] >> text=Counting Folder');
      await link.dragTo(folder);
    }

    // Should now show 3 links
    await expect(page.locator('[data-testid="folder-tree"] >> text=Counting Folder')).toContainText('3');
  });

  test('should filter links by selected folder', async ({ page }) => {
    await page.goto('/dashboard/links');

    // Create two folders
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Folder A');
    await page.click('[data-testid="create-folder-submit"]');

    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', 'Folder B');
    await page.click('[data-testid="create-folder-submit"]');

    // Move some links to Folder A
    const linkA = page.locator('[data-testid="link-card"]:first-child');
    const folderA = page.locator('[data-testid="folder-tree"] >> text=Folder A');
    await linkA.dragTo(folderA);

    // Click on Folder A
    await folderA.click();

    // Verify only Folder A links are shown
    await expect(page.locator('[data-testid="current-folder-name"]')).toContainText('Folder A');

    // Click on "All Links"
    await page.click('[data-testid="all-links-filter"]');

    // Verify all links are shown
    await expect(page.locator('[data-testid="current-folder-name"]')).toContainText('All Links');
  });
});