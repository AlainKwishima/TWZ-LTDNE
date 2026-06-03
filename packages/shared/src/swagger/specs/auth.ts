import { mergePaths, op, pathParam, queryParam, requestJson } from '../helpers.js';

const signupBody = {
  type: 'object',
  required: ['email', 'password', 'firstName', 'lastName', 'role'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    phoneNumber: { type: 'string' },
    role: { $ref: '#/components/schemas/UserRole' },
  },
};

export function authPaths(base = '') {
  const p = (path: string) => `${base}${path}`;
  return mergePaths({
    [p('/health')]: op('get', { tags: ['Auth'], summary: 'Auth service health', security: false }),
    [p('/signup')]: op('post', {
      tags: ['Auth'],
      summary: 'Register new account',
      security: false,
      requestBody: requestJson('Signup payload', signupBody),
    }),
    [p('/login')]: op('post', {
      tags: ['Auth'],
      summary: 'Sign in with email and password',
      security: false,
      requestBody: requestJson('Login', {
        type: 'object',
        required: ['email', 'password'],
        properties: { email: { type: 'string' }, password: { type: 'string' } },
      }),
    }),
    [p('/google')]: op('post', {
      tags: ['Auth'],
      summary: 'Sign in or register with Google ID token',
      security: false,
      requestBody: requestJson('Google auth', {
        type: 'object',
        required: ['credential'],
        properties: {
          credential: { type: 'string' },
          role: { $ref: '#/components/schemas/UserRole' },
        },
      }),
    }),
    [p('/verify-otp')]: op('post', {
      tags: ['Auth'],
      summary: 'Verify OTP (signup, login, password reset)',
      security: false,
      requestBody: requestJson('OTP verification', {
        type: 'object',
        required: ['email', 'code', 'purpose'],
        properties: {
          email: { type: 'string' },
          code: { type: 'string' },
          purpose: { type: 'string', enum: ['signup', 'login', 'password_reset', 'sensitive_action'] },
        },
      }),
    }),
    [p('/resend-otp')]: op('post', {
      tags: ['Auth'],
      summary: 'Resend OTP code',
      security: false,
      requestBody: requestJson('Resend OTP', {
        type: 'object',
        required: ['email', 'purpose'],
        properties: { email: { type: 'string' }, purpose: { type: 'string' } },
      }),
    }),
    [p('/forgot-password')]: op('post', {
      tags: ['Auth'],
      summary: 'Request password reset email',
      security: false,
      requestBody: requestJson('Forgot password', {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string' } },
      }),
    }),
    [p('/reset-password')]: op('post', {
      tags: ['Auth'],
      summary: 'Reset password with token',
      security: false,
      requestBody: requestJson('Reset password', {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: { token: { type: 'string' }, newPassword: { type: 'string' } },
      }),
    }),
    [p('/me')]: op('get', { tags: ['Auth'], summary: 'Get current user profile', security: true }),
    [p('/profile')]: op('put', {
      tags: ['Auth'],
      summary: 'Update profile (firstName, lastName, phone)',
      security: true,
      requestBody: requestJson('Profile update', {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string' },
        },
      }),
    }),
    [p('/change-password')]: op('put', {
      tags: ['Auth'],
      summary: 'Change password',
      security: true,
      requestBody: requestJson('Change password', {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string' },
        },
      }),
    }),
    [p('/users')]: {
      ...op('get', {
        tags: ['Users'],
        summary: 'List users (Admin)',
        security: true,
        parameters: [
          queryParam('page', 'Page number', { type: 'integer' }),
          queryParam('limit', 'Page size', { type: 'integer' }),
          queryParam('search', 'Search name or email'),
          queryParam('role', 'Filter by role'),
          queryParam('isActive', 'true or false'),
        ],
      }),
      ...op('post', {
        tags: ['Users'],
        summary: 'Create user (Admin)',
        security: true,
        requestBody: requestJson('Create user', {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'role'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string' },
            role: { $ref: '#/components/schemas/UserRole' },
            isActive: { type: 'boolean' },
          },
        }),
      }),
    },
    [p('/users/{id}')]: {
      ...op('get', {
        tags: ['Users'],
        summary: 'Get user by ID (Admin)',
        security: true,
        parameters: [pathParam('id', 'User UUID')],
      }),
      ...op('patch', {
        tags: ['Users'],
        summary: 'Update user (Admin)',
        security: true,
        parameters: [pathParam('id', 'User UUID')],
        requestBody: requestJson('Update user', {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string', nullable: true },
            role: { $ref: '#/components/schemas/UserRole' },
            isActive: { type: 'boolean' },
          },
        }),
      }),
    },
    [p('/internal/users/{id}/contact')]: op('get', {
      tags: ['Internal'],
      summary: 'Get user contact (internal, auth service only)',
      security: false,
      parameters: [pathParam('id', 'User UUID')],
    }),
  });
}
