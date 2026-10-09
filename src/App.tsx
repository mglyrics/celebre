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

export const App: React.FC = () => {
  // Navigation: "home" | "menu" | "booking"
  const [activePage, setActivePage] = useState<"home" | "menu" | "booking">("home");

  // Menu items from Database
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch the 18 Sales from Database via /api/public/menu
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/public/menu");
        if (!res.ok) {
          throw new Error("فشل تحميل قائمة الوجبات من قاعدة البيانات");
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.menu)) {
          setMenuItems(data.menu);
        } else {
          throw new Error(data.message || "استجابة غير صحيحة من الخادم");
        }
      } catch (err: any) {
        console.error("Error loading public menu:", err);
        setError("تعذر تحميل قائمة الوجبات حالياً. يرجى التحقق من الاتصال بالإنترنت.");
      } finally {
        setLoading(false);
      }
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
    </div>
  );
};
