import React, { useState, useEffect } from 'react';
import { CelebreLogo } from './CelebreLogo';
import { 
  Phone, 
  ShoppingBag, 
  Sparkles, 
  Menu, 
  X, 
  MessageCircle, 
  Calculator, 
  Clock, 
  Flame,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { OrderItem } from '../types';

interface NavbarProps {
  cartItems?: OrderItem[];
  cartCount?: number;
  onOpenCart: () => void;
  onOpenAdvisor: () => void;
  onOpenCalculator?: () => void;
  onOpenOrdersHistory?: () => void;
  onOpenHistory?: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItems,
  cartCount,
  onOpenCart,
  onOpenAdvisor,
  onOpenCalculator,
  onOpenOrdersHistory,
  onOpenHistory,
  onOpenPrivacyPolicy,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalItemsCount = typeof cartCount === 'number'
    ? cartCount
    : (cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOrdersHistory = onOpenOrdersHistory || onOpenHistory || (() => {});

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCalculator = onOpenCalculator || (() => scrollToSection('calculator-section'));

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Top Luxury Gold & Burgundy Ribbon Bar */}
      <div className="bg-gradient-to-r from-[#420A1A] via-[#5C1027] to-[#420A1A] text-[#F9EBD2] text-xs py-1.5 px-4 border-b border-[#C89B3C]/30 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-right font-medium">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5C06E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
            </span>
            <span>تجهيز وتوصيل عبوات الكاترنج الفاخرة للأفراح وكتب الكتاب في بني سويف (مدينة بني سويف وشرق النيل)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <a 
              href="tel:01284484868" 
              className="flex items-center gap-1.5 hover:text-[#FFDF9E] transition-colors font-mono font-bold"
            >
              <Phone className="w-3.5 h-3.5 text-[#E5C06E]" />
              <span dir="ltr">01284484868</span>
            </a>
            <span className="text-[#C89B3C]/50">|</span>
            <a 
              href="https://wa.me/201284484868?text=مرحباً%20سيلبر%2C%20أود%20الاستفسار%20عن%20باقات%20عبوات%20الكاترنج%20للمناسبات" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#54E38E] hover:text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب مباشر</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Navbar */}
      <div className={`backdrop-blur-md transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#FAF7F2]/95 shadow-md border-b border-[#E8DFC9] py-2' 
          : 'bg-[#FAF7F2]/80 border-b border-[#EDE4D3] py-3'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          
          {/* Brand Logo Link */}
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-right focus:outline-none flex items-center gap-2 group cursor-pointer"
          >
            <CelebreLogo variant="compact" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 font-medium text-sm text-[#3D352E]">
            <button 
              onClick={() => scrollToSection('packages-section')}
              className="hover:text-[#721832] transition-colors flex items-center gap-1 py-1 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-[#C89B3C]" />
              <span>باقات المناسبات</span>
            </button>

            <button 
              onClick={handleCalculator}
              className="hover:text-[#721832] transition-colors flex items-center gap-1 py-1 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-[#C89B3C]" />
              <span>حاسبة المعازيم والميزانية</span>
            </button>

            <button 
              onClick={onOpenAdvisor}
              className="hover:text-[#721832] transition-colors flex items-center gap-1 py-1 text-[#8C5E13] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
              <span>المستشار الذكي</span>
            </button>

            <button 
              onClick={() => scrollToSection('gallery-section')}
              className="hover:text-[#721832] transition-colors py-1 cursor-pointer"
            >
              معرض الصور
            </button>

            <button 
              onClick={() => scrollToSection('testimonials-section')}
              className="hover:text-[#721832] transition-colors py-1 cursor-pointer"
            >
              آراء العملاء
            </button>

            <button 
              onClick={() => scrollToSection('faq-section')}
              className="hover:text-[#721832] transition-colors py-1 cursor-pointer"
            >
              الأسئلة الشائعة
            </button>

            {onOpenPrivacyPolicy && (
              <button 
                onClick={onOpenPrivacyPolicy}
                className="hover:text-[#721832] transition-colors py-1 cursor-pointer flex items-center gap-1 text-[#5C1027]"
                title="سياسة الخصوصية وشروط التعاقد"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>سياسة الخصوصية</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Orders History shortcut */}
            <button
              onClick={handleOrdersHistory}
              title="متابعة الحجوزات والفواتير"
              className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#5C1027] bg-[#F4ECDC] hover:bg-[#EBDDC4] rounded-xl border border-[#D9C8A8] transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#C89B3C]" />
              <span>طلباتي</span>
            </button>

            {/* Shopping Bag / Order Drawer Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#5C1027] text-white hover:bg-[#721832] transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#E5C06E]" />
              <span className="font-semibold text-xs sm:text-sm">طلبك</span>
              {totalItemsCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-[#D4AF37] text-[#3B0715] font-black text-xs rounded-full">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#5C1027] hover:bg-[#EFE8DA] transition-colors focus:outline-none cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF7F2] border-b border-[#E3D7C1] shadow-xl px-4 pt-3 pb-6 animate-in slide-in-from-top duration-200">
          {/* Brand header inside mobile menu */}
          <div className="mb-4 pb-3 border-b border-[#E8DEC9] flex items-center justify-between">
            <CelebreLogo variant="compact" />
            <div className="text-left text-[11px] font-bold text-[#5C1027]">
              <span>الخط الساخن: </span>
              <a href="tel:01284484868" className="font-mono text-[#8C5E13] underline" dir="ltr">01284484868</a>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 font-medium text-sm text-[#2C241E]">
            <button
              onClick={() => scrollToSection('packages-section')}
              className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-[#F2E8D7] text-right"
            >
              <Flame className="w-4 h-4 text-[#C89B3C]" />
              <span>باقات المناسبات الجاهزة</span>
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); handleCalculator(); }}
              className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-[#F2E8D7] text-right"
            >
              <Calculator className="w-4 h-4 text-[#C89B3C]" />
              <span>حاسبة المعازيم والميزانية</span>
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAdvisor(); }}
              className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-[#F2E8D7] text-[#8C5E13] text-right"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>مستشار سيلبر الذكي (AI)</span>
            </button>

            <button
              onClick={() => scrollToSection('gallery-section')}
              className="p-2.5 rounded-lg hover:bg-[#F2E8D7] text-right"
            >
              معرض الصور والتغليف
            </button>

            <button
              onClick={() => scrollToSection('testimonials-section')}
              className="p-2.5 rounded-lg hover:bg-[#F2E8D7] text-right"
            >
              آراء وتجارب العملاء
            </button>

            <button
              onClick={() => scrollToSection('faq-section')}
              className="p-2.5 rounded-lg hover:bg-[#F2E8D7] text-right"
            >
              الأسئلة الشائعة
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); handleOrdersHistory(); }}
              className="p-2.5 rounded-lg bg-[#F0E6D2] text-[#5C1027] font-semibold text-right flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#C89B3C]" />
              <span>سجل الحجوزات والفواتير</span>
            </button>

            {onOpenPrivacyPolicy && (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenPrivacyPolicy(); }}
                className="p-2.5 rounded-lg bg-[#FAF0E1] text-[#5C1027] font-semibold text-right flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                <span>سياسة الخصوصية وشروط التعاقد</span>
              </button>
            )}

            <div className="pt-3 mt-2 border-t border-[#E3D7C1] flex flex-col gap-2">
              <a
                href="tel:01284484868"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5C1027] text-white font-bold text-sm shadow-sm"
              >
                <Phone className="w-4 h-4 text-[#E5C06E]" />
                <span>اتصل بنا فوراً: 01284484868</span>
              </a>
              <a
                href="https://wa.me/201284484868?text=مرحباً%20سيلبر%2C%20أود%20الاستفسار%20عن%20باقات%20عبوات%20الكاترنج%20للمناسبات"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>محادثة واتساب سريعة</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
