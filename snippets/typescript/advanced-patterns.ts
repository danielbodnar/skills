// TypeScript Advanced Patterns - Type System Mastery
// Advanced typing patterns for complex scenarios

// ✅ Mapped Types
type Optional<T> = {
  [K in keyof T]?: T[K];
};

type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

type Required<T> = {
  [K in keyof T]-?: T[K];
};

type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type NonNullable<T> = {
  [K in keyof T]: T[K] extends null | undefined ? never : T[K];
};

// ✅ Conditional Types
type IsArray<T> = T extends readonly any[] ? true : false;
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;
type IsObject<T> = T extends object ? true : false;

type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
type FunctionReturn<T> = T extends (...args: any[]) => infer R ? R : never;
type FunctionParams<T> = T extends (...args: infer P) => any ? P : never;

// ✅ Template Literal Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type ApiVersion = 'v1' | 'v2' | 'v3';
type ApiEndpoint = `api/${ApiVersion}/${string}`;
type HttpUrl = `${'http' | 'https'}://${string}`;

type EventName<T extends string> = `on${Capitalize<T>}`;
type EventHandler<T extends string> = `handle${Capitalize<T>}`;

// ✅ Recursive Types
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

// ✅ Utility Types for Object Manipulation
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Omit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

// ✅ Brand Types for Type Safety
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;
type Email = Brand<string, 'Email'>;
type Timestamp = Brand<number, 'Timestamp'>;

function createUserId(id: string): UserId {
  return id as UserId;
}

function createEmail(email: string): Email {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email format');
  }
  return email as Email;
}

function createTimestamp(): Timestamp {
  return Date.now() as Timestamp;
}

// ✅ Discriminated Unions
interface Circle {
  kind: 'circle';
  radius: number;
}

interface Rectangle {
  kind: 'rectangle';
  width: number;
  height: number;
}

interface Triangle {
  kind: 'triangle';
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${JSON.stringify(shape)}`);
  }
}

// ✅ Higher-Order Types
type Predicate<T> = (value: T) => boolean;
type Mapper<T, U> = (value: T) => U;
type Reducer<T, U> = (accumulator: U, current: T) => U;

interface Functor<T> {
  map<U>(f: Mapper<T, U>): Functor<U>;
}

interface Monad<T> extends Functor<T> {
  flatMap<U>(f: Mapper<T, Monad<U>>): Monad<U>;
}

// ✅ Option/Maybe Type
abstract class Option<T> implements Monad<T> {
  abstract map<U>(f: Mapper<T, U>): Option<U>;
  abstract flatMap<U>(f: Mapper<T, Option<U>>): Option<U>;
  abstract getOrElse(defaultValue: T): T;
  abstract isEmpty(): boolean;
  abstract isSome(): boolean;
  
  static some<T>(value: T): Option<T> {
    return new Some(value);
  }
  
  static none<T>(): Option<T> {
    return new None<T>();
  }
  
  static fromNullable<T>(value: T | null | undefined): Option<T> {
    return value == null ? Option.none() : Option.some(value);
  }
}

class Some<T> extends Option<T> {
  constructor(private value: T) {
    super();
  }
  
  map<U>(f: Mapper<T, U>): Option<U> {
    return Option.some(f(this.value));
  }
  
  flatMap<U>(f: Mapper<T, Option<U>>): Option<U> {
    return f(this.value);
  }
  
  getOrElse(_defaultValue: T): T {
    return this.value;
  }
  
  isEmpty(): boolean {
    return false;
  }
  
  isSome(): boolean {
    return true;
  }
}

class None<T> extends Option<T> {
  map<U>(_f: Mapper<T, U>): Option<U> {
    return new None<U>();
  }
  
  flatMap<U>(_f: Mapper<T, Option<U>>): Option<U> {
    return new None<U>();
  }
  
  getOrElse(defaultValue: T): T {
    return defaultValue;
  }
  
  isEmpty(): boolean {
    return true;
  }
  
  isSome(): boolean {
    return false;
  }
}

// ✅ Result Type for Error Handling
abstract class Result<T, E> {
  abstract map<U>(f: Mapper<T, U>): Result<U, E>;
  abstract mapError<F>(f: Mapper<E, F>): Result<T, F>;
  abstract flatMap<U>(f: Mapper<T, Result<U, E>>): Result<U, E>;
  abstract getOrElse(defaultValue: T): T;
  abstract isOk(): boolean;
  abstract isError(): boolean;
  
  static ok<T, E>(value: T): Result<T, E> {
    return new Ok(value);
  }
  
  static error<T, E>(error: E): Result<T, E> {
    return new Error(error);
  }
  
  static fromTryCatch<T>(fn: () => T): Result<T, Error> {
    try {
      return Result.ok(fn());
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

class Ok<T, E> extends Result<T, E> {
  constructor(private value: T) {
    super();
  }
  
  map<U>(f: Mapper<T, U>): Result<U, E> {
    return Result.ok(f(this.value));
  }
  
  mapError<F>(_f: Mapper<E, F>): Result<T, F> {
    return Result.ok(this.value);
  }
  
  flatMap<U>(f: Mapper<T, Result<U, E>>): Result<U, E> {
    return f(this.value);
  }
  
  getOrElse(_defaultValue: T): T {
    return this.value;
  }
  
  isOk(): boolean {
    return true;
  }
  
  isError(): boolean {
    return false;
  }
}

class Error<T, E> extends Result<T, E> {
  constructor(private error: E) {
    super();
  }
  
  map<U>(_f: Mapper<T, U>): Result<U, E> {
    return Result.error(this.error);
  }
  
  mapError<F>(f: Mapper<E, F>): Result<T, F> {
    return Result.error(f(this.error));
  }
  
  flatMap<U>(_f: Mapper<T, Result<U, E>>): Result<U, E> {
    return Result.error(this.error);
  }
  
  getOrElse(defaultValue: T): T {
    return defaultValue;
  }
  
  isOk(): boolean {
    return false;
  }
  
  isError(): boolean {
    return true;
  }
}

// ✅ Advanced Generic Constraints
interface Serializable {
  serialize(): string;
}

interface Deserializable<T> {
  deserialize(data: string): T;
}

interface Comparable<T> {
  compareTo(other: T): number;
}

interface Hashable {
  hash(): number;
}

// ✅ Type-Level Programming
type Length<T extends readonly any[]> = T['length'];

type Head<T extends readonly any[]> = T extends readonly [infer H, ...any[]] ? H : never;

type Tail<T extends readonly any[]> = T extends readonly [any, ...infer T] ? T : never;

type Concat<A extends readonly any[], B extends readonly any[]> = [...A, ...B];

type Reverse<T extends readonly any[]> = T extends readonly [...infer Rest, infer Last]
  ? [Last, ...Reverse<Rest>]
  : [];

// ✅ Object Path Types
type PathKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? T[K] extends object
          ? K | `${K}.${PathKeys<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

// ✅ Function Composition
type Compose<F, G> = F extends (a: any) => infer B
  ? G extends (b: B) => infer C
    ? (a: Parameters<F>[0]) => C
    : never
  : never;

function compose<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C {
  return (a: A) => g(f(a));
}

// ✅ Pipe Function
type Pipe<T, Fns extends readonly ((arg: any) => any)[]> = Fns extends readonly [
  (arg: T) => infer U,
  ...infer Rest
]
  ? Rest extends readonly ((arg: any) => any)[]
    ? Pipe<U, Rest>
    : never
  : T;

function pipe<T, Fns extends readonly ((arg: any) => any)[]>(
  value: T,
  ...fns: Fns
): Pipe<T, Fns> {
  return fns.reduce((acc, fn) => fn(acc), value) as Pipe<T, Fns>;
}

// ✅ Builder Pattern
class UserBuilder {
  private user: Partial<{
    id: UserId;
    name: string;
    email: Email;
    age: number;
    active: boolean;
  }> = {};
  
  setId(id: UserId): this {
    this.user.id = id;
    return this;
  }
  
  setName(name: string): this {
    this.user.name = name;
    return this;
  }
  
  setEmail(email: Email): this {
    this.user.email = email;
    return this;
  }
  
  setAge(age: number): this {
    this.user.age = age;
    return this;
  }
  
  setActive(active: boolean): this {
    this.user.active = active;
    return this;
  }
  
  build(): Required<typeof this.user> {
    if (!this.user.id || !this.user.name || !this.user.email || 
        this.user.age === undefined || this.user.active === undefined) {
      throw new Error('Missing required user fields');
    }
    
    return this.user as Required<typeof this.user>;
  }
}

// ✅ State Machine
interface State<T> {
  name: string;
  transitions: Partial<Record<string, T>>;
}

class StateMachine<T extends string> {
  private currentState: T;
  private states: Record<T, State<T>>;
  
  constructor(initialState: T, states: Record<T, State<T>>) {
    this.currentState = initialState;
    this.states = states;
  }
  
  getCurrentState(): T {
    return this.currentState;
  }
  
  canTransition(event: string): boolean {
    const state = this.states[this.currentState];
    return event in state.transitions;
  }
  
  transition(event: string): boolean {
    const state = this.states[this.currentState];
    const nextState = state.transitions[event];
    
    if (nextState) {
      this.currentState = nextState;
      return true;
    }
    
    return false;
  }
}

// ✅ Usage Examples
interface User {
  id: UserId;
  name: string;
  email: Email;
  age: number;
  active: boolean;
}

// Example usage of advanced patterns
function advancedExample(): void {
  // Brand types
  const userId = createUserId('user-123');
  const email = createEmail('user@example.com');
  
  // Builder pattern
  const user = new UserBuilder()
    .setId(userId)
    .setName('John Doe')
    .setEmail(email)
    .setAge(30)
    .setActive(true)
    .build();
  
  // Option type
  const maybeUser = Option.fromNullable(user);
  const userName = maybeUser.map(u => u.name).getOrElse('Unknown');
  
  // Result type
  const result = Result.fromTryCatch(() => JSON.parse('{"valid": "json"}'));
  
  // Function composition
  const addOne = (x: number) => x + 1;
  const double = (x: number) => x * 2;
  const addOneAndDouble = compose(addOne, double);
  
  // Pipe
  const result2 = pipe(
    5,
    addOne,
    double,
    (x: number) => x.toString()
  );
  
  console.log('Advanced patterns example executed');
}

export {
  // Types
  type Optional,
  type Readonly,
  type Mutable,
  type Required,
  type Nullable,
  type NonNullable,
  type DeepReadonly,
  type DeepPartial,
  type DeepRequired,
  type Pick,
  type Omit,
  type PickByType,
  type OmitByType,
  type Brand,
  type UserId,
  type ProductId,
  type Email,
  type Timestamp,
  type Shape,
  type Predicate,
  type Mapper,
  type Reducer,
  type PathKeys,
  type PathValue,
  type Compose,
  type Pipe,
  
  // Functions
  createUserId,
  createEmail,
  createTimestamp,
  calculateArea,
  compose,
  pipe,
  
  // Classes
  Option,
  Some,
  None,
  Result,
  Ok,
  Error,
  UserBuilder,
  StateMachine,
  
  // Examples
  advancedExample
};