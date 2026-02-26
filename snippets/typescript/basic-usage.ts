// TypeScript Basic Usage Examples with Effect-TS Schema
// NEVER use 'any' type - use Effect-TS Schema, specific types, unknown, or type guards

import { Effect, pipe } from 'effect'
import { Schema } from '@effect/schema'

// ✅ Good: Explicit typing
const userName: string = "John";
const userAge: number = 25;
const isActive: boolean = true;
const userTags: string[] = ["admin", "user"];

// ✅ Good: Schema definition with Effect-TS (preferred)
const UserSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.brand('UserId')),
  name: Schema.String.pipe(Schema.minLength(1)),
  email: Schema.String.pipe(Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/)),
  age: Schema.optional(Schema.Number.pipe(Schema.between(13, 120))),
  tags: Schema.Array(Schema.String)
})

type User = Schema.Type<typeof UserSchema>

// ✅ Alternative: Traditional interface (fallback)
interface UserInterface {
  readonly id: number;
  name: string;
  email: string;
  age?: number;
  tags: string[];
}

// ✅ Good: Function with Effect-TS Schema validation
const createUser = (name: string, email: string) =>
  Effect.gen(function* () {
    const userData = {
      id: Date.now(),
      name,
      email,
      tags: []
    }
    
    const user = yield* Schema.decodeUnknown(UserSchema)(userData)
    return user
  })

// ✅ Alternative: Traditional function (fallback)
function createUserTraditional(name: string, email: string): UserInterface {
  return {
    id: Date.now(),
    name,
    email,
    tags: []
  };
}

// ✅ Good: Generic function with constraints
function processArray<T extends string | number>(items: T[]): T[] {
  return items.filter(item => item !== null && item !== undefined);
}

// ✅ Good: Type assertion (when necessary)
const inputElement = document.getElementById('input') as HTMLInputElement;

// ✅ Good: Union types instead of any
type Status = 'pending' | 'complete' | 'failed';
function updateStatus(status: Status): void {
  console.log(`Status updated to: ${status}`);
}

// ✅ Good: Using unknown for type-safe any alternative
function processUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return 'unknown';
}

// ✅ Good: Mapped types
type Optional<T> = {
  [K in keyof T]?: T[K];
};

type PartialUser = Optional<User>;

// ✅ Good: Utility types
type UserWithoutId = Omit<User, 'id'>;
type UserIdAndName = Pick<User, 'id' | 'name'>;
type RequiredUser = Required<User>;

// ✅ Good: Conditional types
type NonNullable<T> = T extends null | undefined ? never : T;

// ✅ Good: Template literal types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiEndpoint = `api/v1/${string}`;

// ✅ Good: Class with proper typing
class UserManager {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  findUser(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
  
  getAllUsers(): readonly User[] {
    return Object.freeze([...this.users]);
  }
}

// ✅ Good: Enum usage
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

// ✅ Good: Const assertions
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
} as const;

// ✅ Good: Schema-based validation (preferred)
const validateUser = (data: unknown) =>
  Schema.decodeUnknown(UserSchema)(data)

const safeValidateUser = (data: unknown) =>
  pipe(
    validateUser(data),
    Effect.catchAll((error) => 
      Effect.fail(new ValidationError('user', 'Schema validation failed'))
    )
  )

// ✅ Alternative: Traditional type guards (fallback)
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUser(value: unknown): value is UserInterface {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    'tags' in value
  );
}

// ✅ Good: Discriminated unions
interface LoadingState {
  status: 'loading';
}

interface SuccessState {
  status: 'success';
  data: User[];
}

interface ErrorState {
  status: 'error';
  error: string;
}

type AppState = LoadingState | SuccessState | ErrorState;

function handleState(state: AppState): void {
  switch (state.status) {
    case 'loading':
      console.log('Loading...');
      break;
    case 'success':
      console.log('Data loaded:', state.data);
      break;
    case 'error':
      console.error('Error:', state.error);
      break;
    default:
      // This ensures exhaustive checking
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${JSON.stringify(state)}`);
  }
}

// ✅ Good: Effect-TS with Schema validation (preferred)
const fetchUsers = () =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch('/api/users'),
      catch: (error) => new Error(`Fetch failed: ${error}`)
    })
    
    if (!response.ok) {
      yield* Effect.fail(new Error(`HTTP error! status: ${response.status}`))
    }
    
    const data = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) => new Error(`JSON parse failed: ${error}`)
    })
    
    const users = yield* Schema.decodeUnknown(Schema.Array(UserSchema))(data)
    return users
  })

// ✅ Alternative: Traditional async/await (fallback)
async function fetchUsersTraditional(): Promise<UserInterface[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data: unknown = await response.json();
  
  if (Array.isArray(data) && data.every(isUser)) {
    return data;
  }
  
  throw new Error('Invalid user data received');
}

// ✅ Good: Error handling with typed errors
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Good: Effect-TS Schema validation with custom error handling
const validateUserWithSchema = (user: unknown) =>
  pipe(
    Schema.decodeUnknown(UserSchema)(user),
    Effect.catchAll((error) => 
      Effect.fail(new ValidationError('user', 'Schema validation failed'))
    )
  )

// ✅ Alternative: Traditional validation (fallback)
function validateUserTraditional(user: unknown): UserInterface {
  if (!isUser(user)) {
    throw new ValidationError('user', 'Invalid user object');
  }
  
  if (!user.name.trim()) {
    throw new ValidationError('name', 'Name cannot be empty');
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    throw new ValidationError('email', 'Invalid email format');
  }
  
  return user;
}

// Example usage with Effect-TS
const program = Effect.gen(function* () {
  const rawUserData = {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    tags: ['user']
  }
  
  const user = yield* validateUserWithSchema(rawUserData)
  console.log('Validated user:', user)
  return user
})

// Execute the program
Effect.runPromise(program).catch(console.error)

export {
  UserSchema,
  User,
  UserInterface,
  UserRole,
  UserManager,
  createUser,
  createUserTraditional,
  processArray,
  processUnknown,
  validateUser,
  validateUserWithSchema,
  safeValidateUser,
  isString,
  isUser,
  fetchUsers,
  fetchUsersTraditional,
  validateUserTraditional,
  ValidationError
};