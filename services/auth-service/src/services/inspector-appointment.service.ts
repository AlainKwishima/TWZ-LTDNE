import { UserRole } from '@fems/shared';
import { AuditAction } from '../generated/prisma/index.js';
import { formatFullName } from '../utils/user-name.js';
import { writeAuthAuditLog, type AuditContext } from './audit-log.service.js';
import { emailService } from './email.service.js';

export interface InspectorPromotionTarget {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AdminUpdateContext extends AuditContext {
  adminUserId?: string;
}

export interface InspectorPromotionContext extends AdminUpdateContext {
  previousRole: string;
}

/**
 * Sends the inspector appointment email only when an admin promotes a user to Inspector.
 * Never throws to the caller — failures are logged and recorded in auth_audit_logs.
 */
export async function notifyInspectorRoleAssigned(
  user: InspectorPromotionTarget,
  ctx: InspectorPromotionContext
): Promise<{ emailSent: boolean; error?: string }> {
  const fullName = formatFullName(user.firstName, user.lastName);
  const institutionName = process.env.BREVO_SENDER_NAME?.trim() || 'TWZ LTD';

  try {
    await emailService.sendInspectorAppointmentEmail({
      to: user.email,
      fullName,
      institutionName,
    });

    await writeAuthAuditLog(user.id, AuditAction.INSPECTOR_ROLE_ASSIGNED, ctx, {
      event: 'inspector_appointment_email',
      recipientEmail: user.email,
      previousRole: ctx.previousRole,
      newRole: UserRole.INSPECTOR,
      emailSent: true,
      emailDeliveryStatus: 'sent',
      assignedByAdminId: ctx.adminUserId ?? null,
    });

    console.log(
      `[InspectorAppointment] Email sent to ${user.email} (user ${user.id}, promoted from ${ctx.previousRole})`
    );

    return { emailSent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email delivery error';

    console.error(
      `[InspectorAppointment] Failed to send appointment email to ${user.email} (user ${user.id}): ${message}`
    );

    try {
      await writeAuthAuditLog(user.id, AuditAction.INSPECTOR_ROLE_ASSIGNED, ctx, {
        event: 'inspector_appointment_email',
        recipientEmail: user.email,
        previousRole: ctx.previousRole,
        newRole: UserRole.INSPECTOR,
        emailSent: false,
        emailDeliveryStatus: 'failed',
        emailError: message,
        assignedByAdminId: ctx.adminUserId ?? null,
      });
    } catch (auditError) {
      console.error(
        `[InspectorAppointment] Failed to write audit log for ${user.id}:`,
        auditError instanceof Error ? auditError.message : auditError
      );
    }

    return { emailSent: false, error: message };
  }
}

/** True when the admin explicitly sets role to Inspector and the user was not already an Inspector. */
export function shouldNotifyInspectorPromotion(
  previousRole: UserRole,
  requestedRole: UserRole | undefined
): boolean {
  return requestedRole === UserRole.INSPECTOR && previousRole !== UserRole.INSPECTOR;
}
