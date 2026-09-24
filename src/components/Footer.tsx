import React from "react";
import { Phone, MessageCircle, MapPin, ShieldCheck, Heart } from "lucide-react";
import { CelebreLogo } from "./CelebreLogo";

interface FooterProps {
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy }) => {
  return (
    <footer className="bg-[#221B17] text-[#FAF7F2] pt-14 pb-8 border-t border-[#3B3029]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#3B3029]">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-right">
            <CelebreLogo
              size="lg"
              showSlogan={true}
              showEnglishSubtitles={true}
              sloganText="سيلبر شريك مؤسس لمناساباتك السعيدة"
              className="items-center md:items-start"
            />
            <p className="text-xs text-[#A89D93] mt-4 leading-relaxed max-w-sm">
              العلامة الرسمية الرائدة في تقديم وتنسيق عبوات الكاترنج الفاخرة للافراح وكتب الكتاب بالمساجد والقاعات في بني سويف ومصر. علب كرتونية مذهبة محكمة الإغلاق تضمن أسرع وأرقى توزيع لضيوفك.
            </p>
            <div className="flex items-center gap-3 mt-4 text-xs text-[#C89B3C] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>جودة ونظافة فندقية معتمدة • حد أدنى 50 وجبة</span>
            </div>
          </div>

          {/* Quick Contact & Coverage */}
          <div className="md:col-span-4 space-y-3 text-center md:text-right">
            <h4 className="font-bold text-sm text-[#F4EEDB] mb-4">التواصل والخدمة</h4>
            <div className="space-y-2.5 text-xs text-[#C4B7AA]">
              <a
                href="tel:01284484868"
                className="flex items-center justify-center md:justify-start gap-2 hover:text-[#C89B3C] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#C89B3C]" />
                <span dir="ltr">01284484868</span>
                <span className="text-[10px] bg-[#5C1027] px-2 py-0.5 rounded-full text-white">اتصال مباشر</span>
              </a>

              <a
                href="https://wa.me/201284484868"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 hover:text-[#25D366] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>واتساب خدمة العملاء وتأكيد الحجوزات</span>
              </a>

              <div className="flex items-center justify-center md:justify-start gap-2 text-stone-400">
                <MapPin className="w-4 h-4 text-[#C89B3C]" />
                <span>المقر الرئيسي: محافظة بني سويف (مدينة بني سويف - شرق النيل)</span>
              </div>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="md:col-span-3 space-y-3 text-center md:text-right">
            <h4 className="font-bold text-sm text-[#F4EEDB] mb-4">ضمانات سيلبر</h4>
            <ul className="space-y-2 text-xs text-[#A89D93]">
              <li>✓ علب كرتونية مذهبة محكمة الإغلاق</li>
              <li>✓ ساندوتشات طازجة يوم الحفل</li>
              <li>✓ جاتوه مغلف مثلّث وعصير بخيرة</li>
              <li>✓ التزام دقيق بمواعيد التسليم</li>
              <li>✓ مرونة كاملة في الكميات (أكثر من 300 وجبة)</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6E65]">
          <div className="flex items-center gap-1">
            <span>جميع الحقوق محفوظة لـ Celebre سيلبر © {new Date().getFullYear()}</span>
            <span>•</span>
            <span className="text-[#C89B3C]">شريك مؤسس لمناساباتك السعيدة</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[#FAF7F2] transition-colors underline"
            >
              سياسة الخصوصية والشروط
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
