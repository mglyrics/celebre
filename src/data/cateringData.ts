import { CateringPackage, DrinkModificationOption, Testimonial } from "../types";

import meal1Img from "../assets/images/celebre_real_box_meal1_1790336339821.jpg";
import meal2Img from "../assets/images/celebre_real_box_meal2_1790336354493.jpg";
import meal3Img from "../assets/images/celebre_real_box_meal3_1790336370477.jpg";
import meal4Img from "../assets/images/celebre_real_box_meal4_1790336384159.jpg";
import meal5Img from "../assets/images/celebre_real_box_meal5_1790336396930.jpg";
import meal6Img from "../assets/images/celebre_real_box_meal6_1790336410383.jpg";
import meal7Img from "../assets/images/celebre_real_box_meal7_1790336423204.jpg";
import meal8Img from "../assets/images/celebre_real_box_meal8_1790336439618.jpg";
import meal9Img from "../assets/images/celebre_real_box_meal9_1790336451314.jpg";
import meal10Img from "../assets/images/celebre_real_box_meal10_1790336462682.jpg";
import meal11Img from "../assets/images/celebre_real_box_meal11_1790336476100.jpg";
import meal12Img from "../assets/images/celebre_real_box_meal12_1790336488857.jpg";

export const DRINK_MODIFICATION_OPTIONS: DrinkModificationOption[] = [
  {
    id: "default_juice",
    label: "عصير بيتي / بخيرة أصلي",
    sublabel: "بقيمة 5 جنيه مشمول بالوجبة",
    priceDelta: 0,
    iconName: "Juice",
    description: "عبوة عصير طبيعي طازج بارد ونقي معقم (بقيمة 5 جنيه محسوبة داخل سعر الوجبة)"
  },
  {
    id: "pepsi",
    label: "إضافة كانز بيبسي كولا مثلج",
    sublabel: "+10 جنيه لكل علبة",
    priceDelta: 10,
    iconName: "Can",
    description: "إضافة كانز بيبسي كولا مثلج ومنعش داخل العلبة (+10 جنيه)"
  },
  {
    id: "no_drink",
    label: "بدون عصير (خصم 5 جنيه للعلبة)",
    sublabel: "-5 جنيه خصم فوري (قيمة العصير)",
    priceDelta: -5,
    iconName: "XCircle",
    description: "استبعاد العصير واسترداد قيمته (خصم 5 جنيه من كل وجبة)"
  }
];
export const CATERING_PACKAGES: CateringPackage[] = [{id:"pkg-sale-01",saleCode:"Sale - 01",name:"وجبة Sale - 01 (50 جنيه)",nameEn:"Celebre Box Sale-01 (Petit Pain Roumi & Cordon Beef)",tagline:"قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان لانشون كوردن بيف + عصير بخيرة وشوكة ومناديل",category:"katb_ketab",pricePerBox:50,originalPrice:60,minOrder:50,image: meal1Img,badge:"Sale - 01 ✨ 50 ج",isBestseller:false,isLuxury:false,recommendedFor:["كتب الكتاب وعقد القران بالمساجد","المناسبات العائلية والأفراح","حفلات التخرج والاستقبالات"],description:"عبوة سيلبر الرسمية Sale-01: قطعة جاتوه مغلفة فاخرة، سندوتش بتي بان جبنة رومي، سندوتش بتي بان لانشون كوردن بيف، عصير بخيرة، وشوكة ومناديل معقمة.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","سندوتش بتي بان جبنة رومي","سندوتش بتي بان لانشون كوردن بيف","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-02",saleCode:"Sale - 02",name:"وجبة Sale - 02 (55 جنيه)",nameEn:"Celebre Box Sale-02 (French Fresh Chicken Pane)",tagline:"قطعة جاتوه مغلفة + سندوتش فرنساوى وسط فراخ بانية بلدي + عصير بخيرة وشوكة ومناديل",category:"katb_ketab",pricePerBox:55,originalPrice:65,minOrder:50,image: meal2Img,badge:"Sale - 02 🍗 55 ج",isBestseller:false,isLuxury:false,recommendedFor:["كتب الكتاب والمساجد الكبرى","حفلات الخطوبة","الضيافة الخفيفة السريعة"],description:"وجبة سيلبر الرسمية Sale-02: قطعة جاتوه مغلفة، سندوتش فرنساوى وسط محشو فراخ بانية بلدي مقرمشة ومتبلة، عصير بخيرة وشوكة ومناديل داخل العلبة المعتمدة.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","سندوتش فرنساوى وسط فراخ بانية بلدي","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-03",saleCode:"Sale - 03",name:"وجبة Sale - 03 (60 جنيه)",nameEn:"Celebre Box Sale-03 (French Roumi & Smoked Turkey)",tagline:"قطعة جاتوه مغلفة + سندوتش فرنساوى وسط جبنة رومي + سندوتش فرنساوى وسط تركي مدخن + عصير بخيرة وشوكة ومناديل",category:"engagement_henna",pricePerBox:60,originalPrice:70,minOrder:50,image: meal3Img,badge:"Sale - 03 🥪 60 ج",isBestseller:false,isLuxury:false,recommendedFor:["حفلات الخطوبة وليالي الحنة","كتب الكتاب بالقاعات والمساجد","اجتماعات ومؤتمرات الشركات"],description:"تشكيلة فرنسية متوازنة في عبوة Sale-03: قطعة جاتوه مغلفة، سندوتش فرنساوى وسط جبنة رومي، سندوتش فرنساوى وسط تركي مدخن، عصير بخيرة، وشوكة ومناديل.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","سندوتش فرنساوى وسط جبنة رومي","سندوتش فرنساوى وسط تركي مدخن","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-04",saleCode:"Sale - 04",name:"وجبة Sale - 04 (65 جنيه)",nameEn:"Celebre Box Sale-04 (Charcoal Kofta & Chicken Pane)",tagline:"قطعة جاتوه مغلفة + سندوتش بتي بان كفتة مشوية ع الفحم + سندوتش بتي بان فراخ بانية بلدي + عصير بخيرة وشوكة ومناديل",category:"wedding",pricePerBox:65,originalPrice:75,minOrder:50,image: meal4Img,badge:"Sale - 04 🔥 الأكثر مبيعاً (65 ج)",isBestseller:true,isLuxury:false,recommendedFor:["كتب الكتاب ومسجد الشرطة وقاعات القوات المسلحة","حفلات الزفاف والخطوبة","العزومات والمناسبات الاجتماعية"],description:"الوجبة الأكثر طلباً وإعجاباً Sale-04: قطعة جاتوه مغلفة، سندوتش بتي بان كفتة مشوية ع الفحم، سندوتش بتي بان فراخ بانية بلدي، عصير بخيرة، وشوكة ومناديل.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","سندوتش بتي بان كفتة مشوية ع الفحم","سندوتش بتي بان فراخ بانية بلدي","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف بالمساجد والقاعات)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-05",saleCode:"Sale - 05",name:"وجبة Sale - 05 (80 جنيه)",nameEn:"Celebre Box Sale-05 (VIP Charcoal Kofta & Chicken Pane French)",tagline:"قطعة جاتوه مغلفة + سندوتش فرنساوى وسط كفتة مشوية + سندوتش فرنساوى وسط فراخ بانية + عصير بخيرة وشوكة ومناديل",category:"vip_reception",pricePerBox:80,originalPrice:95,minOrder:50,image: meal5Img,badge:"Sale - 05 👑 عرض VIP (80 ج)",isBestseller:true,isLuxury:true,recommendedFor:["حفلات الزفاف الكبرى والأوبن إير","استقبال كبار الزوار VIP","أفراح الفيلات والفنادق الفاخرة"],description:"عرض الـ VIP الاستثنائي Sale-05: قطعة جاتوه مغلفة، ساندوتش فرنساوى وسط كفتة مشوية، ساندوتش فرنساوى وسط فراخ بانية، عصير بخيرة وشوكة ومناديل داخل علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","سندوتش فرنساوى وسط كفتة مشوية","سندوتش فرنساوى وسط فراخ بانية","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-06",saleCode:"Sale - 06",name:"وجبة Sale - 06 (35 جنيه)",nameEn:"Celebre Box Sale-06 (Gateau & Juice)",tagline:"قطعة جاتوه مغلفة + عصير بخيرة + شوكة ومناديل",category:"katb_ketab",pricePerBox:35,originalPrice:42,minOrder:50,image: meal6Img,badge:"Sale - 06 ☕ 35 ج",isBestseller:false,isLuxury:false,recommendedFor:["الضيافة السريعة والخفيفة بالمساجد","حفلات التكريم والندوات","عقد القران الخفيف"],description:"وجبة ضيافة خفيفة وأنيقة Sale-06: قطعة جاتوه مغلفة غنية بالكاكاو أو الفانيليا، مع عصير بخيرة طازج وشوكة ومناديل معقمة، بسعر اقتصادي ممتاز 35 ج.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-07",saleCode:"Sale - 07",name:"وجبة Sale - 07 (50 جنيه)",nameEn:"Celebre Box Sale-07 (Gateau & 2 Oriental Sweets)",tagline:"قطعة جاتوه مغلفة + 2 قطعة حلويات شرقي + عصير بخيرة + شوكة ومناديل",category:"engagement_henna",pricePerBox:50,originalPrice:60,minOrder:50,image: meal7Img,badge:"Sale - 07 🍯 50 ج",isBestseller:false,isLuxury:false,recommendedFor:["ليالي الحنة والخطوبات","ضيافة عقد القران الحلوة","احتفالات العائلة والسبوع"],description:"وجبة الحلويات المميزة Sale-07: قطعة جاتوه مغلفة فاخرة مع قطعتين من الحلويات الشرقية اللذيذة بالسمن البلدي وعصير بخيرة وشوكة ومناديل.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","2 قطعة حلويات شرقي","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع مباشر سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-08",saleCode:"Sale - 08",name:"وجبة Sale - 08 (45 جنيه)",nameEn:"Celebre Box Sale-08 (Gateau, 2 Mini Pizza, 2 Baton Sale)",tagline:"قطعة جاتوه مغلفة + 2 ق ميني بيتزا + 2 باتون سالية + عصير بخيرة + شوكة ومنديل",category:"katb_ketab",pricePerBox:45,originalPrice:55,minOrder:50,image: meal8Img,badge:"Sale - 08 🍕 45 ج",isBestseller:false,isLuxury:false,recommendedFor:["كتب الكتاب والمساجد","حفلات التخرج والاستقبال","أعياد الميلاد والمناسبات"],description:"تشكيلة المخبوزات والجاتوه الشهية Sale-08: قطعة جاتوه مغلفة، قطعتين ميني بيتزا غنية بالجبن، قطعتين باتون ساليه مقرمش بالكمون، وعصير بخيرة وشوكة ومنديل.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","2 ق ميني بيتزا طازجة","2 باتون سالية مقرمش","عصير بخيرة + شوكة ومنديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-09",saleCode:"Sale - 09",name:"وجبة Sale - 09 (50 جنيه)",nameEn:"Celebre Box Sale-09 (Gateau, 2 Mini Pizza, Oriental Sweet)",tagline:"قطعة جاتوه مغلفة + 2 ق ميني بيتزا + قطعة حلوي شرقي + عصير بخيرة + شوكة ومنديل",category:"engagement_henna",pricePerBox:50,originalPrice:60,minOrder:50,image: meal9Img,badge:"Sale - 09 🍕 50 ج",isBestseller:false,isLuxury:false,recommendedFor:["حفلات الخطوبة وعقد القران","المناسبات العائلية والأفراح","الضيافة المتنوعة"],description:"مزيج الحادق والحلو المتكامل Sale-09: قطعة جاتوه مغلفة، قطعتين ميني بيتزا، قطعة حلوي شرقي بالسمن البلدي، وعصير بخيرة وشوكة ومنديل معقم.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","2 ق ميني بيتزا شهية","قطعة حلوي شرقي فاخرة","عصير بخيرة + شوكة ومنديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-10",saleCode:"Sale - 10",name:"وجبة Sale - 10 (45 جنيه)",nameEn:"Celebre Box Sale-10 (3 Petit Pain: Kofta, Roumi, Turkey/Pastrami)",tagline:"سندوتش بتي بان كفتة + سندوتش بتي بان جبنة رومي + سندوتش بتي بان تركي مدخن / بسطرمة + عصير بخيرة وشوكة ومناديل",category:"wedding",pricePerBox:45,originalPrice:55,minOrder:50,image: meal10Img,badge:"Sale - 10 🥪 3 ساندوتشات (45 ج)",isBestseller:true,isLuxury:false,recommendedFor:["محبي الساندوتشات الحادقة","كتب الكتاب والمساجد","حفلات الشباب والرحلات"],description:"وجبة الساندوتشات الغنية Sale-10: 3 ساندوتشات بتي بان مشبعة (سندوتش بتي بان كفتة مشوية، سندوتش بتي بان جبنة رومي، سندوتش بتي بان تركي مدخن أو بسطرمة)، مع عصير بخيرة وشوكة ومناديل.",sections:[{title:"محتويات الوجبة بالعلبة",items:["سندوتش بتي بان كفتة مشوية","سندوتش بتي بان جبنة رومي","سندوتش بتي بان تركي مدخن / بسطرمة","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-11",saleCode:"Sale - 11",name:"وجبة Sale - 11 (39 جنيه)",nameEn:"Celebre Box Sale-11 (Gateau, Petit Pain, Baton Sale, Mini Pizza)",tagline:"قطعة جاتوه مغلفة + سندوتش بتي بان جبنة رومي / فيتا / بسطرمة + ق باتون سالية + ق ميني بيتزا + عصير بخيرة وشوكة ومناديل",category:"katb_ketab",pricePerBox:39,originalPrice:48,minOrder:50,image: meal11Img,badge:"Sale - 11 ⭐ 39 ج",isBestseller:false,isLuxury:false,recommendedFor:["كتب الكتاب بالمساجد","حفلات التخرج والمؤتمرات","توزيعات المناسبات الاقتصادية الراقية"],description:"تشكيلة متميزة بسعر مذهل Sale-11: قطعة جاتوه مغلفة، سندوتش بتي بان (جبنة رومي / فيتا / بسطرمة)، قطعة باتون ساليه، قطعة ميني بيتزا، عصير بخيرة وشوكة ومناديل.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","سندوتش بتي بان جبنة رومي / فيتا / بسطرمة","ق باتون سالية + ق ميني بيتزا","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)",includesCard:true,includesCutlery:true}},{id:"pkg-sale-12",saleCode:"Sale - 12",name:"وجبة Sale - 12 (44 جنيه)",nameEn:"Celebre Box Sale-12 (Gateau & Flavored Butter Pate)",tagline:"قطعة جاتوه مغلفة + باتية زبدة نكهات مختلفة + عصير بخيرة + شوكة ومناديل",category:"katb_ketab",pricePerBox:44,originalPrice:52,minOrder:50,image: meal12Img,badge:"Sale - 12 🥐 44 ج",isBestseller:false,isLuxury:false,recommendedFor:["الصباحيات وحفلات كتب الكتاب","استقبالات الصالونات والمعارض","المناسبات العائلية"],description:"وجبة المخبوزات والجاتوه الفرنسية Sale-12: قطعة جاتوه مغلفة، باتيه بالزبدة الطبيعية بنكهات مختلفة غنية، عصير بخيرة، وشوكة ومناديل.",sections:[{title:"محتويات الوجبة بالعلبة",items:["قطعة جاتوه مغلفة فاخرة","باتية زبدة نكهات مختلفة","عصير بخيرة + شوكة ومناديل"]}],packaging:{type:"علبة سيلبر الكرتونية البيضاء الفاخرة المعتمدة",ribbon:"غلق ذاتي محكم بدون أشرطة (توزيع سريع ونظيف)",includesCard:true,includesCutlery:true}}];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    name: "د. طارق عبد الرحمن",
    role: "والد العروس",
    occasion: "عقد قران بمسجد عمر بن عبد العزيز - بني سويف",
    location: "بني سويف",
    rating: 5,
    date: "منذ أسبوعين",
    comment: "توزيع علب سيلبر كان منظم جداً ومحكم، الوجبات وصلت ساخنة ومقرمشة والجاتوه طازج، وبيضوا وجهنا أمام المعازيم.",
    verified: true,
    boxesOrdered: 180
  },
  {
    id: "test-2",
    name: "أحمد مصطفى القاضي",
    role: "العريس",
    occasion: "حفل خطوبة بقاعة شرق النيل",
    location: "شرق النيل - بني سويف",
    rating: 5,
    date: "منذ شهر",
    comment: "ساندوتشات الفحم والبانيه كان طعمها تحفة، والعلبة الكرتونية شيك ومقفولة كأنها هدية فاخرة. شكراً لفريق سيلبر المحترم.",
    verified: true,
    boxesOrdered: 120
  },
  {
    id: "test-3",
    name: "م. سارة المهدي",
    role: "منظمة حفلات",
    occasion: "استقبال كتب كتاب مسجد مكة",
    location: "مدينة بني سويف",
    rating: 5,
    date: "منذ 3 أسابيع",
    comment: "أفضل وأدق كاترنج تعاملت معه في الصعيد، الالتزام بالدقيقة والعلب مغلقة باحترافية وسرعة فائقة في التوزيع.",
    verified: true,
    boxesOrdered: 250
  }
];

export const FAQS = [
  {
    q: "ما هو الحد الأدنى للطلب في سيلبر؟",
    a: "الحد الأدنى للطلب هو 50 وجبة لأي من العبوات الرسمية لضمان أعلى جودة وإعداد طازج فوري."
  },
  {
    q: "هل يمكن طلب كميات كبيرة (أكثر من 300 أو 500 أو 1000 وجبة)؟",
    a: "نعم بالتأكيد! سيلبر مجهزة لخدمة أكبر المناسبات والأفراح بمرونة تامة، ويمكنك إدخال أي رقم تريده وسيتولى فريقنا التجهيز الكامل والتوصيل بسيارات مجهزة."
  },
  {
    q: "ما هي مناطق التوصيل المعتمدة؟",
    a: "نغطي حالياً محافظة بني سويف (مدينة بني سويف، شرق النيل، وجميع المراكز والمساجد الكبرى)، بالإضافة للتوصيل الخاص للفيوم والقاهرة الكبرى للمناسبات الكبيرة."
  },
  {
    q: "كيف يتم دفع العربون وتأكيد الحجز؟",
    a: "يتم سداد عربون 50% من إجمالي الطلب عبر تطبيق إنستاباي (InstaPay) أو فودافون كاش، وسداد الـ 50% المتبقية عند الاستلام."
  },
  {
    q: "هل توزعون حلويات شرقية أو تستخدمون أشرطة ستان؟",
    a: "سيلبر متخصصة في علب الكاترنج الكرتونية المذهبة الفاخرة المحكمة الغلق ذاتياً فقط لضمان النظافة والسرعة، ونعتمد قطع الجاتوه المثلثة المغلفة بدلاً من الحلويات الشرقية."
  }
];
