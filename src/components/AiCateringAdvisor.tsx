import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Bot, 
  Check, 
  ShoppingBag, 
  MessageCircle, 
  Lightbulb, 
  ArrowLeft,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { OrderItem } from '../types';
import confetti from 'canvas-confetti';
import officialLogoTransparent from '../assets/images/celebre_official_logo_transparent.png';

interface AiCateringAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
}

interface PlanResult {
  recommendationTitle: string;
  suggestedPackage: string;
  estimatedCostPerBox: number;
  totalEstimatedCost: number;
  boxContents: string[];
  presentationTips: string[];
  advice: string;
}

export const AiCateringAdvisor: React.FC<AiCateringAdvisorProps> = ({
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  const [occasion, setOccasion] = useState('كتب كتاب في قاعة ملحقة بمسجد');
  const [guestCount, setGuestCount] = useState(120);
  const [budget, setBudget] = useState('18000');
  const [preferredStyle, setPreferredStyle] = useState('ميكس متوازن بين الموالح الساخنة والحلويات الشرقية');
  const [notes, setNotes] = useState('يرجى مراعاة وجود حلويات خفيفة بالسمن البلدي وعصائر فريش طازجة');

  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-catering-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion,
          guestCount: Number(guestCount),
          budget: Number(budget),
          preferredStyle,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#5C1027', '#D4AF37', '#FAF7F2']
        });
      } else {
        throw new Error(data.message || 'Error');
      }
    } catch (err) {
      console.error('AI Plan Error:', err);
      // Fallback Egyptian catering recommendation
      setPlan({
        recommendationTitle: `خطة الضيافة المخصصة لـ ${occasion} (${guestCount} فرد)`,
        suggestedPackage: "باقة كتب الكتاب والزفاف الملكية المطورة (Royal Celebre Mix)",
        estimatedCostPerBox: Math.round(Number(budget) / guestCount) || 145,
        totalEstimatedCost: Number(budget) || guestCount * 145,
        boxContents: [
          "ميني ساندوتش كوردن بلو فاخر بصوص الشيدر",
          "سيخ شيش طاووق متبل على الطريقة التركية في خبز تورتيلا",
          "قطعتين سمبوسك مكس جبن كيري ولحمة مفرومة بلدي",
          "حبة كبيبة شامي بالصنوبر واللحم البلدي",
          "تارت جبنة الريكوتا والزعتر البري مع طماطم مجففة",
          "علبة ميني حلويات شرقية فاخرة (كنافة أساور فستق + بسبوسة سمن بلدي)",
          "زجاجة عصير مانجو طبيعي 100% بدون سكر مع مياه معدنية",
          "منديل معطّر فاخر وشوكة سيلفر ذهبية داخل مغلف سيلبر الأنيق"
        ],
        presentationTips: [
          "التغليف باللون العنابي والتصميم الفاخر يمنح فخامة لصور الحفل والتوزيع الفوري",
          "العبوات محكمة ومجهزة بشوكة ومنديل معطر لتوزيع فوري وسهل دون أي فوضى",
          "توزيع العبوات في أكياس سيلبر الحرارية يضمن بقاء المخبوزات طازجة ومقرمشة"
        ],
        advice: `بناءً على عدد المعازيم (${guestCount} فرد) والميزانية المقترحة، هذه التشكيلة توفر أعلى قيمة وأفضل انطباع لضيوفكم الكرام دون أي هدر في المصاريف.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookPlan = () => {
    if (!plan) return;

    const item: OrderItem = {
      id: `ai-plan-${Date.now()}`,
      type: 'custom',
      name: `باقة مقترحة من المستشار الذكي (${plan.suggestedPackage})`,
      details: plan.boxContents,
      packagingName: 'صندوق سيلبر المخملي الملكي المخصص للمناسبات',
      quantity: guestCount,
      pricePerBox: plan.estimatedCostPerBox,
      totalPrice: plan.totalEstimatedCost,
    };

    onAddToCart(item);
    onClose();
  };

  const handleWhatsAppShare = () => {
    if (!plan) return;
    const contents = plan.boxContents.map(c => `• ${c}`).join('\n');
    const msg = `مرحباً سيلبر (Celebre) 🌸\nلقد صممت خطة ضيافة بواسطة المستشار الذكي:\n*المناسبة:* ${occasion}\n*عدد الضيوف:* ${guestCount} فرد\n*الباقة المقترحة:* ${plan.suggestedPackage}\n*محتويات العبوة:*\n${contents}\n*التكلفة المقدرة:* ${plan.totalEstimatedCost.toLocaleString()} جنيه مصري\nأود مراجعة الطلب وتأكيد الحجز.`;
    window.open(`https://wa.me/201284484868?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FAF7F2] rounded-3xl border border-[#D9C49C] shadow-2xl">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#5C1027] to-[#3E0716] text-white rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-[#C89B3C]/50 p-1 flex items-center justify-center flex-shrink-0 shadow-md">
              <img
                src={officialLogoTransparent}
                alt="Celebre Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold">مستشار سيلبر الذكي لتنسيق الكاترنج</span>
                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#2C0A15] text-[10px] font-black">AI 2.5</span>
              </div>
              <p className="text-xs text-[#E8D9C0] mt-0.5">
                أدخل تفاصيل مناسبتك وميزانيتك وسيقوم الذكاء الاصطناعي بتوليد منيو عبوات مخصص وشهي يناسب العادات المصرية.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Form */}
          {!plan && (
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C1027]">نوع ومكان المناسبة:</label>
                  <input
                    type="text"
                    required
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="مثال: كتب كتاب بمسجد عمر بن عبد العزيز أو قاعة ببني سويف"
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C1027]">عدد المعازيم (الأفراد):</label>
                  <input
                    type="number"
                    required
                    min={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(20, parseInt(e.target.value) || 20))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C1027]">الميزانية التقريبية (بالجنيه المصري):</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="مثال: 20000"
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C1027]">التفضيلات والأطباق المحببة:</label>
                  <input
                    type="text"
                    value={preferredStyle}
                    onChange={(e) => setPreferredStyle(e.target.value)}
                    placeholder="مثال: ساندوتشات كوردن بلو، مشويات، حلويات شرقية وغربية"
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5C1027]">أي متطلبات أو ملاحظات إضافية:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: توقيت الحفل عصراً، مطلوب تغليف نبيتي وشريط ذهبي مع كارت للعروسين..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#E5C06E]" />
                    <span>جاري تحليل تفاصيل المناسبة وتوليد المنيو المقترح...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E5C06E]" />
                    <span>توليد خطة الكاترنج المخصصة فوراً</span>
                  </>
                )}
              </button>

            </form>
          )}

          {/* AI Plan Result View */}
          {plan && (
            <div className="space-y-5 animate-in fade-in duration-300">
              
              <div className="p-4 rounded-2xl bg-[#FAF0E1] border border-[#D9C49C] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8C5E13] font-bold">الخطة المولدة بواسطة الذكاء الاصطناعي</span>
                  <h3 className="text-base font-extrabold text-[#5C1027]">{plan.recommendationTitle}</h3>
                </div>
                <button
                  onClick={() => setPlan(null)}
                  className="text-xs text-[#8C5E13] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تعديل المدخلات</span>
                </button>
              </div>

              {/* Package & Pricing Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-[#E8DEC9]">
                <div>
                  <div className="text-xs text-[#736353]">الباقة المقترحة:</div>
                  <div className="text-sm font-bold text-[#2C0A15]">{plan.suggestedPackage}</div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-[#736353]">التكلفة الإجمالية التقديرية ({guestCount} فرد):</div>
                  <div className="text-lg font-black text-[#5C1027] font-mono">
                    {plan.totalEstimatedCost.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    <span className="text-xs text-[#8C5E13] font-normal mr-2">({plan.estimatedCostPerBox} ج.م / العبوة)</span>
                  </div>
                </div>
              </div>

              {/* Box Contents */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#5C1027] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C89B3C]" />
                  <span>محتويات كل عبوة فردية مقترحة:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.boxContents.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#EAE0CF] text-xs text-[#3D332A]">
                      <Check className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Presentation Tips */}
              {plan.presentationTips && plan.presentationTips.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F5EADB] border border-[#DFCBB0] space-y-2">
                  <h4 className="text-xs font-bold text-[#8C5E13] flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-[#C89B3C]" />
                    <span>نصائح خبير سيلبر للتنظيم والتقديم في القاعة:</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-[#524538]">
                    {plan.presentationTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#C89B3C] font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advice */}
              <p className="text-xs text-[#635547] leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DEC9]">
                💡 <strong>ملخص الاستشارة:</strong> {plan.advice}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleBookPlan}
                  className="w-full sm:flex-1 py-3 rounded-2xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4 text-[#E5C06E]" />
                  <span>اعتماد وإضافة إلى سلة الحجز</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="w-full sm:flex-1 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال الخطة إلى واتساب سيلبر</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
