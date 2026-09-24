import React, { useState } from "react";
import { X, Calculator, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { CateringPackage } from "../types";

interface EventCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  packages: CateringPackage[];
  onSelectPackageForOrder: (pkg: CateringPackage, quantity: number) => void;
}

export const EventCalculator: React.FC<EventCalculatorProps> = ({
  isOpen,
  onClose,
  packages,
  onSelectPackageForOrder
}) => {
  if (!isOpen) return null;

  const [guestCount, setGuestCount] = useState<number>(120);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(packages[0]?.id || "pkg-sale-01");

  const selectedPkg = packages.find(p => p.id === selectedPackageId) || packages[0];
  const totalCost = guestCount * (selectedPkg ? selectedPkg.pricePerBox : 50);
  const deposit = Math.round(totalCost * 0.5);
  const remaining = totalCost - deposit;

  const handleCustomCount = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setGuestCount(0);
    } else {
      setGuestCount(Math.max(1, num));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5C1027] text-white">
              <Calculator className="w-5 h-5 text-[#C89B3C]" />
            </span>
            <div>
              <h3 className="font-black text-lg text-[#221B17]">
                حاسبة تكاليف وميزانية المناسبة الذكية
              </h3>
              <p className="text-[11px] text-[#7A6E65]">احسب التكلفة الدقيقة للوجبات والعربون بالكامل</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Guest / Meals Count Input with Flexible Limit (> 300 allowed) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#4A3E38]">
                عدد المعازيم والوجبات المطلوبة:
              </label>
              <span className="text-sm font-black text-[#5C1027]">
                {guestCount} وجبة
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 150, 200, 300].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setGuestCount(count);
                    setIsCustomCount(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    !isCustomCount && guestCount === count
                      ? "bg-[#C89B3C] text-white shadow-xs"
                      : "bg-[#FAF7F2] text-[#4A3E38] hover:bg-[#F3E7D3] border border-[#E8DFD1]"
                  }`}
                >
                  {count} وجبة
                </button>
              ))}
            </div>

            {/* Custom Input allowing ANY number including > 300 */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8DFD1] space-y-2">
              <label className="block text-xs font-bold text-[#7A6E65]">
                أو اكتب أي عدد أكبر من 300 وجبة مباشرة:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="10"
                  placeholder="مثلاً: 400 أو 500 أو 800 أو 1500 وجبة..."
                  value={guestCount || ""}
                  onChange={(e) => {
                    setIsCustomCount(true);
                    handleCustomCount(e.target.value);
                  }}
                  className="w-full text-center py-2.5 px-4 bg-white border-2 border-[#C89B3C]/50 focus:border-[#5C1027] rounded-xl text-base font-black text-[#221B17]"
                />
                <span className="absolute left-3 top-2.5 text-xs text-[#7A6E65] font-bold pointer-events-none">
                  علبة
                </span>
              </div>
              {guestCount >= 300 && (
                <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  طاقة استيعابية مفتوحة: سيلبر مجهزة لخدمة كبرى المناسبات فوق 1000 وجبة
                </p>
              )}
            </div>
          </div>

          {/* Select Package to Compare */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#4A3E38]">
              اختر الوجبة لحساب التكلفة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                    selectedPackageId === pkg.id
                      ? "border-[#5C1027] bg-[#5C1027] text-white shadow-xs"
                      : "border-[#E8DFD1] bg-[#FAF7F2] text-[#221B17] hover:bg-[#F3E7D3]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{pkg.saleCode} - {pkg.name.split("(")[0]}</div>
                    <div className={`text-[10px] ${selectedPackageId === pkg.id ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                      {pkg.pricePerBox} جنيه للعلبة
                    </div>
                  </div>
                  <span className={`text-xs font-black ${selectedPackageId === pkg.id ? "text-[#C89B3C]" : "text-[#5C1027]"}`}>
                    {(guestCount * pkg.pricePerBox).toLocaleString()} ج
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Result Breakdown Card */}
          {selectedPkg && (
            <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F4EEDB] rounded-2xl p-5 border border-[#C89B3C]/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[#5C1027] bg-white px-2.5 py-0.5 rounded-md border border-[#E8DFD1]">
                    {selectedPkg.saleCode}
                  </span>
                  <h4 className="font-black text-sm text-[#221B17] mt-1">
                    {selectedPkg.name}
                  </h4>
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-[#7A6E65]">سعر العلبة:</div>
                  <div className="text-base font-black text-[#5C1027]">{selectedPkg.pricePerBox} جنيه</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8DFD1] grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1]">
                  <div className="text-[10px] text-[#7A6E65]">إجمالي الوجبات</div>
                  <div className="text-sm font-black text-[#221B17] mt-0.5">{guestCount} علبة</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1]">
                  <div className="text-[10px] text-[#7A6E65]">العربون (50%)</div>
                  <div className="text-sm font-black text-[#C89B3C] mt-0.5">{deposit.toLocaleString()} ج</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1]">
                  <div className="text-[10px] text-[#7A6E65]">المتبقي عند الاستلام</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">{remaining.toLocaleString()} ج</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#E8DFD1] flex justify-between items-center">
                <span className="font-bold text-sm text-[#221B17]">إجمالي التكلفة الكلية:</span>
                <span className="text-xl font-black text-[#5C1027]">{totalCost.toLocaleString()} جنيه</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#F0EAE1] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD]"
          >
            إغلاق
          </button>

          {selectedPkg && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectPackageForOrder(selectedPkg, guestCount);
              }}
              className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
            >
              <span>طلب هذه الباقة ({guestCount} وجبة) الآن</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
