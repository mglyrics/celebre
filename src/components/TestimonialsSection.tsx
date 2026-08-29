import React from 'react';
import { TESTIMONIALS } from '../data/cateringData';
import { 
  Star, 
  Quote, 
  CheckCircle2, 
  Heart,
  Sparkles
} from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials-section" className="py-16 sm:py-20 bg-[#FAF7F2] text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF0E1] border border-[#C89B3C]/40 text-[#5C1027] text-xs font-bold mb-3 shadow-xs">
            <Heart className="w-4 h-4 text-[#C89B3C] fill-[#C89B3C]" />
            <span>قصص نجاح وسعادة حقيقية</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            ماذا يقول عملاؤنا عن عبوات <span className="font-['Playfair_Display'] text-[#721832] font-black">Celebre</span>؟
          </h2>
          
          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed">
            شهادات وتجارب حقيقية من عرائس وعرسان ومنظمي حفلات شرفنا بخدمتهم في أهم أيام حياتهم.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DEC9] shadow-md hover:shadow-lg transition-all space-y-4 relative flex flex-col justify-between"
            >
              {/* Quote Watermark */}
              <Quote className="w-10 h-10 text-[#C89B3C]/15 absolute top-6 left-6" />

              <div className="space-y-3">
                {/* Stars Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                  <span className="text-xs text-[#8C5E13] font-bold mr-2">تقييم 5/5</span>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-[#473B32] leading-relaxed relative z-10">
                  "{t.comment}"
                </p>
              </div>

              {/* Author & Occasion Footer */}
              <div className="pt-4 border-t border-[#F0E6D5] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5C1027] text-[#FFDF9E] font-bold text-xs flex items-center justify-center shadow-xs">
                    {t.avatarText}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-[#2C0A15]">{t.author}</span>
                      {t.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" title="حجز مؤكد" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#7A6B5C]">{t.role}</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="px-2.5 py-1 rounded-full bg-[#FAF0E1] text-[#8C5E13] text-[10px] font-bold block">
                    {t.occasion}
                  </span>
                  <span className="text-[10px] text-[#9E8E7E] block mt-0.5">{t.eventDate}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
