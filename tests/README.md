# NYC Water App Tests

This directory contains tests for the NYC Water App.

## Test Structure

- `/unit` - Unit tests for individual functions and modules
- `/components` - Component tests for Vue components
- `/composables` - Tests for Vue composables
- `/utils` - Tests for utility functions
- `setup.ts` - Global test setup and mocks

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Patterns

### Unit Tests

Unit tests focus on testing individual functions in isolation.

### Component Tests

Component tests focus on testing components' rendering and behavior.

### Composable Tests

Composable tests focus on testing composable functions' behavior and reactivity.

## Coverage Requirements

Aim for at least 80% code coverage for critical parts of the application:

- Type guards
- Utility functions
- Composables
- Core components

## Mocking

Most external dependencies are mocked in the `setup.ts` file:

- `fetch` API
- LocalStorage
- PostHog analytics
- Environment variables

## Adding New Tests

When adding new features, always add corresponding tests:

1. For utility functions, add unit tests
2. For composables, add composable tests
3. For components, add component tests

## Continuous Integration

Tests are automatically run on pull requests and merges to main branch.