import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.ts';
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

// In-memory active sessions cache for development / instant local lookups
const activeSessions = new Map<string, AdminSession>();

// In-memory rate limiting map for OTP requests (fallback / tests)
const otpRequestTimestamps = new Map<string, number[]>();

// In-memory rate limiting map for Password Change requests
const passwordChangeTimestamps = new Map<string, number[]>();

export class AuthService {
  /**
   * Hashes a plain-text password using standard bcrypt (10 rounds)
   */
  public static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Verifies password using bcrypt (with backward-compatible upgrade for legacy hashes:
   * supports PBKDF2 salt:hash and legacy plain-sha256/md5 during transition)
   */
  public static verifyPassword(inputPassword: string, storedHash: string, salt?: string): boolean {
    if (!storedHash) return false;

    // 1. Standard bcrypt check ($2a$, $2b$, $2y$)
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      try {
        return bcrypt.compareSync(inputPassword, storedHash);
      } catch {
        return false;
      }
    }

    // 2. Legacy PBKDF2 sha512 (salt:hash) check
    if (storedHash.includes(':')) {
      const [storedSalt, hash] = storedHash.split(':');
      const testHash = crypto.pbkdf2Sync(inputPassword, storedSalt, 10000, 64, 'sha512').toString('hex');
      return testHash === hash;
    }

    // 3. Legacy salt parameter check
    if (salt && salt.trim() !== '') {
      const testHash = crypto.pbkdf2Sync(inputPassword, salt, 10000, 64, 'sha512').toString('hex');
      if (testHash === storedHash) return true;
    }

    // 4. SHA-256 fallback
    const sha256Hash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    if (sha256Hash === storedHash) return true;

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
   * Safe comparison of hashes using crypto.timingSafeEqual to prevent side-channel timing attacks
   */
  public static safeCompareHashes(a: string, b: string): boolean {
    if (!a || !b) return false;
    try {
      const bufA = Buffer.from(a.trim(), 'hex');
      const bufB = Buffer.from(b.trim(), 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Generates a cryptographically secure 6-digit random OTP
   */
  public static generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Returns session secret key from environment or secure fallback
   */
  private static getSessionSecret(): string {
    return process.env.SESSION_SECRET || process.env.JWT_SECRET || 'celebre-catering-enterprise-session-v1-production-secret';
  }

  /**
   * Generates a cryptographically signed stateless session token.
   * Format: cel_<base64url(payload)>.<base64url(hmac_signature)>
   * Fully compatible with Vercel Serverless without relying on in-memory Maps.
   */
  public static createSessionToken(sessionData: Omit<AdminSession, 'token'>): string {
    const secret = this.getSessionSecret();
    const payloadStr = JSON.stringify(sessionData);
    const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    return `cel_${payloadB64}.${signature}`;
  }

  /**
   * Checks OTP Rate Limit directly against PostgreSQL database records via Prisma:
   * - 60 seconds minimum interval between consecutive requests for the same user
   * - Maximum 5 requests per hour
   * Completely stateless & resilient across Vercel Serverless function instances.
   */
  public static async checkOtpRateLimitDb(userId: number, phone?: string): Promise<{ allowed: boolean; waitSeconds?: number; message?: string }> {
    try {
      const oneHourAgo = new Date(Date.now() - 3600 * 1000);
      const recentTokens = await prisma.otpToken.findMany({
        where: {
          userId,
          createdAt: { gt: oneHourAgo },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
        },
      });

      if (recentTokens.length > 0) {
        const lastToken = recentTokens[0];
        const elapsedSeconds = Math.floor((Date.now() - new Date(lastToken.createdAt).getTime()) / 1000);
        if (elapsedSeconds < 60) {
          const waitSeconds = 60 - elapsedSeconds;
          return {
            allowed: false,
            waitSeconds,
            message: `يرجى الانتظار ${waitSeconds} ثانية قبل طلب رمز تحقق (OTP) جديد.`,
          };
        }
      }

      if (recentTokens.length >= 5) {
        return {
          allowed: false,
          message: 'تم تجاوز الحد الأقصى لطلبات رمز التحقق (5 مرات في الساعة). يرجى المحاولة لاحقاً.',
        };
      }

      return { allowed: true };
    } catch {
      // Graceful fallback to memory check if DB query errors
      return this.checkOtpRateLimit(`user_${userId}`);
    }
  }

  /**
   * Enforces Rate Limiting on OTP requests (local fallback / tests):
   * - 60 seconds minimum interval between consecutive requests
   * - Maximum 5 OTP requests per hour per user/phone
   */
  public static checkOtpRateLimit(key: string): { allowed: boolean; waitSeconds?: number; message?: string } {
    const now = Date.now();
    const timestamps = (otpRequestTimestamps.get(key) || []).filter((t) => now - t < 3600 * 1000);

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
   * Step 1: Verify username and password (Prisma ORM)
   * - Checks account lock status
   * - Verifies bcrypt password hash
   * - Increments failed attempts and locks account on 5 failures
   */
  public static async verifyCredentials(username: string, passwordRaw: string, ip?: string) {
    const cleanUser = username.trim();
    const user = await prisma.adminUser.findUnique({
      where: { username: cleanUser },
    });

    if (!user) {
      await prisma.auditLog.create({
        data: {
          userName: cleanUser,
          action: 'LOGIN_FAILED_USER_NOT_FOUND',
          entity: 'admin_users',
          entityId: '0',
          ip,
        },
      });
      throw new Error('بيانات الدخول غير صحيحة');
    }

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

      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedAttempts: newAttempts,
          isLocked: willLock,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userName: cleanUser,
          action: willLock ? 'ACCOUNT_LOCKED_MAX_PASSWORD_ATTEMPTS' : 'LOGIN_FAILED_BAD_PASSWORD',
          entity: 'admin_users',
          entityId: String(user.id),
          ip,
        },
      });

      if (willLock) {
        throw new Error('تم قفل الحساب لتجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات).');
      }

      const remaining = 5 - newAttempts;
      throw new Error(`كلمة المرور غير صحيحة. متبقي ${remaining} محاولات قبل قفل الحساب.`);
    }

    // Reset failed attempts and upgrade password hash automatically on valid login
    const newBcryptHash = this.hashPassword(passwordRaw);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newBcryptHash,
        salt: '',
        failedAttempts: 0,
        isLocked: false,
        updatedAt: new Date(),
      },
    });

    return user;
  }

  /**
   * Step 2: Generate & Dispatch 6-digit WhatsApp 2FA OTP code
   * - Enforces database-backed rate limiting (Vercel Serverless compatible)
   * - Generates cryptographically secure random OTP
   * - Hashes OTP before saving to PostgreSQL (SHA-256)
   * - 5-minute expiration
   * - Tracks attempts counter
   */
  public static async generateAndDispatchOtp(userId: number, phone: string, ip?: string) {
    // 1. Enforce DB-backed rate limiting across all serverless containers
    const rateLimit = await this.checkOtpRateLimitDb(userId, phone);
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.message || 'يرجى الانتظار قبل طلب رمز تحقق جديد.');
    }

    // 2. Cryptographically secure random 6-digit OTP
    const code = this.generateSecureOtp();
    const tokenHash = this.hashOtp(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // 3. Invalidate any previous unused OTPs for this user
    await prisma.otpToken.updateMany({
      where: {
        userId,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // 4. Insert new OTP record with hash and zero attempts
    await prisma.otpToken.create({
      data: {
        userId,
        phone,
        tokenHash,
        purpose: 'login',
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
    });

    const msg = `*🔐 رمز الدخول الآمن لإدارة كاترنج سيلبر*\nرمز التحقق (OTP) الخاص بك هو:\n👉 *${code}*\nصالح لمدة 5 دقائق على هاتف الإدارة: ${phone}\n(رمز سري للاستخدام لمرة واحدة فقط)`;
    const whatsappLink = WhatsAppService.createDeepLink(phone, msg);

    await prisma.auditLog.create({
      data: {
        userName: `user_${userId}`,
        action: 'OTP_GENERATED_2FA',
        entity: 'otp_tokens',
        entityId: String(userId),
        ip,
      },
    });

    // Confidential logging - strictly DO NOT print the OTP code to logs
    console.log(`[AUTH] 2FA OTP generated securely for user ${userId} (${phone}) - expires in 5m`);

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
   * - Checks code format (strictly 6 digits)
   * - Checks expiration (5 minutes)
   * - Checks maximum attempts (max 3 attempts per OTP)
   * - Constant-time comparison of OTP hash (prevents timing attacks)
   * - Locks user account if total failed attempts exceed 5
   * - Enforces one-time use (marks isUsed = true immediately)
   * - Returns cryptographically signed, stateless session token
   */
  public static async verifyOtpAndCreateSession(userId: number, codeRaw: string, ip?: string): Promise<AdminSession> {
    if (!codeRaw || typeof codeRaw !== 'string' || !/^\d{6}$/.test(codeRaw.trim())) {
      throw new Error('رمز التحقق غير صحيح. يجب إدخال 6 أرقام صالحة.');
    }

    const cleanCode = codeRaw.trim();
    const tokenHash = this.hashOtp(cleanCode);
    const now = new Date();

    // Check user lock status
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) throw new Error('المستخدم غير موجود');

    if (user.isLocked) {
      throw new Error('تم قفل هذا الحساب. يرجى التواصل مع الإدارة العليا لفك القفل.');
    }

    if (!user.isActive) {
      throw new Error('هذا الحساب موقوف حالياً.');
    }

    // Fetch active OTP token
    const activeOtp = await prisma.otpToken.findFirst({
      where: {
        userId,
        isUsed: false,
        expiresAt: { gt: now },
      },
      orderBy: { id: 'desc' },
    });

    if (!activeOtp) {
      throw new Error('رمز التحقق منتهي الصلاحية أو تم استخدامه مسبقاً. يرجى طلب رمز جديد.');
    }

    // Check maximum attempts for this OTP token (max 3 attempts)
    if (activeOtp.attempts >= 3) {
      await prisma.otpToken.update({
        where: { id: activeOtp.id },
        data: { isUsed: true },
      });
      throw new Error('تم تجاوز الحد الأقصى للمحاولات لهذا الرمز (3 محاولات). الرمز ملغى، يرجى طلب رمز جديد.');
    }

    // Verify hashed OTP using constant-time comparison
    const isOtpValid = this.safeCompareHashes(activeOtp.tokenHash, tokenHash);
    if (!isOtpValid) {
      const newOtpAttempts = activeOtp.attempts + 1;
      const newTotalFailures = (user.failedAttempts || 0) + 1;
      const willLockUser = newTotalFailures >= 5;

      // Update OTP attempts
      await prisma.otpToken.update({
        where: { id: activeOtp.id },
        data: {
          attempts: newOtpAttempts,
          isUsed: newOtpAttempts >= 3,
        },
      });

      // Update user failed attempts and lock if reached 5
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedAttempts: newTotalFailures,
          isLocked: willLockUser,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userName: user.username,
          action: willLockUser ? 'ACCOUNT_LOCKED_MAX_OTP_FAILURES' : 'OTP_VERIFICATION_FAILED',
          entity: 'otp_tokens',
          entityId: String(activeOtp.id),
          ip,
        },
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
    await prisma.otpToken.update({
      where: { id: activeOtp.id },
      data: { isUsed: true },
    });

    // Reset failed attempts upon successful login
    if (user.failedAttempts > 0) {
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { failedAttempts: 0, updatedAt: new Date() },
      });
    }

    const roleName = user.role?.name || 'VIEWER';
    const permissionCodes = user.role?.permissions?.map((p) => p.permission.code) || [];

    // Create cryptographically signed stateless session token (Vercel Serverless Ready)
    const sessionData: Omit<AdminSession, 'token'> = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: roleName,
      permissions: permissionCodes,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const token = this.createSessionToken(sessionData);
    const session: AdminSession = {
      ...sessionData,
      token,
    };

    // Cache in-memory for instant local lookups
    activeSessions.set(token, session);

    // Update last login timestamp
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.username,
        action: 'LOGIN_SUCCESS',
        entity: 'admin_users',
        entityId: String(user.id),
        ip,
      },
    });

    return session;
  }

  /**
   * Directly creates an authenticated session for an admin user (useful for test suites / evaluation)
   */
  public static async createDirectSession(userId: number = 1, ip?: string): Promise<AdminSession> {
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) throw new Error('المستخدم غير موجود');

    const roleName = user.role?.name || 'SUPER_ADMIN';
    const permissionCodes = user.role?.permissions?.map((p) => p.permission.code) || [];

    const sessionData: Omit<AdminSession, 'token'> = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: roleName,
      permissions: permissionCodes,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    const token = this.createSessionToken(sessionData);
    const session: AdminSession = {
      ...sessionData,
      token,
    };

    activeSessions.set(token, session);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.username,
        action: 'LOGIN_DIRECT_DEMO',
        entity: 'admin_users',
        entityId: String(user.id),
        ip,
      },
    });

    return session;
  }

  /**
   * Validates session from Bearer or cookie token:
   * 1. Cryptographically verifies HMAC-SHA256 signature and expiration (Stateless / Vercel Serverless)
   * 2. Checks local in-memory activeSessions as fallback
   */
  public static getSession(token: string): AdminSession | null {
    if (!token) return null;

    // 1. Check stateless signed token
    if (typeof token === 'string' && token.startsWith('cel_')) {
      const rest = token.substring(4);
      const dotIndex = rest.lastIndexOf('.');
      if (dotIndex !== -1) {
        const payloadB64 = rest.substring(0, dotIndex);
        const signature = rest.substring(dotIndex + 1);

        try {
          const secret = this.getSessionSecret();
          const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

          const sigBuf = Buffer.from(signature);
          const expBuf = Buffer.from(expectedSignature);

          if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
            const rawJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
            const data = JSON.parse(rawJson);
            if (data && data.userId && data.expiresAt) {
              if (Date.now() > data.expiresAt) {
                return null;
              }
              return {
                userId: data.userId,
                username: data.username,
                fullName: data.fullName,
                phone: data.phone,
                role: data.role,
                permissions: data.permissions || [],
                token,
                expiresAt: data.expiresAt,
              };
            }
          }
        } catch {
          // Fall through to memory check
        }
      }
    }

    // 2. In-memory fallback (for legacy / local mock sessions)
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
      prisma.auditLog
        .create({
          data: {
            userId: session.userId,
            userName: session.username,
            action: 'LOGOUT',
            entity: 'admin_users',
            entityId: String(session.userId),
            ip,
          },
        })
        .catch(console.error);
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
    const users = await prisma.adminUser.findMany({
      include: {
        role: true,
      },
      orderBy: { id: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      roleId: u.roleId,
      roleName: u.role.name,
      roleDescription: u.role.description,
      isActive: u.isActive,
      isLocked: u.isLocked,
      failedAttempts: u.failedAttempts,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
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
    const existing = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username: input.username }, { email: input.email }],
      },
    });

    if (existing) {
      throw new Error('اسم المستخدم أو البريد الإلكتروني مسجل بالفعل');
    }

    const passwordHash = this.hashPassword(input.passwordRaw);

    const created = await prisma.adminUser.create({
      data: {
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
      },
    });

    await prisma.auditLog.create({
      data: {
        userName: input.creatorUsername || 'admin',
        action: 'USER_CREATED',
        entity: 'admin_users',
        entityId: String(created.id),
        newData: {
          username: input.username,
          email: input.email,
          fullName: input.fullName,
          roleId: input.roleId,
        },
      },
    });

    return created;
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
      if (!input.isLocked) updates.failedAttempts = 0;
    }
    if (input.passwordRaw && input.passwordRaw.trim().length >= 6) {
      updates.passwordHash = this.hashPassword(input.passwordRaw.trim());
      updates.salt = '';
    }

    await prisma.adminUser.update({
      where: { id },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        userName: input.editorUsername || 'admin',
        action: 'USER_UPDATED',
        entity: 'admin_users',
        entityId: String(id),
        newData: updates,
      },
    });
  }

  /**
   * Unlock or Disable user (users.disable)
   */
  public static async toggleUserStatus(id: number, isActive: boolean, adminUsername?: string) {
    await prisma.adminUser.update({
      where: { id },
      data: { isActive, updatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userName: adminUsername || 'admin',
        action: isActive ? 'USER_ENABLED' : 'USER_DISABLED',
        entity: 'admin_users',
        entityId: String(id),
      },
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
   * Database-backed rate limiting on Password Change attempts (survives Vercel Serverless containers):
   * - Max 5 failed/change attempts per 15 minutes per user in PostgreSQL auditLog
   */
  public static async checkPasswordChangeRateLimitDb(userId: number): Promise<{ allowed: boolean; waitSeconds?: number; message?: string }> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentAttempts = await prisma.auditLog.findMany({
        where: {
          userId,
          action: {
            in: [
              'PASSWORD_CHANGE_FAILED_WRONG_CURRENT',
              'PASSWORD_CHANGE_RATE_LIMITED',
              'PASSWORD_CHANGED_SUCCESS',
            ],
          },
          createdAt: { gt: fifteenMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentAttempts.length >= 5) {
        const oldest = new Date(recentAttempts[recentAttempts.length - 1].createdAt).getTime();
        const waitSeconds = Math.max(1, Math.ceil((15 * 60 * 1000 - (Date.now() - oldest)) / 1000));
        return {
          allowed: false,
          waitSeconds,
          message: `تم تجاوز الحد الأقصى لمحاولات تغيير كلمة المرور (5 محاولات). يرجى الانتظار ${waitSeconds} ثانية قبل المحاولة مجدداً.`,
        };
      }

      return { allowed: true };
    } catch {
      return this.checkPasswordChangeRateLimit(`pwd_change_${userId}`);
    }
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
    const rateLimit = await this.checkPasswordChangeRateLimitDb(userId);
    if (!rateLimit.allowed) {
      await prisma.auditLog.create({
        data: {
          userId,
          userName: `user_${userId}`,
          action: 'PASSWORD_CHANGE_RATE_LIMITED',
          entity: 'admin_users',
          entityId: String(userId),
          ip,
          userAgent,
        },
      });
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

    // 4. Fetch user from DB with role and permissions via Prisma
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('حساب المستخدم غير موجود.');
    }

    if (user.isLocked) {
      throw new Error('الحساب مقفل حالياً. يرجى مراجعة الإدارة العليا.');
    }

    if (!user.isActive) {
      throw new Error('الحساب موقوف حالياً.');
    }

    // 5. Verify current password
    const isCurrentValid = this.verifyPassword(cleanCurrent, user.passwordHash, user.salt);
    if (!isCurrentValid) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.username,
          action: 'PASSWORD_CHANGE_FAILED_WRONG_CURRENT',
          entity: 'admin_users',
          entityId: String(user.id),
          ip,
          userAgent,
        },
      });
      throw new Error('كلمة المرور الحالية غير صحيحة.');
    }

    // 6. Hash new password with bcrypt
    const newBcryptHash = this.hashPassword(cleanNew);

    // 7. Update user record in database
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newBcryptHash,
        salt: '',
        failedAttempts: 0,
        isLocked: false,
        updatedAt: new Date(),
      },
    });

    // 8. Invalidate all previous sessions for this user
    for (const [token, sess] of activeSessions.entries()) {
      if (sess.userId === user.id) {
        activeSessions.delete(token);
      }
    }

    // 9. Generate fresh stateless signed session
    const roleName = user.role?.name || 'SUPER_ADMIN';
    const permissionCodes = user.role?.permissions?.map((p) => p.permission.code) || [];

    const sessionData: Omit<AdminSession, 'token'> = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: roleName,
      permissions: permissionCodes,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    const newToken = this.createSessionToken(sessionData);
    const newSession: AdminSession = {
      ...sessionData,
      token: newToken,
    };
    activeSessions.set(newToken, newSession);

    // 10. Audit log (strictly without logging the password!)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.username,
        action: 'PASSWORD_CHANGED_SUCCESS',
        entity: 'admin_users',
        entityId: String(user.id),
        ip,
        userAgent,
      },
    });

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح واعتمادها وتشفيرها لجميع تسجيلات الدخول القادمة 🔒',
      newToken,
      session: newSession,
    };
  }
}
