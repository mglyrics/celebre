import { PrismaClient, Prisma, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  menuCode: string;
  quantity: number;
  pickupDate: Date;
  pickupTime: string;
  pickupLocation: string;
  customerNotes?: string;
  drinkOption?: "included" | "exclude_juice" | "replace_pepsi";
  customDrinkAdjustment?: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generates a formatted chronological order number: CB-YYYYMMDD-XXXX
 */
export async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `CB-${yyyy}${mm}${dd}-`;

  const latest = await tx.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  let seq = 1;
  if (latest && latest.orderNumber) {
    const parts = latest.orderNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/**
 * Creates a Preliminary Booking & Order inside an ACID Database Transaction.
 * 
 * Rules:
 * 1. Customer record created or updated by phone.
 * 2. Exact Snapshot of distributor_unit_price and supplier_unit_price saved in OrderItem.
 * 3. Future menu price updates NEVER alter historical order snapshots.
 * 4. Distinct, independent customer account vs supplier account balances.
 * 5. Preliminary booking with ZERO online payment (customerPaid = 0, customerRemaining = total).
 * 6. Audit log recorded inside the transaction.
 */
export async function createOrderTransaction(input: CreateOrderInput) {
  if (!input.phone || !input.customerName || !input.menuCode || !input.quantity) {
    throw new Error("جميع بيانات الحجز الأساسية مطلوبة (الاسم، الهاتف، الوجبة، الكمية)");
  }

  if (input.quantity < 50) {
    throw new Error("الحد الأدنى للطلب هو 50 علبة كاترنج لضمان التجهيز والجودة الفندقية");
  }

  const cleanPhone = input.phone.trim();

  return await prisma.$transaction(async (tx) => {
    // 1. Find or create customer
    const customer = await tx.customer.upsert({
      where: { phone: cleanPhone },
      update: {
        fullName: input.customerName.trim(),
        whatsapp: input.whatsapp ? input.whatsapp.trim() : undefined,
        email: input.email ? input.email.trim() : undefined,
      },
      create: {
        fullName: input.customerName.trim(),
        phone: cleanPhone,
        whatsapp: input.whatsapp ? input.whatsapp.trim() : cleanPhone,
        email: input.email ? input.email.trim() : undefined,
      },
    });

    // 2. Fetch current menu item
    const menuItem = await tx.menuItem.findUnique({
      where: { code: input.menuCode },
    });

    if (!menuItem) {
      throw new Error(`الوجبة المختارة (${input.menuCode}) غير متوفرة بقائمة العروض`);
    }

    // 3. Price Snapshots (Frozen in time for this specific order)
    const distributorUnitPrice = new Prisma.Decimal(menuItem.distributorPrice);
    const supplierUnitPrice = new Prisma.Decimal(menuItem.supplierPrice);

    // Dynamic drink adjustments:
    // Exclusion: -5 EGP on customer price
    // Pepsi replacement: +10 EGP on customer price
    let customerAdjustment = new Prisma.Decimal(0);
    let optionType = "DEFAULT_JUICE";
    let optionName = "عصير بخيرة مشمول مع الوجبة";

    if (input.drinkOption === "exclude_juice") {
      customerAdjustment = new Prisma.Decimal(-5);
      optionType = "DRINK_EXCLUDE_JUICE";
      optionName = "استبعاد العصير (خصم 5 ج.م للوجبة)";
    } else if (input.drinkOption === "replace_pepsi") {
      customerAdjustment = new Prisma.Decimal(10);
      optionType = "DRINK_REPLACE_PEPSI";
      optionName = "استبدال العصير بكانز بيبسي (+10 ج.م للوجبة)";
    }

    const supplierAdjustment = new Prisma.Decimal(0);

    const qty = new Prisma.Decimal(input.quantity);
    const effectiveCustomerUnitPrice = distributorUnitPrice.add(customerAdjustment);
    const customerTotal = effectiveCustomerUnitPrice.mul(qty);
    const supplierTotal = supplierUnitPrice.add(supplierAdjustment).mul(qty);
    const grossProfit = customerTotal.sub(supplierTotal);

    const orderNumber = await generateOrderNumber(tx);

    // 4. Create Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        orderStatus: OrderStatus.PENDING_BOOKING,
        pickupDate: input.pickupDate,
        pickupTime: input.pickupTime,
        pickupLocation: input.pickupLocation,
        customerNotes: input.customerNotes,

        // Financials - Customer
        subtotal: distributorUnitPrice.mul(qty),
        adjustments: customerAdjustment.mul(qty),
        totalAmount: customerTotal,
        customerPaid: new Prisma.Decimal(0), // NO payment collected on website
        customerRemaining: customerTotal,

        // Financials - Supplier
        supplierTotal: supplierTotal,
        supplierPaid: new Prisma.Decimal(0),
        supplierRemaining: supplierTotal,

        // Margin
        distributorProfit: grossProfit,
      },
    });

    // 5. Create Order Item with Snapshot
    const orderItem = await tx.orderItem.create({
      data: {
        orderId: order.id,
        menuItemId: menuItem.id,
        menuCode: menuItem.code,
        menuName: menuItem.name,
        quantity: input.quantity,

        // Frozen snapshots
        distributorUnitPrice,
        supplierUnitPrice,
        distributorTotal: distributorUnitPrice.mul(qty),
        supplierTotal: supplierUnitPrice.mul(qty),

        customerAdjustment,
        supplierAdjustment,

        customerTotal,
        supplierTotalFinal: supplierTotal,
        profit: grossProfit,
      },
    });

    // 6. Create Order Item Option
    await tx.orderItemOption.create({
      data: {
        orderItemId: orderItem.id,
        optionType,
        optionName,
        distributorAdjustment: customerAdjustment,
        supplierAdjustment,
      },
    });

    // 7. Create Supplier Order linked to primary supplier
    const primarySupplier = await tx.supplier.findFirst({
      where: { name: "Celebre Factory" },
    });

    if (primarySupplier) {
      await tx.supplierOrder.create({
        data: {
          orderId: order.id,
          supplierId: primarySupplier.id,
          supplierOrderNumber: `SUP-${orderNumber.replace("CB-", "")}`,
          supplierTotal,
          supplierPaid: new Prisma.Decimal(0),
          supplierRemaining: supplierTotal,
          status: "PENDING",
        },
      });
    }

    // 8. Create Audit Log
    await tx.auditLog.create({
      data: {
        action: "ORDER_CREATED",
        entity: "orders",
        entityId: order.id,
        newData: {
          orderNumber,
          customerName: customer.fullName,
          phone: customer.phone,
          menuCode: menuItem.code,
          quantity: input.quantity,
          customerTotal: customerTotal.toNumber(),
          orderStatus: "PENDING_BOOKING",
        },
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    return {
      order,
      orderItem,
      customer,
      menuItem,
      customerTotal,
      supplierTotal,
      grossProfit,
    };
  });
}
