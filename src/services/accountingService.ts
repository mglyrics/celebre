import { prisma } from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';

export interface CustomerAccountStatement {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  totalApprovedAmount: number;
  subtotal: number;
  discount: number;
  adjustments: number;
  requiredDeposit: number;
  totalCustomerPaid: number;
  customerRemaining: number;
  collectionStatus: 'UNPAID' | 'PARTIAL_DEPOSIT' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'OVERPAID' | 'REFUNDED';
  collectionStatusArabic: string;
  payments: Array<{
    id: number;
    transactionCode: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    movementType: 'COLLECTION' | 'REFUND' | 'CORRECTION' | 'UNCONFIRMED';
    paymentReference: string | null;
    notes: string | null;
    receivedBy: string;
    paidAt: string;
    createdAt: string;
    isRefund: boolean;
  }>;
  adjustmentsHistory: Array<{
    id: number;
    action: string;
    amount: number;
    reason: string;
    recordedBy: string;
    createdAt: string;
  }>;
}

export interface FactoryAccountStatement {
  supplierOrderId?: number;
  factoryOrderNumber?: string;
  orderId: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  supplierPhone: string;
  items: Array<{
    menuCode: string;
    menuName: string;
    quantity: number;
    supplierUnitPrice: number;
    supplierTotal: number;
  }>;
  totalFactoryCost: number;
  requiredDeposit: number;
  totalPaidToFactory: number;
  remainingBalanceOwed: number;
  factoryPaymentStatus: 'UNPAID' | 'PARTIAL_DEPOSIT' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'OVERPAID';
  factoryPaymentStatusArabic: string;
  factoryOrderStatus: string;
  payments: Array<{
    id: number;
    transactionCode: string;
    amount: number;
    paymentMethod: string;
    reference: string | null;
    notes: string | null;
    paidBy: string;
    paidAt: string;
    isRefund: boolean;
    movementType: 'PAYOUT' | 'REFUND' | 'CORRECTION';
  }>;
}

export interface BookingProfitability {
  orderId: number;
  orderNumber: string;
  approvedRevenue: number;
  expectedFactoryCost: number;
  expectedExpenses: number;
  expectedProfit: number;
  actualRevenue: number;
  actualFactoryCost: number;
  actualExpenses: number;
  actualProfit: number;
  customerCashCollected: number;
  factoryCashPaid: number;
  netCashFlow: number;
  profitMarginPercent: number;
  expensesList: Array<{
    id: string;
    category: string;
    amount: number;
    description: string;
    receiptRef?: string;
    recordedBy: string;
    date: string;
  }>;
  notes: string;
}

export interface FinancialMovementRecord {
  id: string;
  transactionNumber: string;
  orderNumber: string;
  orderId: number;
  entityType: 'CUSTOMER' | 'FACTORY' | 'EXPENSE';
  movementType: 'COLLECTION' | 'PAYOUT' | 'REFUND' | 'CORRECTION' | 'EXPENSE';
  amount: number;
  currency: 'EGP';
  paymentMethod: string;
  referenceNumber: string | null;
  status: 'CONFIRMED' | 'DRAFT' | 'CANCELLED' | 'CORRECTED';
  recordedBy: string;
  reason: string | null;
  transactionDate: string;
  notes: string | null;
}

export interface AccountingReportSummary {
  period: string;
  from_date: string;
  to_date: string;
  totalBookingsCount: number;
  totalBookingsValue: number;
  totalCustomerRequested: number;
  totalCustomerCollected: number;
  totalCustomerRemaining: number;
  totalFactoryOrdersCount: number;
  totalFactoryCost: number;
  totalFactoryPaid: number;
  totalFactoryRemaining: number;
  totalExpenses: number;
  totalCustomerRefunds: number;
  totalFactoryRefunds: number;
  expectedGrossProfit: number;
  actualNetProfit: number;
  netCashFlow: number;
  cancelledOrRejectedCount: number;
  cancelledOrRejectedValue: number;
  unconfirmedPaymentsCount: number;
  unconfirmedPaymentsAmount: number;
  correctionsCount: number;
  orders: any[];
}

export class AccountingService {
  /**
   * Format date into YYYY-MM-DD according to Egypt Local Time (Africa/Cairo)
   */
  public static getEgyptDateString(date: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  /**
   * Helper to convert numbers to Prisma Decimal
   */
  private static toDecimal(val: number | string | Prisma.Decimal): Prisma.Decimal {
    const num = Number(val) || 0;
    return new Prisma.Decimal(Math.round(num * 100) / 100);
  }

  /**
   * Generates a unique transaction number with prefix
   */
  public static generateTransactionCode(prefix: 'TX-CUST' | 'TX-FACT' | 'TX-EXP'): string {
    const dateStr = this.getEgyptDateString().replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${dateStr}-${rand}`;
  }

  /**
   * Fetches the Customer Account Statement for a booking
   */
  public static async getCustomerAccountStatement(
    orderIdOrNumber: string | number
  ): Promise<CustomerAccountStatement> {
    const order = await prisma.order.findFirst({
      where: typeof orderIdOrNumber === 'number' || !isNaN(Number(orderIdOrNumber))
        ? { OR: [{ id: Number(orderIdOrNumber) }, { orderNumber: String(orderIdOrNumber) }] }
        : { orderNumber: String(orderIdOrNumber) },
      include: {
        customer: true,
        customerPayments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new Error('الحجز غير موجود');
    }

    const subtotal = Number(order.subtotal);
    const discount = Number(order.discount);
    const adjustments = Number(order.adjustments);
    const totalApprovedAmount = Number(order.totalAmount);
    const requiredDeposit = Math.round(totalApprovedAmount * 0.5 * 100) / 100;

    // Filter payments
    const paymentsList = order.customerPayments.map((p) => {
      const isRefund = p.paymentStatus === 'REFUND' || Number(p.amount) < 0;
      let movementType: 'COLLECTION' | 'REFUND' | 'CORRECTION' | 'UNCONFIRMED' = 'COLLECTION';
      if (isRefund) {
        movementType = 'REFUND';
      } else if (p.paymentStatus === 'CORRECTED') {
        movementType = 'CORRECTION';
      } else if (p.paymentStatus === 'PENDING_REVIEW' || p.paymentStatus === 'DRAFT') {
        movementType = 'UNCONFIRMED';
      }

      return {
        id: p.id,
        transactionCode: `TX-CUST-${p.id.toString().padStart(5, '0')}`,
        amount: Math.abs(Number(p.amount)),
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        movementType,
        paymentReference: p.paymentReference,
        notes: p.notes,
        receivedBy: p.receivedBy,
        paidAt: p.paidAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
        isRefund,
      };
    });

    // Calculate actual confirmed paid from VERIFIED minus confirmed REFUND
    const verifiedPaid = order.customerPayments
      .filter((p) => p.paymentStatus === 'VERIFIED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const refundsPaid = order.customerPayments
      .filter((p) => p.paymentStatus === 'REFUND')
      .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);

    const totalCustomerPaid = Math.max(0, verifiedPaid - refundsPaid);
    const customerRemaining = Math.max(0, totalApprovedAmount - totalCustomerPaid);

    // Determine collection status
    let collectionStatus: 'UNPAID' | 'PARTIAL_DEPOSIT' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'OVERPAID' | 'REFUNDED' = 'UNPAID';
    let collectionStatusArabic = 'لم يُسدد أي مبلغ';

    if (totalCustomerPaid > totalApprovedAmount) {
      collectionStatus = 'OVERPAID';
      collectionStatusArabic = 'مسدد بالكامل مع رصيد فائض';
    } else if (totalCustomerPaid >= totalApprovedAmount) {
      collectionStatus = 'FULLY_PAID';
      collectionStatusArabic = 'مسدد بالكامل';
    } else if (totalCustomerPaid >= requiredDeposit) {
      collectionStatus = 'DEPOSIT_PAID';
      collectionStatusArabic = 'العربون مكتمل (50%)';
    } else if (totalCustomerPaid > 0) {
      collectionStatus = 'PARTIAL_DEPOSIT';
      collectionStatusArabic = 'عربون جزئي';
    } else if (refundsPaid > 0 && verifiedPaid <= refundsPaid) {
      collectionStatus = 'REFUNDED';
      collectionStatusArabic = 'مسترد بالكامل';
    }

    // Adjustments history from Audit Logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'orders',
        entityId: String(order.id),
        action: { in: ['BOOKING_ADDITION_RECORDED', 'BOOKING_ADJUSTMENT_RECORDED', 'ORDER_DETAILS_UPDATED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const adjustmentsHistory = auditLogs.map((log) => {
      const data = (log.newData as any) || {};
      return {
        id: log.id,
        action: log.action,
        amount: Number(data.additionAmount || data.adjustments || 0),
        reason: data.reason || 'تعديل معتمد للحجز',
        recordedBy: log.userName,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      totalApprovedAmount,
      subtotal,
      discount,
      adjustments,
      requiredDeposit,
      totalCustomerPaid,
      customerRemaining,
      collectionStatus,
      collectionStatusArabic,
      payments: paymentsList,
      adjustmentsHistory,
    };
  }

  /**
   * Fetches the Factory Account Statement for an order
   */
  public static async getFactoryAccountStatement(
    orderIdOrNumber: string | number
  ): Promise<FactoryAccountStatement> {
    const order = await prisma.order.findFirst({
      where: typeof orderIdOrNumber === 'number' || !isNaN(Number(orderIdOrNumber))
        ? { OR: [{ id: Number(orderIdOrNumber) }, { orderNumber: String(orderIdOrNumber) }] }
        : { orderNumber: String(orderIdOrNumber) },
      include: {
        items: true,
        supplierOrders: {
          include: {
            supplier: true,
            payments: { orderBy: { paidAt: 'desc' } },
          },
        },
        supplierPayments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new Error('الحجز غير موجود');
    }

    const supOrder = order.supplierOrders[0];
    const defaultSupplier = await prisma.supplier.findFirst({
      where: { name: 'Celebre Factory' },
    });

    const supplierId = supOrder?.supplierId || defaultSupplier?.id || 1;
    const supplierName = supOrder?.supplier?.companyName || defaultSupplier?.companyName || 'Celebre Central Factory';
    const supplierPhone = supOrder?.supplier?.phone || defaultSupplier?.phone || '01284484868';

    // Historical meal prices snapshots
    const items = order.items.map((it) => ({
      menuCode: it.menuCode,
      menuName: it.menuName,
      quantity: it.quantity,
      supplierUnitPrice: Number(it.supplierUnitPrice),
      supplierTotal: Number(it.supplierTotalFinal || it.supplierTotal),
    }));

    const totalFactoryCost = supOrder ? Number(supOrder.supplierTotal) : Number(order.supplierTotal);

    // Payments to factory
    const allSupPayments = supOrder ? supOrder.payments : order.supplierPayments;
    const paymentsList = allSupPayments.map((p) => {
      const isRefund = (p.notes && p.notes.includes('[STATUS:REFUND]')) || Number(p.amount) < 0;
      let movementType: 'PAYOUT' | 'REFUND' | 'CORRECTION' = 'PAYOUT';
      if (isRefund) {
        movementType = 'REFUND';
      } else if (p.notes && p.notes.includes('[STATUS:CORRECTED]')) {
        movementType = 'CORRECTION';
      }

      return {
        id: p.id,
        transactionCode: `TX-FACT-${p.id.toString().padStart(5, '0')}`,
        amount: Math.abs(Number(p.amount)),
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        paidBy: p.paidBy,
        paidAt: p.paidAt.toISOString(),
        isRefund,
        movementType,
      };
    });

    const confirmedPaid = paymentsList
      .filter((p) => p.movementType === 'PAYOUT')
      .reduce((sum, p) => sum + p.amount, 0);

    const refundsPaid = paymentsList
      .filter((p) => p.movementType === 'REFUND')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPaidToFactory = Math.max(0, confirmedPaid - refundsPaid);
    const remainingBalanceOwed = Math.max(0, totalFactoryCost - totalPaidToFactory);

    // Factory required deposit (0 by default unless specifically negotiated)
    let requiredDeposit = 0;
    const supNotes = (supOrder as Record<string, any>)?.notes || order.customerNotes;
    if (supNotes && typeof supNotes === 'string') {
      const match = supNotes.match(/REQUIRED_DEPOSIT:(\d+(\.\d+)?)/);
      if (match) requiredDeposit = Number(match[1]);
    }

    let factoryPaymentStatus: 'UNPAID' | 'PARTIAL_DEPOSIT' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'OVERPAID' = 'UNPAID';
    let factoryPaymentStatusArabic = 'لم يُسدد أي مبلغ للمصنع';

    if (totalPaidToFactory > totalFactoryCost) {
      factoryPaymentStatus = 'OVERPAID';
      factoryPaymentStatusArabic = 'تم السداد بالكامل وفائض للمصنع';
    } else if (totalPaidToFactory >= totalFactoryCost) {
      factoryPaymentStatus = 'FULLY_PAID';
      factoryPaymentStatusArabic = 'مسدد بالكامل للمصنع';
    } else if (requiredDeposit > 0 && totalPaidToFactory >= requiredDeposit) {
      factoryPaymentStatus = 'DEPOSIT_PAID';
      factoryPaymentStatusArabic = 'العربون المطلوب للمصنع مكتمل';
    } else if (totalPaidToFactory > 0) {
      factoryPaymentStatus = 'PARTIAL_DEPOSIT';
      factoryPaymentStatusArabic = 'سداد جزئي للمصنع';
    }

    return {
      supplierOrderId: supOrder?.id,
      factoryOrderNumber: supOrder?.supplierOrderNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      supplierId,
      supplierName,
      supplierPhone,
      items,
      totalFactoryCost,
      requiredDeposit,
      totalPaidToFactory,
      remainingBalanceOwed,
      factoryPaymentStatus,
      factoryPaymentStatusArabic,
      factoryOrderStatus: supOrder?.status || 'NOT_CREATED',
      payments: paymentsList,
    };
  }

  /**
   * Calculates Expected vs Actual Profitability and Cash Flow for a booking
   */
  public static async getBookingProfitability(
    orderIdOrNumber: string | number
  ): Promise<BookingProfitability> {
    const order = await prisma.order.findFirst({
      where: typeof orderIdOrNumber === 'number' || !isNaN(Number(orderIdOrNumber))
        ? { OR: [{ id: Number(orderIdOrNumber) }, { orderNumber: String(orderIdOrNumber) }] }
        : { orderNumber: String(orderIdOrNumber) },
      include: {
        customerPayments: true,
        supplierPayments: true,
        supplierOrders: true,
      },
    });

    if (!order) {
      throw new Error('الحجز غير موجود');
    }

    const approvedRevenue = Number(order.totalAmount);
    const expectedFactoryCost = Number(order.supplierTotal);

    // Fetch operational expenses recorded for this order from audit logs
    const expenseLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'booking_expense',
        entityId: String(order.id),
      },
      orderBy: { createdAt: 'asc' },
    });

    const activeExpenses: Array<{
      id: string;
      category: string;
      amount: number;
      description: string;
      receiptRef?: string;
      recordedBy: string;
      date: string;
    }> = [];

    const cancelledExpenseIds = new Set<string>();
    for (const log of expenseLogs) {
      if (log.action === 'EXPENSE_CANCELLED') {
        const d = (log.newData as any) || {};
        if (d.expenseId) cancelledExpenseIds.add(d.expenseId);
      }
    }

    for (const log of expenseLogs) {
      if (log.action === 'EXPENSE_RECORDED') {
        const d = (log.newData as any) || {};
        const id = d.id || `EXP-${log.id}`;
        if (!cancelledExpenseIds.has(id)) {
          activeExpenses.push({
            id,
            category: d.category || 'عام',
            amount: Number(d.amount || 0),
            description: d.description || '',
            receiptRef: d.receiptRef,
            recordedBy: log.userName,
            date: d.date || log.createdAt.toISOString(),
          });
        }
      }
    }

    const actualExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expectedExpenses = actualExpenses; // if not pre-planned, equals actual expenses

    const expectedProfit = Math.round((approvedRevenue - expectedFactoryCost - expectedExpenses) * 100) / 100;
    const actualProfit = Math.round((approvedRevenue - expectedFactoryCost - actualExpenses) * 100) / 100;

    // Cash Flow: customer cash collected vs factory cash paid
    const verifiedCustomerPaid = order.customerPayments
      .filter((p) => p.paymentStatus === 'VERIFIED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const customerRefunds = order.customerPayments
      .filter((p) => p.paymentStatus === 'REFUND')
      .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);
    const customerCashCollected = Math.max(0, verifiedCustomerPaid - customerRefunds);

    const supPayments = order.supplierPayments;
    const confirmedFactoryPaid = supPayments
      .filter((p) => !p.notes?.includes('[STATUS:REFUND]') && !p.notes?.includes('[STATUS:CORRECTED]'))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const factoryRefunds = supPayments
      .filter((p) => p.notes?.includes('[STATUS:REFUND]'))
      .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);
    const factoryCashPaid = Math.max(0, confirmedFactoryPaid - factoryRefunds);

    const netCashFlow = Math.round((customerCashCollected - factoryCashPaid - actualExpenses) * 100) / 100;
    const profitMarginPercent = approvedRevenue > 0
      ? Math.round((expectedProfit / approvedRevenue) * 1000) / 10
      : 0;

    let notes = 'حسابات الأرباح تعتمد على الأسعار والتكاليف التاريخية المعتمدة وقت إنشاء الحجز.';
    if (activeExpenses.length === 0) {
      notes += ' (تنبيه محاسبي: عدم تسجيل مصروفات تشغيلية لا يعني عدم وجودها في الواقع).';
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      approvedRevenue,
      expectedFactoryCost,
      expectedExpenses,
      expectedProfit,
      actualRevenue: approvedRevenue,
      actualFactoryCost: expectedFactoryCost,
      actualExpenses,
      actualProfit,
      customerCashCollected,
      factoryCashPaid,
      netCashFlow,
      profitMarginPercent,
      expensesList: activeExpenses,
      notes,
    };
  }

  /**
   * Records a Customer Transaction (Collection, Refund, or Correction)
   */
  public static async recordCustomerTransaction(input: {
    orderId: number | string;
    amount: number;
    movementType: 'COLLECTION' | 'REFUND' | 'CORRECTION';
    paymentMethod: 'INSTAPAY' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';
    referenceNumber?: string;
    notes?: string;
    adminUsername: string;
    relatedPaymentId?: number;
    reason?: string;
    ip?: string;
  }) {
    const { orderId, amount, movementType, paymentMethod, referenceNumber, notes, adminUsername, relatedPaymentId, reason } = input;

    if (amount <= 0) {
      throw new Error('مبلغ الحركة المالية يجب أن يكون أكبر من صفر');
    }

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: typeof orderId === 'number' || !isNaN(Number(orderId))
          ? { OR: [{ id: Number(orderId) }, { orderNumber: String(orderId) }] }
          : { orderNumber: String(orderId) },
        include: { customerPayments: true },
      });

      if (!order) {
        throw new Error('الحجز غير موجود');
      }

      // 1. Idempotency Check: Prevent duplicate transaction submitted within 10 seconds
      const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
      const recentDup = await tx.customerPayment.findFirst({
        where: {
          orderId: order.id,
          amount: this.toDecimal(amount),
          paymentReference: referenceNumber ? referenceNumber.trim() : undefined,
          createdAt: { gt: tenSecondsAgo },
        },
      });

      if (recentDup) {
        throw new Error('تم تسجيل هذه الحركة المالية مسبقاً قبل قليل. تم تفعيل الحماية من التكرار.');
      }

      // Calculate current verified paid and refunds
      const currentVerifiedPaid = order.customerPayments
        .filter((p) => p.paymentStatus === 'VERIFIED')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const currentRefunds = order.customerPayments
        .filter((p) => p.paymentStatus === 'REFUND')
        .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);
      const netPaidAvailableForRefund = Math.max(0, currentVerifiedPaid - currentRefunds);

      let createdPaymentRecord: any;

      if (movementType === 'REFUND') {
        // Validation: Cannot refund more than verified paid minus previous refunds
        if (amount > netPaidAvailableForRefund) {
          throw new Error(
            `المبلغ المطلوب استرداده (${amount} ج.م) يتجاوز الرصيد القابل للاسترداد فعلياً (${netPaidAvailableForRefund} ج.م)`
          );
        }

        createdPaymentRecord = await tx.customerPayment.create({
          data: {
            orderId: order.id,
            customerId: order.customerId,
            amount: this.toDecimal(amount),
            paymentMethod: paymentMethod || 'OTHER',
            paymentStatus: 'REFUND',
            paymentReference: referenceNumber ? referenceNumber.trim() : `REFUND-${Date.now()}`,
            notes: `[استرداد مالي للعميل] ${notes ? notes.trim() : ''}${reason ? ` (السبب: ${reason})` : ''}`,
            receivedBy: adminUsername,
          },
        });
      } else if (movementType === 'CORRECTION') {
        if (!relatedPaymentId) {
          throw new Error('معرف الدفعة الأصلية مطلوب لإجراء تصحيح مالي موثق');
        }

        const original = await tx.customerPayment.findUnique({
          where: { id: relatedPaymentId },
        });

        if (!original || original.orderId !== order.id) {
          throw new Error('الدفعة الأصلية المراد تصحيحها غير موجودة بهذا الحجز');
        }

        // Mark original payment as CORRECTED
        await tx.customerPayment.update({
          where: { id: relatedPaymentId },
          data: {
            paymentStatus: 'CORRECTED',
            notes: `${original.notes || ''} [تم التصحيح بواسطة ${adminUsername}: ${reason || 'تصحيح مالي'}]`.trim(),
          },
        });

        // Insert new corrected payment
        createdPaymentRecord = await tx.customerPayment.create({
          data: {
            orderId: order.id,
            customerId: order.customerId,
            amount: this.toDecimal(amount),
            paymentMethod,
            paymentStatus: 'VERIFIED',
            paymentReference: referenceNumber ? referenceNumber.trim() : `CORRECTION_FOR_#${relatedPaymentId}`,
            notes: `[تصحيح معتمد للدفعة #${relatedPaymentId}] ${notes ? notes.trim() : ''}${reason ? ` (السبب: ${reason})` : ''}`,
            receivedBy: adminUsername,
          },
        });
      } else {
        // Standard Collection (تحصيل)
        createdPaymentRecord = await tx.customerPayment.create({
          data: {
            orderId: order.id,
            customerId: order.customerId,
            amount: this.toDecimal(amount),
            paymentMethod,
            paymentStatus: 'VERIFIED',
            paymentReference: referenceNumber ? referenceNumber.trim() : null,
            notes: notes ? notes.trim() : null,
            receivedBy: adminUsername,
          },
        });
      }

      // Recalculate customer_paid strictly: sum(VERIFIED) - sum(REFUND)
      const allPaymentsAfter = await tx.customerPayment.findMany({
        where: { orderId: order.id },
      });

      const totalVerified = allPaymentsAfter
        .filter((p) => p.paymentStatus === 'VERIFIED')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const totalRefunded = allPaymentsAfter
        .filter((p) => p.paymentStatus === 'REFUND')
        .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);

      const newCustomerPaid = Math.max(0, totalVerified - totalRefunded);
      const orderTotal = Number(order.totalAmount);
      const newCustomerRemaining = Math.max(0, orderTotal - newCustomerPaid);
      const requiredDeposit = Math.round(orderTotal * 0.5 * 100) / 100;

      // Determine updated order status
      let newOrderStatus = order.orderStatus;
      if (
        [
          'PENDING_BOOKING',
          'PENDING_REVIEW',
          'AWAITING_CUSTOMER_DEPOSIT',
          'CUSTOMER_DEPOSIT_PARTIAL',
          'CUSTOMER_DEPOSIT_PAID',
          'CONFIRMED',
        ].includes(order.orderStatus)
      ) {
        if (newCustomerPaid >= orderTotal) {
          newOrderStatus = 'CONFIRMED';
        } else if (newCustomerPaid >= requiredDeposit) {
          newOrderStatus = 'CUSTOMER_DEPOSIT_PAID';
        } else if (newCustomerPaid > 0) {
          newOrderStatus = 'CUSTOMER_DEPOSIT_PARTIAL';
        } else {
          newOrderStatus = 'AWAITING_CUSTOMER_DEPOSIT';
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          customerPaid: this.toDecimal(newCustomerPaid),
          customerRemaining: this.toDecimal(newCustomerRemaining),
          orderStatus: newOrderStatus,
          updatedAt: new Date(),
        },
      });

      // Immutable Audit Log
      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: `CUSTOMER_FINANCIAL_${movementType}`,
          entity: 'customer_payments',
          entityId: String(createdPaymentRecord.id),
          oldData: {
            orderNumber: order.orderNumber,
            previousPaid: Number(order.customerPaid),
            previousRemaining: Number(order.customerRemaining),
          },
          newData: {
            paymentId: createdPaymentRecord.id,
            movementType,
            amount,
            method: paymentMethod,
            referenceNumber,
            reason,
            newPaid: newCustomerPaid,
            newRemaining: newCustomerRemaining,
            orderStatus: newOrderStatus,
          },
        },
      });

      return {
        success: true,
        payment: createdPaymentRecord,
        newCustomerPaid,
        newCustomerRemaining,
        newOrderStatus,
      };
    });
  }

  /**
   * Records a Factory Transaction (Payout, Refund, or Correction)
   */
  public static async recordFactoryTransaction(input: {
    supplierOrderId?: number;
    orderId: number | string;
    amount: number;
    movementType: 'PAYOUT' | 'REFUND' | 'CORRECTION';
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    adminUsername: string;
    relatedPaymentId?: number;
    reason?: string;
  }) {
    const { supplierOrderId, orderId, amount, movementType, paymentMethod, referenceNumber, notes, adminUsername, relatedPaymentId, reason } = input;

    if (amount <= 0) {
      throw new Error('مبلغ دفعة المصنع يجب أن يكون أكبر من صفر');
    }

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: typeof orderId === 'number' || !isNaN(Number(orderId))
          ? { OR: [{ id: Number(orderId) }, { orderNumber: String(orderId) }] }
          : { orderNumber: String(orderId) },
        include: { supplierOrders: true, supplierPayments: true },
      });

      if (!order) {
        throw new Error('الحجز غير موجود');
      }

      const supOrder = supplierOrderId
        ? await tx.supplierOrder.findUnique({ where: { id: supplierOrderId } })
        : order.supplierOrders[0];

      const supplierId = supOrder ? supOrder.supplierId : (await tx.supplier.findFirst())?.id || 1;
      const targetSupplierOrderId = supOrder ? supOrder.id : 0;

      // Idempotency: Prevent duplicate payment submitted within 10 seconds
      const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
      const recentDup = await tx.supplierPayment.findFirst({
        where: {
          orderId: order.id,
          amount: this.toDecimal(amount),
          reference: referenceNumber ? referenceNumber.trim() : undefined,
          createdAt: { gt: tenSecondsAgo },
        },
      });

      if (recentDup) {
        throw new Error('تم تسجيل هذا التحويل المالي للمصنع مسبقاً قبل قليل. تم منع التكرار.');
      }

      // Check current supplier paid
      const allSupPayments = await tx.supplierPayment.findMany({
        where: { orderId: order.id },
      });
      const currentPaid = allSupPayments
        .filter((p) => !p.notes?.includes('[STATUS:REFUND]') && !p.notes?.includes('[STATUS:CORRECTED]'))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const currentRefunds = allSupPayments
        .filter((p) => p.notes?.includes('[STATUS:REFUND]'))
        .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);
      const netPaidAvailableForRefund = Math.max(0, currentPaid - currentRefunds);

      let createdPayment: any;

      if (movementType === 'REFUND') {
        if (amount > netPaidAvailableForRefund) {
          throw new Error(
            `المبلغ المطلوب استرداده من المصنع (${amount} ج.م) يتجاوز الرصيد المسدد فعلياً للمصنع (${netPaidAvailableForRefund} ج.م)`
          );
        }

        createdPayment = await tx.supplierPayment.create({
          data: {
            supplierOrderId: targetSupplierOrderId || order.id,
            supplierId,
            orderId: order.id,
            amount: this.toDecimal(amount),
            paymentMethod: paymentMethod || 'BANK_TRANSFER',
            reference: referenceNumber ? referenceNumber.trim() : `FACT-REFUND-${Date.now()}`,
            notes: `[STATUS:REFUND] استرداد من المصنع: ${notes || ''}${reason ? ` (السبب: ${reason})` : ''}`,
            paidBy: adminUsername,
          },
        });
      } else if (movementType === 'CORRECTION') {
        if (!relatedPaymentId) {
          throw new Error('معرف الدفعة الأصلية مطلوب لإجراء تصحيح مالي');
        }

        const original = await tx.supplierPayment.findUnique({
          where: { id: relatedPaymentId },
        });

        if (!original || original.orderId !== order.id) {
          throw new Error('الدفعة الأصلية للمصنع غير موجودة بهذا الحجز');
        }

        await tx.supplierPayment.update({
          where: { id: relatedPaymentId },
          data: {
            notes: `${original.notes || ''} [STATUS:CORRECTED] [تم التصحيح بواسطة ${adminUsername}: ${reason || ''}]`.trim(),
          },
        });

        createdPayment = await tx.supplierPayment.create({
          data: {
            supplierOrderId: targetSupplierOrderId || order.id,
            supplierId,
            orderId: order.id,
            amount: this.toDecimal(amount),
            paymentMethod,
            reference: referenceNumber ? referenceNumber.trim() : `CORRECTION_FOR_#${relatedPaymentId}`,
            notes: `[STATUS:VERIFIED] [تصحيح معتمد لدفعة المصنع #${relatedPaymentId}] ${notes || ''}`,
            paidBy: adminUsername,
          },
        });
      } else {
        // Standard Payout
        createdPayment = await tx.supplierPayment.create({
          data: {
            supplierOrderId: targetSupplierOrderId || order.id,
            supplierId,
            orderId: order.id,
            amount: this.toDecimal(amount),
            paymentMethod,
            reference: referenceNumber ? referenceNumber.trim() : null,
            notes: `[STATUS:VERIFIED] ${notes ? notes.trim() : ''}`,
            paidBy: adminUsername,
          },
        });
      }

      // Recalculate totals
      const updatedSupPayments = await tx.supplierPayment.findMany({
        where: { orderId: order.id },
      });

      const totalPayout = updatedSupPayments
        .filter((p) => !p.notes?.includes('[STATUS:REFUND]') && !p.notes?.includes('[STATUS:CORRECTED]'))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const totalRefund = updatedSupPayments
        .filter((p) => p.notes?.includes('[STATUS:REFUND]'))
        .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);

      const newSupplierPaid = Math.max(0, totalPayout - totalRefund);
      const supCost = Number(order.supplierTotal);
      const newSupplierRemaining = Math.max(0, supCost - newSupplierPaid);

      // Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          supplierPaid: this.toDecimal(newSupplierPaid),
          supplierRemaining: this.toDecimal(newSupplierRemaining),
          updatedAt: new Date(),
        },
      });

      // Update SupplierOrder if exists
      if (supOrder) {
        let newSupStatus = supOrder.status;
        if (['AWAITING_DEPOSIT', 'DEPOSIT_PARTIAL', 'DRAFT'].includes(supOrder.status)) {
          if (newSupplierPaid >= Number(supOrder.supplierTotal)) {
            newSupStatus = 'IN_PREPARATION';
          } else if (newSupplierPaid > 0) {
            newSupStatus = 'DEPOSIT_PARTIAL';
          }
        }

        await tx.supplierOrder.update({
          where: { id: supOrder.id },
          data: {
            supplierPaid: this.toDecimal(newSupplierPaid),
            supplierRemaining: this.toDecimal(newSupplierRemaining),
            status: newSupStatus,
            updatedAt: new Date(),
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: `FACTORY_FINANCIAL_${movementType}`,
          entity: 'supplier_payments',
          entityId: String(createdPayment.id),
          oldData: {
            orderNumber: order.orderNumber,
            previousSupplierPaid: Number(order.supplierPaid),
          },
          newData: {
            paymentId: createdPayment.id,
            movementType,
            amount,
            method: paymentMethod,
            referenceNumber,
            reason,
            newSupplierPaid,
            newSupplierRemaining,
          },
        },
      });

      return {
        success: true,
        payment: createdPayment,
        newSupplierPaid,
        newSupplierRemaining,
      };
    });
  }

  /**
   * Records an Operational Expense linked to a booking
   */
  public static async recordBookingExpense(input: {
    orderId: number | string;
    amount: number;
    category: string;
    description: string;
    receiptRef?: string;
    adminUsername: string;
  }) {
    const { orderId, amount, category, description, receiptRef, adminUsername } = input;

    if (amount <= 0) {
      throw new Error('مبلغ المصروف يجب أن يكون أكبر من صفر');
    }

    const order = await prisma.order.findFirst({
      where: typeof orderId === 'number' || !isNaN(Number(orderId))
        ? { OR: [{ id: Number(orderId) }, { orderNumber: String(orderId) }] }
        : { orderNumber: String(orderId) },
    });

    if (!order) {
      throw new Error('الحجز المرتبط بالمصروف غير موجود');
    }

    const expenseId = this.generateTransactionCode('TX-EXP');

    const log = await prisma.auditLog.create({
      data: {
        userName: adminUsername,
        action: 'EXPENSE_RECORDED',
        entity: 'booking_expense',
        entityId: String(order.id),
        newData: {
          id: expenseId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          category: category || 'تشغيل عام',
          amount: Number(amount),
          description: description || '',
          receiptRef: receiptRef ? receiptRef.trim() : null,
          recordedBy: adminUsername,
          date: new Date().toISOString(),
          status: 'CONFIRMED',
        },
      },
    });

    return {
      success: true,
      expenseId,
      logId: log.id,
      amount,
      category,
      orderNumber: order.orderNumber,
    };
  }

  /**
   * Records an approved Financial Addition / Adjustment to an order
   */
  public static async recordBookingAdjustment(input: {
    orderId: number | string;
    additionAmount: number;
    reason: string;
    adminUsername: string;
  }) {
    const { orderId, additionAmount, reason, adminUsername } = input;

    if (additionAmount === 0) {
      throw new Error('مبلغ التعديل لا يمكن أن يكون صفراً');
    }

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: typeof orderId === 'number' || !isNaN(Number(orderId))
          ? { OR: [{ id: Number(orderId) }, { orderNumber: String(orderId) }] }
          : { orderNumber: String(orderId) },
      });

      if (!order) {
        throw new Error('الحجز غير موجود');
      }

      const prevAdjustments = Number(order.adjustments);
      const prevTotal = Number(order.totalAmount);
      const subtotal = Number(order.subtotal);
      const discount = Number(order.discount);
      const customerPaid = Number(order.customerPaid);
      const supplierTotal = Number(order.supplierTotal);

      const newAdjustments = Math.round((prevAdjustments + additionAmount) * 100) / 100;
      const newTotalAmount = Math.round((subtotal - discount + newAdjustments) * 100) / 100;
      const newCustomerRemaining = Math.max(0, newTotalAmount - customerPaid);
      const newProfit = Math.round((newTotalAmount - supplierTotal) * 100) / 100;

      await tx.order.update({
        where: { id: order.id },
        data: {
          adjustments: this.toDecimal(newAdjustments),
          totalAmount: this.toDecimal(newTotalAmount),
          customerRemaining: this.toDecimal(newCustomerRemaining),
          distributorProfit: this.toDecimal(newProfit),
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'BOOKING_ADDITION_RECORDED',
          entity: 'orders',
          entityId: String(order.id),
          oldData: {
            previousAdjustments: prevAdjustments,
            previousTotal: prevTotal,
          },
          newData: {
            additionAmount,
            reason,
            newAdjustments,
            newTotalAmount,
            newCustomerRemaining,
            adminUsername,
          },
        },
      });

      return {
        success: true,
        additionAmount,
        newAdjustments,
        newTotalAmount,
        newCustomerRemaining,
      };
    });
  }

  /**
   * Unified chronological Financial Movements Ledger
   */
  public static async getFinancialTransactionsList(filter?: {
    orderNumber?: string;
    entityType?: 'CUSTOMER' | 'FACTORY' | 'EXPENSE' | 'ALL';
    movementType?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<FinancialMovementRecord[]> {
    const list: FinancialMovementRecord[] = [];

    // 1. Customer Payments
    const custPayments = await prisma.customerPayment.findMany({
      include: {
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { paidAt: 'desc' },
    });

    for (const cp of custPayments) {
      if (filter?.orderNumber && cp.order.orderNumber !== filter.orderNumber) continue;
      const isRefund = cp.paymentStatus === 'REFUND' || Number(cp.amount) < 0;
      let movType: 'COLLECTION' | 'REFUND' | 'CORRECTION' = 'COLLECTION';
      if (isRefund) movType = 'REFUND';
      else if (cp.paymentStatus === 'CORRECTED') movType = 'CORRECTION';

      let status: 'CONFIRMED' | 'DRAFT' | 'CANCELLED' | 'CORRECTED' = 'CONFIRMED';
      if (cp.paymentStatus === 'PENDING_REVIEW' || cp.paymentStatus === 'DRAFT') status = 'DRAFT';
      else if (cp.paymentStatus === 'CANCELLED' || cp.paymentStatus === 'REJECTED') status = 'CANCELLED';
      else if (cp.paymentStatus === 'CORRECTED') status = 'CORRECTED';

      list.push({
        id: `CP-${cp.id}`,
        transactionNumber: `TX-CUST-${cp.id.toString().padStart(5, '0')}`,
        orderNumber: cp.order.orderNumber,
        orderId: cp.order.id,
        entityType: 'CUSTOMER',
        movementType: movType,
        amount: Math.abs(Number(cp.amount)),
        currency: 'EGP',
        paymentMethod: cp.paymentMethod,
        referenceNumber: cp.paymentReference,
        status,
        recordedBy: cp.receivedBy,
        reason: cp.notes,
        transactionDate: cp.paidAt.toISOString(),
        notes: cp.notes,
      });
    }

    // 2. Supplier (Factory) Payments
    const supPayments = await prisma.supplierPayment.findMany({
      include: {
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { paidAt: 'desc' },
    });

    for (const sp of supPayments) {
      if (filter?.orderNumber && sp.order.orderNumber !== filter.orderNumber) continue;
      const isRefund = sp.notes?.includes('[STATUS:REFUND]') || Number(sp.amount) < 0;
      let movType: 'PAYOUT' | 'REFUND' | 'CORRECTION' = 'PAYOUT';
      if (isRefund) movType = 'REFUND';
      else if (sp.notes?.includes('[STATUS:CORRECTED]')) movType = 'CORRECTION';

      list.push({
        id: `SP-${sp.id}`,
        transactionNumber: `TX-FACT-${sp.id.toString().padStart(5, '0')}`,
        orderNumber: sp.order.orderNumber,
        orderId: sp.order.id,
        entityType: 'FACTORY',
        movementType: movType,
        amount: Math.abs(Number(sp.amount)),
        currency: 'EGP',
        paymentMethod: sp.paymentMethod,
        referenceNumber: sp.reference,
        status: movType === 'CORRECTION' ? 'CORRECTED' : 'CONFIRMED',
        recordedBy: sp.paidBy,
        reason: sp.notes,
        transactionDate: sp.paidAt.toISOString(),
        notes: sp.notes,
      });
    }

    // 3. Booking Expenses
    const expenseLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'booking_expense',
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const el of expenseLogs) {
      const d = (el.newData as any) || {};
      if (el.action === 'EXPENSE_RECORDED') {
        if (filter?.orderNumber && d.orderNumber !== filter.orderNumber) continue;
        list.push({
          id: `EXP-${el.id}`,
          transactionNumber: d.id || `TX-EXP-${el.id}`,
          orderNumber: d.orderNumber || 'غير محدد',
          orderId: Number(el.entityId),
          entityType: 'EXPENSE',
          movementType: 'EXPENSE',
          amount: Number(d.amount || 0),
          currency: 'EGP',
          paymentMethod: 'نقدي/سلفة',
          referenceNumber: d.receiptRef || null,
          status: 'CONFIRMED',
          recordedBy: el.userName,
          reason: d.description || d.category,
          transactionDate: d.date || el.createdAt.toISOString(),
          notes: `${d.category || ''}: ${d.description || ''}`,
        });
      }
    }

    // Apply entityType filter if provided
    let filtered = list;
    if (filter?.entityType && filter.entityType !== 'ALL') {
      filtered = filtered.filter((t) => t.entityType === filter.entityType);
    }
    if (filter?.movementType) {
      filtered = filtered.filter((t) => t.movementType === filter.movementType);
    }
    if (filter?.from_date) {
      filtered = filtered.filter((t) => t.transactionDate.slice(0, 10) >= filter.from_date!);
    }
    if (filter?.to_date) {
      filtered = filtered.filter((t) => t.transactionDate.slice(0, 10) <= filter.to_date!);
    }

    // Sort descending by date
    filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
    return filtered;
  }

  /**
   * Generates Comprehensive Accounting Reports with date filtering & Egypt timezone
   */
  public static async getAccountingReports(filter?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom';
    from_date?: string;
    to_date?: string;
    orderNumber?: string;
  }): Promise<AccountingReportSummary> {
    const period = filter?.period || 'monthly';
    const nowEgypt = this.getEgyptDateString(); // YYYY-MM-DD in Egypt

    let fromDate = filter?.from_date || '';
    let toDate = filter?.to_date || nowEgypt;

    if (period === 'daily') {
      fromDate = nowEgypt;
      toDate = nowEgypt;
    } else if (period === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      fromDate = this.getEgyptDateString(d);
      toDate = nowEgypt;
    } else if (period === 'monthly') {
      fromDate = `${nowEgypt.slice(0, 7)}-01`;
      toDate = nowEgypt;
    } else if (period === 'annual') {
      fromDate = `${nowEgypt.slice(0, 4)}-01-01`;
      toDate = nowEgypt;
    } else if (period === 'custom') {
      if (!fromDate) fromDate = `${nowEgypt.slice(0, 4)}-01-01`;
      if (!toDate) toDate = nowEgypt;
    }

    // Query all orders with customer and payments
    const allOrders = await prisma.order.findMany({
      orderBy: { id: 'desc' },
      include: {
        customer: true,
        customerPayments: true,
        supplierPayments: true,
        supplierOrders: true,
      },
    });

    // Date filtering based on pickupDate or createdAt in Egypt
    let filteredOrders = allOrders;
    if (fromDate && toDate) {
      filteredOrders = allOrders.filter((o) => {
        const orderDate = o.pickupDate || this.getEgyptDateString(o.createdAt);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    if (filter?.orderNumber) {
      filteredOrders = filteredOrders.filter((o) =>
        o.orderNumber.toLowerCase().includes(filter.orderNumber!.trim().toLowerCase())
      );
    }

    // Categorize orders
    const activeOrders = filteredOrders.filter(
      (o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED'
    );
    const cancelledOrRejected = filteredOrders.filter(
      (o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED'
    );

    // Fetch operational expenses in period
    const expenseLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'booking_expense',
        action: 'EXPENSE_RECORDED',
      },
    });

    const relevantOrderIds = new Set(filteredOrders.map((o) => o.id));
    const activeExpenses = expenseLogs
      .map((l) => (l.newData as any) || {})
      .filter((d) => relevantOrderIds.has(Number(d.orderId)));

    const totalExpenses = activeExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Customer Financials
    const totalBookingsValue = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalCustomerRequested = totalBookingsValue;

    let totalCustomerCollected = 0;
    let totalCustomerRefunds = 0;
    let unconfirmedPaymentsCount = 0;
    let unconfirmedPaymentsAmount = 0;
    let correctionsCount = 0;

    for (const o of activeOrders) {
      for (const p of o.customerPayments) {
        if (p.paymentStatus === 'VERIFIED') {
          totalCustomerCollected += Number(p.amount);
        } else if (p.paymentStatus === 'REFUND') {
          totalCustomerRefunds += Math.abs(Number(p.amount));
        } else if (p.paymentStatus === 'PENDING_REVIEW' || p.paymentStatus === 'DRAFT') {
          unconfirmedPaymentsCount++;
          unconfirmedPaymentsAmount += Number(p.amount);
        } else if (p.paymentStatus === 'CORRECTED') {
          correctionsCount++;
        }
      }
    }

    const netCustomerCollected = Math.max(0, totalCustomerCollected - totalCustomerRefunds);
    const totalCustomerRemaining = Math.max(0, totalBookingsValue - netCustomerCollected);

    // Factory Financials
    const totalFactoryCost = activeOrders.reduce((sum, o) => sum + Number(o.supplierTotal), 0);
    let totalFactoryPaid = 0;
    let totalFactoryRefunds = 0;

    for (const o of activeOrders) {
      for (const sp of o.supplierPayments) {
        if (sp.notes?.includes('[STATUS:REFUND]')) {
          totalFactoryRefunds += Math.abs(Number(sp.amount));
        } else if (!sp.notes?.includes('[STATUS:CORRECTED]')) {
          totalFactoryPaid += Number(sp.amount);
        }
      }
    }

    const netFactoryPaid = Math.max(0, totalFactoryPaid - totalFactoryRefunds);
    const totalFactoryRemaining = Math.max(0, totalFactoryCost - netFactoryPaid);

    // Profitability
    const expectedGrossProfit = Math.round((totalBookingsValue - totalFactoryCost) * 100) / 100;
    const actualNetProfit = Math.round((totalBookingsValue - totalFactoryCost - totalExpenses) * 100) / 100;
    const netCashFlow = Math.round((netCustomerCollected - netFactoryPaid - totalExpenses) * 100) / 100;

    // Factory Orders Count
    const totalFactoryOrdersCount = activeOrders.reduce((count, o) => count + o.supplierOrders.length, 0);

    const cancelledOrRejectedValue = cancelledOrRejected.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );

    return {
      period,
      from_date: fromDate,
      to_date: toDate,
      totalBookingsCount: activeOrders.length,
      totalBookingsValue,
      totalCustomerRequested,
      totalCustomerCollected: netCustomerCollected,
      totalCustomerRemaining,
      totalFactoryOrdersCount,
      totalFactoryCost,
      totalFactoryPaid: netFactoryPaid,
      totalFactoryRemaining,
      totalExpenses,
      totalCustomerRefunds,
      totalFactoryRefunds,
      expectedGrossProfit,
      actualNetProfit,
      netCashFlow,
      cancelledOrRejectedCount: cancelledOrRejected.length,
      cancelledOrRejectedValue,
      unconfirmedPaymentsCount,
      unconfirmedPaymentsAmount,
      correctionsCount,
      orders: filteredOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer.fullName,
        customerPhone: o.customer.phone,
        orderStatus: o.orderStatus,
        pickupDate: o.pickupDate,
        totalAmount: Number(o.totalAmount),
        customerPaid: Number(o.customerPaid),
        customerRemaining: Number(o.customerRemaining),
        supplierTotal: Number(o.supplierTotal),
        supplierPaid: Number(o.supplierPaid),
        supplierRemaining: Number(o.supplierRemaining),
        distributorProfit: Number(o.distributorProfit),
      })),
    };
  }
}
