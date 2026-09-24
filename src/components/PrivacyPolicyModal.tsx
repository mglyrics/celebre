import React from "react";
import { X, ShieldCheck } from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-6 max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#5C1027]" />
            <h3 className="font-black text-base text-[#221B17]">
              سياسة الخصوصية وشروط الحجز والتوريد - سيلبر
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4 text-xs text-[#4A3E38] leading-relaxed">
          <section className="space-y-1">
            <h4 className="font-bold text-[#221B17] text-sm">1. خصوصية بيانات العميل:</h4>
            <p>
              تلتزم إدارة سيلبر بالحفاظ التام على سرية بيانات العملاء المسجلة (الاسم، الهاتف، موقع المناسبة). لا يتم استخدام هذه البيانات إلا لغرض التنسيق والتوصيل وتأكيد الحجز ومتابعة الجودة.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-[#221B17] text-sm">2. شروط الحجز والعربون:</h4>
            <p>
              - الحد الأدنى للطلب هو 50 وجبة.<br />
              - يتم اعتماد وتأكيد الحجز بسداد عربون 50% من إجمالي الفاتورة عبر إنستاباي أو فودافون كاش.<br />
              - يتم سداد الـ 50% المتبقية فور الاستلام بعد مراجعة العلب.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-[#221B17] text-sm">3. مواعيد التسليم والتعديل:</h4>
            <p>
              - يمكن تعديل كمية الوجبات أو إضافتها قبل موعد المناسبة بـ 48 ساعة على الأقل.<br />
              - تلتزم سيلبر بالتسليم في الموعد المحدد بدقة بسيارات مجهزة ومبردة.
            </p>
          </section>
        </div>

        <div className="px-6 py-3 bg-[#FAF7F2] border-t border-[#F0EAE1] text-left">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-[#5C1027] text-white font-bold text-xs rounded-xl hover:bg-[#721832]"
          >
            فهمت وموافق
          </button>
        </div>
      </div>
    </div>
  );
};
