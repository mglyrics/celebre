import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './index.ts';
import {
  roles,
  permissions,
  rolePermissions,
  adminUsers,
  suppliers,
  menuItems,
  menuItemComponents,
  menuPriceHistory,
  appSettings,
  customers,
  orders,
  orderItems,
  supplierOrders,
  auditLogs,
} from './schema.ts';
import { eq } from 'drizzle-orm';

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export async function seedDatabase() {
  console.log('🌱 Starting Celebre Catering database seeding...');

  // 1. Roles
  const rolesList = [
    { name: 'SUPER_ADMIN', description: 'المدير العام والمالك - صلاحيات كاملة للنظام' },
    { name: 'ADMIN', description: 'مدير العمليات - إدارة الطلبات والعملاء والمدفوعات' },
    { name: 'MANAGER', description: 'مدير التشغيل والمتابعة' },
    { name: 'ACCOUNTANT', description: 'المحاسب المالي - مدفوعات العملاء والمصنع والتقارير' },
    { name: 'ORDER_MANAGER', description: 'مسؤول الحجوزات والمتابعة مع العملاء والمصنع' },
    { name: 'VIEWER', description: 'مشاهدة وتقارير فقط بدون تعديل' },
  ];

  const roleMap = new Map<string, number>();
  for (const r of rolesList) {
    const existing = await db.select().from(roles).where(eq(roles.name, r.name)).limit(1);
    if (existing.length > 0) {
      roleMap.set(r.name, existing[0].id);
    } else {
      const inserted = await db.insert(roles).values(r).returning();
      roleMap.set(r.name, inserted[0].id);
    }
  }
  console.log(`✅ Roles seeded (${roleMap.size} roles)`);

  // 2. Permissions
  const permissionsList = [
    { code: 'orders.view', name: 'عرض الطلبات والحجوزات', module: 'orders' },
    { code: 'orders.create', name: 'إنشاء طلب جديد', module: 'orders' },
    { code: 'orders.edit', name: 'تعديل بيانات وحالة الطلب', module: 'orders' },
    { code: 'orders.cancel', name: 'إلغاء الطلب مع توثيق السبب', module: 'orders' },
    { code: 'customers.view', name: 'عرض بيانات العملاء', module: 'customers' },
    { code: 'customers.edit', name: 'تعديل بيانات العملاء', module: 'customers' },
    { code: 'menu.view', name: 'عرض قائمة الوجبات والمكونات', module: 'menu' },
    { code: 'menu.create', name: 'إضافة وجبة جديدة للمنيو', module: 'menu' },
    { code: 'menu.edit', name: 'تعديل تفاصيل الوجبات', module: 'menu' },
    { code: 'menu.delete', name: 'حذف أو تعطيل وجبة', module: 'menu' },
    { code: 'prices.edit', name: 'تعديل أسعار الموزع والمصنع', module: 'menu' },
    { code: 'customer_payments.view', name: 'عرض مدفوعات العملاء', module: 'payments' },
    { code: 'customer_payments.create', name: 'تسجيل دفعة عميل يدوياً (InstaPay/نقدي)', module: 'payments' },
    { code: 'customer_payments.edit', name: 'مراجعة وتعديل دفعات العملاء', module: 'payments' },
    { code: 'supplier_payments.view', name: 'عرض مدفوعات المصنع والمورد', module: 'supplier_payments' },
    { code: 'supplier_payments.create', name: 'تسجيل دفعة للمصنع', module: 'supplier_payments' },
    { code: 'supplier_payments.edit', name: 'تعديل مدفوعات المصنع', module: 'supplier_payments' },
    { code: 'suppliers.view', name: 'عرض بيانات المصانع والموردين', module: 'suppliers' },
    { code: 'suppliers.edit', name: 'تعديل بيانات المصانع والموردين', module: 'suppliers' },
    { code: 'reports.view', name: 'عرض التقارير المالية والإحصائية', module: 'reports' },
    { code: 'reports.export', name: 'تصدير التقارير PDF / Excel / JPG', module: 'reports' },
    { code: 'users.view', name: 'عرض مستخدمي الإدارة', module: 'users' },
    { code: 'users.create', name: 'إنشاء مستخدم إداري جديد', module: 'users' },
    { code: 'users.edit', name: 'تعديل مستخدم وتعيين الأدوار', module: 'users' },
    { code: 'users.disable', name: 'تعطيل أو قفل حساب مستخدم', module: 'users' },
    { code: 'audit_logs.view', name: 'عرض سجل التدقيق والرقابة الأمني', module: 'audit' },
    { code: 'settings.edit', name: 'تعديل إعدادات وهوية النظام', module: 'settings' },
  ];

  const permMap = new Map<string, number>();
  for (const p of permissionsList) {
    const existing = await db.select().from(permissions).where(eq(permissions.code, p.code)).limit(1);
    if (existing.length > 0) {
      permMap.set(p.code, existing[0].id);
    } else {
      const inserted = await db.insert(permissions).values(p).returning();
      permMap.set(p.code, inserted[0].id);
    }
  }
  console.log(`✅ Permissions seeded (${permMap.size} permissions)`);

  // Assign all permissions to SUPER_ADMIN
  const superAdminRoleId = roleMap.get('SUPER_ADMIN');
  if (superAdminRoleId) {
    for (const permId of permMap.values()) {
      const existing = await db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, superAdminRoleId))
        .limit(100);
      const exists = existing.some((ep) => ep.permissionId === permId);
      if (!exists) {
        await db.insert(rolePermissions).values({ roleId: superAdminRoleId, permissionId: permId });
      }
    }
  }

  // 3. Admin Users
  const defaultAdminPass = process.env.ADMIN_INITIAL_PASSWORD || 'CelebreAdmin2026!';
  const { hash, salt } = hashPassword(defaultAdminPass);

  const existingAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, 'admin')).limit(1);
  let adminUserId = existingAdmin[0]?.id;
  if (!existingAdmin.length && superAdminRoleId) {
    const inserted = await db
      .insert(adminUsers)
      .values({
        username: 'admin',
        email: 'admin@celebre-eg.com',
        passwordHash: hash,
        salt: salt,
        fullName: 'إدارة كاترنج سيلبر المركزية',
        phone: '01284484868',
        roleId: superAdminRoleId,
        isActive: true,
      })
      .returning();
    adminUserId = inserted[0].id;
    console.log('✅ Admin user created (username: admin, phone: 01284484868)');
  }

  // 4. Default Supplier (Factory)
  const existingSupplier = await db.select().from(suppliers).limit(1);
  let defaultSupplierId = existingSupplier[0]?.id;
  if (!existingSupplier.length) {
    const inserted = await db
      .insert(suppliers)
      .values({
        name: 'مصنع التجهيزات الفندقية المركزي (المورد الرئيسي)',
        companyName: 'Celebre Central Production & Catering Factory',
        phone: '01284484868',
        whatsapp: '201284484868',
        email: 'factory@celebre-eg.com',
        address: 'المنطقة الصناعية - شرق النيل - محافظة بني سويف',
        taxNumber: 'EG-784-938-2026',
        notes: 'المورد المعتمد لتجهيز عبوات الكاترنج الفاخرة وساندوتشات المناسبات',
        isActive: true,
      })
      .returning();
    defaultSupplierId = inserted[0].id;
    console.log('✅ Default factory/supplier created');
  }

  // 5. App Settings (Dynamic Juice Exclusion & Pepsi Replacement)
  const defaultSettings = [
    { key: 'juice_exclusion_discount', value: '5', description: 'خصم استبعاد العصير من سعر العميل (جنيه مصري)' },
    { key: 'pepsi_replacement_markup', value: '10', description: 'إضافة استبدال العصير ببيبسي على سعر العميل (جنيه مصري)' },
    { key: 'official_whatsapp_admin', value: '01284484868', description: 'رقم واتساب الإدارة الرئيسي للتواصل والتأكيد' },
    { key: 'min_order_quantity', value: '50', description: 'الحد الأدنى لعدد الوجبات في الحجز' },
    { key: 'instapay_account_note', value: 'يتم استلام المدفوعات خارج الموقع عبر تطبيق InstaPay على هاتف الإدارة 01284484868 وتوثيقها يدوياً', description: 'تعليمات الدفع الخارجي' },
  ];

  for (const s of defaultSettings) {
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, s.key)).limit(1);
    if (!existing.length) {
      await db.insert(appSettings).values(s);
    }
  }
  console.log('✅ Dynamic application settings seeded');

  // 6. The 18 Menu Items (Sale-01 to Sale-18)
  const menuData = [
    {
      code: 'Sale-01',
      name: 'عرض التوفير الأول (Sale-01)',
      description: 'قطعة جاتوة مغلفة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان لانشون كوردن بيف + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '50.00',
      supplierPrice: '35.00',
      sortOrder: 1,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'سندوتش بتي بان جبنة رومي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش بتي بان لانشون كوردن بيف', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-02',
      name: 'عرض بانية بلدي المميز (Sale-02)',
      description: 'قطعة جاتوة مغلفة + سندوتش فرنساوي وسط فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '55.00',
      supplierPrice: '37.00',
      sortOrder: 2,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'سندوتش فرنساوي وسط فراخ بانية بلدي طازج', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-03',
      name: 'عرض الرومي والتركي المدخن (Sale-03)',
      description: 'قطعة جاتوة مغلفة + سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '60.00',
      supplierPrice: '41.00',
      sortOrder: 3,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'سندوتش فرنساوي وسط جبنة رومي قديمة', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط تركي مدخن فاخر', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-04',
      name: 'مكس مشويات وكفتة بتي بان (Sale-04)',
      description: 'قطعة جاتوة مغلفة + سندوتش بتي بان كفتة مشوية ع الفحم + سندوتش بتي بان فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '65.00',
      supplierPrice: '47.00',
      sortOrder: 4,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'سندوتش بتي بان كفتة مشوية ع الفحم', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش بتي بان فراخ بانية بلدي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-05',
      name: 'عرض السوبر فرنساوي كفتة وبانية (Sale-05)',
      description: 'قطعة جاتوة مغلفة + سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '80.00',
      supplierPrice: '53.00',
      sortOrder: 5,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'سندوتش فرنساوي وسط كفتة مشوية بلدي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط فراخ بانية بلدي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-06',
      name: 'عرض الحلويات الخفيف (Sale-06)',
      description: 'قطعة جاتوة مغلفة + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '35.00',
      supplierPrice: '23.00',
      sortOrder: 6,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-07',
      name: 'مكس شرقي وجاتوة (Sale-07)',
      description: 'قطعة جاتوة مغلفة + 2 قطعة حلويات شرقي + عصير + شوكة ومنديل',
      distributorPrice: '50.00',
      supplierPrice: '37.00',
      sortOrder: 7,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'حلويات شرقية مشكلة (بسبوسة/كنافة)', quantity: '2.00', unit: 'قطعة' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-08',
      name: 'عرض المعجنات والبيتزا (Sale-08)',
      description: 'قطعة جاتوة مغلفة + 2 قطعة ميني بيتزا + 2 باتون سالية + عصير + شوكة ومنديل',
      distributorPrice: '45.00',
      supplierPrice: '29.00',
      sortOrder: 8,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'ميني بيتزا مشكلة', quantity: '2.00', unit: 'قطعة' },
        { name: 'باتون سالية بالكمون', quantity: '2.00', unit: 'قطعة' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-09',
      name: 'عرض البيتزا والحلويات الشرقية (Sale-09)',
      description: 'قطعة جاتوة مغلفة + 2 قطعة ميني بيتزا + قطعة حلوى شرقي + عصير + شوكة ومنديل',
      distributorPrice: '50.00',
      supplierPrice: '35.00',
      sortOrder: 9,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'ميني بيتزا مشكلة', quantity: '2.00', unit: 'قطعة' },
        { name: 'قطعة حلوى شرقي', quantity: '1.00', unit: 'قطعة' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-10',
      name: 'تريو بتي بان مشكل (Sale-10)',
      description: 'سندوتش كفتة بتي بان + سندوتش جبنة رومي بتي بان + سندوتش تركي مدخن / لانشون / بسطرمة + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '45.00',
      supplierPrice: '31.00',
      sortOrder: 10,
      components: [
        { name: 'سندوتش كفتة مشوية بتي بان', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش جبنة رومي بتي بان', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش تركي مدخن / لانشون / بسطرمة', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-11',
      name: 'عرض الخفايف والمخبوزات (Sale-11)',
      description: 'قطعة جاتوة مغلفة + سندوتش بتي بان جبنة رومي / فيتا / بسطرمة + قطعة باتون سالية + قطعة ميني بيتزا + عصير + شوكة ومنديل',
      distributorPrice: '39.00',
      supplierPrice: '29.00',
      sortOrder: 11,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'سندوتش بتي بان جبنة (رومي/فيتا)', quantity: '1.00', unit: 'سندوتش' },
        { name: 'قطعة باتون سالية مذهب', quantity: '1.00', unit: 'قطعة' },
        { name: 'قطعة ميني بيتزا فريش', quantity: '1.00', unit: 'قطعة' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-12',
      name: 'عرض البانية بالزبدة والجاتوة (Sale-12)',
      description: 'قطعة جاتوة مغلفة + بانية بالزبدة نكهات مختلفة + عصير بخيرة + شوكة ومنديل',
      distributorPrice: '44.00',
      supplierPrice: '32.00',
      sortOrder: 12,
      components: [
        { name: 'قطعة جاتوة مغلفة فاخرة', quantity: '1.00', unit: 'قطعة' },
        { name: 'بانية بالزبدة نكهات مختلفة محكمة الغلق', quantity: '1.00', unit: 'قطعة' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'باكت شوكة ومنديل معقم', quantity: '1.00', unit: 'باكت' },
      ],
    },
    {
      code: 'Sale-13',
      name: 'دويتو فرنساوي كوردن ورومي (Sale-13)',
      description: 'سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر',
      distributorPrice: '42.00',
      supplierPrice: '32.00',
      sortOrder: 13,
      components: [
        { name: 'سندوتش فرنساوي وسط جبنة رومي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط لانشون كوردن بيف', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'منديل معطر فاخر', quantity: '1.00', unit: 'قطعة' },
      ],
    },
    {
      code: 'Sale-14',
      name: 'تريو فرنساوي رومي وتركي ولانشون (Sale-14)',
      description: 'سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر',
      distributorPrice: '48.00',
      supplierPrice: '38.00',
      sortOrder: 14,
      components: [
        { name: 'سندوتش فرنساوي وسط جبنة رومي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط تركي مدخن', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط لانشون كوردن بيف', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'منديل معطر فاخر', quantity: '1.00', unit: 'قطعة' },
      ],
    },
    {
      code: 'Sale-15',
      name: 'دويتو فرنساوي فراخ بانية ورومي (Sale-15)',
      description: 'سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر',
      distributorPrice: '48.00',
      supplierPrice: '38.00',
      sortOrder: 15,
      components: [
        { name: 'سندوتش فرنساوي وسط فراخ بانية بلدي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط جبنة رومي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'منديل معطر فاخر', quantity: '1.00', unit: 'قطعة' },
      ],
    },
    {
      code: 'Sale-16',
      name: 'دويتو فرنساوي كفتة ورومي (Sale-16)',
      description: 'سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر',
      distributorPrice: '48.00',
      supplierPrice: '38.00',
      sortOrder: 16,
      components: [
        { name: 'سندوتش فرنساوي وسط كفتة مشوية ع الفحم', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط جبنة رومي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'منديل معطر فاخر', quantity: '1.00', unit: 'قطعة' },
      ],
    },
    {
      code: 'Sale-17',
      name: 'دويتو لحوم وفراخ فرنساوي (Sale-17)',
      description: 'سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + منديل معطر',
      distributorPrice: '55.00',
      supplierPrice: '43.00',
      sortOrder: 17,
      components: [
        { name: 'سندوتش فرنساوي وسط كفتة مشوية ع الفحم', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط فراخ بانية بلدي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'منديل معطر فاخر', quantity: '1.00', unit: 'قطعة' },
      ],
    },
    {
      code: 'Sale-18',
      name: 'العرض الملكي فرنساوي تريو (Sale-18)',
      description: 'سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر',
      distributorPrice: '65.00',
      supplierPrice: '50.00',
      sortOrder: 18,
      components: [
        { name: 'سندوتش فرنساوي وسط كفتة مشوية ع الفحم', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط فراخ بانية بلدي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'سندوتش فرنساوي وسط جبنة رومي', quantity: '1.00', unit: 'سندوتش' },
        { name: 'عصير بخيرة 200 مل', quantity: '1.00', unit: 'عبوة' },
        { name: 'منديل معطر فاخر', quantity: '1.00', unit: 'قطعة' },
      ],
    },
  ];

  for (const item of menuData) {
    const existing = await db.select().from(menuItems).where(eq(menuItems.code, item.code)).limit(1);
    let itemId: number;
    if (existing.length > 0) {
      itemId = existing[0].id;
      await db
        .update(menuItems)
        .set({
          name: item.name,
          description: item.description,
          distributorPrice: item.distributorPrice,
          supplierPrice: item.supplierPrice,
          sortOrder: item.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, itemId));
    } else {
      const inserted = await db
        .insert(menuItems)
        .values({
          code: item.code,
          name: item.name,
          description: item.description,
          distributorPrice: item.distributorPrice,
          supplierPrice: item.supplierPrice,
          sortOrder: item.sortOrder,
        })
        .returning();
      itemId = inserted[0].id;

      // Price History
      await db.insert(menuPriceHistory).values({
        menuItemId: itemId,
        distributorPrice: item.distributorPrice,
        supplierPrice: item.supplierPrice,
        createdBy: 'system_seed',
      });
    }

    // Refresh components
    await db.delete(menuItemComponents).where(eq(menuItemComponents.menuItemId, itemId));
    for (let cIdx = 0; cIdx < item.components.length; cIdx++) {
      const c = item.components[cIdx];
      await db.insert(menuItemComponents).values({
        menuItemId: itemId,
        componentName: c.name,
        quantity: c.quantity,
        unit: c.unit,
        sortOrder: cIdx + 1,
      });
    }
  }
  console.log('✅ 18 Menu Items, components, and price history seeded successfully!');

  // 7. Seed Official Confirmed Booking CEL-9386 as benchmark order
  const existingOrder = await db.select().from(orders).where(eq(orders.orderNumber, 'CB-20261010-9386')).limit(1);
  if (!existingOrder.length && defaultSupplierId) {
    // 1. Customer
    let customerId: number;
    const existingCustomer = await db.select().from(customers).where(eq(customers.phone, '01284484868')).limit(1);
    if (existingCustomer.length) {
      customerId = existingCustomer[0].id;
    } else {
      const insertedCust = await db
        .insert(customers)
        .values({
          fullName: 'عميل حجز معتمد (CEL-9386)',
          phone: '01284484868',
          whatsapp: '01284484868',
          notes: 'حجز مؤكد مسبقاً بالتنسيق الهاتفي',
        })
        .returning();
      customerId = insertedCust[0].id;
    }

    // Sale-01 details
    const sale01 = await db.select().from(menuItems).where(eq(menuItems.code, 'Sale-01')).limit(1);
    if (sale01.length) {
      const item = sale01[0];
      const quantity = 100;
      const distUnitPrice = Number(item.distributorPrice); // 50
      const suppUnitPrice = Number(item.supplierPrice); // 35
      const distTotal = distUnitPrice * quantity; // 5000
      const suppTotal = suppUnitPrice * quantity; // 3500
      const customerPaid = 500;
      const customerRemaining = distTotal - customerPaid;
      const supplierPaid = 500;
      const supplierRemaining = suppTotal - supplierPaid;
      const grossProfit = distTotal - suppTotal; // 1500

      const insertedOrder = await db
        .insert(orders)
        .values({
          orderNumber: 'CB-20261010-9386',
          customerId: customerId,
          orderStatus: 'CONFIRMED',
          pickupDate: '2026-10-10',
          pickupTime: '7:00 مساءً',
          pickupLocation: 'بني سويف - قاعة المناسبات الكبرى',
          customerNotes: 'حجز معتمد مسجل برقم CEL-9386 - تم التنسيق مع إدارة سيلبر هاتفياً',
          subtotal: distTotal.toFixed(2),
          totalAmount: distTotal.toFixed(2),
          customerPaid: customerPaid.toFixed(2),
          customerRemaining: customerRemaining.toFixed(2),
          supplierTotal: suppTotal.toFixed(2),
          supplierPaid: supplierPaid.toFixed(2),
          supplierRemaining: supplierRemaining.toFixed(2),
          distributorProfit: grossProfit.toFixed(2),
        })
        .returning();

      const orderId = insertedOrder[0].id;

      await db.insert(orderItems).values({
        orderId: orderId,
        menuItemId: item.id,
        menuCode: item.code,
        menuName: item.name,
        quantity: quantity,
        distributorUnitPrice: distUnitPrice.toFixed(2),
        supplierUnitPrice: suppUnitPrice.toFixed(2),
        distributorTotal: distTotal.toFixed(2),
        supplierTotal: suppTotal.toFixed(2),
        customerAdjustment: '0.00',
        supplierAdjustment: '0.00',
        customerTotal: distTotal.toFixed(2),
        supplierTotalFinal: suppTotal.toFixed(2),
        profit: grossProfit.toFixed(2),
      });

      await db.insert(supplierOrders).values({
        orderId: orderId,
        supplierId: defaultSupplierId,
        supplierOrderNumber: 'SUP-20261010-9386',
        supplierTotal: suppTotal.toFixed(2),
        supplierPaid: supplierPaid.toFixed(2),
        supplierRemaining: supplierRemaining.toFixed(2),
        status: 'PENDING_CONFIRMATION',
      });

      console.log('✅ Baseline confirmed order CB-20261010-9386 seeded');
    }
  }

  console.log('✨ All seed data successfully loaded into PostgreSQL database!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
