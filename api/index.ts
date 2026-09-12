import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

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

const DEFAULT_ORDERS: CateringOrder[] = [
  {
    id: "CEL-8491",
    customerName: "م. أحمد الشناوي",
    phone: "01001234567",
    occasion: "كتب كتاب ومسجد الشرطة",
    eventDate: "2026-09-15",
    location: "قاعة الصفا - مسجد الشرطة بالتجمع الخامس",
    governorate: "القاهرة",
    packages: [
      {
        id: "pkg-katb-ketab-royal",
        name: "باقة كتب الكتاب الملكية (Royal Katb Ketab Box)",
        quantity: 150,
        pricePerUnit: 145,
        packagingType: "صندوق كرتوني مذهب محكم الإغلاق"
      }
    ],
    totalPrice: 21750,
    totalBoxes: 150,
    notes: "يرجى كتابة أسماء العروسين (أحمد & مريم) على كارت التهنئة المرفق بالعبوة",
    customRibbonText: "",
    paymentMethod: "instapay",
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "CEL-8492",
    customerName: "د. سارة المنشاوي",
    phone: "01119876543",
    occasion: "حفل خطوبة فيلا",
    eventDate: "2026-09-20",
    location: "فيلا النخيل - الشيخ زايد",
    governorate: "الجيزة",
    packages: [
      {
        id: "pkg-diamond-wedding",
        name: "باقة الزفاف والخطوبة الفاخرة (Diamond Box)",
        quantity: 80,
        pricePerUnit: 195,
        packagingType: "صندوق كرافت جولد فاخر"
      },
      {
        id: "pkg-royal-sweets",
        name: "علبة الحلويات والضيافة الشرقية (Royal Sweets Box)",
        quantity: 80,
        pricePerUnit: 75
      }
    ],
    totalPrice: 21600,
    totalBoxes: 160,
    notes: "التوصيل والتسليم الساعة 6 مساءً مع أكياس حرارية لحفظ السخونة",
    customRibbonText: "خطوبة سارة & كريم",
    paymentMethod: "deposit_cash",
    status: "in_preparation",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

let orders: CateringOrder[] = [...DEFAULT_ORDERS];

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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", brand: "Celebre Catering Packages", contact: "01284484868" });
});

// Orders
app.get("/api/orders", (_req, res) => {
  res.json({ success: true, orders });
});

// Reset Orders to Default Celebre State
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
      location: data.location || "القاهرة",
      governorate: data.governorate || "القاهرة",
      packages: data.packages || [],
      totalPrice: data.totalPrice || 0,
      totalBoxes: data.totalBoxes || 0,
      notes: data.notes || "",
      customRibbonText: data.customRibbonText || "",
      paymentMethod: data.paymentMethod || "whatsapp",
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

// AI Advisor
app.post("/api/ai-catering-advisor", async (req, res) => {
  try {
    const { occasion, guestCount, budget, preferredStyle, notes } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
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

    const prompt = `أنت خبير كاترنج وتنظيم ضيافة أفراح ومناسبات مصرية راقية لعلامة "Celebre" (سيلبر).
تنبيه صارم: سيلبر لا توزع حلويات شرقية (لا كنافة ولا بسبوسة)، ولا تستخدم علب مخملية، ولا أشرطة ستان نهائياً!
تعتمد سيلبر حصراً علبها الكرتونية المذهبة الرسمية المقواة والمحكمة الإغلاق الجاهزة للتوزيع المباشر والسريع بالمساجد والقاعات، مع ساندوتشات بتي بان أو فرنساوى وسط (كفتة ع الفحم، بانية بلدي، رومي، كوردن بيف)، وقطع جاتوة مثلثة مغلفة، وعصير بخيرة مع شوكة ومنديل معقم.
المطلوب تقديم اقتراح منيو عبوات كاترنج راقية وشهية ومناسبة للعادات المصرية للمناسبة التالية:
- نوع المناسبة: ${occasion}
- عدد الضيوف: ${guestCount} فرد
- الميزانية التقريبية: ${budget ? budget + " جنيه" : "غير محددة"}
- التفضيلات: ${preferredStyle || "ساندوتشات لحوم وفراخ مع جاتوة مثلّث مغلف وعصير بخيرة"}
- ملاحظات إضافية: ${notes || "لا توجد"}

أجب بصيغة JSON حصراً فقط بالحقول التالية بدون أي كود ماركداون آخر:
{
  "recommendationTitle": "عنوان الخطة والباستجابة",
  "suggestedPackage": "اسم الباقة المقترحة",
  "estimatedCostPerBox": 145,
  "totalEstimatedCost": 14500,
  "boxContents": ["عنصر 1", "عنصر 2", "عنصر 3", "عنصر 4", "عنصر 5", "عنصر 6", "عنصر 7", "عنصر 8"],
  "presentationTips": ["نصيحة 1 في التقديم والتغليف", "نصيحة 2", "نصيحة 3"],
  "advice": "نصيحة خبير سيلبر الشاملة لتوفير الميزانية وضمان أفضل انطباع لدى المعازيم"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

export default app;
