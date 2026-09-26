import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Printer,
  MessageCircle,
  Share2,
  Copy,
  Check,
  Calendar,
  MapPin,
  User,
  Clock,
  ShieldCheck,
  Award,
  FileText,
  Phone,
  CreditCard,
  Sparkles,
  Info
} from "lucide-react";
import { Order } from "../types";
import { DRINK_MODIFICATION_OPTIONS } from "../data/cateringData";
import { CelebreLogo } from "./CelebreLogo";

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  // Build clean and detailed Arabic summary for WhatsApp and copying
  const generateOrderSummary = () => {
    const itemsList = order.items
      .map((item, idx) => {
        const drink = item.selectedDrink || "default_juice";
        const drinkLabel =
          DRINK_MODIFICATION_OPTIONS.find((d) => d.id === drink)?.label || "عصير معلب";
        const drinkDelta =
          DRINK_MODIFICATION_OPTIONS.find((d) => d.id === drink)?.priceDelta || 0;
        const unitPrice = item.package.pricePerBox + drinkDelta;
        const subtotal = unitPrice * item.quantity;
        return `${idx + 1}. *${item.package.saleCode} - ${item.package.name}*
   • الكمية: ${item.quantity} علبة
   • سعر العلبة: ${unitPrice} ج.م
   • المشروب: ${drinkLabel}
   • الإجمالي: ${subtotal.toLocaleString("ar-EG")} ج.م`;
      })
      .join("\n\n");

    const paymentLabel =
      order.customerInfo.paymentMethod === "instapay"
        ? "إنستاباي (InstaPay)"
        : order.customerInfo.paymentMethod === "vodafone_cash"
        ? "فودافون كاش"
        : order.customerInfo.paymentMethod === "bank_transfer"
        ? "تحويل بنكي"
        : "الدفع عند الاستلام";

    return `👑 *سيلبر للضيافة والكاترنج الفاخر (Celebre Catering)*
📄 *فاتورة حجز كاترنج رسمية معتمدة*
━━━━━━━━━━━━━━━━━━━━
🔖 *رقم العقد / الفاتورة:* #${order.id}
📅 *تاريخ التسجيل:* ${new Date(order.createdAt || Date.now()).toLocaleDateString("ar-EG")}
🕒 *الحالة:* معتمد وجارٍ التجهيز للمناسبة

👤 *بيانات العميل والمناسبة:*
• اسم العميل: ${order.customerInfo.fullName}
• الهاتف: ${order.customerInfo.phone}
• نوع المناسبة: ${order.customerInfo.occasion}
• الموعد: ${order.customerInfo.eventDate} (${order.customerInfo.eventTime || "عصراً"})
• موقع التسليم: ${order.customerInfo.deliveryGovernorate} - ${order.customerInfo.deliveryAddress}
• طريقة الدفع: ${paymentLabel}
${order.customerInfo.detailedNotes ? `• ملاحظات إضافية: ${order.customerInfo.detailedNotes}` : ""}

📦 *تفاصيل الوجبات والبنود:*
${itemsList}

💰 *الملخص المالي المعتمد:*
• إجمالي عدد الوجبات: ${order.totalBoxes} علبة
• إجمالي قيمة الباقات: ${order.totalPrice.toLocaleString("ar-EG")} جنيه مصري
• مصاريف التوصيل: غير مشمولة (تُحدد وفق موقع القاعة)
• العربون المطلوب لتأكيد الحجز (50%): ${order.depositAmount.toLocaleString("ar-EG")} جنيه
• المتبقي عند الاستلام: ${order.remainingAmount.toLocaleString("ar-EG")} جنيه

✨ *ضمان سيلبر:*
علب كرتونية فاخرة مذهبة محكمة الإغلاق ومجهزة للتوزيع الفوري والسريع بالمساجد والقاعات بدون أي فوضى.

📞 لخدمة العملاء وتأكيد التحويل: 01284484868
🌐 سيلبر - شريك مؤسس لمناسباتك السعيدة`;
  };

  // WhatsApp Share API: allows the customer to share order summary to any contact/chat on WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateOrderSummary());
    // Direct WhatsApp API endpoint
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Contact Celebre Customer Service on WhatsApp for instant confirmation
  const handleContactSupportWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً سيلبر، أود تأكيد حجز الفاتورة رقم #${order.id} باسم ${order.customerInfo.fullName} وإرسال إيصال سداد العربون (${order.depositAmount.toLocaleString("ar-EG")} ج.م).`
    );
    window.open(`https://wa.me/201284484868?text=${text}`, "_blank");
  };

  const handlePrint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.print();
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(generateOrderSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const paymentMethodBadge = () => {
    switch (order.customerInfo.paymentMethod) {
      case "instapay":
        return "إنستاباي (InstaPay)";
      case "vodafone_cash":
        return "فودافون كاش";
      case "bank_transfer":
        return "تحويل بنكي رسمي";
      default:
        return "الدفع عند الاستلام";
    }
  };

  return (
    <div className="invoice-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="invoice-modal-card relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-4 max-h-[94vh] flex flex-col">
        
        {/* Top Floating Notification Bar (Hidden when printing) */}
        <div className="no-print px-4 sm:px-6 py-3 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>تم اعتماد وتوثيق طلبك رسمياً بنجاح!</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DFD1] text-xs font-semibold text-[#5C1027] hover:bg-[#EFE8DD] transition"
              title="طباعة الفاتورة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17] transition"
              aria-label="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Invoice Body */}
        <div id="invoice-sheet" className="overflow-y-auto p-4 sm:p-8 space-y-6 text-[#221B17] bg-white print:p-0">
          
          {/* Header & Brand Identity (Official Letterhead) */}
          <div className="border-b-2 border-[#D4AF37]/40 pb-6 relative print-avoid-break">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Brand Logo & Tagline */}
              <div className="flex flex-col items-center md:items-start text-center md:text-right">
                <CelebreLogo size="md" showSlogan={false} showEnglishSubtitles={false} />
                <div className="mt-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#5C1027] tracking-tight">
                    سيلبر للضيافة والكاترنج الفاخر
                  </h1>
                  <p className="text-xs font-bold text-[#C89B3C] tracking-wide">
                    CELEBRE LUXURY CATERING & WEDDINGS
                  </p>
                  <p className="text-[11px] text-[#7A6E65] mt-0.5">
                    شريك مؤسس لمناسباتك السعيدة • القاهرة، الجيزة، الإسكندرية ومحافظات مصر
                  </p>
                </div>
              </div>

              {/* Invoice Meta Box (Official Document Metadata) */}
              <div className="w-full md:w-auto bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:min-w-[260px] text-right shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-[#E8DFD1] pb-2 mb-2.5">
                  <span className="text-[11px] font-bold text-[#7A6E65] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#C89B3C]" />
                    نوع المستند:
                  </span>
                  <span className="text-xs font-black text-[#5C1027] bg-[#5C1027]/10 px-2 py-0.5 rounded">
                    عقد توريد رسمي
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#7A6E65]">رقم الفاتورة:</span>
                    <strong className="font-mono font-bold text-[#221B17]" dir="ltr">
                      INV-{order.id}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A6E65]">تاريخ الإصدار:</span>
                    <strong className="text-[#221B17]">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString("ar-EG")}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#E8DFD1]">
                    <span className="text-[#7A6E65]">حالة الطلب:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      معتمد وجارِ التجهيز
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Official Watermark Badge */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#7A6E65] bg-[#FAF7F2]/60 px-4 py-2 rounded-xl border border-[#E8DFD1]/70">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                عقد توريد وضيافة رسمي معتمد من إدارة سيلبر
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-[#5C1027]" />
                الرقم الموحد للحجز والمتابعة: 01284484868
              </span>
            </div>
          </div>

          {/* Section: Customer & Event Information Cards */}
          <div className="print-avoid-break">
            <h2 className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#C89B3C]" />
              بيانات العميل ومواصفات المناسبة والتسليم
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Client */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFD1]">
                <div className="text-[11px] text-[#7A6E65] flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-[#5C1027]" />
                  صاحب الحجز
                </div>
                <div className="font-bold text-sm text-[#221B17] truncate">{order.customerInfo.fullName}</div>
                <div className="text-xs font-mono text-[#5C1027] mt-0.5" dir="ltr">
                  {order.customerInfo.phone}
                </div>
              </div>

              {/* Card 2: Occasion */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFD1]">
                <div className="text-[11px] text-[#7A6E65] flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
                  نوع المناسبة
                </div>
                <div className="font-bold text-sm text-[#221B17]">{order.customerInfo.occasion}</div>
                <div className="text-xs text-[#7A6E65] mt-0.5">ضيافة علب فاخرة</div>
              </div>

              {/* Card 3: Date & Timing */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFD1]">
                <div className="text-[11px] text-[#7A6E65] flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5C1027]" />
                  موعد التسليم
                </div>
                <div className="font-bold text-sm text-[#221B17]">{order.customerInfo.eventDate}</div>
                <div className="text-xs text-[#7A6E65] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#C89B3C]" />
                  {order.customerInfo.eventTime || "عصراً"}
                </div>
              </div>

              {/* Card 4: Payment */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFD1]">
                <div className="text-[11px] text-[#7A6E65] flex items-center gap-1 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  طريقة الدفع
                </div>
                <div className="font-bold text-xs text-[#221B17]">{paymentMethodBadge()}</div>
                <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">عربون 50% مستحق</div>
              </div>

              {/* Card 5 (Full width): Delivery Details */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFD1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#5C1027] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-[#7A6E65] block">مكان وعنوان التسليم المعتمد:</span>
                    <span className="font-bold text-xs text-[#221B17]">
                      {order.customerInfo.deliveryGovernorate} — {order.customerInfo.deliveryAddress}
                    </span>
                  </div>
                </div>
                {order.customerInfo.detailedNotes && (
                  <div className="sm:max-w-xs text-[11px] bg-white p-2 rounded-lg border border-[#E8DFD1] text-[#7A6E65]">
                    <span className="font-bold text-[#221B17]">ملاحظة:</span> {order.customerInfo.detailedNotes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Structured Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#C89B3C]" />
                جدول الأصناف والباقات المطلوبة
              </h2>
              <span className="text-xs font-bold text-[#5C1027] bg-[#5C1027]/10 px-2.5 py-0.5 rounded-full">
                إجمالي {order.totalBoxes} علبة
              </span>
            </div>

            <div className="border border-[#E8DFD1] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#4A0D1F] text-white text-xs font-bold border-b-2 border-[#D4AF37]">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-4">تفاصيل الباقة والمحتويات</th>
                    <th className="py-3 px-3 text-center w-24">المشروب</th>
                    <th className="py-3 px-3 text-center w-24">سعر العلبة</th>
                    <th className="py-3 px-3 text-center w-20">الكمية</th>
                    <th className="py-3 px-4 text-left w-28">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD1] text-xs">
                  {order.items.map((item, idx) => {
                    const drink = item.selectedDrink || "default_juice";
                    const drinkOption = DRINK_MODIFICATION_OPTIONS.find((d) => d.id === drink);
                    const drinkDelta = drinkOption?.priceDelta || 0;
                    const unitPrice = item.package.pricePerBox + drinkDelta;
                    const total = unitPrice * item.quantity;

                    // Extract items breakdown preview
                    const itemsPreview = item.package.sections
                      ?.flatMap((s) => s.items)
                      ?.slice(0, 4)
                      ?.join(" • ");

                    return (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition"}
                      >
                        <td className="py-3.5 px-3 text-center font-bold text-[#7A6E65]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-black bg-[#C89B3C]/15 text-[#8C6819] px-1.5 py-0.5 rounded border border-[#C89B3C]/30">
                              {item.package.saleCode}
                            </span>
                            <span className="font-black text-[#221B17] text-sm">
                              {item.package.name}
                            </span>
                          </div>
                          {itemsPreview && (
                            <p className="text-[11px] text-[#7A6E65] mt-1 leading-relaxed">
                              {itemsPreview}
                            </p>
                          )}
                          {item.customRibbonText && (
                            <span className="inline-block mt-1 text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                              شريطة مخصصة: "{item.customRibbonText}"
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8DFD1] text-[#5C1027]">
                            {drinkOption?.label || "عصير معلب"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-[#221B17]">
                          {unitPrice} <span className="text-[10px] text-[#7A6E65]">ج.م</span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-black text-sm text-[#221B17]">
                          {item.quantity}
                          <span className="text-[10px] block font-normal text-[#7A6E65]">علبة</span>
                        </td>
                        <td className="py-3.5 px-4 text-left font-black text-sm text-[#5C1027]">
                          {total.toLocaleString()} <span className="text-[10px] text-[#7A6E65]">ج.م</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Accounting Summary & Quality Guarantees */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
            
            {/* Quality & Packing Guarantees (Right side) */}
            <div className="md:col-span-7 bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DFD1] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-[#C89B3C]" />
                  <h3 className="font-bold text-sm text-[#221B17]">
                    مواصفات التعبئة والتوريد الرسمية من سيلبر
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-[#554740] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold text-sm leading-none">✓</span>
                    <span><strong>تغليف فندقي محكم:</strong> علب كرتونية فاخرة مذهبة محكمة الإغلاق بتصميم ملكي ملائم لحفلات كتب الكتاب والزفاف.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold text-sm leading-none">✓</span>
                    <span><strong>توزيع فوري سريع:</strong> جاهزة للمناول والتوزيع المباشر داخل المساجد أو القاعات في ثوانٍ معدودة بدون أي فوضى.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold text-sm leading-none">✓</span>
                    <span><strong>طزاجة يوم المناسبة:</strong> تُخبز وتُعد الوجبات صباح يوم المناسبة وتُنقل في سيارات مجهزة للحفاظ على قرمشتها وطعمها.</span>
                  </li>
                </ul>
              </div>

              {/* Delivery notice */}
              <div className="mt-4 pt-3 border-t border-[#E8DFD1] flex items-center gap-2 text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <Info className="w-4 h-4 shrink-0 text-amber-700" />
                <span>
                  <strong>تنويه التوصيل:</strong> مصاريف الشحن غير مشمولة في الفاتورة وتُحسب وفقاً للمسافة وموقع القاعة/المسجد وتُنسق مع الكابتن.
                </span>
              </div>
            </div>

            {/* Financial Summary Ledger (Left side) */}
            <div className="md:col-span-5 bg-gradient-to-br from-[#FAF7F2] to-white p-5 rounded-2xl border-2 border-[#D4AF37]/50 shadow-sm space-y-3 print-avoid-break">
              <h3 className="font-black text-sm text-[#5C1027] border-b border-[#E8DFD1] pb-2 flex items-center justify-between">
                <span>الملخص المالي للعقد</span>
                <span className="text-[11px] font-bold text-[#7A6E65]">العملة: جنيه مصري</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#554740]">
                  <span>إجمالي عدد العلب:</span>
                  <span className="font-bold text-[#221B17]">{order.totalBoxes} علبة</span>
                </div>

                <div className="flex justify-between text-[#554740]">
                  <span>قيمة الباقات الإجمالية:</span>
                  <span className="font-bold text-[#221B17]">
                    {order.totalPrice.toLocaleString()} ج.م
                  </span>
                </div>

                <div className="flex justify-between text-[#554740] items-center">
                  <span>مصاريف التوصيل:</span>
                  <span className="font-bold text-[11px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                    غير مشمولة (تُحدد لاحقاً)
                  </span>
                </div>

                <div className="pt-2 border-t-2 border-[#E8DFD1] flex justify-between items-baseline font-black text-[#5C1027]">
                  <span className="text-sm">المبلغ الإجمالي المستحق:</span>
                  <span className="text-lg">
                    {order.totalPrice.toLocaleString()}{" "}
                    <span className="text-xs font-normal">جنيه</span>
                  </span>
                </div>

                {/* 50% Deposit Callout */}
                <div className="bg-[#5C1027]/8 p-3 rounded-xl border border-[#5C1027]/20 space-y-1.5 mt-2">
                  <div className="flex justify-between font-black text-xs text-[#5C1027]">
                    <span>العربون المطلوب لتأكيد الحجز (50%):</span>
                    <span className="text-sm font-bold text-[#C89B3C]">
                      {order.depositAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7A6E65]">
                    <span>المتبقي عند استلام الأوردر:</span>
                    <span className="font-bold text-[#221B17]">
                      {order.remainingAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Official Verification Seal & Signatures */}
          <div className="signature-section print-avoid-break pt-4 border-t border-[#E8DFD1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6E65]">
            <div className="flex items-center gap-3">
              {/* Seal Stamp */}
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#C89B3C] flex flex-col items-center justify-center text-center p-1 text-[#5C1027] font-black rotate-[-6deg] bg-amber-50/50 shadow-inner">
                <span className="text-[9px] tracking-tight leading-none">معتمد رسمياً</span>
                <span className="text-[10px] text-[#C89B3C] font-mono leading-none my-0.5">CELEBRE</span>
                <span className="text-[8px] text-[#7A6E65] leading-none">2026 CATERING</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#221B17]">إدارة التشغيل والمناسبات - سيلبر</p>
                <p className="text-[11px] text-[#7A6E65]">توقيع واعتماد العقد إلكترونياً بدون الحاجة لختم ورقي</p>
              </div>
            </div>

            <div className="text-center sm:text-left text-[11px] text-[#7A6E65]">
              <p>شكراً لثقتكم واختياركم لسيلبر شريكاً لمناسباتكم السعيدة</p>
              <p className="font-mono text-[10px] mt-0.5">Celebre Hospitality Solutions • www.celebre-catering.com</p>
            </div>
          </div>

        </div>

        {/* Footer Actions (WhatsApp Share, Support WhatsApp, Copy, Print) */}
        <div className="no-print px-4 sm:px-6 py-4 bg-[#FAF7F2] border-t border-[#F0EAE1] flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Right Group: Copy and Print */}
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD] transition"
              title="طباعة الفاتورة أو حفظها كـ PDF"
            >
              <Printer className="w-4 h-4 text-[#5C1027]" />
              <span className="hidden sm:inline">طباعة العقد</span>
              <span className="sm:hidden">طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD] transition"
              title="نسخ ملخص الطلب للحافظة"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#C89B3C]" />
                  <span>نسخ الملخص</span>
                </>
              )}
            </button>
          </div>

          {/* Left Group: WhatsApp Share & Celebre Support */}
          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2 justify-end">
            
            {/* Requested Feature: One-Click WhatsApp Share for Client */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
              title="مشاركة تفاصيل الفاتورة عبر واتساب مع الأهل أو منظم المناسبة"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة الطلب (واتساب)</span>
            </button>

            {/* Direct WhatsApp Contact with Celebre Admin */}
            <button
              type="button"
              onClick={handleContactSupportWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
              title="التواصل المباشر مع خدمة عملاء سيلبر لدفع العربون وتأكيد الحجز"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تأكيد الحجز (01284484868)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
