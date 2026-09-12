import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateWhatsAppAiReply, sendMetaWhatsAppMessage } from "./server/whatsappService";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
    res.json({ success: true, order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "تعذر حفظ الطلب" });
  }
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
          "ميني ساندوتش كوردن بلو فاخر بصوص الشيدر",
          "سيخ شيش طاووق متبل على الطريقة اللبنانية مع خبز التورتيلا",
          "قطعتين سمبوسك مكس جبن كيري ولحمة مفرومة بلدي",
          "حبة كبيبة شامي بالصنوبر والمكسرات",
          "تارت جبنة الريكوتا والزعتر البري مع طماطم مجففة",
          "كوب سلطة كول سلو أو تبولة فريش محكمة الغلق",
          "علبة ميني حلويات شرقية فاخرة (كنافة أساور فستق + بسبوسة سمن بلدي)",
          "زجاجة عصير مانجو طبيعي 100% بدون سكر مضاف مع مياه معدنية",
          "منديل معطّر فاخر وشوكة سيلفر ذهبية داخل مغلف سيلبر الأنيق"
        ],
        presentationTips: [
          "التغليف باللون العنابي (Burgundy) والتصميم الملكي يمنح فخامة استثنائية لصور الحفل والتوزيع المباشر",
          "العبوات محكمة ومجهزة بشوكة ومنديل معطر فاخر لتوزيع فوري وسلس دون فوضى للمعازيم",
          "توزيع العبوات في أكياس سيلبر الحرارية يضمن بقاء المخبوزات طازجة ومقرمشة طوال فترة الحفل"
        ],
        advice: `بناءً على عدد المعازيم (${guestCount || 100} فرد)، ننصح بحجز كمية إضافية بنسبة 5% (حوالي ${Math.ceil((guestCount || 100) * 0.05)} عبوة احتياطية) لتفادي أي زيادة غير متوقعة في عدد الضيوف.`
      };
      return res.json({ success: true, plan: defaultSuggestions });
    }

    const prompt = `أنت خبير كاترنج وتنظيم ضيافة أفراح ومناسبات مصرية راقية لعلامة "Celebre" (سيلبر) في بني سويف (مدينة بني سويف وشرق النيل).
المطلوب تقديم اقتراح منيو عبوات كاترنج فردية فاخرة وشهية ومناسبة للعادات المصرية للمناسبة التالية (علماً بأن سيلبر لا تقدم كروت مطبوعة أو شرائط ستان، بل عبوات راقية مجهزة بالكامل للتقديم):
- نوع المناسبة: ${occasion}
- عدد الضيوف: ${guestCount} فرد
- الميزانية التقريبية: ${budget ? budget + " جنيه" : "غير محددة"}
- التفضيلات: ${preferredStyle || "ميكس حادق وحلو فخم"}
- ملاحظات إضافية: ${notes || "لا توجد"}

أجب بصيغة JSON حصراً فقط بالحقول التالية بدون أي كود ماركداون آخر:
{
  "recommendationTitle": "عنوان الخطة والاستجابة",
  "suggestedPackage": "اسم الباقة المقترحة",
  "estimatedCostPerBox": رقم سعر العبوة بالجنيه المصري (مثلا 140),
  "totalEstimatedCost": رقم التكلفة الإجمالية بالجنيه المصري,
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
