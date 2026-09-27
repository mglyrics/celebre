// Location Detection Service for Celebre Catering
// Automatically detects visitor's geographic location and generates the localized hospitality greeting

export interface UserLocationInfo {
  locationName: string;
  governorate: string;
  greeting: string;
  source: 'auto-ip' | 'browser-gps' | 'manual' | 'cached' | 'default';
  detailedAddress?: string;
  detectedAt?: string;
}

export const EGYPT_GOVERNORATES = [
  { id: "beni_suef", name: "بني سويف", greetingTitle: "بأهل بني سويف الكرام 🌹", areas: ["مدينة بني سويف", "ببا", "الفشن", "الواسطى", "ناصر", "إهناسيا", "سمسطا", "بياض العرب", "شرق النيل"] },
  { id: "cairo", name: "القاهرة", greetingTitle: "بأهل القاهرة الكرام 🌹", areas: ["مدينة نصر", "مصر الجديدة", "التجمع والقاهرة الجديدة", "المعادي", "وسط البلد", "الشروق", "مدينتي", "بدر", "حلوان"] },
  { id: "giza", name: "الجيزة", greetingTitle: "بأهل الجيزة الكرام 🌹", areas: ["مدينة 6 أكتوبر", "الشيخ زايد", "الهرم", "فيصل", "الدقي", "العجوزة", "المهندسين", "حدائق الأهرام", "البدرشين"] },
  { id: "fayoum", name: "الفيوم", greetingTitle: "بأهل الفيوم الكرام 🌹", areas: ["مدينة الفيوم", "إطسا", "سنورس", "طامية", "أبشواي", "يوسف الصديق"] },
  { id: "minya", name: "المنيا", greetingTitle: "بأهل المنيا الكرام 🌹", areas: ["مدينة المنيا", "ملوي", "سمالوط", "مغاغة", "بني مزار", "ديرمواس", "مطاي", "أبو قرقاص", "العدوة"] },
  { id: "asyut", name: "أسيوط", greetingTitle: "بأهل أسيوط الكرام 🌹", areas: ["مدينة أسيوط", "ديروط", "القوصية", "أبنوب", "منفلوط", "أبوتيج", "البداري"] },
  { id: "alexandria", name: "الإسكندرية", greetingTitle: "بأهل عروس البحر الأبيض الإسكندرية الكرام 🌹", areas: ["سموحة", "محطة الرمل", "سيدي جابر", "المنتزه", "ميامي", "العجمي", "برج العرب"] },
  { id: "sohag", name: "سوهاج", greetingTitle: "بأهل سوهاج الكرام 🌹", areas: ["مدينة سوهاج", "طهطا", "جرجا", "أخميم", "طما", "المراغة"] },
  { id: "qena", name: "قنا", greetingTitle: "بأهل قنا الكرام 🌹", areas: ["مدينة قنا", "نجع حمادي", "دشنا", "قوص", "أبو تشت"] },
  { id: "luxor", name: "الأقصر", greetingTitle: "بأهل الأقصر الكرام 🌹", areas: ["مدينة الأقصر", "أرمنت", "إسنا", "القرنة", "البياضية"] },
  { id: "aswan", name: "أسوان", greetingTitle: "بأهل أسوان الكرام 🌹", areas: ["مدينة أسوان", "كوم أمبو", "إدفو", "نصر النوبة", "درو"] },
  { id: "sharqia", name: "الشرقية", greetingTitle: "بأهل الشرقية الكرام 🌹", areas: ["الزقازيق", "العاشر من رمضان", "بلبيس", "فاقوس", "منيا القمح", "أبو حماد"] },
  { id: "dakahlia", name: "الدقهلية", greetingTitle: "بأهل الدقهلية والمنصورة الكرام 🌹", areas: ["المنصورة", "ميت غمر", "السنبلاوين", "طلخا", "دكرنس", "بلقاس"] },
  { id: "gharbia", name: "الغربية", greetingTitle: "بأهل الغربية وطنطا الكرام 🌹", areas: ["طنطا", "المحلة الكبرى", "زفتى", "كفر الزيات", "بسيون", "سمنود"] },
  { id: "qalyubia", name: "القليوبية", greetingTitle: "بأهل القليوبية وبنها الكرام 🌹", areas: ["بنها", "شبرا الخيمة", "العبور", "قليوب", "الخانكة", "قها"] },
  { id: "monufia", name: "المنوفية", greetingTitle: "بأهل المنوفية الكرام 🌹", areas: ["شبين الكوم", "منوف", "قويسنا", "أشمون", "مدينة السادات", "الباجور"] },
  { id: "beheira", name: "البحيرة", greetingTitle: "بأهل البحيرة ودمنهور الكرام 🌹", areas: ["دمنهور", "كفر الدوار", "إيتاي البارود", "أبو حمص", "كوم حمادة"] },
  { id: "kafr_el_sheikh", name: "كفر الشيخ", greetingTitle: "بأهل كفر الشيخ الكرام 🌹", areas: ["كفر الشيخ", "دسوق", "بيلا", "فوه", "مطوبس"] },
  { id: "damietta", name: "دمياط", greetingTitle: "بأهل دمياط الكرام 🌹", areas: ["مدينة دمياط", "رأس البر", "دمياط الجديدة", "فارسكور", "الزرقا"] },
  { id: "port_said", name: "بورسعيد", greetingTitle: "بأهل بورسعيد البواسل الكرام 🌹", areas: ["حي الشرق", "حي المناخ", "حي العرب", "بورفؤاد", "حي الزهور"] },
  { id: "ismailia", name: "الإسماعيلية", greetingTitle: "بأهل الإسماعيلية الكرام 🌹", areas: ["مدينة الإسماعيلية", "فايد", "القنطرة غرب", "التل الكبير"] },
  { id: "suez", name: "السويس", greetingTitle: "بأهل السويس البواسل الكرام 🌹", areas: ["مدينة السويس", "حي الأربعين", "حي السويس", "العين السخنة"] },
  { id: "red_sea", name: "البحر الأحمر", greetingTitle: "بأهل البحر الأحمر والغردقة الكرام 🌹", areas: ["الغردقة", "الجونة", "سفاجا", "القصير", "مرسى علم"] },
  { id: "matrouh", name: "مطروح والساحل", greetingTitle: "بأهل مطروح والساحل الشمالي الكرام 🌹", areas: ["مرسى مطروح", "العلمين الجديدة", "الساحل الشمالي", "الحمام", "الضبعة"] }
];

const STORAGE_KEY = "celebre_user_location";

// Clean and normalize text to Arabic location
export function cleanLocationName(rawText: string): { locationName: string; greeting: string; governorate: string } {
  const text = (rawText || "").toLowerCase();

  for (const gov of EGYPT_GOVERNORATES) {
    if (text.includes(gov.name.toLowerCase())) {
      return {
        locationName: gov.name,
        governorate: gov.name,
        greeting: `أهلاً.. ${gov.greetingTitle}`
      };
    }
    for (const area of gov.areas) {
      if (text.includes(area.toLowerCase())) {
        return {
          locationName: `${gov.name} (${area})`,
          governorate: gov.name,
          greeting: `أهلاً.. ${gov.greetingTitle}`
        };
      }
    }
  }

  // Transliterations
  if (text.includes("beni suef") || text.includes("biba") || text.includes("wasta")) {
    return { locationName: "بني سويف", governorate: "بني سويف", greeting: "أهلاً.. بأهل بني سويف الكرام 🌹" };
  }
  if (text.includes("cairo") || text.includes("qahirah") || text.includes("nasr")) {
    return { locationName: "القاهرة", governorate: "القاهرة", greeting: "أهلاً.. بأهل القاهرة الكرام 🌹" };
  }
  if (text.includes("giza") || text.includes("jizah") || text.includes("october") || text.includes("zayed")) {
    return { locationName: "الجيزة", governorate: "الجيزة", greeting: "أهلاً.. بأهل الجيزة الكرام 🌹" };
  }
  if (text.includes("faiyum") || text.includes("fayoum")) {
    return { locationName: "الفيوم", governorate: "الفيوم", greeting: "أهلاً.. بأهل الفيوم الكرام 🌹" };
  }
  if (text.includes("minya") || text.includes("mallawi")) {
    return { locationName: "المنيا", governorate: "المنيا", greeting: "أهلاً.. بأهل المنيا الكرام 🌹" };
  }
  if (text.includes("asyut") || text.includes("assiut")) {
    return { locationName: "أسيوط", governorate: "أسيوط", greeting: "أهلاً.. بأهل أسيوط الكرام 🌹" };
  }
  if (text.includes("alexandria")) {
    return { locationName: "الإسكندرية", governorate: "الإسكندرية", greeting: "أهلاً.. بأهل عروس البحر الأبيض الإسكندرية الكرام 🌹" };
  }

  if (rawText && rawText.trim().length > 1) {
    const clean = rawText.replace(/محافظة/g, "").trim();
    return {
      locationName: clean,
      governorate: clean,
      greeting: `أهلاً.. بأهل ${clean} الكرام 🌹`
    };
  }

  return {
    locationName: "بني سويف ومصر",
    governorate: "بني سويف",
    greeting: "أهلاً.. بأهل بني سويف ومصر الكرام 🌹"
  };
}

// Get cached location from localStorage
export function getSavedLocation(): UserLocationInfo | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.locationName && parsed.greeting) {
        return { ...parsed, source: 'cached' };
      }
    }
  } catch (e) {
    console.error("Error reading saved location:", e);
  }
  return null;
}

// Save location to localStorage
export function saveLocation(loc: UserLocationInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...loc,
      detectedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.error("Error saving location:", e);
  }
}

// 1. Fast Auto-Detection via API (No popup required)
export async function detectLocationAuto(): Promise<UserLocationInfo> {
  const cached = getSavedLocation();
  if (cached && cached.source === 'manual') {
    return cached;
  }

  try {
    const res = await fetch("/api/detect-location");
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.locationName) {
        const info: UserLocationInfo = {
          locationName: data.locationName,
          governorate: data.locationName,
          greeting: data.greeting || `أهلاً.. بأهل ${data.locationName} الكرام 🌹`,
          source: 'auto-ip'
        };
        saveLocation(info);
        return info;
      }
    }
  } catch (e) {
    console.warn("Backend location detection failed, trying direct client lookup:", e);
  }

  // Client-side fallback if backend route fails
  try {
    const fallbackRes = await fetch("https://ipwho.is/?lang=ar");
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data.success) {
        const text = `${data.city || ""} ${data.region || ""}`;
        const normalized = cleanLocationName(text);
        const info: UserLocationInfo = {
          locationName: normalized.locationName,
          governorate: normalized.governorate,
          greeting: normalized.greeting,
          source: 'auto-ip'
        };
        saveLocation(info);
        return info;
      }
    }
  } catch (e) {
    console.warn("Client fallback geoip failed:", e);
  }

  // Fallback to default
  const defaultLoc: UserLocationInfo = {
    locationName: "بني سويف",
    governorate: "بني سويف",
    greeting: "أهلاً.. بأهل بني سويف ومصر الكرام 🌹",
    source: 'default'
  };
  return cached || defaultLoc;
}

// 2. High-Accuracy Browser GPS Detection (When user requests or authorizes)
export async function detectLocationGPS(): Promise<UserLocationInfo> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("خاصية تحديد الموقع الجغرافي غير مدعومة في متصفحك"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode via OpenStreetMap Nominatim with Arabic language
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`;
          const res = await fetch(url, { headers: { "Accept-Language": "ar" } });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || "";
            const state = addr.state || "";
            const combined = `${city} ${state}`.trim();
            const normalized = cleanLocationName(combined);

            const detailedAddress = [city, state].filter(Boolean).join(" - ");

            const info: UserLocationInfo = {
              locationName: city || normalized.locationName,
              governorate: normalized.governorate,
              greeting: `أهلاً.. بأهل ${city || normalized.locationName} الكرام 🌹`,
              detailedAddress: detailedAddress || data.display_name,
              source: 'browser-gps'
            };
            saveLocation(info);
            resolve(info);
            return;
          }
        } catch (err) {
          console.error("Nominatim reverse geocode error:", err);
        }

        // Coordinate fallback check
        const info: UserLocationInfo = {
          locationName: "منطقتكم الحالية 📍",
          governorate: "بني سويف",
          greeting: "أهلاً.. بكم وبأهل منطقتكم الكرام 🌹",
          source: 'browser-gps'
        };
        saveLocation(info);
        resolve(info);
      },
      (err) => {
        let msg = "تعذر تحديد الموقع الجغرافي عبر المتصفح.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "تم رفض إذن الوصول إلى الموقع في المتصفح. يمكنك اختيار محافظتك يدوياً.";
        }
        reject(new Error(msg));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}
