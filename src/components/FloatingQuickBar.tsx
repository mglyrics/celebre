import React from "react";
import { ShoppingBag, MessageCircle, Phone, Sparkles, UtensilsCrossed } from "lucide-react";

interface FloatingQuickBarProps {
  cartCount: number;
  onOpenCart: () => void;
  onScrollToPackages: () => void;
  onOpenAdvisor: () => void;
}

export const FloatingQuickBar: React.FC<FloatingQuickBarProps> = ({
  cartCount,
  onOpenCart,
  onScrollToPackages,
  onOpenAdvisor
}) => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/201284484868?text=السلام%20عليكم،%20أود%20الاستفسار%20عن%20عبوات%20كاترنج%20سيلبر%20للمناسبات", "_blank");
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] sm:max-w-md animate-bounce-in">
      <div className="bg-[#221B17]/95 backdrop-blur-md text-[#FAF7F2] px-3.5 py-2.5 rounded-2xl shadow-2xl border border-[#C89B3C]/40 flex items-center gap-2 sm:gap-3">
        {/* Menu browse */}
        <button
          onClick={onScrollToPackages}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all text-[#FAF7F2]"
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span className="hidden sm:inline">منيو</span>
          <span>الوجبات</span>
        </button>

        {/* AI Advisor */}
        <button
          onClick={onOpenAdvisor}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-xs font-bold transition-all text-white border border-[#C89B3C]/30"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span className="hidden sm:inline">اقتراح</span>
          <span>ذكي</span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white transition-all active:scale-95 shadow-xs"
          title="محادثة واتساب سريعة"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
        </button>

        {/* Call */}
        <a
          href="tel:01284484868"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] transition-all"
          title="اتصال مباشر 01284484868"
        >
          <Phone className="w-4 h-4 text-[#C89B3C]" />
        </a>

        {/* Cart */}
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C89B3C] hover:bg-[#b88c32] text-[#221B17] font-black text-xs shadow-md transition-all active:scale-95"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>السلة</span>
          {cartCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#5C1027] text-white text-[10px] flex items-center justify-center font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
