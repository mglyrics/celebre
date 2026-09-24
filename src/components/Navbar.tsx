import React, { useState } from "react";
import { Phone, MessageCircle, ShoppingBag, Sparkles, Menu, X, Calculator, ShieldCheck } from "lucide-react";
import { CelebreLogo } from "./CelebreLogo";

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdvisor: () => void;
  onOpenCalculator: () => void;
  onScrollToPackages: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenAdvisor,
  onOpenCalculator,
  onScrollToPackages
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWhatsApp = () => {
    window.open("https://wa.me/201284484868?text=السلام%20عليكم،%20أود%20الاستفسار%20عن%20عبوات%20كاترنج%20سيلبر%20للمناسبات", "_blank");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD1] shadow-xs transition-all">
      {/* Top golden announcement bar */}
      <div className="bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] text-white py-1.5 px-4 text-xs sm:text-sm font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C89B3C] animate-ping" />
            <span className="font-semibold text-[#F4EEDB]">
              سيلبر شريك مؤسس لمناساباتك السعيدة
            </span>
            <span className="hidden md:inline text-xs text-[#E8DFD1]/80">
              | جودة وضيافة تشرفك أمام ضيوفك في بني سويف ومصر
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              href="tel:01284484868"
              className="flex items-center gap-1 text-[#F4EEDB] hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span dir="ltr">01284484868</span>
            </a>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[#C89B3C]">
              <ShieldCheck className="w-3.5 h-3.5" />
              علب كرتونية مذهبة محكمة الإغلاق
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <CelebreLogo size="md" showSlogan={true} sloganText="سيلبر شريك مؤسس لمناساباتك السعيدة" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[#221B17] font-semibold text-sm">
            <button
              onClick={onScrollToPackages}
              className="hover:text-[#5C1027] transition-colors py-2 flex items-center gap-1.5"
            >
              <span>قائمة الوجبات والعبوات</span>
              <span className="text-[10px] bg-[#5C1027]/10 text-[#5C1027] px-2 py-0.5 rounded-full font-bold">12 وجبة</span>
            </button>
            <button
              onClick={onOpenCalculator}
              className="hover:text-[#5C1027] transition-colors py-2 flex items-center gap-1 text-[#4A3E38]"
            >
              <Calculator className="w-4 h-4 text-[#C89B3C]" />
              <span>حاسبة ميزانية المناسبة</span>
            </button>
            <button
              onClick={onOpenAdvisor}
              className="hover:text-[#5C1027] transition-colors py-2 flex items-center gap-1.5 text-[#5C1027] bg-[#5C1027]/5 px-3 py-1.5 rounded-lg border border-[#5C1027]/15"
            >
              <Sparkles className="w-4 h-4 text-[#C89B3C]" />
              <span>خبير الضيافة الذكي</span>
            </button>
            <a
              href="#testimonials"
              className="hover:text-[#5C1027] transition-colors py-2 text-[#4A3E38]"
            >
              آراء العملاء
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleWhatsApp}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>واتساب سريع</span>
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-[#5C1027] hover:bg-[#721832] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              aria-label="سلة الطلبات"
            >
              <ShoppingBag className="w-4 h-4 text-[#C89B3C]" />
              <span className="hidden sm:inline">سلة الطلب</span>
              {cartCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-black bg-[#C89B3C] text-[#221B17] rounded-full shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#EFE8DD] text-[#221B17] hover:bg-[#E5DBCB]"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF7F2] border-b border-[#E8DFD1] px-4 py-4 space-y-3">
          <button
            onClick={() => {
              onScrollToPackages();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right font-bold text-[#221B17] py-2 px-3 rounded-lg hover:bg-[#EFE8DD] flex items-center justify-between"
          >
            <span>قائمة الوجبات والعبوات المعتمدة (12 وجبة)</span>
            <span className="text-xs bg-[#5C1027] text-white px-2 py-0.5 rounded-full">المنيو</span>
          </button>
          <button
            onClick={() => {
              onOpenCalculator();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right font-bold text-[#4A3E38] py-2 px-3 rounded-lg hover:bg-[#EFE8DD] flex items-center gap-2"
          >
            <Calculator className="w-4 h-4 text-[#C89B3C]" />
            <span>حاسبة تكاليف وميزانية المناسبة</span>
          </button>
          <button
            onClick={() => {
              onOpenAdvisor();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right font-bold text-[#5C1027] py-2 px-3 rounded-lg bg-[#5C1027]/10 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#C89B3C]" />
            <span>مستشار الضيافة الذكي (اقتراح باقة فورية)</span>
          </button>
          <div className="pt-2 border-t border-[#E8DFD1] flex gap-2">
            <button
              onClick={() => {
                handleWhatsApp();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-2.5 rounded-xl text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>محادثة واتساب</span>
            </button>
            <a
              href="tel:01284484868"
              className="flex-1 flex items-center justify-center gap-2 bg-[#5C1027] text-white font-bold py-2.5 rounded-xl text-sm"
            >
              <Phone className="w-4 h-4 text-[#C89B3C]" />
              <span>اتصال مباشر</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
