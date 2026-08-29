import React, { useState, useMemo } from 'react';
import { CelebreLogo } from './CelebreLogo';
import { 
  MENU_ITEMS_CUSTOMIZER, 
  PACKAGING_OPTIONS 
} from '../data/cateringData';
import { MenuItemOption, PackagingOption, OrderItem } from '../types';
import { 
  Sparkles, 
  Plus, 
  Minus, 
  Check, 
  ShoppingBag, 
  MessageCircle, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  Gift, 
  Heart,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomBoxBuilderProps {
  onClose?: () => void;
  onAddToCart: (item: OrderItem) => void;
}

export const CustomBoxBuilder: React.FC<CustomBoxBuilderProps> = ({
  onClose,
  onAddToCart,
}) => {
  // Active step in the wizard
  const [activeTab, setActiveTab] = useState<'packaging' | 'savory' | 'sweets' | 'drinks' | 'summary'>('packaging');

  // Selected packaging
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>(PACKAGING_OPTIONS[0].id);

  // Selected food items: map of itemId -> quantity per box
  const [itemSelections, setItemSelections] = useState<Record<string, number>>({
    'item-cordon-bleu': 1,
    'item-shish-tawook': 1,
    'item-sambousak-mix': 1,
    'item-kobeba-shami': 1,
    'item-kunafa-asawer': 1,
    'drink-mango-fresh': 1,
    'drink-mineral-water': 1,
  });

  // Custom Ribbon / Card text
  const [cardText, setCardText] = useState('ألف مبروك لأجمل عروسين');
  // Total boxes quantity
  const [boxesCount, setBoxesCount] = useState(50);

  // Calculate pricing
  const currentPackaging = useMemo(() => {
    return PACKAGING_OPTIONS.find(p => p.id === selectedPackagingId) || PACKAGING_OPTIONS[0];
  }, [selectedPackagingId]);

  const itemsTotalCostPerBox = useMemo(() => {
    let sum = currentPackaging.priceExtra;
    Object.entries(itemSelections).forEach(([itemId, val]) => {
      const count = Number(val) || 0;
      const item = MENU_ITEMS_CUSTOMIZER.find(i => i.id === itemId);
      if (item && count > 0) {
        sum += item.priceDelta * count;
      }
    });
    return sum;
  }, [itemSelections, currentPackaging]);

  // Bulk discount percentage
  const discountRate = useMemo(() => {
    if (boxesCount >= 200) return 0.10; // 10% off
    if (boxesCount >= 100) return 0.05; // 5% off
    return 0;
  }, [boxesCount]);

  const finalPricePerBox = Math.round(itemsTotalCostPerBox * (1 - discountRate));
  const grandTotal = finalPricePerBox * boxesCount;

  // Item quantity updater
  const handleItemCountChange = (itemId: string, delta: number) => {
    setItemSelections(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const handleReset = () => {
    setItemSelections({
      'item-cordon-bleu': 1,
      'item-shish-tawook': 1,
      'item-sambousak-mix': 1,
      'item-kobeba-shami': 1,
      'item-kunafa-asawer': 1,
      'drink-mango-fresh': 1,
      'drink-mineral-water': 1,
    });
    setSelectedPackagingId(PACKAGING_OPTIONS[0].id);
    setBoxesCount(50);
  };

  const selectedItemsList = useMemo(() => {
    const list: { item: MenuItemOption; count: number }[] = [];
    Object.entries(itemSelections).forEach(([itemId, val]) => {
      const count = Number(val) || 0;
      const item = MENU_ITEMS_CUSTOMIZER.find(i => i.id === itemId);
      if (item && count > 0) {
        list.push({ item, count });
      }
    });
    return list;
  }, [itemSelections]);

  const handleAddToCart = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#5C1027', '#D4AF37', '#FAF7F2']
    });

    const itemDetails = selectedItemsList.map(s => `${s.count}x ${s.item.name}`);

    const newOrder: OrderItem = {
      id: `custom-box-${Date.now()}`,
      type: 'custom',
      name: `عبوة سيلبر المخصصة (${currentPackaging.name})`,
      details: itemDetails,
      packagingName: `${currentPackaging.name} - ${currentPackaging.ribbonColor}`,
      quantity: boxesCount,
      pricePerBox: finalPricePerBox,
      totalPrice: grandTotal,
      customCardText: cardText.trim() ? cardText : undefined,
    };

    onAddToCart(newOrder);
    if (onClose) onClose();
  };

  const handleWhatsAppOrder = () => {
    const itemsSummary = selectedItemsList.map(s => `- ${s.count}x ${s.item.name}`).join('\n');
    const msg = `مرحباً سيلبر (Celebre) 🌸\nأرغب في حجز عبوات كاترنج مخصصة من تصميمي:\n*نوع التغليف:* ${currentPackaging.name}\n*محتويات العبوة:* \n${itemsSummary}\n*عدد العبوات:* ${boxesCount} عبوة\n*سعر العبوة:* ${finalPricePerBox} ج.م\n*الإجمالي:* ${grandTotal.toLocaleString()} جنيه مصري\n*كارت الإهداء:* ${cardText}\nأرجو تأكيد الحجز والتوصيل.`;
    window.open(`https://wa.me/201284484868?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section id="customizer-section" className="py-14 sm:py-20 bg-gradient-to-b from-[#FAF7F2] via-[#F5EEDB] to-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-right">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF0E1] border border-[#C89B3C]/50 text-[#5C1027] text-xs font-black mb-3 shadow-xs">
            <Layers className="w-4 h-4 text-[#C89B3C]" />
            <span>استوديو تصميم عبوة الكاترنج التفاعلي</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C0A15] tracking-tight mb-3">
            صمم عبوتك بنفسك حسب ذوقك وميزانيتك
          </h2>
          
          <p className="text-sm sm:text-base text-[#66574A] leading-relaxed">
            اختر نوع العلبة والستان، وحدد الأصناف والكميات بالقطعة، واحصل على السعر الفوري الشامل للخصومات وكارت الإهداء المطبوع.
          </p>
        </div>

        {/* Studio Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Wizard Steps & Item Selectors in RTL) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-7 border border-[#E6DBCA] shadow-lg">
            
            {/* Step Tabs Navigation */}
            <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-[#FAF4E8] border border-[#E8DEC9] mb-8 text-center text-xs font-bold">
              <button
                onClick={() => setActiveTab('packaging')}
                className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'packaging'
                    ? 'bg-[#5C1027] text-[#FFDF9E] shadow-sm'
                    : 'text-[#635547] hover:bg-[#F0E4D0]'
                }`}
              >
                <span>🎁</span>
                <span>1. التغليف</span>
              </button>

              <button
                onClick={() => setActiveTab('savory')}
                className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'savory'
                    ? 'bg-[#5C1027] text-[#FFDF9E] shadow-sm'
                    : 'text-[#635547] hover:bg-[#F0E4D0]'
                }`}
              >
                <span>🥪</span>
                <span>2. الموالح</span>
              </button>

              <button
                onClick={() => setActiveTab('sweets')}
                className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'sweets'
                    ? 'bg-[#5C1027] text-[#FFDF9E] shadow-sm'
                    : 'text-[#635547] hover:bg-[#F0E4D0]'
                }`}
              >
                <span>🍰</span>
                <span>3. الحلويات</span>
              </button>

              <button
                onClick={() => setActiveTab('drinks')}
                className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'drinks'
                    ? 'bg-[#5C1027] text-[#FFDF9E] shadow-sm'
                    : 'text-[#635547] hover:bg-[#F0E4D0]'
                }`}
              >
                <span>🍹</span>
                <span>4. المشروبات</span>
              </button>

              <button
                onClick={() => setActiveTab('summary')}
                className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === 'summary'
                    ? 'bg-[#5C1027] text-[#FFDF9E] shadow-sm'
                    : 'text-[#635547] hover:bg-[#F0E4D0]'
                }`}
              >
                <span>📋</span>
                <span>5. التأكيد</span>
              </button>
            </div>

            {/* TAB 1: PACKAGING OPTIONS */}
            {activeTab === 'packaging' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#5C1027] mb-1">الخطوة الأولى: اختر نوع وشكل الصندوق وشريط الستان</h3>
                  <p className="text-xs text-[#736353]">جميع الصناديق مصنعة من خامات كرتونية فاخرة متوافقة مع الأغذية ومحكمة الإغلاق.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PACKAGING_OPTIONS.map((pack) => {
                    const isSelected = selectedPackagingId === pack.id;
                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPackagingId(pack.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#FAF2E6] border-[#5C1027] shadow-md'
                            : 'bg-white border-[#E8DEC9] hover:border-[#C89B3C]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-[#2C0A15]">{pack.name}</span>
                            <div
                              className="w-5 h-5 rounded-full border border-black/20 shadow-xs"
                              style={{ backgroundColor: pack.color }}
                            />
                          </div>
                          <p className="text-xs text-[#665749] leading-relaxed mb-3">{pack.description}</p>
                        </div>

                        <div className="pt-3 border-t border-[#EBDDC7] flex items-center justify-between text-xs">
                          <span className="text-[#8C5E13] font-semibold">شريط الستان: {pack.ribbonColor}</span>
                          <span className="font-bold text-[#5C1027] font-mono">+{pack.priceExtra} ج.م</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setActiveTab('savory')}
                    className="px-6 py-2.5 rounded-xl bg-[#5C1027] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#721832] transition-colors cursor-pointer"
                  >
                    <span>التالي: اختيار الموالح والساندوتشات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SAVORY & MEATS */}
            {activeTab === 'savory' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#5C1027] mb-1">الخطوة الثانية: حدد أصناف الموالح والساندوتشات للعبوة</h3>
                  <p className="text-xs text-[#736353]">اضغط على (+) لإضافة قطعة أو أكثر من الصنف داخل كل عبوة فردية.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {MENU_ITEMS_CUSTOMIZER.filter(i => i.category === 'meats_skewers' || i.category === 'savory_pastry' || i.category === 'salads_appetizers').map((item) => {
                    const count = itemSelections[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          count > 0 
                            ? 'bg-[#FAF4E8] border-[#C89B3C] shadow-xs' 
                            : 'bg-white border-[#E8DEC9] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-[#2C0A15]">{item.name}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 bg-[#D4AF37] text-[#2C0A15] text-[9px] font-black rounded-sm">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#695B4E] line-clamp-1 mb-1">{item.description}</p>
                          <span className="text-xs font-bold text-[#8C5E13] font-mono">+{item.priceDelta} ج.م / قطعة</span>
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center gap-1.5 bg-[#FAF0E1] p-1 rounded-xl border border-[#D9C49C]">
                          <button
                            onClick={() => handleItemCountChange(item.id, -1)}
                            disabled={count === 0}
                            className="w-6 h-6 rounded-lg bg-white text-[#5C1027] font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-xs text-[#5C1027]">
                            {count}
                          </span>
                          <button
                            onClick={() => handleItemCountChange(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-[#5C1027] text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#EFE5D3]">
                  <button
                    onClick={() => setActiveTab('packaging')}
                    className="px-4 py-2 rounded-xl bg-[#F0E4D0] text-[#5C1027] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('sweets')}
                    className="px-6 py-2.5 rounded-xl bg-[#5C1027] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#721832] transition-colors cursor-pointer"
                  >
                    <span>التالي: اختيار الحلويات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SWEETS & PASTRIES */}
            {activeTab === 'sweets' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#5C1027] mb-1">الخطوة الثالثة: تشكيلة الحلويات الشرقية والغربية</h3>
                  <p className="text-xs text-[#736353]">حلويات مخبوزة بالسمن البلدي الفلاحي وشوكولاتة بلجيكية فاخرة.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {MENU_ITEMS_CUSTOMIZER.filter(i => i.category === 'oriental_sweets' || i.category === 'french_pastry').map((item) => {
                    const count = itemSelections[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          count > 0 
                            ? 'bg-[#FAF4E8] border-[#C89B3C] shadow-xs' 
                            : 'bg-white border-[#E8DEC9] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-[#2C0A15]">{item.name}</span>
                          </div>
                          <p className="text-[11px] text-[#695B4E] line-clamp-1 mb-1">{item.description}</p>
                          <span className="text-xs font-bold text-[#8C5E13] font-mono">+{item.priceDelta} ج.م / قطعة</span>
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center gap-1.5 bg-[#FAF0E1] p-1 rounded-xl border border-[#D9C49C]">
                          <button
                            onClick={() => handleItemCountChange(item.id, -1)}
                            disabled={count === 0}
                            className="w-6 h-6 rounded-lg bg-white text-[#5C1027] font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-xs text-[#5C1027]">
                            {count}
                          </span>
                          <button
                            onClick={() => handleItemCountChange(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-[#5C1027] text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#EFE5D3]">
                  <button
                    onClick={() => setActiveTab('savory')}
                    className="px-4 py-2 rounded-xl bg-[#F0E4D0] text-[#5C1027] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('drinks')}
                    className="px-6 py-2.5 rounded-xl bg-[#5C1027] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#721832] transition-colors cursor-pointer"
                  >
                    <span>التالي: اختيار المشروبات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: DRINKS & ACCESSORIES */}
            {activeTab === 'drinks' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#5C1027] mb-1">الخطوة الرابعة: المشروبات والعصائر الطبيعية الفريش والمياه</h3>
                  <p className="text-xs text-[#736353]">عصائر طبيعية طازجة تُعصر صباح يوم المناسبة بدون أي سكر أو مواد حافظة.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {MENU_ITEMS_CUSTOMIZER.filter(i => i.category === 'drinks_water').map((item) => {
                    const count = itemSelections[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          count > 0 
                            ? 'bg-[#FAF4E8] border-[#C89B3C] shadow-xs' 
                            : 'bg-white border-[#E8DEC9] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-[#2C0A15]">{item.name}</span>
                          </div>
                          <p className="text-[11px] text-[#695B4E] line-clamp-1 mb-1">{item.description}</p>
                          <span className="text-xs font-bold text-[#8C5E13] font-mono">+{item.priceDelta} ج.م</span>
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center gap-1.5 bg-[#FAF0E1] p-1 rounded-xl border border-[#D9C49C]">
                          <button
                            onClick={() => handleItemCountChange(item.id, -1)}
                            disabled={count === 0}
                            className="w-6 h-6 rounded-lg bg-white text-[#5C1027] font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-xs text-[#5C1027]">
                            {count}
                          </span>
                          <button
                            onClick={() => handleItemCountChange(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-[#5C1027] text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#EFE5D3]">
                  <button
                    onClick={() => setActiveTab('sweets')}
                    className="px-4 py-2 rounded-xl bg-[#F0E4D0] text-[#5C1027] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    className="px-6 py-2.5 rounded-xl bg-[#5C1027] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#721832] transition-colors cursor-pointer"
                  >
                    <span>التالي: معاينة العبوة وتأكيد الطلب</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: SUMMARY & QUANTITY */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#5C1027] mb-1">الخطوة الخامسة: تفاصيل المناسبة والكمية وطباعة الكارت</h3>
                  <p className="text-xs text-[#736353]">راجع محتويات عبوتك المخصصة وحدد عدد العبوات المطلوبة للحصول على أفضل سعر.</p>
                </div>

                {/* Card Text Input */}
                <div className="p-4 rounded-2xl bg-[#FAF4E8] border border-[#E0D1B9] space-y-2">
                  <label className="text-xs font-bold text-[#5C1027] flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#C89B3C]" />
                    <span>نص كارت الإهداء أو شريط الستان (مطبوع مجاناً):</span>
                  </label>
                  <input
                    type="text"
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    placeholder="مثال: ألف مبروك للعروسين سارة & كريم - 20 سبتمبر 2026"
                    className="w-full px-4 py-2.5 text-xs bg-white rounded-xl border border-[#D9C49C] focus:outline-none focus:ring-2 focus:ring-[#721832]"
                  />
                </div>

                {/* Selected Items Breakdown List */}
                <div className="p-4 rounded-2xl bg-white border border-[#E8DEC9] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F0E5D4] pb-2">
                    <span className="font-bold text-xs text-[#5C1027]">الأصناف المختارة داخل كل عبوة:</span>
                    <button
                      onClick={handleReset}
                      className="text-[11px] text-[#8C5E13] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>إعادة ضبط المنيو</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedItemsList.map(({ item, count }) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF7F2]">
                        <span className="text-[#3D332A] font-medium">• {count}x {item.name}</span>
                        <span className="font-mono text-[#8C5E13] font-bold">{(item.priceDelta * count)} ج.م</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#EFE5D3]">
                  <button
                    onClick={() => setActiveTab('drinks')}
                    className="px-4 py-2 rounded-xl bg-[#F0E4D0] text-[#5C1027] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>تعديل الأصناف</span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C06E] text-[#2C0A15] font-black text-xs sm:text-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-md"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>حفظ وإضافة إلى سلة الحجز</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column (Live 3D Box Price Card & Dispatch in RTL) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            
            <div className="bg-[#5C1027] text-white rounded-3xl p-6 border border-[#C89B3C]/50 shadow-2xl space-y-5">
              
              {/* Box Preview Header */}
              <div className="flex items-center justify-between border-b border-[#82213D] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#2C0A15] flex items-center justify-center font-bold">
                    ✨
                  </div>
                  <div>
                    <div className="text-[10px] text-[#EAD8BD]">معاينة العبوة المخصصة</div>
                    <div className="text-xs font-bold text-[#FFDF9E]">{currentPackaging.name}</div>
                  </div>
                </div>
                <div
                  className="w-5 h-5 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: currentPackaging.color }}
                />
              </div>

              {/* Interactive Visual Packaging Box Presentation */}
              <div className="relative rounded-2xl overflow-hidden p-4 bg-gradient-to-br from-[#FAF3E5] to-[#F1E4C9] border-2 border-[#C89B3C]/50 shadow-inner text-center">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#5C1027] mb-2 px-1">
                  <span>ختم سيلبر المعتمد على الغطاء</span>
                  <span className="text-[#8C5E13]">تغليف {currentPackaging.ribbonColor}</span>
                </div>

                {/* Box Lid Visual */}
                <div 
                  className="relative rounded-xl p-4 shadow-md transition-all flex flex-col items-center justify-center border"
                  style={{
                    backgroundColor: currentPackaging.id === 'pack-dark-burgundy' ? '#3B0715' : currentPackaging.id === 'pack-gold-luxe' ? '#FAF0D7' : '#FFFFFF',
                    borderColor: '#C89B3C',
                  }}
                >
                  {/* Decorative Ribbon Cross */}
                  <div 
                    className="absolute top-0 bottom-0 w-6 opacity-80 shadow-xs pointer-events-none"
                    style={{
                      backgroundColor: currentPackaging.ribbonColor.includes('نبيتي') ? '#7E1D3B' : currentPackaging.ribbonColor.includes('ذهبي') ? '#D4AF37' : '#FFFFFF',
                    }}
                  />

                  {/* Stamp Container with Official Celebre Emblem */}
                  <div className="relative z-10 p-2 rounded-xl bg-white/95 backdrop-blur-xs border border-[#C89B3C] shadow-sm max-w-[200px]">
                    <CelebreLogo variant="box-stamp" className="scale-90" />
                  </div>

                  {/* Custom Card Tag attached to ribbon */}
                  {cardText.trim() && (
                    <div className="relative z-10 mt-2 px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-[#C89B3C] text-[10px] font-semibold text-[#5C1027] shadow-xs max-w-xs truncate">
                      💌 {cardText}
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[#7A5D2E] font-medium mt-2">
                  ✨ يُطبع كارت التهنئة وشعار سيلبر بدقة عالية على كل عبوة مجاناً
                </div>
              </div>

              {/* Items in Box Count */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#E5D2BA]">
                  <span>عدد الأصناف داخل العبوة:</span>
                  <span className="font-bold font-mono text-white">{selectedItemsList.length} أصناف</span>
                </div>
                <div className="flex justify-between text-[#E5D2BA]">
                  <span>إجمالي القطع بالعبوة:</span>
                  <span className="font-bold font-mono text-white">
                    {selectedItemsList.reduce((sum, s) => sum + s.count, 0)} قطعة
                  </span>
                </div>
                <div className="flex justify-between text-[#E5D2BA]">
                  <span>شريط الستان:</span>
                  <span className="font-bold text-[#FFDF9E]">{currentPackaging.ribbonColor}</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="p-3.5 rounded-2xl bg-[#420A1A] border border-[#C89B3C]/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#EAD8BD]">
                  <span>الكمية المطلوبة (عبوة):</span>
                  {discountRate > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#2E7D32] text-white text-[10px] font-bold">
                      خصم كميات {discountRate * 100}% 🎉
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setBoxesCount(Math.max(25, boxesCount - 10))}
                    className="p-2 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min={25}
                    step={5}
                    value={boxesCount}
                    onChange={(e) => setBoxesCount(Math.max(25, parseInt(e.target.value) || 25))}
                    className="w-24 text-center font-mono font-black text-lg bg-transparent text-[#FFDF9E] focus:outline-none"
                  />

                  <button
                    onClick={() => setBoxesCount(boxesCount + 10)}
                    className="p-2 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="pt-2 border-t border-[#82213D] space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#EAD8BD]">سعر العبوة الفردية:</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-[#FFDF9E] font-mono">{finalPricePerBox}</span>
                    <span className="text-xs text-white">ج.م / العبوة</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-[#82213D]/60">
                  <span className="text-xs font-bold text-[#EAD8BD]">الإجمالي لـ ({boxesCount} عبوة):</span>
                  <div className="text-2xl font-black text-[#FFDF9E] font-mono">
                    {grandTotal.toLocaleString()} <span className="text-xs font-normal text-white">ج.م</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C06E] text-[#2C0A15] font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>إضافة العبوات إلى السلة</span>
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>طلب مباشر عبر واتساب (01284484868)</span>
                </button>
              </div>

            </div>

            {/* Guarantee Tag */}
            <div className="p-3 rounded-2xl bg-[#FAF0E1] border border-[#E3D6C1] text-[11px] text-[#635547] text-center">
              ✨ التوصيل يتم في حقائب حرارية مخصصة مع مناديل معطرة وشوك فاخرة لكل عبوة
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
