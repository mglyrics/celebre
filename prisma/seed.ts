import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const OFFICIAL_18_MEALS = [
  {
    code: "Sale-01",
    name: "العرض التوفيري الأول (Sale - 01)",
    description: "قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان لانشون كوردن بيف + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 50,
    supplierPrice: 35,
    sortOrder: 1,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "سندوتش بتي بان جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش بتي بان لانشون كوردن بيف", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-02",
    name: "العرض التوفيري الثاني (Sale - 02)",
    description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 55,
    supplierPrice: 37,
    sortOrder: 2,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي طازج", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-03",
    name: "العرض التوفيري الثالث (Sale - 03)",
    description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 60,
    supplierPrice: 41,
    sortOrder: 3,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "سندوتش فرنساوي وسط جبنة رومي قديمة", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط تركي مدخن فاخر", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-04",
    name: "العرض التوفيري الرابع (Sale - 04)",
    description: "قطعة جاتوه مغلفة + سندوتش بتي بان كفتة مشوية ع الفحم + سندوتش بتي بان فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 65,
    supplierPrice: 47,
    sortOrder: 4,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "سندوتش بتي بان كفتة مشوية ع الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش بتي بان فراخ بانية بلدي", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-05",
    name: "العرض التوفيري الخامس (Sale - 05)",
    description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 80,
    supplierPrice: 53,
    sortOrder: 5,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "سندوتش فرنساوي وسط كفتة مشوية بلدي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-06",
    name: "العرض التوفيري السادس (Sale - 06)",
    description: "قطعة جاتوه مغلفة + عصير بخيرة + شوكة ومنديل معطر (العرض الاقتصادي السريع)",
    distributorPrice: 35,
    supplierPrice: 23,
    sortOrder: 6,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-07",
    name: "العرض التوفيري السابع (Sale - 07)",
    description: "قطعة جاتوه مغلفة + 2 قطعة حلويات شرقي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 50,
    supplierPrice: 37,
    sortOrder: 7,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "حلويات شرقية مشكلة (بسبوسة/كنافة)", quantity: 2, unit: "قطعة" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-08",
    name: "العرض التوفيري الثامن (Sale - 08)",
    description: "قطعة جاتوه مغلفة + 2 قطعة ميني بيتزا + 2 باتون سالية + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 45,
    supplierPrice: 29,
    sortOrder: 8,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "ميني بيتزا مشكلة", quantity: 2, unit: "قطعة" },
      { name: "باتون سالية بالكمون", quantity: 2, unit: "قطعة" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-09",
    name: "العرض التوفيري التاسع (Sale - 09)",
    description: "قطعة جاتوه مغلفة + 2 قطعة ميني بيتزا + قطعة حلوى شرقي + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 50,
    supplierPrice: 35,
    sortOrder: 9,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "ميني بيتزا مشكلة", quantity: 2, unit: "قطعة" },
      { name: "قطعة حلوى شرقي فاخرة", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-10",
    name: "العرض العاشر (Sale - 10)",
    description: "سندوتش كفتة بتي بان + سندوتش جبنة رومي بتي بان + سندوتش تركي مدخن / لانشون / بسطرمة + عصير بخيرة + شوكة ومنديل",
    distributorPrice: 45,
    supplierPrice: 31,
    sortOrder: 10,
    components: [
      { name: "سندوتش كفتة مشوية بتي بان", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش جبنة رومي بتي بان", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش تركي مدخن / لانشون / بسطرمة", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-11",
    name: "العرض الحادي عشر (Sale - 11)",
    description: "قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي / فيتا / بسطرمة + قطعة باتون سالية + قطعة ميني بيتزا + عصير + شوكة ومنديل",
    distributorPrice: 39,
    supplierPrice: 29,
    sortOrder: 11,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "سندوتش بتي بان جبنة (رومي/فيتا)", quantity: 1, unit: "سندوتش" },
      { name: "قطعة باتون سالية مذهب", quantity: 1, unit: "قطعة" },
      { name: "قطعة ميني بيتزا فريش", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-12",
    name: "العرض الثاني عشر (Sale - 12)",
    description: "قطعة جاتوه مغلفة + بانية بالزبدة نكهات مختلفة + عصير بخيرة + شوكة ومنديل معطر",
    distributorPrice: 44,
    supplierPrice: 32,
    sortOrder: 12,
    components: [
      { name: "قطعة جاتوه مغلفة فاخرة", quantity: 1, unit: "قطعة" },
      { name: "بانية بالزبدة نكهات مختلفة محكمة الغلق", quantity: 1, unit: "قطعة" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "باكت شوكة ومنديل معقم", quantity: 1, unit: "باكت" }
    ]
  },
  {
    code: "Sale-13",
    name: "العرض الثالث عشر (Sale - 13)",
    description: "سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر",
    distributorPrice: 42,
    supplierPrice: 32,
    sortOrder: 13,
    components: [
      { name: "سندوتش فرنساوي وسط جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط لانشون كوردن بيف", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "منديل معطر فاخر", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-14",
    name: "العرض الرابع عشر (Sale - 14)",
    description: "سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر",
    distributorPrice: 48,
    supplierPrice: 38,
    sortOrder: 14,
    components: [
      { name: "سندوتش فرنساوي وسط جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط تركي مدخن", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط لانشون كوردن بيف", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "منديل معطر فاخر", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-15",
    name: "العرض الخامس عشر (Sale - 15)",
    description: "سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر",
    distributorPrice: 48,
    supplierPrice: 38,
    sortOrder: 15,
    components: [
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "منديل معطر فاخر", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-16",
    name: "العرض السادس عشر (Sale - 16)",
    description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر",
    distributorPrice: 48,
    supplierPrice: 38,
    sortOrder: 16,
    components: [
      { name: "سندوتش فرنساوي وسط كفتة مشوية ع الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "منديل معطر فاخر", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-17",
    name: "العرض السابع عشر (Sale - 17)",
    description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + منديل معطر",
    distributorPrice: 55,
    supplierPrice: 43,
    sortOrder: 17,
    components: [
      { name: "سندوتش فرنساوي وسط كفتة مشوية ع الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "منديل معطر فاخر", quantity: 1, unit: "قطعة" }
    ]
  },
  {
    code: "Sale-18",
    name: "العرض الثامن عشر (Sale - 18)",
    description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر",
    distributorPrice: 65,
    supplierPrice: 50,
    sortOrder: 18,
    components: [
      { name: "سندوتش فرنساوي وسط كفتة مشوية ع الفحم", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط فراخ بانية بلدي", quantity: 1, unit: "سندوتش" },
      { name: "سندوتش فرنساوي وسط جبنة رومي", quantity: 1, unit: "سندوتش" },
      { name: "عصير بخيرة 200 مل", quantity: 1, unit: "عبوة" },
      { name: "منديل معطر فاخر", quantity: 1, unit: "قطعة" }
    ]
  }
];

const PERMISSIONS_LIST = [
  { key: "orders.view", desc: "عرض قائمة الطلبات والحجوزات" },
  { key: "orders.create", desc: "إنشاء طلب جديد" },
  { key: "orders.edit", desc: "تعديل تفاصيل وحالة الطلب" },
  { key: "orders.cancel", desc: "إلغاء الطلب مع توثيق السبب" },
  { key: "customers.view", desc: "عرض بيانات وسجلات العملاء" },
  { key: "customers.edit", desc: "تعديل بيانات العملاء" },
  { key: "menu.view", desc: "عرض قائمة الوجبات والمكونات" },
  { key: "menu.create", desc: "إضافة وجبة جديدة للمنيو" },
  { key: "menu.edit", desc: "تعديل بيانات الوجبة" },
  { key: "menu.delete", desc: "تعطيل أو حذف وجبة" },
  { key: "prices.edit", desc: "تعديل أسعار الموزع والمصنع" },
  { key: "customer_payments.view", desc: "عرض مدفوعات العملاء" },
  { key: "customer_payments.create", desc: "تسجيل دفعة عميل يدوياً (InstaPay/نقدي)" },
  { key: "customer_payments.edit", desc: "مراجعة وتعديل دفعات العملاء" },
  { key: "supplier_payments.view", desc: "عرض مدفوعات المصنع" },
  { key: "supplier_payments.create", desc: "تسجيل تحويل دفعة للمصنع" },
  { key: "supplier_payments.edit", desc: "تعديل مدفوعات المصنع" },
  { key: "suppliers.view", desc: "عرض بيانات المصانع والموردين" },
  { key: "suppliers.edit", desc: "تعديل بيانات المصانع والموردين" },
  { key: "reports.view", desc: "عرض التقارير المالية والإحصائية" },
  { key: "reports.export", desc: "تصدير التقارير (Excel / PDF / JPG)" },
  { key: "users.view", desc: "عرض مستخدمي الإدارة" },
  { key: "users.create", desc: "إنشاء مستخدم إداري جديد" },
  { key: "users.edit", desc: "تعديل مستخدم والأدوار" },
  { key: "users.disable", desc: "تعطيل أو قفل حساب مستخدم" },
  { key: "audit_logs.view", desc: "عرض سجل التدقيق والرقابة الأمني" },
  { key: "settings.edit", desc: "تعديل إعدادات النظام" }
];

async function main() {
  console.log("🌱 Starting Prisma Seeding for Celebre Catering Management System...");

  // 1. Seed Roles
  const roles = [
    { name: "SUPER_ADMIN", description: "المدير العام والمالك - صلاحيات كاملة" },
    { name: "ADMIN", description: "مدير العمليات - إدارة الطلبات والمدفوعات" },
    { name: "MANAGER", description: "مدير التشغيل والمتابعة" },
    { name: "ACCOUNTANT", description: "المحاسب المالي - مدفوعات العملاء والمصنع والتقارير" },
    { name: "ORDER_MANAGER", description: "مسؤول تنفيذ ومتابعة الحجوزات" },
    { name: "VIEWER", description: "صلاحية مشاهدة واستعراض تقارير فقط" }
  ];

  const roleMap = new Map<string, string>();
  for (const r of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description }
    });
    roleMap.set(r.name, roleRecord.id);
  }
  console.log(`✅ Roles seeded (${roles.length} roles)`);

  // 2. Seed Permissions
  const permMap = new Map<string, string>();
  for (const p of PERMISSIONS_LIST) {
    const permRecord = await prisma.permission.upsert({
      where: { permissionKey: p.key },
      update: { description: p.desc },
      create: { permissionKey: p.key, description: p.desc }
    });
    permMap.set(p.key, permRecord.id);
  }
  console.log(`✅ Permissions seeded (${PERMISSIONS_LIST.length} permissions)`);

  // Assign all permissions to SUPER_ADMIN
  const superAdminRoleId = roleMap.get("SUPER_ADMIN");
  if (superAdminRoleId) {
    for (const permId of permMap.values()) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRoleId,
            permissionId: permId
          }
        },
        update: {},
        create: {
          roleId: superAdminRoleId,
          permissionId: permId
        }
      });
    }
  }

  // 3. Seed Primary Supplier (Requested: Celebre Factory)
  const defaultSupplier = await prisma.supplier.upsert({
    where: { id: "supplier-celebre-factory" },
    update: {
      name: "Celebre Factory",
      companyName: "Celebre Central Production & Catering Factory"
    },
    create: {
      id: "supplier-celebre-factory",
      name: "Celebre Factory",
      companyName: "Celebre Central Production & Catering Factory",
      phone: "01284484868",
      whatsapp: "01284484868",
      email: "factory@celebre-eg.com",
      address: "المنطقة الصناعية - شرق النيل - محافظة بني سويف",
      taxNumber: "EG-784-938-2026",
      notes: "المورد والمصنع المركزي المعتمد لتجهيز علب كاترنج سيلبر الفاخرة",
      isActive: true
    }
  });
  console.log(`✅ Primary Supplier seeded: "${defaultSupplier.name}"`);

  // 4. Seed the 18 Official Catering Meals & Components
  for (const meal of OFFICIAL_18_MEALS) {
    const menuItem = await prisma.menuItem.upsert({
      where: { code: meal.code },
      update: {
        name: meal.name,
        description: meal.description,
        distributorPrice: meal.distributorPrice,
        supplierPrice: meal.supplierPrice,
        sortOrder: meal.sortOrder,
        isActive: true
      },
      create: {
        code: meal.code,
        name: meal.name,
        description: meal.description,
        distributorPrice: meal.distributorPrice,
        supplierPrice: meal.supplierPrice,
        sortOrder: meal.sortOrder,
        isActive: true
      }
    });

    // Seed price history record
    await prisma.menuPriceHistory.create({
      data: {
        menuItemId: menuItem.id,
        distributorPrice: meal.distributorPrice,
        supplierPrice: meal.supplierPrice,
        createdBy: "system_seed"
      }
    });

    // Seed components
    await prisma.menuItemComponent.deleteMany({
      where: { menuItemId: menuItem.id }
    });

    for (let cIdx = 0; cIdx < meal.components.length; cIdx++) {
      const comp = meal.components[cIdx];
      await prisma.menuItemComponent.create({
        data: {
          menuItemId: menuItem.id,
          componentName: comp.name,
          quantity: comp.quantity,
          unit: comp.unit,
          sortOrder: cIdx + 1
        }
      });
    }
  }
  console.log(`✅ 18 Catering Meals, components, and price history seeded.`);

  // 5. Admin User from Environment Variables ONLY (No hardcoded credentials!)
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminUsername = process.env.ADMIN_INITIAL_USERNAME || "admin";
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@celebre-eg.com";

  if (adminPassword && superAdminRoleId) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(adminPassword, salt, 10000, 64, "sha512").toString("hex");

    await prisma.adminUser.upsert({
      where: { username: adminUsername },
      update: {
        passwordHash: `${salt}:${passwordHash}`,
        email: adminEmail,
        roleId: superAdminRoleId
      },
      create: {
        username: adminUsername,
        email: adminEmail,
        fullName: "إدارة سيلبر كاترنج المركزية",
        passwordHash: `${salt}:${passwordHash}`,
        roleId: superAdminRoleId,
        isActive: true
      }
    });
    console.log(`✅ Admin user seeded from environment variables (username: ${adminUsername})`);
  } else {
    console.log(`ℹ️ Admin user not created in seed (ADMIN_INITIAL_PASSWORD not set in env). Create admin securely via environment variables.`);
  }

  console.log("✨ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
