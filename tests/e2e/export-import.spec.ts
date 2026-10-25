import { test, expect } from '@playwright/test';

test.describe('Data Management and Security E2E Tests', () => {
  test('1. Settings page allows exporting data and importing valid backups', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Settings & Data Management/i }),
    ).toBeVisible({ timeout: 20000 });

    // Verify Download JSON and Download CSV buttons are present
    await expect(page.getByRole('button', { name: /Download JSON/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download CSV/i })).toBeVisible();

    // Verify Import section
    const pasteBox = page.getByPlaceholder(/version/i);
    await expect(pasteBox).toBeVisible();

    // Test pasting a valid JSON backup
    const testImportTopic = `Imported Speaking Session ${Date.now()}`;
    const testImportUrl = `https://chatgpt.com/c/import-test-${Date.now()}`;
    const validBackup = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          topic: testImportTopic,
          chatgptUrl: testImportUrl,
          status: 'COMPLETED',
          passCount: 50,
          failCount: 0,
          score: 10.0,
          notes: 'Flawless pronunciation practice',
        },
      ],
    });

    await pasteBox.fill(validBackup);

    // Click Validate & Import Records
    await page.getByRole('button', { name: /Validate & Import Records/i }).click();

    // Confirm dialog appears
    await expect(page.getByRole('heading', { name: /Confirm Data Import/i })).toBeVisible();
    await page.getByRole('button', { name: /Proceed with Import/i }).click();

    // Verify import results summary
    await expect(page.getByText(/Import Results Summary/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Inserted:')).toBeVisible();

    // Navigate to sessions library and verify the imported record exists
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(testImportTopic).first()).toBeVisible({ timeout: 10000 });
  });

  test('2. Settings page rejects malformed import payloads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const pasteBox = page.getByPlaceholder(/version/i);
    await pasteBox.fill('NOT_VALID_JSON_CONTENT{{{');

    await page.getByRole('button', { name: /Validate & Import Records/i }).click();
    await expect(page.getByText(/Invalid JSON format/i)).toBeVisible({ timeout: 5000 });
  });

  test('3. Dialogs are keyboard-accessible with Escape key dismissal', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Open Add Session modal
    const addBtn = page.getByRole('button', { name: /Add Session/i }).first();
    await addBtn.click();
    await expect(page.getByRole('heading', { name: /Add Speaking Session/i })).toBeVisible();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /Add Speaking Session/i })).not.toBeVisible();
  });
});
