import { describe, it, expect } from 'vitest';
import { UserRole } from '../constants/index.js';

describe('UserRole', () => {
  it('defines three portal roles', () => {
    expect(Object.values(UserRole)).toEqual(['Admin', 'Inspector', 'User']);
  });
});
