import { CateringPackage, MenuItemOption, PackagingOption, Testimonial, FAQItem } from '../types';

import heroImg from '../assets/images/celebre_hero_banner_1788037530778.jpg';
import brandedBoxImg from '../assets/images/celebre_branded_box_1788040428186.jpg';
import royalBoxImg from '../assets/images/celebre_royal_box_1788037545297.jpg';
import sweetBoxImg from '../assets/images/celebre_sweet_box_1788037558417.jpg';
import eventSetupImg from '../assets/images/celebre_event_setup_1788037572328.jpg';
import vipBoxImg from '../assets/images/celebre_catering_box_1789035352545.jpg';
import petitPainBoxImg from '../assets/images/celebre_petit_pain_box_1789035374258.jpg';
import frenchBoxImg from '../assets/images/celebre_french_sandwich_box_1789035424883.jpg';
import chocolateBoxImg from '../assets/images/celebre_custom_chocolate_box_1789036264927.jpg';

export const CATERING_PACKAGES: CateringPackage[] = [
  {
    id: 'pkg-meal-1',
    name: 'الوجبة الأولى (50 جنيه)',
    nameEn: 'Celebre Box 1 (Petit Pain Roumi & Cordon Beef)',
    tagline: 'قطعة جاتوة مغلفة + ساندوتش بتي بان جبنة رومي + ساندوتش بتي بان لانشون كوردن بيف + عصير بخيرة وشوكة ومنديل',
    category: 'katb_ketab',
    pricePerBox: 50,
    originalPrice: 60,
    minOrder: 25,
    image: petitPainBoxImg,
    badge: '50 جنيه ✨ اقتصادي مميز',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب وعقد القران بالمساجد', 'المناسبات العائلية والأفراح', 'حفلات التخرج والاستقبالات'],
    description: 'عبوة سيلبر الأنيقة المميزة: ساندوتش بتي بان جبنة رومي، ساندوتش بتي بان لانشون كوردن بيف فاخر، قطعة جاتوة مغلفة، عصير بخيرة، وشوكة ومنديل معقم داخل كيس مغلق.',
    sections: [
      {
        title: 'الساندوتشات والمخبوزات',
        items: [
          'سندوتش بتي بان طازج محشو جبنة رومي فاخرة',
          'سندوتش بتي بان لانشون كوردن بيف ممتاز'
        ]
      },
      {
        title: 'الحلو والمشروب',
        items: [
          'قطعة جاتوة مغلفة فاخرة',
          'عصير بخيرة (جوافة / مانجو)'
        ]
      },
      {
        title: 'المرفقات والخدمة',
        items: [
          'شوكة ومنديل معقم في غلاف منفصل',
          'علبة سيلبر الأنيقة بباركود وتصميم راقي'
        ]
      }
    ],
    packaging: {
      type: 'صندوق سيلبر الكرتوني المطبوع بشعار المناسبات مع غلق محكم',
      ribbon: 'شريط ستان ذهبي أنيق مع كارت إهداء',
      includesCard: true,
      includesCutlery: true
    }
  },
  {
    id: 'pkg-meal-2',
    name: 'الوجبة الثانية (55 جنيه)',
    nameEn: 'Celebre Box 2 (French Fresh Chicken Pane)',
    tagline: 'قطعة جاتوة مغلفة + ساندوتش فرنساوى وسط فراخ بانية بلدي + عصير بخيرة وشوكة ومنديل',
    category: 'katb_ketab',
    pricePerBox: 55,
    originalPrice: 65,
    minOrder: 25,
    image: frenchBoxImg,
    badge: '55 جنيه 🍗 فراخ بانية بلدي',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب والمساجد الكبرى', 'حفلات الخطوبة', 'الضيافة الخفيفة السريعة'],
    description: 'وجبة ساندوتش البانية البلدي الفرنسي المحبوب: ساندوتش فرنساوى وسط محشو بانية مقرمش متبل بعناية، مع قطعة جاتوة مغلفة وعصير بخيرة وشوكة ومنديل.',
    sections: [
      {
        title: 'الساندوتش الرئيسي',
        items: [
          'سندوتش فرنساوى وسط فراخ بانية بلدي مقرمشة ومتبلة'
        ]
      },
      {
        title: 'الحلو والمشروب',
        items: [
          'قطعة جاتوة شوكولاتة / فانيليا مغلفة فاخرة',
          'عصير بخيرة جوافة طازج'
        ]
      },
      {
        title: 'المرفقات والخدمة',
        items: [
          'شوكة ومنديل معقم ومغلف',
          'علبة سيلبر الرسمية المحكمة'
        ]
      }
    ],
    packaging: {
      type: 'صندوق سيلبر الأنيق المحكم لضمان القرمشة والسخونة',
      ribbon: 'شريط ستان ذهبي فاخر',
      includesCard: true,
      includesCutlery: true
    }
  },
  {
    id: 'pkg-meal-3',
    name: 'الوجبة الثالثة (60 جنيه)',
    nameEn: 'Celebre Box 3 (French Roumi & Smoked Turkey)',
    tagline: 'قطعة جاتوة مغلفة + ساندوتش فرنساوى وسط جبنة رومي + ساندوتش فرنساوى وسط تركي مدخن + عصير بخيرة وشوكة ومنديل',
    category: 'engagement_henna',
    pricePerBox: 60,
    originalPrice: 70,
    minOrder: 25,
    image: frenchBoxImg,
    badge: '60 جنيه 🥪 تركي ورومي فرنسي',
    isBestseller: false,
    isLuxury: false,
    recommendedFor: ['حفلات الخطوبة وليالي الحنة', 'كتب الكتاب بالقاعات والمساجد', 'اجتماعات ومؤتمرات الشركات'],
    description: 'تشكيلة فرنسية متوازنة تجمع بين ساندوتش فرنساوى وسط جبنة رومي وساندوتش فرنساوى وسط تركي مدخن، مع قطعة جاتوة مغلفة وعصير بخيرة وشوكة ومنديل.',
    sections: [
      {
        title: 'الساندوتشات الفرنسية',
        items: [
          'سندوتش فرنساوى وسط جبنة رومي ممتازة',
          'سندوتش فرنساوى وسط تركي مدخن فاخر'
        ]
      },
      {
        title: 'الحلو والمشروب',
        items: [
          'قطعة جاتوة مغلفة بطبقة كاكاو غنية',
          'عصير بخيرة (جوافة / مانجو)'
        ]
      },
      {
        title: 'المرفقات والخدمة',
        items: [
          'شوكة ومنديل معقم مخصص',
          'كارت تهنئة باسم المناسبة'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر باللون الأبيض والذهبي الملكي',
      ribbon: 'شريط ستان حريري مميز',
      includesCard: true,
      includesCutlery: true
    }
  },
  {
    id: 'pkg-meal-4',
    name: 'الوجبة الرابعة (65 جنيه)',
    nameEn: 'Celebre Box 4 (Petit Pain Charcoal Kofta & Chicken Pane)',
    tagline: 'قطعة جاتوة مغلفة + ساندوتش بتي بان كفتة مشوية ع الفحم + ساندوتش بتي بان فراخ بانية بلدي + عصير بخيرة وشوكة ومنديل',
    category: 'wedding',
    pricePerBox: 65,
    originalPrice: 75,
    minOrder: 25,
    image: petitPainBoxImg,
    badge: '65 جنيه 🔥 الأكثر مبيعاً',
    isBestseller: true,
    isLuxury: false,
    recommendedFor: ['كتب الكتاب ومسجد الشرطة وقاعات القوات المسلحة', 'حفلات الزفاف والخطوبة', 'العزومات والمناسبات الاجتماعية'],
    description: 'الوجبة الأكثر طلباً وإعجاباً لدى المعازيم! تجمع بين ساندوتش بتي بان كفتة مشوية على الفحم وساندوتش بتي بان فراخ بانية بلدي، مع قطعة جاتوة مغلفة وعصير بخيرة وشوكة ومنديل.',
    sections: [
      {
        title: 'الساندوتشات (ميكس فحم وبانية)',
        items: [
          'سندوتش بتي بان كفتة بلدي مشوية ع الفحم برائحة الشواء',
          'سندوتش بتي بان فراخ بانية بلدي طازجة ومقرمشة'
        ]
      },
      {
        title: 'الحلو والمشروب',
        items: [
          'قطعة جاتوة مغلفة فاخرة',
          'عصير بخيرة جوافة / مانجو طبيعي'
        ]
      },
      {
        title: 'المرفقات والخدمة',
        items: [
          'شوكة ومنديل معقم',
          'صندوق سيلبر المقوى بختم المناسبات'
        ]
      }
    ],
    packaging: {
      type: 'صندوق سيلبر الكرتوني المذهب بحفظ حراري متميز',
      ribbon: 'شريط ستان عريض ذهبي مع فيونكة أنيقة',
      includesCard: true,
      includesCutlery: true
    }
  },
  {
    id: 'pkg-meal-5',
    name: 'عرض VIP - الوجبة الخامسة (80 جنيه)',
    nameEn: 'Celebre Box 5 - VIP Charcoal Kofta & Chicken Pane French',
    tagline: 'قطعة جاتوة مغلفة + ساندوتش فرنساوى وسط كفتة مشوية + ساندوتش فرنساوى وسط فراخ بانية + عصير بخيرة وشوكة ومنديل',
    category: 'vip_reception',
    pricePerBox: 80,
    originalPrice: 95,
    minOrder: 25,
    image: vipBoxImg,
    badge: '80 جنيه 👑 عرض VIP',
    isBestseller: true,
    isLuxury: true,
    recommendedFor: ['حفلات الزفاف الكبرى والأوبن إير', 'استقبال كبار الزوار VIP', 'أفراح الفيلات والفنادق الفاخرة'],
    description: 'عرض الـ VIP الاستثنائي من سيلبر: ساندوتشين فرنساوي وسط بالحجم الكبير (كفتة مشوية على الفحم + فراخ بانية مقرمشة)، مع قطعة جاتوة مغلفة وعصير بخيرة وشوكة ومنديل معقم، بتغليف فاخر يليق بأهم ضيوفك.',
    sections: [
      {
        title: 'ساندوتشات الـ VIP الفرنسية الكبيرة',
        items: [
          'سندوتش فرنساوى وسط كفتة مشوية على الفحم متبلة بالبهارات الخاصة',
          'سندوتش فرنساوى وسط فراخ بانية بلدي كرسبي ذهبية'
        ]
      },
      {
        title: 'الحلو والضيافة والمشروب',
        items: [
          'قطعة جاتوة سيلبر الملكية المغلفة',
          'عصير بخيرة جوافة عالي الجودة'
        ]
      },
      {
        title: 'مرفقات الـ VIP وتجهيز الحفل',
        items: [
          'شوكة ومنديل معقم فاخر',
          'كارت إهداء سيلبر مطبوع بأسماء العروسين وتاريخ المناسبة',
          'صندوق سيلبر VIP الفاخر مع رمز QR لتفاصيل الحفل'
        ]
      }
    ],
    packaging: {
      type: 'صندوق سيلبر VIP الفاخر بطباعة ذهبية بارزة وشريط حريري',
      ribbon: 'شريط مخملي / ستان ذهبي عريض مع ختم سيلبر المعتمد',
      includesCard: true,
      includesCutlery: true
    }
  },
  {
    id: 'pkg-custom-chocolate',
    name: 'علبة شيكولاتة باسمك',
    nameEn: 'Celebre Personalized Name Chocolate Box',
    tagline: 'قطع شيكولاتة بلجيكية فاخرة مطبوعة ومخصصة باسمك أو أسماء العروسين وتاريخ المناسبة',
    category: 'sweets_hospitality',
    pricePerBox: 55,
    originalPrice: 70,
    minOrder: 25,
    image: chocolateBoxImg,
    badge: '🍫 شيكولاتة باسمك',
    isBestseller: true,
    isLuxury: true,
    recommendedFor: ['توزيعات كتب الكتاب والأفراح الفاخرة', 'هدايا وتذكارات المعازيم الراقية', 'حفلات الخطوبة والسبوع والمناسبات الخاصة'],
    description: 'علبة شيكولاتة فاخرة مخصصة بالكامل باسم صاحب المناسبة أو العروسين: شيكولاتة بلجيكية فاخرة بطباعة أنيقة وغلاف ذهبي راقي، مع كارت إهداء مخصص وتغليف أنيق يترك أثراً استثنائياً لدى ضيوفك.',
    sections: [
      {
        title: 'محتويات علبة الشيكولاتة المخصصة',
        items: [
          'قطع شيكولاتة بلجيكية فاخرة بطباعة مخصصة بالاسم والتهنئة',
          'تشكيلة نكهات سويسرية غنية (بندق مكرمل، لوتس، كراميل مملح، شوكولاتة داكنة)',
          'قوالب داخلية فاخرة تحافظ على جودة وشكل كل قطعة'
        ]
      },
      {
        title: 'التخصيص والتغليف',
        items: [
          'طباعة أسماء العروسين أو صاحب المناسبة وتاريخ الاحتفال مجاناً',
          'علبة سيلبر المذهبة بشريط ستان وكارت إهداء خاص'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الذهبية المخصصة للشيكولاتة مع تقسيم داخلي فاخر',
      ribbon: 'شريط ستان حريري أنيق مع كارت إهداء',
      includesCard: true,
      includesCutlery: false
    }
  },
  // Backwards compatibility mappings for older ID references
  {
    id: 'pkg-katb-ketab-royal',
    name: 'باقة كتب الكتاب الملكية (الوجبة الرابعة ميكس فحم وبانية)',
    nameEn: 'Royal Katb Ketab Box',
    tagline: 'الخيار الأكثر طلباً لمساجد وقاعات عقد القران في بني سويف وشرق النيل',
    category: 'katb_ketab',
    pricePerBox: 65,
    originalPrice: 75,
    minOrder: 25,
    image: petitPainBoxImg,
    badge: 'الأكثر مبيعاً ✨',
    isBestseller: true,
    isLuxury: false,
    recommendedFor: ['كتب كتاب بالمساجد والقاعات', 'حفلات عقد القران العائلية', 'مراسم الخطوبة الرسمية'],
    description: 'ساندوتش بتي بان كفتة مشوية ع الفحم + ساندوتش بتي بان فراخ بانية بلدي + قطعة جاتوة مغلفة + عصير بخيرة وشوكة ومنديل.',
    sections: [
      {
        title: 'الساندوتشات',
        items: [
          'سندوتش بتي بان كفتة مشوية ع الفحم',
          'سندوتش بتي بان فراخ بانية بلدي'
        ]
      },
      {
        title: 'الحلو والمشروب',
        items: [
          'قطعة جاتوة مغلفة',
          'عصير بخيرة وشوكة ومنديل'
        ]
      }
    ],
    packaging: {
      type: 'صندوق سيلبر الفاخر مع شريط ستان ذهبي',
      ribbon: 'شريط ستان جولد عريض',
      includesCard: true,
      includesCutlery: true
    }
  },
  {
    id: 'pkg-diamond-wedding',
    name: 'باقة الزفاف والخطوبة الفاخرة (عرض VIP)',
    nameEn: 'Diamond Wedding VIP Box',
    tagline: 'تجربة طعام فندقية: ساندوتشين فرنساوي كفتة مشوية وبانية مع جاتوة وعصير وتغليف VIP',
    category: 'wedding',
    pricePerBox: 80,
    originalPrice: 95,
    minOrder: 25,
    image: vipBoxImg,
    badge: 'باقة الـ VIP ⭐',
    isLuxury: true,
    isBestseller: true,
    recommendedFor: ['حفلات الزفاف الكبرى', 'أفراح الفيلات والأوبن إير', 'حفلات الخطوبة الفاخرة'],
    description: 'ساندوتش فرنساوى وسط كفتة مشوية ع الفحم + ساندوتش فرنساوى وسط فراخ بانية + قطعة جاتوة مغلفة + عصير بخيرة وشوكة ومنديل وتغليف ملوكي.',
    sections: [
      {
        title: 'الساندوتشات الرئيسية',
        items: [
          'سندوتش فرنساوى وسط كفتة مشوية',
          'سندوتش فرنساوى وسط فراخ بانية'
        ]
      },
      {
        title: 'الحلو والمشروب',
        items: [
          'قطعة جاتوة مغلفة فاخرة',
          'عصير بخيرة + شوكة ومنديل'
        ]
      }
    ],
    packaging: {
      type: 'علبة سيلبر الماسية VIP مع طباعة ذهبية',
      ribbon: 'شريط برغندي ملوكي مع بطاقة المناسبة',
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
    id: 'item-custom-chocolate',
    name: 'شيكولاتة مخصصة باسمك وتاريخ المناسبة',
    category: 'french_pastry',
    categoryLabel: 'الحلويات والشيكولاتة المخصصة',
    priceDelta: 18,
    description: 'قطع شيكولاتة سويسرية فاخرة مطبوعة ومخصصة بالاسم وتاريخ الحفل',
    badge: 'شيكولاتة باسمك 🍫'
  },
  {
    id: 'item-kunafa-asawer',
    name: 'كنافة أساور بالفستق الحلبي المقرمش',
    category: 'oriental_sweets',
    categoryLabel: 'الحلويات الشرقية والغربية',
    priceDelta: 16,
    description: 'كنافة ذهبية محشوة فستق حلبي مفروم ومسقية بشربات الورد الخفيف'
  },
  {
    id: 'item-basbousa-nuts',
    name: 'بسبوسة بالسمن البلدي والمكسرات',
    category: 'oriental_sweets',
    categoryLabel: 'الحلويات الشرقية والغربية',
    priceDelta: 14,
    description: 'بسبوسة مرملة دايبة بالسمن الفلاحي ولوز محمص'
  },
  {
    id: 'item-mini-eclair',
    name: 'ميني إكلير شوكولاتة بلجيكية فاخرة',
    category: 'french_pastry',
    categoryLabel: 'الحلويات الشرقية والغربية',
    priceDelta: 16,
    description: 'إكلير فرنسي بحشوة كريم باتيسيير الغنية وجناش شوكولاتة داكنة'
  },
  {
    id: 'item-fruit-tart',
    name: 'ميني تارت فواكه الموسم الطازجة',
    category: 'french_pastry',
    categoryLabel: 'الحلويات الشرقية والغربية',
    priceDelta: 15,
    description: 'قاعدة بسكويت مقرمشة مع كريمة فانيليا وقطع كيوي وفراولة ومانجو'
  },
  {
    id: 'item-custom-cookie',
    name: 'كوكيز التهنئة المخصص باسم العروسين / المولود',
    category: 'french_pastry',
    categoryLabel: 'الحلويات الشرقية والغربية',
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
    id: 'pack-burgundy-velvet',
    name: 'صندوق سيلبر المخملي العنابي الملكي',
    description: 'العلبة التوقيع لعلامة سيلبر، لون عنابي فخم مع إطار ذهبي وفيونكة ستان عريضة',
    priceExtra: 15,
    color: '#5C1027',
    texture: 'مخملي فاخر',
    ribbonColor: 'ذهبي ملوكي'
  },
  {
    id: 'pack-black-gold',
    name: 'صندوق الماسي أسود جولد VIP',
    description: 'كرتون مقوى أسود مطفي مع طباعة شعار سيلبر برقائق الذهب البارزة',
    priceExtra: 18,
    color: '#1C1B1F',
    texture: 'مطفي ذهبي',
    ribbonColor: 'عنابي برغندي'
  },
  {
    id: 'pack-classic-craft-window',
    name: 'صندوق كرافت كلاسيكي بنافذة عرض شفافة',
    description: 'تصميم أوروبي جذاب وشفاف يُظهر روعة الألوان والمأكولات بالداخل',
    priceExtra: 10,
    color: '#D4B996',
    texture: 'كرافت طبيعي',
    ribbonColor: 'ذهبي كلاسيك'
  },
  {
    id: 'pack-pastel-celebration',
    name: 'صندوق الباستيل الوردي / السماوي للمناسبات',
    description: 'مناسب لليالي الحنة والسبوع وتوزيعات الخطوبة الرقيقة',
    priceExtra: 12,
    color: '#E8C7CD',
    texture: 'ساتان باستيل',
    ribbonColor: 'أبيض لؤلؤي'
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
    comment: 'بجد سيلبر شرفونا قدام كل المعازيم في بني سويف! البوكس شكله راقي جداً والحلويات والساندوتشات وصلت سخنة وطازة، وشريط الستان وكارت التهنئة باسمنا كان لمسة استثنائية. شكراً لفريق Celebre المحترف.',
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
    comment: 'بوكس السبوع كان يجنن! الكوكيز والشيكولاتة باسم البيبي كانت تحفة. الناس كلها سألتني عن سيلبر والرقم المطبوع على العلبة. تسلم إيديكم.',
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
    answer: 'تأتي عبوات سيلبر بتصميمها الفاخر الخاص بالبراند وبأعلى معايير الأناقة والنظافة المحكمة الجاهزة للتقديم المباشر لضيوفكم، ولا نوفر كروت إهداء أو أشرطة ستان حرصاً على التقديم السريع والعملي والمنظم.',
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
