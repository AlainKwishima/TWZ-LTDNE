import { PrismaClient, RoleName } from '../src/generated/prisma/index.js';

import bcrypt from 'bcryptjs';



const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const SEED_PASSWORD = 'Password123!';



const roleDefinitions: Array<{ name: RoleName; description: string }> = [

  { name: RoleName.Admin, description: 'System administrator with full access' },

  { name: RoleName.Inspector, description: 'Field inspector for service requests and assets' },

  { name: RoleName.User, description: 'Portal user for assets and service requests' },

];



const userDefinitions = [

  {

    email: 'admin@fems.local',

    firstName: 'System',

    lastName: 'Administrator',

    phoneNumber: '+254700000001',

    role: RoleName.Admin,

  },

  {

    email: 'inspector@fems.local',

    firstName: 'Field',

    lastName: 'Inspector',

    phoneNumber: '+254700000003',

    role: RoleName.Inspector,

  },

  {

    email: 'user@fems.local',

    firstName: 'Demo',

    lastName: 'User',

    phoneNumber: '+254700000004',

    role: RoleName.User,

  },

];



async function main() {

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);



  const roles = new Map<RoleName, string>();



  for (const roleDef of roleDefinitions) {

    const role = await prisma.role.upsert({

      where: { name: roleDef.name },

      update: { description: roleDef.description },

      create: roleDef,

    });

    roles.set(roleDef.name, role.id);

  }



  for (const userDef of userDefinitions) {

    const roleId = roles.get(userDef.role);

    if (!roleId) {

      throw new Error(`Role not found: ${userDef.role}`);

    }



    const user = await prisma.user.upsert({

      where: { email: userDef.email },

      update: {

        firstName: userDef.firstName,

        lastName: userDef.lastName,

        phoneNumber: userDef.phoneNumber,

        passwordHash,

        isEmailVerified: true,

        isActive: true,

      },

      create: {

        email: userDef.email,

        firstName: userDef.firstName,

        lastName: userDef.lastName,

        phoneNumber: userDef.phoneNumber,

        passwordHash,

        isEmailVerified: true,

        isActive: true,

      },

    });



    if (userDef.role === RoleName.User) {

      await prisma.user.update({

        where: { id: user.id },

        data: { customerId: user.id },

      });

    }



    await prisma.userRole.upsert({

      where: {

        userId_roleId: { userId: user.id, roleId },

      },

      update: {},

      create: { userId: user.id, roleId },

    });

  }



  console.log('Auth service seed completed.');

  console.log('Demo users (password: Password123!):');

  for (const u of userDefinitions) {

    console.log(`  - ${u.email} (${u.role})`);

  }

}



main()

  .catch((error) => {

    console.error('Auth seed failed:', error);

    process.exit(1);

  })

  .finally(async () => {

    await prisma.$disconnect();

  });

