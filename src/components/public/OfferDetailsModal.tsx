import React from "react";
import { X, CheckCircle2, ShieldCheck, CalendarCheck, Sparkles, Package, GlassWater, ArrowRight } from "lucide-react";
import { PublicMenuItem } from "../../types/publicMenu";
import { getSaleImage } from "../../data/saleImages";

interface OfferDetailsModalProps {
  item: PublicMenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectForBooking: (menuCode: string) => void;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  onSelectForBooking,
}) => {
  if (!isOpen || !item) return null;

  const imageSrc = getSaleImage(item.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#FAF7F2] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFD1] text-[#221B17] relative flex flex-col"
        dir="rtl"
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-20 bg-[#FAF7F2]/95 backdrop-blur-md px-5 py-4 border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#721832] text-white font-black text-xs rounded-full">
              {item.code}
            </span>
            <h3 className="font-bold text-lg text-[#5C1027] truncate">
              تفاصيل العرض
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#E8DFD1] text-[#721832] transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Main Visual & Key Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-4/3 bg-white border border-[#E8DFD1] group">
              <img
                src={imageSrc}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="eager"
              />
              <div className="absolute top-3 right-3 bg-[#1F1714]/85 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                علبة كرتونية ذهبية فاخرة
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6D28] bg-[#C89B3C]/15 px-3 py-1 rounded-full border border-[#C89B3C]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>عرض كاترنج معتمد</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#5C1027] leading-snug">
                {item.name}
              </h2>

              <p className="text-xs sm:text-sm text-[#4A3E38] leading-relaxed">
                {item.description}
              </p>

              {/* Distributor Price ONLY (Strictly safe - No factory cost or supplier data) */}
              <div className="bg-gradient-to-r from-[#721832]/10 to-[#C89B3C]/10 p-3.5 rounded-2xl border border-[#C89B3C]/30 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-[#721832] block">سعر الوجبة (سعر الموزع الرسمي):</span>
                  <span className="text-xs text-[#8C6D28]">شامل التعبئة والتغليف المحكم</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#721832]">
                    {item.distributorPrice}
                  </span>
                  <span className="text-xs font-bold text-[#221B17]">جنيه / وجبة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Components Breakdown */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFD1] shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-[#5C1027] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C89B3C]" />
              <span>محتويات ومكونات الوجبة بالعلبة:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {item.components && item.components.length > 0 ? (
                item.components.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD1]/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C89B3C] shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#221B17]">
                      {c.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#6B5E55]">
                  المكونات مشمولة وموضحة في وصف الوجبة.
                </div>
              )}
            </div>
          </div>

          {/* Available Drink Options Preview */}
          <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DFD1] space-y-2.5 text-xs text-[#4A3E38]">
            <h5 className="font-bold text-[#5C1027] flex items-center gap-1.5">
              <GlassWater className="w-4 h-4 text-[#C89B3C]" />
              <span>خيارات المشروب المتاحة عند الحجز:</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1] text-center">
                <span className="font-bold text-[#221B17] block">عصير بخيرة</span>
                <span className="text-[11px] text-[#25D366] font-bold">مشمول بالوجبة (0 ج)</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1] text-center">
                <span className="font-bold text-[#221B17] block">استبعاد العصير</span>
                <span className="text-[11px] text-[#721832] font-bold">خصم 5 ج للوجبة (-5 ج)</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1] text-center">
                <span className="font-bold text-[#221B17] block">استبدال بكانز بيبسي</span>
                <span className="text-[11px] text-[#0066cc] font-bold">إضافة 10 ج للوجبة (+10 ج)</span>
              </div>
            </div>
          </div>

          {/* Luxury Quality Guarantee */}
          <div className="bg-[#5C1027]/5 border border-[#5C1027]/15 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#721832] shrink-0 mt-0.5" />
            <div className="text-xs text-[#4A3E38] space-y-1">
              <p className="font-bold text-[#5C1027]">ضمان الجودة الفندقية وسرعة التوزيع:</p>
              <p>
                يتم طهي وتجهيز كل وجبة طازجة يوم المناسبة داخل كراتين فاخرة بيضاء أو ذهبية محكمة الإغلاق مع ملعقة وشوكة ومنديل معقم لضمان توزيع فوري وسريع وراقي لضيوفك.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#FAF7F2]/95 backdrop-blur-md p-4 sm:p-5 border-t border-[#E8DFD1] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#6B5E55] text-center sm:text-right">
            <span>الحجز مبدئي ومجاني بدون أي دفع إلكتروني</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#D6C7B7] text-xs font-bold text-[#221B17] hover:bg-[#E8DFD1] transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={() => {
                onClose();
                onSelectForBooking(item.code);
              }}
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#721832] to-[#5C1027] hover:from-[#5C1027] hover:to-[#430B1C] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>احجز هذا العرض الآن</span>
              <CalendarCheck className="w-4 h-4 text-[#C89B3C]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
