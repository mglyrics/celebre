import React, { useState } from "react";
import { 
  X, MapPin, Calendar, User, Phone, CheckCircle2, 
  ArrowLeft, ArrowRight, ShieldCheck, Sparkles, AlertCircle, 
  CreditCard, Smartphone, Banknote, RefreshCw, Send, Plus, Minus, Heart
} from "lucide-react";
import { CartItem, Order, OrderCustomerInfo, DrinkModificationId } from "../types";
import { DRINK_MODIFICATION_OPTIONS } from "../data/cateringData";
import { detectCustomerLocation, COVERED_REGIONS } from "../utils/locationService";
import { CelebreLogo, CelebreClocheIcon, CelebreStarIcon } from "./CelebreLogo";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (packageId: string, quantity: number) => void;
  onUpdateDrink: (packageId: string, drink: DrinkModificationId) => void;
  onCompleteOrder: (order: Order) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onUpdateDrink,
  onCompleteOrder
}) => {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsDetectedText, setGpsDetectedText] = useState<string>("");

  // Customer form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [occasion, setOccasion] = useState("كتب كتاب وعقد قران");
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [eventTime, setEventTime] = useState("بعد صلاة العصر (5:00 مساءً)");
  const [governorate, setGovernorate] = useState("بني سويف - مدينة بني سويف");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash' | 'cash_on_delivery'>('instapay');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const occasionsList = [
    "كتب كتاب وعقد قران",
    "حفل زفاف وفرح",
    "حفل خطوبة وشبكة",
    "عقيقة ومناسبة مباركة",
    "ضيافة واستقبال VIP"
  ];

  // Calculate totals
  const totalBoxes = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const drinkDelta = DRINK_MODIFICATION_OPTIONS.find(d => d.id === (item.selectedDrink || "default_juice"))?.priceDelta || 0;
    return sum + (item.package.pricePerBox + drinkDelta) * item.quantity;
  }, 0);
  const depositAmount = Math.round(totalPrice * 0.5);
  const remainingAmount = totalPrice - depositAmount;

  // GPS Detection Handler
  const handleAutoDetectLocation = async () => {
    setIsDetectingGps(true);
    try {
      const res = await detectCustomerLocation();
      setGpsDetectedText(res.detectedAreaName);
      if (res.governorate) {
        setGovernorate(res.governorate);
      }
      if (!address) {
        setAddress(res.detectedAreaName);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Validation
  const validateStep1 = () => {
    const errors: { [key: string]: string } = {};
    if (!fullName.trim()) errors.fullName = "يرجى كتابة الاسم الكريم";
    if (!phone.trim() || phone.trim().length < 10) errors.phone = "يرجى كتابة رقم هاتف صحيح للتواصل والتأكيد";
    if (!address.trim()) errors.address = "يرجى كتابة مكان أو قاعة أو مسجد المناسبة";
    if (totalBoxes < 50) errors.minBoxes = "الحد الأدنى الإجمالي للطلب هو 50 وجبة";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Final Order Submission
  const handleSubmitOrder = async () => {
    const customerInfo: OrderCustomerInfo = {
      fullName,
      phone,
      occasion,
      eventDate,
      eventTime,
      deliveryGovernorate: governorate,
      deliveryAddress: address,
      detailedNotes: notes,
      paymentMethod
    };

    const newOrder: Order = {
      id: `CEL-${Math.floor(1000 + Math.random() * 9000)}`,
      customerInfo,
      items,
      totalBoxes,
      totalPrice,
      depositAmount,
      remainingAmount,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    // Save to server
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: fullName,
          phone,
          occasion,
          eventDate,
          location: address,
          governorate,
          totalPrice,
          totalBoxes,
          paymentMethod,
          notes,
          packages: items.map(it => ({
            id: it.package.id,
            name: it.package.name,
            quantity: it.quantity,
            pricePerUnit: it.package.pricePerBox
          }))
        })
      });
    } catch (e) {
      console.error(e);
    }

    // WhatsApp Direct Message Generation
    const packagesSummaryText = items.map((it, idx) => {
      const drinkName = DRINK_MODIFICATION_OPTIONS.find(d => d.id === (it.selectedDrink || "default_juice"))?.label || "عصير بخيرة";
      return `${idx + 1}. *${it.package.saleCode} - ${it.package.name}*:\n   - الكمية: ${it.quantity} وجبة\n   - المشروب: ${drinkName}\n   - الإجمالي: ${(it.quantity * it.package.pricePerBox).toLocaleString()} ج`;
    }).join("\n");

    const whatsappMessage = `*طلب حجز كاترنج جديد - سيلبر 🌸*
رقم الحجز: ${newOrder.id}
-----------------------------
*بيانات العميل:*
- الاسم: ${fullName}
- الهاتف: ${phone}
- المناسبة: ${occasion}
- تاريخ المناسبة: ${eventDate}
- التوقيت: ${eventTime}
- مكان الحفل: ${address} (${governorate})

*تفاصيل الوجبات:*
${packagesSummaryText}

*الحساب المالي:*
- إجمالي عدد الوجبات: ${totalBoxes} علبة
- إجمالي المبلغ: ${totalPrice.toLocaleString()} جنيه
- العربون المطلوب (50%): ${depositAmount.toLocaleString()} جنيه
- المتبقي عند الاستلام: ${remainingAmount.toLocaleString()} جنيه
- طريقة السداد: ${paymentMethod === "instapay" ? "إنستاباي (InstaPay)" : paymentMethod === "vodafone_cash" ? "فودافون كاش" : "سداد كاش"}
${notes ? `- ملاحظات العميل: ${notes}` : ""}
-----------------------------
يرجى تأكيد الحجز وإرسال تفاصيل تحويل العربون. شكراً لاختياركم سيلبر! ✨`;

    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/201284484868?text=${encoded}`, "_blank");

    onCompleteOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        {/* Top Header with Official Celebre Emblem */}
        <div className="px-6 py-3.5 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CelebreLogo size="xs" showSlogan={false} />
            <div>
              <h3 className="font-black text-base sm:text-lg text-[#221B17]">
                حجز وتنسيق طلب ضيافة سيلبر
              </h3>
              <p className="text-[11px] text-[#7A6E65]">شريك مؤسس لمناسباتك السعيدة • خطوتان لإتمام حجزك</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-[#FAF7F2] px-6 py-2.5 border-b border-[#F0EAE1] flex items-center justify-center gap-6 text-xs font-bold">
          <div className={`flex items-center gap-2 ${currentStep === 1 ? "text-[#5C1027]" : "text-[#25D366]"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 1 ? "bg-[#5C1027] text-white" : "bg-[#25D366] text-white"
            }`}>
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span>بيانات المناسبة والموقع</span>
          </div>

          <div className="w-12 h-0.5 bg-[#E8DFD1]" />

          <div className={`flex items-center gap-2 ${currentStep === 2 ? "text-[#5C1027]" : "text-[#7A6E65]"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 2 ? "bg-[#5C1027] text-white" : "bg-[#E8DFD1] text-[#7A6E65]"
            }`}>
              2
            </span>
            <span>مراجعة الوجبات والعربون</span>
          </div>
        </div>

        {/* Step 1: Customer & Event Details */}
        {currentStep === 1 && (
          <div className="overflow-y-auto p-6 space-y-5">
            {formErrors.minBoxes && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.minBoxes}</span>
              </div>
            )}

            {/* Quick Occasion Chips */}
            <div>
              <label className="block text-xs font-bold text-[#4A3E38] mb-2">
                اختر نوع المناسبة:
              </label>
              <div className="flex flex-wrap gap-2">
                {occasionsList.map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setOccasion(occ)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      occasion === occ
                        ? "bg-[#5C1027] text-white shadow-xs"
                        : "bg-[#FAF7F2] text-[#4A3E38] hover:bg-[#F3E7D3] border border-[#E8DFD1]"
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  الاسم بالكامل: *
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: د. طارق عبد الرحمن"
                    className="w-full pr-9 pl-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-[11px] text-red-600 mt-1 font-bold">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  رقم الهاتف (واتساب): *
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-2.5 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full pr-9 pl-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[11px] text-red-600 mt-1 font-bold">{formErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  تاريخ المناسبة: *
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  موعد التسليم المتوقع:
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="مثال: الساعة 5 مساءً قبل كتب الكتاب"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                />
              </div>
            </div>

            {/* Delivery Location with GPS radar tool */}
            <div className="space-y-3 pt-2 border-t border-[#F0EAE1]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#4A3E38] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#5C1027]" />
                  <span>المحافظة والمنطقة:</span>
                </label>

                {/* GPS Radar Button */}
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={isDetectingGps}
                  className="flex items-center gap-1.5 text-[11px] text-[#5C1027] bg-[#5C1027]/10 hover:bg-[#5C1027]/15 px-2.5 py-1 rounded-lg font-bold transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetectingGps ? "animate-spin" : ""}`} />
                  <span>{isDetectingGps ? "جاري كشف الموقع..." : "تحديد موقعي التلقائي (GPS)"}</span>
                </button>
              </div>

              {gpsDetectedText && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم التقاط الموقع: {gpsDetectedText}</span>
                </div>
              )}

              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
              >
                {COVERED_REGIONS.map((r, i) => (
                  <option key={i} value={`${r.governorate} - ${r.name}`}>
                    {r.name} ({r.note} - {r.fee === 0 ? "توصيل مجاني" : `رسوم ${r.fee} ج`})
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  العنوان بالتفصيل أو اسم القاعة / المسجد: *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: مسجد عمر بن عبد العزيز - ميدان المديرية، أو قاعة ريماس شرق النيل"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                />
                {formErrors.address && (
                  <p className="text-[11px] text-red-600 mt-1 font-bold">{formErrors.address}</p>
                )}
              </div>
            </div>

            {/* Special Notes */}
            <div>
              <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                أي ملاحظات خاصة بالتسليم أو كتابة كارت إهداء:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: يرجى كتابة (ألف مبروك للعروسين مصطفى وسارة)، أو التسليم لباب المسجد مباشرة..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
              />
            </div>
          </div>
        )}

        {/* Step 2: Order Review & Instant Contract Confirmation */}
        {currentStep === 2 && (
          <div className="overflow-y-auto p-6 space-y-5">
            {/* Items Summary with Live Quantity Adjustment (> 300 allowed) */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#221B17] flex items-center justify-between">
                <span>الوجبات المطلوبة لتجهيز العلب:</span>
                <span className="text-[#5C1027] font-bold">{totalBoxes} علبة إجمالياً</span>
              </h4>

              <div className="space-y-2.5">
                {items.map((item) => {
                  const drink = item.selectedDrink || "default_juice";
                  const drinkDelta = DRINK_MODIFICATION_OPTIONS.find(d => d.id === drink)?.priceDelta || 0;
                  const itemUnitPrice = item.package.pricePerBox + drinkDelta;
                  const itemTotal = itemUnitPrice * item.quantity;

                  return (
                    <div
                      key={item.package.id}
                      className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <img
                          src={item.package.image}
                          alt={item.package.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#E8DFD1] shrink-0"
                        />
                        <div>
                          <span className="text-[10px] font-black text-[#C89B3C] bg-white px-2 py-0.5 rounded-md border border-[#E8DFD1]">
                            {item.package.saleCode}
                          </span>
                          <h5 className="font-bold text-xs sm:text-sm text-[#221B17] mt-0.5">
                            {item.package.name}
                          </h5>
                          <span className="text-[11px] text-[#7A6E65]">
                            {itemUnitPrice} جنيه / علبة
                          </span>
                        </div>
                      </div>

                      {/* Drink Selection in Step 2 */}
                      <div className="w-full sm:w-auto">
                        <select
                          value={drink}
                          onChange={(e) => onUpdateDrink(item.package.id, e.target.value as DrinkModificationId)}
                          className="text-[11px] bg-white border border-[#E8DFD1] rounded-lg px-2 py-1 font-semibold text-[#4A3E38] w-full sm:w-44"
                        >
                          {DRINK_MODIFICATION_OPTIONS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label} ({d.priceDelta === 0 ? "مشمول (بقيمة 5ج)" : d.priceDelta > 0 ? `+${d.priceDelta}ج` : `-${Math.abs(d.priceDelta)}ج`})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Stepper & Flexible Direct Input (> 300 allowed) */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.package.id, Math.max(10, item.quantity - 10))}
                            className="w-7 h-7 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center font-bold text-[#5C1027]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <div className="relative w-20">
                            <input
                              type="number"
                              min="10"
                              step="10"
                              placeholder="العدد"
                              value={item.quantity || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                onUpdateQuantity(item.package.id, isNaN(val) ? 0 : val);
                              }}
                              className="w-full text-center py-1 bg-white border border-[#C89B3C]/50 rounded-lg text-xs font-black text-[#221B17]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.package.id, item.quantity + 10)}
                            className="w-7 h-7 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center font-bold text-[#5C1027]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-left font-black text-xs sm:text-sm text-[#5C1027] min-w-[70px]">
                          {itemTotal.toLocaleString()} ج
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DFD1] space-y-2">
              <div className="flex justify-between text-xs text-[#4A3E38]">
                <span>إجمالي عدد الوجبات:</span>
                <span className="font-black text-[#221B17]">{totalBoxes} علبة</span>
              </div>
              <div className="flex justify-between text-xs text-[#4A3E38]">
                <span>تكلفة الوجبات الإجمالية:</span>
                <span className="font-bold text-[#221B17]">{totalPrice.toLocaleString()} جنيه</span>
              </div>
              <div className="flex justify-between text-xs text-[#4A3E38]">
                <span>مصاريف التوصيل:</span>
                <span className="font-bold text-emerald-700">توصيل مجاني رسمي</span>
              </div>
              <div className="pt-2 border-t border-[#E8DFD1] flex justify-between items-center">
                <span className="font-bold text-sm text-[#221B17]">المبلغ الإجمالي:</span>
                <span className="font-black text-lg text-[#5C1027]">{totalPrice.toLocaleString()} جنيه</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#C89B3C]/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-[#5C1027]">العربون المطلوب لتأكيد الحجز (50%):</div>
                  <div className="text-[11px] text-[#7A6E65]">المتبقي ({remainingAmount.toLocaleString()} ج) يُسدد عند الاستلام</div>
                </div>
                <div className="text-lg font-black text-[#C89B3C]">
                  {depositAmount.toLocaleString()} جنيه
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#4A3E38]">
                طريقة سداد العربون المعتمدة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === 'instapay'
                      ? "bg-[#5C1027] text-white border-[#5C1027] shadow-xs"
                      : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs font-bold">إنستاباي (InstaPay)</div>
                  <div className={`text-[10px] ${paymentMethod === 'instapay' ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                    فوري ومعتمد
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('vodafone_cash')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === 'vodafone_cash'
                      ? "bg-[#5C1027] text-white border-[#5C1027] shadow-xs"
                      : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                  }`}
                >
                  <Smartphone className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs font-bold">فودافون كاش</div>
                  <div className={`text-[10px] ${paymentMethod === 'vodafone_cash' ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                    تحويل لمحفظة سيلبر
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash_on_delivery')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === 'cash_on_delivery'
                      ? "bg-[#5C1027] text-white border-[#5C1027] shadow-xs"
                      : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                  }`}
                >
                  <Banknote className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs font-bold">كاش مع المندوب</div>
                  <div className={`text-[10px] ${paymentMethod === 'cash_on_delivery' ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                    عربون يد بيد
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#F0EAE1] flex items-center justify-between gap-3">
          {currentStep === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD]"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all"
              >
                <span>متابعة لمراجعة الطلب وتأكيد الحجز</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD]"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع للتعديل</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitOrder}
                className="flex items-center gap-2 py-3 px-7 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-black shadow-lg active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>إرسال التعاقد وتأكيد الحجز عبر الواتساب المعتمد</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
