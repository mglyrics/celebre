import React, { useState, useEffect, useRef } from "react";
import { 
  X, Lock, User, Key, Plus, Search, Filter, 
  Printer, Image, Copy, Check, Edit3, Trash2, Save, 
  RefreshCw, Calendar, Phone, DollarSign, 
  CheckCircle2, AlertCircle, Clock, FileSpreadsheet, 
  ShieldCheck, ArrowUpDown, Eye, CheckSquare, Sparkles, ChevronDown,
  Shield, Smartphone, Send, MessageCircle, Settings, ShieldAlert
} from "lucide-react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { AdminBooking } from "../types";
import { CATERING_PACKAGES } from "../data/cateringData";
import { CelebreLogo } from "./CelebreLogo";

interface AdminBookingsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "celebre_admin_bookings_cache";
const AUTH_KEY = "celebre_admin_authenticated";

export const AdminBookingsDashboard: React.FC<AdminBookingsDashboardProps> = ({
  isOpen,
  onClose
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === "true";
  });
  const [authStep, setAuthStep] = useState<"credentials" | "register" | "otp">("credentials");
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [adminDisplayName, setAdminDisplayName] = useState<string>("إدارة المبيعات");
  const [registeredMaskedPhone, setRegisteredMaskedPhone] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [registerNameInput, setRegisterNameInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // OTP Timers & Dispatch
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [activeWhatsappLink, setActiveWhatsappLink] = useState<string>("");

  // Check auth status from server on mount/open
  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/admin/auth/status");
      const data = await res.json();
      if (data.success) {
        setIsConfigured(Boolean(data.isConfigured));
        if (data.adminName) setAdminDisplayName(data.adminName);
        if (data.registeredPhone) setRegisteredMaskedPhone(data.registeredPhone);
        if (!data.isConfigured) {
          setAuthStep("register");
        } else {
          setAuthStep("credentials");
        }
      }
    } catch (e) {
      console.error("Auth status check failed:", e);
    }
  };

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      checkAuthStatus();
    }
  }, [isOpen, isAuthenticated]);

  // Security Credentials Settings Modal
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);
  const [newPhoneSetting, setNewPhoneSetting] = useState("");
  const [newPasswordSetting, setNewPasswordSetting] = useState("");
  const [securityNotice, setSecurityNotice] = useState("");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // OTP 5-minute countdown timer
  useEffect(() => {
    if (authStep !== "otp" || !otpExpiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [authStep, otpExpiresAt]);

  // Resend OTP cooldown timer (60s)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Bookings Data State
  const [bookings, setBookings] = useState<AdminBooking[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Exclude mock demo bookings
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((b: any) => !["CEL-BK-101", "CEL-BK-102", "CEL-BK-103", "CEL-BK-104"].includes(b.id));
          return cleaned;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "total" | "quantity">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Edit / Add Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);
  const [isNewBooking, setIsNewBooking] = useState(false);

  // Feedback states
  const [copiedTextNotice, setCopiedTextNotice] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Ref for table capture
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Auto-sync cache
  const updateBookingsState = (newBookings: AdminBooking[]) => {
    setBookings(newBookings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookings));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch bookings from server
  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        // Strip any legacy demo mock IDs
        const cleaned = data.bookings.filter((b: any) => !["CEL-BK-101", "CEL-BK-102", "CEL-BK-103", "CEL-BK-104"].includes(b.id));
        updateBookingsState(cleaned);
      }
    } catch (e) {
      console.error("Failed to load bookings from API, using cached data:", e);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchBookings();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Register New Admin Member for the first time
  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginNotice("");
    setIsRegistering(true);

    const cleanPhone = phoneInput.trim();
    const cleanPassword = passwordInput.trim();
    const cleanName = registerNameInput.trim() || "عضو إدارة المبيعات";

    if (!cleanPhone || !cleanPassword) {
      setLoginError("يرجى إدخال رقم هاتف الإدارة وكلمة المرور.");
      setIsRegistering(false);
      return;
    }

    if (cleanPhone.length < 9) {
      setLoginError("رقم الهاتف غير صالح، يرجى كتابة رقم صحيح.");
      setIsRegistering(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          password: cleanPassword,
          name: cleanName
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsConfigured(true);
        setAdminDisplayName(cleanName);
        if (data.maskedPhone) setRegisteredMaskedPhone(data.maskedPhone);
        setLoginNotice("تم تسجيل عضو إدارة المشروع بنجاح! سيتم الآن إرسال كلمة السر المؤقتة (OTP) لرقمك المسجل عبر واتساب.");
        
        // Directly request OTP right after successful registration
        const otpRes = await fetch("/api/admin/auth/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleanPhone,
            password: cleanPassword
          })
        });
        const otpData = await otpRes.json();
        if (otpData.success) {
          setAuthStep("otp");
          setOtpExpiresAt(otpData.expiresAt);
          setRemainingSeconds(Math.max(0, Math.floor((otpData.expiresAt - Date.now()) / 1000)));
          setCooldownSeconds(60);
          setActiveWhatsappLink(otpData.whatsappLink || "");
        } else {
          setAuthStep("credentials");
        }
      } else {
        setLoginError(data.message || "فشل تسجيل عضو الإدارة.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Step 1: Request Login & Dispatch OTP to Admin Phone
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginNotice("");
    setIsRequestingOtp(true);

    const cleanPhone = phoneInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanPhone || !cleanPassword) {
      setLoginError("يرجى إدخال رقم هاتف الإدارة وكلمة المرور.");
      setIsRequestingOtp(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          password: cleanPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setAuthStep("otp");
        setOtpExpiresAt(data.expiresAt);
        setRemainingSeconds(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
        setCooldownSeconds(60);
        setActiveWhatsappLink(data.whatsappLink || "");
        setLoginNotice(`تم إرسال كلمة السر المؤقتة بنجاح لرقم الإدارة (${data.maskedPhone || cleanPhone}) عبر رسالة واتساب.`);
      } else if (data.notRegistered) {
        setAuthStep("register");
        setLoginError(data.message);
      } else {
        setLoginError(data.message || "بيانات الدخول غير صحيحة.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("تعذر الاتصال بخادم الأمان. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Step 2: Verify One-Time Temporary Password (OTP)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsVerifyingOtp(true);

    const cleanOtp = otpInput.trim();
    if (!cleanOtp) {
      setLoginError("يرجى إدخال كلمة السر المؤقتة المكونة من 6 أرقام المستلمة على واتساب.");
      setIsVerifyingOtp(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneInput.trim(),
          otp: cleanOtp
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, "true");
        if (data.token) {
          localStorage.setItem("celebre_admin_token", data.token);
        }
        setAuthStep("credentials");
        setOtpInput("");
        fetchBookings();
        showNotice("تم التحقق بنجاح وتأكيد الهوية عبر كلمة السر المؤقتة.");
      } else {
        setLoginError(data.message || "كلمة السر المؤقتة غير صحيحة أو منتهية الصلاحية.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("تعذر التحقق من الرمز المؤقت. يرجى إعادة المحاولة.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return;
    setLoginError("");
    setLoginNotice("");
    try {
      const res = await fetch("/api/admin/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneInput.trim(),
          password: passwordInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setOtpExpiresAt(data.expiresAt);
        setRemainingSeconds(300);
        setCooldownSeconds(60);
        setActiveWhatsappLink(data.whatsappLink || "");
        setLoginNotice("تم توليد وإرسال كلمة سر مؤقتة جديدة بنجاح في رسالة واتساب لرقم الإدارة.");
      } else {
        setLoginError(data.message || "تعذر إعادة إرسال الرمز.");
      }
    } catch (e) {
      console.error(e);
      setLoginError("فشل إعادة الإرسال.");
    }
  };

  // Update Credentials from Settings
  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneSetting.trim() || !newPasswordSetting.trim()) {
      alert("يرجى إدخال رقم الهاتف وكلمة المرور الجديدة.");
      return;
    }
    setIsSavingSecurity(true);
    try {
      const res = await fetch("/api/admin/auth/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPhone: newPhoneSetting.trim(),
          newPassword: newPasswordSetting.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSecurityNotice("تم تحديث بيانات الدخول بنجاح! سيتم إرسال كلمات السر المؤقتة (OTP) لهذا الرقم الجديد في كل مرة دخول.");
        showNotice("تم تحديث بيانات الدخول والأمان بنجاح.");
        setTimeout(() => {
          setIsSecuritySettingsOpen(false);
          setSecurityNotice("");
        }, 2200);
      } else {
        alert(data.message || "فشل تحديث البيانات");
      }
    } catch (e) {
      console.error(e);
      alert("فشل تحديث البيانات");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem("celebre_admin_token");
    setAuthStep("credentials");
    setPhoneInput("");
    setPasswordInput("");
    setOtpInput("");
    showNotice("تم تسجيل الخروج بنجاح.");
  };

  // Show temporary action toast
  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Open Add New Booking
  const handleOpenAddNew = () => {
    const defaultPkg = CATERING_PACKAGES[0]; // Sale-01
    const newRecord: AdminBooking = {
      id: `CEL-BK-${Math.floor(100 + Math.random() * 900)}`,
      customerName: "",
      phone: "",
      occasion: "كتب كتاب وعقد قران",
      eventDate: new Date().toISOString().split("T")[0],
      eventTime: "5:00 مساءً",
      packageCode: defaultPkg.saleCode,
      packageName: defaultPkg.name,
      basePrice: defaultPkg.pricePerBox,
      drinkOption: "juice_included",
      drinkOptionLabel: "عصير بخيرة مشمول",
      drinkPriceDelta: 0,
      unitPrice: defaultPkg.pricePerBox,
      quantity: 100,
      totalPrice: defaultPkg.pricePerBox * 100,
      depositPaid: Math.round((defaultPkg.pricePerBox * 100) * 0.5),
      remainingAmount: Math.round((defaultPkg.pricePerBox * 100) * 0.5),
      paymentStatus: "deposit_paid",
      orderStatus: "confirmed",
      deliveryAddress: "مدينة بني سويف",
      phoneAgreementNotes: "تم الاتفاق تليفونياً على توريد العلب في الموعد المحدد",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingBooking(newRecord);
    setIsNewBooking(true);
    setIsEditModalOpen(true);
  };

  // Open Edit Booking
  const handleOpenEdit = (booking: AdminBooking) => {
    setEditingBooking({ ...booking });
    setIsNewBooking(false);
    setIsEditModalOpen(true);
  };

  // Save Booking (Add or Update)
  const handleSaveBooking = async () => {
    if (!editingBooking) return;
    if (!editingBooking.customerName.trim()) {
      alert("يرجى إدخال اسم صاحب المناسبة");
      return;
    }

    try {
      if (isNewBooking) {
        const res = await fetch("/api/admin/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingBooking)
        });
        const data = await res.json();
        const saved = (data.success && data.booking) ? data.booking : editingBooking;
        updateBookingsState([saved, ...bookings]);
        showNotice(`تمت إضافة حجز "${saved.customerName}" بنجاح.`);
      } else {
        const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingBooking)
        });
        const data = await res.json();
        const saved = (data.success && data.booking) ? data.booking : editingBooking;
        updateBookingsState(bookings.map(b => b.id === saved.id ? saved : b));
        showNotice(`تم تحديث حجز "${saved.customerName}" بنجاح.`);
      }
      setIsEditModalOpen(false);
      setEditingBooking(null);
    } catch (e) {
      console.error("Save error:", e);
      // Fallback local update
      if (isNewBooking) {
        updateBookingsState([editingBooking, ...bookings]);
      } else {
        updateBookingsState(bookings.map(b => b.id === editingBooking.id ? editingBooking : b));
      }
      setIsEditModalOpen(false);
      setEditingBooking(null);
      showNotice("تم حفظ التعديلات محلياً بنجاح.");
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف حجز "${name}" نهائياً من السجل؟`)) return;
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      updateBookingsState(bookings.filter(b => b.id !== id));
      showNotice(`تم حذف حجز "${name}" من السجل.`);
    } catch (e) {
      console.error(e);
      updateBookingsState(bookings.filter(b => b.id !== id));
      showNotice(`تم حذف حجز "${name}".`);
    }
  };

  // Delete All Bookings / Clear Mock Data
  const handleClearAllBookings = async () => {
    if (!confirm("هل أنت متأكد من رغبتك في تفريغ وحذف جميع بيانات الحجوزات نهائياً من السجل؟")) return;
    try {
      await fetch("/api/admin/bookings/reset", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    updateBookingsState([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    showNotice("تم تفريغ وحذف بيانات الحجوزات بنجاح. السجل نظيف بالكامل.");
  };

  // Quick Action 1: Mark fully paid (تم سداد باقي المبلغ)
  const handleQuickPayRemaining = async (booking: AdminBooking) => {
    const updated: AdminBooking = {
      ...booking,
      depositPaid: booking.totalPrice,
      remainingAmount: 0,
      paymentStatus: "fully_paid",
      updatedAt: new Date().toISOString()
    };
    try {
      await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      updateBookingsState(bookings.map(b => b.id === booking.id ? updated : b));
      showNotice(`✅ تم تسجيل سداد باقي المبلغ لحجز "${booking.customerName}" (خالص بالكامل).`);
    } catch (e) {
      console.error(e);
      updateBookingsState(bookings.map(b => b.id === booking.id ? updated : b));
      showNotice(`✅ تم تسجيل سداد كامل المبلغ لحجز "${booking.customerName}".`);
    }
  };

  // Quick Action 2: Mark deposit paid 50% if pending
  const handleQuickPayDeposit = async (booking: AdminBooking) => {
    const half = Math.round(booking.totalPrice * 0.5);
    const updated: AdminBooking = {
      ...booking,
      depositPaid: half,
      remainingAmount: booking.totalPrice - half,
      paymentStatus: "deposit_paid",
      updatedAt: new Date().toISOString()
    };
    try {
      await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      updateBookingsState(bookings.map(b => b.id === booking.id ? updated : b));
      showNotice(`💰 تم تسجيل سداد العربون لحجز "${booking.customerName}" (${half.toLocaleString()} ج).`);
    } catch (e) {
      console.error(e);
      updateBookingsState(bookings.map(b => b.id === booking.id ? updated : b));
      showNotice(`💰 تم تسجيل سداد العربون لحجز "${booking.customerName}".`);
    }
  };

  // Dynamic calculations when selecting a package in the modal
  const handlePackageSelectInModal = (pkgCode: string) => {
    if (!editingBooking) return;
    const found = CATERING_PACKAGES.find(p => p.saleCode === pkgCode);
    if (found) {
      const basePrice = found.pricePerBox;
      const unitPrice = basePrice + editingBooking.drinkPriceDelta;
      const totalPrice = unitPrice * editingBooking.quantity;
      const remainingAmount = Math.max(0, totalPrice - editingBooking.depositPaid);
      setEditingBooking({
        ...editingBooking,
        packageCode: found.saleCode,
        packageName: found.name,
        basePrice,
        unitPrice,
        totalPrice,
        remainingAmount
      });
    }
  };

  // Dynamic calculations when modifying drinks in the modal
  const handleDrinkChangeInModal = (opt: 'juice_included' | 'pepsi_added' | 'no_juice' | 'custom') => {
    if (!editingBooking) return;
    let drinkPriceDelta = 0;
    let drinkOptionLabel = "عصير بخيرة مشمول";
    if (opt === "pepsi_added") {
      drinkPriceDelta = 5;
      drinkOptionLabel = "إضافة بيبسي كانز (+5ج)";
    } else if (opt === "no_juice") {
      drinkPriceDelta = -5;
      drinkOptionLabel = "بدون عصير (-5ج)";
    } else if (opt === "custom") {
      drinkPriceDelta = editingBooking.drinkPriceDelta;
      drinkOptionLabel = "تعديل مخصص بالاتفاق";
    }

    const unitPrice = editingBooking.basePrice + drinkPriceDelta;
    const totalPrice = unitPrice * editingBooking.quantity;
    const remainingAmount = Math.max(0, totalPrice - editingBooking.depositPaid);

    setEditingBooking({
      ...editingBooking,
      drinkOption: opt,
      drinkOptionLabel,
      drinkPriceDelta,
      unitPrice,
      totalPrice,
      remainingAmount
    });
  };

  const handleQuantityChangeInModal = (qty: number) => {
    if (!editingBooking) return;
    const safeQty = Math.max(1, qty);
    const totalPrice = editingBooking.unitPrice * safeQty;
    const remainingAmount = Math.max(0, totalPrice - editingBooking.depositPaid);
    setEditingBooking({
      ...editingBooking,
      quantity: safeQty,
      totalPrice,
      remainingAmount
    });
  };

  const handleDepositChangeInModal = (deposit: number) => {
    if (!editingBooking) return;
    const safeDeposit = Math.max(0, deposit);
    const remainingAmount = Math.max(0, editingBooking.totalPrice - safeDeposit);
    const paymentStatus = safeDeposit >= editingBooking.totalPrice && editingBooking.totalPrice > 0 
      ? "fully_paid" 
      : safeDeposit > 0 
      ? "deposit_paid" 
      : "pending_payment";

    setEditingBooking({
      ...editingBooking,
      depositPaid: safeDeposit,
      remainingAmount,
      paymentStatus
    });
  };

  // Filtered & Sorted Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.packageCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      b.paymentStatus === statusFilter ||
      (statusFilter === "has_remaining" && b.remainingAmount > 0);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc" 
        ? new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        : new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    } else if (sortBy === "total") {
      return sortOrder === "asc" ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
    } else {
      return sortOrder === "asc" ? a.quantity - b.quantity : b.quantity - a.quantity;
    }
  });

  // KPI & Summary Totals
  const totalBookingsCount = filteredBookings.length;
  const totalBoxesCount = filteredBookings.reduce((sum, b) => sum + b.quantity, 0);
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalDepositCollected = filteredBookings.reduce((sum, b) => sum + b.depositPaid, 0);
  const totalRemainingDue = filteredBookings.reduce((sum, b) => sum + b.remainingAmount, 0);

  // 1. Export Excel (.xlsx)
  const handleExportExcel = () => {
    const rows = filteredBookings.map((b, idx) => ({
      "م": idx + 1,
      "كود الحجز": b.id,
      "اسم صاحب المناسبة": b.customerName,
      "رقم الهاتف": b.phone,
      "نوع المناسبة": b.occasion,
      "تاريخ المناسبة": b.eventDate,
      "التوقيت": b.eventTime,
      "كود الوجبة": b.packageCode,
      "تفاصيل الوجبة المطلوبة وتخصيصها": b.packageName,
      "تعديل المشروب": b.drinkOptionLabel,
      "سعر العلبة (ج)": b.unitPrice,
      "عدد الوجبات (علبة)": b.quantity,
      "الإجمالي (جنيه)": b.totalPrice,
      "مبلغ الحجز / العربون المسدد (ج)": b.depositPaid,
      "الباقي (جنيه)": b.remainingAmount,
      "حالة السداد": b.paymentStatus === "fully_paid" ? "تم سداد كامل المبلغ" : b.paymentStatus === "deposit_paid" ? "تم سداد العربون" : "بانتظار السداد",
      "مكان التسليم / العنوان": b.deliveryAddress,
      "ملاحظات الاتفاق التليفوني": b.phoneAgreementNotes
    }));

    // Add Summary Row
    rows.push({
      "م": "" as any,
      "كود الحجز": "المجموع الإجمالي",
      "اسم صاحب المناسبة": `${totalBookingsCount} حجز`,
      "رقم الهاتف": "",
      "نوع المناسبة": "",
      "تاريخ المناسبة": "",
      "التوقيت": "",
      "كود الوجبة": "",
      "تفاصيل الوجبة المطلوبة وتخصيصها": "",
      "تعديل المشروب": "",
      "سعر العلبة (ج)": "" as any,
      "عدد الوجبات (علبة)": totalBoxesCount as any,
      "الإجمالي (جنيه)": totalRevenue as any,
      "مبلغ الحجز / العربون المسدد (ج)": totalDepositCollected as any,
      "الباقي (جنيه)": totalRemainingDue as any,
      "حالة السداد": `المتبقي: ${totalRemainingDue.toLocaleString()} ج`,
      "مكان التسليم / العنوان": "إدارة كاترنج سيلبر 01284484868",
      "ملاحظات الاتفاق التليفوني": "بيانات رسمية معتمدة"
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 38 }, { wch: 20 },
      { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 },
      { wch: 20 }, { wch: 28 }, { wch: 38 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "حجوزات سيلبر");
    XLSX.writeFile(workbook, `سجل_حجوزات_سيلبر_${new Date().toISOString().split("T")[0]}.xlsx`);
    showNotice("تم تحميل ملف الإكسيل بنجاح.");
  };

  // 2. Export PDF / Official Print View
  const handleExportPdf = () => {
    window.print();
  };

  // 3. Export JPG Image
  const handleExportJpg = async () => {
    if (!tableContainerRef.current) return;
    setIsExportingJpg(true);
    try {
      const canvas = await html2canvas(tableContainerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF"
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.download = `جدول_حجوزات_سيلبر_${new Date().toISOString().split("T")[0]}.jpg`;
      link.href = dataUrl;
      link.click();
      showNotice("تم تحميل صورة الجدول (JPG) بنجاح.");
    } catch (e) {
      console.error("JPG capture error:", e);
      alert("تعذر حفظ الصورة، يرجى استخدام تصدير إكسيل أو الطباعة.");
    } finally {
      setIsExportingJpg(false);
    }
  };

  // 4. Copy Formatted Text for WhatsApp / Telegram / Clipboard
  const handleCopyFormattedText = () => {
    let text = `📋 *سجل حجوزات كاترنج سيلبر الرسمي (Celebre Catering)*\n`;
    text += `📅 التاريخ: ${new Date().toLocaleDateString("ar-EG")} | هاتف الإدارة: 01284484868\n`;
    text += `📊 إجمالي الحجوزات: ${totalBookingsCount} حجز | إجمالي العلب: ${totalBoxesCount.toLocaleString()} علبة\n`;
    text += `💰 الإجمالي: ${totalRevenue.toLocaleString()} ج | العربون المحصل: ${totalDepositCollected.toLocaleString()} ج | المتبقي: ${totalRemainingDue.toLocaleString()} ج\n`;
    text += `═══════════════════════════════════════\n\n`;

    filteredBookings.forEach((b, idx) => {
      text += `*${idx + 1}. [${b.id}] ${b.customerName}*\n`;
      text += `   📱 الهاتف: ${b.phone}\n`;
      text += `   🎉 المناسبة: ${b.occasion} (${b.eventDate} - ${b.eventTime})\n`;
      text += `   🍱 الوجبة: ${b.packageCode} - ${b.packageName}\n`;
      text += `   🥤 المشروب: ${b.drinkOptionLabel}\n`;
      text += `   🔢 الحساب: ${b.unitPrice}ج × ${b.quantity} علبة = *${b.totalPrice.toLocaleString()} ج*\n`;
      text += `   💵 العربون المسدد: ${b.depositPaid.toLocaleString()} ج | *المتبقي: ${b.remainingAmount.toLocaleString()} ج*\n`;
      text += `   📌 حالة السداد: ${b.paymentStatus === "fully_paid" ? "✅ تم سداد كامل المبلغ" : b.paymentStatus === "deposit_paid" ? "⏳ تم سداد العربون" : "⚠️ بانتظار السداد"}\n`;
      text += `   📍 مكان التسليم: ${b.deliveryAddress}\n`;
      if (b.phoneAgreementNotes) text += `   📝 ملاحظات: ${b.phoneAgreementNotes}\n`;
      text += `───────────────────────────────────────\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedTextNotice(true);
    showNotice("تم نسخ الملخص النصي المنسق بنجاح للحافظة.");
    setTimeout(() => setCopiedTextNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto admin-modal-backdrop">
      <div className="relative w-full max-w-7xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-3 max-h-[96vh] flex flex-col admin-modal-card">
        
        {/* ACTION TOAST NOTICE */}
        {actionNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#221B17] text-white px-4 py-2 rounded-xl shadow-xl border border-[#C89B3C] text-xs font-bold flex items-center gap-2 animate-bounce-in">
            <Sparkles className="w-4 h-4 text-[#C89B3C]" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* LOGIN SCREEN IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto w-full">
            <div className="w-16 h-16 rounded-3xl bg-[#5C1027]/10 border border-[#C89B3C]/40 flex items-center justify-center mb-4 text-[#5C1027]">
              {authStep === "otp" ? <Smartphone className="w-8 h-8 text-[#5C1027] animate-pulse" /> : <Lock className="w-8 h-8 text-[#5C1027]" />}
            </div>

            <CelebreLogo size="sm" showSlogan={false} className="mb-2" />
            <h3 className="text-xl sm:text-2xl font-black text-[#221B17] mt-1">
              إدارة المبيعات • تسجيل الدخول
            </h3>
            
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 mt-2 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>نظام حماية مشدد (2FA) بكلمة سر مؤقتة (OTP)</span>
            </div>

            {/* FEEDBACK ALERTS */}
            {loginError && (
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold mb-3 flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {loginNotice && (
              <div className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold mb-3 flex items-center gap-2 text-right">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{loginNotice}</span>
              </div>
            )}

            {/* STEP: REGISTER MEMBER (أول مرة) */}
            {authStep === "register" ? (
              <form onSubmit={handleRegisterAdmin} className="w-full space-y-3.5 text-right animate-fadeIn">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 leading-relaxed">
                  <div className="font-black flex items-center gap-1.5 mb-1 text-amber-950">
                    <User className="w-4 h-4 text-[#C89B3C]" />
                    <span>تسجيل عضو إدارة المشروع (لأول مرة):</span>
                  </div>
                  <span>
                    قم بتعيين بياناتك الرسمية (رقم هاتفك وكلمة مرورك المعتمدة). سيتم تثبيت هذه البيانات للدخول دائماً، وإرسال كلمة السر المؤقتة (OTP) لرقمك في كل مرة.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    اسم أو صفة عضو الإدارة:
                  </label>
                  <div className="relative">
                    <User className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                    <input
                      type="text"
                      value={registerNameInput}
                      onChange={(e) => setRegisterNameInput(e.target.value)}
                      placeholder="مثال: محمود سلامة (مدير المبيعات)"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    رقم هاتف الإدارة (المعتمد لتلقي رمز الواتساب):
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="مثال: 01xxxxxxxxx"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    كلمة المرور الخاصة بك:
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                    <input
                      type="password"
                      dir="ltr"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="كلمة مرور قوية وسرية"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-3 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl font-black text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className={`w-4 h-4 text-[#C89B3C] ${isRegistering ? "animate-spin" : ""}`} />
                  <span>{isRegistering ? "جاري حفظ وتثبيت العضوية..." : "تسجيل وتثبيت عضو إدارة المشروع"}</span>
                </button>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep("credentials");
                      setLoginError("");
                    }}
                    className="w-full py-2 text-xs text-[#5C1027] hover:underline font-bold"
                  >
                    لديك بيانات دخول مسجلة بالفعل؟ تسجيل الدخول
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-1 text-xs text-[#7A6E65] hover:text-[#221B17] font-semibold cursor-pointer"
                >
                  العودة للموقع الرئيسي
                </button>
              </form>
            ) : authStep === "credentials" ? (
              /* STEP 1: REGULAR LOGIN (البيانات الثابتة المعتمدة للإدارة) */
              <form onSubmit={handleRequestOtp} className="w-full space-y-3.5 text-right">
                <p className="text-xs text-[#7A6E65] text-center mb-1">
                  أدخل بيانات دخولك المعتمدة. سيتم إرسال كلمة سر مؤقتة (OTP) إلى هاتفك في رسالة واتساب للتحقق في كل مرة.
                </p>

                {registeredMaskedPhone && (
                  <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl p-2 text-center text-xs text-stone-600">
                    رقم الإدارة المسجل في النظام: <span dir="ltr" className="font-mono font-black text-[#5C1027]">{registeredMaskedPhone}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    رقم هاتف الإدارة:
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="رقم الهاتف المسجل"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    كلمة المرور الخاصة بك:
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                    <input
                      type="password"
                      dir="ltr"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRequestingOtp}
                  className="w-full py-3 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl font-black text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className={`w-4 h-4 text-[#C89B3C] ${isRequestingOtp ? "animate-pulse" : ""}`} />
                  <span>{isRequestingOtp ? "جاري الإرسال عبر واتساب..." : "إرسال كلمة السر المؤقتة (OTP) عبر واتساب"}</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep("register");
                      setLoginError("");
                    }}
                    className="text-[#8C6D28] hover:underline font-bold cursor-pointer"
                  >
                    تسجيل أو تغيير عضو إدارة المشروع
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[#7A6E65] hover:text-[#221B17] font-semibold cursor-pointer"
                  >
                    العودة للموقع
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: ENTER TEMPORARY OTP FROM WHATSAPP (كلمة السر المؤقتة عبر واتساب حصرياً) */
              <form onSubmit={handleVerifyOtp} className="w-full space-y-3.5 text-right animate-fadeIn">
                {/* Security Verification Box - Secret delivered to WhatsApp */}
                <div className="w-full bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 text-right">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-950 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-emerald-700" />
                      <span>تم إرسال رمز الأمان في رسالة واتساب:</span>
                    </span>
                    <span className="font-mono text-emerald-900 bg-emerald-200/70 text-[11px] px-2 py-0.5 rounded-md font-black">
                      ⏱️ {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  
                  <p className="text-xs text-emerald-900 leading-relaxed mb-3">
                    لأعلى درجات الأمان وحماية سجلات المشروع، تم إرسال كلمة السر المؤقتة المكونة من 6 أرقام إلى رقمك المسجل (<span dir="ltr" className="font-mono font-black">{phoneInput}</span>) في رسالة واتساب مشفرة.
                  </p>

                  {activeWhatsappLink && (
                    <a
                      href={activeWhatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>فتح تطبيق واتساب على هاتفك لعرض رمز الدخول</span>
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    أدخل كلمة السر المؤقتة (المستلمة على واتساب):
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                    <input
                      type="text"
                      maxLength={6}
                      dir="ltr"
                      autoFocus
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border-2 border-[#5C1027] rounded-xl text-xl font-black tracking-[0.4em] text-center text-[#5C1027] focus:outline-hidden"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-[#7A6E65] mt-1 block">
                    * الحماية نشطة: لن يتم فتح سجل الحجوزات نهائياً إلا بعد إدخال كلمة السر المؤقتة الصحيحة.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full py-3 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl font-black text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                  <span>{isVerifyingOtp ? "جاري التحقق من الرمز..." : "تأكيد كلمة السر المؤقتة والدخول للسجل"}</span>
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldownSeconds > 0}
                    className={`font-bold transition-colors ${
                      cooldownSeconds > 0 ? "text-stone-400 cursor-not-allowed" : "text-[#8C6D28] hover:underline cursor-pointer"
                    }`}
                  >
                    {cooldownSeconds > 0 ? `إعادة الإرسال (${cooldownSeconds} ثانية)` : "إعادة إرسال رمز مؤقت لواتساب"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep("credentials");
                      setOtpInput("");
                      setLoginError("");
                    }}
                    className="text-stone-500 hover:text-stone-800 hover:underline cursor-pointer"
                  >
                    تعديل الهاتف أو كلمة المرور
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* SPREADSHEET VIEW FOR AUTHENTICATED ADMIN */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Management Header */}
            <div className="bg-[#FAF7F2] border-b border-[#F0EAE1] px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
              <div className="flex items-center gap-3">
                <CelebreLogo size="xs" showSlogan={false} />
                <div>
                  <div className="flex items-center gap-2">
                     <h3 className="font-black text-base sm:text-lg text-[#221B17]">
                       إدارة المبيعات • سجل حجوزات كاترنج سيلبر
                     </h3>
                     <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                       <ShieldCheck className="w-3 h-3 text-emerald-600" />
                       <span>عضو الإدارة: {adminDisplayName || "معتمد"}</span>
                     </span>
                   </div>
                   <p className="text-[11px] text-[#7A6E65]">
                     صفحة بيانات تفاعلية لإدارة المبيعات وتخصيص التعاقدات وتحديث العربون والباقي والتصدير
                   </p>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewPhoneSetting(phoneInput || "");
                    setNewPasswordSetting("");
                    setSecurityNotice("");
                    setIsSecuritySettingsOpen(true);
                  }}
                  className="p-2 rounded-xl bg-white border border-[#E8DFD1] hover:bg-[#EFE8DD] text-[#4A3E38] text-xs font-bold flex items-center gap-1.5"
                  title="تعديل بيانات الدخول وأمان الحساب"
                >
                  <Settings className="w-3.5 h-3.5 text-[#5C1027]" />
                  <span className="hidden sm:inline">أمان الحساب</span>
                </button>

                <button
                  type="button"
                  onClick={fetchBookings}
                  className="p-2 rounded-xl bg-white border border-[#E8DFD1] hover:bg-[#EFE8DD] text-[#4A3E38] text-xs font-bold flex items-center gap-1.5"
                  title="تحديث البيانات من السيرفر"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBookings ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">تحديث</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                >
                  تسجيل خروج
                </button>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPI Summary Dashboard Bar */}
            <div className="bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] text-white p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0 no-print">
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-[#F4EEDB]">عدد الحجوزات</div>
                <div className="text-xl font-black">{totalBookingsCount} حجز</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-[#F4EEDB]">إجمالي الوجبات (علب)</div>
                <div className="text-xl font-black text-[#C89B3C]">{totalBoxesCount.toLocaleString()} علبة</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-[#F4EEDB]">إجمالي قيمة التعاقدات</div>
                <div className="text-xl font-black">{totalRevenue.toLocaleString()} ج</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-emerald-300">إجمالي العربون المحصل</div>
                <div className="text-xl font-black text-emerald-300">{totalDepositCollected.toLocaleString()} ج</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-amber-300">إجمالي المتبقي للتحصيل</div>
                <div className="text-xl font-black text-amber-300">{totalRemainingDue.toLocaleString()} ج</div>
              </div>
            </div>

            {/* Excel-like Action Toolbar with Export Options */}
            <div className="bg-[#FAF7F2] border-b border-[#E8DFD1] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
              {/* Left Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenAddNew}
                  className="px-3.5 py-2 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 text-[#C89B3C]" />
                  <span>إضافة حجز جديد</span>
                </button>

                {/* Export Options */}
                <div className="h-5 w-px bg-[#E8DFD1] mx-1 hidden sm:block" />

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  title="تصدير جدول إكسيل XLSX"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تصدير إكسيل (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-3 py-2 bg-white hover:bg-[#EFE8DD] text-[#4A3E38] border border-[#E8DFD1] rounded-xl text-xs font-bold flex items-center gap-1.5"
                  title="تصدير PDF أو طباعة رسمية"
                >
                  <Printer className="w-3.5 h-3.5 text-[#5C1027]" />
                  <span>طباعة / PDF</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingJpg}
                  onClick={handleExportJpg}
                  className="px-3 py-2 bg-white hover:bg-[#EFE8DD] text-[#4A3E38] border border-[#E8DFD1] rounded-xl text-xs font-bold flex items-center gap-1.5"
                  title="تصدير كصورة JPG عالية الوضوح"
                >
                  <Image className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isExportingJpg ? "جاري التصدير..." : "تصدير صورة (JPG)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyFormattedText}
                  className="px-3 py-2 bg-white hover:bg-[#EFE8DD] text-[#4A3E38] border border-[#E8DFD1] rounded-xl text-xs font-bold flex items-center gap-1.5"
                  title="نسخ ملخص الحجوزات كنص منسق"
                >
                  {copiedTextNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#C89B3C]" />}
                  <span>{copiedTextNotice ? "تم النسخ!" : "نسخ نص منسق"}</span>
                </button>

                {bookings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllBookings}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="تفريغ السجل وحذف جميع البيانات التجريبية"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>تفريغ السجل</span>
                  </button>
                )}
              </div>

              {/* Right Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-[#7A6E65]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث باسم، هاتف، أو كود..."
                    className="pr-8 pl-3 py-1.5 bg-white border border-[#E8DFD1] rounded-xl text-xs text-[#221B17] w-48 sm:w-56 focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#4A3E38] focus:outline-hidden"
                >
                  <option value="all">كافة حالات السداد</option>
                  <option value="deposit_paid">تم سداد العربون</option>
                  <option value="fully_paid">تم سداد كامل المبلغ</option>
                  <option value="has_remaining">متبقي مبالغ للتحصيل</option>
                  <option value="pending_payment">بانتظار السداد</option>
                </select>

                {/* Sort Toggle */}
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  className="p-2 rounded-xl bg-white border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] flex items-center gap-1"
                  title="عكس اتجاه الترتيب"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{sortOrder === "asc" ? "تصاعدي" : "تنازلي"}</span>
                </button>
              </div>
            </div>

            {/* EXCEL SPREADSHEET TABLE CONTAINER */}
            <div 
              ref={tableContainerRef} 
              id="admin-bookings-sheet"
              className="flex-1 overflow-auto bg-white p-3 admin-bookings-table-container"
            >
              {/* Sheet Header for Print/Export */}
              <div className="hidden print:block mb-4 p-4 border-b border-[#E8DFD1] text-right">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#5C1027]">سجل حجوزات وتوريدات كاترنج سيلبر الرسمي</h2>
                    <p className="text-xs text-[#7A6E65]">بيانات حصرية خاصة بالإدارة • هاتف: 01284484868</p>
                  </div>
                  <div className="text-xs text-[#7A6E65] font-mono">
                    تاريخ الطباعة: {new Date().toLocaleDateString("ar-EG")}
                  </div>
                </div>
              </div>

              <table className="w-full text-right border-collapse text-xs border border-[#CBD5E1]">
                {/* Excel Column Letters Reference Bar (A, B, C, D...) */}
                <thead className="bg-[#E2E8F0] text-[#475569] font-mono text-[10px] text-center select-none no-print border-b border-[#CBD5E1]">
                  <tr>
                    <th className="p-1 border-r border-[#CBD5E1] w-10">A</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[85px]">B</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[130px]">C</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[100px]">D</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[105px]">E</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[110px]">F</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[180px]">G</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[120px]">H</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[75px]">I</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[70px]">J</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[90px]">K</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[95px]">L</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[90px]">M</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[120px]">N</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[130px]">O</th>
                    <th className="p-1 border-r border-[#CBD5E1] min-w-[150px]">P</th>
                    <th className="p-1 min-w-[110px]">Q</th>
                  </tr>
                </thead>

                {/* Table Header (Excel style) */}
                <thead className="sticky top-0 bg-[#5C1027] text-white select-none z-10 shadow-xs">
                  <tr className="border-b border-[#721832]">
                    <th className="p-2.5 border-r border-[#721832] font-black text-center w-10">#</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[85px]">كود الحجز</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[130px]">صاحب المناسبة</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[100px]">الهاتف</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[105px]">المناسبة</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[110px]">تاريخ وتوقيت</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[180px]">الوجبة المطلوبة (وتخصيصها)</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[120px]">تعديل المشروب</th>
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[75px]">سعر العلبة</th>
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[70px]">العدد</th>
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[90px] bg-[#430B1C]">الإجمالي</th>
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[95px] bg-emerald-950 text-emerald-200">مبلغ الحجز (العربون)</th>
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[90px] bg-amber-950 text-amber-200">الباقي</th>
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[120px]">حالة السداد والتحديث</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[130px]">مكان التسليم</th>
                    <th className="p-2.5 border-r border-[#721832] font-black min-w-[150px]">ملاحظات الاتفاق</th>
                    <th className="p-2.5 font-black text-center min-w-[110px] print:hidden">إجراءات</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="p-12 text-center text-[#7A6E65]">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-2xl bg-[#5C1027]/10 flex items-center justify-center text-[#5C1027]">
                            <FileSpreadsheet className="w-6 h-6 text-[#C89B3C]" />
                          </div>
                          <span className="font-black text-base text-[#221B17]">سجل الحجوزات فارغ حالياً</span>
                          <span className="text-xs text-[#7A6E65]">
                            تم حذف وإفراغ كافة البيانات التجريبية. يمكنك الآن تسجيل وإضافة بيانات الحجوزات الفعلية بمعرفة الإدارة.
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenAddNew}
                            className="mt-2 px-4 py-2 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#C89B3C]" />
                            <span>+ إضافة أول حجز فعلي</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b, idx) => (
                      <tr 
                        key={b.id} 
                        className={`hover:bg-[#FAF7F2] transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                        }`}
                      >
                        {/* 1. Row Index */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-bold text-[#64748B] bg-[#F1F5F9]/50">
                          {idx + 1}
                        </td>

                        {/* 2. Booking ID */}
                        <td className="p-2 border-r border-[#E2E8F0] font-mono font-bold text-[#5C1027]">
                          {b.id}
                        </td>

                        {/* 3. Customer Name (بيان نصي) */}
                        <td className="p-2 border-r border-[#E2E8F0] font-bold text-[#0F172A]">
                          {b.customerName}
                        </td>

                        {/* 4. Phone */}
                        <td className="p-2 border-r border-[#E2E8F0] font-mono text-[#334155]" dir="ltr">
                          <a href={`tel:${b.phone}`} className="hover:text-[#5C1027] hover:underline">
                            {b.phone}
                          </a>
                        </td>

                        {/* 5. Occasion */}
                        <td className="p-2 border-r border-[#E2E8F0] text-[#334155] font-semibold">
                          {b.occasion}
                        </td>

                        {/* 6. Event Date & Time (تاريخي) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-[#0F172A]">
                          <div className="font-bold">{b.eventDate}</div>
                          <div className="text-[10px] text-[#64748B]">{b.eventTime}</div>
                        </td>

                        {/* 7. Package Name & Customization (بيان نصي واختيار من 12 وجبة وتخصيصها) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-[#0F172A]">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-black text-[#C89B3C] bg-[#5C1027]/5 px-1.5 py-0.2 rounded text-[10px] border border-[#C89B3C]/30 shrink-0">
                              {b.packageCode}
                            </span>
                            <span className="font-bold text-[11px] text-[#5C1027]">وجبة الموقع</span>
                          </div>
                          <div className="text-[11px] font-semibold text-[#1E293B] leading-tight line-clamp-2">
                            {b.packageName}
                          </div>
                        </td>

                        {/* 8. Drink Option Modifier */}
                        <td className="p-2 border-r border-[#E2E8F0]">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold inline-block ${
                            b.drinkOption === "pepsi_added"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : b.drinkOption === "no_juice"
                              ? "bg-stone-100 text-stone-700 border border-stone-200"
                              : "bg-amber-50 text-amber-900 border border-amber-200"
                          }`}>
                            {b.drinkOptionLabel}
                          </span>
                        </td>

                        {/* 9. Unit Price (سعر الوجبة) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-bold text-[#334155]">
                          {b.unitPrice} ج
                        </td>

                        {/* 10. Quantity (بيان رقمي) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-black text-[#0F172A] bg-amber-50/20">
                          {b.quantity}
                        </td>

                        {/* 11. Total Price (الإجمالي = حاصل ضرب الوجبة ± المشروب في العدد) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-black text-[#5C1027] bg-[#FAF7F2]">
                          {b.totalPrice.toLocaleString()} ج
                        </td>

                        {/* 12. Deposit Paid (مبلغ الحجز رقم) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-black text-emerald-800 bg-emerald-50/40">
                          {b.depositPaid.toLocaleString()} ج
                        </td>

                        {/* 13. Remaining Amount (الباقي رقم) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-black text-amber-900 bg-amber-50/40">
                          {b.remainingAmount === 0 ? (
                            <span className="text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">خالص 0ج</span>
                          ) : (
                            `${b.remainingAmount.toLocaleString()} ج`
                          )}
                        </td>

                        {/* 14. Payment Status & Quick Action Buttons */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center">
                          {b.paymentStatus === "fully_paid" ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تم سداد كامل المبلغ</span>
                            </span>
                          ) : b.paymentStatus === "deposit_paid" ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                                تم سداد العربون
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickPayRemaining(b)}
                                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-black hover:underline bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md print:hidden shadow-2xs"
                                title="تسجيل استلام باقي المبلغ بنقرة واحدة"
                              >
                                ✓ سداد باقي المبلغ
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                بانتظار السداد
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickPayDeposit(b)}
                                className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md print:hidden"
                                title="تسجيل سداد العربون (50%)"
                              >
                                سداد العربون
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 15. Delivery Address */}
                        <td className="p-2 border-r border-[#E2E8F0] text-[#334155]">
                          <span className="line-clamp-2">{b.deliveryAddress}</span>
                        </td>

                        {/* 16. Agreement Notes */}
                        <td className="p-2 border-r border-[#E2E8F0] text-[#64748B] text-[11px]">
                          <span className="line-clamp-2">{b.phoneAgreementNotes || "—"}</span>
                        </td>

                        {/* 17. Row Actions */}
                        <td className="p-2 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(b)}
                              className="p-1.5 rounded-lg hover:bg-[#EFE8DD] text-[#5C1027] border border-[#E8DFD1]"
                              title="تعديل بيانات الحجز والوجبة والمبالغ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(b.id, b.customerName)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 border border-rose-200"
                              title="حذف الحجز من السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* SPREADSHEET SUMMARY TOTALS ROW (Excel SUM row) */}
                <tfoot className="bg-[#FAF7F2] font-black border-t-2 border-[#5C1027] text-xs">
                  <tr className="bg-[#F1F5F9]">
                    <td colSpan={9} className="p-2.5 border-r border-[#CBD5E1] text-right font-black text-[#5C1027]">
                      الإجماليات الكلية لسجل حجوزات الإدارة ({filteredBookings.length} حجز):
                    </td>
                    <td className="p-2.5 border-r border-[#CBD5E1] text-center font-black text-[#0F172A] bg-amber-100/60">
                      {totalBoxesCount.toLocaleString()} علبة
                    </td>
                    <td className="p-2.5 border-r border-[#CBD5E1] text-center font-black text-[#5C1027] bg-[#FAF7F2]">
                      {totalRevenue.toLocaleString()} ج
                    </td>
                    <td className="p-2.5 border-r border-[#CBD5E1] text-center font-black text-emerald-800 bg-emerald-100/70">
                      {totalDepositCollected.toLocaleString()} ج
                    </td>
                    <td className="p-2.5 border-r border-[#CBD5E1] text-center font-black text-amber-900 bg-amber-100/70">
                      {totalRemainingDue.toLocaleString()} ج
                    </td>
                    <td colSpan={4} className="p-2.5 text-center text-[#64748B] font-semibold text-[11px]">
                      المتبقي للتحصيل عند التسليم: {totalRemainingDue.toLocaleString()} جنيه
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Table Footer with Official Notes & Formula Explanations */}
            <div className="bg-[#FAF7F2] border-t border-[#F0EAE1] px-5 py-3 text-xs text-[#7A6E65] flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5C1027]" />
                <span>
                  <strong>المعادلة المحسوبة:</strong> الإجمالي = (سعر الوجبة الأساسية ± تعديل المشروب) × عدد الوجبات • الباقي = الإجمالي - مبلغ الحجز (العربون).
                </span>
              </div>
              <div className="font-bold text-[#5C1027]">
                التوصيل غير مشمول في سعر الوجبات ويتم التنسيق بشأنه هاتفياً مع العميل.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ADD / EDIT BOOKING MODAL */}
      {isEditModalOpen && editingBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-2xs animate-fadeIn overflow-y-auto no-print">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
              <div>
                <h4 className="font-black text-base text-[#221B17]">
                  {isNewBooking ? "إضافة حجز كاترنج جديد بمعرفة الإدارة" : `تعديل الحجز رقم (${editingBooking.id})`}
                </h4>
                <p className="text-[11px] text-[#7A6E65]">
                  يتم احتساب الإجمالي والباقي تلقائياً بناءً على الوجبة وتعديل المشروب والكمية
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="overflow-y-auto p-6 space-y-4 text-right">
              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    اسم صاحب المناسبة (بيان نصي): *
                  </label>
                  <input
                    type="text"
                    value={editingBooking.customerName}
                    onChange={(e) => setEditingBooking({ ...editingBooking, customerName: e.target.value })}
                    placeholder="مثال: د. طارق عبد الرحمن"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    رقم الهاتف (واتساب): *
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={editingBooking.phone}
                    onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
              </div>

              {/* Occasion & Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    نوع المناسبة:
                  </label>
                  <input
                    type="text"
                    value={editingBooking.occasion}
                    onChange={(e) => setEditingBooking({ ...editingBooking, occasion: e.target.value })}
                    placeholder="كتب كتاب، زفاف، خطوبة..."
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    تاريخ المناسبة (تاريخي): *
                  </label>
                  <input
                    type="date"
                    value={editingBooking.eventDate}
                    onChange={(e) => setEditingBooking({ ...editingBooking, eventDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    التوقيت المتفق عليه:
                  </label>
                  <input
                    type="text"
                    value={editingBooking.eventTime}
                    onChange={(e) => setEditingBooking({ ...editingBooking, eventTime: e.target.value })}
                    placeholder="مثال: بعد العصر 5:00 م"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
              </div>

              {/* Package Selection from the 12 packages */}
              <div className="space-y-2 p-3 bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl">
                <label className="block text-xs font-black text-[#5C1027]">
                  اختيار الوجبة من قائمة الموقع الرسمية (12 وجبة):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATERING_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handlePackageSelectInModal(pkg.saleCode)}
                      className={`p-2 rounded-xl border text-right transition-all ${
                        editingBooking.packageCode === pkg.saleCode
                          ? "bg-[#5C1027] text-white border-[#5C1027] shadow-xs"
                          : "bg-white text-[#221B17] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                      }`}
                    >
                      <div className="text-[10px] font-black text-[#C89B3C]">{pkg.saleCode}</div>
                      <div className="text-xs font-bold line-clamp-1">{pkg.name}</div>
                      <div className={`text-[11px] font-black ${editingBooking.packageCode === pkg.saleCode ? "text-[#F4EEDB]" : "text-[#5C1027]"}`}>
                        {pkg.pricePerBox} ج
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Package Modification Text */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                    تعديل وتخصيص الوجبة بناءً على الاتفاق التليفوني مع العميل:
                  </label>
                  <textarea
                    rows={2}
                    value={editingBooking.packageName}
                    onChange={(e) => setEditingBooking({ ...editingBooking, packageName: e.target.value })}
                    placeholder="تعديل محتويات الوجبة (مثلاً: استبدال سندوتش الرومي بلانشون، أو تغيير طعم الجاتوه...)"
                    className="w-full px-3 py-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
              </div>

              {/* Drink Option Modifier (+Pepsi / -Juice) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3E38]">
                  تعديل المشروب المتفق عليه (تأثير مباشر على سعر العلبة والإجمالي):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDrinkChangeInModal("juice_included")}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      editingBooking.drinkOption === "juice_included"
                        ? "bg-[#5C1027] text-white border-[#5C1027]"
                        : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1]"
                    }`}
                  >
                    <div className="text-xs font-bold">عصير بخيرة مشمول</div>
                    <div className="text-[10px] opacity-80">(0 ج إضافي)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDrinkChangeInModal("pepsi_added")}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      editingBooking.drinkOption === "pepsi_added"
                        ? "bg-[#5C1027] text-white border-[#5C1027]"
                        : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1]"
                    }`}
                  >
                    <div className="text-xs font-bold">إضافة بيبسي كانز</div>
                    <div className="text-[10px] font-bold text-[#C89B3C]">(+5 ج للعلبة)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDrinkChangeInModal("no_juice")}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      editingBooking.drinkOption === "no_juice"
                        ? "bg-[#5C1027] text-white border-[#5C1027]"
                        : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1]"
                    }`}
                  >
                    <div className="text-xs font-bold">بدون عصير</div>
                    <div className="text-[10px] font-bold text-emerald-700">(-5 ج للعلبة)</div>
                  </button>
                </div>
              </div>

              {/* Quantity, Unit Price, Total, Deposit & Remaining */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1]">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                    سعر العلبة المحسوب:
                  </label>
                  <div className="text-base font-black text-[#5C1027] bg-white p-2 rounded-xl border border-[#E8DFD1] text-center">
                    {editingBooking.unitPrice} ج
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                    عدد الوجبات (رقم): *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingBooking.quantity}
                    onChange={(e) => handleQuantityChangeInModal(Number(e.target.value))}
                    className="w-full text-center py-2 bg-white border border-[#E8DFD1] rounded-xl text-base font-black text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                    الإجمالي (رقم):
                  </label>
                  <div className="text-base font-black text-[#221B17] bg-white p-2 rounded-xl border border-[#E8DFD1] text-center">
                    {editingBooking.totalPrice.toLocaleString()} ج
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                    مبلغ الحجز / العربون (رقم):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingBooking.depositPaid}
                    onChange={(e) => handleDepositChangeInModal(Number(e.target.value))}
                    className="w-full text-center py-2 bg-white border border-emerald-300 rounded-xl text-base font-black text-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-[#E8DFD1] flex items-center justify-between">
                  <div className="text-xs font-black text-[#7A6E65]">
                    المتبقي عند الاستلام (رقم):
                  </div>
                  <div className="text-lg font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                    {editingBooking.remainingAmount.toLocaleString()} جنيه
                  </div>
                </div>
              </div>

              {/* Delivery Location & Phone Agreement Notes */}
              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  مكان وقاعة أو مسجد التسليم:
                </label>
                <input
                  type="text"
                  value={editingBooking.deliveryAddress}
                  onChange={(e) => setEditingBooking({ ...editingBooking, deliveryAddress: e.target.value })}
                  placeholder="مثال: مسجد عمر بن عبد العزيز - ميدان المديرية ببني سويف"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  ملاحظات الاتفاق التليفوني والتوريد:
                </label>
                <textarea
                  rows={2}
                  value={editingBooking.phoneAgreementNotes}
                  onChange={(e) => setEditingBooking({ ...editingBooking, phoneAgreementNotes: e.target.value })}
                  placeholder="أي تفاصيل خاصة تم الاتفاق عليها مع العميل هاتفياً (موعد التسليم، طريقة تحويل العربون...)"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#F0EAE1] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD]"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveBooking}
                className="py-2.5 px-6 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-[#C89B3C]" />
                <span>حفظ البيانات وتحديث السجل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Credentials Settings Modal (تعديل بيانات الدخول وأمان الحساب) */}
      {isSecuritySettingsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden text-right">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5C1027]/10 flex items-center justify-center text-[#5C1027]">
                  <Settings className="w-4 h-4 text-[#C89B3C]" />
                </div>
                <h4 className="font-black text-sm text-[#221B17]">
                  أمان الحساب • تعديل بيانات دخول الإدارة
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSecuritySettingsOpen(false)}
                className="w-7 h-7 rounded-full bg-white border border-[#E8DFD1] flex items-center justify-center text-[#7A6E65] hover:text-[#221B17]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveSecuritySettings} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 font-semibold leading-relaxed">
                🛡️ <strong>حماية البيانات مؤكدة:</strong> كل مرة يتم فيها الدخول، يولد النظام تلقائياً كلمة سر مؤقتة (OTP) جديدة ويرسلها إلى هذا الرقم ولا يتم الدخول إلا بإدخالها.
              </div>

              {securityNotice && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{securityNotice}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  رقم هاتف الإدارة الجديد (لاستلام كلمات السر المؤقتة OTP):
                </label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={newPhoneSetting}
                    onChange={(e) => setNewPhoneSetting(e.target.value)}
                    placeholder="مثال: 01xxxxxxxxx"
                    className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  كلمة المرور الجديدة الخاصة بك:
                </label>
                <div className="relative">
                  <Key className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type="password"
                    dir="ltr"
                    value={newPasswordSetting}
                    onChange={(e) => setNewPasswordSetting(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsSecuritySettingsOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD]"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSavingSecurity}
                  className="py-2.5 px-6 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#C89B3C]" />
                  <span>{isSavingSecurity ? "جاري الحفظ..." : "حفظ بيانات الدخول الجديدة"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
