import React from 'react';
import { OrderItem } from '../types';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  ArrowLeft, 
  Gift, 
  CreditCard,
  Crown
} from 'lucide-react';
import officialLogoTransparent from '../assets/images/celebre_official_logo_transparent.png';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onOpenPrivacyPolicy,
}) => {
  if (!isOpen) return null;

  const safeItems = items || [];
  const totalBoxes = safeItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = safeItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleWhatsAppDirectCheckout = () => {
    if (safeItems.length === 0) return;

    let itemsList = safeItems.map((item, idx) => {
      return `*باقة ${idx + 1}: ${item.name}*\n• الكمية: ${item.quantity} عبوة\n• سعر العبوة: ${item.pricePerBox} ج.م\n• الإجمالي: ${item.totalPrice.toLocaleString()} ج.م\n${item.customCardText ? `• كارت الإهداء: ${item.customCardText}\n` : ''}`;
    }).join('\n------------------\n');

    const msg = `مرحباً سيلبر (Celebre) 🌸\nأود إتمام حجز طلبية عبوات الكاترنج التالية:\n\n${itemsList}\n\n*إجمالي العبوات:* ${totalBoxes} عبوة\n*المبلغ الإجمالي:* ${totalAmount.toLocaleString()} جنيه مصري\n\nأرجو إرسال تفاصيل تأكيد الميعاد والحساب.`;
    window.open(`https://wa.me/201284484868?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 text-right">
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-[#FAF7F2] border-r border-[#D9C49C] shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#5C1027] to-[#450919] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-[#C89B3C]/50 p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img
                  src={officialLogoTransparent}
                  alt="Celebre Logo"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-bold text-base">سلة طلبات سيلبر</h3>
                <span className="text-xs text-[#FFDF9E]">
                  {totalBoxes > 0 ? `${totalBoxes} عبوة محددة للحجز` : 'السلة فارغة'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#78695C]">
                <div className="w-16 h-16 rounded-full bg-[#FAF0E1] border border-[#DFCBB0] flex items-center justify-center text-[#5C1027] mb-3">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="font-bold text-base text-[#2C0A15] mb-1">لم تقم بإضافة أي باقات بعد</h4>
                <p className="text-xs text-[#736456] leading-relaxed max-w-xs mb-4">
                  تصفح باقات كتب الكتاب والزفاف وعروض المنيو الجاهزة واطلب ضيافتك الآن.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#5C1027] text-white text-xs font-bold hover:bg-[#721832] transition-colors cursor-pointer"
                >
                  استكشاف الباقات الآن
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-[#E8DEC9] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#2C0A15]">{item.name}</h4>
                      <span className="text-[11px] text-[#8C5E13] font-medium block mt-0.5">
                        {item.packagingName}
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-[#992222] hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Item Details snippet */}
                  <div className="p-2 rounded-xl bg-[#FAF7F2] text-[11px] text-[#55473A] space-y-0.5 max-h-20 overflow-y-auto no-scrollbar">
                    {item.details.slice(0, 3).map((d, dIdx) => (
                      <div key={dIdx} className="truncate">• {d}</div>
                    ))}
                    {item.details.length > 3 && (
                      <div className="text-[#8C5E13] text-[10px]">+ {item.details.length - 3} أصناف أخرى</div>
                    )}
                  </div>

                  {item.customCardText && (
                    <div className="text-[10px] text-[#5C1027] bg-[#FAF0E1] p-1.5 rounded-lg">
                      ❤️ <strong>كارت الإهداء:</strong> {item.customCardText}
                    </div>
                  )}

                  {/* Quantity & Item Total Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F2E8D7]">
                    <div className="flex items-center gap-2 bg-[#FAF4E8] p-1 rounded-xl border border-[#D9C49C]">
                      <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(10, item.quantity - 10))}
                        className="w-6 h-6 rounded-lg bg-white text-[#5C1027] font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-xs text-[#5C1027]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 10)}
                        className="w-6 h-6 rounded-lg bg-[#5C1027] text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-[#7A6B5C] block">الإجمالي:</span>
                      <span className="font-mono font-bold text-sm text-[#5C1027]">
                        {item.totalPrice.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Checkout Actions */}
          {items.length > 0 && (
            <div className="p-5 bg-white border-t border-[#E8DEC9] space-y-3 shadow-lg">
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#6E6053]">
                  <span>إجمالي العبوات:</span>
                  <span className="font-bold font-mono text-[#2C0A15]">{totalBoxes} عبوة</span>
                </div>
                <div className="flex justify-between text-[#6E6053]">
                  <span>التوصيل والتغليف:</span>
                  <span className="font-semibold text-[#2E7D32]">أكياس حرارية معقمة مشمولة</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#F0E5D4]">
                  <span className="font-bold text-sm text-[#2C0A15]">المبلغ الإجمالي:</span>
                  <div className="text-xl font-black text-[#5C1027] font-mono">
                    {totalAmount.toLocaleString()} <span className="text-xs font-normal">جنيه مصري</span>
                  </div>
                </div>
              </div>

              {/* Free Shipping & Terms Alert */}
              <div className={`p-2.5 rounded-xl border text-[11px] leading-tight space-y-1 ${
                totalBoxes >= 500
                  ? 'bg-[#E8F5E9] border-[#81C784] text-[#1B5E20]'
                  : 'bg-[#FFF9EB] border-[#E8C882] text-[#694E27]'
              }`}>
                {totalBoxes >= 500 ? (
                  <div className="font-bold flex items-center gap-1">
                    <span>🎉</span>
                    <span>طلبك ({totalBoxes} عبوة) مؤهل للشحن المجاني ببني سويف أو الفيوم!</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <div className="font-bold flex items-center justify-between">
                      <span>🚚 الشحن غير مشمول في سعر العرض:</span>
                      {onOpenPrivacyPolicy && (
                        <button
                          type="button"
                          onClick={() => { onClose(); onOpenPrivacyPolicy(); }}
                          className="text-[#721832] underline hover:text-[#5C1027] font-bold cursor-pointer"
                        >
                          الشروط
                        </button>
                      )}
                    </div>
                    <span>مجاني فقط للطلبات فوق 500 عبوة (بني سويف أو الفيوم). باقي لك {500 - totalBoxes} عبوة للشحن المجاني.</span>
                  </div>
                )}
                <div className="text-[10px] text-gray-500 pt-0.5 border-t border-black/5">
                  * يُشترط سداد 50% عربون لبدء تحريك وتشغيل الطلب بالمصنع. (الأوردر غير قابل للإرجاع).
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onCheckout();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4 text-[#E5C06E]" />
                  <span>تأكيد الحجز وتعبئة بيانات المناسبة</span>
                </button>

                <button
                  onClick={handleWhatsAppDirectCheckout}
                  className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال الطلب فوراً إلى واتساب (01284484868)</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
