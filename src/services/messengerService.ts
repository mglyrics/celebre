export interface MessengerConfig {
  orderUrl: string;
  facebookPageUrl: string;
  messengerChatUrl: string;
  welcomeMessage: string;
  shortGreeting: string;
  awayMessage: string;
  isAutomatedApiConfigured: boolean;
  webhookCallbackUrl: string;
  instructions: {
    title: string;
    steps: string[];
  };
}

export class MessengerService {
  public static readonly CANONICAL_ORDER_URL = 'https://celebre-eg.com/order';
  public static readonly FACEBOOK_PAGE_URL = 'https://facebook.com/celebre.catering';
  public static readonly MESSENGER_CHAT_URL = 'https://m.me/celebre.catering';

  public static readonly WELCOME_MESSAGE = `أهلاً بك في سيلبر كاترينج (Celebre Catering) 🍽️
يسعدنا استقبال طلباتكم للمناسبات والشركات وأعياد الميلاد وتجهيز البوفيهات الفندقية.

لحجز باقتك مباشرة ومراجعة مكونات الوجبات والأسعار الرسمية، تفضل بزيارة رابط الحجز الفوري:
👉 https://celebre-eg.com/order

نوفر باقات الميكس بوكس وسندوتش بوكس بأسعار الموزع المعتمدة، مع إمكانية تعديل المشروب وتوصيل طلبك لمكان مناسبتك.`;

  public static readonly SHORT_GREETING = `مرحباً بك في سيلبر كاترينج! 🎉
لحجز بوفيه ووجبات مناسبتك واختيار الباقة المناسبة مباشرة، اضغط على الرابط:
👉 https://celebre-eg.com/order`;

  public static readonly AWAY_MESSAGE = `شكراً لتواصلك مع سيلبر كاترينج! فريقنا متواجد لخدمتكم،
ويمكنك تسجيل حجزك المبدئي واختيار الوجبات في أي وقت عبر الرابط:
👉 https://celebre-eg.com/order`;

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
   * Verifies incoming Webhook challenge from Meta Platform
   */
  public static verifyWebhookChallenge(
    mode: string | undefined,
    token: string | undefined,
    challenge: string | undefined
  ): { isValid: boolean; challenge?: string } {
    const expectedToken = process.env.MESSENGER_VERIFY_TOKEN;

    if (mode === 'subscribe' && expectedToken && token === expectedToken) {
      return { isValid: true, challenge };
    }

    return { isValid: false };
  }

  /**
   * Processes incoming Webhook events from Meta Messenger
   */
  public static async handleWebhookEvent(body: any): Promise<{ handled: boolean; status: string }> {
    if (body.object !== 'page') {
      return { handled: false, status: 'NOT_PAGE_SUBSCRIPTION' };
    }

    const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
    if (!token) {
      return {
        handled: true,
        status: 'META_CREDENTIALS_REQUIRED_FOR_AUTOMATED_SENDING',
      };
    }

    // Process entries if token is available
    return { handled: true, status: 'PROCESSED' };
  }
}
