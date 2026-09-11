import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Truck, 
  Clock, 
  RotateCcw, 
  Wallet, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  MessageCircle,
  FileText,
  Printer,
  ChevronDown
} from 'lucide-react';
import officialLogoTransparent from '../assets/images/celebre_official_logo_transparent.png';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'all' | 'custom_order' | 'deposit' | 'shipping' | 'privacy'>('all');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-[#FAF7F2] rounded-3xl shadow-2xl border-2 border-[#D9C49C] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#5C1027] via-[#4A0A1D] to-[#2A0611] text-white p-5 sm:p-6 relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-12 rounded-2xl bg-white/10 border border-[#C89B3C]/60 p-1 flex items-center justify-center shadow-lg flex-shrink-0">
                <img
                  src={officialLogoTransparent}
                  alt="شعار سيلبر الرسمي"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#E5C06E]" />
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    سياسة الخصوصية وشروط التعاقد الرسمية
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#FFDF9E] mt-0.5 font-medium">
                  وثيقة الشروط والأحكام المنظمة لإنتاج وتوريد عبوات كاترنج سيلبر (Celebre)
                </p>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#FFDF9E] border border-[#C89B3C]/40 transition-colors cursor-pointer"
              title="طباعة وثيقة الشروط والخصوصية"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوثيقة</span>
            </button>
          </div>

          {/* Quick Highlight Ticker */}
          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#FFE8C2]">
            <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1.5 rounded-lg">
              <span className="text-[#FFB74D]">⚠️</span>
              <span><strong>غير قابل للإرجاع:</strong> تصنيع وتخصيص حصري للعميل</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1.5 rounded-lg">
              <span className="text-[#81C784]">💳</span>
              <span><strong>عربون 50%:</strong> شرط أساسي لبدء تحريك وتشغيل الطلب</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1.5 rounded-lg">
              <span className="text-[#64B5F6]">🚚</span>
              <span><strong>شحن مجاني:</strong> للطلبات فوق 500 عبوة (مدينة بني سويف وشرق النيل فقط)</span>
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="bg-[#EFE7D8] px-4 py-2.5 border-b border-[#D9C49C] flex items-center gap-2 overflow-x-auto text-xs font-bold text-[#5C1027] flex-shrink-0">
          <span className="text-[#8C5E13] hidden sm:inline ml-1">تصفح البنود:</span>
          {[
            { id: 'all', label: 'جميع البنود والشروط' },
            { id: 'custom_order', label: 'عدم إمكانية الإرجاع' },
            { id: 'deposit', label: 'عربون الـ 50% وبدء التشغيل' },
            { id: 'shipping', label: 'الشحن والتوصيل المجاني' },
            { id: 'privacy', label: 'حماية وسرية البيانات' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#5C1027] text-white shadow-xs'
                  : 'bg-white/70 text-[#5C1027] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-[#3D3228] text-xs sm:text-sm leading-relaxed">

          {/* Section 1: Non-refundable / Custom Production */}
          {(activeTab === 'all' || activeTab === 'custom_order') && (
            <div className="bg-white rounded-2xl p-5 border-2 border-[#E32636]/30 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#E32636]" />
              
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FDE8E8] text-[#C5221F] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  <RotateCcw className="w-5 h-5" />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#FDE8E8] text-[#9B1C1C] text-[10px] font-black uppercase">
                      بند جوهري ملزم
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#5C1027]">
                      1. سياسة عدم إمكانية الإرجاع أو الاستبدال (الإنتاج المخصص)
                    </h3>
                  </div>

                  <p className="text-justify leading-relaxed">
                    <strong>نلفت انتباه عملائنا الكرام إلى أنه لا يمكن نهائياً إلغاء أو إرجاع أو استبدال الأوردر بعد تأكيده وبدء العمل عليه.</strong>
                  </p>

                  <div className="bg-[#FFF9F5] p-3.5 rounded-xl border border-[#F2D0B6] space-y-2 text-xs text-[#5D3A20]">
                    <div className="font-bold flex items-center gap-1.5 text-[#B24E10]">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>أسباب وتفاصيل هذا البند:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 pr-1 leading-relaxed">
                      <li>
                        <strong>الإنتاج المخصص الفوري:</strong> يقوم المصنع والمطبخ المركزي بإنتاج وتجهيز وطهي الوجبات والمخبوزات والحلويات خصيصاً وفورياً لكل عميل بناءً على اختياراته وتاريخ وساعة مناسبته.
                      </li>
                      <li>
                        <strong>تخصيص وتجهيز العبوات الفاخرة:</strong> يتم تعبئة وإعداد العلب الفاخرة للوجبات بالمواصفات والأعداد المطلوبة للمناسبة بصورة فورية ومباشرة لا تقبل إعادة الاستخدام مع أي عميل آخر.
                      </li>
                      <li>
                        <strong>معايير السلامة والصحة الغذائية:</strong> حرصاً على صحة ضيوفكم الكرام، تمنع اللوائح الصحية استرجاع أو إعادة تداول أي أغذية تم تجهيزها وتغليفها وخروجها من المطبخ المركزي.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: 50% Deposit Requirement */}
          {(activeTab === 'all' || activeTab === 'deposit') && (
            <div className="bg-white rounded-2xl p-5 border-2 border-[#C89B3C]/60 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#C89B3C]" />

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0D7] text-[#8C5E13] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  <Wallet className="w-5 h-5" />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF0D7] text-[#8C5E13] text-[10px] font-black uppercase">
                      شرط تفعيل أمر التشغيل
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#5C1027]">
                      2. شرط سداد عربون 50% لبدء تجهيز وتحريك الطلب
                    </h3>
                  </div>

                  <p className="text-justify leading-relaxed">
                    <strong>لا يتم تحريك الطلب أو إدراجه ضمن جدول التشغيل بالمصنع إلا بعد سداد 50% من قيمة التعاقد الإجمالية.</strong>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DEC9]">
                      <div className="font-bold text-xs text-[#5C1027] mb-1">📌 دور العربون (50%):</div>
                      <p className="text-[11px] text-[#55473B] leading-relaxed">
                        يُعد بمثابة تأكيد نهائي لتثبيت تاريخ وموعد المناسبة، وبناءً عليه يتم حجز خط الإنتاج وشراء الخامات الطازجة وتجهيز التعبئة الفاخرة للوجبات.
                      </p>
                    </div>

                    <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DEC9]">
                      <div className="font-bold text-xs text-[#5C1027] mb-1">💵 سداد المبلغ المتبقي (50%):</div>
                      <p className="text-[11px] text-[#55473B] leading-relaxed">
                        يتم سداد النصف المتبقي إما قبل موعد خروج سيارة التوصيل المبردة من المصنع أو كاش لمندوب التوصيل عند استلام ومطابقة العبوات بالقاعة.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FAF0E1] p-3 rounded-xl border border-[#D9C49C] text-xs space-y-1">
                    <span className="font-bold text-[#5C1027]">💳 قنوات السداد الرسمية المعتمدة لتحويل العربون:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="bg-white p-2.5 rounded-lg border border-[#D9C49C] text-center font-sans">
                        <div className="font-bold text-[#5C1027]">⚡ إنستاباي (InstaPay)</div>
                        <div className="text-[10px] text-gray-500 font-mono">01284484868</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#D9C49C] text-center font-sans">
                        <div className="font-bold text-[#5C1027]">🏦 حساب بنكي معتمد</div>
                        <div className="text-[10px] text-gray-500">البنك الأهلي المصري / CIB</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#D9C49C] text-center font-sans">
                        <div className="font-bold text-[#5C1027]">💵 إيداع نقدي / كاش</div>
                        <div className="text-[10px] text-gray-500">بالفرع المعتمد أو للمندوب</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Shipping policy & Free delivery rules */}
          {(activeTab === 'all' || activeTab === 'shipping') && (
            <div className="bg-white rounded-2xl p-5 border-2 border-[#1E88E5]/40 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#1E88E5]" />

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  <Truck className="w-5 h-5" />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#E3F2FD] text-[#1565C0] text-[10px] font-black uppercase">
                      نظام التوصيل واللوجستيات
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#5C1027]">
                      3. سياسة الشحن والتوصيل وشروط الشحن المجاني
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-[#FFF3E0] border border-[#FFE0B2] rounded-xl text-xs text-[#E65100]">
                      <strong>🚚 الشحن غير مشمول في سعر العرض المعلن:</strong>
                      <p className="mt-1 leading-relaxed text-[#5D4037]">
                        توضح إدارة سيلبر أن أسعار الباقات الغذائية المعلنة بالموقع ووسائل التواصل تشمل تكلفة تجهيز العبوات والمكونات والتغليف الفاخر فقط، ولا تتضمن تكلفة الشحن أو سيارات النقل الحرارية المجهزة.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#E8F5E9] border-2 border-[#81C784] rounded-xl text-xs">
                      <div className="flex items-center gap-1.5 text-[#2E7D32] font-black text-sm mb-1">
                        <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                        <span>شرط الشحن المجاني ونطاق التوصيل الحصري:</span>
                      </div>
                      <p className="text-[#1B5E20] leading-relaxed">
                        <strong>الطلبات التي تتجاوز أكثر من 500 عبوة فقط هي التي تستحق وتستفيد من الشحن المجاني بالكامل، وذلك مقتصر حصرياً داخل نطاق (مدينة بني سويف وشرق النيل ببني سويف فقط).</strong>
                      </p>
                      <div className="mt-2 p-2.5 bg-white/85 rounded-xl border border-[#A5D6A7] text-[11px] text-[#2E7D32] font-semibold space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <span>📍 النطاق الحصري المعتمد للتوصيل والشحن المجاني:</span>
                        </div>
                        <div className="text-[11px] text-[#1B5E20] leading-relaxed">
                          مدينة بني سويف + شرق النيل ببني سويف فقط (يُستثنى تماماً ولا يشمل قرى أو مراكز بني سويف أو محافظة الفيوم).
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#55473B]">
                      * الطلبات الأقل من 500 عبوة يتم احتساب قيمة شحن رمزية حسب بعد المسافة وطبيعة القاعة/المسجد، ويتم إخطار العميل بها وتدوينها مسبقاً في الفاتورة الرسمية قبل إتمام الحجز.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Data Privacy & Security */}
          {(activeTab === 'all' || activeTab === 'privacy') && (
            <div className="bg-white rounded-2xl p-5 border-2 border-[#2E7D32]/40 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#2E7D32]" />

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-black uppercase">
                      الأمان والخصوصية
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#5C1027]">
                      4. سياسة جمع وحماية البيانات وسرية المناسبات
                    </h3>
                  </div>

                  <p className="text-justify leading-relaxed">
                    تلتزم شركة سيلبر (Celebre) بأعلى معايير الأمان لحماية بيانات العملاء وخصوصية مناسباتهم العائلية والاجتماعية:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DEC9]">
                      <span className="font-bold text-[#5C1027]">📁 ما هي البيانات التي نجمعها؟</span>
                      <p className="text-[#55473B] mt-0.5">
                        نجمع فقط البيانات الضرورية لتنفيذ وتوصيل الطلب: (اسم صاحب الحجز، أرقام الهاتف والواتساب، اسم ومكان المسجد أو القاعة، تاريخ وساعة المناسبة، وإيصال تحويل العربون).
                      </p>
                    </div>

                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DEC9]">
                      <span className="font-bold text-[#5C1027]">🔒 التزام السرية وعدم مشاركة البيانات:</span>
                      <p className="text-[#55473B] mt-0.5">
                        نتعهد تعهداً قاطعاً بعدم بيع أو تأجير أو مشاركة أي من بياناتكم أو أرقام هواتفكم مع أي جهة خارجية أو شركات إعلانية، وتُستخدم المعلومات حصرياً للتنسيق اللوجستي لمناسبتكم وإصدار الفاتورة الرسمية.
                      </p>
                    </div>

                    <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DEC9]">
                      <span className="font-bold text-[#5C1027]">📸 خصوصية تصوير المناسبات:</span>
                      <p className="text-[#55473B] mt-0.5">
                        في حال توثيق أي صور للعبوات بالقاعة أو المعرض، نلتزم بتصوير العبوات والتنسيقات فقط، ولا نقوم بنشر أي صور شخصية للحضور أو أصحاب الحفل دون إذن كتابي مسبق وصريح.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Delivery timings & Venue arrival */}
          <div className="bg-[#FAF3E5] rounded-2xl p-4 border border-[#C89B3C]/50 flex items-start gap-3 text-xs">
            <Clock className="w-5 h-5 text-[#8C5E13] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#5C1027]">⏰ الالتزام بمواعيد التوصيل للقاعات والمساجد:</span>
              <p className="text-[#5E4C3C] leading-relaxed">
                يصل فريق التوصيل قبل بدء المناسبة بمدة تتراوح بين 30 إلى 60 دقيقة لضمان تسليم العبوات دافئة أو مبردة بحسب نوع الوجبة، والتحقق من العدد الكامل مع مسؤول القاعة أو صاحب الحجز مع تسليم الفاتورة الأصلية.
              </p>
            </div>
          </div>

          {/* Contact / Help info */}
          <div className="p-4 rounded-2xl bg-white border border-[#D9C49C] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-[#5C1027]">لديك استفسار حول سياسة التعاقد أو ترغب بتنسيق طلب خاص؟</span>
              <p className="text-gray-600 text-[11px] mt-0.5">فريق خدمة العملاء والشؤون القانونية متاح للرد على مدار الساعة.</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:01284484868"
                className="px-3 py-1.5 rounded-xl bg-[#5C1027] text-white font-bold flex items-center gap-1.5 hover:bg-[#721832] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#E5C06E]" />
                <span dir="ltr">01284484868</span>
              </a>

              <a
                href="https://wa.me/201284484868?text=مرحباً%20سيلبر%2C%20أود%20الاستفسار%20عن%20شروط%20التعاقد%20وسياسة%20الخصوصية"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold flex items-center gap-1.5 hover:bg-[#1E7E34] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF0E1] px-5 py-4 border-t border-[#D9C49C] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-[#705E4D]">
            تم التحديث والاعتماد رسمياً بواسطة الإدارة القانونية لعلامة <strong>Celebre Catering</strong>.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center"
            >
              فهمت وموافق على الشروط
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
