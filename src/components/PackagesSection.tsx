import React, { useState } from 'react';
import { CATERING_PACKAGES } from '../data/cateringData';
import { CateringPackage, OccasionCategory, OrderItem } from '../types';
import { 
  Sparkles, 
  Eye, 
  ShoppingBag, 
  Check, 
  ArrowLeft, 
  Flame, 
  Heart,
  Crown
} from 'lucide-react';
import { PackageDetailModal } from './PackageDetailModal';

interface PackagesSectionProps {
  onAddToCart: (item: OrderItem) => void;
  onOpenCustomizer: () => void;
}

const CATEGORIES: { id: OccasionCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'جميع الباقات', icon: '✨' },
  { id: 'katb_ketab', label: 'كتب الكتاب وعقد القران', icon: '💍' },
  { id: 'wedding', label: 'حفلات الزفاف الفاخرة', icon: '👑' },
  { id: 'engagement_henna', label: 'الخطوبة وليالي الحنة', icon: '🌺' },
  { id: 'aqiqa_baby', label: 'السبوع والعقيقة', icon: '🍼' },
  { id: 'vip_reception', label: 'كبار الزوار VIP', icon: '⭐' },
  { id: 'sweets_hospitality', label: 'الحلويات والضيافة', icon: '🍬' },
];

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  onAddToCart,
  onOpenCustomizer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<OccasionCategory>('all');
  const [activeModalPackage, setActiveModalPackage] = useState<CateringPackage | null>(null);

  const filteredPackages = selectedCategory === 'all' 
    ? CATERING_PACKAGES 
    : CATERING_PACKAGES.filter(p => p.category === selectedCategory);

  return (
    <section id="packages-section" className="py-16 sm:py-20 bg-[#FAF7F2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E7D3] border border-[#C89B3C]/40 text-[#5C1027] text-xs font-bold mb-3 shadow-xs">
            <Crown className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>باقات كاترنج جاهزة ومنسقة بعناية</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            باقات ضيافة المناسبات والأفراح من{' '}
            <span className="font-['Playfair_Display'] text-[#721832] font-black">Celebre</span>
          </h2>
          
          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed">
            اختر الباقة الأنسب لمناسبتك السعيدة، مُعدة بأيدي أمهر الطهاة وتصلكم مغلفة بأرقى الخامات المخملية والأشرطة الذهبية مع كارت تهنئة باسمكم.
          </p>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar justify-start md:justify-center">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#5C1027] text-[#FFDF9E] shadow-md shadow-[#5C1027]/25 border border-[#C89B3C]'
                    : 'bg-[#F2E8D7] text-[#4F4135] hover:bg-[#EBDDC5] border border-[#E3D6BF]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="group bg-white rounded-3xl overflow-hidden border border-[#E8DEC9] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Image Area */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#2C0A15]">
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                {/* Badge */}
                {pkg.badge && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#D4AF37] text-[#2C0A15] text-[11px] font-black shadow-md">
                    {pkg.badge}
                  </div>
                )}

                {/* Min Order Tag */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[#F7ECD5] text-[10px] font-semibold border border-white/20">
                  الحد الأدنى: {pkg.minOrder} عبوة
                </div>

                {/* English Name & Tagline at bottom of image */}
                <div className="absolute bottom-3 right-3 left-3 text-white text-right">
                  <span className="text-[11px] text-[#E5C06E] font-['Playfair_Display'] font-semibold block">
                    {pkg.nameEn}
                  </span>
                  <h3 className="text-lg font-bold leading-snug">{pkg.name}</h3>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between text-right">
                
                {/* Description & highlights */}
                <div className="mb-4">
                  <p className="text-xs text-[#5C5045] leading-relaxed mb-3 line-clamp-2">
                    {pkg.description}
                  </p>

                  {/* Highlights Bullet List */}
                  <div className="space-y-1.5 py-2 border-t border-b border-[#F0E6D5]">
                    {pkg.sections.flatMap(s => s.items).slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#3D332A]">
                        <Check className="w-3.5 h-3.5 text-[#C89B3C] flex-shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                    {pkg.sections.flatMap(s => s.items).length > 4 && (
                      <div className="text-[11px] text-[#8C5E13] font-semibold pt-1">
                        + {pkg.sections.flatMap(s => s.items).length - 4} أصناف إضافية ومشروب وتغليف
                      </div>
                    )}
                  </div>
                </div>

                {/* Packaging preview pill */}
                <div className="p-2 rounded-xl bg-[#FAF3E5] border border-[#E5D7BE] text-[11px] text-[#634F3A] mb-4 flex items-center gap-1.5">
                  <span className="text-[#C89B3C]">🎁</span>
                  <span className="truncate">{pkg.packaging.type}</span>
                </div>

                {/* Pricing & CTA Buttons */}
                <div className="pt-2 border-t border-[#F0E6D5] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-[#7A6A5C] font-semibold">سعر العبوة</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-[#5C1027] font-mono">{pkg.pricePerBox}</span>
                      <span className="text-xs font-bold text-[#5C1027]">ج.م</span>
                      {pkg.originalPrice && (
                        <span className="text-[10px] text-[#8C7B6C] line-through font-mono">
                          {pkg.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModalPackage(pkg)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF0E1] hover:bg-[#F3E2C8] text-[#5C1027] font-bold text-xs border border-[#D9C49C] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>تفاصيل</span>
                    </button>

                    <button
                      onClick={() => setActiveModalPackage(pkg)}
                      className="px-4 py-2 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#E5C06E]" />
                      <span>احجز الآن</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Customizer Callout Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#5C1027] via-[#4A0A1D] to-[#3B0715] text-white border border-[#C89B3C]/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37] text-[#2C0A15] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-[#2C0A15]" />
              <span>استوديو التخصيص الكامل</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">عايز تصمم منيو مخصص على ذوقك وبميزانيتك؟</h3>
            <p className="text-xs sm:text-sm text-[#E5D5BC]">
              استخدم صانع العبوات التفاعلي لاختيار أصناف الساندوتشات، المخبوزات، الحلويات، والمشروبات ونوع الصندوق ولون الستان بالتحديد.
            </p>
          </div>

          <button
            onClick={onOpenCustomizer}
            className="px-6 py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C06E] text-[#2C0A15] font-extrabold text-sm sm:text-base transition-all shadow-lg flex items-center gap-2 flex-shrink-0 cursor-pointer active:scale-95"
          >
            <span>ابدأ بتصميم عبوتك الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Package Detail Modal */}
      {activeModalPackage && (
        <PackageDetailModal
          pkg={activeModalPackage}
          onClose={() => setActiveModalPackage(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
};
