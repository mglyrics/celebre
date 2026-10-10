import React, { useState, useMemo } from "react";
import { 
  Search, UtensilsCrossed, Sparkles, Package, Eye, CalendarCheck, 
  CheckCircle2, Flame, ShieldCheck, GlassWater, ArrowLeft
} from "lucide-react";
import { PublicMenuItem } from "../../types/publicMenu";
import { getSaleImage } from "../../data/saleImages";
import { OFFICIAL_18_MENU_ITEMS } from "../../data/fallbackMenu";

interface PublicMenuProps {
  menuItems: PublicMenuItem[];
  loading: boolean;
  error?: string | null;
  onSelectForDetails: (item: PublicMenuItem) => void;
  onSelectForBooking: (menuCode: string) => void;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({
  menuItems,
  loading,
  error,
  onSelectForDetails,
  onSelectForBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mix" | "sandwich" | "bestsellers">("all");

  const bestsellersCodes = ["Sale-04", "Sale-05", "Sale-10", "Sale-17", "Sale-18"];

  const itemsToDisplay = (menuItems && menuItems.length > 0) ? menuItems : OFFICIAL_18_MENU_ITEMS;

  const filteredItems = useMemo(() => {
    return itemsToDisplay.filter((item) => {
      // Category filter
      if (selectedCategory === "mix") {
        // Sale-01 to Sale-12 (Mix box with gateau & snacks)
        const num = parseInt(item.code.replace(/\D/g, ""), 10);
        if (num > 12) return false;
      } else if (selectedCategory === "sandwich") {
        // Sale-13 to Sale-18 (French Sandwich box)
        const num = parseInt(item.code.replace(/\D/g, ""), 10);
        if (num < 13) return false;
      } else if (selectedCategory === "bestsellers") {
        if (!bestsellersCodes.includes(item.code)) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchCode = item.code.toLowerCase().includes(query);
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query) || false;
        const matchComp = item.components?.some((c) => c.name.toLowerCase().includes(query)) || false;
        return matchCode || matchName || matchDesc || matchComp;
      }

      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <section id="menu-section" className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" dir="rtl">
      {/* Title & Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#8C6D28] px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>القائمة الكاملة الرسمية لعام 2026</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#5C1027] tracking-tight">
          قائمة عروض وجبات سيليبر (الـ 18 عرض)
        </h2>

        <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
          جميع الوجبات يتم تجهيزها فندقياً بعلب كرتونية فاخرة محكمة الإغلاق مع عصير بخيرة وشوكة ومناديل معقمة. الأسعار مسترجعة مباشرة من قاعدة البيانات الرسمية.
        </p>
      </div>

      {/* Categories & Filter Bar */}
      <div className="mb-8 space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === "all"
                ? "bg-[#721832] text-white shadow-md"
                : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
            }`}
          >
            جميع الوجبات (18 عرض)
          </button>

          <button
            onClick={() => setSelectedCategory("mix")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === "mix"
                ? "bg-[#721832] text-white shadow-md"
                : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
            }`}
          >
            قائمة Box ميكس (12 عرض) 🍰🥪
          </button>

          <button
            onClick={() => setSelectedCategory("sandwich")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === "sandwich"
                ? "bg-[#721832] text-white shadow-md"
                : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
            }`}
          >
            قائمة Box ساندوتش فرنساوي (6 عروض) 🥪
          </button>

          <button
            onClick={() => setSelectedCategory("bestsellers")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === "bestsellers"
                ? "bg-[#721832] text-white shadow-md"
                : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
            }`}
          >
            الأكثر طلباً ومبيعاً ⭐
          </button>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بكود الوجبة أو المكونات (كفتة، بانية، جاتوه، بيتزا...)"
            className="w-full bg-white border border-[#D6C7B7] rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm font-semibold text-[#221B17] placeholder:text-[#8C7D73] focus:outline-none focus:ring-2 focus:ring-[#721832] shadow-2xs"
          />
          <Search className="w-4 h-4 text-[#8C6D28] absolute right-3.5 top-3" />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-[#E8DFD1] animate-pulse space-y-4">
              <div className="w-full h-48 bg-[#E8DFD1]/50 rounded-2xl" />
              <div className="w-1/3 h-5 bg-[#E8DFD1]/50 rounded" />
              <div className="w-2/3 h-6 bg-[#E8DFD1]/50 rounded" />
              <div className="w-full h-12 bg-[#E8DFD1]/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error Notice (Only if no items are available at all) */}
      {error && filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-red-200 p-6 max-w-lg mx-auto">
          <p className="text-red-600 font-bold text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#721832] text-white rounded-xl text-xs font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* 18 Menu Items Grid */}
      {(!loading || filteredItems.length > 0) && (
        <>
          {filteredItems.length === 0 && !error ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFD1] p-8 max-w-md mx-auto space-y-3">
              <Package className="w-12 h-12 text-[#8C7D73] mx-auto" />
              <p className="text-sm font-bold text-[#221B17]">لم يتم العثور على وجبات مطابقة للبحث</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-[#721832] font-black underline"
              >
                عرض جميع الـ 18 وجبة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isBestseller = bestsellersCodes.includes(item.code);
                const imageSrc = getSaleImage(item.code);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
                  >
                    {/* Top Image Container with explicit height to prevent Chrome layout collapse */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#FAF7F2]">
                      <img
                        src={imageSrc}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getSaleImage("Sale-01");
                        }}
                      />

                      {/* Code Badge */}
                      <div className="absolute top-3 right-3 bg-[#5C1027] text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                        {item.code}
                      </div>

                      {/* Bestseller Tag */}
                      {isBestseller && (
                        <div className="absolute top-3 left-3 bg-[#C89B3C] text-[#221B17] text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-current text-[#721832]" />
                          <span>الأكثر طلباً</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-black text-base sm:text-lg text-[#5C1027] group-hover:text-[#721832] transition-colors">
                          {item.name}
                        </h3>

                        {/* Components preview */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-[#8C6D28] flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            <span>المكونات بالعلبة:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.components && item.components.length > 0 ? (
                              item.components.map((c, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-[11px] bg-[#FAF7F2] text-[#4A3E38] px-2 py-0.5 rounded-lg border border-[#E8DFD1]"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 text-[#C89B3C]" />
                                  <span>{c.name}</span>
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-[#6B5E55] line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price & Action Row */}
                      <div className="pt-3 border-t border-[#E8DFD1] space-y-3">
                        {/* Safe Distributor Price - Never leak factory cost */}
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-[#8C6D28]">سعر الوجبة للعميل:</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#721832]">
                              {item.distributorPrice}
                            </span>
                            <span className="text-xs font-bold text-[#221B17]">جنيه</span>
                          </div>
                        </div>

                        {/* Drink Option Hint */}
                        <div className="text-[10px] text-[#6B5E55] bg-[#FAF7F2] px-2.5 py-1 rounded-lg flex items-center justify-between">
                          <span>عصير بخيرة مشمول</span>
                          <span className="text-[#721832] font-semibold">(متاح استبعاد أو استبدال)</span>
                        </div>

                        {/* Dual Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onSelectForDetails(item)}
                            className="w-full py-2.5 px-3 rounded-xl border border-[#D6C7B7] hover:border-[#721832] bg-white text-[#221B17] hover:text-[#721832] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تفاصيل العرض</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectForBooking(item.code)}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#721832] to-[#5C1027] hover:from-[#5C1027] hover:to-[#430B1C] text-white text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <CalendarCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                            <span>احجز الآن</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};
