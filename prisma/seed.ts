import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const OFFICIAL_18_MEALS = [
  { code: "Sale-01", name: "العرض التوفيري الأول (Sale - 01)", description: "قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان لانشون كوردن بيف + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 50, supplierPrice: 35 },
  { code: "Sale-02", name: "العرض التوفيري الثاني (Sale - 02)", description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 55, supplierPrice: 37 },
  { code: "Sale-03", name: "العرض التوفيري الثالث (Sale - 03)", description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 60, supplierPrice: 41 },
  { code: "Sale-04", name: "العرض التوفيري الرابع (Sale - 04)", description: "قطعة جاتوه مغلفة + سندوتش بتي بان كفتة مشوية ع الفحم + سندوتش بتي بان فراخ بانية بلدي + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 65, supplierPrice: 47 },
  { code: "Sale-05", name: "العرض التوفيري الخامس (Sale - 05)", description: "قطعة جاتوه مغلفة + سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 80, supplierPrice: 53 },
  { code: "Sale-06", name: "العرض التوفيري السادس (Sale - 06)", description: "قطعة جاتوه مغلفة + عصير بخيرة + شوكة ومنديل معطر (العرض الاقتصادي السريع)", distributorPrice: 35, supplierPrice: 23 },
  { code: "Sale-07", name: "العرض التوفيري السابع (Sale - 07)", description: "قطعة جاتوه مغلفة + 2 قطعة حلويات شرقي + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 50, supplierPrice: 37 },
  { code: "Sale-08", name: "العرض التوفيري الثامن (Sale - 08)", description: "قطعة جاتوه مغلفة + 2 قطعة ميني بيتزا + 2 باتون سالية + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 45, supplierPrice: 29 },
  { code: "Sale-09", name: "العرض التوفيري التاسع (Sale - 09)", description: "قطعة جاتوه مغلفة + 2 قطعة ميني بيتزا + قطعة حلوى شرقي + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 50, supplierPrice: 35 },
  { code: "Sale-10", name: "العرض العاشر (Sale - 10)", description: "سندوتش كفتة بتي بان + سندوتش جبنة رومي بتي بان + سندوتش تركي مدخن / لانشون / بسطرمة + عصير بخيرة + شوكة ومنديل", distributorPrice: 45, supplierPrice: 31 },
  { code: "Sale-11", name: "العرض الحادي عشر (Sale - 11)", description: "قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي / فيتا / بسطرمة + قطعة باتون سالية + قطعة ميني بيتزا + عصير + شوكة ومنديل", distributorPrice: 39, supplierPrice: 29 },
  { code: "Sale-12", name: "العرض الثاني عشر (Sale - 12)", description: "قطعة جاتوه مغلفة + بانية بالزبدة نكهات مختلفة + عصير بخيرة + شوكة ومنديل معطر", distributorPrice: 44, supplierPrice: 32 },
  { code: "Sale-13", name: "العرض الثالث عشر (Sale - 13)", description: "سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر", distributorPrice: 42, supplierPrice: 32 },
  { code: "Sale-14", name: "العرض الرابع عشر (Sale - 14)", description: "سندوتش فرنساوي وسط جبنة رومي + سندوتش فرنساوي وسط تركي مدخن + سندوتش فرنساوي وسط لانشون كوردن بيف + عصير بخيرة + منديل معطر", distributorPrice: 48, supplierPrice: 38 },
  { code: "Sale-15", name: "العرض الخامس عشر (Sale - 15)", description: "سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر", distributorPrice: 48, supplierPrice: 38 },
  { code: "Sale-16", name: "العرض السادس عشر (Sale - 16)", description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر", distributorPrice: 48, supplierPrice: 38 },
  { code: "Sale-17", name: "العرض السابع عشر (Sale - 17)", description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + عصير بخيرة + منديل معطر", distributorPrice: 55, supplierPrice: 43 },
  { code: "Sale-18", name: "العرض الثامن عشر (Sale - 18)", description: "سندوتش فرنساوي وسط كفتة مشوية + سندوتش فرنساوي وسط فراخ بانية + سندوتش فرنساوي وسط جبنة رومي + عصير بخيرة + منديل معطر", distributorPrice: 65, supplierPrice: 50 }
];

async function main() {
  console.log("Seeding database via Prisma Client...");

  // 1. Roles
  const roles = [
    { name: "SUPER_ADMIN", displayName: "مدير النظام العام" },
    { name: "ADMIN", displayName: "مسؤول إدارة العمليات" },
    { name: "MANAGER", displayName: "مدير فرع وتنسيق" },
    { name: "ACCOUNTANT", displayName: "محاسب مالي" },
    { name: "ORDER_MANAGER", displayName: "مسؤول تنفيذ الطلبات" },
    { name: "VIEWER", displayName: "مستعرض تقارير فقط" }
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name as any },
      update: { displayName: r.displayName },
      create: { name: r.name as any, displayName: r.displayName }
    });
  }
  console.log("Seeded Roles.");

  // 2. Initial Admin User
  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (superAdminRole) {
    const salt = crypto.randomBytes(16).toString("hex");
    const initialPass = process.env.ADMIN_INITIAL_PASSWORD || "010973@Mahmoud";
    const passwordHash = crypto.pbkdf2Sync(initialPass, salt, 100000, 64, "sha512").toString("hex");

    await prisma.adminUser.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        email: "admin@celebre-eg.com",
        fullName: "مدير النظام العام",
        phone: "01284484868",
        passwordHash: `${salt}:${passwordHash}`,
        roleId: superAdminRole.id,
        isActive: true
      }
    });
    console.log("Seeded Admin User.");
  }

  // 3. Supplier / Factory
  const supplier = await prisma.supplier.upsert({
    where: { id: "sup-factory-central" },
    update: {},
    create: {
      id: "sup-factory-central",
      name: "مصنع ومطبخ براند سيلبر المركزي للتجهيز الفندقي",
      companyName: "مطبخ التجهيز الفندقي المعتمد لسيلبر كاترنج",
      phone: "01284484868",
      whatsapp: "01284484868",
      email: "factory@celebre-eg.com",
      address: "المنطقة الصناعية / بياض العرب - محافظة بني سويف",
      isActive: true
    }
  });
  console.log("Seeded Supplier:", supplier.name);

  // 4. Menu Items
  for (let idx = 0; idx < OFFICIAL_18_MEALS.length; idx++) {
    const meal = OFFICIAL_18_MEALS[idx];
    await prisma.menuItem.upsert({
      where: { code: meal.code },
      update: {
        distributorPrice: meal.distributorPrice,
        supplierPrice: meal.supplierPrice,
        name: meal.name,
        description: meal.description
      },
      create: {
        code: meal.code,
        name: meal.name,
        description: meal.description,
        distributorPrice: meal.distributorPrice,
        supplierPrice: meal.supplierPrice,
        sortOrder: idx + 1,
        isActive: true
      }
    });
  }
  console.log(`Seeded ${OFFICIAL_18_MEALS.length} Menu Items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
