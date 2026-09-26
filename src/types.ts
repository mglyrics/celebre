export interface PackagingInfo {
  type: string;
  ribbon: string;
  boxColor?: string;
  dimensions?: string;
  includesCard: boolean;
  includesCutlery: boolean;
}

export interface PackageSection {
  title: string;
  items: string[];
}

export type DrinkModificationId = 'default_juice' | 'pepsi' | 'no_drink';

export interface DrinkModificationOption {
  id: DrinkModificationId;
  label: string;
  sublabel: string;
  priceDelta: number;
  iconName: string;
  description: string;
}

export interface CateringPackage {
  id: string;
  saleCode: string; // e.g. "Sale - 01"
  name: string;
  nameEn: string;
  tagline: string;
  category: 'katb_ketab' | 'wedding' | 'engagement_henna' | 'corporate_special' | 'vip_reception' | 'all' | string;
  pricePerBox: number;
  originalPrice?: number;
  minOrder: number;
  image: string;
  badge?: string;
  isBestseller?: boolean;
  isLuxury?: boolean;
  sections: PackageSection[];
  packaging: PackagingInfo;
  recommendedFor: string[];
  description: string;
}

export interface CartItem {
  package: CateringPackage;
  quantity: number;
  selectedDrink?: DrinkModificationId;
  drinkPriceDelta?: number;
  customRibbonText?: string;
  notes?: string;
}

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  occasion: string;
  eventDate: string;
  eventTime?: string;
  deliveryGovernorate: string;
  deliveryAddress: string;
  detailedNotes?: string;
  paymentMethod: 'instapay' | 'vodafone_cash' | 'cash_on_delivery' | 'bank_transfer';
}

export interface Order {
  id: string;
  customerInfo: OrderCustomerInfo;
  items: CartItem[];
  totalBoxes: number;
  totalPrice: number;
  depositAmount: number; // 50% deposit
  remainingAmount: number;
  status: 'pending' | 'confirmed' | 'in_preparation' | 'delivered';
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  occasion: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  boxesOrdered: number;
}

export interface AdminBooking {
  id: string;
  customerName: string; // اسم صاحب المناسبة
  phone: string; // هاتف العميل
  occasion: string; // نوع المناسبة
  eventDate: string; // تاريخ المناسبة
  eventTime: string; // توقيت المناسبة
  packageCode: string; // كود الوجبة (مثلاً Sale - 04 أو مخصص)
  packageName: string; // الوجبة المطلوبة وتفاصيلها المخصصة
  basePrice: number; // السعر الأساسي للوجبة
  drinkOption: 'juice_included' | 'pepsi_added' | 'no_juice' | 'custom'; // تعديل المشروب
  drinkOptionLabel: string; // نص المشروب
  drinkPriceDelta: number; // +5 أو -5 أو 0
  unitPrice: number; // سعر العلبة الصافي بعد تعديل المشروب
  quantity: number; // عدد الوجبات
  totalPrice: number; // الإجمالي = unitPrice * quantity
  depositPaid: number; // مبلغ الحجز / العربون المسدد
  remainingAmount: number; // الباقي = totalPrice - depositPaid
  paymentStatus: 'deposit_paid' | 'fully_paid' | 'pending_payment' | 'refunded';
  orderStatus: 'confirmed' | 'in_preparation' | 'delivered' | 'cancelled';
  deliveryAddress: string; // مكان المناسبة / التسليم
  phoneAgreementNotes: string; // ملاحظات الاتفاق التليفوني والتخصيص
  createdAt: string;
  updatedAt: string;
}
