import React from 'react';
import { CelebreLogo } from './CelebreLogo';
import { 
  Sparkles, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Clock, 
  Award, 
  Layers, 
  ArrowLeft,
  Heart,
  CheckCircle2
} from 'lucide-react';
import brandedBoxImg from '../assets/images/celebre_branded_box_1788040428186.jpg';
import brandEmblemImg from '../assets/images/celebre_brand_emblem_1788040412193.jpg';
import royalBoxImg from '../assets/images/celebre_royal_box_1788037545297.jpg';

interface HeroProps {
  onExplorePackages: () => void;
  onOpenCustomizer: () => void;
  onOpenAdvisor: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExplorePackages,
  onOpenCustomizer,
  onOpenAdvisor,
}) => {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 md:py-20 bg-gradient-to-b from-[#FAF7F2] via-[#F4EEDB] to-[#FAF7F2]">
      {/* Decorative Gold & Velvet subtle ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-10 w-80 h-80 bg-[#5C1027]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Right Column (Text & CTAs in RTL) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-right">
            
            {/* Top Occasions Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3E7D3] border border-[#C89B3C]/50 text-[#5C1027] text-xs sm:text-sm font-semibold mb-5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C] animate-spin" style={{ animationDuration: '8s' }} />
              <span>عبوات الكاترنج الأولى للأفراح والمناسبات الراقية في مصر</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]" />
              <span className="font-['Playfair_Display'] font-bold text-[#8C6517]">Celebre</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2C0A15] leading-[1.3] tracking-tight mb-4">
              ضيافة تُشرفك في أهم لحظاتك..{' '}
              <span className="text-[#721832] inline-block relative">
                عبوات كاترنج فاخرة
                <svg className="absolute -bottom-2 right-0 w-full h-3 text-[#D4AF37]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0 15 Q50 0 100 15" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>{' '}
              تليق ببهجة أفراحكم
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[#554A41] leading-relaxed max-w-2xl mb-8">
              في <strong className="text-[#5C1027] font-semibold">سيلبر (Celebre)</strong>، نبتكر تجربة ضيافة استثنائية لـ <span className="text-[#8C5E13] font-medium">كتب الكتاب، حفلات الزفاف، الخطوبة، السبوع، والمناسبات العائلية</span>. نجمع بين أشهى المخبوزات والمقبلات الساخنة والحلويات مع تغليف ملكي فاخر بشعار سيلبر المعتمد وشريط ستان أنيق يُبهر ضيوفك.
            </p>

            {/* CTAs */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3.5 mb-8">
              <button
                onClick={onExplorePackages}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#5C1027] to-[#7E1D3B] text-white font-bold text-base shadow-lg shadow-[#5C1027]/25 hover:shadow-xl hover:shadow-[#5C1027]/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <span>استكشف باقات المناسبات</span>
                <ArrowLeft className="w-5 h-5 text-[#E5C06E]" />
              </button>

              <button
                onClick={onOpenCustomizer}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FAF1E3] border-2 border-[#C89B3C]/60 text-[#5C1027] font-bold text-base hover:bg-[#F3E5CD] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Layers className="w-5 h-5 text-[#C89B3C]" />
                <span>صمم عبوتك بنفسك</span>
              </button>

              <button
                onClick={onOpenAdvisor}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white border border-[#E0D3BC] text-[#8C5E13] font-semibold text-sm hover:bg-[#F9F5EE] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>المستشار الذكي (AI)</span>
              </button>
            </div>

            {/* Direct Contact Phone & Quick Order Hotline */}
            <div className="w-full max-w-lg p-4 rounded-2xl bg-gradient-to-r from-[#FAF3E5] to-[#F5EAD4] border border-[#D9C49C] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#5C1027] text-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-md">
                  <Phone className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] text-[#7A5B2E] font-semibold">الخط الساخن للحجز والاستفسار الفوري</div>
                  <a href="tel:01284484868" className="text-lg font-bold font-mono text-[#5C1027] hover:underline" dir="ltr">
                    01284484868
                  </a>
                </div>
              </div>

              <a
                href="https://wa.me/201284484868?text=مرحباً%20سيلبر%2C%20أود%20الاستفسار%20عن%20باقات%20عبوات%20الكاترنج%20للمناسبات"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب مباشر</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-8 mt-6 border-t border-[#E8DFC9] w-full max-w-xl text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF0E1] text-[#9A6715] flex items-center justify-center mb-1.5">
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[#2C0A15]">+150 ألف عبوة</span>
                <span className="text-[11px] text-[#736557]">تم تسليمها بنجاح</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF0E1] text-[#9A6715] flex items-center justify-center mb-1.5">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[#2C0A15]">دقة بالمواعيد</span>
                <span className="text-[11px] text-[#736557]">توصيل حراري فوري</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF0E1] text-[#9A6715] flex items-center justify-center mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[#2C0A15]">أعلى معايير النظافة</span>
                <span className="text-[11px] text-[#736557]">تغليف فردي معقم</span>
              </div>
            </div>

          </div>

          {/* Left Column (Hero Images Showcase & Brand Emblem in RTL) */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            
            {/* Main Visual Card showcasing the official Celebre luxury catering box */}
            <div className="relative w-full max-w-md rounded-3xl p-3 bg-gradient-to-b from-[#E7D6B7] via-[#FAF7F2] to-[#D9C49C] shadow-2xl border border-[#C89B3C]/60">
              
              {/* Image Container */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#2C0A15]">
                <img
                  src={brandedBoxImg}
                  alt="Celebre Branded Luxury Catering Box"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#3B0715]/85 via-transparent to-black/20" />

                {/* Floating Brand Badge */}
                <div className="absolute top-3 right-3 bg-[#5C1027]/95 backdrop-blur-md border border-[#D4AF37] text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                  <Heart className="w-3.5 h-3.5 text-[#E5C06E] fill-[#E5C06E]" />
                  <span>تصميم وتغليف سيلبر المعتمد</span>
                </div>

                {/* Bottom Card Info */}
                <div className="absolute bottom-3 right-3 left-3 text-white text-right">
                  <div className="flex items-center gap-1 text-[#E5C06E] text-xs font-bold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>علبة كاترنج فاخرة بختم سيلبر الذهبي</span>
                  </div>
                  <div className="text-sm font-bold text-white">تغليف ملكي مع شريط ستان نبيتي وكارت إهداء مطبوع</div>
                </div>
              </div>

              {/* Second floating mini-card with Official Brand Emblem */}
              <div className="mt-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-[#E3D4B8] shadow-md flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-[#C89B3C]/50 flex-shrink-0 flex items-center justify-center p-1">
                  <img
                    src={brandEmblemImg}
                    alt="Celebre Official Emblem"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#5C1027]">سيلبر كاترنج (Celebre)</span>
                    <span className="text-[11px] font-bold text-[#8C5E13] font-mono">01284484868</span>
                  </div>
                  <p className="text-[11px] text-[#6E6053] line-clamp-1 mt-0.5">
                    الشعار الذهبي الملكي • فيونكة النبيتي • دقة التقديم
                  </p>
                </div>
              </div>

              {/* Brand Logo Stamp in corner */}
              <div className="absolute -bottom-5 -left-3 sm:-left-5">
                <CelebreLogo variant="box-stamp" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

