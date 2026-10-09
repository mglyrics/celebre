import React from "react";
import { Phone, MessageCircle, Mail, MapPin, ShieldCheck, Heart, Sparkles } from "lucide-react";
import { CelebreLogo } from "../CelebreLogo";

interface PublicFooterProps {
  onNavigate: (page: "home" | "menu" | "booking") => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#1F1714] text-[#FAF7F2] border-t border-[#362720] mt-16 pt-12 pb-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <CelebreLogo size="xs" showSlogan={false} showEnglishSubtitles={false} />
              <div>
                <span className="font-['Cinzel',serif] font-black text-xl text-white tracking-wider block">
                  CÉLÈBRE CATERING
                </span>
                <span className="text-xs font-bold text-[#C89B3C]">
                  شريك مؤسس لمناسباتك السعيدة
                </span>
              </div>
            </div>

            <p className="text-xs text-[#D6C7B7] max-w-md leading-relaxed">
              سلسلة كاترنج متخصصة في إعداد وتجهيز علب وبوكسات الضيافة الفاخرة للأفراح والمناسبات وحفلات كتب الكتاب وتوزيعات المساجد والمؤتمرات في جميع محافظات جمهورية مصر العربية.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#C89B3C] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>الموقع الرسمي المعتمد: https://celebre-eg.com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#C89B3C] border-b border-[#362720] pb-2">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-xs text-[#D6C7B7]">
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className="hover:text-white transition-colors"
                >
                  الصفحة الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("menu")}
                  className="hover:text-white transition-colors"
                >
                  قائمة الـ 18 عرض كاملة
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("booking")}
                  className="hover:text-white transition-colors"
                >
                  نموذج الحجز المبدئي (بدون دفع)
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#C89B3C] border-b border-[#362720] pb-2">
              التواصل والاستفسارات
            </h4>
            <div className="space-y-2.5 text-xs text-[#D6C7B7]">
              <a
                href="tel:01284484868"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-[#C89B3C]" />
                <span dir="ltr">01284484868</span>
              </a>

              <a
                href="https://wa.me/201284484868"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#25D366] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>واتساب الإدارة المباشر</span>
              </a>

              <div className="flex items-center gap-2 text-[#D6C7B7]">
                <MapPin className="w-4 h-4 text-[#C89B3C]" />
                <span>القاهرة • الجيزة • بني سويف • كافة المحافظات</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line - STRICTLY NO ADMIN URL */}
        <div className="pt-8 border-t border-[#362720] text-center text-xs text-[#8C7D73] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} CÉLÈBRE Catering Egypt. جميع الحقوق محفوظة لعلامة سيليبر.
          </p>
          <p className="text-[11px] text-[#A8988B]">
            الدومين الرسمي المعتمد: https://celebre-eg.com
          </p>
        </div>
      </div>
    </footer>
  );
};
