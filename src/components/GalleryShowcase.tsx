import React from "react";
import mosqueImg from "../assets/images/celebre_mosque_katb_ketab_1789223553405.jpg";
import boxImg from "../assets/images/celebre_branded_box_1788040428186.jpg";
import setupImg from "../assets/images/celebre_event_setup_1788037572328.jpg";
import heroImg from "../assets/images/celebre_hero_banner_1788037530778.jpg";

export const GalleryShowcase: React.FC = () => {
  const images = [
    {
      src: mosqueImg,
      title: "توزيع كتب الكتاب بالمساجد الكبرى",
      desc: "توزيع فوري منظم ونظيف بالمسجد بدون أي هدر أو تأخير"
    },
    {
      src: boxImg,
      title: "العلبة الكرتونية المذهبة الرسمية",
      desc: "تصميم ملكي فاخر باللونين الذهبي والنبيتي مع غلق ذاتي محكم"
    },
    {
      src: setupImg,
      title: "تجهيز حفلات واستقبالات القاعات",
      desc: "طاقة استيعابية مفتوحة وتوصيل مبرد يحافظ على نضارة وسخونة الوجبات"
    },
    {
      src: heroImg,
      title: "تشكيلة ساندوتشات بتي بان وفرنساوي طازجة",
      desc: "كفتة ع الفحم، بانيه بلدي مقرمش، رومي، مع قطع الجاتوه المغلفة"
    }
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-y border-[#E8DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#C89B3C] bg-[#F4EEDB] px-3.5 py-1.5 rounded-full inline-block mb-3">
            معرض التوزيع الحي • تصوير واقعي
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#221B17]">
            شاهد عبوات سيلبر في قلب المناسبات
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6E65] mt-2">
            دقة في التغليف، نظافة متناهية، وسرعة فائقة في التوزيع تليق بأهم أيام حياتك.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {images.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E8DFD1] bg-[#FAF7F2]"
            >
              <div className="h-60 overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <h4 className="font-bold text-sm text-[#221B17]">{item.title}</h4>
                <p className="text-xs text-[#7A6E65] mt-1 line-clamp-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
