import { test, expect, type Page } from '@playwright/test';

// Test user credentials
const OWNER_USER = {
  email: 'owner@test.com',
  password: 'Test123!@#',
  role: 'owner',
};

const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'Test123!@#',
  role: 'admin',
};

const MEMBER_USER = {
  email: 'member@test.com',
  password: 'Test123!@#',
  role: 'member',
};

// Helper function to sign in a user
async function signIn(page: Page, user: typeof OWNER_USER) {
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

// Helper function to create a test link
async function createLink(page: Page, slug: string) {
  await page.goto('/links/new');
  await page.fill('input[id="url"]', 'https://example.com');
  await page.fill('input[id="slug"]', slug);
  await page.click('button:has-text("Create Link")');
  await page.waitForSelector('text=Link Created Successfully');
}

test.describe('Permission System E2E Tests', () => {
  test.describe('Owner Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page, OWNER_USER);
    });

    test('owner can access all navigation items', async ({ page }) => {
      // Check main navigation
      await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('a:has-text("Links")')).toBeVisible();
      await expect(page.locator('a:has-text("Analytics")')).toBeVisible();
      await expect(page.locator('a:has-text("Settings")')).toBeVisible();

      // Open user dropdown
      await page.click('button[aria-label="User menu"]');
      await expect(page.locator('text=Workspace Admin')).toBeVisible();
    });

    test('owner can manage workspace settings', async ({ page }) => {
      await page.goto('/settings/workspace');

      // Check all sections are visible
      await expect(page.locator('text=General')).toBeVisible();
      await expect(page.locator('text=Team Management')).toBeVisible();
      await expect(page.locator('text=Danger Zone')).toBeVisible();

      // Check owner can update workspace name
      await page.fill('input[name="name"]', 'Updated Workspace Name');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('text=Workspace updated successfully')).toBeVisible();
    });

    test('owner can manage team members', async ({ page }) => {
      await page.goto('/settings/workspace');

      // Check invite button is visible
      await expect(page.locator('button:has-text("Invite Members")')).toBeVisible();

      // Check member management actions
      const memberRow = page.locator('tr').filter({ hasText: ADMIN_USER.email });
      await memberRow.locator('button[aria-label="Member actions"]').click();

      await expect(page.locator('text=Change to Member')).toBeVisible();
      await expect(page.locator('text=Remove from Workspace')).toBeVisible();
    });

    test('owner can delete workspace', async ({ page }) => {
      await page.goto('/settings/workspace');

      // Scroll to danger zone
      await page.locator('text=Danger Zone').scrollIntoViewIfNeeded();

      // Check delete button is visible
      await expect(page.locator('button:has-text("Delete Workspace")')).toBeVisible();
    });

    test('owner can edit and delete any link', async ({ page }) => {
      await page.goto('/links');

      // Find a link created by another user
      const linkRow = page.locator('tr').first();
      await linkRow.locator('button[aria-label="Link actions"]').click();

      await expect(page.locator('text=Edit')).toBeVisible();
      await expect(page.locator('text=Delete')).toBeVisible();
    });
  });

  test.describe('Admin Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page, ADMIN_USER);
    });

    test('admin can access settings', async ({ page }) => {
      await expect(page.locator('a:has-text("Settings")')).toBeVisible();

      // Open user dropdown
      await page.click('button[aria-label="User menu"]');
      await expect(page.locator('text=Workspace Admin')).toBeVisible();
    });

    test('admin can update workspace settings', async ({ page }) => {
      await page.goto('/settings/workspace');

      // Check admin can update workspace name
      await page.fill('input[name="name"]', 'Admin Updated Name');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('text=Workspace updated successfully')).toBeVisible();
    });

    test('admin cannot delete workspace', async ({ page }) => {
      await page.goto('/settings/workspace');

      // Danger zone should not be visible for admin
      await expect(page.locator('text=Danger Zone')).not.toBeVisible();
    });

    test('admin can remove members but not change roles', async ({ page }) => {
      await page.goto('/settings/workspace');

      // Find a member (not owner or admin)
      const memberRow = page.locator('tr').filter({ hasText: MEMBER_USER.email });
      await memberRow.locator('button[aria-label="Member actions"]').click();

      await expect(page.locator('text=Remove from Workspace')).toBeVisible();
      await expect(page.locator('text=Promote to Admin')).not.toBeVisible();
    });

    test('admin can edit and delete any link', async ({ page }) => {
      // Create a link as admin
      await createLink(page, 'admin-link');

      await page.goto('/links');

      // Find the link
      const linkRow = page.locator('tr').filter({ hasText: 'admin-link' });
      await linkRow.locator('button[aria-label="Link actions"]').click();

      await expect(page.locator('text=Edit')).toBeVisible();
      await expect(page.locator('text=Delete')).toBeVisible();
    });

    test('admin can use command palette admin features', async ({ page }) => {
      // Open command palette
      await page.keyboard.press('Control+k');

      // Search for admin features
      await page.fill('input[placeholder="Type a command or search..."]', 'workspace');

      await expect(page.locator('text=Workspace Settings')).toBeVisible();
      await expect(page.locator('text=Team Members')).toBeVisible();
    });
  });

  test.describe('Member Permissions', () => {
    let memberLinkSlug: string;

    test.beforeEach(async ({ page }) => {
      await signIn(page, MEMBER_USER);
      memberLinkSlug = `member-link-${Date.now()}`;
    });

    test('member cannot access settings navigation', async ({ page }) => {
      // Settings link should not be visible in main nav
      await expect(page.locator('nav a:has-text("Settings")')).not.toBeVisible();

      // Open user dropdown
      await page.click('button[aria-label="User menu"]');
      await expect(page.locator('text=Workspace Admin')).not.toBeVisible();
    });

    test('member can create links', async ({ page }) => {
      await createLink(page, memberLinkSlug);

      // Verify link was created
      await page.goto('/links');
      await expect(page.locator(`text=/${memberLinkSlug}`)).toBeVisible();
    });

    test('member can only edit own links', async ({ page }) => {
      // Create a link as member
      await createLink(page, memberLinkSlug);

      await page.goto('/links');

      // Check own link - should have edit/delete
      const ownLinkRow = page.locator('tr').filter({ hasText: memberLinkSlug });
      await ownLinkRow.locator('button[aria-label="Link actions"]').click();
      await expect(page.locator('text=Edit')).toBeVisible();
      await expect(page.locator('text=Delete')).toBeVisible();

      // Close dropdown
      await page.keyboard.press('Escape');

      // Check another user's link - should not have edit/delete
      const otherLinkRow = page.locator('tr').filter({ hasText: 'admin-link' });
      if (await otherLinkRow.count() > 0) {
        await otherLinkRow.locator('button[aria-label="Link actions"]').click();
        await expect(page.locator('text=Edit')).not.toBeVisible();
        await expect(page.locator('text=Delete')).not.toBeVisible();
      }
    });

    test('member cannot access workspace settings', async ({ page }) => {
      // Attempt to navigate directly to workspace settings
      await page.goto('/settings/workspace');

      // Should be redirected or show permission error
      await expect(page.locator('text=You do not have permission')).toBeVisible();
    });

    test('member cannot see admin commands in command palette', async ({ page }) => {
      // Open command palette
      await page.keyboard.press('Control+k');

      // Search for admin features
      await page.fill('input[placeholder="Type a command or search..."]', 'workspace');

      // Admin commands should not be visible
      await expect(page.locator('text=Workspace Settings')).not.toBeVisible();
      await expect(page.locator('text=Team Members')).not.toBeVisible();
      await expect(page.locator('text=API Keys')).not.toBeVisible();

      // But general commands should be visible
      await page.fill('input[placeholder="Type a command or search..."]', 'create');
      await expect(page.locator('text=Create New Link')).toBeVisible();
    });

    test('member sees permission error when trying to edit others links', async ({ page }) => {
      await page.goto('/links');

      // Find a link not created by member (assuming there are other links)
      const otherLinks = page.locator('tr').filter({ hasNot: page.locator(`text=/${memberLinkSlug}`) });

      if (await otherLinks.count() > 0) {
        const firstOtherLink = otherLinks.first();
        const linkId = await firstOtherLink.getAttribute('data-link-id');

        if (linkId) {
          // Try to navigate directly to edit page
          await page.goto(`/links/${linkId}/edit`);

          // Should see permission error
          await expect(page.locator('text=You don\'t have permission to edit this link')).toBeVisible();
        }
      }
    });
  });

  test.describe('Permission Transitions', () => {
    test('member promoted to admin gains admin permissions', async ({ page }) => {
      // Sign in as owner to promote member
      await signIn(page, OWNER_USER);
      await page.goto('/settings/workspace');

      // Find member and promote to admin
      const memberRow = page.locator('tr').filter({ hasText: MEMBER_USER.email });
      await memberRow.locator('button[aria-label="Member actions"]').click();
      await page.click('text=Promote to Admin');
      await page.click('button:has-text("Change Role")');

      // Sign out and sign back in as the promoted member
      await page.click('button[aria-label="User menu"]');
      await page.click('text=Sign Out');
      await signIn(page, MEMBER_USER);

      // Check that Settings navigation is now visible
      await expect(page.locator('a:has-text("Settings")')).toBeVisible();

      // Check can access workspace settings
      await page.goto('/settings/workspace');
      await expect(page.locator('text=General')).toBeVisible();
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    });

    test('admin demoted to member loses admin permissions', async ({ page }) => {
      // Sign in as owner to demote admin
      await signIn(page, OWNER_USER);
      await page.goto('/settings/workspace');

      // Find admin and demote to member
      const adminRow = page.locator('tr').filter({ hasText: ADMIN_USER.email });
      await adminRow.locator('button[aria-label="Member actions"]').click();
      await page.click('text=Change to Member');
      await page.click('button:has-text("Change Role")');

      // Sign out and sign back in as the demoted admin
      await page.click('button[aria-label="User menu"]');
      await page.click('text=Sign Out');
      await signIn(page, ADMIN_USER);

      // Check that Settings navigation is no longer visible
      await expect(page.locator('nav a:has-text("Settings")')).not.toBeVisible();

      // Try to access workspace settings directly
      await page.goto('/settings/workspace');
      await expect(page.locator('text=You do not have permission')).toBeVisible();
    });
  });

  test.describe('Bulk Operations Permissions', () => {
    test('owner can perform bulk operations', async ({ page }) => {
      await signIn(page, OWNER_USER);
      await page.goto('/links');

      // Select multiple links
      await page.click('input[type="checkbox"][aria-label="Select all"]');

      // Bulk actions should be visible
      await expect(page.locator('button:has-text("Delete Selected")')).toBeVisible();
    });

    test('admin can perform bulk operations', async ({ page }) => {
      await signIn(page, ADMIN_USER);
      await page.goto('/links');

      // Select multiple links
      await page.click('input[type="checkbox"][aria-label="Select all"]');

      // Bulk actions should be visible
      await expect(page.locator('button:has-text("Delete Selected")')).toBeVisible();
    });

    test('member cannot perform bulk operations', async ({ page }) => {
      await signIn(page, MEMBER_USER);
      await page.goto('/links');

      // Bulk selection checkboxes should not be visible for member
      await expect(page.locator('input[type="checkbox"][aria-label="Select all"]')).not.toBeVisible();
    });
  });
});