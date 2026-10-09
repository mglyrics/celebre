import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/db/index.ts';
import { adminUsers, roles, auditLogs } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function setupAdmin() {
  console.log('🛡️ [Celebre Catering] Admin User Setup & Verification');

  const username = (process.env.ADMIN_INITIAL_USERNAME || 'admin').trim();
  const email = (process.env.ADMIN_INITIAL_EMAIL || 'admin@celebre-eg.com').trim();
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();

  // Ensure SUPER_ADMIN role exists
  let superAdminRole = await db.select().from(roles).where(eq(roles.name, 'SUPER_ADMIN')).limit(1);
  let superAdminRoleId = superAdminRole[0]?.id;

  if (!superAdminRoleId) {
    const [newRole] = await db
      .insert(roles)
      .values({
        name: 'SUPER_ADMIN',
        description: 'المدير العام والمالك - صلاحيات كاملة للنظام',
      })
      .returning();
    superAdminRoleId = newRole.id;
    console.log('✅ Created SUPER_ADMIN role');
  }

  // Check if admin user already exists
  const existing = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);

  let finalPassword = envPassword;
  let isGenerated = false;

  if (!finalPassword) {
    if (existing.length > 0) {
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

  if (existing.length > 0) {
    await db
      .update(adminUsers)
      .set({
        passwordHash,
        salt: '',
        email,
        isLocked: false,
        isActive: true,
        failedAttempts: 0,
        roleId: superAdminRoleId,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.username, username));

    await db.insert(auditLogs).values({
      userName: username,
      action: 'ADMIN_CREDENTIALS_RESET_CLI',
      entity: 'admin_users',
      entityId: String(existing[0].id),
      details: 'Password reset securely via CLI script',
    });

    console.log(`✅ Admin user "${username}" credentials updated successfully.`);
  } else {
    const [created] = await db
      .insert(adminUsers)
      .values({
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
      })
      .returning();

    await db.insert(auditLogs).values({
      userName: username,
      action: 'ADMIN_CREATED_CLI',
      entity: 'admin_users',
      entityId: String(created.id),
      details: 'Initial admin created securely via CLI script',
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
  .then(() => {
    console.log('✨ Admin setup finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Admin setup error:', err);
    process.exit(1);
  });
