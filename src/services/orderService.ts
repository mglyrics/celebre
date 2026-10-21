import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.ts';

export interface BookingItemInput {
  menuCode: string;
  quantity: number;
  drinkOption?: 'included' | 'exclude_juice' | 'replace_pepsi';
}

export interface CreateBookingInput {
  customerName: string;
  phone: string;
  whatsapp?: string;
  menuCode?: string;
  quantity?: number;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  notes?: string;
  drinkOption?: 'included' | 'exclude_juice' | 'replace_pepsi';
  items?: BookingItemInput[];
  venueType?: string;
  occasion?: string;
  arrivalInstructions?: string;
  idempotencyKey?: string;
  initialStatus?: string;
  skipIdempotency?: boolean;
  skipSupplierOrderCreation?: boolean;
  adminUsername?: string;
  ip?: string;
  userAgent?: string;
}

export class OrderService {
  /**
   * Helper to format numbers cleanly to 2 decimal places
   */
  private static toDecimal(num: number | string | Prisma.Decimal): Prisma.Decimal {
    return new Prisma.Decimal(typeof num === 'number' ? num.toFixed(2) : String(num));
  }

  /**
   * Generates a unique, chronological order number: CB-YYYYMMDD-XXXX
   */
  public static async generateOrderNumber(txClient?: any): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `CB-${yyyy}${mm}${dd}-`;

    const client = txClient || prisma;
    const latest = await client.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
      select: {
        orderNumber: true,
      },
    });

    let nextSeq = 1;
    if (latest && latest.orderNumber) {
      const parts = latest.orderNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Resolves an order record by either its integer ID or readable orderNumber string
   */
  public static async getOrderByIdOrNumber(idOrNumber: string | number, txClient?: any) {
    const str = String(idOrNumber || '').trim();
    if (!str) return null;
    const isPureInt = /^\d+$/.test(str);
    const upperStr = str.toUpperCase();
    const client = txClient || prisma;

    if (isPureInt) {
      const numId = parseInt(str, 10);
      const found = await client.order.findFirst({
        where: {
          OR: [
            { id: numId },
            { orderNumber: { equals: str, mode: 'insensitive' } },
            { orderNumber: { equals: upperStr, mode: 'insensitive' } },
          ],
        },
      });
      return found;
    }

    return await client.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: str, mode: 'insensitive' } },
          { orderNumber: { equals: upperStr, mode: 'insensitive' } },
        ],
      },
    });
  }

  /**
   * Retrieves dynamic drink price adjustment from app_settings
   */
  public static async getDrinkAdjustments(): Promise<{ juiceDiscount: number; pepsiMarkup: number }> {
    try {
      const settings = await prisma.appSetting.findMany();
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
   * Creates a preliminary booking inside a Prisma database transaction
   * Status: PENDING_BOOKING (No online payment required)
   * Supports both single-meal and multi-meal orders with dynamic per-item juice verification
   */
  public static async createPreliminaryBooking(input: CreateBookingInput) {
    if (!input.phone || !input.customerName) {
      throw new Error('يرجى إدخال جميع البيانات المطلوبة للحجز المبدئي');
    }

    if (input.customerName.trim().length < 2) {
      throw new Error('يرجى إدخال اسم العميل بشكل صحيح');
    }

    const cleanPhone = input.phone.trim();
    if (cleanPhone.length < 10) {
      throw new Error('يرجى إدخال رقم هاتف صحيح للتواصل والتأكيد');
    }

    // Determine items list (supports multi-item orders and legacy single-item format)
    const rawItems: BookingItemInput[] = (input.items && Array.isArray(input.items) && input.items.length > 0)
      ? input.items
      : [{
          menuCode: input.menuCode || '',
          quantity: Number(input.quantity),
          drinkOption: input.drinkOption || 'included',
        }];

    if (rawItems.length === 0 || !rawItems[0].menuCode) {
      throw new Error('يرجى اختيار وجبة واحدة على الأقل لإتمام الحجز');
    }

    // Validate quantities
    let totalQuantity = 0;
    for (const item of rawItems) {
      const q = Number(item.quantity);
      if (isNaN(q) || q < 1) {
        throw new Error(`الكمية غير صالحة للوجبة (${item.menuCode})`);
      }
      totalQuantity += q;
    }

    if (totalQuantity < 50) {
      throw new Error('الحد الأدنى للطلب هو 50 وجبة كاترنج لضمان الجودة والتجهيز الفندقي');
    }

    const cleanWhatsapp = (input.whatsapp || cleanPhone).trim();

    // Fetch dynamic adjustments from app_settings
    const { juiceDiscount, pepsiMarkup } = await this.getDrinkAdjustments();

    // 1. Fetch menu items & components via Prisma directly from Database (trust server only, never client price)
    const processedItems: Array<{
      menuItem: any;
      quantity: number;
      drinkOption: string;
      hasJuice: boolean;
      distUnitPrice: number;
      suppUnitPrice: number;
      customerDrinkAdjustment: number;
      effectiveDistUnitPrice: number;
      itemSubtotal: number;
      itemAdjustments: number;
      itemCustomerTotal: number;
      itemSupplierTotal: number;
      itemProfit: number;
      optionName: string;
      optionType: string;
      componentsSnapshotText: string;
    }> = [];

    let orderSubtotal = 0;
    let orderAdjustments = 0;
    let orderCustomerTotal = 0;
    let orderSupplierTotal = 0;
    let orderGrossProfit = 0;

    for (const rawItem of rawItems) {
      const cleanCode = (rawItem.menuCode || '').trim();
      const match = cleanCode.match(/^sale\s*[-_ ]\s*(\d+)$/i);
      const normalizedCode = match ? `Sale-${String(parseInt(match[1], 10)).padStart(2, '0')}` : cleanCode;

      let menuItem = await prisma.menuItem.findUnique({
        where: { code: cleanCode },
        include: {
          components: { orderBy: { sortOrder: 'asc' } },
        },
      });

      if (!menuItem && normalizedCode !== cleanCode) {
        menuItem = await prisma.menuItem.findUnique({
          where: { code: normalizedCode },
          include: {
            components: { orderBy: { sortOrder: 'asc' } },
          },
        });
      }

      if (!menuItem) {
        menuItem = await prisma.menuItem.findFirst({
          where: {
            OR: [
              { code: { equals: normalizedCode, mode: 'insensitive' } },
              { code: { equals: cleanCode, mode: 'insensitive' } },
            ],
          },
          include: {
            components: { orderBy: { sortOrder: 'asc' } },
          },
        });
      }

      if (!menuItem) {
        throw new Error(`الوجبة المختارة (${rawItem.menuCode}) غير متوفرة حالياً`);
      }

      // Check whether this specific meal actually contains juice in its registered components
      const hasJuice = menuItem.components.some(
        (c) => c.componentName.includes('عصير') || (c as any).isBeverage === true
      );

      const distUnitPrice = Number(menuItem.distributorPrice);
      const suppUnitPrice = Number(menuItem.supplierPrice);

      let customerDrinkAdjustment = 0;
      let optionName = 'عصير بخيرة مشمول مع الوجبة';
      let optionType = 'default_juice';

      const chosenOption = rawItem.drinkOption || 'included';

      if (chosenOption === 'exclude_juice') {
        if (hasJuice) {
          customerDrinkAdjustment = -juiceDiscount;
          optionName = 'استبعاد العصير (خصم 5 ج.م للوجبة)';
          optionType = 'juice_exclusion';
        } else {
          // Meal does not contain juice: no discount or adjustment applies
          customerDrinkAdjustment = 0;
          optionName = 'الوجبة لا تتضمن عصير - بدون تعديل';
          optionType = 'no_juice_in_meal';
        }
      } else if (chosenOption === 'replace_pepsi') {
        if (hasJuice) {
          customerDrinkAdjustment = pepsiMarkup;
          optionName = 'استبدال العصير بكانز بيبسي (+10 ج.م للوجبة)';
          optionType = 'pepsi_replacement';
        } else {
          // Meal does not contain juice: no replacement addition applies
          customerDrinkAdjustment = 0;
          optionName = 'الوجبة لا تتضمن عصير - بدون تعديل';
          optionType = 'no_juice_in_meal';
        }
      } else {
        if (!hasJuice) {
          optionName = 'الوجبة لا تتضمن عصير';
          optionType = 'no_juice_in_meal';
        }
      }

      const effectiveDistUnitPrice = Math.max(0, distUnitPrice + customerDrinkAdjustment);
      const effectiveSuppUnitPrice = suppUnitPrice;

      const q = rawItem.quantity;
      const itemSubtotal = distUnitPrice * q;
      const itemAdjustments = customerDrinkAdjustment * q;
      const itemCustomerTotal = effectiveDistUnitPrice * q;
      const itemSupplierTotal = effectiveSuppUnitPrice * q;
      const itemProfit = itemCustomerTotal - itemSupplierTotal;

      orderSubtotal += itemSubtotal;
      orderAdjustments += itemAdjustments;
      orderCustomerTotal += itemCustomerTotal;
      orderSupplierTotal += itemSupplierTotal;
      orderGrossProfit += itemProfit;

      const componentsSnapshotText = menuItem.components
        .map((c) => `${Number(c.quantity)} ${c.unit} ${c.componentName}`)
        .join(' + ');

      processedItems.push({
        menuItem,
        quantity: q,
        drinkOption: chosenOption,
        hasJuice,
        distUnitPrice,
        suppUnitPrice,
        customerDrinkAdjustment,
        effectiveDistUnitPrice,
        itemSubtotal,
        itemAdjustments,
        itemCustomerTotal,
        itemSupplierTotal,
        itemProfit,
        optionName,
        optionType,
        componentsSnapshotText,
      });
    }

    // 3. Format Location and Occasion details
    let fullLocation = (input.pickupLocation || '').trim();
    if (input.venueType) {
      fullLocation = `[${input.venueType}] ${fullLocation}`;
    }
    if (input.arrivalInstructions && input.arrivalInstructions.trim()) {
      fullLocation = `${fullLocation} (تفاصيل الوصول: ${input.arrivalInstructions.trim()})`;
    }
    if (!fullLocation) {
      fullLocation = 'سيتم التنسيق هاتفياً عبر واتساب';
    }

    let combinedNotes = input.notes ? input.notes.trim() : '';
    if (input.occasion) {
      combinedNotes = `المناسبة: ${input.occasion}${combinedNotes ? ' | ' + combinedNotes : ''}`;
    }

    // 4. Idempotency & Re-submission Protection (prevents duplicate orders within 60s)
    if (!input.skipIdempotency) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const expectedInitialStatus = input.initialStatus || 'PENDING_BOOKING';
      const firstCode = processedItems[0].menuItem.code;
      const existingRecentOrder = await prisma.order.findFirst({
        where: {
          customer: { phone: cleanPhone },
          pickupDate: input.pickupDate,
          orderStatus: expectedInitialStatus,
          createdAt: { gt: oneMinuteAgo },
          items: {
            some: {
              menuCode: firstCode,
            },
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              options: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      if (existingRecentOrder) {
        return {
          order: existingRecentOrder,
          menuItem: processedItems[0].menuItem,
          customerName: input.customerName.trim(),
          phone: cleanPhone,
          customerTotal: Number(existingRecentOrder.totalAmount),
          supplierTotal: Number(existingRecentOrder.supplierTotal),
          optionName: processedItems[0].optionName,
          items: processedItems.map((p) => ({
            menuCode: p.menuItem.code,
            menuName: p.menuItem.name,
            quantity: p.quantity,
            distributorUnitPrice: p.distUnitPrice,
            customerAdjustment: p.customerDrinkAdjustment,
            customerTotal: p.itemCustomerTotal,
            optionName: p.optionName,
            componentsText: p.componentsSnapshotText,
          })),
          isIdempotentDuplicate: true,
        };
      }
    }

    // Concurrency collision retry loop
    let lastError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const orderNumber = await this.generateOrderNumber(tx);

          // Find or create customer
          const existingCust = await tx.customer.findUnique({
            where: { phone: cleanPhone },
          });

          let customerId: number;
          if (existingCust) {
            customerId = existingCust.id;
            await tx.customer.update({
              where: { id: customerId },
              data: {
                fullName: input.customerName.trim(),
                whatsapp: cleanWhatsapp,
                updatedAt: new Date(),
              },
            });
          } else {
            const newCust = await tx.customer.create({
              data: {
                fullName: input.customerName.trim(),
                phone: cleanPhone,
                whatsapp: cleanWhatsapp,
              },
            });
            customerId = newCust.id;
          }

          const orderStatus = input.initialStatus || 'PENDING_BOOKING';
          const actorName = input.adminUsername || 'العميل (حجز مبدئي عبر الموقع)';

          // Create Order in PostgreSQL
          const order = await tx.order.create({
            data: {
              orderNumber,
              customerId,
              orderStatus,
              pickupDate: input.pickupDate,
              pickupTime: input.pickupTime || 'المغرب 06:30 م',
              pickupLocation: fullLocation,
              customerNotes: combinedNotes,
              subtotal: this.toDecimal(orderSubtotal),
              adjustments: this.toDecimal(orderAdjustments),
              totalAmount: this.toDecimal(orderCustomerTotal),
              customerPaid: this.toDecimal(0),
              customerRemaining: this.toDecimal(orderCustomerTotal),
              supplierTotal: this.toDecimal(orderSupplierTotal),
              supplierPaid: this.toDecimal(0),
              supplierRemaining: this.toDecimal(orderSupplierTotal),
              distributorProfit: this.toDecimal(orderGrossProfit),
            },
          });

          // Create Order Items & Options
          for (const item of processedItems) {
            const orderItemRecord = await tx.orderItem.create({
              data: {
                orderId: order.id,
                menuItemId: item.menuItem.id,
                menuCode: item.menuItem.code,
                menuName: item.menuItem.name,
                quantity: item.quantity,
                distributorUnitPrice: this.toDecimal(item.distUnitPrice),
                supplierUnitPrice: this.toDecimal(item.suppUnitPrice),
                distributorTotal: this.toDecimal(item.itemSubtotal),
                supplierTotal: this.toDecimal(item.itemSupplierTotal),
                customerAdjustment: this.toDecimal(item.customerDrinkAdjustment),
                supplierAdjustment: this.toDecimal(0),
                customerTotal: this.toDecimal(item.itemCustomerTotal),
                supplierTotalFinal: this.toDecimal(item.itemSupplierTotal),
                profit: this.toDecimal(item.itemProfit),
              },
            });

            // Drink Option
            await tx.orderItemOption.create({
              data: {
                orderItemId: orderItemRecord.id,
                optionType: item.optionType,
                optionName: item.optionName,
                distributorAdjustment: this.toDecimal(item.customerDrinkAdjustment),
                supplierAdjustment: this.toDecimal(0),
              },
            });

            // Components Snapshot
            if (item.componentsSnapshotText) {
              await tx.orderItemOption.create({
                data: {
                  orderItemId: orderItemRecord.id,
                  optionType: 'components_snapshot',
                  optionName: `محتويات الوجبة وقت الحجز: ${item.componentsSnapshotText}`,
                  distributorAdjustment: this.toDecimal(0),
                  supplierAdjustment: this.toDecimal(0),
                },
              });
            }
          }

          // Create Supplier Order only if NOT skipped (defaults to false for public bookings to ensure admin approval first)
          if (!input.skipSupplierOrderCreation) {
            const primarySupplier = await tx.supplier.findFirst();
            if (primarySupplier) {
              const supStatus =
                orderStatus === 'SENT_TO_SUPPLIER'
                  ? 'SENT'
                  : orderStatus === 'CONFIRMED'
                    ? 'CONFIRMED'
                    : 'PENDING_CONFIRMATION';
              await tx.supplierOrder.create({
                data: {
                  orderId: order.id,
                  supplierId: primarySupplier.id,
                  supplierOrderNumber: `SUP-${orderNumber.replace('CB-', '')}`,
                  supplierTotal: this.toDecimal(orderSupplierTotal),
                  supplierPaid: this.toDecimal(0),
                  supplierRemaining: this.toDecimal(orderSupplierTotal),
                  status: supStatus,
                },
              });
            }
          }

          // Log Audit for Order Creation
          await tx.auditLog.create({
            data: {
              userName: actorName,
              action: 'ORDER_CREATED',
              entity: 'orders',
              entityId: String(order.id),
              newData: {
                orderNumber,
                customerName: input.customerName,
                phone: cleanPhone,
                totalItemsCount: processedItems.length,
                totalMealsQuantity: totalQuantity,
                customerTotal: orderCustomerTotal,
                supplierTotal: orderSupplierTotal,
                grossProfit: orderGrossProfit,
                orderStatus,
              },
              ip: input.ip,
              userAgent: input.userAgent,
            },
          });

          return {
            order,
            menuItem: processedItems[0].menuItem,
            customerName: input.customerName,
            phone: cleanPhone,
            customerTotal: orderCustomerTotal,
            supplierTotal: orderSupplierTotal,
            optionName: processedItems[0].optionName,
            items: processedItems.map((p) => ({
              menuCode: p.menuItem.code,
              menuName: p.menuItem.name,
              quantity: p.quantity,
              distributorUnitPrice: p.distUnitPrice,
              customerAdjustment: p.customerDrinkAdjustment,
              customerTotal: p.itemCustomerTotal,
              optionName: p.optionName,
              componentsText: p.componentsSnapshotText,
            })),
          };
        });
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '').toLowerCase();
        if ((msg.includes('unique') || msg.includes('duplicate')) && attempt < 4) {
          await new Promise((r) => setTimeout(r, 40 * (attempt + 1) + Math.random() * 40));
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error('فشل إنشاء الحجز المبدئي بعد عدة محاولات');
  }

  /**
   * Records a manual customer payment (received outside system via InstaPay/Cash/Bank)
   */
  public static async recordCustomerPayment(
    orderId: number | string,
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

    return await prisma.$transaction(async (tx) => {
      const order = await this.getOrderByIdOrNumber(orderId, tx);
      if (!order) throw new Error('الطلب غير موجود');

      // Idempotency: Prevent duplicate payment submitted within 10 seconds with same amount and ref
      const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
      const recentDup = await tx.customerPayment.findFirst({
        where: {
          orderId: order.id,
          amount: this.toDecimal(amount),
          paymentReference: paymentReference ? paymentReference.trim() : undefined,
          createdAt: { gt: tenSecondsAgo },
        },
      });
      if (recentDup) {
        throw new Error('تم تسجيل هذه الدفعة للعميل مسبقاً قبل قليل. تم منع التكرار.');
      }

      // Insert payment record
      const newPayment = await tx.customerPayment.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          amount: this.toDecimal(amount),
          paymentMethod,
          paymentStatus,
          paymentReference: paymentReference ? paymentReference.trim() : null,
          notes: notes ? notes.trim() : null,
          receivedBy: adminUsername,
        },
      });

      // Recalculate customer_paid strictly from VERIFIED payments
      const verifiedAgg = await tx.customerPayment.aggregate({
        where: {
          orderId: order.id,
          paymentStatus: 'VERIFIED',
        },
        _sum: {
          amount: true,
        },
      });

      const totalCustomerPaid = Number(verifiedAgg._sum.amount || 0);
      const orderTotal = Number(order.totalAmount);
      const customerRemaining = Math.max(0, orderTotal - totalCustomerPaid);
      const requiredDeposit = Math.round(orderTotal * 0.5 * 100) / 100;

      // Update order status based on verified customer deposit progression
      let newOrderStatus = order.orderStatus;
      if (
        [
          'PENDING_BOOKING',
          'PENDING_REVIEW',
          'AWAITING_CUSTOMER_DEPOSIT',
          'CUSTOMER_DEPOSIT_PARTIAL',
          'CUSTOMER_DEPOSIT_PAID',
        ].includes(order.orderStatus)
      ) {
        if (totalCustomerPaid >= orderTotal) {
          newOrderStatus = 'CONFIRMED';
        } else if (totalCustomerPaid >= requiredDeposit) {
          newOrderStatus = 'CUSTOMER_DEPOSIT_PAID';
        } else if (totalCustomerPaid > 0) {
          newOrderStatus = 'CUSTOMER_DEPOSIT_PARTIAL';
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          customerPaid: this.toDecimal(totalCustomerPaid),
          customerRemaining: this.toDecimal(customerRemaining),
          orderStatus: newOrderStatus,
          updatedAt: new Date(),
        },
      });

      // Audit Log for Payment Creation
      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'CUSTOMER_PAYMENT_ADDED',
          entity: 'customer_payments',
          entityId: String(newPayment.id),
          newData: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount,
            paymentMethod,
            paymentStatus,
            paymentReference,
            newPaid: totalCustomerPaid,
            newRemaining: customerRemaining,
            requiredDeposit,
            newOrderStatus,
          },
          ip,
        },
      });

      return {
        payment: newPayment,
        totalCustomerPaid,
        customerRemaining,
        requiredDeposit,
        orderStatus: newOrderStatus,
      };
    });
  }

  /**
   * Updates an existing customer payment
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
    return await prisma.$transaction(async (tx) => {
      const oldPayment = await tx.customerPayment.findUnique({
        where: { id: paymentId },
      });
      if (!oldPayment) throw new Error('سجل الدفعة غير موجود');
      const orderId = oldPayment.orderId;

      const order = await tx.order.findUnique({
        where: { id: orderId },
      });
      if (!order) throw new Error('الطلب المرتبط بالدفعة غير موجود');

      const updateData: any = {};
      if (data.amount !== undefined) {
        if (data.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
        updateData.amount = this.toDecimal(data.amount);
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

      await tx.customerPayment.update({
        where: { id: paymentId },
        data: updateData,
      });

      // Recalculate customer_paid strictly from VERIFIED payments
      const verifiedAgg = await tx.customerPayment.aggregate({
        where: {
          orderId,
          paymentStatus: 'VERIFIED',
        },
        _sum: {
          amount: true,
        },
      });

      const totalCustomerPaid = Number(verifiedAgg._sum.amount || 0);
      const orderTotal = Number(order.totalAmount);
      const customerRemaining = Math.max(0, orderTotal - totalCustomerPaid);

      await tx.order.update({
        where: { id: orderId },
        data: {
          customerPaid: this.toDecimal(totalCustomerPaid),
          customerRemaining: this.toDecimal(customerRemaining),
          updatedAt: new Date(),
        },
      });

      // Audit Log for Payment Update
      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'CUSTOMER_PAYMENT_UPDATED',
          entity: 'customer_payments',
          entityId: String(paymentId),
          oldData: {
            amount: Number(oldPayment.amount),
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
        },
      });

      return { totalCustomerPaid, customerRemaining };
    });
  }

  /**
   * Records a manual payment from Celebre to the Factory (Supplier)
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

    return await prisma.$transaction(async (tx) => {
      const supOrder = await tx.supplierOrder.findUnique({
        where: { id: supplierOrderId },
      });
      if (!supOrder) throw new Error('أمر التوريد غير موجود');

      // Idempotency: Prevent duplicate payment submitted within 10 seconds with same amount and ref
      const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
      const recentDup = await tx.supplierPayment.findFirst({
        where: {
          supplierOrderId,
          amount: this.toDecimal(amount),
          reference: reference ? reference.trim() : undefined,
          createdAt: { gt: tenSecondsAgo },
        },
      });
      if (recentDup) {
        throw new Error('تم تسجيل هذا التحويل المالي للمصنع مسبقاً قبل قليل. تم منع التكرار.');
      }

      const newPayment = await tx.supplierPayment.create({
        data: {
          supplierOrderId,
          supplierId: supOrder.supplierId,
          orderId: supOrder.orderId,
          amount: this.toDecimal(amount),
          paymentMethod,
          reference: reference ? reference.trim() : null,
          notes: notes ? notes.trim() : null,
          paidBy: adminUsername,
        },
      });

      // Recalculate supplier_paid
      const agg = await tx.supplierPayment.aggregate({
        where: { supplierOrderId },
        _sum: { amount: true },
      });

      const totalSupplierPaid = Number(agg._sum.amount || 0);
      const supTotal = Number(supOrder.supplierTotal);
      const supplierRemaining = Math.max(0, supTotal - totalSupplierPaid);

      // Advance supplier order status if it was awaiting deposit
      let newSupStatus = supOrder.status;
      if (['AWAITING_DEPOSIT', 'DEPOSIT_PARTIAL', 'DRAFT'].includes(supOrder.status)) {
        if (totalSupplierPaid >= supTotal) {
          newSupStatus = 'IN_PREPARATION';
        } else if (totalSupplierPaid > 0) {
          newSupStatus = 'DEPOSIT_PARTIAL';
        }
      }

      await tx.supplierOrder.update({
        where: { id: supplierOrderId },
        data: {
          supplierPaid: this.toDecimal(totalSupplierPaid),
          supplierRemaining: this.toDecimal(supplierRemaining),
          status: newSupStatus,
          updatedAt: new Date(),
        },
      });

      // Also update orders table supplier columns
      await tx.order.update({
        where: { id: supOrder.orderId },
        data: {
          supplierPaid: this.toDecimal(totalSupplierPaid),
          supplierRemaining: this.toDecimal(supplierRemaining),
          updatedAt: new Date(),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
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
        },
      });

      return { payment: newPayment, totalSupplierPaid, supplierRemaining };
    });
  }

  /**
   * Updates an existing supplier payment
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
    return await prisma.$transaction(async (tx) => {
      const oldPayment = await tx.supplierPayment.findUnique({
        where: { id: paymentId },
      });
      if (!oldPayment) throw new Error('سجل دفعة المصنع غير موجود');
      const supplierOrderId = oldPayment.supplierOrderId;

      const supOrder = await tx.supplierOrder.findUnique({
        where: { id: supplierOrderId },
      });
      if (!supOrder) throw new Error('أمر التوريد المرتبط بالدفعة غير موجود');

      const updateData: any = {};
      if (data.amount !== undefined) {
        if (data.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
        updateData.amount = this.toDecimal(data.amount);
      }
      if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await tx.supplierPayment.update({
        where: { id: paymentId },
        data: updateData,
      });

      // Recalculate supplier_paid
      const agg = await tx.supplierPayment.aggregate({
        where: { supplierOrderId },
        _sum: { amount: true },
      });

      const totalSupplierPaid = Number(agg._sum.amount || 0);
      const supTotal = Number(supOrder.supplierTotal);
      const supplierRemaining = Math.max(0, supTotal - totalSupplierPaid);

      await tx.supplierOrder.update({
        where: { id: supplierOrderId },
        data: {
          supplierPaid: this.toDecimal(totalSupplierPaid),
          supplierRemaining: this.toDecimal(supplierRemaining),
          updatedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: supOrder.orderId },
        data: {
          supplierPaid: this.toDecimal(totalSupplierPaid),
          supplierRemaining: this.toDecimal(supplierRemaining),
          updatedAt: new Date(),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'SUPPLIER_PAYMENT_UPDATED',
          entity: 'supplier_payments',
          entityId: String(paymentId),
          oldData: {
            amount: Number(oldPayment.amount),
            paymentMethod: oldPayment.paymentMethod,
            reference: oldPayment.reference,
          },
          newData: {
            ...updateData,
            totalSupplierPaid,
            supplierRemaining,
          },
          ip,
        },
      });

      return { totalSupplierPaid, supplierRemaining };
    });
  }

  /**
   * Updates order status with full audit logging
   */
  public static async updateOrderStatus(
    orderId: number | string,
    newStatus: string,
    cancelReason: string | undefined,
    adminUsername: string,
    ip?: string
  ) {
    const validStatuses = [
      'PENDING_REVIEW',
      'PENDING_BOOKING',
      'REJECTED',
      'AWAITING_CUSTOMER_DEPOSIT',
      'CUSTOMER_DEPOSIT_PARTIAL',
      'CUSTOMER_DEPOSIT_PAID',
      'FACTORY_PENDING',
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

    return await prisma.$transaction(async (tx) => {
      const order = await this.getOrderByIdOrNumber(orderId, tx);
      if (!order) throw new Error('الطلب غير موجود');

      const updateData: any = {
        orderStatus: newStatus,
        updatedAt: new Date(),
      };

      if (newStatus === 'REJECTED') {
        updateData.cancelReason = cancelReason || 'تم رفض الحجز من قبل الإدارة';
        updateData.cancelledAt = new Date();
      } else if (newStatus === 'CANCELLED') {
        updateData.cancelReason = cancelReason || 'تم الإلغاء بالتنسيق مع العميل';
        updateData.cancelledAt = new Date();
      } else if (newStatus === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      // Synchronize existing supplierOrder if order is cancelled or completed
      const existingSup = await tx.supplierOrder.findFirst({
        where: { orderId: order.id },
      });
      if (existingSup) {
        if (newStatus === 'CANCELLED' && existingSup.status !== 'CANCELLED') {
          await tx.supplierOrder.update({
            where: { id: existingSup.id },
            data: { status: 'CANCELLED', updatedAt: new Date() },
          });
        } else if (newStatus === 'COMPLETED' && existingSup.status !== 'COMPLETED') {
          await tx.supplierOrder.update({
            where: { id: existingSup.id },
            data: { status: 'COMPLETED', updatedAt: new Date() },
          });
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'ORDER_STATUS_CHANGED',
          entity: 'orders',
          entityId: String(order.id),
          oldData: { status: order.orderStatus },
          newData: { status: newStatus, cancelReason },
          ip,
        },
      });

      return { success: true, status: newStatus };
    });
  }

  /**
   * Approves customer booking and transitions to AWAITING_CUSTOMER_DEPOSIT
   */
  public static async acceptPreliminaryBooking(
    orderId: number | string,
    adminUsername: string,
    ip?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const order = await this.getOrderByIdOrNumber(orderId, tx);
      if (!order) throw new Error('الطلب غير موجود');

      if (order.orderStatus === 'REJECTED') {
        throw new Error('لا يمكن قبول حجز تم رفضه مسبقاً');
      }
      if (order.orderStatus === 'CANCELLED') {
        throw new Error('لا يمكن قبول حجز ملغي');
      }
      if (
        order.orderStatus !== 'PENDING_BOOKING' &&
        order.orderStatus !== 'PENDING_REVIEW'
      ) {
        throw new Error(`الحجز بالفعل في حالة متقدمة: ${order.orderStatus}`);
      }

      if (!order.pickupDate || order.pickupDate.trim() === '') {
        throw new Error('لا يمكن قبول الحجز دون تحديد موعد مناسبة صالح');
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'AWAITING_CUSTOMER_DEPOSIT',
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'BOOKING_ACCEPTED',
          entity: 'orders',
          entityId: String(order.id),
          oldData: { status: order.orderStatus },
          newData: { status: 'AWAITING_CUSTOMER_DEPOSIT', approvedBy: adminUsername },
          ip,
        },
      });

      return updated;
    });
  }

  /**
   * Rejects customer booking with mandatory rejection reason
   */
  public static async rejectPreliminaryBooking(
    orderId: number | string,
    reason: string,
    adminUsername: string,
    ip?: string
  ) {
    if (!reason || reason.trim().length < 3) {
      throw new Error('يجب إدخال سبب واضح لرفض الحجز');
    }

    return await prisma.$transaction(async (tx) => {
      const order = await this.getOrderByIdOrNumber(orderId, tx);
      if (!order) throw new Error('الطلب غير موجود');

      if (order.orderStatus === 'REJECTED') {
        throw new Error('الحجز مرفوض بالفعل');
      }
      if (order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED') {
        throw new Error('لا يمكن رفض طلب مكتمل أو تم تسليمه');
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'REJECTED',
          cancelReason: reason.trim(),
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'BOOKING_REJECTED',
          entity: 'orders',
          entityId: String(order.id),
          oldData: { status: order.orderStatus },
          newData: { status: 'REJECTED', reason: reason.trim(), rejectedBy: adminUsername },
          ip,
        },
      });

      return updated;
    });
  }

  /**
   * Creates an independent Supplier (Factory) Order for an approved booking
   */
  public static async createSupplierOrder(
    orderId: number | string,
    adminUsername: string,
    ip?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const order = await this.getOrderByIdOrNumber(orderId, tx);
      if (!order) throw new Error('الطلب غير موجود');

      if (order.orderStatus === 'REJECTED') {
        throw new Error('لا يمكن إنشاء طلب مصنع لحجز مرفوض');
      }
      if (order.orderStatus === 'CANCELLED') {
        throw new Error('لا يمكن إنشاء طلب مصنع لحجز ملغي');
      }
      if (order.orderStatus === 'PENDING_BOOKING' || order.orderStatus === 'PENDING_REVIEW') {
        throw new Error('يجب موافقة الإدارة على حجز العميل أولاً قبل إنشاء طلب المصنع');
      }

      const existingSup = await tx.supplierOrder.findFirst({
        where: { orderId: order.id },
      });
      if (existingSup) {
        throw new Error(`طلب المصنع موجود بالفعل لهذا الحجز برقم: ${existingSup.supplierOrderNumber}`);
      }

      let primarySupplier = await tx.supplier.findFirst();
      if (!primarySupplier) {
        primarySupplier = await tx.supplier.create({
          data: {
            name: 'Celebre Factory',
            companyName: 'مصنع التجهيزات الفندقية المركزي',
            phone: '01284484868',
          },
        });
      }

      const supplierOrderNumber = `SUP-${order.orderNumber.replace('CB-', '')}`;
      const supplierTotal = order.supplierTotal;
      const supplierPaid = new Prisma.Decimal('0.00'); // strictly 0 on creation
      const supplierRemaining = supplierTotal;

      const newSupOrder = await tx.supplierOrder.create({
        data: {
          orderId: order.id,
          supplierId: primarySupplier.id,
          supplierOrderNumber,
          supplierTotal,
          supplierPaid,
          supplierRemaining,
          status: 'DRAFT',
        },
      });

      if (order.orderStatus === 'AWAITING_CUSTOMER_DEPOSIT' || order.orderStatus === 'CUSTOMER_DEPOSIT_PAID') {
        await tx.order.update({
          where: { id: order.id },
          data: { orderStatus: 'FACTORY_PENDING', updatedAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'SUPPLIER_ORDER_CREATED',
          entity: 'supplier_orders',
          entityId: String(newSupOrder.id),
          newData: {
            supplierOrderId: newSupOrder.id,
            supplierOrderNumber,
            orderId: order.id,
            supplierTotal: Number(supplierTotal),
            status: 'DRAFT',
          },
          ip,
        },
      });

      return newSupOrder;
    });
  }

  /**
   * Updates status of independent factory order with logging
   */
  public static async updateSupplierOrderStatus(
    supplierOrderId: number,
    newStatus: string,
    reason: string | undefined,
    adminUsername: string,
    ip?: string
  ) {
    const validSupStatuses = [
      'DRAFT',
      'SENT_TO_FACTORY',
      'SENT',
      'ACCEPTED_BY_FACTORY',
      'CONFIRMED',
      'REJECTED_BY_FACTORY',
      'AWAITING_DEPOSIT',
      'DEPOSIT_PARTIAL',
      'DEPOSIT_PAID',
      'IN_PREPARATION',
      'IN_PRODUCTION',
      'READY',
      'COMPLETED',
      'CANCELLED',
      'PENDING_CONFIRMATION',
    ];

    if (!validSupStatuses.includes(newStatus)) {
      throw new Error('حالة طلب المصنع غير صالحة');
    }

    if (newStatus === 'REJECTED_BY_FACTORY' && (!reason || reason.trim().length < 3)) {
      throw new Error('يجب إدخال سبب رفض المصنع للطلب');
    }

    return await prisma.$transaction(async (tx) => {
      const supOrder = await tx.supplierOrder.findUnique({
        where: { id: supplierOrderId },
      });
      if (!supOrder) throw new Error('أمر التوريد غير موجود');

      const updated = await tx.supplierOrder.update({
        where: { id: supplierOrderId },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      if (newStatus === 'ACCEPTED_BY_FACTORY') {
        const parentOrder = await tx.order.findUnique({ where: { id: supOrder.orderId } });
        if (
          parentOrder &&
          (parentOrder.orderStatus === 'FACTORY_PENDING' ||
            parentOrder.orderStatus === 'CUSTOMER_DEPOSIT_PAID')
        ) {
          await tx.order.update({
            where: { id: supOrder.orderId },
            data: { orderStatus: 'CONFIRMED', updatedAt: new Date() },
          });
        }
      } else if (newStatus === 'IN_PREPARATION' || newStatus === 'IN_PRODUCTION') {
        await tx.order.update({
          where: { id: supOrder.orderId },
          data: { orderStatus: 'IN_PRODUCTION', updatedAt: new Date() },
        });
      } else if (newStatus === 'READY') {
        await tx.order.update({
          where: { id: supOrder.orderId },
          data: { orderStatus: 'READY', updatedAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'SUPPLIER_ORDER_STATUS_CHANGED',
          entity: 'supplier_orders',
          entityId: String(supplierOrderId),
          oldData: { status: supOrder.status },
          newData: { status: newStatus, reason },
          ip,
        },
      });

      return updated;
    });
  }

  /**
   * Edit order operational details (quantity, date, time, location)
   */
  public static async updateOrderDetails(
    orderId: number | string,
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
    return await prisma.$transaction(async (tx) => {
      const order = await this.getOrderByIdOrNumber(orderId, tx);
      if (!order) throw new Error('الطلب غير موجود');

      const oldData = { ...order };
      const updateData: any = { updatedAt: new Date() };

      if (details.customerName || details.phone || details.whatsapp) {
        const custUpdates: any = { updatedAt: new Date() };
        if (details.customerName) custUpdates.fullName = details.customerName.trim();
        if (details.phone) custUpdates.phone = details.phone.trim();
        if (details.whatsapp) custUpdates.whatsapp = details.whatsapp.trim();
        await tx.customer.update({
          where: { id: order.customerId },
          data: custUpdates,
        });
      }

      if (details.pickupDate) updateData.pickupDate = details.pickupDate;
      if (details.pickupTime) updateData.pickupTime = details.pickupTime;
      if (details.pickupLocation) updateData.pickupLocation = details.pickupLocation;
      if (details.customerNotes !== undefined) updateData.customerNotes = details.customerNotes;

      // If quantity changed, recalculate items & totals based on price snapshots
      if (details.quantity && details.quantity !== 0) {
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });

        if (items.length > 0) {
          const item = items[0];
          const newQty = details.quantity;
          const distUnitPrice = Number(item.distributorUnitPrice);
          const suppUnitPrice = Number(item.supplierUnitPrice);
          const customerAdj = Number(item.customerAdjustment);

          const newCustomerTotal = (distUnitPrice + customerAdj) * newQty;
          const newSupplierTotal = suppUnitPrice * newQty;
          const newProfit = newCustomerTotal - newSupplierTotal;

          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              quantity: newQty,
              distributorTotal: this.toDecimal(distUnitPrice * newQty),
              supplierTotal: this.toDecimal(suppUnitPrice * newQty),
              customerTotal: this.toDecimal(newCustomerTotal),
              supplierTotalFinal: this.toDecimal(newSupplierTotal),
              profit: this.toDecimal(newProfit),
            },
          });

          const customerPaid = Number(order.customerPaid);
          const supplierPaid = Number(order.supplierPaid);

          updateData.subtotal = this.toDecimal(distUnitPrice * newQty);
          updateData.adjustments = this.toDecimal(customerAdj * newQty);
          updateData.totalAmount = this.toDecimal(newCustomerTotal);
          updateData.customerRemaining = this.toDecimal(Math.max(0, newCustomerTotal - customerPaid));
          updateData.supplierTotal = this.toDecimal(newSupplierTotal);
          updateData.supplierRemaining = this.toDecimal(Math.max(0, newSupplierTotal - supplierPaid));
          updateData.distributorProfit = this.toDecimal(newProfit);

          // Update supplier order
          const supOrder = await tx.supplierOrder.findFirst({
            where: { orderId: order.id },
          });

          if (supOrder) {
            await tx.supplierOrder.update({
              where: { id: supOrder.id },
              data: {
                supplierTotal: this.toDecimal(newSupplierTotal),
                supplierRemaining: this.toDecimal(Math.max(0, newSupplierTotal - supplierPaid)),
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userName: adminUsername,
          action: 'ORDER_DETAILS_UPDATED',
          entity: 'orders',
          entityId: String(order.id),
          oldData,
          newData: details,
          ip,
        },
      });

      return { success: true };
    });
  }
}
