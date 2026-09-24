import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { FAQS } from "../data/cateringData";

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-14 sm:py-20 bg-white border-t border-[#E8DFD1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#5C1027] border border-[#E8DFD1] text-xs font-bold mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>الأسئلة الشائعة حول خدمات كاترنج سيلبر</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#221B17]">
            كل ما تود معرفته عن الحجز والتسليم
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-right font-bold text-sm sm:text-base text-[#221B17] flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#5C1027] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#7A6E65] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#55463E] leading-relaxed border-t border-[#E8DFD1]/50 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
