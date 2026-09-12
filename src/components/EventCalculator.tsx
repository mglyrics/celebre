import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Users, 
  ShoppingBag, 
  MessageCircle, 
  ArrowLeft, 
  Check, 
  Clock, 
  ShieldAlert,
  Crown
} from 'lucide-react';
import { CATERING_PACKAGES } from '../data/cateringData';
import { CateringPackage, OrderItem } from '../types';
import confetti from 'canvas-confetti';

interface EventCalculatorProps {
  onAddToCart: (item: OrderItem) => void;
  onOpenAdvisor: () => void;
}

export const EventCalculator: React.FC<EventCalculatorProps> = ({
  onAddToCart,
  onOpenAdvisor,
}) => {
  const [occasionType, setOccasionType] = useState<string>('katb_ketab');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [tier, setTier] = useState<'standard' | 'luxury' | 'vip'>('luxury');
  const [includeBuffer, setIncludeBuffer] = useState<boolean>(true); // 5% extra boxes for safety
  const [includeFreshJuice, setIncludeFreshJuice] = useState<boolean>(true);

  // Suggested Package Mapping
  const recommendedPackage: CateringPackage = useMemo(() => {
    if (occasionType === 'katb_ketab') {
      return CATERING_PACKAGES.find(p => p.id === 'pkg-meal-4') || CATERING_PACKAGES[3] || CATERING_PACKAGES[0];
    } else if (occasionType === 'wedding') {
      return CATERING_PACKAGES.find(p => p.id === 'pkg-meal-5') || CATERING_PACKAGES[4] || CATERING_PACKAGES[0];
    } else if (occasionType === 'engagement_henna') {
      return CATERING_PACKAGES.find(p => p.id === 'pkg-meal-3') || CATERING_PACKAGES[2] || CATERING_PACKAGES[0];
    } else if (occasionType === 'aqiqa') {
      return CATERING_PACKAGES.find(p => p.id === 'pkg-meal-1') || CATERING_PACKAGES[0];
    } else {
      return CATERING_PACKAGES.find(p => p.id === 'pkg-meal-5') || CATERING_PACKAGES[4] || CATERING_PACKAGES[0];
    }
  }, [occasionType]);

  // Adjust price based on tier & extras
  const unitPrice = useMemo(() => {
    let base = recommendedPackage.pricePerBox;
    if (tier === 'standard') base = Math.min(base, 50);
    if (tier === 'luxury') base = Math.max(base, 65);
    if (tier === 'vip') base = 80;
    return Math.max(50, base);
  }, [recommendedPackage, tier]);

  const recommendedBoxesCount = useMemo(() => {
    if (includeBuffer) {
      return Math.ceil(guestCount * 1.05);
    }
    return guestCount;
  }, [guestCount, includeBuffer]);

  const totalCalculatedCost = unitPrice * recommendedBoxesCount;

  const handleBookCalculated = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#5C1027', '#D4AF37', '#FAF7F2']
    });

    const item: OrderItem = {
      id: `calc-order-${Date.now()}`,
      type: 'preset',
      name: `باقة مقترحة لـ (${recommendedPackage.name})`,
      details: [
        `عدد المعازيم: ${guestCount} فرد (مع نسبة أمان: ${recommendedBoxesCount} عبوة)`,
        `المستوى: ${tier === 'standard' ? 'اقتصادي راقي' : tier === 'luxury' ? 'ملكي فاخر' : 'VIP كبار الزوار'}`,
        ...recommendedPackage.sections.flatMap(s => s.items)
      ],
      packagingName: recommendedPackage.packaging.type,
      quantity: recommendedBoxesCount,
      pricePerBox: unitPrice,
      totalPrice: totalCalculatedCost,
    };

    onAddToCart(item);
  };

  const handleWhatsApp = () => {
    const text = `مرحباً سيلبر (Celebre) 🌸\nأجريت حساب باقة الكاترنج للمناسبة:\n*نوع المناسبة:* ${occasionType}\n*عدد الضيوف:* ${guestCount} فرد\n*عدد العبوات الموصى به:* ${recommendedBoxesCount} عبوة\n*الباقة المقترحة:* ${recommendedPackage.name}\n*السعر التقديري:* ${totalCalculatedCost.toLocaleString()} جنيه مصري\nأود تأكيد الحجز ومراجعة المنيو.`;
    window.open(`https://wa.me/201284484868?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section id="calculator-section" className="py-16 sm:py-20 bg-[#FAF7F2] text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF0E1] border border-[#C89B3C]/40 text-[#5C1027] text-xs font-bold mb-3">
            <Calculator className="w-4 h-4 text-[#C89B3C]" />
            <span>حاسبة الضيافة والكميات الذكية</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            احسب التكلفة والكمية المناسبة لحدثك بدقة
          </h2>
          
          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed">
            أدخل عدد المعازيم ونوع المناسبة وسنقترح عليك الباقة المثالية وعدد العبوات الكافي لضمان عدم حدوث أي نقص أثناء الحفل.
          </p>
        </div>

        {/* Calculator Interactive Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DEC9] shadow-xl">
          
          {/* Inputs Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Occasion Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5C1027]">1. ما هو نوع المناسبة؟</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'katb_ketab', label: '💍 كتب كتاب ومسجد' },
                  { id: 'wedding', label: '👑 حفل زفاف وفندق' },
                  { id: 'engagement_henna', label: '🌺 خطوبة وحنة' },
                  { id: 'aqiqa', label: '🍼 سبوع وعقيقة' },
                  { id: 'vip', label: '⭐ استقبال VIP وعزومة' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOccasionType(item.id)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer border ${
                      occasionType === item.id
                        ? 'bg-[#5C1027] text-[#FFDF9E] border-[#5C1027] shadow-sm'
                        : 'bg-[#FAF7F2] text-[#4F4135] border-[#E3D6BF] hover:bg-[#F3E7D3]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Count Slider */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#FAF5EA] border border-[#E5D7C1]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#5C1027] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#C89B3C]" />
                  <span>2. عدد المعازيم والضيوف المتوقع:</span>
                </label>
                <div className="px-3.5 py-1 rounded-xl bg-[#5C1027] text-[#FFDF9E] font-mono font-black text-base">
                  {guestCount} فرد
                </div>
              </div>

              <input
                type="range"
                min={20}
                max={500}
                step={10}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value))}
                className="w-full accent-[#5C1027] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[#7A6B5C] font-mono font-semibold">
                <span>20 فرد (عائلي مصغر)</span>
                <span>150 فرد (متوسط)</span>
                <span>500+ فرد (حفل ضخم)</span>
              </div>
            </div>

            {/* Quality Tier Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5C1027]">3. مستوى التجهيز والضيافة:</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'standard', label: 'الوجبة 1 و 2', desc: 'بتي بان أو فرنساوى مع جاتوة وعصير' },
                  { id: 'luxury', label: 'الوجبة 4 (الأكثر طلباً)', desc: 'ميكس كفتة مشوية وبانية وجاتوة وعصير' },
                  { id: 'vip', label: 'عرض VIP الوجبة 5', desc: 'ساندوتشين فرنساوى كفتة وبانية وجاتوة' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id as any)}
                    className={`p-3 rounded-2xl text-right transition-all border cursor-pointer ${
                      tier === t.id
                        ? 'bg-[#FAF0E1] border-[#C89B3C] shadow-xs ring-1 ring-[#C89B3C]'
                        : 'bg-[#FAF7F2] border-[#E3D6BF] hover:bg-[#F5EAD6]'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#5C1027] mb-0.5">{t.label}</div>
                    <div className="text-[10px] text-[#736353]">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles (Safety buffer, fresh juice) */}
            <div className="space-y-2 pt-2 border-t border-[#EFE4D2]">
              <label className="flex items-center gap-2 text-xs text-[#4A3E34] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBuffer}
                  onChange={(e) => setIncludeBuffer(e.target.checked)}
                  className="w-4 h-4 accent-[#5C1027] rounded"
                />
                <span className="font-semibold text-[#2C0A15]">
                  إضافة نسبة أمان 5% (زيادة {Math.ceil(guestCount * 0.05)} عبوات احتياطية لأي مفاجآت)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#4A3E34] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFreshJuice}
                  onChange={(e) => setIncludeFreshJuice(e.target.checked)}
                  className="w-4 h-4 accent-[#5C1027] rounded"
                />
                <span className="font-semibold text-[#2C0A15]">
                  تضمين زجاجة مياه معدنية وعصير فريش طبيعي 100% داخل كل عبوة
                </span>
              </label>
            </div>

          </div>

          {/* Result Column (Calculated Breakdown Card) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#5C1027] to-[#3B0715] text-white rounded-3xl p-6 sm:p-8 border border-[#C89B3C]/50 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#82213D] pb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#E5C06E]" />
                <span className="text-sm font-bold text-[#FFDF9E]">الخطة المقترحة لمناسبتك</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#2C0A15] text-[10px] font-black">
                سيلبر الذكية
              </span>
            </div>

            {/* Recommended Box Header */}
            <div>
              <div className="text-[11px] text-[#EAD8BD]">الباقة المطابقة لاختياراتك:</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                {recommendedPackage.name}
              </div>
              <p className="text-xs text-[#E6D4B8] mt-1 line-clamp-2 mb-3">
                {recommendedPackage.tagline}
              </p>

              {/* Photo preview of the meal box */}
              {recommendedPackage.image && (
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-[#C89B3C]/50 shadow-md">
                  <img
                    src={recommendedPackage.image}
                    alt={recommendedPackage.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 right-3 text-[11px] font-bold text-[#FFDF9E]">
                    {recommendedPackage.name}
                  </div>
                </div>
              )}
            </div>

            {/* Quantities & Price Breakdown */}
            <div className="p-4 rounded-2xl bg-[#420A1A] border border-[#C89B3C]/40 space-y-2.5 text-xs">
              <div className="flex justify-between text-[#EAD8BD]">
                <span>عدد الضيوف:</span>
                <span className="font-bold text-white font-mono">{guestCount} فرد</span>
              </div>

              <div className="flex justify-between text-[#EAD8BD]">
                <span>العبوات الموصى بتجهيزها:</span>
                <span className="font-bold text-[#FFDF9E] font-mono">{recommendedBoxesCount} عبوة</span>
              </div>

              <div className="flex justify-between text-[#EAD8BD]">
                <span>سعر العبوة الفردية التقديري:</span>
                <span className="font-bold text-white font-mono">{unitPrice} ج.م</span>
              </div>

              <div className="pt-2 border-t border-[#82213D] flex justify-between items-baseline">
                <span className="font-bold text-[#FFDF9E]">التكلفة الإجمالية التقديرية:</span>
                <div className="text-xl font-black text-[#FFDF9E] font-mono">
                  {totalCalculatedCost.toLocaleString()} <span className="text-xs font-normal text-white">ج.م</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleBookCalculated}
                className="w-full py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C06E] text-[#2C0A15] font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة هذه الباقة للسلة فوراً</span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال تفاصيل الحساب إلى واتساب سيلبر</span>
              </button>

              <button
                onClick={onOpenAdvisor}
                className="w-full py-2.5 text-center text-xs text-[#E5C06E] hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>استشارة الذكاء الاصطناعي لتعديل المنيو والميزانية</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
