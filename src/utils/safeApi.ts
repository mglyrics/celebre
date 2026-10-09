/**
 * Safe API response parser and fetch helper
 * Protects against HTML error responses, unexpected 404/500 pages,
 * and JSON parsing exceptions ("Unexpected token 'T', 'The page c'...")
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Safely parses any fetch Response without throwing SyntaxError if the response is HTML.
 */
export async function parseSafeJsonResponse<T = any>(res: Response): Promise<SafeApiResponse<T>> {
  const status = res.status;
  const contentType = res.headers.get('content-type') || '';

  // 1. If response is NOT JSON (e.g. HTML 404 "The page could not be found", 502 Bad Gateway, 500 HTML)
  if (!contentType.includes('application/json')) {
    let safeMessage = 'تعذر الاتصال بخادم الخدمة أو لم يتم العثور على المسار المطلوب.';
    if (status === 404) {
      safeMessage = 'مسار خدمة الـ API غير متوفر حالياً على الخادم (404). يرجى التأكد من تشغيل خادم الـ API أو إعدادات التوجيه.';
    } else if (status === 429) {
      safeMessage = 'تم تجاوز الحد الأقصى للمحاولات (429). يرجى الانتظار والمحاولة لاحقاً.';
    } else if (status >= 500) {
      safeMessage = `حدث خطأ في خادم النظام (رمز الاستجابة: ${status}). يرجى مراجعة إدارة السيرفر.`;
    }

    return {
      ok: false,
      status,
      error: safeMessage,
    };
  }

  // 2. Parse JSON safely
  let data: any = null;
  try {
    data = await res.json();
  } catch (parseErr) {
    return {
      ok: false,
      status,
      error: 'استجابة الخادم لم تكن بصيغة بيانات صالحة. يرجى إعادة المحاولة.',
    };
  }

  // 3. Handle business errors or HTTP error codes
  if (!res.ok || data?.success === false) {
    const errorMsg =
      data?.message ||
      data?.error ||
      (status === 401
        ? 'بيانات الدخول غير صحيحة أو انتهت صلاحية الجلسة.'
        : status === 403
        ? 'ليس لديك صلاحية للوصول إلى هذا المورد (403).'
        : `فشلت العملية (رمز الخطأ: ${status}).`);

    return {
      ok: false,
      status,
      data,
      error: errorMsg,
    };
  }

  return {
    ok: true,
    status,
    data,
  };
}

/**
 * Executes fetch and guarantees safe JSON parsing and error handling
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    return await parseSafeJsonResponse<T>(res);
  } catch (netErr: any) {
    // Safe diagnostic log without logging bodies, credentials, or tokens
    const urlStr = typeof input === 'string' ? input : 'URL';
    console.warn(`[SafeApi] Network failure reaching ${urlStr}:`, netErr?.message || netErr);

    return {
      ok: false,
      status: 0,
      error: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وخادم النظام.',
    };
  }
}
