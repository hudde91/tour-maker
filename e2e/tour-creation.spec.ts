import { test, expect } from '@playwright/test';

/**
 * E2E tests for tour creation workflow
 * Tests the complete user journey from creating a tour to adding players and starting a round
 */

test.describe('Tour Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage and set hasSeenWelcome to prevent modal, then reload
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hasSeenWelcome', 'true');
    });
    await page.reload();
  });

  test('should create a new individual tour', async ({ page }) => {
    // Click create tour button
    await page.click('[data-testid="create-tournament-button"]');

    // Wait for navigation to create page
    await page.waitForURL('/create');

    // Step 1: Select format (individual is default, so just proceed)
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Summer Championship');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    // Verify we're on the tour page
    await expect(page).toHaveURL(/\/tour\//);
    await expect(page.locator('h1')).toContainText('Summer Championship');
  });

  test('should create a team tour and add teams', async ({ page }) => {
    // Create tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select team format
    await page.click('[data-testid="format-team"]');
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Team Championship');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    // Wait for navigation to tour page
    await page.waitForURL(/\/tour\//);

    // Navigate to teams tab
    await page.click('text=Teams');

    // Add first team
    await page.click('text=Add Team');
    await page.fill('input[name="teamName"]', 'Team Alpha');
    await page.click('button:has-text("Save")');

    // Verify team was created
    await expect(page.locator('text=Team Alpha')).toBeVisible();

    // Add second team
    await page.click('text=Add Team');
    await page.fill('input[name="teamName"]', 'Team Beta');
    await page.click('button:has-text("Save")');

    // Verify both teams exist
    await expect(page.locator('text=Team Alpha')).toBeVisible();
    await expect(page.locator('text=Team Beta')).toBeVisible();
  });

  test('should add players to a tour', async ({ page }) => {
    // Create tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select format (individual is default)
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Player Test Tour');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    await page.waitForURL(/\/tour\//);

    // Navigate to players tab
    await page.click('[data-testid="tab-players"]');

    // Add first player
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'John Doe');
    await page.fill('[data-testid="player-handicap-input"]', '12');
    await page.click('[data-testid="submit-player-button"]');

    // Verify player was added
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Add second player
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Jane Smith');
    await page.fill('[data-testid="player-handicap-input"]', '8');
    await page.click('[data-testid="submit-player-button"]');

    // Verify both players exist
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('should create and configure a round', async ({ page }) => {
    // Create tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select format (individual is default)
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Round Test Tour');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    await page.waitForURL(/\/tour\//);

    // Navigate to rounds tab
    await page.click('[data-testid="tab-rounds"]');

    // Create new round
    await page.click('[data-testid="create-round-button"]');

    // Configure round
    await page.click('[data-testid="holes-18"]');
    await page.click('text=Stroke Play');

    // Enable handicaps
    await page.check('input[type="checkbox"]:has-text("Use Handicaps")');

    // Create round
    await page.click('[data-testid="submit-round-button"]');

    // Verify round was created
    await expect(page.locator('text=Round 1')).toBeVisible();
  });

  test('should delete a tour', async ({ page }) => {
    // Create tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select format (individual is default)
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Tour to Delete');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    await page.waitForURL(/\/tour\//);

    // Go back to home
    await page.click('text=Tours');

    // Verify tour exists
    await expect(page.locator('text=Tour to Delete')).toBeVisible();

    // Delete tour
    await page.click('[aria-label="Delete tour"]');

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Verify tour was deleted
    await expect(page.locator('text=Tour to Delete')).not.toBeVisible();
  });
});

test.describe('Tour Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hasSeenWelcome', 'true');
    });
    await page.reload();
  });

  test('should navigate between tour tabs', async ({ page }) => {
    // Create a tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select format (individual is default)
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Navigation Test');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    await page.waitForURL(/\/tour\//);

    // Test navigation between tabs
    await page.click('[data-testid="tab-players"]');
    await expect(page).toHaveURL(/\/players$/);

    await page.click('[data-testid="tab-rounds"]');
    await expect(page).toHaveURL(/\/rounds$/);

    await page.click('[data-testid="tab-leaderboard"]');
    await expect(page).toHaveURL(/\/leaderboard$/);

    await page.click('[data-testid="tab-settings"]');
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('should show breadcrumb navigation', async ({ page }) => {
    // Create a tour
    await page.click('[data-testid="create-tournament-button"]');
    await page.waitForURL('/create');

    // Step 1: Select format (individual is default)
    await page.click('button:has-text("Next Step")');

    // Step 2: Fill in tournament name
    await page.fill('[data-testid="tournament-name-input"]', 'Breadcrumb Test');
    await page.click('button:has-text("Next Step")');

    // Step 3: Skip description
    await page.click('button:has-text("Skip & Create")');

    await page.waitForURL(/\/tour\//);

    // Verify breadcrumbs exist
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    await expect(page.locator('text=Tours')).toBeVisible();
    await expect(page.locator('text=Breadcrumb Test')).toBeVisible();

    // Click breadcrumb to go home
    const toursLink = page.locator('nav[aria-label="Breadcrumb"] >> text=Tours');
    await toursLink.click();

    // Verify we're back on home page
    await expect(page).toHaveURL('/');
  });
});
