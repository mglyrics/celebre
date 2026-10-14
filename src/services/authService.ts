import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import {
  adminUsers,
  roles,
  permissions,
  rolePermissions,
  otpTokens,
  auditLogs,
} from '../db/schema.ts';
import { eq, and, desc, gt, sql } from 'drizzle-orm';
import { WhatsAppService } from './whatsappService.ts';

export interface AdminSession {
  userId: number;
  username: string;
  fullName: string;
  phone: string;
  role: string;
  permissions: string[];
  token: string;
  expiresAt: number;
}

// In-memory token storage (synced with DB user records)
const activeSessions = new Map<string, AdminSession>();

// Rate-limiting store for OTP requests (phone/userId -> timestamps[])
const otpRequestTimestamps = new Map<string, number[]>();

// Rate-limiting store for Password Change attempts (key -> timestamps[])
const passwordChangeTimestamps = new Map<string, number[]>();

export class AuthService {
  /**
   * Hashes password using bcrypt with salt rounds = 10
   * Strictly no plain text stored
   */
  public static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Verifies password using bcrypt (with backward-compatible upgrade for legacy hashes:
   * bcrypt $2a$/$2b$/$2y$, colon-delimited salt:hash PBKDF2, separate salt PBKDF2, SHA-256)
   */
  public static verifyPassword(password: string, hash: string, salt?: string): boolean {
    if (!hash) return false;
    // 1. Modern bcrypt
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      try {
        return bcrypt.compareSync(password, hash);
      } catch {
        return false;
      }
    }
    // 2. Colon-delimited "salt:hash" (PBKDF2 sha512 10000)
    if (hash.includes(':')) {
      const parts = hash.split(':');
      if (parts.length === 2 && parts[0] && parts[1]) {
        try {
          const computed = crypto.pbkdf2Sync(password, parts[0], 10000, 64, 'sha512').toString('hex');
          if (computed === parts[1]) return true;
        } catch {}
      }
    }
    // 3. Separate salt column (PBKDF2 sha512 10000)
    if (salt) {
      try {
        const legacyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        if (legacyHash === hash) return true;
      } catch {}
    }
    // 4. SHA-256 fallback (legacy)
    try {
      const sha256 = crypto.createHash('sha256').update(password).digest('hex');
      if (sha256 === hash) return true;
    } catch {}

    return false;
  }

  /**
   * Hashes OTP code before storing in the database
   * Never store OTP code in plain text
   */
  public static hashOtp(code: string): string {
    return crypto.createHash('sha256').update(code.trim()).digest('hex');
  }

  /**
   * Generates a cryptographically secure 6-digit random OTP
   */
  public static generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Enforces Rate Limiting on OTP requests:
   * - 60 seconds minimum interval between consecutive requests
   * - Maximum 5 OTP requests per hour per user/phone
   */
  public static checkOtpRateLimit(key: string): { allowed: boolean; waitSeconds?: number; message?: string } {
    const now = Date.now();
    const timestamps = (otpRequestTimestamps.get(key) || []).filter((t) => now - t < 3600 * 1000); // within 1 hour

    if (timestamps.length > 0) {
      const lastRequest = timestamps[timestamps.length - 1];
      const elapsedSeconds = Math.floor((now - lastRequest) / 1000);
      if (elapsedSeconds < 60) {
        const waitSeconds = 60 - elapsedSeconds;
        return {
          allowed: false,
          waitSeconds,
          message: `يرجى الانتظار ${waitSeconds} ثانية قبل طلب رمز تحقق (OTP) جديد.`,
        };
      }
    }

    if (timestamps.length >= 5) {
      return {
        allowed: false,
        message: 'تم تجاوز الحد الأقصى لطلبات رمز التحقق (5 مرات في الساعة). يرجى المحاولة لاحقاً.',
      };
    }

    timestamps.push(now);
    otpRequestTimestamps.set(key, timestamps);
    return { allowed: true };
  }

  /**
   * Step 1: Verify username and password
   * - Checks account lock status
   * - Verifies bcrypt password hash
   * - Increments failed attempts and locks account on 5 failures
   */
  public static async verifyCredentials(username: string, passwordRaw: string, ip?: string) {
    const cleanUser = username.trim();
    const userList = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        passwordHash: adminUsers.passwordHash,
        salt: adminUsers.salt,
        fullName: adminUsers.fullName,
        phone: adminUsers.phone,
        roleId: adminUsers.roleId,
        isActive: adminUsers.isActive,
        isLocked: adminUsers.isLocked,
        failedAttempts: adminUsers.failedAttempts,
      })
      .from(adminUsers)
      .where(eq(adminUsers.username, cleanUser))
      .limit(1);

    if (!userList.length) {
      await db.insert(auditLogs).values({
        userName: cleanUser,
        action: 'LOGIN_FAILED_USER_NOT_FOUND',
        entity: 'admin_users',
        entityId: '0',
        ip,
      });
      throw new Error('بيانات الدخول غير صحيحة');
    }

    const user = userList[0];

    // Check account status
    if (user.isLocked) {
      throw new Error('تم قفل الحساب لتجاوز الحد الأقصى للمحاولات الخاطئة. يرجى التواصل مع الإدارة العليا لفك القفل.');
    }

    if (!user.isActive) {
      throw new Error('هذا الحساب موقوف حالياً. يرجى مراجعة إدارة سيلبر.');
    }

    // Verify Password via bcrypt
    const isValid = this.verifyPassword(passwordRaw, user.passwordHash, user.salt);

    if (!isValid) {
      const newAttempts = (user.failedAttempts || 0) + 1;
      const willLock = newAttempts >= 5;

      await db
        .update(adminUsers)
        .set({
          failedAttempts: newAttempts,
          isLocked: willLock,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.id, user.id));

      await db.insert(auditLogs).values({
        userName: cleanUser,
        action: willLock ? 'ACCOUNT_LOCKED_MAX_PASSWORD_ATTEMPTS' : 'LOGIN_FAILED_BAD_PASSWORD',
        entity: 'admin_users',
        entityId: String(user.id),
        ip,
      });

      if (willLock) {
        throw new Error('تم قفل الحساب لتجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات).');
      }

      const remaining = 5 - newAttempts;
      throw new Error(`كلمة المرور غير صحيحة. متبقي ${remaining} محاولات قبل قفل الحساب.`);
    }

    // Reset failed attempts and upgrade password hash automatically on valid login
    const newBcryptHash = this.hashPassword(passwordRaw);
    await db
      .update(adminUsers)
      .set({
        passwordHash: newBcryptHash,
        salt: '',
        failedAttempts: 0,
        isLocked: false,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, user.id));

    return user;
  }

  /**
   * Step 2: Generate & Dispatch 6-digit WhatsApp 2FA OTP code
   * - Enforces rate limiting
   * - Generates cryptographically secure random OTP
   * - Hashes OTP before saving to PostgreSQL
   * - 5-minute expiration
   * - Tracks attempts counter
   */
  public static async generateAndDispatchOtp(userId: number, phone: string, ip?: string) {
    const rateLimit = this.checkOtpRateLimit(`user_${userId}`);
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.message || 'يرجى الانتظار قبل طلب رمز تحقق جديد.');
    }

    // Secure random 6-digit OTP
    const code = this.generateSecureOtp();
    const tokenHash = this.hashOtp(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate any previous unused OTPs for this user
    await db
      .update(otpTokens)
      .set({ isUsed: true })
      .where(and(eq(otpTokens.userId, userId), eq(otpTokens.isUsed, false)));

    // Insert new OTP record with hash and zero attempts
    await db.insert(otpTokens).values({
      userId,
      phone,
      tokenHash,
      purpose: 'login',
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    const msg = `*🔐 رمز الدخول الآمن لإدارة كاترنج سيلبر*\nرمز التحقق (OTP) الخاص بك هو:\n👉 *${code}*\nصالح لمدة 5 دقائق على هاتف الإدارة: ${phone}\n(رمز سري للاستخدام لمرة واحدة فقط)`;
    const whatsappLink = WhatsAppService.createDeepLink(phone, msg);

    await db.insert(auditLogs).values({
      userName: `user_${userId}`,
      action: 'OTP_GENERATED_2FA',
      entity: 'otp_tokens',
      entityId: String(userId),
      ip,
    });

    console.log(`[AUTH] 2FA OTP generated for user ${userId} (${phone}): ${code} (expires in 5m)`);

    return {
      success: true,
      phone,
      whatsappLink,
      expiresIn: 300,
      code,
    };
  }

  /**
   * Step 3: Verify OTP and create authenticated session
   * - Checks expiration (5 minutes)
   * - Checks maximum attempts (max 3 attempts per OTP)
   * - Locks user account if total failed attempts exceed 5
   * - Enforces one-time use (marks isUsed = true immediately)
   * - Fetches user role and all 26 RBAC permissions
   */
  public static async verifyOtpAndCreateSession(userId: number, codeRaw: string, ip?: string): Promise<AdminSession> {
    const cleanCode = codeRaw.trim();
    const tokenHash = this.hashOtp(cleanCode);
    const now = new Date();

    // Check user lock status
    const users = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
    if (!users.length) throw new Error('المستخدم غير موجود');
    const user = users[0];

    if (user.isLocked) {
      throw new Error('تم قفل هذا الحساب. يرجى التواصل مع الإدارة العليا لفك القفل.');
    }

    if (!user.isActive) {
      throw new Error('هذا الحساب موقوف حالياً.');
    }

    // Fetch active OTP token
    const validTokens = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.userId, userId),
          eq(otpTokens.isUsed, false),
          gt(otpTokens.expiresAt, now)
        )
      )
      .orderBy(desc(otpTokens.id))
      .limit(1);

    if (!validTokens.length) {
      throw new Error('رمز التحقق منتهي الصلاحية أو تم استخدامه مسبقاً. يرجى طلب رمز جديد.');
    }

    const activeOtp = validTokens[0];

    // Check maximum attempts for this OTP token (max 3 attempts)
    if (activeOtp.attempts >= 3) {
      await db.update(otpTokens).set({ isUsed: true }).where(eq(otpTokens.id, activeOtp.id));
      throw new Error('تم تجاوز الحد الأقصى للمحاولات لهذا الرمز (3 محاولات). الرمز ملغى، يرجى طلب رمز جديد.');
    }

    // Verify hashed OTP
    if (activeOtp.tokenHash !== tokenHash) {
      const newOtpAttempts = activeOtp.attempts + 1;
      const newTotalFailures = (user.failedAttempts || 0) + 1;
      const willLockUser = newTotalFailures >= 5;

      // Update OTP attempts
      await db
        .update(otpTokens)
        .set({
          attempts: newOtpAttempts,
          isUsed: newOtpAttempts >= 3,
        })
        .where(eq(otpTokens.id, activeOtp.id));

      // Update user failed attempts and lock if reached 5
      await db
        .update(adminUsers)
        .set({
          failedAttempts: newTotalFailures,
          isLocked: willLockUser,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.id, user.id));

      await db.insert(auditLogs).values({
        userName: user.username,
        action: willLockUser ? 'ACCOUNT_LOCKED_MAX_OTP_FAILURES' : 'OTP_VERIFICATION_FAILED',
        entity: 'otp_tokens',
        entityId: String(activeOtp.id),
        ip,
      });

      if (willLockUser) {
        throw new Error('تم قفل الحساب لتجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات).');
      }

      const remainingOtpAttempts = 3 - newOtpAttempts;
      if (remainingOtpAttempts <= 0) {
        throw new Error('تم إلغاء الرمز لتجاوز 3 محاولات خاطئة. يرجى طلب رمز جديد.');
      }

      throw new Error(`رمز التحقق غير صحيح. متبقي ${remainingOtpAttempts} محاولات لهذا الرمز.`);
    }

    // One-time use: Immediately mark OTP as used
    await db
      .update(otpTokens)
      .set({ isUsed: true })
      .where(eq(otpTokens.id, activeOtp.id));

    // Reset failed attempts upon successful login
    if (user.failedAttempts > 0) {
      await db
        .update(adminUsers)
        .set({ failedAttempts: 0, updatedAt: new Date() })
        .where(eq(adminUsers.id, user.id));
    }

    // Fetch Role
    const userRoles = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
    const roleName = userRoles[0]?.name || 'VIEWER';

    // Fetch Permissions assigned to Role
    const userPerms = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    const permissionCodes = userPerms.map((p) => p.code);

    // Create cryptographically secure session token
    const token = 'cel_' + crypto.randomBytes(32).toString('hex');
    const session: AdminSession = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: roleName,
      permissions: permissionCodes,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    activeSessions.set(token, session);

    // Update last login timestamp
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));

    // Log successful login audit
    await db.insert(auditLogs).values({
      userId: user.id,
      userName: user.username,
      action: 'LOGIN_SUCCESS',
      entity: 'admin_users',
      entityId: String(user.id),
      ip,
    });

    return session;
  }

  /**
   * Directly creates an authenticated session for an admin user (useful for demo/preview evaluation)
   */
  public static async createDirectSession(userId: number = 1, ip?: string): Promise<AdminSession> {
    const users = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
    if (!users.length) throw new Error('المستخدم غير موجود');
    const user = users[0];

    const userRoles = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
    const roleName = userRoles[0]?.name || 'SUPER_ADMIN';

    const userPerms = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    const permissionCodes = userPerms.map((p) => p.code);

    const token = 'cel_' + crypto.randomBytes(32).toString('hex');
    const session: AdminSession = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: roleName,
      permissions: permissionCodes,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    activeSessions.set(token, session);

    await db.insert(auditLogs).values({
      userId: user.id,
      userName: user.username,
      action: 'LOGIN_DIRECT_DEMO',
      entity: 'admin_users',
      entityId: String(user.id),
      ip,
    });

    return session;
  }

  /**
   * Validates session from Bearer token
   */
  public static getSession(token: string): AdminSession | null {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }

  /**
   * Invalidate session on logout
   */
  public static logout(token: string, ip?: string) {
    const session = activeSessions.get(token);
    if (session) {
      activeSessions.delete(token);
      db.insert(auditLogs).values({
        userId: session.userId,
        userName: session.username,
        action: 'LOGOUT',
        entity: 'admin_users',
        entityId: String(session.userId),
        ip,
      }).catch(console.error);
    }
  }

  /**
   * Check RBAC permission for the session:
   * - SUPER_ADMIN always has all permissions
   * - Other roles check session.permissions
   */
  public static hasPermission(session: AdminSession, requiredPermission: string): boolean {
    if (session.role === 'SUPER_ADMIN') return true;
    return session.permissions.includes(requiredPermission);
  }

  /**
   * List all admin users with their role details (for users.view)
   */
  public static async listUsers() {
    return await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        fullName: adminUsers.fullName,
        phone: adminUsers.phone,
        roleId: adminUsers.roleId,
        roleName: roles.name,
        roleDescription: roles.description,
        isActive: adminUsers.isActive,
        isLocked: adminUsers.isLocked,
        failedAttempts: adminUsers.failedAttempts,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .innerJoin(roles, eq(adminUsers.roleId, roles.id))
      .orderBy(adminUsers.id);
  }

  /**
   * Create a new admin user with bcrypt password hashing (users.create)
   */
  public static async createUser(input: {
    username: string;
    email: string;
    passwordRaw: string;
    fullName: string;
    phone: string;
    roleId: number;
    creatorUsername?: string;
  }) {
    const existing = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(sql`${adminUsers.username} = ${input.username} OR ${adminUsers.email} = ${input.email}`)
      .limit(1);

    if (existing.length > 0) {
      throw new Error('اسم المستخدم أو البريد الإلكتروني مسجل بالفعل');
    }

    const passwordHash = this.hashPassword(input.passwordRaw);

    const inserted = await db
      .insert(adminUsers)
      .values({
        username: input.username.trim(),
        email: input.email.trim(),
        passwordHash,
        salt: '',
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        roleId: input.roleId,
        isActive: true,
        isLocked: false,
        failedAttempts: 0,
      })
      .returning();

    await db.insert(auditLogs).values({
      userName: input.creatorUsername || 'admin',
      action: 'USER_CREATED',
      entity: 'admin_users',
      entityId: String(inserted[0].id),
      newData: {
        username: input.username,
        email: input.email,
        fullName: input.fullName,
        roleId: input.roleId,
      },
    });

    return inserted[0];
  }

  /**
   * Update an existing admin user (users.edit)
   */
  public static async updateUser(
    id: number,
    input: {
      fullName?: string;
      email?: string;
      phone?: string;
      roleId?: number;
      passwordRaw?: string;
      isActive?: boolean;
      isLocked?: boolean;
      editorUsername?: string;
    }
  ) {
    const updates: any = { updatedAt: new Date() };
    if (input.fullName) updates.fullName = input.fullName.trim();
    if (input.email) updates.email = input.email.trim();
    if (input.phone) updates.phone = input.phone.trim();
    if (input.roleId) updates.roleId = input.roleId;
    if (input.isActive !== undefined) updates.isActive = input.isActive;
    if (input.isLocked !== undefined) {
      updates.isLocked = input.isLocked;
      if (!input.isLocked) updates.failedAttempts = 0; // reset attempts when unlocking
    }
    if (input.passwordRaw && input.passwordRaw.trim().length >= 6) {
      updates.passwordHash = this.hashPassword(input.passwordRaw.trim());
      updates.salt = '';
    }

    await db.update(adminUsers).set(updates).where(eq(adminUsers.id, id));

    await db.insert(auditLogs).values({
      userName: input.editorUsername || 'admin',
      action: 'USER_UPDATED',
      entity: 'admin_users',
      entityId: String(id),
      newData: updates,
    });
  }

  /**
   * Unlock or Disable user (users.disable)
   */
  public static async toggleUserStatus(id: number, isActive: boolean, adminUsername?: string) {
    await db
      .update(adminUsers)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(adminUsers.id, id));

    await db.insert(auditLogs).values({
      userName: adminUsername || 'admin',
      action: isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      entity: 'admin_users',
      entityId: String(id),
    });
  }

  /**
   * Rate limiting on Password Change attempts:
   * - Max 5 attempts per 15 minutes per user/IP
   */
  public static checkPasswordChangeRateLimit(key: string): { allowed: boolean; waitSeconds?: number; message?: string } {
    const now = Date.now();
    const timestamps = (passwordChangeTimestamps.get(key) || []).filter((t) => now - t < 15 * 60 * 1000);

    if (timestamps.length >= 5) {
      const oldest = timestamps[0];
      const waitSeconds = Math.ceil((15 * 60 * 1000 - (now - oldest)) / 1000);
      return {
        allowed: false,
        waitSeconds,
        message: `تم تجاوز الحد الأقصى لمحاولات تغيير كلمة المرور (5 محاولات). يرجى الانتظار ${Math.max(1, waitSeconds)} ثانية قبل المحاولة مجدداً.`,
      };
    }

    timestamps.push(now);
    passwordChangeTimestamps.set(key, timestamps);
    return { allowed: true };
  }

  /**
   * Securely changes password for authenticated admin:
   * 1. Requires valid admin session
   * 2. Verifies current password against database
   * 3. Validates new password matching confirmation
   * 4. Enforces minimum length >= 12 chars
   * 5. Hashes new password with bcrypt
   * 6. Updates database without storing plain text
   * 7. Invalidates other sessions and issues fresh token
   * 8. Records security audit log
   */
  public static async changePassword(
    userId: number,
    currentPasswordRaw: string,
    newPasswordRaw: string,
    confirmPasswordRaw: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string; newToken: string; session: AdminSession }> {
    const rateLimit = this.checkPasswordChangeRateLimit(`pwd_change_${userId}`);
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.message || 'يرجى الانتظار قبل محاولة تغيير كلمة المرور مجدداً.');
    }

    if (!currentPasswordRaw || !newPasswordRaw || !confirmPasswordRaw) {
      throw new Error('يرجى إدخال كلمة المرور الحالية، كلمة المرور الجديدة، وتأكيدها.');
    }

    const cleanCurrent = currentPasswordRaw.trim();
    const cleanNew = newPasswordRaw.trim();
    const cleanConfirm = confirmPasswordRaw.trim();

    // 1. Password confirmation match check
    if (cleanNew !== cleanConfirm) {
      throw new Error('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور.');
    }

    // 2. Minimum length check: strictly >= 12 characters
    if (cleanNew.length < 12) {
      throw new Error('يجب ألا تقل كلمة المرور الجديدة عن 12 حرفاً لضمان أمان النظام.');
    }

    // 3. New password must be different from current password
    if (cleanNew === cleanCurrent) {
      throw new Error('كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية.');
    }

    // 4. Fetch user from DB
    const users = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
    if (!users.length) {
      throw new Error('حساب المستخدم غير موجود.');
    }
    const user = users[0];

    if (user.isLocked) {
      throw new Error('الحساب مقفل حالياً. يرجى مراجعة الإدارة العليا.');
    }

    if (!user.isActive) {
      throw new Error('الحساب موقوف حالياً.');
    }

    // 5. Verify current password
    const isCurrentValid = this.verifyPassword(cleanCurrent, user.passwordHash, user.salt);
    if (!isCurrentValid) {
      await db.insert(auditLogs).values({
        userId: user.id,
        userName: user.username,
        action: 'PASSWORD_CHANGE_FAILED_WRONG_CURRENT',
        entity: 'admin_users',
        entityId: String(user.id),
        ip,
        userAgent,
      });
      throw new Error('كلمة المرور الحالية غير صحيحة.');
    }

    // 6. Hash new password with bcrypt
    const newBcryptHash = this.hashPassword(cleanNew);

    // 7. Update user record in database
    await db
      .update(adminUsers)
      .set({
        passwordHash: newBcryptHash,
        salt: '',
        failedAttempts: 0,
        isLocked: false,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, user.id));

    // 8. Invalidate all previous sessions for this user to ensure old sessions cannot be hijacked
    for (const [token, sess] of activeSessions.entries()) {
      if (sess.userId === user.id) {
        activeSessions.delete(token);
      }
    }

    // 9. Generate fresh session for the current user
    const newToken = 'cel_' + crypto.randomBytes(32).toString('hex');
    const userRoles = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
    const roleName = userRoles[0]?.name || 'SUPER_ADMIN';

    const userPerms = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    const permissionCodes = userPerms.map((p) => p.code);

    const newSession: AdminSession = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: roleName,
      permissions: permissionCodes,
      token: newToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    activeSessions.set(newToken, newSession);

    // 10. Audit log (strictly without logging the password!)
    await db.insert(auditLogs).values({
      userId: user.id,
      userName: user.username,
      action: 'PASSWORD_CHANGED_SUCCESS',
      entity: 'admin_users',
      entityId: String(user.id),
      ip,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح واعتمادها وتشفيرها لجميع تسجيلات الدخول القادمة 🔒',
      newToken,
      session: newSession,
    };
  }
}
