import { test, expect } from '@playwright/test';

/**
 * E2E tests for scoring workflows
 * Tests the complete scoring flow from starting a round to entering scores
 */

test.describe('Scoring Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hasSeenWelcome', 'true');
    });
    await page.reload();

    // Set up a tour with players and a round
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select format (individual is default)
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Scoring Test Tour');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    await page.waitForURL(/\/tour\//);

    // Add players
    await page.click('[data-testid="tab-players"]');
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Player 1');
    await page.fill('[data-testid="player-handicap-input"]', '10');
    await page.click('[data-testid="submit-player-button"]');

    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Player 2');
    await page.fill('[data-testid="player-handicap-input"]', '15');
    await page.click('[data-testid="submit-player-button"]');


    // Create round
    await page.click('[data-testid="tab-rounds"]');
    await page.click('[data-testid="create-round-button"]');
    await page.click('[data-testid="holes-9"]');
    await page.click('[data-testid="submit-round-button"]');
  });

  test('should start a round and enter scores', async ({ page }) => {
    // Start the round
    await page.click('button:has-text("Start Round")');

    // Verify we're on the scoring page
    await expect(page).toHaveURL(/\/round\//);

    // Select first player
    await page.click('text=Player 1');

    // Enter scores for holes 1-9
    for (let hole = 1; hole <= 9; hole++) {
      await page.click(`button[aria-label="Hole ${hole}"]`);
      await page.click('button:has-text("4")'); // Par
    }

    // Verify total score is displayed
    await expect(page.locator('text=Total: 36')).toBeVisible();
  });

  test('should navigate between holes using swipe', async ({ page }) => {
    await page.click('button:has-text("Start Round")');
    await page.click('text=Player 1');

    // Get the scoring container
    const scoringContainer = page.locator('[data-testid="scoring-container"]');

    // Enter score for hole 1
    await page.click('button:has-text("4")');

    // Swipe left to go to next hole (simulate touch)
    await scoringContainer.evaluate((el) => {
      const touch = new Touch({
        identifier: Date.now(),
        target: el,
        clientX: 300,
        clientY: 200,
      });
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch],
        cancelable: true,
        bubbles: true,
      });
      el.dispatchEvent(touchEvent);
    });

    // Verify we moved to hole 2
    await expect(page.locator('text=Hole 2')).toBeVisible();
  });

  test('should show live leaderboard during round', async ({ page }) => {
    await page.click('button:has-text("Start Round")');

    // Enter scores for both players
    await page.click('text=Player 1');
    for (let hole = 1; hole <= 3; hole++) {
      await page.click(`button[aria-label="Hole ${hole}"]`);
      await page.click('button:has-text("4")');
    }

    await page.click('text=Player 2');
    for (let hole = 1; hole <= 3; hole++) {
      await page.click(`button[aria-label="Hole ${hole}"]`);
      await page.click('button:has-text("5")');
    }

    // View leaderboard
    await page.click('[data-testid="tab-leaderboard"]');

    // Verify players are ranked correctly
    const leaderboardItems = page.locator('[data-testid="leaderboard-entry"]');
    const firstPlayer = leaderboardItems.first();
    const secondPlayer = leaderboardItems.last();

    await expect(firstPlayer).toContainText('Player 1');
    await expect(secondPlayer).toContainText('Player 2');
  });

  test('should complete a round', async ({ page }) => {
    await page.click('button:has-text("Start Round")');

    // Enter scores for all holes for player 1
    await page.click('text=Player 1');
    for (let hole = 1; hole <= 9; hole++) {
      await page.click(`button[aria-label="Hole ${hole}"]`);
      await page.click('button:has-text("4")');
    }

    // Complete the round
    await page.click('button:has-text("Complete Round")');

    // Confirm completion
    await page.click('button:has-text("Confirm")');

    // Verify we're redirected to leaderboard
    await expect(page).toHaveURL(/\/leaderboard$/);
    await expect(page.locator('text=Round Complete')).toBeVisible();
  });

  test('should handle handicap calculations', async ({ page }) => {
    await page.click('button:has-text("Start Round")');

    // Player with handicap 10 should get strokes
    await page.click('text=Player 1');

    // Enter scores
    for (let hole = 1; hole <= 9; hole++) {
      await page.click(`button[aria-label="Hole ${hole}"]`);
      await page.click('button:has-text("5")'); // All bogeys
    }

    // View scorecard
    await page.click('text=View Scorecard');

    // Verify gross and net scores are displayed
    await expect(page.locator('text=Gross: 45')).toBeVisible();
    await expect(page.locator('text=Net:')).toBeVisible();
  });
});

test.describe('Team Scoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hasSeenWelcome', 'true');
    });
    await page.reload();

    // Set up a team tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select team format
    await page.click('[data-testid="format-team"]');
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Team Scoring Tour');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    await page.waitForURL(/\/tour\//);

    // Add teams and players - teams section is already visible for team format
    await page.click('text=Add Team');
    await page.fill('input[name="teamName"]', 'Team A');
    await page.click('button:has-text("Create Team")');

    // No need to navigate to players tab, just add players
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Player A1');
    await page.fill('[data-testid="player-handicap-input"]', '10');
    await page.click('[data-testid="submit-player-button"]');

    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Player A2');
    await page.fill('[data-testid="player-handicap-input"]', '15');
    await page.click('[data-testid="submit-player-button"]');

    // Assign players to team
    await page.click('[aria-label="Assign Player A1 to team"]');
    await page.click('text=Team A');

    await page.click('[aria-label="Assign Player A2 to team"]');
    await page.click('text=Team A');

    // Create best ball round
    await page.click('[data-testid="tab-rounds"]');
    await page.click('[data-testid="create-round-button"]');
    await page.click('[data-testid="format-best-ball"]');
    await page.click('[data-testid="submit-round-button"]');
  });

  test('should score best ball format correctly', async ({ page }) => {
    await page.click('button:has-text("Start Round")');

    // Enter scores for both players on hole 1
    await page.click('text=Player A1');
    await page.click('button[aria-label="Hole 1"]');
    await page.click('button:has-text("5")');

    await page.click('text=Player A2');
    await page.click('button[aria-label="Hole 1"]');
    await page.click('button:has-text("4")');

    // View team leaderboard
    await page.click('text=Team Leaderboard');

    // Verify best ball score (should use better score of 4)
    await expect(page.locator('text=Team A')).toBeVisible();
    // Best score on hole 1 is 4
    await expect(page.locator('text=Hole 1: 4')).toBeVisible();
  });
});
