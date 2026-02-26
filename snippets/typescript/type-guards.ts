// TypeScript Type Guards - Complete Guide
// Type guards provide runtime type checking and compile-time type narrowing

// ✅ Basic type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

// ✅ Null and undefined guards
function isNull(value: unknown): value is null {
  return value === null;
}

function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ✅ Advanced type guards for interfaces
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

interface Guest {
  sessionId: string;
  role: 'guest';
}

function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    isNumber(value.id) &&
    isString(value.name) &&
    isString(value.email) &&
    (value.age === undefined || isNumber(value.age))
  );
}

function isAdmin(value: unknown): value is Admin {
  return (
    isUser(value) &&
    'role' in value &&
    'permissions' in value &&
    value.role === 'admin' &&
    isArray(value.permissions) &&
    value.permissions.every(isString)
  );
}

function isGuest(value: unknown): value is Guest {
  return (
    isObject(value) &&
    'sessionId' in value &&
    'role' in value &&
    isString(value.sessionId) &&
    value.role === 'guest'
  );
}

// ✅ Union type guards
type UserType = User | Admin | Guest;

function getUserType(user: UserType): string {
  if (isAdmin(user)) {
    return `Admin: ${user.name} with ${user.permissions.length} permissions`;
  }
  
  if (isGuest(user)) {
    return `Guest with session: ${user.sessionId}`;
  }
  
  return `User: ${user.name}`;
}

// ✅ Array type guards
function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

function isNumberArray(value: unknown): value is number[] {
  return isArray(value) && value.every(isNumber);
}

function isUserArray(value: unknown): value is User[] {
  return isArray(value) && value.every(isUser);
}

// ✅ Generic type guards
function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return isArray(value) && value.every(itemGuard);
}

function isObjectWithShape<T extends Record<string, unknown>>(
  value: unknown,
  shape: { [K in keyof T]: (value: unknown) => value is T[K] }
): value is T {
  if (!isObject(value)) {
    return false;
  }
  
  return Object.keys(shape).every(key => {
    const guard = shape[key as keyof T];
    return guard(value[key]);
  });
}

// ✅ Using generic type guards
interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

const productShape = {
  id: isNumber,
  name: isString,
  price: isNumber,
  inStock: isBoolean
};

function isProduct(value: unknown): value is Product {
  return isObjectWithShape(value, productShape);
}

// ✅ Class instance type guards
class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// ✅ Discriminated union type guards
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

function isLoadingState(state: AsyncState): state is LoadingState {
  return state.status === 'loading';
}

function isSuccessState(state: AsyncState): state is SuccessState {
  return state.status === 'success';
}

function isErrorState(state: AsyncState): state is ErrorState {
  return state.status === 'error';
}

// ✅ Custom assertion functions
function assertIsString(value: unknown): asserts value is string {
  if (!isString(value)) {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function assertIsNumber(value: unknown): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(`Expected number, got ${typeof value}`);
  }
}

function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error('Expected User object');
  }
}

function assertIsNotNullish<T>(value: T | null | undefined): asserts value is T {
  if (isNullish(value)) {
    throw new Error('Value is null or undefined');
  }
}

// ✅ Type predicate with filtering
function filterUsers(items: unknown[]): User[] {
  return items.filter(isUser);
}

function filterTruthy<T>(items: (T | null | undefined)[]): T[] {
  return items.filter(isNotNullish);
}

// ✅ Complex nested type guards
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

function isApiResponse<T>(
  value: unknown,
  dataGuard: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!isObject(value) || !('success' in value) || !isBoolean(value.success)) {
    return false;
  }
  
  if (value.success) {
    return 'data' in value && dataGuard(value.data);
  } else {
    return (
      'error' in value &&
      isObject(value.error) &&
      'code' in value.error &&
      'message' in value.error &&
      isString(value.error.code) &&
      isString(value.error.message)
    );
  }
}

// ✅ Type guards with regex patterns
function isEmail(value: unknown): value is string {
  return isString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUUID(value: unknown): value is string {
  return isString(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ✅ Date type guards
function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

function isValidDateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ✅ Numeric type guards
function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

function isInRange(min: number, max: number) {
  return function(value: unknown): value is number {
    return isNumber(value) && value >= min && value <= max;
  };
}

// ✅ String type guards
function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

function hasMinLength(minLength: number) {
  return function(value: unknown): value is string {
    return isString(value) && value.length >= minLength;
  };
}

function matchesPattern(pattern: RegExp) {
  return function(value: unknown): value is string {
    return isString(value) && pattern.test(value);
  };
}

// ✅ Complex example: API data validation
interface CreateUserRequest {
  name: string;
  email: string;
  age: number;
  tags: string[];
}

function isCreateUserRequest(value: unknown): value is CreateUserRequest {
  return (
    isObject(value) &&
    'name' in value &&
    'email' in value &&
    'age' in value &&
    'tags' in value &&
    isNonEmptyString(value.name) &&
    isEmail(value.email) &&
    isInteger(value.age) &&
    isInRange(13, 120)(value.age) &&
    isStringArray(value.tags)
  );
}

// ✅ Usage examples
function processUnknownValue(value: unknown): string {
  if (isString(value)) {
    return `String: ${value}`;
  }
  
  if (isNumber(value)) {
    return `Number: ${value}`;
  }
  
  if (isBoolean(value)) {
    return `Boolean: ${value}`;
  }
  
  if (isUser(value)) {
    return `User: ${value.name} (${value.email})`;
  }
  
  if (isArray(value)) {
    return `Array with ${value.length} items`;
  }
  
  if (isObject(value)) {
    return `Object with keys: ${Object.keys(value).join(', ')}`;
  }
  
  return 'Unknown type';
}

function handleApiData(data: unknown): void {
  if (isApiResponse(data, isUser)) {
    if (data.success) {
      console.log('User data:', data.data);
    } else {
      console.error('API error:', data.error);
    }
  } else {
    console.error('Invalid API response format');
  }
}

export {
  // Basic type guards
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isNull,
  isUndefined,
  isNullish,
  isNotNullish,
  
  // Interface type guards
  isUser,
  isAdmin,
  isGuest,
  isProduct,
  
  // Array type guards
  isStringArray,
  isNumberArray,
  isUserArray,
  isArrayOf,
  
  // Generic type guards
  isObjectWithShape,
  isApiResponse,
  
  // Class type guards
  isApiError,
  isValidationError,
  isError,
  
  // State type guards
  isLoadingState,
  isSuccessState,
  isErrorState,
  
  // Assertion functions
  assertIsString,
  assertIsNumber,
  assertIsUser,
  assertIsNotNullish,
  
  // Specialized type guards
  isEmail,
  isUUID,
  isUrl,
  isDate,
  isValidDateString,
  isInteger,
  isPositiveNumber,
  isNonNegativeNumber,
  isInRange,
  isNonEmptyString,
  hasMinLength,
  matchesPattern,
  
  // Complex type guards
  isCreateUserRequest,
  
  // Utility functions
  filterUsers,
  filterTruthy,
  processUnknownValue,
  handleApiData,
  getUserType,
  
  // Types
  type UserType,
  type AsyncState,
  type ApiResponse,
  type CreateUserRequest,
  
  // Classes
  ApiError,
  ValidationError
};