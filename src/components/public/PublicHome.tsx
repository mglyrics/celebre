import React, { useState, useMemo } from "react";
import { 
  Sparkles, CalendarCheck, UtensilsCrossed, ShieldCheck, Truck, Clock, 
  Award, Heart, Star, CheckCircle2, ChevronLeft, Phone, MessageCircle, 
  Package, ThumbsUp, Search, Eye, Flame
} from "lucide-react";
import { PublicMenuItem } from "../../types/publicMenu";
import { getSaleImage } from "../../data/saleImages";
import { OFFICIAL_18_MENU_ITEMS } from "../../data/fallbackMenu";
import heroImg from "../../assets/images/celebre_event_setup_1788037572328.jpg";
import closedBoxImg from "../../assets/images/celebre_real_closed_box_1790336502952.jpg";
import mosqueImg from "../../assets/images/celebre_mosque_katb_ketab_1789223553405.jpg";

interface PublicHomeProps {
  menuItems: PublicMenuItem[];
  onNavigate: (page: "home" | "menu" | "booking") => void;
  onSelectForDetails: (item: PublicMenuItem) => void;
  onSelectForBooking: (menuCode: string) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  menuItems,
  onNavigate,
  onSelectForDetails,
  onSelectForBooking,
}) => {
  const all18Items = (menuItems && menuItems.length > 0) ? menuItems : OFFICIAL_18_MENU_ITEMS;

  // Best sellers for featured showcase
  const featuredCodes = ["Sale-04", "Sale-05", "Sale-17", "Sale-18"];
  const featuredItems = all18Items.filter((it) => featuredCodes.includes(it.code));

  // Full 18 products interactive filter on Home page
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mix" | "sandwich" | "bestsellers">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered18Items = useMemo(() => {
    return all18Items.filter((item) => {
      if (selectedCategory === "mix") {
        const num = parseInt(item.code.replace(/\D/g, ""), 10);
        if (num > 12) return false;
      } else if (selectedCategory === "sandwich") {
        const num = parseInt(item.code.replace(/\D/g, ""), 10);
        if (num < 13) return false;
      } else if (selectedCategory === "bestsellers") {
        if (!["Sale-04", "Sale-05", "Sale-10", "Sale-17", "Sale-18"].includes(item.code)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        const matchComp = item.components?.some((c) => c.name.toLowerCase().includes(q)) || false;
        return matchCode || matchName || matchDesc || matchComp;
      }

      return true;
    });
  }, [all18Items, selectedCategory, searchQuery]);

  return (
    <div className="space-y-16 sm:space-y-24" dir="rtl">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2] pt-8 sm:pt-16 pb-12 sm:pb-20 border-b border-[#E8DFD1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Right text column */}
            <div className="lg:col-span-7 space-y-6 text-right">
              {/* Official Brand Badge */}
              <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#8C6D28] px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>الموقع الرسمي لـ سيليبر كاترنج • مصر (celebre-eg.com)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#5C1027] leading-tight tracking-tight">
                عبوات كاترنج فندقية فاخرة
                <span className="block text-[#C89B3C] font-['Cinzel',serif] mt-1 text-2xl sm:text-3xl lg:text-4xl">
                  تليق بضيوفك ومناسباتك السعيدة
                </span>
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-[#4A3E38] max-w-xl leading-relaxed">
                تجهيز وتوريد علب كاترنج أنيقة ومحكمة الإغلاق لكتب الكتاب، حفلات الزفاف، الخطوبات، الفعاليات الكبرى وتوزيعات المساجد. 18 وجبة متنوعة طازجة معقمة تبدأ من 35 ج.م للوجبة.
              </p>

              {/* Value Pill Badges */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <div className="inline-flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#221B17]">
                  <ShieldCheck className="w-4 h-4 text-[#721832]" />
                  <span>تجهيز فندقي طازج معقم</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#221B17]">
                  <Package className="w-4 h-4 text-[#C89B3C]" />
                  <span>علب كرتونية ذهبية فاخرة</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#221B17]">
                  <Truck className="w-4 h-4 text-[#721832]" />
                  <span>توصيل متاح لكافة المحافظات</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                <button
                  onClick={() => onNavigate("menu")}
                  className="bg-gradient-to-r from-[#721832] via-[#5C1027] to-[#721832] hover:from-[#5C1027] hover:to-[#430B1C] text-white font-black text-sm px-6 py-4 rounded-2xl shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-98"
                >
                  <UtensilsCrossed className="w-4 h-4 text-[#C89B3C]" />
                  <span>استعراض الـ 18 وجبة بالأسعار</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate("booking")}
                  className="bg-white hover:bg-[#FAF7F2] border-2 border-[#721832] text-[#721832] font-black text-sm px-6 py-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>احجز مناسبتك الآن (بدون دفع)</span>
                </button>
              </div>

              {/* Reassurance text */}
              <p className="text-[11px] text-[#6B5E55] pt-1">
                * الحجز مبدئي ومجاني بالكامل دون أي بطاقة ائتمانية. سنتواصل معك عبر واتساب لتأكيد الموعد والتفاصيل.
              </p>
            </div>

            {/* Left Image Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src={heroImg}
                  alt="تجهيز وجبات كاترنج سيليبر"
                  className="w-full h-[360px] sm:h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white text-right">
                  <span className="text-xs font-black text-[#C89B3C] mb-1">
                    فخامة التقديم والضيافة
                  </span>
                  <p className="font-bold text-sm sm:text-base leading-snug">
                    علب كرتونية محكمة الإغلاق مصممة خصيصاً لتوزيع سريع ونظيف ومشرّف أمام ضيوفك
                  </p>
                </div>
              </div>

              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-white rounded-2xl p-4 shadow-xl border border-[#E8DFD1] flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#721832] text-white flex items-center justify-center font-black text-lg">
                  18
                </div>
                <div className="text-right">
                  <span className="block text-xs font-black text-[#221B17]">عرض كاترنج معتمد</span>
                  <span className="block text-[11px] text-[#8C6D28]">لتناسب جميع الميزانيات</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Best Sellers (4 Top Picks from DB) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6D28] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>الأكثر طلباً لمناسبات كتب الكتاب والأفراح</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#5C1027]">
              عروض سيليبر الأكثر مبيعاً
            </h2>
          </div>
          <button
            onClick={() => onNavigate("menu")}
            className="text-xs sm:text-sm font-bold text-[#721832] hover:text-[#5C1027] flex items-center gap-1 group"
          >
            <span>عرض جميع الـ 18 وجبة كاملة</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(featuredItems.length > 0 ? featuredItems : all18Items.slice(0, 4)).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div className="relative h-44 w-full overflow-hidden bg-[#FAF7F2]">
                <img
                  src={getSaleImage(item.code)}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getSaleImage("Sale-01");
                  }}
                />
                <span className="absolute top-2.5 right-2.5 bg-[#5C1027] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {item.code}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-sm text-[#5C1027] line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-[#6B5E55] line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8DFD1] space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-[#8C6D28]">السعر للوجبة:</span>
                    <span className="text-lg font-black text-[#721832]">
                      {item.distributorPrice} <span className="text-xs text-[#221B17]">ج.م</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectForDetails(item)}
                      className="py-1.5 px-2 rounded-lg border border-[#D6C7B7] text-[11px] font-bold text-[#221B17] hover:bg-[#FAF7F2] cursor-pointer"
                    >
                      التفاصيل
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectForBooking(item.code)}
                      className="py-1.5 px-2 rounded-lg bg-[#721832] text-white text-[11px] font-black hover:bg-[#5C1027] cursor-pointer"
                    >
                      احجز الآن
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2.5 Full 18 Catering Box Showcase Directly on Home Page (Ensuring all 18 products are immediately visible in Google Chrome) */}
      <section id="full-18-menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#8C6D28] px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs">
            <Package className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>كتالوج الوجبات الكامل لعام 2026</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#5C1027] tracking-tight">
            استعراض كافة وجبات كاترنج سيليبر الـ 18 المعتمدة
          </h2>

          <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
            جميع الوجبات الـ 18 متاحة بالأسعار المحدثة والتفاصيل الكاملة. يمكنك التصفح، الفلترة، الحجز الفوري بدون أي بطاقة بنكية.
          </p>
        </div>

        {/* Category Filter & Search Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#721832] text-white shadow-md"
                  : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
              }`}
            >
              جميع الوجبات (18 عرض)
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("mix")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === "mix"
                  ? "bg-[#721832] text-white shadow-md"
                  : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
              }`}
            >
              قائمة Box ميكس (12 عرض) 🍰🥪
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("sandwich")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === "sandwich"
                  ? "bg-[#721832] text-white shadow-md"
                  : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
              }`}
            >
              قائمة Box ساندوتش فرنساوي (6 عروض) 🥪
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("bestsellers")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === "bestsellers"
                  ? "bg-[#721832] text-white shadow-md"
                  : "bg-white text-[#221B17] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
              }`}
            >
              الأكثر طلباً ومبيعاً ⭐
            </button>
          </div>

          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو المكونات (كفتة، بانية، جاتوه، رومي...)"
              className="w-full bg-white border border-[#D6C7B7] rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm font-semibold text-[#221B17] placeholder:text-[#8C7D73] focus:outline-none focus:ring-2 focus:ring-[#721832] shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#8C6D28] absolute right-3.5 top-3" />
          </div>
        </div>

        {/* 18 Meals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered18Items.map((item) => {
            const imageSrc = getSaleImage(item.code);
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
              >
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
                  <div className="absolute top-3 right-3 bg-[#5C1027] text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                    {item.code}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-black text-base sm:text-lg text-[#5C1027] group-hover:text-[#721832] transition-colors">
                      {item.name}
                    </h3>
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

                  <div className="pt-3 border-t border-[#E8DFD1] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-[#8C6D28]">سعر الوجبة للعميل:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#721832]">
                          {item.distributorPrice}
                        </span>
                        <span className="text-xs font-bold text-[#221B17]">جنيه</span>
                      </div>
                    </div>

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
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#721832] to-[#5C1027] hover:from-[#5C1027] hover:to-[#430B1C] text-white text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
      </section>

      {/* 3. Why Celebre Pillars */}
      <section className="bg-white py-12 sm:py-16 border-y border-[#E8DFD1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#8C6D28] tracking-wider uppercase">
              معايير الجودة الفندقية
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#5C1027]">
              لماذا يختار عملاؤنا كاترنج سيليبر؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFD1] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#721832] text-[#C89B3C] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-[#5C1027]">تجهيز فندقي طازج 100%</h3>
              <p className="text-xs sm:text-sm text-[#4A3E38] leading-relaxed">
                يتم طهي الكفتة والفراخ البانيه والمخبوزات طازجة في نفس يوم المناسبة داخل مطابخ فندقية معتمدة ومطابقة لأعلى اشتراطات النظافة والتعقيم.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFD1] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#721832] text-[#C89B3C] flex items-center justify-center mb-4">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-[#5C1027]">علب كرتونية محكمة فاخرة</h3>
              <p className="text-xs sm:text-sm text-[#4A3E38] leading-relaxed">
                تغليف كرتوني سميك يحافظ على سخونة الساندوتش ونظافة الجاتوه، ويسهّل التوزيع المباشر داخل قاعات المساجد والأفراح دون أي فوضى.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFD1] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#721832] text-[#C89B3C] flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-[#5C1027]">دقة متناهية في المواعيد</h3>
              <p className="text-xs sm:text-sm text-[#4A3E38] leading-relaxed">
                ندرك قدسية وقت المناسبة، ونلتزم بوصول الوجبات قبل موعد التوزيع بساعة كاملة لتكون جاهزة لضيوفك الكرام في الوقت المحدد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real Photos Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-black text-[#8C6D28]">معرض الصور الميداني</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#5C1027]">
            شاهد عبوات سيليبر في مناسبات حقيقية
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl overflow-hidden shadow-md border border-[#E8DFD1] group relative aspect-4/3">
            <img
              src={closedBoxImg}
              alt="علبة سيليبر المغلقة"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 text-white">
              <span className="text-xs font-bold">العلبة الكرتونية الذهبية الرسمية محكمة الغلق</span>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-md border border-[#E8DFD1] group relative aspect-4/3">
            <img
              src={mosqueImg}
              alt="توزيعات كتب الكتاب بالمساجد"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 text-white">
              <span className="text-xs font-bold">توزيعات كتب الكتاب بمساجد القاهرة والجيزة</span>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-md border border-[#E8DFD1] group relative aspect-4/3">
            <img
              src={heroImg}
              alt="تجهيزات المناسبات والأفراح"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 text-white">
              <span className="text-xs font-bold">تنظيم واستقبال ضيوف كبرى العائلات</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Direct Booking Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#721832] via-[#5C1027] to-[#721832] rounded-3xl p-8 sm:p-12 text-white text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-black text-[#C89B3C]">حجز سهل وسريع ومجاني</span>
            <h3 className="text-2xl sm:text-3xl font-black">
              هل اقترب موعد فرحك أو عقد قرانك؟
            </h3>
            <p className="text-xs sm:text-sm text-[#F4EEDB] leading-relaxed">
              احجز عدد الوجبات المناسب الآن عبر نموذج الحجز المبدئي بدون أي دفع أونلاين، وسنتواصل معك فوراً لتنسيق كافة التفاصيل وإرسال العينات.
            </p>
          </div>

          <button
            onClick={() => onNavigate("booking")}
            className="shrink-0 bg-[#C89B3C] hover:bg-[#b58b34] text-[#221B17] font-black text-sm px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
          >
            <CalendarCheck className="w-5 h-5 text-[#5C1027]" />
            <span>املأ نموذج الحجز المبدئي</span>
          </button>
        </div>
      </section>
    </div>
  );
};
