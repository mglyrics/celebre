import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { PublicMenuItem } from "../types/publicMenu";

/**
 * Modern Arabic PDF Menu Generator for Celebre Catering
 * Creates high-fidelity, printable, downloadable A4 PDF menu
 * containing only public distributor prices and authentic components.
 */
export async function downloadMenuPdf(
  menuItems: PublicMenuItem[],
  onProgress?: (isGenerating: boolean, message?: string) => void
): Promise<void> {
  if (!menuItems || menuItems.length === 0) {
    throw new Error("لا توجد وجبات متاحة حالياً لإنشاء ملف المنيو.");
  }

  if (onProgress) {
    onProgress(true, "جاري إعداد وتنسيق ملف المنيو للطباعة بصيغة PDF...");
  }

  // Create isolated render container
  const container = document.createElement("div");
  container.setAttribute("dir", "rtl");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-9999px";
  container.style.width = "820px";
  container.style.backgroundColor = "#FAF7F2";
  container.style.fontFamily = "'Alexandria', 'Cairo', 'Segoe UI', sans-serif";
  container.style.color = "#221B17";
  container.style.padding = "28px";
  container.style.boxSizing = "border-box";
  container.style.zIndex = "-9999";

  const currentDate = new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "long",
  }).format(new Date());

  // Sort items by code / sortOrder
  const sortedItems = [...menuItems].sort((a, b) => {
    const numA = parseInt(a.code.replace(/\D/g, "") || "0", 10);
    const numB = parseInt(b.code.replace(/\D/g, "") || "0", 10);
    return numA - numB;
  });

  const mixItems = sortedItems.filter((i) => {
    const num = parseInt(i.code.replace(/\D/g, "") || "0", 10);
    return num <= 12;
  });

  const sandwichItems = sortedItems.filter((i) => {
    const num = parseInt(i.code.replace(/\D/g, "") || "0", 10);
    return num > 12;
  });

  const renderItemCard = (item: PublicMenuItem) => `
    <div style="background: #FFFFFF; border: 1.5px solid #E8DFD1; border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 12px rgba(114, 24, 50, 0.04); display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; break-inside: avoid; margin-bottom: 12px;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #721832; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 3px 8px; border-radius: 8px; font-family: monospace;">
              ${item.code}
            </span>
            <h4 style="margin: 0; font-size: 13.5px; font-weight: 800; color: #221B17;">
              ${item.name.replace(/\(Sale-\d+\)/i, "").trim()}
            </h4>
          </div>
          <div style="background: #FAF7F2; border: 1px solid #C89B3C; color: #721832; font-weight: 900; font-size: 14px; padding: 4px 10px; border-radius: 10px; white-space: nowrap;">
            ${item.distributorPrice} <span style="font-size: 10px; font-weight: bold; color: #8C6D28;">ج.م</span>
          </div>
        </div>
        
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #6B5E55; line-height: 1.5;">
          ${item.description || ""}
        </p>
      </div>

      ${
        item.components && item.components.length > 0
          ? `
        <div style="background: #FAF7F2; border-radius: 8px; padding: 6px 10px; margin-top: 6px; border: 1px dashed #D6C7B7;">
          <div style="font-size: 10px; font-weight: bold; color: #8C6D28; margin-bottom: 4px;">محتويات العلبة المعتمدة:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${item.components
              .map(
                (c) => `
              <span style="font-size: 9.5px; background: #FFFFFF; border: 1px solid #E8DFD1; padding: 2px 6px; border-radius: 6px; color: #4A3E38;">
                ✓ ${c.name}
              </span>
            `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;

  container.innerHTML = `
    <!-- Header Block -->
    <div style="background: linear-gradient(135deg, #5C1027 0%, #721832 50%, #400B1A 100%); color: #FFFFFF; border-radius: 20px; padding: 24px 28px; margin-bottom: 24px; border: 2px solid #C89B3C; box-shadow: 0 10px 25px rgba(92,16,39,0.2);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #C89B3C;"></div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">
              سيلبر كاترنج | CELEBRE CATERING
            </h1>
          </div>
          <p style="margin: 2px 0 0 0; font-size: 13px; color: #F4EEDB; font-weight: 500;">
            الكتالوج الرسمي المعتمد لعبوات ضيافة الأفراح والمناسبات الفندقية
          </p>
          <div style="margin-top: 10px; display: flex; gap: 16px; font-size: 11px; color: #C89B3C; font-weight: bold;">
            <span>📍 التوصيل: مدينة بني سويف وشرق النيل</span>
            <span>📞 الحجز والطلبات: 01284484868</span>
            <span>🌐 celebre-eg.com</span>
          </div>
        </div>

        <div style="text-align: left; background: rgba(255,255,255,0.1); border: 1px solid rgba(200,155,60,0.5); padding: 10px 16px; border-radius: 14px;">
          <div style="font-size: 10px; color: #F4EEDB; margin-bottom: 2px;">تاريخ إصدار القائمة:</div>
          <div style="font-size: 13px; font-weight: 900; color: #FFFFFF;">${currentDate}</div>
          <div style="font-size: 10px; color: #25D366; font-weight: bold; margin-top: 3px;">● أسعار رسمية معتمدة</div>
        </div>
      </div>
    </div>

    <!-- Features Banner -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: #FFFFFF; border: 1px solid #E8DFD1; border-radius: 12px; padding: 10px 12px; text-align: center;">
        <span style="font-size: 11px; font-weight: bold; color: #721832; display: block;">🍱 تغليف فردي فاخر</span>
        <span style="font-size: 9.5px; color: #6B5E55;">علب كرتونية محكمة معقمة لتوزيع مباشر راقي</span>
      </div>
      <div style="background: #FFFFFF; border: 1px solid #E8DFD1; border-radius: 12px; padding: 10px 12px; text-align: center;">
        <span style="font-size: 11px; font-weight: bold; color: #721832; display: block;">🥤 عصير بخيرة أصلي مشمول</span>
        <span style="font-size: 9.5px; color: #6B5E55;">مع شوكة ومنديل معطر داخل كل علبة</span>
      </div>
      <div style="background: #FFFFFF; border: 1px solid #E8DFD1; border-radius: 12px; padding: 10px 12px; text-align: center;">
        <span style="font-size: 11px; font-weight: bold; color: #721832; display: block;">⚡ حجز مبدئي مباشر</span>
        <span style="font-size: 9.5px; color: #6B5E55;">الحد الأدنى للطلب 50 علبة وتنسيق فوري</span>
      </div>
    </div>

    <!-- Section 1: Mix & Desserts Packages (Sale-01 to Sale-12) -->
    <div style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #721832; padding-bottom: 8px; margin-bottom: 14px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #5C1027;">
          باقات المكس والحلويات والضيافة المتنوعة (Sale-01 إلى Sale-12)
        </h3>
        <span style="font-size: 11px; color: #8C6D28; font-weight: bold;">
          ${mixItems.length} باقة معتمدة
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        ${mixItems.map(renderItemCard).join("")}
      </div>
    </div>

    <!-- Section 2: Sandwich Box Packages (Sale-13 to Sale-18) -->
    ${
      sandwichItems.length > 0
        ? `
      <div style="margin-bottom: 24px; page-break-before: auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #721832; padding-bottom: 8px; margin-bottom: 14px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #5C1027;">
            باقات الساندوتشات والوجبات السريعة الفاخرة (Sale-13 إلى Sale-18)
          </h3>
          <span style="font-size: 11px; color: #8C6D28; font-weight: bold;">
            ${sandwichItems.length} باقة مشبعة
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${sandwichItems.map(renderItemCard).join("")}
        </div>
      </div>
    `
        : ""
    }

    <!-- Official Quality & Booking Footer -->
    <div style="background: #FFFFFF; border: 2px solid #C89B3C; border-radius: 16px; padding: 18px 24px; text-align: center; margin-top: 20px;">
      <div style="font-size: 13px; font-weight: 900; color: #5C1027; margin-bottom: 4px;">
        سيلبر كاترنج - الجودة والنظافة والالتزام في يومكم المميز ✨
      </div>
      <p style="margin: 0 0 10px 0; font-size: 11px; color: #6B5E55; line-height: 1.6;">
        الحجز على الموقع إلكتروني مبدئي بدون دفع إلكتروني. يتم تأكيد الحجز ومتابعة التوصيل عبر واتساب الإدارة: 
        <strong style="color: #221B17;">01284484868</strong>
      </p>
      <div style="font-size: 10px; color: #8C7D73; border-top: 1px solid #E8DFD1; pt-2; margin-top: 8px;">
        © 2026 Celebre Catering. جميع الحقوق محفوظة | https://celebre-eg.com
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#FAF7F2",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Subsequent pages if content overflows A4 height
    while (heightLeft > 5) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save("Celebre-Menu.pdf");

    if (onProgress) {
      onProgress(false, "تم تنزيل المنيو بنجاح!");
    }
  } catch (error: any) {
    console.error("Failed to generate PDF menu:", error);
    if (onProgress) {
      onProgress(false, "حدث خطأ أثناء إنشاء ملف PDF.");
    }
    throw new Error(error.message || "فشل توليد ملف PDF للمنيو");
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
