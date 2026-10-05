import React, { useState } from "react";
import { Phone, MessageCircle, ShoppingBag, Sparkles, Menu, X, Calculator, Truck, FileDown, ShieldCheck } from "lucide-react";
import { CelebreLogo } from "./CelebreLogo";

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdvisor: () => void;
  onOpenCalculator: () => void;
  onScrollToPackages: () => void;
  onOpenMenu?: () => void;
  onScrollToBoxMix?: () => void;
  onScrollToBoxSandwich?: () => void;
  onSecretAdminTrigger?: () => void;
}

// Social Media SVG Icons (Facebook, TikTok, Instagram)
const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.87-4.48V8.7a8.28 8.28 0 0 0 4.9 1.58V6.83a4.86 4.86 0 0 1-1-.14z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenAdvisor,
  onOpenCalculator,
  onScrollToPackages,
  onOpenMenu,
  onScrollToBoxMix,
  onScrollToBoxSandwich,
  onSecretAdminTrigger
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const clickCountRef = React.useRef(0);
  const clickTimeoutRef = React.useRef<any>(null);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (onSecretAdminTrigger) {
        onSecretAdminTrigger();
      }
      return;
    }
    clickTimeoutRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1200);
    onScrollToPackages();
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/201284484868?text=السلام%20عليكم،%20أود%20الاستفسار%20عن%20عبوات%20كاترنج%20سيلبر%20للمناسبات", "_blank");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD1] shadow-xs transition-all">
      {/* 1. Modern Social Media Ribbon in Header */}
      <div className="bg-[#1F1714] text-[#FAF7F2] border-b border-[#362720] py-1.5 px-4 sm:px-6 lg:px-8 text-xs select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
          {/* Label */}
          <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold text-[#D6C7B7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C] animate-pulse" />
            <span>حسابات سيلبر الرسمية:</span>
          </div>

          {/* Social Links with Icons & URLs */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-0.5" dir="ltr">
            {/* Facebook */}
            <a
              href="https://facebook.com/celebre.catering"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-[#1877F2]/20 border border-white/10 hover:border-[#1877F2]/50 text-[#FAF7F2] hover:text-[#5890FF] transition-all text-[11px] sm:text-xs font-mono group whitespace-nowrap shadow-2xs"
              title="صفحة سيلبر على فيسبوك: facebook.com/celebre.catering"
            >
              <span className="w-4 h-4 rounded-sm bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                <FacebookIcon className="w-2.5 h-2.5 fill-current" />
              </span>
              <span className="group-hover:underline">facebook.com/celebre.catering</span>
            </a>

            <span className="text-white/20 select-none hidden md:inline">•</span>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@celebre.catering"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-black/40 border border-white/10 hover:border-[#EE1D52]/50 text-[#FAF7F2] hover:text-[#FF3B5C] transition-all text-[11px] sm:text-xs font-mono group whitespace-nowrap shadow-2xs"
              title="حساب سيلبر على تيك توك: tiktok.com/@celebre.catering"
            >
              <span className="w-4 h-4 rounded-sm bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                <TikTokIcon className="w-2.5 h-2.5 fill-current" />
              </span>
              <span className="group-hover:underline">tiktok.com/@celebre.catering</span>
            </a>

            <span className="text-white/20 select-none hidden md:inline">•</span>

            {/* Instagram */}
            <a
              href="https://instagram.com/celebre.catering"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-[#E4405F]/20 border border-white/10 hover:border-[#E4405F]/50 text-[#FAF7F2] hover:text-[#FF6584] transition-all text-[11px] sm:text-xs font-mono group whitespace-nowrap shadow-2xs"
              title="حساب سيلبر على انستجرام: instagram.com/@celebre.catering"
            >
              <span className="w-4 h-4 rounded-sm bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <InstagramIcon className="w-2.5 h-2.5" />
              </span>
              <span className="group-hover:underline">instagram.com/@celebre.catering</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Top announcement bar with 'التوصيل غير مشمول' */}
      <div className="bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] text-white py-1.5 px-4 sm:px-6 lg:px-8 text-xs sm:text-sm font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C89B3C] animate-ping" />
            <span className="font-semibold text-[#F4EEDB]">
              سيلبر شريك مؤسس لمناسباتك السعيدة
            </span>
            <span className="inline-flex items-center gap-1 bg-[#C89B3C] text-[#221B17] font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-xs">
              <Truck className="w-3 h-3 text-[#5C1027]" />
              <span>التوصيل غير مشمول</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
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
              علب كرتونية فاخرة
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Official Celebre Logo Emblem with Clean Horizontal Title */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group py-1"
          >
            <CelebreLogo
              size="xs"
              showSlogan={false}
              showEnglishSubtitles={false}
              className="items-center"
            />
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="font-['Cinzel',serif] font-black text-lg sm:text-xl text-[#5C1027] tracking-wider group-hover:text-[#721832] transition-colors">
                  CÉLÈBRE
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#C89B3C]/15 text-[#8C6D28] border border-[#C89B3C]/30 hidden md:inline-block">
                  كاترنج
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-[#8C6D28] -mt-0.5">
                شريك مؤسس لمناسباتك السعيدة
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[#221B17] font-semibold text-sm">
            {/* Dual Direct Category Navigation */}
            <div className="flex items-center gap-1.5 bg-[#F4EEDB]/60 p-1 rounded-xl border border-[#C89B3C]/40">
              <button
                type="button"
                onClick={() => {
                  if (onScrollToBoxMix) onScrollToBoxMix();
                  else {
                    const el = document.getElementById("section-box-mix");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    else onScrollToPackages();
                  }
                }}
                className="hover:text-[#5C1027] hover:bg-white transition-all py-1 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-black text-[#5C1027]"
                title="الانتقال المباشر لقائمة عروض بوكس ميكس (12 عرض)"
              >
                <span>🍰 بوكس ميكس</span>
                <span className="text-[10px] bg-[#5C1027] text-white px-1.5 py-0.2 rounded-full font-bold">12</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onScrollToBoxSandwich) onScrollToBoxSandwich();
                  else {
                    const el = document.getElementById("section-box-sandwich");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    else onScrollToPackages();
                  }
                }}
                className="hover:text-[#2A170F] hover:bg-white transition-all py-1 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-black text-[#2A170F]"
                title="الانتقال المباشر لقائمة عروض بوكس ساندوتش (6 عروض)"
              >
                <span>🥪 بوكس ساندوتش</span>
                <span className="text-[10px] bg-[#C89B3C] text-[#221B17] px-1.5 py-0.2 rounded-full font-bold">6</span>
              </button>
            </div>
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
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenMenu && (
              <button
                type="button"
                onClick={onOpenMenu}
                className="inline-flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#F4EEDB] text-[#5C1027] border border-[#C89B3C]/60 text-xs sm:text-sm font-black px-3 py-2 rounded-xl shadow-2xs hover:shadow-xs transition-all active:scale-95"
                title="تحميل منيو عروض ووجبات كاترنج سيلبر بصيغة PDF أو صورة JPG"
              >
                <FileDown className="w-4 h-4 text-[#C89B3C]" />
                <span className="hidden md:inline">تحميل المنيو (PDF/JPG)</span>
                <span className="md:hidden">المنيو 📄</span>
              </button>
            )}

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
          {onOpenMenu && (
            <button
              onClick={() => {
                onOpenMenu();
                setMobileMenuOpen(false);
              }}
              className="w-full text-right font-black text-[#5C1027] py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#F4EEDB] to-white border border-[#C89B3C]/50 flex items-center justify-between shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-[#C89B3C]" />
                <span>تحميل منيو العروض (PDF / JPG)</span>
              </span>
              <span className="text-[10px] bg-[#5C1027] text-white px-2 py-0.5 rounded-full font-bold">مُحدّث</span>
            </button>
          )}

          {/* Direct Category Links in Mobile */}
          <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
            <button
              type="button"
              onClick={() => {
                if (onScrollToBoxMix) onScrollToBoxMix();
                else {
                  const el = document.getElementById("section-box-mix");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  else onScrollToPackages();
                }
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#5C1027]/30 text-right"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#5C1027]">🍰 بوكس ميكس</span>
                <span className="text-[10px] bg-[#5C1027] text-white px-1.5 py-0.2 rounded-full font-bold">12 عرض</span>
              </div>
              <p className="text-[10px] text-[#7A6E65] mt-0.5 truncate">أول 12 عرض رسمي</p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onScrollToBoxSandwich) onScrollToBoxSandwich();
                else {
                  const el = document.getElementById("section-box-sandwich");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  else onScrollToPackages();
                }
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#2A170F]/30 text-right"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#2A170F]">🥪 بوكس ساندوتش</span>
                <span className="text-[10px] bg-[#C89B3C] text-[#221B17] px-1.5 py-0.2 rounded-full font-bold">6 عروض</span>
              </div>
              <p className="text-[10px] text-[#7A6E65] mt-0.5 truncate">العروض 13 إلى 18</p>
            </button>
          </div>

          <button
            onClick={() => {
              onScrollToPackages();
              setMobileMenuOpen(false);
            }}
            className="w-full text-right font-bold text-[#221B17] py-2 px-3 rounded-lg hover:bg-[#EFE8DD] flex items-center justify-between"
          >
            <span>استعراض كافة العروض الـ 18</span>
            <span className="text-xs bg-[#5C1027] text-white px-2 py-0.5 rounded-full">الكل</span>
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

          {/* Official Social Media Channels in Mobile Menu */}
          <div className="pt-2 border-t border-[#E8DFD1] space-y-1.5 text-right">
            <span className="text-[11px] font-bold text-[#8C6D28] block px-1">
              حسابات سيلبر الرسمية:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <a
                href="https://facebook.com/celebre.catering"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#1877F2] text-xs font-bold text-[#221B17] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shadow-xs">
                    <FacebookIcon className="w-3.5 h-3.5 fill-current" />
                  </span>
                  <span>فيسبوك (Facebook)</span>
                </div>
                <span dir="ltr" className="text-[11px] font-mono text-[#7A6E65] group-hover:text-[#1877F2]">facebook.com/celebre.catering</span>
              </a>

              <a
                href="https://www.tiktok.com/@celebre.catering"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-black text-xs font-bold text-[#221B17] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
                    <TikTokIcon className="w-3.5 h-3.5 fill-current" />
                  </span>
                  <span>تيك توك (TikTok)</span>
                </div>
                <span dir="ltr" className="text-[11px] font-mono text-[#7A6E65] group-hover:text-black">tiktok.com/@celebre.catering</span>
              </a>

              <a
                href="https://instagram.com/celebre.catering"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#E4405F] text-xs font-bold text-[#221B17] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shadow-xs">
                    <InstagramIcon className="w-3.5 h-3.5" />
                  </span>
                  <span>انستجرام (Instagram)</span>
                </div>
                <span dir="ltr" className="text-[11px] font-mono text-[#7A6E65] group-hover:text-[#E4405F]">instagram.com/@celebre.catering</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
