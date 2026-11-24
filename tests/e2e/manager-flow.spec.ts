import { test, expect } from '@playwright/test';

async function ensureSidebarOpen(page: any) {
  const closeSidebarBtn = page.locator('button[aria-label="Close sidebar"]').first();
  if (await closeSidebarBtn.isHidden()) {
    await page.keyboard.press('Alt+1');
    await closeSidebarBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
}

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
    await expect(page.getByRole('button', { name: 'Copy Prompt', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open ChatGPT/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Add (Session|Topic)/i }).first()).toBeVisible();
  });

  test('2. Prompt Links page displays prompt starters and allows copying', async ({ page }) => {
    await page.goto('/prompt-links');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Prompt Links Library/i }),
    ).toBeVisible({ timeout: 20000 });

    // Verify copy button on prompt links card
    const copyBtn = page.getByRole('button', { name: /Copy Prompt/i }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText(/copied to clipboard/i).first()).toBeVisible({ timeout: 5000 });
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

    // Expand sidebar if closed
    await ensureSidebarOpen(page);

    // 2. Click options chevron to open Notion dropdown
    await page.locator('button[aria-label="Open topic options"]').first().click();

    // Select/create topic from Notion option selector (instant creation without popup)
    const searchOptionInput = page.getByPlaceholder(/Search for an option/i);
    await expect(searchOptionInput).toBeVisible({ timeout: 5000 });
    await searchOptionInput.fill(testTopic);
    await page.keyboard.press('Enter');

    // 4. Verify session appears in library instantly and success toast is shown
    await expect(page.getByText(/(Created speaking session|Session created)/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(testTopic).first()).toBeVisible({ timeout: 10000 });

    // 5. Test persistence: Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(testTopic).first()).toBeVisible({ timeout: 10000 });

    // 6. Search filter (open search if in collapsed rail mode)
    const openSearchBtn = page.locator('button[aria-label="Search"]').first();
    if (await openSearchBtn.isVisible()) {
      await openSearchBtn.click();
    }
    const searchInput = page.getByPlaceholder(/Search by topic/i);
    await searchInput.fill(testTopic);
    await expect(page.getByText(testTopic).first()).toBeVisible();

    // 8. Record Results / Add Score
    const recordBtn = page.locator(`button[title*="Add score"], button[title*="Record"], button[title*="Thêm điểm"]`).first();
    if (await recordBtn.isVisible()) {
      await recordBtn.click();
      await expect(
        page.getByRole('heading', { name: /(Record Practice|Add \/ Update Score|Thêm \/ Cập nhật điểm)/i }),
      ).toBeVisible();

      // Enter Score: 8.0
      await page.locator('#score-input, #score').fill('8.0');

      await page.getByRole('button', { name: /(Save Results|Save Score|Lưu điểm)/i }).click();
      await expect(page.getByText(/(Recorded practice results|Saved score|Đã lưu điểm)/i).first()).toBeVisible({
        timeout: 5000,
      });
    }

    // 9. Delete session with Confirmation Dialog
    const testCard = page.locator('div[data-testid="session-card"], .rounded-xl').filter({ hasText: testTopic }).first();
    const deleteBtn = testCard.locator(`button[title="Delete session"]`);
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
    await expect(page.getByRole('button', { name: /Add (Session|Topic)/i }).first()).toBeVisible();
  });

  test('5. Multi-link practice tracking, highest score display, and deleting ChatGPT links', async ({ page }) => {
    const testTopic = `Multi Attempt Topic ${Date.now()}`;
    const testUrl = `https://chatgpt.com/c/multi-attempt-${Date.now()}`;

    // 1. Create a session instantly
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Expand sidebar if closed
    await ensureSidebarOpen(page);

    await page.locator('button[aria-label="Open topic options"]').first().click();
    const searchOptionInput = page.getByPlaceholder(/Search for an option/i);
    await expect(searchOptionInput).toBeVisible({ timeout: 5000 });
    await searchOptionInput.fill(testTopic);
    await page.keyboard.press('Enter');

    // 2. Open session details
    const sessionLink = page.getByRole('link', { name: testTopic }).first();
    await expect(sessionLink).toBeVisible({ timeout: 10000 });
    await sessionLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: testTopic })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/ChatGPT Links Grouped for this Topic/i)).toBeVisible();

    // 3. Add Score 8.0 to Link 1
    const addScore1Btn = page.locator('button[title*="Add score"], button[title*="Thêm điểm"]').first();
    await addScore1Btn.click();
    await expect(page.getByRole('heading', { name: /(Add \/ Update Score|Thêm \/ Cập nhật điểm)/i })).toBeVisible();
    await page.locator('#score-input').fill('8.0');
    await page.getByRole('button', { name: /(Save Score|Lưu điểm)/i }).click();
    await expect(page.getByText(/(Saved score|Đã lưu điểm)/i).first()).toBeVisible({ timeout: 5000 });

    // Verify 8.0/10 appears
    await expect(page.getByText('8.0/10').first()).toBeVisible();

    // 4. Add Link #2 to this topic
    const secondUrl = `https://chatgpt.com/c/second-${Date.now()}`;
    await page.getByRole('button', { name: 'Add ChatGPT Link', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Add ChatGPT Link to Topic/i })).toBeVisible();
    await page.getByLabel(/ChatGPT Conversation URL/i).fill(secondUrl);
    await page.getByRole('button', { name: /Add Link to Topic/i }).click();
    await expect(page.getByText(/ChatGPT conversation link added/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Link #2')).toBeVisible();

    // 5. Add Score 9.5 to Link 2
    const addScore2Btn = page.locator('button[title*="Add score"], button[title*="Thêm điểm"]').last();
    await addScore2Btn.click();
    await expect(page.getByRole('heading', { name: /(Add \/ Update Score|Thêm \/ Cập nhật điểm)/i })).toBeVisible();
    await page.locator('#score-input').fill('9.5');
    await page.getByRole('button', { name: /(Save Score|Lưu điểm)/i }).click();
    await expect(page.getByText(/(Saved score|Đã lưu điểm)/i).first()).toBeVisible({ timeout: 5000 });

    // Verify Highest Score is 9.5/10
    await expect(page.getByText('9.5/10').first()).toBeVisible();

    // 6. Delete Link 2 and verify fallback to Link 1's score (8.0/10)
    const deleteLinkBtn = page.locator('button[title="Delete ChatGPT link"]').last();
    await deleteLinkBtn.click();
    await expect(page.getByRole('heading', { name: /Delete ChatGPT Link/i })).toBeVisible();
    await page.getByRole('button', { name: /Delete Link/i }).click();
    await expect(page.getByText(/ChatGPT conversation link removed/i)).toBeVisible({ timeout: 5000 });

    // Score should fall back to 8.0/10
    await expect(page.getByText('8.0/10').first()).toBeVisible();
  });

  test('6. Simplified ChatGPT practice session manager with topic selections and scores', async ({ page }) => {
    // Set up test topics
    await page.request.post('http://localhost:3200/api/topics', { data: { name: 'Job & Study' } });
    const createAccomRes = await page.request.post('http://localhost:3200/api/topics', { data: { name: 'Accommodation & Buildings' } });
    const accomData = await createAccomRes.json().catch(() => null);

    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Expand sidebar if closed to access topic buttons
    await ensureSidebarOpen(page);

    // 1. Verify Topic Selection filter buttons are visible
    await expect(page.getByRole('button', { name: /Job & Study/i })).toBeVisible();
    const accomBtn = page.getByRole('button', { name: /Accommodation & Buildings/i });
    await expect(accomBtn).toBeVisible();

    // 2. Click topic options and select Accommodation & Buildings from Notion dropdown (instant creation)
    await page.locator('button[aria-label="Open topic options"]').first().click();
    await page.getByText(/Accommodation & Buildings/i).first().click();
    await expect(page.getByText(/Accommodation & Buildings/).first()).toBeVisible({ timeout: 10000 });

    // Test copy topic text feature
    const copyTopicBtn = page.locator('button[title*="Copy topic text"]').first();
    await copyTopicBtn.click();
    await expect(page.getByText(/Copied.*to clipboard/i).first()).toBeVisible();

    // 3. Add score 8.4 using Add Score feature
    const addScoreBtn = page.locator('button[title*="Add score"], button[title*="Thêm điểm"], button[aria-label*="Add score"], button[aria-label*="Thêm điểm"]').first();
    await addScoreBtn.click();
    await page.locator('#score-input').fill('8.4');
    await page.getByRole('button', { name: /(Save Score|Lưu điểm)/i }).click();
    await expect(page.getByText(/8.4/).first()).toBeVisible();

    // 6. Test ChatGPT link pill and edit modal (matching english-grammar-quiz)
    const editChatBtn = page.locator('button[title*="ChatGPT Link"]').first();
    await editChatBtn.click();
    await expect(page.getByRole('heading', { name: /(Edit|Add) ChatGPT Link/i })).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();

    // 7. Test topic filtering by clicking topic selection pill
    await accomBtn.click();
    await expect(page.getByText('Accommodation & Buildings').first()).toBeVisible();

    // Clean up: delete session and topics
    const accomCard = page.locator('div[data-testid="session-card"], .rounded-xl').filter({ hasText: 'Accommodation & Buildings' }).first();
    const deleteBtn = accomCard.locator('button[title="Delete session"]');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.getByRole('button', { name: /Delete (Session|Topic)/i }).last().click();
      await expect(page.getByText(/Deleted/i)).toBeVisible({ timeout: 5000 });
    }

    if (accomData?.topic?.id) {
      await page.request.delete(`http://localhost:3200/api/topics/${accomData.topic.id}`);
    }
  });

  test('7. Topics as selections with direct score recording and editing', async ({ page }) => {
    const topicName = 'Travel & Transportation';
    const initialUrl = `https://chatgpt.com/c/travel-chat-${Date.now()}`;

    // Set up topic for test
    const createTopicRes = await page.request.post('http://localhost:3200/api/topics', { data: { name: topicName } });
    const topicData = await createTopicRes.json().catch(() => null);

    // 1. Visit /topics
    await page.goto('/topics');
    await page.waitForLoadState('networkidle');

    // Expand sidebar if closed
    await ensureSidebarOpen(page);

    // 2. Add session with Travel & Transportation selected from Notion dropdown (instant creation)
    await page.locator('button[aria-label="Open topic options"]').first().click();
    await page.getByText(topicName).first().click();

    // Verify session appears in library
    await expect(page.getByText(topicName).first()).toBeVisible({ timeout: 10000 });

    // 3. Edit session notes
    const editBtn = page.locator('button[title="Edit topic and note"], button[aria-label="Edit topic and note"], button[title="Edit session"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByRole('heading', { name: /Edit (Session|Topic|Speaking Session)/i })).toBeVisible();
      await page.getByLabel(/Notes/i).fill('Exploring travel experiences in English');
      await page.getByRole('button', { name: /Save Changes/i }).click();
      await expect(page.getByText('Exploring travel experiences in English')).toBeVisible();
    }

    // 4. Record score for this session using Add Score feature
    const addScoreBtn = page.locator('button[title*="Add score"], button[title*="Thêm điểm"], button[aria-label*="Add score"], button[aria-label*="Thêm điểm"], button:has-text("+ Add Score"), button:has-text("+ Thêm điểm")').first();
    await addScoreBtn.click();
    await expect(page.getByRole('heading', { name: /(Add \/ Update Score|Thêm \/ Cập nhật điểm)/i })).toBeVisible();
    await page.locator('#score-input').fill('9.0');
    await page.getByRole('button', { name: /(Save Score|Lưu điểm)/i }).click();

    await expect(page.getByText(/(Saved score|Đã lưu điểm)/i).first()).toBeVisible({ timeout: 10000 });

    // 5. Delete session and topic
    const travelCard = page.locator('div[data-testid="session-card"], .rounded-xl').filter({ hasText: topicName }).first();
    const deleteBtn = travelCard.locator('button[title="Delete session"]');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.getByRole('button', { name: /Delete (Session|Topic)/i }).last().click();
      await expect(page.getByText(/Deleted/i)).toBeVisible({ timeout: 5000 });
    }

    if (topicData?.topic?.id) {
      await page.request.delete(`http://localhost:3200/api/topics/${topicData.topic.id}`);
    }
  });

  test('8. Prompt Links page is accessible and distinct from Coach Prompt', async ({ page }) => {
    await page.goto('/prompt-links');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*prompt-links/);
    await expect(page.getByRole('heading', { name: /Prompt Links Library/i })).toBeVisible();

    // Verify presence of prompt links cards
    await expect(page.getByText('Job & Study').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Launch/i }).first()).toBeVisible();
  });

  test('9. Notion-style topic dropdown: CRUD topics and independent topic vs link statuses', async ({ page }) => {
    await page.goto('/sessions');
    await page.evaluate(() => {
      localStorage.setItem('practice_status_filter', 'ALL');
      localStorage.setItem('practice_topic_filter', 'ALL');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Expand sidebar if closed
    await ensureSidebarOpen(page);

    // 1. Verify Notion dropdown trigger button
    const optionsBtn = page.locator('button[aria-label="Open topic options"]').first();
    await expect(optionsBtn).toBeVisible();
    await optionsBtn.click();

    // 2. Verify Notion dropdown elements matching user's photo
    const searchInput = page.getByPlaceholder(/Search for an option/i);
    await expect(searchInput).toBeVisible();
    await expect(page.getByText(/Select an option or create one/i)).toBeVisible();

    // 3. Create a new topic via Notion dropdown (instant session creation)
    const customTopicName = `Grammar Drill ${Date.now()}`;
    await searchInput.fill(customTopicName);
    await page.keyboard.press('Enter');
    await expect(page.getByText(/(Created speaking session|Session created)/i).first()).toBeVisible({ timeout: 10000 });

    // 4. Verify topic appears in library with its card
    await expect(page.getByText(customTopicName).first()).toBeVisible({ timeout: 10000 });

    // 5. Verify independent statuses and clicking ChatGPT link updates status to Doing:
    // Topic card has topic status group and link status group (under Next Practice)
    const card = page.locator('div.rounded-2xl', { hasText: customTopicName }).first();
    const topicGroup = card.locator('div[aria-label="Status"]').first();
    const linkGroup = card.locator('div[aria-label="Change next practice link status"]').first();

    await expect(topicGroup).toBeVisible({ timeout: 5000 });
    await expect(linkGroup).toBeVisible({ timeout: 5000 });

    // 1. Change topic status to Doing
    await topicGroup.getByRole('button', { name: 'Doing' }).click();
    await expect(page.getByText(/Updated status to Doing/i).first()).toBeVisible({ timeout: 5000 });

    // Link status should remain "To do"
    await expect(linkGroup.getByRole('button', { name: 'To do' })).toHaveAttribute('aria-pressed', 'true');

    // 2. Add a ChatGPT link to this card
    const uniqueChatUrl = `https://chatgpt.com/c/flow-${Date.now()}`;
    const editChatBtn = card.locator('button[title*="Add ChatGPT Link"]').first();
    await editChatBtn.click();
    const chatInput = page.locator('#session-chat-url');
    await expect(chatInput).toBeVisible();
    await chatInput.fill(uniqueChatUrl);
    await page.getByRole('button', { name: /Add Link/i }).click();
    await expect(page.getByText(/ChatGPT link saved/i).first()).toBeVisible({ timeout: 5000 });

    // Verify ChatGPT link button is now present
    const chatGptLink = card.locator(`a[title*="Open ChatGPT: ${uniqueChatUrl}"]`).first();
    await expect(chatGptLink).toBeVisible();

    // 3. Click ChatGPT link and verify current ChatGPT link status updates to "Doing"
    await chatGptLink.click();
    await expect(page.getByText(/Updated practice status to "Doing"/i).first()).toBeVisible({ timeout: 5000 });
    await expect(linkGroup.getByRole('button', { name: 'Doing' })).toHaveAttribute('aria-pressed', 'true');

    // 4. Click 'Done' on ChatGPT link
    await linkGroup.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText(/Updated practice status to "Done"/i).first()).toBeVisible({ timeout: 5000 });

    // Topic status must still be 'Doing' (independent from ChatGPT link status)
    await expect(topicGroup.getByRole('button', { name: 'Doing' })).toHaveAttribute('aria-pressed', 'true');

    // 5. When current ChatGPT link is done, it is replaced by 'Add ChatGPT link' button
    await expect(card.getByRole('button', { name: /Add ChatGPT link/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(card.locator('div[aria-label="Change next practice link status"]')).not.toBeVisible();

    // Cleanup: delete session
    const deleteBtn = card.locator('button[title="Delete session"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.getByRole('button', { name: /Delete (Session|Topic)/i }).last().click();
      await expect(page.getByText(/Deleted/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('10. Prompt link can be saved empty and ChatGPT link defaults to empty', async ({ page }) => {
    // 1. Visit /prompt-links and verify saving empty shared prompt link is allowed
    await page.goto('/prompt-links');
    await page.waitForLoadState('networkidle');

    // Click Edit Shared Prompt link
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    const promptInput = page.locator('input[placeholder*="https://chatgpt.com"]').first();
    await promptInput.fill('');
    await page.getByRole('button', { name: /(Save Shared Configuration|Lưu cấu hình dùng chung)/i }).click();

    // Expect successful save
    await expect(page.getByText(/(Shared Prompt link saved|Prompt link dùng chung đã được lưu)/i)).toBeVisible();

    // 2. Test Edit "Prompt Chat" Link in Navbar modal (prompt links can be empty)
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Open sidebar if collapsed to access edit prompt button
    await ensureSidebarOpen(page);

    const editPromptNavBtn = page.locator('button[title*="Edit Prompt Chat URL"]').first();
    await editPromptNavBtn.click();
    await expect(page.getByRole('heading', { name: /Edit "Prompt Chat" Link/i })).toBeVisible();

    const navPromptInput = page.locator('#prompt-chat-input');
    await navPromptInput.fill('');
    await page.getByRole('button', { name: /Save Link/i }).click();

    // Expect modal to close successfully and success toast
    await expect(page.getByText(/Prompt Chat link (cleared|updated)/i).first()).toBeVisible();

    // 3. Visit /sessions, create a topic session, verify ChatGPT link defaults to empty
    await page.locator('button[aria-label="Open topic options"]').first().click();
    const testTopic = `Default Empty Link ${Date.now()}`;
    const searchOptionInput = page.getByPlaceholder(/Search for an option/i);
    await searchOptionInput.fill(testTopic);
    await page.keyboard.press('Enter');

    // Verify topic card appears and its ChatGPT link button indicates no link yet (Add ChatGPT link)
    await expect(page.getByText(testTopic).first()).toBeVisible({ timeout: 10000 });
    const addChatBtn = page.getByRole('button', { name: /Add ChatGPT Link/i }).first();
    await expect(addChatBtn).toBeVisible();

    // Cleanup: delete session
    const emptyLinkCard = page.locator('div[data-testid="session-card"], .rounded-xl').filter({ hasText: testTopic }).first();
    const deleteBtn = emptyLinkCard.locator('button[title="Delete session"]');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.getByRole('button', { name: /Delete (Session|Topic)/i }).last().click();
    }
  });

  test('11. Desktop sidebar can be toggled with Alt+1 and is hidden with no icons when closed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // 1. Ensure sidebar can be closed with Alt+1 or close button
    const closeSidebarBtn = page.locator('button[aria-label="Close sidebar"]').first();
    const aside = page.locator('aside');
    if (await closeSidebarBtn.isVisible()) {
      await page.keyboard.press('Alt+1');
    }
    // Verify sidebar is completely hidden with no icons
    await expect(aside).toHaveClass(/w-0/);
    await expect(page.locator('button[aria-label="Open sidebar"]')).toHaveCount(0);

    // 2. Press Alt+1 to open sidebar
    await page.keyboard.press('Alt+1');
    await expect(closeSidebarBtn).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Add (Session|Topic)/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/Search by topic/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /All \(/i }).first()).toBeVisible();
    await expect(page.getByText(/FILTER TOPICS/i)).toBeVisible();

    // 3. Test clicking close button closes and hides sidebar with no icons
    await closeSidebarBtn.click();
    await expect(aside).toHaveClass(/w-0/);
    await expect(page.locator('button[aria-label="Open sidebar"]')).toHaveCount(0);

    // 4. Test keyboard shortcut Alt+1 opens it again
    await page.keyboard.press('Alt+1');
    await expect(closeSidebarBtn).toBeVisible({ timeout: 5000 });

    // 5. Test keyboard shortcut Alt+` opens Add Topic pop-up modal
    await page.keyboard.press('Alt+Backquote');
    const modal = page.locator('div[role="dialog"][aria-label="Add Topic"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('Select an option or create one')).toBeVisible();

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('12. Initially empty, clicking Add Topic shows topics to choose and create topic', async ({ page }) => {
    // Intercept initial GET /api/sessions so existing user data is completely preserved
    let servedMock = false;
    await page.route('**/api/sessions*', async (route) => {
      if (route.request().method() === 'GET' && !servedMock) {
        servedMock = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessions: [],
            pagination: { total: 0, page: 1, limit: 100, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Ensure "Job & Study" topic exists in topics table (matching user's state)
    const tRes = await page.request.get('/api/topics');
    const tData = await tRes.json().catch(() => ({ topics: [] }));
    if (!tData.topics?.some((t: any) => t.name === 'Job & Study')) {
      await page.request.post('/api/topics', {
        data: {
          name: 'Job & Study',
          color: '',
          icon: '',
          description: 'Workplace, career goals, university life, academic achievements, and daily tasks.',
        },
      });
    }

    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Click Add Topic button in empty state card (in main content as shown in photo)
    const addTopicBtn = page.locator('main').getByRole('button', { name: /Add Topic/i });
    await expect(addTopicBtn).toBeVisible();
    await addTopicBtn.click();

    // Verify it does NOT automatically create session, but shows topics dropdown to choose/create
    await expect(page.getByText('Select an option or create one')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Job & Study').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /New Topic/i })).toBeVisible();

    // Select "Job & Study" from the options
    await page.getByText('Job & Study').first().click();

    // Verify "Job & Study" session card and toast appear
    await expect(page.getByText(/Created speaking session for "Job & Study"!/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('13. Pressing F5 preserves Doing filter and open sidebar state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // 1. Open sidebar if closed
    await ensureSidebarOpen(page);
    const closeSidebarBtn = page.locator('button[aria-label="Close sidebar"]').first();
    await expect(closeSidebarBtn).toBeVisible();

    // 2. Click "Doing" status filter button
    const doingBtn = page.getByRole('button', { name: /Doing \(/i }).first();
    await expect(doingBtn).toBeVisible();
    await doingBtn.click();

    // Verify "Doing" filter button is active (blue background class bg-blue-500)
    await expect(doingBtn).toHaveClass(/bg-blue-500/);

    // 3. Press F5 (Reload page)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. Verify sidebar remains OPEN
    await expect(closeSidebarBtn).toBeVisible();
    await expect(page.getByPlaceholder(/Search by topic/i)).toBeVisible();

    // 5. Verify status filter remains "Doing"
    const doingBtnAfterF5 = page.getByRole('button', { name: /Doing \(/i }).first();
    await expect(doingBtnAfterF5).toBeVisible();
    await expect(doingBtnAfterF5).toHaveClass(/bg-blue-500/);
  });

  test('14. Alt+` opens Add Topic pop-up modal without automatically adding topic and Alt+1 toggles sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // 1. Test Alt+1 toggles sidebar and hides with no icon
    const closeSidebarBtn = page.locator('button[aria-label="Close sidebar"]').first();
    const aside = page.locator('aside');

    if (await closeSidebarBtn.isVisible()) {
      await page.keyboard.press('Alt+1');
      await expect(aside).toHaveClass(/w-0/);
      await expect(page.locator('button[aria-label="Open sidebar"]')).toHaveCount(0);
    }

    // Press Alt+1 again to open it
    await page.keyboard.press('Alt+1');
    await expect(closeSidebarBtn).toBeVisible({ timeout: 5000 });

    // 2. Test Alt+` opens Add Topic pop-up modal and does NOT automatically create any session
    const sRes = await page.request.get('/api/sessions');
    const sData = await sRes.json().catch(() => ({ total: 0 }));
    const countBefore = sData.total || 0;

    await page.keyboard.press('Alt+Backquote');
    const modal = page.locator('div[role="dialog"][aria-label="Add Topic"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('Select an option or create one')).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('Job & Study').first()).toBeVisible({ timeout: 5000 });

    const sResAfter = await page.request.get('/api/sessions');
    const sDataAfter = await sResAfter.json().catch(() => ({ total: 0 }));
    expect(sDataAfter.total).toBe(countBefore);

    // Dismiss pop-up modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('15. Clicking Topic Card navigates to topic view and card shows score next to name', async ({ page }) => {
    // 1. Create a session to test card
    const topicRes = await page.request.post('http://localhost:3200/api/sessions', {
      data: {
        topic: `Card Click Topic ${Date.now()}`,
        status: 'To Do',
      },
    });
    const sessionData = await topicRes.json();
    const sessionId = sessionData.id;

    await page.goto('/topics');
    await page.waitForLoadState('networkidle');

    const card = page.locator(`div[class*="group cursor-pointer"]`, { hasText: sessionData.topic }).first();
    await expect(card).toBeVisible();

    // Verify "Next Practice" label is not visible on card
    await expect(card.getByText('✨ Next Practice')).toHaveCount(0);
    // Verify "Best Score:" label row is not visible on card
    await expect(card.getByText(/Best Score:/i)).toHaveCount(0);
    // Verify point/No score is displayed
    await expect(card.getByText('No score')).toBeVisible();

    // Verify Add Score button is icon-only (+ icon) with aria-label="Add score"
    const addScoreBtn = card.locator('button[aria-label="Add score"]');
    await expect(addScoreBtn).toBeVisible();
    await expect(card.getByText('+ Add Score')).toHaveCount(0);

    // 2. Click on empty space of Topic Card to view topic
    // Click card container (not on buttons/links)
    await card.click({ position: { x: 20, y: 20 } });
    await expect(page).toHaveURL(new RegExp(`/sessions/${sessionId}`));
    await expect(page.getByRole('heading', { name: sessionData.topic })).toBeVisible({ timeout: 10000 });

    // Cleanup session
    await page.request.delete(`http://localhost:3200/api/sessions/${sessionId}`);
  });
});
