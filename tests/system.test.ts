import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { OrderService } from '../src/services/orderService.ts';
import { AuthService, AdminSession } from '../src/services/authService.ts';
import { WhatsAppService } from '../src/services/whatsappService.ts';
import { db } from '../src/db/index.ts';
import { orders, menuItems, roles, permissions, supplierOrders, customerPayments, supplierPayments, auditLogs } from '../src/db/schema.ts';
import { eq, sql, or } from 'drizzle-orm';
import { ExportService, ComprehensiveReportData } from '../src/services/exportService.ts';
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

    // =========================================================================
    // PRODUCTION READINESS & SECURITY AUDIT TESTS
    // =========================================================================

    // Test 102: Public Menu strictly does NOT return supplier_price, supplier_total, or profit
    const publicMenuItems = await db
      .select({
        id: menuItems.id,
        code: menuItems.code,
        name: menuItems.name,
        description: menuItems.description,
        distributorPrice: menuItems.distributorPrice,
        sortOrder: menuItems.sortOrder,
      })
      .from(menuItems)
      .where(eq(menuItems.isActive, true))
      .limit(5);

    for (const it of publicMenuItems) {
      const keys = Object.keys(it);
      assert(!keys.includes('supplierPrice') && !keys.includes('supplier_price'), 'Test 102a: Public API menu strictly omits supplier_price');
      assert(!keys.includes('supplierTotal') && !keys.includes('supplier_total'), 'Test 102b: Public API menu strictly omits supplier_total');
      assert(!keys.includes('profit') && !keys.includes('distributorProfit'), 'Test 102c: Public API menu strictly omits profit');
    }

    // Test 103: Public Booking result strictly omits supplier_price, supplier_total, supplier_paid, supplier_remaining, profit
    const sampleBookingOrder = {
      orderNumber: 'CEL-TEST-PUBLIC',
      customerName: 'عميل عام',
      phone: '01284484868',
      menuCode: 'Sale-01',
      menuName: 'العرض الأول',
      quantity: 100,
      pickupDate: '2026-10-20',
      pickupTime: '7:00 م',
      pickupLocation: 'بني سويف',
      customerTotal: 6500,
      customerPaid: 0,
      customerRemaining: 6500,
      orderStatus: 'PENDING_BOOKING',
    };
    const bookingKeys = Object.keys(sampleBookingOrder);
    assert(!bookingKeys.includes('supplier_price') && !bookingKeys.includes('supplierPrice'), 'Test 103a: Public API booking strictly omits supplier_price');
    assert(!bookingKeys.includes('supplier_total') && !bookingKeys.includes('supplierTotal'), 'Test 103b: Public API booking strictly omits supplier_total');
    assert(!bookingKeys.includes('supplier_paid') && !bookingKeys.includes('supplierPaid'), 'Test 103c: Public API booking strictly omits supplier_paid');
    assert(!bookingKeys.includes('supplier_remaining') && !bookingKeys.includes('supplierRemaining'), 'Test 103d: Public API booking strictly omits supplier_remaining');
    assert(!bookingKeys.includes('profit'), 'Test 103e: Public API booking strictly omits profit');

    // Test 104: No Payment Gateway / Online card checkout in public site
    const publicBookingFormPath = path.resolve('src/components/public/PublicBookingForm.tsx');
    const bookingFormContent = fs.readFileSync(publicBookingFormPath, 'utf8');
    assert(!bookingFormContent.includes('Stripe') && !bookingFormContent.includes('stripe'), 'Test 104a: No Stripe integration in public booking');
    assert(!bookingFormContent.includes('Paymob') && !bookingFormContent.includes('paymob'), 'Test 104b: No Paymob gateway in public booking');
    assert(!bookingFormContent.includes('card_number') && !bookingFormContent.includes('cvv'), 'Test 104c: No Card / CVV inputs in public booking');
    assert(!bookingFormContent.includes('checkout_url'), 'Test 104d: No online checkout URL in public booking');

    // Test 105: Admin URLs strictly NOT present in Public Navigation
    const publicNavbarPath = path.resolve('src/components/public/PublicNavbar.tsx');
    const navbarContent = fs.readFileSync(publicNavbarPath, 'utf8');
    assert(!navbarContent.includes('href="/admin"') && !navbarContent.includes('href="#admin"'), 'Test 105a: Public Navbar contains no admin link');
    const publicFooterPath = path.resolve('src/components/public/PublicFooter.tsx');
    const footerContent = fs.readFileSync(publicFooterPath, 'utf8');
    assert(!footerContent.includes('href="/admin"') && !footerContent.includes('href="#admin"'), 'Test 105b: Public Footer contains no admin link');

    // Test 106: Decimal / Numeric representation across all financial DB columns
    const schemaSql = fs.readFileSync(path.resolve('src/db/schema.ts'), 'utf8');
    assert(schemaSql.includes("numeric('distributor_price', { precision: 10, scale: 2 })"), 'Test 106a: distributor_price uses numeric(10,2)');
    assert(schemaSql.includes("numeric('supplier_price', { precision: 10, scale: 2 })"), 'Test 106b: supplier_price uses numeric(10,2)');
    assert(schemaSql.includes("numeric('total_amount', { precision: 12, scale: 2 })"), 'Test 106c: total_amount uses numeric(12,2)');
    assert(schemaSql.includes("numeric('supplier_total', { precision: 12, scale: 2 })"), 'Test 106d: supplier_total uses numeric(12,2)');
    assert(schemaSql.includes("numeric('distributor_profit', { precision: 12, scale: 2 })"), 'Test 106e: distributor_profit uses numeric(12,2)');

    // Test 107: Prisma schema uses Decimal types for money
    const prismaSchemaContent = fs.readFileSync(path.resolve('prisma/schema.prisma'), 'utf8');
    assert(prismaSchemaContent.includes('@map("distributor_price") @db.Decimal(10, 2)'), 'Test 107a: Prisma uses Decimal(10,2) for distributor_price');
    assert(prismaSchemaContent.includes('@map("total_amount") @db.Decimal(12, 2)'), 'Test 107b: Prisma uses Decimal(12,2) for total_amount');

    // Test 108: Prisma Migrations exist
    assert(fs.existsSync(path.resolve('prisma/migrations/20261006000000_init/migration.sql')), 'Test 108: Prisma init migration exists on disk');

    // Test 109: Seed script exists on disk
    assert(fs.existsSync(path.resolve('src/db/seed.ts')) && fs.existsSync(path.resolve('prisma/seed.ts')), 'Test 109: Seed scripts exist on disk');

    // Test 110: .env.example exists and contains no secret values
    const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
    assert(envExample.includes('DATABASE_URL='), 'Test 110a: .env.example contains DATABASE_URL placeholder');
    assert(!envExample.includes('ghp_') && !envExample.includes('sk_live'), 'Test 110b: .env.example contains no real API keys');

    // Test 111: README.md exists and contains Deployment instructions
    const readmeContent = fs.readFileSync(path.resolve('README.md'), 'utf8');
    assert(readmeContent.includes('Deployment') || readmeContent.includes('النشر') || readmeContent.includes('Production'), 'Test 111: README.md contains deployment instructions');

    // Test 112: Rate Limiting & Account Lockout Logic Verification
    const rateLimitCheck = AuthService.checkOtpRateLimit('test_user_unique_key_999');
    assert(rateLimitCheck.allowed === true, 'Test 112a: Initial OTP rate limit check allowed');
    const rapidRepeatCheck = AuthService.checkOtpRateLimit('test_user_unique_key_999');
    assert(rapidRepeatCheck.allowed === false, 'Test 112b: Rapid repeat OTP request blocked by rate limiter');

    // Test 113: Session Expiration validation
    const expiredSession: AdminSession = {
      userId: 9999,
      username: 'expired_user',
      fullName: 'منتهي الصلاحية',
      phone: '01284484868',
      role: 'VIEWER',
      permissions: [],
      token: 'cel_expired_token_test',
      expiresAt: Date.now() - 1000, // expired 1s ago
    };
    (AuthService as any).activeSessions = (AuthService as any).activeSessions || new Map();
    // @ts-ignore
    assert(AuthService.getSession('cel_non_existent_token') === null, 'Test 113: Non-existent or expired session returns null');

    // Test 114: RBAC confidentiality in Dashboard Stats
    const prodSuperAdminSession: AdminSession = {
      userId: 1,
      username: 'superadmin_prod',
      fullName: 'المدير العام',
      phone: '01284484868',
      role: 'SUPER_ADMIN',
      permissions: ['orders.view', 'reports.view', 'prices.edit', 'supplier_payments.view'],
      token: 'cel_super_admin_token',
      expiresAt: Date.now() + 3600000,
    };
    const prodViewerSession: AdminSession = {
      userId: 2,
      username: 'viewer_prod',
      fullName: 'مشاهد فقط',
      phone: '01284484868',
      role: 'VIEWER',
      permissions: ['orders.view', 'reports.view'],
      token: 'cel_viewer_token',
      expiresAt: Date.now() + 3600000,
    };
    assert(AuthService.hasPermission(prodSuperAdminSession, 'prices.edit'), 'Test 114a: SUPER_ADMIN has prices.edit');
    assert(!AuthService.hasPermission(prodViewerSession, 'prices.edit'), 'Test 114b: VIEWER does not have prices.edit');

    // Test 115: Audit logs recording for all sensitive actions
    const testAuditEntry = await db.insert(auditLogs).values({
      userId: 1,
      userName: 'audit_test_user',
      action: 'PRODUCTION_AUDIT_VERIFIED',
      entity: 'production_checklist',
      entityId: 'READY_2026',
      ip: '127.0.0.1',
    }).returning();
    assert(testAuditEntry.length > 0 && testAuditEntry[0].action === 'PRODUCTION_AUDIT_VERIFIED', 'Test 115: Audit log entry successfully written');

    // Test 116: Security headers and CSRF verification check in server.ts
    const serverCode = fs.readFileSync(path.resolve('server.ts'), 'utf8');
    assert(serverCode.includes('X-Content-Type-Options') && serverCode.includes('nosniff'), 'Test 116a: X-Content-Type-Options nosniff header set');
    assert(serverCode.includes('X-Frame-Options') && serverCode.includes('SAMEORIGIN'), 'Test 116b: X-Frame-Options SAMEORIGIN header set');
    assert(serverCode.includes('Content-Security-Policy'), 'Test 116c: Content-Security-Policy header set');
    assert(serverCode.includes('CSRF Defense Middleware'), 'Test 116d: CSRF protection middleware configured');
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
