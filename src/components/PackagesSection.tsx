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
}

type FilterTab = 'all' | 'under_50' | '50_to_65' | 'vip';

const FILTER_TABS: { id: FilterTab; label: string; icon: string; count?: number }[] = [
  { id: 'all', label: 'جميع وجبات المنيو (12 وجبة)', icon: '✨' },
  { id: 'under_50', label: 'وجبات 35 - 45 ج', icon: '🏷️' },
  { id: '50_to_65', label: 'وجبات 50 - 65 ج (الأكثر طلباً)', icon: '🔥' },
  { id: 'vip', label: 'وجبات VIP (80 ج)', icon: '👑' },
];

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  onAddToCart,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [activeModalPackage, setActiveModalPackage] = useState<CateringPackage | null>(null);

  // Filter out legacy aliases so only the 12 clean meals appear
  const officialPackages = CATERING_PACKAGES.filter(p => 
    !['pkg-meal-1', 'pkg-meal-2', 'pkg-meal-3', 'pkg-meal-4', 'pkg-meal-5', 'pkg-katb-ketab-royal', 'pkg-diamond-wedding'].includes(p.id)
  );

  const filteredPackages = officialPackages.filter(pkg => {
    if (activeTab === 'all') return true;
    if (activeTab === 'under_50') return pkg.pricePerBox <= 45;
    if (activeTab === '50_to_65') return pkg.pricePerBox >= 50 && pkg.pricePerBox <= 65;
    if (activeTab === 'vip') return pkg.pricePerBox >= 80;
    return true;
  });

  return (
    <section id="packages-section" className="py-16 sm:py-20 bg-[#FAF7F2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F3E7D3] border border-[#C89B3C]/50 text-[#5C1027] text-xs sm:text-sm font-bold mb-3 shadow-xs">
            <Crown className="w-4 h-4 text-[#C89B3C]" />
            <span>المنيو الرسمي المعتمد 2026 | Celebre Catering Packages</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            وجبات كاتريتج فاخرة لجميع المناسبات
          </h2>
          
          <p className="text-lg sm:text-xl text-[#721832] font-black mb-3 font-serif">
            « كل مناسبة ... أحلى مع سيليبري ♡ »
          </p>

          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed max-w-2xl mx-auto">
            12 وجبة ضيافة متكاملة ومعدّة طازجة يوم الحفل، تبدأ من <span className="font-bold text-[#5C1027]">35 جنيه</span> حتى <span className="font-bold text-[#5C1027]">80 جنيه</span>، داخل علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي مع عصير بخيرة وشوكة ومناديل معقمة.
          </p>
        </div>

        {/* Official Menu Highlights Banner (From bottom of official brochure) */}
        <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-[#FAF3E5] via-[#FFFDF9] to-[#FAF3E5] border border-[#E3D4BC] shadow-sm">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-[#8C5E13] tracking-wider uppercase">
              مناسبتك ... تستحق الأفضل
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#E8DEC9]">
            <div className="pt-2 md:pt-0 px-2 flex flex-col items-center">
              <span className="text-2xl mb-1.5">👨‍🍳</span>
              <span className="text-xs sm:text-sm font-bold text-[#2C0A15]">جودة عالية في المكونات</span>
              <span className="text-[11px] text-[#7A6A5C]">لحوم وفراخ بلدي طازجة وسمن بلدي</span>
            </div>
            <div className="pt-2 md:pt-0 px-2 flex flex-col items-center">
              <span className="text-2xl mb-1.5">🎁</span>
              <span className="text-xs sm:text-sm font-bold text-[#2C0A15]">تغليف أنيق ومميز</span>
              <span className="text-[11px] text-[#7A6A5C]">علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي</span>
            </div>
            <div className="pt-2 md:pt-0 px-2 flex flex-col items-center">
              <span className="text-2xl mb-1.5">⭐</span>
              <span className="text-xs sm:text-sm font-bold text-[#2C0A15]">مناسبة لكل الاحتفالات</span>
              <span className="text-[11px] text-[#7A6A5C]">كتب كتاب، أفراح، خطوبة، ومؤتمرات</span>
            </div>
            <div className="pt-2 md:pt-0 px-2 flex flex-col items-center">
              <span className="text-2xl mb-1.5">♡</span>
              <span className="text-xs sm:text-sm font-bold text-[#2C0A15]">أُجهز لك بكل حب</span>
              <span className="text-[11px] text-[#7A6A5C]">توصيل في مواعيد دقيقة وحقائب حرارية</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar justify-start md:justify-center">
          {FILTER_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#5C1027] text-[#FFDF9E] shadow-md shadow-[#5C1027]/25 border border-[#C89B3C]'
                    : 'bg-[#F2E8D7] text-[#4F4135] hover:bg-[#EBDDC5] border border-[#E3D6BF]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

                {/* Official Sale Code Ribbon Badge */}
                {pkg.saleCode && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-[#5C1027] border border-[#C89B3C] text-[#FFDF9E] text-xs font-black shadow-md flex items-center gap-1">
                    <span>{pkg.saleCode}</span>
                  </div>
                )}

                {/* Price Tag Pill on Image */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-[#D4AF37] text-[#2C0A15] text-xs font-black shadow-md flex items-center gap-1 font-mono">
                  <span>سعر البيع: {pkg.pricePerBox} ج</span>
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
                
                {/* Official Tagline / Items Overview */}
                <div className="mb-4">
                  <div className="p-2.5 rounded-xl bg-[#FAF0E1] border border-[#E2D2B8] text-xs text-[#5C1027] font-bold leading-relaxed mb-3">
                    {pkg.tagline}
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="space-y-1.5 py-2 border-t border-b border-[#F0E6D5]">
                    {pkg.sections.flatMap(s => s.items).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#3D332A]">
                        <Check className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
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
                      <span className="text-2xl font-black text-[#5C1027] font-mono">{pkg.pricePerBox}</span>
                      <span className="text-xs font-bold text-[#5C1027]">ج.م</span>
                      {pkg.originalPrice && (
                        <span className="text-[11px] text-[#8C7B6C] line-through font-mono">
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
