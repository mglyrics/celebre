import * as dotenv from 'dotenv';
dotenv.config();

import handler from '../api/index.ts';
import { prisma } from '../src/lib/prisma.ts';

async function testVercelServerlessHandler() {
  console.log('🧪 Starting Vercel Serverless Function Simulation for /api/public/bookings...\n');

  // Test 1: Simulating Vercel POST request where req.body is pre-parsed by @vercel/node
  const testPhone = '01088776655';
  const req: any = {
    method: 'POST',
    url: '/api/index?path=public/bookings',
    query: { path: 'public/bookings' },
    headers: {
      'content-type': 'application/json',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Vercel-Simulation-Test/1.0',
    },
    body: {
      customerName: 'د. هاني عادل (اختبار محاكاة Vercel)',
      phone: testPhone,
      whatsapp: testPhone,
      items: [
        { menuCode: 'Sale-01', quantity: 50, drinkOption: 'included' },
        { menuCode: 'Sale-13', quantity: 50, drinkOption: 'exclude_juice' },
      ],
      pickupDate: '2026-11-25',
      pickupTime: 'المغرب 06:30 م',
      pickupLocation: 'المهندسين - الجيزة',
      venueType: 'قاعة',
      occasion: 'حفل تكريم',
      notes: 'طلب تجريبي لمحاكاة بيئة Vercel Serverless',
    },
  };

  let capturedStatus = 200;
  let capturedHeaders: Record<string, string> = {};
  let capturedBody: any = null;
  let isDone = false;

  const res: any = {
    statusCode: 200,
    headersSent: false,
    setHeader: (k: string, v: string) => {
      capturedHeaders[k.toLowerCase()] = v;
    },
    getHeader: (k: string) => capturedHeaders[k.toLowerCase()],
    status: (s: number) => {
      capturedStatus = s;
      res.statusCode = s;
      return res;
    },
    json: (data: any) => {
      res.headersSent = true;
      capturedBody = data;
      isDone = true;
    },
    send: (data: any) => {
      res.headersSent = true;
      try {
        capturedBody = JSON.parse(data);
      } catch {
        capturedBody = data;
      }
      isDone = true;
    },
    end: () => {
      res.headersSent = true;
      isDone = true;
    },
  };

  const startTime = Date.now();
  await handler(req, res);

  // Wait a moment if async processing is finishing
  for (let i = 0; i < 40 && !isDone; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  const duration = Date.now() - startTime;

  console.log(`⏱️ Handler completed in ${duration}ms with status HTTP ${capturedStatus}`);

  if (capturedStatus !== 200 || !capturedBody?.success) {
    console.error('❌ FAIL: Expected HTTP 200 and success: true, got:', capturedStatus, capturedBody);
    process.exit(1);
  }

  console.log('✅ PASS: Vercel handler executed without hanging and returned JSON:');
  console.log('  - Order Number:', capturedBody.order?.orderNumber);
  console.log('  - Total Amount:', capturedBody.order?.customerTotal, 'EGP');
  console.log('  - Order Status:', capturedBody.order?.orderStatus);
  console.log('  - WhatsApp Link generated:', Boolean(capturedBody.whatsappLink));

  // Verify persistence in PostgreSQL database
  const savedOrder = await prisma.order.findUnique({
    where: { orderNumber: capturedBody.order.orderNumber },
    include: { items: true, customer: true },
  });

  if (!savedOrder) {
    console.error('❌ FAIL: Order was not found in PostgreSQL database!');
    process.exit(1);
  }

  console.log('✅ PASS: Order successfully verified in PostgreSQL database!');
  console.log(`  - Database ID: ${savedOrder.id}`);
  console.log(`  - Items count: ${savedOrder.items.length}`);
  console.log(`  - Customer Paid: ${Number(savedOrder.customerPaid)} EGP (strictly unpaid)`);

  // Test 2: Invalid payload returns structured JSON error (never HTML or hanging)
  console.log('\n--- Test 2: Invalid quantity rejected with clean JSON error ---');
  const invalidReq: any = {
    method: 'POST',
    url: '/api/index?path=public/bookings',
    query: { path: 'public/bookings' },
    headers: { 'content-type': 'application/json' },
    body: {
      customerName: 'عميل بيانات خاطئة',
      phone: '01011112222',
      items: [{ menuCode: 'Sale-01', quantity: 10, drinkOption: 'included' }], // Less than minimum 50!
      pickupDate: '2026-11-25',
    },
  };

  let invalidStatus = 200;
  let invalidBody: any = null;
  const invalidRes: any = {
    statusCode: 200,
    headersSent: false,
    setHeader: () => {},
    getHeader: () => {},
    status: (s: number) => {
      invalidStatus = s;
      return invalidRes;
    },
    json: (d: any) => {
      invalidBody = d;
    },
    send: (d: any) => {
      try {
        invalidBody = JSON.parse(d);
      } catch {
        invalidBody = d;
      }
    },
    end: () => {},
  };

  await handler(invalidReq, invalidRes);

  if (invalidStatus === 400 && invalidBody?.success === false) {
    console.log('✅ PASS: Correctly rejected invalid quantity with HTTP 400 and JSON:');
    console.log('  - Message:', invalidBody.message);
  } else {
    console.error('❌ FAIL: Expected HTTP 400 with success: false, got:', invalidStatus, invalidBody);
    process.exit(1);
  }

  console.log('\n🏁 All Vercel Serverless Function Simulation Tests PASSED! (0 failures)\n');
}

testVercelServerlessHandler().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});
