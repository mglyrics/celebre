import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { PublicMenuItem, BookingOrderResult } from "./types/publicMenu";
import { PublicNavbar } from "./components/public/PublicNavbar";
import { PublicHome } from "./components/public/PublicHome";
import { PublicMenu } from "./components/public/PublicMenu";
import { OfferDetailsModal } from "./components/public/OfferDetailsModal";
import { PublicBookingForm } from "./components/public/PublicBookingForm";
import { BookingConfirmationModal } from "./components/public/BookingConfirmationModal";
import { PublicFooter } from "./components/public/PublicFooter";
import { AdminOrderManagement } from "./components/admin/AdminOrderManagement";
import { OFFICIAL_18_MENU_ITEMS } from "./data/fallbackMenu";

export const App: React.FC = () => {
  // Navigation: "home" | "menu" | "booking"
  const [activePage, setActivePage] = useState<"home" | "menu" | "booking">("home");

  // Menu items initialized with official 18 products so they are always available
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>(OFFICIAL_18_MENU_ITEMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected item for Offer Details Modal
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<PublicMenuItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Pre-selected menu code for Booking Form
  const [selectedMenuCodeForBooking, setSelectedMenuCodeForBooking] = useState<string | null>(null);

  // Last completed preliminary booking
  const [lastBookingOrder, setLastBookingOrder] = useState<BookingOrderResult | null>(null);
  const [lastWhatsappLink, setLastWhatsappLink] = useState<string | undefined>(undefined);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Admin Order Management state (No link shown on public site, accessed via #admin or key shortcut)
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Fetch the 18 Sales from Database via /api/public/menu with graceful fallback
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/public/menu", {
          headers: { "x-requested-with": "XMLHttpRequest" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.menu) && data.menu.length > 0) {
            setMenuItems(data.menu);
            setError(null);
            return;
          }
        }
      } catch (err: any) {
        console.warn("Background fetch of menu items encountered an issue, preserving official 18 items fallback:", err);
      }
      // Ensure error is cleared so 18 items always render cleanly
      setError(null);
    };

    fetchMenu();
  }, []);

  // Sync hash routing (#home, #menu, #booking, and hidden #admin)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace("#", "");
      const search = window.location.search.toLowerCase();

      if (hash === "admin" || hash === "dashboard" || search.includes("admin")) {
        setIsAdminOpen(true);
      } else if (hash === "menu") {
        setActivePage("menu");
        setIsAdminOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "booking" || hash === "book") {
        setActivePage("booking");
        setIsAdminOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (hash === "home" || hash === "") {
        setActivePage("home");
        setIsAdminOpen(false);
      }
    };

    // Secret shortcut for admin: Ctrl+Shift+A or Alt+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") || (e.altKey && e.key.toLowerCase() === "a")) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navigateTo = (page: "home" | "menu" | "booking") => {
    setActivePage(page);
    window.location.hash = `#${page}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenDetails = (item: PublicMenuItem) => {
    setSelectedItemForDetails(item);
    setIsDetailsOpen(true);
  };

  const handleSelectForBooking = (code: string) => {
    setSelectedMenuCodeForBooking(code);
    setIsDetailsOpen(false);
    navigateTo("booking");
  };

  const handleBookingSuccess = (order: BookingOrderResult, whatsappLink?: string) => {
    setLastBookingOrder(order);
    setLastWhatsappLink(whatsappLink);
    setIsConfirmationOpen(true);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#721832", "#C89B3C", "#25D366", "#FAF7F2"],
      });
    } catch {}
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#FAF7F2] text-[#221B17] font-['Alexandria',sans-serif] selection:bg-[#721832] selection:text-white" dir="rtl">
      {/* Public Navbar - Strictly no admin URL displayed */}
      <PublicNavbar
        activePage={activePage}
        onNavigate={navigateTo}
        selectedMenuCode={selectedMenuCodeForBooking}
      />

      {/* Main Pages Router */}
      <main className="flex-1">
        {activePage === "home" && (
          <PublicHome
            menuItems={menuItems}
            onNavigate={navigateTo}
            onSelectForDetails={handleOpenDetails}
            onSelectForBooking={handleSelectForBooking}
          />
        )}

        {activePage === "menu" && (
          <PublicMenu
            menuItems={menuItems}
            loading={loading}
            error={error}
            onSelectForDetails={handleOpenDetails}
            onSelectForBooking={handleSelectForBooking}
          />
        )}

        {activePage === "booking" && (
          <div className="py-8 sm:py-12">
            <PublicBookingForm
              menuItems={menuItems}
              initialMenuCode={selectedMenuCodeForBooking}
              onBookingSuccess={handleBookingSuccess}
              onCancel={() => navigateTo("menu")}
            />
          </div>
        )}
      </main>

      {/* Public Footer - Strictly no admin URL displayed */}
      <PublicFooter onNavigate={navigateTo} />

      {/* Modals */}
      {/* 1. Offer Details Modal */}
      <OfferDetailsModal
        item={selectedItemForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onSelectForBooking={handleSelectForBooking}
      />

      {/* 2. Booking Confirmation Modal */}
      <BookingConfirmationModal
        order={lastBookingOrder}
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onNewBooking={() => {
          setIsConfirmationOpen(false);
          navigateTo("booking");
        }}
        whatsappLink={lastWhatsappLink}
      />

      {/* 3. Admin Order Management Dashboard (Protected by RBAC + OTP Auth) */}
      <AdminOrderManagement
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          try {
            if (window.location.hash.toLowerCase() === "#admin" || window.location.hash.toLowerCase() === "#dashboard") {
              window.history.replaceState(null, "", window.location.pathname);
            }
          } catch {}
        }}
        menuItems={menuItems}
      />
      {/* Floating Discreet Admin Dashboard Access Button */}
      <aside aria-label="بوابة الإدارة" className="fixed bottom-4 left-4 z-30">
        <button
          onClick={() => {
            setIsAdminOpen(true);
            window.location.hash = "#admin";
          }}
          className="group flex items-center gap-2 bg-[#1F1714]/90 hover:bg-[#721832] text-white px-3.5 py-2 rounded-2xl shadow-lg border border-[#C89B3C]/40 backdrop-blur-md transition-all text-xs font-bold cursor-pointer hover:scale-105 active:scale-95"
          title="دخول لوحة تحكم الإدارة (اختصار: Ctrl+Shift+A أو Alt+A)"
        >
          <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse" />
          <span className="text-[#F4EEDB]">لوحة الإدارة التنفيذية</span>
          <span className="text-[10px] text-[#C89B3C] bg-white/10 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
            Admin RTL
          </span>
        </button>
      </aside>
    </div>
  );
};
