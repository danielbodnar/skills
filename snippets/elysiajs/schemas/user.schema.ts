// ElysiaJS Schema Definitions using TypeBox

import { t, type Static } from 'elysia'

// 1. Basic User Schema
export const UserSchema = t.Object({
    id: t.String({
        format: 'uuid',
        description: 'Unique user identifier'
    }),
    username: t.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
        description: 'Username (alphanumeric and underscore only)'
    }),
    email: t.String({
        format: 'email',
        description: 'User email address'
    }),
    firstName: t.String({
        minLength: 1,
        maxLength: 50,
        description: 'User first name'
    }),
    lastName: t.String({
        minLength: 1,
        maxLength: 50,
        description: 'User last name'
    }),
    age: t.Optional(t.Number({
        minimum: 13,
        maximum: 120,
        description: 'User age (13-120)'
    })),
    avatar: t.Optional(t.String({
        format: 'uri',
        description: 'Avatar image URL'
    })),
    isActive: t.Boolean({
        default: true,
        description: 'Whether the user account is active'
    }),
    role: t.Union([
        t.Literal('admin'),
        t.Literal('user'),
        t.Literal('moderator')
    ], {
        default: 'user',
        description: 'User role'
    }),
    createdAt: t.String({
        format: 'date-time',
        description: 'Account creation timestamp'
    }),
    updatedAt: t.String({
        format: 'date-time',
        description: 'Last update timestamp'
    }),
    lastLogin: t.Optional(t.String({
        format: 'date-time',
        description: 'Last login timestamp'
    }))
})

// 2. User Creation Schema (Input)
export const CreateUserSchema = t.Object({
    username: t.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    }),
    email: t.String({ format: 'email' }),
    firstName: t.String({ minLength: 1, maxLength: 50 }),
    lastName: t.String({ minLength: 1, maxLength: 50 }),
    password: t.String({
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
        description: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
    }),
    age: t.Optional(t.Number({ minimum: 13, maximum: 120 })),
    avatar: t.Optional(t.String({ format: 'uri' }))
})

// 3. User Update Schema (Partial)
export const UpdateUserSchema = t.Object({
    username: t.Optional(t.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    })),
    email: t.Optional(t.String({ format: 'email' })),
    firstName: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
    lastName: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
    age: t.Optional(t.Number({ minimum: 13, maximum: 120 })),
    avatar: t.Optional(t.String({ format: 'uri' })),
    isActive: t.Optional(t.Boolean())
})

// 4. Authentication Schemas
export const LoginSchema = t.Object({
    username: t.String({ minLength: 1 }),
    password: t.String({ minLength: 1 }),
    rememberMe: t.Optional(t.Boolean({ default: false }))
})

export const RegisterSchema = t.Object({
    username: t.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    }),
    email: t.String({ format: 'email' }),
    password: t.String({
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
    }),
    confirmPassword: t.String({ minLength: 8 }),
    firstName: t.String({ minLength: 1, maxLength: 50 }),
    lastName: t.String({ minLength: 1, maxLength: 50 }),
    terms: t.Boolean({ const: true })
})

export const ChangePasswordSchema = t.Object({
    currentPassword: t.String({ minLength: 1 }),
    newPassword: t.String({
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
    }),
    confirmNewPassword: t.String({ minLength: 8 })
})

export const ForgotPasswordSchema = t.Object({
    email: t.String({ format: 'email' })
})

export const ResetPasswordSchema = t.Object({
    token: t.String({ minLength: 1 }),
    newPassword: t.String({
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
    }),
    confirmPassword: t.String({ minLength: 8 })
})

// 5. Query Parameter Schemas
export const UserQuerySchema = t.Object({
    page: t.Optional(t.String({ pattern: '^\\d+$', default: '1' })),
    limit: t.Optional(t.String({ pattern: '^\\d+$', default: '10' })),
    search: t.Optional(t.String({ minLength: 1 })),
    role: t.Optional(t.Union([
        t.Literal('admin'),
        t.Literal('user'),
        t.Literal('moderator')
    ])),
    isActive: t.Optional(t.String({ pattern: '^(true|false)$' })),
    sortBy: t.Optional(t.Union([
        t.Literal('username'),
        t.Literal('email'),
        t.Literal('createdAt'),
        t.Literal('lastLogin')
    ], { default: 'createdAt' })),
    sortOrder: t.Optional(t.Union([
        t.Literal('asc'),
        t.Literal('desc')
    ], { default: 'desc' }))
})

// 6. Response Schemas
export const UserResponseSchema = t.Object({
    success: t.Boolean(),
    data: UserSchema,
    message: t.Optional(t.String())
})

export const UsersListResponseSchema = t.Object({
    success: t.Boolean(),
    data: t.Object({
        users: t.Array(UserSchema),
        pagination: t.Object({
            page: t.Number(),
            limit: t.Number(),
            total: t.Number(),
            totalPages: t.Number(),
            hasNext: t.Boolean(),
            hasPrev: t.Boolean()
        })
    }),
    message: t.Optional(t.String())
})

export const AuthResponseSchema = t.Object({
    success: t.Boolean(),
    data: t.Object({
        user: t.Omit(UserSchema, ['password']),
        token: t.String(),
        refreshToken: t.Optional(t.String()),
        expiresIn: t.Number()
    }),
    message: t.Optional(t.String())
})

// 7. Error Response Schemas
export const ErrorResponseSchema = t.Object({
    success: t.Literal(false),
    error: t.Object({
        code: t.String(),
        message: t.String(),
        details: t.Optional(t.Unknown())
    }),
    timestamp: t.String({ format: 'date-time' })
})

export const ValidationErrorResponseSchema = t.Object({
    success: t.Literal(false),
    error: t.Object({
        code: t.Literal('VALIDATION_ERROR'),
        message: t.String(),
        fields: t.Record(t.String(), t.Array(t.String()))
    }),
    timestamp: t.String({ format: 'date-time' })
})

// 8. File Upload Schemas
export const AvatarUploadSchema = t.Object({
    avatar: t.File({
        type: ['image/jpeg', 'image/png', 'image/gif'],
        maxSize: 5242880, // 5MB
        description: 'User avatar image (JPEG, PNG, GIF, max 5MB)'
    })
})

export const ProfileImageResponseSchema = t.Object({
    success: t.Boolean(),
    data: t.Object({
        url: t.String({ format: 'uri' }),
        filename: t.String(),
        size: t.Number(),
        mimeType: t.String()
    }),
    message: t.Optional(t.String())
})

// 9. Advanced Schemas with Composition
export const UserPreferencesSchema = t.Object({
    theme: t.Union([
        t.Literal('light'),
        t.Literal('dark'),
        t.Literal('auto')
    ], { default: 'auto' }),
    language: t.String({
        pattern: '^[a-z]{2}(-[A-Z]{2})?$',
        default: 'en-US',
        description: 'Language code (e.g., en-US, fr-FR)'
    }),
    timezone: t.String({
        description: 'IANA timezone identifier'
    }),
    notifications: t.Object({
        email: t.Boolean({ default: true }),
        push: t.Boolean({ default: true }),
        sms: t.Boolean({ default: false })
    }),
    privacy: t.Object({
        profileVisible: t.Boolean({ default: true }),
        showEmail: t.Boolean({ default: false }),
        showLastLogin: t.Boolean({ default: false })
    })
})

export const UserWithPreferencesSchema = t.Composite([
    UserSchema,
    t.Object({
        preferences: UserPreferencesSchema
    })
])

// 10. Type Exports
export type User = Static<typeof UserSchema>
export type CreateUser = Static<typeof CreateUserSchema>
export type UpdateUser = Static<typeof UpdateUserSchema>
export type LoginRequest = Static<typeof LoginSchema>
export type RegisterRequest = Static<typeof RegisterSchema>
export type ChangePasswordRequest = Static<typeof ChangePasswordSchema>
export type ForgotPasswordRequest = Static<typeof ForgotPasswordSchema>
export type ResetPasswordRequest = Static<typeof ResetPasswordSchema>
export type UserQuery = Static<typeof UserQuerySchema>
export type UserResponse = Static<typeof UserResponseSchema>
export type UsersListResponse = Static<typeof UsersListResponseSchema>
export type AuthResponse = Static<typeof AuthResponseSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
export type ValidationErrorResponse = Static<typeof ValidationErrorResponseSchema>
export type AvatarUpload = Static<typeof AvatarUploadSchema>
export type ProfileImageResponse = Static<typeof ProfileImageResponseSchema>
export type UserPreferences = Static<typeof UserPreferencesSchema>
export type UserWithPreferences = Static<typeof UserWithPreferencesSchema>

// 11. Schema Validation Helpers
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    return password.length >= 8 && passwordRegex.test(password)
}

export const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    return username.length >= 3 && username.length <= 30 && usernameRegex.test(username)
}

// 12. Schema Examples for Documentation
export const schemaExamples = {
    user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        avatar: 'https://example.com/avatars/johndoe.jpg',
        isActive: true,
        role: 'user',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        lastLogin: '2023-12-01T10:30:00.000Z'
    },
    createUser: {
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePassword123!',
        age: 30
    },
    login: {
        username: 'johndoe',
        password: 'SecurePassword123!',
        rememberMe: true
    }
}