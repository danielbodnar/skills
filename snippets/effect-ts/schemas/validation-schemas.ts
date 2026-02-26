// Validation Schemas and Type Safety with Effect-TS Schema
// Comprehensive patterns for runtime validation with @effect/schema

import { Effect, pipe, Data } from "effect"
import { Schema } from "@effect/schema"

// 1. Basic Schema Definitions with Effect-TS Schema
const StringSchema = Schema.String
const NumberSchema = Schema.Number
const BooleanSchema = Schema.Boolean
const DateSchema = Schema.Date

// Branded types for domain modeling
const UserIdSchema = Schema.String.pipe(Schema.brand('UserId'))
const EmailBrandSchema = Schema.String.pipe(
  Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/),
  Schema.brand('Email')
)

// 2. String Validations with Effect-TS Schema
const EmailSchema = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
)

// Alternative with branded type
const EmailBranded = EmailBrandSchema

const PasswordSchema = Schema.String.pipe(
  Schema.minLength(8),
  Schema.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
)

const UrlSchema = Schema.String.pipe(
  Schema.pattern(/^https?:\/\/.+/)
)

const PhoneSchema = Schema.String.pipe(
  Schema.pattern(/^\+?[\d\s\-\(\)]+$/)
)

// 3. Number Validations with Effect-TS Schema
const PositiveNumberSchema = Schema.Number.pipe(
  Schema.positive()
)

const IntegerSchema = Schema.Number.pipe(
  Schema.int()
)

const RangeSchema = Schema.Number.pipe(
  Schema.between(0, 100)
)

const PriceSchema = Schema.Number.pipe(
  Schema.positive(),
  Schema.multipleOf(0.01)
)

// 4. Date Validations with Effect-TS Schema
const FutureDateSchema = Schema.Date.pipe(
  Schema.filter(date => date > new Date())
)

const PastDateSchema = Schema.Date.pipe(
  Schema.filter(date => date < new Date())
)

const AgeSchema = Schema.Number.pipe(
  Schema.int(),
  Schema.between(0, 120)
)

// 5. Complex Object Schemas
const AddressSchema = Schema.Struct({
  street: Schema.String.pipe(Schema.nonEmpty()),
  city: Schema.String.pipe(Schema.nonEmpty()),
  state: Schema.String.pipe(Schema.length(2)),
  zipCode: Schema.String.pipe(
    Schema.pattern(/^\d{5}(-\d{4})?$/, {
      message: () => "Must be a valid ZIP code (12345 or 12345-6789)"
    })
  ),
  country: Schema.String.pipe(Schema.nonEmpty())
})

const PersonSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.positive()),
  firstName: Schema.String.pipe(
    Schema.nonEmpty(),
    Schema.maxLength(50)
  ),
  lastName: Schema.String.pipe(
    Schema.nonEmpty(),
    Schema.maxLength(50)
  ),
  email: EmailSchema,
  phone: Schema.optional(PhoneSchema),
  age: AgeSchema,
  address: AddressSchema,
  isActive: Schema.Boolean,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc
})

// 6. Array and Collection Schemas
const TagsSchema = Schema.Array(
  Schema.String.pipe(Schema.nonEmpty())
).pipe(
  Schema.minItems(1, {
    message: () => "At least one tag is required"
  }),
  Schema.maxItems(10, {
    message: () => "Maximum of 10 tags allowed"
  })
)

const ScoresSchema = Schema.Array(
  Schema.Number.pipe(Schema.between(0, 100))
).pipe(
  Schema.minItems(3, {
    message: () => "At least 3 scores required"
  })
)

// 7. Union and Enum Schemas
const StatusSchema = Schema.Literal("active", "inactive", "pending", "suspended")

const PrioritySchema = Schema.Union(
  Schema.Literal("low"),
  Schema.Literal("medium"),
  Schema.Literal("high"),
  Schema.Literal("critical")
)

const UserRoleSchema = Schema.Enums({
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "moderator",
  GUEST: "guest"
})

// 8. Optional and Nullable Schemas
const ProfileSchema = Schema.Struct({
  userId: Schema.Number.pipe(Schema.positive()),
  bio: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
  website: Schema.optional(UrlSchema),
  avatar: Schema.nullable(UrlSchema),
  preferences: Schema.optional(
    Schema.Struct({
      theme: Schema.Union(Schema.Literal("light"), Schema.Literal("dark")),
      notifications: Schema.Boolean,
      language: Schema.String.pipe(Schema.length(2))
    })
  )
})

// 9. Recursive Schemas
interface Category {
  readonly id: number
  readonly name: string
  readonly parentId?: number
  readonly children?: readonly Category[]
}

const CategorySchema: Schema.Schema<Category> = Schema.Struct({
  id: Schema.Number.pipe(Schema.positive()),
  name: Schema.String.pipe(Schema.nonEmpty()),
  parentId: Schema.optional(Schema.Number.pipe(Schema.positive())),
  children: Schema.optional(Schema.Array(Schema.suspend(() => CategorySchema)))
})

// 10. Transformation Schemas
const StringToNumberSchema = Schema.String.pipe(
  Schema.pattern(/^\d+$/, {
    message: () => "Must be a numeric string"
  }),
  Schema.transform(
    Schema.Number,
    (s) => parseInt(s, 10),
    (n) => n.toString()
  )
)

const DateStringSchema = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, {
    message: () => "Must be in YYYY-MM-DD format"
  }),
  Schema.transform(
    Schema.Date,
    (s) => new Date(s),
    (d) => d.toISOString().split('T')[0]
  )
)

const TrimmedStringSchema = Schema.String.pipe(
  Schema.transform(
    Schema.String,
    (s) => s.trim(),
    (s) => s
  ),
  Schema.nonEmpty()
)

// 11. Conditional Schemas
const ConditionalProfileSchema = Schema.Struct({
  userType: Schema.Union(Schema.Literal("individual"), Schema.Literal("business")),
  name: Schema.String.pipe(Schema.nonEmpty()),
  // Conditional fields based on userType
  personalInfo: Schema.optional(
    Schema.Struct({
      firstName: Schema.String,
      lastName: Schema.String,
      dateOfBirth: PastDateSchema
    })
  ),
  businessInfo: Schema.optional(
    Schema.Struct({
      companyName: Schema.String,
      taxId: Schema.String,
      registrationDate: PastDateSchema
    })
  )
}).pipe(
  Schema.filter((data) => {
    if (data.userType === "individual") {
      return data.personalInfo !== undefined && data.businessInfo === undefined
    } else {
      return data.businessInfo !== undefined && data.personalInfo === undefined
    }
  }, {
    message: () => "Profile must have either personal info (for individuals) or business info (for businesses)"
  })
)

// 12. File Upload Schema
const FileUploadSchema = Schema.Struct({
  filename: Schema.String.pipe(Schema.nonEmpty()),
  mimeType: Schema.String.pipe(
    Schema.pattern(/^(image|video|audio|application|text)\/[\w-]+$/, {
      message: () => "Invalid MIME type"
    })
  ),
  size: Schema.Number.pipe(
    Schema.positive(),
    Schema.lessThanOrEqualTo(10 * 1024 * 1024, {
      message: () => "File size must not exceed 10MB"
    })
  ),
  data: Schema.String // Base64 encoded
})

const ImageUploadSchema = FileUploadSchema.pipe(
  Schema.filter(
    (file) => file.mimeType.startsWith("image/"),
    {
      message: () => "File must be an image"
    }
  )
)

// 13. API Request/Response Schemas
const PaginationSchema = Schema.Struct({
  page: Schema.Number.pipe(Schema.int(), Schema.positive()),
  limit: Schema.Number.pipe(
    Schema.int(),
    Schema.between(1, 100, {
      message: () => "Limit must be between 1 and 100"
    })
  ),
  sortBy: Schema.optional(Schema.String.pipe(Schema.nonEmpty())),
  sortOrder: Schema.optional(
    Schema.Union(Schema.Literal("asc"), Schema.Literal("desc"))
  )
})

const ApiResponseSchema = <T>(dataSchema: Schema.Schema<T>) =>
  Schema.Struct({
    success: Schema.Boolean,
    data: Schema.optional(dataSchema),
    error: Schema.optional(Schema.String),
    pagination: Schema.optional(
      Schema.Struct({
        total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
        page: Schema.Number.pipe(Schema.int(), Schema.positive()),
        limit: Schema.Number.pipe(Schema.int(), Schema.positive()),
        totalPages: Schema.Number.pipe(Schema.int(), Schema.positive())
      })
    )
  })

// 14. Error Schemas
class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string
  readonly message: string
  readonly code: string
}> {}

class BusinessLogicError extends Data.TaggedError("BusinessLogicError")<{
  readonly operation: string
  readonly reason: string
}> {}

const ErrorResponseSchema = Schema.Struct({
  error: Schema.Struct({
    type: Schema.String,
    message: Schema.String,
    code: Schema.optional(Schema.String),
    field: Schema.optional(Schema.String),
    details: Schema.optional(Schema.Record(Schema.String, Schema.Unknown))
  })
})

// 15. Dynamic Schema Validation
const DynamicFormFieldSchema = Schema.Struct({
  type: Schema.Union(
    Schema.Literal("text"),
    Schema.Literal("email"),
    Schema.Literal("number"),
    Schema.Literal("boolean"),
    Schema.Literal("date"),
    Schema.Literal("select")
  ),
  name: Schema.String.pipe(Schema.nonEmpty()),
  label: Schema.String.pipe(Schema.nonEmpty()),
  required: Schema.Boolean,
  validation: Schema.optional(
    Schema.Struct({
      minLength: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
      maxLength: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
      pattern: Schema.optional(Schema.String),
      min: Schema.optional(Schema.Number),
      max: Schema.optional(Schema.Number),
      options: Schema.optional(Schema.Array(Schema.String))
    })
  )
})

const DynamicFormSchema = Schema.Struct({
  formId: Schema.String.pipe(Schema.nonEmpty()),
  title: Schema.String.pipe(Schema.nonEmpty()),
  fields: Schema.Array(DynamicFormFieldSchema).pipe(Schema.minItems(1))
})

// 16. Effect-TS Schema Utility Functions
const validateAndParse = <T>(schema: Schema.Schema<T, any>) => (data: unknown) =>
  Schema.decodeUnknown(schema)(data)

// Effect-based validation with error handling
const safeValidateAndParse = <T>(schema: Schema.Schema<T, any>) => (data: unknown) =>
  pipe(
    Schema.decodeUnknown(schema)(data),
    Effect.catchAll((error) => 
      Effect.fail(new ValidationError({
        field: 'unknown',
        message: 'Schema validation failed',
        code: 'VALIDATION_ERROR'
      }))
    )
  )

const validateEmail = validateAndParse(EmailSchema)
const validatePerson = validateAndParse(PersonSchema)
const validateApiResponse = <T>(dataSchema: Schema.Schema<T, any>) =>
  validateAndParse(ApiResponseSchema(dataSchema))

// Effect-based validation functions
const safeValidateEmail = safeValidateAndParse(EmailSchema)
const safeValidatePerson = safeValidateAndParse(PersonSchema)

// JSON Schema generation for OpenAPI
const generateJsonSchemas = () => {
  const { JSONSchema } = require('@effect/schema')
  return {
    person: JSONSchema.make(PersonSchema),
    address: JSONSchema.make(AddressSchema),
    createUserRequest: JSONSchema.make(CreateUserRequestSchema),
    updateUserRequest: JSONSchema.make(UpdateUserRequestSchema)
  }
}

// Schema equivalence for value comparison
const PersonEquivalence = Schema.equivalence(PersonSchema)
const AddressEquivalence = Schema.equivalence(AddressSchema)

const comparePersons = (person1: Schema.Type<typeof PersonSchema>, person2: Schema.Type<typeof PersonSchema>) =>
  PersonEquivalence(person1, person2)

// Example usage with Effect-TS
const validateUserPipeline = (rawData: unknown) =>
  pipe(
    safeValidatePerson(rawData),
    Effect.tap((person) => 
      Effect.sync(() => console.log('Person validated:', person))
    )
  )

const program = Effect.gen(function* () {
  const rawPersonData = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const person = yield* validateUserPipeline(rawPersonData)
  return person
})

// Execute the program
Effect.runPromise(program).catch(console.error)

// 17. Schema Composition Examples
const CreateUserRequestSchema = Schema.Struct({
  firstName: PersonSchema.fields.firstName,
  lastName: PersonSchema.fields.lastName,
  email: PersonSchema.fields.email,
  password: PasswordSchema,
  confirmPassword: Schema.String
}).pipe(
  Schema.filter(
    (data) => data.password === data.confirmPassword,
    {
      message: () => "Passwords must match"
    }
  )
)

const UpdateUserRequestSchema = Schema.Struct({
  firstName: Schema.optional(PersonSchema.fields.firstName),
  lastName: Schema.optional(PersonSchema.fields.lastName),
  email: Schema.optional(PersonSchema.fields.email),
  phone: Schema.optional(PersonSchema.fields.phone),
  address: Schema.optional(AddressSchema)
}).pipe(
  Schema.filter(
    (data) => Object.values(data).some(value => value !== undefined),
    {
      message: () => "At least one field must be provided for update"
    }
  )
)

export {
  // Basic schemas
  UserIdSchema,
  EmailSchema,
  EmailBrandSchema,
  EmailBranded,
  PasswordSchema,
  UrlSchema,
  PhoneSchema,
  PositiveNumberSchema,
  IntegerSchema,
  RangeSchema,
  PriceSchema,
  FutureDateSchema,
  PastDateSchema,
  AgeSchema,
  
  // Complex schemas
  AddressSchema,
  PersonSchema,
  TagsSchema,
  ScoresSchema,
  StatusSchema,
  PrioritySchema,
  UserRoleSchema,
  ProfileSchema,
  CategorySchema,
  
  // Transformation schemas
  StringToNumberSchema,
  DateStringSchema,
  TrimmedStringSchema,
  
  // Conditional schemas
  ConditionalProfileSchema,
  
  // File schemas
  FileUploadSchema,
  ImageUploadSchema,
  
  // API schemas
  PaginationSchema,
  ApiResponseSchema,
  ErrorResponseSchema,
  
  // Dynamic schemas
  DynamicFormFieldSchema,
  DynamicFormSchema,
  
  // Request schemas
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  
  // Error classes
  ValidationError,
  BusinessLogicError,
  
  // Utility functions
  validateAndParse,
  safeValidateAndParse,
  validateEmail,
  validatePerson,
  validateApiResponse,
  safeValidateEmail,
  safeValidatePerson,
  generateJsonSchemas,
  PersonEquivalence,
  AddressEquivalence,
  comparePersons,
  validateUserPipeline
}