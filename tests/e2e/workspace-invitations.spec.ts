import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

// Helper to generate unique email
const generateTestEmail = () => `test-${randomBytes(4).toString('hex')}@example.com`;

// Helper to generate unique workspace name
const generateWorkspaceName = () => `Test Workspace ${randomBytes(4).toString('hex')}`;

test.describe('Workspace Invitations Flow', () => {
  let workspaceName: string;
  let inviteeEmail: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique test data
    workspaceName = generateWorkspaceName();
    inviteeEmail = generateTestEmail();
  });

  test('Complete invitation flow - send and accept invitation', async ({ page, context }) => {
    // Step 1: Admin logs in and creates a workspace
    await page.goto('/auth/login');

    // Simulate admin login (using test credentials)
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.click('[data-testid="send-magic-link-button"]');

    // In a real test, we'd mock the auth or use test credentials
    // For now, we'll simulate being logged in
    await page.goto('/dashboard');

    // Create a new workspace
    await page.click('[data-testid="create-workspace-button"]');
    await page.fill('[data-testid="workspace-name-input"]', workspaceName);
    await page.click('[data-testid="create-workspace-submit"]');

    // Wait for workspace to be created
    await expect(page.locator(`text="${workspaceName}"`)).toBeVisible();

    // Step 2: Navigate to workspace settings
    await page.click('[data-testid="workspace-settings-link"]');

    // Step 3: Open invitation modal
    await page.click('[data-testid="invite-members-button"]');

    // Step 4: Fill in invitation details
    await page.fill('[data-testid="invite-emails-textarea"]', inviteeEmail);
    await page.selectOption('[data-testid="invite-role-select"]', 'member');

    // Step 5: Send invitation
    await page.click('[data-testid="send-invitations-button"]');

    // Verify success message
    await expect(page.locator('text=Invitations sent')).toBeVisible();

    // Step 6: Check pending invitations list
    await expect(page.locator(`[data-testid="pending-invitation-${inviteeEmail}"]`)).toBeVisible();

    // Step 7: Simulate accepting invitation (new user flow)
    // In a real scenario, we'd extract the invitation token from the email
    // For testing, we'll navigate directly to the acceptance page
    const invitationToken = 'test-token'; // In real tests, extract from email or database

    // Open new incognito context for the invitee
    const inviteeContext = await context.browser()?.newContext();
    if (!inviteeContext) throw new Error('Could not create new context');

    const inviteePage = await inviteeContext.newPage();
    await inviteePage.goto(`/invite/${invitationToken}`);

    // Step 8: Sign up as new user
    await inviteePage.click('[data-testid="sign-in-to-accept-button"]');
    await inviteePage.fill('[data-testid="email-input"]', inviteeEmail);
    await inviteePage.click('[data-testid="send-magic-link-button"]');

    // Simulate email verification completed
    // In real tests, we'd mock this or use test auth flow
    await inviteePage.goto(`/invite/${invitationToken}`);

    // Step 9: Verify invitation accepted
    await expect(inviteePage.locator('text=Invitation Accepted!')).toBeVisible();
    await expect(inviteePage.locator(`text=${workspaceName}`)).toBeVisible();

    // Step 10: Verify redirect to workspace
    await inviteePage.waitForURL(/\/dashboard\/.*/);

    // Clean up
    await inviteeContext.close();
  });

  test('Admin can revoke pending invitation', async ({ page }) => {
    // Setup: Login and navigate to workspace with pending invitations
    await page.goto('/dashboard/test-workspace/settings');

    // Find a pending invitation
    const pendingInvitation = page.locator('[data-testid^="pending-invitation-"]').first();
    await expect(pendingInvitation).toBeVisible();

    // Click revoke button
    await pendingInvitation.locator('[data-testid="revoke-invitation-button"]').click();

    // Confirm revocation
    await page.click('[data-testid="confirm-revoke-button"]');

    // Verify invitation is removed from list
    await expect(pendingInvitation).not.toBeVisible();
  });

  test('Member cannot send invitations', async ({ page }) => {
    // Login as a regular member (not admin/owner)
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'member@test.com');
    await page.click('[data-testid="send-magic-link-button"]');

    // Navigate to workspace
    await page.goto('/dashboard/test-workspace');

    // Try to access settings
    await page.goto('/dashboard/test-workspace/settings');

    // Verify invite button is not visible or disabled
    const inviteButton = page.locator('[data-testid="invite-members-button"]');

    // Button should either not exist or be disabled
    const buttonExists = await inviteButton.count() > 0;
    if (buttonExists) {
      await expect(inviteButton).toBeDisabled();
    }
  });

  test('Cannot accept expired invitation', async ({ page }) => {
    // Navigate to an expired invitation link
    const expiredToken = 'expired-token-test';
    await page.goto(`/invite/${expiredToken}`);

    // Should show error message
    await expect(page.locator('text=This invitation has expired')).toBeVisible();
  });

  test('Cannot accept revoked invitation', async ({ page }) => {
    // Navigate to a revoked invitation link
    const revokedToken = 'revoked-token-test';
    await page.goto(`/invite/${revokedToken}`);

    // Should show error message
    await expect(page.locator('text=This invitation has been revoked')).toBeVisible();
  });

  test('Workspace member limit prevents new invitations', async ({ page }) => {
    // Setup: Login as admin of workspace at member limit
    await page.goto('/dashboard/full-workspace/settings');

    // Try to open invite modal
    await page.click('[data-testid="invite-members-button"]');

    // Should see member limit message
    await expect(page.locator('text=Your workspace has reached its member limit')).toBeVisible();

    // Send button should be disabled
    await expect(page.locator('[data-testid="send-invitations-button"]')).toBeDisabled();
  });

  test('Admin can remove team member', async ({ page }) => {
    // Navigate to workspace settings
    await page.goto('/dashboard/test-workspace/settings');

    // Find a team member (not owner)
    const memberRow = page.locator('[data-testid^="team-member-"]')
      .filter({ hasText: 'Member' })
      .first();

    await expect(memberRow).toBeVisible();

    // Click remove button
    await memberRow.locator('[data-testid="remove-member-button"]').click();

    // Confirm removal
    await page.click('[data-testid="confirm-remove-button"]');

    // Verify member is removed
    await expect(memberRow).not.toBeVisible();
  });

  test('Cannot remove workspace owner', async ({ page }) => {
    // Navigate to workspace settings
    await page.goto('/dashboard/test-workspace/settings');

    // Find the owner row
    const ownerRow = page.locator('[data-testid^="team-member-"]')
      .filter({ hasText: 'Owner' })
      .first();

    await expect(ownerRow).toBeVisible();

    // Remove button should not exist for owner
    await expect(ownerRow.locator('[data-testid="remove-member-button"]')).not.toBeVisible();
  });

  test('Rate limiting prevents invitation spam', async ({ page }) => {
    // Setup: Login as admin
    await page.goto('/dashboard/test-workspace/settings');

    // Send multiple invitation batches quickly
    for (let i = 0; i < 21; i++) { // Exceed the 20 per hour limit
      await page.click('[data-testid="invite-members-button"]');
      await page.fill('[data-testid="invite-emails-textarea"]', `test${i}@example.com`);
      await page.click('[data-testid="send-invitations-button"]');

      // Close modal after each send
      await page.keyboard.press('Escape');

      // On the 21st attempt, should see rate limit error
      if (i === 20) {
        await expect(page.locator('text=Too many invitation requests')).toBeVisible();
      }
    }
  });
});

test.describe('Invitation Email Validation', () => {
  test('Invalid email addresses are rejected', async ({ page }) => {
    await page.goto('/dashboard/test-workspace/settings');
    await page.click('[data-testid="invite-members-button"]');

    // Try various invalid emails
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
      'double@@domain.com'
    ];

    for (const email of invalidEmails) {
      await page.fill('[data-testid="invite-emails-textarea"]', email);

      // Should show validation error or button should be disabled
      const sendButton = page.locator('[data-testid="send-invitations-button"]');
      const errorMessage = page.locator('[data-testid="email-validation-error"]');

      const hasError = await errorMessage.count() > 0;
      const isDisabled = await sendButton.isDisabled();

      expect(hasError || isDisabled).toBeTruthy();

      // Clear for next test
      await page.fill('[data-testid="invite-emails-textarea"]', '');
    }
  });

  test('Duplicate emails in single batch are filtered', async ({ page }) => {
    await page.goto('/dashboard/test-workspace/settings');
    await page.click('[data-testid="invite-members-button"]');

    // Enter duplicate emails
    const duplicateEmails = 'test@example.com, test@example.com, test@example.com';
    await page.fill('[data-testid="invite-emails-textarea"]', duplicateEmails);

    // Should show only one email badge
    const emailBadges = page.locator('[data-testid^="email-badge-"]');
    await expect(emailBadges).toHaveCount(1);
  });
});

test.describe('Invitation Accessibility', () => {
  test('Invitation flow is keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard/test-workspace/settings');

    // Navigate to invite button using Tab
    await page.keyboard.press('Tab');
    // Continue tabbing until invite button is focused
    const inviteButton = page.locator('[data-testid="invite-members-button"]');
    await inviteButton.focus();

    // Open modal with Enter
    await page.keyboard.press('Enter');

    // Tab to email field
    await page.keyboard.press('Tab');
    await page.keyboard.type('accessible@test.com');

    // Tab to role select
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown'); // Select member role

    // Tab to send button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip cancel button
    await page.keyboard.press('Enter'); // Send invitation

    // Verify invitation sent
    await expect(page.locator('text=Invitations sent')).toBeVisible();
  });

  test('Screen reader announcements for invitation status', async ({ page }) => {
    await page.goto('/dashboard/test-workspace/settings');

    // Check for ARIA labels and roles
    const inviteButton = page.locator('[data-testid="invite-members-button"]');
    await expect(inviteButton).toHaveAttribute('aria-label', /invite.*members/i);

    await inviteButton.click();

    // Modal should have proper ARIA attributes
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-labelledby', /invite.*members/i);

    // Form fields should have labels
    const emailField = page.locator('[data-testid="invite-emails-textarea"]');
    await expect(emailField).toHaveAttribute('aria-label', /email.*addresses/i);
  });
});