import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building2,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  RefreshCw,
  Clock,
  Shield,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import {
  CustomerAccountStatement,
  FactoryAccountStatement,
  BookingProfitability,
  FinancialMovementRecord,
} from '../../services/accountingService';

/* =========================================================================
   1. CUSTOMER ACCOUNT STATEMENT MODAL
   ========================================================================= */
export const CustomerStatementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orderIdOrNumber: string | number;
  token?: string;
  onPaymentAdded?: () => void;
}> = ({ isOpen, onClose, orderIdOrNumber, token, onPaymentAdded }) => {
  const [statement, setStatement] = useState<CustomerAccountStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = async () => {
    if (!orderIdOrNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounting/customer-statement/${orderIdOrNumber}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'x-requested-with': 'XMLHttpRequest',
        },
      });
      const data = await res.json();
      if (data.success) {
        setStatement(data.statement);
      } else {
        setError(data.message || 'فشل تحميل كشف حساب العميل');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل كشف الحساب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatement();
    }
  }, [isOpen, orderIdOrNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFD1] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-t-3xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-300" />
              <h3 className="font-black text-base sm:text-lg">كشف حساب العميل (Customer Account Statement)</h3>
            </div>
            <p className="text-xs text-emerald-100">
              حجز رقم: <span className="font-mono font-bold">{statement?.orderNumber || orderIdOrNumber}</span> • العميل: <span className="font-bold">{statement?.customerName || 'جار التحميل...'}</span> ({statement?.customerPhone})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#5C1027]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C89B3C]" />
              <span className="text-xs font-bold">جارٍ تحميل وتدقيق كشف الحساب...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statement && !loading && (
            <>
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  <span className="text-[10px] text-[#6B5E55] font-bold block mb-1">إجمالي الحجز المعتمد</span>
                  <span className="text-base sm:text-lg font-black text-[#5C1027] block font-mono">
                    {statement.totalApprovedAmount.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-[#8C6D28]">المبلغ الإجمالي المستحق</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  <span className="text-[10px] text-[#6B5E55] font-bold block mb-1">العربون المطلوب (50%)</span>
                  <span className="text-base sm:text-lg font-black text-amber-700 block font-mono">
                    {statement.requiredDeposit.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-amber-800">قيمة التأكيد المبدئي</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/40">
                  <span className="text-[10px] text-emerald-800 font-bold block mb-1">المدفوع الفعلي المؤكد</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 block font-mono">
                    {statement.totalCustomerPaid.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-emerald-700 font-semibold">مجموع الدفعات المستلمة</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  <span className="text-[10px] text-[#6B5E55] font-bold block mb-1">الرصيد المتبقي</span>
                  <span className={`text-base sm:text-lg font-black block font-mono ${statement.customerRemaining > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {statement.customerRemaining.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-[#6B5E55]">المتبقي للتحصيل</span>
                </div>
              </div>

              {/* Collection Status Banner */}
              <div className="bg-white p-3 rounded-2xl border border-[#E8DFD1] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#4A3E38]">حالة التحصيل الحالية:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    statement.collectionStatus === 'FULLY_PAID' || statement.collectionStatus === 'OVERPAID'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : statement.collectionStatus === 'DEPOSIT_PAID'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : statement.collectionStatus === 'PARTIAL_DEPOSIT'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}>
                    {statement.collectionStatusArabic}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B5E55]">
                  النسبة المسددة: <strong>{statement.totalApprovedAmount > 0 ? Math.min(100, Math.round((statement.totalCustomerPaid / statement.totalApprovedAmount) * 100)) : 0}%</strong>
                </span>
              </div>

              {/* Payments & Refunds Ledger */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                  <h4 className="font-black text-xs text-emerald-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span>سجل الدفعات والاستردادات للعميل (Transactions Ledger):</span>
                  </h4>
                  <span className="text-[10px] text-[#6B5E55]">
                    الدفعات المؤكدة فقط تدخل في إجمالي المحصل
                  </span>
                </div>

                {statement.payments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6B5E55]">
                    لم يتم تسجيل أي دفعات أو تحويلات مالية لهذا الحجز حتى الآن.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E8DFD1]">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#FAF7F2] text-[#5C1027] font-bold border-b border-[#E8DFD1]">
                        <tr>
                          <th className="p-2.5">كود الحركة</th>
                          <th className="p-2.5">المبلغ</th>
                          <th className="p-2.5">النوع</th>
                          <th className="p-2.5">طريقة الدفع</th>
                          <th className="p-2.5">المرجع</th>
                          <th className="p-2.5">الحالة</th>
                          <th className="p-2.5">المسؤول</th>
                          <th className="p-2.5">التاريخ والوقت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DFD1]">
                        {statement.payments.map((p) => (
                          <tr key={p.id} className={`hover:bg-[#FAF7F2]/60 ${p.isRefund ? 'bg-red-50/50' : ''}`}>
                            <td className="p-2.5 font-mono font-bold text-[#5C1027]">{p.transactionCode}</td>
                            <td className="p-2.5 font-bold font-mono">
                              <span className={p.isRefund ? 'text-red-700' : 'text-emerald-700'}>
                                {p.isRefund ? '-' : '+'}{p.amount.toLocaleString()} ج.م
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.isRefund
                                  ? 'bg-red-100 text-red-800'
                                  : p.movementType === 'CORRECTION'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {p.isRefund ? 'استرداد مالي' : p.movementType === 'CORRECTION' ? 'تصحيح معتمد' : 'تحصيل دفعة'}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-[#4A3E38]">{p.paymentMethod}</td>
                            <td className="p-2.5 font-mono text-[11px] text-[#6B5E55]">{p.paymentReference || '—'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.paymentStatus === 'VERIFIED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : p.paymentStatus === 'REFUND'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : p.paymentStatus === 'CORRECTED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {p.paymentStatus}
                              </span>
                            </td>
                            <td className="p-2.5 text-[#4A3E38]">{p.receivedBy}</td>
                            <td className="p-2.5 text-[11px] text-[#6B5E55]">
                              {new Date(p.paidAt).toLocaleString('ar-EG')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Adjustments & Additions History */}
              {statement.adjustmentsHistory.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-2">
                  <h4 className="font-black text-xs text-[#5C1027]">سجل التعديلات والإضافات المالية المعتمدة:</h4>
                  <div className="divide-y divide-[#E8DFD1] text-xs">
                    {statement.adjustmentsHistory.map((adj) => (
                      <div key={adj.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#221B17]">{adj.reason}</span>
                          <span className="text-[10px] text-[#6B5E55] block">
                            المستخدم: {adj.recordedBy} • التاريخ: {new Date(adj.createdAt).toLocaleString('ar-EG')}
                          </span>
                        </div>
                        <span className="font-black font-mono text-[#5C1027]">
                          {adj.amount > 0 ? `+${adj.amount}` : adj.amount} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. FACTORY ACCOUNT STATEMENT MODAL
   ========================================================================= */
export const FactoryStatementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orderIdOrNumber: string | number;
  token?: string;
}> = ({ isOpen, onClose, orderIdOrNumber, token }) => {
  const [statement, setStatement] = useState<FactoryAccountStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = async () => {
    if (!orderIdOrNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounting/factory-statement/${orderIdOrNumber}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'x-requested-with': 'XMLHttpRequest',
        },
      });
      const data = await res.json();
      if (data.success) {
        setStatement(data.statement);
      } else {
        setError(data.message || 'فشل تحميل كشف حساب المصنع');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل كشف حساب المصنع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatement();
    }
  }, [isOpen, orderIdOrNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFD1] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-t-3xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-300" />
              <h3 className="font-black text-base sm:text-lg">كشف حساب المصنع (Factory Account Statement)</h3>
            </div>
            <p className="text-xs text-blue-100">
              المصنع: <span className="font-bold">{statement?.supplierName || 'Celebre Factory'}</span> • أمر المصنع: <span className="font-mono font-bold">{statement?.factoryOrderNumber || 'لم يُنشأ بعد'}</span> • الحجز: <span className="font-mono">{statement?.orderNumber || orderIdOrNumber}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-blue-950">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C89B3C]" />
              <span className="text-xs font-bold">جارٍ تحميل وتدقيق حساب المصنع...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statement && !loading && (
            <>
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  <span className="text-[10px] text-[#6B5E55] font-bold block mb-1">إجمالي تكلفة المصنع</span>
                  <span className="text-base sm:text-lg font-black text-blue-900 block font-mono">
                    {statement.totalFactoryCost.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-[#6B5E55]">تكلفة الشراء التاريخية</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  <span className="text-[10px] text-[#6B5E55] font-bold block mb-1">عربون المصنع المطلوب</span>
                  <span className="text-base sm:text-lg font-black text-amber-700 block font-mono">
                    {statement.requiredDeposit.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-amber-800">مستقل عن المدفوع الفعلي</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-2xs bg-blue-50/40">
                  <span className="text-[10px] text-blue-800 font-bold block mb-1">المدفوع للمصنع فعلياً</span>
                  <span className="text-base sm:text-lg font-black text-blue-700 block font-mono">
                    {statement.totalPaidToFactory.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-blue-700 font-semibold">مجموع التحويلات المؤكدة</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  <span className="text-[10px] text-[#6B5E55] font-bold block mb-1">الرصيد المتبقي للمصنع</span>
                  <span className={`text-base sm:text-lg font-black block font-mono ${statement.remainingBalanceOwed > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {statement.remainingBalanceOwed.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-[#6B5E55]">مستحق السداد</span>
                </div>
              </div>

              {/* Factory Items & Historical Price Snapshots */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                  <h4 className="font-black text-xs text-blue-900">بنود التوريد وأسعار المصنع المعتمدة وقت الإنشاء:</h4>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                    حالة أمر التوريد: {statement.factoryOrderStatus}
                  </span>
                </div>
                <div className="divide-y divide-[#E8DFD1] text-xs">
                  {statement.items.map((it, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#221B17]">{it.menuName}</span>
                        <span className="text-[11px] text-[#6B5E55] block">
                          كود الوجبة: <span className="font-mono text-blue-800 font-bold">{it.menuCode}</span> • الكمية: <strong>{it.quantity} وجبة</strong>
                        </span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-[10px] text-[#6B5E55] block">سعر المصنع للوجبة: {it.supplierUnitPrice} ج</span>
                        <span className="font-black text-blue-900 block">{it.supplierTotal.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments to Factory Ledger */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                <h4 className="font-black text-xs text-blue-900">سجل التحويلات والمدفوعات للمصنع:</h4>
                {statement.payments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6B5E55]">
                    لم يتم تسجيل أي تحويل مالي للمصنع لهذا الطلب بعد.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E8DFD1]">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#FAF7F2] text-blue-900 font-bold border-b border-[#E8DFD1]">
                        <tr>
                          <th className="p-2.5">كود الحركة</th>
                          <th className="p-2.5">المبلغ</th>
                          <th className="p-2.5">النوع</th>
                          <th className="p-2.5">طريقة التحويل</th>
                          <th className="p-2.5">رقم الإيصال / المرجع</th>
                          <th className="p-2.5">المسؤول</th>
                          <th className="p-2.5">التاريخ والوقت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DFD1]">
                        {statement.payments.map((p) => (
                          <tr key={p.id} className={`hover:bg-[#FAF7F2]/60 ${p.isRefund ? 'bg-red-50/50' : ''}`}>
                            <td className="p-2.5 font-mono font-bold text-blue-900">{p.transactionCode}</td>
                            <td className="p-2.5 font-bold font-mono">
                              <span className={p.isRefund ? 'text-red-700' : 'text-blue-700'}>
                                {p.isRefund ? '-' : '+'}{p.amount.toLocaleString()} ج.م
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.isRefund ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {p.isRefund ? 'استرداد من المصنع' : 'سداد للمصنع'}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-[#4A3E38]">{p.paymentMethod}</td>
                            <td className="p-2.5 font-mono text-[11px] text-[#6B5E55]">{p.reference || '—'}</td>
                            <td className="p-2.5 text-[#4A3E38]">{p.paidBy}</td>
                            <td className="p-2.5 text-[11px] text-[#6B5E55]">
                              {new Date(p.paidAt).toLocaleString('ar-EG')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. PROFITABILITY & CASH FLOW MODAL
   ========================================================================= */
export const ProfitabilityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orderIdOrNumber: string | number;
  token?: string;
  onExpenseAdded?: () => void;
}> = ({ isOpen, onClose, orderIdOrNumber, token, onExpenseAdded }) => {
  const [profitability, setProfitability] = useState<BookingProfitability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfitability = async () => {
    if (!orderIdOrNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounting/profitability/${orderIdOrNumber}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'x-requested-with': 'XMLHttpRequest',
        },
      });
      const data = await res.json();
      if (data.success) {
        setProfitability(data.profitability);
      } else {
        setError(data.message || 'فشل حساب ربحية الحجز');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حساب الربحية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfitability();
    }
  }, [isOpen, orderIdOrNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFD1] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#721832] to-[#420E1E] text-white p-5 rounded-t-3xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C89B3C]" />
              <h3 className="font-black text-base sm:text-lg">كشف الربحية والتدفق النقدي للحجز (Profitability & Cash Flow)</h3>
            </div>
            <p className="text-xs text-[#F4EEDB]">
              حجز رقم: <span className="font-mono font-bold text-[#C89B3C]">{profitability?.orderNumber || orderIdOrNumber}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#5C1027]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C89B3C]" />
              <span className="text-xs font-bold">جارٍ احتساب الربح المتوقع والفعلي والتدفق النقدي...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {profitability && !loading && (
            <>
              {/* Expected Profit vs Actual Profit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border-2 border-[#C89B3C]/40 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#5C1027]">الربح المتوقع (Expected Profit)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      قبل التنفيذ النهائي
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#5C1027] font-mono">
                    {profitability.expectedProfit.toLocaleString()} ج.م
                  </div>
                  <div className="space-y-1 text-xs text-[#6B5E55] pt-2 border-t border-[#E8DFD1]">
                    <div className="flex justify-between">
                      <span>إجمالي قيمة الحجز:</span>
                      <span className="font-bold">{profitability.approvedRevenue.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تكلفة المصنع المتوقعة:</span>
                      <span className="font-bold">-{profitability.expectedFactoryCost.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المصروفات المقدرة:</span>
                      <span className="font-bold">-{profitability.expectedExpenses.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">الربح الفعلي المعتمد (Actual Net Profit)</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      هامش الربح: {profitability.profitMarginPercent}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    {profitability.actualProfit.toLocaleString()} ج.م
                  </div>
                  <div className="space-y-1 text-xs text-[#6B5E55] pt-2 border-t border-emerald-200/60">
                    <div className="flex justify-between">
                      <span>الإيراد المعتمد:</span>
                      <span className="font-bold">{profitability.actualRevenue.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تكلفة المصنع الفعلية:</span>
                      <span className="font-bold text-blue-800">-{profitability.actualFactoryCost.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المصروفات الفعلية المسجلة:</span>
                      <span className="font-bold text-red-800">-{profitability.actualExpenses.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Flow Section */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                  <h4 className="font-black text-xs text-[#5C1027] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#C89B3C]" />
                    <span>حركة النقدية الفعلية للحجز (Actual Cash Flow):</span>
                  </h4>
                  <span className="text-[10px] text-[#6B5E55]">
                    المحصل الفعلي - المدفوع الفعلي للمصنع - المصروفات
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold block mb-1">النقدية المحصلة من العميل</span>
                    <span className="font-black text-emerald-700 text-sm sm:text-base font-mono">
                      +{profitability.customerCashCollected.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-[10px] text-blue-800 font-bold block mb-1">النقدية المدفوعة للمصنع</span>
                    <span className="font-black text-blue-700 text-sm sm:text-base font-mono">
                      -{profitability.factoryCashPaid.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-amber-900 font-bold block mb-1">صافي حركة النقدية (Net Cash)</span>
                    <span className={`font-black text-sm sm:text-base font-mono ${profitability.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {profitability.netCashFlow > 0 ? '+' : ''}{profitability.netCashFlow.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#6B5E55] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD1]">
                  💡 <strong>ملاحظة محاسبية:</strong> {profitability.notes}
                </p>
              </div>

              {/* Operational Expenses List */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                  <h4 className="font-black text-xs text-[#5C1027]">المصروفات التشغيلية المسجلة للحجز:</h4>
                  <span className="text-xs font-bold text-red-700">
                    الإجمالي: {profitability.actualExpenses.toLocaleString()} ج.م
                  </span>
                </div>

                {profitability.expensesList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#6B5E55]">
                    لا توجد مصروفات تشغيلية مسجلة لهذا الحجز بعد.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E8DFD1] text-xs">
                    {profitability.expensesList.map((exp) => (
                      <div key={exp.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#221B17]">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-[#5C1027] text-[10px] ml-1.5 font-bold">
                              {exp.category}
                            </span>
                            <span>{exp.description}</span>
                          </div>
                          <span className="text-[10px] text-[#6B5E55] block mt-0.5">
                            المسؤول: {exp.recordedBy} • الإيصال: {exp.receiptRef || 'بدون إيصال'} • التاريخ: {new Date(exp.date).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <span className="font-black font-mono text-red-700">
                          -{exp.amount.toLocaleString()} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. RECORD OPERATIONAL EXPENSE MODAL
   ========================================================================= */
export const RecordExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orderIdOrNumber: string | number;
  token?: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, orderIdOrNumber, token, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('شحن ونقل');
  const [description, setDescription] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (!description.trim()) {
      setError('يرجى كتابة وصف توضيحي للمصروف');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/accounting/expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-requested-with': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          orderId: orderIdOrNumber,
          amount: Number(amount),
          category,
          description: description.trim(),
          receiptRef: receiptRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'فشل تسجيل المصروف');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل المصروف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="font-black text-sm text-[#5C1027]">تسجيل مصروف تشغيلي للحجز</h3>
            <span className="text-[10px] text-[#6B5E55]">يتم خصمه من الأرباح والتدفق النقدي دون تغيير سعر المنيو</span>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-bold mb-1">قيمة المصروف (جنيه مصري) *</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مثال: 150"
              className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-black text-red-700 text-base"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">تصنيف المصروف *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-bold"
            >
              <option value="شحن ونقل">شحن ونقل وتوصيل</option>
              <option value="تغليف وشرائط">علب وتغليف وشرائط مخصصة</option>
              <option value="عمالة وبوفيه">عمالة إضافية ومساعدة تقديم</option>
              <option value="ضيافة وبنود خاصة">إضافات ضيافة وبنود خاصة</option>
              <option value="تشغيل عام">تشغيل ومصروفات أخرى</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">الوصف والتفاصيل *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف سبب المصروف والجهة التي استلمته..."
              className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">رقم الإيصال / الفاتورة (إن وجد)</label>
            <input
              type="text"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              placeholder="مثال: REC-8492"
              className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#721832] hover:bg-[#5C1027] text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-[#C89B3C]" />}
              <span>تسجيل وتوثيق المصروف</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#4A3E38] font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   5. RECORD APPROVED ADDITION / ADJUSTMENT MODAL
   ========================================================================= */
export const RecordAdjustmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orderIdOrNumber: string | number;
  token?: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, orderIdOrNumber, token, onSuccess }) => {
  const [additionAmount, setAdditionAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!additionAmount || Number(additionAmount) === 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!reason.trim()) {
      setError('كتابة سبب التعديل أو الإضافة المالية إلزامي للتوثيق المحاسبي');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/accounting/adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-requested-with': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          orderId: orderIdOrNumber,
          additionAmount: Number(additionAmount),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'فشل تسجيل التعديل المالي');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل التعديل المالي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="font-black text-sm text-[#5C1027]">تسجيل تعديل / إضافة مالية معتمدة</h3>
            <span className="text-[10px] text-[#6B5E55]">تعديل موثق في سجل التدقيق المالي مع حفظ السعر الأصلي</span>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-bold mb-1">مبلغ التعديل (جنيه مصري) *</label>
            <input
              type="number"
              step="any"
              required
              value={additionAmount}
              onChange={(e) => setAdditionAmount(e.target.value)}
              placeholder="قيمة موجبة للإضافة (+) أو سالبة للخصم (-)"
              className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-black text-[#5C1027] text-base"
            />
            <span className="text-[10px] text-[#6B5E55] mt-1 block">
              أدخل رقماً موجباً (مثال: 300) لإضافة مبلغ، أو رقماً سالباً (مثال: -200) لخصم معتمد.
            </span>
          </div>

          <div>
            <label className="block font-bold mb-1">سبب التعديل المعتمد (إلزامي للرقابة) *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: إضافة خدمة بوفيه VIP معتمدة من العميل أو خصم خاص مصدق..."
              className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5C1027] hover:bg-[#721832] text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-[#C89B3C]" />}
              <span>حفظ وتوثيق التعديل المالي</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#4A3E38] font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
