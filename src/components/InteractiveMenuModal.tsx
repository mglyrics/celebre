import React, { useState, useRef } from "react";
import { 
  X, Download, FileText, Image as ImageIcon, Printer, Share2, 
  Phone, MessageCircle, MapPin, Truck, ShieldCheck, Sparkles, 
  CheckCircle2, Clock, Calendar, AlertCircle, Loader2, ArrowDown
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { CateringPackage } from "../types";
import { DRINK_MODIFICATION_OPTIONS } from "../data/cateringData";
import { CelebreLogo, CelebreClocheIcon, CelebreStarIcon, CelebreFlourishDivider } from "./CelebreLogo";

interface InteractiveMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: CateringPackage[];
}

export const InteractiveMenuModal: React.FC<InteractiveMenuModalProps> = ({
  isOpen,
  onClose,
  packages
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const menuPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const todayDateStr = new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "long"
  }).format(new Date());

  const filteredList = packages.filter((pkg) => {
    if (activeCategoryFilter === "economy") return pkg.pricePerBox <= 45;
    if (activeCategoryFilter === "classic") return pkg.pricePerBox >= 50 && pkg.pricePerBox <= 60;
    if (activeCategoryFilter === "vip") return pkg.pricePerBox >= 65;
    return true;
  });

  // Helper to convert any modern oklab/oklch colors to standard sRGB before html2canvas parses styles
  const sanitizeClonedMenu = (clonedDoc: Document) => {
    const dummyCanvas = clonedDoc.createElement("canvas");
    const ctx = dummyCanvas.getContext("2d");

    const toSafeRgb = (val: string): string => {
      if (!val || (!val.includes("oklab") && !val.includes("oklch"))) {
        return val;
      }
      if (!ctx) return "#221B17";
      try {
        ctx.fillStyle = "#221B17";
        ctx.fillStyle = val;
        return ctx.fillStyle;
      } catch {
        return "#221B17";
      }
    };

    const container = clonedDoc.getElementById("celebre-printable-menu");
    if (!container) return;

    // Force explicit safe background and text color on root
    container.style.backgroundColor = "#FAF7F2";
    container.style.color = "#221B17";

    const elements = [container, ...Array.from(container.querySelectorAll("*"))] as HTMLElement[];
    const colorProps = [
      "color",
      "background-color",
      "border-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "outline-color",
      "text-decoration-color",
      "fill",
      "stroke"
    ];

    const win = clonedDoc.defaultView || window;

    for (const el of elements) {
      if (!el || !el.style) continue;
      const computed = win.getComputedStyle(el);

      for (const prop of colorProps) {
        const val = computed.getPropertyValue(prop);
        if (val && (val.includes("oklab") || val.includes("oklch"))) {
          const safe = val.replace(/okl(ab|ch)\([^)]+\)/gi, (m) => toSafeRgb(m));
          el.style.setProperty(prop, safe, "important");
        }
      }

      const shadow = computed.getPropertyValue("box-shadow");
      if (shadow && (shadow.includes("oklab") || shadow.includes("oklch"))) {
        const safeShadow = shadow.replace(/okl(ab|ch)\([^)]+\)/gi, (m) => toSafeRgb(m));
        el.style.setProperty("box-shadow", safeShadow, "important");
      }
    }
  };

  // Download as High Resolution JPG
  const handleDownloadJpg = async () => {
    if (!menuPrintRef.current) return;
    setIsExportingJpg(true);
    setStatusMessage("جاري إنشاء صورة المنيو بدقة فائقة...");

    try {
      const canvas = await html2canvas(menuPrintRef.current, {
        scale: 2, // High resolution (Retina quality)
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF7F2",
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          sanitizeClonedMenu(clonedDoc);
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `منيو-عروض-سيلبر-للكاترنج-${new Date().toISOString().split("T")[0]}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage("تم تحميل المنيو كصورة JPG بنجاح! 📸");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("JPG export error:", err);
      setStatusMessage("حدث خطأ أثناء تحميل الصورة، يرجى المحاولة ثانية.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Download as Multipage/High Resolution PDF
  const handleDownloadPdf = async () => {
    if (!menuPrintRef.current) return;
    setIsExportingPdf(true);
    setStatusMessage("جاري معالجة وتصدير ملف PDF عالي الجودة...");

    try {
      const canvas = await html2canvas(menuPrintRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF7F2",
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          sanitizeClonedMenu(clonedDoc);
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save(`منيو-عروض-سيلبر-للكاترنج-${new Date().toISOString().split("T")[0]}.pdf`);
      setStatusMessage("تم تحميل المنيو بصيغة PDF بنجاح! 📄");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("PDF export error:", err);
      setStatusMessage("حدث خطأ أثناء توليد ملف PDF.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Direct WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `السلام عليكم، تفضل بالاطلاع على منيو عروض ووجبات كاترنج سيلبر الرسمي لمناسبات كتب الكتاب والأفراح:\n` +
      `📞 للحجز والاستفسار: 01284484868\n` +
      `🌐 رابط الموقع: ${window.location.origin}`
    );
    window.open(`https://wa.me/201284484868?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#C89B3C]/40 flex flex-col max-h-[96vh] overflow-hidden my-auto text-[#221B17]">
        
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#5C1027] via-[#7A1635] to-[#5C1027] text-white border-b border-[#C89B3C]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C89B3C]/20 border border-[#C89B3C]/40 flex items-center justify-center text-[#C89B3C]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  منيو عروض كاترنج سيلبر المحدث
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#C89B3C] text-[#221B17] font-black text-[10px]">
                  مُحدّث تلقائياً ({packages.length} وجبة)
                </span>
              </div>
              <p className="text-[11px] text-[#F4EEDB]/80">
                جاهز للتحميل المباشر بصيغة PDF أو صورة عالية الجودة JPG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4EEDB] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Quick Actions Ribbon */}
        <div className="bg-white/80 backdrop-blur-xs px-4 sm:px-6 py-2.5 border-b border-[#E8DFD1] flex items-center justify-between gap-3 flex-wrap shrink-0">
          {/* Category filter tabs */}
          <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto">
            <span className="text-[#7A6E65] ml-1 shrink-0">عرض الوجبات:</span>
            {[
              { id: "all", label: "جميع الوجبات (12)" },
              { id: "economy", label: "اقتصادي (35 - 45 ج)" },
              { id: "classic", label: "كلاسيك (50 - 60 ج)" },
              { id: "vip", label: "VIP فاخر (65 - 80 ج)" }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeCategoryFilter === cat.id
                    ? "bg-[#5C1027] text-white shadow-xs"
                    : "bg-[#F3E7D3]/60 text-[#5C1027] hover:bg-[#F3E7D3]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Action Download Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-xs transition-all disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C89B3C]" />
              ) : (
                <Download className="w-4 h-4 text-[#C89B3C]" />
              )}
              <span>تحميل PDF 📄</span>
            </button>

            {/* Download JPG button */}
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#DFB76C] hover:from-[#B8892C] hover:to-[#CF9F53] text-[#221B17] text-xs font-black shadow-xs transition-all disabled:opacity-50"
            >
              {isExportingJpg ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#5C1027]" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#5C1027]" />
              )}
              <span>تحميل JPG 📸</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              title="طباعة المنيو"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              title="مشاركة عبر واتساب"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {statusMessage && (
          <div className="bg-[#C89B3C]/20 border-b border-[#C89B3C]/40 px-4 py-2 text-center text-xs font-black text-[#5C1027] animate-fadeIn">
            {statusMessage}
          </div>
        )}

        {/* Scrollable Printable/Exportable Canvas Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#EBE4D5]/40">
          {/* Printable Sheet Wrapper */}
          <div
            ref={menuPrintRef}
            id="celebre-printable-menu"
            className="w-full max-w-4xl mx-auto bg-[#FAF7F2] rounded-2xl border-2 border-[#C89B3C]/40 p-5 sm:p-8 shadow-md"
            style={{ direction: "rtl", fontFamily: "inherit" }}
          >
            {/* Header Section */}
            <div className="border-b-2 border-[#C89B3C]/40 pb-5 mb-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
                
                {/* Official Logo Display */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="p-2 rounded-xl bg-white border border-[#C89B3C]/30 shadow-xs inline-block">
                    <CelebreLogo size="md" showSlogan={false} showEnglishSubtitles={true} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[#5C1027] font-black text-xs">
                    <CelebreStarIcon className="w-3 h-3 text-[#C89B3C]" />
                    <span>سيلبر شريك مؤسس لمناسباتك السعيدة</span>
                    <CelebreClocheIcon className="w-3.5 h-3.5 text-[#C89B3C]" />
                  </div>
                </div>

                {/* Title & Date Details */}
                <div className="sm:text-left flex flex-col sm:items-end">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#5C1027] text-white text-[11px] font-black tracking-wide shadow-2xs mb-1">
                    قائمة الأسعار والوجبات الرسمية المعتمدة
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-[#221B17]">
                    منيو كاترنج المناسبات والضيافة
                  </h1>
                  <p className="text-xs text-[#7A6E65] font-semibold mt-0.5">
                    كتب الكتاب • عقد القران • حفلات الزفاف • الخطوبة • استقبال VIP
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-[#5C1027]">
                    <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>تاريخ التحديث التلقائي: {todayDateStr}</span>
                  </div>
                </div>
              </div>

              {/* Crucial Delivery Notice Banner */}
              <div className="mt-4 p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FCD34D] flex items-center justify-between gap-2 flex-wrap text-[#451A03] text-xs font-black">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#92400E] shrink-0" />
                  <span>تنويه هام: التوصيل غير مشمول في سعر الوجبات ويتم تحديده بالاتفاق حسب مكان القاعة أو المسجد.</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#78350F]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>الحد الأدنى للطلب: 50 وجبة</span>
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 border-b border-[#E8DFD1] pb-1.5">
                <h2 className="text-sm sm:text-base font-black text-[#5C1027] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C89B3C]" />
                  <span>عروض الوجبات المتاحة حالياً ({filteredList.length} وجبة)</span>
                </h2>
                <span className="text-[11px] text-[#7A6E65] font-bold">
                  جميع الأسعار بالجنيه المصري (EGP)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredList.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#C89B3C] transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Package Header Row */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#F4EEDB] pb-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#5C1027] text-white text-[11px] font-black">
                              {pkg.saleCode}
                            </span>
                            {pkg.isBestseller && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#78350F] text-[10px] font-black">
                                الأكثر طلباً ⭐
                              </span>
                            )}
                            {pkg.isLuxury && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#F3E8FF] text-[#581C87] text-[10px] font-black">
                                VIP 👑
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-[#221B17] mt-1">
                            {pkg.name}
                          </h3>
                        </div>

                        {/* Price Tag */}
                        <div className="text-left shrink-0">
                          <div className="text-lg sm:text-xl font-black text-[#5C1027] leading-none">
                            {pkg.pricePerBox} <span className="text-[10px] font-bold text-[#7A6E65]">ج</span>
                          </div>
                          {pkg.originalPrice && pkg.originalPrice > pkg.pricePerBox && (
                            <div className="text-[10px] text-[#A8A29E] line-through">
                              {pkg.originalPrice} ج
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Package Tagline / Content */}
                      <p className="text-[11px] text-[#55473F] leading-relaxed mb-2 font-medium">
                        {pkg.tagline}
                      </p>

                      {/* Components Bullet List */}
                      {pkg.sections && pkg.sections[0] && (
                        <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[#F0EAE1] space-y-1">
                          <span className="text-[10px] font-bold text-[#7A6E65] block">
                            محتويات العلبة بالتفصيل:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {pkg.sections[0].items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[11px] font-bold text-[#221B17]">
                                <CheckCircle2 className="w-3 h-3 text-[#C89B3C] shrink-0" />
                                <span className="truncate">{it}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Packaging specs footnote */}
                    <div className="mt-2 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[10px] text-[#7A6E65]">
                      <span>{pkg.packaging.type}</span>
                      <span className="font-bold text-[#5C1027]">شامل شوكة ومناديل وعصير</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drink Modification Table */}
            <div className="mb-6 p-3.5 rounded-xl bg-[#F3E7D3]/40 border border-[#C89B3C]/30">
              <h3 className="text-xs sm:text-sm font-black text-[#5C1027] mb-2 flex items-center gap-1">
                <span>🥤 خيارات المشروبات والعصائر بالوجبة:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {DRINK_MODIFICATION_OPTIONS.map((opt) => (
                  <div key={opt.id} className="p-2 rounded-lg bg-white border border-[#E8DFD1] text-center">
                    <div className="font-black text-[#221B17]">{opt.label}</div>
                    <div className={`text-[11px] font-bold mt-0.5 ${opt.priceDelta > 0 ? "text-[#B45309]" : opt.priceDelta < 0 ? "text-[#047857]" : "text-[#5C1027]"}`}>
                      {opt.sublabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Contact & Booking Channels Footer (Clear and Prominent) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#5C1027] via-[#480c1e] to-[#2b0712] text-white border-2 border-[#C89B3C]/60 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Contact numbers */}
                <div className="text-center md:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C89B3C] text-[#221B17] font-black text-xs mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>سبل التواصل والحجز المباشر مع سيلبر</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Phone className="w-4 h-4 text-[#C89B3C]" />
                      <span className="font-bold text-sm">الاتصال الهاتفي المباشر:</span>
                      <a href="tel:01284484868" className="text-base sm:text-lg font-black text-[#F4EEDB] hover:text-[#C89B3C] transition-colors" dir="ltr">
                        01284484868
                      </a>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <MessageCircle className="w-4 h-4 text-[#34D399]" />
                      <span className="font-bold text-sm">واتساب الحجز السريع:</span>
                      <a href="https://wa.me/201284484868" target="_blank" rel="noreferrer" className="text-base sm:text-lg font-black text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors" dir="ltr">
                        01284484868
                      </a>
                    </div>
                  </div>
                </div>

                {/* Headquarters & Payment */}
                <div className="text-center md:text-left text-xs space-y-1 text-[#F4EEDB]/90 border-t md:border-t-0 md:border-r border-[#C89B3C]/30 pt-3 md:pt-0 md:pr-6">
                  <div className="flex items-center justify-center md:justify-start gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>المقر الرئيسي: محافظة بني سويف</span>
                  </div>
                  <p className="text-[11px] text-[#F4EEDB]/70">
                    متاح التوصيل لكافة المحافظات والقاعات والمساجد بالاتفاق
                  </p>
                  <div className="text-[11px] font-bold text-[#C89B3C] pt-1">
                    طرق الدفع: إنستاباي InstaPay • فودافون كاش • كاش عند الاستلام
                  </div>
                </div>
              </div>

              {/* Bottom Copyright & Guarantee */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#F4EEDB]/60 flex-wrap gap-2">
                <span>سيلبر - علامة تجارية مسجلة لتجهيز كاترنج المناسبات والأفراح</span>
                <span>علب كرتونية فاخرة مجهزة لحفظ الحرارة وجودة الأطعمة</span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E8DFD1] flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="text-xs text-[#7A6E65] font-semibold">
            💡 يمكنك تحميل المنيو وإرساله لأهلك أو العريس لاختيار الوجبة الأنسب بكل راحة.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-xs transition-all disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin text-[#C89B3C]" /> : <FileText className="w-4 h-4 text-[#C89B3C]" />}
              <span>تحميل كـ PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#DFB76C] hover:from-[#B8892C] hover:to-[#CF9F53] text-[#221B17] text-xs font-black shadow-xs transition-all disabled:opacity-50"
            >
              {isExportingJpg ? <Loader2 className="w-4 h-4 animate-spin text-[#5C1027]" /> : <ImageIcon className="w-4 h-4 text-[#5C1027]" />}
              <span>تحميل كـ صورة JPG</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
