import { UserRole, EventType } from '../constants/index.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  /** Customer scope for portal users; inspectors and admins do not use it. */
  customerId?: string;
}

export interface AuthenticatedRequest {
  user?: JwtPayload;
}

export interface DomainEvent<T = Record<string, unknown>> {
  type: EventType;
  payload: T;
  timestamp: string;
  source: string;
}

export interface AssetEventPayload {
  assetId: string;
  assetCode: string;
  serialNumber: string;
  customerId: string;
  type: string;
  size: string;
  location?: string;
  expirationDate: string;
  status: string;
}

export interface ServiceCompletedPayload {
  serviceRequestId: string;
  assetId: string;
  customerId: string;
  technicianId: string;
  serviceType: string;
  nextServiceDate?: string;
  nextExpirationDate?: string;
}
