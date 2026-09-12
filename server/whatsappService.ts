import { GoogleGenAI } from "@google/genai";

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const CELEBRE_SYSTEM_KNOWLEDGE = `
أنت "المساعد الذكي الرسمي لخدمة عملاء سيلبر كاترنج (Celebre Catering)" على تطبيق واتساب.
رقم خدمة العملاء والإنستاباي الرسمي: 01284484868
المقر والنطاق الجغرافي:
- نحن متخصصون في عبوات كاترنج فردية فاخرة ومغلقة للأفراح وكتب الكتاب والخطوبات والمناسبات السعيدة.
- نطاق التوصيل الحصري: داخل (مدينة بني سويف) و(شرق النيل بني سويف) فقط لا غير!
- تنبيه حاسم: لا نوصل إطلاقاً لأي قرى أو مراكز تابعة لبني سويف، ولا نوصل لمحافظة الفيوم.

سياسات التغليف والخدمة الصارمة:
- لا نقدم كروت إهداء مطبوعة ولا شرائط ستان إطلاقاً، والعبوات تأتي بتصميم ملكي فاخر معقم ومحكم ومجهز للتوزيع الفوري مع شوكة ومنديل معطر داخل أكياس حرارية.
- الحد الأدنى للطلب: 30 عبوة فردية.
- الشحن المجاني: متاح فقط وحصرياً للطلبات التي تزيد عن 500 عبوة داخل مدينة بني سويف وشرق النيل. الطلبات الأقل تخضع لرسوم توصيل رمزية حسب المكان.
- نظام الحجز والعربون: حجز رسمي بدفع 50% عربون لتثبيت موعد خط الإنتاج، والـ 50% المتبقية عند التسليم.
- وسائل الدفع المعتمدة: إنستاباي (InstaPay) على الرقم 01284484868، تحويل بنكي (الأهلي / CIB)، أو عربون كاش بالفرع. (المحافظ الإلكترونية وفودافون كاش غير مقبولة).

قائمة باقات سيلبر المعتمدة وأسعارها:
1. باقة كتب الكتاب الملكية (Royal Katb Ketab Box) - 145 ج.م للعبوة:
   (ساندوتش بريوش روست بيف فاخر، ميني بيتزا إيطالية، كانبيه سالمون مدخن، قطعتين كب كيك وتارت لوتس، ميني باتيه جبن كيري، عصير فريش راقي، عبوة مخملية مقفولة).
2. باقة الزفاف والخطوبة الفاخرة (Diamond Box) - 195 ج.م للعبوة:
   (كرواسون ديك رومي مدخن وشيدر، ميني برجر سلايدر لحم بلدي، كانبيه سلامي إيطالي، شوكولاتة فاخرة، إكلير فرنسي، تارت فواكه طازج، ساليزون، مشروب استوائي).
3. باقة الـ VIP الاحتفالية الشاملة (Imperial VIP Box) - 240 ج.م للعبوة:
   (أعلى فئات الضيافة الملكية المتكاملة مع أصناف بحرية ولحوم مدخنة وحلويات باريسية).
4. علبة الموالح والساليزون السواريه (Savory Cocktail Box) - 95 ج.م للعبوة:
   (ميني تارت حادق، ساليزون مشكل، فطائر محشوة، سبرينج رول، تشكيلة كانبيه).
5. علبة الحلويات والضيافة الشرقية والغربية (Royal Sweets Box) - 75 ج.م للعبوة:
   (بسبوسة بالمكسرات، كنافة أساور نوتيلا، شوكليت كوكيز، ميني تارت شيكولاتة).
6. علبة شيكولاتة باسمك (40 قطعة مخصصة) - بسعر 800 ج.م (بدلاً من 850 ج.م):
   (علبة ملكية مذهبة مكونة من 40 قطعة شيكولاتة فاخرة مقسمة ومطبوعة باسم صاحب المناسبة أو العروسين وتاريخ الاحتفال مع شريط ستان ذهبي، وتطلب قبل موعد المناسبة بـ 5 أيام على الأقل).

تعليمات صياغة الردود على واتساب:
- رد بأسلوب راقٍ وودود ومحترم باللهجة المصرية المهذبة والمرحبة ("أهلاً بحضرتك يا فندم 🌸").
- اجعل الرد منسقاً بنقاط واضحة وإيموجي متناسق وخفيف مناسب للواتساب.
- إذا سأل العميل عن أسعار أو باقات، اعرض له الباقات المناسبة مع توضيح الأسعار.
- إذا سأل عن التوصيل، أكد له بكل وضوح أننا نخدم مدينة بني سويف وشرق النيل فقط.
- إذا سأل عن طريقة الحجز، وضح له أن الحجز يتم بدفع 50% عربون عبر إنستاباي على 01284484868 أو بالفرع.
- اذكر دائماً رقم التواصل الرسمي: 01284484868 لأي استفسار عاجل.
`;

/**
 * Generate AI reply using Gemini 2.5 Flash
 */
export async function generateWhatsAppAiReply(
  customerMessage: string,
  customerName?: string
): Promise<string> {
  const ai = getGeminiClient();

  if (!ai) {
    // Fallback response if GEMINI_API_KEY is not configured
    return `أهلاً بحضرتك يا فندم في سيلبر كاترنج (Celebre Catering) 🌸\n\nنحن متخصصون في عبوات كاترنج المناسبات الفاخرة داخل مدينة بني سويف وشرق النيل.\n\n📞 للاستفسار والحجز الفوري، فريق المبيعات متواجد معكم على مدار الساعة عبر الهاتف أو الواتساب: 01284484868\n\nنسعد بخدمتكم في مناسبتكم السعيدة! ✨`;
  }

  try {
    const prompt = `
رسالة العميل المستلمة على واتساب:
"${customerMessage}"
اسم العميل (إن وجد): ${customerName || "عميل سيلبر الكريم"}

المطلوب:
صِغ رداً مباشراً ومهذباً وشاملاً لاستفسار العميل وفق بيانات سيلبر الرسمية أعلاه. لا تكتب مقدمات أو حواشي جانبية؛ فقط الرد المباشر الذي سيتم إرساله للعميل على واتساب.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: CELEBRE_SYSTEM_KNOWLEDGE + "\n\n" + prompt }] }
      ]
    });

    const reply = response.text?.trim();
    if (reply) {
      return reply;
    }

    return `أهلاً بحضرتك في سيلبر كاترنج 🌸 تم استلام استفساركم وسيتواصل معكم مسؤول الحجوزات فوراً عبر 01284484868.`;
  } catch (error) {
    console.error("[WhatsApp AI Generation Error]:", error);
    return `أهلاً بحضرتك يا فندم في سيلبر كاترنج 🌸\nيسعدنا خدمتكم في كافة مناسباتكم بمدينة بني سويف وشرق النيل.\nتفضل بالاتصال بنا أو إرسال تفاصيل مناسبتكم وسيقوم فريقنا بالرد الفوري: 01284484868`;
  }
}

/**
 * Send WhatsApp text message via Meta Cloud API
 */
export async function sendMetaWhatsAppMessage(
  recipientPhone: string,
  messageBody: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Cloud API]: Meta credentials not fully configured (WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing).`);
    console.log(`[WhatsApp Simulated Send]: To: ${recipientPhone} | Message:\n${messageBody}`);
    return {
      success: false,
      error: "مفاتيح Meta (WHATSAPP_TOKEN أو WHATSAPP_PHONE_NUMBER_ID) غير مهيأة بعد في متغيرات البيئة. تم تسجيل الرد بنجاح في سجلات الخادم."
    };
  }

  try {
    // Standardize phone number for WhatsApp (remove + or leading zeros if needed)
    const cleanPhone = recipientPhone.replace(/\D/g, "");

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: false,
          body: messageBody
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Meta API Error]:", data);
      return { success: false, error: data?.error?.message || "Failed to send message via Meta API", data };
    }

    console.log(`[WhatsApp Message Sent Successfully]: To: ${cleanPhone}`);
    return { success: true, data };
  } catch (err: any) {
    console.error("[Meta Fetch Error]:", err);
    return { success: false, error: err?.message || "Network error while sending WhatsApp message" };
  }
}
