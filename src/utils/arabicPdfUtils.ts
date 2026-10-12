/**
 * Arabic Typography and Reshaping Utilities for PDF Generation
 * Converts Arabic logical text to shaped visual presentation forms (Unicode Forms-B)
 * with Bidirectional (RTL) reordering and Ligature handling (Lam-Alef).
 */

interface ArabicCharForms {
  isolated: number;
  final: number;
  initial: number;
  medial: number;
}

// Map of Arabic characters to their presentation forms: [isolated, final, initial, medial]
const ARABIC_GLYPHS_MAP: Record<string, ArabicCharForms> = {
  '\u0621': { isolated: 0xfe80, final: 0xfe80, initial: 0xfe80, medial: 0xfe80 }, // ء
  '\u0622': { isolated: 0xfe81, final: 0xfe82, initial: 0xfe81, medial: 0xfe82 }, // آ
  '\u0623': { isolated: 0xfe83, final: 0xfe84, initial: 0xfe83, medial: 0xfe84 }, // أ
  '\u0624': { isolated: 0xfe85, final: 0xfe86, initial: 0xfe85, medial: 0xfe86 }, // ؤ
  '\u0625': { isolated: 0xfe87, final: 0xfe88, initial: 0xfe87, medial: 0xfe88 }, // إ
  '\u0626': { isolated: 0xfe89, final: 0xfe8a, initial: 0xfe8b, medial: 0xfe8c }, // ئ
  '\u0627': { isolated: 0xfe8d, final: 0xfe8e, initial: 0xfe8d, medial: 0xfe8e }, // ا
  '\u0628': { isolated: 0xfe8f, final: 0xfe90, initial: 0xfe91, medial: 0xfe92 }, // ب
  '\u0629': { isolated: 0xfe93, final: 0xfe94, initial: 0xfe93, medial: 0xfe94 }, // ة
  '\u062A': { isolated: 0xfe95, final: 0xfe96, initial: 0xfe97, medial: 0xfe98 }, // ت
  '\u062B': { isolated: 0xfe99, final: 0xfe9a, initial: 0xfe9b, medial: 0xfe9c }, // ث
  '\u062C': { isolated: 0xfe9d, final: 0xfe9e, initial: 0xfe9f, medial: 0xfea0 }, // ج
  '\u062D': { isolated: 0xfea1, final: 0xfea2, initial: 0xfea3, medial: 0xfea4 }, // ح
  '\u062E': { isolated: 0xfea5, final: 0xfea6, initial: 0xfea7, medial: 0xfea8 }, // خ
  '\u062F': { isolated: 0xfea9, final: 0xfeaa, initial: 0xfea9, medial: 0xfeaa }, // د
  '\u0630': { isolated: 0xfeab, final: 0xfeac, initial: 0xfeab, medial: 0xfeac }, // ذ
  '\u0631': { isolated: 0xfead, final: 0xfeae, initial: 0xfead, medial: 0xfeae }, // ر
  '\u0632': { isolated: 0xfeaf, final: 0xfeb0, initial: 0xfeaf, medial: 0xfeb0 }, // ز
  '\u0633': { isolated: 0xfeb1, final: 0xfeb2, initial: 0xfeb3, medial: 0xfeb4 }, // س
  '\u0634': { isolated: 0xfeb5, final: 0xfeb6, initial: 0xfeb7, medial: 0xfeb8 }, // ش
  '\u0635': { isolated: 0xfeb9, final: 0xfeba, initial: 0xfebb, medial: 0xfebc }, // ص
  '\u0636': { isolated: 0xfebd, final: 0xfebe, initial: 0xfebf, medial: 0xfec0 }, // ض
  '\u0637': { isolated: 0xfec1, final: 0xfec2, initial: 0xfec3, medial: 0xfec4 }, // ط
  '\u0638': { isolated: 0xfec5, final: 0xfec6, initial: 0xfec7, medial: 0xfec8 }, // ظ
  '\u0639': { isolated: 0xfec9, final: 0xfeca, initial: 0xfecb, medial: 0xfecc }, // ع
  '\u063A': { isolated: 0xfecd, final: 0xfece, initial: 0xfecf, medial: 0xfed0 }, // غ
  '\u0641': { isolated: 0xfed1, final: 0xfed2, initial: 0xfed3, medial: 0xfed4 }, // ف
  '\u0642': { isolated: 0xfed5, final: 0xfed6, initial: 0xfed7, medial: 0xfed8 }, // ق
  '\u0643': { isolated: 0xfed9, final: 0xfeda, initial: 0xfedb, medial: 0xfedc }, // ك
  '\u0644': { isolated: 0xfedd, final: 0xfede, initial: 0xfedf, medial: 0xfee0 }, // ل
  '\u0645': { isolated: 0xfee1, final: 0xfee2, initial: 0xfee3, medial: 0xfee4 }, // م
  '\u0646': { isolated: 0xfee5, final: 0xfee6, initial: 0xfee7, medial: 0xfee8 }, // ن
  '\u0647': { isolated: 0xfee9, final: 0xfeea, initial: 0xfeeb, medial: 0xfeec }, // ه
  '\u0648': { isolated: 0xfeed, final: 0xfeee, initial: 0xfeed, medial: 0xfeee }, // و
  '\u0649': { isolated: 0xfeef, final: 0xfef0, initial: 0xfeef, medial: 0xfef0 }, // ى
  '\u064A': { isolated: 0xfef1, final: 0xfef2, initial: 0xfef3, medial: 0xfef4 }, // ي
};

// Letters that do not connect to the following letter
const NON_CONNECTING_AFTER = new Set([
  '\u0621', // ء
  '\u0622', // آ
  '\u0623', // أ
  '\u0624', // ؤ
  '\u0625', // إ
  '\u0627', // ا
  '\u062F', // د
  '\u0630', // ذ
  '\u0631', // ر
  '\u0632', // ز
  '\u0648', // و
  '\u0629', // ة
]);

// Ligatures Lam + Alef
const LAM_ALEF_MAP: Record<string, { isolated: number; final: number }> = {
  '\u0622': { isolated: 0xfef5, final: 0xfef6 }, // لآ
  '\u0623': { isolated: 0xfef7, final: 0xfef8 }, // لأ
  '\u0625': { isolated: 0xfef9, final: 0xfefa }, // لإ
  '\u0627': { isolated: 0xfefb, final: 0xfefc }, // لا
};

function isArabic(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0x0600 && code <= 0x06ff;
}

/**
 * Reshapes Arabic string connecting letters properly according to position
 */
export function reshapeArabicWords(text: string): string {
  if (!text) return '';

  const chars = Array.from(text);
  const shapedChars: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const curr = chars[i];
    const prev = i > 0 ? chars[i - 1] : '';
    const next = i < chars.length - 1 ? chars[i + 1] : '';

    if (!isArabic(curr) || !ARABIC_GLYPHS_MAP[curr]) {
      shapedChars.push(curr);
      continue;
    }

    // Check for Lam-Alef ligature
    if (curr === '\u0644' && next && LAM_ALEF_MAP[next]) {
      const prevConnected = isArabic(prev) && !NON_CONNECTING_AFTER.has(prev) && !!ARABIC_GLYPHS_MAP[prev];
      const lig = LAM_ALEF_MAP[next];
      shapedChars.push(String.fromCharCode(prevConnected ? lig.final : lig.isolated));
      i++; // Skip the next Alef char
      continue;
    }

    const prevConnected = isArabic(prev) && !NON_CONNECTING_AFTER.has(prev) && !!ARABIC_GLYPHS_MAP[prev];
    const nextConnected = isArabic(next) && !!ARABIC_GLYPHS_MAP[next] && curr !== '\u0621' && !NON_CONNECTING_AFTER.has(curr);

    const forms = ARABIC_GLYPHS_MAP[curr];
    let glyphCode: number;

    if (prevConnected && nextConnected) {
      glyphCode = forms.medial;
    } else if (prevConnected) {
      glyphCode = forms.final;
    } else if (nextConnected) {
      glyphCode = forms.initial;
    } else {
      glyphCode = forms.isolated;
    }

    shapedChars.push(String.fromCharCode(glyphCode));
  }

  return shapedChars.join('');
}

/**
 * Converts text into Right-To-Left display order for PDF text engines
 * while preserving numbers and Latin phrases (e.g. "Sale-01", "80 EGP").
 */
export function prepareRtlTextForPdf(text: string): string {
  if (!text) return '';

  // First reshape Arabic letters
  const shaped = reshapeArabicWords(text);

  // Tokenize into Arabic clusters vs Latin/Numbers clusters
  const tokens: { text: string; isRtl: boolean }[] = [];
  let currentToken = '';
  let currentIsRtl = false;

  for (const ch of Array.from(shaped)) {
    const code = ch.charCodeAt(0);
    // Arabic or Arabic Presentation Forms
    const isAr = (code >= 0x0600 && code <= 0x06ff) || (code >= 0xfb50 && code <= 0xfdff) || (code >= 0xfe70 && code <= 0xfeff);

    if (currentToken === '') {
      currentToken = ch;
      currentIsRtl = isAr;
    } else if (isAr === currentIsRtl) {
      currentToken += ch;
    } else {
      tokens.push({ text: currentToken, isRtl: currentIsRtl });
      currentToken = ch;
      currentIsRtl = isAr;
    }
  }
  if (currentToken) {
    tokens.push({ text: currentToken, isRtl: currentIsRtl });
  }

  // Reverse Arabic tokens and overall line direction
  const reversedTokens = tokens.reverse().map((t) => {
    if (t.isRtl) {
      // Reverse Arabic character order so it paints correctly LTR in PDF
      return Array.from(t.text).reverse().join('');
    }
    // Latin / numbers keep internal order
    return t.text;
  });

  return reversedTokens.join('');
}
