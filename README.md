# 🏛️ CELEBRE CATERING MANAGEMENT SYSTEM (المرحلة الأولى - الأساس البرمجي)

نظام إدارة طلبات وحجوزات الكاترنج المحاسبي لبراند **Celebre (سيلبر)** كموزع معتمد مع المصنع المورد (**Celebre Factory**).

- **الموقع الرسمي للمشروع**: [https://celebre-eg.com](https://celebre-eg.com)
- **المعمارية**: Full-Stack Production Architecture
- **حالة المرحلة**: المرحلة الأولى (Core Backend & Database Architecture)

---

## 💎 القاعدة الذهبية في النظام المالي والمحاسبي

العلاقة في النظام تسير وفق التسلسل التالي:
```
CUSTOMER  ──►  CELEBRE (Distributor)  ──►  FACTORY (Supplier)
```

1. **العميل يتعامل ماليًا مع Celebre فقط**:
   - حساب العميل: `customer_paid` و `customer_remaining`
2. **المصنع يتعامل ماليًا مع Celebre فقط**:
   - حساب المصنع: `supplier_paid` و `supplier_remaining`
3. **الفصل التام بين الحسابين**:
   - دفع العميل لا يغير تلقائيًا دفع المصنع.
   - سداد Celebre للمصنع لا يغير رصيد العميل.
4. **حساب هامش الربح الإجمالي (Gross Profit)**:
   $$\text{Distributor Profit} = \text{Customer Total} - \text{Supplier Total}$$
   *(وليس الفرق بين المدفوعات النقدية المؤقتة).*
5. **تجميد الأسعار (Price Snapshot)**:
   - كل عنصر في الطلب (`OrderItem`) يحتفظ بنسخة ثابتة من `distributor_unit_price` و `supplier_unit_price` وقت إنشاء الحجز، لحماية السجلات القديمة من أي تعديل مستقبلي في أسعار المنيو.

---

## 🚫 سياسة الدفع الإلكتروني (صارمة)

النظام لا يحتوي على أي Payment Gateway أو كروت بنكية أو صفحة Checkout.
- **الحجز المبدئي (Preliminary Booking)** يُسجل بحالة `PENDING_BOOKING`.
- **التواصل والدفع**: يتم خارجيًا عبر واتساب وتطبيق InstaPay أو نقدًا.
- **التوثيق**: تقوم الإدارة بمراجعة الاستلام وتسجيل الدفعة يدويًا داخل لوحة التحكم.

---

## 📂 1. هيكل المشروع (Project Structure)

```
celebre-catering/
├── prisma/
│   ├── schema.prisma               # تعريف جداول وقواعد بيانات PostgreSQL الـ 17
│   ├── seed.ts                     # سكربت تهيئة البيانات (الرتب، الصلاحيات، المورد، الـ 18 وجبة)
│   └── migrations/
│       ├── 20261006000000_init/
│       │   └── migration.sql       # ملف الهجرة الأولي لقاعدة بيانات PostgreSQL
│       └── migration_lock.toml     # قفل الهجرة لمحرك Prisma
├── src/
│   ├── db/
│   │   ├── schema.ts               # تعريف الجداول والعلاقات البرمجية
│   │   └── index.ts                # مجمع الاتصال وإدارة Connection Pool
│   ├── lib/
│   │   └── orderTransaction.ts     # خدمة إنشاء الطلب داخل ACID Database Transaction مع Snapshots
│   ├── services/
│   │   ├── orderService.ts         # منطق الأعمال وحسابات الأسعار
│   │   ├── authService.ts          # التحقق والتشفير وجلسات الإدارة و 2FA OTP
│   │   └── whatsappService.ts      # قوالب رسائل الواتساب المنفصلة للعميل وللمصنع
│   └── server/
│       └── apiRouter.ts            # مسارات الـ REST API المنظمة والمحمية
├── tests/
│   └── system.test.ts              # اختبارات مؤتمتة لقواعد الحساب والخصومات والأرباح
├── .env.example                    # نموذج المتغيرات البيئية الخالي من الأسرار
├── .gitignore                      # ملف استبعاد الملفات الحساسة والمخرجات البرمجية
├── package.json                    # تبعيات وأوامر تشغيل المشروع
├── tsconfig.json                   # إعدادات مترجم TypeScript
└── README.md                       # دليل التوثيق والتشغيل والنشر
```

---

## 🗄️ 2. جداول قاعدة البيانات (Prisma Models - 17 Tables)

| الجدول | الوظيفة | الحقول الأساسية |
| :--- | :--- | :--- |
| **`customers`** | بيانات وسجلات العملاء | `id, full_name, phone, whatsapp, email, notes, created_at, updated_at` |
| **`suppliers`** | المصانع والموردين | `id, name, company_name, phone, address, tax_number, is_active...` |
| **`menu_items`** | وجبات الكاترنج الـ 18 | `id, code, name, distributor_price, supplier_price, is_active, sort_order...` |
| **`menu_item_components`** | مكونات كل علبة كاترنج | `id, menu_item_id, component_name, quantity, unit, sort_order` |
| **`menu_price_history`** | تاريخ وتغيرات الأسعار | `id, menu_item_id, distributor_price, supplier_price, valid_from, valid_to...` |
| **`orders`** | الطلبات والحجوزات | `id, order_number, customer_id, order_status, total_amount, customer_paid, customer_remaining, supplier_total, supplier_paid, supplier_remaining, distributor_profit...` |
| **`order_items`** | أصناف الطلب المحفوظة | `id, order_id, menu_code, quantity, distributor_unit_price, supplier_unit_price, customer_total, supplier_total_final, profit...` |
| **`order_item_options`** | تعديلات المشروبات | `id, order_item_id, option_type, option_name, distributor_adjustment, supplier_adjustment` |
| **`supplier_orders`** | أوامر توريد المصنع | `id, order_id, supplier_id, supplier_order_number, supplier_total, supplier_paid, supplier_remaining, status...` |
| **`customer_payments`** | دفعات العميل اليدوية | `id, order_id, customer_id, amount, payment_method, payment_status, payment_reference, received_by...` |
| **`supplier_payments`** | دفعات تحويل المصنع | `id, supplier_order_id, supplier_id, order_id, amount, payment_method, reference, paid_by...` |
| **`admin_users`** | المستخدمون الإداريون | `id, username, email, password_hash, full_name, role_id, is_active, is_locked...` |
| **`roles`** | أدوار النظام | `id, name, description` |
| **`permissions`** | الصلاحيات الدقيقة | `id, permission_key, description` |
| **`role_permissions`** | ربط الأدوار بالصلاحيات | `role_id, permission_id` |
| **`otp_codes`** | رموز التحقق الثنائي OTP | `id, user_id, code_hash, purpose, expires_at, used_at, attempts, created_at` |
| **`audit_logs`** | سجل الرقابة والتدقيق | `id, user_id, action, entity, entity_id, old_data, new_data, ip_address, user_agent, created_at` |

---

## ⚡ 3. أوامر التشغيل (Commands & Execution)

### تثبيت التبعيات
```bash
npm install
```

### توليد Prisma Client
```bash
npm run prisma:generate
```

### تطبيق الهجرات على قاعدة بيانات PostgreSQL
```bash
npm run prisma:migrate
# أو لمزامنة المخطط أثناء التطوير:
npx prisma db push
```

### تشغيل سكربت التهيئة الأولية (Seed)
يقوم السكربت بإضافة:
- المورد الرئيسي: **Celebre Factory**
- الأدوار الـ 6 والصلاحيات الـ 27
- وجبات الكاترنج الـ 18 ومكوناتها وسجل أسعارها
- حساب الأدمن (في حال توفر متغير `ADMIN_INITIAL_PASSWORD` بالبيئة)
```bash
npm run prisma:seed
```

### تشغيل الاختبارات المؤتمتة للتأكد من سلامة الحسابات
```bash
npm test
```

### تشغيل خادم التطوير
```bash
npm run dev
```

---

## 🚀 4. خطوات النشر على Vercel وربط الدومين (celebre-eg.com)

1. **إنشاء قاعدة بيانات PostgreSQL**:
   - أنشئ قاعدة بيانات PostgreSQL على Supabase، أو Neon، أو Vercel Postgres.
   - احصل على رابط الاتصال `DATABASE_URL` و `DIRECT_URL`.

2. **رفع الكود إلى مستودع GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Celebre Catering Foundation Phase 1"
   git remote add origin https://github.com/YOUR_USERNAME/celebre-catering.git
   git push -u origin main
   ```

3. **استيراد المشروع على Vercel**:
   - اربط مستودع GitHub في Vercel.
   - أضف المتغيرات البيئية من `.env.example` (خصوصًا `DATABASE_URL`).
   - في إعدادات البناء، تأكد من تشغيل `prisma generate` أثناء الـ build.

4. **تشغيل الهجرة والـ Seed في بيئة الإنتاج**:
   ```bash
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```

5. **ربط الدومين الرسمي**:
   - في لوحة تحكم Vercel، اذهب إلى `Settings` -> `Domains`.
   - أضف: `celebre-eg.com` و `www.celebre-eg.com`.
   - وجّه سجلات DNS (A Record و CNAME) إلى خوادم Vercel المعتمدة.

---

> تم الانتهاء من **المرحلة الأولى** بالكامل وجاهزية الكود للانتقال للمراحل التالية عند الطلب.
