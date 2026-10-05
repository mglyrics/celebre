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

  // Financials - Customer
  customerTotal?: number | string;
  customerPaid?: number | string;
  customerRemaining?: number | string;

  // Financials - Supplier (Factory)
  supplierUnitPrice?: number | string;
  supplierTotal?: number | string;
  supplierPaid?: number | string;
  supplierRemaining?: number | string;

  orderStatus: string;
}

export class WhatsAppService {
  private static adminPhone = "201284484868";

  /**
   * Generates WhatsApp deep link URL safely
   */
  public static createDeepLink(phone: string, text: string): string {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("01")) {
      cleanPhone = "2" + cleanPhone;
    } else if (cleanPhone.startsWith("+2")) {
      cleanPhone = cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Template for Customer Preliminary Booking (Public booking confirmation)
   * CRITICAL: Strictly NO factory price, NO supplier payment, NO profit margin!
   */
  public static generateCustomerBookingMessage(p: WhatsAppMessagePayload): string {
    return `مرحبًا بك في سيلبر كاترنج (Celebre Catering) 🌸
تم تسجيل الحجز المبدئي الخاص بك بنجاح.

📌 رقم الطلب: ${p.orderNumber}
👤 اسم العميل: ${p.customerName}
📞 رقم الهاتف: ${p.customerPhone}
🍱 الوجبة المختارة: ${p.menuName} (${p.menuCode})
📦 الكمية: ${p.quantity} علبة كرتونية مذهبة
📅 تاريخ الاستلام: ${p.pickupDate}
⏰ موعد الاستلام: ${p.pickupTime}
📍 مكان الاستلام: ${p.pickupLocation}
${p.modifications ? `✨ التعديلات: ${p.modifications}\n` : ""}${p.notes ? `📝 ملاحظات العميل: ${p.notes}\n` : ""}
💰 إجمالي قيمة الحجز: ${p.customerTotal} ج.م
💵 المدفوع: ${p.customerPaid || 0} ج.م
💳 المتبقي: ${p.customerRemaining || p.customerTotal} ج.م
📌 حالة الطلب: حجز مبدئي - بدون دفع إلكتروني

⚠️ سيتم التواصل معكم مباشرة عبر WhatsApp من إدارة سيلبر لاستكمال تأكيد الحجز وتفاصيل الدفع (عبر InstaPay). شكرًا لاختياركم سيلبر!`;
  }

  /**
   * Template for Admin Alert upon receiving a preliminary booking
   */
  public static generateAdminNewBookingAlert(p: WhatsAppMessagePayload): string {
    return `*🔔 طلب حجز مبدئي جديد - كاترنج سيلبر*

رقم الطلب: ${p.orderNumber}
اسم العميل: ${p.customerName}
رقم الهاتف: ${p.customerPhone}
كود الوجبة: ${p.menuCode} (${p.menuName})
عدد الوجبات: ${p.quantity} علبة
تاريخ الاستلام: ${p.pickupDate}
وقت الاستلام: ${p.pickupTime}
مكان الاستلام: ${p.pickupLocation}
${p.modifications ? `التعديلات: ${p.modifications}\n` : ""}الإجمالي بسعر الموزع: ${p.customerTotal} ج.م
حالة الطلب: حجز مبدئي - بدون دفع

⚠️ يرجى التواصل مع العميل عبر واتساب لتأكيد الحجز واستلام الدفعة عبر InstaPay ثم توثيقها يدوياً في لوحة الإدارة.`;
  }

  /**
   * Template for Factory / Supplier Order Message
   * CRITICAL: Strictly NO distributor price, NO customer total, NO Celebre profit!
   */
  public static generateSupplierOrderMessage(p: WhatsAppMessagePayload): string {
    return `*🏭 أمر تجهيز وتوريد كاترنج - مصنع التجهيزات المركزي*

رقم الطلب المعتمد: ${p.orderNumber}
اسم العميل للتسليم: ${p.customerName}
هاتف العميل: ${p.customerPhone}
تاريخ الاستلام والتسليم: ${p.pickupDate}
موعد الاستلام: ${p.pickupTime}
مكان التسليم: ${p.pickupLocation}

🍱 تفاصيل الوجبة:
كود الوجبة: ${p.menuCode}
اسم العرض: ${p.menuName}
الكمية المطلوبة: ${p.quantity} علبة كرتونية مذهبة
${p.modifications ? `مواصفات التعديل: ${p.modifications}\n` : ""}${p.notes ? `ملاحظات التشغيل: ${p.notes}\n` : ""}
💵 الحسابات الخاصة بالمصنع:
سعر المصنع للوحدة: ${p.supplierUnitPrice} ج.م
إجمالي مستحق المصنع: ${p.supplierTotal} ج.م
المدفوع للمصنع: ${p.supplierPaid || 0} ج.م
المتبقي للمصنع: ${p.supplierRemaining || p.supplierTotal} ج.م
حالة أمر التوريد: ${p.orderStatus}

يرجى الالتزام التام بالجودة الفندقية والتسليم في الموعد المحدد.`;
  }

  /**
   * Template for Customer Payment Receipt & Order Confirmation
   */
  public static generateCustomerPaymentUpdateMessage(p: WhatsAppMessagePayload, paymentAmount: number, method: string): string {
    return `*إيصال استلام دفعة وتأكيد حجز - سيلبر كاترنج 🧾*

أهلاً بحضرتك أستاذ/ة ${p.customerName}،
تم تسجيل دفعتكم المالية بنجاح:
رقم الطلب: ${p.orderNumber}
الوجبة: ${p.menuName} (${p.quantity} وجبة)
قيمة الدفعة المستلمة: ${paymentAmount} ج.م
طريقة الاستلام: ${method}
إجمالي الحجز: ${p.customerTotal} ج.م
إجمالي المدفوع حتى الآن: ${p.customerPaid} ج.م
المبلغ المتبقي عند الاستلام: ${p.customerRemaining} ج.م
حالة الطلب: ${p.orderStatus}

حجزكم مؤكد وجارٍ تجهيزه بعناية لأجمل مناسبة ✨`;
  }

  /**
   * Template for Supplier Payment Update Message
   */
  public static generateSupplierPaymentUpdateMessage(p: WhatsAppMessagePayload, paymentAmount: number, reference: string): string {
    return `*إشعار تحويل دفعة للمصنع - كاترنج سيلبر 💸*

المصنع المعتمد للتجهيز،
تم تسجيل تحويل دفعة مالية لحسابكم:
رقم الطلب: ${p.orderNumber}
الكمية: ${p.quantity} وجبة (${p.menuCode})
قيمة الدفعة المحولة: ${paymentAmount} ج.م
المرجع / إيصال التحويل: ${reference || "تحويل بنكي / محفظة"}
إجمالي مستحق المصنع: ${p.supplierTotal} ج.م
إجمالي المسدد للمصنع: ${p.supplierPaid} ج.م
المتبقي للمصنع: ${p.supplierRemaining} ج.م`;
  }
}
