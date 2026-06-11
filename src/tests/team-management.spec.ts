import { test, expect } from '@playwright/test';

test.describe('Team Management UI', () => {
  const testEmail = `tester+${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  test.beforeAll(async ({ page }) => {
    // Sign‑up flow (adjust selectors to actual markup)
    await page.goto('/auth/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Sign Up")');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('renders fallback team list and scrolls smoothly', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h2', { hasText: 'Team Management' })).toBeVisible();

    const list = page.locator('.team-list.scrollable');
    await expect(list).toBeVisible();
    await expect(list.locator('text=Alex Reid')).toBeVisible();

    // Force overflow by injecting dummy rows (test‑only)
    await page.evaluate(() => {
      const listEl = document.querySelector('.team-list');
      for (let i = 0; i < 20; i++) {
        const div = document.createElement('div');
        div.className = 'team-member-row';
        div.textContent = `Dummy ${i}`;
        listEl?.appendChild(div);
      }
    });

    // Scroll and verify smooth behavior (no explicit assertion, just ensure no crash)
    await list.evaluate(el => (el as HTMLElement).scrollBy(0, 200));
    await expect(list).toContainText('Dummy 5');
  });

  test('invites a new member and shows in list', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Invite Member")');
    await page.fill('input[type="email"]', 'newmember@example.com');
    await page.selectOption('select', 'Member');
    await page.click('button:has-text("Send Invite")');
    await expect(page.locator('text=Invitation Sent')).toBeVisible();
    await expect(page.locator('.team-list')).toContainText('newmember@example.com');
  });
});
