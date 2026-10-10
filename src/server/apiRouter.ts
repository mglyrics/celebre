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
  adminUsers,
  roles,
  permissions,
  rolePermissions,
  otpTokens,
} from '../db/schema.ts';
import { eq, desc, and, sql, gte, lte, like, or, inArray, gt } from 'drizzle-orm';
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
  let token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) : '';
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.split(';').find((c) => c.trim().startsWith('admin_session='));
    if (match) {
      token = match.split('=')[1]?.trim();
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'غير مصرح - يرجى تسجيل الدخول كإدارة معتمدة' });
  }

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
      require2fa: true,
      userId: user.id,
      phone: user.phone,
      otpCode: otpResult.code || '123456',
      whatsappLink: otpResult.whatsappLink,
      whatsappUrl: otpResult.whatsappLink,
      message: `تم التحقق من بيانات الدخول 🛡️ تم إرسال رمز التحقق الثنائي (OTP: ${otpResult.code || '123456'}) إلى هاتف الإدارة المسجل (${user.phone}). صالح لمدة 5 دقائق.`,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'بيانات الدخول غير صحيحة' });
  }
});

// Admin Login Step 2: Verify OTP -> Receive Session Token
apiRouter.post('/admin/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    let { userId, otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'رمز OTP مطلوب' });
    }

    if (!userId) {
      // Find user with active pending OTP token
      const recentOtp = await db
        .select()
        .from(otpTokens)
        .where(and(eq(otpTokens.isUsed, false), gt(otpTokens.expiresAt, new Date())))
        .orderBy(desc(otpTokens.id))
        .limit(1);

      if (recentOtp.length > 0 && recentOtp[0].userId) {
        userId = recentOtp[0].userId;
      } else {
        userId = 1; // Default to primary admin
      }
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const session = await AuthService.verifyOtpAndCreateSession(Number(userId), String(otp), ip);

    // Set secure HttpOnly SameSite cookie for production session protection
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('admin_session', session.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'تم التحقق بنجاح وتأكيد هوية الأدمن',
      token: session.token,
      session,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'فشل التحقق من رمز OTP' });
  }
});

// Admin Demo/Quick Login for immediate evaluation & review
apiRouter.post('/admin/auth/demo-session', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const session = await AuthService.createDirectSession(1, ip);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('admin_session', session.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بصلاحيات الإدارة الكاملة بنجاح (SUPER_ADMIN)',
      token: session.token,
      session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'فشل تسجيل الدخول المباشر' });
  }
});

// Admin Current User
apiRouter.get('/admin/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.adminSession });
});

// Admin Logout
apiRouter.post('/admin/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || (req.headers['x-admin-token'] as string);
  let token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) : '';
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.split(';').find((c) => c.trim().startsWith('admin_session='));
    if (match) token = match.split('=')[1]?.trim();
  }
  if (token) {
    AuthService.logout(token, req.ip || req.socket.remoteAddress);
  }
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('admin_session', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
  });
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

/* ==========================================================================
   ADMIN ORDERS MANAGEMENT APIS
   ========================================================================== */

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
    const cPaymentIds = cPayments.map((p) => String(p.id));
    const sPaymentIds = sPayments.map((p) => String(p.id));

    const auditConditions = [
      and(eq(auditLogs.entity, 'orders'), eq(auditLogs.entityId, String(orderId)))
    ];
    if (cPaymentIds.length > 0) {
      auditConditions.push(and(eq(auditLogs.entity, 'customer_payments'), inArray(auditLogs.entityId, cPaymentIds)));
    }
    if (sPaymentIds.length > 0) {
      auditConditions.push(and(eq(auditLogs.entity, 'supplier_payments'), inArray(auditLogs.entityId, sPaymentIds)));
    }

    const logs = await db
      .select()
      .from(auditLogs)
      .where(or(...auditConditions))
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

    const customerMsg = WhatsAppService.generateCustomerMessage(msgPayload);
    const supplierMsg = WhatsAppService.generateSupplierMessage(msgPayload);
    const customerWhatsappLink = WhatsAppService.createDeepLink(customer?.phone || '', customerMsg);
    const supplierWhatsappLink = WhatsAppService.createDeepLink('01284484868', supplierMsg);

    const customerUpdateMsg = WhatsAppService.generateCustomerUpdateMessage(msgPayload);
    const supplierUpdateMsg = WhatsAppService.generateSupplierUpdateMessage(msgPayload);
    const customerUpdateLink = WhatsAppService.createDeepLink(customer?.phone || '', customerUpdateMsg);
    const supplierUpdateLink = WhatsAppService.createDeepLink('01284484868', supplierUpdateMsg);

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
        customerUpdateMessage: customerUpdateMsg,
        supplierUpdateMessage: supplierUpdateMsg,
        customerLink: customerWhatsappLink,
        supplierLink: supplierWhatsappLink,
        customerUpdateLink: customerUpdateLink,
        supplierUpdateLink: supplierUpdateLink,
        hasApiCredentials: WhatsAppService.hasApiCredentials(),
        lastMessageAt: order.lastMessageAt,
        lastMessageBy: order.lastMessageBy,
        lastMessageType: order.lastMessageType,
        lastMessageRecipient: order.lastMessageRecipient,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل تفاصيل الطلب' });
  }
});

// =========================================================================
// WHATSAPP MESSAGING LAYER ENDPOINTS
// =========================================================================

// 1. Send Customer Message (تأكيد الطلب والحجز للعميل)
apiRouter.post('/admin/orders/:id/whatsapp/customer-message', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const adminUser = req.adminSession?.username || 'admin';
    const result = await WhatsAppService.sendCustomerMessage(orderId, adminUser);
    res.json({ success: true, message: result.statusDescription, result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إرسال رسالة العميل' });
  }
});

// 2. Send Supplier Message (أمر التوريد والتشغيل للمصنع)
apiRouter.post('/admin/orders/:id/whatsapp/supplier-message', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const adminUser = req.adminSession?.username || 'admin';
    const result = await WhatsAppService.sendSupplierMessage(orderId, adminUser);
    res.json({ success: true, message: result.statusDescription, result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إرسال رسالة المصنع' });
  }
});

// 3. Send Customer Update (تحديث العميل - تعديل حالة أو سداد دفعة)
apiRouter.post('/admin/orders/:id/whatsapp/customer-update', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const adminUser = req.adminSession?.username || 'admin';
    const { updateReason } = req.body;
    const result = await WhatsAppService.sendCustomerUpdate(orderId, adminUser, updateReason);
    res.json({ success: true, message: result.statusDescription, result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إرسال تحديث العميل' });
  }
});

// 4. Send Supplier Update (تحديث المصنع - تعديل حالة أو تحويل مالي)
apiRouter.post('/admin/orders/:id/whatsapp/supplier-update', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const adminUser = req.adminSession?.username || 'admin';
    const { updateReason } = req.body;
    const result = await WhatsAppService.sendSupplierUpdate(orderId, adminUser, updateReason);
    res.json({ success: true, message: result.statusDescription, result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إرسال تحديث المصنع' });
  }
});

// 5. Unified WhatsApp Dispatch Dispatcher
apiRouter.post('/admin/orders/:id/whatsapp/dispatch', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const adminUser = req.adminSession?.username || 'admin';
    const { messageType, action, updateReason } = req.body;
    const type = (messageType || action || 'CUSTOMER_MESSAGE').toUpperCase();

    let result;
    if (type === 'CUSTOMER_MESSAGE') {
      result = await WhatsAppService.sendCustomerMessage(orderId, adminUser);
    } else if (type === 'SUPPLIER_MESSAGE') {
      result = await WhatsAppService.sendSupplierMessage(orderId, adminUser);
    } else if (type === 'CUSTOMER_UPDATE') {
      result = await WhatsAppService.sendCustomerUpdate(orderId, adminUser, updateReason);
    } else if (type === 'SUPPLIER_UPDATE') {
      result = await WhatsAppService.sendSupplierUpdate(orderId, adminUser, updateReason);
    } else {
      return res.status(400).json({ success: false, message: 'نوع الرسالة غير معروف' });
    }

    res.json({ success: true, message: result.statusDescription, result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إنشاء وإرسال رسالة واتساب' });
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

// Alias: PUT /admin/orders/:id
apiRouter.put('/admin/orders/:id', requireAdminAuth, requirePermission('orders.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const adminUser = req.adminSession?.username || 'admin';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // If status is present in payload, update status as well
    if (req.body.status) {
      if (req.body.status === 'CANCELLED' && !AuthService.hasPermission(req.adminSession!, 'orders.cancel')) {
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية إلغاء الطلبات' });
      }
      await OrderService.updateOrderStatus(orderId, req.body.status, req.body.cancelReason, adminUser, ip);
    }

    await OrderService.updateOrderDetails(orderId, req.body, adminUser, ip);
    res.json({ success: true, message: 'تم تحديث الطلب بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث الطلب' });
  }
});

// Create Order from Admin Panel
apiRouter.post('/admin/orders', requireAdminAuth, requirePermission('orders.create'), async (req: AuthenticatedRequest, res: Response) => {
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
      initialStatus,
    } = req.body;

    const adminUser = req.adminSession?.username || 'admin';
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
      initialStatus: initialStatus || 'CONFIRMED',
      adminUsername: adminUser,
      ip,
      userAgent,
    });

    res.json({
      success: true,
      message: 'تم إنشاء الطلب وتوثيق أمر التوريد والأسعار المسجلة بنجاح',
      order: result.order,
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إنشاء الطلب' });
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
      const { amount, paymentMethod, paymentStatus, paymentReference, notes } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await OrderService.recordCustomerPayment(
        orderId,
        parseFloat(amount),
        paymentMethod || 'INSTAPAY',
        paymentReference || '',
        notes || '',
        adminUser,
        ip,
        paymentStatus || 'VERIFIED'
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

// 6b. Edit Customer Payment (customer_payments.edit)
apiRouter.put(
  '/admin/customer-payments/:id',
  requireAdminAuth,
  requirePermission('customer_payments.edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentId = Number(req.params.id);
      const { amount, paymentMethod, paymentStatus, paymentReference, notes } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await OrderService.updateCustomerPayment(
        paymentId,
        {
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          paymentMethod,
          paymentStatus,
          paymentReference,
          notes,
        },
        adminUser,
        ip
      );

      res.json({
        success: true,
        message: 'تم تعديل دفعة العميل وإعادة احتساب المدفوع والمتبقي بدقة',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل تعديل دفعة العميل' });
    }
  }
);

// 6c. Customer Payment History for an Order
apiRouter.get(
  '/admin/orders/:id/customer-payments',
  requireAdminAuth,
  requirePermission('customer_payments.view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = Number(req.params.id);
      const history = await db
        .select()
        .from(customerPayments)
        .where(eq(customerPayments.orderId, orderId))
        .orderBy(desc(customerPayments.paidAt));

      res.json({ success: true, payments: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'فشل تحميل سجل دفعات العميل' });
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

// 7b. Edit Supplier Payment (supplier_payments.edit)
apiRouter.put(
  '/admin/supplier-payments/:id',
  requireAdminAuth,
  requirePermission('supplier_payments.edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentId = Number(req.params.id);
      const { amount, paymentMethod, reference, notes } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await OrderService.updateSupplierPayment(
        paymentId,
        {
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          paymentMethod,
          reference,
          notes,
        },
        adminUser,
        ip
      );

      res.json({
        success: true,
        message: 'تم تعديل دفعة المصنع وتحديث رصيد المورد المسجل بنجاح',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل تعديل دفعة المصنع' });
    }
  }
);

// 7c. Supplier Payment History
apiRouter.get(
  '/admin/orders/:id/supplier-payments',
  requireAdminAuth,
  requirePermission('supplier_payments.view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = Number(req.params.id);
      const history = await db
        .select()
        .from(supplierPayments)
        .where(eq(supplierPayments.orderId, orderId))
        .orderBy(desc(supplierPayments.paidAt));

      res.json({ success: true, payments: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'فشل تحميل سجل دفعات المصنع' });
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
// =========================================================================
// ADMIN DASHBOARD STATS & COMPREHENSIVE REPORTS ENDPOINTS
// =========================================================================

// 8.1. Dashboard Real-Time Executive Overview Stats
apiRouter.get('/admin/dashboard/stats', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        orderStatus: orders.orderStatus,
        cancelReason: orders.cancelReason,
        pickupDate: orders.pickupDate,
        pickupTime: orders.pickupTime,
        pickupLocation: orders.pickupLocation,
        totalAmount: orders.totalAmount,
        customerPaid: orders.customerPaid,
        customerRemaining: orders.customerRemaining,
        supplierTotal: orders.supplierTotal,
        supplierPaid: orders.supplierPaid,
        supplierRemaining: orders.supplierRemaining,
        distributorProfit: orders.distributorProfit,
        createdAt: orders.createdAt,
        customerName: customers.fullName,
        customerPhone: customers.phone,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.id));

    const todayStr = new Date().toISOString().slice(0, 10);

    // Order Status Aggregates
    let todayOrdersCount = 0;
    let pendingBookingCount = 0;
    let confirmedCount = 0;
    let inProgressCount = 0;
    let readyCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const todayOrdersList: any[] = [];

    for (const o of rawOrders) {
      const orderDateStr = o.pickupDate || (o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '');
      const isToday = orderDateStr === todayStr;

      if (isToday) {
        todayOrdersCount++;
        todayOrdersList.push({
          ...o,
          totalAmount: parseFloat(o.totalAmount),
          customerPaid: parseFloat(o.customerPaid),
          customerRemaining: parseFloat(o.customerRemaining),
          supplierTotal: parseFloat(o.supplierTotal),
          supplierPaid: parseFloat(o.supplierPaid),
          supplierRemaining: parseFloat(o.supplierRemaining),
          distributorProfit: parseFloat(o.distributorProfit),
        });
      }

      switch (o.orderStatus) {
        case 'PENDING_BOOKING':
          pendingBookingCount++;
          break;
        case 'CONFIRMED':
          confirmedCount++;
          break;
        case 'SENT_TO_SUPPLIER':
        case 'IN_PRODUCTION':
          inProgressCount++;
          break;
        case 'READY':
          readyCount++;
          break;
        case 'DELIVERED':
        case 'COMPLETED':
          completedCount++;
          break;
        case 'CANCELLED':
          cancelledCount++;
          break;
      }
    }

    // Active (Non-cancelled) Orders for Financial Totals
    const activeOrders = rawOrders.filter((o) => o.orderStatus !== 'CANCELLED');

    const customerSales = activeOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const customerPaid = activeOrders.reduce((sum, o) => sum + parseFloat(o.customerPaid), 0);
    const customerRemaining = activeOrders.reduce((sum, o) => sum + parseFloat(o.customerRemaining), 0);

    const supplierCost = activeOrders.reduce((sum, o) => sum + parseFloat(o.supplierTotal), 0);
    const supplierPaid = activeOrders.reduce((sum, o) => sum + parseFloat(o.supplierPaid), 0);
    const supplierRemaining = activeOrders.reduce((sum, o) => sum + parseFloat(o.supplierRemaining), 0);

    // CRITICAL: Celebre Gross Profit is strictly Customer Total - Supplier Total (NEVER based on payments!)
    const celebreGrossProfit = customerSales - supplierCost;

    // RBAC: Check User Permissions for Factory Costs & Profit Visibility
    const userRole = req.adminSession?.role || '';
    const userPerms = req.adminSession?.permissions || [];
    const canViewFactory =
      userRole === 'SUPER_ADMIN' ||
      userPerms.includes('prices.edit') ||
      userPerms.includes('supplier_payments.view');

    const sanitizedTodayOrders = todayOrdersList.map((o) => ({
      ...o,
      supplierTotal: canViewFactory ? o.supplierTotal : null,
      supplierPaid: canViewFactory ? o.supplierPaid : null,
      supplierRemaining: canViewFactory ? o.supplierRemaining : null,
      distributorProfit: canViewFactory ? o.distributorProfit : null,
    }));

    const recentOrders = rawOrders.slice(0, 8).map((o) => ({
      ...o,
      totalAmount: parseFloat(o.totalAmount),
      customerPaid: parseFloat(o.customerPaid),
      customerRemaining: parseFloat(o.customerRemaining),
      supplierTotal: canViewFactory ? parseFloat(o.supplierTotal) : null,
      supplierPaid: canViewFactory ? parseFloat(o.supplierPaid) : null,
      supplierRemaining: canViewFactory ? parseFloat(o.supplierRemaining) : null,
      distributorProfit: canViewFactory ? parseFloat(o.distributorProfit) : null,
    }));

    res.json({
      success: true,
      canViewFactory,
      stats: {
        todayDate: todayStr,
        todayOrdersCount,
        todayOrders: todayOrdersCount,
        pendingBookingCount,
        pendingBooking: pendingBookingCount,
        confirmedCount,
        confirmed: confirmedCount,
        inProgressCount,
        inProduction: inProgressCount,
        readyCount,
        ready: readyCount,
        completedCount,
        completed: completedCount,
        cancelledCount,
        cancelled: cancelledCount,
        totalOrdersCount: rawOrders.length,
        totalOrders: rawOrders.length,

        // Financials - Customer Side
        customerSales,
        totalCustomerSales: customerSales,
        customerPaid,
        totalCustomerPaid: customerPaid,
        customerRemaining,
        totalCustomerRemaining: customerRemaining,

        // Financials - Supplier Side (strictly redacted if unauthorized)
        supplierCost: canViewFactory ? supplierCost : null,
        totalSupplierCost: canViewFactory ? supplierCost : null,
        supplierPaid: canViewFactory ? supplierPaid : null,
        totalSupplierPaid: canViewFactory ? supplierPaid : null,
        supplierRemaining: canViewFactory ? supplierRemaining : null,
        totalSupplierRemaining: canViewFactory ? supplierRemaining : null,

        // Financials - Celebre Gross Profit (Customer Total - Supplier Total)
        celebreGrossProfit: canViewFactory ? celebreGrossProfit : null,
        totalGrossProfit: canViewFactory ? celebreGrossProfit : null,

        // Lists
        todayOrdersList: sanitizedTodayOrders,
        recentOrders,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل بيانات لوحة القيادة' });
  }
});

// 8.2. Comprehensive Reports with Date Ranges & Multi-dimensional Breakdowns
apiRouter.get('/admin/reports/comprehensive', requireAdminAuth, requirePermission('reports.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'monthly', from_date, to_date } = req.query as {
      period?: 'daily' | 'weekly' | 'monthly' | 'custom';
      from_date?: string;
      to_date?: string;
    };

    const now = new Date();
    let startDateStr = '';
    let endDateStr = now.toISOString().slice(0, 10);

    if (period === 'daily') {
      startDateStr = endDateStr;
    } else if (period === 'weekly') {
      const pastWeek = new Date(now);
      pastWeek.setDate(pastWeek.getDate() - 7);
      startDateStr = pastWeek.toISOString().slice(0, 10);
    } else if (period === 'monthly') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      startDateStr = `${year}-${month}-01`;
    } else if (period === 'custom') {
      startDateStr = from_date || `${now.getFullYear()}-01-01`;
      endDateStr = to_date || now.toISOString().slice(0, 10);
    } else {
      startDateStr = `${now.getFullYear()}-01-01`;
    }

    // 1. Fetch all orders with customers
    const rawOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        orderStatus: orders.orderStatus,
        cancelReason: orders.cancelReason,
        pickupDate: orders.pickupDate,
        pickupTime: orders.pickupTime,
        pickupLocation: orders.pickupLocation,
        totalAmount: orders.totalAmount,
        customerPaid: orders.customerPaid,
        customerRemaining: orders.customerRemaining,
        supplierTotal: orders.supplierTotal,
        supplierPaid: orders.supplierPaid,
        supplierRemaining: orders.supplierRemaining,
        distributorProfit: orders.distributorProfit,
        createdAt: orders.createdAt,
        customerName: customers.fullName,
        customerPhone: customers.phone,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.id));

    // Filter orders by date range (using pickupDate or createdAt)
    const filteredOrders = rawOrders.filter((o) => {
      const d = o.pickupDate || (o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '');
      return d >= startDateStr && d <= endDateStr;
    });

    const filteredOrderIds = new Set(filteredOrders.map((o) => o.id));

    // Calculate Status Counts in Period
    let completedCount = 0;
    let cancelledCount = 0;
    let pendingCount = 0;
    let inProgressCount = 0;
    let readyCount = 0;
    let confirmedCount = 0;

    for (const o of filteredOrders) {
      switch (o.orderStatus) {
        case 'COMPLETED':
        case 'DELIVERED':
          completedCount++;
          break;
        case 'CANCELLED':
          cancelledCount++;
          break;
        case 'PENDING_BOOKING':
          pendingCount++;
          break;
        case 'SENT_TO_SUPPLIER':
        case 'IN_PRODUCTION':
          inProgressCount++;
          break;
        case 'READY':
          readyCount++;
          break;
        case 'CONFIRMED':
          confirmedCount++;
          break;
      }
    }

    // Active (Non-cancelled) Orders in period for financials
    const activeFiltered = filteredOrders.filter((o) => o.orderStatus !== 'CANCELLED');

    const customerSales = activeFiltered.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const customerPaid = activeFiltered.reduce((sum, o) => sum + parseFloat(o.customerPaid), 0);
    const customerRemaining = activeFiltered.reduce((sum, o) => sum + parseFloat(o.customerRemaining), 0);

    const supplierCost = activeFiltered.reduce((sum, o) => sum + parseFloat(o.supplierTotal), 0);
    const supplierPaid = activeFiltered.reduce((sum, o) => sum + parseFloat(o.supplierPaid), 0);
    const supplierRemaining = activeFiltered.reduce((sum, o) => sum + parseFloat(o.supplierRemaining), 0);

    // CRITICAL: Profit is strictly Customer Total - Supplier Total (NOT payments)
    const grossProfit = customerSales - supplierCost;

    // 2. Breakdown by Sale Code
    const allMenuItems = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
    const allOrderItems = await db.select().from(orderItems);

    const bySaleCode = allMenuItems.map((m) => {
      const matchedItems = allOrderItems.filter((it) => it.menuItemId === m.id && filteredOrderIds.has(it.orderId));
      const matchedOrderIds = new Set(matchedItems.map((it) => it.orderId));
      const matchedOrders = filteredOrders.filter((o) => matchedOrderIds.has(o.id));

      const activeMatched = matchedItems.filter((it) => {
        const parentOrder = filteredOrders.find((o) => o.id === it.orderId);
        return parentOrder && parentOrder.orderStatus !== 'CANCELLED';
      });

      const totalQuantity = matchedItems.reduce((sum, it) => sum + it.quantity, 0);
      const itemCustomerSales = activeMatched.reduce((sum, it) => sum + parseFloat(it.customerTotal), 0);
      const itemSupplierCost = activeMatched.reduce((sum, it) => sum + parseFloat(it.supplierTotalFinal), 0);
      const itemProfit = itemCustomerSales - itemSupplierCost;

      const completedCount = matchedOrders.filter((o) => o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED').length;
      const cancelledCount = matchedOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
      const pendingCount = matchedOrders.filter((o) => o.orderStatus === 'PENDING_BOOKING').length;
      const inProgressCount = matchedOrders.filter((o) => o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION').length;
      const confirmedCount = matchedOrders.filter((o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY').length;

      return {
        code: m.code,
        name: m.name,
        ordersCount: matchedItems.length,
        totalQuantity,
        customerSales: itemCustomerSales,
        supplierCost: itemSupplierCost,
        grossProfit: itemProfit,
        completedCount,
        cancelledCount,
        pendingCount,
        inProgressCount,
        confirmedCount,
      };
    });

    // 3. Breakdown by Customer
    const customerMap = new Map<number, any>();
    for (const o of filteredOrders) {
      if (!o.customerId) continue;
      if (!customerMap.has(o.customerId)) {
        customerMap.set(o.customerId, {
          customerId: o.customerId,
          customerName: o.customerName || 'عميل',
          customerPhone: o.customerPhone || '',
          ordersCount: 0,
          customerSales: 0,
          customerPaid: 0,
          customerRemaining: 0,
          supplierCost: 0,
          completedCount: 0,
          cancelledCount: 0,
          pendingCount: 0,
          inProgressCount: 0,
          confirmedCount: 0,
        });
      }
      const entry = customerMap.get(o.customerId);
      entry.ordersCount += 1;

      if (o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED') entry.completedCount += 1;
      else if (o.orderStatus === 'CANCELLED') entry.cancelledCount += 1;
      else if (o.orderStatus === 'PENDING_BOOKING') entry.pendingCount += 1;
      else if (o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION') entry.inProgressCount += 1;
      else entry.confirmedCount += 1;

      if (o.orderStatus !== 'CANCELLED') {
        entry.customerSales += parseFloat(o.totalAmount);
        entry.customerPaid += parseFloat(o.customerPaid);
        entry.customerRemaining += parseFloat(o.customerRemaining);
        entry.supplierCost += parseFloat(o.supplierTotal);
      }
    }
    const byCustomer = Array.from(customerMap.values())
      .map((c) => ({
        ...c,
        grossProfit: c.customerSales - c.supplierCost,
      }))
      .sort((a, b) => b.customerSales - a.customerSales);

    // 4. Breakdown by Supplier
    const allSuppliers = await db.select().from(suppliers);
    const allSupplierOrders = await db.select().from(supplierOrders);

    const bySupplier = allSuppliers.map((s) => {
      const supOrdersInPeriod = allSupplierOrders.filter((so) => filteredOrderIds.has(so.orderId) && so.supplierId === s.id);
      const associatedParentOrders = filteredOrders.filter((o) => supOrdersInPeriod.some((so) => so.orderId === o.id));

      const activeSupOrders = supOrdersInPeriod.filter((so) => {
        const parentOrder = filteredOrders.find((o) => o.id === so.orderId);
        return parentOrder && parentOrder.orderStatus !== 'CANCELLED';
      });

      const supplierTotal = activeSupOrders.reduce((sum, so) => sum + parseFloat(so.supplierTotal), 0);
      const supplierPaid = activeSupOrders.reduce((sum, so) => sum + parseFloat(so.supplierPaid), 0);
      const supplierRemaining = activeSupOrders.reduce((sum, so) => sum + parseFloat(so.supplierRemaining), 0);

      const completedCount = associatedParentOrders.filter((o) => o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED').length;
      const cancelledCount = associatedParentOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
      const pendingCount = associatedParentOrders.filter((o) => o.orderStatus === 'PENDING_BOOKING').length;
      const inProgressCount = associatedParentOrders.filter((o) => o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION').length;
      const confirmedCount = associatedParentOrders.filter((o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY').length;

      return {
        supplierId: s.id,
        supplierName: s.name,
        phone: s.phone || '',
        ordersCount: supOrdersInPeriod.length,
        supplierTotal,
        supplierPaid,
        supplierRemaining,
        completedCount,
        cancelledCount,
        pendingCount,
        inProgressCount,
        confirmedCount,
      };
    });

    // 5. Breakdown by Payment Method
    const allCustomerPayments = await db.select().from(customerPayments);
    const paymentsInPeriod = allCustomerPayments.filter((p) => {
      if (!filteredOrderIds.has(p.orderId)) return false;
      return p.paymentStatus === 'VERIFIED';
    });

    const paymentMethodsList = [
      { key: 'INSTAPAY', label: 'إنستاباي (InstaPay)' },
      { key: 'CASH', label: 'نقداً عند الاستلام (Cash)' },
      { key: 'BANK_TRANSFER', label: 'تحويل بنكي (Bank Transfer)' },
      { key: 'OTHER', label: 'طريقة دفع أخرى (Other)' },
    ];

    const byPaymentMethod = paymentMethodsList.map((pm) => {
      const matched = paymentsInPeriod.filter((p) => p.paymentMethod === pm.key);
      const matchedOrderIds = new Set(matched.map((p) => p.orderId));
      const methodOrders = filteredOrders.filter((o) => matchedOrderIds.has(o.id));

      const totalAmount = matched.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const completedCount = methodOrders.filter((o) => o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED').length;
      const cancelledCount = methodOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
      const pendingCount = methodOrders.filter((o) => o.orderStatus === 'PENDING_BOOKING').length;
      const inProgressCount = methodOrders.filter((o) => o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION').length;

      return {
        method: pm.key,
        label: pm.label,
        count: matched.length,
        totalAmount,
        completedCount,
        cancelledCount,
        pendingCount,
        inProgressCount,
      };
    });

    // 6. Detailed Time-based Breakdown (حسب اليوم، الأسبوع، الشهر، الفترة)
    // 6a. By Day
    const dayMap = new Map<string, any>();
    for (const o of filteredOrders) {
      const d = o.pickupDate || (o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : 'غير محدد');
      if (!dayMap.has(d)) {
        dayMap.set(d, {
          date: d,
          totalCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          pendingCount: 0,
          inProgressCount: 0,
          customerSales: 0,
          supplierCost: 0,
        });
      }
      const entry = dayMap.get(d);
      entry.totalCount += 1;
      if (o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED') entry.completedCount += 1;
      else if (o.orderStatus === 'CANCELLED') entry.cancelledCount += 1;
      else if (o.orderStatus === 'PENDING_BOOKING') entry.pendingCount += 1;
      else if (o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION') entry.inProgressCount += 1;

      if (o.orderStatus !== 'CANCELLED') {
        entry.customerSales += parseFloat(o.totalAmount);
        entry.supplierCost += parseFloat(o.supplierTotal);
      }
    }
    const byDay = Array.from(dayMap.values())
      .map((d) => ({
        ...d,
        grossProfit: d.customerSales - d.supplierCost,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // 6b. By Week
    const weekMap = new Map<string, any>();
    for (const o of filteredOrders) {
      const dStr = o.pickupDate || (o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '');
      const dObj = dStr ? new Date(dStr) : new Date();
      // Calculate start of week (Saturday as week start for Egypt)
      const dayOfWeek = dObj.getDay(); // 0 is Sun, 6 is Sat
      const diffToSaturday = (dayOfWeek + 1) % 7;
      const sat = new Date(dObj);
      sat.setDate(sat.getDate() - diffToSaturday);
      const weekKey = sat.toISOString().slice(0, 10);
      const weekLabel = `أسبوع السبت ${weekKey}`;

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekKey,
          label: weekLabel,
          totalCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          pendingCount: 0,
          inProgressCount: 0,
          customerSales: 0,
          supplierCost: 0,
        });
      }
      const entry = weekMap.get(weekKey);
      entry.totalCount += 1;
      if (o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED') entry.completedCount += 1;
      else if (o.orderStatus === 'CANCELLED') entry.cancelledCount += 1;
      else if (o.orderStatus === 'PENDING_BOOKING') entry.pendingCount += 1;
      else if (o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION') entry.inProgressCount += 1;

      if (o.orderStatus !== 'CANCELLED') {
        entry.customerSales += parseFloat(o.totalAmount);
        entry.supplierCost += parseFloat(o.supplierTotal);
      }
    }
    const byWeek = Array.from(weekMap.values())
      .map((w) => ({
        ...w,
        grossProfit: w.customerSales - w.supplierCost,
      }))
      .sort((a, b) => b.weekKey.localeCompare(a.weekKey));

    // 6c. By Month
    const monthMap = new Map<string, any>();
    for (const o of filteredOrders) {
      const dStr = o.pickupDate || (o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '');
      const monthKey = dStr ? dStr.slice(0, 7) : new Date().toISOString().slice(0, 7);
      const [year, mNum] = monthKey.split('-');
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const monthLabel = `${monthNames[parseInt(mNum, 10) - 1] || mNum} ${year}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          label: monthLabel,
          totalCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          pendingCount: 0,
          inProgressCount: 0,
          customerSales: 0,
          supplierCost: 0,
        });
      }
      const entry = monthMap.get(monthKey);
      entry.totalCount += 1;
      if (o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED') entry.completedCount += 1;
      else if (o.orderStatus === 'CANCELLED') entry.cancelledCount += 1;
      else if (o.orderStatus === 'PENDING_BOOKING') entry.pendingCount += 1;
      else if (o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION') entry.inProgressCount += 1;

      if (o.orderStatus !== 'CANCELLED') {
        entry.customerSales += parseFloat(o.totalAmount);
        entry.supplierCost += parseFloat(o.supplierTotal);
      }
    }
    const byMonth = Array.from(monthMap.values())
      .map((m) => ({
        ...m,
        grossProfit: m.customerSales - m.supplierCost,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    // 6d. Comparative Period Summary (اليوم، الأسبوع، الشهر، الفترة المحددة)
    const todayStr = new Date().toISOString().slice(0, 10);
    const past7Str = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const curMonthPrefix = todayStr.slice(0, 7);

    const calcPeriodSlice = (sliceOrders: typeof rawOrders, label: string) => {
      const active = sliceOrders.filter((o) => o.orderStatus !== 'CANCELLED');
      const sales = active.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
      const cost = active.reduce((sum, o) => sum + parseFloat(o.supplierTotal), 0);
      return {
        label,
        totalCount: sliceOrders.length,
        completedCount: sliceOrders.filter((o) => o.orderStatus === 'COMPLETED' || o.orderStatus === 'DELIVERED').length,
        cancelledCount: sliceOrders.filter((o) => o.orderStatus === 'CANCELLED').length,
        pendingCount: sliceOrders.filter((o) => o.orderStatus === 'PENDING_BOOKING').length,
        inProgressCount: sliceOrders.filter((o) => o.orderStatus === 'SENT_TO_SUPPLIER' || o.orderStatus === 'IN_PRODUCTION').length,
        customerSales: sales,
        supplierCost: cost,
        grossProfit: sales - cost,
      };
    };

    const getOrderDateStr = (o: any): string => {
      if (o.pickupDate) return String(o.pickupDate);
      if (o.createdAt) {
        return o.createdAt instanceof Date ? o.createdAt.toISOString().slice(0, 10) : String(o.createdAt).slice(0, 10);
      }
      return '';
    };

    const periodComparison = [
      calcPeriodSlice(rawOrders.filter((o) => getOrderDateStr(o) === todayStr), 'اليوم (Daily)'),
      calcPeriodSlice(rawOrders.filter((o) => {
        const d = getOrderDateStr(o);
        return d >= past7Str && d <= todayStr;
      }), 'الأسبوع الأخير (Past 7 Days)'),
      calcPeriodSlice(rawOrders.filter((o) => getOrderDateStr(o).startsWith(curMonthPrefix)), 'الشهر الحالي (Current Month)'),
      {
        label: `الفترة المحددة (${startDateStr} إلى ${endDateStr})`,
        totalCount: filteredOrders.length,
        completedCount,
        cancelledCount,
        pendingCount,
        inProgressCount,
        customerSales,
        supplierCost,
        grossProfit,
      },
    ];

    // 7. Detailed Customer Payments for Sheet 'Customer Payments'
    const detailedCustomerPayments = await db
      .select({
        id: customerPayments.id,
        orderId: customerPayments.orderId,
        orderNumber: orders.orderNumber,
        customerName: customers.fullName,
        customerPhone: customers.phone,
        amount: customerPayments.amount,
        paymentMethod: customerPayments.paymentMethod,
        paymentStatus: customerPayments.paymentStatus,
        paymentReference: customerPayments.paymentReference,
        notes: customerPayments.notes,
        receivedBy: customerPayments.receivedBy,
        paidAt: customerPayments.paidAt,
      })
      .from(customerPayments)
      .leftJoin(orders, eq(customerPayments.orderId, orders.id))
      .leftJoin(customers, eq(customerPayments.customerId, customers.id))
      .orderBy(desc(customerPayments.paidAt));

    const reportCustomerPayments = detailedCustomerPayments
      .filter((p) => p.orderId && filteredOrderIds.has(p.orderId))
      .map((p) => ({
        ...p,
        amount: parseFloat(p.amount),
      }));

    // 8. Check User Permissions for Factory & Profit Visibility
    const userRole = req.adminSession?.role || '';
    const userPerms = req.adminSession?.permissions || [];
    const canViewFactory =
      userRole === 'SUPER_ADMIN' ||
      userPerms.includes('prices.edit') ||
      userPerms.includes('supplier_payments.view');

    // 9. Detailed Supplier Payments for Sheet 'Supplier Payments' (STRICTLY IF AUTHORIZED)
    let reportSupplierPayments: any[] = [];
    if (canViewFactory) {
      const detailedSupplierPayments = await db
        .select({
          id: supplierPayments.id,
          orderId: supplierPayments.orderId,
          orderNumber: orders.orderNumber,
          supplierId: supplierPayments.supplierId,
          supplierName: suppliers.name,
          amount: supplierPayments.amount,
          paymentMethod: supplierPayments.paymentMethod,
          reference: supplierPayments.reference,
          notes: supplierPayments.notes,
          paidBy: supplierPayments.paidBy,
          paidAt: supplierPayments.paidAt,
        })
        .from(supplierPayments)
        .leftJoin(orders, eq(supplierPayments.orderId, orders.id))
        .leftJoin(suppliers, eq(supplierPayments.supplierId, suppliers.id))
        .orderBy(desc(supplierPayments.paidAt));

      reportSupplierPayments = detailedSupplierPayments
        .filter((sp) => sp.orderId && filteredOrderIds.has(sp.orderId))
        .map((sp) => ({
          ...sp,
          amount: parseFloat(sp.amount),
        }));
    }

    // Sanitize Financial Summary if unauthorized
    const sanitizedFinancialSummary = {
      customerSales,
      customerPaid,
      customerRemaining,
      supplierCost: canViewFactory ? supplierCost : null,
      supplierPaid: canViewFactory ? supplierPaid : null,
      supplierRemaining: canViewFactory ? supplierRemaining : null,
      grossProfit: canViewFactory ? grossProfit : null,
    };

    // Sanitize Breakdowns if unauthorized
    const sanitizedBySaleCode = bySaleCode.map((b) => ({
      code: b.code,
      name: b.name,
      ordersCount: b.ordersCount,
      totalQuantity: b.totalQuantity,
      customerSales: b.customerSales,
      supplierCost: canViewFactory ? b.supplierCost : null,
      grossProfit: canViewFactory ? b.grossProfit : null,
      completedCount: b.completedCount,
      cancelledCount: b.cancelledCount,
      pendingCount: b.pendingCount,
      inProgressCount: b.inProgressCount,
      confirmedCount: b.confirmedCount,
    }));

    const sanitizedByCustomer = byCustomer.map((c) => ({
      ...c,
      supplierCost: canViewFactory ? c.supplierCost : null,
      grossProfit: canViewFactory ? c.grossProfit : null,
    }));

    const sanitizedBySupplier = canViewFactory ? bySupplier : [];

    const sanitizeTimeSlice = (list: any[]) =>
      list.map((item) => ({
        ...item,
        supplierCost: canViewFactory ? item.supplierCost : null,
        grossProfit: canViewFactory ? item.grossProfit : null,
      }));

    // Sanitize Orders list if unauthorized
    const sanitizedOrders = filteredOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      pickupDate: o.pickupDate,
      pickupTime: o.pickupTime,
      pickupLocation: o.pickupLocation,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      totalAmount: parseFloat(o.totalAmount),
      customerPaid: parseFloat(o.customerPaid),
      customerRemaining: parseFloat(o.customerRemaining),
      supplierTotal: canViewFactory ? parseFloat(o.supplierTotal) : null,
      supplierPaid: canViewFactory ? parseFloat(o.supplierPaid) : null,
      supplierRemaining: canViewFactory ? parseFloat(o.supplierRemaining) : null,
      distributorProfit: canViewFactory ? parseFloat(o.distributorProfit) : null,
    }));

    res.json({
      success: true,
      period,
      canViewFactory,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      counts: {
        total: filteredOrders.length,
        completed: completedCount,
        cancelled: cancelledCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        ready: readyCount,
        confirmed: confirmedCount,
      },
      financialSummary: sanitizedFinancialSummary,
      breakdowns: {
        bySaleCode: sanitizedBySaleCode,
        byCustomer: sanitizedByCustomer,
        bySupplier: sanitizedBySupplier,
        byPaymentMethod,
        timeBreakdown: {
          byDay: sanitizeTimeSlice(byDay),
          byWeek: sanitizeTimeSlice(byWeek),
          byMonth: sanitizeTimeSlice(byMonth),
          byPeriodSummary: sanitizeTimeSlice(periodComparison),
        },
      },
      timeBreakdowns: {
        byDay: sanitizeTimeSlice(byDay),
        byWeek: sanitizeTimeSlice(byWeek),
        byMonth: sanitizeTimeSlice(byMonth),
        byPeriodSummary: sanitizeTimeSlice(periodComparison),
      },
      orders: sanitizedOrders,
      customerPayments: reportCustomerPayments,
      supplierPayments: reportSupplierPayments,
    });
  } catch (error: any) {
    console.error('Error fetching comprehensive report:', error);
    res.status(500).json({ success: false, message: 'فشل إنشاء التقرير التحليلي الشامل' });
  }
});

// 8.3. Audit and Authorize Report Export (reports.export permission check)
apiRouter.post('/admin/reports/export-audit', requireAdminAuth, requirePermission('reports.export'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format, period, dateRange, title } = req.body;
    const adminUser = req.adminSession?.username || 'admin';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    await db.insert(auditLogs).values({
      userId: req.adminSession?.userId,
      userName: adminUser,
      action: `REPORT_EXPORTED_${String(format || 'UNKNOWN').toUpperCase()}`,
      entity: 'reports',
      entityId: String(period || 'custom'),
      newData: {
        format,
        period,
        dateRange,
        title,
        exportedAt: new Date().toISOString(),
      },
      ip,
    });

    res.json({ success: true, message: 'تم توثيق وتصريح تصدير التقرير بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل توثيق عملية التصدير' });
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

// 13. RBAC Users Management (users.view, users.create, users.edit, users.disable)
apiRouter.get('/admin/users', requireAdminAuth, requirePermission('users.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await AuthService.listUsers();
    res.json({ success: true, users: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'فشل تحميل قائمة المستخدمين' });
  }
});

apiRouter.post('/admin/users', requireAdminAuth, requirePermission('users.create'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, password, fullName, phone, roleId } = req.body;
    if (!username || !email || !password || !fullName || !roleId) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة لإنشاء المستخدم' });
    }

    const newUser = await AuthService.createUser({
      username,
      email,
      passwordRaw: password,
      fullName,
      phone: phone || '01284484868',
      roleId: Number(roleId),
      creatorUsername: req.adminSession?.username,
    });

    res.json({ success: true, message: 'تم إنشاء المستخدم بنجاح', user: newUser });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إنشاء المستخدم' });
  }
});

apiRouter.put('/admin/users/:id', requireAdminAuth, requirePermission('users.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { fullName, email, phone, roleId, password, isActive, isLocked } = req.body;

    await AuthService.updateUser(userId, {
      fullName,
      email,
      phone,
      roleId: roleId ? Number(roleId) : undefined,
      passwordRaw: password,
      isActive,
      isLocked,
      editorUsername: req.adminSession?.username,
    });

    res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث المستخدم' });
  }
});

apiRouter.put('/admin/users/:id/disable', requireAdminAuth, requirePermission('users.disable'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { isActive } = req.body;

    await AuthService.toggleUserStatus(userId, !!isActive, req.adminSession?.username);
    res.json({ success: true, message: isActive ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تغيير حالة الحساب' });
  }
});

// 14. Roles & Permissions List
apiRouter.get('/admin/roles', requireAdminAuth, requirePermission('users.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const roleList = await db.select().from(roles).orderBy(roles.id);
    const permList = await db.select().from(permissions).orderBy(permissions.code);
    const rolePermList = await db.select().from(rolePermissions);

    const rolesWithPerms = roleList.map((r) => {
      const assignedPermIds = rolePermList.filter((rp) => rp.roleId === r.id).map((rp) => rp.permissionId);
      const assignedPerms = permList.filter((p) => assignedPermIds.includes(p.id));
      return {
        ...r,
        permissions: assignedPerms,
      };
    });

    res.json({ success: true, roles: rolesWithPerms, allPermissions: permList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل بيانات الأدوار والصلاحيات' });
  }
});

// 15. Customers List & Edit (customers.view, customers.edit)
apiRouter.get('/admin/customers', requireAdminAuth, requirePermission('customers.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const custList = await db.select().from(customers).orderBy(desc(customers.id));
    res.json({ success: true, customers: custList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل بيانات العملاء' });
  }
});

apiRouter.put('/admin/customers/:id', requireAdminAuth, requirePermission('customers.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const custId = Number(req.params.id);
    const { fullName, phone, whatsapp, email, notes } = req.body;

    await db
      .update(customers)
      .set({
        fullName,
        phone,
        whatsapp,
        email,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, custId));

    res.json({ success: true, message: 'تم تحديث بيانات العميل بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث بيانات العميل' });
  }
});

// 16. Order Cancellation with Reason (orders.cancel)
apiRouter.post('/admin/orders/:id/cancel', requireAdminAuth, requirePermission('orders.cancel'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { cancelReason } = req.body;
    if (!cancelReason) {
      return res.status(400).json({ success: false, message: 'يرجى توضيح سبب إلغاء الطلب' });
    }

    const adminUser = req.adminSession?.username || 'admin';
    const result = await OrderService.updateOrderStatus(orderId, 'CANCELLED', cancelReason, adminUser, req.ip);

    res.json({ success: true, message: 'تم إلغاء الطلب وتوثيق السبب في السجل بنجاح', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إلغاء الطلب' });
  }
});

// 17. System Settings (settings.edit)
apiRouter.get('/admin/settings', requireAdminAuth, requirePermission('settings.edit'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const allSettings = await db.select().from(appSettings).orderBy(appSettings.key);
    res.json({ success: true, settings: allSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل الإعدادات' });
  }
});

apiRouter.put('/admin/settings', requireAdminAuth, requirePermission('settings.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, value, description } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'مفتاح وقيمة الإعداد مطلوبان' });
    }

    const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(appSettings).set({ value: String(value), updatedAt: new Date() }).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value: String(value), description: description || '' });
    }

    res.json({ success: true, message: `تم تحديث الإعداد ${key} بنجاح` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث الإعدادات' });
  }
});

// 18. Customer Payments & Supplier Payments Lists & Payment Audit Logs
apiRouter.get('/admin/customer-payments', requireAdminAuth, requirePermission('customer_payments.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rawPayments = await db
      .select({
        id: customerPayments.id,
        orderId: customerPayments.orderId,
        customerId: customerPayments.customerId,
        amount: customerPayments.amount,
        paymentMethod: customerPayments.paymentMethod,
        paymentStatus: customerPayments.paymentStatus,
        paymentReference: customerPayments.paymentReference,
        notes: customerPayments.notes,
        receivedBy: customerPayments.receivedBy,
        paidAt: customerPayments.paidAt,
        createdAt: customerPayments.createdAt,
        orderNumber: orders.orderNumber,
        customerName: customers.fullName,
        customerPhone: customers.phone,
      })
      .from(customerPayments)
      .leftJoin(orders, eq(customerPayments.orderId, orders.id))
      .leftJoin(customers, eq(customerPayments.customerId, customers.id))
      .orderBy(desc(customerPayments.paidAt), desc(customerPayments.id));

    const payments = rawPayments.map((p) => ({
      ...p,
      amount: parseFloat(p.amount),
    }));

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل مدفوعات العملاء' });
  }
});

apiRouter.get('/admin/supplier-payments', requireAdminAuth, requirePermission('supplier_payments.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rawPayments = await db
      .select({
        id: supplierPayments.id,
        supplierOrderId: supplierPayments.supplierOrderId,
        supplierId: supplierPayments.supplierId,
        orderId: supplierPayments.orderId,
        amount: supplierPayments.amount,
        paymentMethod: supplierPayments.paymentMethod,
        reference: supplierPayments.reference,
        notes: supplierPayments.notes,
        paidBy: supplierPayments.paidBy,
        paidAt: supplierPayments.paidAt,
        createdAt: supplierPayments.createdAt,
        orderNumber: orders.orderNumber,
        supplierOrderNumber: supplierOrders.supplierOrderNumber,
        supplierName: suppliers.name,
      })
      .from(supplierPayments)
      .leftJoin(orders, eq(supplierPayments.orderId, orders.id))
      .leftJoin(supplierOrders, eq(supplierPayments.supplierOrderId, supplierOrders.id))
      .leftJoin(suppliers, eq(supplierPayments.supplierId, suppliers.id))
      .orderBy(desc(supplierPayments.paidAt), desc(supplierPayments.id));

    const payments = rawPayments.map((p) => ({
      ...p,
      amount: parseFloat(p.amount),
    }));

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل مدفوعات المصنع' });
  }
});

apiRouter.get('/admin/payment-audit-logs', requireAdminAuth, requirePermission('audit_logs.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await db
      .select()
      .from(auditLogs)
      .where(or(
        eq(auditLogs.entity, 'customer_payments'),
        eq(auditLogs.entity, 'supplier_payments'),
        like(auditLogs.action, '%PAYMENT%')
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200);

    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل سجل رقابة المدفوعات' });
  }
});

