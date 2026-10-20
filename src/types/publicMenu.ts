export interface PublicMenuItemComponent {
  name: string;
  quantity: string;
  unit: string;
}

export interface PublicMenuItem {
  id: number;
  code: string;
  name: string;
  description: string;
  distributorPrice: number; // strictly distributor price from Database
  sortOrder: number;
  components: PublicMenuItemComponent[];
}

export interface PublicSettings {
  juiceExclusionDiscount: number; // -5
  pepsiReplacementMarkup: number; // +10
  minOrderQuantity: number;
  officialWhatsappAdmin: string;
}

export interface BookingItemSelection {
  menuCode: string;
  quantity: number;
  drinkOption: 'included' | 'exclude_juice' | 'replace_pepsi';
}

export interface BookingSubmissionData {
  customerName: string;
  phone: string;
  whatsapp: string;
  menuCode?: string;
  quantity?: number;
  drinkOption?: 'included' | 'exclude_juice' | 'replace_pepsi';
  items?: BookingItemSelection[];
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  notes?: string;
  occasion?: string;
  venueType?: string;
  arrivalInstructions?: string;
  idempotencyKey?: string;
}

export interface BookingOrderItemDetail {
  menuCode: string;
  menuName: string;
  quantity: number;
  distributorUnitPrice: number;
  customerAdjustment: number;
  customerTotal: number;
  drinkOption?: string;
  componentsText?: string;
}

export interface BookingOrderResult {
  id?: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  menuCode?: string;
  menuName?: string;
  quantity?: number;
  items?: BookingOrderItemDetail[];
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  customerTotal: number;
  customerPaid: number;
  customerRemaining: number;
  orderStatus: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  order: BookingOrderResult;
  whatsappLink?: string;
}

