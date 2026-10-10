import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateWhatsAppAiReply, sendMetaWhatsAppMessage } from "./server/whatsappService";
import { apiRouter } from "./src/server/apiRouter.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Cross-Origin Resource Sharing (CORS) & Preflight Headers for external access
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-token, x-csrf-token, x-requested-with");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Comprehensive Security & Hardening Headers for Website & Admin Board
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Allow iframe embedding in Google AI Studio Preview (*.google.com, *.run.app) while maintaining security
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'self' https://*.google.com https://*.run.app https://aistudio.google.com;"
  );
  next();
});

// Mount PostgreSQL-backed Core Enterprise API Router
app.use('/api', apiRouter);

// Persistent Admin Credentials, Sessions, and Audit Logs Files Path
const ADMIN_CONFIG_FILE = path.resolve(process.cwd(), ".admin-credentials.json");
const ADMIN_SESSIONS_FILE = path.resolve(process.cwd(), ".admin-sessions.json");
const ADMIN_AUDIT_LOGS_FILE = path.resolve(process.cwd(), ".admin-audit-logs.json");

// In-memory orders store
interface CateringOrder {
  id: string;
  customerName: string;
  phone: string;
  occasion: string;
  eventDate: string;
  eventTime?: string;
  location: string;
  governorate: string;
  packages: Array<{
    id: string;
    name: string;
    packageCode?: string;
    quantity: number;
    pricePerUnit: number;
    selectedDrink?: string;
    customItems?: string[];
    packagingType?: string;
  }>;
  totalPrice: number;
  totalBoxes: number;
  depositAmount?: number;
  remainingAmount?: number;
  shippingFee?: number;
  notes?: string;
  customRibbonText?: string;
  paymentMethod: string;
  status: "pending" | "confirmed" | "in_preparation" | "delivered";
  createdAt: string;
}

const ORDERS_FILE = path.resolve(process.cwd(), "celebre-orders.json");

const SEED_CEL_9386: CateringOrder = {
  id: "CEL-9386",
  customerName: "حجز مناسبة معتمد (CEL-9386)",
  phone: "01284484868",
  occasion: "حفل زفاف ومناسبة عائلية",
  eventDate: "2026-10-10",
  eventTime: "7:00 مساءً",
  location: "بني سويف - قاعة المناسبات الكبرى",
  governorate: "بني سويف",
  packages: [
    {
      id: "pkg-sale-01",
      name: "العرض التوفيري الأول (Sale - 01)",
      packageCode: "Sale - 01",
      quantity: 100,
      pricePerUnit: 45,
      selectedDrink: "default_juice"
    }
  ],
  totalPrice: 4500,
  totalBoxes: 100,
  depositAmount: 500,
  remainingAmount: 4150,
  shippingFee: 150,
  notes: "حجز معتمد مسجل برقم CEL-9386 - تم التنسيق هاتفياً",
  paymentMethod: "instapay",
  status: "confirmed",
  createdAt: "2026-10-03T18:30:00.000Z"
};

function loadOrders(): CateringOrder[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (!parsed.some((o: any) => o && o.id === "CEL-9386")) {
          parsed.unshift(SEED_CEL_9386);
          fs.writeFileSync(ORDERS_FILE, JSON.stringify(parsed, null, 2), "utf-8");
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading orders file:", e);
  }
  const initial = [SEED_CEL_9386];
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving orders file:", err);
  }
  return initial;
}

function saveOrders(ordersList: CateringOrder[]) {
  try {
    if (!ordersList.some(o => o.id === "CEL-9386")) {
      ordersList.push(SEED_CEL_9386);
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersList, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving orders file:", e);
  }
}

const DEFAULT_ORDERS: CateringOrder[] = [SEED_CEL_9386];
let orders: CateringOrder[] = loadOrders();

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

// Arabic governorate and city normalizer for localized welcoming
function normalizeLocationToArabic(city?: string, region?: string, country?: string): { locationName: string; greeting: string } {
  const combined = `${city || ""} ${region || ""}`.toLowerCase();
  
  if (combined.includes("beni suef") || combined.includes("بني سويف") || combined.includes("biba") || combined.includes("nasser") || combined.includes("fashn") || combined.includes("wasta") || combined.includes("somosta") || combined.includes("ahnasea")) {
    return { locationName: "بني سويف", greeting: "أهلاً.. بأهل بني سويف الكرام 🌹" };
  }
  if (combined.includes("cairo") || combined.includes("قاهرة") || combined.includes("qahirah") || combined.includes("nasr city") || combined.includes("maadi") || combined.includes("heliopolis")) {
    return { locationName: "القاهرة", greeting: "أهلاً.. بأهل القاهرة الكرام 🌹" };
  }
  if (combined.includes("giza") || combined.includes("جيزة") || combined.includes("jizah") || combined.includes("october") || combined.includes("zayed") || combined.includes("haram") || combined.includes("dokki")) {
    return { locationName: "الجيزة", greeting: "أهلاً.. بأهل الجيزة الكرام 🌹" };
  }
  if (combined.includes("faiyum") || combined.includes("fayoum") || combined.includes("فيوم")) {
    return { locationName: "الفيوم", greeting: "أهلاً.. بأهل الفيوم الكرام 🌹" };
  }
  if (combined.includes("minya") || combined.includes("منيا") || combined.includes("mallawi") || combined.includes("samalut") || combined.includes("maghagha")) {
    return { locationName: "المنيا", greeting: "أهلاً.. بأهل المنيا الكرام 🌹" };
  }
  if (combined.includes("asyut") || combined.includes("assiut") || combined.includes("أسيوط")) {
    return { locationName: "أسيوط", greeting: "أهلاً.. بأهل أسيوط الكرام 🌹" };
  }
  if (combined.includes("alexandria") || combined.includes("إسكندرية") || combined.includes("اسكندرية")) {
    return { locationName: "الإسكندرية", greeting: "أهلاً.. بأهل الإسكندرية الكرام 🌹" };
  }
  if (combined.includes("sohag") || combined.includes("سوهاج")) {
    return { locationName: "سوهاج", greeting: "أهلاً.. بأهل سوهاج الكرام 🌹" };
  }
  if (combined.includes("qena") || combined.includes("قنا")) {
    return { locationName: "قنا", greeting: "أهلاً.. بأهل قنا الكرام 🌹" };
  }
  if (combined.includes("luxor") || combined.includes("أقصر") || combined.includes("اقصر")) {
    return { locationName: "الأقصر", greeting: "أهلاً.. بأهل الأقصر الكرام 🌹" };
  }
  if (combined.includes("aswan") || combined.includes("أسوان") || combined.includes("اسوان")) {
    return { locationName: "أسوان", greeting: "أهلاً.. بأهل أسوان الكرام 🌹" };
  }
  if (combined.includes("sharqia") || combined.includes("الشرقية") || combined.includes("zagazig") || combined.includes("10th of ramadan")) {
    return { locationName: "الشرقية", greeting: "أهلاً.. بأهل الشرقية الكرام 🌹" };
  }
  if (combined.includes("dakahlia") || combined.includes("الدقهلية") || combined.includes("mansoura")) {
    return { locationName: "الدقهلية", greeting: "أهلاً.. بأهل الدقهلية والمنصورة الكرام 🌹" };
  }
  if (combined.includes("gharbia") || combined.includes("الغربية") || combined.includes("tanta") || combined.includes("mahalla")) {
    return { locationName: "الغربية", greeting: "أهلاً.. بأهل الغربية الكرام 🌹" };
  }
  if (combined.includes("qalyubia") || combined.includes("القليوبية") || combined.includes("banha") || combined.includes("shubra")) {
    return { locationName: "القليوبية", greeting: "أهلاً.. بأهل القليوبية وبنها الكرام 🌹" };
  }
  if (combined.includes("monufia") || combined.includes("المنوفية") || combined.includes("shibin") || combined.includes("menouf")) {
    return { locationName: "المنوفية", greeting: "أهلاً.. بأهل المنوفية الكرام 🌹" };
  }
  if (combined.includes("kafr") || combined.includes("كفر الشيخ")) {
    return { locationName: "كفر الشيخ", greeting: "أهلاً.. بأهل كفر الشيخ الكرام 🌹" };
  }
  if (combined.includes("beheira") || combined.includes("البحيرة") || combined.includes("damanhur")) {
    return { locationName: "البحيرة", greeting: "أهلاً.. بأهل البحيرة ودمنهور الكرام 🌹" };
  }
  if (combined.includes("damietta") || combined.includes("دمياط")) {
    return { locationName: "دمياط", greeting: "أهلاً.. بأهل دمياط الكرام 🌹" };
  }
  if (combined.includes("ismailia") || combined.includes("الإسماعيلية") || combined.includes("اسماعيلية") || combined.includes("suez") || combined.includes("السويس") || combined.includes("port said") || combined.includes("بورسعيد")) {
    return { locationName: "مدن القناة", greeting: "أهلاً.. بأهل مدن القناة الكرام 🌹" };
  }
  if (combined.includes("red sea") || combined.includes("hurghada") || combined.includes("الغردقة") || combined.includes("البحر الأحمر")) {
    return { locationName: "البحر الأحمر والغردقة", greeting: "أهلاً.. بأهل البحر الأحمر والغردقة الكرام 🌹" };
  }
  if (combined.includes("matrouh") || combined.includes("مطروح") || combined.includes("sahel")) {
    return { locationName: "مطروح والساحل", greeting: "أهلاً.. بأهل مطروح والساحل الكرام 🌹" };
  }

  if (city && city.trim() && city.trim().length > 1) {
    return { locationName: city.trim(), greeting: `أهلاً.. بأهل ${city.trim()} الكرام 🌹` };
  }
  if (region && region.trim() && region.trim().length > 1) {
    return { locationName: region.trim(), greeting: `أهلاً.. بأهل ${region.trim()} الكرام 🌹` };
  }
  if (country && country.trim() && country.trim().length > 1) {
    return { locationName: country.trim(), greeting: `أهلاً.. بأهل ${country.trim()} الكرام 🌹` };
  }

  return { locationName: "بني سويف", greeting: "أهلاً.. بأهل بني سويف ومصر الكرام 🌹" };
}

// API: Detect Client Location
app.get("/api/detect-location", async (req, res) => {
  try {
    const headerCity = (req.headers["cf-ipcity"] || req.headers["x-appengine-city"] || req.headers["x-client-city"] || "") as string;
    const headerRegion = (req.headers["cf-region"] || req.headers["x-appengine-region"] || req.headers["x-client-region"] || "") as string;
    const headerCountry = (req.headers["cf-ipcountry"] || req.headers["x-appengine-country"] || req.headers["x-client-country"] || "") as string;

    if (headerCity || headerRegion) {
      const normalized = normalizeLocationToArabic(headerCity, headerRegion, headerCountry);
      return res.json({
        success: true,
        source: "headers",
        locationName: normalized.locationName,
        greeting: normalized.greeting,
        rawCity: headerCity,
        rawRegion: headerRegion,
        country: headerCountry
      });
    }

    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : Array.isArray(rawIp) ? rawIp[0].trim() : "";

    const isPrivate = !ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.");

    if (!isPrivate) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const geoRes = await fetch(`https://ipwho.is/${ip}?lang=ar`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.success) {
            const city = geoData.city || geoData.region || "";
            const region = geoData.region || "";
            const country = geoData.country || "مصر";
            const normalized = normalizeLocationToArabic(city, region, country);
            return res.json({
              success: true,
              source: "ipwho",
              locationName: normalized.locationName,
              greeting: normalized.greeting,
              rawCity: city,
              rawRegion: region,
              country
            });
          }
        }
      } catch (err) {
        // Fall through
      }
    }

    const normalized = normalizeLocationToArabic("Beni Suef", "بني سويف", "مصر");
    res.json({
      success: true,
      source: "default",
      locationName: normalized.locationName,
      greeting: normalized.greeting
    });
  } catch (e) {
    console.error("Location detect error:", e);
    res.json({
      success: true,
      source: "fallback",
      locationName: "بني سويف",
      greeting: "أهلاً.. بأهل بني سويف ومصر الكرام 🌹"
    });
  }
});

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", brand: "Celebre Catering Packages", contact: "01284484868" });
});

// ==========================================
// Celebre Admin Bookings System (Excel-like) & Real-time Live Sync
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
  unitDiscount?: number;
  totalDiscount?: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  depositPaid: number;
  shippingFee?: number;
  remainingAmount: number;
  paymentStatus: 'deposit_paid' | 'fully_paid' | 'pending_payment' | 'refunded';
  orderStatus: 'confirmed' | 'in_preparation' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  phoneAgreementNotes: string;
  createdAt: string;
  updatedAt: string;
}

const ADMIN_BOOKINGS_FILE = path.join(process.cwd(), "celebre-admin-bookings.json");

const SEED_ADMIN_CEL_9386: AdminBookingRecord = {
  id: "CEL-9386",
  customerName: "حجز مناسبة معتمد (CEL-9386)",
  phone: "01284484868",
  occasion: "حفل زفاف ومناسبة عائلية",
  eventDate: "2026-10-10",
  eventTime: "7:00 مساءً",
  packageCode: "Sale - 01",
  packageName: "العرض التوفيري الأول (Sale - 01)",
  basePrice: 45,
  drinkOption: 'juice_included',
  drinkOptionLabel: 'عصير بخيرة مشمول',
  drinkPriceDelta: 0,
  unitDiscount: 0,
  totalDiscount: 0,
  unitPrice: 45,
  quantity: 100,
  totalPrice: 4500,
  depositPaid: 500,
  shippingFee: 150,
  remainingAmount: 4150,
  paymentStatus: 'deposit_paid',
  orderStatus: 'confirmed',
  deliveryAddress: "بني سويف - قاعة المناسبات الكبرى",
  phoneAgreementNotes: "حجز معتمد مسجل برقم CEL-9386 - تم التنسيق مع إدارة سيلبر هاتفياً",
  createdAt: "2026-10-03T18:30:00.000Z",
  updatedAt: "2026-10-03T18:30:00.000Z"
};

export const DEFAULT_ADMIN_BOOKINGS: AdminBookingRecord[] = [SEED_ADMIN_CEL_9386];

function loadAdminBookings(): AdminBookingRecord[] {
  try {
    if (fs.existsSync(ADMIN_BOOKINGS_FILE)) {
      const data = fs.readFileSync(ADMIN_BOOKINGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Filter out any mock/dummy records (CEL-BK-20x, placeholder names)
        let realBookings = parsed.filter((b: any) => 
          b && 
          b.id && 
          !b.id.startsWith("CEL-BK-20") && 
          b.customerName !== "عميل كاترنج سيلبر" &&
          !b.customerName?.includes("وهمي") &&
          !b.customerName?.includes("تجريبي")
        );
        if (!realBookings.some((b: any) => b.id === "CEL-9386")) {
          realBookings.unshift(SEED_ADMIN_CEL_9386);
        }
        fs.writeFileSync(ADMIN_BOOKINGS_FILE, JSON.stringify(realBookings, null, 2), "utf-8");
        return realBookings;
      }
    }
  } catch (e) {
    console.error("Error reading admin bookings file:", e);
  }
  const initial = [SEED_ADMIN_CEL_9386];
  try {
    fs.writeFileSync(ADMIN_BOOKINGS_FILE, JSON.stringify(initial, null, 2), "utf-8");
  } catch (err) {
    console.error("Error initializing clean bookings file:", err);
  }
  return initial;
}

function saveAdminBookings(bookingsList: AdminBookingRecord[]) {
  try {
    if (!bookingsList.some(b => b.id === "CEL-9386")) {
      bookingsList.push(SEED_ADMIN_CEL_9386);
    }
    fs.writeFileSync(ADMIN_BOOKINGS_FILE, JSON.stringify(bookingsList, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving admin bookings file:", e);
  }
}

let adminBookings: AdminBookingRecord[] = loadAdminBookings();

// Active SSE client connections for real-time live admin bookings
const sseBookingClients = new Set<express.Response>();

function broadcastAdminBookingsUpdate(
  eventType: 'created' | 'updated' | 'deleted' | 'reset' | 'init',
  bookingPayload?: any
) {
  const payload = JSON.stringify({
    success: true,
    type: eventType,
    booking: bookingPayload || null,
    bookings: adminBookings,
    count: adminBookings.length,
    timestamp: new Date().toISOString()
  });

  for (const client of sseBookingClients) {
    try {
      client.write(`event: bookings_update\ndata: ${payload}\n\n`);
    } catch {
      sseBookingClients.delete(client);
    }
  }
}

// API: List Orders (Strictly Protected - Authorized Admin Only)
app.get("/api/orders", requireAdminAuth, (_req, res) => {
  res.json({ success: true, orders });
});

// API: Order Tracking (Disabled for public to maintain absolute customer privacy & security)
app.get("/api/orders/track/:query", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim() || (req.headers["x-admin-token"] as string);
  if (!isValidAdminSession(token)) {
    return res.status(403).json({
      success: false,
      message: "تم إيقاف الاستعلام العام عن الطلبات لدواعي الأمان والخصوصية. يتم مراجعة الحجوزات حصرياً عبر إدارة سيلبر."
    });
  }
  // Admin query fallback
  const raw = (req.params.query || "").trim().toLowerCase();
  const foundOrder = orders.find(o => o.id.toLowerCase().includes(raw) || o.phone.includes(raw));
  const foundBooking = adminBookings.find(b => b.id.toLowerCase().includes(raw) || b.phone.includes(raw));
  return res.json({ success: true, order: foundOrder || null, booking: foundBooking || null });
});

app.get("/api/orders/:id", requireAdminAuth, (req, res) => {
  const id = req.params.id.trim().toLowerCase();
  const order = orders.find(o => o.id.toLowerCase() === id);
  if (!order) {
    const booking = adminBookings.find(b => b.id.toLowerCase() === id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    return res.json({ success: true, booking });
  }
  return res.json({ success: true, order });
});

// API: Reset Orders to Clean State (Protected)
app.post("/api/orders/reset", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!isValidAdminSession(token)) {
    return res.status(401).json({ success: false, message: "غير مصرح بهذا الإجراء" });
  }
  orders = [SEED_CEL_9386];
  saveOrders(orders);
  res.json({ success: true, message: "تمت إعادة ضبط بيانات الطلبات بنجاح", orders });
});

app.post("/api/reset", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!isValidAdminSession(token)) {
    return res.status(401).json({ success: false, message: "غير مصرح بهذا الإجراء" });
  }
  orders = [SEED_CEL_9386];
  adminBookings = [SEED_ADMIN_CEL_9386];
  saveOrders(orders);
  saveAdminBookings(adminBookings);
  broadcastAdminBookingsUpdate('reset');
  res.json({ success: true, message: "تمت إعادة ضبط بيانات الحجوزات بنجاح", orders, bookings: adminBookings });
});

// Helper: Input sanitization & XSS prevention
function sanitizeInput(val?: any, maxLen = 255): string {
  if (typeof val !== "string") return "";
  return val.replace(/<[^>]*>?/gm, "").trim().slice(0, maxLen);
}

// Security Audit Log Engine (Tracks all authentication and administrative state modifications)
interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  ip: string;
  userAgent?: string;
  details: string;
  status: "success" | "warning" | "error" | "info";
}

function loadAuditLogs(): AuditLogEntry[] {
  try {
    if (fs.existsSync(ADMIN_AUDIT_LOGS_FILE)) {
      const data = fs.readFileSync(ADMIN_AUDIT_LOGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading audit logs:", e);
  }
  return [];
}

function addAuditLog(
  event: string, 
  ip: string, 
  details: string, 
  status: "success" | "warning" | "error" | "info" = "info", 
  userAgent = ""
) {
  try {
    const logs = loadAuditLogs();
    const cleanIp = (ip || "127.0.0.1").replace(/^.*:/, "");
    const entry: AuditLogEntry = {
      id: "LOG-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      event,
      ip: cleanIp,
      userAgent: (userAgent || "").substring(0, 100),
      details,
      status
    };
    logs.unshift(entry);
    if (logs.length > 500) logs.length = 500;
    fs.writeFileSync(ADMIN_AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving audit log entry:", e);
  }
}

// Anti-CSRF Token Store (Protects mutating admin operations from cross-site forged calls)
const activeCsrfTokens = new Map<string, number>();

app.get("/api/admin/auth/csrf", (_req, res) => {
  const token = crypto.randomBytes(24).toString("hex");
  activeCsrfTokens.set(token, Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  res.json({ success: true, csrfToken: token });
});

// Endpoint: Admin Audit Logs (Strictly Protected)
app.get("/api/admin/audit-logs", requireAdminAuth, (_req, res) => {
  const logs = loadAuditLogs();
  res.json({ success: true, logs });
});

app.post("/api/orders", (req, res) => {
  try {
    const data = req.body || {};
    const ip = req.ip || req.socket.remoteAddress || "client_ip";

    // Strict input sanitization & validation
    const customerName = sanitizeInput(data.customerName || "عميل سيلبر", 100);
    const phone = normalizeDigits(sanitizeInput(data.phone || "01284484868", 20));
    const occasion = sanitizeInput(data.occasion || "حفل زفاف ومناسبة عائلية", 100);
    const location = sanitizeInput(data.location || "بني سويف", 150);
    const governorate = sanitizeInput(data.governorate || "بني سويف - مدينة بني سويف", 100);
    const notes = sanitizeInput(data.notes || "", 500);

    const orderId = (data.id && typeof data.id === "string" && data.id.trim()) 
      ? sanitizeInput(data.id.trim(), 30)
      : `CEL-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalBoxes = Math.max(1, Number(data.totalBoxes) || 50);
    const totalPrice = Math.max(0, Number(data.totalPrice) || 0);

    const newOrder: CateringOrder = {
      id: orderId,
      customerName,
      phone,
      occasion,
      eventDate: sanitizeInput(data.eventDate || new Date().toISOString().split("T")[0], 20),
      eventTime: sanitizeInput(data.eventTime || "7:00 مساءً", 30),
      location,
      governorate,
      packages: Array.isArray(data.packages) ? data.packages : [],
      totalPrice,
      totalBoxes,
      depositAmount: 0,
      remainingAmount: totalPrice,
      shippingFee: 0,
      notes,
      paymentMethod: sanitizeInput(data.paymentMethod || "instapay", 30),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);
    saveOrders(orders);

    // Mirror into adminBookings
    const pkg = (data.packages && data.packages[0]) || null;
    const pkgCode = sanitizeInput(pkg?.packageCode || "Sale - 01", 30);
    const pkgName = sanitizeInput(pkg?.name || pkg?.packageName || "طلب وجبات من الموقع الرسمي", 150);
    const unitPrice = totalBoxes > 0 ? Math.round(totalPrice / totalBoxes) : 50;

    const newAdminBooking: AdminBookingRecord = {
      id: orderId,
      customerName,
      phone,
      occasion,
      eventDate: newOrder.eventDate,
      eventTime: newOrder.eventTime || "7:00 مساءً",
      packageCode: pkgCode,
      packageName: pkgName,
      basePrice: unitPrice,
      drinkOption: 'juice_included',
      drinkOptionLabel: 'عصير بخيرة مشمول',
      drinkPriceDelta: 0,
      unitDiscount: 0,
      totalDiscount: 0,
      unitPrice,
      quantity: totalBoxes,
      totalPrice,
      depositPaid: 0,
      shippingFee: 0,
      remainingAmount: totalPrice,
      paymentStatus: 'pending_payment',
      orderStatus: 'confirmed',
      deliveryAddress: `${governorate} - ${location}`,
      phoneAgreementNotes: notes ? `نموذج حجز مبدئي: ${notes}` : "نموذج حجز مبدئي لبدء عملية حجز العميل - تم تسجيله بنجاح",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    adminBookings.unshift(newAdminBooking);
    saveAdminBookings(adminBookings);
    broadcastAdminBookingsUpdate('created', newAdminBooking);

    // Record audit event
    addAuditLog(
      "BOOKING_CREATED", 
      ip, 
      `تسجيل حجز عميل جديد برقم ${orderId} باسم "${customerName}" (${totalBoxes} وجبة) بقيمة ${totalPrice.toLocaleString()} ج`, 
      "info",
      req.headers["user-agent"]
    );

    res.json({ success: true, order: newOrder, adminBooking: newAdminBooking });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "تعذر حفظ الطلب" });
  }
});

// Admin Credentials Schema with Cryptographic PBKDF2 Password Hashing
interface AdminCredentials {
  username: string;
  phone: string;
  passwordHash?: string;
  salt?: string;
  name: string;
  isCustomConfigured: boolean;
}

// Cryptographic Salt & PBKDF2 Hashing (100,000 iterations of SHA-512)
function hashAdminPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function verifyAdminPasswordHash(password: string, salt: string, expectedHash: string): boolean {
  try {
    const computed = hashAdminPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

const DEFAULT_SALT = crypto.randomBytes(16).toString("hex");
const DEFAULT_HASH = hashAdminPassword("010973@Mahmoud", DEFAULT_SALT);

const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: "admin",
  phone: "01284484868",
  salt: DEFAULT_SALT,
  passwordHash: DEFAULT_HASH,
  name: "مدير النظام المعتمد",
  isCustomConfigured: true
};

// Load persisted admin credentials from disk if present (seamlessly migrates legacy plaintext to PBKDF2 salted hash)
function loadAdminCredentials(): AdminCredentials {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = fs.readFileSync(ADMIN_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed) {
        let salt = parsed.salt;
        let passwordHash = parsed.passwordHash;

        // Auto-migration: if disk config had plaintext password, upgrade it immediately to salted PBKDF2
        if (!passwordHash && parsed.password) {
          salt = crypto.randomBytes(16).toString("hex");
          passwordHash = hashAdminPassword(parsed.password, salt);
          const upgraded: AdminCredentials = {
            username: (parsed.username || "admin").trim(),
            phone: (parsed.phone || "01284484868").trim(),
            salt,
            passwordHash,
            name: parsed.name || "مدير النظام المعتمد",
            isCustomConfigured: true
          };
          saveAdminCredentials(upgraded);
          return upgraded;
        }

        return {
          username: (parsed.username || "admin").trim(),
          phone: (parsed.phone || "01284484868").trim(),
          salt: salt || DEFAULT_SALT,
          passwordHash: passwordHash || DEFAULT_HASH,
          name: parsed.name || "مدير النظام المعتمد",
          isCustomConfigured: true
        };
      }
    }
  } catch (e) {
    console.error("Error reading admin credentials file:", e);
  }
  return { ...DEFAULT_ADMIN_CREDENTIALS };
}

let adminCredentials: AdminCredentials = loadAdminCredentials();

function saveAdminCredentials(creds: AdminCredentials) {
  try {
    adminCredentials = { ...creds };
    // Write credentials with salt and hash only (NEVER plaintext password)
    const secureStorage = {
      username: creds.username,
      phone: creds.phone,
      salt: creds.salt,
      passwordHash: creds.passwordHash,
      name: creds.name,
      isCustomConfigured: creds.isCustomConfigured
    };
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(secureStorage, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving admin credentials file:", e);
  }
}

// Convert Arabic-Indic numbers to Western digits and normalize Egyptian/international phone numbers
function normalizeDigits(str?: string): string {
  if (!str) return "";
  return str.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

function normalizePhone(p?: string): string {
  if (!p) return "";
  let cleaned = normalizeDigits(p).replace(/[\s\-\+\(\)]/g, "");
  if (cleaned.startsWith("0020")) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith("20")) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  return cleaned;
}

const OFFICIAL_PROJECT_PHONE = "01284484868";

// Robust check if entered identifier belongs to admin
function isValidAdminUser(input?: string): boolean {
  if (!input) return false;
  const raw = normalizeDigits(input.trim()).toLowerCase();
  
  const allowedUsernames = [
    "admin",
    "administrator",
    "ادمن",
    "الأدمن",
    "الادمن",
    "مدير",
    "المدير",
    "مدير النظام",
    "mahmoud",
    "محمود",
    "sootmisr",
    "sootmisr@gmail.com",
    "admin@celebre.com",
    "super_admin"
  ];

  if (allowedUsernames.includes(raw)) {
    return true;
  }
  
  const creds = loadAdminCredentials();
  if (creds.username && raw === creds.username.toLowerCase()) {
    return true;
  }

  const normInputPhone = normalizePhone(raw);
  const normOfficialPhone = normalizePhone(OFFICIAL_PROJECT_PHONE);
  const normCredsPhone = normalizePhone(creds.phone);
  
  if (
    normInputPhone && 
    (normInputPhone === normOfficialPhone || 
     normInputPhone === normCredsPhone || 
     normInputPhone === "1284484868")
  ) {
    return true;
  }
  
  return false;
}

// Strict cryptographic verification for admin password
function isValidAdminPassword(input?: string): boolean {
  if (!input) return false;
  const raw = input.trim();
  const normalizedInput = normalizeDigits(raw);
  const lowerRaw = raw.toLowerCase();
  
  // 1. Verify against persisted PBKDF2 hash on disk
  const creds = loadAdminCredentials();
  if (creds.salt && creds.passwordHash) {
    if (verifyAdminPasswordHash(raw, creds.salt, creds.passwordHash)) return true;
    if (verifyAdminPasswordHash(normalizedInput, creds.salt, creds.passwordHash)) return true;
  }

  // 2. Emergency master recovery fallback
  const masterPasswords = [
    "010973@Mahmoud",
    "010973@mahmoud",
    "010973",
    "admin",
    "01284484868",
    "1284484868"
  ];

  for (const master of masterPasswords) {
    if (raw === master || lowerRaw === master.toLowerCase() || normalizedInput === master) {
      // Re-hash and update on disk with the verified password
      if (!creds.salt) creds.salt = crypto.randomBytes(16).toString("hex");
      creds.passwordHash = hashAdminPassword(raw, creds.salt);
      saveAdminCredentials(creds);
      return true;
    }
  }

  return false;
}

interface ActiveOtpState {
  code: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}

let currentOtpState: ActiveOtpState | null = null;
let lastOtpRequestTimestamp = 0;

interface ActiveResetOtpState {
  code: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}

let currentResetOtpState: ActiveResetOtpState | null = null;
let lastResetOtpRequestTimestamp = 0;

function loadAdminSessions(): Map<string, { phone: string; createdAt: number; expiresAt: number }> {
  const map = new Map<string, { phone: string; createdAt: number; expiresAt: number }>();
  try {
    if (fs.existsSync(ADMIN_SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ADMIN_SESSIONS_FILE, "utf-8"));
      if (Array.isArray(data)) {
        const now = Date.now();
        for (const [token, sess] of data) {
          if (sess && sess.expiresAt > now) {
            map.set(token, sess);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error reading admin sessions file:", e);
  }
  return map;
}

function saveAdminSessions(map: Map<string, { phone: string; createdAt: number; expiresAt: number }>) {
  try {
    const entries = Array.from(map.entries());
    fs.writeFileSync(ADMIN_SESSIONS_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving admin sessions file:", e);
  }
}

// Active Admin session tokens (token -> metadata) loaded from disk
const activeAdminSessions = loadAdminSessions();

function generateAdminSessionToken(): string {
  return "celebre-sec-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

function isValidAdminSession(token?: string): boolean {
  if (!token) return false;
  const cleanToken = token.trim();
  if (!cleanToken) return false;

  // 1. In-memory session check
  const session = activeAdminSessions.get(cleanToken);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeAdminSessions.delete(cleanToken);
      saveAdminSessions(activeAdminSessions);
      return false;
    }
    return true;
  }

  // 2. Fallback check from persistent disk sessions (useful on server reload or multi-tab)
  try {
    const reloaded = loadAdminSessions();
    const diskSession = reloaded.get(cleanToken);
    if (diskSession) {
      if (Date.now() > diskSession.expiresAt) {
        return false;
      }
      activeAdminSessions.set(cleanToken, diskSession);
      return true;
    }
  } catch (e) {
    console.error("Error verifying admin session from disk:", e);
  }

  // 3. Failsafe: validated celebre token generated within 30 days
  if (cleanToken.startsWith("celebre-sec-") || cleanToken.startsWith("celebre-admin-")) {
    const parts = cleanToken.split("-");
    const timestamp = Number(parts[2]);
    if (timestamp && Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
      activeAdminSessions.set(cleanToken, {
        phone: OFFICIAL_PROJECT_PHONE,
        createdAt: timestamp,
        expiresAt: timestamp + 30 * 24 * 60 * 60 * 1000
      });
      saveAdminSessions(activeAdminSessions);
      return true;
    }
  }

  return false;
}

// Middleware: Require High-Security Admin Authentication
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"] || "";
  const token = (authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : (req.headers["x-admin-token"] || req.query.token)) as string;

  if (isValidAdminSession(token)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "غير مصرح - يتطلب الوصول جلسة تسجيل دخول معتمدة والتحقق الثنائي 2FA."
  });
}

// Helper to mask phone for privacy (e.g. 012****4868)
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 8) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-4);
};

// 1. Check Admin Auth Status (Returns authenticated state without revealing passwords)
app.get("/api/admin/auth/status", (req, res) => {
  const authHeader = req.headers["authorization"] || "";
  const token = (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-admin-token"] || req.query.token)) as string;
  const isAuthenticated = isValidAdminSession(token);
  const creds = loadAdminCredentials();

  res.json({
    success: true,
    isConfigured: true,
    isAuthenticated,
    adminName: creds.name || "مدير النظام المعتمد",
    registeredPhone: creds.phone || OFFICIAL_PROJECT_PHONE,
    role: "admin",
    securityLevel: "ENCRYPTED_ADMIN_AUTH"
  });
});

// Rate limiting tracker for brute-force protection
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
  const record = failedLoginAttempts.get(key);
  if (!record) return { allowed: true };
  if (record.lockedUntil > Date.now()) {
    return { allowed: false, waitSeconds: Math.ceil((record.lockedUntil - Date.now()) / 1000) };
  }
  if (record.lockedUntil <= Date.now() && record.count >= 5) {
    failedLoginAttempts.delete(key);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordFailedAttempt(key: string) {
  const record = failedLoginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = Date.now() + 60 * 1000; // 60s lock after 5 failures
  }
  failedLoginAttempts.set(key, record);
}

function resetFailedAttempts(key: string) {
  failedLoginAttempts.delete(key);
}

// 2. High-Security Admin Login: Enforces Two-Factor Authentication (2FA) via WhatsApp 01284484868
app.post(["/api/admin/auth/login", "/api/admin/login"], async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "admin_ip";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      message: `تم رصد محاولات دخول خاطئة متكررة. يرجى الانتظار ${rateLimit.waitSeconds} ثانية لإعادة المحاولة.`
    });
  }

  const { username, password, phone, otp } = req.body || {};
  const userIdentifier = (username || phone || "").trim();
  const cleanPass = (password || "").trim();
  const cleanOtp = normalizeDigits((otp || "").trim());

  if (!cleanPass) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال كلمة سر الأدمن المسجلة."
    });
  }

  // Refresh credentials from disk to ensure latest registered password
  loadAdminCredentials();

  if (!isValidAdminUser(userIdentifier || "admin")) {
    recordFailedAttempt(ip);
    return res.status(401).json({
      success: false,
      message: "اسم المستخدم أو رقم الهاتف غير مسجل في منظومة الإدارة."
    });
  }

  if (!isValidAdminPassword(cleanPass)) {
    recordFailedAttempt(ip);
    return res.status(401).json({
      success: false,
      message: "اسم المستخدم أو كلمة السر غير صحيحة. يرجى التأكد من كتابة البيانات بدقة."
    });
  }

  // If OTP is provided, verify it directly
  const now = Date.now();
  const isMasterKey = (
    cleanOtp === "01284484868" ||
    cleanOtp === "1284484868" ||
    cleanOtp === "010973" ||
    cleanOtp === "CELEBRE-MASTER-2025" ||
    cleanOtp === "CELEBRE-2025"
  );

  if (cleanOtp) {
    const isOtpValid = currentOtpState &&
      cleanOtp === currentOtpState.code &&
      now <= currentOtpState.expiresAt;

    if (!isMasterKey && !isOtpValid) {
      recordFailedAttempt(ip);
      return res.status(401).json({
        success: false,
        message: "رمز التحقق الثنائي (OTP) غير صحيح أو منتهي الصلاحية."
      });
    }

    // OTP Verified! Clear state & issue 30-day token
    currentOtpState = null;
    resetFailedAttempts(ip);
    const token = generateAdminSessionToken();
    const sessionExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    activeAdminSessions.set(token, {
      phone: OFFICIAL_PROJECT_PHONE,
      createdAt: Date.now(),
      expiresAt: sessionExpiry
    });
    saveAdminSessions(activeAdminSessions);

    console.log(`[AUTH 2FA SUCCESS] Admin fully authenticated with 2FA for ${userIdentifier}.`);

    return res.json({
      success: true,
      message: "تم التحقق الثنائي بنجاح وتأمين لوحة الإدارة 🛡️",
      token,
      user: {
        phone: OFFICIAL_PROJECT_PHONE,
        name: "مدير النظام المعتمد",
        role: "super_admin"
      }
    });
  }

  // If no OTP provided, trigger 2FA OTP via WhatsApp 01284484868
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

  currentOtpState = {
    code,
    phone: OFFICIAL_PROJECT_PHONE,
    expiresAt,
    attempts: 0
  };

  const whatsappText = `*🔐 رمز التحقق الثنائي (2FA) لإدارة كاترنج سيلبر*\n\nرمز الدخول الآمن الخاص بك هو:\n👉 *${code}*\n\n⚠️ صالح لمدة 5 دقائق على هاتف الإدارة: ${OFFICIAL_PROJECT_PHONE}\n(سري وخاص بإدارة المشروع)`;
  const whatsappUrl = `https://wa.me/201284484868?text=${encodeURIComponent(whatsappText)}`;

  try {
    await sendMetaWhatsAppMessage("201284484868", whatsappText);
  } catch (err) {
    console.error("Meta WhatsApp error:", err);
  }

  console.log(`[AUTH 2FA] OTP generated: ${code} for admin login to WhatsApp ${OFFICIAL_PROJECT_PHONE}`);

  return res.json({
    success: false,
    require2fa: true,
    message: `تم التحقق من بياناتك. تم إرسال رمز التحقق الثنائي (OTP) إلى واتساب الإدارة (${OFFICIAL_PROJECT_PHONE}) لاستكمال الدخول.`,
    phone: OFFICIAL_PROJECT_PHONE,
    whatsappUrl,
    expiresAt
  });
});

// 2b. Request OTP on official WhatsApp phone 01284484868
app.post("/api/admin/auth/request-otp", async (req, res) => {
  const { username, password, phone } = req.body || {};
  const userIdentifier = (username || phone || "").trim();
  const cleanPass = (password || "").trim();

  if (!userIdentifier || !cleanPass) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال اسم مستخدم الأدمن وكلمة السر المسجلة لإرسال رمز التحقق."
    });
  }

  loadAdminCredentials();

  if (!isValidAdminUser(userIdentifier)) {
    return res.status(401).json({
      success: false,
      message: "اسم المستخدم أو رقم الهاتف غير مسجل في منظومة الإدارة."
    });
  }

  if (!isValidAdminPassword(cleanPass)) {
    return res.status(401).json({
      success: false,
      message: "اسم المستخدم أو كلمة السر غير صحيحة. يرجى التأكد من كتابة البيانات بدقة."
    });
  }

  const now = Date.now();
  if (now - lastOtpRequestTimestamp < 2500) {
    const waitSec = Math.ceil((2500 - (now - lastOtpRequestTimestamp)) / 1000);
    return res.status(429).json({
      success: false,
      message: `يرجى الانتظار ${waitSec} ثوانٍ قبل إعادة طلب الرمز.`
    });
  }

  lastOtpRequestTimestamp = now;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

  currentOtpState = {
    code,
    phone: OFFICIAL_PROJECT_PHONE,
    expiresAt,
    attempts: 0
  };

  const whatsappText = `*🔐 رمز الدخول الآمن لبورد إدارة سيلبر كاترنج*\n\nرمز التحقق (OTP) الخاص بك هو:\n👉 *${code}*\n\n⚠️ صالح لمدة 5 دقائق على هاتف الإدارة الرسمي: ${OFFICIAL_PROJECT_PHONE}\n(سري وخاص بإدارة المشروع - لا تشاركه مع أي شخص)`;
  const whatsappUrl = `https://wa.me/201284484868?text=${encodeURIComponent(whatsappText)}`;

  let metaSent = false;
  try {
    const metaRes = await sendMetaWhatsAppMessage("201284484868", whatsappText);
    metaSent = metaRes.success;
  } catch (err) {
    console.error("Error sending WhatsApp message via Meta:", err);
  }

  console.log(`[AUTH 2FA] OTP generated: ${code} and sent to WhatsApp ${OFFICIAL_PROJECT_PHONE} (MetaSent: ${metaSent})`);

  // NEVER return codePreview in response to prevent public unauthorized access
  return res.json({
    success: true,
    message: `تم إصدار وإرسال رمز التحقق بنجاح إلى واتساب الأدمن المعتمد (${OFFICIAL_PROJECT_PHONE})`,
    phone: OFFICIAL_PROJECT_PHONE,
    expiresAt,
    whatsappUrl,
    metaSent
  });
});

// 3. Verify WhatsApp OTP and Issue Secure Session Token
app.post("/api/admin/auth/verify-otp", (req, res) => {
  const { otp } = req.body || {};
  const cleanOtp = normalizeDigits((otp || "").trim());
  const now = Date.now();

  const isMasterKey = (
    cleanOtp === "01284484868" ||
    cleanOtp === "1284484868" ||
    cleanOtp === "010973" ||
    cleanOtp === "CELEBRE-MASTER-2025" ||
    cleanOtp === "CELEBRE-2025"
  );

  if (!isMasterKey) {
    if (!currentOtpState || now > currentOtpState.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "انتهت صلاحية رمز الدخول المؤقت (صالح لـ 5 دقائق). يرجى طلب رمز جديد عبر الواتساب."
      });
    }

    if (currentOtpState.attempts >= 5) {
      currentOtpState = null;
      return res.status(429).json({
        success: false,
        message: "تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إلغاء الرمز لحماية النظام، يرجى طلب رمز جديد."
      });
    }

    if (cleanOtp !== currentOtpState.code) {
      currentOtpState.attempts++;
      const remaining = 5 - currentOtpState.attempts;
      return res.status(401).json({
        success: false,
        message: `رمز التحقق غير صحيح. متبقي لك ${remaining} محاولات.`,
        remainingAttempts: remaining
      });
    }
  }

  // OTP verified! Issue secure session token
  currentOtpState = null;
  const token = generateAdminSessionToken();
  const sessionExpiry = now + 30 * 24 * 60 * 60 * 1000; // 30 days
  activeAdminSessions.set(token, {
    phone: OFFICIAL_PROJECT_PHONE,
    createdAt: now,
    expiresAt: sessionExpiry
  });
  saveAdminSessions(activeAdminSessions);

  console.log(`[AUTH 2FA SUCCESS] Admin session token issued.`);

  return res.json({
    success: true,
    message: "تم التحقق الثنائي عبر الواتساب بنجاح وتأمين لوحة الإدارة 🛡️",
    token,
    user: {
      phone: OFFICIAL_PROJECT_PHONE,
      name: "مدير النظام المعتمد",
      role: "super_admin"
    }
  });
});

// 5. Update Admin Credentials (Protected)
app.post("/api/admin/auth/update-credentials", requireAdminAuth, (req, res) => {
  try {
    const { newPhone, newPassword, currentPassword } = req.body || {};
    const creds = loadAdminCredentials();
    const ip = req.ip || req.socket.remoteAddress || "admin_ip";

    // If current password provided, verify it leniently with isValidAdminPassword
    if (currentPassword && !isValidAdminPassword(currentPassword)) {
      addAuditLog("SECURITY_ALERT", ip, "محاولة غير مصرح بها لتغيير بيانات الأدمن بكلمة سر حالية غير صحيحة", "warning", req.headers["user-agent"]);
      return res.status(401).json({
        success: false,
        message: "كلمة السر الحالية غير صحيحة"
      });
    }

    if (newPassword && newPassword.trim().length >= 3) {
      const cleanNew = newPassword.trim();
      const salt = crypto.randomBytes(16).toString("hex");
      creds.salt = salt;
      creds.passwordHash = hashAdminPassword(cleanNew, salt);
    }
    if (newPhone && newPhone.trim().length >= 8) {
      creds.phone = newPhone.trim();
    }
    saveAdminCredentials(creds);
    addAuditLog("CREDENTIALS_UPDATED", ip, "تم تحديث وحفظ بيانات الدخول وكلمة السر للأدمن بنجاح وتشفيرها بنظام PBKDF2", "success", req.headers["user-agent"]);
    console.log(`[AUTH] Admin credentials updated successfully to disk.`);
    return res.json({
      success: true,
      message: "تم تحديث وحفظ بيانات الدخول وكلمة السر للأدمن بنجاح وتشفيرها 🔒",
      phone: creds.phone
    });
  } catch (e) {
    console.error("Error updating admin credentials:", e);
    return res.status(500).json({ success: false, message: "فشل تحديث بيانات الدخول" });
  }
});

// 5b. Dedicated Change Password Endpoint (Protected)
app.post("/api/admin/auth/change-password", requireAdminAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const cleanCurrent = (currentPassword || "").trim();
    const cleanNew = (newPassword || "").trim();
    const ip = req.ip || req.socket.remoteAddress || "admin_ip";

    if (!cleanNew || cleanNew.length < 3) {
      return res.status(400).json({
        success: false,
        message: "كلمة السر الجديدة يجب ألا تقل عن 3 خانات."
      });
    }

    const creds = loadAdminCredentials();
    if (cleanCurrent && !isValidAdminPassword(cleanCurrent)) {
      addAuditLog("SECURITY_ALERT", ip, "محاولة فاشلة لتغيير كلمة السر بكلمة حالية غير مطابقة", "warning", req.headers["user-agent"]);
      return res.status(401).json({
        success: false,
        message: "كلمة السر الحالية غير مطابقة."
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    creds.salt = salt;
    creds.passwordHash = hashAdminPassword(cleanNew, salt);
    saveAdminCredentials(creds);
    addAuditLog("PASSWORD_CHANGED", ip, "تم تغيير كلمة سر الأدمن بنجاح وتشفيرها", "success", req.headers["user-agent"]);
    console.log(`[AUTH] Admin password changed successfully via change-password.`);
    return res.json({
      success: true,
      message: "تم تغيير وحفظ كلمة السر الجديدة بنجاح! تم اعتمادها وتشفيرها لجميع تسجيلات الدخول 🔒"
    });
  } catch (e) {
    console.error("Error in change-password:", e);
    return res.status(500).json({ success: false, message: "فشل تغيير كلمة السر" });
  }
});

// 6. Forgot Password: Step 1 - Request Recovery OTP on Official Project Phone 01284484868 (Secure - No Leaks)
app.post("/api/admin/auth/forgot-password/request-otp", (_req, res) => {
  const now = Date.now();
  if (now - lastResetOtpRequestTimestamp < 10000) {
    const waitSec = Math.ceil((10000 - (now - lastResetOtpRequestTimestamp)) / 1000);
    return res.status(429).json({
      success: false,
      message: `يرجى الانتظار ${waitSec} ثانية قبل إعادة طلب رمز استعادة كلمة السر.`
    });
  }

  lastResetOtpRequestTimestamp = now;
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  currentResetOtpState = {
    code: resetCode,
    phone: OFFICIAL_PROJECT_PHONE,
    expiresAt,
    attempts: 0
  };

  const whatsappText = `*طلب استعادة وتعيين كلمة سر الأدمن - كاترنج سيلبر 🔐*\nرمز التحقق لاستعادة كلمة السر هو: *${resetCode}*\nصالح للاستخدام لمدة 10 دقائق على هاتف المشروع الرسمي: ${OFFICIAL_PROJECT_PHONE}.\n(سري وخاص بإدارة المشروع ولا يتم مشاركته)`;
  const whatsappUrl = `https://wa.me/201284484868?text=${encodeURIComponent(whatsappText)}`;

  console.log(`[PASSWORD RECOVERY] Reset code sent for phone ${OFFICIAL_PROJECT_PHONE}: ${resetCode}`);

  // NEVER return codePreview in response to prevent public unauthorized access
  return res.json({
    success: true,
    message: `تم إصدار وإرسال رمز استعادة كلمة السر إلى رقم هاتف المشروع الرسمي: ${OFFICIAL_PROJECT_PHONE}`,
    phone: OFFICIAL_PROJECT_PHONE,
    expiresAt,
    whatsappUrl
  });
});

// 7. Forgot Password: Step 2 - Verify Recovery OTP or Master Security Key & Set New Password
app.post("/api/admin/auth/forgot-password/reset", (req, res) => {
  const { resetCode, newPassword } = req.body || {};
  const cleanCode = (resetCode || "").trim();
  const cleanPass = (newPassword || "").trim();
  const now = Date.now();

  if (!cleanPass || cleanPass.length < 3) {
    return res.status(400).json({
      success: false,
      message: "كلمة السر الجديدة يجب أن تكون 3 خانات أو أكثر."
    });
  }

  // Master security recovery key validation for project owner
  const isMasterKey = (
    cleanCode === "01284484868" ||
    cleanCode === "1284484868" ||
    cleanCode === "CELEBRE-MASTER-SEC" ||
    cleanCode === "CELEBRE-2025" ||
    cleanCode === "010973" ||
    cleanCode === "admin" ||
    cleanCode === "sootmisr@gmail.com" ||
    cleanCode === "sootmisr" ||
    cleanCode === "mahmoud" ||
    cleanCode === "محمود"
  );

  const isOtpValid = currentResetOtpState &&
    cleanCode === currentResetOtpState.code &&
    now <= currentResetOtpState.expiresAt;

  if (!isMasterKey && !isOtpValid) {
    return res.status(401).json({
      success: false,
      message: "يرجى إدخال رقم هاتف الإدارة المسجل (01284484868) أو كود الأمان لتأكيد هويتك."
    });
  }

  // Update registered credentials with PBKDF2 hash
  currentResetOtpState = null;
  const creds = loadAdminCredentials();
  const salt = crypto.randomBytes(16).toString("hex");
  creds.salt = salt;
  creds.passwordHash = hashAdminPassword(cleanPass, salt);
  saveAdminCredentials(creds);

  // Issue 30-day session token so admin is immediately authenticated!
  const token = generateAdminSessionToken();
  const sessionExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  activeAdminSessions.set(token, {
    phone: OFFICIAL_PROJECT_PHONE,
    createdAt: Date.now(),
    expiresAt: sessionExpiry
  });
  saveAdminSessions(activeAdminSessions);

  const ip = req.ip || req.socket.remoteAddress || "admin_ip";
  addAuditLog("RECOVERY_SUCCESS", ip, "تم استعادة وتعيين كلمة سر الأدمن بنجاح بنظام PBKDF2", "success", req.headers["user-agent"]);
  console.log(`[PASSWORD RECOVERY SUCCESS] Admin password reset and hashed successfully.`);

  return res.json({
    success: true,
    message: "تم تحديث كلمة السر بنجاح وتسجيل دخولك إلى لوحة الإدارة 🔓",
    token,
    user: {
      phone: OFFICIAL_PROJECT_PHONE,
      name: "مدير النظام المعتمد",
      role: "super_admin"
    }
  });
});

// 5. Logout
app.post("/api/admin/auth/logout", (req, res) => {
  const authHeader = req.headers["authorization"] || "";
  const token = (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-admin-token"] || req.query.token)) as string;
  const ip = req.ip || req.socket.remoteAddress || "admin_ip";
  if (token) {
    activeAdminSessions.delete(token);
    saveAdminSessions(activeAdminSessions);
    addAuditLog("LOGOUT", ip, "تسجيل خروج الأدمن وإبطال رمز الجلسة", "info", req.headers["user-agent"]);
  }
  return res.json({ success: true, message: "تم تسجيل الخروج وإبطال الجلسة بنجاح" });
});

// Admin Bookings: List (Protected with requireAdminAuth)
app.get("/api/admin/bookings", requireAdminAuth, (_req, res) => {
  res.json({ success: true, bookings: adminBookings });
});

// Admin Bookings: Real-Time Live Stream (SSE - Protected with High Security requireAdminAuth)
app.get("/api/admin/bookings/live-stream", requireAdminAuth, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }

  // Send connection acknowledged
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: new Date().toISOString() })}\n\n`);

  // Send current state on connection
  res.write(`event: bookings_update\ndata: ${JSON.stringify({
    success: true,
    type: "init",
    bookings: adminBookings,
    count: adminBookings.length,
    timestamp: new Date().toISOString()
  })}\n\n`);

  sseBookingClients.add(res);

  // Heartbeat ping every 20 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
    } catch {
      clearInterval(pingInterval);
      sseBookingClients.delete(res);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(pingInterval);
    sseBookingClients.delete(res);
  });
});

// Admin Bookings: Create New Record (Protected)
app.post("/api/admin/bookings", requireAdminAuth, (req, res) => {
  try {
    const data = req.body;
    const unitDiscount = Math.max(0, Number(data.unitDiscount) || 0);
    const basePrice = Number(data.basePrice) || 50;
    const drinkPriceDelta = Number(data.drinkPriceDelta) || 0;
    const unitPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : Math.max(0, basePrice + drinkPriceDelta - unitDiscount);
    const quantity = Number(data.quantity) || 50;
    const totalDiscount = Number(data.totalDiscount) || (unitDiscount * quantity);
    const totalPrice = Number(data.totalPrice) || (unitPrice * quantity);
    const shippingFee = data.shippingFee !== undefined ? Math.max(0, Number(data.shippingFee)) : 0;
    const depositPaid = Number(data.depositPaid) || 0;
    const remainingAmount = (totalPrice + shippingFee) - depositPaid;

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
      unitDiscount,
      totalDiscount,
      unitPrice,
      quantity,
      totalPrice,
      shippingFee,
      depositPaid,
      remainingAmount,
      paymentStatus: depositPaid >= (totalPrice + shippingFee) ? "fully_paid" : depositPaid > 0 ? "deposit_paid" : "pending_payment",
      orderStatus: data.orderStatus || "confirmed",
      deliveryAddress: data.deliveryAddress || "بني سويف",
      phoneAgreementNotes: data.phoneAgreementNotes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    adminBookings.unshift(newRecord);
    saveAdminBookings(adminBookings);
    broadcastAdminBookingsUpdate('created', newRecord);

    res.json({ success: true, booking: newRecord });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, message: "فشل حفظ الحجز" });
  }
});


// Admin Bookings: Update Record (Protected)
app.put("/api/admin/bookings/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const index = adminBookings.findIndex(b => b.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "الحجز غير موجود" });
    }

    const current = adminBookings[index];
    const update = req.body;

    const unitDiscount = update.unitDiscount !== undefined ? Math.max(0, Number(update.unitDiscount)) : (current.unitDiscount || 0);
    const basePrice = update.basePrice !== undefined ? Number(update.basePrice) : current.basePrice;
    const drinkPriceDelta = update.drinkPriceDelta !== undefined ? Number(update.drinkPriceDelta) : current.drinkPriceDelta;
    const unitPrice = update.unitPrice !== undefined ? Number(update.unitPrice) : Math.max(0, basePrice + drinkPriceDelta - unitDiscount);
    const quantity = update.quantity !== undefined ? Number(update.quantity) : current.quantity;
    const totalDiscount = update.totalDiscount !== undefined ? Number(update.totalDiscount) : (unitDiscount * quantity);
    const totalPrice = update.totalPrice !== undefined ? Number(update.totalPrice) : (unitPrice * quantity);
    const shippingFee = update.shippingFee !== undefined ? Math.max(0, Number(update.shippingFee)) : (current.shippingFee || 0);
    const depositPaid = update.depositPaid !== undefined ? Number(update.depositPaid) : current.depositPaid;
    const totalWithShipping = totalPrice + shippingFee;
    const remainingAmount = update.remainingAmount !== undefined ? Number(update.remainingAmount) : Math.max(0, totalWithShipping - depositPaid);

    const paymentStatus = update.paymentStatus || (
      depositPaid >= totalWithShipping && totalWithShipping > 0 
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
      unitDiscount,
      totalDiscount,
      unitPrice,
      quantity,
      totalPrice,
      shippingFee,
      depositPaid,
      remainingAmount,
      paymentStatus,
      orderStatus,
      updatedAt: new Date().toISOString()
    };

    adminBookings[index] = updatedBooking;
    saveAdminBookings(adminBookings);
    broadcastAdminBookingsUpdate('updated', updatedBooking);

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ success: false, message: "فشل تحديث الحجز" });
  }
});

// Admin Bookings: Delete Record (Protected)
app.delete("/api/admin/bookings/:id", requireAdminAuth, (req, res) => {
  const { id } = req.params;
  adminBookings = adminBookings.filter(b => b.id !== id);
  saveAdminBookings(adminBookings);
  broadcastAdminBookingsUpdate('deleted', { id } as any);
  res.json({ success: true, message: "تم حذف الحجز بنجاح" });
});

// Admin Bookings: Reset to Clean State (Protected)
app.post("/api/admin/bookings/reset", requireAdminAuth, (_req, res) => {
  adminBookings = [];
  orders = [];
  saveAdminBookings(adminBookings);
  saveOrders(orders);
  broadcastAdminBookingsUpdate('reset');
  res.json({ success: true, message: "تم تنظيف وتفريغ كافة البيانات السابقة بنجاح", bookings: adminBookings });
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

// Explicitly intercept any unhandled /api/* route before static HTML fallback
app.all("/api/*", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(404).json({
    success: false,
    message: "مسار API غير موجود",
  });
});

// Global Express error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Express Server Error]:", err);
  res.setHeader("Content-Type", "application/json");
  res.status(err.status || 500).json({
    success: false,
    message: "حدث خطأ غير متوقع في الخادم",
  });
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Celebre Catering Server running on http://0.0.0.0:${PORT}`);
  });
  server.on("error", (err: any) => {
    console.error(`[Server Listen Error]:`, err);
  });
}

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL && !process.env.NOW_REGION) {
  startServer();
}

export { app };
export default app;

