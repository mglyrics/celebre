import React, { useState, useMemo } from "react";
import { 
  Search, SlidersHorizontal, Plus, Minus, ShoppingBag, Eye, 
  ChevronDown, ChevronUp, Sparkles, CheckCircle2, ShieldCheck, Flame, Zap, Heart, Package,
  FileDown, Download, AlertCircle
} from "lucide-react";
import { CateringPackage, DrinkModificationId } from "../types";
import { DRINK_MODIFICATION_OPTIONS, isBoxMix, isBoxSandwich } from "../data/cateringData";
import { CelebreLogo, CelebreClocheIcon, CelebreStarIcon, CelebreFlourishDivider } from "./CelebreLogo";

interface PackagesSectionProps {
  packages: CateringPackage[];
  onSelectPackage: (pkg: CateringPackage) => void;
  onAddToCart: (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId) => void;
  onDirectOrder: (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId) => void;
  onOpenMenu?: () => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  packages,
  onSelectPackage,
  onAddToCart,
  onDirectOrder,
  onOpenMenu
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");

  // In-card configuration states mapped by package ID
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [cardDrinks, setCardDrinks] = useState<Record<string, DrinkModificationId>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [customInputActive, setCustomInputActive] = useState<Record<string, boolean>>({});

  const categories = [
    { id: "all", label: `جميع العروض (${packages.length} وجبة)` },
    { id: "box_mix", label: "قائمة Box ميكس (12 عرض) 🍰🥪" },
    { id: "box_sandwich", label: "قائمة Box ساندوتش (6 عروض) 🥪" },
    { id: "bestsellers", label: "الأكثر طلباً ومبيعاً ⭐" },
    { id: "economy", label: "اقتصادي خفيف (35 - 45 ج)" },
    { id: "classic", label: "كلاسيك متكامل (50 - 60 ج)" },
    { id: "vip", label: "VIP فاخر (65 - 80 ج)" }
  ];

  // Filter & Sort
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Category filter
      if (selectedCategory === "box_mix" && !isBoxMix(pkg)) {
        return false;
      }
      if (selectedCategory === "box_sandwich" && !isBoxSandwich(pkg)) {
        return false;
      }
      if (selectedCategory === "bestsellers" && !pkg.isBestseller && !["pkg-sale-01", "pkg-sale-04", "pkg-sale-05", "pkg-sale-17", "pkg-sale-18"].includes(pkg.id)) {
        return false;
      }
      if (selectedCategory === "economy" && pkg.pricePerBox > 45) {
        return false;
      }
      if (selectedCategory === "classic" && (pkg.pricePerBox < 50 || pkg.pricePerBox > 60)) {
        return false;
      }
      if (selectedCategory === "vip" && pkg.pricePerBox < 65) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = pkg.name.toLowerCase().includes(query);
        const matchSaleCode = pkg.saleCode.toLowerCase().includes(query);
        const matchTagline = pkg.tagline.toLowerCase().includes(query);
        const matchDesc = pkg.description.toLowerCase().includes(query);
        const matchItems = pkg.sections.some(s => s.items.some(it => it.toLowerCase().includes(query)));
        return matchName || matchSaleCode || matchTagline || matchDesc || matchItems;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.pricePerBox - b.pricePerBox;
      if (sortBy === "price_desc") return b.pricePerBox - a.pricePerBox;
      return 0; // default order
    });
  }, [packages, searchQuery, selectedCategory, sortBy]);

  const mixPackages = useMemo(() => filteredPackages.filter(isBoxMix), [filteredPackages]);
  const sandwichPackages = useMemo(() => filteredPackages.filter(isBoxSandwich), [filteredPackages]);

  // Helpers for in-card states
  const getQuantity = (id: string) => cardQuantities[id] || 50;
  const setQuantity = (id: string, qty: number) => {
    setCardQuantities(prev => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const getDrink = (id: string): DrinkModificationId => cardDrinks[id] || "default_juice";
  const setDrink = (id: string, drink: DrinkModificationId) => {
    setCardDrinks(prev => ({ ...prev, [id]: drink }));
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getDrinkPriceDelta = (drinkId: DrinkModificationId) => {
    const opt = DRINK_MODIFICATION_OPTIONS.find(d => d.id === drinkId);
    return opt ? opt.priceDelta : 0;
  };

  const renderCard = (pkg: CateringPackage) => {
    const qty = getQuantity(pkg.id);
    const drink = getDrink(pkg.id);
    const drinkDelta = getDrinkPriceDelta(drink);
    const unitPrice = pkg.pricePerBox + drinkDelta;
    const cardTotal = qty * unitPrice;
    const cardDeposit = Math.round(cardTotal * 0.5);
    const isCustom = customInputActive[pkg.id];
    const isMix = isBoxMix(pkg);

    return (
      <div
        key={pkg.id}
        className="bg-white rounded-2xl border border-[#E8DFD1] hover:border-[#C89B3C] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
      >
        {/* Image & Badges Container */}
        <div className="relative h-56 sm:h-60 overflow-hidden bg-[#EAE2D5]">
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {/* Top Badges with Official Celebre Box Logo Seal */}
          <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
            <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#C89B3C]/80 shadow-md flex items-center gap-2">
              <img
                src="/logo.png"
                alt="شعار سيلبر المعتمد على العلبة"
                className="h-6 w-auto object-contain"
              />
              <span className="font-['Cinzel',sans-serif] text-[11px] text-[#5C1027] font-black border-r border-[#C89B3C]/40 pr-1.5 leading-none">
                {pkg.saleCode}
              </span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                isMix ? "bg-[#5C1027]/10 text-[#5C1027]" : "bg-amber-100 text-amber-900 border border-amber-300"
              }`}>
                {isMix ? "Box ميكس" : "Box ساندوتش"}
              </span>
            </div>

            <span className="bg-[#5C1027]/95 backdrop-blur-md text-[#F4EEDB] font-black text-xs px-3 py-1.5 rounded-xl shadow-md border border-[#C89B3C]/50">
              {pkg.pricePerBox} ج / علبة
            </span>
          </div>

          {/* Bottom Image Overlay Info */}
          <div className="absolute bottom-3 right-3 left-3 text-white">
            <div className="inline-flex items-center gap-1 bg-[#5C1027]/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] text-[#F4EEDB] font-bold mb-1 border border-[#C89B3C]/50 shadow-xs">
              <Package className="w-3 h-3 text-[#C89B3C]" />
              <span>علبة سيلبر الرسمية الحقيقية</span>
            </div>
            <h3 className="font-black text-base sm:text-lg drop-shadow-sm">
              {pkg.name}
            </h3>
            <p className="text-xs text-[#E8DFD1] line-clamp-1 mt-0.5">
              {pkg.tagline}
            </p>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Quick Summary Highlights & Box Components */}
          <div className="space-y-3">
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFD1] space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-[#5C1027]">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>مكونات الوجبة داخل العلبة:</span>
                </span>
                <span className="text-[10px] text-[#C89B3C] font-black bg-white px-2 py-0.5 rounded-full border border-[#C89B3C]/30 shadow-2xs">
                  {pkg.saleCode}
                </span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                {pkg.sections[0]?.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 text-xs text-[#4A3E38] bg-white px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span className="font-bold text-[11px] leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Box Logo Guarantee with Handwriting Text */}
            <div className="flex items-center justify-between text-[11px] font-bold bg-white text-[#8C6D28] px-2.5 py-1.5 rounded-xl border border-[#C89B3C]/25">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="شعار سيلبر" className="w-4 h-4 object-contain" />
                <span className="font-['Dancing_Script',cursive] text-sm sm:text-base text-[#5C1027] font-bold tracking-wide" dir="ltr">
                  with you in all happy moments
                </span>
              </div>
              <span className="text-[10px] text-[#5C1027] font-black font-['Cinzel',serif]">CÉLÈBRE</span>
            </div>
          </div>

          {/* Drink Selector Choice */}
          <div className="space-y-1.5 pt-2 border-t border-[#F0EAE1]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#4A3E38]">نوع المشروب بالعلبة:</span>
              <span className="text-[11px] text-[#C89B3C] font-semibold">
                {drinkDelta > 0 ? `+${drinkDelta} ج` : drinkDelta < 0 ? `${drinkDelta} ج` : "بقيمة 5 ج مشمول"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DRINK_MODIFICATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDrink(pkg.id, opt.id)}
                  className={`py-1.5 px-2 rounded-xl text-center border transition-all text-xs ${
                    drink === opt.id
                      ? "bg-[#5C1027] text-white border-[#5C1027] shadow-xs"
                      : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">{opt.label.split(" ")[0]} {opt.label.split(" ")[1] || ""}</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${
                    drink === opt.id ? "text-[#F4EEDB]" : opt.priceDelta > 0 ? "text-[#B45309]" : opt.priceDelta < 0 ? "text-emerald-700" : "text-[#7A6E65]"
                  }`}>
                    {opt.priceDelta > 0 ? `+${opt.priceDelta}ج` : opt.priceDelta < 0 ? `${opt.priceDelta}ج` : "مشمول"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector Section */}
          <div className="space-y-2 pt-1 border-t border-[#F0EAE1]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#4A3E38]">عدد العلب المطلوبة:</span>
              <div className="flex items-center gap-1.5">
                {[50, 100, 150, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setQuantity(pkg.id, preset);
                      setCustomInputActive(prev => ({ ...prev, [pkg.id]: false }));
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                      qty === preset && !isCustom
                        ? "bg-[#5C1027] text-white border-[#5C1027]"
                        : "bg-[#FAF7F2] text-[#61534B] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper & Direct Custom Quantity Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center border border-[#E8DFD1] rounded-xl bg-[#FAF7F2] p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(pkg.id, qty - 10)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center text-[#5C1027] hover:bg-[#F3E7D3] font-bold active:scale-95 transition-transform"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => {
                    setQuantity(pkg.id, parseInt(e.target.value) || 0);
                    setCustomInputActive(prev => ({ ...prev, [pkg.id]: true }));
                  }}
                  className="w-full text-center bg-transparent font-black text-base text-[#221B17] focus:outline-hidden"
                />

                <button
                  type="button"
                  onClick={() => setQuantity(pkg.id, qty + 10)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center text-[#5C1027] hover:bg-[#F3E7D3] font-bold active:scale-95 transition-transform"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs font-bold text-[#7A6E65] px-1">
                علبة
              </span>
            </div>

            {qty < 50 && (
              <p className="text-[10px] text-amber-700 font-bold">
                * الحد الأدنى المعتمد 50 وجبة
              </p>
            )}
          </div>

          {/* In-Card Live Price Calculation Badge */}
          <div className="bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E8DFD1] flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] text-[#7A6E65]">الإجمالي ({qty} وجبة):</div>
              <div className="text-sm font-black text-[#5C1027]">
                {cardTotal.toLocaleString()} جنيه
              </div>
            </div>
            <div className="text-left border-r pr-2 border-[#E8DFD1]">
              <div className="text-[10px] text-[#7A6E65]">العربون (50%):</div>
              <div className="text-xs font-black text-[#C89B3C]">
                {cardDeposit.toLocaleString()} جنيه
              </div>
            </div>
          </div>

          {/* Action Buttons: Fast direct order & Add to Cart */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onAddToCart(pkg, qty, drink)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white hover:bg-[#F3E7D3] border border-[#5C1027] text-[#5C1027] font-bold rounded-xl text-xs transition-all active:scale-95 shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>إضافة للسلة</span>
            </button>

            <button
              type="button"
              onClick={() => onDirectOrder(pkg, qty, drink)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#5C1027] hover:bg-[#721832] text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md"
            >
              <Zap className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>اطلب الآن فوراً</span>
            </button>
          </div>

          {/* Full Details Modal Trigger */}
          <button
            type="button"
            onClick={() => onSelectPackage(pkg)}
            className="w-full text-center text-[11px] text-[#7A6E65] hover:text-[#5C1027] font-bold py-1 hover:underline transition-colors"
          >
            عرض صفحة الوجبة وصور التغليف المكبرة 🔍
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="packages-section" className="py-12 sm:py-16 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header with Official Celebre Emblem */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="flex justify-center mb-3">
            <CelebreLogo size="sm" showSlogan={false} showEnglishSubtitles={true} />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5C1027]/10 text-[#5C1027] text-xs font-bold mb-3">
            <CelebreClocheIcon className="w-4 h-4 text-[#C89B3C]" />
            <span>منيو وجبات سيلبر المعتمدة للتوزيع السريع بالمساجد والقاعات</span>
            <CelebreStarIcon className="w-3.5 h-3.5 text-[#C89B3C]" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#221B17] mb-2">
            اختر وجبتك واطلب مباشرة بسهولة
          </h2>
          <CelebreFlourishDivider className="my-2" />
          <p className="text-xs sm:text-base text-[#61534B]">
            جميع الوجبات مغلفة في علبة سيلبر الكرتونية المذهبة الرسمية المحكمة الإغلاق، تشمل الساندوتشات الطازجة والمخبوزات والحلويات وعصير بخيرة ومنديل معقم.
          </p>
        </div>

        {/* Interactive Menu Download Banner */}
        {onOpenMenu && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#F4EEDB] via-white to-[#F4EEDB] border border-[#C89B3C]/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5C1027] text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileDown className="w-5 h-5 text-[#C89B3C]" />
              </div>
              <div>
                <h4 className="font-black text-sm text-[#221B17] flex items-center gap-1.5 justify-center sm:justify-start">
                  <span>منيو عروض كاترنج سيلبر التفاعلي المحدث تلقائياً</span>
                  <span className="text-[10px] bg-[#C89B3C] text-[#221B17] px-2 py-0.5 rounded-full font-black">جاهز للتحميل</span>
                </h4>
                <p className="text-xs text-[#7A6E65] mt-0.5">
                  احفظ نسخة من العروض والأسعار لمشاركتها مع الأهل أو العريس بصيغة PDF للطباعة أو كصورة JPG فائقة الوضوح.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenMenu}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-xs hover:shadow-md transition-all shrink-0 active:scale-95"
            >
              <Download className="w-4 h-4 text-[#C89B3C]" />
              <span>تحميل المنيو (PDF / JPG)</span>
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFD1] shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، المكونات (كفتة، بانية، رومي، بيتزا...)"
                className="w-full pr-10 pl-4 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs sm:text-sm text-[#221B17] focus:outline-hidden focus:border-[#5C1027] focus:ring-1 focus:ring-[#5C1027]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-2.5 text-xs text-[#7A6E65] hover:text-[#221B17]"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <SlidersHorizontal className="w-4 h-4 text-[#C89B3C]" />
              <span className="text-xs font-bold text-[#4A3E38] whitespace-nowrap">الترتيب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FAF7F2] border border-[#E8DFD1] text-xs font-semibold rounded-xl px-3 py-2 text-[#221B17] focus:outline-hidden"
              >
                <option value="featured">الترتيب الافتراضي المعتمد</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#5C1027] text-white shadow-xs"
                    : "bg-[#FAF7F2] text-[#4A3E38] hover:bg-[#F3E7D3] border border-[#E8DFD1]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count Notification */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-xs font-bold text-[#7A6E65]">
            عرض <span className="text-[#5C1027] font-black">{filteredPackages.length}</span> وجبة متطابقة
          </p>
          <span className="text-xs text-[#C89B3C] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            الحد الأدنى للطلب 50 وجبة لأي صنف
          </span>
        </div>

        {/* 1. قائمة Box ميكس (أول 12 عرض: Sale-01 إلى Sale-12) */}
        {mixPackages.length > 0 && (
          <div id="section-box-mix" className="mb-14 scroll-mt-24 sm:scroll-mt-28">
            {/* Header Banner for Box Mix */}
            <div className="bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-[#C89B3C]/40 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#C89B3C]/20 border border-[#C89B3C]/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  🍰
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-[#F4EEDB] tracking-tight">
                      قائمة Box ميكس
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-[#C89B3C] text-[#221B17] font-black text-xs shadow-xs">
                      أول 12 عرض (Sale - 01 حتى Sale - 12)
                    </span>
                    <span className="text-[11px] font-['Dancing_Script',cursive] text-[#F4EEDB] font-bold" dir="ltr">
                      with you in all happy moments
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F4EEDB]/85 mt-1 font-medium">
                    تشكيلة كاترنج متكاملة تجمع بين الساندوتشات الطازجة، قطع الجاتوه، المخبوزات والحلويات وعصير بخيرة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto bg-black/25 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-[#C89B3C] font-bold">العروض المتاحة:</span>
                <span className="font-black text-white">{mixPackages.length} وجبة</span>
              </div>
            </div>

            {/* Grid of Box Mix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mixPackages.map(renderCard)}
            </div>
          </div>
        )}

        {/* 2. قائمة Box ساندوتش (العروض من 13 إلى 18: Sale-13 إلى Sale-18) */}
        {sandwichPackages.length > 0 && (
          <div id="section-box-sandwich" className="mb-14 scroll-mt-24 sm:scroll-mt-28">
            {/* Header Banner for Box Sandwich */}
            <div className="bg-gradient-to-r from-[#2A170F] via-[#422214] to-[#2A170F] rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-[#C89B3C]/40 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#C89B3C]/20 border border-[#C89B3C]/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  🥪
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-[#F4EEDB] tracking-tight">
                      قائمة Box ساندوتش
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-[#C89B3C] text-[#221B17] font-black text-xs shadow-xs">
                      العروض من 13 إلى 18 (Sale - 13 حتى Sale - 18)
                    </span>
                    <span className="text-[11px] font-['Dancing_Script',cursive] text-[#F4EEDB] font-bold" dir="ltr">
                      with you in all happy moments
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F4EEDB]/85 mt-1 font-medium">
                    تشكيلة ساندوتشات كفتة مشوية وبانيه دجاج وجبنة رومي بالخبز الفرنسي الطازج مع عصير بخيرة ومنديل معطر
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto bg-black/25 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-[#C89B3C] font-bold">العروض المتاحة:</span>
                <span className="font-black text-white">{sandwichPackages.length} وجبة</span>
              </div>
            </div>

            {/* Grid of Box Sandwich Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sandwichPackages.map(renderCard)}
            </div>
          </div>
        )}

        {/* Empty State if neither section has results */}
        {mixPackages.length === 0 && sandwichPackages.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFD1] p-8 max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-[#C89B3C] mx-auto mb-3" />
            <h4 className="text-base font-black text-[#221B17]">لم يتم العثور على وجبات مطابقة للبحث</h4>
            <p className="text-xs text-[#7A6E65] mt-1 mb-4">
              يرجى تجربة كلمة بحث أخرى أو تغيير تصنيف الوجبات المختار.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#5C1027] text-white rounded-xl text-xs font-bold hover:bg-[#721832] transition-colors"
            >
              إعادة عرض جميع الوجبات
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
