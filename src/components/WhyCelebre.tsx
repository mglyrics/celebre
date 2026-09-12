import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Heart, 
  ChefHat, 
  Truck, 
  Gift, 
  Award,
  Crown
} from 'lucide-react';

export const WhyCelebre: React.FC = () => {
  const features = [
    {
      icon: ChefHat,
      title: 'طهاة محترفون وخامات طازجة 100%',
      desc: 'نستخدم أجود أنواع اللحوم البلدي والدواجن الطازجة والزبدة الفلاحي الطبيعية والشوكولاتة الفاخرة دون أي إضافات صناعية.',
    },
    {
      icon: Gift,
      title: 'تغليف ملكي فاخر يُبهر المعازيم',
      desc: 'علب أنيقة ومحكمة الإغلاق مع شوك ومناديل معطرة معقمة تضمن نظافة وسهولة التناول والتقديم المباشر بدون أي فوضى.',
    },
    {
      icon: Clock,
      title: 'التزام صارم ودقيق بالمواعيد',
      desc: 'ندرك أهمية كل دقيقة في حفل الزفاف أو كتب الكتاب؛ يصل المندوب قبل موعد التوزيع المحدد لترتيب العبوات على الطاولات باحترافية.',
    },
    {
      icon: Truck,
      title: 'توصيل في حقائب حرارية مخصصة',
      desc: 'سيارات مجهزة بحقائب عازلة للحرارة تضمن وصول المقرمشات والمشويات ساخنة والعصائر والمياه باردة ومنعشة.',
    },
    {
      icon: Heart,
      title: 'تنسيق راقي جاهز للتقديم المباشر',
      desc: 'عبوات سيلبر الفاخرة مصممة بأعلى معايير الرقي والفخامة لتُوزع مباشرة في كتب الكتاب والمناسبات بكل سهولة وشياكة.',
    },
    {
      icon: ShieldCheck,
      title: 'أسعار واضحة وباقات تناسب كل الميزانيات',
      desc: 'نوفر باقات متنوعة تبدأ من الضيافة الخفيفة وحتى الباقات الماسية الملكية مع خصومات حصرية للكميات الكبيرة.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#F5ECDC]/60 border-y border-[#E8DEC9] text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF0E1] border border-[#C89B3C]/50 text-[#5C1027] text-xs font-bold mb-3 shadow-xs">
            <Award className="w-4 h-4 text-[#C89B3C]" />
            <span>معايير الجودة والضيافة في Celebre</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            لماذا يثق بنا آلاف العائلات ومنظمي الحفلات في مصر؟
          </h2>
          
          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed">
            لأننا لا نقدم مجرد طعام، بل نصنع تجربة ضيافة متكاملة ترفع رأسك وتترك انطباعاً لا يُنسى لدى كل حاضر.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#E8DEC9] shadow-sm hover:shadow-md hover:border-[#C89B3C] transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FAF0E1] text-[#5C1027] border border-[#DFCBB0] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#8C5E13]" />
                </div>
                <h3 className="font-bold text-base text-[#2C0A15]">{f.title}</h3>
                <p className="text-xs text-[#635547] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
