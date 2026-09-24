import React, { useState } from "react";
import confetti from "canvas-confetti";
import { CateringPackage, CartItem, Order, DrinkModificationId } from "./types";
import { CATERING_PACKAGES } from "./data/cateringData";

import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { PackagesSection } from "./components/PackagesSection";
import { PackageDetailModal } from "./components/PackageDetailModal";
import { OrderModal } from "./components/OrderModal";
import { CartDrawer } from "./components/CartDrawer";
import { EventCalculator } from "./components/EventCalculator";
import { AiCateringAdvisor } from "./components/AiCateringAdvisor";
import { GalleryShowcase } from "./components/GalleryShowcase";
import { WhyCelebre } from "./components/WhyCelebre";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { FaqSection } from "./components/FaqSection";
import { Footer } from "./components/Footer";
import { InvoiceModal } from "./components/InvoiceModal";
import { PrivacyPolicyModal } from "./components/PrivacyPolicyModal";
import { FloatingQuickBar } from "./components/FloatingQuickBar";

export const App: React.FC = () => {
  const [packages] = useState<CateringPackage[]>(CATERING_PACKAGES);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals state
  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<CateringPackage | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Cart operations
  const handleAddToCart = (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId = "default_juice") => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.package.id === pkg.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
          selectedDrink
        };
        return updated;
      }
      return [...prev, { package: pkg, quantity, selectedDrink }];
    });
    setIsCartOpen(true);
  };

  // Direct order: bypasses cart browsing and opens OrderModal directly for instant checkout!
  const handleDirectOrder = (pkg: CateringPackage, quantity: number, selectedDrink: DrinkModificationId = "default_juice") => {
    setCart([{ package: pkg, quantity, selectedDrink }]);
    setIsOrderModalOpen(true);
  };

  const handleUpdateQuantity = (packageId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(packageId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.package.id === packageId ? { ...item, quantity } : item
      )
    );
  };

  const handleUpdateDrink = (packageId: string, drink: DrinkModificationId) => {
    setCart((prev) =>
      prev.map((item) =>
        item.package.id === packageId ? { ...item, selectedDrink: drink } : item
      )
    );
  };

  const handleRemoveItem = (packageId: string) => {
    setCart((prev) => prev.filter((item) => item.package.id !== packageId));
  };

  const handleCompleteOrder = (order: Order) => {
    setLastOrder(order);
    setCart([]);
    setIsInvoiceOpen(true);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleScrollToPackages = () => {
    const el = document.getElementById("packages-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#221B17]">
      {/* Navbar with Slogan */}
      <Navbar
        cartCount={cart.reduce((sum, it) => sum + it.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onScrollToPackages={handleScrollToPackages}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with Quick Price Simulator (Flexible meal count) */}
        <Hero
          onExplorePackages={handleScrollToPackages}
          onOpenAdvisor={() => setIsAdvisorOpen(true)}
        />

        {/* Packages Section (12 meals, expandable details accordion, in-card drink customizer, in-card quantity > 300 flexible input, 1-click order) */}
        <PackagesSection
          packages={packages}
          onSelectPackage={(pkg) => setSelectedPackageForDetail(pkg)}
          onAddToCart={handleAddToCart}
          onDirectOrder={handleDirectOrder}
        />

        {/* Gallery Showcase of gold carton boxes and mosque distributions */}
        <GalleryShowcase />

        {/* Why Celebre Value Pillars */}
        <WhyCelebre />

        {/* Verified Customer Reviews */}
        <TestimonialsSection />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      {/* Floating Quick Bar for mobile & desktop immediate access */}
      <FloatingQuickBar
        cartCount={cart.reduce((sum, it) => sum + it.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onScrollToPackages={handleScrollToPackages}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
      />

      {/* Modals */}
      <PackageDetailModal
        packageItem={selectedPackageForDetail}
        onClose={() => setSelectedPackageForDetail(null)}
        onAddToCart={handleAddToCart}
        onDirectOrder={handleDirectOrder}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateDrink={handleUpdateDrink}
        onRemoveItem={handleRemoveItem}
        onProceedToOrder={() => {
          setIsCartOpen(false);
          setIsOrderModalOpen(true);
        }}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateDrink={handleUpdateDrink}
        onCompleteOrder={handleCompleteOrder}
      />

      <EventCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        packages={packages}
        onSelectPackageForOrder={(pkg, count) => {
          handleDirectOrder(pkg, count);
        }}
      />

      <AiCateringAdvisor
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        packages={packages}
        onSelectSuggestedPackage={(pkg, count) => {
          handleDirectOrder(pkg, count);
        }}
      />

      <InvoiceModal
        order={lastOrder}
        onClose={() => setIsInvoiceOpen(false)}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};
