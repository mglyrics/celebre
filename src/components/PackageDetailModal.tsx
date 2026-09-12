import React, { useState } from 'react';
import { CateringPackage, OrderItem } from '../types';
import { 
  X, 
  Check, 
  Sparkles, 
  Gift, 
  ShieldCheck, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  Layers,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PackageDetailModalProps {
  pkg?: CateringPackage | null;
  packageItem?: CateringPackage | null;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  pkg,
  packageItem,
  onClose,
  onAddToCart,
}) => {
  const activePkg = packageItem || pkg;
  if (!activePkg) return null;

  const isCustomChocolate = activePkg.id === 'pkg-custom-chocolate' || activePkg.id.includes('chocolate');
  const stepAmount = isCustomChocolate ? 1 : 10;

  const [quantity, setQuantity] = useState(activePkg.minOrder || (isCustomChocolate ? 1 : 30));
  const [customCardText, setCustomCardText] = useState('');
  const [selectedDrink, setSelectedDrink] = useState('عصير مانجو فريش طبيعي');

  const totalPrice = quantity * activePkg.pricePerBox;

  const handleAdd = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#5C1027', '#D4AF37', '#FAF7F2']
    });

    const orderItem: OrderItem = {
      id: `pkg-${activePkg.id}-${Date.now()}`,
      type: 'preset',
      name: activePkg.name,
      details: (activePkg.sections || []).flatMap(s => s.items || []),
      packagingName: activePkg.packaging?.type || 'علبة سيلبر الفاخرة',
      quantity: quantity,
      pricePerBox: activePkg.pricePerBox,
      totalPrice: totalPrice,
      customCardText: customCardText.trim() ? customCardText : undefined,
    };

    onAddToCart(orderItem);
    onClose();
  };

  const handleQuickWhatsApp = () => {
    const customNameNotice = customCardText.trim() ? `\nالاسم المطبوع: ${customCardText.trim()}` : '';
    const advanceNotice = isCustomChocolate ? '\n(علماً بأن الطلب قبل المناسبة بـ 5 أيام على الأقل)' : '';
    const text = `مرحباً سيلبر (Celebre) 🌸\nأرغب في حجز:\n*${activePkg.name}*\nالكمية: ${quantity} علبة\nالسعر الإجمالي: ${totalPrice.toLocaleString()} جنيه مصري${customNameNotice}${advanceNotice}\nأرجو إفادتي بإمكانية الحجز وتفاصيل التوصيل (مدينة بني سويف / شرق النيل).`;
    window.open(`https://wa.me/201284484868?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FAF7F2] rounded-3xl border border-[#D9C49C] shadow-2xl text-right">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#5C1027] shadow-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#2C0A15]">
          <img
            src={activePkg.image}
            alt={activePkg.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C0A15] via-[#2C0A15]/40 to-transparent" />

          {/* Badges and titles inside cover */}
          <div className="absolute bottom-4 right-6 left-6 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              {activePkg.badge && (
                <span className="px-3 py-0.5 rounded-full bg-[#D4AF37] text-[#2C0A15] text-xs font-black">
                  {activePkg.badge}
                </span>
              )}
              <span className="text-xs text-[#E5C06E] font-['Playfair_Display'] font-semibold">
                {activePkg.nameEn}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{activePkg.name}</h2>
            <p className="text-xs sm:text-sm text-[#E6DCBC] mt-1 line-clamp-1">{activePkg.tagline}</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Price & Min Order Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#F2E8D7] border border-[#DFCBB0]">
            <div>
              <div className="text-xs text-[#7A5B2E] font-semibold">سعر العبوة الفردية</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#5C1027] font-mono">{activePkg.pricePerBox}</span>
                <span className="text-sm font-bold text-[#5C1027]">ج.م / العبوة</span>
                {activePkg.originalPrice && (
                  <span className="text-xs text-[#8C7B6C] line-through font-mono">
                    {activePkg.originalPrice} ج.م
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-[#7A5B2E] font-semibold">الحد الأدنى للطلب</div>
              <div className="text-sm font-bold text-[#2C0A15]">{activePkg.minOrder} عبوة فأكثر</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[#4E443B] leading-relaxed">
            {activePkg.description}
          </p>

          {/* Menu Sections Breakdown */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#5C1027] flex items-center gap-2 border-b border-[#E3D6BE] pb-2">
              <Sparkles className="w-4 h-4 text-[#C89B3C]" />
              <span>محتويات العبوة الكاملة بالتفصيل</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activePkg.sections || []).map((section, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E5DAC8] shadow-xs">
                  <h4 className="text-xs font-bold text-[#8C5E13] mb-2.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C89B3C]" />
                    <span>{section.title}</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {(section.items || []).map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs text-[#423932] flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Packaging & Hygiene Highlights */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF0E1] to-[#F4E4CE] border border-[#D9C49C] text-xs text-[#524438] space-y-2">
            <div className="font-bold text-[#5C1027] flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#C89B3C]" />
              <span>مواصفات التغليف والتقديم:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>• <strong>نوع الصندوق:</strong> {activePkg.packaging?.type || 'علبة فاخرة'}</div>
              <div>• <strong>التصميم:</strong> {isCustomChocolate ? 'علبة سيلبر المذهبة الرسمية الفاخرة بطباعة الاسم' : 'تصميم سيلبر الكرتوني المذهب المعتمد والمحكم الإغلاق'}</div>
              <div>• <strong>المستلزمات:</strong> {isCustomChocolate ? 'علبة كرتونية صلبة مذهبة مع كارت إهداء خاص وطباعة مخصصة' : 'تشمل شوكة ومنديل معقم في غلاف منفصل وعصير بخيرة'}</div>
              <div>• <strong>الحفظ:</strong> {isCustomChocolate ? 'قوالب مقسمة ومذهبة لحماية القطع والحفاظ على بريقها' : 'أكياس حرارية لنقل الطعام طازجاً وساخناً'}</div>
            </div>
          </div>

          {/* Custom Chocolate Special Notice & Name Customization */}
          {isCustomChocolate && (
            <div className="p-4 rounded-2xl bg-[#FFF9EE] border-2 border-[#D4AF37] text-right space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-[#5C1027] font-bold text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>علبة شيكولاتة 40 قطعة باسم صاحب المناسبة (800 ج بدلاً من 850 ج)</span>
              </div>
              <p className="text-xs text-[#6B5738] leading-relaxed">
                ✨ <strong>تنبيه مواعيد الحجز:</strong> تطلب هذه العلبة قبل موعد المناسبة بـ <strong className="text-[#5C1027]">5 أيام على الأقل</strong> لضمان حفر وتجهيز قوالب الشوكولاتة والطباعة المخصصة بأعلى جودة.
              </p>
              <div className="pt-2 border-t border-[#F0DFBE]">
                <label className="block text-xs font-bold text-[#5C1027] mb-1.5">
                  الاسم أو التهنئة المراد طباعتها على العلبة والقطع:
                </label>
                <input
                  type="text"
                  value={customCardText}
                  onChange={(e) => setCustomCardText(e.target.value)}
                  placeholder="مثال: م. أحمد & د. سارة - كتب كتاب مبارك"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D4AF37] text-xs text-[#2C0A15] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>
          )}

          {/* Quantity Selector & Total Calculation */}
          <div className="p-5 rounded-2xl bg-[#5C1027] text-white space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#E5C06E] font-medium">اختر عدد العبوات المطلوبة</span>
                <div className="text-xs text-[#EAD8BD]">الحد الأدنى: {activePkg.minOrder} {isCustomChocolate ? 'علبة' : 'عبوة'}</div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 bg-[#420A1A] px-3 py-1.5 rounded-xl border border-[#C89B3C]/40">
                <button
                  onClick={() => setQuantity(Math.max(activePkg.minOrder, quantity - stepAmount))}
                  className="p-1.5 rounded-lg bg-[#5C1027] hover:bg-[#721832] text-white cursor-pointer"
                  title={`إنقاص ${stepAmount}`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <input
                  type="number"
                  min={activePkg.minOrder}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(activePkg.minOrder, parseInt(e.target.value) || activePkg.minOrder))}
                  className="w-16 text-center font-mono font-bold text-base bg-transparent text-[#FFDF9E] focus:outline-none"
                />

                <button
                  onClick={() => setQuantity(quantity + stepAmount)}
                  className="p-1.5 rounded-lg bg-[#5C1027] hover:bg-[#721832] text-white cursor-pointer"
                  title={`زيادة ${stepAmount}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total summary */}
            <div className="pt-3 border-t border-[#82213D] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#EAD8BD]">الإجمالي التقديري لـ ({quantity} عبوة):</span>
                <div className="text-2xl font-black text-[#FFDF9E] font-mono">
                  {totalPrice.toLocaleString()} <span className="text-xs font-normal text-white">جنيه مصري</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickWhatsApp}
                  className="px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  title="طلب مباشر عبر واتساب"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">واتساب سريع</span>
                </button>

                <button
                  onClick={handleAdd}
                  className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C06E] text-[#3B0715] font-black text-xs sm:text-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>إضافة إلى سلة الحجز</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
