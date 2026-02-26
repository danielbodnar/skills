// TypeScript: Avoiding 'any' Type - Best Practices
// NEVER use 'any' - use these patterns instead

// ❌ BAD: Using 'any'
// function badFunction(param: any): any {
//   return param.whatever.something;
// }

// ✅ GOOD: Use 'unknown' for truly unknown values
function handleUnknown(value: unknown): string {
  // Type narrowing is required
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (value === null) {
    return 'null';
  }
  
  if (value === undefined) {
    return 'undefined';
  }
  
  // For complex objects, use type guards
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  
  return 'unknown';
}

// ✅ GOOD: Type guards for complex objects
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).id === 'number' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

function processUser(data: unknown): User {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data; // TypeScript knows this is User
}

// ✅ GOOD: Union types instead of any
type ApiResponse = 
  | { success: true; data: User[] }
  | { success: false; error: string };

function handleApiResponse(response: ApiResponse): void {
  if (response.success) {
    console.log('Users:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}

// ✅ GOOD: Generic types with constraints
function processArray<T extends string | number | boolean>(
  items: T[],
  processor: (item: T) => string
): string[] {
  return items.map(processor);
}

// ✅ GOOD: Mapped types for transformation
type Optional<T> = {
  [K in keyof T]?: T[K];
};

type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Partial<T> = {
  [K in keyof T]?: T[K];
};

type Required<T> = {
  [K in keyof T]-?: T[K];
};

// ✅ GOOD: Conditional types
type NonNullable<T> = T extends null | undefined ? never : T;

type ReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : unknown;

type Parameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;

// ✅ GOOD: Template literal types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiEndpoint = `api/v1/${string}`;
type HttpUrl = `http://${string}` | `https://${string}`;

// ✅ GOOD: Branded types for type safety
type UserId = number & { __brand: 'UserId' };
type ProductId = number & { __brand: 'ProductId' };

function createUserId(id: number): UserId {
  return id as UserId;
}

function createProductId(id: number): ProductId {
  return id as ProductId;
}

// Now these can't be mixed up
function getUser(id: UserId): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// ✅ GOOD: Assertion functions
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Value is not a string');
  }
}

function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('Value is not a number');
  }
}

function processValue(value: unknown): string {
  assertIsString(value);
  // TypeScript knows value is string here
  return value.toUpperCase();
}

// ✅ GOOD: Discriminated unions
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

type AsyncState = LoadingState | SuccessState | ErrorState;

function renderState(state: AsyncState): string {
  switch (state.status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return `Loaded ${state.data.length} users`;
    case 'error':
      return `Error: ${state.error}`;
    default:
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${JSON.stringify(state)}`);
  }
}

// ✅ GOOD: Index signatures with constraints
interface StringMap {
  [key: string]: string;
}

interface NumberMap {
  [key: string]: number;
}

interface GenericMap<T> {
  [key: string]: T;
}

// ✅ GOOD: Utility types for object manipulation
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Omit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

type UserName = Pick<User, 'name'>;
type UserWithoutEmail = Omit<User, 'email'>;

// ✅ GOOD: Function overloads instead of any
function processData(data: string): string;
function processData(data: number): number;
function processData(data: boolean): boolean;
function processData(data: string | number | boolean): string | number | boolean {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  if (typeof data === 'number') {
    return data * 2;
  }
  return !data;
}

// ✅ GOOD: Type-safe JSON parsing
function parseJSON<T>(json: string, validator: (value: unknown) => value is T): T {
  const parsed: unknown = JSON.parse(json);
  if (!validator(parsed)) {
    throw new Error('Invalid JSON structure');
  }
  return parsed;
}

// Usage
const userData = parseJSON('{"id": 1, "name": "John", "email": "john@example.com"}', isUser);

// ✅ GOOD: Event handling with proper typing
interface EventMap {
  'user-created': { user: User };
  'user-updated': { user: User; changes: Partial<User> };
  'user-deleted': { userId: UserId };
}

type EventName = keyof EventMap;

class TypedEventEmitter {
  private listeners: {
    [K in EventName]?: Array<(event: EventMap[K]) => void>;
  } = {};

  on<K extends EventName>(event: K, listener: (data: EventMap[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  emit<K extends EventName>(event: K, data: EventMap[K]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
}

// ✅ GOOD: API response handling
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

async function fetchTypedData<T>(
  url: string,
  validator: (value: unknown) => value is T
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`
        }
      };
    }
    
    const data: unknown = await response.json();
    if (!validator(data)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid response format'
        }
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// ✅ GOOD: Class with proper typing
class UserService {
  private users: Map<UserId, User> = new Map();
  
  addUser(user: User): void {
    const userId = createUserId(user.id);
    this.users.set(userId, user);
  }
  
  getUser(id: UserId): User | undefined {
    return this.users.get(id);
  }
  
  updateUser(id: UserId, updates: Partial<User>): boolean {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }
    
    const updatedUser: User = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return true;
  }
  
  deleteUser(id: UserId): boolean {
    return this.users.delete(id);
  }
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

export {
  handleUnknown,
  isUser,
  processUser,
  handleApiResponse,
  processArray,
  createUserId,
  createProductId,
  getUser,
  assertIsString,
  assertIsNumber,
  processValue,
  renderState,
  processData,
  parseJSON,
  TypedEventEmitter,
  fetchTypedData,
  UserService,
  type ApiResponse,
  type AsyncState,
  type ApiResult,
  type ApiError,
  type UserId,
  type ProductId,
  type EventMap,
  type EventName
};