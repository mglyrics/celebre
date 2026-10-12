import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { PublicMenuItem } from "../types/publicMenu";
import { sortMenuItemsAscending, getMixBoxItems, getSandwichBoxItems } from "../data/fallbackMenu";
import { prepareRtlTextForPdf } from "../utils/arabicPdfUtils";
import { KACST_BOOK_BASE64 } from "../assets/fonts/kacstBookBase64";

/**
 * Modern Arabic PDF Menu Generator for Celebre Catering
 * Produces structured, searchable, selectable, and high-fidelity A4 printable PDF:
 *  - Page 1: Elegant Brand Cover with Official Header & Contacts
 *  - Page 2: ميكس بوكس | MIX BOX (Part 1: Sale-01 to Sale-06)
 *  - Page 3: ميكس بوكس | MIX BOX (Part 2: Sale-07 to Sale-12)
 *  - Page 4: سندوتش بوكس | SANDWICH BOX (Sale-13 to Sale-18) + Official Contact & Booking Footer
 */
export async function downloadMenuPdf(
  menuItems: PublicMenuItem[],
  onProgress?: (isGenerating: boolean, message?: string) => void
): Promise<void> {
  if (!menuItems || menuItems.length === 0) {
    throw new Error("لا توجد وجبات متاحة حالياً لإنشاء ملف المنيو.");
  }

  if (onProgress) {
    onProgress(true, "جاري إعداد وتنسيق صفحات المنيو الرسمية للطباعة (A4)...");
  }

  // 1. Group & sort strictly via shared helpers
  const sortedAll = sortMenuItemsAscending(menuItems);
  const mixItems = getMixBoxItems(sortedAll);
  const sandwichItems = getSandwichBoxItems(sortedAll);

  // Split mix into 2 pages of 6 items each
  const mixPage1 = mixItems.slice(0, 6);
  const mixPage2 = mixItems.slice(6, 12);
  const sandwichList = sandwichItems.slice(0, 6);

  const currentDate = new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "long",
  }).format(new Date());

  // Helper to render an item card in HTML
  const renderItemCard = (item: PublicMenuItem) => `
    <div style="background: #FFFFFF; border: 1.5px solid #E8DFD1; border-radius: 12px; padding: 12px 14px; box-shadow: 0 2px 6px rgba(114, 24, 50, 0.03); display: flex; flex-direction: column; justify-content: space-between; font-family: 'Alexandria', 'Cairo', sans-serif; min-height: 122px; box-sizing: border-box;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="background: #721832; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 2px 7px; border-radius: 6px; font-family: monospace;">
              ${item.code}
            </span>
            <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #221B17; line-height: 1.3;">
              ${item.name.replace(/\(Sale-\d+\)/i, "").trim()}
            </h4>
          </div>
          <div style="background: #FAF7F2; border: 1.5px solid #C89B3C; color: #721832; font-weight: 900; font-size: 13px; padding: 2px 8px; border-radius: 8px; white-space: nowrap;">
            ${item.distributorPrice} <span style="font-size: 9px; font-weight: bold; color: #8C6D28;">ج.م</span>
          </div>
        </div>
        
        <p style="margin: 0 0 6px 0; font-size: 10px; color: #6B5E55; line-height: 1.45;">
          ${item.description || ""}
        </p>
      </div>

      ${
        item.components && item.components.length > 0
          ? `
        <div style="background: #FAF7F2; border-radius: 6px; padding: 4px 7px; margin-top: 4px; border: 1px dashed #D6C7B7;">
          <div style="font-size: 9px; font-weight: bold; color: #8C6D28; margin-bottom: 2px;">المكونات المعتمدة بالعلبة:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 3px;">
            ${item.components
              .map(
                (c) => `
              <span style="font-size: 8.5px; background: #FFFFFF; border: 1px solid #E8DFD1; padding: 1px 4px; border-radius: 4px; color: #4A3E38;">
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

  // Hidden container to render pages
  const container = document.createElement("div");
  container.setAttribute("dir", "rtl");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-9999px";
  container.style.zIndex = "-9999";
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Embed Arabic font for searchable/selectable text
    try {
      pdf.addFileToVFS("KacstBook.ttf", KACST_BOOK_BASE64);
      pdf.addFont("KacstBook.ttf", "KacstBook", "normal");
      pdf.setFont("KacstBook");
    } catch (e) {
      console.warn("Could not load embedded font, falling back to standard font", e);
    }

    // Define 4 Pages in HTML
    const page1Html = `
      <div style="width: 794px; min-height: 1123px; padding: 36px 40px; box-sizing: border-box; background: #FAF7F2; font-family: 'Alexandria', 'Cairo', sans-serif; color: #221B17; display: flex; flex-direction: column; justify-content: space-between;">
        <!-- Top Brand Cover -->
        <div>
          <!-- Header Emblem -->
          <div style="text-align: center; margin-bottom: 26px;">
            <div style="display: inline-block; background: #721832; color: #FAF7F2; padding: 6px 18px; border-radius: 30px; font-size: 12px; font-weight: bold; border: 1px solid #C89B3C; margin-bottom: 14px;">
              ✨ الكتالوج الرسمي المعتمد لعام 2026 ✨
            </div>
            <h1 style="margin: 0; font-size: 34px; font-weight: 900; color: #5C1027; letter-spacing: -0.5px;">
              CÉLÈBRE CATERING
            </h1>
            <div style="font-size: 20px; font-weight: 800; color: #C89B3C; margin-top: 6px;">
              منيو الكاترينج الفندقي الفاخر
            </div>
            <p style="font-size: 12.5px; color: #6B5E55; margin: 8px auto 0 auto; max-width: 520px; line-height: 1.6;">
              الكتالوج المعتمد لعلب وبوكسات ضيافة الأفراح، حفلات كتب الكتاب، الفعاليات الكبرى وتوزيعات المساجد
            </p>
          </div>

          <!-- Hero Brand Card -->
          <div style="background: linear-gradient(135deg, #5C1027 0%, #721832 50%, #400B1A 100%); color: #FFFFFF; border-radius: 20px; padding: 24px 28px; border: 2px solid #C89B3C; box-shadow: 0 10px 24px rgba(92,16,39,0.25); margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(200,155,60,0.4); padding-bottom: 14px; margin-bottom: 14px;">
              <div>
                <span style="font-size: 11px; color: #C89B3C; font-weight: bold;">هوية الضيافة المعتمدة:</span>
                <div style="font-size: 17px; font-weight: 900; color: #FFFFFF; margin-top: 2px;">
                  18 وجبة كاترنج حقيقية ومتنوعة
                </div>
              </div>
              <div style="text-align: left; background: rgba(255,255,255,0.12); border: 1px solid rgba(200,155,60,0.6); padding: 8px 14px; border-radius: 10px;">
                <div style="font-size: 10px; color: #F4EEDB;">تاريخ التحديث:</div>
                <div style="font-size: 12px; font-weight: 900; color: #FFFFFF;">${currentDate}</div>
              </div>
            </div>

            <p style="font-size: 11.5px; line-height: 1.6; color: #F4EEDB; margin: 0;">
              تتميز وجبات سيليبر بتقديمها داخل علب كرتونية فاخرة محكمة الإغلاق معقمة لحماية الوجبة وضمان تقديم فندقي مشرّف أمام ضيوفك. كل وجبة تشمل عصير بخيرة 200 مل أصلي وشوكة ومنديل معقم.
            </p>
          </div>

          <!-- The Two Major Sections Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px;">
            <!-- Section 1 Card -->
            <div style="background: #FFFFFF; border: 2px solid #721832; border-radius: 16px; padding: 18px; box-shadow: 0 4px 12px rgba(114,24,50,0.06);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="background: #721832; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 3px 8px; border-radius: 6px;">
                  العروض Sale-01 إلى Sale-12
                </span>
                <span style="font-size: 12px; font-weight: 900; color: #8C6D28;">12 وجبة</span>
              </div>
              <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 900; color: #5C1027;">
                ميكس بوكس | MIX BOX 🍰
              </h3>
              <p style="margin: 0; font-size: 11px; color: #6B5E55; line-height: 1.5;">
                تشكيلات متوازنة تجمع بين قطع الجاتوه المغلفة وسندوتشات اللحوم والجبن والباتيه المخبوز طازجاً.
              </p>
            </div>

            <!-- Section 2 Card -->
            <div style="background: #FFFFFF; border: 2px solid #C89B3C; border-radius: 16px; padding: 18px; box-shadow: 0 4px 12px rgba(200,155,60,0.08);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="background: #8C6D28; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 3px 8px; border-radius: 6px;">
                  العروض Sale-13 إلى Sale-18
                </span>
                <span style="font-size: 12px; font-weight: 900; color: #8C6D28;">6 وجبات</span>
              </div>
              <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 900; color: #8C6D28;">
                سندوتش بوكس | SANDWICH BOX 🥪
              </h3>
              <p style="margin: 0; font-size: 11px; color: #6B5E55; line-height: 1.5;">
                باقات السندوتشات الفرنساوي الوسط المشبعة (كفتة مشوية، بانية، تركي، رومي) للمناسبات الكبرى وتوزيعات المساجد.
              </p>
            </div>
          </div>

          <!-- Value Guarantees -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px;">
            <div style="background: #FFFFFF; border: 1px solid #E8DFD1; border-radius: 12px; padding: 12px; text-align: center;">
              <div style="font-size: 11.5px; font-weight: 900; color: #721832; margin-bottom: 3px;">🍱 علب كرتونية محكمة</div>
              <div style="font-size: 9.5px; color: #6B5E55;">معقمة بالكامل لتوزيع سريع ونظيف</div>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E8DFD1; border-radius: 12px; padding: 12px; text-align: center;">
              <div style="font-size: 11.5px; font-weight: 900; color: #721832; margin-bottom: 3px;">🥤 عصير بخيرة أصلي</div>
              <div style="font-size: 9.5px; color: #6B5E55;">مشمول بالعلبة مع شوكة ومنديل</div>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E8DFD1; border-radius: 12px; padding: 12px; text-align: center;">
              <div style="font-size: 11.5px; font-weight: 900; color: #721832; margin-bottom: 3px;">⚡ حجز مبدئي بدون دفع</div>
              <div style="font-size: 9.5px; color: #6B5E55;">تأكيد هاتفي ومتابعة عبر واتساب</div>
            </div>
          </div>
        </div>

        <!-- Cover Footer -->
        <div style="background: #FFFFFF; border: 1.5px solid #C89B3C; border-radius: 14px; padding: 14px 20px; text-align: center;">
          <div style="font-size: 12px; font-weight: 900; color: #5C1027; margin-bottom: 4px;">
            بيانات التواصل والاستعلام المعتمدة
          </div>
          <div style="display: flex; justify-content: center; gap: 24px; font-size: 11px; color: #221B17; font-weight: bold;">
            <span>📞 هاتف الإدارة: 01284484868</span>
            <span>💬 واتساب: 01284484868</span>
            <span>🌐 الموقع الإلكتروني: celebre-eg.com</span>
            <span>📍 التوصيل: بني سويف وكافة المحافظات</span>
          </div>
        </div>
      </div>
    `;

    const page2Html = `
      <div style="width: 794px; min-height: 1123px; padding: 32px 36px; box-sizing: border-box; background: #FAF7F2; font-family: 'Alexandria', 'Cairo', sans-serif; color: #221B17; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Section Header -->
          <div style="background: #FAF7F2; border: 2px solid #721832; border-right-width: 8px; border-radius: 14px; padding: 12px 18px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #5C1027;">
                ميكس بوكس | MIX BOX (الجزء الأول)
              </h2>
              <span style="font-size: 11px; color: #8C6D28; font-weight: bold;">
                عروض وجبات الجاتوه واللحوم والمخبوزات (العروض من Sale-01 إلى Sale-06)
              </span>
            </div>
            <span style="background: #721832; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 20px;">
              صفحة 2 من 4
            </span>
          </div>

          <!-- Items Grid: 6 Items -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            ${mixPage1.map(renderItemCard).join("")}
          </div>
        </div>

        <!-- Page Sub-footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E8DFD1; padding-top: 10px; font-size: 10px; color: #6B5E55;">
          <span>سيلبر كاترنج | Celebre Catering — أسعار البيع المعلنة للمستهلك شاملة العصير</span>
          <span>الحجز والاستعلام: 01284484868</span>
        </div>
      </div>
    `;

    const page3Html = `
      <div style="width: 794px; min-height: 1123px; padding: 32px 36px; box-sizing: border-box; background: #FAF7F2; font-family: 'Alexandria', 'Cairo', sans-serif; color: #221B17; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Section Header -->
          <div style="background: #FAF7F2; border: 2px solid #721832; border-right-width: 8px; border-radius: 14px; padding: 12px 18px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #5C1027;">
                ميكس بوكس | MIX BOX (الجزء الثاني)
              </h2>
              <span style="font-size: 11px; color: #8C6D28; font-weight: bold;">
                عروض وجبات الجاتوه واللحوم والمخبوزات (العروض من Sale-07 إلى Sale-12)
              </span>
            </div>
            <span style="background: #721832; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 20px;">
              صفحة 3 من 4
            </span>
          </div>

          <!-- Items Grid: 6 Items -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            ${mixPage2.map(renderItemCard).join("")}
          </div>
        </div>

        <!-- Page Sub-footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E8DFD1; padding-top: 10px; font-size: 10px; color: #6B5E55;">
          <span>سيلبر كاترنج | Celebre Catering — أسعار البيع المعلنة للمستهلك شاملة العصير</span>
          <span>الحجز والاستعلام: 01284484868</span>
        </div>
      </div>
    `;

    const page4Html = `
      <div style="width: 794px; min-height: 1123px; padding: 32px 36px; box-sizing: border-box; background: #FAF7F2; font-family: 'Alexandria', 'Cairo', sans-serif; color: #221B17; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Visual Separator & Section Header -->
          <div style="background: #FAF7F2; border: 2px solid #C89B3C; border-right-width: 8px; border-radius: 14px; padding: 12px 18px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #8C6D28;">
                سندوتش بوكس | SANDWICH BOX
              </h2>
              <span style="font-size: 11px; color: #5C1027; font-weight: bold;">
                عروض السندوتشات الفرنساوي الوسط المشبعة (العروض من Sale-13 إلى Sale-18)
              </span>
            </div>
            <span style="background: #8C6D28; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 20px;">
              صفحة 4 من 4
            </span>
          </div>

          <!-- Items Grid: 6 Items (Sale-13 to Sale-18) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            ${sandwichList.map(renderItemCard).join("")}
          </div>
        </div>

        <!-- Official Concluding Brand Footer -->
        <div style="background: #FFFFFF; border: 2px solid #C89B3C; border-radius: 14px; padding: 16px 20px; text-align: center;">
          <div style="font-size: 13px; font-weight: 900; color: #5C1027; margin-bottom: 4px;">
            سيلبر كاترنج (CELEBRE CATERING) - شريك مؤسس لمناسباتك السعيدة ✨
          </div>
          <p style="margin: 0 0 8px 0; font-size: 10px; color: #6B5E55; line-height: 1.5;">
            جميع الأسعار بالجنيه المصري (سعر البيع المعلن للمستهلك شاملاً التعبئة والعصير). الحجز مبدئي مجاناً عبر الموقع أو عبر واتساب الإدارة: 
            <strong style="color: #221B17; font-size: 11px;">01284484868</strong>
          </p>
          <div style="font-size: 9px; color: #8C7D73; border-top: 1px solid #E8DFD1; padding-top: 6px;">
            © ${new Date().getFullYear()} CÉLÈBRE Catering Egypt. جميع الحقوق محفوظة | https://celebre-eg.com
          </div>
        </div>
      </div>
    `;

    const pagesData = [
      {
        html: page1Html,
        items: [],
        pageTitle: "غلاف منيو الكاترينج - سيليبر كاترنج",
      },
      {
        html: page2Html,
        items: mixPage1,
        pageTitle: "ميكس بوكس - العروض من Sale-01 إلى Sale-06",
      },
      {
        html: page3Html,
        items: mixPage2,
        pageTitle: "ميكس بوكس - العروض من Sale-07 إلى Sale-12",
      },
      {
        html: page4Html,
        items: sandwichList,
        pageTitle: "سندوتش بوكس - العروض من Sale-13 إلى Sale-18",
      },
    ];

    for (let pageIdx = 0; pageIdx < pagesData.length; pageIdx++) {
      const p = pagesData[pageIdx];

      if (onProgress) {
        onProgress(true, `جاري تنسيق الصفحة ${pageIdx + 1} من 4 (${p.pageTitle})...`);
      }

      container.innerHTML = p.html;

      const pageEl = container.firstElementChild as HTMLElement;

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF7F2",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      if (pageIdx > 0) {
        pdf.addPage();
      }

      // Add high-resolution visual layout
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      // Add Searchable & Selectable Text Layer (Invisible Mode '3 Tr' in PDF)
      try {
        (pdf.internal as any).write("3 Tr"); // Standard PDF operator: Neither fill nor stroke text (searchable/selectable)

        // Write page title for indexers
        const titleText = prepareRtlTextForPdf(p.pageTitle);
        pdf.text(titleText, 105, 15, { align: "center" });

        // Write each meal's exact details for indexing
        let yOffset = 30;
        for (const item of p.items) {
          const codeText = item.code;
          const nameText = prepareRtlTextForPdf(item.name);
          const priceText = `${item.distributorPrice} EGP`;
          const compText = prepareRtlTextForPdf(
            (item.components || []).map((c) => c.name).join(" - ")
          );

          pdf.text(`${codeText} ${priceText}`, 15, yOffset);
          if (nameText) {
            pdf.text(nameText, 105, yOffset, { align: "center" });
          }
          if (compText) {
            pdf.text(compText, 15, yOffset + 5);
          }
          yOffset += 12;
        }

        // On cover page, index key terms
        if (pageIdx === 0) {
          pdf.text("Celebre Catering - 01284484868 - celebre-eg.com", 105, 50, { align: "center" });
          pdf.text(prepareRtlTextForPdf("ميكس بوكس وسندوتش بوكس - 18 وجبة كاترنج معتمدة"), 105, 60, { align: "center" });
        }

        (pdf.internal as any).write("0 Tr"); // Reset back to normal fill mode
      } catch (e) {
        console.warn("Could not write searchable text layer for page", pageIdx + 1, e);
      }
    }

    pdf.save("Celebre-Menu.pdf");

    if (onProgress) {
      onProgress(false, "تم تنزيل المنيو المنظم بنجاح! 📄✨");
    }
  } catch (error: any) {
    console.error("Failed to generate structured PDF menu:", error);
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
