export enum UserRole {
  ADMIN = 'Admin',
  INSPECTOR = 'Inspector',
  USER = 'User',
}

export enum EventType {
  USER_REGISTERED = 'UserRegistered',
  OTP_VERIFIED = 'OTPVerified',
  ASSET_CREATED = 'AssetCreated',
  ASSET_EXPIRING_SOON = 'AssetExpiringSoon',
  ASSET_EXPIRED = 'AssetExpired',
  NOTIFICATION_SENT = 'NotificationSent',
  NOTIFICATION_ACKNOWLEDGED = 'NotificationAcknowledged',
  SERVICE_REQUESTED = 'ServiceRequested',
  TECHNICIAN_ASSIGNED = 'TechnicianAssigned',
  SERVICE_COMPLETED = 'ServiceCompleted',
  REPORT_GENERATED = 'ReportGenerated',
}

export const SERVICE_PORTS = {
  API_GATEWAY: 4000,
  AUTH: 4001,
  ASSET: 4005,
  SERVICE_REQUEST: 4006,
  NOTIFICATION: 4007,
  REPORTING: 4008,
} as const;

export const OTP_PURPOSES = {
  SIGNUP: 'signup',
  LOGIN: 'login',
  PASSWORD_RESET: 'password_reset',
  SENSITIVE_ACTION: 'sensitive_action',
} as const;

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
