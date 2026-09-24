import React, { useState, useMemo } from "react";
import { 
  Search, SlidersHorizontal, Plus, Minus, ShoppingBag, Eye, 
  ChevronDown, ChevronUp, Sparkles, CheckCircle2, ShieldCheck, Flame, Zap, Heart
} from "lucide-react";
import { CateringPackage, DrinkModificationId } from "../types";
import { DRINK_MODIFICATION_OPTIONS } from "../data/cateringData";
import { CelebreLogo, CelebreClocheIcon, CelebreStarIcon, CelebreFlourishDivider } from "./CelebreLogo";

interface PackagesSectionProps {
  packages: CateringPackage[];
  onSelectPackage: (pkg: CateringPackage) => void;
  onAddToCart: (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId) => void;
  onDirectOrder: (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  packages,
  onSelectPackage,
  onAddToCart,
  onDirectOrder
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
    { id: "all", label: "جميع الوجبات (12 وجبة)" },
    { id: "bestsellers", label: "الأكثر طلباً ومبيعاً ⭐" },
    { id: "economy", label: "اقتصادي خفيف (35 - 45 ج)" },
    { id: "classic", label: "كلاسيك متكامل (50 - 60 ج)" },
    { id: "vip", label: "VIP فاخر (65 - 80 ج)" }
  ];

  // Filter & Sort
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Category filter
      if (selectedCategory === "bestsellers" && !pkg.isBestseller && !["pkg-sale-01", "pkg-sale-04", "pkg-sale-05"].includes(pkg.id)) {
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
            جميع الوجبات مغلفة في علبة سيلبر الكرتونية المذهبة الرسمية المحكمة الإغلاق، تشمل الساندوتشات الطازجة مع قطعة جاتوه مثلثة مغلفة وعصير بخيرة مع شوكة ومنديل معقم.
          </p>
        </div>

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

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const qty = getQuantity(pkg.id);
            const drink = getDrink(pkg.id);
            const isExpanded = expandedCards[pkg.id];
            const drinkDelta = getDrinkPriceDelta(drink);
            const unitPrice = pkg.pricePerBox + drinkDelta;
            const cardTotal = qty * unitPrice;
            const cardDeposit = Math.round(cardTotal * 0.5);
            const isCustom = customInputActive[pkg.id];

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

                  {/* Top Badges with Official Celebre Cloche */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                    <span className="bg-[#5C1027]/95 backdrop-blur-xs text-[#FAF7F2] font-black text-xs px-2.5 py-1 rounded-lg border border-[#C89B3C]/50 shadow-xs flex items-center gap-1.5 font-['Cinzel',sans-serif]">
                      <CelebreClocheIcon className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>{pkg.saleCode}</span>
                    </span>

                    <span className="bg-white/95 backdrop-blur-xs text-[#5C1027] font-black text-xs px-2.5 py-1 rounded-lg shadow-xs border border-[#C89B3C]/30">
                      {pkg.pricePerBox} ج / علبة
                    </span>
                  </div>

                  {/* Bottom Image Overlay Info */}
                  <div className="absolute bottom-3 right-3 left-3 text-white">
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
                  {/* Quick Summary Highlights */}
                  <div className="space-y-2">
                    <p className="text-xs text-[#4A3E38] line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>

                    {/* Expandable Accordion Button for Deep Details */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(pkg.id)}
                      className="w-full flex items-center justify-between py-1.5 px-2.5 bg-[#FAF7F2] hover:bg-[#F3E7D3] rounded-xl text-xs font-bold text-[#5C1027] border border-[#E8DFD1] transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>{isExpanded ? "إخفاء محتويات العلبة" : "عرض مكونات العلبة بالتفصيل"}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Accordion Detailed Content */}
                    {isExpanded && (
                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD1] space-y-2 animate-fadeIn text-xs">
                        <div className="font-bold text-[#221B17] mb-1">
                          محتويات الوجبة داخل العبوة الكرتونية المذهبة:
                        </div>
                        {pkg.sections.map((sec, idx) => (
                          <div key={idx} className="space-y-1">
                            <span className="text-[11px] font-bold text-[#C89B3C] block">{sec.title}:</span>
                            <ul className="space-y-1 pr-1">
                              {sec.items.map((item, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-1.5 text-[#4A3E38]">
                                  <CheckCircle2 className="w-3 h-3 text-[#25D366] shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-[#E8DFD1] text-[11px] text-[#7A6E65]">
                          📌 نوع العلبة: {pkg.packaging.type} (محكمة الغلق بدون أشرطة للتوزيع المباشر النظيف).
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Drink Selector Choice */}
                  <div className="space-y-1.5 pt-2 border-t border-[#F0EAE1]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#4A3E38]">نوع المشروب بالعلبة:</span>
                      <span className="text-[11px] text-[#C89B3C] font-semibold">
                        {drinkDelta > 0 ? `+${drinkDelta} ج` : drinkDelta < 0 ? `${drinkDelta} ج` : "مشمول"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {DRINK_MODIFICATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDrink(pkg.id, opt.id)}
                          className={`p-1.5 rounded-lg text-center border text-[11px] font-bold transition-all ${
                            drink === opt.id
                              ? "bg-[#5C1027] text-white border-[#5C1027] shadow-xs"
                              : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                          }`}
                        >
                          <div className="truncate">{opt.label.split(" ")[0]} {opt.label.split(" ")[1]}</div>
                          <div className={`text-[9px] mt-0.5 ${drink === opt.id ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                            {opt.priceDelta === 0 ? "مجاني" : opt.priceDelta > 0 ? `+${opt.priceDelta}ج` : `-${Math.abs(opt.priceDelta)}ج`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Quantity Selector with Presets & Flexible Input (> 300 allowed) */}
                  <div className="space-y-2 pt-2 border-t border-[#F0EAE1]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#4A3E38]">عدد الوجبات:</span>
                      <span className="font-black text-[#5C1027]">{qty} وجبة</span>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-5 gap-1">
                      {[50, 100, 150, 200, 300].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setQuantity(pkg.id, preset);
                            setCustomInputActive(prev => ({ ...prev, [pkg.id]: false }));
                          }}
                          className={`py-1 rounded-md text-[11px] font-bold transition-all text-center ${
                            !isCustom && qty === preset
                              ? "bg-[#C89B3C] text-white shadow-2xs"
                              : "bg-[#F3E7D3]/60 text-[#4A3E38] hover:bg-[#F3E7D3]"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Step Controls + Flexible Custom Number Input */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQuantity(pkg.id, Math.max(50, qty - 10));
                          setCustomInputActive(prev => ({ ...prev, [pkg.id]: false }));
                        }}
                        className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#5C1027] font-bold"
                        title="إنقاص 10 وجبات"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      {/* Flexible input where customer can type ANY number including >300 */}
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="50"
                          step="10"
                          placeholder="اكتب أي رقم (مثلاً 500)"
                          value={qty || ""}
                          onChange={(e) => {
                            setCustomInputActive(prev => ({ ...prev, [pkg.id]: true }));
                            const val = parseInt(e.target.value, 10);
                            setQuantity(pkg.id, isNaN(val) ? 0 : val);
                          }}
                          className="w-full text-center py-1.5 px-2 bg-[#FAF7F2] border border-[#C89B3C]/50 focus:border-[#5C1027] rounded-lg text-xs font-black text-[#221B17]"
                        />
                        <span className="absolute left-2 top-1.5 text-[10px] text-[#7A6E65] pointer-events-none font-bold">
                          وجبة
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setQuantity(pkg.id, qty + 10);
                          setCustomInputActive(prev => ({ ...prev, [pkg.id]: false }));
                        }}
                        className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#5C1027] font-bold"
                        title="زيادة 10 وجبات"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
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
          })}
        </div>
      </div>
    </section>
  );
};
