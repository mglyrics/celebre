import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportStatusCounts {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  inProgress: number;
  ready?: number;
  confirmed?: number;
}

export interface ReportFinancialSummary {
  customerSales: number;
  customerPaid: number;
  customerRemaining: number;
  supplierCost: number | null;
  supplierPaid: number | null;
  supplierRemaining: number | null;
  grossProfit: number | null;
}

export interface ReportOrderItem {
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  pickupDate: string;
  pickupTime?: string;
  pickupLocation?: string;
  totalAmount: number;
  customerPaid: number;
  customerRemaining: number;
  supplierTotal?: number | null;
  supplierPaid?: number | null;
  supplierRemaining?: number | null;
  distributorProfit?: number | null;
  orderStatus: string;
}

export interface ReportCustomerPaymentItem {
  id: number;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  notes?: string;
  paidAt?: string | Date;
}

export interface ReportSupplierPaymentItem {
  id: number;
  orderNumber?: string;
  supplierName?: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  paidAt?: string | Date;
}

export interface ComprehensiveReportData {
  title?: string;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  generatedAt?: string;
  generatedBy?: string;
  counts: ReportStatusCounts;
  financialSummary: ReportFinancialSummary;
  canViewFactory: boolean;
  orders: ReportOrderItem[];
  customerPayments: ReportCustomerPaymentItem[];
  supplierPayments: ReportSupplierPaymentItem[];
  breakdowns?: {
    bySaleCode?: any[];
    byCustomer?: any[];
    bySupplier?: any[];
    byPaymentMethod?: any[];
  };
}

export class ExportService {
  /**
   * Helper: Translate order status to official Arabic label
   */
  public static translateStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING_BOOKING: 'حجز مبدئي',
      CONFIRMED: 'مؤكد',
      SENT_TO_SUPPLIER: 'أُرسل للمصنع',
      IN_PRODUCTION: 'قيد التجهيز',
      READY: 'جاهز للتسليم',
      DELIVERED: 'تم التسليم',
      COMPLETED: 'مكتمل نهائياً',
      CANCELLED: 'ملغي',
    };
    return map[status] || status;
  }

  /**
   * Helper: Translate payment method to Arabic
   */
  public static translatePaymentMethod(method: string): string {
    const map: Record<string, string> = {
      INSTAPAY: 'إنستاباي (InstaPay)',
      CASH: 'نقداً عند الاستلام',
      BANK_TRANSFER: 'تحويل بنكي',
      OTHER: 'طريقة أخرى',
    };
    return map[method] || method;
  }

  /**
   * Helper: Format ISO date string to Egyptian local display
   */
  public static formatDate(d?: string | Date): string {
    if (!d) return '—';
    try {
      const dateObj = typeof d === 'string' ? new Date(d) : d;
      return dateObj.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return String(d);
    }
  }

  /**
   * Helper: Format Currency (EGP)
   */
  public static formatCurrency(val?: number | null): string {
    if (val === null || val === undefined) return 'غير مصرح';
    return `${Number(val).toLocaleString('ar-EG')} ج.م`;
  }

  // =========================================================================
  // 1. EXCEL EXPORT (4 REQUIRED SHEETS: Orders, Customer Payments, Supplier Payments, Summary)
  // =========================================================================
  public static exportComprehensiveToExcel(
    data: ComprehensiveReportData,
    fileName: string = 'تقرير_سيليبر_المالي'
  ): void {
    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------
    // SHEET 1: Orders
    // -------------------------------------------------------------
    const ordersRows = (data.orders || []).map((o) => {
      const row: Record<string, any> = {
        'رقم الطلب': o.orderNumber,
        'اسم العميل': o.customerName || '—',
        'هاتف العميل': o.customerPhone || '—',
        'تاريخ الاستلام': o.pickupDate || '—',
        'وقت الاستلام': o.pickupTime || '—',
        'مكان الاستلام': o.pickupLocation || '—',
        'إجمالي العميل (ج.م)': o.totalAmount,
        'المدفوع من العميل (ج.م)': o.customerPaid,
        'المتبقي على العميل (ج.م)': o.customerRemaining,
        'حالة الطلب': this.translateStatus(o.orderStatus),
      };

      if (data.canViewFactory) {
        row['تكلفة المصنع (ج.م)'] = o.supplierTotal ?? 0;
        row['المدفوع للمصنع (ج.م)'] = o.supplierPaid ?? 0;
        row['المتبقي للمصنع (ج.م)'] = o.supplierRemaining ?? 0;
        row['الربح الصافي (ج.م)'] = o.distributorProfit ?? 0;
      }
      return row;
    });

    const wsOrders = XLSX.utils.json_to_sheet(
      ordersRows.length > 0
        ? ordersRows
        : [{ 'تنبيه': 'لا توجد طلبات مسجلة ضمن هذه الفترة' }]
    );
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders');

    // -------------------------------------------------------------
    // SHEET 2: Customer Payments
    // -------------------------------------------------------------
    const customerPaymentsRows = (data.customerPayments || []).map((cp) => ({
      'رقم الحركة': cp.id,
      'رقم الطلب': cp.orderNumber || '—',
      'اسم العميل': cp.customerName || '—',
      'الهاتف': cp.customerPhone || '—',
      'تاريخ التحصيل': this.formatDate(cp.paidAt),
      'المبلغ المحصل (ج.م)': cp.amount,
      'طريقة الدفع': this.translatePaymentMethod(cp.paymentMethod),
      'حالة التدقيق': cp.paymentStatus === 'VERIFIED' ? 'معتمد' : cp.paymentStatus,
      'الرقم المرجعي / الإيصال': cp.paymentReference || '—',
      'ملاحظات': cp.notes || '—',
    }));

    const wsCustomerPayments = XLSX.utils.json_to_sheet(
      customerPaymentsRows.length > 0
        ? customerPaymentsRows
        : [{ 'تنبيه': 'لا توجد مدفوعات عملاء مسجلة ضمن هذه الفترة' }]
    );
    XLSX.utils.book_append_sheet(wb, wsCustomerPayments, 'Customer Payments');

    // -------------------------------------------------------------
    // SHEET 3: Supplier Payments (Strictly Respects Permissions)
    // -------------------------------------------------------------
    let supplierPaymentsRows: any[] = [];
    if (data.canViewFactory) {
      supplierPaymentsRows = (data.supplierPayments || []).map((sp) => ({
        'رقم الحركة': sp.id,
        'رقم الطلب': sp.orderNumber || '—',
        'اسم المصنع / المورد': sp.supplierName || 'Celebre Factory',
        'تاريخ السداد': this.formatDate(sp.paidAt),
        'المبلغ المسدد (ج.م)': sp.amount,
        'طريقة السداد': this.translatePaymentMethod(sp.paymentMethod),
        'رقم التحويل / المرجع': sp.reference || '—',
        'ملاحظات': sp.notes || '—',
      }));

      if (supplierPaymentsRows.length === 0) {
        supplierPaymentsRows = [{ 'تنبيه': 'لا توجد مدفوعات مصنع مسجلة ضمن هذه الفترة' }];
      }
    } else {
      supplierPaymentsRows = [
        {
          'تنبيه الأمان والسرية':
            'بيانات مدفوعات وتكاليف المصنع محجوبة. لا يملك المستخدم الصلاحية المالية اللازمة لعرضها.',
        },
      ];
    }

    const wsSupplierPayments = XLSX.utils.json_to_sheet(supplierPaymentsRows);
    XLSX.utils.book_append_sheet(wb, wsSupplierPayments, 'Supplier Payments');

    // -------------------------------------------------------------
    // SHEET 4: Summary
    // -------------------------------------------------------------
    const summaryRows: any[] = [
      { 'البند / المؤشر': 'عنوان التقرير', 'القيمة': data.title || 'تقرير الأداء المالي والتشغيلي الشامل' },
      { 'البند / المؤشر': 'الفترة الزمنية', 'القيمة': data.periodLabel },
      { 'البند / المؤشر': 'نطاق التواريخ', 'القيمة': `${data.startDate || '—'} إلى ${data.endDate || '—'}` },
      { 'البند / المؤشر': 'تاريخ التصدير', 'القيمة': data.generatedAt || new Date().toLocaleString('ar-EG') },
      { 'البند / المؤشر': 'المسؤول المستخرج', 'القيمة': data.generatedBy || 'إدارة النظام' },
      { 'البند / المؤشر': '──────────────────────', 'القيمة': '──────────────────────' },
      { 'البند / المؤشر': 'إجمالي عدد الطلبات', 'القيمة': data.counts.total },
      { 'البند / المؤشر': 'الطلبات المكتملة (Completed)', 'القيمة': data.counts.completed },
      { 'البند / المؤشر': 'الطلبات قيد التنفيذ (In Production)', 'القيمة': data.counts.inProgress },
      { 'البند / المؤشر': 'الطلبات المبدئية (Pending Booking)', 'القيمة': data.counts.pending },
      { 'البند / المؤشر': 'الطلبات الملغاة (Cancelled)', 'القيمة': data.counts.cancelled },
      { 'البند / المؤشر': 'الطلبات المؤكدة والجاهزة', 'القيمة': (data.counts.confirmed || 0) + (data.counts.ready || 0) },
      { 'البند / المؤشر': '──────────────────────', 'القيمة': '──────────────────────' },
      { 'البند / المؤشر': 'Customer Sales (إجمالي مبيعات العملاء)', 'القيمة': `${data.financialSummary.customerSales.toLocaleString('ar-EG')} ج.م` },
      { 'البند / المؤشر': 'Customer Paid (المحصل الفعلي من العملاء)', 'القيمة': `${data.financialSummary.customerPaid.toLocaleString('ar-EG')} ج.م` },
      { 'البند / المؤشر': 'Customer Remaining (المتبقي المستحق على العملاء)', 'القيمة': `${data.financialSummary.customerRemaining.toLocaleString('ar-EG')} ج.م` },
    ];

    if (data.canViewFactory && data.financialSummary.supplierCost !== null) {
      summaryRows.push(
        { 'البند / المؤشر': '──────────────────────', 'القيمة': '──────────────────────' },
        { 'البند / المؤشر': 'Supplier Cost (إجمالي تكلفة المصنع)', 'القيمة': `${(data.financialSummary.supplierCost || 0).toLocaleString('ar-EG')} ج.م` },
        { 'البند / المؤشر': 'Supplier Paid (المسدد للمصنع)', 'القيمة': `${(data.financialSummary.supplierPaid || 0).toLocaleString('ar-EG')} ج.م` },
        { 'البند / المؤشر': 'Supplier Remaining (المتبقي للمصنع)', 'القيمة': `${(data.financialSummary.supplierRemaining || 0).toLocaleString('ar-EG')} ج.م` },
        { 'البند / المؤشر': 'Celebre Gross Profit (أرباح سيليبر التشغيلية)', 'القيمة': `${(data.financialSummary.grossProfit || 0).toLocaleString('ar-EG')} ج.م` },
        { 'البند / المؤشر': 'معادلة احتساب الربح', 'القيمة': 'Customer Total - Supplier Total (ولا تستخدم المدفوعات لحساب الربح)' }
      );
    } else {
      summaryRows.push(
        { 'البند / المؤشر': '──────────────────────', 'القيمة': '──────────────────────' },
        { 'البند / المؤشر': 'بيانات المصنع والتوريد والأرباح', 'القيمة': 'محجوبة لعدم توفر الصلاحية الإدارية' }
      );
    }

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  // =========================================================================
  // 2. PDF EXPORT (Arabic RTL, Verified Formatting, Exact Fields)
  // =========================================================================
  public static async exportComprehensiveToPdf(
    data: ComprehensiveReportData,
    fileName: string = 'تقرير_سيليبر_المعتمد'
  ): Promise<void> {
    const container = document.createElement('div');
    container.setAttribute('dir', 'rtl');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-10000px';
    container.style.width = '1000px';
    container.style.backgroundColor = '#FAF7F2';
    container.style.fontFamily = "'Alexandria', 'Cairo', sans-serif";
    container.style.padding = '36px';
    container.style.boxSizing = 'border-box';
    container.style.color = '#221B17';
    container.style.zIndex = '-9999';

    const title = data.title || 'تقرير الأداء المالي والتشغيلي المعتمد';
    const period = data.periodLabel;
    const dateRangeStr = data.startDate && data.endDate ? `${data.startDate} إلى ${data.endDate}` : '';
    const nowStr = data.generatedAt || new Date().toLocaleString('ar-EG');
    const userStr = data.generatedBy || 'إدارة سيلبر';

    container.innerHTML = `
      <div style="background: #FFFFFF; border-radius: 24px; border: 2px solid #C89B3C; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E8DFD1; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #C89B3C;"></div>
              <h1 style="font-size: 24px; font-weight: 900; color: #5C1027; margin: 0;">سيلبر كاترنج | Celebre Catering</h1>
            </div>
            <p style="font-size: 13px; color: #6B5E55; margin: 4px 0 0 0;">عبوات وضيافة المناسبات الفندقية والأفراح - التقرير الإداري الرسمي</p>
          </div>
          <div style="text-align: left; font-size: 11px; color: #6B5E55;">
            <div><strong>تاريخ الاستخراج:</strong> ${nowStr}</div>
            <div><strong>بواسطة:</strong> ${userStr}</div>
            <div style="color: #25D366; font-weight: bold; margin-top: 2px;">● تقرير رسمي موثق</div>
          </div>
        </div>

        <!-- Report Title & Period -->
        <div style="background: linear-gradient(135deg, #721832, #5C1027); color: #FFFFFF; border-radius: 18px; padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 12px; color: #C89B3C; font-weight: bold;">عنوان التقرير:</div>
            <div style="font-size: 20px; font-weight: 900; margin-top: 2px;">${title}</div>
          </div>
          <div style="text-align: left; background: rgba(255,255,255,0.12); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
            <div style="font-size: 11px; color: #F4EEDB;">الفترة:</div>
            <div style="font-size: 14px; font-weight: bold; color: #FFFFFF;">${period}</div>
            ${dateRangeStr ? `<div style="font-size: 10px; color: #C89B3C;">(${dateRangeStr})</div>` : ''}
          </div>
        </div>

        <!-- Orders Count & Status Breakdown (عدد الطلبات والحالة) -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #5C1027; margin: 0 0 12px 0;">عدد الطلبات والحالة:</h3>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
            <div style="background: #FAF7F2; border: 1.5px solid #C89B3C; border-radius: 14px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: bold; color: #5C1027; display: block;">عدد الطلبات</span>
              <strong style="font-size: 22px; color: #721832; display: block; margin-top: 4px;">${data.counts.total}</strong>
            </div>
            <div style="background: #ECFDF5; border: 1px solid #10B981; border-radius: 14px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: bold; color: #065F46; display: block;">الحالة: المكتملة</span>
              <strong style="font-size: 22px; color: #047857; display: block; margin-top: 4px;">${data.counts.completed}</strong>
            </div>
            <div style="background: #F3E8FF; border: 1px solid #A855F7; border-radius: 14px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: bold; color: #6B21A8; display: block;">الحالة: قيد التنفيذ</span>
              <strong style="font-size: 22px; color: #7E22CE; display: block; margin-top: 4px;">${data.counts.inProgress}</strong>
            </div>
            <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 14px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: bold; color: #92400E; display: block;">الحالة: المبدئية</span>
              <strong style="font-size: 22px; color: #B45309; display: block; margin-top: 4px;">${data.counts.pending}</strong>
            </div>
            <div style="background: #FEE2E2; border: 1px solid #EF4444; border-radius: 14px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: bold; color: #991B1B; display: block;">الحالة: الملغاة</span>
              <strong style="font-size: 22px; color: #B91C1C; display: block; margin-top: 4px;">${data.counts.cancelled}</strong>
            </div>
          </div>
        </div>

        <!-- Financial Overview (Customer Side + Factory Side + Profit) -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #5C1027; margin: 0 0 12px 0;">المؤشرات المالية والحسابات:</h3>
          <div style="display: grid; grid-template-columns: ${data.canViewFactory ? 'repeat(3, 1fr)' : '1fr 1fr'}; gap: 16px;">
            <!-- Customer Financials -->
            <div style="background: #FAF7F2; border: 1px solid #E8DFD1; border-radius: 16px; padding: 16px;">
              <div style="font-weight: 900; font-size: 13px; color: #221B17; border-bottom: 1px solid #E8DFD1; padding-bottom: 8px; margin-bottom: 12px;">
                حسابات العملاء
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-size: 11px; color: #6B5E55;">إجمالي المبيعات:</span>
                <div style="font-size: 18px; font-weight: 900; color: #5C1027;">${this.formatCurrency(data.financialSummary.customerSales)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #D6C7B7;">
                <div>
                  <span style="color: #065F46; font-weight: bold;">مدفوعات العملاء:</span>
                  <div style="font-weight: 900; color: #047857;">${this.formatCurrency(data.financialSummary.customerPaid)}</div>
                </div>
                <div>
                  <span style="color: #92400E; font-weight: bold;">متبقي العملاء:</span>
                  <div style="font-weight: 900; color: #B45309;">${this.formatCurrency(data.financialSummary.customerRemaining)}</div>
                </div>
              </div>
            </div>

            ${
              data.canViewFactory
                ? `
            <!-- Factory Financials -->
            <div style="background: #FAF7F2; border: 1px solid #E8DFD1; border-radius: 16px; padding: 16px;">
              <div style="font-weight: 900; font-size: 13px; color: #1E3A8A; border-bottom: 1px solid #E8DFD1; padding-bottom: 8px; margin-bottom: 12px;">
                حسابات وتكاليف المصنع
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-size: 11px; color: #6B5E55;">تكلفة المصنع:</span>
                <div style="font-size: 18px; font-weight: 900; color: #1E3A8A;">${this.formatCurrency(data.financialSummary.supplierCost)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #D6C7B7;">
                <div>
                  <span style="color: #1E40AF; font-weight: bold;">مدفوعات المصنع:</span>
                  <div style="font-weight: 900; color: #1D4ED8;">${this.formatCurrency(data.financialSummary.supplierPaid)}</div>
                </div>
                <div>
                  <span style="color: #6B21A8; font-weight: bold;">متبقي المصنع:</span>
                  <div style="font-weight: 900; color: #7E22CE;">${this.formatCurrency(data.financialSummary.supplierRemaining)}</div>
                </div>
              </div>
            </div>

            <!-- Celebre Gross Profit -->
            <div style="background: linear-gradient(135deg, #1F1714, #2A1F1B); color: #FFFFFF; border: 1.5px solid #C89B3C; border-radius: 16px; padding: 16px;">
              <div style="font-weight: 900; font-size: 13px; color: #C89B3C; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px; margin-bottom: 12px;">
                أرباح سيليبر كاترنج
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-size: 11px; color: #E8DFD1;">الربح:</span>
                <div style="font-size: 22px; font-weight: 900; color: #C89B3C;">${this.formatCurrency(data.financialSummary.grossProfit)}</div>
              </div>
              <div style="font-size: 10px; color: #E8DFD1; opacity: 0.8; margin-top: 10px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.2);">
                ✓ معادلة الربح: إجمالي المبيعات - تكلفة المصنع (ولا تستخدم المدفوعات لحساب الربح)
              </div>
            </div>
            `
                : `
            <!-- Redaction Notice -->
            <div style="background: #FFFBEB; border: 1.5px dashed #F59E0B; border-radius: 16px; padding: 18px; display: flex; align-items: center; justify-content: center; text-align: center;">
              <div>
                <div style="color: #92400E; font-size: 13px; font-weight: 900;">🔒 بيانات المصنع والأرباح محجوبة</div>
                <div style="color: #B45309; font-size: 11px; margin-top: 4px;">
                  تكلفة المصنع، مدفوعات المصنع، متبقي المصنع، والربح محجوبة لعدم توفر الصلاحية الإدارية اللازمة.
                </div>
              </div>
            </div>
            `
            }
          </div>
        </div>

        <!-- Sample Orders Table -->
        <div>
          <h3 style="font-size: 14px; font-weight: 800; color: #5C1027; margin: 0 0 10px 0;">جدول تفصيلي لطلبات الفترة (عينة معتمدة):</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: right;">
            <thead>
              <tr style="background: #721832; color: #FFFFFF;">
                <th style="padding: 8px 10px; border-radius: 0 8px 0 0;">رقم الطلب</th>
                <th style="padding: 8px 10px;">العميل</th>
                <th style="padding: 8px 10px;">تاريخ الاستلام</th>
                <th style="padding: 8px 10px;">إجمالي العميل</th>
                <th style="padding: 8px 10px;">المدفوع</th>
                <th style="padding: 8px 10px;">المتبقي</th>
                <th style="padding: 8px 10px;">الحالة</th>
                ${data.canViewFactory ? '<th style="padding: 8px 10px; border-radius: 8px 0 0 0;">الربح</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${(data.orders || [])
                .slice(0, 10)
                .map(
                  (o, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#FFFFFF' : '#FAF7F2'}; border-bottom: 1px solid #E8DFD1;">
                  <td style="padding: 8px 10px; font-weight: bold; color: #5C1027;">${o.orderNumber}</td>
                  <td style="padding: 8px 10px;">${o.customerName || 'عميل'}</td>
                  <td style="padding: 8px 10px;">${o.pickupDate || '—'}</td>
                  <td style="padding: 8px 10px; font-weight: bold;">${o.totalAmount} ج.م</td>
                  <td style="padding: 8px 10px; color: #047857; font-weight: bold;">${o.customerPaid} ج.م</td>
                  <td style="padding: 8px 10px; color: #B45309; font-weight: bold;">${o.customerRemaining} ج.م</td>
                  <td style="padding: 8px 10px;">${this.translateStatus(o.orderStatus)}</td>
                  ${data.canViewFactory ? `<td style="padding: 8px 10px; color: #C89B3C; font-weight: 900;">${o.distributorProfit ?? 0} ج.م</td>` : ''}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          ${
            (data.orders || []).length > 10
              ? `<p style="font-size: 10px; color: #6B5E55; margin: 8px 0 0 0; text-align: left;">* يتضمن ملف Excel المرفق كافة سجلات الطلبات بالكامل (${data.orders.length} طلب).</p>`
              : ''
          }
        </div>

        <!-- Footer Seal -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #E8DFD1; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #6B5E55;">
          <div>
            <strong>Celebre Catering Management System</strong> - نظام الإدارة والتشغيل السحابي
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="border: 2px solid #C89B3C; border-radius: 8px; padding: 4px 12px; color: #5C1027; font-weight: 900; font-size: 10px;">
              ختم الاعتماد الرقمي ✓
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // Small pause to allow styles and fonts to paint
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF7F2',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  }

  // =========================================================================
  // 3. JPG EXPORT (Optimized for Instant WhatsApp Sharing)
  // =========================================================================
  public static async exportComprehensiveToJpg(
    data: ComprehensiveReportData,
    fileName: string = 'بطاقة_تقرير_واتساب_سيليبر'
  ): Promise<void> {
    const container = document.createElement('div');
    container.setAttribute('dir', 'rtl');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-10000px';
    container.style.width = '920px';
    container.style.backgroundColor = '#FAF7F2';
    container.style.fontFamily = "'Alexandria', 'Cairo', sans-serif";
    container.style.padding = '28px';
    container.style.boxSizing = 'border-box';
    container.style.color = '#221B17';
    container.style.zIndex = '-9999';

    const title = data.title || 'تقرير الأداء التنفيذي';
    const period = data.periodLabel;
    const nowStr = data.generatedAt || new Date().toLocaleString('ar-EG');
    const userStr = data.generatedBy || 'إدارة سيلبر';

    container.innerHTML = `
      <div style="background: #FFFFFF; border-radius: 28px; border: 3px solid #C89B3C; padding: 26px; box-shadow: 0 12px 36px rgba(0,0,0,0.08);">
        <!-- WhatsApp Header Banner -->
        <div style="background: linear-gradient(135deg, #721832, #1F1714); border-radius: 20px; padding: 20px 24px; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border: 1px solid rgba(200, 155, 60, 0.4);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #25D366; color: #FFFFFF; font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 20px;">
                مخصص للمشاركة عبر واتساب 📲
              </span>
            </div>
            <h2 style="font-size: 22px; font-weight: 900; margin: 6px 0 2px 0; color: #F4EEDB;">${title}</h2>
            <p style="font-size: 12px; color: #C89B3C; margin: 0; font-weight: 700;">سيلبر كاترنج | Celebre Catering</p>
          </div>
          <div style="text-align: left; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 10px 16px;">
            <div style="font-size: 11px; color: #E8DFD1;">الفترة:</div>
            <div style="font-size: 15px; font-weight: 900; color: #C89B3C;">${period}</div>
            <div style="font-size: 10px; color: #FFFFFF; opacity: 0.8; margin-top: 2px;">${nowStr}</div>
          </div>
        </div>

        <!-- Orders Status Counters Grid -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #FAF7F2; border: 1.5px solid #C89B3C; border-radius: 16px; padding: 12px; text-align: center;">
            <span style="font-size: 11px; font-weight: 800; color: #5C1027; display: block;">عدد الطلبات</span>
            <div style="font-size: 24px; font-weight: 900; color: #721832; margin-top: 2px;">${data.counts.total}</div>
          </div>
          <div style="background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 16px; padding: 12px; text-align: center;">
            <span style="font-size: 11px; font-weight: 800; color: #065F46; display: block;">الحالة: المكتملة</span>
            <div style="font-size: 24px; font-weight: 900; color: #047857; margin-top: 2px;">${data.counts.completed}</div>
          </div>
          <div style="background: #F3E8FF; border: 1.5px solid #A855F7; border-radius: 16px; padding: 12px; text-align: center;">
            <span style="font-size: 11px; font-weight: 800; color: #6B21A8; display: block;">الحالة: قيد التنفيذ</span>
            <div style="font-size: 24px; font-weight: 900; color: #7E22CE; margin-top: 2px;">${data.counts.inProgress}</div>
          </div>
          <div style="background: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 16px; padding: 12px; text-align: center;">
            <span style="font-size: 11px; font-weight: 800; color: #92400E; display: block;">الحالة: المبدئية</span>
            <div style="font-size: 24px; font-weight: 900; color: #B45309; margin-top: 2px;">${data.counts.pending}</div>
          </div>
          <div style="background: #FEE2E2; border: 1.5px solid #EF4444; border-radius: 16px; padding: 12px; text-align: center;">
            <span style="font-size: 11px; font-weight: 800; color: #991B1B; display: block;">الحالة: الملغاة</span>
            <div style="font-size: 24px; font-weight: 900; color: #B91C1C; margin-top: 2px;">${data.counts.cancelled}</div>
          </div>
        </div>

        <!-- Financial KPI Cards -->
        <div style="display: grid; grid-template-columns: ${data.canViewFactory ? 'repeat(3, 1fr)' : '1fr 1fr'}; gap: 14px; margin-bottom: 20px;">
          <!-- Customer Sales -->
          <div style="background: #FAF7F2; border: 1px solid #E8DFD1; border-radius: 18px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 800; color: #6B5E55;">إجمالي المبيعات</div>
            <div style="font-size: 22px; font-weight: 900; color: #5C1027; margin: 4px 0 8px 0;">
              ${this.formatCurrency(data.financialSummary.customerSales)}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; border-top: 1px dashed #D6C7B7; padding-top: 6px;">
              <span style="color: #047857; font-weight: bold;">مدفوعات العملاء: ${this.formatCurrency(data.financialSummary.customerPaid)}</span>
              <span style="color: #B45309; font-weight: bold;">متبقي العملاء: ${this.formatCurrency(data.financialSummary.customerRemaining)}</span>
            </div>
          </div>

          ${
            data.canViewFactory
              ? `
          <!-- Supplier Cost -->
          <div style="background: #FAF7F2; border: 1px solid #E8DFD1; border-radius: 18px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 800; color: #1E3A8A;">تكلفة المصنع</div>
            <div style="font-size: 22px; font-weight: 900; color: #1E3A8A; margin: 4px 0 8px 0;">
              ${this.formatCurrency(data.financialSummary.supplierCost)}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; border-top: 1px dashed #D6C7B7; padding-top: 6px;">
              <span style="color: #1D4ED8; font-weight: bold;">مدفوعات المصنع: ${this.formatCurrency(data.financialSummary.supplierPaid)}</span>
              <span style="color: #7E22CE; font-weight: bold;">متبقي المصنع: ${this.formatCurrency(data.financialSummary.supplierRemaining)}</span>
            </div>
          </div>

          <!-- Gross Profit -->
          <div style="background: linear-gradient(135deg, #1F1714, #2A1F1B); color: #FFFFFF; border: 1.5px solid #C89B3C; border-radius: 18px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 800; color: #C89B3C;">الربح (Celebre Gross Profit)</div>
            <div style="font-size: 24px; font-weight: 900; color: #C89B3C; margin: 4px 0 8px 0;">
              ${this.formatCurrency(data.financialSummary.grossProfit)}
            </div>
            <div style="font-size: 9px; color: #E8DFD1; opacity: 0.8; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 6px;">
              ✓ معادلة الربح: إجمالي المبيعات - تكلفة المصنع (بدون تأثر بالمدفوعات)
            </div>
          </div>
          `
              : `
          <!-- Redaction Card for Factory & Profit in WhatsApp image -->
          <div style="background: #FFFBEB; border: 1.5px dashed #F59E0B; border-radius: 18px; padding: 14px; text-align: center; display: flex; align-items: center; justify-content: center;">
            <div>
              <div style="color: #92400E; font-size: 12px; font-weight: 900;">🔒 بيانات المصنع والأرباح محجوبة</div>
              <div style="color: #B45309; font-size: 10px; margin-top: 4px;">تكلفة المصنع، مدفوعات ومتبقي المصنع، والربح محجوبة لحماية السرية المالية</div>
            </div>
          </div>
          `
          }
        </div>

        <!-- Verification Footer -->
        <div style="background: #FAF7F2; border-radius: 14px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #E8DFD1; font-size: 11px;">
          <div>
            <span style="color: #5C1027; font-weight: bold;">تم الإصدار بواسطة:</span> ${userStr} | <strong>Celebre Catering</strong>
          </div>
          <div style="color: #25D366; font-weight: 900; display: flex; align-items: center; gap: 4px;">
            <span>معتمد وصالح للمشاركة الفورية عبر واتساب</span> 📱
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF7F2',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${fileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      document.body.removeChild(container);
    }
  }

  // =========================================================================
  // BACKWARD COMPATIBILITY HELPERS
  // =========================================================================
  public static exportToExcel(data: any[], fileName: string, sheetName: string = 'التقرير'): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  public static async exportElementToJpg(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('العنصر المطلوب تصديره غير موجود');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `${fileName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public static async exportElementToPdf(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('العنصر المطلوب تصديره غير موجود');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  }
}
