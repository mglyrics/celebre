import React from "react";
import { Phone, MessageCircle, MapPin, ShieldCheck, Heart } from "lucide-react";
import { CelebreLogo } from "./CelebreLogo";

interface FooterProps {
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy }) => {
  return (
    <footer className="bg-[#221B17] text-[#FAF7F2] pt-14 pb-28 sm:pb-24 lg:pb-12 border-t border-[#3B3029]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#3B3029]">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-right">
            <CelebreLogo
              size="lg"
              showSlogan={true}
              showEnglishSubtitles={true}
              sloganText="سيلبر شريك مؤسس لمناسباتك السعيدة"
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

              {/* Official Social Media Channels */}
              <div className="pt-3 border-t border-[#3B3029]/80 space-y-2">
                <span className="text-[11px] font-bold text-[#C89B3C] block">
                  حسابات سيلبر الرسمية:
                </span>
                <div className="space-y-1.5 font-mono text-[11px]" dir="ltr">
                  <a
                    href="https://facebook.com/celebre.catering"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-start gap-2 text-[#C4B7AA] hover:text-[#1877F2] transition-colors group"
                  >
                    <span className="w-5 h-5 rounded-md bg-white/10 group-hover:bg-[#1877F2] text-white flex items-center justify-center transition-all shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </span>
                    <span className="group-hover:underline">facebook.com/celebre.catering</span>
                  </a>

                  <a
                    href="https://www.tiktok.com/@celebre.catering"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-start gap-2 text-[#C4B7AA] hover:text-[#FF3B5C] transition-colors group"
                  >
                    <span className="w-5 h-5 rounded-md bg-white/10 group-hover:bg-black text-white flex items-center justify-center transition-all shrink-0">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.87-4.48V8.7a8.28 8.28 0 0 0 4.9 1.58V6.83a4.86 4.86 0 0 1-1-.14z" /></svg>
                    </span>
                    <span className="group-hover:underline">tiktok.com/@celebre.catering</span>
                  </a>

                  <a
                    href="https://instagram.com/celebre.catering"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-start gap-2 text-[#C4B7AA] hover:text-[#FF6584] transition-colors group"
                  >
                    <span className="w-5 h-5 rounded-md bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-[#F58529] group-hover:via-[#DD2A7B] group-hover:to-[#8134AF] text-white flex items-center justify-center transition-all shrink-0">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                    </span>
                    <span className="group-hover:underline">instagram.com/@celebre.catering</span>
                  </a>
                </div>
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
            <span className="text-[#C89B3C]">شريك مؤسس لمناسباتك السعيدة</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[#FAF7F2] transition-colors underline cursor-pointer"
            >
              سياسة الخصوصية والشروط
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
