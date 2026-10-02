import React, { useState } from "react";
import { Sparkles, ArrowDown, CheckCircle2, Shield, HeartHandshake, PhoneCall, ChevronRight, ChevronLeft, Heart, Truck, FileText } from "lucide-react";
import { CelebreLogo, CelebreClocheIcon, CelebreStarIcon, CelebreFlourishDivider } from "./CelebreLogo";
import { LocationGreetingBar } from "./LocationGreetingBar";
import heroImg from "../assets/images/celebre_hero_banner_1788037530778.jpg";
import boxImg from "../assets/images/celebre_real_closed_box_1790336502952.jpg";
import logoImg from "../assets/images/celebre_official_logo_transparent.png";

interface HeroProps {
  onExplorePackages: () => void;
  onOpenAdvisor: () => void;
  onOpenMenu?: () => void;
  onQuickOrderWithCount?: (count: number) => void;
  onScrollToBoxMix?: () => void;
  onScrollToBoxSandwich?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExplorePackages,
  onOpenAdvisor,
  onOpenMenu,
  onScrollToBoxMix,
  onScrollToBoxSandwich
}) => {
  // Quick cost simulator state
  const [guestCount, setGuestCount] = useState<number>(100);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<number>(50); // Sale-01 default

  const plans = [
    { name: "وجبة اقتصادية", price: 35, code: "Sale-06/11" },
    { name: "وجبة كلاسيك شهيرة", price: 50, code: "Sale-01/07" },
    { name: "وجبة مميزة وسط", price: 60, code: "Sale-03" },
    { name: "وجبة VIP ملوكي", price: 80, code: "Sale-05" }
  ];

  const totalEstimate = guestCount * selectedPlanPrice;
  const depositEstimate = Math.round(totalEstimate * 0.5);

  const handleCustomCountChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setGuestCount(0);
    } else {
      setGuestCount(Math.max(1, num));
    }
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-16 md:py-20 bg-gradient-to-b from-[#FAF7F2] via-[#F4EEDB] to-[#FAF7F2]">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-10 w-80 h-80 bg-[#5C1027]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Main Text Content */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-right">
            {/* Grand Official Celebre Logo Showcase - Strictly adhering to attached logo details */}
            <div className="mb-4 flex flex-col items-center lg:items-start">
              <div className="relative p-2 rounded-2xl bg-white/60 backdrop-blur-xs border border-[#C89B3C]/30 shadow-xs inline-block">
                <CelebreLogo
                  size="lg"
                  showSlogan={false}
                  showEnglishSubtitles={true}
                  className="items-center lg:items-start"
                />
              </div>

              {/* Tagline pill with cloche & star icons from logo + prominent Delivery Notice */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3E7D3] border border-[#C89B3C]/60 text-[#5C1027] text-xs sm:text-sm font-semibold shadow-2xs">
                  <CelebreStarIcon className="w-3.5 h-3.5 text-[#C89B3C] animate-spin" />
                  <span className="font-bold">سيلبر شريك مؤسس لمناسباتك السعيدة</span>
                  <CelebreClocheIcon className="w-4 h-4 text-[#C89B3C]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs sm:text-sm font-black shadow-2xs">
                  <Truck className="w-3.5 h-3.5 text-amber-800" />
                  <span>التوصيل غير مشمول</span>
                </div>
              </div>

              {/* Localized Greeting for Visitor's Geographic Region */}
              <div className="mt-3.5">
                <LocationGreetingBar variant="hero-badge" />
              </div>
            </div>

            {/* Direct Gateway to the 2 Offer Categories: بوكس ميكس vs بوكس ساندوتش */}
            <div className="w-full max-w-2xl mb-6 p-3.5 sm:p-4 rounded-3xl bg-white/95 backdrop-blur-md border-2 border-[#C89B3C]/60 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#5C1027] animate-ping" />
                  <span className="text-xs sm:text-sm font-black text-[#5C1027]">
                    تصفح مسار العروض مباشرة (18 عرض رسمي):
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-[#8C6D28] font-bold">
                  اختر قائمتك دون عناء التمرير ⬇️
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Link 1: بوكس ميكس */}
                <button
                  type="button"
                  onClick={() => {
                    if (onScrollToBoxMix) {
                      onScrollToBoxMix();
                    } else {
                      const el = document.getElementById("section-box-mix");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      else onExplorePackages();
                    }
                  }}
                  className="group relative flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[#FAF7F2] to-white hover:from-[#F4EEDB] hover:to-[#FAF7F2] border-2 border-[#5C1027]/30 hover:border-[#5C1027] transition-all duration-300 shadow-xs hover:shadow-md active:scale-98 text-right"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#5C1027] text-white flex items-center justify-center text-xl shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    🍰
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-sm text-[#5C1027] group-hover:text-[#721832]">
                        عروض «بوكس ميكس»
                      </span>
                      <span className="text-[10px] bg-[#5C1027] text-white px-2 py-0.2 rounded-full font-black">
                        12 عرض
                      </span>
                    </div>
                    <p className="text-[11px] text-[#61534B] mt-0.5 truncate font-medium">
                      جاتوه + ساندوتشات + مخبوزات وعصير
                    </p>
                    <div className="text-[10px] text-[#C89B3C] font-bold mt-1 flex items-center gap-1">
                      <span>أول 12 عرض (Sale 01 - 12)</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                {/* Link 2: بوكس ساندوتش */}
                <button
                  type="button"
                  onClick={() => {
                    if (onScrollToBoxSandwich) {
                      onScrollToBoxSandwich();
                    } else {
                      const el = document.getElementById("section-box-sandwich");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      else onExplorePackages();
                    }
                  }}
                  className="group relative flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[#FAF7F2] to-white hover:from-[#F4EEDB] hover:to-[#FAF7F2] border-2 border-[#2A170F]/30 hover:border-[#2A170F] transition-all duration-300 shadow-xs hover:shadow-md active:scale-98 text-right"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#2A170F] text-white flex items-center justify-center text-xl shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    🥪
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-sm text-[#2A170F] group-hover:text-[#422214]">
                        عروض «بوكس ساندوتش»
                      </span>
                      <span className="text-[10px] bg-[#C89B3C] text-[#221B17] px-2 py-0.2 rounded-full font-black">
                        6 عروض
                      </span>
                    </div>
                    <p className="text-[11px] text-[#61534B] mt-0.5 truncate font-medium">
                      كفتة مشوية وبانيه وجبنة بالعيش الفرنساوي
                    </p>
                    <div className="text-[10px] text-[#8C6D28] font-bold mt-1 flex items-center gap-1">
                      <span>العروض 13 إلى 18 (Sale 13 - 18)</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Value Props Pills */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8 justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-black shadow-2xs">
                <Truck className="w-4 h-4 text-amber-700" />
                التوصيل غير مشمول
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8DFD1] text-[#221B17] text-xs sm:text-sm font-semibold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                علب كرتونية مذهبة محكمة الغلق
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8DFD1] text-[#221B17] text-xs sm:text-sm font-semibold shadow-2xs">
                <Shield className="w-4 h-4 text-[#C89B3C]" />
                الحد الأدنى 50 وجبة فقط
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8DFD1] text-[#221B17] text-xs sm:text-sm font-semibold shadow-2xs">
                <HeartHandshake className="w-4 h-4 text-[#5C1027]" />
                طاقة استيعابية مفتوحة لأكثر من 1000 وجبة
              </span>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <button
                onClick={onExplorePackages}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5C1027] hover:bg-[#721832] text-white font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base group"
              >
                <span>استعراض الوجبات والطلب المباشر</span>
                <ChevronRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenAdvisor}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-[#F3E7D3] border-2 border-[#C89B3C] text-[#5C1027] font-bold px-6 py-3.5 rounded-xl shadow-xs transition-all text-sm sm:text-base"
              >
                <Sparkles className="w-4 h-4 text-[#C89B3C]" />
                <span>اقترح لي باقة تناسب ميزانيتي</span>
              </button>

              <a
                href="tel:01284484868"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#EFE8DD] border border-[#D5C9B7] text-[#221B17] font-semibold px-4 py-3.5 rounded-xl text-sm"
              >
                <PhoneCall className="w-4 h-4 text-[#5C1027]" />
                <span dir="ltr">01284484868</span>
              </a>
            </div>

            {/* Quick Interactive Menu Download Button */}
            {onOpenMenu && (
              <div className="w-full flex justify-center lg:justify-start pt-2">
                <button
                  type="button"
                  onClick={onOpenMenu}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F4EEDB] via-white to-[#F4EEDB] hover:from-[#EBE3D0] hover:to-[#EBE3D0] text-[#5C1027] font-black text-xs sm:text-sm border border-[#C89B3C]/70 shadow-2xs hover:shadow-xs transition-all active:scale-98"
                >
                  <FileText className="w-4 h-4 text-[#C89B3C]" />
                  <span>تحميل منيو العروض التفاعلي المحدث (PDF أو صورة JPG)</span>
                  <span className="text-[10px] bg-[#5C1027] text-white px-2 py-0.5 rounded-full font-bold">تحديث فوري</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Hero Widget & Featured Visual */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Visual Box Card with Official Logo Watermark */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#C89B3C]/50 group bg-white">
              <img
                src={heroImg || boxImg}
                alt="علب كاترنج سيلبر الملكية الفاخرة"
                className="w-full h-60 sm:h-68 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-5 text-white">
                {/* Top Corner Official Logo Badge */}
                <div className="flex items-center justify-between">
                  <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#C89B3C] shadow-lg flex items-center gap-2">
                    <img
                      src="/logo.png"
                      alt="شعار سيلبر الرسمي المعتمد على العلبة"
                      className="h-9 w-auto object-contain"
                    />
                    <span className="font-['Cinzel',serif] text-[10px] text-[#5C1027] font-black tracking-widest uppercase">
                      CELEBRE
                    </span>
                  </div>

                  <span className="text-[11px] font-bold bg-[#5C1027]/90 text-white px-3 py-1 rounded-full border border-[#C89B3C]/50 flex items-center gap-1 shadow-md">
                    <CelebreStarIcon className="w-3 h-3 text-[#C89B3C]" />
                    شعار العلبة الرسمي المعتمد
                  </span>
                </div>

                {/* Bottom Card Title */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#C89B3C] font-black tracking-wide mb-1">
                    <CelebreClocheIcon className="w-4 h-4 text-[#C89B3C]" />
                    <span>سيلبر كاترنج باكيدجز • للأفراح والمناسبات</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                    تغليف كرتوني مذهب يجسد فخامة الشعار
                  </h3>
                  <p className="text-xs text-stone-200 mt-1 leading-relaxed">
                    توزيع مباشر وفوري وسلس داخل المساجد والقاعات بدون أي هدر
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Fast Cost Estimator Card */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8DFD1] shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#F4EEDB] mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#5C1027]/10 text-[#5C1027]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-black text-sm text-[#221B17]">
                      حاسبة التكلفة الفورية لمناسبتك
                    </h4>
                    <p className="text-[11px] text-[#7A6E65]">احسب التكلفة والعربون في 3 ثوانٍ</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#5C1027] bg-[#5C1027]/10 px-2.5 py-1 rounded-full">
                  تقدير فوري
                </span>
              </div>

              {/* Meal Plan Select */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#4A3E38] mb-1.5">
                  اختر فئة الوجبة المفضلة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((p) => (
                    <button
                      key={p.price}
                      type="button"
                      onClick={() => setSelectedPlanPrice(p.price)}
                      className={`text-right p-2 rounded-xl border text-xs font-semibold transition-all ${
                        selectedPlanPrice === p.price
                          ? "border-[#5C1027] bg-[#5C1027] text-white shadow-xs"
                          : "border-[#E8DFD1] bg-[#FAF7F2] text-[#221B17] hover:bg-[#F3E7D3]"
                      }`}
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className={`text-[11px] mt-0.5 ${selectedPlanPrice === p.price ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                        {p.price} جنيه / علبة
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Count Selector with flexible input over 300 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#4A3E38]">
                    عدد الوجبات المطلوب:
                  </label>
                  <span className="text-xs font-black text-[#5C1027]">
                    {guestCount} وجبة
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                  {[50, 100, 150, 200, 300].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setGuestCount(count);
                        setIsCustomCount(false);
                      }}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                        !isCustomCount && guestCount === count
                          ? "bg-[#C89B3C] text-white shadow-xs"
                          : "bg-[#F3E7D3]/60 text-[#4A3E38] hover:bg-[#F3E7D3]"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                {/* Flexible Custom Count Input (allows any number > 300) */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7A6E65] whitespace-nowrap font-medium">
                      أو اكتب عدداً آخر:
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="50"
                        step="10"
                        placeholder="اكتب أي عدد (مثلاً 400 أو 500 أو 1000...)"
                        value={isCustomCount ? (guestCount || "") : guestCount}
                        onChange={(e) => {
                          setIsCustomCount(true);
                          handleCustomCountChange(e.target.value);
                        }}
                        onFocus={() => setIsCustomCount(true)}
                        className="w-full text-center bg-[#FAF7F2] border-2 border-[#C89B3C]/60 focus:border-[#5C1027] focus:ring-1 focus:ring-[#5C1027] text-[#221B17] font-black rounded-xl py-2 px-3 text-sm transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-[#7A6E65] font-bold pointer-events-none">
                        علبة
                      </span>
                    </div>
                  </div>
                  {guestCount < 50 && (
                    <p className="text-[11px] text-amber-700 font-bold mt-1">
                      * تنبيه: الحد الأدنى المعتمد للطلب هو 50 وجبة
                    </p>
                  )}
                  {guestCount >= 300 && (
                    <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      طلب مناسبة كبرى متاح مع أولوية تجهيز خاصة وسيارات نقل مجهزة
                    </p>
                  )}
                </div>
              </div>

              {/* Estimate Calculation Summary */}
              <div className="bg-[#F8F5EE] border border-[#E8DFD1] rounded-xl p-3.5 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#7A6E65]">الإجمالي التقديري:</div>
                  <div className="text-lg font-black text-[#5C1027]">
                    {totalEstimate.toLocaleString()} جنيه
                  </div>
                </div>
                <div className="text-left border-r pr-3 border-[#E8DFD1]">
                  <div className="text-[11px] text-[#7A6E65]">العربون (50%):</div>
                  <div className="text-base font-black text-[#C89B3C]">
                    {depositEstimate.toLocaleString()} جنيه
                  </div>
                </div>
              </div>

              {/* Action Button inside widget */}
              <button
                type="button"
                onClick={onExplorePackages}
                className="w-full py-2.5 bg-[#5C1027] hover:bg-[#721832] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
              >
                <span>الانتقال للمنيو والطلب بهذه الكمية</span>
                <ArrowDown className="w-4 h-4 text-[#C89B3C]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
