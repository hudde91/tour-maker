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
    await page.click('text=Create Tournament');

    // Fill in tour details
    await page.fill('input[name="name"]', 'Summer Championship');

    // Select individual format
    await page.click('text=Individual');

    // Submit the form
    await page.click('button:has-text("Create")');

    // Verify we're on the tour page
    await expect(page).toHaveURL(/\/tour\//);
    await expect(page.locator('h1')).toContainText('Summer Championship');
  });

  test('should create a team tour and add teams', async ({ page }) => {
    // Create tour
    await page.click('text=Create Tournament');
    await page.fill('input[name="name"]', 'Team Championship');
    await page.click('text=Team');
    await page.click('button:has-text("Create")');

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
    await page.click('text=Create Tournament');
    await page.fill('input[name="name"]', 'Player Test Tour');
    await page.click('text=Individual');
    await page.click('button:has-text("Create")');

    // Navigate to players tab
    await page.click('text=Players');

    // Add first player
    await page.click('text=Add Player');
    await page.fill('input[name="playerName"]', 'John Doe');
    await page.fill('input[name="handicap"]', '12');
    await page.click('button:has-text("Add")');

    // Verify player was added
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=12')).toBeVisible();

    // Add second player
    await page.click('text=Add Player');
    await page.fill('input[name="playerName"]', 'Jane Smith');
    await page.fill('input[name="handicap"]', '8');
    await page.click('button:has-text("Add")');

    // Verify both players exist
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('should create and configure a round', async ({ page }) => {
    // Create tour
    await page.click('text=Create Tournament');
    await page.fill('input[name="name"]', 'Round Test Tour');
    await page.click('text=Individual');
    await page.click('button:has-text("Create")');

    // Navigate to rounds tab
    await page.click('text=Rounds');

    // Create new round
    await page.click('text=Create Round');

    // Configure round
    await page.click('text=18 Holes');
    await page.click('text=Stroke Play');

    // Enable handicaps
    await page.check('input[type="checkbox"]:has-text("Use Handicaps")');

    // Create round
    await page.click('button:has-text("Create Round")');

    // Verify round was created
    await expect(page.locator('text=Round 1')).toBeVisible();
  });

  test('should delete a tour', async ({ page }) => {
    // Create tour
    await page.click('text=Create Tournament');
    await page.fill('input[name="name"]', 'Tour to Delete');
    await page.click('text=Individual');
    await page.click('button:has-text("Create")');

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
    await page.click('text=Create Tournament');
    await page.fill('input[name="name"]', 'Navigation Test');
    await page.click('text=Individual');
    await page.click('button:has-text("Create")');

    // Test navigation between tabs
    await page.click('text=Players');
    await expect(page).toHaveURL(/\/players$/);

    await page.click('text=Rounds');
    await expect(page).toHaveURL(/\/rounds$/);

    await page.click('text=Leaderboard');
    await expect(page).toHaveURL(/\/leaderboard$/);

    await page.click('text=Settings');
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('should show breadcrumb navigation', async ({ page }) => {
    // Create a tour
    await page.click('text=Create Tournament');
    await page.fill('input[name="name"]', 'Breadcrumb Test');
    await page.click('text=Individual');
    await page.click('button:has-text("Create")');

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
