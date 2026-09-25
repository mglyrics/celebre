export interface LocationDetectionResult {
  latitude?: number;
  longitude?: number;
  governorate: string;
  detectedAreaName: string;
  isInDeliveryZone: boolean;
  deliveryFee: number;
  deliveryEstimatedTime: string;
  notes?: string;
}

// Beni Suef and nearby regions coordinates & boundaries
export const COVERED_REGIONS = [
  {
    name: "مدينة بني سويف (العاصمة)",
    governorate: "بني سويف",
    fee: 0,
    time: "30 - 45 دقيقة",
    note: "تغطية لكافة المساجد والقاعات - التوصيل غير مشمول"
  },
  {
    name: "شرق النيل - بني سويف",
    governorate: "بني سويف",
    fee: 0,
    time: "35 - 50 دقيقة",
    note: "تغطية كاملة لكافة القاعات والمجمعات"
  },
  {
    name: "مركز ناصر - بني سويف",
    governorate: "بني سويف",
    fee: 50,
    time: "45 - 60 دقيقة",
    note: "توصيل سيارات مجهزة مبردة"
  },
  {
    name: "مركز ببا - بني سويف",
    governorate: "بني سويف",
    fee: 70,
    time: "50 - 70 دقيقة",
    note: "توصيل مباشر"
  },
  {
    name: "مركز إهناسيا - بني سويف",
    governorate: "بني سويف",
    fee: 70,
    time: "50 - 70 دقيقة",
    note: "توصيل مباشر"
  },
  {
    name: "محافظة الفيوم",
    governorate: "الفيوم",
    fee: 150,
    time: "60 - 90 دقيقة",
    note: "للطلبات أكبر من 100 وجبة"
  },
  {
    name: "القاهرة والجيزة",
    governorate: "القاهرة الكبرى",
    fee: 250,
    time: "ساعتان",
    note: "للمناسبات الكبرى (أكثر من 150 وجبة)"
  }
];

export async function detectCustomerLocation(): Promise<LocationDetectionResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        governorate: "بني سويف",
        detectedAreaName: "مدينة بني سويف - شرق النيل",
        isInDeliveryZone: true,
        deliveryFee: 0,
        deliveryEstimatedTime: "30 - 45 دقيقة",
        notes: "تم اختيار المنطقة الافتراضية المعتمدة"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Bounding box approximation for Beni Suef: 28.8 < lat < 29.3, 30.8 < lon < 31.3
        const isBeniSuef = latitude >= 28.7 && latitude <= 29.4 && longitude >= 30.8 && longitude <= 31.4;
        
        if (isBeniSuef) {
          resolve({
            latitude,
            longitude,
            governorate: "بني سويف",
            detectedAreaName: "بني سويف (محدد تلقائياً بنظام GPS)",
            isInDeliveryZone: true,
            deliveryFee: 0,
            deliveryEstimatedTime: "30 - 45 دقيقة",
            notes: "تم التحقق من موقعك ضمن النطاق المجاني لسيلبر"
          });
        } else {
          resolve({
            latitude,
            longitude,
            governorate: "بني سويف",
            detectedAreaName: "موقع الحفل المباشر (GPS)",
            isInDeliveryZone: true,
            deliveryFee: 0,
            deliveryEstimatedTime: "حسب الموعد المحدد",
            notes: "جاهزون للتوصيل لموقع مناسبتك في الموعد بدقة"
          });
        }
      },
      () => {
        resolve({
          governorate: "بني سويف",
          detectedAreaName: "مدينة بني سويف (المركز والمساجد الكبرى)",
          isInDeliveryZone: true,
          deliveryFee: 0,
          deliveryEstimatedTime: "30 - 45 دقيقة",
          notes: "يمكنك تحديد العنوان الدقيق في خانة العنوان"
        });
      },
      { timeout: 6000 }
    );
  });
}
