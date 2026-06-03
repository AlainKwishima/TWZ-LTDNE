import { describe, it, expect } from 'vitest';
import { signupSchema } from '../validators/auth.validators.js';

describe('signupSchema', () => {
  it('accepts User role by default', () => {
    const result = signupSchema.safeParse({
      body: {
        email: 'test@example.com',
        password: 'Password1!',
        firstName: 'Test',
        lastName: 'User',
        role: 'User',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects legacy Staff role', () => {
    const result = signupSchema.safeParse({
      body: {
        email: 'test@example.com',
        password: 'Password1!',
        firstName: 'Test',
        lastName: 'User',
        role: 'Staff',
      },
    });
    expect(result.success).toBe(false);
  });
});
