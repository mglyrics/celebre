import React, { useState } from 'react';
import { FAQS } from '../data/cateringData';
import { HelpCircle, ChevronDown, ChevronUp, Phone, MessageCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-16 sm:py-20 bg-gradient-to-b from-[#FAF7F2] to-[#F5ECDC] text-right">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF0E1] border border-[#C89B3C]/40 text-[#5C1027] text-xs font-bold mb-3 shadow-xs">
            <HelpCircle className="w-4 h-4 text-[#C89B3C]" />
            <span>إجابات على كافة استفساراتكم</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            الأسئلة الشائعة حول حجز وتوصيل عبوات الكاترنج
          </h2>
          
          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed">
            كل ما تحتاج معرفته عن مواعيد الطلب، التوصيل، التغليف، وطرق الدفع والتأكيد.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#E8DEC9] shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-[#2C0A15]">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-lg bg-[#FAF0E1] text-[#5C1027] flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#524539] leading-relaxed border-t border-[#F0E6D5] bg-[#FCFAF7]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Direct Contact Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-[#E8DEC9] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <h4 className="font-bold text-sm text-[#2C0A15]">عندك سؤال مخصص أو مناسبة بمواصفات خاصة؟</h4>
            <p className="text-xs text-[#736456] mt-0.5">فريق خدمة عملاء ومبيعات سيلبر متواجد للرد والمساعدة الفورية.</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:01284484868"
              className="px-4 py-2.5 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#E5C06E]" />
              <span dir="ltr">01284484868</span>
            </a>

            <a
              href="https://wa.me/201284484868?text=مرحباً%20سيلبر%2C%20أود%20الاستفسار%20عن%20تفاصيل%20حجز%20عبوات%20الكاترنج"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب سريع</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
