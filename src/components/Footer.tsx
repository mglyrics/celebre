import React from 'react';
import { CelebreLogo } from './CelebreLogo';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Heart, 
  Sparkles, 
  ShieldCheck,
  Mail
} from 'lucide-react';

interface FooterProps {
  onOpenPrivacyPolicy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacyPolicy }) => {
  return (
    <footer className="bg-[#2C0A15] text-[#EAD8BD] border-t-2 border-[#C89B3C] text-right">
      
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="text-right">
              <CelebreLogo variant="white" showPhone={false} />
            </div>
            <p className="text-xs text-[#D1BFA8] leading-relaxed">
              العلامة الرائدة في مصر لتجهيز وتوريد عبوات الكاترنج الفاخرة لـ <strong className="text-[#FFDF9E]">كتب الكتاب، حفلات الزفاف، الخطوبة، السبوع، والفعاليات الاجتماعية الراقية</strong> بأعلى معايير الطعم والتغليف.
            </p>
            
            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
              <span className="text-[11px] text-[#A8E6B2] font-semibold">استقبال وتجهيز الطلبات متاح طوال الأسبوع</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#FFDF9E] border-b border-[#5C1027] pb-2">
              باقات المناسبات
            </h4>
            <ul className="space-y-2 text-xs text-[#D1BFA8]">
              <li>
                <a href="#packages-section" className="hover:text-[#FFDF9E] transition-colors">
                  • باقة كتب الكتاب الملكية (Royal Box)
                </a>
              </li>
              <li>
                <a href="#packages-section" className="hover:text-[#FFDF9E] transition-colors">
                  • باقة الزفاف والخطوبة الماسية (Diamond Gala)
                </a>
              </li>
              <li>
                <a href="#packages-section" className="hover:text-[#FFDF9E] transition-colors">
                  • باقة الحنة والخطوبة البهيجة (Velvet Henna)
                </a>
              </li>
              <li>
                <a href="#packages-section" className="hover:text-[#FFDF9E] transition-colors">
                  • باقة السبوع والعقيقة المباركة (Royal Baby)
                </a>
              </li>
              <li>
                <a href="#packages-section" className="hover:text-[#FFDF9E] transition-colors">
                  • علبة شيكولاتة باسمك (Custom Chocolate Box)
                </a>
              </li>
              {onOpenPrivacyPolicy && (
                <li className="pt-2 border-t border-[#4A0A1D]">
                  <button
                    onClick={onOpenPrivacyPolicy}
                    className="text-[#FFDF9E] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>سياسة الخصوصية وشروط التعاقد</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Coverage Locations */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#FFDF9E] border-b border-[#5C1027] pb-2">
              مناطق التغطية والتوصيل (بني سويف)
            </h4>
            <div className="text-xs text-[#D1BFA8] space-y-2 leading-relaxed">
              <div className="text-[#FFDF9E] font-semibold text-[11px]">
                🚗 التغطية الحالية متاحة حصرياً داخل نطاق بني سويف:
              </div>
              <div className="bg-[#2A0611] p-2.5 rounded-xl border border-[#C89B3C]/30">
                <div className="text-white font-bold mb-0.5">📍 مدينة بني سويف:</div>
                <div className="text-[#D1BFA8] text-[11px]">توصيل مباشر لكافة المساجد والقاعات والمنازل ونوادي المدينة.</div>
              </div>
              <div className="bg-[#2A0611] p-2.5 rounded-xl border border-[#C89B3C]/30">
                <div className="text-white font-bold mb-0.5">📍 بني سويف شرق النيل:</div>
                <div className="text-[#D1BFA8] text-[11px]">تغطية شاملة لقاعات وفنادق ومناطق شرق النيل وبني سويف الجديدة.</div>
              </div>
            </div>
          </div>

          {/* Column 4: Direct Contact & Hotline */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#FFDF9E] border-b border-[#5C1027] pb-2">
              التواصل والحجز المباشر
            </h4>
            
            <div className="space-y-3">
              <a
                href="tel:01284484868"
                className="p-3 rounded-2xl bg-[#4A0A1D] border border-[#C89B3C]/40 flex items-center gap-3 hover:bg-[#5C1027] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#2C0A15] flex items-center justify-center font-bold">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#D1BFA8]">الخط المباشر للحجز:</div>
                  <div className="text-base font-bold font-mono text-[#FFDF9E] group-hover:underline" dir="ltr">
                    01284484868
                  </div>
                </div>
              </a>

              <a
                href="https://wa.me/201284484868?text=مرحباً%20سيلبر%2C%20أود%20الاستفسار%20عن%20باقات%20عبوات%20الكاترنج%20للمناسبات"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-[#1E7E34]/40 border border-[#25D366]/40 flex items-center gap-3 hover:bg-[#1E7E34]/70 transition-all text-white"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#A8E6B2]">واتساب المبيعات السريع:</div>
                  <div className="text-xs font-bold text-white">دردشة فورية واستلام المنيو</div>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#1C050D] py-4 border-t border-[#420A1A] text-center text-xs text-[#A89680]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} لعلامة <strong className="text-[#FFDF9E] font-['Playfair_Display']">Celebre</strong> (سيلبر لكاترنج الأفراح والمناسبات).
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {onOpenPrivacyPolicy && (
              <button
                onClick={onOpenPrivacyPolicy}
                className="text-[#E5C06E] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>سياسة الخصوصية والشروط</span>
              </button>
            )}
            <span className="hidden sm:inline text-white/20">|</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span>صُنع بشغف لضيافة مصرية تليق بأفراحكم</span>
              <Heart className="w-3.5 h-3.5 text-[#E5C06E] fill-[#E5C06E]" />
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};
