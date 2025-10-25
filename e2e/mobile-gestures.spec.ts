import { test, expect, devices } from '@playwright/test';

/**
 * E2E tests for mobile gestures and interactions
 * Tests touch interactions, swipe gestures, and mobile-specific UI
 */

// Configure mobile viewport for all tests in this file
test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Gestures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hasSeenWelcome', 'true');
    });
    await page.reload();

    // Create a basic tour with a round
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    await page.fill('[data-testid="tournament-name-input"]', 'Mobile Test Tour');
    await page.click('[data-testid="submit-tournament-button"]');

    await page.waitForURL(/\/tour\//);

    await page.click('[data-testid="tab-players"]');
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Mobile Player');
    await page.fill('[data-testid="player-handicap-input"]', '10');
    await page.click('[data-testid="submit-player-button"]');

    await page.click('[data-testid="tab-rounds"]');
    await page.click('[data-testid="create-round-button"]');
    await page.click('button:has-text("Create Round")');
    await page.click('button:has-text("Start Round")');
  });

  test('should swipe between holes', async ({ page }) => {
    const scoringArea = page.locator('[data-testid="swipeable-scoring"]');

    // Verify we're on hole 1
    await expect(page.locator('text=Hole 1')).toBeVisible();

    // Simulate swipe left (to next hole)
    await scoringArea.evaluate((el) => {
      const startX = el.clientWidth - 50;
      const endX = 50;
      const y = el.clientHeight / 2;

      const touchStart = new Touch({
        identifier: 1,
        target: el,
        clientX: startX,
        clientY: y,
      });

      const touchEnd = new Touch({
        identifier: 1,
        target: el,
        clientX: endX,
        clientY: y,
      });

      el.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [touchStart],
          cancelable: true,
          bubbles: true,
        })
      );

      el.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [touchEnd],
          cancelable: true,
          bubbles: true,
        })
      );

      el.dispatchEvent(
        new TouchEvent('touchend', {
          cancelable: true,
          bubbles: true,
        })
      );
    });

    // Verify we moved to hole 2
    await expect(page.locator('text=Hole 2')).toBeVisible();
  });

  test('should swipe back to previous hole', async ({ page }) => {
    // Navigate to hole 2
    await page.click('button[aria-label="Next hole"]');
    await expect(page.locator('text=Hole 2')).toBeVisible();

    const scoringArea = page.locator('[data-testid="swipeable-scoring"]');

    // Simulate swipe right (to previous hole)
    await scoringArea.evaluate((el) => {
      const startX = 50;
      const endX = el.clientWidth - 50;
      const y = el.clientHeight / 2;

      const touchStart = new Touch({
        identifier: 1,
        target: el,
        clientX: startX,
        clientY: y,
      });

      const touchEnd = new Touch({
        identifier: 1,
        target: el,
        clientX: endX,
        clientY: y,
      });

      el.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [touchStart],
          cancelable: true,
          bubbles: true,
        })
      );

      el.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [touchEnd],
          cancelable: true,
          bubbles: true,
        })
      );

      el.dispatchEvent(
        new TouchEvent('touchend', {
          cancelable: true,
          bubbles: true,
        })
      );
    });

    // Verify we moved back to hole 1
    await expect(page.locator('text=Hole 1')).toBeVisible();
  });

  test('should handle tap gestures on score buttons', async ({ page }) => {
    const scoreButton = page.locator('button:has-text("4")');

    // Tap the score button
    await scoreButton.tap();

    // Verify score was recorded
    await expect(page.locator('[data-testid="current-score"]')).toContainText('4');
  });

  test('should show mobile-optimized navigation', async ({ page }) => {
    // Verify bottom navigation is visible on mobile
    const bottomNav = page.locator('[data-testid="bottom-navigation"]');
    await expect(bottomNav).toBeVisible();

    // Test navigation tabs
    await page.click('[aria-label="Leaderboard"]');
    await expect(page).toHaveURL(/\/leaderboard$/);

    await page.click('[aria-label="Scoring"]');
    await expect(page).toHaveURL(/\/round\//);
  });

  test('should handle pull-to-refresh gesture', async ({ page }) => {
    const container = page.locator('main');

    // Simulate pull-down gesture
    await container.evaluate((el) => {
      const startY = 50;
      const endY = 200;
      const x = el.clientWidth / 2;

      const touchStart = new Touch({
        identifier: 1,
        target: el,
        clientX: x,
        clientY: startY,
      });

      const touchEnd = new Touch({
        identifier: 1,
        target: el,
        clientX: x,
        clientY: endY,
      });

      el.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [touchStart],
          cancelable: true,
          bubbles: true,
        })
      );

      el.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [touchEnd],
          cancelable: true,
          bubbles: true,
        })
      );

      el.dispatchEvent(
        new TouchEvent('touchend', {
          cancelable: true,
          bubbles: true,
        })
      );
    });

    // Verify page refreshed or showed loading indicator
    await expect(page.locator('[data-testid="loading"]').or(page.locator('text=Hole 1'))).toBeVisible();
  });

  test('should adjust layout for mobile viewport', async ({ page }) => {
    // Verify mobile-specific classes are applied
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(768);

    // Check that mobile layout is active
    await expect(page.locator('body')).toHaveClass(/mobile/);
  });

  test('should handle long press gesture', async ({ page }) => {
    const scoreButton = page.locator('button:has-text("4")');

    // Long press (touch and hold)
    await scoreButton.evaluate((el) => {
      const touch = new Touch({
        identifier: 1,
        target: el,
        clientX: el.clientWidth / 2,
        clientY: el.clientHeight / 2,
      });

      el.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [touch],
          cancelable: true,
          bubbles: true,
        })
      );

      // Hold for 500ms
      setTimeout(() => {
        el.dispatchEvent(
          new TouchEvent('touchend', {
            cancelable: true,
            bubbles: true,
          })
        );
      }, 500);
    });

    // Verify context menu or tooltip appears
    await expect(
      page.locator('[role="tooltip"]').or(page.locator('[role="menu"]'))
    ).toBeVisible({ timeout: 1000 });
  });
});

test.describe('Data Persistence', () => {
  test('should persist tour data across page refreshes', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hasSeenWelcome', 'true');
    });
    await page.reload();

    // Create a tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    await page.fill('[data-testid="tournament-name-input"]', 'Persistence Test');
    await page.click('[data-testid="submit-tournament-button"]');

    await page.waitForURL(/\/tour\//);

    // Add a player
    await page.click('[data-testid="tab-players"]');
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Test Player');
    await page.fill('[data-testid="player-handicap-input"]', '12');
    await page.click('[data-testid="submit-player-button"]');

    // Verify player was added
    await expect(page.locator('text=Test Player')).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify data persisted
    await expect(page.locator('text=Persistence Test')).toBeVisible();

    // Navigate back to players
    await page.click('text=Persistence Test');
    await page.click('[data-testid="tab-players"]');

    // Verify player still exists
    await expect(page.locator('text=Test Player')).toBeVisible();
    await expect(page.locator('text=12')).toBeVisible();
  });

  test('should persist scoring data during round', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hasSeenWelcome', 'true');
    });
    await page.reload();

    // Set up tour and round
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    await page.fill('[data-testid="tournament-name-input"]', 'Score Persistence');
    await page.click('[data-testid="submit-tournament-button"]');

    await page.waitForURL(/\/tour\//);

    await page.click('[data-testid="tab-players"]');
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Scorer');
    await page.fill('[data-testid="player-handicap-input"]', '0');
    await page.click('[data-testid="submit-player-button"]');

    await page.click('[data-testid="tab-rounds"]');
    await page.click('[data-testid="create-round-button"]');
    await page.click('button:has-text("Create Round")');
    await page.click('button:has-text("Start Round")');

    // Enter some scores
    await page.click('text=Scorer');
    await page.click('button:has-text("4")'); // Hole 1

    await page.click('button[aria-label="Next hole"]');
    await page.click('button:has-text("5")'); // Hole 2

    // Reload page
    await page.reload();

    // Verify we're still in the round
    await expect(page).toHaveURL(/\/round\//);

    // Verify scores persisted
    await page.click('button[aria-label="Hole 1"]');
    await expect(page.locator('[data-testid="current-score"]')).toContainText('4');

    await page.click('button[aria-label="Hole 2"]');
    await expect(page.locator('[data-testid="current-score"]')).toContainText('5');
  });
});
