import { describe, it, expect } from 'vitest';
import { UserRole } from '@fems/shared';
import { shouldNotifyInspectorPromotion } from '../services/inspector-appointment.service.js';

describe('shouldNotifyInspectorPromotion', () => {
  it('returns true when role changes to Inspector from User', () => {
    expect(shouldNotifyInspectorPromotion(UserRole.USER, UserRole.INSPECTOR)).toBe(true);
  });

  it('returns true when role changes to Inspector from Admin', () => {
    expect(shouldNotifyInspectorPromotion(UserRole.ADMIN, UserRole.INSPECTOR)).toBe(true);
  });

  it('returns false when user was already Inspector', () => {
    expect(shouldNotifyInspectorPromotion(UserRole.INSPECTOR, UserRole.INSPECTOR)).toBe(false);
  });

  it('returns false when role is not changed to Inspector', () => {
    expect(shouldNotifyInspectorPromotion(UserRole.USER, UserRole.USER)).toBe(false);
    expect(shouldNotifyInspectorPromotion(UserRole.INSPECTOR, UserRole.ADMIN)).toBe(false);
    expect(shouldNotifyInspectorPromotion(UserRole.USER, undefined)).toBe(false);
  });
});
