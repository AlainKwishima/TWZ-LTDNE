/** Shared OpenAPI 3 components for FEMS services. */
export const openApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT from POST /api/auth/login or /api/auth/verify-otp',
    },
  },
  schemas: {
    ApiResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object', additionalProperties: true },
        meta: { $ref: '#/components/schemas/PaginationMeta' },
        errors: { type: 'array', items: { type: 'object' } },
      },
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
    UserRole: { type: 'string', enum: ['Admin', 'Inspector', 'User'] },
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        fullName: { type: 'string' },
        phoneNumber: { type: 'string', nullable: true },
        role: { $ref: '#/components/schemas/UserRole' },
        roles: { type: 'array', items: { $ref: '#/components/schemas/UserRole' } },
        customerId: { type: 'string', format: 'uuid', nullable: true },
        isEmailVerified: { type: 'boolean' },
        isActive: { type: 'boolean' },
        lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    AuthTokenResponse: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: { $ref: '#/components/schemas/User' },
      },
    },
    AssetStatus: {
      type: 'string',
      enum: ['Active', 'ExpiringSoon', 'Expired', 'Serviced', 'NeedsReplacement', 'HighRisk'],
    },
    FireExtinguisherAsset: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        assetCode: { type: 'string' },
        serialNumber: { type: 'string' },
        customerId: { type: 'string', format: 'uuid' },
        location: { type: 'string', nullable: true },
        type: { type: 'string' },
        size: { type: 'string' },
        installationDate: { type: 'string', format: 'date-time' },
        expirationDate: { type: 'string', format: 'date-time' },
        serviceDate: { type: 'string', format: 'date-time', nullable: true },
        nextServiceDate: { type: 'string', format: 'date-time', nullable: true },
        refillBookedAt: { type: 'string', format: 'date-time', nullable: true },
        status: { $ref: '#/components/schemas/AssetStatus' },
        notes: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    ServiceRequest: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        requestNumber: { type: 'string' },
        customerId: { type: 'string', format: 'uuid' },
        assetId: { type: 'string', format: 'uuid' },
        type: { type: 'string' },
        status: { type: 'string' },
        priority: { type: 'string' },
        description: { type: 'string', nullable: true },
        scheduledDate: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    Notification: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid', nullable: true },
        customerId: { type: 'string', format: 'uuid', nullable: true },
        channel: { type: 'string', enum: ['email', 'sms', 'in_app'] },
        status: { type: 'string' },
        category: { type: 'string', nullable: true },
        subject: { type: 'string', nullable: true },
        body: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    GeneratedReport: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        reportType: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
        rowCount: { type: 'integer' },
        summary: { type: 'object', additionalProperties: true },
        generatedBy: { type: 'string', format: 'uuid', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
      },
    },
  },
  responses: {
    Unauthorized: {
      description: 'Missing or invalid JWT',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    Forbidden: {
      description: 'Insufficient role',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    NotFound: {
      description: 'Resource not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
  },
};

export const standardTags = [
  { name: 'Gateway', description: 'API gateway health' },
  { name: 'Auth', description: 'Authentication and profile' },
  { name: 'Users', description: 'Admin user management' },
  { name: 'Assets', description: 'Fire extinguisher inventory' },
  { name: 'Service Requests', description: 'Maintenance / inspection requests' },
  { name: 'Notifications', description: 'User notifications' },
  { name: 'Templates', description: 'Notification templates (Admin)' },
  { name: 'Reports', description: 'Generated reports and exports' },
  { name: 'Analytics', description: 'Role dashboards and KPIs' },
  { name: 'Internal', description: 'Service-to-service endpoints (not proxied by gateway)' },
];
