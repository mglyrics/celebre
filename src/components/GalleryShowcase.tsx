import React, { useState } from 'react';
import { 
  Sparkles, 
  Eye, 
  Heart, 
  Camera, 
  Check, 
  Award,
  Crown
} from 'lucide-react';
import heroImg from '../assets/images/celebre_hero_banner_1788037530778.jpg';
import mosqueKatbKetabImg from '../assets/images/celebre_mosque_katb_ketab_1789223553405.jpg';
import eventSetupImg from '../assets/images/celebre_event_setup_1788037572328.jpg';
import chocolateBoxImg from '../assets/images/celebre_chocolate_gift_box_1789223450390.jpg';

const GALLERY_ITEMS = [
  {
    id: 1,
    title: 'توزيعات عبوات كتب الكتاب وعقد القران بالمساجد (بني سويف)',
    category: 'كتب كتاب بالمساجد',
    image: mosqueKatbKetabImg,
    tag: 'علب سيلبر الكرتونية المذهبة الرسمية المحكمة - سهلة وسريعة التوزيع بالمساجد',
  },
  {
    id: 2,
    title: 'تجهيزات ضيافة حفل زفاف بقاعة على النيل (شرق النيل)',
    category: 'أفراح وقاعات',
    image: heroImg,
    tag: 'بوكسات سواريه مشكلة ومقبلات ساخنة',
  },
  {
    id: 3,
    title: 'علبة شيكولاتة سيلبر المرفقة باسم صاحب المناسبة (40 قطعة)',
    category: 'شيكولاتة باسمك',
    image: chocolateBoxImg,
    tag: 'علبة سيلبر المذهبة الرسمية مع كارت الإهداء والخط الساخن 01284484868 (800 ج)',
  },
  {
    id: 4,
    title: 'تنسيق طاولات المعازيم مع باقات سيلبر الرسمية',
    category: 'تنظيم قاعات',
    image: eventSetupImg,
    tag: 'توزيع منظم مع كروت إهداء شخصية',
  },
];

export const GalleryShowcase: React.FC = () => {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <section id="gallery-section" className="py-16 sm:py-20 bg-[#FAF7F2] text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF0E1] border border-[#C89B3C]/40 text-[#5C1027] text-xs font-bold mb-3 shadow-xs">
            <Camera className="w-4 h-4 text-[#C89B3C]" />
            <span>معرض الصور والفعاليات الحية</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            لمسات الفخامة في مناسبات وأفراح عملائنا
          </h2>
          
          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed">
            شاهد كيف تضفي عبوات <span className="font-bold text-[#5C1027]">Celebre</span> طابعاً ملوكياً وشياكة استثنائية على طاولات المعازيم وفي صور الحفل التذكارية.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveImage(item.image)}
              className="group relative rounded-3xl overflow-hidden bg-[#2C0A15] border border-[#E0D3BD] shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col justify-end aspect-[4/5]"
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Top Floating Badge */}
              <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-[#5C1027]/90 backdrop-blur-md border border-[#D4AF37]/40 text-[#FFDF9E] text-[10px] font-bold">
                {item.category}
              </div>

              {/* Bottom Card Caption */}
              <div className="relative z-10 p-4 text-white">
                <span className="text-[11px] text-[#E5C06E] font-medium block mb-1">
                  {item.tag}
                </span>
                <h3 className="font-bold text-sm leading-snug group-hover:text-[#FFDF9E] transition-colors">
                  {item.title}
                </h3>
              </div>

              {/* Eye Preview Icon Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-xs">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#2C0A15] flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border-2 border-[#C89B3C] shadow-2xl">
            <img
              src={activeImage}
              alt="Celebre Catering Preview"
              className="w-full h-full object-contain max-h-[85vh]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </section>
  );
};
