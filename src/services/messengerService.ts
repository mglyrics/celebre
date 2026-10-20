import crypto from 'node:crypto';

export interface MessengerConfig {
  orderUrl: string;
  facebookPageUrl: string;
  messengerChatUrl: string;
  welcomeMessage: string;
  shortGreeting: string;
  awayMessage: string;
  preliminaryNotice: string;
  isAutomatedApiConfigured: boolean;
  webhookCallbackUrl: string;
  instructions: {
    title: string;
    steps: string[];
  };
}

export interface MessengerWebhookMessaging {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    quick_reply?: { payload: string };
    attachments?: any[];
  };
  postback?: {
    title: string;
    payload: string;
    mid?: string;
  };
}

export interface MessengerWebhookEntry {
  id: string; // Facebook Page ID
  time: number;
  messaging?: MessengerWebhookMessaging[];
}

export interface MessengerWebhookBody {
  object: string;
  entry?: MessengerWebhookEntry[];
}

export interface MetaSetupGuide {
  webhookUrl: string;
  verifyTokenConfigured: boolean;
  appSecretConfigured: boolean;
  pageAccessTokenConfigured: boolean;
  pageIdConfigured: boolean;
  requiredPermissions: string[];
  requiredEnvVars: Array<{
    name: string;
    description: string;
    isSet: boolean;
  }>;
  webhookEvents: string[];
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
  }>;
}

export class MessengerService {
  public static readonly CANONICAL_ORDER_URL = 'https://celebre-eg.com/order';
  public static readonly FACEBOOK_PAGE_URL = 'https://facebook.com/celebre.catering';
  public static readonly MESSENGER_CHAT_URL = 'https://m.me/celebre.catering';

  // Step 1: Welcome & Branding
  public static readonly WELCOME_MESSAGE = `أهلاً بك في سيلبر كاترينج (Celebre Catering) 🍽️
يسعدنا استقبال طلباتكم للمناسبات والشركات وأعياد الميلاد وتجهيز البوفيهات الفندقية.

لحجز باقتك مباشرة ومراجعة مكونات الوجبات والأسعار الرسمية، تفضل بزيارة رابط الحجز الفوري:
👉 https://celebre-eg.com/order

نوفر باقات الميكس بوكس وسندوتش بوكس بأسعار الموزع المعتمدة، مع إمكانية تعديل المشروب وتوصيل طلبك لمكان مناسبتك.`;

  // Step 2: Short greeting with direct link
  public static readonly SHORT_GREETING = `مرحباً بك في سيلبر كاترينج! 🎉
لحجز بوفيه ووجبات مناسبتك واختيار الباقة المناسبة مباشرة، اضغط على الرابط:
👉 https://celebre-eg.com/order`;

  public static readonly AWAY_MESSAGE = `شكراً لتواصلك مع سيلبر كاترينج! فريقنا متواجد لخدمتكم،
ويمكنك تسجيل حجزك المبدئي واختيار الوجبات في أي وقت عبر الرابط:
👉 https://celebre-eg.com/order`;

  // Step 3: Important clarification: Preliminary & unpaid booking notice
  public static readonly PRELIMINARY_NOTICE = `📌 تنبيه هام بخصوص الحجز:
الحجز المسجل عبر الرابط (https://celebre-eg.com/order) هو حجز مبدئي غير مدفوع لتسجيل رغبتكم وموعد التسليم.
لا يتم اعتماد الحجز نهائياً أو إرسال أي طلب للمصنع إلا بعد مراجعة إدارة سيلبر والتواصل المباشر معكم لتأكيد كافة التفاصيل وطريقة الدفع المعتمدة.`;

  // Three-step unified Arabic conversational flow
  public static readonly THREE_STEP_FLOW = {
    step1Welcome: `أهلاً بك في سيلبر كاترينج (Celebre Catering) 🍽️✨
يسعدنا تواصلك واستقبال طلبات البوفيهات والمناسبات والشركات بأعلى معايير الجودة الفندقية.`,

    step2BookingLink: `لتصفح منيو باقات ميكس بوكس (Sale-01 إلى Sale-12) وسندوتش بوكس (Sale-13 إلى Sale-18) ومعرفة المكونات والأسعار وحساب التكلفة الفورية، تفضل بزيارة رابط الحجز المعتمد:
👉 https://celebre-eg.com/order`,

    step3PreliminaryDisclaimer: `📌 تنبيه هام: الحجز عبر الرابط أعلاه هو حجز مبدئي غير مدفوع لتسجيل طلبكم في جدول المواعيد. لا يتم اعتماد الحجز نهائياً ولا يتم إنشاء أي طلب تصنيع إلا بعد مراجعة الإدارة والتواصل معكم لتأكيد الموعد والتفاصيل.`,
  };

  /**
   * Deduplication cache with TTL (15 minutes) to ensure idempotency.
   * Prevents repeated processing of redelivered Meta Webhook events.
   */
  private static processedEvents = new Map<string, number>();
  private static readonly DEDUP_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_DEDUP_CACHE_SIZE = 5000;

  /**
   * Checks whether an incoming message or postback event is a duplicate.
   * If not, marks it as processed and returns false.
   */
  public static isDuplicateEvent(dedupKey: string): boolean {
    this.cleanExpiredDedupEntries();

    const lastSeen = this.processedEvents.get(dedupKey);
    if (lastSeen && Date.now() - lastSeen < this.DEDUP_TTL_MS) {
      return true;
    }

    if (this.processedEvents.size >= this.MAX_DEDUP_CACHE_SIZE) {
      const oldestKey = this.processedEvents.keys().next().value;
      if (oldestKey) this.processedEvents.delete(oldestKey);
    }

    this.processedEvents.set(dedupKey, Date.now());
    return false;
  }

  /**
   * Cleans expired deduplication keys
   */
  private static cleanExpiredDedupEntries(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > this.DEDUP_TTL_MS) {
        this.processedEvents.delete(key);
      }
    }
  }

  /**
   * Clear dedup cache (used in testing)
   */
  public static clearDedupCacheForTests(): void {
    this.processedEvents.clear();
  }

  /**
   * Retrieves Messenger configuration for client and admin UI (no secrets exposed)
   */
  public static getConfig(): MessengerConfig {
    const isAutomatedApiConfigured = Boolean(
      process.env.MESSENGER_PAGE_ACCESS_TOKEN &&
      process.env.MESSENGER_VERIFY_TOKEN
    );

    return {
      orderUrl: this.CANONICAL_ORDER_URL,
      facebookPageUrl: this.FACEBOOK_PAGE_URL,
      messengerChatUrl: this.MESSENGER_CHAT_URL,
      welcomeMessage: this.WELCOME_MESSAGE,
      shortGreeting: this.SHORT_GREETING,
      awayMessage: this.AWAY_MESSAGE,
      preliminaryNotice: this.PRELIMINARY_NOTICE,
      isAutomatedApiConfigured,
      webhookCallbackUrl: 'https://celebre-eg.com/api/messenger/webhook',
      instructions: {
        title: 'خطوات تفعيل الرد التلقائي الفوري بصفحة فيسبوك (Meta Business Suite):',
        steps: [
          'افتح صفحة فيسبوك سيلبر كاترينج في Meta Business Suite.',
          'توجه إلى قسم الرسائل (Inbox) ثم اختر الأتمتة (Automations).',
          'فعّل خيار "الرد الفوري" (Instant Reply) لقناة Messenger.',
          'الصق نص رسالة الترحيب المعتمدة أعلاه، والتي تحتوي على رابط الحجز: https://celebre-eg.com/order.',
          'اضغط "حفظ التغييرات" ليتم إرسال الرابط تلقائياً لكل عميل يبدأ محادثة جديدة عبر ماسنجر.',
          'للربط البرمجي عبر Webhook API: قم بإعداد Verify Token وPage Access Token في متغيرات بيئة الخادم.',
        ],
      },
    };
  }

  /**
   * Verifies incoming Webhook challenge from Meta Platform (hub.mode, hub.verify_token, hub.challenge)
   */
  public static verifyWebhookChallenge(
    mode: string | undefined,
    token: string | undefined,
    challenge: string | undefined
  ): { isValid: boolean; challenge?: string } {
    const expectedToken = process.env.MESSENGER_VERIFY_TOKEN || 'celebre_messenger_verify_token_2026';

    if (mode === 'subscribe' && expectedToken && token === expectedToken) {
      return { isValid: true, challenge };
    }

    return { isValid: false };
  }

  /**
   * Cryptographically verifies Meta Webhook request signature (x-hub-signature-256) using App Secret.
   * Uses timingSafeEqual to protect against timing attacks.
   */
  public static verifySignature(
    rawBody: Buffer | string | undefined,
    signatureHeader?: string
  ): { isValid: boolean; reason?: string } {
    const appSecret = process.env.MESSENGER_APP_SECRET;

    // If App Secret is not configured in environment, permit with explicit status note
    if (!appSecret) {
      return { isValid: true, reason: 'APP_SECRET_NOT_CONFIGURED' };
    }

    if (!signatureHeader) {
      return { isValid: false, reason: 'MISSING_SIGNATURE_HEADER' };
    }

    const [algo, signatureHash] = signatureHeader.split('=');
    if (algo !== 'sha256' || !signatureHash) {
      return { isValid: false, reason: 'INVALID_SIGNATURE_FORMAT' };
    }

    try {
      const bodyBuffer = Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody || {}));

      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(bodyBuffer)
        .digest('hex');

      const sigBuf = Buffer.from(signatureHash, 'hex');
      const expBuf = Buffer.from(expectedHash, 'hex');

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return { isValid: false, reason: 'SIGNATURE_MISMATCH' };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, reason: 'SIGNATURE_VERIFICATION_ERROR' };
    }
  }

  /**
   * Sends a message via Meta Graph API to a Messenger recipient (PSID).
   * Adheres strictly to security: tokens are kept server-side only.
   */
  public static async sendMessengerMessage(
    recipientId: string,
    messageText: string
  ): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
    const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

    if (!token) {
      // In staging/development when token is not yet configured, gracefully report simulated delivery
      return {
        success: true,
        simulated: true,
        error: 'PAGE_ACCESS_TOKEN_NOT_CONFIGURED_SIMULATED',
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientId },
            messaging_type: 'RESPONSE',
            message: { text: messageText },
          }),
        }
      );

      const data = (await response.json()) as any;
      if (response.ok && data?.message_id) {
        return { success: true, messageId: data.message_id };
      }

      return {
        success: false,
        error: data?.error?.message || `HTTP ${response.status}`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to dispatch message to Meta Graph API',
      };
    }
  }

  /**
   * Generates the 3-step Arabic message flow to guide the customer.
   */
  public static getFlowReply(): string {
    return `${this.THREE_STEP_FLOW.step1Welcome}

${this.THREE_STEP_FLOW.step2BookingLink}

${this.THREE_STEP_FLOW.step3PreliminaryDisclaimer}`;
  }

  /**
   * Processes incoming Webhook events from Meta Messenger.
   * Handles idempotency, parses sender and recipient, and executes the 3-step flow.
   */
  public static async handleWebhookEvent(
    body: MessengerWebhookBody
  ): Promise<{
    handled: boolean;
    status: string;
    eventsProcessed: number;
    duplicatesIgnored: number;
    actionsTaken: Array<{
      pageId: string;
      senderId: string;
      dedupKey: string;
      flowDispatched: boolean;
    }>;
  }> {
    if (body.object !== 'page') {
      return {
        handled: false,
        status: 'NOT_PAGE_SUBSCRIPTION',
        eventsProcessed: 0,
        duplicatesIgnored: 0,
        actionsTaken: [],
      };
    }

    let eventsProcessed = 0;
    let duplicatesIgnored = 0;
    const actionsTaken: Array<{
      pageId: string;
      senderId: string;
      dedupKey: string;
      flowDispatched: boolean;
    }> = [];

    const entries = body.entry || [];
    for (const entry of entries) {
      const pageId = entry.id;
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        const senderId = event.sender?.id;
        const recipientId = event.recipient?.id;
        const mid = event.message?.mid;
        const postbackPayload = event.postback?.payload;

        // Construct unique idempotency key
        const dedupKey = mid || `${senderId}_${postbackPayload || 'msg'}_${event.timestamp}`;

        // Deduplication check: ignore if already handled
        if (this.isDuplicateEvent(dedupKey)) {
          duplicatesIgnored++;
          continue;
        }

        // Process only if message or postback received from customer
        if (event.message || event.postback) {
          eventsProcessed++;

          // Compose the 3-step response flow
          const replyText = this.getFlowReply();

          // Dispatch message via Graph API
          await this.sendMessengerMessage(senderId, replyText);

          actionsTaken.push({
            pageId,
            senderId,
            dedupKey,
            flowDispatched: true,
          });
        }
      }
    }

    return {
      handled: true,
      status: 'PROCESSED',
      eventsProcessed,
      duplicatesIgnored,
      actionsTaken,
    };
  }

  /**
   * Comprehensive Meta for Developers Setup Guide for Admin Panel
   */
  public static getMetaSetupGuide(): MetaSetupGuide {
    const verifyToken = Boolean(process.env.MESSENGER_VERIFY_TOKEN);
    const appSecret = Boolean(process.env.MESSENGER_APP_SECRET);
    const pageAccessToken = Boolean(process.env.MESSENGER_PAGE_ACCESS_TOKEN);
    const pageId = Boolean(process.env.MESSENGER_PAGE_ID);

    return {
      webhookUrl: 'https://celebre-eg.com/api/messenger/webhook',
      verifyTokenConfigured: verifyToken,
      appSecretConfigured: appSecret,
      pageAccessTokenConfigured: pageAccessToken,
      pageIdConfigured: pageId,
      requiredPermissions: [
        'pages_messaging (إرسال واستقبال رسائل ماسنجر للعملاء)',
        'pages_show_list (عرض وإدارة قائمة صفحات فيسبوك)',
        'pages_read_engagement (قراءة التفاعلات وربط أحداث الصفحة)',
      ],
      requiredEnvVars: [
        {
          name: 'MESSENGER_VERIFY_TOKEN',
          description: 'رمز تحقق عشوائي تختاره وتضعه في Meta Webhooks وإعدادات السيرفر لمطابقة الرابط',
          isSet: verifyToken,
        },
        {
          name: 'MESSENGER_APP_SECRET',
          description: 'السر الخاص بتطبيق Meta (App Secret) للتحقق المشفر من توقيع طلبات الـ Webhook عبر HMAC SHA-256',
          isSet: appSecret,
        },
        {
          name: 'MESSENGER_PAGE_ACCESS_TOKEN',
          description: 'رمز وصول الصفحة المعتمد (Page Access Token) لإرسال رسائل الرد التلقائي عبر Graph API',
          isSet: pageAccessToken,
        },
        {
          name: 'MESSENGER_PAGE_ID',
          description: 'المعرف الرقمي لصفحة فيسبوك سيلبر كاترينج (Facebook Page ID)',
          isSet: pageId,
        },
      ],
      webhookEvents: [
        'messages (استقبال الرسائل النصية المباشرة من العملاء)',
        'messaging_postbacks (استقبال النقرات على أزرار البدء والتفاعل)',
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'إنشاء تطبيق في Meta for Developers',
          description: 'الدخول إلى developers.facebook.com وإنشاء تطبيق جديد من نوع Business واختيار منتج Messenger.',
        },
        {
          stepNumber: 2,
          title: 'ربط صفحة فيسبوك سيلبر وتوليد Page Access Token',
          description: 'في إعدادات Messenger API، اختر صفحة سيلبر كاترينج واضغط على Generate Token، وانسخ الرمز وضعه في متغيرات البيئة باسم MESSENGER_PAGE_ACCESS_TOKEN.',
        },
        {
          stepNumber: 3,
          title: 'إعداد Webhook Callback URL وVerify Token',
          description: 'في قسم Webhooks، اضغط Add Callback URL وضع الرابط: https://celebre-eg.com/api/messenger/webhook، واكتب Verify Token مطابق للمتغير MESSENGER_VERIFY_TOKEN ثم اضغط Verify and Save.',
        },
        {
          stepNumber: 4,
          title: 'اشتراك الصفحة في أحداث messages',
          description: 'تحت قسم Webhook Subscriptions لصفحة سيلبر، اختر اشتراك الصفحة في حقلي messages و messaging_postbacks.',
        },
        {
          stepNumber: 5,
          title: 'إجراء فحص تجريبي واختبار حقيقي',
          description: 'قم بمراسلة الصفحة من حساب فيسبوك تجريبي / عميل للتأكد من وصول التدفق الثلاثي ورابط الحجز.',
        },
      ],
    };
  }
}
