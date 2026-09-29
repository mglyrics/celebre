import React, { useState, useMemo } from "react";
import { 
  X, Download, FileText, Image as ImageIcon, Printer, 
  Phone, MessageCircle, MapPin, Truck, ShieldCheck, Sparkles, 
  Calendar, Loader2, ArrowLeft, CheckCircle2, ChevronLeft
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { CateringPackage } from "../types";
import { DRINK_MODIFICATION_OPTIONS, isBoxMix, isBoxSandwich } from "../data/cateringData";
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
  const [activeTab, setActiveTab] = useState<"both" | "page1" | "page2">("both");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayDateStr = new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "long"
  }).format(new Date());

  // Split packages into the two official website lists
  const mixPackages = packages.filter(isBoxMix); // 12 packages: Sale-01 to Sale-12
  const sandwichPackages = packages.filter(isBoxSandwich); // 6 packages: Sale-13 to Sale-18

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

    const elements = [clonedDoc.body, ...Array.from(clonedDoc.body.querySelectorAll("*"))] as HTMLElement[];
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

  // Download both pages as a 2-page PDF
  const handleDownloadPdf = async () => {
    const p1 = document.getElementById("celebre-menu-page-1");
    const p2 = document.getElementById("celebre-menu-page-2");
    if (!p1 || !p2) return;

    setIsExportingPdf(true);
    setStatusMessage("جاري تصدير الصفحة الأولى (Box ميكس)... 📄");

    try {
      // Capture Page 1
      const canvas1 = await html2canvas(p1, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF7F2",
        windowWidth: 950,
        onclone: (clonedDoc) => sanitizeClonedMenu(clonedDoc)
      });

      setStatusMessage("جاري تصدير الصفحة الثانية (Box ساندوتش)... 📄");

      // Capture Page 2
      const canvas2 = await html2canvas(p2, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF7F2",
        windowWidth: 950,
        onclone: (clonedDoc) => sanitizeClonedMenu(clonedDoc)
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm

      // Add Page 1
      const img1 = canvas1.toDataURL("image/jpeg", 0.95);
      const h1 = (canvas1.height * pdfWidth) / canvas1.width;
      pdf.addImage(img1, "JPEG", 0, 0, pdfWidth, Math.min(pdfHeight, h1), undefined, "FAST");

      // Add Page 2
      pdf.addPage();
      const img2 = canvas2.toDataURL("image/jpeg", 0.95);
      const h2 = (canvas2.height * pdfWidth) / canvas2.width;
      pdf.addImage(img2, "JPEG", 0, 0, pdfWidth, Math.min(pdfHeight, h2), undefined, "FAST");

      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`منيو-عروض-سيلبر-للكاترنج-صفحتين-${dateStr}.pdf`);

      setStatusMessage("تم تحميل المنيو كملف PDF مكوّن من صفحتين بنجاح! 📄✨");
      setTimeout(() => setStatusMessage(null), 4500);
    } catch (err) {
      console.error("PDF export error:", err);
      setStatusMessage("حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مجدداً.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Download as JPG (supports downloading both pages as 2 separate high-res images or single page)
  const handleDownloadJpg = async (target: "all" | "page1" | "page2" = "all") => {
    const p1 = document.getElementById("celebre-menu-page-1");
    const p2 = document.getElementById("celebre-menu-page-2");
    if (!p1 || !p2) return;

    setIsExportingJpg(true);
    const dateStr = new Date().toISOString().split("T")[0];

    const triggerDownload = (canvas: HTMLCanvasElement, filename: string) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    try {
      if (target === "all" || target === "page1") {
        setStatusMessage("جاري إنشاء صورة الصفحة الأولى (Box ميكس)... 📸");
        const canvas1 = await html2canvas(p1, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#FAF7F2",
          windowWidth: 950,
          onclone: (clonedDoc) => sanitizeClonedMenu(clonedDoc)
        });
        triggerDownload(canvas1, `منيو-سيلبر-صفحة-1-Box-ميكس-${dateStr}.jpg`);
      }

      if (target === "all" || target === "page2") {
        if (target === "all") {
          setStatusMessage("جاري إنشاء صورة الصفحة الثانية (Box ساندوتش)... 📸");
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
        const canvas2 = await html2canvas(p2, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#FAF7F2",
          windowWidth: 950,
          onclone: (clonedDoc) => sanitizeClonedMenu(clonedDoc)
        });
        triggerDownload(canvas2, `منيو-سيلبر-صفحة-2-Box-ساندوتش-${dateStr}.jpg`);
      }

      setStatusMessage(
        target === "all"
          ? "تم تحميل المنيو صفحتين كصورتين JPG عالية الوضوح بنجاح! 📸"
          : "تم تحميل صفحة المنيو بصيغة JPG بنجاح! 📸"
      );
      setTimeout(() => setStatusMessage(null), 4500);
    } catch (err) {
      console.error("JPG export error:", err);
      setStatusMessage("حدث خطأ أثناء تحميل صور المنيو.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `السلام عليكم، تفضل بالاطلاع على منيو عروض ووجبات كاترنج سيلبر الرسمي (صفحة 1: Box ميكس & صفحة 2: Box ساندوتش):\n` +
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
                  منيو كاترنج سيلبر المعتمد (صفحتين)
                </h3>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#C89B3C] text-[#221B17] font-black text-[11px]">
                  مُقسّم صفحتين: Box ميكس & Box ساندوتش
                </span>
              </div>
              <p className="text-[11px] text-[#F4EEDB]/85">
                جاهز للتصدير كملف PDF مكوّن من صفحتين أو صورتين JPG عاليتي الجودة
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
        <div className="bg-white/90 backdrop-blur-xs px-4 sm:px-6 py-2.5 border-b border-[#E8DFD1] flex items-center justify-between gap-3 flex-wrap shrink-0">
          {/* Page view tabs */}
          <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto">
            <span className="text-[#7A6E65] ml-1 shrink-0">معاينة:</span>
            {[
              { id: "both", label: "كلا الصفحتين (1 و 2)" },
              { id: "page1", label: "صفحة 1: Box ميكس (12 عرض) 🍰" },
              { id: "page2", label: "صفحة 2: Box ساندوتش (6 عروض) 🥪" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "bg-[#5C1027] text-white shadow-xs"
                    : "bg-[#F3E7D3]/60 text-[#5C1027] hover:bg-[#F3E7D3]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Download Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF button (2 pages) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-xs transition-all disabled:opacity-50"
              title="تصدير المنيو كامل صفحتين بصيغة PDF للطباعة"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C89B3C]" />
              ) : (
                <Download className="w-4 h-4 text-[#C89B3C]" />
              )}
              <span>تحميل صفحتين PDF 📄</span>
            </button>

            {/* Download JPG button (both pages) */}
            <button
              type="button"
              onClick={() => handleDownloadJpg("all")}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#DFB76C] hover:from-[#B8892C] hover:to-[#CF9F53] text-[#221B17] text-xs font-black shadow-xs transition-all disabled:opacity-50"
              title="تحميل الصفحتين معاً كصورتين JPG"
            >
              {isExportingJpg ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#5C1027]" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#5C1027]" />
              )}
              <span>تحميل صفحتين JPG 📸</span>
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#EBE4D5]/40 space-y-8">
          
          {/* ======================================================== */}
          {/* PAGE 1: قائمة Box ميكس (أول 12 عرض: Sale-01 إلى Sale-12) */}
          {/* ======================================================== */}
          {(activeTab === "both" || activeTab === "page1") && (
            <div
              id="celebre-menu-page-1"
              className="w-full max-w-4xl mx-auto bg-[#FAF7F2] rounded-3xl border-2 border-[#C89B3C]/50 p-5 sm:p-8 shadow-lg relative flex flex-col justify-between"
              style={{ direction: "rtl", fontFamily: "inherit" }}
            >
              <div>
                {/* Page 1 Header */}
                <div className="border-b-2 border-[#C89B3C]/50 pb-4 mb-4 bg-white/70 p-4 sm:p-5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  {/* Top Bar: Official Royal Brand + Handwriting Slogan + Page Metadata */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 pb-3 border-b border-[#F0EAE1]">
                    {/* Logo & Handwriting Signature */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-[#C89B3C]/40 shadow-xs">
                        <CelebreLogo size="sm" showSlogan={false} showEnglishSubtitles={true} />
                      </div>
                      <div className="text-right">
                        <div className="font-['Cinzel',serif] text-xs font-black tracking-widest text-[#5C1027]">
                          CÉLÈBRE CATERING
                        </div>
                        <div className="font-['Dancing_Script',cursive] text-base text-[#5C1027] font-bold" dir="ltr">
                          with you in all happy moments
                        </div>
                      </div>
                    </div>

                    {/* Page Badges & Release Date */}
                    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                      <span className="px-3 py-1 rounded-full bg-[#5C1027] text-white text-xs font-black shadow-xs border border-[#C89B3C]/50 flex items-center gap-1.5">
                        <span>🍰</span>
                        <span>الصفحة 1 من 2 • Box ميكس</span>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#FAF7F2] text-[#5C1027] text-xs font-bold border border-[#E8DFD1]">
                        12 عرض رسمي معتمد
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white text-[#7A6E65] text-[11px] font-semibold border border-[#E8DFD1] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>تاريخ الإصدار: {todayDateStr}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Description Row */}
                  <div className="pt-3 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-[#221B17] tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                        <span>قائمة عروض «Box ميكس» الفاخرة</span>
                        <span className="text-[11px] bg-[#C89B3C] text-[#221B17] px-2 py-0.5 rounded-md font-black">Sale 01 - 12</span>
                      </h1>
                      <p className="text-xs text-[#61534B] mt-0.5 font-medium">
                        تشكيلة كاترنج متكاملة تجمع بين الساندوتشات والجاتوه والمخبوزات والحلويات وعصير بخيرة
                      </p>
                    </div>
                    <div className="text-left shrink-0 text-xs font-bold text-[#5C1027] bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD1]">
                      <div>الحد الأدنى: 50 علبة</div>
                      <div className="text-[10px] text-[#7A6E65]">عقود القران • الأفراح • المناسبات</div>
                    </div>
                  </div>

                  {/* Coordinated Notice Ribbon */}
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 flex-wrap text-xs text-amber-950 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                      <span>تنويه التوصيل: تكلفة التوصيل غير مشمولة بأسعار الوجبات وتحدد بالتنسيق المباشر وفقاً لموقع المناسبة.</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#5C1027]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>علب كرتونية مذهبة محكمة الإغلاق</span>
                      <span className="border-r border-amber-300 pr-2 font-black">هاتف الحجز: 01284484868</span>
                    </div>
                  </div>
                </div>

                {/* Page 1 Grid: 12 Meals (Sale-01 to Sale-12) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {mixPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#E8DFD1] shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Code + Name + Price */}
                        <div className="flex items-start justify-between gap-2 border-b border-[#F4EEDB] pb-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-[#5C1027] text-white text-[11px] font-black tracking-wide">
                                {pkg.saleCode}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5C1027]/10 text-[#5C1027]">
                                Box ميكس
                              </span>
                              {pkg.isBestseller && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  الأكثر طلباً ⭐
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-black text-[#221B17] leading-snug">
                              {pkg.name.replace(/\([^)]+\)/g, "").trim()}
                            </h4>
                          </div>

                          <div className="text-left shrink-0 bg-[#FAF7F2] px-2.5 py-1 rounded-xl border border-[#F0EAE1]">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span className="text-base sm:text-lg font-black text-[#5C1027] leading-none">
                                {pkg.pricePerBox}
                              </span>
                              <span className="text-[10px] font-bold text-[#7A6E65]">ج.م</span>
                            </div>
                            {pkg.originalPrice && pkg.originalPrice > pkg.pricePerBox && (
                              <div className="text-[9px] text-[#A8A29E] line-through text-left">
                                {pkg.originalPrice} ج
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Items list */}
                        {pkg.sections && pkg.sections[0] && (
                          <div className="space-y-1 mb-2">
                            {pkg.sections[0].items.map((it, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center gap-1.5 text-[11px] font-bold text-[#3E342F]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C] shrink-0" />
                                <span className="truncate leading-tight">{it}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footnote with Handwriting Signature */}
                      <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[10px] text-[#7A6E65]">
                        <span className="text-[#5C1027] font-bold">
                          شامل عصير بخيرة وشوكة ومناديل
                        </span>
                        <span className="font-['Dancing_Script',cursive] text-xs text-[#5C1027] font-bold" dir="ltr">
                          with you in all happy moments
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Page 1 Bottom Navigation / Footer */}
              <div className="pt-3 border-t-2 border-[#C89B3C]/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7A6E65]">
                <div className="flex items-center gap-2 font-bold text-[#5C1027]">
                  <span className="w-2 h-2 rounded-full bg-[#5C1027]" />
                  <span>علب كرتونية مذهبة معتمدة من سيلبر ومحكمة الإغلاق</span>
                </div>
                <div className="flex items-center gap-1 font-black text-[#5C1027]">
                  <span>صفحة 1 من 2</span>
                  <ChevronLeft className="w-4 h-4 text-[#C89B3C]" />
                  <span className="text-[#7A6E65]">تابع عروض Box ساندوتش بالصفحة 2</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PAGE 2: قائمة Box ساندوتش (العروض من 13 إلى 18) + المشروبات والحجز */}
          {/* ======================================================== */}
          {(activeTab === "both" || activeTab === "page2") && (
            <div
              id="celebre-menu-page-2"
              className="w-full max-w-4xl mx-auto bg-[#FAF7F2] rounded-3xl border-2 border-[#C89B3C]/50 p-5 sm:p-8 shadow-lg relative flex flex-col justify-between"
              style={{ direction: "rtl", fontFamily: "inherit" }}
            >
              <div>
                {/* Page 2 Header */}
                <div className="border-b-2 border-[#C89B3C]/50 pb-4 mb-4 bg-white/70 p-4 sm:p-5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                  {/* Top Bar: Official Royal Brand + Handwriting Slogan + Page Metadata */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 pb-3 border-b border-[#F0EAE1]">
                    {/* Logo & Handwriting Signature */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-[#C89B3C]/40 shadow-xs">
                        <CelebreLogo size="sm" showSlogan={false} showEnglishSubtitles={true} />
                      </div>
                      <div className="text-right">
                        <div className="font-['Cinzel',serif] text-xs font-black tracking-widest text-[#2A170F]">
                          CÉLÈBRE CATERING
                        </div>
                        <div className="font-['Dancing_Script',cursive] text-base text-[#5C1027] font-bold" dir="ltr">
                          with you in all happy moments
                        </div>
                      </div>
                    </div>

                    {/* Page Badges & Release Date */}
                    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                      <span className="px-3 py-1 rounded-full bg-[#2A170F] text-white text-xs font-black shadow-xs border border-[#C89B3C]/50 flex items-center gap-1.5">
                        <span>🥪</span>
                        <span>الصفحة 2 من 2 • Box ساندوتش</span>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#FAF7F2] text-[#2A170F] text-xs font-bold border border-[#E8DFD1]">
                        6 عروض ساندوتشات فاخرة
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white text-[#7A6E65] text-[11px] font-semibold border border-[#E8DFD1] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>تاريخ الإصدار: {todayDateStr}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Description Row */}
                  <div className="pt-3 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-[#221B17] tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                        <span>قائمة عروض «Box ساندوتش» الفاخرة</span>
                        <span className="text-[11px] bg-[#C89B3C] text-[#221B17] px-2 py-0.5 rounded-md font-black">Sale 13 - 18</span>
                      </h1>
                      <p className="text-xs text-[#61534B] mt-0.5 font-medium">
                        تشكيلة ساندوتشات كفتة مشوية وبانيه دجاج وجبنة رومي بالخبز الفرنسي الطازج مع عصير بخيرة ومنديل معطر
                      </p>
                    </div>
                    <div className="text-left shrink-0 text-xs font-bold text-[#2A170F] bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD1]">
                      <div>الحد الأدنى: 50 علبة</div>
                      <div className="text-[10px] text-[#7A6E65]">عقود القران • الأفراح • المناسبات</div>
                    </div>
                  </div>

                  {/* Coordinated Notice Ribbon */}
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 flex-wrap text-xs text-amber-950 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                      <span>تنويه التوصيل: تكلفة التوصيل غير مشمولة بأسعار الوجبات وتحدد بالتنسيق المباشر وفقاً لموقع المناسبة.</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#5C1027]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>علب كرتونية مذهبة محكمة الإغلاق</span>
                      <span className="border-r border-amber-300 pr-2 font-black">هاتف الحجز: 01284484868</span>
                    </div>
                  </div>
                </div>

                {/* Page 2 Grid: 6 Meals (Sale-13 to Sale-18) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                  {sandwichPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E8DFD1] shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Code + Name + Price */}
                        <div className="flex items-start justify-between gap-2 border-b border-[#F4EEDB] pb-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-[#2A170F] text-white text-[11px] font-black tracking-wide">
                                {pkg.saleCode}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Box ساندوتش 🥪
                              </span>
                              {pkg.isBestseller && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-200 text-amber-950">
                                  الأكثر طلباً ⭐
                                </span>
                              )}
                              {pkg.isLuxury && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-900">
                                  عرض VIP 👑
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-black text-[#221B17] leading-snug">
                              {pkg.name.replace(/\([^)]+\)/g, "").trim()}
                            </h4>
                          </div>

                          <div className="text-left shrink-0 bg-[#FAF7F2] px-2.5 py-1 rounded-xl border border-[#F0EAE1]">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span className="text-base sm:text-lg font-black text-[#5C1027] leading-none">
                                {pkg.pricePerBox}
                              </span>
                              <span className="text-[10px] font-bold text-[#7A6E65]">ج.م</span>
                            </div>
                            {pkg.originalPrice && pkg.originalPrice > pkg.pricePerBox && (
                              <div className="text-[9px] text-[#A8A29E] line-through text-left">
                                {pkg.originalPrice} ج
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Items list */}
                        {pkg.sections && pkg.sections[0] && (
                          <div className="space-y-1 mb-2">
                            {pkg.sections[0].items.map((it, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center gap-1.5 text-[11px] font-bold text-[#3E342F]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C] shrink-0" />
                                <span className="truncate leading-tight">{it}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footnote with Handwriting Signature */}
                      <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[10px] text-[#7A6E65]">
                        <span className="text-[#5C1027] font-bold">
                          شامل عصير بخيرة ومنديل معطر
                        </span>
                        <span className="font-['Dancing_Script',cursive] text-xs text-[#5C1027] font-bold" dir="ltr">
                          with you in all happy moments
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drink Options Table */}
                <div className="mb-5 p-3 rounded-2xl bg-[#F3E7D3]/40 border border-[#C89B3C]/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-black text-[#5C1027]">
                      🥤 خيارات المشروبات والعصائر بالعلبة:
                    </h4>
                    <span className="text-[10px] text-[#7A6E65] font-bold">
                      مشمول عصير بخيرة بقيمة 5 ج بكافة الوجبات، ومتاح الترقية
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {DRINK_MODIFICATION_OPTIONS.map((opt) => (
                      <div key={opt.id} className="p-2 rounded-xl bg-white border border-[#E8DFD1] text-center shadow-2xs">
                        <div className="font-black text-[#221B17] text-xs">{opt.label}</div>
                        <div className={`text-[10px] font-bold mt-0.5 ${
                          opt.priceDelta > 0 ? "text-[#B45309]" : opt.priceDelta < 0 ? "text-emerald-700" : "text-[#5C1027]"
                        }`}>
                          {opt.sublabel}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official Contact & Booking Channels Footer */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#5C1027] via-[#480c1e] to-[#2A0813] text-white border-2 border-[#C89B3C]/60 shadow-md">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    {/* Contact numbers */}
                    <div className="text-center md:text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C89B3C] text-[#221B17] font-black text-[11px] mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>سبل التواصل والحجز المباشر مع سيلبر</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <Phone className="w-4 h-4 text-[#C89B3C]" />
                          <span className="font-bold text-xs sm:text-sm">الاتصال الهاتفي المباشر:</span>
                          <a href="tel:01284484868" className="text-base sm:text-lg font-black text-[#F4EEDB] hover:text-[#C89B3C] transition-colors" dir="ltr">
                            01284484868
                          </a>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <MessageCircle className="w-4 h-4 text-[#34D399]" />
                          <span className="font-bold text-xs sm:text-sm">واتساب الحجز السريع:</span>
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

                  {/* Bottom Copyright & Handwriting signature */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-[#F4EEDB]/70 flex-wrap gap-2">
                    <span>سيلبر - علامة تجارية مسجلة لتجهيز كاترنج المناسبات والأفراح</span>
                    <span className="font-['Dancing_Script',cursive] text-sm text-[#F4EEDB] font-bold" dir="ltr">
                      with you in all happy moments
                    </span>
                  </div>
                </div>
              </div>

              {/* Page 2 Bottom Footer */}
              <div className="mt-3 pt-3 border-t-2 border-[#C89B3C]/30 flex items-center justify-between text-xs text-[#7A6E65]">
                <span className="font-bold text-[#5C1027]">سيلبر • شريك مناسباتكم السعيدة</span>
                <span className="font-black text-[#5C1027]">صفحة 2 من 2 • نهاية قائمة كاترنج سيلبر 2026</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Sticky Ribbon */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E8DFD1] flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="text-xs text-[#7A6E65] font-semibold">
            💡 يمكنك تحميل المنيو المكوّن من صفحتين بصيغة PDF للطباعة أو كصور JPG لمشاركتها عبر واتساب.
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-xs transition-all disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin text-[#C89B3C]" /> : <FileText className="w-4 h-4 text-[#C89B3C]" />}
              <span>تحميل صفحتين (PDF)</span>
            </button>

            {/* Download JPG button */}
            <button
              type="button"
              onClick={() => handleDownloadJpg("all")}
              disabled={isExportingPdf || isExportingJpg}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#DFB76C] hover:from-[#B8892C] hover:to-[#CF9F53] text-[#221B17] text-xs font-black shadow-xs transition-all disabled:opacity-50"
            >
              {isExportingJpg ? <Loader2 className="w-4 h-4 animate-spin text-[#5C1027]" /> : <ImageIcon className="w-4 h-4 text-[#5C1027]" />}
              <span>تحميل صفحتين (JPG)</span>
            </button>

            {/* Close */}
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
