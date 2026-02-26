// ElysiaJS API Schema Definitions

import { t, type Static } from 'elysia'

// 1. Generic API Response Schemas
export const BaseResponseSchema = t.Object({
    success: t.Boolean({
        description: 'Indicates if the request was successful'
    }),
    message: t.Optional(t.String({
        description: 'Optional message describing the result'
    })),
    timestamp: t.String({
        format: 'date-time',
        description: 'Response timestamp in ISO format'
    })
})

export const SuccessResponseSchema = t.Composite([
    BaseResponseSchema,
    t.Object({
        success: t.Literal(true),
        data: t.Unknown({
            description: 'Response data (type varies by endpoint)'
        })
    })
])

export const ErrorResponseSchema = t.Composite([
    BaseResponseSchema,
    t.Object({
        success: t.Literal(false),
        error: t.Object({
            code: t.String({
                description: 'Error code identifier'
            }),
            message: t.String({
                description: 'Human-readable error message'
            }),
            details: t.Optional(t.Unknown({
                description: 'Additional error details'
            }))
        })
    })
])

// 2. Pagination Schemas
export const PaginationQuerySchema = t.Object({
    page: t.Optional(t.String({
        pattern: '^[1-9]\\d*$',
        default: '1',
        description: 'Page number (starts from 1)'
    })),
    limit: t.Optional(t.String({
        pattern: '^[1-9]\\d*$',
        default: '10',
        description: 'Number of items per page (max 100)'
    })),
    sortBy: t.Optional(t.String({
        description: 'Field to sort by'
    })),
    sortOrder: t.Optional(t.Union([
        t.Literal('asc'),
        t.Literal('desc')
    ], {
        default: 'desc',
        description: 'Sort order'
    }))
})

export const PaginationMetaSchema = t.Object({
    page: t.Number({
        minimum: 1,
        description: 'Current page number'
    }),
    limit: t.Number({
        minimum: 1,
        maximum: 100,
        description: 'Items per page'
    }),
    total: t.Number({
        minimum: 0,
        description: 'Total number of items'
    }),
    totalPages: t.Number({
        minimum: 0,
        description: 'Total number of pages'
    }),
    hasNext: t.Boolean({
        description: 'Whether there is a next page'
    }),
    hasPrev: t.Boolean({
        description: 'Whether there is a previous page'
    })
})

export const PaginatedResponseSchema = t.Object({
    success: t.Literal(true),
    data: t.Object({
        items: t.Array(t.Unknown(), {
            description: 'Array of items'
        }),
        pagination: PaginationMetaSchema
    }),
    message: t.Optional(t.String()),
    timestamp: t.String({ format: 'date-time' })
})

// 3. Search and Filter Schemas
export const SearchQuerySchema = t.Object({
    q: t.Optional(t.String({
        minLength: 1,
        maxLength: 255,
        description: 'Search query string'
    })),
    fields: t.Optional(t.Array(t.String(), {
        description: 'Fields to search in'
    })),
    filters: t.Optional(t.Record(t.String(), t.Unknown(), {
        description: 'Additional filters as key-value pairs'
    }))
})

export const AdvancedSearchSchema = t.Composite([
    PaginationQuerySchema,
    SearchQuerySchema,
    t.Object({
        dateFrom: t.Optional(t.String({
            format: 'date-time',
            description: 'Filter items from this date'
        })),
        dateTo: t.Optional(t.String({
            format: 'date-time',
            description: 'Filter items until this date'
        })),
        category: t.Optional(t.String({
            description: 'Filter by category'
        })),
        tags: t.Optional(t.Array(t.String(), {
            description: 'Filter by tags'
        })),
        status: t.Optional(t.Union([
            t.Literal('active'),
            t.Literal('inactive'),
            t.Literal('pending'),
            t.Literal('archived')
        ], {
            description: 'Filter by status'
        }))
    })
])

// 4. File Upload Schemas
export const FileUploadSchema = t.Object({
    file: t.File({
        maxSize: 10485760, // 10MB
        description: 'File to upload (max 10MB)'
    }),
    description: t.Optional(t.String({
        maxLength: 500,
        description: 'Optional file description'
    })),
    tags: t.Optional(t.Array(t.String(), {
        description: 'Optional tags for the file'
    }))
})

export const MultipleFileUploadSchema = t.Object({
    files: t.Array(t.File({
        maxSize: 10485760
    }), {
        minItems: 1,
        maxItems: 10,
        description: 'Multiple files to upload (max 10 files, 10MB each)'
    }),
    category: t.Optional(t.String({
        description: 'Category for all files'
    }))
})

export const FileResponseSchema = t.Object({
    id: t.String({
        description: 'Unique file identifier'
    }),
    filename: t.String({
        description: 'Original filename'
    }),
    url: t.String({
        format: 'uri',
        description: 'File download URL'
    }),
    size: t.Number({
        minimum: 0,
        description: 'File size in bytes'
    }),
    mimeType: t.String({
        description: 'File MIME type'
    }),
    uploadedAt: t.String({
        format: 'date-time',
        description: 'Upload timestamp'
    })
})

// 5. Authentication Schemas
export const TokenSchema = t.Object({
    accessToken: t.String({
        description: 'JWT access token'
    }),
    refreshToken: t.Optional(t.String({
        description: 'JWT refresh token'
    })),
    tokenType: t.String({
        default: 'Bearer',
        description: 'Token type'
    }),
    expiresIn: t.Number({
        minimum: 0,
        description: 'Token expiration time in seconds'
    })
})

export const RefreshTokenSchema = t.Object({
    refreshToken: t.String({
        minLength: 1,
        description: 'Valid refresh token'
    })
})

export const AuthHeaderSchema = t.Object({
    authorization: t.String({
        pattern: '^Bearer .+$',
        description: 'Bearer token authorization header'
    })
})

// 6. Webhook Schemas
export const WebhookEventSchema = t.Object({
    id: t.String({
        description: 'Unique event identifier'
    }),
    type: t.String({
        description: 'Event type'
    }),
    data: t.Unknown({
        description: 'Event payload data'
    }),
    timestamp: t.String({
        format: 'date-time',
        description: 'Event timestamp'
    }),
    version: t.String({
        default: '1.0',
        description: 'Webhook schema version'
    })
})

export const WebhookSignatureSchema = t.Object({
    'x-webhook-signature': t.String({
        description: 'Webhook signature for verification'
    }),
    'x-webhook-timestamp': t.String({
        description: 'Webhook timestamp'
    })
})

// 7. Health Check Schemas
export const HealthCheckResponseSchema = t.Object({
    status: t.Union([
        t.Literal('healthy'),
        t.Literal('unhealthy'),
        t.Literal('degraded')
    ]),
    timestamp: t.String({ format: 'date-time' }),
    uptime: t.Number({
        minimum: 0,
        description: 'Uptime in seconds'
    }),
    version: t.String({
        description: 'Application version'
    }),
    checks: t.Optional(t.Record(t.String(), t.Object({
        status: t.Union([
            t.Literal('up'),
            t.Literal('down')
        ]),
        responseTime: t.Optional(t.Number()),
        error: t.Optional(t.String())
    })))
})

// 8. Rate Limiting Schemas
export const RateLimitHeadersSchema = t.Object({
    'x-ratelimit-limit': t.String({
        description: 'Request limit'
    }),
    'x-ratelimit-remaining': t.String({
        description: 'Remaining requests'
    }),
    'x-ratelimit-reset': t.String({
        description: 'Reset timestamp'
    })
})

export const RateLimitErrorSchema = t.Object({
    success: t.Literal(false),
    error: t.Object({
        code: t.Literal('RATE_LIMIT_EXCEEDED'),
        message: t.String(),
        retryAfter: t.Number({
            description: 'Seconds until rate limit resets'
        })
    }),
    timestamp: t.String({ format: 'date-time' })
})

// 9. Validation Error Schemas
export const ValidationErrorSchema = t.Object({
    success: t.Literal(false),
    error: t.Object({
        code: t.Literal('VALIDATION_ERROR'),
        message: t.String(),
        fields: t.Record(t.String(), t.Array(t.String()), {
            description: 'Field-specific validation errors'
        })
    }),
    timestamp: t.String({ format: 'date-time' })
})

export const FieldErrorSchema = t.Object({
    field: t.String({
        description: 'Field name that failed validation'
    }),
    message: t.String({
        description: 'Validation error message'
    }),
    code: t.String({
        description: 'Validation error code'
    }),
    value: t.Optional(t.Unknown({
        description: 'Invalid value that was provided'
    }))
})

// 10. Audit Log Schemas
export const AuditLogSchema = t.Object({
    id: t.String({
        description: 'Unique audit log entry ID'
    }),
    action: t.String({
        description: 'Action that was performed'
    }),
    resource: t.String({
        description: 'Resource that was affected'
    }),
    resourceId: t.Optional(t.String({
        description: 'ID of the affected resource'
    })),
    userId: t.Optional(t.String({
        description: 'ID of the user who performed the action'
    })),
    metadata: t.Optional(t.Unknown({
        description: 'Additional action metadata'
    })),
    timestamp: t.String({
        format: 'date-time',
        description: 'When the action was performed'
    }),
    ipAddress: t.Optional(t.String({
        description: 'IP address of the request'
    })),
    userAgent: t.Optional(t.String({
        description: 'User agent of the request'
    }))
})

// 11. Batch Operation Schemas
export const BatchRequestSchema = t.Object({
    operations: t.Array(t.Object({
        method: t.Union([
            t.Literal('GET'),
            t.Literal('POST'),
            t.Literal('PUT'),
            t.Literal('PATCH'),
            t.Literal('DELETE')
        ]),
        path: t.String({
            description: 'API endpoint path'
        }),
        body: t.Optional(t.Unknown({
            description: 'Request body for non-GET requests'
        })),
        headers: t.Optional(t.Record(t.String(), t.String()))
    }), {
        minItems: 1,
        maxItems: 100,
        description: 'Batch of operations to perform'
    })
})

export const BatchResponseSchema = t.Object({
    success: t.Boolean(),
    results: t.Array(t.Object({
        status: t.Number({
            description: 'HTTP status code'
        }),
        data: t.Optional(t.Unknown({
            description: 'Response data'
        })),
        error: t.Optional(t.Object({
            code: t.String(),
            message: t.String()
        }))
    })),
    timestamp: t.String({ format: 'date-time' })
})

// 12. Type Exports
export type BaseResponse = Static<typeof BaseResponseSchema>
export type SuccessResponse = Static<typeof SuccessResponseSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
export type PaginationQuery = Static<typeof PaginationQuerySchema>
export type PaginationMeta = Static<typeof PaginationMetaSchema>
export type PaginatedResponse = Static<typeof PaginatedResponseSchema>
export type SearchQuery = Static<typeof SearchQuerySchema>
export type AdvancedSearch = Static<typeof AdvancedSearchSchema>
export type FileUpload = Static<typeof FileUploadSchema>
export type MultipleFileUpload = Static<typeof MultipleFileUploadSchema>
export type FileResponse = Static<typeof FileResponseSchema>
export type Token = Static<typeof TokenSchema>
export type RefreshToken = Static<typeof RefreshTokenSchema>
export type AuthHeader = Static<typeof AuthHeaderSchema>
export type WebhookEvent = Static<typeof WebhookEventSchema>
export type WebhookSignature = Static<typeof WebhookSignatureSchema>
export type HealthCheckResponse = Static<typeof HealthCheckResponseSchema>
export type RateLimitHeaders = Static<typeof RateLimitHeadersSchema>
export type RateLimitError = Static<typeof RateLimitErrorSchema>
export type ValidationError = Static<typeof ValidationErrorSchema>
export type FieldError = Static<typeof FieldErrorSchema>
export type AuditLog = Static<typeof AuditLogSchema>
export type BatchRequest = Static<typeof BatchRequestSchema>
export type BatchResponse = Static<typeof BatchResponseSchema>

// 13. Schema Examples for Documentation
export const apiSchemaExamples = {
    successResponse: {
        success: true,
        data: { id: 1, name: 'Example' },
        message: 'Operation completed successfully',
        timestamp: '2023-12-01T10:30:00.000Z'
    },
    errorResponse: {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            details: { resourceId: '123' }
        },
        timestamp: '2023-12-01T10:30:00.000Z'
    },
    paginatedResponse: {
        success: true,
        data: {
            items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
            pagination: {
                page: 1,
                limit: 10,
                total: 25,
                totalPages: 3,
                hasNext: true,
                hasPrev: false
            }
        },
        timestamp: '2023-12-01T10:30:00.000Z'
    },
    validationError: {
        success: false,
        error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            fields: {
                email: ['Invalid email format'],
                password: ['Password must be at least 8 characters']
            }
        },
        timestamp: '2023-12-01T10:30:00.000Z'
    }
}