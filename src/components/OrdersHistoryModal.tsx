import React, { useState, useEffect } from 'react';
import { OrderSubmission } from '../types';
import { 
  X, 
  FileText, 
  Search, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Phone, 
  MessageCircle,
  PackageCheck
} from 'lucide-react';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice: (order: OrderSubmission) => void;
}

export const OrdersHistoryModal: React.FC<OrdersHistoryModalProps> = ({
  isOpen,
  onClose,
  onViewInvoice,
}) => {
  if (!isOpen) return null;

  const [ordersList, setOrdersList] = useState<OrderSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && data.orders) {
          setOrdersList(data.orders);
        }
      } catch (err) {
        console.warn('Could not fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = ordersList.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone?.includes(searchTerm) ||
    o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.occasion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 text-right">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FAF7F2] rounded-3xl border border-[#D9C49C] shadow-2xl">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#5C1027] to-[#450919] text-white rounded-t-3xl relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#2C0A15] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">سجل ومتابعة طلبات الكاترنج</h3>
              <p className="text-xs text-[#EAD5BA]">تتبع حالة تجهيز العبوات واستعرض الفواتير المعتمدة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-[#E8DEC9] bg-[#FAF3E5]">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الطلب (CEL-xxxx) أو رقم الهاتف أو اسم العميل..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:ring-2 focus:ring-[#721832] focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#8C5E13] absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#7A6B5C]">جاري تحميل الطلبات...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-[#7A6B5C]">
              <PackageCheck className="w-12 h-12 mx-auto text-[#C89B3C] opacity-50 mb-2" />
              <div className="font-bold text-sm text-[#2C0A15]">لا توجد طلبات مطابقة للبحث</div>
              <p className="text-xs mt-1">عند تسجيل أي طلب حجز جديد سيظهر هنا تلقائياً.</p>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-white border border-[#E8DEC9] shadow-xs space-y-3 hover:border-[#C89B3C] transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0E6D5] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#5C1027]">{ord.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0E1] text-[#8C5E13] text-[10px] font-bold">
                      {ord.occasion}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>تم التأكيد</span>
                    </span>

                    <button
                      onClick={() => onViewInvoice(ord)}
                      className="px-3 py-1 rounded-lg bg-[#FAF0E1] hover:bg-[#F2E0C4] text-[#5C1027] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>عرض الفاتورة</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#524438]">
                  <div>• <strong>العميل:</strong> {ord.customerName}</div>
                  <div>• <strong>الهاتف:</strong> <span dir="ltr" className="font-mono">{ord.phone}</span></div>
                  <div>• <strong>تاريخ الحفل:</strong> {ord.eventDate}</div>
                  <div className="sm:col-span-2">• <strong>المكان:</strong> {ord.venueName} - {ord.governorate}</div>
                  <div>• <strong>المبلغ:</strong> <span className="font-mono font-bold text-[#5C1027]">{ord.totalAmount?.toLocaleString()} ج.م</span> ({ord.totalBoxes} عبوة)</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
