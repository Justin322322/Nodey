# TypeScript Guidelines - No `any` Policy

## Overview

This project has strict TypeScript rules to prevent `any` usage and maintain type safety. The goal is to eliminate all `any` types from our codebase.

## Rules in Place

### TypeScript Compiler Options
- `noImplicitAny: true` - Prevents implicit any types
- `noImplicitReturns: true` - Requires explicit return types
- `noImplicitThis: true` - Prevents implicit any for `this`

### ESLint Rules
- `@typescript-eslint/no-explicit-any` - Ban explicit `any` usage
- `@typescript-eslint/no-unsafe-assignment` - Prevent unsafe any assignments
- `@typescript-eslint/no-unsafe-call` - Prevent unsafe any function calls
- `@typescript-eslint/no-unsafe-member-access` - Prevent unsafe property access
- `@typescript-eslint/no-unsafe-return` - Prevent unsafe any returns
- `@typescript-eslint/no-unsafe-argument` - Prevent unsafe any arguments

## How to Check for `any` Usage

### During Development
```bash
# Check for any usage with warnings
npm run lint:warn-any

# Check for any usage with errors (strict mode)
npm run lint:check-any

# Normal typecheck (catches implicit any)
npm run typecheck
```

### CI/CD Integration
The CI will run `npm run typecheck` which will catch:
- Implicit any types
- TypeScript compilation errors

Future CI enhancement can add `lint:check-any` to enforce zero `any` usage.

## Migration Strategy

### Current Status
- **Warnings**: Existing `any` usage shows as warnings (135+ instances)
- **New Code**: All new code should be properly typed
- **Gradual Migration**: Fix `any` usage incrementally

### How to Fix `any` Usage

#### Instead of `any`, use:

1. **Specific Types**
   ```typescript
   // ❌ Bad
   function process(data: any): any {
     return data.result
   }
   
   // ✅ Good
   interface ProcessResult {
     result: string
     status: number
   }
   function process(data: ProcessResult): string {
     return data.result
   }
   ```

2. **Generic Types**
   ```typescript
   // ❌ Bad
   function identity(arg: any): any {
     return arg
   }
   
   // ✅ Good
   function identity<T>(arg: T): T {
     return arg
   }
   ```

3. **Union Types**
   ```typescript
   // ❌ Bad
   function format(value: any): string {
     return String(value)
   }
   
   // ✅ Good
   function format(value: string | number | boolean): string {
     return String(value)
   }
   ```

4. **Unknown for Truly Unknown Data**
   ```typescript
   // ❌ Bad
   function parseJson(json: string): any {
     return JSON.parse(json)
   }
   
   // ✅ Good
   function parseJson(json: string): unknown {
     return JSON.parse(json)
   }
   
   // Then use type guards
   function isUser(data: unknown): data is User {
     return typeof data === 'object' && data !== null && 'name' in data
   }
   ```

## Node Architecture Examples

Our new modular node architecture demonstrates proper typing:

```typescript
// ✅ Good - Proper interfaces
interface ManualExecutionResult {
  triggered: boolean
  timestamp: Date
  triggeredBy?: string
}

// ✅ Good - Typed context
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

// ✅ Good - Type assertions instead of any
const output = result.output as ManualExecutionResult
expect(output.triggered).toBe(true)
```

## Benefits

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Autocomplete, refactoring, navigation
3. **Self-Documenting**: Types serve as documentation
4. **Maintainability**: Easier to understand and modify code
5. **Fewer Runtime Errors**: Type checking prevents many bugs

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript-ESLint Rules](https://typescript-eslint.io/rules/)
- [Effective TypeScript Book](https://effectivetypescript.com/)
