import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';
import { OrderService } from '../services/orderService.ts';
import { AuthService, type AdminSession } from '../services/authService.ts';
import { WhatsAppService } from '../services/whatsappService.ts';
import { OFFICIAL_18_MENU_ITEMS } from '../data/fallbackMenu.ts';
import { AccountingService } from '../services/accountingService.ts';
import { MessengerService } from '../services/messengerService.ts';

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

// Cache in-memory for fast delivery & resilient fallback during high traffic or DB restarts
let cachedPublicMenu: any[] | null = null;
let lastMenuFetchTime = 0;
const MENU_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export const invalidatePublicMenuCache = () => {
  cachedPublicMenu = null;
  lastMenuFetchTime = 0;
};

// 1. Public Menu: The 18 Catering packages with items (strictly omits supplier_price)
apiRouter.get('/public/menu', async (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedPublicMenu && cachedPublicMenu.length > 0 && now - lastMenuFetchTime < MENU_CACHE_TTL_MS) {
    return res.json({ success: true, menu: cachedPublicMenu, source: 'cache' });
  }

  try {
    const items = await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        distributorPrice: true,
        sortOrder: true,
        components: {
          orderBy: { sortOrder: 'asc' },
          select: {
            componentName: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    if (items && items.length > 0) {
      const itemsWithComponents = items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        distributorPrice: Number(item.distributorPrice),
        sortOrder: item.sortOrder,
        components: item.components.map((c) => ({
          name: c.componentName,
          quantity: Number(c.quantity),
          unit: c.unit,
        })),
      }));

      cachedPublicMenu = itemsWithComponents;
      lastMenuFetchTime = now;
      return res.json({ success: true, menu: itemsWithComponents, source: 'database' });
    }
  } catch (error: any) {
    console.warn('Prisma query for public menu encountered an issue, serving resilient fallback menu:', error?.message || error);
  }

  // Graceful resilient fallback if database is cold-starting or pool is busy
  if (cachedPublicMenu && cachedPublicMenu.length > 0) {
    return res.json({ success: true, menu: cachedPublicMenu, source: 'stale_cache' });
  }

  const fallbackItems = OFFICIAL_18_MENU_ITEMS.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    distributorPrice: Number(item.distributorPrice),
    sortOrder: item.sortOrder,
    components: item.components.map((c: any) => ({
      name: c.name || c.componentName,
      quantity: Number(c.quantity),
      unit: c.unit,
    })),
  }));

  return res.json({ success: true, menu: fallbackItems, source: 'official_fallback' });
});

// 2. Public Settings: Drink rules & contact info
apiRouter.get('/public/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.appSetting.findMany();
    const config: Record<string, string> = {};
    for (const s of settings) {
      config[s.key] = s.value;
    }
    return res.json({
      success: true,
      settings: {
        juiceExclusionDiscount: parseFloat(config['juice_exclusion_discount'] || config['REMOVE_JUICE'] || '5'),
        pepsiReplacementMarkup: parseFloat(config['pepsi_replacement_markup'] || config['REPLACE_JUICE_WITH_PEPSI'] || '10'),
        minOrderQuantity: parseInt(config['min_order_quantity'] || '50', 10),
        officialWhatsappAdmin: config['official_whatsapp_admin'] || '01284484868',
      },
    });
  } catch (error: any) {
    console.warn('Error fetching public settings, using robust defaults:', error?.message || error);
    return res.json({
      success: true,
      settings: {
        juiceExclusionDiscount: 5,
        pepsiReplacementMarkup: 10,
        minOrderQuantity: 50,
        officialWhatsappAdmin: '01284484868',
      },
      source: 'fallback',
    });
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
      items,
      pickupDate,
      pickupTime,
      pickupLocation,
      notes,
      drinkOption,
      venueType,
      occasion,
      arrivalInstructions,
    } = req.body;

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await OrderService.createPreliminaryBooking({
      customerName,
      phone,
      whatsapp,
      menuCode,
      quantity: quantity ? Number(quantity) : undefined,
      items: Array.isArray(items) && items.length > 0 ? items : undefined,
      pickupDate,
      pickupTime,
      pickupLocation,
      notes,
      drinkOption: drinkOption || 'included',
      venueType,
      occasion,
      arrivalInstructions,
      skipSupplierOrderCreation: true, // Public booking does NOT auto-create factory order until admin review
      ip,
      userAgent,
    });

    const totalQuantity = (result.items && result.items.length > 0)
      ? result.items.reduce((s: number, i: any) => s + i.quantity, 0)
      : (Number(quantity) || 0);

    const itemsSummary = (result.items && result.items.length > 0)
      ? result.items.map((it: any) => `• ${it.menuName} (${it.menuCode}): ${it.quantity} وجبة`).join('\n')
      : `• ${result.menuItem?.name || ''} (${result.menuItem?.code || ''}): ${totalQuantity} وجبة`;

    const msgPayload = {
      orderNumber: result.order.orderNumber,
      customerName: result.customerName,
      customerPhone: result.phone,
      menuCode: result.menuItem?.code || '',
      menuName: result.menuItem?.name || '',
      quantity: totalQuantity,
      pickupDate,
      pickupTime,
      pickupLocation: result.order.pickupLocation,
      notes: result.order.customerNotes || notes,
      modifications: result.optionName,
      customerTotal: result.customerTotal,
      customerPaid: 0,
      customerRemaining: result.customerTotal,
      orderStatus: 'حجز مبدئي - بدون دفع',
    };

    const customerMessage = WhatsAppService.generateCustomerBookingMessage(msgPayload);
    const adminAlertMessage = WhatsAppService.generateAdminNewBookingAlert(msgPayload);

    // Deep link for client to contact official admin via WhatsApp
    const adminPhone = '01284484868';
    const clientIntroText = `السلام عليكم ورحمة الله، قمت بعمل حجز مبدئي عبر الموقع لكاترنج سيليبر:
📋 رقم الحجز: ${result.order.orderNumber}
👤 اسم العميل: ${result.customerName}
🍱 تفاصيل الوجبات:
${itemsSummary}
📦 إجمالي الوجبات: ${totalQuantity} وجبة
📅 موعد الاستلام: ${pickupDate} (${pickupTime})
📍 مكان الاستلام: ${result.order.pickupLocation}
💰 إجمالي التكلفة التقديرية: ${result.customerTotal} ج.م

أرجو مراجعة وتأكيد الحجز والتنسيق بخصوص الموعد وطريقة الدفع.`;

    const whatsappLink = WhatsAppService.createDeepLink(adminPhone, clientIntroText);

    res.json({
      success: true,
      message: 'تم استلام طلب الحجز المبدئي وسيتم التواصل معك عبر واتساب لتأكيد الحجز وتفاصيل الدفع.',
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        customerName: result.customerName,
        phone: result.phone,
        menuCode: result.menuItem?.code,
        menuName: result.menuItem?.name,
        quantity: totalQuantity,
        items: result.items,
        pickupDate,
        pickupTime,
        pickupLocation: result.order.pickupLocation,
        customerTotal: result.customerTotal,
        customerPaid: 0,
        customerRemaining: result.customerTotal,
        orderStatus: result.order.orderStatus,
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

// 3b. Facebook Messenger Integration Endpoints
apiRouter.get('/public/messenger-config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    config: MessengerService.getConfig(),
  });
});

apiRouter.get('/messenger/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  const result = MessengerService.verifyWebhookChallenge(mode, token, challenge);
  if (result.isValid && result.challenge) {
    return res.status(200).send(result.challenge);
  }
  return res.status(403).json({ success: false, message: 'فشل التحقق من Webhook Token لماسنجر' });
});

apiRouter.post('/messenger/webhook', async (req: Request, res: Response) => {
  const signatureHeader = (req.headers['x-hub-signature-256'] || req.headers['x-hub-signature']) as string | undefined;
  const rawBody = (req as any).rawBody || req.body;

  const sigCheck = MessengerService.verifySignature(rawBody, signatureHeader);
  if (!sigCheck.isValid) {
    return res.status(403).json({
      success: false,
      message: 'فشل التحقق الأمني من توقيع Webhook (Signature Mismatch)',
      reason: sigCheck.reason,
    });
  }

  const result = await MessengerService.handleWebhookEvent(req.body);
  return res.status(200).json({
    success: true,
    status: 'EVENT_RECEIVED',
    ...result,
  });
});

apiRouter.get('/admin/messenger-settings', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    settings: MessengerService.getConfig(),
    guide: MessengerService.getMetaSetupGuide(),
  });
});

/* ==========================================================================
   ADMIN AUTH APIS (Username + Password + WhatsApp 2FA OTP)
   ========================================================================== */

// Admin Login Step 1: Check Username + Password -> Trigger WhatsApp OTP
apiRouter.post(['/admin/auth/login', '/admin/login'], async (req: Request, res: Response) => {
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
      whatsappLink: otpResult.whatsappLink,
      whatsappUrl: otpResult.whatsappLink,
      message: `تم التحقق من بيانات الدخول بنجاح. تم إصدار رمز التحقق الثنائي (OTP) إلى هاتف الإدارة المسجل (${user.phone}). الرمز صالح لمدة 5 دقائق للاستخدام لمرة واحدة.`,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'بيانات الدخول غير صحيحة' });
  }
});

// Admin Login Step 2: Verify OTP -> Receive Session Token
apiRouter.post('/admin/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'رمز OTP مطلوب' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'معرف المستخدم (userId) مطلوب لإتمام التحقق الثنائي' });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const session = await AuthService.verifyOtpAndCreateSession(Number(userId), String(otp), ip);

    // Set secure HttpOnly SameSite cookie for production session protection
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('admin_session', session.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
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

// Admin Login: Resend OTP (with 60s cooldown & rate limiting)
apiRouter.post('/admin/auth/resend-otp', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'معرف المستخدم (userId) مطلوب لإعادة إرسال رمز التحقق' });
    }

    const user = await prisma.adminUser.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'حساب المستخدم غير موجود' });
    }
    if (user.isLocked) {
      return res.status(403).json({ success: false, message: 'تم قفل الحساب لتجاوز المحاولات الخاطئة. يرجى مراجعة الإدارة العليا.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'هذا الحساب موقوف حالياً.' });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const otpResult = await AuthService.generateAndDispatchOtp(user.id, user.phone, ip);

    res.json({
      success: true,
      phone: user.phone,
      whatsappLink: otpResult.whatsappLink,
      expiresIn: 300,
      message: `تم إعادة إصدار رمز التحقق الثنائي (OTP) إلى هاتف الإدارة المسجل (${user.phone}). الرمز صالح لمدة 5 دقائق.`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل إعادة إرسال رمز التحقق' });
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

// Admin Auth Status
apiRouter.get('/admin/auth/status', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || (req.headers['x-admin-token'] as string);
  let token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) : '';
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.split(';').find((c) => c.trim().startsWith('admin_session='));
    if (match) token = match.split('=')[1]?.trim();
  }
  const session = token ? AuthService.getSession(token) : null;
  res.json({
    success: true,
    isConfigured: true,
    isAuthenticated: Boolean(session),
    adminName: session?.fullName || 'إدارة كاترنج سيلبر المركزية',
    registeredPhone: session?.phone || '01284484868',
    role: session?.role || 'admin',
    securityLevel: 'ENCRYPTED_ENTERPRISE_RBAC',
  });
});

// Admin Change Password (Protected by requireAdminAuth)
apiRouter.post('/admin/auth/change-password', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!req.adminSession?.userId) {
      return res.status(401).json({ success: false, message: 'جلسة الأدمن غير صالحة' });
    }

    const result = await AuthService.changePassword(
      req.adminSession.userId,
      currentPassword,
      newPassword,
      confirmPassword !== undefined ? confirmPassword : newPassword,
      ip,
      userAgent
    );

    // Update session cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('admin_session', result.newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: result.message,
      token: result.newToken,
      session: result.session,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تغيير كلمة المرور' });
  }
});

/* ==========================================================================
   ADMIN ORDERS MANAGEMENT APIS
   ========================================================================== */

// 2. Orders List with search, status filter, sort, pagination
apiRouter.get('/admin/orders', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, sort_by = 'created_at', sort_order = 'desc', limit = 100, offset = 0 } = req.query;

    const allOrders = await prisma.order.findMany({
      orderBy: { id: 'desc' },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
            whatsapp: true,
          },
        },
        items: {
          select: {
            id: true,
            orderId: true,
            menuCode: true,
            menuName: true,
            quantity: true,
            supplierUnitPrice: true,
            distributorUnitPrice: true,
          },
        },
      },
    });

    let filtered = allOrders.map((o) => {
      const firstItem = o.items[0];
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: o.customer?.fullName || '',
        customerPhone: o.customer?.phone || '',
        customerWhatsapp: o.customer?.whatsapp || null,
        orderStatus: o.orderStatus,
        cancelReason: o.cancelReason,
        pickupDate: o.pickupDate,
        pickupTime: o.pickupTime,
        pickupLocation: o.pickupLocation,
        customerNotes: o.customerNotes,
        totalAmount: Number(o.totalAmount),
        customerPaid: Number(o.customerPaid),
        customerRemaining: Number(o.customerRemaining),
        supplierTotal: Number(o.supplierTotal),
        supplierPaid: Number(o.supplierPaid),
        supplierRemaining: Number(o.supplierRemaining),
        distributorProfit: Number(o.distributorProfit),
        createdAt: o.createdAt,
        menuCode: firstItem?.menuCode || 'Sale',
        menuName: firstItem?.menuName || 'عرض كاترنج',
        quantity: firstItem?.quantity || 100,
        supplierUnitPrice: firstItem ? Number(firstItem.supplierUnitPrice) : 0,
        distributorUnitPrice: firstItem ? Number(firstItem.distributorUnitPrice) : 0,
      };
    });

    if (status && status !== 'ALL' && status !== 'all') {
      filtered = filtered.filter((o) => o.orderStatus === status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      const qNumeric = q.replace(/^#/, '');
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          String(o.id) === q ||
          String(o.id) === qNumeric ||
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

/**
 * Safely resolves an order by either numeric record ID or string orderNumber
 */
export async function resolveOrderRecord(idOrNumber: string | number) {
  const str = String(idOrNumber || '').trim();
  if (!str) return null;
  const isPureInt = /^\d+$/.test(str);
  const upperStr = str.toUpperCase();

  if (isPureInt) {
    const numId = parseInt(str, 10);
    return await prisma.order.findFirst({
      where: {
        OR: [
          { id: numId },
          { orderNumber: str },
          { orderNumber: upperStr },
        ],
      },
    });
  }

  return await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: str },
        { orderNumber: upperStr },
      ],
    },
  });
}

// 3. Single Order Details (Divided visually into Customer, Celebre, Factory, Payments, Audit)
apiRouter.get('/admin/orders/:id', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const param = (req.params.id || '').trim();
    if (!param) return res.status(400).json({ success: false, message: 'معرّف أو رقم الطلب مطلوب' });

    const order = await resolveOrderRecord(param);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    const orderId = order.id;
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            options: true,
          },
        },
        supplierOrders: true,
        customerPayments: {
          orderBy: { paidAt: 'desc' },
        },
        supplierPayments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!fullOrder) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    const customer = fullOrder.customer;
    const items = fullOrder.items;
    const options = items.length ? items[0].options : [];
    const supOrders = fullOrder.supplierOrders;
    const cPayments = fullOrder.customerPayments;
    const sPayments = fullOrder.supplierPayments;

    const cPaymentIds = cPayments.map((p) => String(p.id));
    const sPaymentIds = sPayments.map((p) => String(p.id));

    const auditOrConditions: Prisma.AuditLogWhereInput[] = [
      { entity: 'orders', entityId: String(orderId) },
    ];
    if (cPaymentIds.length > 0) {
      auditOrConditions.push({ entity: 'customer_payments', entityId: { in: cPaymentIds } });
    }
    if (sPaymentIds.length > 0) {
      auditOrConditions.push({ entity: 'supplier_payments', entityId: { in: sPaymentIds } });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: auditOrConditions,
      },
      orderBy: { createdAt: 'desc' },
    });

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
      customerTotal: Number(order.totalAmount),
      customerPaid: Number(order.customerPaid),
      customerRemaining: Number(order.customerRemaining),
      supplierUnitPrice: firstItem ? Number(firstItem.supplierUnitPrice) : 0,
      supplierTotal: Number(order.supplierTotal),
      supplierPaid: Number(order.supplierPaid),
      supplierRemaining: Number(order.supplierRemaining),
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
        totalAmount: Number(order.totalAmount),
        customerPaid: Number(order.customerPaid),
        customerRemaining: Number(order.customerRemaining),
        customerDepositRequired: Math.round(Number(order.totalAmount) * 0.5 * 100) / 100,
        supplierTotal: Number(order.supplierTotal),
        supplierPaid: Number(order.supplierPaid),
        supplierRemaining: Number(order.supplierRemaining),
        distributorProfit: Number(order.distributorProfit),
      },
      customer,
      items: items.map((it) => ({
        ...it,
        distributorUnitPrice: Number(it.distributorUnitPrice),
        supplierUnitPrice: Number(it.supplierUnitPrice),
        distributorTotal: Number(it.distributorTotal),
        supplierTotal: Number(it.supplierTotal),
        customerTotal: Number(it.customerTotal),
        supplierTotalFinal: Number(it.supplierTotalFinal),
        profit: Number(it.profit),
      })),
      options,
      supplierOrders: supOrders.map((s) => ({
        ...s,
        supplierTotal: Number(s.supplierTotal),
        supplierPaid: Number(s.supplierPaid),
        supplierRemaining: Number(s.supplierRemaining),
      })),
      customerPayments: cPayments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      supplierPayments: sPayments.map((p) => ({
        ...p,
        amount: Number(p.amount),
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
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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

// 4b. Accept Preliminary Booking (AWAITING_CUSTOMER_DEPOSIT)
apiRouter.post(
  '/admin/orders/:id/accept',
  requireAdminAuth,
  requirePermission('orders.edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const order = await resolveOrderRecord(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const updated = await OrderService.acceptPreliminaryBooking(order.id, adminUser, ip);
      res.json({
        success: true,
        message: 'تمت الموافقة المبدئية على الحجز بنجاح، والحالة الآن: بانتظار سداد عربون العميل (50%)',
        order: updated,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل قبول الحجز' });
    }
  }
);

// 4c. Reject Preliminary Booking (REJECTED with reason)
apiRouter.post(
  '/admin/orders/:id/reject',
  requireAdminAuth,
  requirePermission('orders.edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const order = await resolveOrderRecord(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      const { reason } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const updated = await OrderService.rejectPreliminaryBooking(order.id, reason, adminUser, ip);
      res.json({
        success: true,
        message: 'تم رفض الحجز وتوثيق سبب الرفض في السجل بنجاح',
        order: updated,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل رفض الحجز' });
    }
  }
);

// 4d. Create Independent Factory Order (SupplierOrder)
apiRouter.post(
  '/admin/orders/:id/supplier-order',
  requireAdminAuth,
  requirePermission('orders.edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const order = await resolveOrderRecord(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const supOrder = await OrderService.createSupplierOrder(order.id, adminUser, ip);
      res.json({
        success: true,
        message: `تم إنشاء أمر توريد المصنع المستقل بنجاح برقم: ${supOrder.supplierOrderNumber}`,
        supplierOrder: {
          ...supOrder,
          supplierTotal: Number(supOrder.supplierTotal),
          supplierPaid: Number(supOrder.supplierPaid),
          supplierRemaining: Number(supOrder.supplierRemaining),
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل إنشاء طلب المصنع' });
    }
  }
);

// 4e. Update Supplier Order Status
apiRouter.put(
  '/admin/supplier-orders/:id/status',
  requireAdminAuth,
  requirePermission('orders.edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supOrderId = Number(req.params.id);
      const { status, reason } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const updated = await OrderService.updateSupplierOrderStatus(
        supOrderId,
        status,
        reason,
        adminUser,
        ip
      );
      res.json({
        success: true,
        message: 'تم تحديث حالة طلب المصنع وتوثيق الإجراء بنجاح',
        supplierOrder: updated,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'فشل تحديث حالة أمر التوريد' });
    }
  }
);

// 5. Update Order Operational Details
apiRouter.put('/admin/orders/:id/details', requireAdminAuth, requirePermission('orders.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
      const order = await resolveOrderRecord(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      const orderId = order.id;
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
      const order = await resolveOrderRecord(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      const orderId = order.id;
      const history = await prisma.customerPayment.findMany({
        where: { orderId },
        orderBy: { paidAt: 'desc' },
      });

      res.json({
        success: true,
        payments: history.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      });
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
      const order = await resolveOrderRecord(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      const orderId = order.id;
      const { amount, paymentMethod, reference, notes } = req.body;
      const adminUser = req.adminSession?.username || 'admin';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      const supOrder = await prisma.supplierOrder.findFirst({
        where: { orderId },
      });
      if (!supOrder) {
        return res.status(404).json({ success: false, message: 'أمر التوريد الخاص بالمصنع غير موجود' });
      }

      const result = await OrderService.recordSupplierPayment(
        supOrder.id,
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
      const order = await resolveOrderRecord(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      const orderId = order.id;
      const history = await prisma.supplierPayment.findMany({
        where: { orderId },
        orderBy: { paidAt: 'desc' },
      });

      res.json({
        success: true,
        payments: history.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'فشل تحميل سجل دفعات المصنع' });
    }
  }
);

/* =========================================================================
   PHASE 6: COMPREHENSIVE ACCOUNTING & FINANCIAL TRANSACTIONS ENDPOINTS
   ========================================================================= */

// 1. Customer Account Statement
apiRouter.get('/admin/accounting/customer-statement/:id', requireAdminAuth, requirePermission('customer_payments.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statement = await AccountingService.getCustomerAccountStatement(req.params.id);
    res.json({ success: true, statement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحميل كشف حساب العميل' });
  }
});

// 2. Factory Account Statement
apiRouter.get('/admin/accounting/factory-statement/:id', requireAdminAuth, requirePermission('supplier_payments.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statement = await AccountingService.getFactoryAccountStatement(req.params.id);
    res.json({ success: true, statement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحميل كشف حساب المصنع' });
  }
});

// 3. Booking Profitability & Cash Flow Breakdown
apiRouter.get('/admin/accounting/profitability/:id', requireAdminAuth, requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profitability = await AccountingService.getBookingProfitability(req.params.id);
    res.json({ success: true, profitability });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل حساب ربحية الحجز' });
  }
});

// 4. Unified Financial Transactions Ledger
apiRouter.get('/admin/accounting/transactions', requireAdminAuth, requirePermission('customer_payments.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber, entityType, movementType, from_date, to_date } = req.query as any;
    const transactions = await AccountingService.getFinancialTransactionsList({
      orderNumber,
      entityType,
      movementType,
      from_date,
      to_date,
    });
    res.json({ success: true, count: transactions.length, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل سجل الحركات المالية' });
  }
});

// 5. Record Customer Transaction (Collection, Refund, or Correction)
apiRouter.post('/admin/accounting/customer-transaction', requireAdminAuth, requirePermission('customer_payments.create'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, amount, movementType, paymentMethod, referenceNumber, notes, relatedPaymentId, reason } = req.body;
    const adminUsername = req.adminSession?.username || 'admin';
    const result = await AccountingService.recordCustomerTransaction({
      orderId,
      amount: Number(amount),
      movementType: movementType || 'COLLECTION',
      paymentMethod: paymentMethod || 'INSTAPAY',
      referenceNumber,
      notes,
      adminUsername,
      relatedPaymentId: relatedPaymentId ? Number(relatedPaymentId) : undefined,
      reason,
      ip: req.ip,
    });
    res.json({ success: true, message: 'تم تسجيل الحركة المالية للعميل بنجاح', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تسجيل الحركة المالية للعميل' });
  }
});

// 6. Record Factory Transaction (Payout, Refund, or Correction)
apiRouter.post('/admin/accounting/factory-transaction', requireAdminAuth, requirePermission('supplier_payments.create'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, supplierOrderId, amount, movementType, paymentMethod, referenceNumber, notes, relatedPaymentId, reason } = req.body;
    const adminUsername = req.adminSession?.username || 'admin';
    const result = await AccountingService.recordFactoryTransaction({
      orderId,
      supplierOrderId: supplierOrderId ? Number(supplierOrderId) : undefined,
      amount: Number(amount),
      movementType: movementType || 'PAYOUT',
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      referenceNumber,
      notes,
      adminUsername,
      relatedPaymentId: relatedPaymentId ? Number(relatedPaymentId) : undefined,
      reason,
    });
    res.json({ success: true, message: 'تم تسجيل معاملة المصنع المالية بنجاح', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تسجيل معاملة المصنع' });
  }
});

// 7. Record Booking Operational Expense
apiRouter.post('/admin/accounting/expense', requireAdminAuth, requirePermission('orders.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, amount, category, description, receiptRef } = req.body;
    const adminUsername = req.adminSession?.username || 'admin';
    const result = await AccountingService.recordBookingExpense({
      orderId,
      amount: Number(amount),
      category: category || 'مصروف تشغيل',
      description,
      receiptRef,
      adminUsername,
    });
    res.json({ success: true, message: 'تم تسجيل المصروف التشغيلي للحجز بنجاح', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تسجيل المصروف' });
  }
});

// 8. Record Approved Booking Addition / Adjustment
apiRouter.post('/admin/accounting/adjustment', requireAdminAuth, requirePermission('orders.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, additionAmount, reason } = req.body;
    const adminUsername = req.adminSession?.username || 'admin';
    const result = await AccountingService.recordBookingAdjustment({
      orderId,
      additionAmount: Number(additionAmount),
      reason: reason || 'إضافة مالية معتمدة',
      adminUsername,
    });
    res.json({ success: true, message: 'تم تحديث التعديل المالي للحجز وتوثيقه بسجل التدقيق', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تسجيل التعديل المالي' });
  }
});

// 9. Comprehensive Multi-Period Accounting Reports (with Egypt Timezone)
apiRouter.get('/admin/accounting/reports', requireAdminAuth, requirePermission('reports.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, from_date, to_date, orderNumber } = req.query as any;
    const reports = await AccountingService.getAccountingReports({
      period,
      from_date,
      to_date,
      orderNumber,
    });
    res.json({ success: true, reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل استخراج التقارير المحاسبية' });
  }
});

// 8. Financial Report
apiRouter.get('/admin/reports/financial', requireAdminAuth, requirePermission('reports.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'this_month', from_date, to_date } = req.query;

    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        pickupDate: true,
        totalAmount: true,
        customerPaid: true,
        customerRemaining: true,
        supplierTotal: true,
        supplierPaid: true,
        supplierRemaining: true,
        distributorProfit: true,
        orderStatus: true,
        createdAt: true,
      },
    });

    const activeOrders = allOrders.filter((o) => o.orderStatus !== 'CANCELLED');

    const summary = {
      totalSales: activeOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      totalCustomerPaid: activeOrders.reduce((sum, o) => sum + Number(o.customerPaid), 0),
      totalCustomerRemaining: activeOrders.reduce((sum, o) => sum + Number(o.customerRemaining), 0),
      totalSupplierCost: activeOrders.reduce((sum, o) => sum + Number(o.supplierTotal), 0),
      totalSupplierPaid: activeOrders.reduce((sum, o) => sum + Number(o.supplierPaid), 0),
      totalSupplierRemaining: activeOrders.reduce((sum, o) => sum + Number(o.supplierRemaining), 0),
      totalGrossProfit: activeOrders.reduce((sum, o) => sum + Number(o.distributorProfit), 0),
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
    const ordersList = await prisma.order.findMany({
      orderBy: { id: 'desc' },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    const rawOrders = ordersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      orderStatus: o.orderStatus,
      cancelReason: o.cancelReason,
      pickupDate: o.pickupDate,
      pickupTime: o.pickupTime,
      pickupLocation: o.pickupLocation,
      totalAmount: String(o.totalAmount),
      customerPaid: String(o.customerPaid),
      customerRemaining: String(o.customerRemaining),
      supplierTotal: String(o.supplierTotal),
      supplierPaid: String(o.supplierPaid),
      supplierRemaining: String(o.supplierRemaining),
      distributorProfit: String(o.distributorProfit),
      createdAt: o.createdAt,
      customerName: o.customer?.fullName || '',
      customerPhone: o.customer?.phone || '',
    }));

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
        todayOrders: sanitizedTodayOrders,
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
    const compOrdersList = await prisma.order.findMany({
      orderBy: { id: 'desc' },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    const rawOrders = compOrdersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      orderStatus: o.orderStatus,
      cancelReason: o.cancelReason,
      pickupDate: o.pickupDate,
      pickupTime: o.pickupTime,
      pickupLocation: o.pickupLocation,
      totalAmount: String(o.totalAmount),
      customerPaid: String(o.customerPaid),
      customerRemaining: String(o.customerRemaining),
      supplierTotal: String(o.supplierTotal),
      supplierPaid: String(o.supplierPaid),
      supplierRemaining: String(o.supplierRemaining),
      distributorProfit: String(o.distributorProfit),
      createdAt: o.createdAt,
      customerName: o.customer?.fullName || '',
      customerPhone: o.customer?.phone || '',
    }));

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

    const customerSales = activeFiltered.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const customerPaid = activeFiltered.reduce((sum, o) => sum + Number(o.customerPaid), 0);
    const customerRemaining = activeFiltered.reduce((sum, o) => sum + Number(o.customerRemaining), 0);

    const supplierCost = activeFiltered.reduce((sum, o) => sum + Number(o.supplierTotal), 0);
    const supplierPaid = activeFiltered.reduce((sum, o) => sum + Number(o.supplierPaid), 0);
    const supplierRemaining = activeFiltered.reduce((sum, o) => sum + Number(o.supplierRemaining), 0);

    // CRITICAL: Profit is strictly Customer Total - Supplier Total (NOT payments)
    const grossProfit = customerSales - supplierCost;

    // 2. Breakdown by Sale Code
    const allMenuItems = await prisma.menuItem.findMany({ orderBy: { sortOrder: 'asc' } });
    const allOrderItems = await prisma.orderItem.findMany();

    const bySaleCode = allMenuItems.map((m) => {
      const matchedItems = allOrderItems.filter((it) => it.menuItemId === m.id && filteredOrderIds.has(it.orderId));
      const matchedOrderIds = new Set(matchedItems.map((it) => it.orderId));
      const matchedOrders = filteredOrders.filter((o) => matchedOrderIds.has(o.id));

      const activeMatched = matchedItems.filter((it) => {
        const parentOrder = filteredOrders.find((o) => o.id === it.orderId);
        return parentOrder && parentOrder.orderStatus !== 'CANCELLED';
      });

      const totalQuantity = matchedItems.reduce((sum, it) => sum + it.quantity, 0);
      const itemCustomerSales = activeMatched.reduce((sum, it) => sum + Number(it.customerTotal), 0);
      const itemSupplierCost = activeMatched.reduce((sum, it) => sum + Number(it.supplierTotalFinal), 0);
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
    const allSuppliers = await prisma.supplier.findMany();
    const allSupplierOrders = await prisma.supplierOrder.findMany();

    const bySupplier = allSuppliers.map((s) => {
      const supOrdersInPeriod = allSupplierOrders.filter((so) => filteredOrderIds.has(so.orderId) && so.supplierId === s.id);
      const associatedParentOrders = filteredOrders.filter((o) => supOrdersInPeriod.some((so) => so.orderId === o.id));

      const activeSupOrders = supOrdersInPeriod.filter((so) => {
        const parentOrder = filteredOrders.find((o) => o.id === so.orderId);
        return parentOrder && parentOrder.orderStatus !== 'CANCELLED';
      });

      const supplierTotal = activeSupOrders.reduce((sum, so) => sum + Number(so.supplierTotal), 0);
      const supplierPaid = activeSupOrders.reduce((sum, so) => sum + Number(so.supplierPaid), 0);
      const supplierRemaining = activeSupOrders.reduce((sum, so) => sum + Number(so.supplierRemaining), 0);

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
    const allCustomerPayments = await prisma.customerPayment.findMany();
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

      const totalAmount = matched.reduce((sum, p) => sum + Number(p.amount), 0);
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
    const detailedCustomerPayments = await prisma.customerPayment.findMany({
      include: {
        order: { select: { orderNumber: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { paidAt: 'desc' },
    });

    const reportCustomerPayments = detailedCustomerPayments
      .filter((p) => p.orderId && filteredOrderIds.has(p.orderId))
      .map((p) => ({
        id: p.id,
        orderId: p.orderId,
        orderNumber: p.order?.orderNumber || '',
        customerName: p.customer?.fullName || '',
        customerPhone: p.customer?.phone || '',
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        paymentReference: p.paymentReference,
        notes: p.notes,
        receivedBy: p.receivedBy,
        paidAt: p.paidAt,
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
      const detailedSupplierPayments = await prisma.supplierPayment.findMany({
        include: {
          order: { select: { orderNumber: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { paidAt: 'desc' },
      });

      reportSupplierPayments = detailedSupplierPayments
        .filter((sp) => sp.orderId && filteredOrderIds.has(sp.orderId))
        .map((sp) => ({
          id: sp.id,
          orderId: sp.orderId,
          orderNumber: sp.order?.orderNumber || '',
          supplierId: sp.supplierId,
          supplierName: sp.supplier?.name || '',
          amount: Number(sp.amount),
          paymentMethod: sp.paymentMethod,
          reference: sp.reference,
          notes: sp.notes,
          paidBy: sp.paidBy,
          paidAt: sp.paidAt,
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

    await prisma.auditLog.create({
      data: {
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
      },
    });

    res.json({ success: true, message: 'تم توثيق وتصريح تصدير التقرير بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل توثيق عملية التصدير' });
  }
});

// 9. Report by Catering Meal (Sale-01 to Sale-18)
apiRouter.get('/admin/reports/sales-by-item', requireAdminAuth, requirePermission('reports.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const menuList = await prisma.menuItem.findMany({ orderBy: { sortOrder: 'asc' } });
    const items = await prisma.orderItem.findMany();
    const activeOrders = await prisma.order.findMany({
      where: { orderStatus: { not: 'CANCELLED' } },
      select: { id: true },
    });
    const activeOrderIds = new Set(activeOrders.map((o) => o.id));

    const breakdown = menuList.map((m) => {
      const matched = items.filter((it) => it.menuItemId === m.id && activeOrderIds.has(it.orderId));
      const totalUnits = matched.reduce((sum, it) => sum + it.quantity, 0);
      const totalCustomerSales = matched.reduce((sum, it) => sum + parseFloat(String(it.customerTotal)), 0);
      const totalSupplierCost = matched.reduce((sum, it) => sum + parseFloat(String(it.supplierTotalFinal)), 0);
      const totalProfit = matched.reduce((sum, it) => sum + parseFloat(String(it.profit)), 0);

      return {
        code: m.code,
        name: m.name,
        distributorPrice: parseFloat(String(m.distributorPrice)),
        supplierPrice: parseFloat(String(m.supplierPrice)),
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
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل سجل التدقيق' });
  }
});

// 11. Admin Menu Management (View & Update Prices)
apiRouter.get('/admin/menu', requireAdminAuth, requirePermission('menu.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await prisma.menuItem.findMany({ orderBy: { sortOrder: 'asc' } });
    const history = await prisma.menuPriceHistory.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({
      success: true,
      menu: items.map((it) => ({
        ...it,
        distributorPrice: Number(it.distributorPrice),
        supplierPrice: Number(it.supplierPrice),
      })),
      priceHistory: history.map((h) => ({
        ...h,
        distributorPrice: Number(h.distributorPrice),
        supplierPrice: Number(h.supplierPrice),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل قائمة الوجبات للإدارة' });
  }
});

apiRouter.put('/admin/menu/:id/prices', requireAdminAuth, requirePermission('prices.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const { distributorPrice, supplierPrice } = req.body;
    const adminUser = req.adminSession?.username || 'admin';

    const existing = await prisma.menuItem.findUnique({
      where: { id: itemId },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'الوجبة غير موجودة' });

    await prisma.$transaction([
      prisma.menuItem.update({
        where: { id: itemId },
        data: {
          distributorPrice: Number(distributorPrice),
          supplierPrice: Number(supplierPrice),
        },
      }),
      prisma.menuPriceHistory.create({
        data: {
          menuItemId: itemId,
          distributorPrice: Number(distributorPrice),
          supplierPrice: Number(supplierPrice),
          createdBy: adminUser,
        },
      }),
      prisma.auditLog.create({
        data: {
          userName: adminUser,
          action: 'MENU_PRICE_UPDATED',
          entity: 'menu_items',
          entityId: String(itemId),
          oldData: {
            distributorPrice: Number(existing.distributorPrice),
            supplierPrice: Number(existing.supplierPrice),
          },
          newData: { distributorPrice: Number(distributorPrice), supplierPrice: Number(supplierPrice) },
        },
      }),
    ]);

    invalidatePublicMenuCache();

    res.json({ success: true, message: 'تم تحديث السعر وتوثيقه في سجل أسعار المنيو بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث السعر' });
  }
});

// 12. Suppliers List
apiRouter.get('/admin/suppliers', requireAdminAuth, requirePermission('suppliers.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const supList = await prisma.supplier.findMany();
    const supOrders = await prisma.supplierOrder.findMany();

    const suppliersWithTotals = supList.map((s) => {
      const ordersForSup = supOrders.filter((so) => so.supplierId === s.id);
      return {
        ...s,
        totalOrdersCount: ordersForSup.length,
        totalPayable: ordersForSup.reduce((sum, o) => sum + Number(o.supplierTotal), 0),
        totalPaid: ordersForSup.reduce((sum, o) => sum + Number(o.supplierPaid), 0),
        totalRemaining: ordersForSup.reduce((sum, o) => sum + Number(o.supplierRemaining), 0),
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
    const roleList = await prisma.role.findMany({
      orderBy: { id: 'asc' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    const permList = await prisma.permission.findMany({ orderBy: { code: 'asc' } });

    const rolesWithPerms = roleList.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
      permissions: r.permissions.map((rp) => rp.permission),
    }));

    res.json({ success: true, roles: rolesWithPerms, allPermissions: permList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل بيانات الأدوار والصلاحيات' });
  }
});

// 15. Customers List & Edit (customers.view, customers.edit)
apiRouter.get('/admin/customers', requireAdminAuth, requirePermission('customers.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const custList = await prisma.customer.findMany({ orderBy: { id: 'desc' } });
    res.json({ success: true, customers: custList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل بيانات العملاء' });
  }
});

apiRouter.put('/admin/customers/:id', requireAdminAuth, requirePermission('customers.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const custId = Number(req.params.id);
    const { fullName, phone, whatsapp, email, notes } = req.body;

    await prisma.customer.update({
      where: { id: custId },
      data: {
        fullName,
        phone,
        whatsapp,
        email,
        notes,
      },
    });

    res.json({ success: true, message: 'تم تحديث بيانات العميل بنجاح' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث بيانات العميل' });
  }
});

// 16. Order Cancellation with Reason (orders.cancel)
apiRouter.post('/admin/orders/:id/cancel', requireAdminAuth, requirePermission('orders.cancel'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await resolveOrderRecord(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const orderId = order.id;
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
    const allSettings = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
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

    await prisma.appSetting.upsert({
      where: { key },
      update: {
        value: String(value),
        updatedAt: new Date(),
      },
      create: {
        key,
        value: String(value),
        description: description || '',
      },
    });

    res.json({ success: true, message: `تم تحديث الإعداد ${key} بنجاح` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'فشل تحديث الإعدادات' });
  }
});

// 18. Customer Payments & Supplier Payments Lists & Payment Audit Logs
apiRouter.get('/admin/customer-payments', requireAdminAuth, requirePermission('customer_payments.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rawPayments = await prisma.customerPayment.findMany({
      include: {
        order: { select: { orderNumber: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
    });

    const payments = rawPayments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      customerId: p.customerId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      paymentStatus: p.paymentStatus,
      paymentReference: p.paymentReference,
      notes: p.notes,
      receivedBy: p.receivedBy,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      orderNumber: p.order?.orderNumber || '',
      customerName: p.customer?.fullName || '',
      customerPhone: p.customer?.phone || '',
    }));

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل مدفوعات العملاء' });
  }
});

apiRouter.get('/admin/supplier-payments', requireAdminAuth, requirePermission('supplier_payments.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rawPayments = await prisma.supplierPayment.findMany({
      include: {
        order: { select: { orderNumber: true } },
        supplierOrder: { select: { supplierOrderNumber: true } },
        supplier: { select: { name: true } },
      },
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
    });

    const payments = rawPayments.map((p) => ({
      id: p.id,
      supplierOrderId: p.supplierOrderId,
      supplierId: p.supplierId,
      orderId: p.orderId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      notes: p.notes,
      paidBy: p.paidBy,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      orderNumber: p.order?.orderNumber || '',
      supplierOrderNumber: p.supplierOrder?.supplierOrderNumber || '',
      supplierName: p.supplier?.name || '',
    }));

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل مدفوعات المصنع' });
  }
});

apiRouter.get('/admin/payment-audit-logs', requireAdminAuth, requirePermission('audit_logs.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: 'customer_payments' },
          { entity: 'supplier_payments' },
          { action: { contains: 'PAYMENT' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تحميل سجل رقابة المدفوعات' });
  }
});

