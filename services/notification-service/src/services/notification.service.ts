import {
  NotificationChannel,
  NotificationCategory,
  NotificationStatus,
  Prisma,
} from '../generated/prisma/index.js';
import {
  AssetEventPayload,
  EventBus,
  EventType,
  ServiceCompletedPayload,
  parsePagination,
  paginationMeta,
} from '@fems/shared';
import { prisma } from '../prisma/client.js';
import { fetchCustomerContact } from '../clients/customer.client.js';
import { fetchAssetsForExpiryWatch } from '../clients/asset.client.js';
import { EmailService } from './email.service.js';
import { SmsService } from './sms.service.js';

export interface CreateNotificationInput {
  userId?: string;
  customerId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  category?: NotificationCategory;
  subject?: string;
  body: string;
  eventType?: string;
  eventPayload?: Record<string, unknown>;
  templateId?: string;
  metadata?: Record<string, unknown>;
  sendImmediately?: boolean;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  userId?: string;
  customerId?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  category?: NotificationCategory;
  unseenOnly?: boolean;
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

function payloadToVars(payload: Record<string, unknown>): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== null && value !== undefined) {
      vars[key] = String(value);
    }
  }
  return vars;
}

/**
 * Owns notification persistence, delivery, and event fan-out for the asset and
 * maintenance workflows.
 */
export class NotificationService {
  private emailService = new EmailService();
  private smsService = new SmsService();

  constructor(private eventBus: EventBus) {}

  /**
   * Returns paginated notifications with optional recipient and state filters.
   */
  async list(query: NotificationListQuery) {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const where: Prisma.NotificationWhereInput = {};

    if (query.userId) where.userId = query.userId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.channel) where.channel = query.channel;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.unseenOnly) where.seenAt = null;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { template: true, logs: { orderBy: { createdAt: 'desc' }, take: 5 } },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, meta: paginationMeta(page, limit, total) };
  }

  /**
   * Loads a single notification together with its template and delivery logs.
   */
  async getById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      include: { template: true, logs: { orderBy: { createdAt: 'desc' } } },
    });
  }

  /**
   * Convenience helper for the user-centric inbox views.
   */
  async getByUserId(userId: string, query: NotificationListQuery) {
    return this.list({ ...query, userId });
  }

  /**
   * Persists a notification and dispatches it immediately when the channel is not in-app only.
   */
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        customerId: input.customerId,
        recipientEmail: input.recipientEmail,
        recipientPhone: input.recipientPhone,
        channel: input.channel,
        category: input.category || NotificationCategory.System,
        subject: input.subject,
        body: input.body,
        eventType: input.eventType,
        eventPayload: input.eventPayload as Prisma.InputJsonValue,
        templateId: input.templateId,
        metadata: input.metadata as Prisma.InputJsonValue,
        status: NotificationStatus.Pending,
      },
    });

    if (input.sendImmediately !== false && input.channel !== NotificationChannel.InApp) {
      return this.dispatch(notification.id);
    }

    if (input.channel === NotificationChannel.InApp) {
      const sent = await this.markSent(notification.id, { detail: 'In-app notification created' });
      await this.publishSent(sent);
      return sent;
    }

    return notification;
  }

  /**
   * Delivers a queued notification through its configured channel and records the outcome.
   */
  async dispatch(notificationId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new Error('Notification not found');

    try {
      let detail: Record<string, unknown> = {};

      switch (notification.channel) {
        case NotificationChannel.Email: {
          if (!notification.recipientEmail) throw new Error('Recipient email required');
          const result = await this.emailService.send({
            to: notification.recipientEmail,
            subject: notification.subject || 'TWZ LTD Notification',
            text: notification.body,
          });
          detail = {
            messageId: result.messageId,
            deliveredTo: result.deliveredTo,
            provider: 'brevo',
            preview: result.preview,
          };
          break;
        }
        case NotificationChannel.SMS: {
          if (!notification.recipientPhone) throw new Error('Recipient phone required');
          const result = await this.smsService.send({
            to: notification.recipientPhone,
            body: notification.body,
          });
          detail = { ...result };
          break;
        }
        case NotificationChannel.InApp:
          detail = { detail: 'In-app notification stored' };
          break;
      }

      const sent = await this.markSent(notificationId, detail);
      await this.publishSent(sent);
      return sent;
    } catch (error) {
      const failed = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.Failed,
          failedAt: new Date(),
          failureReason: (error as Error).message,
        },
      });

      await prisma.notificationLog.create({
        data: {
          notificationId,
          action: 'FAILED',
          channel: notification.channel,
          detail: (error as Error).message,
        },
      });

      return failed;
    }
  }

  private async markSent(notificationId: string, metadata: Record<string, unknown>) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new Error('Notification not found');

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.Sent,
        sentAt: new Date(),
      },
    });

    await prisma.notificationLog.create({
      data: {
        notificationId,
        action: 'SENT',
        channel: notification.channel,
        detail: 'Notification dispatched successfully',
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  /**
   * Marks a notification as seen so the inbox state stays in sync with the UI.
   */
  async markSeen(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return null;
    if (notification.seenAt) return notification;

    const updated = await prisma.notification.update({
      where: { id },
      data: { seenAt: new Date() },
    });

    await prisma.notificationLog.create({
      data: {
        notificationId: id,
        action: 'SEEN',
        channel: notification.channel,
        detail: 'Notification marked as seen',
      },
    });

    if (notification.category === NotificationCategory.Expiry && notification.eventPayload) {
      const assetId = (notification.eventPayload as Record<string, unknown>).assetId;
      if (typeof assetId === 'string') {
        await this.recordExpiryNotificationSeen(assetId);
      }
    }

    return updated;
  }

  /**
   * Resolves the expiry tracker when both the customer and refill milestones are complete.
   */
  private async resolveExpiryTrackerIfComplete(
    tracker: { id: string; customerSeenAt: Date | null; refillBookedAt: Date | null }
  ) {
    if (!tracker.customerSeenAt || !tracker.refillBookedAt) return;
    await prisma.expiryAlertTracker.update({
      where: { id: tracker.id },
      data: { alertsResolvedAt: new Date() },
    });
  }

  /**
   * Records that the customer has viewed the expiry alert for the asset.
   */
  async recordExpiryNotificationSeen(assetId: string) {
    const tracker = await prisma.expiryAlertTracker.findUnique({ where: { assetId } });
    if (!tracker) return null;

    const updated = tracker.customerSeenAt
      ? tracker
      : await prisma.expiryAlertTracker.update({
          where: { assetId },
          data: { customerSeenAt: new Date() },
        });
    await this.resolveExpiryTrackerIfComplete(updated);
    return updated;
  }

  /**
   * Records that the customer booked a refill after the expiry alert.
   */
  async bookRefillForAsset(assetId: string, customerId: string) {
    const tracker = await prisma.expiryAlertTracker.findFirst({
      where: { assetId, customerId },
    });
    if (!tracker) {
      throw new Error('Extinguisher not found for expiry tracking');
    }
    if (tracker.refillBookedAt) return tracker;

    const updated = await prisma.expiryAlertTracker.update({
      where: { id: tracker.id },
      data: { refillBookedAt: new Date() },
    });
    await this.resolveExpiryTrackerIfComplete(updated);
    return updated;
  }

  /**
   * Marks a notification as acknowledged for audit purposes and publishes the state change.
   */
  async acknowledge(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return null;

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.Acknowledged,
        acknowledgedAt: new Date(),
        seenAt: notification.seenAt || new Date(),
      },
    });

    await prisma.notificationLog.create({
      data: {
        notificationId: id,
        action: 'ACKNOWLEDGED',
        channel: notification.channel,
        detail: 'Notification acknowledged by recipient',
      },
    });

    await this.eventBus.publish(EventType.NOTIFICATION_ACKNOWLEDGED, {
      notificationId: id,
      userId: notification.userId,
      customerId: notification.customerId,
      channel: notification.channel,
      eventType: notification.eventType,
      acknowledgedAt: updated.acknowledgedAt?.toISOString(),
    });

    return updated;
  }

  /**
   * Requeues a failed notification and increments the delivery retry count.
   */
  async resend(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return null;

    await prisma.notification.update({
      where: { id },
      data: {
        resendCount: { increment: 1 },
        status: NotificationStatus.Pending,
        failedAt: null,
        failureReason: null,
      },
    });

    await prisma.notificationLog.create({
      data: {
        notificationId: id,
        action: 'RESEND',
        channel: notification.channel,
        detail: `Resend attempt #${notification.resendCount + 1}`,
      },
    });

    return this.dispatch(id);
  }

  private async publishSent(notification: {
    id: string;
    userId: string | null;
    customerId: string | null;
    channel: NotificationChannel;
    eventType: string | null;
    subject: string | null;
    sentAt: Date | null;
  }) {
    await this.eventBus.publish(EventType.NOTIFICATION_SENT, {
      notificationId: notification.id,
      userId: notification.userId,
      customerId: notification.customerId,
      channel: notification.channel,
      eventType: notification.eventType,
      subject: notification.subject,
      sentAt: notification.sentAt?.toISOString(),
    });
  }

  /**
   * Sends a template-driven notification with the resolved delivery recipient.
   */
  async sendFromTemplate(
    templateCode: string,
    payload: Record<string, unknown>,
    overrides: Partial<CreateNotificationInput> = {}
  ) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { code: templateCode },
    });
    if (!template || !template.isActive) {
      throw new Error(`Template not found or inactive: ${templateCode}`);
    }

    const contact =
      overrides.customerId && (!overrides.recipientEmail || !overrides.userId)
        ? await fetchCustomerContact(overrides.customerId)
        : null;

    const vars = payloadToVars(payload);
    const body = renderTemplate(template.body, vars);
    const subject = template.subject ? renderTemplate(template.subject, vars) : undefined;
    const htmlBody = template.htmlBody ? renderTemplate(template.htmlBody, vars) : undefined;

    return this.create({
      channel: template.channel,
      subject,
      body: htmlBody || body,
      templateId: template.id,
      eventType: template.eventType || undefined,
      eventPayload: payload,
      ...overrides,
      recipientEmail: overrides.recipientEmail ?? contact?.email,
      recipientPhone: overrides.recipientPhone ?? contact?.phoneNumber,
      userId: overrides.userId ?? contact?.userId ?? undefined,
    });
  }

  /**
   * Sends the same message through email and in-app channels so the user gets both records.
   */
  async sendTemplatePair(
    emailTemplate: string,
    inAppTemplate: string,
    payload: Record<string, unknown>,
    overrides: Partial<CreateNotificationInput> = {}
  ) {
    const contact = overrides.customerId ? await fetchCustomerContact(overrides.customerId) : null;
    const merged = {
      ...overrides,
      recipientEmail: overrides.recipientEmail ?? contact?.email,
      recipientPhone: overrides.recipientPhone ?? contact?.phoneNumber,
      userId: overrides.userId ?? contact?.userId ?? undefined,
    };

    await this.sendFromTemplate(emailTemplate, payload, merged);
    await this.sendFromTemplate(inAppTemplate, payload, merged);
  }

  /**
   * Mirrors the current asset expiry state into the local tracker table for reminders.
   */
  async syncExpiryTrackersFromAssets() {
    const assets = await fetchAssetsForExpiryWatch();
    let synced = 0;

    for (const asset of assets) {
      const contact = await fetchCustomerContact(asset.customerId);
      const refillBookedAt = asset.refillBookedAt ? new Date(asset.refillBookedAt) : null;
      await prisma.expiryAlertTracker.upsert({
        where: { assetId: asset.id },
        update: {
          assetCode: asset.assetCode,
          customerId: asset.customerId,
          userId: contact?.userId ?? undefined,
          expirationDate: new Date(asset.expirationDate),
          ...(refillBookedAt ? { refillBookedAt } : {}),
        },
        create: {
          assetId: asset.id,
          assetCode: asset.assetCode,
          customerId: asset.customerId,
          userId: contact?.userId ?? undefined,
          expirationDate: new Date(asset.expirationDate),
          refillBookedAt,
        },
      });
      synced++;
    }

    return { synced };
  }

  /**
   * Routes asset lifecycle events to the correct notification workflow.
   */
  async handleAssetEvent(eventType: string, payload: AssetEventPayload & { userId?: string }) {
    switch (eventType) {
      case EventType.ASSET_CREATED:
        return this.handleAssetCreated(payload);
      case EventType.ASSET_EXPIRING_SOON:
        return this.handleAssetExpiringSoon(payload);
      case EventType.ASSET_EXPIRED:
        return this.handleAssetExpired(payload);
      default:
        throw new Error(`Unsupported asset event: ${eventType}`);
    }
  }

  /**
   * Creates the customer-facing and in-app notifications for a new asset.
   */
  async handleAssetCreated(payload: AssetEventPayload & { userId?: string }) {
    await this.upsertExpiryTracker(payload);

    return this.sendFromTemplate('asset-created-inapp', payload as unknown as Record<string, unknown>, {
      customerId: payload.customerId,
      userId: payload.userId,
      category: NotificationCategory.Asset,
    });
  }

  /**
   * Sends the maintenance reminder pair when the asset is approaching expiry.
   */
  async handleAssetExpiringSoon(payload: AssetEventPayload & { userId?: string; recipientPhone?: string }) {
    await this.upsertExpiryTracker(payload);

    return this.sendTemplatePair(
      'asset-expiring-email',
      'asset-expiring-inapp',
      payload as unknown as Record<string, unknown>,
      {
        customerId: payload.customerId,
        userId: payload.userId,
        recipientPhone: payload.recipientPhone,
        category: NotificationCategory.Expiry,
      }
    );
  }

  /**
   * Sends the overdue reminder pair after the asset has passed its expiry date.
   */
  async handleAssetExpired(payload: AssetEventPayload & { userId?: string }) {
    await this.upsertExpiryTracker(payload);

    return this.sendTemplatePair(
      'asset-expired-email',
      'asset-expired-inapp',
      payload as unknown as Record<string, unknown>,
      {
        customerId: payload.customerId,
        userId: payload.userId,
        category: NotificationCategory.Expiry,
      }
    );
  }

  /**
   * Notifies the customer that the request completed and the extinguisher record was updated.
   */
  async handleServiceCompleted(
    payload: ServiceCompletedPayload & {
      requestNumber?: string;
      assetCode?: string;
      recipientEmail?: string;
    }
  ) {
    const vars = payload as unknown as Record<string, unknown>;
    await this.sendTemplatePair('service-completed-email', 'service-completed-inapp', vars, {
      customerId: payload.customerId,
      recipientEmail: payload.recipientEmail,
      category: NotificationCategory.Service,
    });
  }

  /**
   * Fan-outs request lifecycle events so the user, inspector, and audit views stay aligned.
   */
  async handleServiceRequestEvent(eventType: string, payload: Record<string, unknown>) {
    const customerId = payload.customerId as string | undefined;
    const technicianId = payload.technicianId as string | undefined;
    const eventKind = String(payload.eventKind ?? '');

    if (eventType === EventType.SERVICE_REQUESTED) {
      if (eventKind === 'CREATED') {
        await this.sendTemplatePair(
          'service-request-created-email',
          'service-request-created-inapp',
          payload,
          { customerId, category: NotificationCategory.Service }
        );
        return;
      }
      if (eventKind === 'STATUS_CHANGED' || eventKind === 'CANCELLED') {
        await this.sendFromTemplate('service-status-inapp', payload, {
          customerId,
          category: NotificationCategory.Service,
        });
        if (technicianId) {
          await this.sendFromTemplate('service-status-inapp', payload, {
            userId: technicianId,
            category: NotificationCategory.Service,
          });
        }
        return;
      }
    }

    if (eventType === EventType.TECHNICIAN_ASSIGNED) {
      await this.sendTemplatePair(
        'inspector-assigned-user-email',
        'inspector-assigned-user-inapp',
        payload,
        { customerId, category: NotificationCategory.Service }
      );
      if (technicianId) {
        await this.sendTemplatePair(
          'inspector-assigned-inspector-email',
          'inspector-assigned-inspector-inapp',
          payload,
          { userId: technicianId, category: NotificationCategory.Service }
        );
      }
      return;
    }

    throw new Error(`Unsupported service request event: ${eventType}`);
  }

  private async upsertExpiryTracker(payload: AssetEventPayload & { userId?: string }) {
    await prisma.expiryAlertTracker.upsert({
      where: { assetId: payload.assetId },
      update: {
        assetCode: payload.assetCode,
        customerId: payload.customerId,
        userId: payload.userId,
        expirationDate: new Date(payload.expirationDate),
      },
      create: {
        assetId: payload.assetId,
        assetCode: payload.assetCode,
        customerId: payload.customerId,
        userId: payload.userId,
        expirationDate: new Date(payload.expirationDate),
      },
    });
  }
}
