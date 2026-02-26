// TypeScript Error Handling - Best Practices
// Type-safe error handling patterns without using 'any'

// ✅ Custom Error Classes
class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

class DatabaseError extends ApplicationError {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly originalError?: Error
  ) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

// ✅ Error Type Guards
function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// ✅ Result Type for Error Handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function createSuccess<T>(data: T): Result<T, never> {
  return { success: true, data };
}

function createFailure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// ✅ Result Utility Functions
function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return createSuccess(fn(result.data));
  }
  return result;
}

function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return createFailure(fn(result.error));
  }
  return result;
}

function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

function getOrThrow<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

// ✅ Try-Catch Wrapper
function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return createSuccess(fn());
  } catch (error) {
    return createFailure(error instanceof Error ? error : new Error(String(error)));
  }
}

async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return createSuccess(data);
  } catch (error) {
    return createFailure(error instanceof Error ? error : new Error(String(error)));
  }
}

// ✅ Validation Functions
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

function validateUser(input: unknown): Result<User, ValidationError> {
  if (typeof input !== 'object' || input === null) {
    return createFailure(new ValidationError('Input must be an object', 'root', input));
  }
  
  const obj = input as Record<string, unknown>;
  
  if (typeof obj.id !== 'string' || obj.id.trim() === '') {
    return createFailure(new ValidationError('ID must be a non-empty string', 'id', obj.id));
  }
  
  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    return createFailure(new ValidationError('Name must be a non-empty string', 'name', obj.name));
  }
  
  if (typeof obj.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)) {
    return createFailure(new ValidationError('Email must be a valid email address', 'email', obj.email));
  }
  
  if (typeof obj.age !== 'number' || obj.age < 0 || obj.age > 150 || !Number.isInteger(obj.age)) {
    return createFailure(new ValidationError('Age must be a positive integer between 0 and 150', 'age', obj.age));
  }
  
  return createSuccess({
    id: obj.id,
    name: obj.name.trim(),
    email: obj.email.toLowerCase(),
    age: obj.age
  });
}

// ✅ Chain Multiple Validations
function validateUserFields(data: Record<string, unknown>): Result<User, ValidationError[]> {
  const errors: ValidationError[] = [];
  
  if (typeof data.id !== 'string' || data.id.trim() === '') {
    errors.push(new ValidationError('ID must be a non-empty string', 'id', data.id));
  }
  
  if (typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push(new ValidationError('Name must be a non-empty string', 'name', data.name));
  }
  
  if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push(new ValidationError('Email must be a valid email address', 'email', data.email));
  }
  
  if (typeof data.age !== 'number' || data.age < 0 || data.age > 150 || !Number.isInteger(data.age)) {
    errors.push(new ValidationError('Age must be a positive integer between 0 and 150', 'age', data.age));
  }
  
  if (errors.length > 0) {
    return createFailure(errors);
  }
  
  return createSuccess({
    id: data.id as string,
    name: (data.name as string).trim(),
    email: (data.email as string).toLowerCase(),
    age: data.age as number
  });
}

// ✅ Database Operations with Error Handling
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
}

class Database {
  constructor(private config: DatabaseConfig) {}
  
  async findUser(id: string): Promise<Result<User, DatabaseError | NotFoundError>> {
    try {
      // Simulate database query
      const query = `SELECT * FROM users WHERE id = '${id}'`;
      
      // Simulate potential database error
      if (Math.random() < 0.1) {
        throw new Error('Connection timeout');
      }
      
      // Simulate user not found
      if (id === 'not-found') {
        return createFailure(new NotFoundError('User', id));
      }
      
      // Simulate successful query
      const user: User = {
        id,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      
      return createSuccess(user);
    } catch (error) {
      return createFailure(new DatabaseError(
        'Failed to find user',
        `SELECT * FROM users WHERE id = '${id}'`,
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }
  
  async createUser(userData: unknown): Promise<Result<User, ValidationError | DatabaseError>> {
    const validationResult = validateUser(userData);
    if (!validationResult.success) {
      return validationResult;
    }
    
    try {
      // Simulate database insertion
      const query = `INSERT INTO users (id, name, email, age) VALUES (?, ?, ?, ?)`;
      
      // Simulate potential database error
      if (Math.random() < 0.1) {
        throw new Error('Duplicate key error');
      }
      
      return createSuccess(validationResult.data);
    } catch (error) {
      return createFailure(new DatabaseError(
        'Failed to create user',
        query,
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }
}

// ✅ API Response Handling
interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

async function fetchUser(id: string): Promise<Result<User, ApplicationError>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    const apiResponse: ApiResponse<User> = await response.json();
    
    if (!response.ok) {
      if (response.status === 404) {
        return createFailure(new NotFoundError('User', id));
      }
      
      if (response.status === 401) {
        return createFailure(new UnauthorizedError());
      }
      
      return createFailure(new ApplicationError(
        apiResponse.error?.message || 'API request failed',
        apiResponse.error?.code || 'API_ERROR',
        response.status
      ));
    }
    
    if (!apiResponse.data) {
      return createFailure(new ApplicationError(
        'No data in API response',
        'INVALID_RESPONSE',
        500
      ));
    }
    
    return createSuccess(apiResponse.data);
  } catch (error) {
    return createFailure(new ApplicationError(
      'Network error',
      'NETWORK_ERROR',
      500
    ));
  }
}

// ✅ Error Handling Middleware
type ErrorHandler = (error: ApplicationError) => void;

class ErrorHandlerRegistry {
  private handlers: Map<string, ErrorHandler> = new Map();
  
  register(errorCode: string, handler: ErrorHandler): void {
    this.handlers.set(errorCode, handler);
  }
  
  handle(error: ApplicationError): void {
    const handler = this.handlers.get(error.code);
    if (handler) {
      handler(error);
    } else {
      console.error('Unhandled error:', error);
    }
  }
}

// ✅ Comprehensive Error Handling Service
class ErrorService {
  private registry = new ErrorHandlerRegistry();
  
  constructor() {
    this.setupDefaultHandlers();
  }
  
  private setupDefaultHandlers(): void {
    this.registry.register('VALIDATION_ERROR', (error) => {
      console.error('Validation failed:', error.message);
    });
    
    this.registry.register('NOT_FOUND', (error) => {
      console.error('Resource not found:', error.message);
    });
    
    this.registry.register('UNAUTHORIZED', (error) => {
      console.error('Unauthorized access:', error.message);
    });
    
    this.registry.register('DATABASE_ERROR', (error) => {
      console.error('Database error:', error.message);
      if (isDatabaseError(error) && error.query) {
        console.error('Query:', error.query);
      }
    });
  }
  
  handleError(error: unknown): void {
    if (isApplicationError(error)) {
      this.registry.handle(error);
    } else if (isError(error)) {
      this.registry.handle(new ApplicationError(error.message, 'UNKNOWN_ERROR'));
    } else {
      this.registry.handle(new ApplicationError('Unknown error occurred', 'UNKNOWN_ERROR'));
    }
  }
  
  registerHandler(errorCode: string, handler: ErrorHandler): void {
    this.registry.register(errorCode, handler);
  }
}

// ✅ Usage Examples
async function errorHandlingExample(): Promise<void> {
  const database = new Database({
    host: 'localhost',
    port: 5432,
    database: 'myapp'
  });
  
  const errorService = new ErrorService();
  
  // Example 1: Database operation with error handling
  const findResult = await database.findUser('user-123');
  if (findResult.success) {
    console.log('User found:', findResult.data);
  } else {
    errorService.handleError(findResult.error);
  }
  
  // Example 2: Validation with error handling
  const createResult = await database.createUser({
    id: 'user-456',
    name: 'Jane Doe',
    email: 'jane@example.com',
    age: 25
  });
  
  if (createResult.success) {
    console.log('User created:', createResult.data);
  } else {
    errorService.handleError(createResult.error);
  }
  
  // Example 3: API call with error handling
  const apiResult = await fetchUser('user-789');
  if (apiResult.success) {
    console.log('User fetched:', apiResult.data);
  } else {
    errorService.handleError(apiResult.error);
  }
  
  // Example 4: Multiple operations with error handling
  const userIds = ['user-1', 'user-2', 'user-3'];
  const users: User[] = [];
  
  for (const id of userIds) {
    const result = await database.findUser(id);
    if (result.success) {
      users.push(result.data);
    } else {
      errorService.handleError(result.error);
    }
  }
  
  console.log('Successfully loaded users:', users.length);
}

// ✅ Error Boundary for Async Operations
async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  errorHandler: (error: unknown) => void
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    errorHandler(error);
    return undefined;
  }
}

export {
  // Error classes
  ApplicationError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  
  // Type guards
  isApplicationError,
  isValidationError,
  isNotFoundError,
  isUnauthorizedError,
  isDatabaseError,
  isError,
  
  // Result type and utilities
  type Result,
  createSuccess,
  createFailure,
  mapResult,
  mapError,
  flatMapResult,
  getOrElse,
  getOrThrow,
  
  // Try-catch wrappers
  tryCatch,
  tryCatchAsync,
  
  // Validation
  validateUser,
  validateUserFields,
  
  // Services
  Database,
  ErrorService,
  ErrorHandlerRegistry,
  
  // API functions
  fetchUser,
  
  // Utilities
  withErrorBoundary,
  errorHandlingExample,
  
  // Types
  type User,
  type DatabaseConfig,
  type ApiResponse,
  type ErrorHandler
};