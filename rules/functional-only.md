# Rule: Functional Programming Only

**Prefer functional programming over object-oriented programming.**

## Avoid

- `class` keyword (unless required by a library interface)
- `this` keyword
- `new` keyword (except for `Error`, `Map`, `Set`, `Date`)
- Mutable state patterns
- Inheritance hierarchies

## Prefer

- Arrow functions and function composition
- `const`/`let` over `var`
- Immutable data (spread, `.map()`, `.filter()`, `.reduce()`)
- Pure functions with explicit inputs and outputs
- Effect-TS for side effects, error handling, and resource management
- Higher-order functions and currying
- Pattern matching over switch/case where possible

## Effect-TS

Use Effect-TS for production applications:
- `Effect.gen(function* () { ... })` for composable effects
- `Schema` for runtime validation (not Zod)
- `Layer` for dependency injection (not classes)
- `Fiber` for concurrency (not raw Promises)
