import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import {
  orders,
  orderItems,
  orderItemOptions,
  customers,
  menuItems,
  menuItemComponents,
  menuPriceHistory,
  suppliers,
  supplierOrders,
  customerPayments,
  supplierPayments,
  auditLogs,
  appSettings,
} from '../db/schema.ts';
import { eq, desc, and, sql, gte, lte, like, or } from 'drizzle-orm';
import { OrderService } from '../services/orderService.ts';
import { AuthService, AdminSession } from '../services/authService.ts';
import { WhatsAppService } from '../services/whatsappService.ts';

export const apiRouter = Router();

// Middleware: Authenticate Admin Session from Bearer token
export interface AuthenticatedRequest extends Request {
  adminSession?: AdminSession;
}

export const requireAdminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || (req.headers['x-admin-token'] as string);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'غير مصرح - يرجى تسجيل الدخول كإدارة معتمدة' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const session = AuthService.getSession(token);

  if (!session) {
    return res.status(401).json({ success: false, message: 'جلسة الأدمن منتهية الصلاحية أو غير صالحة' });
  }

  req.adminSession = session;
  next();
};

// Middleware: Require specific RBAC permission
export const requirePermission = (permissionCode: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.adminSession) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }
    if (!AuthService.hasPermission(req.adminSession, permissionCode)) {
      return res.status(403).json({
        success: false,
        message: `ليس لديك صلاحية لتنفيذ هذا الإجراء (${permissionCode})`,
      });
    }
    next();
  };
};

/* ==========================================================================
   PUBLIC APIS (Safe for public website - No leaks of factory costs or profit)
   ========================================================================== */

// 1. Public Menu: The 18 Catering packages with items (strictly omits supplier_price)
apiRouter.get('/public/menu', async (_req: Request, res: Response) => {
  try {
    const items = await db
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
      .orderBy(menuItems.sortOrder);

    const components = await db.select().from(menuItemComponents).orderBy(menuItemComponents.sortOrder);

    const itemsWithComponents = items.map((item) => {
      const itemComps = components
        .filter((c) => c.menuItemId === item.id)
        .map((c) => ({
          name: c.componentName,
          quantity: c.quantity,
          unit: c.unit,
        }));
      return {
        ...item,
        distributorPrice: parseFloat(item.distributorPrice),
        components: itemComps,
      };
    });

    res.json({ success: true, menu: itemsWithComponents });
  } catch (error: any) {
    console.error('Error fetching public menu:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل قائمة الوجبات' });
  }
});

// 2. Public Settings: Drink rules & contact info
apiRouter.get('/public/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await db.select().from(appSettings);
    const config: Record<string, string> = {};
    for (const s of settings) {
      config[s.key] = s.value;
    }
    res.json({
      success: true,
      settings: {
        juiceExclusionDiscount: parseFloat(config['juice_exclusion_discount'] || '5'),
        pepsiReplacementMarkup: parseFloat(config['pepsi_replacement_markup'] || '10'),
        minOrderQuantity: parseInt(config['min_order_quantity'] || '50', 10),
        officialWhatsappAdmin: config['official_whatsapp_admin'] || '01284484868',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل الإعدادات' });
  }
});

// 3. Public Preliminary Booking (NO online payment!)
apiRouter.post('/public/bookings', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      phone,
      whatsapp,
      menuCode,
      quantity,
      pickupDate,
      pickupTime,
      pickupLocation,
      notes,
      drinkOption,
    } = req.body;

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await OrderService.createPreliminaryBooking({
      customerName,
      phone,
      whatsapp,
      menuCode,
      quantity: Number(quantity),
      pickupDate,
      pickupTime,
      pickupLocation,
      notes,
      drinkOption: drinkOption || 'included',
      ip,
      userAgent,
    });

    const msgPayload = {
      orderNumber: result.order.orderNumber,
      customerName: result.customerName,
      customerPhone: result.phone,
      menuCode: result.menuItem.code,
      menuName: result.menuItem.name,
      quantity: Number(quantity),
      pickupDate,
      pickupTime,
      pickupLocation,
      notes,
      modifications: result.optionName,
      customerTotal: result.customerTotal,
      customerPaid: 0,
      customerRemaining: result.customerTotal,
      orderStatus: 'حجز مبدئي - بدون دفع',
    };

    const customerMessage = WhatsAppService.generateCustomerBookingMessage(msgPayload);
    const adminAlertMessage = WhatsAppService.generateAdminNewBookingAlert(msgPayload);

    // Deep link to open WhatsApp with official admin
    const adminPhone = '01284484868';
    const whatsappLink = WhatsAppService.createDeepLink(adminPhone, customerMessage);

    res.json({
      success: true,
      message: 'تم استلام طلب الحجز المبدئي وسيتم التواصل معك عبر واتساب لتأكيد الحجز وتفاصيل الدفع.',
      order: {
        orderNumber: result.order.orderNumber,
        customerName: result.customerName,
        phone: result.phone,
        menuCode: result.menuItem.code,
        menuName: result.menuItem.name,
        quantity: Number(quantity),
        pickupDate,
        pickupTime,
        pickupLocation,
        customerTotal: result.customerTotal,
        customerPaid: 0,
        customerRemaining: result.customerTotal,
        orderStatus: 'PENDING_BOOKING',
      },
      whatsappLink,
      customerMessage,
      adminAlertMessage,
    });
  } catch (error: any) {
    console.error('Error creating public booking:', error);
    res.status(400).json({ success: false, message: error.message || 'فشل تسجيل الحجز المبدئي' });
  }
});

/* ==========================================================================
   ADMIN AUTH APIS (Username + Password + WhatsApp 2FA OTP)
   ========================================================================== */

// Admin Login Step 1: Check Username + Password -> Trigger WhatsApp OTP
apiRouter.post('/admin/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const user = await AuthService.verifyCredentials(username, password, ip);

    // Generate & Dispatch OTP
    const otpResult = await AuthService.generateAndDispatchOtp(user.id, user.phone, ip);

    res.json({
      success: true,
      needOtp: true,
      userId: user.id,
      phone: user.phone,
      whatsappLink: otpResult.whatsappLink,
      message: `تم إرسال رمز التحقق الثنائي (OTP) إلى هاتف الإدارة المسجل (${user.phone}). صالح لمدة 5 دقائق.`,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'بيانات الدخول غير صحيحة' });
  }
});

// Admin Login Step 2: Verify OTP -> Receive Session Token
apiRouter.post('/admin/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'معرف المستخدم ورمز OTP مطلوبان' });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const session = await AuthService.verifyOtpAndCreateSession(Number(userId), String(otp), ip);

    res.json({
      success: true,
      message: 'تم التحقق بنجاح وتأكيد هوية الأدمن',
      session,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'فشل التحقق من رمز OTP' });
  }
});

// Admin Current User
apiRouter.get('/admin/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.adminSession });
});

// Admin Logout
apiRouter.post('/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || (req.headers['x-admin-token'] as string);
  if (token) {
    AuthService.logout(token, req.ip);
  }
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

/* ==========================================================================
   ADMIN DASHBOARD & ORDERS MANAGEMENT APIS
   ========================================================================== */

// 1. Dashboard KPI Statistics
apiRouter.get('/admin/dashboard/stats', requireAdminAuth, requirePermission('reports.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const allOrders = await db.select().from(orders);

    const todayStr = new Date().toISOString().split('T')[0];

    const stats = {
      totalOrders: allOrders.length,
      todayOrders: allOrders.filter((o) => o.pickupDate === todayStr || o.createdAt.toISOString().startsWith(todayStr)).length,
      pendingBooking: allOrders.filter((o) => o.orderStatus === 'PENDING_BOOKING').length,
      confirmed: allOrders.filter((o) => o.orderStatus === 'CONFIRMED').length,
      inProduction: allOrders.filter((o) => o.orderStatus === 'IN_PRODUCTION' || o.orderStatus === 'SENT_TO_SUPPLIER').length,
      ready: allOrders.filter((o) => o.orderStatus === 'READY').length,
      completed: allOrders.filter((o) => o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED').length,
      cancelled: allOrders.filter((o) => o.orderStatus === 'CANCELLED').length,

      // Customer Financials
      totalCustomerSales: allOrders
        .filter((o) => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0),
      totalCustomerPaid: allOrders.reduce((sum, o) => sum + parseFloat(o.customerPaid || '0'), 0),
      totalCustomerRemaining: allOrders
        .filter((o) => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + parseFloat(o.customerRemaining || '0'), 0),

      // Supplier Financials (Factory)
      totalSupplierCost: allOrders
        .filter((o) => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + parseFloat(o.supplierTotal || '0'), 0),
      totalSupplierPaid: allOrders.reduce((sum, o) => sum + parseFloat(o.supplierPaid || '0'), 0),
      totalSupplierRemaining: allOrders
        .filter((o) => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + parseFloat(o.supplierRemaining || '0'), 0),

      // Celebre Gross Profit
      totalGrossProfit: allOrders
        .filter((o) => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + parseFloat(o.distributorProfit || '0'), 0),
    };

    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'فشل استخراج الإحصائيات' });
  }
});

// 2. Orders List with search, status filter, sort, pagination
apiRouter.get('/admin/orders', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, sort_by = 'created_at', sort_order = 'desc', limit = 100, offset = 0 } = req.query;

    const allOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        customerName: customers.fullName,
        customerPhone: customers.phone,
        customerWhatsapp: customers.whatsapp,
        orderStatus: orders.orderStatus,
        cancelReason: orders.cancelReason,
        pickupDate: orders.pickupDate,
        pickupTime: orders.pickupTime,
        pickupLocation: orders.pickupLocation,
        customerNotes: orders.customerNotes,
        totalAmount: orders.totalAmount,
        customerPaid: orders.customerPaid,
        customerRemaining: orders.customerRemaining,
        supplierTotal: orders.supplierTotal,
        supplierPaid: orders.supplierPaid,
        supplierRemaining: orders.supplierRemaining,
        distributorProfit: orders.distributorProfit,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.id));

    // Get order items for each order
    const items = await db.select().from(orderItems);

    let filtered = allOrders.map((o) => {
      const orderItemList = items.filter((it) => it.orderId === o.id);
      const firstItem = orderItemList[0];
      return {
        ...o,
        totalAmount: parseFloat(o.totalAmount),
        customerPaid: parseFloat(o.customerPaid),
        customerRemaining: parseFloat(o.customerRemaining),
        supplierTotal: parseFloat(o.supplierTotal),
        supplierPaid: parseFloat(o.supplierPaid),
        supplierRemaining: parseFloat(o.supplierRemaining),
        distributorProfit: parseFloat(o.distributorProfit),
        menuCode: firstItem?.menuCode || 'Sale',
        menuName: firstItem?.menuName || 'عرض كاترنج',
        quantity: firstItem?.quantity || 100,
        supplierUnitPrice: firstItem ? parseFloat(firstItem.supplierUnitPrice) : 0,
        distributorUnitPrice: firstItem ? parseFloat(firstItem.distributorUnitPrice) : 0,
      };
    });

    if (status && status !== 'ALL' && status !== 'all') {
      filtered = filtered.filter((o) => o.orderStatus === status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.menuCode.toLowerCase().includes(q) ||
          o.pickupLocation.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      orders: filtered.slice(Number(offset), Number(offset) + Number(limit)),
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل الطلبات' });
  }
});

// 3. Single Order Details (Divided visually into Customer, Celebre, Factory, Payments, Audit)
apiRouter.get('/admin/orders/:id', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const orderList = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!orderList.length) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    const order = orderList[0];
    const customer = (await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1))[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const options = items.length
      ? await db.select().from(orderItemOptions).where(eq(orderItemOptions.orderItemId, items[0].id))
      : [];
    const supOrders = await db.select().from(supplierOrders).where(eq(supplierOrders.orderId, orderId));
    const cPayments = await db.select().from(customerPayments).where(eq(customerPayments.orderId, orderId));
    const sPayments = supOrders.length
      ? await db.select().from(supplierPayments).where(eq(supplierPayments.supplierOrderId, supOrders[0].id))
      : [];
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entity, 'orders'), eq(auditLogs.entityId, String(orderId))))
      .orderBy(desc(auditLogs.createdAt));

    // Pre-generate WhatsApp message texts and deep links
    const firstItem = items[0];
    const msgPayload = {
      orderNumber: order.orderNumber,
      customerName: customer?.fullName || '',
      customerPhone: customer?.phone || '',
      customerWhatsapp: customer?.whatsapp || customer?.phone || '',
      menuCode: firstItem?.menuCode || 'Sale',
      menuName: firstItem?.menuName || '',
      quantity: firstItem?.quantity || 100,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      pickupLocation: order.pickupLocation,
      notes: order.customerNotes || undefined,
      modifications: options.map((op) => op.optionName).join(' + ') || undefined,
      customerTotal: parseFloat(order.totalAmount),
      customerPaid: parseFloat(order.customerPaid),
      customerRemaining: parseFloat(order.customerRemaining),
      supplierUnitPrice: firstItem ? parseFloat(firstItem.supplierUnitPrice) : 0,
      supplierTotal: parseFloat(order.supplierTotal),
      supplierPaid: parseFloat(order.supplierPaid),
      supplierRemaining: parseFloat(order.supplierRemaining),
      orderStatus: order.orderStatus,
    };

    const customerMsg = WhatsAppService.generateCustomerBookingMessage(msgPayload);
    const supplierMsg = WhatsAppService.generateSupplierOrderMessage(msgPayload);
    const customerWhatsappLink = WhatsAppService.createDeepLink(customer?.phone || '', customerMsg);
    const supplierWhatsappLink = WhatsAppService.createDeepLink('01284484868', supplierMsg);

    res.json({
      success: true,
      order: {
        ...order,
        totalAmount: parseFloat(order.totalAmount),
        customerPaid: parseFloat(order.customerPaid),
        customerRemaining: parseFloat(order.customerRemaining),
        supplierTotal: parseFloat(order.supplierTotal),
        supplierPaid: parseFloat(order.supplierPaid),
        supplierRemaining: parseFloat(order.supplierRemaining),
        distributorProfit: parseFloat(order.distributorProfit),
      },
      customer,
      items: items.map((it) => ({
        ...it,
        distributorUnitPrice: parseFloat(it.distributorUnitPrice),
        supplierUnitPrice: parseFloat(it.supplierUnitPrice),
        distributorTotal: parseFloat(it.distributorTotal),
        supplierTotal: parseFloat(it.supplierTotal),
        customerTotal: parseFloat(it.customerTotal),
        supplierTotalFinal: parseFloat(it.supplierTotalFinal),
        profit: parseFloat(it.profit),
      })),
      options,
      supplierOrders: supOrders.map((s) => ({
        ...s,
        supplierTotal: parseFloat(s.supplierTotal),
        supplierPaid: parseFloat(s.supplierPaid),
        supplierRemaining: parseFloat(s.supplierRemaining),
      })),
      customerPayments: cPayments.map((p) => ({
        ...p,
        amount: parseFloat(p.amount),
      })),
      supplierPayments: sPayments.map((p) => ({
        ...p,
        amount: parseFloat(p.amount),
      })),
      auditLogs: logs,
      whatsapp: {
        customerMessage: customerMsg,
        supplierMessage: supplierMsg,
        customerLink: customerWhatsappLink,
        supplierLink: supplierWhatsappLink,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل تفاصيل الطلب' });
  }
});

// 4. Update Order Status
apiRouter.put('/admin/orders/:id/status', requireAdminAuth, requirePermission('orders.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { status, cancelReason } = req.body;
    const adminUser = req.adminSession?.username || 'admin';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (status === 'CANCELLED' && !AuthService.hasPermission(req.adminSession!, 'orders.cancel')) {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية إلغاء الطلبات' });
    }

    const result = await OrderService.updateOrderStatus(orderId, status, cancelReason, adminUser, ip);
    res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح', status: result.status });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث الحالة' });
  }
});

// 5. Update Order Operational Details
apiRouter.put('/admin/orders/:id/details', requireAdminAuth, requirePermission('orders.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const adminUser = req.adminSession?.username || 'admin';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    await OrderService.updateOrderDetails(orderId, req.body, adminUser, ip);
    res.json({ success: true, message: 'تم تحديث تفاصيل الطلب وإعادة حساب الأسعار المسجلة بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث بيانات الطلب' });
  }
});

// 6. Record Customer Payment (Manual - InstaPay / Cash)
apiRouter.post(
  '/admin/orders/:id/customer-payment',
  requireAdminAuth,
  requirePermission('customer_payments.create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = Number(req.params.id);
      const { amount, paymentMethod, paymentReference, notes } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await OrderService.recordCustomerPayment(
        orderId,
        parseFloat(amount),
        paymentMethod || 'INSTAPAY',
        paymentReference || '',
        notes || '',
        adminUser,
        ip
      );

      res.json({
        success: true,
        message: 'تم تسجيل دفعة العميل بنجاح وتحديث الرصيد المتبقي وحالة الطلب',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل تسجيل الدفعة' });
    }
  }
);

// 7. Record Supplier Payment (Celebre -> Factory)
apiRouter.post(
  '/admin/orders/:id/supplier-payment',
  requireAdminAuth,
  requirePermission('supplier_payments.create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = Number(req.params.id);
      const { amount, paymentMethod, reference, notes } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const supOrders = await db.select().from(supplierOrders).where(eq(supplierOrders.orderId, orderId)).limit(1);
      if (!supOrders.length) {
        return res.status(404).json({ success: false, message: 'أمر التوريد الخاص بالمصنع غير موجود' });
      }

      const result = await OrderService.recordSupplierPayment(
        supOrders[0].id,
        parseFloat(amount),
        paymentMethod || 'BANK_TRANSFER',
        reference || '',
        notes || '',
        adminUser,
        ip
      );

      res.json({
        success: true,
        message: 'تم تسجيل تحويل دفعة المصنع بنجاح وتحديث متبقي المصنع',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل تسجيل دفعة المصنع' });
    }
  }
);

// 8. Financial Report
apiRouter.get('/admin/reports/financial', requireAdminAuth, requirePermission('reports.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'this_month', from_date, to_date } = req.query;

    const allOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        pickupDate: orders.pickupDate,
        totalAmount: orders.totalAmount,
        customerPaid: orders.customerPaid,
        customerRemaining: orders.customerRemaining,
        supplierTotal: orders.supplierTotal,
        supplierPaid: orders.supplierPaid,
        supplierRemaining: orders.supplierRemaining,
        distributorProfit: orders.distributorProfit,
        orderStatus: orders.orderStatus,
        createdAt: orders.createdAt,
      })
      .from(orders);

    const activeOrders = allOrders.filter((o) => o.orderStatus !== 'CANCELLED');

    const summary = {
      totalSales: activeOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
      totalCustomerPaid: activeOrders.reduce((sum, o) => sum + parseFloat(o.customerPaid), 0),
      totalCustomerRemaining: activeOrders.reduce((sum, o) => sum + parseFloat(o.customerRemaining), 0),
      totalSupplierCost: activeOrders.reduce((sum, o) => sum + parseFloat(o.supplierTotal), 0),
      totalSupplierPaid: activeOrders.reduce((sum, o) => sum + parseFloat(o.supplierPaid), 0),
      totalSupplierRemaining: activeOrders.reduce((sum, o) => sum + parseFloat(o.supplierRemaining), 0),
      totalGrossProfit: activeOrders.reduce((sum, o) => sum + parseFloat(o.distributorProfit), 0),
      ordersCount: activeOrders.length,
    };

    res.json({ success: true, summary, orders: activeOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل إنشاء التقرير المالي' });
  }
});

// 9. Report by Catering Meal (Sale-01 to Sale-18)
apiRouter.get('/admin/reports/sales-by-item', requireAdminAuth, requirePermission('reports.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const menuList = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
    const items = await db.select().from(orderItems);
    const activeOrders = await db.select().from(orders).where(sql`${orders.orderStatus} != 'CANCELLED'`);
    const activeOrderIds = new Set(activeOrders.map((o) => o.id));

    const breakdown = menuList.map((m) => {
      const matched = items.filter((it) => it.menuItemId === m.id && activeOrderIds.has(it.orderId));
      const totalUnits = matched.reduce((sum, it) => sum + it.quantity, 0);
      const totalCustomerSales = matched.reduce((sum, it) => sum + parseFloat(it.customerTotal), 0);
      const totalSupplierCost = matched.reduce((sum, it) => sum + parseFloat(it.supplierTotalFinal), 0);
      const totalProfit = matched.reduce((sum, it) => sum + parseFloat(it.profit), 0);

      return {
        code: m.code,
        name: m.name,
        distributorPrice: parseFloat(m.distributorPrice),
        supplierPrice: parseFloat(m.supplierPrice),
        ordersCount: matched.length,
        totalUnits,
        totalCustomerSales,
        totalSupplierCost,
        totalProfit,
      };
    });

    res.json({ success: true, breakdown });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل إنشاء تقرير الوجبات' });
  }
});

// 10. Audit Logs List
apiRouter.get('/admin/audit-logs', requireAdminAuth, requirePermission('audit_logs.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل سجل التدقيق' });
  }
});

// 11. Admin Menu Management (View & Update Prices)
apiRouter.get('/admin/menu', requireAdminAuth, requirePermission('menu.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
    const history = await db.select().from(menuPriceHistory).orderBy(desc(menuPriceHistory.createdAt));
    res.json({ success: true, menu: items, priceHistory: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل قائمة الوجبات للإدارة' });
  }
});

apiRouter.put('/admin/menu/:id/prices', requireAdminAuth, requirePermission('prices.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const { distributorPrice, supplierPrice } = req.body;
    const adminUser = req.adminSession?.username || 'admin';

    const existing = await db.select().from(menuItems).where(eq(menuItems.id, itemId)).limit(1);
    if (!existing.length) return res.status(404).json({ success: false, message: 'الوجبة غير موجودة' });

    await db
      .update(menuItems)
      .set({
        distributorPrice: Number(distributorPrice).toFixed(2),
        supplierPrice: Number(supplierPrice).toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, itemId));

    // Record price history
    await db.insert(menuPriceHistory).values({
      menuItemId: itemId,
      distributorPrice: Number(distributorPrice).toFixed(2),
      supplierPrice: Number(supplierPrice).toFixed(2),
      createdBy: adminUser,
    });

    // Audit log
    await db.insert(auditLogs).values({
      userName: adminUser,
      action: 'MENU_PRICE_UPDATED',
      entity: 'menu_items',
      entityId: String(itemId),
      oldData: {
        distributorPrice: existing[0].distributorPrice,
        supplierPrice: existing[0].supplierPrice,
      },
      newData: { distributorPrice, supplierPrice },
    });

    res.json({ success: true, message: 'تم تحديث السعر وتوثيقه في سجل أسعار المنيو بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث السعر' });
  }
});

// 12. Suppliers List
apiRouter.get('/admin/suppliers', requireAdminAuth, requirePermission('suppliers.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const supList = await db.select().from(suppliers);
    const supOrders = await db.select().from(supplierOrders);

    const suppliersWithTotals = supList.map((s) => {
      const ordersForSup = supOrders.filter((so) => so.supplierId === s.id);
      return {
        ...s,
        totalOrdersCount: ordersForSup.length,
        totalPayable: ordersForSup.reduce((sum, o) => sum + parseFloat(o.supplierTotal), 0),
        totalPaid: ordersForSup.reduce((sum, o) => sum + parseFloat(o.supplierPaid), 0),
        totalRemaining: ordersForSup.reduce((sum, o) => sum + parseFloat(o.supplierRemaining), 0),
      };
    });

    res.json({ success: true, suppliers: suppliersWithTotals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل بيانات المصانع والموردين' });
  }
});
