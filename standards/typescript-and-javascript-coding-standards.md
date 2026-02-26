# TypeScript & JavaScript Coding Standards

## 1. Guiding Philosophy & Principles

Our development approach is guided by a set of robust, time-tested principles. These philosophies inform our choice of tools, our coding style, and how we structure our applications.

### 1.1. The Unix Philosophy (Adapted for Modern Development)

We adopt the 17 rules from "The Art of Unix Programming" as our foundational philosophy. They guide us toward building simple, composable, and maintainable software.

1. **Rule of Modularity:** Write simple parts connected by clean interfaces.
    * *Our Interpretation:* Build small, single-responsibility functions and modules. Use clear type definitions (`type`, `interface`) as contracts between them.

2. **Rule of Clarity:** Clarity is better than cleverness.
    * *Our Interpretation:* Write code that is easy for humans to read and understand. Avoid overly complex one-liners or "magic" that obscures intent.

3. **Rule of Composition:** Design programs to be connected to other programs.
    * *Our Interpretation:* Write pure functions that can be easily composed. Our APIs should return standard data formats (JSON) that other services can consume.

4. **Rule of Separation:** Separate policy from mechanism; separate interfaces from engines.
    * *Our Interpretation:* Business logic (policy) should be separate from data fetching or utility functions (mechanism). A function that calculates a value should not be responsible for fetching the data it needs.

5. **Rule of Simplicity:** Design for simplicity; add complexity only where you must.
    * *Our Interpretation:* Start with the simplest possible solution. Do not add abstractions or patterns until they are clearly needed to solve a problem (e.g., avoid premature optimization).

6. **Rule of Parsimony:** Write a big program only when it is clear by demonstration that nothing else will do.
    * *Our Interpretation:* Build small, focused services or applications. Avoid monolithic architectures unless absolutely necessary.

7. **Rule of Transparency:** Design for visibility to make inspection and debugging easier.
    * *Our Interpretation:* Use clear variable names and pure functions. Well-structured, functional code is inherently easier to trace and debug than stateful, object-oriented code.

8. **Rule of Robustness:** Robustness is the child of transparency and simplicity.
    * *Our Interpretation:* Simple, clear code with well-defined inputs and outputs (enforced by TypeScript and Effect-TS Schema) is less likely to contain bugs.

9. **Rule of Representation:** Fold knowledge into data so program logic can be stupid and robust.
    * *Our Interpretation:* Use declarative configuration objects (JSON, JS objects) instead of imperative code where possible. Let your program read data to decide what to do.

10. **Rule of Least Surprise:** In interface design, always do the least surprising thing.
    * *Our Interpretation:* Functions and APIs should behave as their names suggest. A function called `getUser` should get a user, not delete one.

11. **Rule of Silence:** When a program has nothing surprising to say, it should say nothing.
    * *Our Interpretation:* Avoid excessive logging for normal operations. Log errors and important lifecycle events, but not noise.

12. **Rule of Repair:** Repair what you can, but when you must fail, fail noisily and as early as possible.
    * *Our Interpretation:* Use Effect-TS Schema (or Zod as fallback) to validate data at the boundaries of your application. If validation fails, throw an error immediately rather than letting corrupt data propagate.

13. **Rule of Economy:** Programmer time is expensive; conserve it in preference to machine time.
    * *Our Interpretation:* Use high-leverage tools like Bun and oxc that are fast and simple to configure. Write clear code that is easy to maintain, even if it's slightly less performant in a micro-benchmark.

14. **Rule of Generation:** Avoid hand-hacking; write programs to write programs when you can.
    * *Our Interpretation:* Use code generation where it makes sense (e.g., generating types from a GraphQL schema or OpenAPI spec).

15. **Rule of Optimization:** Prototype before polishing. Get it working before you optimize it.
    * *Our Interpretation:* Make it work, make it right, then make it fast (if necessary). Use profiling tools to find actual bottlenecks before optimizing.

16. **Rule of Diversity:** Distrust all claims for "one true way".
    * *Our Interpretation:* While these standards provide a strong default, be open to new tools and patterns if they demonstrably solve a problem better.

17. **Rule of Extensibility:** Design for the future, because it will be here sooner than you think.
    * *Our Interpretation:* Write composable functions and design modular systems. This makes it easier to add new features without rewriting existing code.

### 1.2. Core Coding Principles

* **Functional over Object-Oriented:** We prefer functional programming paradigms for their predictability, testability, and clarity.
* **Effect-TS First:** Use Effect-TS for production-ready applications with functional effect systems, type-safe error handling, and resource management.
* **Immutability by Default:** Never mutate data. Create new data structures instead.
* **Strongly Typed:** Leverage TypeScript for static analysis.
* **Runtime Validated:** Use Effect-TS Schema (or Zod as fallback) to validate all data entering the system.

---

## 2. Development Environment: The Bun Ecosystem

All development **MUST** be done using Bun. It is our single, unified toolchain (see @/home/bodnar/.claude/references/bun.md)

**Effect-TS** is our preferred library for building production-ready TypeScript applications with functional effect systems (see @/home/bodnar/.claude/references/effect-ts.md)

* **Runtime:** `bun run src/index.ts`
* **Package Manager:** `bun --bun install`, `bun --bun add`, `bun remove`
* **Test Runner:** `bun test`
* **Bundler:** `bun build --compile`

### `package.json` Scripts

```json
{
  "name": "my-bun-project",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist",
    "test": "bun test",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "prettier --write .",
    "quality": "oxlint && prettier --check ."
  },
  "dependencies": { "effect": "latest", "@effect/schema": "latest" },
  "devDependencies": { "oxlint": "latest", "prettier": "latest", "@prettier/plugin-oxc": "latest", "typescript": "latest" }
}
```

---

## 3. Tooling & Configuration

### 3.1. Linter & Formatter: oxc + Prettier

We use oxc (oxlint) for lightning-fast linting and Prettier with the oxc plugin for consistent formatting.

**`.oxlintrc.json`**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "rules": {
    "typescript": "all",
    "suspicious": "all",
    "correctness": "all",
    "style": "all",
    "pedantic": "warn"
  },
  "fix": true,
  "import-plugin": true,
  "jsdoc-plugin": true
}
```

**`.prettierrc.yml`**

```yaml
parser: typescript
plugins:
  - "@prettier/plugin-oxc"
semi: true
singleQuote: true
trailingComma: es5
printWidth: 80
tabWidth: 2
organizeImportsSkipDestructiveCodeActions: true
```

### 3.2. TypeScript Configuration (`tsconfig.json`)

This file is essential for static type analysis and editor intelligence.

**`tsconfig.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

---

## 4. Coding Standards & Best Practices

### 4.1. Effect-TS and Functional Programming

We **MUST** use Effect-TS for production applications and favor functional programming paradigms. Avoid `class`, `this`, and `new` unless interfacing with a library that requires them.

#### 4.1.1. Effect-TS Integration

Effect-TS provides a comprehensive functional effect system with type-safe error handling, resource management, and fiber-based concurrency:

```typescript
import { Effect, Console, pipe } from 'effect';

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

    const userData = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) => new ParseError({ error })
    });

    return userData;
  });

// Execute the effect
const program = pipe(
  fetchUserData('123'),
  Effect.tap((user) => Console.log(`Found user: ${user.name}`)),
  Effect.catchAll((error) => Console.error(`Failed: ${error.message}`))
);

Effect.runPromise(program);
```

#### 4.1.2. Why Effect-TS Over Vanilla TypeScript

```typescript
// Bad: Promise-based approach with manual error handling
const fetchUserDataPromise = async (id: string) => {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`User ${id} not found`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

// Good: Effect-TS approach with typed error handling
const fetchUserDataEffect = (id: string) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(`/api/users/${id}`),
      catch: (error) => new NetworkError({ cause: error })
    });

    if (!response.ok) {
      yield* Effect.fail(new UserNotFoundError({ id }));
    }

    return yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) => new ParseError({ cause: error })
    });
  });
```

* **Immutability:** Data structures are never changed in place. Use non-mutating methods (`.map`, `.filter`, `.reduce`) and the spread syntax (`...`) to create new versions of objects and arrays.

    ```typescript
    // Good: Immutable update
    const user = { id: 1, name: 'Alice', status: 'active' };
    const updatedUser = { ...user, status: 'inactive' };

    // Bad: Mutation and side effects
    user.status = 'inactive';
    ```

* **Pure Functions:** A function is pure if its return value is determined only by its input values, and it has no observable side effects.

    ```typescript
    // Good: Pure function
    const calculateTotalPrice = (price: number, taxRate: number): number => {
      return price * (1 + taxRate);
    };

    // Bad: Impure function (relies on and modifies external state)
    let globalTaxRate = 0.07;
    const calculateTotalPriceImpure = (price: number): number => {
      return price * (1 + globalTaxRate);
    };
    ```

* **Function Composition:** Build complex functionality by composing small, reusable functions together.

    ```typescript
    // Good: Small functions composed together
    const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T) =>
      fns.reduce((acc, fn) => fn(acc), value);

    const trim = (s: string) => s.trim();
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const exclaim = (s: string) => `${s}!`;

    const formatGreeting = pipe(trim, capitalize, exclaim);
    const result = formatGreeting('  hello world  '); // => "Hello world!"
    ```

* **Higher-Order Functions & Currying:** Functions can accept other functions as arguments or return new functions. This is powerful for creating configurable, reusable logic.

    ```typescript
    // Good: Curried function for creating configured loggers
    type LogLevel = 'DEBUG' | 'INFO' | 'ERROR';

    const createLogger = (level: LogLevel) => (message: string): void => {
      console.log(`[${level}] - ${message}`);
    };

    const logInfo = createLogger('INFO');
    const logError = createLogger('ERROR');

    logInfo('User successfully logged in.');
    logError('Failed to fetch data.');
    ```

* **Why We Avoid OOP:**

    ```typescript
    // Bad: Class-based approach
    // - Introduces state (`this.text`) which can be hard to reason about.
    // - `this` keyword can be confusing.
    // - Less composable than pure functions.
    class StringFormatter {
      private text: string;

      constructor(text: string) {
        this.text = text;
      }

      trim() {
        this.text = this.text.trim();
        return this; // For chaining, which encourages mutation
      }

      capitalize() {
        this.text = this.text.charAt(0).toUpperCase() + this.text.slice(1);
        return this;
      }

      exclaim() {
        this.text = `${this.text}!`;
        return this;
      }

      getValue() {
        return this.text;
      }
    }

    const formatter = new StringFormatter('  hello world  ');
    const result = formatter.trim().capitalize().exclaim().getValue(); // => "Hello world!"
    ```

### 4.2. Runtime Data Validation with Effect-TS Schema

All external data **MUST** be validated at the system boundary. We use Effect-TS Schema as our primary validation library, with Zod as a fallback for legacy systems.

#### 4.2.1. Effect-TS Schema (Recommended)

```typescript
import { Effect, pipe } from 'effect';
import { Schema } from '@effect/schema';

// Define schema with Effect-TS Schema
const UserSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)), // UUID pattern
  username: Schema.String.pipe(Schema.minLength(3)),
  email: Schema.String.pipe(Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/)), // Email pattern
  createdAt: Schema.DateFromString, // Converts string to Date
});

// Infer TypeScript type from schema
export type User = Schema.Type<typeof UserSchema>;

// Effect-TS validation function
const parseUserData = (data: unknown) =>
  Schema.decodeUnknown(UserSchema)(data);

// Use in Effect pipelines
const validateAndProcessUser = (rawData: unknown) =>
  pipe(
    parseUserData(rawData),
    Effect.flatMap((user) => processUser(user)),
    Effect.catchAll((error) => Effect.fail(new ProcessingError({ cause: error })))
  );

// Execute the validation effect
const program = pipe(
  validateAndProcessUser(unknownUserData),
  Effect.catchAll((error) =>
    Effect.sync(() => console.error('Validation failed:', error))
  )
);

Effect.runPromise(program);
```

#### 4.2.2. Advanced Effect-TS Schema Patterns

```typescript
import { Schema } from '@effect/schema';
import { Effect, pipe } from 'effect';

// Branded types for domain modeling
const UserId = Schema.String.pipe(Schema.brand('UserId'));
const Email = Schema.String.pipe(
  Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/),
  Schema.brand('Email')
);

// Complex schema with transformations
const UserCreateSchema = Schema.Struct({
  username: Schema.String.pipe(Schema.minLength(3)),
  email: Email,
  age: Schema.Number.pipe(Schema.between(13, 120)),
  preferences: Schema.optional(Schema.Record(Schema.String, Schema.Unknown))
});

// Transform schema for API responses
const UserResponseSchema = Schema.Struct({
  id: UserId,
  username: Schema.String,
  email: Email,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString
});

// Schema composition and validation
const validateUserCreate = (data: unknown) =>
  pipe(
    Schema.decodeUnknown(UserCreateSchema)(data),
    Effect.map((user) => ({ ...user, id: generateUserId() })),
    Effect.flatMap((user) => saveUserToDatabase(user))
  );
```

#### 4.2.3. Zod Fallback (Legacy Systems)

For legacy systems or when Effect-TS Schema is not available, use Zod with similar patterns:

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3),
  email: z.string().email(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// Validation function
function parseUserData(data: unknown): User {
  try {
    return UserSchema.parse(data);
  } catch (error) {
    console.error('API validation failed:', error);
    throw new Error('Received invalid user data from the server.');
  }
}
```

### 4.3. Naming Conventions

* **`camelCase`** for variables and functions.
* **`PascalCase`** for types, interfaces, Zod schemas, and Vue/Astro components.
* **`UPPER_CASE_SNAKE_CASE`** for constants.

### 4.4. Asynchronous Code

* **Effect-TS First:** Use Effect-TS for async operations with proper error handling and resource management.
* **Fallback to async/await:** When not using Effect-TS, use `async/await` with proper error handling.
* **Avoid raw Promises:** Prefer Effect-TS effects or async/await over raw Promise chains.

#### 4.4.1. Effect-TS Async Patterns

```typescript
import { Effect, pipe } from 'effect';

// Good: Effect-TS async composition
const fetchAndProcessData = (id: string) =>
  pipe(
    Effect.tryPromise({
      try: () => fetch(`/api/data/${id}`),
      catch: (error) => new FetchError({ id, error })
    }),
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () => response.json(),
        catch: (error) => new ParseError({ error })
      })
    ),
    Effect.flatMap((data) => processData(data)),
    Effect.retry({
      schedule: Schedule.exponential('100 millis'),
      times: 3
    })
  );

// Execute with proper error handling
const program = pipe(
  fetchAndProcessData('123'),
  Effect.catchAll((error) =>
    Effect.sync(() => console.error('Operation failed:', error))
  )
);

Effect.runPromise(program);
```

#### 4.4.2. Traditional Async/Await (when not using Effect-TS)

* Always use `async/await`. It's syntactic sugar over Promises and fits perfectly into a functional style.
* Wrap `await` calls in `try...catch` blocks for error handling.

---

## 5. Alternative Tooling: ESLint + Prettier

If a project requires a setup oxc cannot accommodate, the classic ESLint + Prettier stack is the approved alternative. All philosophical and coding standards still apply.

**Installation:**

```bash
bun add -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier eslint-plugin-import
```

**`.eslintrc.js`**

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended', // Must be last
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
    'import/order': [
      'error',
      {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        'pathGroups': [{ 'pattern': '@/**', 'group': 'internal' }],
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
      }
    ],
  },
};
```

**`.prettierrc.js`**

```javascript
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
};
```
