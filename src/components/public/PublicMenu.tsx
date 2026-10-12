import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, UtensilsCrossed, Sparkles, Package, Eye, CalendarCheck, 
  CheckCircle2, Flame, ShieldCheck, GlassWater, ArrowLeft, FileDown, Loader2,
  ChevronLeft, Layers, Sandwich
} from "lucide-react";
import { PublicMenuItem } from "../../types/publicMenu";
import { getSaleImage } from "../../data/saleImages";
import { 
  OFFICIAL_18_MENU_ITEMS, 
  sortMenuItemsAscending, 
  getMixBoxItems, 
  getSandwichBoxItems 
} from "../../data/fallbackMenu";
import { downloadMenuPdf } from "../../services/menuPdfService";

interface PublicMenuProps {
  menuItems: PublicMenuItem[];
  loading: boolean;
  error?: string | null;
  initialCategory?: "all" | "mix" | "sandwich";
  onCategoryChange?: (category: "all" | "mix" | "sandwich") => void;
  onSelectForDetails: (item: PublicMenuItem) => void;
  onSelectForBooking: (menuCode: string) => void;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({
  menuItems,
  loading,
  error,
  initialCategory = "all",
  onCategoryChange,
  onSelectForDetails,
  onSelectForBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mix" | "sandwich">(initialCategory);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<{ type: "loading" | "success" | "error"; message: string } | null>(null);

  // Sync when initialCategory prop changes from outside (e.g. hash routing)
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleSelectCategory = (cat: "all" | "mix" | "sandwich") => {
    setSelectedCategory(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
    // Update hash for deep-linking
    try {
      if (cat === "mix") window.location.hash = "#menu-mix";
      else if (cat === "sandwich") window.location.hash = "#menu-sandwich";
      else window.location.hash = "#menu";
    } catch {}
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setPdfStatus({ type: "loading", message: "جاري إعداد وتنسيق ملف المنيو بصيغة PDF..." });
      const itemsToExport = menuItems && menuItems.length > 0 ? menuItems : OFFICIAL_18_MENU_ITEMS;
      await downloadMenuPdf(itemsToExport, (isGen, msg) => {
        if (msg) {
          setPdfStatus({ type: isGen ? "loading" : "success", message: msg });
        }
      });
      setPdfStatus({ type: "success", message: "تم تحميل ملف المنيو (Celebre-Menu.pdf) بنجاح! 📄✨" });
      setTimeout(() => setPdfStatus(null), 5000);
    } catch (err: any) {
      console.error("PDF download failed:", err);
      setPdfStatus({ type: "error", message: err.message || "حدث خطأ أثناء تحميل ملف المنيو. يرجى المحاولة مرة أخرى." });
      setTimeout(() => setPdfStatus(null), 6000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const bestsellersCodes = ["Sale-04", "Sale-05", "Sale-10", "Sale-17", "Sale-18"];

  // Strictly unify and sort the 18 items ascending Sale-01 -> Sale-18
  const baseItems = (menuItems && menuItems.length > 0) ? menuItems : OFFICIAL_18_MENU_ITEMS;
  const sorted18Items = useMemo(() => sortMenuItemsAscending(baseItems), [baseItems]);
  const mixBoxList = useMemo(() => getMixBoxItems(sorted18Items), [sorted18Items]);
  const sandwichBoxList = useMemo(() => getSandwichBoxItems(sorted18Items), [sorted18Items]);

  const displayedItems = useMemo(() => {
    let list: PublicMenuItem[] = [];
    if (selectedCategory === "mix") {
      list = mixBoxList;
    } else if (selectedCategory === "sandwich") {
      list = sandwichBoxList;
    } else {
      // "all": Strictly all 18 items sequentially (1 to 12 first, then 13 to 18)
      list = sorted18Items;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter((item) => {
        const matchCode = item.code.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        const matchComp = item.components?.some((c) => c.name.toLowerCase().includes(q)) || false;
        return matchCode || matchName || matchDesc || matchComp;
      });
    }

    return list;
  }, [selectedCategory, mixBoxList, sandwichBoxList, sorted18Items, searchQuery]);

  return (
    <section id="menu-section" className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" dir="rtl">
      {/* 1. Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#8C6D28] px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>منيو Celebre الرسمي والمعتمد لعام 2026</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#5C1027] tracking-tight">
          منيو Celebre — ميكس بوكس وسندوتش بوكس
        </h2>

        <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
          اختر القسم المناسب لمناسبتك أو استعرض كافة الوجبات الـ 18 المعتمدة بالتتابع بالأسعار والمكونات الدقيقة.
        </p>
      </div>

      {/* 2. Primary 2 Cards / Links: Mix Box vs Sandwich Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 max-w-4xl mx-auto">
        {/* Card 1: ميكس بوكس (Mix Box) - Sale-01 to Sale-12 */}
        <div
          onClick={() => handleSelectCategory("mix")}
          className={`cursor-pointer rounded-3xl p-6 sm:p-7 border-2 transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-xl ${
            selectedCategory === "mix"
              ? "bg-gradient-to-br from-[#721832] to-[#430B1C] text-white border-[#C89B3C] shadow-lg ring-4 ring-[#C89B3C]/20 scale-[1.01]"
              : "bg-white text-[#221B17] border-[#E8DFD1] hover:border-[#721832]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                  selectedCategory === "mix" ? "bg-[#C89B3C] text-[#221B17]" : "bg-[#721832]/10 text-[#721832]"
                }`}>
                  العروض من Sale-01 إلى Sale-12
                </span>
                <span className={`text-[11px] font-bold ${selectedCategory === "mix" ? "text-[#F4EEDB]" : "text-[#8C6D28]"}`}>
                  (12 وجبة)
                </span>
              </div>

              <h3 className={`text-xl sm:text-2xl font-black ${selectedCategory === "mix" ? "text-white" : "text-[#5C1027]"}`}>
                ميكس بوكس (Mix Box) 🍰🥪
              </h3>

              <p className={`text-xs sm:text-sm leading-relaxed ${selectedCategory === "mix" ? "text-[#F4EEDB]" : "text-[#6B5E55]"}`}>
                باقات الضيافة المتنوعة التي تجمع بين الجاتوه الفاخر وسندوتشات اللحوم والجبن والباتيه مع عصير بخيرة الأصلي.
              </p>
            </div>

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
              selectedCategory === "mix" ? "bg-white/10 text-[#C89B3C]" : "bg-[#FAF7F2] text-[#721832] border border-[#E8DFD1]"
            }`}>
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-current/15 flex items-center justify-between">
            <span className={`text-xs font-bold ${selectedCategory === "mix" ? "text-[#C89B3C]" : "text-[#721832]"}`}>
              {selectedCategory === "mix" ? "● القسم المعروض حالياً" : "انتقل لعروض ميكس بوكس"}
            </span>
            <ChevronLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1.5 ${
              selectedCategory === "mix" ? "text-[#C89B3C]" : "text-[#721832]"
            }`} />
          </div>
        </div>

        {/* Card 2: سندوتش بوكس (Sandwich Box) - Sale-13 to Sale-18 */}
        <div
          onClick={() => handleSelectCategory("sandwich")}
          className={`cursor-pointer rounded-3xl p-6 sm:p-7 border-2 transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-xl ${
            selectedCategory === "sandwich"
              ? "bg-gradient-to-br from-[#8C6D28] to-[#544116] text-white border-[#C89B3C] shadow-lg ring-4 ring-[#C89B3C]/20 scale-[1.01]"
              : "bg-white text-[#221B17] border-[#E8DFD1] hover:border-[#8C6D28]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                  selectedCategory === "sandwich" ? "bg-white text-[#8C6D28]" : "bg-[#C89B3C]/15 text-[#8C6D28]"
                }`}>
                  العروض من Sale-13 إلى Sale-18
                </span>
                <span className={`text-[11px] font-bold ${selectedCategory === "sandwich" ? "text-[#F4EEDB]" : "text-[#8C6D28]"}`}>
                  (6 وجبات)
                </span>
              </div>

              <h3 className={`text-xl sm:text-2xl font-black ${selectedCategory === "sandwich" ? "text-white" : "text-[#5C1027]"}`}>
                سندوتش بوكس (Sandwich Box) 🥪
              </h3>

              <p className={`text-xs sm:text-sm leading-relaxed ${selectedCategory === "sandwich" ? "text-[#F4EEDB]" : "text-[#6B5E55]"}`}>
                باقات السندوتشات الفرنساوي الوسط المشبعة (كفتة ع الفحم، بانية، تركي، رومي) للمؤتمرات وتوزيعات المساجد.
              </p>
            </div>

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
              selectedCategory === "sandwich" ? "bg-white/10 text-white" : "bg-[#FAF7F2] text-[#8C6D28] border border-[#E8DFD1]"
            }`}>
              <Sandwich className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-current/15 flex items-center justify-between">
            <span className={`text-xs font-bold ${selectedCategory === "sandwich" ? "text-white" : "text-[#8C6D28]"}`}>
              {selectedCategory === "sandwich" ? "● القسم المعروض حالياً" : "انتقل لعروض سندوتش بوكس"}
            </span>
            <ChevronLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1.5 ${
              selectedCategory === "sandwich" ? "text-white" : "text-[#8C6D28]"
            }`} />
          </div>
        </div>
      </div>

      {/* 3. Sequential Option Bar: "استعراض كل الوجبات الـ18" + Search + PDF Download */}
      <div className="mb-8 space-y-4 max-w-4xl mx-auto">
        {/* Toggle Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Button: All 18 Items */}
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              selectedCategory === "all"
                ? "bg-[#721832] text-white shadow-md ring-2 ring-[#721832]/30"
                : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-[#C89B3C]" />
            <span>استعراض كل الوجبات الـ18 (Sale-01 → Sale-18)</span>
          </button>

          {/* Button: Mix Box tab */}
          <button
            type="button"
            onClick={() => handleSelectCategory("mix")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "mix"
                ? "bg-[#721832] text-white shadow-md ring-2 ring-[#721832]/30"
                : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
            }`}
          >
            <span>ميكس بوكس (1–12)</span>
          </button>

          {/* Button: Sandwich Box tab */}
          <button
            type="button"
            onClick={() => handleSelectCategory("sandwich")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "sandwich"
                ? "bg-[#8C6D28] text-white shadow-md ring-2 ring-[#8C6D28]/30"
                : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
            }`}
          >
            <span>سندوتش بوكس (13–18)</span>
          </button>
        </div>

        {/* Current Filter Indicator Banner */}
        <div className="bg-[#FAF7F2] border border-[#C89B3C]/30 rounded-2xl px-4 py-2.5 text-center text-xs font-bold text-[#5C1027] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse" />
            <span>
              {selectedCategory === "mix" && "عرض قسم: ميكس بوكس (العروض من Sale-01 إلى Sale-12)"}
              {selectedCategory === "sandwich" && "عرض قسم: سندوتش بوكس (العروض من Sale-13 إلى Sale-18)"}
              {selectedCategory === "all" && "استعراض متتابع لكافة الوجبات الـ18 بالتسلسل (Sale-01 → Sale-18)"}
            </span>
          </div>
          <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-[#E8DFD1] text-[#721832]">
            {displayedItems.length} وجبة
          </span>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الوجبة أو المكونات (كفتة، بانية، جاتوه، رومي...)"
            className="w-full bg-white border border-[#D6C7B7] rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm font-semibold text-[#221B17] placeholder:text-[#8C7D73] focus:outline-none focus:ring-2 focus:ring-[#721832] shadow-2xs"
          />
          <Search className="w-4 h-4 text-[#8C6D28] absolute right-3.5 top-3" />
        </div>

        {/* PDF Download Button & Status Banner */}
        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#721832] via-[#5C1027] to-[#721832] hover:from-[#5C1027] hover:to-[#430B1C] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-60 cursor-pointer active:scale-95 border border-[#C89B3C]/40 group"
            title="تحميل قائمة الوجبات كاملة بالأسعار والمكونات مقسمة إلى ميكس وسندوتش بوكس بصيغة PDF"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#C89B3C]" />
            ) : (
              <FileDown className="w-4 h-4 text-[#C89B3C] group-hover:-translate-y-0.5 transition-transform" />
            )}
            <span>تحميل المنيو PDF</span>
            <span className="text-[10px] bg-[#C89B3C]/20 text-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#C89B3C]/40">
              A4 منيو منسق للطباعة
            </span>
          </button>

          {pdfStatus && (
            <div
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all animate-fadeIn flex items-center gap-2 ${
                pdfStatus.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : pdfStatus.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-[#FAF7F2] text-[#721832] border border-[#C89B3C]/30"
              }`}
            >
              {pdfStatus.type === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C89B3C]" />}
              <span>{pdfStatus.message}</span>
            </div>
          )}
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

      {/* Error Notice */}
      {error && displayedItems.length === 0 && (
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

      {/* 4. Sequential Meals Grid (Sale-01 to Sale-18) */}
      {(!loading || displayedItems.length > 0) && (
        <>
          {displayedItems.length === 0 && !error ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFD1] p-8 max-w-md mx-auto space-y-3">
              <Package className="w-12 h-12 text-[#8C7D73] mx-auto" />
              <p className="text-sm font-bold text-[#221B17]">لم يتم العثور على وجبات مطابقة للبحث في هذا القسم</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-[#721832] font-black underline cursor-pointer"
              >
                استعراض كل الوجبات الـ18
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedItems.map((item) => {
                const isBestseller = bestsellersCodes.includes(item.code);
                const imageSrc = getSaleImage(item.code);
                const itemNum = parseInt(item.code.replace(/\D/g, "") || "0", 10);
                const isMix = itemNum <= 12;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
                  >
                    {/* Top Image Container with explicit height */}
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
                      <div className="absolute top-3 right-3 bg-[#5C1027] text-white text-xs font-black px-3 py-1 rounded-full shadow-md font-mono">
                        {item.code}
                      </div>

                      {/* Box Category Tag */}
                      <div className={`absolute bottom-3 right-3 text-[10.5px] font-black px-2.5 py-0.5 rounded-full shadow-xs ${
                        isMix ? "bg-[#721832] text-white" : "bg-[#8C6D28] text-white"
                      }`}>
                        {isMix ? "ميكس بوكس" : "سندوتش بوكس"}
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
                            className="w-full py-2.5 px-3 rounded-xl border border-[#D6C7B7] hover:border-[#721832] bg-white text-[#221B17] hover:text-[#721832] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تفاصيل العرض</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectForBooking(item.code)}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#721832] to-[#5C1027] hover:from-[#5C1027] hover:to-[#430B1C] text-white text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
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
