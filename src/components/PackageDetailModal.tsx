import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, ShieldCheck, ShoppingBag, Zap, Minus, Plus, Heart } from "lucide-react";
import { CateringPackage, DrinkModificationId } from "../types";
import { DRINK_MODIFICATION_OPTIONS } from "../data/cateringData";
import { CelebreLogo, CelebreClocheIcon, CelebreStarIcon } from "./CelebreLogo";

interface PackageDetailModalProps {
  packageItem: CateringPackage | null;
  onClose: () => void;
  onAddToCart: (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId) => void;
  onDirectOrder: (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId) => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  packageItem,
  onClose,
  onAddToCart,
  onDirectOrder
}) => {
  if (!packageItem) return null;

  const [quantity, setQuantity] = useState<number>(packageItem.minOrder || 50);
  const [selectedDrink, setSelectedDrink] = useState<DrinkModificationId>("default_juice");
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);

  const drinkDelta = DRINK_MODIFICATION_OPTIONS.find(d => d.id === selectedDrink)?.priceDelta || 0;
  const unitPrice = packageItem.pricePerBox + drinkDelta;
  const totalPrice = quantity * unitPrice;
  const deposit = Math.round(totalPrice * 0.5);

  const handleCustomCountChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setQuantity(0);
    } else {
      setQuantity(Math.max(1, num));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#F0EAE1] bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <CelebreLogo size="xs" showSlogan={false} />
            <div>
              <span className="bg-[#5C1027] text-white text-[10px] font-black px-2 py-0.5 rounded-md font-['Cinzel',sans-serif]">
                {packageItem.saleCode}
              </span>
              <h3 className="font-black text-base sm:text-lg text-[#221B17] mt-0.5">
                {packageItem.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17] transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Visual & Key Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 relative rounded-2xl overflow-hidden shadow-md border border-[#E8DFD1] bg-[#EAE2D5] h-64 sm:h-72">
              <img
                src={packageItem.image}
                alt={packageItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#5C1027] font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                {unitPrice} جنيه / علبة
              </div>
              {/* Official Celebre Box Logo Stamp */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#C89B3C]/80 shadow-md flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="شعار سيلبر الرسمي على العلبة"
                  className="h-6 w-auto object-contain"
                />
                <span className="font-['Cinzel',sans-serif] text-[10px] text-[#5C1027] font-black">
                  {packageItem.saleCode}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 left-3">
                <span className="inline-flex items-center gap-1.5 bg-[#5C1027]/90 text-[#F4EEDB] text-[10px] font-bold px-3 py-1 rounded-full border border-[#C89B3C]/40 backdrop-blur-xs shadow-md">
                  📦 علبة سيلبر الكرتونية الرسمية الحقيقية
                </span>
              </div>
            </div>

            <div className="md:col-span-6 space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C89B3C] bg-[#F4EEDB] px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>ضيافة كاترنج سيلبر الرسمية</span>
              </span>

              <h4 className="text-xl font-black text-[#221B17] leading-snug">
                {packageItem.tagline}
              </h4>

              <p className="text-xs sm:text-sm text-[#4A3E38] leading-relaxed">
                {packageItem.description}
              </p>

              {/* Recommended For Badges */}
              <div className="pt-2">
                <span className="text-xs font-bold text-[#7A6E65] block mb-1.5">
                  مثالية ومناسبة لـ:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {packageItem.recommendedFor.map((rec, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-[#FAF7F2] border border-[#E8DFD1] px-2.5 py-1 rounded-lg text-[#221B17] font-semibold"
                    >
                      ✓ {rec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Box Contents */}
          <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#E8DFD1]">
            <h5 className="font-black text-sm text-[#221B17] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5C1027]" />
              <span>محتويات ومكونات العلبة الكرتونية المعتمدة:</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packageItem.sections.map((sec, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#E8DFD1]">
                  <span className="text-xs font-black text-[#C89B3C] block mb-2">{sec.title}</span>
                  <ul className="space-y-1.5 text-xs text-[#4A3E38]">
                    {sec.items.map((it, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Packaging Highlights */}
            <div className="mt-4 p-3.5 bg-white/90 rounded-xl border border-[#C89B3C]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A6E65] gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="شعار سيلبر المعتمد" className="w-6 h-6 object-contain" />
                <div>
                  <strong className="text-[#221B17]">التغليف الرسمي:</strong>{" "}
                  <span className="text-[#5C1027] font-bold">علبة كرتونية مذهبة فاخرة تحمل شعار سيلبر الملكي المعتمد</span>
                </div>
              </div>
              <div className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>غلق ذاتي محكم وتوزيع سريع نظيف</span>
              </div>
            </div>
          </div>

          {/* Drink Options Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#4A3E38]">
              تخصيص المشروب المرفق بالعلبة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DRINK_MODIFICATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDrink(opt.id)}
                  className={`text-right p-3 rounded-xl border text-xs font-semibold transition-all ${
                    selectedDrink === opt.id
                      ? "border-[#5C1027] bg-[#5C1027] text-white shadow-xs"
                      : "border-[#E8DFD1] bg-[#FAF7F2] text-[#221B17] hover:bg-[#F3E7D3]"
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className={`text-[11px] mt-0.5 ${selectedDrink === opt.id ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                    {opt.sublabel}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Meal Quantity Selection with Flexible Input (> 300 allowed) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#4A3E38]">
                الكمية المطلوبة (الحد الأدنى 50 علبة):
              </label>
              <span className="text-xs font-black text-[#5C1027]">
                {quantity} علبة
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 150, 200, 300].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setQuantity(preset);
                    setIsCustomCount(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    !isCustomCount && quantity === preset
                      ? "bg-[#C89B3C] text-white shadow-xs"
                      : "bg-[#FAF7F2] text-[#4A3E38] hover:bg-[#F3E7D3] border border-[#E8DFD1]"
                  }`}
                >
                  {preset} علبة
                </button>
              ))}
            </div>

            {/* Custom Input (> 300 flexible) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQuantity(Math.max(50, quantity - 10));
                  setIsCustomCount(false);
                }}
                className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center font-bold text-[#5C1027] hover:bg-[#EFE8DD]"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min="50"
                  step="10"
                  placeholder="أو اكتب أي عدد أكبر من 300 (مثل 400، 500، 1000...)"
                  value={quantity || ""}
                  onChange={(e) => {
                    setIsCustomCount(true);
                    handleCustomCountChange(e.target.value);
                  }}
                  className="w-full text-center py-2.5 px-3 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 focus:border-[#5C1027] rounded-xl text-sm font-black text-[#221B17]"
                />
                <span className="absolute left-3 top-2.5 text-xs text-[#7A6E65] font-bold pointer-events-none">
                  علبة
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuantity(quantity + 10);
                  setIsCustomCount(false);
                }}
                className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center font-bold text-[#5C1027] hover:bg-[#EFE8DD]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {quantity < 50 && (
              <p className="text-xs text-amber-700 font-bold">
                * تنبيه: الحد الأدنى المعتمد للطلب هو 50 وجبة
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer with Live Totals & Action Buttons */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#F0EAE1] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="text-[11px] text-[#7A6E65]">الإجمالي الكلي:</div>
              <div className="text-xl font-black text-[#5C1027]">
                {totalPrice.toLocaleString()} جنيه
              </div>
            </div>
            <div className="border-r pr-4 border-[#E8DFD1]">
              <div className="text-[11px] text-[#7A6E65]">العربون (50%):</div>
              <div className="text-base font-black text-[#C89B3C]">
                {deposit.toLocaleString()} جنيه
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onAddToCart(packageItem, quantity, selectedDrink);
                onClose();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-5 bg-white hover:bg-[#F3E7D3] border border-[#5C1027] text-[#5C1027] font-bold rounded-xl text-sm transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>إضافة للسلة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDirectOrder(packageItem, quantity, selectedDrink);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-6 bg-[#5C1027] hover:bg-[#721832] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95"
            >
              <Zap className="w-4 h-4 text-[#C89B3C]" />
              <span>طلب مباشر وفوري</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
