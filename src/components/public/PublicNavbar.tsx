import React, { useState } from "react";
import { Phone, MessageCircle, UtensilsCrossed, CalendarCheck, Sparkles, Menu, X, ShieldCheck } from "lucide-react";
import { CelebreLogo } from "../CelebreLogo";

interface PublicNavbarProps {
  activePage: "home" | "menu" | "details" | "booking" | "confirmation";
  onNavigate: (page: "home" | "menu" | "booking") => void;
  selectedMenuCode?: string | null;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  activePage,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWhatsApp = () => {
    window.open(
      "https://wa.me/201284484868?text=السلام%20عليكم،%20أود%20الاستفسار%20عن%20عروض%20كاترنج%20سيليبر%20للمناسبات",
      "_blank"
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD1] shadow-xs transition-all">
      {/* 1. Top Ribbon */}
      <div className="bg-[#1F1714] text-[#FAF7F2] border-b border-[#362720] py-1.5 px-4 sm:px-6 lg:px-8 text-xs select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#D6C7B7]">
            <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse" />
            <span>الموقع الرسمي لـ CÉLÈBRE Catering | مصر</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="hidden sm:inline text-[#C89B3C]">https://celebre-eg.com</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <a
              href="tel:01284484868"
              className="flex items-center gap-1.5 text-[#F4EEDB] hover:text-[#C89B3C] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span dir="ltr">01284484868</span>
            </a>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 text-[#25D366] hover:text-[#20ba59] font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>واتساب الإدارة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Brand Guarantee Sub-bar */}
      <div className="bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] text-white py-1 px-4 sm:px-6 lg:px-8 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span className="font-semibold text-[#F4EEDB]">
              تجهيز فندقي معقم - علب كرتونية ذهبية فاخرة محكمة الإغلاق لجميع المناسبات
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[#C89B3C] text-[11px] font-bold">
            <span>التوصيل متاح لكافة المحافظات</span>
            <span>•</span>
            <span>الحجز مبدئي مجاناً بدون دفع إلكتروني</span>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div
            onClick={() => onNavigate("home")}
            className="flex items-center gap-3 cursor-pointer group py-1"
          >
            <CelebreLogo size="xs" showSlogan={false} showEnglishSubtitles={false} />
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="font-['Cinzel',serif] font-black text-xl sm:text-2xl text-[#5C1027] tracking-wider group-hover:text-[#721832] transition-colors">
                  CÉLÈBRE
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#C89B3C]/15 text-[#8C6D28] border border-[#C89B3C]/30">
                  كاترنج فاخر
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#8C6D28]">
                شريك مؤسس لمناسباتك السعيدة
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-bold text-sm">
            <button
              onClick={() => onNavigate("home")}
              className={`transition-colors py-2 px-3 rounded-lg ${
                activePage === "home"
                  ? "text-[#5C1027] bg-[#721832]/10 font-black"
                  : "text-[#221B17] hover:text-[#5C1027] hover:bg-[#FAF7F2]"
              }`}
            >
              الرئيسية
            </button>

            <button
              onClick={() => onNavigate("menu")}
              className={`flex items-center gap-1.5 transition-colors py-2 px-3 rounded-lg ${
                activePage === "menu" || activePage === "details"
                  ? "text-[#5C1027] bg-[#721832]/10 font-black"
                  : "text-[#221B17] hover:text-[#5C1027] hover:bg-[#FAF7F2]"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-[#C89B3C]" />
              <span>قائمة العروض (18 وجبة)</span>
            </button>

            <button
              onClick={() => onNavigate("booking")}
              className={`flex items-center gap-1.5 transition-colors py-2 px-3 rounded-lg ${
                activePage === "booking" || activePage === "confirmation"
                  ? "text-[#5C1027] bg-[#721832]/10 font-black"
                  : "text-[#221B17] hover:text-[#5C1027] hover:bg-[#FAF7F2]"
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-[#C89B3C]" />
              <span>نموذج الحجز المبدئي</span>
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate("booking")}
              className="bg-gradient-to-r from-[#721832] to-[#5C1027] hover:from-[#5C1027] hover:to-[#430B1C] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
            >
              <CalendarCheck className="w-4 h-4 text-[#C89B3C]" />
              <span>احجز مناسبتك</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#221B17] hover:bg-[#F4EEDB] transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E8DFD1] px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          <button
            onClick={() => {
              onNavigate("home");
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right py-3 px-4 rounded-xl font-bold text-sm ${
              activePage === "home" ? "bg-[#721832] text-white" : "bg-white text-[#221B17]"
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => {
              onNavigate("menu");
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between ${
              activePage === "menu" ? "bg-[#721832] text-white" : "bg-white text-[#221B17]"
            }`}
          >
            <span>قائمة الوجبات الـ 18 كاملة</span>
            <UtensilsCrossed className="w-4 h-4 text-[#C89B3C]" />
          </button>
          <button
            onClick={() => {
              onNavigate("booking");
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between ${
              activePage === "booking" ? "bg-[#721832] text-white" : "bg-white text-[#221B17]"
            }`}
          >
            <span>نموذج الحجز المبدئي (بدون دفع)</span>
            <CalendarCheck className="w-4 h-4 text-[#C89B3C]" />
          </button>
          <div className="pt-2 border-t border-[#E8DFD1] flex gap-2">
            <button
              onClick={() => {
                handleWhatsApp();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>تواصل واتساب</span>
            </button>
            <a
              href="tel:01284484868"
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1F1714] text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4 text-[#C89B3C]" />
              <span>01284484868</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
