import { CateringPackage, MenuItemOption, PackagingOption, Testimonial, FAQItem } from '../types';

import heroImg from '../assets/images/celebre_hero_banner_1788037530778.jpg';
import brandedBoxImg from '../assets/images/celebre_branded_box_1788040428186.jpg';
import royalBoxImg from '../assets/images/celebre_mosque_katb_ketab_1789223553405.jpg';
import eventSetupImg from '../assets/images/celebre_event_setup_1788037572328.jpg';
import vipBoxImg from '../assets/images/celebre_catering_box_1789035352545.jpg';
import petitPainBoxImg from '../assets/images/celebre_petit_pain_box_1789035374258.jpg';
import frenchBoxImg from '../assets/images/celebre_french_sandwich_box_1789035424883.jpg';
import mosqueKatbKetabImg from '../assets/images/celebre_mosque_katb_ketab_1789223553405.jpg';

import meal1BoxImg from '../assets/images/celebre_box_meal1_1789211893922.jpg';
import meal2BoxImg from '../assets/images/celebre_box_meal2_1789211910273.jpg';
import meal3BoxImg from '../assets/images/celebre_box_meal3_1789211925289.jpg';
import meal4BoxImg from '../assets/images/celebre_box_meal4_fixed_1789213130863.jpg';
import meal5VipBoxImg from '../assets/images/celebre_box_meal5_1789211955221.jpg';
import meal6BoxImg from '../assets/images/celebre_box_meal6_gateau_1790210849069.jpg';
import meal7BoxImg from '../assets/images/celebre_box_meal7_sweets_1790210862618.jpg';
import meal8BoxImg from '../assets/images/celebre_box_meal8_pizza_1790210875027.jpg';
import meal9BoxImg from '../assets/images/celebre_box_meal9_mixed_1790210887702.jpg';
import meal10BoxImg from '../assets/images/celebre_box_meal10_sandwiches_1790210900853.jpg';
import meal11BoxImg from '../assets/images/celebre_box_meal11_combo_1790210924311.jpg';
import meal12BoxImg from '../assets/images/celebre_box_meal12_pate_1790210937774.jpg';

export const CATERING_PACKAGES: CateringPackage[] = [
  // --- Sale - 01 ---
  {
    id: 'pkg-sale-01',
    saleCode: 'Sale - 01',
    name: 'وجبة Sale - 01 (50 جنيه)',
    nameEn: 'Celebre Box Sale-01 (Petit Pain Roumi & Cordon Beef)',
    tagline: 'قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان لانشون كوردن بيف + عصير بخيرة وشوكة ومناديل',
    category: 'katb_ketab',
    pricePerBox: 50,
    originalPrice: 60,
    minOrder: 25,
    image: meal1BoxImg,
    badge: 'Sale - 01 ✨ 50 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب وعقد القران بالمساجد', 'المناسبات العائلية والأفراح', 'حفلات التخرج والاستقبالات'],
    description: 'عبوة سيلبر الرسمية Sale-01: قطعة جاتوه مغلفة فاخرة، سندوتش بتي بان جبنة رومي، سندوتش بتي بان لانشون كوردن بيف، عصير بخيرة، وشوكة ومناديل معقمة.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'سندوتش بتي بان جبنة رومي',
          'سندوتش بتي بان لانشون كوردن بيف',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 02 ---
  {
    id: 'pkg-sale-02',
    saleCode: 'Sale - 02',
    name: 'وجبة Sale - 02 (55 جنيه)',
    nameEn: 'Celebre Box Sale-02 (French Fresh Chicken Pane)',
    tagline: 'قطعة جاتوه مغلفة + سندوتش فرنساوى وسط فراخ بانية بلدي + عصير بخيرة وشوكة ومناديل',
    category: 'katb_ketab',
    pricePerBox: 55,
    originalPrice: 65,
    minOrder: 25,
    image: meal2BoxImg,
    badge: 'Sale - 02 🍗 55 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب والمساجد الكبرى', 'حفلات الخطوبة', 'الضيافة الخفيفة السريعة'],
    description: 'وجبة سيلبر الرسمية Sale-02: قطعة جاتوه مغلفة، سندوتش فرنساوى وسط محشو فراخ بانية بلدي مقرمشة ومتبلة، عصير بخيرة وشوكة ومناديل داخل العلبة المعتمدة.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'سندوتش فرنساوى وسط فراخ بانية بلدي',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 03 ---
  {
    id: 'pkg-sale-03',
    saleCode: 'Sale - 03',
    name: 'وجبة Sale - 03 (60 جنيه)',
    nameEn: 'Celebre Box Sale-03 (French Roumi & Smoked Turkey)',
    tagline: 'قطعة جاتوه مغلفة + سندوتش فرنساوى وسط جبنة رومي + سندوتش فرنساوى وسط تركي مدخن + عصير بخيرة وشوكة ومناديل',
    category: 'engagement_henna',
    pricePerBox: 60,
    originalPrice: 70,
    minOrder: 25,
    image: meal3BoxImg,
    badge: 'Sale - 03 🥪 60 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['حفلات الخطوبة وليالي الحنة', 'كتب الكتاب بالقاعات والمساجد', 'اجتماعات ومؤتمرات الشركات'],
    description: 'تشكيلة فرنسية متوازنة في عبوة Sale-03: قطعة جاتوه مغلفة، سندوتش فرنساوى وسط جبنة رومي، سندوتش فرنساوى وسط تركي مدخن، عصير بخيرة، وشوكة ومناديل.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'سندوتش فرنساوى وسط جبنة رومي',
          'سندوتش فرنساوى وسط تركي مدخن',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 04 ---
  {
    id: 'pkg-sale-04',
    saleCode: 'Sale - 04',
    name: 'وجبة Sale - 04 (65 جنيه)',
    nameEn: 'Celebre Box Sale-04 (Charcoal Kofta & Chicken Pane)',
    tagline: 'قطعة جاتوه مغلفة + سندوتش بتي بان كفتة مشوية ع الفحم + سندوتش بتي بان فراخ بانية بلدي + عصير بخيرة وشوكة ومناديل',
    category: 'wedding',
    pricePerBox: 65,
    originalPrice: 75,
    minOrder: 25,
    image: meal4BoxImg,
    badge: 'Sale - 04 🔥 الأكثر مبيعاً (65 ج)',
    isBestseller: true,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب ومسجد الشرطة وقاعات القوات المسلحة', 'حفلات الزفاف والخطوبة', 'العزومات والمناسبات الاجتماعية'],
    description: 'الوجبة الأكثر طلباً وإعجاباً Sale-04: قطعة جاتوه مغلفة، سندوتش بتي بان كفتة مشوية ع الفحم، سندوتش بتي بان فراخ بانية بلدي، عصير بخيرة، وشوكة ومناديل.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'سندوتش بتي بان كفتة مشوية ع الفحم',
          'سندوتش بتي بان فراخ بانية بلدي',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف بالمساجد والقاعات)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 05 ---
  {
    id: 'pkg-sale-05',
    saleCode: 'Sale - 05',
    name: 'وجبة Sale - 05 (80 جنيه)',
    nameEn: 'Celebre Box Sale-05 (VIP Charcoal Kofta & Chicken Pane French)',
    tagline: 'قطعة جاتوه مغلفة + سندوتش فرنساوى وسط كفتة مشوية + سندوتش فرنساوى وسط فراخ بانية + عصير بخيرة وشوكة ومناديل',
    category: 'vip_reception',
    pricePerBox: 80,
    originalPrice: 95,
    minOrder: 25,
    image: meal5VipBoxImg,
    badge: 'Sale - 05 👑 عرض VIP (80 ج)',
    isBestseller: true,
    isLuxury: true,
    recommendedFor: ['حفلات الزفاف الكبرى والأوبن إير', 'استقبال كبار الزوار VIP', 'أفراح الفيلات والفنادق الفاخرة'],
    description: 'عرض الـ VIP الاستثنائي Sale-05: قطعة جاتوه مغلفة، ساندوتش فرنساوى وسط كفتة مشوية، ساندوتش فرنساوى وسط فراخ بانية، عصير بخيرة وشوكة ومناديل داخل علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'سندوتش فرنساوى وسط كفتة مشوية',
          'سندوتش فرنساوى وسط فراخ بانية',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 06 ---
  {
    id: 'pkg-sale-06',
    saleCode: 'Sale - 06',
    name: 'وجبة Sale - 06 (35 جنيه)',
    nameEn: 'Celebre Box Sale-06 (Gateau & Juice)',
    tagline: 'قطعة جاتوه مغلفة + عصير بخيرة + شوكة ومناديل',
    category: 'katb_ketab',
    pricePerBox: 35,
    originalPrice: 42,
    minOrder: 25,
    image: meal6BoxImg,
    badge: 'Sale - 06 ☕ 35 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['الضيافة السريعة والخفيفة بالمساجد', 'حفلات التكريم والندوات', 'عقد القران الخفيف'],
    description: 'وجبة ضيافة خفيفة وأنيقة Sale-06: قطعة جاتوه مغلفة غنية بالكاكاو أو الفانيليا، مع عصير بخيرة طازج وشوكة ومناديل معقمة، بسعر اقتصادي ممتاز 35 ج.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 07 ---
  {
    id: 'pkg-sale-07',
    saleCode: 'Sale - 07',
    name: 'وجبة Sale - 07 (50 جنيه)',
    nameEn: 'Celebre Box Sale-07 (Gateau & 2 Oriental Sweets)',
    tagline: 'قطعة جاتوه مغلفة + 2 قطعة حلويات شرقي + عصير بخيرة + شوكة ومناديل',
    category: 'engagement_henna',
    pricePerBox: 50,
    originalPrice: 60,
    minOrder: 25,
    image: meal7BoxImg,
    badge: 'Sale - 07 🍯 50 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['ليالي الحنة والخطوبات', 'ضيافة عقد القران الحلوة', 'احتفالات العائلة والسبوع'],
    description: 'وجبة الحلويات المميزة Sale-07: قطعة جاتوه مغلفة فاخرة مع قطعتين من الحلويات الشرقية اللذيذة بالسمن البلدي وعصير بخيرة وشوكة ومناديل.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          '2 قطعة حلويات شرقي',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 08 ---
  {
    id: 'pkg-sale-08',
    saleCode: 'Sale - 08',
    name: 'وجبة Sale - 08 (45 جنيه)',
    nameEn: 'Celebre Box Sale-08 (Gateau, 2 Mini Pizza, 2 Baton Sale)',
    tagline: 'قطعة جاتوه مغلفة + 2 ق ميني بيتزا + 2 باتون سالية + عصير بخيرة + شوكة ومنديل',
    category: 'katb_ketab',
    pricePerBox: 45,
    originalPrice: 55,
    minOrder: 25,
    image: meal8BoxImg,
    badge: 'Sale - 08 🍕 45 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب والمساجد', 'حفلات التخرج والاستقبال', 'أعياد الميلاد والمناسبات'],
    description: 'تشكيلة المخبوزات والجاتوه الشهية Sale-08: قطعة جاتوه مغلفة، قطعتين ميني بيتزا غنية بالجبن، قطعتين باتون ساليه مقرمش بالكمون، وعصير بخيرة وشوكة ومنديل.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          '2 ق ميني بيتزا طازجة',
          '2 باتون سالية مقرمش',
          'عصير بخيرة + شوكة ومنديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 09 ---
  {
    id: 'pkg-sale-09',
    saleCode: 'Sale - 09',
    name: 'وجبة Sale - 09 (50 جنيه)',
    nameEn: 'Celebre Box Sale-09 (Gateau, 2 Mini Pizza, Oriental Sweet)',
    tagline: 'قطعة جاتوه مغلفة + 2 ق ميني بيتزا + قطعة حلوي شرقي + عصير بخيرة + شوكة ومنديل',
    category: 'engagement_henna',
    pricePerBox: 50,
    originalPrice: 60,
    minOrder: 25,
    image: meal9BoxImg,
    badge: 'Sale - 09 🍕 50 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['حفلات الخطوبة وعقد القران', 'المناسبات العائلية والأفراح', 'الضيافة المتنوعة'],
    description: 'مزيج الحادق والحلو المتكامل Sale-09: قطعة جاتوه مغلفة، قطعتين ميني بيتزا، قطعة حلوي شرقي بالسمن البلدي، وعصير بخيرة وشوكة ومنديل معقم.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          '2 ق ميني بيتزا شهية',
          'قطعة حلوي شرقي فاخرة',
          'عصير بخيرة + شوكة ومنديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 10 ---
  {
    id: 'pkg-sale-10',
    saleCode: 'Sale - 10',
    name: 'وجبة Sale - 10 (45 جنيه)',
    nameEn: 'Celebre Box Sale-10 (3 Petit Pain: Kofta, Roumi, Turkey/Pastrami)',
    tagline: 'سندوتش بتي بان كفتة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان تركي مدخن / بسطرمة + عصير بخيرة وشوكة ومناديل',
    category: 'wedding',
    pricePerBox: 45,
    originalPrice: 55,
    minOrder: 25,
    image: meal10BoxImg,
    badge: 'Sale - 10 🥪 3 ساندوتشات (45 ج)',
    isBestseller: true,
    isLuxury: false,
    recommendedFor: ['محبي الساندوتشات الحادقة', 'كتب الكتاب والمساجد', 'حفلات الشباب والرحلات'],
    description: 'وجبة الساندوتشات الغنية Sale-10: 3 ساندوتشات بتي بان مشبعة (سندوتش بتي بان كفتة مشوية، سندوتش بتي بان جبنة رومي، سندوتش بتي بان تركي مدخن أو بسطرمة)، مع عصير بخيرة وشوكة ومناديل.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'سندوتش بتي بان كفتة مشوية',
          'سندوتش بتي بان جبنة رومي',
          'سندوتش بتي بان تركي مدخن / بسطرمة',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 11 ---
  {
    id: 'pkg-sale-11',
    saleCode: 'Sale - 11',
    name: 'وجبة Sale - 11 (39 جنيه)',
    nameEn: 'Celebre Box Sale-11 (Gateau, Petit Pain, Baton Sale, Mini Pizza)',
    tagline: 'قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي / فيتا / بسطرمة + ق باتون سالية + ق ميني بيتزا + عصير بخيرة وشوكة ومناديل',
    category: 'katb_ketab',
    pricePerBox: 39,
    originalPrice: 48,
    minOrder: 25,
    image: meal11BoxImg,
    badge: 'Sale - 11 ⭐ 39 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب بالمساجد', 'حفلات التخرج والمؤتمرات', 'توزيعات المناسبات الاقتصادية الراقية'],
    description: 'تشكيلة متميزة بسعر مذهل Sale-11: قطعة جاتوه مغلفة، سندوتش بتي بان (جبنة رومي / فيتا / بسطرمة)، قطعة باتون ساليه، قطعة ميني بيتزا، عصير بخيرة وشوكة ومناديل.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'سندوتش بتي بان جبنة رومي / فيتا / بسطرمة',
          'ق باتون سالية + ق ميني بيتزا',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // --- Sale - 12 ---
  {
    id: 'pkg-sale-12',
    saleCode: 'Sale - 12',
    name: 'وجبة Sale - 12 (44 جنيه)',
    nameEn: 'Celebre Box Sale-12 (Gateau & Flavored Butter Pate)',
    tagline: 'قطعة جاتوه مغلفة + باتية زبدة نكهات مختلفة + عصير بخيرة + شوكة ومناديل',
    category: 'katb_ketab',
    pricePerBox: 44,
    originalPrice: 52,
    minOrder: 25,
    image: meal12BoxImg,
    badge: 'Sale - 12 🥐 44 ج',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['الصباحيات وحفلات كتب الكتاب', 'استقبالات الصالونات والمعارض', 'المناسبات العائلية'],
    description: 'وجبة المخبوزات والجاتوه الفرنسية Sale-12: قطعة جاتوه مغلفة، باتيه بالزبدة الطبيعية بنكهات مختلفة غنية، عصير بخيرة، وشوكة ومناديل.',
    sections: [
      {
        title: 'محتويات الوجبة بالعلبة',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'باتية زبدة نكهات مختلفة',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    }
  },

  // Backwards compatibility mappings for older ID references
  {
    id: 'pkg-meal-1',
    saleCode: 'Sale - 01',
    name: 'وجبة Sale - 01 (50 جنيه)',
    nameEn: 'Celebre Box Sale-01',
    tagline: 'قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان لانشون كوردن بيف + عصير بخيرة وشوكة ومناديل',
    category: 'katb_ketab',
    pricePerBox: 50,
    originalPrice: 60,
    minOrder: 25,
    image: meal1BoxImg,
    badge: 'Sale - 01 ✨ 50 ج',
    sections: [
      {
        title: 'المحتويات',
        items: ['قطعة جاتوه مغلفة', 'سندوتش بتي بان جبنة رومي', 'سندوتش بتي بان لانشون كوردن بيف', 'عصير بخيرة + شوكة ومناديل']
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)',
      includesCard: true,
      includesCutlery: true
    },
    recommendedFor: ['كتب الكتاب بالمساجد'],
    description: 'وجبة سيلبر الرسمية Sale-01'
  },
  {
    id: 'pkg-meal-2',
    saleCode: 'Sale - 02',
    name: 'وجبة Sale - 02 (55 جنيه)',
    nameEn: 'Celebre Box Sale-02',
    tagline: 'قطعة جاتوه مغلفة + سندوتش فرنساوى وسط فراخ بانية بلدي + عصير بخيرة وشوكة ومناديل',
    category: 'katb_ketab',
    pricePerBox: 55,
    originalPrice: 65,
    minOrder: 25,
    image: meal2BoxImg,
    badge: 'Sale - 02 🍗 55 ج',
    sections: [
      {
        title: 'المحتويات',
        items: ['قطعة جاتوه مغلفة', 'سندوتش فرنساوى وسط فراخ بانية بلدي', 'عصير بخيرة + شوكة ومناديل']
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة',
      includesCard: true,
      includesCutlery: true
    },
    recommendedFor: ['كتب الكتاب والخطوبة'],
    description: 'وجبة سيلبر الرسمية Sale-02'
  },
  {
    id: 'pkg-meal-3',
    saleCode: 'Sale - 03',
    name: 'وجبة Sale - 03 (60 جنيه)',
    nameEn: 'Celebre Box Sale-03',
    tagline: 'قطعة جاتوه مغلفة + سندوتش فرنساوى وسط جبنة رومي + سندوتش فرنساوى وسط تركي مدخن + عصير بخيرة وشوكة ومناديل',
    category: 'engagement_henna',
    pricePerBox: 60,
    originalPrice: 70,
    minOrder: 25,
    image: meal3BoxImg,
    badge: 'Sale - 03 🥪 60 ج',
    sections: [
      {
        title: 'المحتويات',
        items: ['قطعة جاتوه مغلفة', 'سندوتش فرنساوى وسط جبنة رومي', 'سندوتش فرنساوى وسط تركي مدخن', 'عصير بخيرة + شوكة ومناديل']
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة',
      includesCard: true,
      includesCutlery: true
    },
    recommendedFor: ['الخطوبة والحنة'],
    description: 'وجبة سيلبر الرسمية Sale-03'
  },
  {
    id: 'pkg-meal-4',
    saleCode: 'Sale - 04',
    name: 'وجبة Sale - 04 (65 جنيه)',
    nameEn: 'Celebre Box Sale-04',
    tagline: 'قطعة جاتوه مغلفة + سندوتش بتي بان كفتة مشوية ع الفحم + سندوتش بتي بان فراخ بانية بلدي + عصير بخيرة وشوكة ومناديل',
    category: 'wedding',
    pricePerBox: 65,
    originalPrice: 75,
    minOrder: 25,
    image: meal4BoxImg,
    badge: 'Sale - 04 🔥 الأكثر مبيعاً (65 ج)',
    isBestseller: true,
    sections: [
      {
        title: 'المحتويات',
        items: ['قطعة جاتوه مغلفة', 'سندوتش بتي بان كفتة مشوية ع الفحم', 'سندوتش بتي بان فراخ بانية بلدي', 'عصير بخيرة + شوكة ومناديل']
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة',
      includesCard: true,
      includesCutlery: true
    },
    recommendedFor: ['كتب الكتاب والأفراح'],
    description: 'وجبة سيلبر الرسمية Sale-04'
  },
  {
    id: 'pkg-meal-5',
    saleCode: 'Sale - 05',
    name: 'وجبة Sale - 05 (80 جنيه)',
    nameEn: 'Celebre Box Sale-05',
    tagline: 'قطعة جاتوه مغلفة + سندوتش فرنساوى وسط كفتة مشوية + سندوتش فرنساوى وسط فراخ بانية + عصير بخيرة وشوكة ومناديل',
    category: 'vip_reception',
    pricePerBox: 80,
    originalPrice: 95,
    minOrder: 25,
    image: meal5VipBoxImg,
    badge: 'Sale - 05 👑 عرض VIP (80 ج)',
    isBestseller: true,
    isLuxury: true,
    sections: [
      {
        title: 'المحتويات',
        items: ['قطعة جاتوه مغلفة', 'سندوتش فرنساوى وسط كفتة مشوية', 'سندوتش فرنساوى وسط فراخ بانية', 'عصير بخيرة + شوكة ومناديل']
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة',
      includesCard: true,
      includesCutlery: true
    },
    recommendedFor: ['أفراح VIP والفنادق'],
    description: 'وجبة سيلبر الرسمية Sale-05'
  },
  {
    id: 'pkg-katb-ketab-royal',
    saleCode: 'Sale - 04',
    name: 'باقة كتب الكتاب الملكية (Sale - 04 ميكس فحم وبانية)',
    nameEn: 'Royal Katb Ketab Box (Sale-04)',
    tagline: 'الخيار الأكثر طلباً لمساجد وقاعات عقد القران في بني سويف وشرق النيل',
    category: 'katb_ketab',
    pricePerBox: 65,
    originalPrice: 75,
    minOrder: 25,
    image: meal4BoxImg,
    badge: 'Sale - 04 🔥 الأكثر مبيعاً (65 ج)',
    isBestseller: true,
    isLuxury: false,
    recommendedFor: ['كتب كتاب بالمساجد والقاعات', 'حفلات عقد القران العائلية', 'مراسم الخطوبة الرسمية'],
    description: 'ساندوتش بتي بان كفتة مشوية ع الفحم + ساندوتش بتي بان فراخ بانية بلدي + قطعة جاتوه مغلفة + عصير بخيرة وشوكة ومناديل.',
    sections: [
      {
        title: 'محتويات العلبة',
        items: [
          'قطعة جاتوه مغلفة',
          'سندوتش بتي بان كفتة مشوية ع الفحم',
          'سندوتش بتي بان فراخ بانية بلدي',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم بدون أشرطة لسرعة وسهولة التوزيع',
      includesCard: true,
      includesCutlery: true
    }
  },
  {
    id: 'pkg-diamond-wedding',
    saleCode: 'Sale - 05',
    name: 'باقة الزفاف والخطوبة الفاخرة (عرض VIP - Sale - 05)',
    nameEn: 'Diamond Wedding VIP Box (Sale-05)',
    tagline: 'تجربة طعام فندقية: ساندوتشين فرنساوي كفتة مشوية وبانية مع جاتوه وعصير وتغليف VIP',
    category: 'wedding',
    pricePerBox: 80,
    originalPrice: 95,
    minOrder: 25,
    image: meal5VipBoxImg,
    badge: 'Sale - 05 👑 باقة الـ VIP (80 ج)',
    isLuxury: true,
    isBestseller: true,
    recommendedFor: ['حفلات الزفاف الكبرى', 'أفراح الفيلات والأوبن إير', 'حفلات الخطوبة الفاخرة'],
    description: 'ساندوتش فرنساوى وسط كفتة مشوية ع الفحم + ساندوتش فرنساوى وسط فراخ بانية + قطعة جاتوه مغلفة + عصير بخيرة وشوكة ومناديل وتغليف ملوكي.',
    sections: [
      {
        title: 'محتويات العلبة VIP',
        items: [
          'قطعة جاتوه مغلفة فاخرة',
          'سندوتش فرنساوى وسط كفتة مشوية',
          'سندوتش فرنساوى وسط فراخ بانية',
          'عصير بخيرة + شوكة ومناديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
      ribbon: 'غلق ذاتي محكم فاخر بدون أشرطة',
      includesCard: true,
      includesCutlery: true
    }
  }
];

export const MENU_ITEMS_CUSTOMIZER: MenuItemOption[] = [
  // Official Menu Sandwiches & Meats
  {
    id: 'item-french-pane',
    name: 'سندوتش فرنساوى وسط فراخ بانية بلدي',
    category: 'meats_skewers',
    categoryLabel: 'ساندوتشات المنيو الرسمية واللحوم',
    priceDelta: 25,
    description: 'ساندوتش فرنساوى وسط محشو قطع فراخ بانية بلدي كرسبي متبلة بعناية',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'item-french-kofta',
    name: 'سندوتش فرنساوى وسط كفتة مشوية ع الفحم',
    category: 'meats_skewers',
    categoryLabel: 'ساندوتشات المنيو الرسمية واللحوم',
    priceDelta: 28,
    description: 'ساندوتش فرنساوى وسط محشو كفتة بلدي مشوية على الفحم برائحة الشواء',
    badge: 'عرض VIP 👑'
  },
  {
    id: 'item-petit-kofta',
    name: 'سندوتش بتي بان كفتة مشوية ع الفحم',
    category: 'meats_skewers',
    categoryLabel: 'ساندوتشات المنيو الرسمية واللحوم',
    priceDelta: 20,
    description: 'سندوتش بتي بان كفتة بلدي مشوية على الفحم ساخنة وشهية'
  },
  {
    id: 'item-petit-pane',
    name: 'سندوتش بتي بان فراخ بانية بلدي',
    category: 'meats_skewers',
    categoryLabel: 'ساندوتشات المنيو الرسمية واللحوم',
    priceDelta: 18,
    description: 'سندوتش بتي بان فراخ بانية مقرمشة ومتبلة بخلطة سيلبر'
  },
  {
    id: 'item-french-roumi',
    name: 'سندوتش فرنساوى وسط جبنة رومي',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات وساندوتشات الجبن',
    priceDelta: 16,
    description: 'ساندوتش فرنساوى وسط محشو بشرائح الجبنة الرومي المصرية الفاخرة'
  },
  {
    id: 'item-french-turkey',
    name: 'سندوتش فرنساوى وسط تركي مدخن',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات وساندوتشات الجبن',
    priceDelta: 20,
    description: 'ساندوتش فرنساوى وسط محشو بشرائح صدر تركي مدخن عالي الجودة'
  },
  {
    id: 'item-petit-roumi',
    name: 'سندوتش بتي بان جبنة رومي',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات وساندوتشات الجبن',
    priceDelta: 12,
    description: 'سندوتش بتي بان طازج محشو جبنة رومي قديمة ممتازة'
  },
  {
    id: 'item-petit-beef',
    name: 'سندوتش بتي بان لانشون كوردن بيف',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات وساندوتشات الجبن',
    priceDelta: 12,
    description: 'سندوتش بتي بان محشو لانشون كوردن بيف كلاسيكي شهي'
  },
  {
    id: 'item-cordon-bleu',
    name: 'ميني ساندوتش كوردن بلو مقرمش',
    category: 'meats_skewers',
    categoryLabel: 'ساندوتشات المنيو الرسمية واللحوم',
    priceDelta: 28,
    description: 'صدور دجاج متبلة محشوة جبن مدخن وتركي مع صوص الشيدر الساخن',
    badge: 'مفضل'
  },
  {
    id: 'item-shish-tawook',
    name: 'ميني ساندوتش شيش طاووق تركي',
    category: 'meats_skewers',
    categoryLabel: 'اللحوم والدواجن والسلايدرز',
    priceDelta: 26,
    description: 'قطع أوراك دجاج مشوية على الفحم مع خبز التورتيلا والصوص الخاص'
  },
  {
    id: 'item-angus-slider',
    name: 'ميني بيف سلايدر أنجوس مدخن',
    category: 'meats_skewers',
    categoryLabel: 'اللحوم والدواجن والسلايدرز',
    priceDelta: 32,
    description: 'لحم بقري أنجوس طازج مع شيدر وبصل مكرمل وصوص الباربيكيو',
    badge: 'VIP'
  },
  {
    id: 'item-kofta-skewer',
    name: 'سيخ كفتة مشوية على الفحم بلدي',
    category: 'meats_skewers',
    categoryLabel: 'اللحوم والدواجن والسلايدرز',
    priceDelta: 24,
    description: 'لحم بلدي متبل على الطريقة الشرقية مع خبز بلدي صغير وطحينة'
  },
  {
    id: 'item-shawarma-saj',
    name: 'ميني شاورما دجاج في خبز صاج',
    category: 'meats_skewers',
    categoryLabel: 'اللحوم والدواجن والسلايدرز',
    priceDelta: 22,
    description: 'شاورما بالخلطة السورية مع خيار مخلل وثومية خفيفة'
  },
  {
    id: 'item-popcorn-chicken',
    name: 'كوب بوب كورن دجاج كرسبي مع صوص الكوكتيل',
    category: 'meats_skewers',
    categoryLabel: 'اللحوم والدواجن والسلايدرز',
    priceDelta: 20,
    description: 'قطع دجاج مقرمشة ذهبية مع صوص كوكتيل في عبوة صغيرة منفصلة'
  },

  // Savory Pastry & Finger Foods
  {
    id: 'item-sambousak-mix',
    name: 'سمبوسك مكس (جبن كيري ونعناع + لحم بلدي)',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات والمخبوزات السواريه',
    priceDelta: 16,
    description: 'قطعتين مقرمشتين ذهبيتين بحشوة الجبن الكريمي واللحم المتبل'
  },
  {
    id: 'item-kobeba-shami',
    name: 'كبيبة شامي باللحم البلدي والمكسرات',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات والمخبوزات السواريه',
    priceDelta: 18,
    description: 'كبيبة برغل مقرمشة محشوة باللحمة المفرومة والصنوبر'
  },
  {
    id: 'item-mini-pizza-official',
    name: '2 ق ميني بيتزا طازجة',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات والمخبوزات السواريه',
    priceDelta: 12,
    description: 'قطعتين ميني بيتزا طازجة بالجبن والصلصة والزيتون',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'item-baton-sale-official',
    name: '2 باتون سالية مقرمش بالكمون والسمسم',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات والمخبوزات السواريه',
    priceDelta: 8,
    description: 'أصابع باتون ساليه هشة ومقرمشة ومتبلة بحبات الكمون والسمسم',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'item-butter-pate-official',
    name: 'باتية زبدة نكهات مختلفة (طازج)',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات والمخبوزات السواريه',
    priceDelta: 12,
    description: 'مخبوزات باتيه بالزبدة الطبيعية بنكهات الجبن الرومي أو الفيتا الغنية',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'item-oriental-sweets-official',
    name: 'قطعتين حلويات شرقي فاخرة بالسمن البلدي',
    category: 'french_pastry',
    categoryLabel: 'الحلويات الشرقية والغربية',
    priceDelta: 14,
    description: 'تشكيلة شرقية فاخرة (بسبوسة بالمكسرات، كنافة أساور)',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'item-petit-turkey-pastrami',
    name: 'سندوتش بتي بان تركي مدخن / بسطرمة',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات وساندوتشات الجبن',
    priceDelta: 14,
    description: 'سندوتش بتي بان طازج محشو بشرائح تركي مدخن أو بسطرمة بلدي',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'item-mini-pizza',
    name: 'ميني بيتزا إيطالية بالمارجريتا والمشروم',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات والمخبوزات السواريه',
    priceDelta: 14,
    description: 'عجينة بيتزا هشة بصلصة الطماطم الإيطالية والموزاريلا الطبيعية'
  },
  {
    id: 'item-mini-patisserie-croissant',
    name: 'ميني كرواسون بالتركي المدخن وشيدر',
    category: 'savory_pastry',
    categoryLabel: 'المعجنات والمخبوزات السواريه',
    priceDelta: 18,
    description: 'كرواسون فرنسي بالزبدة الطبيعية محشو شرائح التركي المدخن'
  },
  {
    id: 'item-vine-leaves',
    name: 'أصابع ورق عنب بدبس الرمان (3 قطع)',
    category: 'salads_appetizers',
    categoryLabel: 'المقبلات والكانابيهات',
    priceDelta: 16,
    description: 'ورق عنب بلدي طازج مطهو بزيت الزيتون ودبس الرمان والليمون'
  },
  {
    id: 'item-canapes-salmon',
    name: 'كانابيه سلمون نرويجي مدخن فاخر',
    category: 'salads_appetizers',
    categoryLabel: 'المقبلات والكانابيهات',
    priceDelta: 26,
    description: 'سلمون مدخن عالي الجودة مع جبنة فيلادلفيا وكابري على توست متبل',
    badge: 'VIP'
  },

  // Sweets & Desserts
  {
    id: 'item-gateau-wrapped',
    name: 'قطعة جاتوة فاخرة مغلفة (سيلبر)',
    category: 'french_pastry',
    categoryLabel: 'الحلويات الشرقية والغربية',
    priceDelta: 14,
    description: 'قطعة جاتوة شوكولاتة أو فانيليا بطبقات غنية مغلفة فردياً ومعقمة',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'item-mini-eclair',
    name: 'ميني إكلير شوكولاتة فاخرة',
    category: 'french_pastry',
    categoryLabel: 'الجاتوة والحلويات المخصصة',
    priceDelta: 16,
    description: 'إكلير فرنسي بحشوة كريم باتيسيير الغنية وجناش شوكولاتة داكنة'
  },
  {
    id: 'item-fruit-tart',
    name: 'ميني تارت فواكه الموسم الطازجة',
    category: 'french_pastry',
    categoryLabel: 'الجاتوة والحلويات المخصصة',
    priceDelta: 15,
    description: 'قاعدة بسكويت مقرمشة مع كريمة فانيليا وقطع كيوي وفراولة ومانجو'
  },
  {
    id: 'item-custom-cookie',
    name: 'كوكيز التهنئة المخصص باسم العروسين / المولود',
    category: 'french_pastry',
    categoryLabel: 'الجاتوة والحلويات المخصصة',
    priceDelta: 18,
    description: 'قطعة كوكيز سكر زبدة مصممة ومطبوعة بأشكال المناسبة'
  },

  // Drinks
  {
    id: 'drink-bikhairah',
    name: 'عصير بخيرة مع شوكة ومنديل معقم',
    category: 'drinks_water',
    categoryLabel: 'المشروبات والمياه',
    priceDelta: 10,
    description: 'باكت عصير بخيرة (جوافة / مانجو) مع كيس شوكة ومنديل عالي الجودة',
    badge: 'المنيو الرسمي ⭐'
  },
  {
    id: 'drink-mango-fresh',
    name: 'عصير مانجو طبيعي 100% بدون سكر مضاف (250 مل)',
    category: 'drinks_water',
    categoryLabel: 'المشروبات والمياه',
    priceDelta: 18,
    description: 'عصير مانجو فريش معصور يوم الحفل بدون مواد حافظة'
  },
  {
    id: 'drink-guava-fresh',
    name: 'عصير جوافة بالنعناع فريش (250 مل)',
    category: 'drinks_water',
    categoryLabel: 'المشروبات والمياه',
    priceDelta: 16,
    description: 'جوافة طازجة مع لمسة نعناع منعشة'
  },
  {
    id: 'drink-orange-fresh',
    name: 'عصير برتقال طبيعي معصور طازج (250 مل)',
    category: 'drinks_water',
    categoryLabel: 'المشروبات والمياه',
    priceDelta: 16,
    description: 'برتقال بلدي سكري معصور طازج'
  },
  {
    id: 'drink-mineral-water',
    name: 'زجاجة مياه معدنية نقية (330 مل)',
    category: 'drinks_water',
    categoryLabel: 'المشروبات والمياه',
    priceDelta: 6,
    description: 'مياه معدنية معقمة وباردة'
  }
];

export const PACKAGING_OPTIONS: PackagingOption[] = [
  {
    id: 'pack-official-gold',
    name: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي',
    description: 'علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي مع غلق محكم بدون أشرطة لسرعة التوزيع والنظافة لجميع الوجبات',
    priceExtra: 0,
    color: '#5C1027',
    texture: 'كرتون مقوى مذهب ونبيتي',
    ribbonColor: 'بدون أشرطة (قفل محكم)'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    author: 'م. أحمد & نورهان الشناوي',
    role: 'عقد قران بمسجد عمر بن عبد العزيز - مدينة بني سويف',
    occasion: 'كتب كتاب (150 عبوة)',
    eventDate: 'سبتمبر 2026',
    rating: 5,
    comment: 'بجد سيلبر شرفونا قدام كل المعازيم في بني سويف! البوكس شكله راقي جداً والساندوتشات وصلت طازة ومحكمة الغلق، والتوزيع كان سريع ومنظم جداً بالمسجد. شكراً لفريق Celebre المحترف.',
    verified: true,
    avatarText: 'أن'
  },
  {
    id: 't-2',
    author: 'د. سارة المنشاوي',
    role: 'حفل خطوبة بقاعة على النيل - بني سويف شرق النيل',
    occasion: 'حفل خطوبة (90 عبوة)',
    eventDate: 'أغسطس 2026',
    rating: 5,
    comment: 'أول مرة أتعامل مع كاترنج دقيق في المواعيد بالشكل ده في شرق النيل! التوصيل كان قبل الميعاد بنصف ساعة، التغليف محكم ونظيف جداً، والوجبات عجبت كل الضيوف. رقم 1 في بني سويف بلا منازع.',
    verified: true,
    avatarText: 'سم'
  },
  {
    id: 't-3',
    author: 'أ. محمود عبد الرحمن',
    role: 'منظم مناسبات وأفراح ببني سويف (Wedding Planner)',
    occasion: 'فرح بقاعة الماسة (220 عبوة)',
    eventDate: 'أغسطس 2026',
    rating: 5,
    comment: 'كـ Wedding Planner يهمني الجودة والتنسيق؛ عبوات سيلبر سهلت علينا خدمة المعازيم بشكل منظم وشيك جداً بدون أي فوضى أو تأخير في بني سويف. الطعم ممتاز والخامات عالية جداً.',
    verified: true,
    avatarText: 'مع'
  },
  {
    id: 't-4',
    author: 'مها الصاوي',
    role: 'عقيقة وسبوع في بني سويف الجديدة',
    occasion: 'سبوع وعقيقة (75 عبوة)',
    eventDate: 'يوليو 2026',
    rating: 5,
    comment: 'بوكس الضيافة كان يجنن! المعجنات والحلويات كانت تحفة وطازجة جداً. الناس كلها سألتني عن سيلبر والرقم المطبوع على العلبة. تسلم إيديكم.',
    verified: true,
    avatarText: 'مص'
  }
];

export const FAQS: FAQItem[] = [
  {
    question: 'ما هو الحد الأدنى للطلب وكيف يتم الحجز؟',
    answer: 'الحد الأدنى للطلب يبدأ من 25 إلى 30 عبوة حسب نوع الباقة. يمكنكم الحجز مباشرة عبر الموقع أو من خلال التواصل عبر الواتساب على رقمنا الموحد 01284484868 لتأكيد التفاصيل وموعد المناسبة.',
    category: 'الطلبات والحجز'
  },
  {
    question: 'قبل موعد المناسبة بكام يوم لازم أأكد الأوردر؟',
    answer: 'يُفضل تأكيد الحجز قبل المناسبة بـ 3 إلى 7 أيام على الأقل لضمان التجهيز وحجز موعد التوصيل، وفي حالات الطوارئ وكتب الكتاب السريع يمكننا التجهيز خلال 48 ساعة حسب الإمكانية.',
    category: 'الطلبات والحجز'
  },
  {
    question: 'كيف يتم تقديم وتغليف العبوات؟',
    answer: 'تأتي وجبات سيلبر داخل علبة سيلبر الكرتون الفاخرة باللون الذهبي والنبيتي، وبأعلى معايير الأناقة والنظافة المحكمة الجاهزة للتقديم المباشر لضيوفكم، مع غلق ذاتي محكم وبدون أشرطة حرصاً على التقديم السريع والعملي والمنظم والمعقم داخل المساجد والقاعات.',
    category: 'التخصيص والتغليف'
  },
  {
    question: 'كيف تصل العبوات وما هي طريقة الحفاظ على السخونة؟',
    answer: 'نقوم بتوصيل الطلبات في سيارات مجهزة وحقائب حرارية مخصصة (Thermal Catering Bags) تضمن وصول المخبوزات والمقبلات الساخنة طازجة ومقرمشة ووصول العصائر والمياه باردة ومنعشة.',
    category: 'التوصيل والجودة'
  },
  {
    question: 'ما هي المناطق التي يغطيها توصيل Celebre حالياً؟',
    answer: 'مناطق التغطية والتوصيل مخصصة حصرياً لـ (مدينة بني سويف، وشرق النيل ببني سويف فقط)، ولا تشمل قرى ومراكز بني سويف أو محافظة الفيوم، لضمان سرعة الوصول وأعلى درجات الطزاجة لضيوفكم.',
    category: 'التوصيل والجودة'
  },
  {
    question: 'ما هي طرق الدفع المتاحة؟',
    answer: 'نوفر الدفع عبر إنستاباي (InstaPay)، التحويل البنكي (البنك الأهلي / CIB)، أو سداد دفعة مقدمة (عربون) كاش بالفرع واستكمال المبلغ عند الاستلام، ولا نتعامل بالمحافظ الإلكترونية.',
    category: 'الدفع والأسعار'
  },
  {
    question: 'هل يمكن إرجاع أو إلغاء الأوردر بعد تأكيده؟',
    answer: 'لا يمكن إرجاع أو إلغاء الأوردر نهائياً بعد بدء العمل عليه؛ لأن المصنع والمطبخ المركزي يقوم بإنتاج وتجهيز وطهي الوجبات وإعداد العبوات الفاخرة خصيصاً وفورياً لكل عميل بناءً على موعد مناسبته، وبما يتطابق مع معايير السلامة الغذائية.',
    category: 'سياسة التعاقد والخصوصية'
  },
  {
    question: 'متى يبدأ المصنع في تحريك وتجهيز الطلب؟',
    answer: 'لا يتم تحريك الطلب أو إدراجه بجدول التشغيل بالمصنع إلا بعد دفع 50% من قيمة التعاقد كعربون تأكيد رسمي لتثبيت موعد المناسبة وحجز خط الإنتاج، ويتم سداد الـ 50% المتبقية عند الاستلام.',
    category: 'سياسة التعاقد والخصوصية'
  },
  {
    question: 'هل الشحن مشمول في سعر العرض المعلن؟ ومتى يكون الشحن مجانياً؟',
    answer: 'الشحن والتوصيل غير مشمول في سعر العرض المعلن للباقات بالموقع. والطلبات فقط التي تزيد عن 500 عبوة/طلب هي التي تستحق وتستفيد من الشحن المجاني بالكامل، وذلك حصرياً داخل نطاق (مدينة بني سويف وشرق النيل ببني سويف فقط)، ولا يشمل قرى أو مراكز بني سويف أو محافظة الفيوم.',
    category: 'التوصيل والشحن'
  }
];

export const GOVERNORATES = [
  'بني سويف - مدينة بني سويف',
  'بني سويف - شرق النيل'
];
