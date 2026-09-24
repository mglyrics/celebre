import React from "react";
import { ShieldCheck, Sparkles, Clock, UtensilsCrossed, CheckCircle2, Award } from "lucide-react";

export const WhyCelebre: React.FC = () => {
  const points = [
    {
      icon: ShieldCheck,
      title: "علب كرتونية مذهبة محكمة الإغلاق",
      desc: "تغليف ذاتي محكم بدون أشرطة ستان أو أقمشة مخملية، لضمان أعلى معايير النظافة والترتيب السلس وسرعة التوزيع بالمساجد والقاعات دون أي فوضى."
    },
    {
      icon: UtensilsCrossed,
      title: "ساندوتشات طازجة يوم المناسبة",
      desc: "نجهز كفتة الفحم المشوية، وفراخ البانيه المقرمشة، والرومي ولانشون الكوردن بيف في مخبوزات بتي بان وفرنساوي طازجة تُعد صبيحة يوم مناسبتك."
    },
    {
      icon: Sparkles,
      title: "جاتوه مغلف مثلّث وعصير بخيرة",
      desc: "نستبدل الحلويات الشرقية المسببة للهدر بقطع جاتوه شوكولاتة وكريمة فاخرة مغلفة فردياً، مع عصير بخيرة بارد وباكت شوكة ومنديل معقم داخل كل علبة."
    },
    {
      icon: Clock,
      title: "التزام صارم بمواعيد التسليم",
      desc: "تصل سياراتنا المجهزة قبل موعد كتب الكتاب أو الحفل بوقت كافٍ، مع تنسيق كامل مع مسؤول المسجد أو القاعة لضمان راحة العروسين وأولياء الأمور."
    },
    {
      icon: Award,
      title: "الحد الأدنى 50 وجبة فقط",
      desc: "مرونة كاملة تلائم أصغر المناسبات العائلية ابتداءً من 50 وجبة، مع طاقة استيعابية مفتوحة تلبي كبرى الأفراح بأكثر من 1000 وجبة."
    },
    {
      icon: CheckCircle2,
      title: "ضمان السعر والجودة الشاملة",
      desc: "أسعار تنافسية تبدأ من 35 ج للوجبة مع عربون 50% وسداد المتبقي عند الاستلام، وتوثيق تعاقد إلكتروني معتمد عبر واتساب."
    }
  ];

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FAF7F2] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#5C1027] bg-[#5C1027]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            لماذا تختار سيلبر لمناسبتك السعيدة؟
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#221B17]">
            معايير فندقية راقية ترفع رأسك أمام ضيوفك
          </h2>
          <p className="text-xs sm:text-base text-[#61534B] mt-3">
            سيلبر هي الشريك المؤسس لمناسباتك السعيدة في بني سويف ومصر، نقدم تجربة ضيافة استثنائية متكاملة تجمع الفخامة، النظافة، والسرعة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-[#E8DFD1] hover:border-[#C89B3C] shadow-xs hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5C1027]/10 text-[#5C1027] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#C89B3C]" />
                </div>
                <h3 className="font-black text-base text-[#221B17] mb-2">{pt.title}</h3>
                <p className="text-xs sm:text-sm text-[#7A6E65] leading-relaxed">{pt.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
