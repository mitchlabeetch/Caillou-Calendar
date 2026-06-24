```markdown
# Caillou-Calendar Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the development patterns and conventions used in the Caillou-Calendar TypeScript codebase. It covers file organization, code style, commit message formatting, and testing practices. By following these guidelines, contributors can maintain consistency and quality in the project.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `eventManager.ts`, `calendarUtils.ts`

### Import Style
- Use **relative imports** for referencing other modules.
  - Example:
    ```typescript
    import { getEvents } from './eventManager';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // In eventManager.ts
    export function getEvents() { /* ... */ }
    export function addEvent() { /* ... */ }
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `feat` prefix for new features.
  - Example:  
    ```
    feat: add recurring event support to calendar view
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature`

1. Create a new branch for the feature.
2. Implement the feature using camelCase file naming and relative imports.
3. Use named exports for any new modules.
4. Write or update tests in files matching `*.test.*`.
5. Commit changes using a conventional commit message with the `feat` prefix.
6. Open a pull request for review.

### Testing
**Trigger:** Before pushing or merging changes  
**Command:** `/test`

1. Identify or create test files matching the pattern `*.test.*`.
2. Run the test suite using the project's test runner.
3. Ensure all tests pass before proceeding.

## Testing Patterns

- Test files follow the `*.test.*` naming pattern (e.g., `calendarUtils.test.ts`).
- The specific testing framework is **unknown**; check the project documentation or scripts for details.
- Place tests alongside the modules they test or in a dedicated test directory.

**Example Test File:**
```typescript
// calendarUtils.test.ts
import { getEvents } from './calendarUtils';

test('should return events for a given date', () => {
  // test implementation
});
```

## Commands
| Command    | Purpose                                   |
|------------|-------------------------------------------|
| /feature   | Start a new feature development workflow  |
| /test      | Run the test suite before pushing changes |
```
