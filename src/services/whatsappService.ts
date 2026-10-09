import { db } from '../db/index.ts';
import { orders, customers, orderItems, supplierOrders, auditLogs, suppliers } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface WhatsAppMessagePayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  menuCode: string;
  menuName: string;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  notes?: string;
  modifications?: string;

  // Financials - Customer Side
  customerTotal: number | string;
  customerPaid: number | string;
  customerRemaining: number | string;

  // Financials - Supplier Side (Factory)
  supplierUnitPrice?: number | string;
  supplierTotal?: number | string;
  supplierPaid?: number | string;
  supplierRemaining?: number | string;

  orderStatus: string;
}

export type WhatsAppMessageType =
  | 'CUSTOMER_MESSAGE'
  | 'SUPPLIER_MESSAGE'
  | 'CUSTOMER_UPDATE'
  | 'SUPPLIER_UPDATE';

export interface WhatsAppDispatchResult {
  orderId: number;
  orderNumber: string;
  messageType: WhatsAppMessageType;
  recipientPhone: string;
  recipientName: string;
  messageText: string;
  sent: boolean; // Strictly false if no API credentials exist!
  deliveryMode: 'DEEP_LINK' | 'API';
  deepLink?: string;
  apiResponse?: any;
  statusDescription: string;
  tracked: {
    lastMessageAt: Date;
    lastMessageBy: string;
    lastMessageType: WhatsAppMessageType;
    lastMessageRecipient: string;
  };
}

export class WhatsAppService {
  private static defaultSupplierPhone = '01284484868';

  /**
   * Checks whether real WhatsApp Business API credentials exist in environment
   */
  public static hasApiCredentials(): boolean {
    const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return Boolean(token && phoneId && token.trim() !== '' && phoneId.trim() !== '');
  }

  /**
   * Generates safe WhatsApp deep link URL (https://wa.me/...)
   */
  public static createDeepLink(phone: string, text: string): string {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '2' + cleanPhone;
    } else if (cleanPhone.startsWith('+2')) {
      cleanPhone = cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * 1. Send Customer Message (تأكيد الطلب والحجز للعميل)
   * RULES:
   * MUST contain: Order Number, Customer Name, Meal, Quantity, Pickup Date, Pickup Time, Pickup Location, Customer Total, Customer Paid, Customer Remaining, Order Status.
   * MUST NOT contain: Factory Price, Factory Total, Supplier Payment, Supplier Remaining, Profit!
   */
  public static generateCustomerMessage(p: WhatsAppMessagePayload): string {
    return `مرحبًا بك في سيلبر كاترنج (Celebre Catering) 🌸
تم تسجيل وتأكيد بيانات حجزكم بنجاح:

📋 رقم الطلب: ${p.orderNumber}
👤 اسم العميل: ${p.customerName}
🍱 الوجبة المختارة: ${p.menuName} (${p.menuCode})
📦 الكمية: ${p.quantity} وجبة
📅 تاريخ الاستلام: ${p.pickupDate}
⏰ وقت الاستلام: ${p.pickupTime}
📍 مكان الاستلام: ${p.pickupLocation}

💰 إجمالي حساب العميل: ${p.customerTotal} ج.م
💵 المدفوع من العميل: ${p.customerPaid} ج.م
💳 المتبقي على العميل: ${p.customerRemaining} ج.م
📌 حالة الطلب: ${p.orderStatus}

${p.notes ? `📝 ملاحظات خاصة: ${p.notes}\n` : ''}سعداء بخدمتكم وتجهيز مناسبتكم بأعلى معايير الجودة الفندقية ✨`;
  }

  /**
   * 2. Send Supplier Message (أمر التوريد والتشغيل للمصنع)
   * RULES:
   * MUST contain: Order Number, Customer Name, Phone, Meal, Quantity, Pickup Date, Pickup Time, Pickup Location, Factory Price, Factory Total, Supplier Paid, Supplier Remaining, Order Status.
   * MUST NOT contain: Distributor Price, Customer Payment/Customer Total/Customer Paid, Customer Remaining, Profit!
   */
  public static generateSupplierMessage(p: WhatsAppMessagePayload): string {
    return `*🏭 أمر تشغيل وتوريد كاترنج - مصنع التجهيزات المركزي*

📋 رقم الطلب: ${p.orderNumber}
👤 اسم العميل: ${p.customerName}
📞 هاتف العميل للتسليم: ${p.customerPhone}
🍱 الوجبة المطلوبة: ${p.menuName} (${p.menuCode})
📦 الكمية المطلوبة: ${p.quantity} وجبة
📅 تاريخ الاستلام: ${p.pickupDate}
⏰ وقت الاستلام: ${p.pickupTime}
📍 مكان الاستلام: ${p.pickupLocation}

💵 سعر المصنع للوحدة: ${p.supplierUnitPrice ?? 0} ج.م
🏭 إجمالي حساب المصنع: ${p.supplierTotal ?? 0} ج.م
💸 المدفوع للمصنع: ${p.supplierPaid ?? 0} ج.م
⏳ المتبقي للمصنع: ${p.supplierRemaining ?? 0} ج.م
📌 حالة الطلب: ${p.orderStatus}

${p.notes ? `📝 تعليمات التشغيل: ${p.notes}\n` : ''}يرجى الالتزام التام بالمواصفات الفندقية وموعد التسليم المحدد.`;
  }

  /**
   * 3. Send Customer Update (تحديث العميل - تعديل حالة أو سداد دفعة)
   * RULES:
   * Same customer rules: strictly NO factory prices or profit!
   */
  public static generateCustomerUpdateMessage(p: WhatsAppMessagePayload, updateReason?: string): string {
    return `*🔔 إشعار تحديث من سيلبر كاترنج (Celebre Catering)*

أهلاً بحضرتك أستاذ/ة ${p.customerName}،
${updateReason ? `📢 تفاصيل التحديث: ${updateReason}\n` : ''}
📋 رقم الطلب: ${p.orderNumber}
🍱 الوجبة: ${p.menuName} (${p.menuCode})
📦 الكمية: ${p.quantity} وجبة
📅 تاريخ الاستلام: ${p.pickupDate}
⏰ وقت الاستلام: ${p.pickupTime}
📍 مكان الاستلام: ${p.pickupLocation}

💰 إجمالي حساب العميل: ${p.customerTotal} ج.م
💵 المدفوع من العميل: ${p.customerPaid} ج.م
💳 المتبقي على العميل: ${p.customerRemaining} ج.م
📌 حالة الطلب الحالية: ${p.orderStatus}

فريق سيلبر في خدمتكم دائماً لأي استفسار عبر هذا الرقم 🌸`;
  }

  /**
   * 4. Send Supplier Update (تحديث المصنع - تعديل حالة أو تحويل مالي)
   * RULES:
   * Same supplier rules: strictly NO distributor price, customer payments, or profit!
   */
  public static generateSupplierUpdateMessage(p: WhatsAppMessagePayload, updateReason?: string): string {
    return `*🏭 تحديث أمر توريد - مصنع التجهيزات*

إلى المصنع المعتمد،
${updateReason ? `📢 تفاصيل التحديث: ${updateReason}\n` : ''}
📋 رقم الطلب: ${p.orderNumber}
👤 اسم العميل: ${p.customerName}
📞 هاتف العميل: ${p.customerPhone}
🍱 الوجبة: ${p.menuName} (${p.menuCode})
📦 الكمية المطلوبة: ${p.quantity} وجبة
📅 تاريخ الاستلام: ${p.pickupDate}
⏰ وقت الاستلام: ${p.pickupTime}
📍 مكان الاستلام: ${p.pickupLocation}

💵 سعر المصنع للوحدة: ${p.supplierUnitPrice ?? 0} ج.م
🏭 إجمالي حساب المصنع: ${p.supplierTotal ?? 0} ج.م
💸 المدفوع للمصنع: ${p.supplierPaid ?? 0} ج.م
⏳ المتبقي للمصنع: ${p.supplierRemaining ?? 0} ج.م
📌 حالة أمر التوريد: ${p.orderStatus}

يرجى تحديث سجلات التشغيل وفقاً لهذا التحديث.`;
  }

  /**
   * Helper: Builds WhatsAppMessagePayload from DB order record
   */
  public static async loadPayloadForOrder(orderId: number): Promise<{
    payload: WhatsAppMessagePayload;
    customerPhone: string;
    customerWhatsapp: string;
    supplierPhone: string;
  }> {
    const orderList = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!orderList.length) throw new Error('الطلب غير موجود');
    const order = orderList[0];

    const customerList = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);
    const customer = customerList[0];

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const firstItem = items[0];

    const supOrders = await db.select().from(supplierOrders).where(eq(supplierOrders.orderId, orderId)).limit(1);
    const supOrder = supOrders[0];

    let supplierPhone = this.defaultSupplierPhone;
    if (supOrder) {
      const supRecords = await db.select().from(suppliers).where(eq(suppliers.id, supOrder.supplierId)).limit(1);
      if (supRecords.length && supRecords[0].phone) {
        supplierPhone = supRecords[0].phone;
      }
    }

    const payload: WhatsAppMessagePayload = {
      orderNumber: order.orderNumber,
      customerName: customer?.fullName || 'العميل',
      customerPhone: customer?.phone || '',
      customerWhatsapp: customer?.whatsapp || customer?.phone || '',
      menuCode: firstItem?.menuCode || 'Sale',
      menuName: firstItem?.menuName || 'عرض كاترنج',
      quantity: firstItem?.quantity || 100,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      pickupLocation: order.pickupLocation,
      notes: order.customerNotes || undefined,

      customerTotal: parseFloat(order.totalAmount),
      customerPaid: parseFloat(order.customerPaid),
      customerRemaining: parseFloat(order.customerRemaining),

      supplierUnitPrice: firstItem ? parseFloat(firstItem.supplierUnitPrice) : 0,
      supplierTotal: parseFloat(order.supplierTotal),
      supplierPaid: parseFloat(order.supplierPaid),
      supplierRemaining: parseFloat(order.supplierRemaining),

      orderStatus: order.orderStatus,
    };

    return {
      payload,
      customerPhone: customer?.phone || '',
      customerWhatsapp: customer?.whatsapp || customer?.phone || '',
      supplierPhone,
    };
  }

  /**
   * Internal dispatcher: sends via WhatsApp Cloud API if credentials exist,
   * otherwise generates Deep Link safely and NEVER claims message was sent.
   * Tracks last message time and admin user in DB.
   */
  private static async dispatchMessage(
    orderId: number,
    messageType: WhatsAppMessageType,
    recipientName: string,
    recipientPhone: string,
    messageText: string,
    adminUsername: string
  ): Promise<WhatsAppDispatchResult> {
    const hasApi = this.hasApiCredentials();
    let sent = false;
    let deliveryMode: 'DEEP_LINK' | 'API' = 'DEEP_LINK';
    let deepLink: string | undefined = undefined;
    let apiResponse: any = undefined;
    let statusDescription = '';

    if (hasApi) {
      // Send via Meta WhatsApp Cloud API
      try {
        const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        let cleanPhone = recipientPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;

        const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: messageText },
          }),
        });

        apiResponse = await res.json();
        if (res.ok && apiResponse.messages && apiResponse.messages.length > 0) {
          sent = true;
          deliveryMode = 'API';
          statusDescription = 'تم إرسال الرسالة بنجاح عبر WhatsApp Business API الرسمية';
        } else {
          // API call failed, fall back to deep link
          deliveryMode = 'DEEP_LINK';
          deepLink = this.createDeepLink(recipientPhone, messageText);
          statusDescription = `فشل إرسال API (${apiResponse?.error?.message || 'خطأ غير معروف'}). تم تجهيز رابط Deep Link للإرسال اليدوي.`;
        }
      } catch (err: any) {
        deliveryMode = 'DEEP_LINK';
        deepLink = this.createDeepLink(recipientPhone, messageText);
        statusDescription = `تعذر الاتصال بـ WhatsApp API: ${err.message}. تم توفير رابط Deep Link للإرسال اليدوي.`;
      }
    } else {
      // No API credentials: use WhatsApp Deep Link
      // CRITICAL: DO NOT claim message was sent!
      sent = false;
      deliveryMode = 'DEEP_LINK';
      deepLink = this.createDeepLink(recipientPhone, messageText);
      statusDescription = 'تم إنشاء الرسالة وتوليد رابط WhatsApp Deep Link للإرسال اليدوي (لم يتم الإرسال الفعلي لعدم توفر بيانات WhatsApp Business API).';
    }

    const now = new Date();
    const recipientInfo = `${recipientName} (${recipientPhone})`;

    // Record last message timestamp and user in orders table
    await db
      .update(orders)
      .set({
        lastMessageAt: now,
        lastMessageBy: adminUsername,
        lastMessageType: messageType,
        lastMessageRecipient: recipientInfo,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    // Record in Audit Log
    const orderRecord = (await db.select({ num: orders.orderNumber }).from(orders).where(eq(orders.id, orderId)))[0];
    await db.insert(auditLogs).values({
      userName: adminUsername,
      action: `WHATSAPP_${messageType}`,
      entity: 'orders',
      entityId: String(orderId),
      newData: {
        orderId,
        orderNumber: orderRecord?.num,
        messageType,
        recipientName,
        recipientPhone,
        deliveryMode,
        sent,
        deepLink,
        messagePreview: messageText.substring(0, 200) + '...',
        timestamp: now,
      },
    });

    return {
      orderId,
      orderNumber: orderRecord?.num || '',
      messageType,
      recipientPhone,
      recipientName,
      messageText,
      sent,
      deliveryMode,
      deepLink,
      apiResponse,
      statusDescription,
      tracked: {
        lastMessageAt: now,
        lastMessageBy: adminUsername,
        lastMessageType: messageType,
        lastMessageRecipient: recipientInfo,
      },
    };
  }

  /**
   * Action 1: Send Customer Message
   */
  public static async sendCustomerMessage(orderId: number, adminUsername: string): Promise<WhatsAppDispatchResult> {
    const { payload, customerPhone } = await this.loadPayloadForOrder(orderId);
    const messageText = this.generateCustomerMessage(payload);
    return await this.dispatchMessage(
      orderId,
      'CUSTOMER_MESSAGE',
      payload.customerName,
      customerPhone,
      messageText,
      adminUsername
    );
  }

  /**
   * Action 2: Send Supplier Message
   */
  public static async sendSupplierMessage(orderId: number, adminUsername: string): Promise<WhatsAppDispatchResult> {
    const { payload, supplierPhone } = await this.loadPayloadForOrder(orderId);
    const messageText = this.generateSupplierMessage(payload);
    return await this.dispatchMessage(
      orderId,
      'SUPPLIER_MESSAGE',
      'مصنع التجهيزات المركزي',
      supplierPhone,
      messageText,
      adminUsername
    );
  }

  /**
   * Action 3: Send Customer Update
   */
  public static async sendCustomerUpdate(
    orderId: number,
    adminUsername: string,
    updateReason?: string
  ): Promise<WhatsAppDispatchResult> {
    const { payload, customerPhone } = await this.loadPayloadForOrder(orderId);
    const messageText = this.generateCustomerUpdateMessage(payload, updateReason);
    return await this.dispatchMessage(
      orderId,
      'CUSTOMER_UPDATE',
      payload.customerName,
      customerPhone,
      messageText,
      adminUsername
    );
  }

  /**
   * Action 4: Send Supplier Update
   */
  public static async sendSupplierUpdate(
    orderId: number,
    adminUsername: string,
    updateReason?: string
  ): Promise<WhatsAppDispatchResult> {
    const { payload, supplierPhone } = await this.loadPayloadForOrder(orderId);
    const messageText = this.generateSupplierUpdateMessage(payload, updateReason);
    return await this.dispatchMessage(
      orderId,
      'SUPPLIER_UPDATE',
      'مصنع التجهيزات المركزي',
      supplierPhone,
      messageText,
      adminUsername
    );
  }

  // Backward compatibility alias for public website booking alert
  public static generateCustomerBookingMessage(p: WhatsAppMessagePayload): string {
    return this.generateCustomerMessage(p);
  }

  public static generateSupplierOrderMessage(p: WhatsAppMessagePayload): string {
    return this.generateSupplierMessage(p);
  }

  public static generateAdminNewBookingAlert(p: WhatsAppMessagePayload): string {
    return `*🔔 طلب حجز مبدئي جديد - كاترنج سيلبر*
رقم الطلب: ${p.orderNumber}
العميل: ${p.customerName} (${p.customerPhone})
الوجبة: ${p.menuCode} (${p.menuName})
الكمية: ${p.quantity} علبة
تاريخ الاستلام: ${p.pickupDate} (${p.pickupTime})
المكان: ${p.pickupLocation}
إجمالي العميل: ${p.customerTotal} ج.م
الحالة: ${p.orderStatus}`;
  }
}
