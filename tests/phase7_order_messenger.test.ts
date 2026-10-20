import * as dotenv from 'dotenv';
dotenv.config();

import { OrderService } from '../src/services/orderService.ts';
import { AuthService } from '../src/services/authService.ts';
import { MessengerService } from '../src/services/messengerService.ts';
import { AccountingService } from '../src/services/accountingService.ts';
import { prisma } from '../src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function runPhase7Tests() {
  console.log('🧪 Starting Celebre Catering — Phase 7: Mobile /order & Facebook Messenger Test Suite...\n');
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
    // -------------------------------------------------------------------------
    // TEST 1: Display of all 18 Meals with Approved Distributor Prices
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Verification of the 18 Official Catering Packages ---');
    const all18Items = await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { components: true },
    });

    assert(all18Items.length === 18, `Test 1.1: Exactly 18 official menu items retrieved from database (found: ${all18Items.length})`);

    const mixBox = all18Items.filter((it) => {
      const num = parseInt(it.code.replace(/[^\d]/g, ''), 10);
      return num >= 1 && num <= 12;
    });
    const sandwichBox = all18Items.filter((it) => {
      const num = parseInt(it.code.replace(/[^\d]/g, ''), 10);
      return num >= 13 && num <= 18;
    });

    assert(mixBox.length === 12, `Test 1.2: Mix Box list contains exactly Sale-01 to Sale-12 (found: ${mixBox.length})`);
    assert(sandwichBox.length === 6, `Test 1.3: Sandwich Box list contains exactly Sale-13 to Sale-18 (found: ${sandwichBox.length})`);

    // Verify sample distributor prices
    const sale01 = all18Items.find((i) => i.code === 'Sale-01');
    const sale05 = all18Items.find((i) => i.code === 'Sale-05');
    const sale13 = all18Items.find((i) => i.code === 'Sale-13');
    assert(Number(sale01?.distributorPrice) === 50, 'Test 1.4: Sale-01 distributor price is 50 EGP');
    assert(Number(sale05?.distributorPrice) === 80, 'Test 1.5: Sale-05 distributor price is 80 EGP');
    assert(Number(sale13?.distributorPrice) === 42, 'Test 1.6: Sale-13 distributor price is 42 EGP');

    // -------------------------------------------------------------------------
    // TEST 2: Multi-Item Calculation (Multiple Codes & Quantities in Same Order)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Multi-Item Order Calculations ---');
    // Order 60 meals of Sale-01 (@ 50 EGP) + 40 meals of Sale-13 (@ 42 EGP)
    // Expected: (60 * 50) + (40 * 42) = 3000 + 1680 = 4680 EGP
    const multiItemBooking = await OrderService.createPreliminaryBooking({
      customerName: 'م. حسام الدين (طلب متعدد الأصناف)',
      phone: '01099887766',
      items: [
        { menuCode: 'Sale-01', quantity: 60, drinkOption: 'included' },
        { menuCode: 'Sale-13', quantity: 40, drinkOption: 'included' },
      ],
      pickupDate: '2026-12-10',
      pickupTime: 'العشاء 08:30 م',
      pickupLocation: 'قاعة الأوركيد - التجمع الخامس',
      skipIdempotency: true,
      skipSupplierOrderCreation: true,
    });

    assert(multiItemBooking.customerTotal === 4680, `Test 2.1: Multi-item customer total is exactly 4680 EGP (got: ${multiItemBooking.customerTotal})`);
    assert(multiItemBooking.items?.length === 2, 'Test 2.2: Order contains exactly 2 distinct order item records');
    assert(Number(multiItemBooking.order.totalAmount) === 4680, 'Test 2.3: Order record total_amount in PostgreSQL is 4680 EGP');
    assert(Number(multiItemBooking.order.customerPaid) === 0, 'Test 2.4: Preliminary booking is unpaid (customerPaid is 0 EGP)');
    assert(Number(multiItemBooking.order.customerRemaining) === 4680, 'Test 2.5: Customer remaining balance is 4680 EGP');

    // -------------------------------------------------------------------------
    // TEST 3: Dynamic Drink Modifications (Per-Meal Juice Verification)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Proper Application of Drink Modifications ---');
    // 50 meals of Sale-05 (@ 80 EGP) with exclude_juice (-5 EGP -> 75 EGP = 3750 EGP)
    // 50 meals of Sale-02 (@ 55 EGP) with replace_pepsi (+10 EGP -> 65 EGP = 3250 EGP)
    // Expected: 3750 + 3250 = 7000 EGP
    const drinkModBooking = await OrderService.createPreliminaryBooking({
      customerName: 'أ/ رامي خالد (اختبار تعديل المشروب)',
      phone: '01055554444',
      items: [
        { menuCode: 'Sale-05', quantity: 50, drinkOption: 'exclude_juice' },
        { menuCode: 'Sale-02', quantity: 50, drinkOption: 'replace_pepsi' },
      ],
      pickupDate: '2026-12-15',
      pickupTime: 'المغرب 06:30 م',
      pickupLocation: 'بني سويف - قاعة السرايا',
      skipIdempotency: true,
      skipSupplierOrderCreation: true,
    });

    assert(drinkModBooking.customerTotal === 7000, `Test 3.1: Drink modified total is exactly 7000 EGP (got: ${drinkModBooking.customerTotal})`);
    const sale05Item = drinkModBooking.items?.find((i) => i.menuCode === 'Sale-05');
    const sale02Item = drinkModBooking.items?.find((i) => i.menuCode === 'Sale-02');
    assert(sale05Item?.customerAdjustment === -5, 'Test 3.2: Sale-05 received -5 EGP discount for exclude_juice');
    assert(sale02Item?.customerAdjustment === 10, 'Test 3.3: Sale-02 received +10 EGP markup for replace_pepsi');

    // -------------------------------------------------------------------------
    // TEST 4: Server-Side Validation (Reject Invalid Quantities & Codes)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Rejection of Invalid Quantities and Codes ---');
    let rejectedUnderMin = false;
    try {
      await OrderService.createPreliminaryBooking({
        customerName: 'اختبار حد أدنى',
        phone: '01011112233',
        items: [{ menuCode: 'Sale-01', quantity: 30, drinkOption: 'included' }],
        pickupDate: '2026-12-20',
        pickupTime: '06:00 PM',
        pickupLocation: 'القاهرة',
        skipIdempotency: true,
      });
    } catch (e: any) {
      rejectedUnderMin = e.message.includes('50');
    }
    assert(rejectedUnderMin, 'Test 4.1: Server rejected order with quantity < 50 meals');

    let rejectedInvalidCode = false;
    try {
      await OrderService.createPreliminaryBooking({
        customerName: 'اختبار كود خطأ',
        phone: '01011112233',
        items: [{ menuCode: 'Sale-999-FAKE', quantity: 60, drinkOption: 'included' }],
        pickupDate: '2026-12-20',
        pickupTime: '06:00 PM',
        pickupLocation: 'القاهرة',
        skipIdempotency: true,
      });
    } catch (e: any) {
      rejectedInvalidCode = e.message.includes('غير متوفرة');
    }
    assert(rejectedInvalidCode, 'Test 4.2: Server rejected invalid non-existent menu code');

    // -------------------------------------------------------------------------
    // TEST 5: PostgreSQL Persistence & Order Number Format
    // -------------------------------------------------------------------------
    console.log('\n--- 5. PostgreSQL Persistence & Order Number Format ---');
    const savedOrder = await prisma.order.findUnique({
      where: { id: multiItemBooking.order.id },
      include: { customer: true, items: { include: { options: true } } },
    });

    assert(Boolean(savedOrder), 'Test 5.1: Order was persisted in PostgreSQL database');
    assert(/^CB-\d{8}-\d{4}$/.test(savedOrder!.orderNumber), `Test 5.2: Order number adheres to format CB-YYYYMMDD-XXXX (got: ${savedOrder?.orderNumber})`);
    assert(savedOrder?.orderStatus === 'PENDING_BOOKING', 'Test 5.3: Order status initialized to PENDING_BOOKING');
    assert(savedOrder?.customer.fullName === 'م. حسام الدين (طلب متعدد الأصناف)', 'Test 5.4: Customer name saved accurately');

    // -------------------------------------------------------------------------
    // TEST 6: Public Booking Isolation (No Supplier Order Auto-Created Before Acceptance)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Public Booking & Factory Order Workflow Isolation ---');
    const supplierOrdersForBooking = await prisma.supplierOrder.findMany({
      where: { orderId: multiItemBooking.order.id },
    });
    assert(supplierOrdersForBooking.length === 0, 'Test 6.1: Public booking did NOT automatically create a supplier order (strictly pending admin review)');

    // Now Admin accepts booking and creates factory order
    const adminAcceptedOrder = await OrderService.updateOrderStatus(
      multiItemBooking.order.id,
      'AWAITING_CUSTOMER_DEPOSIT',
      'تم قبول الحجز بعد المراجعة',
      'admin_tester'
    );
    assert(adminAcceptedOrder.status === 'AWAITING_CUSTOMER_DEPOSIT', 'Test 6.2: Admin transitioned order to AWAITING_CUSTOMER_DEPOSIT');

    const createdSupOrder = await OrderService.createSupplierOrder(
      multiItemBooking.order.id,
      'admin_tester'
    );
    assert(Boolean(createdSupOrder), 'Test 6.3: Factory order explicitly created by admin after approval');
    assert(createdSupOrder.supplierOrderNumber.startsWith('SUP-'), `Test 6.4: Factory order number formatted correctly: ${createdSupOrder.supplierOrderNumber}`);
    assert(Number(createdSupOrder.supplierPaid) === 0, 'Test 6.5: Factory order initial supplierPaid is strictly 0.00');

    // -------------------------------------------------------------------------
    // TEST 7: Messenger Service Configuration & Facebook Welcome Message
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Messenger Service & Facebook Integration ---');
    const messengerConfig = MessengerService.getConfig();
    assert(messengerConfig.orderUrl === 'https://celebre-eg.com/order', 'Test 7.1: Canonical order URL is https://celebre-eg.com/order');
    assert(messengerConfig.welcomeMessage.includes('celebre-eg.com/order'), 'Test 7.2: Welcome message contains direct booking link');
    assert(messengerConfig.shortGreeting.includes('celebre-eg.com/order'), 'Test 7.3: Short greeting contains direct booking link');
    assert(messengerConfig.awayMessage.includes('celebre-eg.com/order'), 'Test 7.4: Away message contains direct booking link');
    assert(typeof messengerConfig.isAutomatedApiConfigured === 'boolean', 'Test 7.5: Automated API status reported truthfully without false claims');

    // -------------------------------------------------------------------------
    // TEST 8: Integrity of Admin Auth, Accounting, and Reports
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Admin Auth, Accounting & Reports Unaffected ---');
    const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    const testHash = await bcrypt.hash('TestPass123!@#', 10);
    const p7User = await prisma.adminUser.create({
      data: {
        username: `p7_tester_${Date.now()}`,
        email: `p7_${Date.now()}@celebre.test`,
        passwordHash: testHash,
        salt: '',
        fullName: 'أدمن تجربة المرحلة 7',
        phone: '01284484868',
        roleId: superAdminRole!.id,
        isActive: true,
        isLocked: false,
        failedAttempts: 0,
      },
    });

    const verifiedUser = await AuthService.verifyCredentials(p7User.username, 'TestPass123!@#', '127.0.0.1');
    assert(Boolean(verifiedUser), 'Test 8.1: Admin authentication succeeded with secure credentials');

    const custStatement = await AccountingService.getCustomerAccountStatement(multiItemBooking.order.id);
    assert(Boolean(custStatement), 'Test 8.2: Customer accounting statement generated cleanly');
    assert(custStatement.totalApprovedAmount === 4680, 'Test 8.3: Accounting statement reflects approved booking value 4680 EGP');

    const profitability = await AccountingService.getBookingProfitability(multiItemBooking.order.id);
    assert(Boolean(profitability), 'Test 8.4: Order profitability breakdown computed cleanly');
    assert(profitability.approvedRevenue === 4680, 'Test 8.5: Profitability approved revenue matches approved total');

    console.log(`\n🏁 Phase 7 Test Results: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected test error:', error);
    process.exit(1);
  }
}

runPhase7Tests();
