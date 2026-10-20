import * as dotenv from 'dotenv';
dotenv.config();

import { AuthService } from '../src/services/authService.ts';
import { prisma } from '../src/lib/prisma.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runStage3AuthTests() {
  console.log('========================================================================');
  console.log('🛡️  CELEBRE-CATERING STAGE 3: ADMIN AUTHENTICATION & SECURITY TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // SECTION A: OFFLINE CRYPTOGRAPHIC & STATELESS TESTS (No DB connection required)
  console.log('--- SECTION A: Cryptographic & Stateless Validation ---');

  // Test 1: Password hashing via bcrypt
  try {
    const rawPass = 'CelebreAdmin@2026';
    const hash = AuthService.hashPassword(rawPass);
    assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Test 1a: Passwords hashed using bcrypt standard');
    assert(AuthService.verifyPassword(rawPass, hash), 'Test 1b: Correct password verifies successfully against bcrypt hash');
    assert(!AuthService.verifyPassword('WrongPassword', hash), 'Test 1c: Incorrect password rejected by bcrypt verification');
    passed++;
  } catch (err: any) {
    failed++;
    console.error(err.message);
  }

  // Test 2: Cryptographic 6-digit OTP generation
  try {
    const otp = AuthService.generateSecureOtp();
    assert(/^\d{6}$/.test(otp), `Test 2a: OTP is cryptographically secure 6-digit string (${otp})`);
    const hashedOtp = AuthService.hashOtp(otp);
    assert(hashedOtp.length === 64, 'Test 2b: OTP stored as SHA-256 hash (never plain text)');
    assert(AuthService.safeCompareHashes(hashedOtp, AuthService.hashOtp(otp)), 'Test 2c: Timing-safe hash comparison passes for identical hashes');
    assert(!AuthService.safeCompareHashes(hashedOtp, AuthService.hashOtp('000000')), 'Test 2d: Timing-safe hash comparison rejects mismatched hashes');
    passed++;
  } catch (err: any) {
    failed++;
    console.error(err.message);
  }

  // Test 3: Denial of administrative access without complete authentication
  try {
    assert(AuthService.getSession('') === null, 'Test 3a: Empty session token rejected');
    assert(AuthService.getSession('Bearer ') === null, 'Test 3b: Empty Bearer prefix rejected');
    assert(AuthService.getSession('invalid_token') === null, 'Test 3c: Arbitrary string token rejected');
    assert(AuthService.getSession('celebre-sec-1234567890-backdoor') === null, 'Test 3d: Legacy bypass prefix strictly rejected');
    assert(AuthService.getSession('cel_eyJhbGciOiJIUzI1NiJ9.fake_signature') === null, 'Test 3e: Forged HMAC signature strictly rejected');

    // Create an expired signed token
    const expiredPayload = {
      userId: 999,
      username: 'expired_admin',
      fullName: 'Expired Admin',
      phone: '01284484868',
      role: 'SUPER_ADMIN',
      permissions: ['orders.view'],
      expiresAt: Date.now() - 3600 * 1000, // 1 hour ago
    };
    const expiredToken = AuthService.createSessionToken(expiredPayload);
    assert(AuthService.getSession(expiredToken) === null, 'Test 3f: Expired session token rejected');
    passed++;
  } catch (err: any) {
    failed++;
    console.error(err.message);
  }

  // SECTION B: DATABASE-BACKED OTP LIFECYCLE TESTS (Requires PostgreSQL connection)
  console.log('\n--- SECTION B: Database-Backed PostgreSQL OTP Lifecycle ---');

  let isDbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    console.log('✅ PostgreSQL connection verified successfully.\n');
  } catch (e: any) {
    console.warn('⚠️ PostgreSQL is not reachable in this environment. Skipping DB-backed integration tests.');
  }

  if (isDbConnected) {
    // Setup isolated test user in DB
    const testUsername = `stage3_test_${Date.now()}`;
    const testPhone = '01284484868';
    let testRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    if (!testRole) {
      testRole = await prisma.role.create({
        data: { name: 'SUPER_ADMIN', description: 'Super Administrator' },
      });
    }

    const testAdmin = await prisma.adminUser.create({
      data: {
        username: testUsername,
        email: `${testUsername}@celebre.test`,
        passwordHash: AuthService.hashPassword('StrongPassword@2026'),
        fullName: 'Stage 3 Test Admin',
        phone: testPhone,
        roleId: testRole.id,
        isActive: true,
        isLocked: false,
        failedAttempts: 0,
      },
    });

    try {
      // Test 4: OTP Expiration (5 minutes)
      const expiredCode = '345678';
      await prisma.otpToken.create({
        data: {
          userId: testAdmin.id,
          phone: testPhone,
          tokenHash: AuthService.hashOtp(expiredCode),
          purpose: 'login',
          expiresAt: new Date(Date.now() - 30 * 1000), // Expired 30 seconds ago
          attempts: 0,
          isUsed: false,
        },
      });

      let expiredCaught = false;
      try {
        await AuthService.verifyOtpAndCreateSession(testAdmin.id, expiredCode);
      } catch (err: any) {
        expiredCaught = true;
        assert(err.message.includes('منتهي الصلاحية') || err.message.includes('استخدامه'), 'Test 4a: Expired OTP rejected with clear Arabic message');
      }
      assert(expiredCaught, 'Test 4b: Expired OTP code cannot be verified');
      passed++;

      // Test 5: Wrong OTP code rejection & attempts tracking
      await prisma.otpToken.deleteMany({ where: { userId: testAdmin.id } });
      const validOtpResult = await AuthService.generateAndDispatchOtp(testAdmin.id, testPhone);
      let wrongCodeCaught = false;
      try {
        await AuthService.verifyOtpAndCreateSession(testAdmin.id, '000000');
      } catch (err: any) {
        wrongCodeCaught = true;
        assert(err.message.includes('غير صحيح') || err.message.includes('محاولات'), 'Test 5a: Wrong OTP rejected with attempt count notice');
      }
      assert(wrongCodeCaught, 'Test 5b: Wrong OTP code strictly rejected');
      passed++;

      // Test 6: One-Time Use (OTP cannot be reused after verification)
      const successfulSession = await AuthService.verifyOtpAndCreateSession(testAdmin.id, validOtpResult.code);
      assert(Boolean(successfulSession.token) && successfulSession.token.startsWith('cel_'), 'Test 6a: Valid OTP verification returns signed session token');
      
      let reusedCaught = false;
      try {
        await AuthService.verifyOtpAndCreateSession(testAdmin.id, validOtpResult.code);
      } catch (err: any) {
        reusedCaught = true;
        assert(err.message.includes('استخدامه مسبقاً') || err.message.includes('منتهي'), 'Test 6b: Reused OTP rejected with one-time use violation error');
      }
      assert(reusedCaught, 'Test 6c: Reusing same OTP code strictly blocked');
      passed++;

      // Test 7: Exceeding maximum OTP attempts burns the token
      await prisma.otpToken.deleteMany({ where: { userId: testAdmin.id } });
      const burntOtpResult = await AuthService.generateAndDispatchOtp(testAdmin.id, testPhone);
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await AuthService.verifyOtpAndCreateSession(testAdmin.id, '111111');
        } catch {
          // Expected failure
        }
      }
      let burntCaught = false;
      try {
        await AuthService.verifyOtpAndCreateSession(testAdmin.id, burntOtpResult.code);
      } catch (err: any) {
        burntCaught = true;
        assert(err.message.includes('منتهي') || err.message.includes('استخدامه') || err.message.includes('إلغاء'), 'Test 7a: Burnt OTP token cannot be verified even with correct code');
      }
      assert(burntCaught, 'Test 7b: Token burned after 3 failed attempts');
      passed++;

      // Test 8: Rate Limiting in Database (60s cooldown between OTP requests)
      const rateLimitCheck1 = await AuthService.checkOtpRateLimitDb(testAdmin.id, testPhone);
      assert(rateLimitCheck1.allowed === false, 'Test 8a: Immediate consecutive OTP request rate limited with wait cooldown');
      assert((rateLimitCheck1.waitSeconds || 0) > 0, 'Test 8b: Rate limit specifies remaining cooldown seconds');
      passed++;

    } finally {
      // Clean up isolated test data
      await prisma.otpToken.deleteMany({ where: { userId: testAdmin.id } });
      await prisma.auditLog.deleteMany({ where: { userId: testAdmin.id } });
      await prisma.adminUser.delete({ where: { id: testAdmin.id } });
      console.log('\n🧹 Test admin user cleaned up cleanly from database.');
    }
  }

  console.log('\n========================================================================');
  console.log(`🏁 Summary: ${passed} passed suites, ${failed} failed.`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage3AuthTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
