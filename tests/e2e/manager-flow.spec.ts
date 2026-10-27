import { test, expect } from '@playwright/test';

test.describe('English Speaking Practice Manager E2E Workflows', () => {
  test.beforeEach(async ({ context }) => {
    // Grant clipboard permissions for copy operations
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  });

  test('1. Dashboard loads with dark mode theme and core actions', async ({ page }) => {
    await page.goto('/');

    // Check dark mode background #212121
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(33, 33, 33)');

    // Verify main heading
    await expect(
      page.getByRole('heading', { name: /Speaking Practice Dashboard/i }),
    ).toBeVisible({ timeout: 20000 });

    // Verify prompt copy and ChatGPT actions
    await expect(page.getByRole('button', { name: /Copy Prompt/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open ChatGPT/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Add (Session|Topic)/i })).toBeVisible();
  });

  test('2. Coach Prompt page displays full original prompt and allows copying', async ({ page }) => {
    await page.goto('/coach-prompt');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /English Speaking Coach Prompt/i }),
    ).toBeVisible({ timeout: 20000 });

    // Check presence of key parameters inside prompt viewer
    await expect(page.getByText('5 minutes').first()).toBeVisible();
    await expect(page.getByText('Echo Mode').first()).toBeVisible();
    await expect(
      page.getByText('Score = 10 × PassCount / (PassCount + FailCount)').first(),
    ).toBeVisible();

    // Verify Copy Prompt button
    const copyBtn = page.getByRole('button', { name: /Copy Prompt/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText(/Copied!/i)).toBeVisible({ timeout: 5000 });
  });

  test('3. Add new session, verify persistence, record score, and delete', async ({ page }) => {
    const testTopic = `Public Speaking Mastery ${Date.now()}`;
    const testUrl = `https://chatgpt.com/c/test-${Date.now()}`;

    // 1. Open Topics Library
    await page.goto('/sessions');
    await expect(
      page.getByRole('heading', { name: /(Sessions|Topics)/i }).first(),
    ).toBeVisible({ timeout: 20000 });

    // Wait for initial sessions fetch to settle
    await page.waitForLoadState('networkidle');

    // 2. Click Add Topic/Session
    const addBtn = page.getByRole('button', { name: /Add (Session|Topic)/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await expect(
      page.getByRole('heading', { name: /Add Speaking (Session|Topic)/i }),
    ).toBeVisible({ timeout: 5000 });

    // 3. Fill form
    await page.getByLabel(/^Topic/i).fill(testTopic);
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(testUrl);
    await page.getByRole('button', { name: /Create (Session|Topic)/i }).click();

    // 4. Verify session appears in library
    await expect(page.getByText(testTopic).first()).toBeVisible({ timeout: 10000 });

    // 5. Test persistence: Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(testTopic).first()).toBeVisible({ timeout: 10000 });

    // 6. Test duplicate prevention
    await page.getByRole('button', { name: /Add (Session|Topic)/i }).first().click();
    await page.getByLabel(/^Topic/i).fill('Duplicate Attempt');
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(testUrl);
    await page.getByRole('button', { name: /Create (Session|Topic)/i }).click();
    // Expect error toast
    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 5000 });
    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).click();

    // 7. Search filter
    const searchInput = page.getByPlaceholder(/Search by topic/i);
    await searchInput.fill(testTopic);
    await expect(page.getByText(testTopic).first()).toBeVisible();

    // 8. Record Results
    const recordBtn = page.locator(`button[title*="Record"]`).first();
    if (await recordBtn.isVisible()) {
      await recordBtn.click();
      await expect(
        page.getByRole('heading', { name: /Record Practice (Results|Score)/i }),
      ).toBeVisible();

      // Enter Score: 8.0
      await page.locator('#score').fill('8.0');

      // Verify preview score is 8.0 / 10
      await expect(page.getByText('8.0 / 10').first()).toBeVisible();

      await page.getByRole('button', { name: /Save Results/i }).click();
      await expect(page.getByText(/Recorded practice results/i).first()).toBeVisible({
        timeout: 5000,
      });
    }

    // 9. Delete session with Confirmation Dialog
    const deleteBtn = page.locator(`button[title="Delete session"]`).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(
        page.getByRole('heading', { name: /Delete (Session|Topic)/i }),
      ).toBeVisible();

      // Test cancel first
      await page.getByRole('button', { name: /Cancel/i }).click();
      await expect(page.getByText(testTopic).first()).toBeVisible();

      // Now confirm delete
      await deleteBtn.click();
      await page.getByRole('button', { name: /Delete (Session|Topic)/i }).last().click();
      await expect(page.getByText(/Deleted/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('4. Mobile responsive layout and drawer navigation at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Mobile header should be visible
    const toggleBtn = page.getByLabel(/Toggle navigation drawer/i);
    await expect(toggleBtn).toBeVisible({ timeout: 20000 });

    // Open drawer
    await toggleBtn.click();
    await expect(page.getByRole('link', { name: /Coach Prompt/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /(Sessions|Topics)/i }).first()).toBeVisible();
  });

  test('5. Multi-attempt practice tracking and score progression for ChatGPT link', async ({ page }) => {
    const testTopic = `Multi Attempt Topic ${Date.now()}`;
    const testUrl = `https://chatgpt.com/c/multi-attempt-${Date.now()}`;

    // 1. Create a session
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Add (Session|Topic)/i }).first().click();
    await page.getByLabel(/^Topic/i).fill(testTopic);
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(testUrl);
    await page.getByRole('button', { name: /Create (Session|Topic)/i }).click();

    // 2. Open session details
    const sessionLink = page.getByRole('link', { name: testTopic }).first();
    await expect(sessionLink).toBeVisible({ timeout: 10000 });
    await sessionLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: testTopic })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Practice History & Scores')).toBeVisible();

    // 3. Log Attempt #1 (Score: 8.0/10)
    await page.getByRole('button', { name: /Record First Practice Attempt|Log Practice Attempt|Record Results/i }).first().click();
    await page.locator('#score').fill('8.0');
    await page.getByRole('button', { name: /Save Results/i }).click();
    await expect(page.getByText(/Recorded practice results/i)).toBeVisible({ timeout: 5000 });

    // Verify Attempt #1 appears
    await expect(page.getByText(/Attempt #1/i).first()).toBeVisible();
    await expect(page.getByText('8.0/10').first()).toBeVisible();

    // 4. Log Attempt #2 with an additional ChatGPT URL (Score: 9.0/10)
    const secondUrl = `https://chatgpt.com/c/second-${Date.now()}`;
    await page.getByRole('button', { name: /Log Practice Attempt/i }).click();
    await page.locator('#score').fill('9.0');
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(secondUrl);
    await page.getByRole('button', { name: /Save Results/i }).click();
    await expect(page.getByText(/Recorded practice results/i)).toBeVisible({ timeout: 5000 });

    // Verify 2 attempts, Progression shows +1.0, and Latest Score is 9.0/10
    await expect(page.getByText(/2 practice attempts/i).first()).toBeVisible();
    await expect(page.getByText(/Attempt #2/i).first()).toBeVisible();
    await expect(page.getByText('+1.0')).toBeVisible();

    // Verify ChatGPT link is displayed in the topic links
    await expect(page.getByText(/ChatGPT Links Grouped for this Topic/i)).toBeVisible();
    await expect(page.getByText(/Link #/i).first()).toBeVisible();
    await expect(page.getByText(secondUrl).first()).toBeVisible();

    // 5. Delete Attempt #2 and verify fallback to Attempt #1 (8.0/10)
    const deleteAttemptBtn = page.locator('button[title="Delete this practice attempt"]').first();
    await deleteAttemptBtn.click();
    await expect(page.getByRole('heading', { name: /Delete Practice Attempt/i })).toBeVisible();
    await page.getByRole('button', { name: /Delete Attempt/i }).click();
    await expect(page.getByText(/Practice attempt deleted/i)).toBeVisible({ timeout: 5000 });

    // Score should adjust back to 8.0/10
    await expect(page.getByText('8.0/10').first()).toBeVisible();

    // 6. Test grouping ChatGPT links by topic: add link to topic and practice with it
    const directTopicLink = `https://chatgpt.com/c/topic-grouped-link-${Date.now()}`;
    await page.getByRole('button', { name: /Add ChatGPT Link/i }).click();
    await expect(page.getByRole('heading', { name: /Add ChatGPT Link to Topic/i })).toBeVisible();
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(directTopicLink);
    await page.getByRole('button', { name: /Add Link to Topic/i }).click();
    await expect(page.getByText(/ChatGPT conversation link added/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(directTopicLink).first()).toBeVisible();

    // Click "Practice" on that link
    const practiceHereBtn = page.locator('button:has-text("Practice")').last();
    await practiceHereBtn.click();
    await expect(page.getByRole('heading', { name: /Record Practice (Results|Score)/i })).toBeVisible();
    await page.locator('#score').fill('9.6');
    await page.getByRole('button', { name: /Save Results/i }).click();
    await expect(page.getByText(/Recorded practice results/i).first()).toBeVisible({ timeout: 5000 });

    // Verify Attempt with corresponding link and 9.6/10 score
    await expect(page.getByText('9.6/10').first()).toBeVisible();
  });

  test('6. Simplified ChatGPT practice session manager with topic selections and scores', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // 1. Verify Topic Selection filter buttons are visible
    await expect(page.getByRole('button', { name: /Job & Study/i })).toBeVisible();
    const accomBtn = page.getByRole('button', { name: /Accommodation & Buildings/i });
    await expect(accomBtn).toBeVisible();

    // 2. Click Add Session
    await page.getByRole('button', { name: /Add (Session|Topic)/i }).first().click();
    await expect(page.getByRole('heading', { name: /Add Speaking Session/i })).toBeVisible();

    // 3. Select topic from topic selections dropdown
    await page.getByLabel(/Select Preset Topic/i).selectOption('Accommodation & Buildings');
    await expect(page.locator('#topic')).toHaveValue('Accommodation & Buildings');

    // 4. Fill ChatGPT link and practice score
    const testUrl = `https://chatgpt.com/c/accom-link-${Date.now()}`;
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(testUrl);
    await page.getByLabel(/Score/i).first().fill('8.4');

    // 5. Submit session
    await page.getByRole('button', { name: /Create (Session|Topic)/i }).click();
    await expect(page.getByText(/Accommodation & Buildings/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/8.4/).first()).toBeVisible();

    // 6. Test copy button for the link
    const copyBtn = page.locator('button[title*="Copy"]').first();
    await copyBtn.click();
    await expect(page.getByText(/Copied/i).first()).toBeVisible();

    // 7. Test topic filtering by clicking topic selection pill
    await accomBtn.click();
    await expect(page.getByText('Accommodation & Buildings').first()).toBeVisible();

    // Clean up: delete session
    const deleteBtn = page.locator('button[title="Delete session"]').first();
    await deleteBtn.click();
    await page.getByRole('button', { name: /Delete (Session|Topic)/i }).last().click();
    await expect(page.getByText(/Deleted/i)).toBeVisible({ timeout: 5000 });
  });

  test('7. Topics as selections with direct score recording and editing', async ({ page }) => {
    const topicName = 'Travel & Tourism';
    const initialUrl = `https://chatgpt.com/c/travel-chat-${Date.now()}`;

    // 1. Visit /topics
    await page.goto('/topics');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Speaking Practice Sessions/i }),
    ).toBeVisible({ timeout: 15000 });

    // 2. Add session with Travel & Tourism selected
    await page.getByRole('button', { name: /Add (Session|Topic)/i }).first().click();
    await page.getByLabel(/Select Preset Topic/i).selectOption(topicName);
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(initialUrl);
    await page.getByRole('button', { name: /Create (Session|Topic)/i }).click();

    // Verify session appears in library
    await expect(page.getByText(topicName).first()).toBeVisible({ timeout: 10000 });

    // 3. Edit session notes
    const editBtn = page.locator('button[title="Edit session"], button[title*="Edit"]').first();
    await editBtn.click();
    await expect(page.getByRole('heading', { name: /Edit (Session|Topic|Speaking Session)/i })).toBeVisible();
    await page.getByLabel(/Notes/i).fill('Exploring travel experiences in English');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.getByText('Exploring travel experiences in English')).toBeVisible();

    // 4. Record score for this session
    const recordBtn = page.locator('button[title*="Record"]').first();
    await recordBtn.click();
    await expect(page.getByRole('heading', { name: /Record Practice (Results|Score)/i })).toBeVisible();
    await page.locator('#score').fill('9.0');
    await expect(page.getByText('9.0 / 10').first()).toBeVisible();
    await page.getByRole('button', { name: /Save Results/i }).click();

    await expect(page.getByText(/Recorded practice results/i).first()).toBeVisible({ timeout: 10000 });

    // 5. Delete session
    const deleteBtn = page.locator('button[title="Delete session"]').first();
    await deleteBtn.click();
    await page.getByRole('button', { name: /Delete (Session|Topic)/i }).last().click();
    await expect(page.getByText(/Deleted/i)).toBeVisible({ timeout: 5000 });
  });
});
