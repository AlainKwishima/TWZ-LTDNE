import { ServiceUrls } from '../types/index.js';

export function getServiceUrls(): ServiceUrls {
  return {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    asset: process.env.ASSET_SERVICE_URL || 'http://localhost:4005',
    serviceRequest: process.env.SERVICE_REQUEST_SERVICE_URL || 'http://localhost:4006',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007',
  };
}

export const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
