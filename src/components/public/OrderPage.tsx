import React, { useState, useEffect, useMemo } from "react";
import {
  Package, ShoppingBag, Sparkles, Check, Plus, Minus, Trash2,
  Calendar, Clock, MapPin, User, Phone, MessageCircle, AlertCircle,
  ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Share2,
  Printer, ArrowLeft, Filter, Search, Info, ExternalLink, RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import { PublicMenuItem, BookingItemSelection, BookingOrderResult } from "../../types/publicMenu";
import { OFFICIAL_18_MENU_ITEMS } from "../../data/fallbackMenu";
import { getSaleImage } from "../../data/saleImages";

interface OrderPageProps {
  menuItems?: PublicMenuItem[];
  onBookingSuccess?: (order: BookingOrderResult, whatsappLink?: string) => void;
  onNavigateHome?: () => void;
}

interface CartItem extends BookingItemSelection {
  item: PublicMenuItem;
  hasJuice: boolean;
  basePrice: number;
  drinkAdjustment: number;
  unitPrice: number;
  totalPrice: number;
}

export const OrderPage: React.FC<OrderPageProps> = ({
  menuItems,
  onBookingSuccess,
  onNavigateHome,
}) => {
  const activeMenu = (menuItems && menuItems.length > 0) ? menuItems : OFFICIAL_18_MENU_ITEMS;

  // Active Category: "all" | "mix" (Sale-01 to Sale-12) | "sandwich" (Sale-13 to Sale-18)
  const [activeCategory, setActiveCategory] = useState<"mix" | "sandwich" | "all">("mix");
  const [searchQuery, setSearchQuery] = useState("");

  // Multi-item cart
  const [cart, setCart] = useState<Record<string, { quantity: number; drinkOption: 'included' | 'exclude_juice' | 'replace_pepsi' }>>({});

  // Customer & Delivery Information
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("المغرب 06:30 م");
  const [pickupLocation, setPickupLocation] = useState("");
  const [venueType, setVenueType] = useState("قاعة");
  const [occasion, setOccasion] = useState("عقد قران");
  const [arrivalInstructions, setArrivalInstructions] = useState("");
  const [notes, setNotes] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<BookingOrderResult | null>(null);
  const [completedWhatsappLink, setCompletedWhatsappLink] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Sync WhatsApp with phone
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone);
    }
  }, [phone, sameAsPhone]);

  // Set default pickup date (tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setPickupDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Separate the 18 items into Mix Box (Sale-01 to Sale-12) and Sandwich Box (Sale-13 to Sale-18)
  const mixBoxItems = useMemo(() => {
    return activeMenu.filter((item) => {
      const num = parseInt(item.code.replace(/[^\d]/g, ""), 10);
      return !isNaN(num) && num >= 1 && num <= 12;
    });
  }, [activeMenu]);

  const sandwichBoxItems = useMemo(() => {
    return activeMenu.filter((item) => {
      const num = parseInt(item.code.replace(/[^\d]/g, ""), 10);
      return !isNaN(num) && num >= 13 && num <= 18;
    });
  }, [activeMenu]);

  // Filtered displayed items
  const displayedItems = useMemo(() => {
    let list: PublicMenuItem[] = [];
    if (activeCategory === "mix") {
      list = mixBoxItems;
    } else if (activeCategory === "sandwich") {
      list = sandwichBoxItems;
    } else {
      list = activeMenu;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.trim().toLowerCase();
    return list.filter((item) => {
      const matchCode = item.code.toLowerCase().includes(query);
      const matchName = item.name.toLowerCase().includes(query);
      const matchComp = item.components.some((c) => c.name.toLowerCase().includes(query));
      return matchCode || matchName || matchComp;
    });
  }, [activeCategory, mixBoxItems, sandwichBoxItems, activeMenu, searchQuery]);

  // Helper: does meal actually contain juice?
  const mealHasJuice = (item: PublicMenuItem): boolean => {
    return item.components.some(
      (c) => c.name.includes("عصير") || c.name.includes("بخيرة") || (c as any).isBeverage === true
    );
  };

  // Convert cart mapping to array of computed CartItems
  const cartItemsList: CartItem[] = useMemo(() => {
    const list: CartItem[] = [];
    for (const [code, entry] of Object.entries(cart)) {
      if (entry.quantity <= 0) continue;
      const item = activeMenu.find((m) => m.code === code);
      if (!item) continue;

      const hasJuice = mealHasJuice(item);
      const basePrice = item.distributorPrice;

      // Apply drink adjustment ONLY if item actually has juice in its components
      let drinkAdjustment = 0;
      if (hasJuice) {
        if (entry.drinkOption === "exclude_juice") {
          drinkAdjustment = -5;
        } else if (entry.drinkOption === "replace_pepsi") {
          drinkAdjustment = 10;
        }
      }

      const unitPrice = Math.max(0, basePrice + drinkAdjustment);
      const totalPrice = unitPrice * entry.quantity;

      list.push({
        menuCode: code,
        quantity: entry.quantity,
        drinkOption: entry.drinkOption,
        item,
        hasJuice,
        basePrice,
        drinkAdjustment,
        unitPrice,
        totalPrice,
      });
    }
    return list;
  }, [cart, activeMenu]);

  // Aggregate totals
  const totalMealsCount = cartItemsList.reduce((sum, it) => sum + it.quantity, 0);
  const totalSubtotal = cartItemsList.reduce((sum, it) => sum + (it.basePrice * it.quantity), 0);
  const totalAdjustments = cartItemsList.reduce((sum, it) => sum + (it.drinkAdjustment * it.quantity), 0);
  const totalGrandAmount = cartItemsList.reduce((sum, it) => sum + it.totalPrice, 0);

  // Cart operations
  const handleUpdateQuantity = (code: string, newQty: number) => {
    setCart((prev) => {
      const current = prev[code] || { quantity: 0, drinkOption: 'included' };
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[code];
        return next;
      }
      return {
        ...prev,
        [code]: { ...current, quantity: newQty },
      };
    });
  };

  const handleUpdateDrinkOption = (code: string, option: 'included' | 'exclude_juice' | 'replace_pepsi') => {
    setCart((prev) => {
      const current = prev[code] || { quantity: 50, drinkOption: 'included' };
      return {
        ...prev,
        [code]: { ...current, drinkOption: option },
      };
    });
  };

  const handleAddDefaultMeal = (code: string) => {
    setCart((prev) => {
      const current = prev[code];
      const newQty = current ? current.quantity + 25 : (totalMealsCount === 0 ? 50 : 25);
      return {
        ...prev,
        [code]: {
          quantity: newQty,
          drinkOption: current ? current.drinkOption : 'included',
        },
      };
    });
  };

  const handleRemoveFromCart = (code: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Submit preliminary booking
  const handleSubmitBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (cartItemsList.length === 0) {
      setErrorMessage("يرجى اختيار وجبة واحدة على الأقل من باقات سيلبر للطلب");
      return;
    }

    if (totalMealsCount < 50) {
      setErrorMessage(`إجمالي عدد الوجبات الحالي هو ${totalMealsCount} وجبة. الحد الأدنى لتجهيز البوفيه والكاترينج هو 50 وجبة.`);
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("يرجى إدخال اسم العميل بالكامل");
      return;
    }

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage("يرجى إدخال رقم هاتف صحيح (11 رقم للتواصل في مصر)");
      return;
    }

    if (!pickupDate) {
      setErrorMessage("يرجى تحديد تاريخ المناسبة / الاستلام");
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload: BookingItemSelection[] = cartItemsList.map((it) => ({
        menuCode: it.menuCode,
        quantity: it.quantity,
        drinkOption: it.drinkOption,
      }));

      const finalWhatsapp = sameAsPhone ? phone.trim() : (whatsapp.trim() || phone.trim());

      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          whatsapp: finalWhatsapp,
          items: itemsPayload,
          pickupDate,
          pickupTime,
          pickupLocation: pickupLocation.trim() || "سيتم التنسيق هاتفياً عبر واتساب",
          venueType,
          occasion,
          arrivalInstructions: arrivalInstructions.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تسجيل طلب الحجز المبدئي");
      }

      setCompletedOrder(data.order);
      setCompletedWhatsappLink(data.whatsappLink);
      setShowReviewModal(false);

      if (onBookingSuccess) {
        onBookingSuccess(data.order, data.whatsappLink);
      }

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#721832", "#C89B3C", "#25D366", "#FAF7F2"],
        });
      } catch {}

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ أثناء إرسال طلب الحجز، يرجى المحاولة ثانية");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-[#E8DFD1] overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#721832] via-[#5C1027] to-[#721832] text-white p-6 sm:p-8 text-center relative">
            <div className="w-16 h-16 bg-[#C89B3C]/20 border-2 border-[#C89B3C] rounded-full flex items-center justify-center mx-auto mb-4 text-[#C89B3C]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="inline-block bg-[#C89B3C] text-[#221B17] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              تم استلام طلب الحجز المبدئي بنجاح
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              شكراً لاختيارك سيلبر كاترينج
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-2 max-w-md mx-auto">
              حجزك مسجل لدينا بصورة مبدئية غير مدفوعة برقم الحجز المرجعي أدناه. لا يُطلب أي دفع إلكتروني الآن.
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#E8DFD1] text-center">
              <span className="text-xs text-[#6B5E55] block mb-1">رقم الحجز المعتمد في النظام</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#721832] tracking-wider">
                {completedOrder.orderNumber}
              </div>
              <span className="inline-block mt-2 text-[11px] font-bold px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                حالة الحجز: حجز مبدئي قيد مراجعة المنسق (PENDING_BOOKING)
              </span>
            </div>

            {/* Order Items Snapshot */}
            <div className="space-y-3">
              <h3 className="font-black text-sm text-[#221B17] flex items-center gap-2 border-b border-[#E8DFD1] pb-2">
                <Package className="w-4 h-4 text-[#C89B3C]" />
                <span>الوجبات والباقات المطلوبة:</span>
              </h3>
              <div className="divide-y divide-[#E8DFD1] bg-[#FAF7F2]/60 rounded-xl p-3 border border-[#E8DFD1]">
                {completedOrder.items && completedOrder.items.length > 0 ? (
                  completedOrder.items.map((it, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#221B17]">
                          <span className="text-[#721832] ml-1">[{it.menuCode}]</span>
                          <span>{it.menuName}</span>
                        </div>
                        <div className="text-[11px] text-[#6B5E55] mt-0.5">
                          الكمية: <strong>{it.quantity} وجبة</strong>
                          {it.customerAdjustment !== 0 && (
                            <span className="mr-2 text-[#721832]">
                              (تعديل المشروب: {it.customerAdjustment > 0 ? `+${it.customerAdjustment}` : it.customerAdjustment} ج.م)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <span className="font-black text-sm text-[#221B17]">{it.customerTotal.toLocaleString('en-US')} ج.م</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-xs flex justify-between">
                    <span>{completedOrder.menuName || completedOrder.menuCode} ({completedOrder.quantity} وجبة)</span>
                    <span className="font-bold font-mono">{completedOrder.customerTotal.toLocaleString('en-US')} ج.م</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] space-y-2 text-xs">
              <div className="flex justify-between text-[#6B5E55]">
                <span>إجمالي قيمة الحجز التقديرية:</span>
                <span className="font-bold font-mono text-[#221B17] text-sm">
                  {completedOrder.customerTotal.toLocaleString('en-US')} ج.م
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>المبلغ المدفوع الآن:</span>
                <span>0.00 ج.م (حجز غير مدفوع)</span>
              </div>
              <div className="flex justify-between text-[#721832] font-black border-t border-[#E8DFD1] pt-2 text-sm">
                <span>الرصيد المتبقي على العميل:</span>
                <span className="font-mono">{completedOrder.customerTotal.toLocaleString('en-US')} ج.م</span>
              </div>
              <div className="text-[11px] text-[#8C6D28] bg-amber-50/70 p-2 rounded-lg mt-2">
                • يتم تأكيد الحجز وسداد العربون بعد مراجعة الإدارة والتنسيق الهاتفي معك، دون أي خصم إلكتروني من الموقع.
              </div>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1]">
              <div>
                <span className="text-[#6B5E55] block">العميل:</span>
                <span className="font-bold text-[#221B17]">{completedOrder.customerName}</span>
              </div>
              <div>
                <span className="text-[#6B5E55] block">رقم التواصل:</span>
                <span className="font-bold font-mono text-[#221B17]">{completedOrder.phone}</span>
              </div>
              <div>
                <span className="text-[#6B5E55] block">تاريخ المناسبة:</span>
                <span className="font-bold text-[#221B17]">{completedOrder.pickupDate} ({completedOrder.pickupTime})</span>
              </div>
              <div>
                <span className="text-[#6B5E55] block">مكان التسليم:</span>
                <span className="font-bold text-[#221B17]">{completedOrder.pickupLocation}</span>
              </div>
            </div>

            {/* Action Buttons: WhatsApp Coordinator & Messenger */}
            <div className="space-y-3 pt-2">
              {completedWhatsappLink && (
                <a
                  href={completedWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01]"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>تأكيد الحجز فوراً مع المنسق عبر واتساب</span>
                </a>
              )}

              <a
                href="https://m.me/celebre.catering"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#0084FF] hover:bg-[#0073E6] text-white font-black text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
              >
                <Share2 className="w-4 h-4" />
                <span>العودة لمحادثة فيسبوك ماسنجر (Facebook Messenger)</span>
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-white hover:bg-[#FAF7F2] text-[#221B17] border border-[#E8DFD1] font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#6B5E55]" />
                  <span>طباعة ملخص الحجز</span>
                </button>
                <button
                  onClick={() => {
                    setCompletedOrder(null);
                    setCart({});
                    window.location.hash = "#menu";
                  }}
                  className="flex-1 bg-[#721832] hover:bg-[#5C1027] text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#C89B3C]" />
                  <span>حجز باقة جديدة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-4 sm:py-8 px-3 sm:px-6 lg:px-8 text-[#221B17]" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Facebook Messenger Header Banner */}
        <div className="bg-gradient-to-r from-[#721832] via-[#5C1027] to-[#721832] text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-[#C89B3C]/30 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#C89B3C]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-[#C89B3C] text-[#221B17] text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  بوابة الحجز المباشر • فيسبوك ماسنجر
                </span>
                <span className="bg-white/10 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                  celebre-eg.com/order
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white">
                حجز بوفيه ووجبات كاترينج سيلبر (Celebre Catering)
              </h1>
              <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                اختر وجباتك من القائمتين المعتمدتين أدناه: ميكس بوكس (Sale-01 إلى Sale-12) أو سندوتش بوكس (Sale-13 إلى Sale-18)، مع إمكانية إضافة أكثر من وجبة في نفس الحجز وتعديل المشروب.
              </p>
            </div>

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="self-start md:self-auto bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>العودة للموقع الرئيسي</span>
              </button>
            )}
          </div>
        </div>

        {/* Layout Grid: Left Menu Items (65%) | Right Cart & Customer Form (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* =======================================================================
              SECTION 1: THE TWO CATALOGS (MIX BOX & SANDWICH BOX) (7 cols)
              ======================================================================= */}
          <div className="lg:col-span-7 space-y-4">

            {/* Category Tabs: Mix Box vs Sandwich Box */}
            <div className="bg-white rounded-2xl p-2 border border-[#E8DFD1] shadow-2xs flex flex-wrap sm:flex-nowrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("mix")}
                className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeCategory === "mix"
                    ? "bg-[#721832] text-white shadow-xs"
                    : "bg-[#FAF7F2] text-[#4A3E38] hover:bg-[#E8DFD1]/50"
                }`}
              >
                <span>🍱 ميكس بوكس (Mix Box)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeCategory === "mix" ? "bg-[#C89B3C] text-[#221B17]" : "bg-[#E8DFD1] text-[#6B5E55]"
                }`}>
                  Sale-01 إلى Sale-12
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("sandwich")}
                className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeCategory === "sandwich"
                    ? "bg-[#721832] text-white shadow-xs"
                    : "bg-[#FAF7F2] text-[#4A3E38] hover:bg-[#E8DFD1]/50"
                }`}
              >
                <span>🥪 سندوتش بوكس (Sandwich Box)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeCategory === "sandwich" ? "bg-[#C89B3C] text-[#221B17]" : "bg-[#E8DFD1] text-[#6B5E55]"
                }`}>
                  Sale-13 إلى Sale-18
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`py-3 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-[#721832] text-white shadow-xs"
                    : "bg-[#FAF7F2] text-[#6B5E55] hover:bg-[#E8DFD1]/50"
                }`}
              >
                الكل (18)
              </button>
            </div>

            {/* Quick search & information note */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C6D28] absolute right-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث بكود الوجبة أو المكونات (مثال: Sale-05 أو كفتة)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E8DFD1] rounded-xl pr-10 pl-3 py-2 text-xs text-[#221B17] focus:outline-none focus:ring-2 focus:ring-[#721832]"
                />
              </div>
              <div className="text-[11px] text-[#6B5E55] hidden sm:block whitespace-nowrap bg-white px-3 py-2 rounded-xl border border-[#E8DFD1]">
                عرض <strong>{displayedItems.length}</strong> وجبة
              </div>
            </div>

            {/* Meals Cards List */}
            <div className="space-y-3.5">
              {displayedItems.map((item) => {
                const itemImg = getSaleImage(item.code);
                const hasJuice = mealHasJuice(item);
                const inCart = cart[item.code];
                const cartQty = inCart ? inCart.quantity : 0;
                const chosenDrink = inCart ? inCart.drinkOption : "included";

                return (
                  <div
                    key={item.code}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      cartQty > 0
                        ? "border-[#721832] shadow-sm ring-1 ring-[#721832]/30"
                        : "border-[#E8DFD1] hover:border-[#C89B3C]"
                    }`}
                  >
                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3.5">
                      {/* Thumbnail Image */}
                      <div className="w-full sm:w-28 h-28 sm:h-28 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 relative border border-[#E8DFD1]">
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute top-1.5 right-1.5 bg-[#721832] text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                          {item.code}
                        </span>
                      </div>

                      {/* Content & Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-black text-sm text-[#221B17]">
                              {item.name}
                            </h3>
                            <div className="text-[11px] text-[#6B5E55] mt-0.5">
                              {item.description}
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-[10px] text-[#6B5E55] block">سعر الموزع الرسمي</span>
                            <span className="text-base font-black font-mono text-[#721832]">
                              {item.distributorPrice} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Components tags */}
                        <div className="flex flex-wrap gap-1">
                          {item.components.map((c, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                                c.name.includes("عصير")
                                  ? "bg-amber-50 text-amber-900 border-amber-200"
                                  : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1]"
                              }`}
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>

                        {/* Drink Modification Selection */}
                        <div className="pt-2 border-t border-[#E8DFD1]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] text-[#6B5E55] font-bold">المشروب:</span>
                            {hasJuice ? (
                              <select
                                value={chosenDrink}
                                onChange={(e) => handleUpdateDrinkOption(item.code, e.target.value as any)}
                                className="bg-[#FAF7F2] border border-[#E8DFD1] text-[11px] font-bold text-[#221B17] py-1 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#721832]"
                              >
                                <option value="included">عصير بخيرة (مشمول • 0 ج.م)</option>
                                <option value="exclude_juice">استبعاد العصير (خصم 5 ج.م)</option>
                                <option value="replace_pepsi">استبدال ببيبسي (+10 ج.م)</option>
                              </select>
                            ) : (
                              <span className="text-[10px] text-[#6B5E55] bg-gray-100 px-2 py-0.5 rounded font-bold">
                                لا تحتوي على عصير (بدون تعديل)
                              </span>
                            )}
                          </div>

                          {/* Add / Quantity Control */}
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {cartQty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#721832]/40">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.code, Math.max(0, cartQty - 10))}
                                  className="w-7 h-7 bg-white hover:bg-red-50 text-red-700 rounded-lg flex items-center justify-center font-bold text-xs border border-[#E8DFD1] cursor-pointer"
                                  title="إنقاص 10 وجبات"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  value={cartQty}
                                  onChange={(e) => handleUpdateQuantity(item.code, parseInt(e.target.value, 10) || 0)}
                                  className="w-14 text-center font-mono font-black text-xs bg-transparent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.code, cartQty + 10)}
                                  className="w-7 h-7 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xs border border-[#E8DFD1] cursor-pointer"
                                  title="زيادة 10 وجبات"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddDefaultMeal(item.code)}
                                className="bg-[#721832] hover:bg-[#5C1027] text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#C89B3C]" />
                                <span>إضافة للطلب</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =======================================================================
              SECTION 2: MULTI-ITEM ORDER SUMMARY & CUSTOMER DETAILS (5 cols)
              ======================================================================= */}
          <div className="lg:col-span-5 space-y-4">

            {/* Cart & Calculation Summary Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8DFD1] shadow-md space-y-4 sticky top-4">
              <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#721832] text-[#C89B3C] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-sm text-[#221B17]">ملخص سلة الحجز</h2>
                    <span className="text-[10px] text-[#6B5E55]">
                      {cartItemsList.length > 0 ? `${cartItemsList.length} وجبات مختارة` : "السلة فارغة حالياً"}
                    </span>
                  </div>
                </div>

                {cartItemsList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] text-red-700 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تفريغ</span>
                  </button>
                )}
              </div>

              {/* Items in Cart */}
              {cartItemsList.length > 0 ? (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 divide-y divide-[#E8DFD1]/60">
                  {cartItemsList.map((it) => (
                    <div key={it.menuCode} className="pt-2 flex items-start justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#221B17] flex items-center gap-1">
                          <span className="text-[#721832] font-mono">[{it.menuCode}]</span>
                          <span>{it.item.name}</span>
                        </div>
                        <div className="text-[11px] text-[#6B5E55]">
                          الكمية: <strong>{it.quantity} وجبة</strong> × {it.unitPrice} ج.م
                          {it.drinkAdjustment !== 0 && (
                            <span className="text-[#721832] mr-1">
                              ({it.drinkOption === "exclude_juice" ? "بدون عصير" : "بيبسي"})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left shrink-0 font-mono font-bold text-xs text-[#221B17]">
                        {it.totalPrice.toLocaleString('en-US')} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#FAF7F2] rounded-2xl p-6 text-center text-xs text-[#6B5E55] space-y-1">
                  <Package className="w-8 h-8 text-[#C89B3C] mx-auto opacity-70" />
                  <p className="font-bold">لم تختر أي وجبة بعد</p>
                  <p className="text-[11px] text-[#8C6D28]">اضغط على زر "إضافة للطلب" عند أي وجبة لإضافتها هنا</p>
                </div>
              )}

              {/* Real-time Financial Calculations */}
              <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#E8DFD1] space-y-2 text-xs">
                <div className="flex justify-between text-[#6B5E55]">
                  <span>إجمالي الوجبات المطلوبة:</span>
                  <span className={`font-mono font-black ${totalMealsCount >= 50 ? "text-emerald-700" : "text-amber-800"}`}>
                    {totalMealsCount} وجبة
                    {totalMealsCount < 50 && " (الحد الأدنى 50)"}
                  </span>
                </div>

                <div className="flex justify-between text-[#6B5E55]">
                  <span>السعر الأساسي للوجبات:</span>
                  <span className="font-mono font-bold text-[#221B17]">
                    {totalSubtotal.toLocaleString('en-US')} ج.م
                  </span>
                </div>

                {totalAdjustments !== 0 && (
                  <div className="flex justify-between text-[#721832]">
                    <span>صافي تعديل المشروبات:</span>
                    <span className="font-mono font-bold">
                      {totalAdjustments > 0 ? `+${totalAdjustments.toLocaleString('en-US')}` : totalAdjustments.toLocaleString('en-US')} ج.م
                    </span>
                  </div>
                )}

                <div className="border-t border-[#E8DFD1] pt-2 flex justify-between items-center text-sm font-black text-[#721832]">
                  <span>الإجمالي التقديري للطلب:</span>
                  <span className="text-base font-mono">
                    {totalGrandAmount.toLocaleString('en-US')} ج.م
                  </span>
                </div>

                <div className="text-[10px] text-[#8C6D28] bg-white p-2 rounded-lg font-medium leading-relaxed">
                  🔒 حجز مبدئي غير مدفوع: لا يتم خصم أي مبالغ من الموقع. يتم اعتماد الدفع بعد مراجعة المنسق.
                </div>
              </div>

              {/* Customer Details Form */}
              <form onSubmit={(e) => { e.preventDefault(); setShowReviewModal(true); }} className="space-y-3 pt-2">
                <h3 className="font-black text-xs text-[#221B17] flex items-center gap-1.5 border-b border-[#E8DFD1] pb-1.5">
                  <User className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>بيانات العميل ومكان التسليم:</span>
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-[#4A3E38] block mb-1">
                    اسم العميل بالكامل *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: د. أحمد محمد محمود"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3 py-2 text-xs text-[#221B17] focus:outline-none focus:ring-1 focus:ring-[#721832]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#4A3E38] block mb-1">
                      رقم الهاتف (مصر) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="010XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3 py-2 text-xs font-mono text-[#221B17] focus:outline-none focus:ring-1 focus:ring-[#721832]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4A3E38] block mb-1">
                      رقم الواتساب
                    </label>
                    <input
                      type="tel"
                      disabled={sameAsPhone}
                      placeholder="010XXXXXXXX"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono text-[#221B17] focus:outline-none focus:ring-1 focus:ring-[#721832] ${
                        sameAsPhone ? "bg-gray-100 border-[#E8DFD1] text-[#6B5E55]" : "bg-[#FAF7F2] border-[#E8DFD1]"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="samePhone"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#721832] rounded border-[#E8DFD1]"
                  />
                  <label htmlFor="samePhone" className="text-[11px] text-[#6B5E55] cursor-pointer">
                    رقم الواتساب مطابق لرقم الهاتف
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#4A3E38] block mb-1">
                      تاريخ المناسبة / التسليم *
                    </label>
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3 py-2 text-xs text-[#221B17] focus:outline-none focus:ring-1 focus:ring-[#721832]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4A3E38] block mb-1">
                      وقت الاستلام المفضل
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3 py-2 text-xs text-[#221B17] focus:outline-none focus:ring-1 focus:ring-[#721832]"
                    >
                      <option value="الظهر 01:00 م">الظهر 01:00 م</option>
                      <option value="العصر 04:30 م">العصر 04:30 م</option>
                      <option value="المغرب 06:30 م">المغرب 06:30 م</option>
                      <option value="العشاء 08:30 م">العشاء 08:30 م</option>
                      <option value="السهرة 10:00 م">السهرة 10:00 م</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#4A3E38] block mb-1">
                    مكان وعنوان التسليم / القاعة / المحافظة *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: قاعة اللوتس - كورنيش النيل - بني سويف"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3 py-2 text-xs text-[#221B17] focus:outline-none focus:ring-1 focus:ring-[#721832]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#4A3E38] block mb-1">
                    ملاحظات خاصة بالتجهيز أو التغليف
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أي طلبات خاصة بطريقة التقديم أو التوصيل..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3 py-2 text-xs text-[#221B17] focus:outline-none focus:ring-1 focus:ring-[#721832]"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit / Review Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || cartItemsList.length === 0}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    cartItemsList.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#721832] hover:bg-[#5C1027] text-white hover:scale-[1.01]"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#C89B3C]" />
                  <span>مراجعة وتأكيد طلب الحجز المبدئي</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* =======================================================================
            REVIEW & CONFIRMATION MODAL BEFORE SENDING
            ======================================================================= */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E8DFD1] shadow-2xl p-6 space-y-4" dir="rtl">
              <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#721832] text-[#C89B3C] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-base text-[#221B17]">مراجعة تفاصيل الحجز قبل الإرسال</h3>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#6B5E55] flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Order Items Breakdown */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-[#4A3E38]">الوجبات والكميات:</h4>
                <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD1] divide-y divide-[#E8DFD1]/60">
                  {cartItemsList.map((it) => (
                    <div key={it.menuCode} className="py-1.5 flex justify-between">
                      <div>
                        <span className="font-bold text-[#221B17] ml-1">[{it.menuCode}]</span>
                        <span>{it.item.name}</span>
                        <div className="text-[11px] text-[#6B5E55]">
                          {it.quantity} وجبة × {it.unitPrice} ج.م
                        </div>
                      </div>
                      <span className="font-mono font-bold">{it.totalPrice.toLocaleString('en-US')} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Location */}
              <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD1] text-xs space-y-1">
                <div>العميل: <strong>{customerName}</strong> ({phone})</div>
                <div>موعد الاستلام: <strong>{pickupDate} - {pickupTime}</strong></div>
                <div>مكان التسليم: <strong>{pickupLocation}</strong></div>
                {notes && <div>ملاحظات: <span className="text-[#6B5E55]">{notes}</span></div>}
              </div>

              {/* Total Box */}
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8C6D28] block">إجمالي الوجبات: {totalMealsCount} وجبة</span>
                  <span className="font-black text-sm text-[#721832]">الإجمالي النهائي:</span>
                </div>
                <span className="text-lg font-black font-mono text-[#721832]">
                  {totalGrandAmount.toLocaleString('en-US')} ج.م
                </span>
              </div>

              <div className="text-[11px] text-[#6B5E55] leading-relaxed">
                بالضغط على "تأكيد وإرسال الحجز"، سيتم تسجيل طلبك في نظام سيلبر وإصدار رقم مرجعي للتنسيق مع الإدارة عبر الواتساب.
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#4A3E38] font-bold text-xs py-3 rounded-xl cursor-pointer"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitBooking()}
                  className="flex-1 bg-[#721832] hover:bg-[#5C1027] text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C89B3C]" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#C89B3C]" />
                      <span>تأكيد وإرسال الحجز</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
