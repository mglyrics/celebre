import React from "react";
import { CheckCircle2, MessageCircle, CalendarCheck, Clock, MapPin, Hash, User, Phone, Package, ArrowRight, Printer } from "lucide-react";
import { BookingOrderResult } from "../../types/publicMenu";

interface BookingConfirmationModalProps {
  order: BookingOrderResult | null;
  isOpen: boolean;
  onClose: () => void;
  onNewBooking: () => void;
  whatsappLink?: string;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
  onNewBooking,
  whatsappLink,
}) => {
  if (!isOpen || !order) return null;

  const defaultWhatsappLink = whatsappLink || `https://wa.me/201284484868?text=${encodeURIComponent(
    `السلام عليكم، قمت بعمل حجز مبدئي رقم ${order.orderNumber} لوجبة ${order.menuCode} بعدد ${order.quantity} وجبة. أود تأكيد تفاصيل الحجز.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#FAF7F2] rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFD1] text-[#221B17] relative flex flex-col"
        dir="rtl"
      >
        {/* Header Icon & Primary Message */}
        <div className="bg-gradient-to-b from-[#721832] to-[#5C1027] text-white p-6 sm:p-8 text-center rounded-t-3xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-[#C89B3C]" />
          </div>

          <span className="inline-block px-3 py-1 bg-[#C89B3C] text-[#221B17] font-black text-xs rounded-full mb-3 shadow-xs">
            حالة الطلب: PENDING_BOOKING (حجز مبدئي معتمد)
          </span>

          {/* Exact required wording from prompt */}
          <h2 className="text-lg sm:text-xl font-black text-white leading-relaxed mb-2">
            تم استلام طلب الحجز المبدئي وسيتم التواصل معك عبر واتساب لتأكيد الحجز وتفاصيل الدفع.
          </h2>

          <p className="text-xs text-[#F4EEDB]/90 max-w-md mx-auto">
            تم تسجيل طلبك بنجاح في قاعدة بيانات كاترنج سيليبر، وسيراجع فريق المبيعات موعد وتجهيز وجباتك فوراً.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-black/25 px-4 py-1.5 rounded-full text-xs font-mono text-[#F4EEDB] border border-white/15">
            <Hash className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>رقم الحجز:</span>
            <span className="font-bold text-white tracking-wider">{order.orderNumber}</span>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFD1] shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-[#5C1027] flex items-center gap-2 border-b border-[#E8DFD1] pb-2">
              <Package className="w-4 h-4 text-[#C89B3C]" />
              <span>ملخص بيانات الحجز المسجل:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#4A3E38]">
                <User className="w-3.5 h-3.5 text-[#8C6D28]" />
                <span className="font-semibold">العميل:</span>
                <span className="font-bold text-[#221B17]">{order.customerName}</span>
              </div>

              <div className="flex items-center gap-2 text-[#4A3E38]">
                <Phone className="w-3.5 h-3.5 text-[#8C6D28]" />
                <span className="font-semibold">الهاتف:</span>
                <span className="font-bold text-[#221B17]" dir="ltr">{order.phone}</span>
              </div>

              <div className="flex items-center gap-2 text-[#4A3E38]">
                <Package className="w-3.5 h-3.5 text-[#8C6D28]" />
                <span className="font-semibold">الوجبة:</span>
                <span className="font-bold text-[#721832]">{order.menuCode} - {order.menuName}</span>
              </div>

              <div className="flex items-center gap-2 text-[#4A3E38]">
                <span className="w-3.5 h-3.5 text-[#8C6D28] font-bold">#</span>
                <span className="font-semibold">عدد الوجبات:</span>
                <span className="font-black text-[#5C1027] text-sm">{order.quantity} وجبة</span>
              </div>

              <div className="flex items-center gap-2 text-[#4A3E38]">
                <CalendarCheck className="w-3.5 h-3.5 text-[#8C6D28]" />
                <span className="font-semibold">تاريخ الاستلام:</span>
                <span className="font-bold text-[#221B17]">{order.pickupDate}</span>
              </div>

              <div className="flex items-center gap-2 text-[#4A3E38]">
                <Clock className="w-3.5 h-3.5 text-[#8C6D28]" />
                <span className="font-semibold">وقت الاستلام:</span>
                <span className="font-bold text-[#221B17]">{order.pickupTime}</span>
              </div>

              <div className="sm:col-span-2 flex items-start gap-2 text-[#4A3E38]">
                <MapPin className="w-3.5 h-3.5 text-[#8C6D28] mt-0.5" />
                <span className="font-semibold">مكان وموقع الاستلام:</span>
                <span className="font-bold text-[#221B17]">{order.pickupLocation}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-[#E8DFD1] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#6B5E55] block">إجمالي قيمة الحجز التقديرية:</span>
                <span className="text-[11px] text-[#25D366] font-bold">المدفوع إلكترونياً: 0 ج (بدون دفع أونلاين)</span>
              </div>
              <div className="flex items-baseline gap-1 text-[#721832]">
                <span className="text-xl sm:text-2xl font-black">{order.customerTotal}</span>
                <span className="text-xs font-bold text-[#221B17]">جنيه مصري</span>
              </div>
            </div>
          </div>

          {/* Action Call to WhatsApp */}
          <a
            href={defaultWhatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-sm py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>متابعة وتأكيد الحجز فوراً عبر واتساب الإدارة</span>
          </a>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                onClose();
                onNewBooking();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#D6C7B7] text-xs font-bold text-[#221B17] hover:bg-[#E8DFD1] transition-colors"
            >
              حجز طلب آخر
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F1714] text-white text-xs font-bold hover:bg-[#362720] transition-colors"
            >
              العودة للقائمة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
