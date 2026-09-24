import React from "react";
import { Star, ShieldCheck, Quote } from "lucide-react";
import { TESTIMONIALS } from "../data/cateringData";

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-14 sm:py-20 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#C89B3C] bg-[#F4EEDB] px-3.5 py-1.5 rounded-full inline-block mb-3">
            ثقة وشهادات عملائنا
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#221B17]">
            ماذا يقول عملاؤنا عن ضيافة سيلبر؟
          </h2>
          <p className="text-xs sm:text-base text-[#7A6E65] mt-2">
            مئات العائلات وأولياء الأمور وثقوا في سيلبر لتشريفهم أمام ضيوفهم في أهم اللحظات السعيدة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-6 border border-[#E8DFD1] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-[#C89B3C]/30" />
                </div>

                <p className="text-xs sm:text-sm text-[#4A3E38] leading-relaxed mb-4">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0EAE1]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#221B17]">{t.name}</h4>
                    <p className="text-[11px] text-[#7A6E65]">{t.role} • {t.occasion}</p>
                  </div>
                  {t.verified && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3" />
                      طلب مؤكد ({t.boxesOrdered} علبة)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
