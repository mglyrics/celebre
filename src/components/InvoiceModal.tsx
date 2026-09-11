import React from 'react';
import { OrderSubmission } from '../types';
import { CelebreLogo } from './CelebreLogo';
import { 
  X, 
  Printer, 
  MessageCircle, 
  Phone, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Clock, 
  CreditCard,
  Download,
  Share2
} from 'lucide-react';

interface InvoiceModalProps {
  order: OrderSubmission | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  onClose,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsAppConfirmation = () => {
    const safeItems = order.items || [];
    let itemsText = safeItems.map((it, idx) => {
      return `*${idx + 1}. ${it.name}*\n  • الكمية: ${it.quantity} عبوة\n  • سعر العبوة: ${it.pricePerBox} ج.م\n  • الإجمالي: ${it.totalPrice.toLocaleString()} ج.م`;
    }).join('\n');

    const msg = `مرحباً سيلبر (Celebre) 🌸\nأرغب في تأكيد حجز الطلبية المسجلة برقم *${order.id}*:\n\n*الاسم:* ${order.customerName}\n*رقم الهاتف:* ${order.phone}\n*المناسبة:* ${order.occasion}\n*تاريخ ووقت الحفل:* ${order.eventDate} - ${order.eventTime}\n*المكان:* ${order.venueName} (${order.governorate})\n\n*تفاصيل الباقات:*\n${itemsText}\n\n*إجمالي العبوات:* ${order.totalBoxes} عبوة\n*المبلغ الإجمالي:* ${order.totalAmount.toLocaleString()} جنيه مصري\n*طريقة الدفع المختارة:* ${order.paymentMethod}\nأرجو تزويدي برابط الدفع أو تأكيد استلام العربون.`;

    window.open(`https://wa.me/201284484868?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 text-right overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-[#C89B3C] shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:m-0">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-[#5C1027] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#E5C06E]" />
            <span className="font-bold text-sm">تم تسجيل طلب الحجز بنجاح (فاتورة رقم: {order.id})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-[#FAF0E1] text-[#5C1027] text-xs font-bold hover:bg-[#F3E2C8] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-8 space-y-6 text-[#2C0A15]">
          
          {/* Header with Logo */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#EBDDC7] pb-6 gap-4">
            <CelebreLogo variant="full" showPhone={true} />

            <div className="text-center sm:text-left space-y-1">
              <div className="inline-block px-3 py-1 bg-[#FAF0E1] border border-[#C89B3C] rounded-full text-xs font-black text-[#5C1027]">
                فاتورة حجز كاترنج معتمدة
              </div>
              <div className="text-xs text-[#7A6B5C] font-mono mt-1">رقم الطلب: <strong className="text-[#5C1027]">{order.id}</strong></div>
              <div className="text-xs text-[#7A6B5C]">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</div>
            </div>
          </div>

          {/* Customer & Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] text-xs">
            <div className="space-y-1.5">
              <div>• <strong>العميل الكريم:</strong> {order.customerName}</div>
              <div>• <strong>رقم الهاتف:</strong> <span dir="ltr" className="font-mono">{order.phone}</span></div>
              {order.secondaryPhone && <div>• <strong>هاتف بديل:</strong> <span dir="ltr" className="font-mono">{order.secondaryPhone}</span></div>}
              <div>• <strong>نوع المناسبة:</strong> {order.occasion}</div>
            </div>

            <div className="space-y-1.5">
              <div>• <strong>تاريخ الحفل:</strong> <span className="font-mono font-bold text-[#5C1027]">{order.eventDate}</span></div>
              <div>• <strong>وقت التسليم:</strong> {order.eventTime}</div>
              <div>• <strong>القاعة / المسجد:</strong> {order.venueName}</div>
              <div>• <strong>المحافظة:</strong> {order.governorate}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#5C1027] text-white text-right">
                  <th className="p-2.5 rounded-tr-xl">الباقة / الصنف</th>
                  <th className="p-2.5 text-center">الكمية</th>
                  <th className="p-2.5 text-center">سعر العبوة</th>
                  <th className="p-2.5 rounded-tl-xl text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE5D4]">
                {(order.items || []).map((it, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2]">
                    <td className="p-2.5 font-medium">
                      <div className="font-bold text-[#5C1027]">{it.name}</div>
                      <div className="text-[10px] text-[#7A6B5C]">{it.packagingName}</div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold">{it.quantity}</td>
                    <td className="p-2.5 text-center font-mono">{it.pricePerBox} ج.م</td>
                    <td className="p-2.5 text-left font-mono font-bold text-[#5C1027]">
                      {it.totalPrice.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="p-4 rounded-2xl bg-[#FAF0E1] border border-[#DFCBB0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs space-y-1">
              <div>• <strong>إجمالي العبوات:</strong> {order.totalBoxes} عبوة فردية</div>
              <div>• <strong>طريقة الدفع:</strong> {
                order.paymentMethod === 'instapay' ? 'إنستاباي (InstaPay)' :
                order.paymentMethod === 'bank_transfer' ? 'تحويل بنكي (الأهلي / CIB)' :
                order.paymentMethod === 'cash_deposit' ? 'عربون كاش بالفرع' :
                order.paymentMethod
              }</div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-r border-[#DFCBB0] pt-2 sm:pt-0 sm:pr-4">
              <span className="text-xs text-[#7A6B5C] font-semibold">المبلغ الإجمالي النهائي:</span>
              <div className="text-2xl font-black text-[#5C1027] font-mono">
                {order.totalAmount.toLocaleString()} <span className="text-xs font-normal">جنيه مصري</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8DEC9] text-[11px] text-[#55473B] space-y-2">
            <div className="font-bold text-[#5C1027] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#C89B3C]" />
              <span>تعليمات سداد العربون وتأكيد الحجز:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>⚡ <strong>إنستاباي (InstaPay):</strong> عبر رقم الهاتف 01284484868</div>
              <div>🏦 <strong>تحويل بنكي معتمد:</strong> البنك الأهلي المصري / CIB</div>
              <div>💵 <strong>عربون كاش:</strong> يتم التنسيق مع المندوب أو بمقر الفرع</div>
              <div>📞 <strong>خدمة العملاء:</strong> 01284484868 متواجدون على مدار الساعة</div>
            </div>
          </div>

          {/* Bottom Actions (Hidden on Print) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 print:hidden">
            <button
              onClick={handleSendWhatsAppConfirmation}
              className="w-full sm:flex-1 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال الفاتورة لتأكيد الحجز عبر واتساب</span>
            </button>

            <a
              href="tel:01284484868"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#5C1027] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#721832] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#E5C06E]" />
              <span>اتصال مباشر: 01284484868</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
