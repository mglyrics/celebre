import { db } from '../db/index.ts';
import {
  orders,
  orderItems,
  orderItemOptions,
  customers,
  menuItems,
  suppliers,
  supplierOrders,
  customerPayments,
  supplierPayments,
  auditLogs,
  appSettings,
} from '../db/schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export interface CreateBookingInput {
  customerName: string;
  phone: string;
  whatsapp?: string;
  menuCode: string;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  notes?: string;
  drinkOption: 'included' | 'exclude_juice' | 'replace_pepsi';
  initialStatus?: string;
  adminUsername?: string;
  ip?: string;
  userAgent?: string;
}

export class OrderService {
  /**
   * Helper to format numbers cleanly
   */
  private static toDecimalStr(num: number): string {
    return num.toFixed(2);
  }

  /**
   * Generates a unique, chronological order number: CB-YYYYMMDD-XXXX
   */
  public static async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `CB-${yyyy}${mm}${dd}-`;

    const latest = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(sql`${orders.orderNumber} LIKE ${prefix + '%'}`)
      .orderBy(desc(orders.id))
      .limit(1);

    let nextSeq = 1;
    if (latest.length > 0 && latest[0].orderNumber) {
      const parts = latest[0].orderNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Retrieves dynamic drink price adjustment from app_settings
   */
  public static async getDrinkAdjustments(): Promise<{ juiceDiscount: number; pepsiMarkup: number }> {
    try {
      const settings = await db.select().from(appSettings);
      let juiceDiscount = 5;
      let pepsiMarkup = 10;
      for (const s of settings) {
        if (s.key === 'REMOVE_JUICE') juiceDiscount = Math.abs(parseFloat(s.value)) || 5;
        else if (s.key === 'REPLACE_JUICE_WITH_PEPSI') pepsiMarkup = Math.abs(parseFloat(s.value)) || 10;
        else if (s.key === 'juice_exclusion_discount' && !settings.some((x) => x.key === 'REMOVE_JUICE')) {
          juiceDiscount = Math.abs(parseFloat(s.value)) || 5;
        } else if (s.key === 'pepsi_replacement_markup' && !settings.some((x) => x.key === 'REPLACE_JUICE_WITH_PEPSI')) {
          pepsiMarkup = Math.abs(parseFloat(s.value)) || 10;
        }
      }
      return { juiceDiscount, pepsiMarkup };
    } catch {
      return { juiceDiscount: 5, pepsiMarkup: 10 };
    }
  }

  /**
   * Creates a preliminary booking inside a database transaction
   * Status: PENDING_BOOKING (No payment required on site)
   */
  public static async createPreliminaryBooking(input: CreateBookingInput) {
    if (!input.phone || !input.customerName || !input.menuCode || !input.quantity) {
      throw new Error('يرجى إدخال جميع البيانات المطلوبة للحجز المبدئي');
    }

    if (input.quantity < 50) {
      throw new Error('الحد الأدنى للطلب هو 50 وجبة كاترنج لضمان الجودة والتجهيز الفندقي');
    }

    const cleanPhone = input.phone.trim();
    const cleanWhatsapp = (input.whatsapp || cleanPhone).trim();

    // 1. Fetch menu item
    const menuList = await db.select().from(menuItems).where(eq(menuItems.code, input.menuCode)).limit(1);
    if (!menuList.length) {
      throw new Error(`الوجبة المختارة (${input.menuCode}) غير متوفرة حالياً`);
    }
    const menuItem = menuList[0];

    const distUnitPrice = parseFloat(menuItem.distributorPrice);
    const suppUnitPrice = parseFloat(menuItem.supplierPrice);

    // 2. Fetch adjustments
    const { juiceDiscount, pepsiMarkup } = await this.getDrinkAdjustments();

    let customerDrinkAdjustment = 0;
    let optionName = 'عصير بخيرة مشمول مع الوجبة';
    let optionType = 'default_juice';

    if (input.drinkOption === 'exclude_juice') {
      customerDrinkAdjustment = -juiceDiscount; // e.g. -5
      optionName = 'استبعاد العصير (خصم 5 ج.م للوجبة)';
      optionType = 'juice_exclusion';
    } else if (input.drinkOption === 'replace_pepsi') {
      customerDrinkAdjustment = pepsiMarkup; // e.g. +10
      optionName = 'استبدال العصير بكانز بيبسي (+10 ج.م للوجبة)';
      optionType = 'pepsi_replacement';
    }

    const effectiveDistUnitPrice = distUnitPrice + customerDrinkAdjustment;
    const effectiveSuppUnitPrice = suppUnitPrice; // Supplier cost is not altered automatically unless agreed

    const customerTotal = effectiveDistUnitPrice * input.quantity;
    const supplierTotal = effectiveSuppUnitPrice * input.quantity;
    const grossProfit = customerTotal - supplierTotal;

    const orderNumber = await this.generateOrderNumber();

    // 3. Database Transaction
    return await db.transaction(async (tx) => {
      // Find or create customer
      const existingCust = await tx.select().from(customers).where(eq(customers.phone, cleanPhone)).limit(1);
      let customerId: number;
      if (existingCust.length > 0) {
        customerId = existingCust[0].id;
        await tx
          .update(customers)
          .set({
            fullName: input.customerName.trim(),
            whatsapp: cleanWhatsapp,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId));
      } else {
        const newCust = await tx
          .insert(customers)
          .values({
            fullName: input.customerName.trim(),
            phone: cleanPhone,
            whatsapp: cleanWhatsapp,
          })
          .returning();
        customerId = newCust[0].id;
      }

      const orderStatus = input.initialStatus || 'PENDING_BOOKING';
      const actorName = input.adminUsername || 'العميل (حجز مبدئي عبر الموقع)';

      // Create Order
      const newOrders = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId,
          orderStatus,
          pickupDate: input.pickupDate,
          pickupTime: input.pickupTime || 'المغرب 06:30 م',
          pickupLocation: input.pickupLocation || 'القاهرة - سيتم التنسيق عبر واتساب',
          customerNotes: input.notes,
          subtotal: this.toDecimalStr(distUnitPrice * input.quantity),
          adjustments: this.toDecimalStr(customerDrinkAdjustment * input.quantity),
          totalAmount: this.toDecimalStr(customerTotal),
          customerPaid: '0.00', // NO online payment!
          customerRemaining: this.toDecimalStr(customerTotal),
          supplierTotal: this.toDecimalStr(supplierTotal),
          supplierPaid: '0.00',
          supplierRemaining: this.toDecimalStr(supplierTotal),
          distributorProfit: this.toDecimalStr(grossProfit),
        })
        .returning();

      const order = newOrders[0];

      // Create Order Item (Snapshots exact prices at creation time)
      const newOrderItems = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          menuItemId: menuItem.id,
          menuCode: menuItem.code,
          menuName: menuItem.name,
          quantity: input.quantity,
          distributorUnitPrice: this.toDecimalStr(distUnitPrice),
          supplierUnitPrice: this.toDecimalStr(suppUnitPrice),
          distributorTotal: this.toDecimalStr(distUnitPrice * input.quantity),
          supplierTotal: this.toDecimalStr(suppUnitPrice * input.quantity),
          customerAdjustment: this.toDecimalStr(customerDrinkAdjustment),
          supplierAdjustment: '0.00',
          customerTotal: this.toDecimalStr(customerTotal),
          supplierTotalFinal: this.toDecimalStr(supplierTotal),
          profit: this.toDecimalStr(grossProfit),
        })
        .returning();

      const orderItemRecord = newOrderItems[0];

      // Create Order Item Option
      await tx.insert(orderItemOptions).values({
        orderItemId: orderItemRecord.id,
        optionType,
        optionName,
        distributorAdjustment: this.toDecimalStr(customerDrinkAdjustment),
        supplierAdjustment: '0.00',
      });

      // Create Supplier Order (Linked to the exact same order_id)
      const primarySupplier = await tx.select().from(suppliers).limit(1);
      if (primarySupplier.length > 0) {
        const supStatus = orderStatus === 'SENT_TO_SUPPLIER' ? 'SENT' : (orderStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_CONFIRMATION');
        await tx.insert(supplierOrders).values({
          orderId: order.id,
          supplierId: primarySupplier[0].id,
          supplierOrderNumber: `SUP-${orderNumber.replace('CB-', '')}`,
          supplierTotal: this.toDecimalStr(supplierTotal),
          supplierPaid: '0.00',
          supplierRemaining: this.toDecimalStr(supplierTotal),
          status: supStatus,
        });
      }

      // Log Audit for Order Creation
      await tx.insert(auditLogs).values({
        userName: actorName,
        action: 'ORDER_CREATED',
        entity: 'orders',
        entityId: String(order.id),
        newData: {
          orderNumber,
          customerName: input.customerName,
          phone: cleanPhone,
          menuCode: input.menuCode,
          quantity: input.quantity,
          customerTotal,
          supplierTotal,
          grossProfit,
          orderStatus,
        },
        ip: input.ip,
        userAgent: input.userAgent,
      });

      return {
        order,
        menuItem,
        customerName: input.customerName,
        phone: cleanPhone,
        customerTotal,
        supplierTotal,
        optionName,
      };
    });
  }

  /**
   * Records a manual customer payment (received outside system via InstaPay/Cash/Bank)
   * Payment Status: PENDING_REVIEW, VERIFIED, REJECTED
   */
  public static async recordCustomerPayment(
    orderId: number,
    amount: number,
    paymentMethod: 'INSTAPAY' | 'CASH' | 'BANK_TRANSFER' | 'OTHER',
    paymentReference: string,
    notes: string,
    adminUsername: string,
    ip?: string,
    paymentStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' = 'VERIFIED'
  ) {
    if (amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');

    const validMethods = ['INSTAPAY', 'CASH', 'BANK_TRANSFER', 'OTHER'];
    if (!validMethods.includes(paymentMethod)) {
      throw new Error('طريقة الدفع غير صالحة');
    }

    const validStatuses = ['PENDING_REVIEW', 'VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error('حالة الدفعة غير صالحة');
    }

    return await db.transaction(async (tx) => {
      const orderList = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!orderList.length) throw new Error('الطلب غير موجود');
      const order = orderList[0];

      // Insert payment record
      const insertedPayments = await tx
        .insert(customerPayments)
        .values({
          orderId,
          customerId: order.customerId,
          amount: this.toDecimalStr(amount),
          paymentMethod,
          paymentStatus,
          paymentReference,
          notes,
          receivedBy: adminUsername,
        })
        .returning();

      const newPayment = insertedPayments[0];

      // Recalculate customer_paid strictly from VERIFIED payments
      const allVerifiedPayments = await tx
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(customerPayments)
        .where(and(eq(customerPayments.orderId, orderId), eq(customerPayments.paymentStatus, 'VERIFIED')));

      const totalCustomerPaid = parseFloat(allVerifiedPayments[0]?.total || '0');
      const orderTotal = parseFloat(order.totalAmount);
      // Strictly prevent negative remaining balance
      const customerRemaining = Math.max(0, orderTotal - totalCustomerPaid);

      // Auto update order status from PENDING_BOOKING to CONFIRMED if at least one verified payment exists
      let newOrderStatus = order.orderStatus;
      if (order.orderStatus === 'PENDING_BOOKING' && totalCustomerPaid > 0) {
        newOrderStatus = 'CONFIRMED';
      }

      await tx
        .update(orders)
        .set({
          customerPaid: this.toDecimalStr(totalCustomerPaid),
          customerRemaining: this.toDecimalStr(customerRemaining),
          orderStatus: newOrderStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Audit Log for Payment Creation
      await tx.insert(auditLogs).values({
        userName: adminUsername,
        action: 'CUSTOMER_PAYMENT_ADDED',
        entity: 'customer_payments',
        entityId: String(newPayment.id),
        newData: {
          orderId,
          orderNumber: order.orderNumber,
          amount,
          paymentMethod,
          paymentStatus,
          paymentReference,
          newPaid: totalCustomerPaid,
          newRemaining: customerRemaining,
        },
        ip,
      });

      return { payment: newPayment, totalCustomerPaid, customerRemaining, orderStatus: newOrderStatus };
    });
  }

  /**
   * Updates an existing customer payment (amount, status, method, reference, notes)
   * Recalculates verified customer payments with zero tolerance for negative balance
   */
  public static async updateCustomerPayment(
    paymentId: number,
    data: {
      amount?: number;
      paymentMethod?: 'INSTAPAY' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';
      paymentStatus?: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
      paymentReference?: string;
      notes?: string;
    },
    adminUsername: string,
    ip?: string
  ) {
    return await db.transaction(async (tx) => {
      const existingList = await tx.select().from(customerPayments).where(eq(customerPayments.id, paymentId)).limit(1);
      if (!existingList.length) throw new Error('سجل الدفعة غير موجود');
      const oldPayment = existingList[0];
      const orderId = oldPayment.orderId;

      const orderList = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!orderList.length) throw new Error('الطلب المرتبط بالدفعة غير موجود');
      const order = orderList[0];

      const updateData: any = {};
      if (data.amount !== undefined) {
        if (data.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
        updateData.amount = this.toDecimalStr(data.amount);
      }
      if (data.paymentMethod) {
        const validMethods = ['INSTAPAY', 'CASH', 'BANK_TRANSFER', 'OTHER'];
        if (!validMethods.includes(data.paymentMethod)) throw new Error('طريقة الدفع غير صالحة');
        updateData.paymentMethod = data.paymentMethod;
      }
      if (data.paymentStatus) {
        const validStatuses = ['PENDING_REVIEW', 'VERIFIED', 'REJECTED'];
        if (!validStatuses.includes(data.paymentStatus)) throw new Error('حالة الدفعة غير صالحة');
        updateData.paymentStatus = data.paymentStatus;
      }
      if (data.paymentReference !== undefined) updateData.paymentReference = data.paymentReference;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await tx.update(customerPayments).set(updateData).where(eq(customerPayments.id, paymentId));

      // Recalculate customer_paid strictly from VERIFIED payments
      const allVerified = await tx
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(customerPayments)
        .where(and(eq(customerPayments.orderId, orderId), eq(customerPayments.paymentStatus, 'VERIFIED')));

      const totalCustomerPaid = parseFloat(allVerified[0]?.total || '0');
      const orderTotal = parseFloat(order.totalAmount);
      const customerRemaining = Math.max(0, orderTotal - totalCustomerPaid);

      await tx
        .update(orders)
        .set({
          customerPaid: this.toDecimalStr(totalCustomerPaid),
          customerRemaining: this.toDecimalStr(customerRemaining),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Audit Log for Payment Update
      await tx.insert(auditLogs).values({
        userName: adminUsername,
        action: 'CUSTOMER_PAYMENT_UPDATED',
        entity: 'customer_payments',
        entityId: String(paymentId),
        oldData: {
          amount: parseFloat(oldPayment.amount),
          paymentMethod: oldPayment.paymentMethod,
          paymentStatus: oldPayment.paymentStatus,
          paymentReference: oldPayment.paymentReference,
        },
        newData: {
          ...updateData,
          newPaid: totalCustomerPaid,
          newRemaining: customerRemaining,
        },
        ip,
      });

      return { totalCustomerPaid, customerRemaining };
    });
  }

  /**
   * Records a manual payment from Celebre to the Factory (Supplier)
   * Independent from customer payments!
   */
  public static async recordSupplierPayment(
    supplierOrderId: number,
    amount: number,
    paymentMethod: string,
    reference: string,
    notes: string,
    adminUsername: string,
    ip?: string
  ) {
    if (amount <= 0) throw new Error('مبلغ دفعة المصنع يجب أن يكون أكبر من صفر');

    return await db.transaction(async (tx) => {
      const supOrders = await tx.select().from(supplierOrders).where(eq(supplierOrders.id, supplierOrderId)).limit(1);
      if (!supOrders.length) throw new Error('أمر التوريد غير موجود');
      const supOrder = supOrders[0];

      const inserted = await tx
        .insert(supplierPayments)
        .values({
          supplierOrderId,
          supplierId: supOrder.supplierId,
          orderId: supOrder.orderId,
          amount: this.toDecimalStr(amount),
          paymentMethod,
          reference,
          notes,
          paidBy: adminUsername,
        })
        .returning();

      const newPayment = inserted[0];

      // Recalculate supplier_paid
      const allSupPayments = await tx
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(supplierPayments)
        .where(eq(supplierPayments.supplierOrderId, supplierOrderId));

      const totalSupplierPaid = parseFloat(allSupPayments[0]?.total || '0');
      const supTotal = parseFloat(supOrder.supplierTotal);
      // Strictly prevent negative remaining balance
      const supplierRemaining = Math.max(0, supTotal - totalSupplierPaid);

      await tx
        .update(supplierOrders)
        .set({
          supplierPaid: this.toDecimalStr(totalSupplierPaid),
          supplierRemaining: this.toDecimalStr(supplierRemaining),
          updatedAt: new Date(),
        })
        .where(eq(supplierOrders.id, supplierOrderId));

      // Also update orders table supplier columns (never touches customer columns!)
      await tx
        .update(orders)
        .set({
          supplierPaid: this.toDecimalStr(totalSupplierPaid),
          supplierRemaining: this.toDecimalStr(supplierRemaining),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, supOrder.orderId));

      // Audit Log
      await tx.insert(auditLogs).values({
        userName: adminUsername,
        action: 'SUPPLIER_PAYMENT_ADDED',
        entity: 'supplier_payments',
        entityId: String(newPayment.id),
        newData: {
          supplierOrderId,
          supplierOrderNumber: supOrder.supplierOrderNumber,
          amount,
          reference,
          totalSupplierPaid,
          supplierRemaining,
        },
        ip,
      });

      return { payment: newPayment, totalSupplierPaid, supplierRemaining };
    });
  }

  /**
   * Updates an existing supplier payment (amount, method, reference, notes)
   */
  public static async updateSupplierPayment(
    paymentId: number,
    data: {
      amount?: number;
      paymentMethod?: string;
      reference?: string;
      notes?: string;
    },
    adminUsername: string,
    ip?: string
  ) {
    return await db.transaction(async (tx) => {
      const existingList = await tx.select().from(supplierPayments).where(eq(supplierPayments.id, paymentId)).limit(1);
      if (!existingList.length) throw new Error('سجل دفعة المصنع غير موجود');
      const oldPayment = existingList[0];
      const supplierOrderId = oldPayment.supplierOrderId;

      const supOrders = await tx.select().from(supplierOrders).where(eq(supplierOrders.id, supplierOrderId)).limit(1);
      if (!supOrders.length) throw new Error('أمر التوريد المرتبط بالدفعة غير موجود');
      const supOrder = supOrders[0];

      const updateData: any = {};
      if (data.amount !== undefined) {
        if (data.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
        updateData.amount = this.toDecimalStr(data.amount);
      }
      if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await tx.update(supplierPayments).set(updateData).where(eq(supplierPayments.id, paymentId));

      // Recalculate supplier_paid
      const allSupPayments = await tx
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(supplierPayments)
        .where(eq(supplierPayments.supplierOrderId, supplierOrderId));

      const totalSupplierPaid = parseFloat(allSupPayments[0]?.total || '0');
      const supTotal = parseFloat(supOrder.supplierTotal);
      const supplierRemaining = Math.max(0, supTotal - totalSupplierPaid);

      await tx
        .update(supplierOrders)
        .set({
          supplierPaid: this.toDecimalStr(totalSupplierPaid),
          supplierRemaining: this.toDecimalStr(supplierRemaining),
          updatedAt: new Date(),
        })
        .where(eq(supplierOrders.id, supplierOrderId));

      await tx
        .update(orders)
        .set({
          supplierPaid: this.toDecimalStr(totalSupplierPaid),
          supplierRemaining: this.toDecimalStr(supplierRemaining),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, supOrder.orderId));

      // Audit Log
      await tx.insert(auditLogs).values({
        userName: adminUsername,
        action: 'SUPPLIER_PAYMENT_UPDATED',
        entity: 'supplier_payments',
        entityId: String(paymentId),
        oldData: {
          amount: parseFloat(oldPayment.amount),
          paymentMethod: oldPayment.paymentMethod,
          reference: oldPayment.reference,
        },
        newData: {
          ...updateData,
          totalSupplierPaid,
          supplierRemaining,
        },
        ip,
      });

      return { totalSupplierPaid, supplierRemaining };
    });
  }

  /**
   * Updates order status with full audit logging
   */
  public static async updateOrderStatus(
    orderId: number,
    newStatus: string,
    cancelReason: string | undefined,
    adminUsername: string,
    ip?: string
  ) {
    const validStatuses = [
      'PENDING_BOOKING',
      'CONFIRMED',
      'SENT_TO_SUPPLIER',
      'IN_PRODUCTION',
      'READY',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new Error('حالة الطلب غير صالحة');
    }

    return await db.transaction(async (tx) => {
      const orderList = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!orderList.length) throw new Error('الطلب غير موجود');
      const order = orderList[0];

      const updateData: any = {
        orderStatus: newStatus,
        updatedAt: new Date(),
      };

      if (newStatus === 'CANCELLED') {
        updateData.cancelReason = cancelReason || 'تم الإلغاء بالتنسيق مع العميل';
        updateData.cancelledAt = new Date();
      } else if (newStatus === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      if (newStatus === 'CONFIRMED' || newStatus === 'SENT_TO_SUPPLIER') {
        const existingSup = await tx.select().from(supplierOrders).where(eq(supplierOrders.orderId, orderId)).limit(1);
        if (existingSup.length === 0) {
          const primarySupplier = await tx.select().from(suppliers).limit(1);
          if (primarySupplier.length > 0) {
            await tx.insert(supplierOrders).values({
              orderId: order.id,
              supplierId: primarySupplier[0].id,
              supplierOrderNumber: `SUP-${order.orderNumber.replace('CB-', '')}`,
              supplierTotal: order.supplierTotal,
              supplierPaid: order.supplierPaid,
              supplierRemaining: order.supplierRemaining,
              status: newStatus === 'SENT_TO_SUPPLIER' ? 'SENT' : 'CONFIRMED',
            });
          }
        } else if (newStatus === 'SENT_TO_SUPPLIER') {
          await tx
            .update(supplierOrders)
            .set({ status: 'SENT', updatedAt: new Date() })
            .where(eq(supplierOrders.orderId, orderId));
        } else if (newStatus === 'CONFIRMED' && existingSup[0].status === 'PENDING_CONFIRMATION') {
          await tx
            .update(supplierOrders)
            .set({ status: 'CONFIRMED', updatedAt: new Date() })
            .where(eq(supplierOrders.orderId, orderId));
        }
      }

      await tx.update(orders).set(updateData).where(eq(orders.id, orderId));

      await tx.insert(auditLogs).values({
        userName: adminUsername,
        action: 'ORDER_STATUS_CHANGED',
        entity: 'orders',
        entityId: String(orderId),
        oldData: { status: order.orderStatus },
        newData: { status: newStatus, cancelReason },
        ip,
      });

      return { success: true, status: newStatus };
    });
  }

  /**
   * Edit order operational details (quantity, date, time, location)
   */
  public static async updateOrderDetails(
    orderId: number,
    details: {
      pickupDate?: string;
      pickupTime?: string;
      pickupLocation?: string;
      customerNotes?: string;
      quantity?: number;
      customerName?: string;
      phone?: string;
      whatsapp?: string;
    },
    adminUsername: string,
    ip?: string
  ) {
    return await db.transaction(async (tx) => {
      const orderList = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!orderList.length) throw new Error('الطلب غير موجود');
      const order = orderList[0];

      const oldData = { ...order };
      const updateData: any = { updatedAt: new Date() };

      if (details.customerName || details.phone || details.whatsapp) {
        const custUpdates: any = { updatedAt: new Date() };
        if (details.customerName) custUpdates.fullName = details.customerName.trim();
        if (details.phone) custUpdates.phone = details.phone.trim();
        if (details.whatsapp) custUpdates.whatsapp = details.whatsapp.trim();
        await tx.update(customers).set(custUpdates).where(eq(customers.id, order.customerId));
      }

      if (details.pickupDate) updateData.pickupDate = details.pickupDate;
      if (details.pickupTime) updateData.pickupTime = details.pickupTime;
      if (details.pickupLocation) updateData.pickupLocation = details.pickupLocation;
      if (details.customerNotes !== undefined) updateData.customerNotes = details.customerNotes;

      // If quantity changed, recalculate items & totals based on price snapshots
      if (details.quantity && details.quantity !== 0) {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        if (items.length > 0) {
          const item = items[0];
          const newQty = details.quantity;
          const distUnitPrice = parseFloat(item.distributorUnitPrice);
          const suppUnitPrice = parseFloat(item.supplierUnitPrice);
          const customerAdj = parseFloat(item.customerAdjustment);

          const newCustomerTotal = (distUnitPrice + customerAdj) * newQty;
          const newSupplierTotal = suppUnitPrice * newQty;
          const newProfit = newCustomerTotal - newSupplierTotal;

          await tx
            .update(orderItems)
            .set({
              quantity: newQty,
              distributorTotal: this.toDecimalStr(distUnitPrice * newQty),
              supplierTotal: this.toDecimalStr(suppUnitPrice * newQty),
              customerTotal: this.toDecimalStr(newCustomerTotal),
              supplierTotalFinal: this.toDecimalStr(newSupplierTotal),
              profit: this.toDecimalStr(newProfit),
            })
            .where(eq(orderItems.id, item.id));

          const customerPaid = parseFloat(order.customerPaid);
          const supplierPaid = parseFloat(order.supplierPaid);

          updateData.subtotal = this.toDecimalStr(distUnitPrice * newQty);
          updateData.adjustments = this.toDecimalStr(customerAdj * newQty);
          updateData.totalAmount = this.toDecimalStr(newCustomerTotal);
          updateData.customerRemaining = this.toDecimalStr(Math.max(0, newCustomerTotal - customerPaid));
          updateData.supplierTotal = this.toDecimalStr(newSupplierTotal);
          updateData.supplierRemaining = this.toDecimalStr(Math.max(0, newSupplierTotal - supplierPaid));
          updateData.distributorProfit = this.toDecimalStr(newProfit);

          // Update supplier order
          await tx
            .update(supplierOrders)
            .set({
              supplierTotal: this.toDecimalStr(newSupplierTotal),
              supplierRemaining: this.toDecimalStr(Math.max(0, newSupplierTotal - supplierPaid)),
              updatedAt: new Date(),
            })
            .where(eq(supplierOrders.orderId, orderId));
        }
      }

      await tx.update(orders).set(updateData).where(eq(orders.id, orderId));

      await tx.insert(auditLogs).values({
        userName: adminUsername,
        action: 'ORDER_DETAILS_UPDATED',
        entity: 'orders',
        entityId: String(orderId),
        oldData,
        newData: details,
        ip,
      });

      return { success: true };
    });
  }
}
