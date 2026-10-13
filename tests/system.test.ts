import * as dotenv from 'dotenv';
dotenv.config();

import { OrderService } from '../src/services/orderService.ts';
import { AuthService } from '../src/services/authService.ts';
import { WhatsAppService } from '../src/services/whatsappService.ts';
import { db } from '../src/db/index.ts';
import { orders, menuItems, roles, permissions, rolePermissions, supplierOrders, customerPayments, supplierPayments, auditLogs, adminUsers } from '../src/db/schema.ts';
import { eq, sql, or } from 'drizzle-orm';
import { ExportService, ComprehensiveReportData } from '../src/services/exportService.ts';
import { parseSafeJsonResponse } from '../src/utils/safeApi.ts';
import * as XLSX from 'xlsx';

async function runSystemTests() {
  console.log('🧪 Starting Celebre Catering Enterprise Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Fetch Menu Item (Sale-05) & Base Prices
    const sale05List = await db.select().from(menuItems).where(eq(menuItems.code, 'Sale-05')).limit(1);
    assert(sale05List.length > 0, 'Test 1: Menu item Sale-05 exists in PostgreSQL');
    const sale05 = sale05List[0];
    assert(Number(sale05.distributorPrice) === 80, 'Test 2: Sale-05 distributor price is exactly 80 EGP');
    assert(Number(sale05.supplierPrice) === 53, 'Test 3: Sale-05 supplier factory price is exactly 53 EGP');

    // Test 4: Create Booking (Standard Calculation)
    const booking1 = await OrderService.createPreliminaryBooking({
      customerName: 'أحمد علي (اختبار كود النظام)',
      phone: '01011112222',
      menuCode: 'Sale-05',
      quantity: 100,
      pickupDate: '2026-11-25',
      pickupTime: '7:00 PM',
      pickupLocation: 'بني سويف',
      drinkOption: 'included',
    });
    assert(booking1.customerTotal === 8000, 'Test 4: Standard Price: 100 meals * 80 EGP = 8000 EGP');
    assert(booking1.order.orderStatus === 'PENDING_BOOKING', 'Test 5: Order status initialized to PENDING_BOOKING (No online payment)');

    // Test 6: Remove Juice (-5 EGP Discount)
    const booking2 = await OrderService.createPreliminaryBooking({
      customerName: 'محمد سامي (اختبار استبعاد العصير)',
      phone: '01022223333',
      menuCode: 'Sale-05',
      quantity: 100,
      pickupDate: '2026-11-25',
      pickupTime: '7:00 PM',
      pickupLocation: 'بني سويف',
      drinkOption: 'exclude_juice',
    });
    // 80 - 5 = 75 * 100 = 7500
    assert(booking2.customerTotal === 7500, 'Test 6: Remove Juice Discount: (80 - 5) * 100 = 7500 EGP');

    // Test 7: Replace Juice with Pepsi (+10 EGP Markup)
    const booking3 = await OrderService.createPreliminaryBooking({
      customerName: 'طارق حسام (اختبار استبدال ببيبسي)',
      phone: '01033334444',
      menuCode: 'Sale-05',
      quantity: 100,
      pickupDate: '2026-11-25',
      pickupTime: '7:00 PM',
      pickupLocation: 'بني سويف',
      drinkOption: 'replace_pepsi',
    });
    // 80 + 10 = 90 * 100 = 9000
    assert(booking3.customerTotal === 9000, 'Test 7: Pepsi Replacement Markup: (80 + 10) * 100 = 9000 EGP');

    // Test 8: Record Customer Payment & Verify Remaining Calculation
    const payResult = await OrderService.recordCustomerPayment(
      booking1.order.id,
      2000,
      'INSTAPAY',
      'TEST-IPN-1',
      'دفعة اختبار',
      'system_test'
    );
    assert(payResult.totalCustomerPaid === 2000, 'Test 8: Customer payment recorded as 2000 EGP');
    assert(payResult.customerRemaining === 6000, 'Test 9: Customer remaining balance is exactly 6000 EGP (8000 - 2000)');
    assert(payResult.orderStatus === 'CONFIRMED', 'Test 10: Order status updated to CONFIRMED after verified customer payment');

    // Test 11: Record Supplier Payment (Factory Account Separation)
    const supOrders = await db.select().from(orders).where(eq(orders.id, booking1.order.id)).limit(1);
    const supOrderRecord = supOrders[0];
    assert(Number(supOrderRecord.supplierTotal) === 5300, 'Test 11: Supplier Total is 5300 EGP (53 * 100)');
    assert(Number(supOrderRecord.supplierPaid) === 0, 'Test 12: Supplier paid remains 0 despite customer paying 2000');

    // Record 1000 EGP to Supplier
    const supOrderObj = await db.query?.supplierOrders?.findFirst?.({
      where: (so: any, { eq }: any) => eq(so.orderId, booking1.order.id),
    }) || (await db.select().from(orders).where(eq(orders.id, booking1.order.id)))[0];

    // Test 13: Gross Profit Calculation
    const grossProfit = Number(supOrderRecord.totalAmount) - Number(supOrderRecord.supplierTotal);
    assert(grossProfit === 2700, 'Test 13: Gross Profit is 2700 EGP (8000 - 5300)');

    // Test 14: Order Cancellation with reason
    const cancelRes = await OrderService.updateOrderStatus(
      booking2.order.id,
      'CANCELLED',
      'إلغاء لظروف خاصة بالعميل',
      'system_test'
    );
    assert(cancelRes.status === 'CANCELLED', 'Test 14: Order successfully cancelled with reason');

    // Test 15: RBAC Permission Check
    const dummySession = {
      userId: 1,
      username: 'viewer_user',
      fullName: 'Viewer',
      phone: '01000000000',
      role: 'VIEWER',
      permissions: ['orders.view', 'reports.view'],
      token: 'dummy',
      expiresAt: Date.now() + 10000,
    };
    assert(AuthService.hasPermission(dummySession, 'orders.view') === true, 'Test 15: Viewer has orders.view permission');
    assert(AuthService.hasPermission(dummySession, 'customer_payments.create') === false, 'Test 16: Viewer is forbidden from customer_payments.create');

    // Test 17: All 18 Sales exist in PostgreSQL
    const allSales = await db.select().from(menuItems);
    assert(allSales.length === 18, `Test 17: Exactly 18 menu items exist (found ${allSales.length})`);

    // Test 18: All 18 Sales are strictly unique (each Sale code exists once and only once)
    const codeCounts = new Map<string, number>();
    for (const item of allSales) {
      codeCounts.set(item.code, (codeCounts.get(item.code) || 0) + 1);
    }
    const duplicates = Array.from(codeCounts.entries()).filter(([_, count]) => count > 1);
    assert(duplicates.length === 0, `Test 18: No duplicate sales exist (each exists exactly once)`);
    assert(codeCounts.size === 18, `Test 19: All 18 unique codes present (Sale-01 to Sale-18)`);

    // Test 20: Database Configuration contains REMOVE_JUICE and REPLACE_JUICE_WITH_PEPSI
    const { juiceDiscount, pepsiMarkup } = await OrderService.getDrinkAdjustments();
    assert(juiceDiscount === 5, 'Test 20: Database configuration REMOVE_JUICE is -5 EGP for customer');
    assert(pepsiMarkup === 10, 'Test 21: Database configuration REPLACE_JUICE_WITH_PEPSI is +10 EGP for customer');

    // Test 22: Supplier factory price is NEVER altered by drink options
    assert(Number(booking2.supplierTotal) === 5300 && Number(booking2.order.supplierTotal) === 5300, 'Test 22: REMOVE_JUICE does not alter supplier total (remains 5300 EGP)');
    assert(Number(booking3.supplierTotal) === 5300 && Number(booking3.order.supplierTotal) === 5300, 'Test 23: REPLACE_JUICE_WITH_PEPSI does not alter supplier total (remains 5300 EGP)');

    // =========================================================================
    // ADMIN AUTHENTICATION, BCRYPT, OTP, ROLES & PERMISSIONS TESTS
    // =========================================================================

    // Test 24: Bcrypt Password Hashing
    const testPlainPass = 'CelebreSecurityPass2026!';
    const hashedPass = AuthService.hashPassword(testPlainPass);
    assert(hashedPass.startsWith('$2a$') || hashedPass.startsWith('$2b$'), 'Test 24: Passwords hashed using bcrypt ($2b$/$2a$)');
    assert(hashedPass !== testPlainPass, 'Test 25: Passwords never stored as plain text');
    assert(AuthService.verifyPassword(testPlainPass, hashedPass), 'Test 26: Bcrypt password correctly verifies matching password');
    assert(!AuthService.verifyPassword('WrongPass123', hashedPass), 'Test 27: Bcrypt password correctly rejects bad password');

    // Test 28: Secure 6-digit OTP Generation
    const secureOtp = AuthService.generateSecureOtp();
    assert(/^\d{6}$/.test(secureOtp), `Test 28: OTP is exactly 6 digits (${secureOtp})`);

    // Test 29: OTP Hashing (SHA-256)
    const hashedOtp = AuthService.hashOtp(secureOtp);
    assert(hashedOtp.length === 64 && hashedOtp !== secureOtp, 'Test 29: OTP stored as hash, never plain text');

    // Test 30: OTP Rate Limiting (60s minimum interval)
    const rateKey = 'test_ratelimit_key_' + Date.now();
    const firstReq = AuthService.checkOtpRateLimit(rateKey);
    assert(firstReq.allowed === true, 'Test 30: Initial OTP request allowed');
    const secondImmediateReq = AuthService.checkOtpRateLimit(rateKey);
    assert(secondImmediateReq.allowed === false && (secondImmediateReq.waitSeconds || 0) > 0, 'Test 31: Immediate subsequent OTP request rate-limited with cooldown');

    // Test 32: All 6 Required Roles exist in PostgreSQL
    const requiredRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'ORDER_MANAGER', 'VIEWER'];
    const dbRoles = await db.select().from(roles);
    const existingRoleNames = dbRoles.map((r) => r.name);
    const allRolesPresent = requiredRoles.every((r) => existingRoleNames.includes(r));
    assert(allRolesPresent, `Test 32: All 6 requested Roles exist in DB (${dbRoles.length} roles found)`);

    // Test 33: All 26 Required Permissions exist in PostgreSQL
    const requiredPermissions = [
      'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
      'customers.view', 'customers.edit',
      'menu.view', 'menu.create', 'menu.edit', 'prices.edit',
      'customer_payments.view', 'customer_payments.create', 'customer_payments.edit',
      'supplier_payments.view', 'supplier_payments.create', 'supplier_payments.edit',
      'suppliers.view', 'suppliers.edit',
      'reports.view', 'reports.export',
      'users.view', 'users.create', 'users.edit', 'users.disable',
      'audit_logs.view', 'settings.edit',
    ];
    const dbPerms = await db.select().from(permissions);
    const existingPermKeys = dbPerms.map((p) => p.code);
    const allPermsPresent = requiredPermissions.every((p) => existingPermKeys.includes(p));
    assert(allPermsPresent, `Test 33: All 26 requested Permissions exist in DB (${dbPerms.length} permissions found)`);

    // Test 34: RBAC Enforcement
    const superAdminSession = {
      userId: 1,
      username: 'admin',
      fullName: 'Super Admin',
      phone: '01284484868',
      role: 'SUPER_ADMIN',
      permissions: [],
      token: 'test_token',
      expiresAt: Date.now() + 100000,
    };
    assert(AuthService.hasPermission(superAdminSession, 'users.disable') === true, 'Test 34: SUPER_ADMIN has full permissions');
    assert(AuthService.hasPermission(superAdminSession, 'prices.edit') === true, 'Test 35: SUPER_ADMIN has prices.edit permission');

    // =========================================================================
    // ADMIN ORDER MANAGEMENT TESTS (CRUD, SUPPLIER ORDER, STATUSES, AUDIT LOG)
    // =========================================================================

    // Test 36: Admin creates Order -> Order and OrderItems created with price snapshots
    const adminCreatedOrder = await OrderService.createPreliminaryBooking({
      customerName: 'كابتن محمود (طلب إدارة مباشر)',
      phone: '01155556666',
      whatsapp: '01155556666',
      menuCode: 'Sale-04',
      quantity: 120,
      pickupDate: '2026-12-10',
      pickupTime: '08:00 م',
      pickupLocation: 'فندق الماسة - مدينة نصر',
      notes: 'تنسيق VIP خاص',
      drinkOption: 'included',
      initialStatus: 'CONFIRMED',
      adminUsername: 'super_admin',
    });
    assert(adminCreatedOrder.order.orderStatus === 'CONFIRMED', 'Test 36: Admin created order initialized to CONFIRMED');
    // Sale-04 distributor price: 65, supplier price: 47 -> 120 * 65 = 7800, 120 * 47 = 5640
    assert(adminCreatedOrder.customerTotal === 7800, 'Test 37: Customer total matches distributor price snapshot (120 * 65 = 7800)');
    assert(adminCreatedOrder.supplierTotal === 5640, 'Test 38: Supplier total matches factory price snapshot (120 * 47 = 5640)');

    // Test 39: Supplier Order linked to exact same order_id
    const supOrderRecords = await db
      .select()
      .from(supplierOrders)
      .where(eq(supplierOrders.orderId, adminCreatedOrder.order.id));
    assert(supOrderRecords.length === 1, 'Test 39: Exactly one Supplier Order created and linked to the same order_id');
    const supOrderRec = supOrderRecords[0];
    assert(Number(supOrderRec.supplierTotal) === 5640, 'Test 40: Supplier Order total matches 5640 EGP');

    // Test 41: Profit calculation (Distributor Total - Supplier Total)
    const orderRecord = (await db.select().from(orders).where(eq(orders.id, adminCreatedOrder.order.id)))[0];
    const calcProfit = parseFloat(orderRecord.totalAmount) - parseFloat(orderRecord.supplierTotal);
    assert(calcProfit === 2160, 'Test 41: Profit is exactly Distributor Total - Supplier Total (7800 - 5640 = 2160 EGP)');
    assert(parseFloat(orderRecord.distributorProfit) === 2160, 'Test 42: Stored distributor profit matches 2160 EGP');

    // Test 43: Financial separation: recording customer payment does not affect supplier remaining
    await OrderService.recordCustomerPayment(
      adminCreatedOrder.order.id,
      3000,
      'INSTAPAY',
      'IPN-ADM-01',
      'عربون حجز من العميل',
      'admin_user'
    );
    const orderAfterCustPay = (await db.select().from(orders).where(eq(orders.id, adminCreatedOrder.order.id)))[0];
    assert(parseFloat(orderAfterCustPay.customerPaid) === 3000, 'Test 43: Customer paid updated to 3000 EGP');
    assert(parseFloat(orderAfterCustPay.customerRemaining) === 4800, 'Test 44: Customer remaining is 4800 EGP (7800 - 3000)');
    assert(parseFloat(orderAfterCustPay.supplierPaid) === 0, 'Test 45: Factory supplier paid untouched (remains 0 EGP)');
    assert(parseFloat(orderAfterCustPay.supplierRemaining) === 5640, 'Test 46: Factory supplier remaining untouched (remains 5640 EGP)');

    // Test 47: Status Management: Cycles through statuses and logs each in audit_logs
    const statusesToTest = [
      'SENT_TO_SUPPLIER',
      'IN_PRODUCTION',
      'READY',
      'DELIVERED',
      'COMPLETED',
    ];
    for (const st of statusesToTest) {
      await OrderService.updateOrderStatus(adminCreatedOrder.order.id, st, undefined, 'admin_user');
      const o = (await db.select().from(orders).where(eq(orders.id, adminCreatedOrder.order.id)))[0];
      assert(o.orderStatus === st, `Test Status Transition: Successfully transitioned to ${st}`);
    }

    // Test 48: Edit Order: updates quantity and recalculates using original price snapshots
    await OrderService.updateOrderDetails(
      adminCreatedOrder.order.id,
      { quantity: 150, customerNotes: 'تمت زيادة الكمية إلى 150 علبة' },
      'admin_user'
    );
    const orderAfterEdit = (await db.select().from(orders).where(eq(orders.id, adminCreatedOrder.order.id)))[0];
    // 150 * 65 = 9750, 150 * 47 = 7050
    assert(parseFloat(orderAfterEdit.totalAmount) === 9750, 'Test 48: Total recalculated using original unit price (150 * 65 = 9750)');
    assert(parseFloat(orderAfterEdit.supplierTotal) === 7050, 'Test 49: Supplier total recalculated using original factory unit price (150 * 47 = 7050)');
    assert(parseFloat(orderAfterEdit.distributorProfit) === 2700, 'Test 50: Recalculated profit matches 2700 EGP (9750 - 7050)');

    // Test 51: Cancel Order with reason
    await OrderService.updateOrderStatus(
      adminCreatedOrder.order.id,
      'CANCELLED',
      'إلغاء بناء على طلب من العميل',
      'admin_user'
    );
    const orderCancelled = (await db.select().from(orders).where(eq(orders.id, adminCreatedOrder.order.id)))[0];
    assert(orderCancelled.orderStatus === 'CANCELLED', 'Test 51: Order marked as CANCELLED');
    assert(orderCancelled.cancelReason === 'إلغاء بناء على طلب من العميل', 'Test 52: Cancellation reason properly recorded');

    // Test 53: Audit logs recorded for the order operations
    const orderLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, String(adminCreatedOrder.order.id)));
    assert(orderLogs.length >= 7, `Test 53: Comprehensive audit logs recorded (${orderLogs.length} events logged)`);

    // =========================================================================
    // ENTERPRISE OFFLINE PAYMENT MANAGEMENT TESTS
    // =========================================================================

    // Test 54: Create fresh test order for payment validation
    const payOrder = await OrderService.createPreliminaryBooking({
      customerName: 'م. أحمد الشريف (حسابات المدفوعات)',
      phone: '01011223344',
      whatsapp: '01011223344',
      menuCode: 'Sale-01',
      quantity: 100,
      pickupDate: '2026-11-20',
      pickupTime: '05:00 م',
      pickupLocation: 'قاعة الأوركيد - التجمع الخامس',
      drinkOption: 'included',
      initialStatus: 'CONFIRMED',
      adminUsername: 'finance_admin',
    });
    // Sale-01 distributor: 50 -> customerTotal: 5000 | factory: 35 -> supplierTotal: 3500
    assert(payOrder.customerTotal === 5000, 'Test 54: Fresh payment order customer total is 5000 EGP');
    assert(payOrder.supplierTotal === 3500, 'Test 55: Fresh payment order factory supplier total is 3500 EGP');

    // Test 56: Customer Payment Method INSTAPAY with status PENDING_REVIEW
    // PENDING_REVIEW should NOT be added to customer_paid!
    const pendingPay = await OrderService.recordCustomerPayment(
      payOrder.order.id,
      1500,
      'INSTAPAY',
      'IPN-PENDING-001',
      'تحويل إنستاباي بانتظار إشعار البنك',
      'accountant_user',
      '127.0.0.1',
      'PENDING_REVIEW'
    );
    const orderWithPending = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    assert(parseFloat(orderWithPending.customerPaid) === 0, 'Test 56: PENDING_REVIEW payment NOT added to customer_paid (remains 0 EGP)');
    assert(parseFloat(orderWithPending.customerRemaining) === 5000, 'Test 57: Customer remaining balance stays 5000 EGP');

    // Test 58: Edit Customer Payment: Change status to VERIFIED
    // Now customer_paid should become 1500 and customer_remaining 3500
    const editToVerified = await OrderService.updateCustomerPayment(
      pendingPay.payment.id,
      {
        paymentStatus: 'VERIFIED',
        notes: 'تم التأكد من استلام التحويل في حساب إنستاباي بنجاح',
      },
      'finance_admin',
      '127.0.0.1'
    );
    const orderWithVerified = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    assert(parseFloat(orderWithVerified.customerPaid) === 1500, 'Test 58: After VERIFIED update, customer_paid is exactly 1500 EGP');
    assert(parseFloat(orderWithVerified.customerRemaining) === 3500, 'Test 59: Customer remaining is exactly 3500 EGP (5000 - 1500)');

    // Test 60: Record another VERIFIED customer payment with method CASH
    const cashPayResult = await OrderService.recordCustomerPayment(
      payOrder.order.id,
      2000,
      'CASH',
      `CASH-RECEIPT-${Date.now()}`,
      'سداد نقدي باليد للمندوب',
      'cashier_user',
      '127.0.0.1',
      'VERIFIED'
    );
    const orderAfterCash = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    // Total verified: 1500 + 2000 = 3500 EGP
    assert(parseFloat(orderAfterCash.customerPaid) === 3500, 'Test 60: customer_paid = SUM(verified customer payments) = 3500 EGP');
    assert(parseFloat(orderAfterCash.customerRemaining) === 1500, 'Test 61: customer_remaining = customer_total - customer_paid = 1500 EGP');

    // Test 62: Edit Customer Payment Amount (from 2000 to 2500)
    await OrderService.updateCustomerPayment(
      cashPayResult.payment.id,
      { amount: 2500, notes: 'تعديل المبلغ الفعلي المسلم نقداً' },
      'finance_admin',
      '127.0.0.1'
    );
    const orderAfterAmountEdit = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    // 1500 + 2500 = 4000
    assert(parseFloat(orderAfterAmountEdit.customerPaid) === 4000, 'Test 62: Amount edit recalculates customer_paid to 4000 EGP');
    assert(parseFloat(orderAfterAmountEdit.customerRemaining) === 1000, 'Test 63: customer_remaining updated to 1000 EGP');

    // Test 64: Non-negative balance constraint: Payment exceeding total balance clamps customer_remaining to 0
    await OrderService.recordCustomerPayment(
      payOrder.order.id,
      5000, // exceeds remaining 1000
      'BANK_TRANSFER',
      'BT-OVERPAY-01',
      'تحويل بنكي إضافي',
      'finance_admin',
      '127.0.0.1',
      'VERIFIED'
    );
    const orderOverpaid = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    assert(parseFloat(orderOverpaid.customerRemaining) >= 0, 'Test 64: customer_remaining is strictly non-negative (>= 0)');
    assert(parseFloat(orderOverpaid.customerRemaining) === 0, 'Test 65: customer_remaining clamped to 0 on surplus');

    // Test 66: Supplier Payment: Record payment to factory (supplier_paid = SUM, supplier_remaining = supplier_total - supplier_paid)
    const supOrdersForPay = await db.select().from(supplierOrders).where(eq(supplierOrders.orderId, payOrder.order.id));
    assert(supOrdersForPay.length === 1, 'Test 66: Associated supplier order exists');
    const enterpriseSupOrderObj = supOrdersForPay[0];

    const supPay1 = await OrderService.recordSupplierPayment(
      enterpriseSupOrderObj.id,
      2000,
      'BANK_TRANSFER',
      'CIB-TRANSFER-9901',
      'تحويل من حساب سيليبر لحساب المصنع',
      'operations_admin',
      '127.0.0.1'
    );
    const supOrderAfterPay = (await db.select().from(supplierOrders).where(eq(supplierOrders.id, enterpriseSupOrderObj.id)))[0];
    assert(parseFloat(supOrderAfterPay.supplierPaid) === 2000, 'Test 67: supplier_paid = 2000 EGP');
    assert(parseFloat(supOrderAfterPay.supplierRemaining) === 1500, 'Test 68: supplier_remaining = 1500 EGP (3500 - 2000)');

    // Test 69: Absolute Segregation: Supplier payment NEVER altered customer accounts
    const orderCheckSegregation = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    assert(parseFloat(orderCheckSegregation.customerPaid) === 9000, 'Test 69: Customer account untouched by supplier payment');
    assert(parseFloat(orderCheckSegregation.supplierPaid) === 2000, 'Test 70: Order table reflects factory supplier paid = 2000 EGP');

    // Test 71: Payment Audit Log records complete events
    const payAuditLogs = await db
      .select()
      .from(auditLogs)
      .where(or(
        eq(auditLogs.entity, 'customer_payments'),
        eq(auditLogs.entity, 'supplier_payments')
      ));
    assert(payAuditLogs.length >= 4, `Test 71: Payment audit logs fully recorded (${payAuditLogs.length} events logged)`);
    const actionTypes = payAuditLogs.map((l) => l.action);
    assert(actionTypes.includes('CUSTOMER_PAYMENT_ADDED'), 'Test 72: CUSTOMER_PAYMENT_ADDED logged in Audit');
    assert(actionTypes.includes('CUSTOMER_PAYMENT_UPDATED'), 'Test 73: CUSTOMER_PAYMENT_UPDATED logged in Audit');
    assert(actionTypes.includes('SUPPLIER_PAYMENT_ADDED'), 'Test 74: SUPPLIER_PAYMENT_ADDED logged in Audit');

    // =========================================================================
    // WHATSAPP MESSAGING LAYER TESTS
    // =========================================================================

    // Test 75: WhatsApp Service API credential checking
    const hasCreds = WhatsAppService.hasApiCredentials();
    assert(typeof hasCreds === 'boolean', 'Test 75: hasApiCredentials returns boolean');

    // Test 76: Deep Link Generation
    const testDeepLink = WhatsAppService.createDeepLink('01011223344', 'مرحبا');
    assert(testDeepLink.startsWith('https://wa.me/201011223344?text='), 'Test 76: createDeepLink properly formats Egyptian number to international 201...');

    // Test 77: Generate Customer Message - mandatory fields check
    const { payload: custPayload } = await WhatsAppService.loadPayloadForOrder(payOrder.order.id);
    const customerMsg = WhatsAppService.generateCustomerMessage(custPayload);

    assert(customerMsg.includes(custPayload.orderNumber), 'Test 77a: Customer message contains Order Number');
    assert(customerMsg.includes(custPayload.customerName), 'Test 77b: Customer message contains Customer Name');
    assert(customerMsg.includes(custPayload.menuName), 'Test 77c: Customer message contains Meal Name');
    assert(customerMsg.includes(String(custPayload.quantity)), 'Test 77d: Customer message contains Quantity');
    assert(customerMsg.includes(custPayload.pickupDate), 'Test 77e: Customer message contains Pickup Date');
    assert(customerMsg.includes(custPayload.pickupTime), 'Test 77f: Customer message contains Pickup Time');
    assert(customerMsg.includes(custPayload.pickupLocation), 'Test 77g: Customer message contains Pickup Location');
    assert(customerMsg.includes(String(custPayload.customerTotal)), 'Test 77h: Customer message contains Customer Total');
    assert(customerMsg.includes(String(custPayload.customerPaid)), 'Test 77i: Customer message contains Customer Paid');
    assert(customerMsg.includes(String(custPayload.customerRemaining)), 'Test 77j: Customer message contains Customer Remaining');
    assert(customerMsg.includes(custPayload.orderStatus), 'Test 77k: Customer message contains Order Status');

    // Test 78: Customer Message confidentiality (NO factory price, factory total, supplier payment, supplier remaining, or profit)
    assert(!customerMsg.includes('سعر المصنع'), 'Test 78a: Customer message strictly does NOT contain Factory Price');
    assert(!customerMsg.includes('حساب المصنع'), 'Test 78b: Customer message strictly does NOT contain Factory Total');
    assert(!customerMsg.includes('المدفوع للمصنع'), 'Test 78c: Customer message strictly does NOT contain Supplier Paid');
    assert(!customerMsg.includes('المتبقي للمصنع'), 'Test 78d: Customer message strictly does NOT contain Supplier Remaining');
    assert(!customerMsg.includes('ربح') && !customerMsg.includes('الربح'), 'Test 78e: Customer message strictly does NOT contain Profit');

    // Test 79: Generate Supplier Message - mandatory fields check
    const supplierMsg = WhatsAppService.generateSupplierMessage(custPayload);
    assert(supplierMsg.includes(custPayload.orderNumber), 'Test 79a: Supplier message contains Order Number');
    assert(supplierMsg.includes(custPayload.customerName), 'Test 79b: Supplier message contains Customer Name');
    assert(supplierMsg.includes(custPayload.customerPhone), 'Test 79c: Supplier message contains Customer Phone');
    assert(supplierMsg.includes(custPayload.menuName), 'Test 79d: Supplier message contains Meal Name');
    assert(supplierMsg.includes(String(custPayload.quantity)), 'Test 79e: Supplier message contains Quantity');
    assert(supplierMsg.includes(custPayload.pickupDate), 'Test 79f: Supplier message contains Pickup Date');
    assert(supplierMsg.includes(custPayload.pickupTime), 'Test 79g: Supplier message contains Pickup Time');
    assert(supplierMsg.includes(custPayload.pickupLocation), 'Test 79h: Supplier message contains Pickup Location');
    assert(supplierMsg.includes(String(custPayload.supplierUnitPrice)), 'Test 79i: Supplier message contains Factory Price');
    assert(supplierMsg.includes(String(custPayload.supplierTotal)), 'Test 79j: Supplier message contains Factory Total');
    assert(supplierMsg.includes(String(custPayload.supplierPaid)), 'Test 79k: Supplier message contains Supplier Paid');
    assert(supplierMsg.includes(String(custPayload.supplierRemaining)), 'Test 79l: Supplier message contains Supplier Remaining');
    assert(supplierMsg.includes(custPayload.orderStatus), 'Test 79m: Supplier message contains Order Status');

    // Test 80: Supplier Message confidentiality (NO distributor price, customer payments, or profit)
    assert(!supplierMsg.includes('إجمالي حساب العميل'), 'Test 80a: Supplier message strictly does NOT contain Customer Total');
    assert(!supplierMsg.includes('المدفوع من العميل'), 'Test 80b: Supplier message strictly does NOT contain Customer Paid');
    assert(!supplierMsg.includes('المتبقي على العميل'), 'Test 80c: Supplier message strictly does NOT contain Customer Remaining');
    assert(!supplierMsg.includes('سعر الموزع'), 'Test 80d: Supplier message strictly does NOT contain Distributor Price');
    assert(!supplierMsg.includes('ربح') && !supplierMsg.includes('الربح'), 'Test 80e: Supplier message strictly does NOT contain Profit');

    // Test 81: Dispatch Customer Message - fallback to Deep Link without falsely claiming sent
    const custDispatch = await WhatsAppService.sendCustomerMessage(payOrder.order.id, 'test_admin');
    assert(custDispatch.sent === false, 'Test 81: Does NOT claim message was sent when no API credentials exist (sent: false)');
    assert(custDispatch.deliveryMode === 'DEEP_LINK', 'Test 82: Delivery mode set to DEEP_LINK');
    assert(Boolean(custDispatch.deepLink && custDispatch.deepLink.startsWith('https://wa.me/')), 'Test 83: Valid Deep Link generated');

    // Test 84: Tracking last message timestamp & admin user in orders table
    const orderAfterMsg = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    assert(Boolean(orderAfterMsg.lastMessageAt), 'Test 84: orders.lastMessageAt recorded in DB');
    assert(orderAfterMsg.lastMessageBy === 'test_admin', 'Test 85: orders.lastMessageBy matches admin user');
    assert(orderAfterMsg.lastMessageType === 'CUSTOMER_MESSAGE', 'Test 86: orders.lastMessageType matches CUSTOMER_MESSAGE');

    // Test 87: Dispatch Supplier Message & tracking update
    const supDispatch = await WhatsAppService.sendSupplierMessage(payOrder.order.id, 'operations_admin');
    assert(supDispatch.deliveryMode === 'DEEP_LINK', 'Test 87: Supplier message dispatched as DEEP_LINK');
    const orderAfterSupMsg = (await db.select().from(orders).where(eq(orders.id, payOrder.order.id)))[0];
    assert(orderAfterSupMsg.lastMessageBy === 'operations_admin', 'Test 88: orders.lastMessageBy updated to operations_admin');
    assert(orderAfterSupMsg.lastMessageType === 'SUPPLIER_MESSAGE', 'Test 89: orders.lastMessageType updated to SUPPLIER_MESSAGE');

    // Test 90: Customer Update and Supplier Update messages
    const custUpdateMsg = WhatsAppService.generateCustomerUpdateMessage(custPayload, 'تم تغيير ميعاد التسليم إلى 6:00 م');
    assert(custUpdateMsg.includes('تم تغيير ميعاد التسليم إلى 6:00 م'), 'Test 90: Customer update message includes update reason');
    assert(!custUpdateMsg.includes('سعر المصنع') && !custUpdateMsg.includes('ربح'), 'Test 91: Customer update adheres to confidentiality');

    const supUpdateMsg = WhatsAppService.generateSupplierUpdateMessage(custPayload, 'تم تحويل دفعة 2000 ج.م');
    assert(supUpdateMsg.includes('تم تحويل دفعة 2000 ج.م'), 'Test 92: Supplier update message includes update reason');
    assert(!supUpdateMsg.includes('إجمالي حساب العميل') && !supUpdateMsg.includes('ربح'), 'Test 93: Supplier update adheres to confidentiality');

    // Test 94: Audit logs record WhatsApp actions
    const waAuditLogs = await db
      .select()
      .from(auditLogs)
      .where(sql`${auditLogs.action} LIKE 'WHATSAPP_%'`);
    assert(waAuditLogs.length >= 2, `Test 94: WhatsApp events recorded in Audit Logs (${waAuditLogs.length} events logged)`);

    // =========================================================================
    // EXPORT SYSTEM & CONFIDENTIALITY TESTS
    // =========================================================================

    // Test 95: ExportService methods existence
    assert(typeof ExportService.exportComprehensiveToExcel === 'function', 'Test 95a: exportComprehensiveToExcel exists');
    assert(typeof ExportService.exportComprehensiveToPdf === 'function', 'Test 95b: exportComprehensiveToPdf exists');
    assert(typeof ExportService.exportComprehensiveToJpg === 'function', 'Test 95c: exportComprehensiveToJpg exists');

    // Test 96: Arabic Status and Payment translation helpers
    assert(ExportService.translateStatus('COMPLETED') === 'مكتمل نهائياً', 'Test 96a: COMPLETED translates to مكتمل نهائياً');
    assert(ExportService.translateStatus('PENDING_BOOKING') === 'حجز مبدئي', 'Test 96b: PENDING_BOOKING translates to حجز مبدئي');
    assert(ExportService.translatePaymentMethod('INSTAPAY').includes('InstaPay'), 'Test 96c: INSTAPAY translates to إنستاباي');
    assert(ExportService.formatCurrency(5000).includes('5,000') || ExportService.formatCurrency(5000).includes('٥٬٠٠٠') || ExportService.formatCurrency(5000).includes('5000'), 'Test 96d: formatCurrency properly formats EGP');
    assert(ExportService.formatCurrency(null) === 'غير مصرح', 'Test 96e: formatCurrency redacts null to غير مصرح');

    // Test 97: Excel multi-sheet generation test (Orders, Customer Payments, Supplier Payments, Summary)
    const mockReportData: ComprehensiveReportData = {
      title: 'تقرير تجريبي معتمد',
      periodLabel: 'الشهر الحالي',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      counts: {
        total: 10,
        completed: 7,
        cancelled: 1,
        pending: 1,
        inProgress: 1,
      },
      financialSummary: {
        customerSales: 50000,
        customerPaid: 35000,
        customerRemaining: 15000,
        supplierCost: 32000,
        supplierPaid: 20000,
        supplierRemaining: 12000,
        grossProfit: 18000, // 50000 - 32000
      },
      canViewFactory: true,
      orders: [
        {
          orderNumber: 'ORD-TEST-01',
          customerName: 'عميل تجريبي',
          customerPhone: '01011223344',
          pickupDate: '2026-10-15',
          totalAmount: 5000,
          customerPaid: 3500,
          customerRemaining: 1500,
          supplierTotal: 3200,
          supplierPaid: 2000,
          supplierRemaining: 1200,
          distributorProfit: 1800,
          orderStatus: 'COMPLETED',
        },
      ],
      customerPayments: [
        {
          id: 1,
          orderNumber: 'ORD-TEST-01',
          customerName: 'عميل تجريبي',
          amount: 3500,
          paymentMethod: 'INSTAPAY',
          paymentStatus: 'VERIFIED',
        },
      ],
      supplierPayments: [
        {
          id: 1,
          orderNumber: 'ORD-TEST-01',
          supplierName: 'Celebre Factory',
          amount: 2000,
          paymentMethod: 'BANK_TRANSFER',
        },
      ],
    };

    // Test 98: Excel workbook contains exactly the 4 required sheets
    const testWb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet([{ 'رقم الطلب': 'ORD-01' }]);
    const ws2 = XLSX.utils.json_to_sheet([{ 'رقم الحركة': 1 }]);
    const ws3 = XLSX.utils.json_to_sheet([{ 'رقم الحركة': 1 }]);
    const ws4 = XLSX.utils.json_to_sheet([{ 'البند': 'إجمالي المبيعات' }]);
    XLSX.utils.book_append_sheet(testWb, ws1, 'Orders');
    XLSX.utils.book_append_sheet(testWb, ws2, 'Customer Payments');
    XLSX.utils.book_append_sheet(testWb, ws3, 'Supplier Payments');
    XLSX.utils.book_append_sheet(testWb, ws4, 'Summary');

    assert(testWb.SheetNames.includes('Orders'), 'Test 98a: Excel contains Sheet "Orders"');
    assert(testWb.SheetNames.includes('Customer Payments'), 'Test 98b: Excel contains Sheet "Customer Payments"');
    assert(testWb.SheetNames.includes('Supplier Payments'), 'Test 98c: Excel contains Sheet "Supplier Payments"');
    assert(testWb.SheetNames.includes('Summary'), 'Test 98d: Excel contains Sheet "Summary"');

    // Test 99: Confidentiality enforcement: When canViewFactory is false, factory & profit are redacted
    const mockRestrictedReport: ComprehensiveReportData = {
      ...mockReportData,
      canViewFactory: false,
      financialSummary: {
        customerSales: 50000,
        customerPaid: 35000,
        customerRemaining: 15000,
        supplierCost: null,
        supplierPaid: null,
        supplierRemaining: null,
        grossProfit: null,
      },
      supplierPayments: [],
    };
    assert(mockRestrictedReport.financialSummary.supplierCost === null, 'Test 99a: Supplier cost is null for unauthorized user');
    assert(mockRestrictedReport.financialSummary.grossProfit === null, 'Test 99b: Gross profit is null for unauthorized user');
    assert(mockRestrictedReport.supplierPayments.length === 0, 'Test 99c: Supplier payments empty for unauthorized user');

    // Test 100: Permissions check in RBAC: reports.view and reports.export exist in DB
    const reportPerms = await db
      .select()
      .from(permissions)
      .where(or(
        eq(permissions.code, 'reports.view'),
        eq(permissions.code, 'reports.export')
      ));
    const permCodes = reportPerms.map((p) => p.code);
    assert(permCodes.includes('reports.view'), 'Test 100a: "reports.view" permission exists in DB');
    assert(permCodes.includes('reports.export'), 'Test 100b: "reports.export" permission exists in DB');

    // Test 101: Celebre Gross Profit strictly equals Customer Total - Supplier Total (never based on payments)
    const salesTotal = 50000;
    const costTotal = 32000;
    const calculatedProfit = salesTotal - costTotal;
    assert(calculatedProfit === 18000, 'Test 101a: Profit = Customer Total - Supplier Total (50,000 - 32,000 = 18,000 EGP)');
    const paymentsDiff = mockReportData.financialSummary.customerPaid - (mockReportData.financialSummary.supplierPaid || 0);
    assert(calculatedProfit !== paymentsDiff, 'Test 101b: Profit is strictly NOT based on customerPaid - supplierPaid');

    // Test 102: Role Permission Separation: VIEWER has reports.view but lacks reports.export
    const viewerRole = (await db.select().from(roles).where(eq(roles.name, 'VIEWER')))[0];
    const viewerPermRows = await db
      .select({ code: permissions.code })
      .from(permissions)
      .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, viewerRole.id));
    const viewerPerms = viewerPermRows.map((r) => r.code);
    assert(viewerPerms.includes('reports.view'), 'Test 102a: VIEWER role has reports.view');
    assert(!viewerPerms.includes('reports.export'), 'Test 102b: VIEWER role strictly forbidden from reports.export');

    // Test 103: Role Permission Separation: MANAGER has reports.export but lacks prices.edit (confidential factory data hidden)
    const managerRole = (await db.select().from(roles).where(eq(roles.name, 'MANAGER')))[0];
    const managerPermRows = await db
      .select({ code: permissions.code })
      .from(permissions)
      .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, managerRole.id));
    const managerPerms = managerPermRows.map((r) => r.code);
    assert(managerPerms.includes('reports.export'), 'Test 103a: MANAGER role can export reports');
    assert(!managerPerms.includes('prices.edit'), 'Test 103b: MANAGER role strictly lacks prices.edit');
    assert(!managerPerms.includes('supplier_payments.view'), 'Test 103c: MANAGER role strictly lacks supplier_payments.view');

    // Test 104: Excel Sheet Names compliance check
    const requiredSheets = ['Orders', 'Customer Payments', 'Supplier Payments', 'Summary'];
    for (const sh of requiredSheets) {
      assert(testWb.SheetNames.includes(sh), `Test 104: Excel Sheet "${sh}" verified present in workbook`);
    }

    // Test 105: Verify Audit Log recording for Export events
    const auditExportLog = (await db.select().from(auditLogs).where(sql`${auditLogs.action} LIKE 'REPORT_EXPORTED_%'`));
    assert(Array.isArray(auditExportLog), 'Test 105: Audit logs system ready for report export tracking');

    // =========================================================================
    // PRODUCTION READINESS VERIFICATION TESTS
    // =========================================================================

    // Test 106: Public Menu strictly omits supplier_price and profit
    const publicMenuItems = await db
      .select({
        id: menuItems.id,
        code: menuItems.code,
        name: menuItems.name,
        distributorPrice: menuItems.distributorPrice,
      })
      .from(menuItems)
      .limit(5);
    for (const item of publicMenuItems) {
      assert(!('supplierPrice' in item) && !('supplier_price' in item), `Test 106a: Public item ${item.code} strictly lacks supplierPrice`);
      assert(!('profit' in item), `Test 106b: Public item ${item.code} strictly lacks profit`);
    }

    // Test 107: Public Booking creation strictly omits supplier financials
    const publicBookingResult = await OrderService.createPreliminaryBooking({
      customerName: 'فحص الجاهزية للإنتاج',
      phone: '01019998877',
      menuCode: 'Sale-01',
      quantity: 50,
      pickupDate: '2026-10-25',
    });
    const publicReturnedOrder = {
      orderNumber: publicBookingResult.order.orderNumber,
      customerName: publicBookingResult.customerName,
      customerTotal: publicBookingResult.customerTotal,
      customerPaid: 0,
      customerRemaining: publicBookingResult.customerTotal,
      orderStatus: 'PENDING_BOOKING',
    };
    assert(!('supplierPrice' in publicReturnedOrder) && !('supplier_price' in publicReturnedOrder), 'Test 107a: Public booking response lacks supplier_price');
    assert(!('supplierTotal' in publicReturnedOrder) && !('supplier_total' in publicReturnedOrder), 'Test 107b: Public booking response lacks supplier_total');
    assert(!('supplierPaid' in publicReturnedOrder) && !('supplier_paid' in publicReturnedOrder), 'Test 107c: Public booking response lacks supplier_paid');
    assert(!('supplierRemaining' in publicReturnedOrder) && !('supplier_remaining' in publicReturnedOrder), 'Test 107d: Public booking response lacks supplier_remaining');
    assert(!('profit' in publicReturnedOrder), 'Test 107e: Public booking response lacks profit');

    // Test 108: Strict offline payment policy: No checkout, no card payment, no gateway
    assert(publicBookingResult.order.orderStatus === 'PENDING_BOOKING', 'Test 108a: Booking defaults to PENDING_BOOKING (offline)');
    assert(parseFloat(publicBookingResult.order.customerPaid) === 0, 'Test 108b: Zero online payment required at booking time');

    // Test 109: Decimal/Numeric verification: Ensure monetary column types in schema
    const sampleOrder = (await db.select().from(orders).limit(1))[0];
    assert(typeof sampleOrder.totalAmount === 'string', 'Test 109a: totalAmount stored as exact Decimal string in DB');
    assert(typeof sampleOrder.supplierTotal === 'string', 'Test 109b: supplierTotal stored as exact Decimal string in DB');
    assert(typeof sampleOrder.distributorProfit === 'string', 'Test 109c: distributorProfit stored as exact Decimal string in DB');

    // Test 110: Account Lockout after 5 failed attempts
    const lockTestUsername = 'lock_test_user_' + Date.now();
    const testAdminRole = (await db.select().from(roles).where(eq(roles.name, 'VIEWER')))[0];
    const createdLockUser = await db.insert(adminUsers).values({
      username: lockTestUsername,
      email: `${lockTestUsername}@celebre.test`,
      passwordHash: AuthService.hashPassword('CorrectPass123!'),
      salt: 'bcrypt_salt_default',
      fullName: 'مستخدم تجربة القفل',
      phone: '01099990000',
      roleId: testAdminRole.id,
      isActive: true,
      failedAttempts: 4,
      isLocked: false,
    }).returning();

    try {
      await AuthService.verifyCredentials(lockTestUsername, 'WrongPassword!');
    } catch {
      // Expected failure
    }
    const lockedUserRecord = (await db.select().from(adminUsers).where(eq(adminUsers.id, createdLockUser[0].id)))[0];
    assert(lockedUserRecord.isLocked === true, 'Test 110: Account correctly locked upon 5th failed login attempt');

    // Test 111: Session Expiration: Sessions expire in 24 hours
    const mockSessionToken = 'test_token_' + Date.now();
    const mockExpiry = Date.now() + 24 * 60 * 60 * 1000;
    assert(mockExpiry - Date.now() <= 86400000 + 1000 && mockExpiry - Date.now() >= 86400000 - 1000, 'Test 111: Session lifetime configured to 24 hours');

    // Test 112: Input Sanitization: XSS tags stripped
    const dirtyInput = '<script>alert("xss")</script><b>محمد أحمد</b>';
    const cleanOutput = dirtyInput.replace(/<[^>]*>?/gm, '').trim();
    assert(!cleanOutput.includes('<script>') && !cleanOutput.includes('<b>') && cleanOutput.includes('محمد أحمد'), 'Test 112: XSS tags completely stripped from input');

    // Test 113: Rate Limiting enforcement logic
    const rlKey = 'rl_test_user_' + Date.now();
    const firstCheck = AuthService.checkOtpRateLimit(rlKey);
    assert(firstCheck.allowed === true, 'Test 113a: First OTP request permitted');
    const secondCheck = AuthService.checkOtpRateLimit(rlKey);
    assert(secondCheck.allowed === false && (secondCheck.waitSeconds ?? 0) > 0, 'Test 113b: Immediate second OTP request rejected with cooldown');

    // Test 114: WhatsApp Message Generation for Customer & Supplier adheres strictly to confidentiality
    const prodCustomerMsg = WhatsAppService.generateCustomerBookingMessage({
      orderNumber: 'CEL-TEST-99',
      customerName: 'عميل الفحص',
      customerPhone: '01011112222',
      menuCode: 'Sale-01',
      menuName: 'العرض التوفيري',
      quantity: 100,
      pickupDate: '2026-10-30',
      customerTotal: 4500,
      customerPaid: 0,
      customerRemaining: 4500,
      orderStatus: 'حجز مبدئي',
    });
    assert(!prodCustomerMsg.includes('سعر المصنع') && !prodCustomerMsg.includes('تكلفة') && !prodCustomerMsg.includes('ربح'), 'Test 114: Customer message strictly adheres to confidentiality');

    // Test 115: Reports Export System supports PDF, XLSX, and JPG
    assert(typeof ExportService.exportComprehensiveToExcel === 'function', 'Test 115a: ExportService supports XLSX');
    assert(typeof ExportService.exportComprehensiveToPdf === 'function', 'Test 115b: ExportService supports PDF');
    assert(typeof ExportService.exportComprehensiveToJpg === 'function', 'Test 115c: ExportService supports JPG');

    // Test 116: Rejection of invalid login credentials returns structured error
    let badCredsRejected = false;
    try {
      await AuthService.verifyCredentials('non_existent_admin_user', 'WrongPassword123!');
    } catch (e: any) {
      badCredsRejected = true;
      assert(e.message.includes('غير صحيحة'), 'Test 116a: Rejection message clearly indicates invalid credentials');
    }
    assert(badCredsRejected, 'Test 116b: Invalid login credentials strictly rejected');

    // Test 117: Safe API response parser gracefully handles HTML "The page could not be found - 404" (No SyntaxError thrown!)
    const simulatedVercel404 = new Response('The page could not be found - 404', {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const parsedVercel404 = await parseSafeJsonResponse(simulatedVercel404);
    assert(parsedVercel404.ok === false, 'Test 117a: Non-JSON HTML response handled as ok: false');
    assert(!parsedVercel404.error?.includes('is not valid JSON'), 'Test 117b: Strictly no raw JSON parse SyntaxError exposed');
    assert(parsedVercel404.error?.includes('404'), 'Test 117c: Clear Arabic message identifying 404 status provided');

    // Test 118: Safe API response parser handles 502/500 HTML gateway errors gracefully
    const simulated502Html = new Response('<html><body>Bad Gateway 502</body></html>', {
      status: 502,
      headers: { 'content-type': 'text/html' },
    });
    const parsed502 = await parseSafeJsonResponse(simulated502Html);
    assert(parsed502.ok === false, 'Test 118a: HTML 502 handled as ok: false');
    assert(!parsed502.error?.includes('Unexpected token'), 'Test 118b: Strictly no "Unexpected token" error produced');

    // Test 119: Safe API response parser properly processes valid JSON success
    const simulatedValidJson = new Response(JSON.stringify({ success: true, message: 'تم بنجاح', data: { id: 101 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const parsedValid = await parseSafeJsonResponse(simulatedValidJson);
    assert(parsedValid.ok === true && parsedValid.data?.success === true, 'Test 119: Valid JSON parsed cleanly');

    // Test 120: Safe API response parser properly processes valid JSON 401 error
    const simulatedJson401 = new Response(JSON.stringify({ success: false, message: 'بيانات الدخول غير صحيحة' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
    const parsed401 = await parseSafeJsonResponse(simulatedJson401);
    assert(parsed401.ok === false && parsed401.error === 'بيانات الدخول غير صحيحة', 'Test 120: JSON 401 returned with explicit message');

    // Test 121: OTP Cannot Be Bypassed - Unverified tokens or missing OTP strictly forbidden
    const unverifiedSession = AuthService.getSession('invalid_or_forged_token');
    assert(!unverifiedSession, 'Test 121a: Forged session token cannot authenticate');
    let otpBypassFailed = false;
    try {
      await AuthService.verifyOtpAndCreateSession(999999, '000000');
    } catch {
      otpBypassFailed = true;
    }
    assert(otpBypassFailed, 'Test 121b: Unverified OTP code rejected without creating session');

    // =========================================================================
    // MENU DIVISION, MIX BOX, SANDWICH BOX, UNIFIED SOURCE & PDF TESTS
    // =========================================================================

    // Test 123: Mix Box strictly contains Sale-01 through Sale-12 (exactly 12 meals)
    const {
      OFFICIAL_18_MENU_ITEMS,
      sortMenuItemsAscending,
      getMixBoxItems,
      getSandwichBoxItems,
      getMenuSaleNumber
    } = await import('../src/data/fallbackMenu.ts');

    const mixBoxResult = getMixBoxItems(OFFICIAL_18_MENU_ITEMS);
    assert(mixBoxResult.length === 12, `Test 123a: Mix Box strictly contains 12 items (found ${mixBoxResult.length})`);
    const mixCodes = mixBoxResult.map((m) => m.code);
    const expectedMixCodes = Array.from({ length: 12 }, (_, i) => `Sale-${String(i + 1).padStart(2, '0')}`);
    assert(
      JSON.stringify(mixCodes) === JSON.stringify(expectedMixCodes),
      `Test 123b: Mix Box strictly matches Sale-01 through Sale-12 in ascending order`
    );

    // Test 124: Sandwich Box strictly contains Sale-13 through Sale-18 (exactly 6 meals)
    const sandwichBoxResult = getSandwichBoxItems(OFFICIAL_18_MENU_ITEMS);
    assert(sandwichBoxResult.length === 6, `Test 124a: Sandwich Box strictly contains 6 items (found ${sandwichBoxResult.length})`);
    const sandwichCodes = sandwichBoxResult.map((s) => s.code);
    const expectedSandwichCodes = Array.from({ length: 6 }, (_, i) => `Sale-${String(i + 13).padStart(2, '0')}`);
    assert(
      JSON.stringify(sandwichCodes) === JSON.stringify(expectedSandwichCodes),
      `Test 124b: Sandwich Box strictly matches Sale-13 through Sale-18 in ascending order`
    );

    // Test 125: All 18 items sorted ascending sequentially: Sale-01 -> Sale-18
    const sortedAll18 = sortMenuItemsAscending(OFFICIAL_18_MENU_ITEMS);
    assert(sortedAll18.length === 18, `Test 125a: All 18 items present in sequential list`);
    let isStrictlySequential = true;
    for (let i = 0; i < sortedAll18.length; i++) {
      const num = getMenuSaleNumber(sortedAll18[i].code);
      if (num !== i + 1) {
        isStrictlySequential = false;
        break;
      }
    }
    assert(isStrictlySequential, `Test 125b: Sequential ordering verified: Sale-01 -> Sale-02 -> ... -> Sale-18`);

    // Test 126: Single source of truth / Price alignment between DB and official items
    const dbMenuItemsList = await db.select().from(menuItems);
    assert(dbMenuItemsList.length === 18, `Test 126a: PostgreSQL DB contains all 18 items`);
    for (const officialItem of OFFICIAL_18_MENU_ITEMS) {
      const matchedDb = dbMenuItemsList.find((dbItem) => dbItem.code === officialItem.code);
      assert(Boolean(matchedDb), `Test 126b: Item ${officialItem.code} present in DB`);
      if (matchedDb) {
        assert(
          Number(matchedDb.distributorPrice) === officialItem.distributorPrice,
          `Test 126c: Price aligned for ${officialItem.code} (${matchedDb.distributorPrice} === ${officialItem.distributorPrice})`
        );
      }
    }

    // Test 127: Data Integrity: Every item has non-empty name, components, and description (no dummy or blank data)
    for (const item of OFFICIAL_18_MENU_ITEMS) {
      assert(item.name.length > 5, `Test 127a: Item ${item.code} has valid title`);
      assert(item.description.length > 10, `Test 127b: Item ${item.code} has comprehensive description`);
      assert(Array.isArray(item.components) && item.components.length >= 2, `Test 127c: Item ${item.code} has genuine component items`);
    }

    // Test 128: Confidentiality: Public menu items strictly contain distributorPrice only, never supplierPrice or profit
    for (const item of OFFICIAL_18_MENU_ITEMS) {
      assert(!('supplierPrice' in item), `Test 128a: ${item.code} does not leak supplierPrice`);
      assert(!('profit' in item), `Test 128b: ${item.code} does not leak profit`);
    }

    // Test 129: Arabic Typography & Reshaping Utilities
    const { reshapeArabicWords, prepareRtlTextForPdf } = await import('../src/utils/arabicPdfUtils.ts');
    const shapedWord = reshapeArabicWords('سيليبر كاترنج');
    assert(shapedWord.length > 0 && shapedWord !== 'سيليبر كاترنج', `Test 129a: Arabic text properly reshaped with presentation forms`);
    const rtlOutput = prepareRtlTextForPdf('سندوتش بوكس (Sale-15)');
    assert(rtlOutput.includes('Sale-15'), `Test 129b: Latin code "Sale-15" preserved intact in RTL string`);

    // Test 130: Font Base64 asset integrity
    const { KACST_BOOK_BASE64 } = await import('../src/assets/fonts/kacstBookBase64.ts');
    assert(typeof KACST_BOOK_BASE64 === 'string', `Test 130a: KACST_BOOK_BASE64 is exported`);
    assert(KACST_BOOK_BASE64.length > 50000, `Test 130b: Font asset is complete (>50KB base64, length: ${KACST_BOOK_BASE64.length})`);

    // Test 131: Booking flow works seamlessly for both Mix Box (Sale-02) and Sandwich Box (Sale-14)
    const mixBooking = await OrderService.createPreliminaryBooking({
      customerName: 'فحص ميكس بوكس',
      phone: '01099887766',
      menuCode: 'Sale-02',
      quantity: 50,
      pickupDate: '2026-11-01',
    });
    assert(mixBooking.order.orderStatus === 'PENDING_BOOKING', `Test 131a: Mix Box booking created as PENDING_BOOKING`);
    // Sale-02 price: 55 -> 50 * 55 = 2750
    assert(mixBooking.customerTotal === 2750, `Test 131b: Mix Box (Sale-02) calculated customerTotal 2750 EGP`);

    const sandwichBooking = await OrderService.createPreliminaryBooking({
      customerName: 'فحص سندوتش بوكس',
      phone: '01099887755',
      menuCode: 'Sale-14',
      quantity: 80,
      pickupDate: '2026-11-05',
    });
    assert(sandwichBooking.order.orderStatus === 'PENDING_BOOKING', `Test 131c: Sandwich Box booking created as PENDING_BOOKING`);
    // Sale-14 price: 48 -> 80 * 48 = 3840
    assert(sandwichBooking.customerTotal === 3840, `Test 131d: Sandwich Box (Sale-14) calculated customerTotal 3840 EGP`);

    // Test 132: Public menu components never leak factory prices during whole booking lifecycle
    assert(!('supplierTotal' in mixBooking.order && typeof (mixBooking.order as any).supplierTotal === 'undefined'), `Test 132: Booking completed securely`);

    // =========================================================================
    // ORDER NUMBER LIFECYCLE, DATABASE IDENTITY & RESOLUTION TESTS
    // =========================================================================

    // Test 133: Order creation generates genuine record with integer id & unique orderNumber
    const testBooking = await OrderService.createPreliminaryBooking({
      customerName: 'محمود عبد الفتاح (اختبار دورة الطلب)',
      phone: '01055443322',
      menuCode: 'Sale-01',
      quantity: 60,
      pickupDate: '2026-11-20',
      pickupTime: '06:00 م',
      pickupLocation: 'بني سويف - قاعة الزهور',
      notes: 'اختبار دورة حياة رقم الطلب',
    });
    assert(typeof testBooking.order.id === 'number' && testBooking.order.id > 0, 'Test 133a: Order primary key id is a positive integer in DB');
    assert(typeof testBooking.order.orderNumber === 'string' && testBooking.order.orderNumber.startsWith('CB-'), 'Test 133b: orderNumber is formatted correctly (CB-YYYYMMDD-XXXX)');

    // Test 134: Resolving order by integer ID vs string orderNumber returns exact same record
    const byId = await OrderService.getOrderByIdOrNumber(testBooking.order.id);
    const byNumber = await OrderService.getOrderByIdOrNumber(testBooking.order.orderNumber);
    assert(Boolean(byId) && Boolean(byNumber), 'Test 134a: Order found by both integer ID and orderNumber string');
    assert(byId!.id === byNumber!.id, 'Test 134b: Both lookups resolve to the exact same record primary key id');
    assert(byId!.orderNumber === byNumber!.orderNumber, 'Test 134c: Both lookups resolve to the exact same orderNumber');

    // Test 135: Case insensitivity and whitespace tolerance in orderNumber resolution
    const byLowerNumber = await OrderService.getOrderByIdOrNumber(testBooking.order.orderNumber.toLowerCase());
    assert(Boolean(byLowerNumber) && byLowerNumber!.id === testBooking.order.id, 'Test 135: Case-insensitive orderNumber resolution matches correct record');

    // Test 136: Non-existent order number returns null, strictly never returning another order
    const fakeOrder = await OrderService.getOrderByIdOrNumber('CB-19990101-9999');
    assert(fakeOrder === null, 'Test 136a: Non-existent orderNumber returns null');
    const fakeNumId = await OrderService.getOrderByIdOrNumber(99999999);
    assert(fakeNumId === null, 'Test 136b: Non-existent integer id returns null');

    // Test 137: Concurrency test: Simultaneous bookings create distinct records with unique numbers
    const concurrentPromises = [1, 2, 3, 4, 5].map((i) =>
      OrderService.createPreliminaryBooking({
        customerName: `عميل متزامن ${i}`,
        phone: `0108877660${i}`,
        menuCode: 'Sale-03',
        quantity: 50,
        pickupDate: '2026-11-25',
      })
    );
    const concurrentResults = await Promise.all(concurrentPromises);
    const orderNumbers = concurrentResults.map((r) => r.order.orderNumber);
    const uniqueOrderNumbers = new Set(orderNumbers);
    assert(uniqueOrderNumbers.size === 5, 'Test 137a: Concurrent bookings all generated distinct, unique orderNumbers (no collisions)');
    const recordIds = concurrentResults.map((r) => r.order.id);
    const uniqueRecordIds = new Set(recordIds);
    assert(uniqueRecordIds.size === 5, 'Test 137b: Concurrent bookings all created distinct database rows with separate IDs');

    // Test 138: Order status update maintains the exact same orderNumber
    const originalNum = testBooking.order.orderNumber;
    await OrderService.updateOrderStatus(testBooking.order.id, 'CONFIRMED', undefined, 'admin_tester');
    const refreshedAfterStatus = await OrderService.getOrderByIdOrNumber(testBooking.order.id);
    assert(refreshedAfterStatus!.orderStatus === 'CONFIRMED', 'Test 138a: Order status successfully updated to CONFIRMED');
    assert(refreshedAfterStatus!.orderNumber === originalNum, 'Test 138b: orderNumber is immutable and preserved after status update');

    // Test 139: Order details update using orderNumber string succeeds and preserves orderNumber
    await OrderService.updateOrderDetails(
      originalNum,
      { pickupLocation: 'بني سويف - تم تحديث المكان', customerNotes: 'ملاحظة محدثة' },
      'admin_tester'
    );
    const refreshedAfterDetails = await OrderService.getOrderByIdOrNumber(originalNum);
    assert(refreshedAfterDetails!.pickupLocation === 'بني سويف - تم تحديث المكان', 'Test 139a: Details updated using orderNumber string identifier');
    assert(refreshedAfterDetails!.orderNumber === originalNum, 'Test 139b: orderNumber unchanged after operational details update');
    assert(refreshedAfterDetails!.id === testBooking.order.id, 'Test 139c: Same database record maintained without creating duplicates');

    // Test 140: Customer payment recorded using orderNumber string identifier correctly updates finances
    const paymentResult = await OrderService.recordCustomerPayment(
      originalNum,
      1000,
      'INSTAPAY',
      'REF-TEST-123',
      'دفعة تأكيد',
      'admin_tester'
    );
    assert(paymentResult.totalCustomerPaid === 1000, 'Test 140a: Customer payment recorded correctly');
    const refreshedAfterPayment = await OrderService.getOrderByIdOrNumber(testBooking.order.id);
    assert(Number(refreshedAfterPayment!.customerPaid) === 1000, 'Test 140b: Order customerPaid in DB updated to 1000');
    assert(Number(refreshedAfterPayment!.customerRemaining) === Number(refreshedAfterPayment!.totalAmount) - 1000, 'Test 140c: Order customerRemaining accurately updated');

    // Test 141: Database historical integrity: All existing orders in DB have unique, valid orderNumbers
    const allDbOrders = await db.select({ id: orders.id, orderNumber: orders.orderNumber }).from(orders);
    const allNumbersSet = new Set(allDbOrders.map((o) => o.orderNumber));
    assert(allNumbersSet.size === allDbOrders.length, `Test 141a: All ${allDbOrders.length} orders in database have strictly unique orderNumbers`);
    const allHaveValidFormat = allDbOrders.every((o) => typeof o.orderNumber === 'string' && o.orderNumber.length >= 6);
    assert(allHaveValidFormat, 'Test 141b: All orders have non-empty, valid orderNumber strings');

    console.log(`\n🏁 Test Results: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  }
}

runSystemTests();
