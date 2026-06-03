import { describe, it, expect } from 'vitest';
import { UserRole } from '@fems/shared';

describe('UserRole constants', () => {
  it('uses Admin, Inspector, and User only', () => {
    expect(UserRole.ADMIN).toBe('Admin');
    expect(UserRole.INSPECTOR).toBe('Inspector');
    expect(UserRole.USER).toBe('User');
  });
});
