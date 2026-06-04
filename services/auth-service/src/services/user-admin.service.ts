import bcrypt from 'bcryptjs';
import { RoleName, Prisma } from '../generated/prisma/index.js';
import { UserRole, paginationMeta, parsePagination } from '@fems/shared';
import { prisma } from '../prisma/client.js';
import { AuthError } from './auth.errors.js';
import { provisionCustomerProfile } from './customer-provisioning.service.js';
import { formatFullName } from '../utils/user-name.js';
import {
  notifyInspectorRoleAssigned,
  shouldNotifyInspectorPromotion,
  type AdminUpdateContext,
} from './inspector-appointment.service.js';

const BCRYPT_ROUNDS = 12;

const ROLE_PRIORITY: RoleName[] = [RoleName.Admin, RoleName.Inspector, RoleName.User];

type UserWithRoles = Prisma.UserGetPayload<{ include: { roles: { include: { role: true } } } }>;

function toRoleName(role: UserRole): RoleName {
  return role as RoleName;
}

function resolvePrimaryRole(user: UserWithRoles): UserRole {
  const names = user.roles.map((ur) => ur.role.name);
  for (const priority of ROLE_PRIORITY) {
    if (names.includes(priority)) return priority as UserRole;
  }
  return UserRole.USER;
}

function sanitize(user: UserWithRoles) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: formatFullName(user.firstName, user.lastName),
    phoneNumber: user.phoneNumber,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    customerId: user.customerId,
    role: resolvePrimaryRole(user),
    roles: user.roles.map((ur) => ur.role.name),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Exposes the admin-facing user management workflow without leaking password or token fields.
 */
export class UserAdminService {
  /**
   * Returns the admin search/list view with paging and role filters.
   */
  async listUsers(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const search = typeof query.search === 'string' ? query.search.trim() : '';
    const roleFilter = typeof query.role === 'string' ? query.role : undefined;
    const isActiveRaw = query.isActive;
    const isActive =
      isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (roleFilter) {
      where.roles = { some: { role: { name: roleFilter as RoleName } } };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { roles: { include: { role: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(sanitize),
      meta: paginationMeta(page, limit, total),
    };
  }

  /**
   * Returns a single user with role metadata for admin screens.
   */
  async getUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new AuthError('User not found', 404);
    return sanitize(user);
  }

  /**
   * Creates a user record and provisions a customer profile when the account belongs to a portal user.
   */
  async createUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: UserRole;
    isActive?: boolean;
  }) {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AuthError('Email is already registered', 409);

    const roleRecord = await prisma.role.findUnique({ where: { name: toRoleName(input.role) } });
    if (!roleRecord) throw new AuthError(`${input.role} role is not configured`, 500);

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    let user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber?.trim(),
        isEmailVerified: true,
        isActive: input.isActive ?? true,
        roles: { create: { roleId: roleRecord.id } },
      },
      include: { roles: { include: { role: true } } },
    });

    if (input.role === UserRole.USER && !user.customerId) {
      const customerId = await provisionCustomerProfile({
        userId: user.id,
        email: user.email,
        fullName: formatFullName(user.firstName, user.lastName),
        phoneNumber: user.phoneNumber,
        role: UserRole.USER,
      });
      if (customerId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { customerId },
          include: { roles: { include: { role: true } } },
        });
      }
    }

    return sanitize(user);
  }

  /**
   * Updates the admin-managed profile fields and keeps the role mapping in sync.
   */
  async updateUser(
    id: string,
    input: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      role?: UserRole;
      isActive?: boolean;
    },
    auditCtx: AdminUpdateContext = {}
  ) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new AuthError('User not found', 404);

    const previousRole = resolvePrimaryRole(user);

    const data: Prisma.UserUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName.trim();
    if (input.lastName !== undefined) data.lastName = input.lastName.trim();
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber?.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    let updated = await prisma.user.update({
      where: { id },
      data,
      include: { roles: { include: { role: true } } },
    });

    if (input.role) {
      const roleRecord = await prisma.role.findUnique({ where: { name: toRoleName(input.role) } });
      if (!roleRecord) throw new AuthError(`${input.role} role is not configured`, 500);
      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.userRole.create({ data: { userId: id, roleId: roleRecord.id } });
      updated = await prisma.user.findUniqueOrThrow({
        where: { id },
        include: { roles: { include: { role: true } } },
      });
      if (input.role === UserRole.USER && !updated.customerId) {
        const customerId = await provisionCustomerProfile({
          userId: updated.id,
          email: updated.email,
          fullName: formatFullName(updated.firstName, updated.lastName),
          phoneNumber: updated.phoneNumber,
          role: UserRole.USER,
        });
        if (customerId) {
          updated = await prisma.user.update({
            where: { id },
            data: { customerId },
            include: { roles: { include: { role: true } } },
          });
        }
      }
    }

    if (shouldNotifyInspectorPromotion(previousRole, input.role)) {
      void notifyInspectorRoleAssigned(
        {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
        },
        {
          ...auditCtx,
          previousRole,
        }
      );
    }

    return sanitize(updated);
  }
}
