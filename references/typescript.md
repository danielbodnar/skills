# TypeScript Reference

**Always remember to reference @$HOME/.claude/references/typescript.md and look for snippets and examples in @$HOME/.claude/snippets/typescript/**

## Quick Reference

- Installation: `bun add -d typescript @types/node`
- Bun Runtime: `bun --bun run file.ts`
- Compilation: `bunx tsc`
- Type Checking: `bunx tsc --noEmit`
- Documentation: <https://www.typescriptlang.org/docs/>
- GitHub: <https://github.com/microsoft/TypeScript>
- Package: <https://www.npmjs.com/package/typescript>

## Core Principles

### Effect-TS for Production Applications

Use Effect-TS for production-ready TypeScript applications with functional effect systems, type-safe error handling, and resource management. See `@$HOME/.claude/references/effect-ts.md` for comprehensive guidance.

```typescript
import { Effect, pipe } from 'effect';

// Good: Effect-TS approach with composable effects
const fetchUserData = (id: string) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(`/api/users/${id}`),
      catch: (error) => new FetchError({ id, error })
    });
    
    if (!response.ok) {
      yield* Effect.fail(new UserNotFoundError({ id }));
    }
    
    return yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) => new ParseError({ error })
    });
  });

// Execute with proper error handling
const program = pipe(
  fetchUserData('123'),
  Effect.catchAll((error) => 
    Effect.sync(() => console.error('Operation failed:', error))
  )
);

Effect.runPromise(program);
```

### NEVER Use 'any' Type

TypeScript's primary value is type safety. Using `any` defeats this purpose:

```typescript
// ❌ Bad - defeats type safety
function process(data: any): any {
  return data.whatever.something;
}

// ✅ Good - use unknown with type guards
function process(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value);
  }
  throw new Error('Invalid data');
}
```

### Strict Mode Always

Enable all strict compiler options for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

## Resources and Documentation

### Official Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
  - [Basic Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
  - [Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
  - [Type Manipulation](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
  - [Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
  - [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
  - [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

### Compiler Configuration

- [tsconfig.json Reference](https://www.typescriptlang.org/tsconfig)
  - [Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
  - [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
  - [Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
  - [Triple-Slash Directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)

### Type System Deep Dive

- [Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#typeof-type-guards)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

### Best Practices

- [TypeScript Coding Guidelines](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)
- [Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Performance Guidelines](https://github.com/microsoft/TypeScript/wiki/Performance)
- [Breaking Changes](https://github.com/microsoft/TypeScript/wiki/Breaking-Changes)

### Integration Guides

- [TypeScript with Bun](https://bun.sh/guides/runtime/typescript)
- [TypeScript with Node.js](https://nodejs.org/en/learn/getting-started/nodejs-with-typescript)
- [TypeScript with Vite](https://vitejs.dev/guide/features.html#typescript)
- [TypeScript with ESLint](https://typescript-eslint.io/getting-started/)
- [TypeScript with Prettier](https://prettier.io/docs/en/configuration.html)

### Advanced Topics

- [Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [Ambient Modules](https://www.typescriptlang.org/docs/handbook/modules.html#ambient-modules)
- [Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- [Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/typescript/`:

- `basic-usage.ts` - Fundamental TypeScript patterns
- `strict-configuration.ts` - Complete tsconfig.json configurations
- `avoid-any-patterns.ts` - Alternatives to 'any' type
- `type-guards.ts` - Type narrowing and runtime checks
- `advanced-patterns.ts` - Advanced type system features
- `error-handling.ts` - Type-safe error handling
- `integration-patterns.ts` - External system integration

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/typescript/schemas/`:

- `tsconfig.schema.json` - JSON Schema for tsconfig.json
- `types.d.ts` - Common type definitions and utilities

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/typescript/linting/`:

- `biome.json` - Biome configuration with strict TypeScript rules

## Key Features and Best Practices

### Effect-TS Integration

- Use Effect-TS for production applications with functional effect systems
- Leverage Effect-TS for type-safe error handling and resource management
- Use Effect-TS generators (`Effect.gen`) for composable async operations
- Integrate with Bun platform using `@effect/platform-bun`

### Type Safety First

- Always use explicit types for function parameters and return values
- Prefer `unknown` over `any` for truly unknown values
- Use type guards for runtime type checking
- Enable all strict compiler options

### Modern TypeScript Features (5.6+)

- **Template Literal Types**: Create complex string patterns
- **Branded Types**: Add semantic meaning to primitives
- **Satisfies Operator**: Type checking without widening
- **Const Assertions**: Preserve literal types
- **Import Type**: Import only type information

### Configuration Best Practices

- Use `"moduleResolution": "bundler"` for modern bundlers
- Enable `"isolatedModules": true` for better tooling
- Use `"verbatimModuleSyntax": true` for explicit imports
- Set `"target": "ES2024"` for modern JavaScript features

### Performance Optimization

- Enable `"skipLibCheck": true` for faster compilation
- Use `"incremental": true` for faster rebuilds
- Set appropriate `"lib"` array instead of including all libs
- Use project references for large codebases

### Error Handling Patterns

- **Effect-TS (Recommended)**: Use Effect-TS for type-safe error handling with `Effect.fail()` and `Effect.catchAll()`
- **Alternative**: Use Result types instead of throwing exceptions
- Implement custom error classes with proper typing
- Use assertion functions for runtime validation
- Prefer discriminated unions for error states

```typescript
// Good: Effect-TS error handling
const safeOperation = (data: unknown) =>
  Effect.gen(function* () {
    const validated = yield* Effect.try({
      try: () => schema.parse(data),
      catch: (error) => new ValidationError({ error })
    });
    
    const result = yield* Effect.tryPromise({
      try: () => processData(validated),
      catch: (error) => new ProcessingError({ error })
    });
    
    return result;
  });
```

### Integration Patterns

- **Effect-TS (Recommended)**: Use Effect-TS services and layers for dependency injection
- **Effect-TS Schema**: Use Effect-TS Schema for runtime validation and type safety
- Use branded types for external API data
- Implement type guards for API responses
- Use generic constraints for database operations
- Type event systems with discriminated unions

```typescript
import { Schema } from '@effect/schema';
import { Effect, Context, Layer } from 'effect';

// Schema-first approach
const UserSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.brand('UserId')),
  username: Schema.String.pipe(Schema.minLength(3)),
  email: Schema.String.pipe(Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/)),
  createdAt: Schema.DateFromString
});

type User = Schema.Type<typeof UserSchema>;

// Effect-TS service pattern with Schema validation
const UserService = Context.Tag<{
  getUser: (id: string) => Effect.Effect<User, UserError>
  createUser: (data: unknown) => Effect.Effect<User, ValidationError>
}>();

const UserServiceLive = Layer.succeed(
  UserService,
  UserService.of({
    getUser: (id) => 
      Effect.gen(function* () {
        const userData = yield* fetchUserFromDatabase(id);
        return yield* Schema.decodeUnknown(UserSchema)(userData);
      }),
    createUser: (data) => 
      Effect.gen(function* () {
        const validated = yield* Schema.decodeUnknown(UserSchema)(data);
        return yield* saveUserToDatabase(validated);
      })
  })
);
```

## TypeScript 5.6+ Specific Features

### Disallowed Code Analysis

- Stricter checks for unreachable code
- Better detection of unused variables
- Improved control flow analysis

### Iterator Helper Methods

- Native support for iterator helpers
- Better type inference for async iterators
- Improved array method type checking

### Strict Built-in Iterator Return Types

- More accurate return types for built-in iterators
- Better type safety for iterator protocols
- Improved generator function typing

### Arbitrary Module Identifiers

- Support for non-standard module identifiers
- Better compatibility with modern bundlers
- Improved module resolution algorithms

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

- Use interfaces for object shapes
- Prefer union types over enums when possible
- Use const assertions for immutable data
- Implement proper error boundaries
- Use utility types for type transformations

### ❌ Anti-Patterns

- Never use `any` type
- Avoid function overloads when unions suffice
- Don't use `Function` type (use specific signatures)
- Avoid deep inheritance hierarchies
- Don't ignore TypeScript errors

## Troubleshooting Common Issues

### Type Errors

- Use `// @ts-expect-error` for intentional errors
- Add proper type annotations to resolve inference issues
- Use type assertions sparingly and safely
- Check compiler options for strict mode conflicts

### Performance Issues

- Enable `skipLibCheck` for faster compilation
- Use incremental compilation for large projects
- Check for circular dependencies
- Optimize import statements

### Integration Issues

- Ensure proper module resolution settings
- Check for conflicting type definitions
- Verify bundler compatibility settings
- Use appropriate `lib` configurations

## Development Workflow

### Recommended Tools

- **Effect-TS**: Functional effect systems for production applications
- **Biome**: Modern linting and formatting
- **Bun**: Fast JavaScript runtime and package manager
- **TypeScript**: Latest version (5.6+)
- **VS Code**: Best TypeScript editor support

### Build Process

1. **Install Effect-TS**: `bun add effect @effect/schema @effect/platform-bun` (for production apps)
2. **Type Check**: `bunx tsc --noEmit`
3. **Lint**: `bunx biome check`
4. **Format**: `bunx biome format --write`
5. **Test**: `bun test`
6. **Build**: `bun run build`

### CI/CD Integration

- Use `--strict` mode in CI
- Enable `--noEmitOnError` for production builds
- Run type checking before deployment
- Use incremental builds for performance

## Migration Strategies

### From JavaScript

1. Rename `.js` files to `.ts`
2. Enable `allowJs` and `checkJs`
3. Add type annotations gradually
4. Enable strict mode incrementally

### From Older TypeScript

1. Update to latest TypeScript version
2. Enable new strict options one by one
3. Replace `any` types with proper types
4. Update deprecated syntax

### To Modern Standards

1. Use `"moduleResolution": "bundler"`
2. Enable `"verbatimModuleSyntax"`
3. Use `"target": "ES2024"`
4. Update to latest utility types

## See Also

- Complete reference: `@$HOME/.claude/references/typescript.md`
- Coding Styles and Best Practices: @$HOME/.claude/standards/
- Code examples: `@$HOME/.claude/snippets/typescript/`
- Schemas: `@$HOME/.claude/snippets/typescript/schemas/`
- Linting configs: `@$HOME/.claude/snippets/typescript/linting/`
