import React from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShieldAlert } from "lucide-react";
import { CartItem, DrinkModificationId } from "../types";
import { DRINK_MODIFICATION_OPTIONS } from "../data/cateringData";
import { CelebreLogo, CelebreClocheIcon } from "./CelebreLogo";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (packageId: string, quantity: number) => void;
  onUpdateDrink: (packageId: string, drink: DrinkModificationId) => void;
  onRemoveItem: (packageId: string) => void;
  onProceedToOrder: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onUpdateDrink,
  onRemoveItem,
  onProceedToOrder
}) => {
  if (!isOpen) return null;

  const totalBoxes = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const drinkDelta = DRINK_MODIFICATION_OPTIONS.find(d => d.id === (item.selectedDrink || "default_juice"))?.priceDelta || 0;
    return sum + (item.package.pricePerBox + drinkDelta) * item.quantity;
  }, 0);
  const deposit = Math.round(totalPrice * 0.5);

  const isMinOrderMet = totalBoxes >= 50;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn" 
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-r border-[#E8DFD1]">
          {/* Drawer Header */}
          <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#5C1027]" />
              <h3 className="font-black text-lg text-[#221B17]">سلة طلبات الكاترنج</h3>
              <span className="text-xs font-bold bg-[#C89B3C] text-white px-2 py-0.5 rounded-full">
                {items.length} صنف
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center text-[#7A6E65]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-[#221B17]">السلة فارغة حالياً</h4>
                <p className="text-xs text-[#7A6E65] max-w-xs mx-auto">
                  اختر من بين 12 وجبة رسمية معتمدة من سيلبر وأضف الكمية المناسبة لمناسبتك السعيدة.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 py-2 px-5 bg-[#5C1027] text-white font-bold text-xs rounded-xl hover:bg-[#721832]"
                >
                  استعراض المنيو والوجبات
                </button>
              </div>
            ) : (
              items.map((item) => {
                const drink = item.selectedDrink || "default_juice";
                const drinkDelta = DRINK_MODIFICATION_OPTIONS.find(d => d.id === drink)?.priceDelta || 0;
                const unitPrice = item.package.pricePerBox + drinkDelta;
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div
                    key={item.package.id}
                    className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-3.5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.package.image}
                          alt={item.package.name}
                          className="w-16 h-16 rounded-xl object-cover border border-[#E8DFD1] shrink-0"
                        />
                        <div>
                          <span className="text-[10px] font-black text-[#5C1027] bg-white px-2 py-0.5 rounded-md border border-[#E8DFD1]">
                            {item.package.saleCode}
                          </span>
                          <h5 className="font-bold text-xs sm:text-sm text-[#221B17] mt-1">
                            {item.package.name}
                          </h5>
                          <div className="text-[11px] text-[#7A6E65] mt-0.5">
                            {unitPrice} ج / علبة
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.package.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                        title="حذف الوجبة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Drink Selector in Cart */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7A6E65] font-semibold">المشروب:</span>
                      <select
                        value={drink}
                        onChange={(e) => onUpdateDrink(item.package.id, e.target.value as DrinkModificationId)}
                        className="text-[11px] bg-white border border-[#E8DFD1] rounded-lg px-2 py-1 font-semibold text-[#221B17]"
                      >
                        {DRINK_MODIFICATION_OPTIONS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label} ({d.priceDelta === 0 ? "مشمول (بقيمة 5ج)" : d.priceDelta > 0 ? `+${d.priceDelta}ج` : `-${Math.abs(d.priceDelta)}ج`})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity controls + flexible typing (> 300 allowed) */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#E8DFD1]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.package.id, Math.max(10, item.quantity - 10))}
                          className="w-7 h-7 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center font-bold text-[#5C1027]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <div className="relative w-20">
                          <input
                            type="number"
                            min="10"
                            step="10"
                            placeholder="العدد"
                            value={item.quantity || ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              onUpdateQuantity(item.package.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-full text-center py-1 bg-white border border-[#C89B3C]/50 rounded-lg text-xs font-black text-[#221B17]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.package.id, item.quantity + 10)}
                          className="w-7 h-7 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center font-bold text-[#5C1027]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-left font-black text-sm text-[#5C1027]">
                        {itemTotal.toLocaleString()} جنيه
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 bg-[#FAF7F2] border-t border-[#F0EAE1] space-y-3">
              {!isMinOrderMet && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    الحد الأدنى الإجمالي للطلب 50 وجبة (المتبقي: {50 - totalBoxes} وجبة)
                  </span>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-[#4A3E38]">
                <div className="flex justify-between">
                  <span>إجمالي عدد الوجبات:</span>
                  <span className="font-bold text-[#221B17]">{totalBoxes} علبة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>التوصيل:</span>
                  <span className="font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[11px]">
                    التوصيل غير مشمول
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#221B17] pt-1 border-t border-[#E8DFD1]">
                  <span>المبلغ الإجمالي:</span>
                  <span className="text-[#5C1027] text-base">{totalPrice.toLocaleString()} جنيه</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#C89B3C]">
                  <span>العربون المطلوب (50%):</span>
                  <span>{deposit.toLocaleString()} جنيه</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!isMinOrderMet}
                onClick={() => {
                  onClose();
                  onProceedToOrder();
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                  isMinOrderMet
                    ? "bg-[#5C1027] hover:bg-[#721832] text-white"
                    : "bg-[#D5C9B7] text-[#7A6E65] cursor-not-allowed"
                }`}
              >
                <span>متابعة إتمام الطلب وتحديد الموقع</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
