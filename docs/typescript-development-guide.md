# TypeScript Development Guide

This document covers TypeScript best practices, type safety requirements, and the comprehensive any-type prevention system used in this project.

## Overview

This project enforces strict TypeScript practices with zero-tolerance for `any` types, ensuring type safety and code quality throughout the development lifecycle.

## Type Safety Requirements

### Core Principles
1. **No `any` Types**: Explicit `any` usage is prohibited unless absolutely necessary
2. **Strict TypeScript**: All code must pass strict TypeScript compilation
3. **Comprehensive Typing**: All public APIs must have explicit types
4. **Type Safety Over Convenience**: Always choose type safety when there's a tradeoff

### TypeScript Compiler Configuration
- `noImplicitAny: true` - Prevents implicit any types
- `noImplicitReturns: true` - Requires explicit return types
- `noImplicitThis: true` - Prevents implicit any for `this`
- `strict: true` - Enables all strict type checking options

## Any-Type Prevention System

### Prevention Layers

#### 1. Development Time - ESLint Rules
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-unsafe-argument": "error"
  }
}
```

#### 2. Build Time - TypeScript Compiler
```bash
npm run typecheck:strict  # Includes --strict --noImplicitAny flags
```

#### 3. Pre-commit - Git Hooks
- Husky pre-commit hooks prevent commits with `any` types
- Runs `lint-staged` with strict checking
- Scans staged files for prohibited `any` usage
- Blocks commits that introduce new `any` types

#### 4. CI/CD - GitHub Actions
- **Strict TypeScript checking**: `npm run typecheck:strict`
- **Zero-warning linting**: `npm run lint:strict`
- **Any-type scanning**: Custom script that scans all TypeScript files
- **Build verification**: `npm run build:ci`

### Available Scripts

#### Development Scripts
```bash
npm run lint              # Normal linting (warnings allowed)
npm run lint:strict       # Strict linting (zero warnings)
npm run lint:check-any    # Check for explicit any usage
npm run typecheck         # Normal TypeScript checking
npm run typecheck:strict  # Strict TypeScript checking
```

#### CI/CD Scripts
```bash
npm run test:ci          # Run all CI checks + tests
npm run build:ci         # Run all CI checks + build
npm run precommit        # Pre-commit validation
```

## Best Practices

### Instead of `any`, use:

#### 1. Specific Types
```typescript
// Bad
function process(data: any): any {
  return data.result
}

// Good
interface ProcessResult {
  result: string
  status: number
}
function process(data: ProcessResult): string {
  return data.result
}
```

#### 2. Generic Types
```typescript
// Bad
function identity(arg: any): any {
  return arg
}

// Good
function identity<T>(arg: T): T {
  return arg
}
```

#### 3. Union Types
```typescript
// Bad
function format(value: any): string {
  return String(value)
}

// Good
function format(value: string | number | boolean): string {
  return String(value)
}
```

#### 4. Unknown for Truly Unknown Data
```typescript
// Bad
function parseJson(json: string): any {
  return JSON.parse(json)
}

// Good
function parseJson(json: string): unknown {
  return JSON.parse(json)
}

// Then use type guards
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'name' in data
}
```

## React Component Guidelines

### Component Props
```typescript
// Good: Interface for props
interface ComponentProps {
  title: string
  onSubmit: (data: FormData) => void
  isLoading?: boolean
}

// Good: Named function component
export function ComponentName({ title, onSubmit, isLoading = false }: ComponentProps) {
  // Component logic
}
```

### Custom Hooks
```typescript
// Good: Custom hooks for logic
function useWorkflowLogic() {
  const store = useWorkflowStore()
  // Hook logic
  return { /* exposed API */ }
}
```

## Node Architecture Examples

Our modular node architecture demonstrates proper typing:

```typescript
// Good - Proper interfaces
interface ManualExecutionResult {
  triggered: boolean
  timestamp: Date
  triggeredBy?: string
}

// Good - Typed context
export function createTestContext(overrides: Partial<NodeExecutionContext> = {}): NodeExecutionContext {
  return {
    nodeId: 'test-node-1',
    workflowId: 'test-workflow-1',
    config: {},
    input: {},
    previousNodes: [],
    executionId: 'test-execution-1',
    ...overrides
  }
}

// Good - Type assertions instead of any
const output = result.output as ManualExecutionResult
expect(output.triggered).toBe(true)
```

## Legitimate `any` Usage

In rare cases where `any` is truly necessary (e.g., React component prop forwarding), use the ESLint disable comment:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
return <Component {...(props as any)} />
```

## Testing the Prevention System

To verify the system works:

```bash
# This should fail:
echo "const bad: any = {};" > test-any.ts
git add test-any.ts
git commit -m "test"  # Should be blocked by pre-commit hook

# This should pass:
echo "// eslint-disable-next-line @typescript-eslint/no-explicit-any" > test-any.ts
echo "const ok: any = {}; // Legitimate use case" >> test-any.ts
git add test-any.ts
git commit -m "test"  # Should pass with disable comment
```

## Troubleshooting

### Pre-commit Hook Not Running
```bash
# Reinstall husky hooks
npm run prepare
```

### CI Failing on Any Types
1. Check the CI logs for specific files and lines
2. Either add proper types or use eslint-disable for legitimate cases
3. Ensure all changes are properly typed before pushing

### False Positives
If the any-scanner flags legitimate usage:
1. Add the eslint-disable comment
2. Update the scanning script if needed
3. Document the legitimate use case

## Benefits

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Autocomplete, refactoring, navigation
3. **Self-Documenting**: Types serve as documentation
4. **Maintainability**: Easier to understand and modify code
5. **Fewer Runtime Errors**: Type checking prevents many bugs
6. **Code Quality**: Maintains high standards across the codebase
7. **Developer Experience**: Provides clear feedback on type issues
8. **CI/CD Integration**: Automated enforcement without manual oversight
9. **Team Consistency**: Ensures all team members follow type safety practices

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript-ESLint Rules](https://typescript-eslint.io/rules/)
- [Effective TypeScript Book](https://effectivetypescript.com/)
