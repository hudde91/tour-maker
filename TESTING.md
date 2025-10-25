# Testing Documentation

This document describes the testing strategy and setup for the Tour Maker application.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [CI/CD Integration](#cicd-integration)

## Overview

The Tour Maker application has comprehensive test coverage across multiple levels:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Integration Tests**: Test complete workflows and feature interactions
- **Component Tests**: Test React components with React Testing Library
- **E2E Tests**: Test complete user journeys with Playwright

## Testing Stack

### Unit & Integration Tests
- **Vitest**: Fast, modern testing framework with native ESM support
- **@testing-library/react**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM implementation for Node.js

### E2E Tests
- **Playwright**: Cross-browser testing automation
- **@playwright/test**: Playwright test runner

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test file
npx playwright test e2e/tour-creation.spec.ts

# Run E2E tests in debug mode
npx playwright test --debug
```

## Test Structure

```
tour-maker/
├── src/
│   ├── lib/
│   │   ├── storage/
│   │   │   ├── tours.ts
│   │   │   ├── tours.test.ts          # Unit tests for tour storage
│   │   │   ├── rounds.ts
│   │   │   ├── rounds.test.ts         # Unit tests for round storage
│   │   │   ├── players.ts
│   │   │   ├── players.test.ts        # Unit tests for player logic
│   │   │   ├── scoring.ts
│   │   │   ├── scoring.test.ts        # Unit tests for scoring calculations
│   │   │   └── integration.test.ts    # Integration tests
│   │   ├── roundFormatManager.ts
│   │   └── roundFormatManager.test.ts # Unit tests for format detection
│   ├── components/
│   │   └── ui/
│   │       ├── EmptyState.tsx
│   │       ├── EmptyState.test.tsx    # Component tests
│   │       ├── ConfirmDialog.tsx
│   │       └── ConfirmDialog.test.tsx # Component tests
│   └── test/
│       ├── setup.ts                    # Test setup and mocks
│       ├── utils.tsx                   # Test utilities and providers
│       └── fixtures.ts                 # Test data fixtures
├── e2e/
│   ├── tour-creation.spec.ts          # E2E tests for tour creation
│   ├── scoring.spec.ts                # E2E tests for scoring
│   └── mobile-gestures.spec.ts        # E2E tests for mobile interactions
├── vitest.config.ts                   # Vitest configuration
└── playwright.config.ts               # Playwright configuration
```

## Writing Tests

### Unit Tests

Unit tests focus on individual functions and utilities. Use descriptive test names and test edge cases.

```typescript
import { describe, it, expect } from 'vitest';
import { calculateStrokesForHole } from './players';

describe('calculateStrokesForHole', () => {
  it('should return 0 when playerHandicap is 0', () => {
    expect(calculateStrokesForHole(0, 5)).toBe(0);
  });

  it('should calculate 1 stroke for handicap 10 on hole handicap 5', () => {
    expect(calculateStrokesForHole(10, 5)).toBe(1);
  });
});
```

### Integration Tests

Integration tests verify complete workflows. They test multiple functions working together.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Tour Creation Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create a tour, add players, and start a round', () => {
    // Create tour
    const tour = createMockTour();
    saveTour(tour);

    // Add player
    const player = createMockPlayer();
    addPlayerToTour(tour.id, player);

    // Create and start round
    const round = createMockRound();
    saveRound(tour.id, round);
    startRound(tour.id, round.id);

    // Verify
    const updatedTour = getTour(tour.id);
    expect(updatedTour.rounds[0].status).toBe('in-progress');
  });
});
```

### Component Tests

Component tests use React Testing Library to test UI components.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  it('should render and handle clicks', async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();

    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Create your first tour"
        action={{ label: 'Create', onClick: mockAction }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create' });
    await user.click(button);

    expect(mockAction).toHaveBeenCalled();
  });
});
```

### E2E Tests

E2E tests simulate real user interactions using Playwright.

```typescript
import { test, expect } from '@playwright/test';

test('should create a new tour', async ({ page }) => {
  await page.goto('/');

  await page.click('text=Create Tour');
  await page.fill('input[name="name"]', 'My Tour');
  await page.click('button:has-text("Create")');

  await expect(page).toHaveURL(/\/tour\//);
  await expect(page.locator('h1')).toContainText('My Tour');
});
```

## Test Coverage

### Current Coverage Areas

#### Unit Tests
- ✅ Storage operations (CRUD for tours, rounds, players, teams)
- ✅ Handicap calculations (`calculateStrokesForHole`)
- ✅ Score calculations (best ball, scramble, individual)
- ✅ Stableford scoring
- ✅ Format detection and validation
- ✅ Leaderboard calculations

#### Integration Tests
- ✅ Complete tour creation flow
- ✅ Player management during tour
- ✅ Multi-round tournaments
- ✅ Team tour creation and scoring
- ✅ Stableford scoring workflow

#### Component Tests
- ✅ EmptyState component
- ✅ ConfirmDialog component

#### E2E Tests
- ✅ Tour creation and management
- ✅ Player addition and assignment
- ✅ Round configuration
- ✅ Scoring workflows
- ✅ Team best ball scoring
- ✅ Mobile gestures and swipes
- ✅ Data persistence

### Coverage Reports

Generate coverage reports with:

```bash
npm run test:coverage
```

Coverage reports are generated in:
- `coverage/index.html` - HTML report (open in browser)
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

### Coverage Goals

- **Overall**: > 80%
- **Critical paths** (scoring, handicaps): > 95%
- **Storage functions**: > 90%
- **UI components**: > 70%

## Testing Best Practices

### 1. Test Behavior, Not Implementation

❌ Bad:
```typescript
it('should call calculateScore function', () => {
  expect(calculateScore).toHaveBeenCalled();
});
```

✅ Good:
```typescript
it('should display correct total score', () => {
  expect(screen.getByText('Total: 72')).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

Test names should describe what is being tested and what the expected outcome is.

```typescript
// Good test names
it('should calculate 1 stroke for handicap 10 on hole handicap 5')
it('should return no errors for valid individual format')
it('should persist tour data across page refreshes')
```

### 3. Test Edge Cases

Always test:
- Empty states
- Null/undefined values
- Maximum/minimum values
- Error conditions

### 4. Keep Tests Independent

Each test should be able to run independently. Use `beforeEach` to set up clean state.

```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

### 5. Use Test Fixtures

Create reusable test data with fixtures:

```typescript
import { createMockTour, createMockPlayer } from '@/test/fixtures';

const tour = createMockTour({ name: 'Test Tour' });
const player = createMockPlayer({ handicap: 12 });
```

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm test src/lib/storage/players.test.ts

# Run tests matching pattern
npm test -- --grep "handicap"

# Debug with UI
npm run test:ui
```

### E2E Tests

```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Run specific test
npx playwright test e2e/scoring.spec.ts

# Generate trace
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Common Issues and Solutions

### Issue: Tests fail with "localStorage is not defined"

**Solution**: The test setup includes localStorage mocking. Make sure tests import from the setup file.

### Issue: E2E tests can't find elements

**Solution**:
1. Add `data-testid` attributes to elements
2. Use `waitFor` for async operations
3. Check selector specificity

### Issue: Component tests fail with "cannot find module"

**Solution**: Check that `vitest.config.ts` includes the path alias configuration.

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:
1. Write unit tests for new functions
2. Add integration tests for new workflows
3. Update E2E tests if user flows change
4. Ensure coverage doesn't decrease

When fixing bugs:
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify the test passes
