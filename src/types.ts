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
