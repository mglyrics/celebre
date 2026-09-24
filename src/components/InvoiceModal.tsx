import React from "react";
import { X, CheckCircle2, Printer, MessageCircle, ShieldCheck } from "lucide-react";
import { Order } from "../types";
import { DRINK_MODIFICATION_OPTIONS } from "../data/cateringData";
import { CelebreLogo } from "./CelebreLogo";

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`مرحباً سيلبر، أود متابعة الطلب رقم ${order.id} باسم ${order.customerInfo.fullName}`);
    window.open(`https://wa.me/201284484868?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>تم تسجيل وتوثيق طلبك بنجاح!</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="overflow-y-auto p-6 space-y-6 print:p-0">
          {/* Logo & Order Slogan */}
          <div className="text-center pb-4 border-b border-[#E8DFD1]">
            <CelebreLogo size="md" showSlogan={true} sloganText="سيلبر شريك مؤسس لمناساباتك السعيدة" />
            <div className="mt-2 text-xs font-black text-[#5C1027] bg-[#5C1027]/10 inline-block px-3 py-1 rounded-full">
              عقد توريد ضيافة كاترنج رسمي • كود: {order.id}
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1]">
            <div>
              <span className="text-[#7A6E65] block">العميل الكريم:</span>
              <strong className="text-[#221B17] text-sm">{order.customerInfo.fullName}</strong>
            </div>
            <div>
              <span className="text-[#7A6E65] block">رقم الهاتف:</span>
              <strong className="text-[#221B17]" dir="ltr">{order.customerInfo.phone}</strong>
            </div>
            <div>
              <span className="text-[#7A6E65] block">المناسبة:</span>
              <strong className="text-[#221B17]">{order.customerInfo.occasion}</strong>
            </div>
            <div>
              <span className="text-[#7A6E65] block">تاريخ وموعد المناسبة:</span>
              <strong className="text-[#221B17]">{order.customerInfo.eventDate} ({order.customerInfo.eventTime || "عصراً"})</strong>
            </div>
            <div className="col-span-2 pt-2 border-t border-[#E8DFD1]">
              <span className="text-[#7A6E65] block">مكان التسليم المعتمد:</span>
              <strong className="text-[#221B17]">{order.customerInfo.deliveryAddress} - {order.customerInfo.deliveryGovernorate}</strong>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#E8DFD1] rounded-2xl overflow-hidden text-xs">
            <div className="bg-[#5C1027] text-white p-3 font-bold grid grid-cols-12 gap-2">
              <span className="col-span-6">الوجبة / الباقة</span>
              <span className="col-span-2 text-center">الكمية</span>
              <span className="col-span-2 text-center">سعر العلبة</span>
              <span className="col-span-2 text-left">الإجمالي</span>
            </div>
            <div className="divide-y divide-[#E8DFD1]">
              {order.items.map((item, idx) => {
                const drink = item.selectedDrink || "default_juice";
                const drinkDelta = DRINK_MODIFICATION_OPTIONS.find(d => d.id === drink)?.priceDelta || 0;
                const unitPrice = item.package.pricePerBox + drinkDelta;
                const total = unitPrice * item.quantity;
                return (
                  <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <div className="font-bold text-[#221B17]">{item.package.saleCode} - {item.package.name}</div>
                      <div className="text-[10px] text-[#7A6E65]">المشروب: {DRINK_MODIFICATION_OPTIONS.find(d => d.id === drink)?.label}</div>
                    </div>
                    <div className="col-span-2 text-center font-bold">{item.quantity} علبة</div>
                    <div className="col-span-2 text-center text-[#7A6E65]">{unitPrice} ج</div>
                    <div className="col-span-2 text-left font-black text-[#5C1027]">{total.toLocaleString()} ج</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1] space-y-2 text-xs">
            <div className="flex justify-between text-[#4A3E38]">
              <span>إجمالي عدد الوجبات:</span>
              <span className="font-bold text-[#221B17]">{order.totalBoxes} علبة</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#221B17] pt-2 border-t border-[#E8DFD1]">
              <span>المبلغ الإجمالي للطلب:</span>
              <span className="text-[#5C1027] text-base">{order.totalPrice.toLocaleString()} جنيه</span>
            </div>
            <div className="flex justify-between font-black text-[#C89B3C] text-sm">
              <span>العربون المطلوب (50%):</span>
              <span>{order.depositAmount.toLocaleString()} جنيه</span>
            </div>
            <div className="flex justify-between text-[#7A6E65] text-xs">
              <span>المتبقي عند الاستلام:</span>
              <span>{order.remainingAmount.toLocaleString()} جنيه</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E8DFD1] flex items-center gap-2 text-xs text-[#7A6E65]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>علب كرتونية مذهبة محكمة الإغلاق جاهزة للتوزيع الفوري والسريع بالمساجد والقاعات بدون أي فوضى.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#F0EAE1] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD]"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة العقد</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-bold shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>متابعة الحجز على الواتساب (01284484868)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
