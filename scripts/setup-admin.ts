import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma.ts';

async function setupAdmin() {
  console.log('🛡️ [Celebre Catering] Admin User Setup & Verification');

  const username = (process.env.ADMIN_INITIAL_USERNAME || 'admin').trim();
  const email = (process.env.ADMIN_INITIAL_EMAIL || 'admin@celebre-eg.com').trim();
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();

  // Ensure SUPER_ADMIN role exists
  let superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'المدير العام والمالك - صلاحيات كاملة للنظام',
      },
    });
    console.log('✅ Created SUPER_ADMIN role');
  }
  const superAdminRoleId = superAdminRole.id;

  // Check if admin user already exists
  const existing = await prisma.adminUser.findUnique({ where: { username } });

  let finalPassword = envPassword;
  let isGenerated = false;

  if (!finalPassword) {
    if (existing) {
      console.log(`ℹ️ Admin user "${username}" already exists. (Password unchanged)`);
      console.log(`💡 To update password, set ADMIN_INITIAL_PASSWORD in .env or run with ADMIN_INITIAL_PASSWORD=yourpass npm run admin:setup`);
      return;
    } else {
      // Generate a strong 16-character random password
      finalPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, 'A') + '!9a';
      isGenerated = true;
    }
  }

  // Hash with bcrypt (10 rounds)
  const passwordHash = bcrypt.hashSync(finalPassword, 10);

  if (existing) {
    await prisma.adminUser.update({
      where: { username },
      data: {
        passwordHash,
        salt: '',
        email,
        isLocked: false,
        isActive: true,
        failedAttempts: 0,
        roleId: superAdminRoleId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userName: username,
        action: 'ADMIN_CREDENTIALS_RESET_CLI',
        entity: 'admin_users',
        entityId: String(existing.id),
      },
    });

    console.log(`✅ Admin user "${username}" credentials updated successfully.`);
  } else {
    const created = await prisma.adminUser.create({
      data: {
        username,
        email,
        fullName: 'إدارة سيلبر كاترنج المركزية',
        phone: '01284484868',
        passwordHash,
        salt: '',
        roleId: superAdminRoleId,
        isActive: true,
        isLocked: false,
        failedAttempts: 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userName: username,
        action: 'ADMIN_CREATED_CLI',
        entity: 'admin_users',
        entityId: String(created.id),
      },
    });

    console.log(`✅ Admin user "${username}" created successfully.`);
  }

  if (isGenerated) {
    console.log(`\n🔑 ONE-TIME GENERATED CREDENTIALS FOR OPERATOR:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${finalPassword}`);
    console.log(`   ⚠️ Please store this password securely and set ADMIN_INITIAL_PASSWORD in your .env file.\n`);
  } else {
    console.log(`🔒 Credentials configured from ADMIN_INITIAL_PASSWORD environment variable.`);
  }
}

setupAdmin()
  .then(async () => {
    console.log('✨ Admin setup finished.');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Admin setup error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
