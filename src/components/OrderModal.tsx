import React, { useState } from 'react';
import { OrderItem, OrderSubmission } from '../types';
import { GOVERNORATES } from '../data/cateringData';
import { 
  X, 
  CheckCircle2, 
  MessageCircle, 
  CreditCard, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  ShieldCheck, 
  Sparkles,
  Heart,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import officialLogoTransparent from '../assets/images/celebre_official_logo_transparent.png';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onOrderSuccess: (order: OrderSubmission) => void;
  onOpenPrivacyPolicy?: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  items = [],
  onOrderSuccess,
  onOpenPrivacyPolicy,
}) => {
  if (!isOpen) return null;

  const safeItems = items || [];
  const totalBoxes = safeItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = safeItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [occasion, setOccasion] = useState('كتب كتاب وعقد قران');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('06:00 مساءً');
  const [governorate, setGovernorate] = useState(GOVERNORATES[0]);
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [customCardText, setCustomCardText] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'cash_deposit' | 'bank_transfer'>('instapay');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submission: OrderSubmission = {
      id: `CEL-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      phone,
      secondaryPhone,
      occasion,
      eventDate,
      eventTime,
      governorate,
      venueName,
      address,
      items: safeItems,
      totalBoxes,
      totalAmount,
      notes,
      paymentMethod,
      customCardText,
    };

    try {
      // Post to backend server
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
    } catch (err) {
      console.warn('Backend order save fallback:', err);
    }

    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#5C1027', '#D4AF37', '#FAF7F2', '#2E7D32']
    });

    setIsSubmitting(false);
    onOrderSuccess(submission);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#FAF7F2] rounded-3xl border border-[#D9C49C] shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#5C1027] via-[#4A0A1D] to-[#380614] text-white rounded-t-3xl relative">
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
                alt="Celebre Official Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">تأكيد حجز وبيانات مناسبة سيلبر</h3>
              <p className="text-xs text-[#EAD5BA] mt-0.5">
                يرجى ملء تفاصيل موعد ومكان الحفل لضمان التجهيز والتسليم في الموعد المحدد بدقة.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary Strip */}
        <div className="px-6 py-3 bg-[#FAF0E1] border-b border-[#E3D4BC] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#5C1027] font-semibold">
            <span>📦 إجمالي الطلبية:</span>
            <span className="font-mono font-bold">{totalBoxes} عبوة</span>
            <span className="text-[#8C5E13]">({safeItems.length} باقات)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#695A4D]">الإجمالي المطلوب:</span>
            <span className="font-mono font-black text-sm text-[#5C1027]">{totalAmount.toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {/* Section 1: Customer Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#5C1027] flex items-center gap-1.5 border-b border-[#E8DEC9] pb-1.5">
              <User className="w-4 h-4 text-[#C89B3C]" />
              <span>1. بيانات العميل والتواصل:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs text-[#4F4134] font-medium">الاسم الكريم (أو اسم العروسين): *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد الشناوي"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#4F4134] font-medium">رقم الهاتف (الواتساب الأساسي): *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 01001234567"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-[#4F4134] font-medium">رقم هاتف بديل أو مسؤول الاستلام بالقاعة:</label>
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  placeholder="مثال: 01119876543"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Event Time & Location */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#5C1027] flex items-center gap-1.5 border-b border-[#E8DEC9] pb-1.5">
              <Calendar className="w-4 h-4 text-[#C89B3C]" />
              <span>2. موعد ومكان المناسبة:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs text-[#4F4134] font-medium">تاريخ المناسبة: *</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#4F4134] font-medium">وقت التسليم المرغوب: *</label>
                <input
                  type="text"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="مثال: 06:00 مساءً (قبل كتب الكتاب بساعة)"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#4F4134] font-medium">منطقة التوصيل (بني سويف): *</label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none font-bold text-[#5C1027]"
                >
                  {GOVERNORATES.map((gov, idx) => (
                    <option key={idx} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#4F4134] font-medium">اسم المسجد أو القاعة أو العنوان: *</label>
                <input
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="مثال: مسجد عمر بن عبد العزيز / قاعة على النيل"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-[#4F4134] font-medium">العنوان بالتفصيل أو علامة مميزة:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: شارع عبد السلام عارف، أو كورنيش النيل، أو الحي الأول شرق النيل..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-[#5C1027]">3. طريقة سداد العربون وتأكيد الحجز:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'instapay', label: 'إنستاباي (InstaPay)', icon: '⚡' },
                { id: 'cash_deposit', label: 'عربون كاش بالفرع', icon: '💵' },
                { id: 'bank_transfer', label: 'تحويل بنكي CIB / الأهلي', icon: '🏦' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPaymentMethod(p.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === p.id
                      ? 'bg-[#FAF0E1] border-[#5C1027] font-bold text-[#5C1027] shadow-xs'
                      : 'bg-white border-[#E8DEC9] text-[#695B4E] hover:bg-[#FAF6EE]'
                  }`}
                >
                  <div className="text-sm mb-0.5">{p.icon}</div>
                  <div className="text-[11px] leading-tight">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-[#5C1027]">ملاحظات خاصة بفريق التجهيز والتوصيل:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يرجى التوصيل داخل أكياس حرارية معقمة والتسليم لمسؤول القاعة..."
              className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
            />
          </div>

          {/* Contract & Privacy Policy Notice */}
          <div className="bg-[#FFF9EB] p-3.5 rounded-2xl border border-[#E8C882] text-xs text-[#5C3D10] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#8C5E13] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8C5E13]" />
                <span>شروط التعاقد وسياسة الخصوصية الملزمة:</span>
              </span>
              {onOpenPrivacyPolicy && (
                <button
                  type="button"
                  onClick={onOpenPrivacyPolicy}
                  className="text-[11px] font-bold text-[#721832] underline hover:text-[#5C1027] cursor-pointer"
                >
                  قراءة الوثيقة كاملة ↗
                </button>
              )}
            </div>
            <ul className="text-[11px] text-[#694E27] space-y-1 list-disc list-inside pr-1 leading-relaxed">
              <li>
                <strong>لا يمكن إرجاع الأوردر:</strong> نظراً لأن المصنع يقوم بإنتاجه وتجهيز مكوناته الطازجة وعبواته الفاخرة خصيصاً للعميل.
              </li>
              <li>
                <strong>تفعيل الطلب:</strong> لا يتم تحريك الطلب أو جدولته بالمصنع إلا بعد دفع 50% من قيمة التعاقد كعربون.
              </li>
              <li>
                <strong>الشحن والتوصيل:</strong> غير مشمول في سعر العرض، والطلبات أكثر من 500 عبوة فقط تستحق الشحن المجاني (داخل مدينة بني سويف وشرق النيل فقط - ولا يشمل القرى أو المراكز أو الفيوم).
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E8DEC9] flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#5C1027] hover:bg-[#721832] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#E5C06E]" />
                  <span>جاري تسجيل الطلب وإصدار الفاتورة...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#E5C06E]" />
                  <span>تأكيد الحجز واستلام الفاتورة الرسمية</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#F0E4D0] text-[#5C1027] font-bold text-xs hover:bg-[#E8D9C2] transition-colors cursor-pointer"
            >
              رجوع للسلة
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
