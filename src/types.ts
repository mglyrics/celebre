export type OccasionCategory = 
  | 'all'
  | 'katb_ketab' 
  | 'wedding' 
  | 'engagement_henna' 
  | 'aqiqa_baby' 
  | 'vip_reception' 
  | 'sweets_hospitality';

export interface PackageFoodSection {
  title: string;
  items: string[];
}

export interface CateringPackage {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  category: OccasionCategory;
  pricePerBox: number;
  originalPrice?: number;
  minOrder: number;
  image: string;
  badge?: string;
  isBestseller?: boolean;
  isLuxury?: boolean;
  sections: PackageFoodSection[];
  packaging: {
    type: string;
    ribbon: string;
    includesCard: boolean;
    includesCutlery: boolean;
  };
  recommendedFor: string[];
  description: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  category: 'savory_pastry' | 'meats_skewers' | 'salads_appetizers' | 'oriental_sweets' | 'french_pastry' | 'drinks_water';
  categoryLabel: string;
  priceDelta: number;
  description: string;
  badge?: string;
  iconName?: string;
}

export interface PackagingOption {
  id: string;
  name: string;
  description: string;
  priceExtra: number;
  color: string;
  texture: string;
  ribbonColor: string;
}

export interface CustomBoxState {
  packagingId: string;
  selectedItems: Record<string, number>; // itemId -> count
  selectedDrinkId: string;
  ribbonColor: string;
  customCardText: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  type: 'preset' | 'custom';
  name: string;
  details: string[];
  packagingName: string;
  quantity: number;
  pricePerBox: number;
  totalPrice: number;
  customCardText?: string;
}

export interface OrderSubmission {
  id?: string;
  customerName: string;
  phone: string;
  secondaryPhone?: string;
  occasion: string;
  eventDate: string;
  eventTime: string;
  governorate: string;
  venueName: string;
  address: string;
  items: OrderItem[];
  totalBoxes: number;
  totalAmount: number;
  notes?: string;
  paymentMethod: 'instapay' | 'cash_deposit' | 'bank_transfer' | string;
  customCardText?: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  occasion: string;
  eventDate: string;
  rating: number;
  comment: string;
  verified: boolean;
  avatarText: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}
