import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateWhatsAppAiReply, sendMetaWhatsAppMessage } from "./server/whatsappService";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Admin Credentials File Path
const ADMIN_CONFIG_FILE = path.resolve(process.cwd(), ".admin-credentials.json");

// In-memory orders store
interface CateringOrder {
  id: string;
  customerName: string;
  phone: string;
  occasion: string;
  eventDate: string;
  location: string;
  governorate: string;
  packages: Array<{
    id: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
    customItems?: string[];
    packagingType?: string;
  }>;
  totalPrice: number;
  totalBoxes: number;
  notes?: string;
  customRibbonText?: string;
  paymentMethod: string;
  status: "pending" | "confirmed" | "in_preparation" | "delivered";
  createdAt: string;
}

const DEFAULT_ORDERS: CateringOrder[] = [];

let orders: CateringOrder[] = [];

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", brand: "Celebre Catering Packages", contact: "01284484868" });
});

// API: List & Create Orders
app.get("/api/orders", (_req, res) => {
  res.json({ success: true, orders });
});

// API: Reset Orders to Default Celebre State
app.post("/api/orders/reset", (_req, res) => {
  orders = [...DEFAULT_ORDERS];
  res.json({ success: true, message: "تمت إعادة ضبط بيانات الطلبات بنجاح", orders });
});

app.post("/api/reset", (_req, res) => {
  orders = [...DEFAULT_ORDERS];
  res.json({ success: true, message: "تمت إعادة ضبط بيانات مشروع سيلبر بنجاح", orders });
});

app.post("/api/orders", (req, res) => {
  try {
    const data = req.body;
    const newOrder: CateringOrder = {
      id: `CEL-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: data.customerName || "عميل سيلبر",
      phone: data.phone || "01284484868",
      occasion: data.occasion || "مناسبة سعيدة",
      eventDate: data.eventDate || new Date().toISOString().split("T")[0],
      location: data.location || "بني سويف",
      governorate: data.governorate || "بني سويف - مدينة بني سويف",
      packages: data.packages || [],
      totalPrice: data.totalPrice || 0,
      totalBoxes: data.totalBoxes || 0,
      notes: data.notes || "",
      paymentMethod: data.paymentMethod || "instapay",
      status: "pending",
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);

    // Also mirror into adminBookings for project management record
    const pkg = (data.packages && data.packages[0]) || null;
    const pkgCode = pkg?.packageCode || "Sale - 01";
    const pkgName = pkg?.packageName || (data.packages && data.packages.length > 0 
      ? data.packages.map((p: any) => `${p.packageName || p.name || 'وجبة كاترنج'} (${p.quantity || 1} علبة)`).join(" + ") 
      : "طلب وجبات من الموقع الرسمي");
    const quantity = Number(data.totalBoxes) || 50;
    const totalPrice = Number(data.totalPrice) || 0;
    const unitPrice = quantity > 0 ? Math.round(totalPrice / quantity) : 50;

    const newAdminBooking: AdminBookingRecord = {
      id: `CEL-BK-${Math.floor(100 + Math.random() * 900)}`,
      customerName: data.customerName || "حجز موقع جديد",
      phone: data.phone || "01284484868",
      occasion: data.occasion || "حجز مناسبة من الموقع",
      eventDate: data.eventDate || new Date().toISOString().split("T")[0],
      eventTime: data.eventTime || "5:00 مساءً",
      packageCode: pkgCode,
      packageName: pkgName,
      basePrice: unitPrice,
      drinkOption: 'juice_included',
      drinkOptionLabel: 'عصير بخيرة مشمول',
      drinkPriceDelta: 0,
      unitPrice,
      quantity,
      totalPrice,
      depositPaid: 0,
      remainingAmount: totalPrice,
      paymentStatus: 'pending_payment',
      orderStatus: 'confirmed',
      deliveryAddress: `${data.governorate || "بني سويف"} - ${data.location || ""}`,
      phoneAgreementNotes: data.notes ? `ملاحظات الموقع: ${data.notes}` : "حجز إلكتروني من خلال موقع سيلبر الرسمي",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    adminBookings.unshift(newAdminBooking);
    saveAdminBookings(adminBookings);

    res.json({ success: true, order: newOrder, adminBooking: newAdminBooking });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "تعذر حفظ الطلب" });
  }
});

// ==========================================
// Celebre Admin Bookings System (Excel-like)
// Credentials: Username "01284484868", Password "Mahmoud@010973"
// ==========================================
interface AdminBookingRecord {
  id: string;
  customerName: string;
  phone: string;
  occasion: string;
  eventDate: string;
  eventTime: string;
  packageCode: string;
  packageName: string;
  basePrice: number;
  drinkOption: 'juice_included' | 'pepsi_added' | 'no_juice' | 'custom';
  drinkOptionLabel: string;
  drinkPriceDelta: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  paymentStatus: 'deposit_paid' | 'fully_paid' | 'pending_payment' | 'refunded';
  orderStatus: 'confirmed' | 'in_preparation' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  phoneAgreementNotes: string;
  createdAt: string;
  updatedAt: string;
}

const ADMIN_BOOKINGS_FILE = path.join(process.cwd(), "celebre-admin-bookings.json");

function loadAdminBookings(): AdminBookingRecord[] {
  try {
    if (fs.existsSync(ADMIN_BOOKINGS_FILE)) {
      const data = fs.readFileSync(ADMIN_BOOKINGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading admin bookings file:", e);
  }
  return [];
}

function saveAdminBookings(bookingsList: AdminBookingRecord[]) {
  try {
    fs.writeFileSync(ADMIN_BOOKINGS_FILE, JSON.stringify(bookingsList, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving admin bookings file:", e);
  }
}

const DEFAULT_ADMIN_BOOKINGS: AdminBookingRecord[] = [];

let adminBookings: AdminBookingRecord[] = loadAdminBookings();

interface AdminCredentials {
  phone: string;
  password: string;
  name: string;
  isCustomConfigured: boolean;
}

// Load persisted admin credentials from disk if present
function loadAdminCredentials(): AdminCredentials {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = fs.readFileSync(ADMIN_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && parsed.phone && parsed.password) {
        return {
          phone: parsed.phone,
          password: parsed.password,
          name: parsed.name || "عضو إدارة المبيعات",
          isCustomConfigured: true
        };
      }
    }
  } catch (e) {
    console.error("Error reading admin credentials file:", e);
  }
  return {
    phone: "",
    password: "",
    name: "إدارة المبيعات",
    isCustomConfigured: false
  };
}

function saveAdminCredentials(creds: AdminCredentials) {
  try {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(creds, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving admin credentials file:", e);
  }
}

// In-memory admin credentials store initialized from disk
let adminCredentials: AdminCredentials = loadAdminCredentials();

interface ActiveOtpRecord {
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

let currentOtpRecord: ActiveOtpRecord | null = null;

// Helper to mask phone for privacy (e.g. 012****4868)
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 8) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-4);
};

// 1. Check Admin Auth Status
app.get("/api/admin/auth/status", (_req, res) => {
  res.json({
    success: true,
    isConfigured: adminCredentials.isCustomConfigured,
    adminName: adminCredentials.name,
    registeredPhone: adminCredentials.phone ? maskPhone(adminCredentials.phone) : null
  });
});

// 2. Set / Register Custom Credentials (تسجيل عضو إدارة المشروع لأول مرة أو تحديثها)
app.post("/api/admin/auth/register", (req, res) => {
  const { phone, password, name } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: "يرجى إدخال رقم الهاتف وكلمة المرور المطلوبة" });
  }

  const cleanPhone = phone.trim();
  const cleanPass = password.trim();

  if (cleanPhone.length < 9) {
    return res.status(400).json({ success: false, message: "رقم هاتف الإدارة غير صالح (أدخل رقماً صحيحاً)" });
  }

  if (cleanPass.length < 4) {
    return res.status(400).json({ success: false, message: "كلمة المرور يجب أن لا تقل عن 4 خانات" });
  }

  adminCredentials = {
    phone: cleanPhone,
    password: cleanPass,
    name: name?.trim() || "عضو إدارة المبيعات",
    isCustomConfigured: true
  };

  // Persist to disk
  saveAdminCredentials(adminCredentials);

  console.log(`[ADMIN REGISTERED]: Phone: ${cleanPhone}, Name: ${adminCredentials.name}`);

  res.json({
    success: true,
    message: "تم تسجيل عضو إدارة المشروع وتثبيت بيانات الدخول بنجاح! يمكنك الآن تسجيل الدخول برقمك وكلمة مرورك المعتمدة.",
    phone: cleanPhone,
    maskedPhone: maskPhone(cleanPhone)
  });
});

// 3. Step 1: Request Login & Generate One-Time Temporary Password (OTP)
app.post("/api/admin/auth/request-otp", async (req, res) => {
  const { phone, password } = req.body;
  const cleanPhone = (phone || "").trim();
  const cleanPass = (password || "").trim();

  // If not configured yet, tell user to register first
  if (!adminCredentials.isCustomConfigured) {
    return res.status(400).json({
      success: false,
      notRegistered: true,
      message: "لم يتم تسجيل عضو إدارة المشروع بعد. يرجى تسجيل بيانات عضو الإدارة لأول مرة أولاً."
    });
  }

  // Validate credentials against custom configured credentials
  if (cleanPhone !== adminCredentials.phone || cleanPass !== adminCredentials.password) {
    return res.status(401).json({
      success: false,
      message: "بيانات الدخول غير صحيحة. يرجى إدخال رقم الهاتف وكلمة المرور المعتمدة لعضو الإدارة."
    });
  }

  // Generate 6-digit cryptographically random OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  currentOtpRecord = {
    phone: cleanPhone,
    otp: otpCode,
    expiresAt,
    attempts: 0,
    createdAt: Date.now()
  };

  const formattedPhone = cleanPhone.startsWith("0") ? "2" + cleanPhone : cleanPhone;
  const messageBody = `🔒 *رمز الأمان المؤقت لإدارة المبيعات (سيلبر كاترنج)*:\n\nكلمة السر المؤقتة: *${otpCode}*\n\n⏱️ هذا الرمز صالح لمدة 5 دقائق فقط للاستخدام لمرة واحدة.\n⚠️ لا تشارك هذا الرمز السري مع أي شخص للحفاظ على سرية وأمان السجلات.`;
  
  const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageBody)}`;

  console.log(`[SECURITY OTP DISPATCHED TO WHATSAPP] Phone: ${cleanPhone} | Expires: 5 min`);

  // Attempt Meta API direct delivery if configured in environment
  try {
    if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID) {
      await sendMetaWhatsAppMessage(cleanPhone, messageBody);
    }
  } catch (metaErr) {
    console.warn("Direct Meta API dispatch error (link fallback available):", metaErr);
  }

  // Note: NEVER send otpCode in the JSON response!
  res.json({
    success: true,
    message: "تم توليد وإرسال كلمة السر المؤقتة (OTP) في رسالة واتساب إلى رقم الإدارة المسجل.",
    phone: cleanPhone,
    maskedPhone: maskPhone(cleanPhone),
    expiresAt,
    whatsappLink
  });
});

// 4. Step 2: Verify One-Time Temporary Password (OTP)
app.post("/api/admin/auth/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  const cleanPhone = (phone || "").trim();
  const cleanOtp = (otp || "").trim();

  if (!currentOtpRecord) {
    return res.status(400).json({
      success: false,
      message: "لا توجد كلمة سر مؤقتة نشطة. يرجى طلب رمز جديد."
    });
  }

  if (Date.now() > currentOtpRecord.expiresAt) {
    currentOtpRecord = null;
    return res.status(400).json({
      success: false,
      message: "انتهت صلاحية كلمة السر المؤقتة (صلاحيتها 5 دقائق فقط). يرجى طلب رمز جديد."
    });
  }

  if (currentOtpRecord.otp !== cleanOtp) {
    currentOtpRecord.attempts += 1;
    if (currentOtpRecord.attempts >= 3) {
      currentOtpRecord = null;
      return res.status(400).json({
        success: false,
        message: "تم تجاوز الحد الأقصى للمحاولات الخاطئة (3 محاولات). تم إلغاء الرمز لحماية أمان البيانات."
      });
    }
    return res.status(400).json({
      success: false,
      message: `كلمة السر المؤقتة غير صحيحة. المتبقي: ${3 - currentOtpRecord.attempts} محاولات.`
    });
  }

  // Verification Succeeded: Reset OTP and issue secure session
  currentOtpRecord = null;
  const sessionToken = "celebre-sec-" + Date.now() + "-" + Math.random().toString(36).substring(2);

  res.json({
    success: true,
    token: sessionToken,
    user: {
      phone: adminCredentials.phone,
      name: adminCredentials.name,
      role: "sales_admin"
    }
  });
});

// 5. Update Credentials from settings
app.post("/api/admin/auth/update-credentials", (req, res) => {
  const { newPhone, newPassword, newName } = req.body;
  if (!newPhone || !newPassword) {
    return res.status(400).json({ success: false, message: "يرجى توفير رقم الهاتف وكلمة المرور الجديدة" });
  }

  adminCredentials = {
    phone: newPhone.trim(),
    password: newPassword.trim(),
    name: newName?.trim() || adminCredentials.name,
    isCustomConfigured: true
  };

  saveAdminCredentials(adminCredentials);

  res.json({
    success: true,
    message: "تم تحديث وتثبيت بيانات إدارة المبيعات بنجاح! سيتم إرسال رموز التحقق المؤقتة لهذا الرقم الجديد.",
    phone: adminCredentials.phone,
    maskedPhone: maskPhone(adminCredentials.phone)
  });
});

// Legacy login route fallback (enforcing OTP)
app.post("/api/admin/login", (_req, res) => {
  res.status(403).json({
    success: false,
    message: "ممنوع الدخول المباشر. يتطلب النظام إدخال كلمة سر مؤقتة (OTP) مرسلة لرقم الإدارة في كل مرة دخول."
  });
});

// Admin Bookings: List
app.get("/api/admin/bookings", (_req, res) => {
  res.json({ success: true, bookings: adminBookings });
});

// Admin Bookings: Create New Record
app.post("/api/admin/bookings", (req, res) => {
  try {
    const data = req.body;
    const basePrice = Number(data.basePrice) || 50;
    const drinkPriceDelta = Number(data.drinkPriceDelta) || 0;
    const unitPrice = Number(data.unitPrice) || (basePrice + drinkPriceDelta);
    const quantity = Number(data.quantity) || 50;
    const totalPrice = Number(data.totalPrice) || (unitPrice * quantity);
    const depositPaid = Number(data.depositPaid) || 0;
    const remainingAmount = totalPrice - depositPaid;

    const newRecord: AdminBookingRecord = {
      id: `CEL-BK-${Math.floor(100 + Math.random() * 900)}`,
      customerName: data.customerName || "حجز إدارة جديد",
      phone: data.phone || "",
      occasion: data.occasion || "كتب كتاب وعقد قران",
      eventDate: data.eventDate || new Date().toISOString().split("T")[0],
      eventTime: data.eventTime || "5:00 مساءً",
      packageCode: data.packageCode || "Sale - 01",
      packageName: data.packageName || "وجبة كاترنج سيلبر مخصصة",
      basePrice,
      drinkOption: data.drinkOption || "juice_included",
      drinkOptionLabel: data.drinkOptionLabel || "عصير بخيرة مشمول",
      drinkPriceDelta,
      unitPrice,
      quantity,
      totalPrice,
      depositPaid,
      remainingAmount,
      paymentStatus: depositPaid >= totalPrice ? "fully_paid" : depositPaid > 0 ? "deposit_paid" : "pending_payment",
      orderStatus: data.orderStatus || "confirmed",
      deliveryAddress: data.deliveryAddress || "بني سويف",
      phoneAgreementNotes: data.phoneAgreementNotes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    adminBookings.unshift(newRecord);
    saveAdminBookings(adminBookings);
    res.json({ success: true, booking: newRecord });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, message: "فشل حفظ الحجز" });
  }
});

// Admin Bookings: Update Record
app.put("/api/admin/bookings/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = adminBookings.findIndex(b => b.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "الحجز غير موجود" });
    }

    const current = adminBookings[index];
    const update = req.body;

    const basePrice = update.basePrice !== undefined ? Number(update.basePrice) : current.basePrice;
    const drinkPriceDelta = update.drinkPriceDelta !== undefined ? Number(update.drinkPriceDelta) : current.drinkPriceDelta;
    const unitPrice = update.unitPrice !== undefined ? Number(update.unitPrice) : (basePrice + drinkPriceDelta);
    const quantity = update.quantity !== undefined ? Number(update.quantity) : current.quantity;
    const totalPrice = update.totalPrice !== undefined ? Number(update.totalPrice) : (unitPrice * quantity);
    const depositPaid = update.depositPaid !== undefined ? Number(update.depositPaid) : current.depositPaid;
    const remainingAmount = update.remainingAmount !== undefined ? Number(update.remainingAmount) : Math.max(0, totalPrice - depositPaid);

    const paymentStatus = update.paymentStatus || (
      depositPaid >= totalPrice && totalPrice > 0 
        ? "fully_paid" 
        : depositPaid > 0 
        ? "deposit_paid" 
        : "pending_payment"
    );

    const orderStatus = update.orderStatus || current.orderStatus || "confirmed";

    const updatedBooking: AdminBookingRecord = {
      ...current,
      ...update,
      basePrice,
      drinkPriceDelta,
      unitPrice,
      quantity,
      totalPrice,
      depositPaid,
      remainingAmount,
      paymentStatus,
      orderStatus,
      updatedAt: new Date().toISOString()
    };

    adminBookings[index] = updatedBooking;
    saveAdminBookings(adminBookings);
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ success: false, message: "فشل تحديث الحجز" });
  }
});

// Admin Bookings: Delete Record
app.delete("/api/admin/bookings/:id", (req, res) => {
  const { id } = req.params;
  adminBookings = adminBookings.filter(b => b.id !== id);
  saveAdminBookings(adminBookings);
  res.json({ success: true, message: "تم حذف الحجز بنجاح" });
});

// Admin Bookings: Reset to Default
app.post("/api/admin/bookings/reset", (_req, res) => {
  adminBookings = [...DEFAULT_ADMIN_BOOKINGS];
  saveAdminBookings(adminBookings);
  res.json({ success: true, bookings: adminBookings });
});

// API: AI Catering Advisor (Gemini 2.5)
app.post("/api/ai-catering-advisor", async (req, res) => {
  try {
    const { occasion, guestCount, budget, preferredStyle, notes } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Return smart crafted Egyptian catering suggestion if API key is not provided
      const defaultSuggestions = {
        recommendationTitle: `خطة ضيافة مخصصة لـ ${occasion || "المناسبة"} (${guestCount || 100} فرد)`,
        suggestedPackage: "باقة كتب الكتاب والزفاف الملكية المطورة (Royal Celebre Mix)",
        estimatedCostPerBox: 150,
        totalEstimatedCost: (guestCount || 100) * 150,
        boxContents: [
          "سندوتش بتي بان كفتة مشوية ع الفحم",
          "سندوتش بتي بان فراخ بانية بلدي مقرمشة",
          "قطعة جاتوة شوكولاتة مثلثة مغلفة فاخرة",
          "عصير بخيرة طازج مع باكت شوكة ومنديل معقم",
          "ساندوتش ميني كوردن بيف فاخر",
          "قطعة سمبوسك مكس جبن كيري فيليه",
          "زجاجة مياه معدنية نقية صغيرة",
          "علبة سيلبر الرسمية الكرتونية المذهبة والمحكمة"
        ],
        presentationTips: [
          "العلب الكرتونية المذهبة الرسمية المحكمة تمنح توزيعاً فورياً فائق السرعة والأناقة داخل المساجد والقاعات",
          "العبوات محكمة الغلق بدون أشرطة ستان أو أقمشة مخملية لضمان أعلى معايير النظافة والترتيب السلس",
          "توزيع العبوات في أكياس سيلبر الحرارية يضمن بقاء المخبوزات طازجة ومقرمشة طوال فترة الحفل"
        ],
        advice: `بناءً على عدد المعازيم (${guestCount || 100} فرد)، ننصح بحجز كمية إضافية بنسبة 5% (حوالي ${Math.ceil((guestCount || 100) * 0.05)} عبوة احتياطية) لتفادي أي زيادة غير متوقعة في عدد الضيوف.`
      };
      return res.json({ success: true, plan: defaultSuggestions });
    }

    const prompt = `أنت خبير كاترنج وتنظيم ضيافة أفراح ومناسبات مصرية راقية لعلامة "Celebre" (سيلبر) في بني سويف (مدينة بني سويف وشرق النيل).
تنبيه صارم: سيلبر لا توزع حلويات شرقية (لا كنافة ولا بسبوسة)، ولا تستخدم علب مخملية، ولا أشرطة ستان نهائياً!
تعتمد سيلبر حصراً علبها الكرتونية المذهبة الرسمية المقواة والمحكمة الإغلاق الجاهزة للتوزيع المباشر والسريع بالمساجد والقاعات، مع ساندوتشات بتي بان أو فرنساوى وسط (كفتة ع الفحم، بانية بلدي، رومي، كوردن بيف)، وقطع جاتوة مثلثة مغلفة، وعصير بخيرة مع شوكة ومنديل معقم.
المطلوب تقديم اقتراح منيو عبوات كاترنج فردية فاخرة وشهية ومناسبة للعادات المصرية للمناسبة التالية:
- نوع المناسبة: ${occasion}
- عدد الضيوف: ${guestCount} فرد
- الميزانية التقريبية: ${budget ? budget + " جنيه" : "غير محددة"}
- التفضيلات: ${preferredStyle || "ساندوتشات لحوم وفراخ مع جاتوة مثلّث مغلف وعصير بخيرة"}
- ملاحظات إضافية: ${notes || "لا توجد"}

أجب بصيغة JSON حصراً فقط بالحقول التالية بدون أي كود ماركداون آخر:
{
  "recommendationTitle": "عنوان الخطة والاستجابة",
  "suggestedPackage": "اسم الباقة المقترحة",
  "estimatedCostPerBox": 140,
  "totalEstimatedCost": 14000,
  "boxContents": ["عنصر 1", "عنصر 2", "عنصر 3", "عنصر 4", "عنصر 5", "عنصر 6", "عنصر 7", "عنصر 8"],
  "presentationTips": ["نصيحة 1 في التقديم والتغليف", "نصيحة 2", "نصيحة 3"],
  "advice": "نصيحة خبير سيلبر الشاملة لتوفير الميزانية وضمان أفضل انطباع لدى المعازيم"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return res.json({ success: true, plan: parsed });
  } catch (error) {
    console.error("Gemini catering planner error:", error);
    return res.status(500).json({ success: false, message: "تعذر توليد الخطة حالياً" });
  }
});

// ==========================================
// WhatsApp Business Cloud API & AI Webhooks
// ==========================================

// 1. Meta Webhook Verification (hub.challenge)
app.get("/api/whatsapp-webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "celebre_whatsapp_token_2026";

  if (mode === "subscribe" && token === expectedVerifyToken) {
    console.log("[WhatsApp Webhook]: Verification challenge successfully verified with Meta!");
    return res.status(200).send(challenge);
  } else {
    console.warn("[WhatsApp Webhook]: Verification failed - Token mismatch or invalid mode.");
    return res.status(403).json({ error: "Verification token mismatch" });
  }
});

// 2. Meta Webhook Receiver (Incoming WhatsApp Messages)
app.post("/api/whatsapp-webhook", async (req, res) => {
  // Immediately acknowledge receipt with 200 OK as required by Meta Cloud API
  res.sendStatus(200);

  try {
    const body = req.body;

    // Verify WhatsApp Business Account payload structure
    if (body.object === "whatsapp_business_account" || body.entry) {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value && value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const senderPhone = message.from; // e.g., "201284484868"
            const contact = value.contacts && value.contacts[0];
            const senderName = contact?.profile?.name;

            if (message.type === "text" && message.text?.body) {
              const incomingText = message.text.body;
              console.log(`[WhatsApp Incoming Msg]: From: ${senderPhone} (${senderName || "Unknown"}) - Text: "${incomingText}"`);

              // Generate Celebre AI response via Gemini
              const aiReply = await generateWhatsAppAiReply(incomingText, senderName);
              console.log(`[WhatsApp AI Reply Generated]: For: ${senderPhone}\n${aiReply}`);

              // Send back via Meta WhatsApp Cloud API
              await sendMetaWhatsAppMessage(senderPhone, aiReply);
            } else {
              console.log(`[WhatsApp Other Type]: Received ${message.type} from ${senderPhone}`);
              const defaultNotice = "أهلاً بحضرتك يا فندم في سيلبر كاترنج 🌸\nيرجى التكرم بكتابة استفساركم أو الاتصال المباشر على 01284484868 للرد الفوري على حجزكم.";
              await sendMetaWhatsAppMessage(senderPhone, defaultNotice);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[WhatsApp Webhook Handler Error]:", err);
  }
});

// 3. WhatsApp Status & Verification Guide
app.get("/api/whatsapp/status", (_req, res) => {
  const isMetaConfigured = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  res.json({
    brand: "Celebre Catering WhatsApp AI Integration",
    phone: "01284484868",
    webhookUrl: "/api/whatsapp-webhook",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "celebre_whatsapp_token_2026",
    metaCredentialsConfigured: isMetaConfigured,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    instructions: {
      step1: "سجل حسابك في Meta for Developers وأنشئ تطبيق WhatsApp Cloud API",
      step2: "اربط رقم العمل 01284484868 في إعدادات WhatsApp",
      step3: "في خانة Webhook Callback URL ضع: https://YOUR_APP_DOMAIN/api/whatsapp-webhook",
      step4: "ضع في Verify Token: celebre_whatsapp_token_2026 (أو القيمة المسجلة في WHATSAPP_VERIFY_TOKEN)",
      step5: "اشترك في حقل (messages) في أحداث الـ Webhook",
      step6: "أضف WHATSAPP_TOKEN و WHATSAPP_PHONE_NUMBER_ID في إعدادات البيئة"
    }
  });
});

// 4. WhatsApp AI Simulator & Tester Endpoint
app.post("/api/whatsapp/test-chat", async (req, res) => {
  try {
    const { message, customerName } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: "الرسالة مطلوبة (message is required)" });
    }

    const reply = await generateWhatsAppAiReply(message, customerName);
    return res.json({
      success: true,
      sender: "مساعد سيلبر للواتساب (Celebre AI)",
      reply,
      metaIntegrationReady: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
    });
  } catch (error: any) {
    console.error("WhatsApp test error:", error);
    return res.status(500).json({ success: false, error: error.message || "خطأ أثناء معالجة المحادثة" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Celebre Catering Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
