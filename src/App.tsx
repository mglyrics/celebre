import React, { useState } from 'react';
import { CateringPackage, OrderItem, OrderSubmission } from './types';
import { CATERING_PACKAGES } from './data/cateringData';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PackagesSection } from './components/PackagesSection';
import { PackageDetailModal } from './components/PackageDetailModal';
import { EventCalculator } from './components/EventCalculator';
import { AiCateringAdvisor } from './components/AiCateringAdvisor';
import { GalleryShowcase } from './components/GalleryShowcase';
import { WhyCelebre } from './components/WhyCelebre';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { OrderModal } from './components/OrderModal';
import { InvoiceModal } from './components/InvoiceModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { MessageCircle, Phone, ShoppingBag, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  
  const [activePackageModal, setActivePackageModal] = useState<CateringPackage | null>(null);
  const [currentInvoiceOrder, setCurrentInvoiceOrder] = useState<OrderSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check URL hash for direct navigation to privacy policy
  React.useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#privacy' || window.location.hash === '#terms') {
        setIsPrivacyOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Cart total calculations
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddToCart = (item: OrderItem) => {
    setCartItems(prev => {
      // If exact same ID exists, increase quantity
      const existingIdx = prev.findIndex(p => p.id === item.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + item.quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: newQty * updated[existingIdx].pricePerBox,
        };
        return updated;
      }
      return [...prev, item];
    });

    showToast(`تمت إضافة ${item.quantity} عبوة (${item.name}) إلى السلة بنجاح! 🌸`);
    
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.85, x: 0.15 },
      colors: ['#5C1027', '#D4AF37', '#FAF7F2']
    });
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQty,
          totalPrice: newQty * item.pricePerBox,
        };
      }
      return item;
    }));
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    showToast('تم إزالة الصنف من السلة');
  };

  const handleOrderSuccess = (order: OrderSubmission) => {
    setCurrentInvoiceOrder(order);
    setCartItems([]);
    setIsOrderModalOpen(false);
    setIsInvoiceModalOpen(true);
    showToast(`تهانينا! تم تسجيل طلب الحجز بنجاح برقم ${order.id}`);
  };

  const handleSelectPackageFromList = (pkg: CateringPackage) => {
    setActivePackageModal(pkg);
  };

  const handleDirectOrderFromPackage = (pkg: CateringPackage) => {
    setActivePackageModal(pkg);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C0A15] font-['Alexandria',sans-serif] selection:bg-[#5C1027] selection:text-[#FFDF9E]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-6 z-50 max-w-sm bg-[#5C1027] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#D4AF37] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#2C0A15] flex items-center justify-center font-bold flex-shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold leading-snug">{toastMessage}</p>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-grow">
        {/* 1. Hero Section */}
        <Hero
          onOpenAdvisor={() => setIsAdvisorOpen(true)}
          onExplorePackages={() => {
            const el = document.getElementById('packages-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 2. Packages Section */}
        <PackagesSection
          onAddToCart={handleAddToCart}
        />

        {/* 3. Smart Catering Guest & Budget Calculator */}
        <EventCalculator
          onAddToCart={handleAddToCart}
          onOpenAdvisor={() => setIsAdvisorOpen(true)}
        />

        {/* 5. Why Celebre Section */}
        <WhyCelebre />

        {/* 6. Gallery & Live Events Showcase */}
        <GalleryShowcase />

        {/* 7. Testimonials & Client Reviews */}
        <TestimonialsSection />

        {/* 8. Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)} />

      {/* Floating Action Buttons (WhatsApp & Quick Call) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Floating Cart Button (if items exist) */}
        {totalCartCount > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-3.5 rounded-full bg-[#5C1027] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative cursor-pointer border border-[#D4AF37]"
            title="عرض سلة الحجز"
          >
            <ShoppingBag className="w-6 h-6 text-[#FFDF9E]" />
            <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#2C0A15] text-[10px] font-black font-mono">
              {totalCartCount}
            </span>
          </button>
        )}

        {/* Floating AI Advisor Button */}
        <button
          onClick={() => setIsAdvisorOpen(true)}
          className="p-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C89B3C] text-[#2C0A15] shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/40"
          title="مستشار سيلبر الذكي"
        >
          <Sparkles className="w-6 h-6" />
        </button>

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/201284484868?text=مرحباً%20سيلبر%20(Celebre)%20🌸%20أود%20الاستفسار%20عن%20باقات%20عبوات%20الكاترنج%20للمناسبات"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title="تواصل مباشر عبر واتساب 01284484868"
        >
          <MessageCircle className="w-6 h-6" />
        </a>

        {/* Floating Call Button */}
        <a
          href="tel:01284484868"
          className="p-3.5 rounded-full bg-[#5C1027] text-[#FFDF9E] shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title="اتصال هاتفي 01284484868"
        >
          <Phone className="w-6 h-6" />
        </a>
      </div>

      {/* Modals & Drawers */}
      
      {/* 1. Package Detail Modal */}
      <PackageDetailModal
        packageItem={activePackageModal}
        onClose={() => setActivePackageModal(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 2. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsOrderModalOpen(true);
        }}
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
      />

      {/* 3. Order Checkout Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        items={cartItems}
        onOrderSuccess={handleOrderSuccess}
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
      />

      {/* 4. Invoice Modal */}
      <InvoiceModal
        order={currentInvoiceOrder}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* 5. AI Catering Advisor Modal */}
      <AiCateringAdvisor
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* 6. Privacy Policy & Terms Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => {
          setIsPrivacyOpen(false);
          if (window.location.hash === '#privacy' || window.location.hash === '#terms') {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
      />

    </div>
  );
}
