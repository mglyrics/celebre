import React, { useState } from "react";
import { X, Sparkles, Send, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { CateringPackage } from "../types";
import { CelebreLogo, CelebreClocheIcon, CelebreStarIcon } from "./CelebreLogo";

interface AiCateringAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  packages: CateringPackage[];
  onSelectSuggestedPackage?: (pkg: CateringPackage, quantity: number) => void;
}

export const AiCateringAdvisor: React.FC<AiCateringAdvisorProps> = ({
  isOpen,
  onClose,
  packages,
  onSelectSuggestedPackage
}) => {
  if (!isOpen) return null;

  const [occasion, setOccasion] = useState("كتب كتاب وعقد قران بالمسجد");
  const [guestCount, setGuestCount] = useState<number>(100);
  const [budget, setBudget] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("ميكس كفتة فحم وبانيه مع جاتوه مثلّث");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultPlan, setResultPlan] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai-catering-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion,
          guestCount,
          budget: budget ? parseInt(budget, 10) : undefined,
          preferredStyle,
          notes
        })
      });

      const data = await res.json();
      if (data.success && data.plan) {
        setResultPlan(data.plan);
      } else {
        setErrorMessage(data.message || "تعذر إنشاء الخطة حالياً، يمكنك اختيار باقة من المنيو مباشرة");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header with Official Celebre Emblem */}
        <div className="px-6 py-3.5 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CelebreLogo size="xs" showSlogan={false} />
            <div>
              <h3 className="font-black text-base sm:text-lg text-[#221B17]">
                خبير ومستشار ضيافة سيلبر الذكي
              </h3>
              <p className="text-[11px] text-[#7A6E65]">شريك مؤسس لمناسباتك السعيدة • خطة مخصصة تلائم ميزانيتك</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form or Result */}
        <div className="overflow-y-auto p-6 space-y-6">
          {!resultPlan ? (
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1.5">
                  نوع المناسبة:
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                >
                  <option value="كتب كتاب وعقد قران بالمسجد">كتب كتاب وعقد قران بالمسجد</option>
                  <option value="حفل زفاف وفرح بالقاعة">حفل زفاف وفرح بالقاعة</option>
                  <option value="حفل خطوبة وشبكة عائلية">حفل خطوبة وشبكة عائلية</option>
                  <option value="عقيقة وضيافة مباركة">عقيقة وضيافة مباركة</option>
                  <option value="مؤتمر أو استقبال رسمي VIP">مؤتمر أو استقبال رسمي VIP</option>
                </select>
              </div>

              {/* Guest Count with flexible number including > 300 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#4A3E38]">
                    عدد المعازيم والوجبات:
                  </label>
                  <span className="text-xs font-black text-[#5C1027]">
                    {guestCount} وجبة
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[50, 100, 150, 200, 300].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGuestCount(preset)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                        guestCount === preset
                          ? "bg-[#C89B3C] text-white shadow-xs"
                          : "bg-[#FAF7F2] text-[#4A3E38] hover:bg-[#F3E7D3] border border-[#E8DFD1]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="50"
                  step="10"
                  placeholder="أو اكتب أي عدد أكبر من 300 (مثل 400، 500، 1000...)"
                  value={guestCount || ""}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full text-center py-2 px-3 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 focus:border-[#5C1027] rounded-xl text-xs font-black text-[#221B17]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1.5">
                  الميزانية التقريبية الإجمالية (اختياري بالجنيه المصري):
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="مثال: 7500 أو 15000 جنيه"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1.5">
                  تفضيلات التشكيل:
                </label>
                <select
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                >
                  <option value="ميكس كفتة فحم وبانيه مع جاتوه مثلّث">ميكس كفتة فحم وبانيه مع جاتوه مثلّث (الأكثر طلباً)</option>
                  <option value="ساندوتشات بتي بان فاخرة خفيفة (رومي وكوردن بيف)">ساندوتشات بتي بان فاخرة خفيفة (رومي وكوردن بيف)</option>
                  <option value="باقة VIP ملوكية شاملة ميني بيتزا وباتيه وكفتة">باقة VIP ملوكية شاملة ميني بيتزا وباتيه وكفتة</option>
                  <option value="اقتصادي عملي وسريع">اقتصادي عملي وسريع للتوزيع العاجل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1.5">
                  ملاحظات أو طلبات خاصة:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: نريد موعد تسليم دقيق قبل صلاة الجمعة، أو ترغب في مشروب معين..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#5C1027] hover:bg-[#721832] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>جاري تحليل البيانات وإعداد التوصية...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#C89B3C]" />
                    <span>توليد خطة الضيافة المخصصة فوراً</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F4EEDB] p-5 rounded-2xl border border-[#C89B3C]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#5C1027] bg-white px-3 py-1 rounded-full border border-[#E8DFD1]">
                    خطة موصى بها
                  </span>
                  <span className="text-xs font-bold text-[#7A6E65]">
                    {guestCount} وجبة
                  </span>
                </div>

                <h4 className="text-lg font-black text-[#221B17]">
                  {resultPlan.recommendationTitle || "خطة الضيافة المقترحة"}
                </h4>

                <div className="text-sm font-bold text-[#5C1027]">
                  الباقة الموصى بها: {resultPlan.suggestedPackage}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8DFD1]">
                  <div className="bg-white p-3 rounded-xl border border-[#E8DFD1]">
                    <div className="text-[11px] text-[#7A6E65]">تكلفة العلبة التقديرية:</div>
                    <div className="text-base font-black text-[#5C1027]">
                      {resultPlan.estimatedCostPerBox || 50} جنيه
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8DFD1]">
                    <div className="text-[11px] text-[#7A6E65]">الإجمالي التقديري:</div>
                    <div className="text-base font-black text-[#C89B3C]">
                      {(resultPlan.totalEstimatedCost || (guestCount * 50)).toLocaleString()} جنيه
                    </div>
                  </div>
                </div>
              </div>

              {/* Box items */}
              {resultPlan.boxContents && (
                <div className="bg-white p-4 rounded-2xl border border-[#E8DFD1] space-y-2">
                  <h5 className="font-bold text-xs text-[#221B17]">محتويات العلبة الكرتونية المقترحة:</h5>
                  <ul className="space-y-1.5 text-xs text-[#4A3E38]">
                    {resultPlan.boxContents.map((it: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advice */}
              {resultPlan.advice && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
                  💡 <strong>نصيحة خبير سيلبر:</strong> {resultPlan.advice}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResultPlan(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#FAF7F2]"
                >
                  إعادة المحاولة
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const matched = packages.find(p => p.name.includes("Sale-04") || p.name.includes("Sale-01")) || packages[0];
                    if (onSelectSuggestedPackage && matched) {
                      onSelectSuggestedPackage(matched, guestCount);
                    }
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-xs shadow-md"
                >
                  <span>اعتماد والطلب الآن</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
