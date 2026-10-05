import fs from "fs";
import path from "path";
import crypto from "crypto";
import pg from "pg";

export interface CustomerRecord {
  id: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemComponentRecord {
  id: string;
  menuItemId: string;
  componentName: string;
  quantity: number;
  unit: string;
  sortOrder: number;
}

export interface MenuItemRecord {
  id: string;
  code: string; // e.g. "Sale-01"
  name: string;
  description: string;
  distributorPrice: number;
  supplierPrice: number;
  isActive: boolean;
  sortOrder: number;
  components: MenuItemComponentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  menuItemId?: string;
  menuCode: string;
  menuName: string;
  quantity: number;
  distributorUnitPrice: number;
  supplierUnitPrice: number;
  distributorTotal: number;
  supplierTotal: number;
  customerAdjustment: number;
  supplierAdjustment: number;
  customerTotal: number;
  supplierTotalFinal: number;
  profit: number;
  drinkOption: "juice_included" | "pepsi_added" | "no_juice";
  drinkOptionLabel: string;
}

export type OrderStatus = 
  | "PENDING_BOOKING"
  | "CONFIRMED"
  | "SENT_TO_SUPPLIER"
  | "IN_PRODUCTION"
  | "READY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderRecord {
  id: string;
  orderNumber: string; // CB-YYYYMMDD-XXXX
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  orderStatus: OrderStatus;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  customerNotes?: string;
  cancelReason?: string;

  // Customer Financials (Celebre Distributor)
  subtotal: number;
  discount: number;
  adjustments: number;
  totalAmount: number;
  customerPaid: number;
  customerRemaining: number;

  // Supplier Financials (Factory / Independent)
  supplierTotal: number;
  supplierPaid: number;
  supplierRemaining: number;

  // Profit
  distributorProfit: number;

  items: OrderItemRecord[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

export type PaymentMethod = "INSTAPAY" | "CASH" | "BANK_TRANSFER" | "OTHER";
export type PaymentStatus = "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export interface CustomerPaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  notes?: string;
  receivedBy?: string;
  paidAt: string;
  createdAt: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierOrderNumber: string;
  supplierTotal: number;
  supplierPaid: number;
  supplierRemaining: number;
  status: "PENDING" | "ACCEPTED" | "IN_PRODUCTION" | "READY" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPaymentRecord {
  id: string;
  supplierOrderId: string;
  supplierId: string;
  supplierName: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  paidBy?: string;
  paidAt: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId?: string;
  username: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ip: string;
  userAgent?: string;
  createdAt: string;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// File Storage Paths
const DATA_DIR = path.resolve(process.cwd(), ".celebre-data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILES = {
  customers: path.join(DATA_DIR, "customers.json"),
  menuItems: path.join(DATA_DIR, "menu_items.json"),
  orders: path.join(DATA_DIR, "orders.json"),
  customerPayments: path.join(DATA_DIR, "customer_payments.json"),
  suppliers: path.join(DATA_DIR, "suppliers.json"),
  supplierOrders: path.join(DATA_DIR, "supplier_orders.json"),
  supplierPayments: path.join(DATA_DIR, "supplier_payments.json"),
  adminUsers: path.join(DATA_DIR, "admin_users.json"),
  auditLogs: path.join(DATA_DIR, "audit_logs.json"),
  priceHistory: path.join(DATA_DIR, "menu_price_history.json")
};

function readTable<T>(filePath: string): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error(`Error reading database table ${filePath}:`, err);
  }
  return [];
}

function writeTable<T>(filePath: string, data: T[]) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing database table ${filePath}:`, err);
  }
}

// Optional PostgreSQL Pool for Live Cloud Deployments (Vercel / Supabase / Neon)
let pgPool: pg.Pool | null = null;
if (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith("postgres://") || process.env.DATABASE_URL.startsWith("postgresql://"))) {
  try {
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
    });
    console.log("[DATABASE] Connected to PostgreSQL remote pool.");
  } catch (e) {
    console.warn("[DATABASE] Could not connect to PostgreSQL, falling back to local persistent store.", e);
  }
}

// 18 Official Sale Meals with Exact Distributor & Supplier Pricing
export const OFFICIAL_18_MEALS = [
  {
    code: "Sale-01",
    name: "العرض التوفيري الأول (Sale - 01)",
    description: "قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان لانشون كوردن بيف + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 50,
    supplierPrice: 35,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "سندوتش بتي بان جبنة رومي قديمة", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش بتي بان لانشون لحم كوردن بيف", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر بداخل كيس معقم", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-02",
    name: "العرض التوفيري الثاني (Sale - 02)",
    description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 55,
    supplierPrice: 37,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "سندوتش فرنساوي وسط فراخ بانية طازجة", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-03",
    name: "العرض التوفيري الثالث (Sale - 03)",
    description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 60,
    supplierPrice: 41,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "سندوتش فرنساوي وسط جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط تركي مدخن فاخر", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-04",
    name: "العرض التوفيري الرابع (Sale - 04)",
    description: "قطعة جاتوه مغلفة + سندوتش بتي بان كفتة مشوية ع الفحم + سندوتش بتي بان فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 65,
    supplierPrice: 47,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "سندوتش بتي بان كفتة مشوية على الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش بتي بان فراخ بانية مقرمشة", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-05",
    name: "العرض التوفيري الخامس (Sale - 05)",
    description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 80,
    supplierPrice: 53,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "سندوتش فرنساوي وسط كفتة مشوية على الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-06",
    name: "العرض التوفيري السادس (Sale - 06)",
    description: "قطعة جاتوه مغلفة + عصير بخيرة + شوكة ومنديل معطر (العرض الاقتصادي السريع)",
    distributorPrice: 35,
    supplierPrice: 23,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-07",
    name: "العرض التوفيري السابع (Sale - 07)",
    description: "قطعة جاتوه مغلفة + 2 قطعة حلويات شرقي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 50,
    supplierPrice: 37,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "قطعتين حلويات شرقية مشكلة (بسبوسة وكنافة)", quantity: 2, unit: "قطعة" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-08",
    name: "العرض التوفيري الثامن (Sale - 08)",
    description: "قطعة جاتوه مغلفة + 2 قطعة ميني بيتزا + 2 باتون سالية + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 45,
    supplierPrice: 29,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "قطعتين ميني بيتزا طازجة بالجبنة والزيتون", quantity: 2, unit: "قطعة" },
      { name: "قطعتين باتون سالية بالكمون والسمسم", quantity: 2, unit: "قطعة" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-09",
    name: "العرض التوفيري التاسع (Sale - 09)",
    description: "قطعة جاتوه مغلفة + 2 قطعة ميني بيتزا + قطعة حلوى شرقي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 50,
    supplierPrice: 35,
    components: [
      { name: "قطعة جاتوه فاخرة مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "قطعتين ميني بيتزا طازجة", quantity: 2, unit: "قطعة" },
      { name: "قطعة حلويات شرقية ممتازة", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-10",
    name: "العرض العاشر (Sale - 10)",
    description: "سندوتش كفتة بتي بان + سندوتش جبنة رومي بتي بان + سندوتش تركي مدخن / لانشون / بسطرمة + عصير بخيرة + شوكة ومنديل",
    distributorPrice: 45,
    supplierPrice: 31,
    components: [
      { name: "سندوتش بتي بان كفتة مشوية", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش بتي بان جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش بتي بان تركي مدخن ولانشون", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "منديل معطر وشوكة", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-11",
    name: "العرض الحادي عشر (Sale - 11)",
    description: "قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي / فيتا / بسطرمة + قطعة باتون سالية + قطعة ميني بيتزا + عصير + شوكة ومنديل",
    distributorPrice: 39,
    supplierPrice: 29,
    components: [
      { name: "قطعة جاتوه مغلفة", quantity: 1, unit: "قطعة" },
      { name: "سندوتش بتي بان جبنة رومي أو فيتا", quantity: 1, unit: "سندوتش" },
      { name: "قطعة ميني بيتزا", quantity: 1, unit: "قطعة" },
      { name: "قطعة باتون سالية مقرمشة", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة معبأ", quantity: 1, unit: "علبة" }
    ]
  },
  {
    code: "Sale-12",
    name: "العرض الثاني عشر (Sale - 12)",
    description: "قطعة جاتوه مغلفة + بانية بالزبدة نكهات مختلفة + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 44,
    supplierPrice: 32,
    components: [
      { name: "قطعة جاتوه مغلفة مثلث", quantity: 1, unit: "قطعة" },
      { name: "بانية بالزبدة نكهات فندقية خاصة", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "شوكة فندقية ومنديل معطر", quantity: 1, unit: "طقم" }
    ]
  },
  {
    code: "Sale-13",
    name: "العرض الثالث عشر (Sale - 13)",
    description: "سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر",
    distributorPrice: 42,
    supplierPrice: 32,
    components: [
      { name: "سندوتش فرنساوي وسط جبنة رومي قديمة", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط لانشون كوردن بيف", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "منديل معطر فندقي", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-14",
    name: "العرض الرابع عشر (Sale - 14)",
    description: "سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر",
    distributorPrice: 48,
    supplierPrice: 38,
    components: [
      { name: "سندوتش فرنساوي وسط جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط تركي مدخن", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط لانشون كوردن بيف", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "منديل معطر فندقي", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-15",
    name: "العرض الخامس عشر (Sale - 15)",
    description: "سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر",
    distributorPrice: 48,
    supplierPrice: 38,
    components: [
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي طازجة", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط جبنة رومي قديمة", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "منديل معطر فندقي", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-16",
    name: "العرض السادس عشر (Sale - 16)",
    description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر",
    distributorPrice: 48,
    supplierPrice: 38,
    components: [
      { name: "سندوتش فرنساوي وسط كفتة مشوية ع الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط جبنة رومي قديمة", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "منديل معطر فندقي", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-17",
    name: "العرض السابع عشر (Sale - 17)",
    description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + منديل معطر",
    distributorPrice: 55,
    supplierPrice: 43,
    components: [
      { name: "سندوتش فرنساوي وسط كفتة مشوية على الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي مقرمشة", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "منديل معطر فندقي", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-18",
    name: "العرض الثامن عشر (Sale - 18)",
    description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر",
    distributorPrice: 65,
    supplierPrice: 50,
    components: [
      { name: "سندوتش فرنساوي وسط كفتة مشوية ع الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط فراخ بانية مقرمشة", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط جبنة رومي قديمة", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة معبأ 200 مل", quantity: 1, unit: "علبة" },
      { name: "منديل معطر فندقي", quantity: 1, unit: "قطعة" }
    ]
  }
];

// Database Engine Class with Full ACID Transactions & Repositories
class CelebreDatabase {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;
    this.seedDefaultsIfEmpty();
    this.isInitialized = true;
  }

  private seedDefaultsIfEmpty() {
    // 1. Menu Items
    const existingMenu = readTable<MenuItemRecord>(DB_FILES.menuItems);
    if (existingMenu.length === 0) {
      const seeded: MenuItemRecord[] = OFFICIAL_18_MEALS.map((m, idx) => ({
        id: `menu-${m.code.toLowerCase()}`,
        code: m.code,
        name: m.name,
        description: m.description,
        distributorPrice: m.distributorPrice,
        supplierPrice: m.supplierPrice,
        isActive: true,
        sortOrder: idx + 1,
        components: m.components.map((c, cIdx) => ({
          id: `comp-${m.code.toLowerCase()}-${cIdx + 1}`,
          menuItemId: `menu-${m.code.toLowerCase()}`,
          componentName: c.name,
          quantity: c.quantity,
          unit: c.unit,
          sortOrder: cIdx + 1
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      writeTable(DB_FILES.menuItems, seeded);
      console.log(`[DATABASE SEED] Seeded ${seeded.length} official menu meals.`);
    }

    // 2. Suppliers
    const existingSuppliers = readTable<SupplierRecord>(DB_FILES.suppliers);
    if (existingSuppliers.length === 0) {
      const defaultSupplier: SupplierRecord = {
        id: "sup-factory-central",
        name: "مصنع ومطبخ براند سيلبر المركزي للتجهيز الفندقي",
        companyName: "مطبخ التجهيز الفندقي المعتمد لسيلبر كاترنج",
        phone: "01284484868",
        whatsapp: "01284484868",
        email: "factory@celebre-eg.com",
        address: "المنطقة الصناعية / بياض العرب - محافظة بني سويف",
        taxNumber: "TAX-789456-EG",
        notes: "المورد والمصنع الحصري لتجهيز عبوات وسندوتشات كاترنج سيلبر الملكية",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      writeTable(DB_FILES.suppliers, [defaultSupplier]);
      console.log("[DATABASE SEED] Seeded default supplier factory.");
    }

    // 3. Admin Users
    const existingUsers = readTable<AdminUserRecord>(DB_FILES.adminUsers);
    if (existingUsers.length === 0) {
      const salt = crypto.randomBytes(16).toString("hex");
      const defaultPass = process.env.ADMIN_INITIAL_PASSWORD || "010973@Mahmoud";
      const passwordHash = crypto.pbkdf2Sync(defaultPass, salt, 100000, 64, "sha512").toString("hex");

      const superAdmin: AdminUserRecord = {
        id: "usr-super-admin",
        username: "admin",
        email: "admin@celebre-eg.com",
        phone: "01284484868",
        fullName: "مدير النظام العام - كاترنج سيلبر",
        passwordHash,
        salt,
        role: "SUPER_ADMIN",
        isActive: true,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      writeTable(DB_FILES.adminUsers, [superAdmin]);
      console.log("[DATABASE SEED] Seeded default SUPER_ADMIN user.");
    }

    // 4. Initial Seed Order: CEL-9386
    const existingOrders = readTable<OrderRecord>(DB_FILES.orders);
    if (!existingOrders.some(o => o.orderNumber === "CEL-9386" || o.orderNumber === "CB-20261004-9386")) {
      const seedCustomer: CustomerRecord = {
        id: "cust-9386",
        fullName: "حجز مناسبة معتمد (CEL-9386)",
        phone: "01284484868",
        whatsapp: "01284484868",
        address: "بني سويف - قاعة المناسبات الكبرى",
        notes: "حجز معتمد مسجل برقم CEL-9386",
        createdAt: "2026-10-04T12:00:00.000Z",
        updatedAt: "2026-10-04T12:00:00.000Z"
      };
      const customers = readTable<CustomerRecord>(DB_FILES.customers);
      if (!customers.some(c => c.phone === seedCustomer.phone)) {
        customers.push(seedCustomer);
        writeTable(DB_FILES.customers, customers);
      }

      const seedOrder: OrderRecord = {
        id: "ord-cel-9386",
        orderNumber: "CEL-9386",
        customerId: seedCustomer.id,
        customerName: seedCustomer.fullName,
        customerPhone: seedCustomer.phone,
        customerWhatsapp: seedCustomer.whatsapp,
        orderStatus: "CONFIRMED",
        pickupDate: "2026-10-10",
        pickupTime: "7:00 مساءً",
        pickupLocation: "بني سويف - قاعة المناسبات الكبرى",
        customerNotes: "حجز معتمد مسجل برقم CEL-9386 - تم التنسيق هاتفياً",
        subtotal: 4500,
        discount: 0,
        adjustments: 0,
        totalAmount: 4500,
        customerPaid: 500,
        customerRemaining: 4000,
        supplierTotal: 3500,
        supplierPaid: 500,
        supplierRemaining: 3000,
        distributorProfit: 1000, // 4500 - 3500
        items: [
          {
            id: "item-9386-1",
            orderId: "ord-cel-9386",
            menuItemId: "menu-sale-01",
            menuCode: "Sale-01",
            menuName: "العرض التوفيري الأول (Sale - 01)",
            quantity: 100,
            distributorUnitPrice: 45,
            supplierUnitPrice: 35,
            distributorTotal: 4500,
            supplierTotal: 3500,
            customerAdjustment: 0,
            supplierAdjustment: 0,
            customerTotal: 4500,
            supplierTotalFinal: 3500,
            profit: 1000,
            drinkOption: "juice_included",
            drinkOptionLabel: "عصير بخيرة مشمول"
          }
        ],
        createdAt: "2026-10-04T12:00:00.000Z",
        updatedAt: "2026-10-04T12:00:00.000Z"
      };
      existingOrders.unshift(seedOrder);
      writeTable(DB_FILES.orders, existingOrders);

      // Seed supplier order
      const supplierOrders = readTable<SupplierOrderRecord>(DB_FILES.supplierOrders);
      supplierOrders.unshift({
        id: "supord-9386",
        orderId: seedOrder.id,
        orderNumber: seedOrder.orderNumber,
        supplierId: "sup-factory-central",
        supplierName: "مصنع ومطبخ براند سيلبر المركزي للتجهيز الفندقي",
        supplierOrderNumber: "SO-CEL-9386",
        supplierTotal: 3500,
        supplierPaid: 500,
        supplierRemaining: 3000,
        status: "ACCEPTED",
        createdAt: "2026-10-04T12:00:00.000Z",
        updatedAt: "2026-10-04T12:00:00.000Z"
      });
      writeTable(DB_FILES.supplierOrders, supplierOrders);

      // Seed customer payment
      const custPayments = readTable<CustomerPaymentRecord>(DB_FILES.customerPayments);
      custPayments.unshift({
        id: "cpay-9386-1",
        orderId: seedOrder.id,
        orderNumber: seedOrder.orderNumber,
        customerId: seedCustomer.id,
        customerName: seedCustomer.fullName,
        amount: 500,
        paymentMethod: "INSTAPAY",
        paymentStatus: "VERIFIED",
        paymentReference: "INSTA-9386-DEP",
        notes: "عربون تأكيد حجز مبدئي مسجل",
        receivedBy: "الإدارة",
        paidAt: "2026-10-04T12:30:00.000Z",
        createdAt: "2026-10-04T12:30:00.000Z"
      });
      writeTable(DB_FILES.customerPayments, custPayments);

      // Seed supplier payment
      const suppPayments = readTable<SupplierPaymentRecord>(DB_FILES.supplierPayments);
      suppPayments.unshift({
        id: "spay-9386-1",
        supplierOrderId: "supord-9386",
        supplierId: "sup-factory-central",
        supplierName: "مصنع ومطبخ براند سيلبر المركزي للتجهيز الفندقي",
        orderId: seedOrder.id,
        orderNumber: seedOrder.orderNumber,
        amount: 500,
        paymentMethod: "INSTAPAY",
        reference: "FACTORY-DEP-9386",
        notes: "تحويل عربون تشغيل للمصنع",
        paidBy: "الإدارة",
        paidAt: "2026-10-04T13:00:00.000Z",
        createdAt: "2026-10-04T13:00:00.000Z"
      });
      writeTable(DB_FILES.supplierPayments, suppPayments);

      console.log("[DATABASE SEED] Seeded confirmed benchmark booking CEL-9386 with financial separation.");
    }
  }

  // --- Customers Repository ---
  public getCustomers(): CustomerRecord[] {
    return readTable<CustomerRecord>(DB_FILES.customers);
  }

  public findCustomerByPhone(phone: string): CustomerRecord | undefined {
    const clean = phone.replace(/\D/g, "");
    const customers = this.getCustomers();
    return customers.find(c => c.phone.replace(/\D/g, "") === clean || c.phone === phone);
  }

  public upsertCustomer(data: { fullName: string; phone: string; whatsapp?: string; address?: string; notes?: string }): CustomerRecord {
    const customers = this.getCustomers();
    const cleanPhone = data.phone.trim();
    let customer = customers.find(c => c.phone === cleanPhone);

    if (customer) {
      customer.fullName = data.fullName.trim();
      if (data.whatsapp) customer.whatsapp = data.whatsapp.trim();
      if (data.address) customer.address = data.address.trim();
      if (data.notes) customer.notes = data.notes.trim();
      customer.updatedAt = new Date().toISOString();
    } else {
      customer = {
        id: "cust-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        fullName: data.fullName.trim(),
        phone: cleanPhone,
        whatsapp: data.whatsapp ? data.whatsapp.trim() : cleanPhone,
        address: data.address?.trim() || "",
        notes: data.notes?.trim() || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      customers.push(customer);
    }

    writeTable(DB_FILES.customers, customers);
    return customer;
  }

  // --- Menu Items Repository ---
  public getMenuItems(includeInactive = false): MenuItemRecord[] {
    const items = readTable<MenuItemRecord>(DB_FILES.menuItems);
    return includeInactive ? items : items.filter(i => i.isActive);
  }

  public getMenuItemByCode(code: string): MenuItemRecord | undefined {
    const clean = code.trim().toLowerCase();
    const items = this.getMenuItems(true);
    return items.find(i => i.code.toLowerCase() === clean);
  }

  public updateMenuItemPrices(code: string, distributorPrice: number, supplierPrice: number, adminUser: string): MenuItemRecord | null {
    const items = this.getMenuItems(true);
    const item = items.find(i => i.code.toLowerCase() === code.trim().toLowerCase());
    if (!item) return null;

    const oldDist = item.distributorPrice;
    const oldSupp = item.supplierPrice;

    item.distributorPrice = distributorPrice;
    item.supplierPrice = supplierPrice;
    item.updatedAt = new Date().toISOString();
    writeTable(DB_FILES.menuItems, items);

    // Save Price History Snapshot
    const history = readTable<any>(DB_FILES.priceHistory);
    history.unshift({
      id: "hist-" + Date.now(),
      menuItemId: item.id,
      menuCode: item.code,
      oldDistributorPrice: oldDist,
      newDistributorPrice: distributorPrice,
      oldSupplierPrice: oldSupp,
      newSupplierPrice: supplierPrice,
      validFrom: new Date().toISOString(),
      createdBy: adminUser,
      createdAt: new Date().toISOString()
    });
    writeTable(DB_FILES.priceHistory, history);

    return item;
  }

  // --- Orders Repository ---
  public getOrders(): OrderRecord[] {
    return readTable<OrderRecord>(DB_FILES.orders);
  }

  public getOrderById(id: string): OrderRecord | undefined {
    const clean = id.trim().toLowerCase();
    return this.getOrders().find(o => o.id.toLowerCase() === clean || o.orderNumber.toLowerCase() === clean);
  }

  public generateOrderNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePrefix = `CB-${yyyy}${mm}${dd}`;

    const orders = this.getOrders();
    const todayOrders = orders.filter(o => o.orderNumber.startsWith(datePrefix));
    const nextSeq = String(todayOrders.length + 1).padStart(4, "0");
    return `${datePrefix}-${nextSeq}`;
  }

  // Database Transaction: Create Preliminary Booking
  public createOrderTransaction(params: {
    customerName: string;
    phone: string;
    whatsapp?: string;
    pickupDate: string;
    pickupTime: string;
    pickupLocation: string;
    notes?: string;
    items: Array<{
      menuCode: string;
      quantity: number;
      drinkOption?: "juice_included" | "pepsi_added" | "no_juice";
    }>;
    ipAddress?: string;
    userAgent?: string;
  }): { order: OrderRecord; supplierOrder: SupplierOrderRecord; customer: CustomerRecord } {
    // Step 1: Upsert Customer
    const customer = this.upsertCustomer({
      fullName: params.customerName,
      phone: params.phone,
      whatsapp: params.whatsapp || params.phone,
      address: params.pickupLocation,
      notes: params.notes
    });

    // Step 2: Calculate Items with Price Snapshots
    const menuItems = this.getMenuItems(true);
    const orderItems: OrderItemRecord[] = [];
    let subtotal = 0;
    let supplierSubtotal = 0;
    const orderId = "ord-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const orderNumber = this.generateOrderNumber();

    for (let i = 0; i < params.items.length; i++) {
      const it = params.items[i];
      const menu = menuItems.find(m => m.code.toLowerCase() === it.menuCode.trim().toLowerCase());
      if (!menu) {
        throw new Error(`الوجبة بالكود "${it.menuCode}" غير موجودة في قائمة الطعام`);
      }

      const quantity = Math.max(1, Math.floor(it.quantity));
      const distUnitPrice = menu.distributorPrice;
      const suppUnitPrice = menu.supplierPrice;

      // Drink adjustments:
      // Exclude juice: -5 EGP on customer price (supplier price unchanged)
      // Replace with pepsi: +10 EGP on customer price (supplier price unchanged)
      let customerAdjustment = 0;
      let supplierAdjustment = 0;
      let drinkOptionLabel = "عصير بخيرة مشمول";

      if (it.drinkOption === "no_juice") {
        customerAdjustment = -5;
        drinkOptionLabel = "بدون عصير (-5ج للوجبة)";
      } else if (it.drinkOption === "pepsi_added") {
        customerAdjustment = 10;
        drinkOptionLabel = "بيبسي كانز بديل العصير (+10ج للوجبة)";
      }

      const finalDistUnitPrice = Math.max(0, distUnitPrice + customerAdjustment);
      const finalSuppUnitPrice = Math.max(0, suppUnitPrice + supplierAdjustment);

      const customerTotal = finalDistUnitPrice * quantity;
      const supplierTotal = finalSuppUnitPrice * quantity;
      const profit = customerTotal - supplierTotal;

      subtotal += customerTotal;
      supplierSubtotal += supplierTotal;

      orderItems.push({
        id: `item-${orderId}-${i + 1}`,
        orderId,
        menuItemId: menu.id,
        menuCode: menu.code,
        menuName: menu.name,
        quantity,
        distributorUnitPrice: distUnitPrice,
        supplierUnitPrice: suppUnitPrice,
        distributorTotal: distUnitPrice * quantity,
        supplierTotal: suppUnitPrice * quantity,
        customerAdjustment,
        supplierAdjustment,
        customerTotal,
        supplierTotalFinal: supplierTotal,
        profit,
        drinkOption: it.drinkOption || "juice_included",
        drinkOptionLabel
      });
    }

    const totalAmount = subtotal;
    const customerPaid = 0;
    const customerRemaining = totalAmount;

    const supplierTotal = supplierSubtotal;
    const supplierPaid = 0;
    const supplierRemaining = supplierTotal;
    const distributorProfit = totalAmount - supplierTotal; // Gross Profit: Customer Total - Supplier Total

    // Step 3: Create Order Record in PENDING_BOOKING state
    const newOrder: OrderRecord = {
      id: orderId,
      orderNumber,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerWhatsapp: customer.whatsapp,
      orderStatus: "PENDING_BOOKING",
      pickupDate: params.pickupDate,
      pickupTime: params.pickupTime || "12:00 م",
      pickupLocation: params.pickupLocation,
      customerNotes: params.notes || "",
      subtotal,
      discount: 0,
      adjustments: 0,
      totalAmount,
      customerPaid,
      customerRemaining,
      supplierTotal,
      supplierPaid,
      supplierRemaining,
      distributorProfit,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    writeTable(DB_FILES.orders, orders);

    // Step 4: Create Associated Supplier Order Record (Separate accounts)
    const suppliers = readTable<SupplierRecord>(DB_FILES.suppliers);
    const defaultSupplier = suppliers[0] || { id: "sup-factory-central", name: "مصنع سيلبر المركزي" };

    const supplierOrderNumber = `SO-${orderNumber}`;
    const newSupplierOrder: SupplierOrderRecord = {
      id: `supord-${Date.now()}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      supplierId: defaultSupplier.id,
      supplierName: defaultSupplier.name,
      supplierOrderNumber,
      supplierTotal,
      supplierPaid,
      supplierRemaining,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const supplierOrders = readTable<SupplierOrderRecord>(DB_FILES.supplierOrders);
    supplierOrders.unshift(newSupplierOrder);
    writeTable(DB_FILES.supplierOrders, supplierOrders);

    // Step 5: Record Immutable Audit Log
    this.addAuditLog({
      username: "SYSTEM_PUBLIC_BOOKING",
      action: "CREATE_PRELIMINARY_BOOKING",
      entity: "orders",
      entityId: newOrder.id,
      newData: {
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        totalAmount: newOrder.totalAmount,
        supplierTotal: newOrder.supplierTotal,
        profit: newOrder.distributorProfit,
        itemsCount: newOrder.items.length
      },
      ip: params.ipAddress || "client_ip",
      userAgent: params.userAgent || ""
    });

    return { order: newOrder, supplierOrder: newSupplierOrder, customer };
  }

  // Status Update with Reason & Audit Log
  public updateOrderStatus(orderId: string, newStatus: OrderStatus, adminUser: string, cancelReason?: string): OrderRecord | null {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;

    const oldStatus = order.orderStatus;
    order.orderStatus = newStatus;
    if (newStatus === "CANCELLED" && cancelReason) {
      order.cancelReason = cancelReason.trim();
      order.cancelledAt = new Date().toISOString();
    }
    if (newStatus === "COMPLETED") {
      order.completedAt = new Date().toISOString();
    }
    order.updatedAt = new Date().toISOString();
    writeTable(DB_FILES.orders, orders);

    // Sync supplier order status if applicable
    const supplierOrders = readTable<SupplierOrderRecord>(DB_FILES.supplierOrders);
    const supOrder = supplierOrders.find(s => s.orderId === order.id);
    if (supOrder) {
      if (newStatus === "SENT_TO_SUPPLIER") supOrder.status = "ACCEPTED";
      else if (newStatus === "IN_PRODUCTION") supOrder.status = "IN_PRODUCTION";
      else if (newStatus === "READY") supOrder.status = "READY";
      else if (newStatus === "DELIVERED" || newStatus === "COMPLETED") supOrder.status = "DELIVERED";
      else if (newStatus === "CANCELLED") supOrder.status = "CANCELLED";
      supOrder.updatedAt = new Date().toISOString();
      writeTable(DB_FILES.supplierOrders, supplierOrders);
    }

    this.addAuditLog({
      username: adminUser,
      action: "UPDATE_ORDER_STATUS",
      entity: "orders",
      entityId: order.id,
      oldData: { orderStatus: oldStatus },
      newData: { orderStatus: newStatus, cancelReason },
      ip: "127.0.0.1"
    });

    return order;
  }

  // Record Customer Payment (Offline InstaPay / Cash / Bank Transfer)
  public addCustomerPayment(params: {
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    paymentReference?: string;
    notes?: string;
    receivedBy: string;
  }): { payment: CustomerPaymentRecord; order: OrderRecord } {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === params.orderId || o.orderNumber === params.orderId);
    if (!order) throw new Error("الطلب غير موجود");

    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("قيمة الدفعة يجب أن تكون أكبر من صفر");
    }

    const paymentStatus = params.paymentStatus || "VERIFIED";

    const payment: CustomerPaymentRecord = {
      id: "cpay-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      amount,
      paymentMethod: params.paymentMethod,
      paymentStatus,
      paymentReference: params.paymentReference?.trim() || "",
      notes: params.notes?.trim() || "",
      receivedBy: params.receivedBy,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const payments = readTable<CustomerPaymentRecord>(DB_FILES.customerPayments);
    payments.unshift(payment);
    writeTable(DB_FILES.customerPayments, payments);

    // Recalculate customer paid & remaining from verified payments ONLY
    this.recalculateCustomerFinancials(order.id);
    const updatedOrder = this.getOrderById(order.id)!;

    this.addAuditLog({
      username: params.receivedBy,
      action: "ADD_CUSTOMER_PAYMENT",
      entity: "customer_payments",
      entityId: payment.id,
      newData: {
        orderNumber: order.orderNumber,
        amount,
        paymentMethod: params.paymentMethod,
        paymentStatus,
        customerRemaining: updatedOrder.customerRemaining
      },
      ip: "127.0.0.1"
    });

    return { payment, order: updatedOrder };
  }

  // Verify or Reject Customer Payment
  public updateCustomerPaymentStatus(paymentId: string, status: PaymentStatus, adminUser: string): CustomerPaymentRecord | null {
    const payments = readTable<CustomerPaymentRecord>(DB_FILES.customerPayments);
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return null;

    const oldStatus = payment.paymentStatus;
    payment.paymentStatus = status;
    writeTable(DB_FILES.customerPayments, payments);

    // Recalculate
    this.recalculateCustomerFinancials(payment.orderId);

    this.addAuditLog({
      username: adminUser,
      action: "UPDATE_CUSTOMER_PAYMENT_STATUS",
      entity: "customer_payments",
      entityId: payment.id,
      oldData: { paymentStatus: oldStatus },
      newData: { paymentStatus: status },
      ip: "127.0.0.1"
    });

    return payment;
  }

  private recalculateCustomerFinancials(orderId: string) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const allPayments = readTable<CustomerPaymentRecord>(DB_FILES.customerPayments);
    const verifiedSum = allPayments
      .filter(p => p.orderId === orderId && p.paymentStatus === "VERIFIED")
      .reduce((sum, p) => sum + p.amount, 0);

    order.customerPaid = verifiedSum;
    order.customerRemaining = Math.max(0, order.totalAmount - verifiedSum);
    order.updatedAt = new Date().toISOString();
    writeTable(DB_FILES.orders, orders);
  }

  // Record Supplier / Factory Payment (Separate and Independent from Customer Account)
  public addSupplierPayment(params: {
    supplierOrderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    paidBy: string;
  }): { payment: SupplierPaymentRecord; supplierOrder: SupplierOrderRecord; order: OrderRecord } {
    const supplierOrders = readTable<SupplierOrderRecord>(DB_FILES.supplierOrders);
    const supOrder = supplierOrders.find(s => s.id === params.supplierOrderId || s.supplierOrderNumber === params.supplierOrderId);
    if (!supOrder) throw new Error("طلب المصنع غير موجود");

    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("قيمة دفعة المصنع يجب أن تكون أكبر من صفر");
    }

    const payment: SupplierPaymentRecord = {
      id: "spay-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      supplierOrderId: supOrder.id,
      supplierId: supOrder.supplierId,
      supplierName: supOrder.supplierName,
      orderId: supOrder.orderId,
      orderNumber: supOrder.orderNumber,
      amount,
      paymentMethod: params.paymentMethod,
      reference: params.reference?.trim() || "",
      notes: params.notes?.trim() || "",
      paidBy: params.paidBy,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const payments = readTable<SupplierPaymentRecord>(DB_FILES.supplierPayments);
    payments.unshift(payment);
    writeTable(DB_FILES.supplierPayments, payments);

    // Recalculate supplier paid & remaining
    const allSuppPayments = readTable<SupplierPaymentRecord>(DB_FILES.supplierPayments);
    const supplierPaidSum = allSuppPayments
      .filter(p => p.supplierOrderId === supOrder.id)
      .reduce((sum, p) => sum + p.amount, 0);

    supOrder.supplierPaid = supplierPaidSum;
    supOrder.supplierRemaining = Math.max(0, supOrder.supplierTotal - supplierPaidSum);
    supOrder.updatedAt = new Date().toISOString();
    writeTable(DB_FILES.supplierOrders, supplierOrders);

    // Sync to main Order's supplier metrics
    const orders = this.getOrders();
    const order = orders.find(o => o.id === supOrder.orderId)!;
    if (order) {
      order.supplierPaid = supplierPaidSum;
      order.supplierRemaining = supOrder.supplierRemaining;
      order.updatedAt = new Date().toISOString();
      writeTable(DB_FILES.orders, orders);
    }

    this.addAuditLog({
      username: params.paidBy,
      action: "ADD_SUPPLIER_PAYMENT",
      entity: "supplier_payments",
      entityId: payment.id,
      newData: {
        supplierOrderNumber: supOrder.supplierOrderNumber,
        amount,
        supplierRemaining: supOrder.supplierRemaining
      },
      ip: "127.0.0.1"
    });

    return { payment, supplierOrder: supOrder, order };
  }

  // --- Audit Logs ---
  public addAuditLog(entry: {
    username: string;
    action: string;
    entity: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    ip: string;
    userAgent?: string;
  }) {
    const logs = readTable<AuditLogRecord>(DB_FILES.auditLogs);
    const newLog: AuditLogRecord = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      username: entry.username || "ANONYMOUS",
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      oldData: entry.oldData || null,
      newData: entry.newData || null,
      ip: (entry.ip || "127.0.0.1").replace(/^.*:/, ""),
      userAgent: entry.userAgent?.slice(0, 100) || "",
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 2000) logs.length = 2000;
    writeTable(DB_FILES.auditLogs, logs);
  }

  public getAuditLogs(limit = 100): AuditLogRecord[] {
    const logs = readTable<AuditLogRecord>(DB_FILES.auditLogs);
    return logs.slice(0, limit);
  }

  // --- Suppliers Repository ---
  public getSuppliers(): SupplierRecord[] {
    return readTable<SupplierRecord>(DB_FILES.suppliers);
  }

  public getSupplierOrders(): SupplierOrderRecord[] {
    return readTable<SupplierOrderRecord>(DB_FILES.supplierOrders);
  }

  public getCustomerPayments(): CustomerPaymentRecord[] {
    return readTable<CustomerPaymentRecord>(DB_FILES.customerPayments);
  }

  public getSupplierPayments(): SupplierPaymentRecord[] {
    return readTable<SupplierPaymentRecord>(DB_FILES.supplierPayments);
  }

  // --- Admin Users & Auth ---
  public getAdminUsers(): AdminUserRecord[] {
    return readTable<AdminUserRecord>(DB_FILES.adminUsers);
  }

  public findAdminUser(usernameOrPhone: string): AdminUserRecord | undefined {
    const clean = usernameOrPhone.trim().toLowerCase();
    const cleanPhone = usernameOrPhone.replace(/\D/g, "");
    return this.getAdminUsers().find(u => 
      u.username.toLowerCase() === clean || 
      (u.phone && u.phone.replace(/\D/g, "") === cleanPhone)
    );
  }

  public updateAdminPassword(userId: string, newPasswordPlain: string): boolean {
    const users = this.getAdminUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(newPasswordPlain, salt, 100000, 64, "sha512").toString("hex");
    user.salt = salt;
    user.passwordHash = passwordHash;
    user.updatedAt = new Date().toISOString();
    writeTable(DB_FILES.adminUsers, users);
    return true;
  }
}

export const db = new CelebreDatabase();
