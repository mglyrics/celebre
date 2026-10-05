import * as dotenv from 'dotenv';
dotenv.config();

import { OrderService } from '../src/services/orderService.ts';
import { AuthService } from '../src/services/authService.ts';
import { db } from '../src/db/index.ts';
import { orders, menuItems } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

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
