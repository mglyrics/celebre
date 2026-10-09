import React, { useState, useEffect, useRef } from "react";
import { 
  X, Lock, User, Key, KeyRound, ArrowRight, Plus, Search, Filter, 
  Printer, Image, Copy, Check, Edit3, Trash2, Save, 
  RefreshCw, Calendar, Phone, DollarSign, 
  CheckCircle2, AlertCircle, Clock, FileSpreadsheet, 
  ShieldCheck, ArrowUpDown, Eye, CheckSquare, Sparkles, ChevronDown,
  Shield, Smartphone, Send, MessageCircle, Settings, ShieldAlert,
  BellRing, Volume2, VolumeX, Radio, Zap, Truck
} from "lucide-react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas-pro";
import { AdminBooking } from "../types";
import { CATERING_PACKAGES } from "../data/cateringData";
import { CelebreLogo, CelebreClocheIcon } from "./CelebreLogo";

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
  // Authentication State (حساب الأدمن الوحيد المسجل)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === "true" || sessionStorage.getItem(AUTH_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [registeredPhone, setRegisteredPhone] = useState("01284484868");
  const adminDisplayName = "حساب الأدمن المعتمد";
  const [previewBooking, setPreviewBooking] = useState<AdminBooking | null>(null);


  // High-Security OTP Authentication State for Official Project Phone 01284484868
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codePreview, setCodePreview] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(10);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginUserId, setLoginUserId] = useState<number | null>(null);
  const [currentAdminRole, setCurrentAdminRole] = useState<string>(() => {
    try {
      return localStorage.getItem("celebre_admin_role") || "SUPER_ADMIN";
    } catch {
      return "SUPER_ADMIN";
    }
  });
  const [currentAdminPerms, setCurrentAdminPerms] = useState<string[]>(() => {
    try {
      const p = localStorage.getItem("celebre_admin_perms");
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  });

  // Forgot Password Recovery State (استعادة كلمة السر عبر هاتف المشروع 01284484868)
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [forgotRecoveryPhone, setForgotRecoveryPhone] = useState("01284484868");
  const [forgotOtpRequested, setForgotOtpRequested] = useState(false);
  const [forgotOtpInput, setForgotOtpInput] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [forgotWhatsappUrl, setForgotWhatsappUrl] = useState<string | null>(null);
  const [forgotCodePreview, setForgotCodePreview] = useState<string | null>(null);
  const [isRequestingForgotOtp, setIsRequestingForgotOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Central Helper for High-Security Admin Auth Headers (with localStorage + sessionStorage resilience)
  const getAuthHeaders = () => {
    let token = "";
    try {
      token = localStorage.getItem("celebre_admin_token") || sessionStorage.getItem("celebre_admin_token") || "";
    } catch {}
    return {
      "Content-Type": "application/json",
      ...(token ? { 
        Authorization: `Bearer ${token}`,
        "x-admin-token": token 
      } : {})
    };
  };

  // Timer for OTP expiration (300s) and resend cooldown (10s)
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  useEffect(() => {
    let timer: any;
    if (forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotCountdown]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Check auth status from server on mount/open
  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/admin/auth/status", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.registeredPhone) {
          setRegisteredPhone(data.registeredPhone);
          localStorage.setItem("celebre_admin_custom_phone", data.registeredPhone);
        }
        if (data.isAuthenticated) {
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_KEY, "true");
        } else {
          // If server says token expired/invalid, clear local token
          const existingToken = localStorage.getItem("celebre_admin_token");
          if (existingToken) {
            setIsAuthenticated(false);
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem("celebre_admin_token");
          }
        }
      }
    } catch {
      // Fallback for offline or connection glitch
      const savedPhone = localStorage.getItem("celebre_admin_custom_phone");
      if (savedPhone) {
        setRegisteredPhone(savedPhone);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
      if (isAuthenticated) {
        fetchBookings(true);
      }
    }
  }, [isOpen, isAuthenticated]);

  // Security Credentials Settings Modal (تغيير كلمة السر وتأمين الدخول)
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);
  const [newPhoneSetting, setNewPhoneSetting] = useState("");
  const [currentPasswordSetting, setCurrentPasswordSetting] = useState("");
  const [newPasswordSetting, setNewPasswordSetting] = useState("");
  const [confirmPasswordSetting, setConfirmPasswordSetting] = useState("");
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [securityNotice, setSecurityNotice] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Security Audit Logs State
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);

  const fetchAuditLogs = async () => {
    setIsLoadingAuditLogs(true);
    try {
      const res = await fetch("/api/admin/audit-logs", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setAuditLogs(data.logs);
        }
      }
    } catch (e) {
      console.error("Error fetching audit logs:", e);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  // Bookings Data State - Clean real database only (no mock or previous test data)
  const [bookings, setBookings] = useState<AdminBooking[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((b: any) => 
            b && 
            b.id && 
            (b.id === "CEL-9386" || (
              !b.id.startsWith("CEL-BK-20") && 
              b.customerName !== "عميل كاترنج سيلبر" &&
              !b.customerName?.includes("وهمي") &&
              !b.customerName?.includes("تجريبي")
            ))
          );
          if (clean.length > 0) {
            return clean;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
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

  // Real-time synchronization states
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveSyncEnabled, setIsLiveSyncEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());
  const [newlyAddedBookingId, setNewlyAddedBookingId] = useState<string | null>(null);
  const [liveIncomingAlert, setLiveIncomingAlert] = useState<{
    id: string;
    customerName: string;
    quantity: number;
    occasion: string;
    amount: number;
  } | null>(null);

  // Play pleasant chime on incoming booking
  const playNotificationChime = () => {
    if (!soundAlertsEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6
      gain2.gain.setValueAtTime(0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      // Audio autoplay may be disabled by browser before user interaction
    }
  };

  // Auto-sync cache & multi-tab broadcast
  const updateBookingsState = (newBookings: AdminBooking[], shouldBroadcast = true) => {
    setBookings(newBookings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookings));
    } catch (e) {
      console.error(e);
    }
    if (shouldBroadcast && typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel("celebre_admin_realtime_sync");
        bc.postMessage({ type: "bookings_updated", bookings: newBookings });
        bc.close();
      } catch {}
    }
  };

  // Fetch bookings from server
  const fetchBookings = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoadingBookings(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem("celebre_admin_token");
        setLoginError("انتهت صلاحية جلسة الأدمن. يرجى طلب رمز الدخول المؤقت للتحقق.");
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        const cleanBookings = data.bookings.filter((b: any) => 
          b && 
          b.id && 
          (b.id === "CEL-9386" || (
            !b.id.startsWith("CEL-BK-20") && 
            b.customerName !== "عميل كاترنج سيلبر" &&
            !b.customerName?.includes("وهمي") &&
            !b.customerName?.includes("تجريبي")
          ))
        );
        updateBookingsState(cleanBookings, false);
        setLastSyncedTime(new Date());
      }
    } catch (e) {
      console.error("Failed to load bookings from API, using cached data:", e);
    } finally {
      if (showLoadingSpinner) setIsLoadingBookings(false);
    }
  };

  // Real-Time EventSource (SSE) + BroadcastChannel + Periodic Fallback Polling
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    // Initial load
    fetchBookings(true);

    if (!isLiveSyncEnabled) {
      setIsLiveConnected(false);
      return;
    }

    let eventSource: EventSource | null = null;
    let fallbackPollInterval: NodeJS.Timeout | null = null;

    try {
      const token = localStorage.getItem("celebre_admin_token") || "";
      eventSource = new EventSource(`/api/admin/bookings/live-stream?token=${encodeURIComponent(token)}`);

      eventSource.addEventListener("connected", () => {
        setIsLiveConnected(true);
        setLastSyncedTime(new Date());
      });

      eventSource.addEventListener("bookings_update", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.success && Array.isArray(data.bookings)) {
            const clean = data.bookings.filter((b: any) => 
              b && 
              b.id && 
              !b.id.startsWith("CEL-BK-20") && 
              b.customerName !== "عميل كاترنج سيلبر" &&
              !b.customerName?.includes("وهمي") &&
              !b.customerName?.includes("تجريبي")
            );
            updateBookingsState(clean, false);
            setLastSyncedTime(new Date());
            setIsLiveConnected(true);

            // Trigger alert on new booking created!
            if (data.type === "created" && data.booking) {
              playNotificationChime();
              setNewlyAddedBookingId(data.booking.id);
              setLiveIncomingAlert({
                id: data.booking.id,
                customerName: data.booking.customerName || "عميل سيلبر",
                quantity: data.booking.quantity || 50,
                occasion: data.booking.occasion || "حجز مناسبة",
                amount: data.booking.totalPrice || 0
              });
              // Auto-dismiss pulse highlight after 15 seconds
              setTimeout(() => {
                setNewlyAddedBookingId(null);
              }, 15000);
            }
          }
        } catch (err) {
          console.error("Error parsing live stream payload:", err);
        }
      });

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (err) {
      console.error("Error initializing EventSource:", err);
      setIsLiveConnected(false);
    }

    // Cross-tab broadcast listener
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("celebre_admin_realtime_sync");
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "bookings_updated" && Array.isArray(event.data?.bookings)) {
            setBookings(event.data.bookings);
            setLastSyncedTime(new Date());
          }
        };
      }
    } catch {}

    // Resilient fallback polling every 7 seconds
    fallbackPollInterval = setInterval(() => {
      fetchBookings(false);
    }, 7000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (fallbackPollInterval) {
        clearInterval(fallbackPollInterval);
      }
    };
  }, [isOpen, isAuthenticated, isLiveSyncEnabled, soundAlertsEnabled]);

  if (!isOpen) return null;

  // 1. Submit Credentials & Proceed to WhatsApp 2FA
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = adminUsername.trim();
    const cleanPass = adminPassword.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError("يرجى إدخال اسم مستخدم الأدمن وكلمة السر المسجلة.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");
    setLoginNotice("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUser,
          password: cleanPass
        })
      });
      const data = await res.json();

      if (data.require2fa || data.needOtp) {
        if (data.userId) setLoginUserId(data.userId);
        setOtpRequested(true);
        setOtpCountdown(300);
        setResendCooldown(60);
        setCodePreview(null);
        setWhatsappUrl(data.whatsappUrl || data.whatsappLink || "https://wa.me/201284484868");
        setLoginNotice(data.message || "تم التحقق من بيانات الدخول 🛡️ تم إرسال رمز التحقق الثنائي (OTP) إلى واتساب الإدارة (01284484868)");
        setOtpInput("");
      } else if (data.success && (data.token || data.session?.token)) {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, "true");
        const token = data.token || data.session?.token;
        localStorage.setItem("celebre_admin_token", token);
        sessionStorage.setItem("celebre_admin_token", token);
        if (data.session) {
          setCurrentAdminRole(data.session.role || "SUPER_ADMIN");
          setCurrentAdminPerms(data.session.permissions || []);
          localStorage.setItem("celebre_admin_role", data.session.role || "SUPER_ADMIN");
          localStorage.setItem("celebre_admin_perms", JSON.stringify(data.session.permissions || []));
        }
        showNotice("تم التحقق الثنائي بنجاح وتأمين لوحة الإدارة 🔓");
        fetchBookings(true);
      } else {
        setLoginError(data.message || "اسم المستخدم أو كلمة السر غير صحيحة.");
      }
    } catch {
      setLoginError("حدث خطأ في الاتصال بالخادم أثناء تسجيل الدخول.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 1b. Request WhatsApp OTP (Two-Factor Authentication)
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = adminUsername.trim();
    const cleanPass = adminPassword.trim();
    if (!cleanUser || !cleanPass) {
      setLoginError("يرجى إدخال اسم مستخدم الأدمن وكلمة السر المسجلة.");
      return;
    }

    setIsRequestingOtp(true);
    setLoginError("");
    setLoginNotice("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: cleanUser, 
          password: cleanPass
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.userId) setLoginUserId(data.userId);
        setOtpRequested(true);
        setOtpCountdown(300); // 5 minutes validity
        setResendCooldown(60); // 60s cooldown
        setCodePreview(null); // Never preview code in UI for security
        setWhatsappUrl(data.whatsappUrl || data.whatsappLink || "https://wa.me/201284484868");
        setLoginNotice(data.message || "تم إرسال رمز التحقق الثنائي إلى واتساب الأدمن (01284484868)");
        setOtpInput("");
      } else {
        setLoginError(data.message || "اسم المستخدم أو كلمة السر غير صحيحة.");
      }
    } catch (e) {
      console.error(e);
      setLoginError("حدث خطأ في الاتصال بالخادم أثناء طلب رمز التحقق.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // 2. Verify WhatsApp OTP and Authenticate Admin Session
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = otpInput.trim();
    if (!clean || clean.length < 4) {
      setLoginError("يرجى إدخال رمز التحقق المستلم على الواتساب (01284484868)");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: clean, userId: loginUserId || undefined })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, "true");
        const token = data.token || data.session?.token;
        if (token) {
          localStorage.setItem("celebre_admin_token", token);
          sessionStorage.setItem("celebre_admin_token", token);
        }
        if (data.session) {
          setCurrentAdminRole(data.session.role || "SUPER_ADMIN");
          setCurrentAdminPerms(data.session.permissions || []);
          localStorage.setItem("celebre_admin_role", data.session.role || "SUPER_ADMIN");
          localStorage.setItem("celebre_admin_perms", JSON.stringify(data.session.permissions || []));
        }
        showNotice("تم التحقق الثنائي عبر الواتساب بنجاح وتأمين لوحة الإدارة 🛡️");
        fetchBookings(true);
      } else {
        setLoginError(data.message || "رمز التحقق غير صحيح");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      }
    } catch (e) {
      console.error(e);
      setLoginError("حدث خطأ أثناء التحقق من رمز التحقق");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 1. Forgot Password: Request Recovery OTP on Official Project Phone 01284484868
  const handleRequestForgotOtp = async () => {
    setIsRequestingForgotOtp(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      const res = await fetch("/api/admin/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        setForgotOtpRequested(true);
        setForgotCountdown(600); // 10 minutes
        setForgotCodePreview(data.codePreview || null);
        setForgotWhatsappUrl(data.whatsappUrl || null);
        setForgotSuccess("تم إصدار وإرسال رمز استعادة كلمة السر إلى هاتف المشروع الرسمي 01284484868 بنجاح 📱");
      } else {
        setForgotError(data.message || "تعذر إرسال رمز الاستعادة");
      }
    } catch (e) {
      console.error(e);
      setForgotError("حدث خطأ في الاتصال أثناء طلب رمز استعادة كلمة السر");
    } finally {
      setIsRequestingForgotOtp(false);
    }
  };

  // 2. Forgot Password: Submit Code & Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotOtpInput.trim()) {
      setForgotError("يرجى إدخال رمز التحقق المستلم على هاتف المشروع (01284484868)");
      return;
    }
    if (!forgotNewPassword.trim() || forgotNewPassword.trim().length < 3) {
      setForgotError("كلمة السر الجديدة يجب أن تكون 3 خانات أو أكثر");
      return;
    }
    if (forgotNewPassword.trim() !== forgotConfirmPassword.trim()) {
      setForgotError("كلمة السر الجديدة وتأكيدها غير متطابقين");
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await fetch("/api/admin/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetCode: forgotOtpInput.trim(),
          newPassword: forgotNewPassword.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setForgotSuccess("تمت استعادة وتحديث كلمة السر بنجاح! جاري تحويلك للوحة الإدارة 🔒");
        setAdminPassword(forgotNewPassword.trim());
        if (data.token) {
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_KEY, "true");
          localStorage.setItem("celebre_admin_token", data.token);
          sessionStorage.setItem("celebre_admin_token", data.token);
          setTimeout(() => {
            setIsForgotPasswordView(false);
            setForgotOtpInput("");
            setForgotNewPassword("");
            setForgotConfirmPassword("");
            showNotice("تم تحديث كلمة السر بنجاح وتسجيل دخولك إلى لوحة الإدارة 🔓");
            fetchBookings(true);
          }, 800);
        } else {
          setTimeout(() => {
            setIsForgotPasswordView(false);
            setForgotOtpInput("");
            setForgotNewPassword("");
            setForgotConfirmPassword("");
            setLoginNotice("تم تحديث كلمة السر بنجاح! يمكنك الآن تسجيل الدخول بها.");
          }, 1200);
        }
      } else {
        setForgotError(data.message || "فشل التحقق من رمز الاستعادة أو تحديث كلمة السر");
      }
    } catch (e) {
      console.error(e);
      setForgotError("حدث خطأ في الاتصال أثناء تحديث كلمة السر");
    } finally {
      setIsResettingPassword(false);
    }
  };


  // Update Credentials from Settings (تغيير كلمة السر وتأمين الدخول)
  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError("");
    setSecurityNotice("");

    const cleanNew = newPasswordSetting.trim();
    const cleanConfirm = confirmPasswordSetting.trim();

    if (!cleanNew) {
      setSecurityError("يرجى إدخال كلمة السر الجديدة.");
      return;
    }
    if (cleanNew.length < 3) {
      setSecurityError("كلمة السر الجديدة يجب ألا تقل عن 3 خانات.");
      return;
    }
    if (cleanConfirm && cleanNew !== cleanConfirm) {
      setSecurityError("كلمة السر الجديدة وتأكيدها غير متطابقين.");
      return;
    }

    setIsSavingSecurity(true);
    try {
      const res = await fetch("/api/admin/auth/update-credentials", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: currentPasswordSetting.trim() || undefined,
          newPassword: cleanNew,
          newPhone: newPhoneSetting.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        if (newPhoneSetting.trim()) {
          setRegisteredPhone(newPhoneSetting.trim());
        }
        setSecurityNotice(data.message || "تم تغيير وحفظ كلمة السر بنجاح! لا يمكن تسجيل الدخول إلا بها 🔒");
        showNotice("تم تحديث وحفظ كلمة سر الأدمن بنجاح 🔒");
        setTimeout(() => {
          setIsSecuritySettingsOpen(false);
          setSecurityNotice("");
          setSecurityError("");
          setCurrentPasswordSetting("");
          setNewPasswordSetting("");
          setConfirmPasswordSetting("");
        }, 1800);
      } else {
        setSecurityError(data.message || "فشل تحديث كلمة السر");
      }
    } catch (e) {
      console.error(e);
      setSecurityError("حدث خطأ في الاتصال أثناء تحديث كلمة السر");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("celebre_admin_token");
      if (token) {
        await fetch("/api/admin/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {}
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem("celebre_admin_token");
    localStorage.removeItem("celebre_admin_role");
    localStorage.removeItem("celebre_admin_perms");
    setOtpRequested(false);
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
      unitDiscount: 0,
      totalDiscount: 0,
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
    const unitDiscount = booking.unitDiscount || 0;
    const totalDiscount = booking.totalDiscount !== undefined ? booking.totalDiscount : (unitDiscount * booking.quantity);
    setEditingBooking({
      ...booking,
      unitDiscount,
      totalDiscount
    });
    setIsNewBooking(false);
    setIsEditModalOpen(true);
  };

  // إرسال تفاصيل نموذج الحجز لواتساب العميل
  const handleSendVoucherWhatsApp = (b: AdminBooking) => {
    const msg = `*نموذج حجز وضيافة كاترنج سيلبر الرسمي 🌸*
رقم الحجز: ${b.id}
-----------------------------
*بيانات العميل:*
- الاسم: ${b.customerName}
- الهاتف: ${b.phone}
- المناسبة: ${b.occasion}
- التاريخ: ${b.eventDate} (${b.eventTime})
- مكان التسليم: ${b.deliveryAddress}

*تفاصيل الوجبة:*
- الوجبة: ${b.packageCode} - ${b.packageName}
- المشروب: ${b.drinkOptionLabel || "عصير بخيرة مشمول"}
- مواصفات العلبة: كرتونية مذهبة محكمة الإغلاق مع شوكة ومنديل معقم

*الحساب المالي:*
- عدد الوجبات: ${b.quantity} علبة
- سعر الوجبة: ${b.unitPrice} جنيه
- إجمالي التعاقد: ${b.totalPrice.toLocaleString()} جنيه
- العربون المسدد: ${b.depositPaid.toLocaleString()} جنيه
- المتبقي عند الاستلام: ${b.remainingAmount.toLocaleString()} جنيه
- حالة السداد: ${b.paymentStatus === "fully_paid" ? "مسدد بالكامل ✓" : b.depositPaid > 0 ? "عربون مسدد" : "قيد السداد"}
-----------------------------
⚠️ *ملاحظة هامة:* التوصيل غير مشمول في سعر الوجبات ويتم التنسيق بشأنه.
شكراً لاختياركم سيلبر كاترنج! ✨`;
    const clean = b.phone.replace(/[^0-9]/g, "");
    const targetPhone = clean.startsWith("0") ? "2" + clean : clean.startsWith("2") ? clean : "20" + clean;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank");
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
          headers: getAuthHeaders(),
          body: JSON.stringify(editingBooking)
        });
        const data = await res.json();
        const saved = (data.success && data.booking) ? data.booking : editingBooking;
        updateBookingsState([saved, ...bookings]);
        showNotice(`تمت إضافة حجز "${saved.customerName}" بنجاح.`);
      } else {
        const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
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
      await fetch(`/api/admin/bookings/${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
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
      await fetch("/api/admin/bookings/reset", { 
        method: "POST",
        headers: getAuthHeaders()
      });
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

  // Dynamic calculations when admin grants/changes meal unit discount (صلاحية خصم الإدارة)
  const handleDiscountChangeInModal = (discountPerBox: number) => {
    if (!editingBooking) return;
    const safeDiscount = Math.max(0, Math.floor(discountPerBox));
    const basePrice = editingBooking.basePrice;
    const drinkPriceDelta = editingBooking.drinkPriceDelta;
    const originalUnitPrice = basePrice + drinkPriceDelta;
    const unitPrice = Math.max(0, originalUnitPrice - safeDiscount);
    const totalDiscount = safeDiscount * editingBooking.quantity;
    const totalPrice = unitPrice * editingBooking.quantity;
    const remainingAmount = Math.max(0, totalPrice - editingBooking.depositPaid);
    const paymentStatus = editingBooking.depositPaid >= totalPrice && totalPrice > 0 
      ? "fully_paid" 
      : editingBooking.depositPaid > 0 
      ? "deposit_paid" 
      : "pending_payment";

    setEditingBooking({
      ...editingBooking,
      unitDiscount: safeDiscount,
      totalDiscount,
      unitPrice,
      totalPrice,
      remainingAmount,
      paymentStatus
    });
  };

  // Dynamic calculations when selecting a package in the modal
  const handlePackageSelectInModal = (pkgCode: string) => {
    if (!editingBooking) return;
    const found = CATERING_PACKAGES.find(p => p.saleCode === pkgCode);
    if (found) {
      const basePrice = found.pricePerBox;
      const unitDiscount = editingBooking.unitDiscount || 0;
      const unitPrice = Math.max(0, basePrice + editingBooking.drinkPriceDelta - unitDiscount);
      const totalDiscount = unitDiscount * editingBooking.quantity;
      const totalPrice = unitPrice * editingBooking.quantity;
      const shippingFee = editingBooking.shippingFee || 0;
      const totalWithShipping = totalPrice + shippingFee;
      const remainingAmount = Math.max(0, totalWithShipping - editingBooking.depositPaid);
      const paymentStatus = editingBooking.depositPaid >= totalWithShipping && totalWithShipping > 0 
        ? "fully_paid" 
        : editingBooking.depositPaid > 0 
        ? "deposit_paid" 
        : "pending_payment";

      setEditingBooking({
        ...editingBooking,
        packageCode: found.saleCode,
        packageName: found.name,
        basePrice,
        unitDiscount,
        totalDiscount,
        unitPrice,
        totalPrice,
        remainingAmount,
        paymentStatus
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

    const unitDiscount = editingBooking.unitDiscount || 0;
    const unitPrice = Math.max(0, editingBooking.basePrice + drinkPriceDelta - unitDiscount);
    const totalDiscount = unitDiscount * editingBooking.quantity;
    const totalPrice = unitPrice * editingBooking.quantity;
    const shippingFee = editingBooking.shippingFee || 0;
    const totalWithShipping = totalPrice + shippingFee;
    const remainingAmount = Math.max(0, totalWithShipping - editingBooking.depositPaid);
    const paymentStatus = editingBooking.depositPaid >= totalWithShipping && totalWithShipping > 0 
      ? "fully_paid" 
      : editingBooking.depositPaid > 0 
      ? "deposit_paid" 
      : "pending_payment";

    setEditingBooking({
      ...editingBooking,
      drinkOption: opt,
      drinkOptionLabel,
      drinkPriceDelta,
      unitDiscount,
      totalDiscount,
      unitPrice,
      totalPrice,
      remainingAmount,
      paymentStatus
    });
  };

  const handleQuantityChangeInModal = (qty: number) => {
    if (!editingBooking) return;
    const safeQty = Math.max(1, qty);
    const unitDiscount = editingBooking.unitDiscount || 0;
    const totalDiscount = unitDiscount * safeQty;
    const totalPrice = editingBooking.unitPrice * safeQty;
    const shippingFee = editingBooking.shippingFee || 0;
    const totalWithShipping = totalPrice + shippingFee;
    const remainingAmount = Math.max(0, totalWithShipping - editingBooking.depositPaid);
    const paymentStatus = editingBooking.depositPaid >= totalWithShipping && totalWithShipping > 0 
      ? "fully_paid" 
      : editingBooking.depositPaid > 0 
      ? "deposit_paid" 
      : "pending_payment";

    setEditingBooking({
      ...editingBooking,
      quantity: safeQty,
      totalDiscount,
      totalPrice,
      remainingAmount,
      paymentStatus
    });
  };

  const handleDepositChangeInModal = (deposit: number) => {
    if (!editingBooking) return;
    const safeDeposit = Math.max(0, deposit);
    const shippingFee = editingBooking.shippingFee || 0;
    const totalWithShipping = editingBooking.totalPrice + shippingFee;
    const remainingAmount = Math.max(0, totalWithShipping - safeDeposit);
    const paymentStatus = safeDeposit >= totalWithShipping && totalWithShipping > 0 
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

  // Dedicated Handler: Admin Sets / Edits Shipping Fees (مصاريف الشحن تعبأ من قبل الـ admin)
  const handleShippingFeeChangeInModal = (fee: number) => {
    if (!editingBooking) return;
    const safeFee = Math.max(0, fee);
    const totalWithShipping = editingBooking.totalPrice + safeFee;
    const remainingAmount = Math.max(0, totalWithShipping - editingBooking.depositPaid);
    const paymentStatus = editingBooking.depositPaid >= totalWithShipping && totalWithShipping > 0 
      ? "fully_paid" 
      : editingBooking.depositPaid > 0 
      ? "deposit_paid" 
      : "pending_payment";

    setEditingBooking({
      ...editingBooking,
      shippingFee: safeFee,
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
      (statusFilter === "has_remaining" && b.remainingAmount > 0) ||
      (statusFilter === "website_orders" && (
        (b.phoneAgreementNotes && (b.phoneAgreementNotes.includes("موقع") || b.phoneAgreementNotes.includes("إلكتروني"))) ||
        b.customerName.includes("موقع") ||
        b.id.startsWith("CEL-")
      ));

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
  const totalShippingFees = filteredBookings.reduce((sum, b) => sum + (b.shippingFee || 0), 0);
  const totalContractRevenue = totalRevenue + totalShippingFees;
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
      "تكلفة الوجبات (جنيه)": b.totalPrice,
      "مصاريف الشحن (الـ Admin)": b.shippingFee || 0,
      "إجمالي التعاقد شامل الشحن (جنيه)": b.totalPrice + (b.shippingFee || 0),
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
      "تكلفة الوجبات (جنيه)": totalRevenue as any,
      "مصاريف الشحن (الـ Admin)": totalShippingFees as any,
      "إجمالي التعاقد شامل الشحن (جنيه)": totalContractRevenue as any,
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
        backgroundColor: "#FFFFFF",
        onclone: (clonedDoc) => {
          const dummy = clonedDoc.createElement("canvas");
          const ctx = dummy.getContext("2d");
          const toSafe = (val: string) => {
            if (!val || (!val.includes("oklab") && !val.includes("oklch"))) return val;
            if (!ctx) return "#221B17";
            try {
              ctx.fillStyle = "#000000";
              ctx.fillStyle = val;
              return ctx.fillStyle;
            } catch {
              return "#221B17";
            }
          };
          const all = Array.from(clonedDoc.querySelectorAll("*")) as HTMLElement[];
          const win = clonedDoc.defaultView || window;
          all.forEach(el => {
            if (!el.style) return;
            const comp = win.getComputedStyle(el);
            ["color", "background-color", "border-color", "outline-color", "fill", "stroke"].forEach(p => {
              const v = comp.getPropertyValue(p);
              if (v && (v.includes("oklab") || v.includes("oklch"))) {
                el.style.setProperty(p, v.replace(/okl(ab|ch)\([^)]+\)/gi, m => toSafe(m)), "important");
              }
            });
          });
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto admin-modal-backdrop modal-backdrop-safe">
      <div className="relative w-full max-w-7xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden my-auto max-h-[96vh] max-h-[96dvh] flex flex-col admin-modal-card">
        
        {/* ACTION TOAST NOTICE */}
        {actionNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#221B17] text-white px-4 py-2 rounded-xl shadow-xl border border-[#C89B3C] text-xs font-bold flex items-center gap-2 animate-bounce-in">
            <Sparkles className="w-4 h-4 text-[#C89B3C]" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* LOGIN SCREEN IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-auto w-full animate-fadeIn">
            {/* Security Shield Icon */}
            <div className="w-16 h-16 rounded-3xl bg-[#5C1027]/10 border-2 border-[#C89B3C]/50 flex items-center justify-center mb-4 text-[#5C1027] shadow-xs">
              <ShieldCheck className="w-9 h-9 text-[#5C1027]" />
            </div>

            <CelebreLogo size="sm" showSlogan={false} className="mb-2" />
            <h3 className="text-xl sm:text-2xl font-black text-[#221B17] mt-1">
              تسجيل دخول الأدمن • بورد الحجوزات
            </h3>
            
            {/* Security Explanation Banner */}
            <div className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-3 my-2 text-right text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#5C1027]">
                <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                <span>لوحة إدارة المبيعات والحجوزات الرسمية • نظام أمان مشدد (2FA)</span>
              </div>
              <p className="text-[11px] text-[#7A6E65] leading-relaxed">
                مخصصة حصراً لأدمن ومسؤول تعاقدات سيلبر. يتطلب الدخول مطابقة كلمة السر المسجلة كاملة والتحقق من رمز الأمان (OTP) المرسل إلى واتساب الأدمن: <strong className="font-mono text-[#5C1027]">01284484868</strong>.
              </p>
            </div>

            {/* FEEDBACK ALERTS */}
            {loginError && (
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold mb-3 flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            {loginNotice && (
              <div className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold mb-3 flex items-center gap-2 text-right">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{loginNotice}</span>
              </div>
            )}

            {/* VIEW 1: DIRECT SECURE ADMIN PASSWORD RECOVERY */}
            {isForgotPasswordView ? (
              <div className="w-full space-y-4 text-right animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordView(false);
                    setForgotError("");
                    setForgotSuccess("");
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#7A6E65] hover:text-[#5C1027] font-bold cursor-pointer transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-[#C89B3C]" />
                  <span>العودة لشاشة الدخول الرئيسية</span>
                </button>

                <div className="bg-[#FAF7F2] border-2 border-[#C89B3C]/50 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#5C1027]/10 border border-[#C89B3C] flex items-center justify-center text-[#5C1027] mx-auto mb-2 shadow-xs">
                    <KeyRound className="w-6 h-6 text-[#5C1027]" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-[#221B17]">
                    استعادة وتعيين كلمة سر جديدة للإدارة
                  </h4>
                  <p className="text-xs text-[#7A6E65] mt-1 leading-relaxed">
                    أدخل هاتف الإدارة المسجل أو كود الأمان، ثم اكتب كلمة السر الجديدة التي ترغب بها للدخول الفوري:
                  </p>
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#4A3E38]">
                        هاتف الإدارة المسجل أو كود الأمان: *
                      </label>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={forgotOtpInput}
                      onChange={(e) => setForgotOtpInput(e.target.value)}
                      placeholder="أدخل رمز التحقق (OTP) المكون من 6 أرقام"
                      required
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 rounded-xl text-center text-sm font-mono font-bold text-[#5C1027] focus:outline-hidden focus:border-[#5C1027]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                      كلمة السر الجديدة: *
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                      <input
                        type={forgotShowPassword ? "text" : "password"}
                        dir="ltr"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="أدخل كلمة السر الجديدة (3 خانات فأكثر)"
                        required
                        className="w-full pr-10 pl-10 py-2.5 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 rounded-xl text-xs font-bold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                      />
                      <button
                        type="button"
                        onClick={() => setForgotShowPassword(!forgotShowPassword)}
                        className="absolute left-3 top-3 text-[11px] text-[#7A6E65] hover:text-[#5C1027] font-bold cursor-pointer"
                      >
                        {forgotShowPassword ? "إخفاء" : "إظهار"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                      تأكيد كلمة السر الجديدة: *
                    </label>
                    <input
                      type={forgotShowPassword ? "text" : "password"}
                      dir="ltr"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة السر الجديدة للتأكيد"
                      required
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 rounded-xl text-xs font-bold text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="w-full py-3 bg-[#5C1027] hover:bg-[#721832] text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                    <span>{isResettingPassword ? "جاري الحفظ والتأكيد..." : "تأكيد وتحديث كلمة السر والدخول فوراً 🔒"}</span>
                  </button>
                </form>
              </div>
            ) : !otpRequested ? (
              /* VIEW 2: STEP 1 - SECURE ADMIN CREDENTIALS FORM */
              <div className="w-full space-y-4 text-right animate-fadeIn">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="bg-[#FAF7F2] border border-[#E8DFD1] p-3 rounded-2xl flex items-center justify-between text-xs text-[#5C1027] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#5C1027] text-white flex items-center justify-center text-xs font-black">
                        <Lock className="w-3.5 h-3.5 text-[#C89B3C]" />
                      </div>
                      <span>تسجيل دخول لوحة الإدارة والحجوزات</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                      أمان مشدد 2FA 🛡️
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4A3E38] mb-1.5">
                      اسم مستخدم الأدمن أو رقم هاتف الإدارة: *
                    </label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-3.5 w-4 h-4 text-[#7A6E65]" />
                      <input
                        type="text"
                        dir="ltr"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="اسم المستخدم أو هاتف الإدارة"
                        required
                        autoComplete="username"
                        className="w-full pr-10 pl-3 py-3 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 rounded-2xl text-sm font-bold text-[#221B17] font-mono focus:outline-hidden focus:border-[#5C1027] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#4A3E38]">
                        كلمة سر الأدمن: *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordView(true);
                          setForgotOtpInput("");
                          setForgotError("");
                          setForgotSuccess("");
                          setLoginError("");
                          setLoginNotice("");
                        }}
                        className="text-[11px] text-[#5C1027] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>نسيت كلمة المرور؟</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-[#7A6E65]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        dir="ltr"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="كلمة سر الإدارة المسجلة"
                        required
                        autoComplete="current-password"
                        className="w-full pr-10 pl-12 py-3 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 rounded-2xl text-sm font-bold text-[#221B17] font-mono focus:outline-hidden focus:border-[#5C1027] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3.5 top-3.5 text-xs text-[#7A6E65] hover:text-[#5C1027] font-bold cursor-pointer"
                      >
                        {showPassword ? "إخفاء" : "إظهار"}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] hover:brightness-110 text-white rounded-2xl font-black text-sm sm:text-base shadow-lg border-2 border-[#C89B3C] flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                    >
                      <ShieldCheck className={`w-5 h-5 text-[#C89B3C] ${isLoggingIn ? "animate-spin" : ""}`} />
                      <span>
                        {isLoggingIn ? "جاري التحقق والربط بالواتساب..." : "المتابعة والتحقق الثنائي عبر الواتساب (01284484868) 📱"}
                      </span>
                    </button>
                  </div>

                  <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-right text-[11px] text-amber-900 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <span>🛡️ منظومة أمان لوحة التحكم (2FA):</span>
                    </div>
                    <p>
                      • لحماية بيانات الحجوزات والعملاء، لا يتم الدخول إلا بعد التحقق الثنائي عبر كود الأمان المرسل إلى واتساب هاتف الإدارة الرسمي (01284484868).
                    </p>
                    <p>
                      • بعد التحقق، يتم حفظ جلسة الأدمن على متصفحك لمدة 30 يوماً بشكل آمن لراحتك.
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              /* VIEW 3: STEP 2 - ENTER & VERIFY WHATSAPP OTP */
              <form onSubmit={handleVerifyOtp} className="w-full space-y-4 text-right animate-fadeIn">
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-right space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black">2</span>
                      <span>التحقق الثنائي عبر الواتساب (2FA)</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{formatCountdown(otpCountdown)}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    تم إرسال رمز التحقق الثنائي المكون من 6 أرقام إلى واتساب الإدارة المعتمد:{" "}
                    <strong dir="ltr" className="font-mono text-[#5C1027] font-black">01284484868</strong>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#4A3E38] block mb-1">
                    أدخل رمز التحقق (OTP) المستلم على الواتساب: *
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3.5 top-3.5 w-5 h-5 text-[#7A6E65]" />
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="6 أرقام"
                      autoFocus
                      required
                      className="w-full pr-12 pl-4 py-3 bg-[#FAF7F2] border-2 border-[#C89B3C] rounded-2xl text-center text-2xl font-mono font-black text-[#5C1027] tracking-widest focus:outline-hidden focus:border-[#5C1027]"
                    />
                  </div>
                </div>

                {/* Direct Link to WhatsApp on Project Phone */}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-black text-emerald-900 flex items-center justify-center gap-2 transition-all shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>فتح محادثة واتساب (01284484868) لمراجعة الرمز 💬</span>
                  </a>
                )}

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn || !otpInput.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] hover:brightness-110 text-white rounded-2xl font-black text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className={`w-5 h-5 text-[#C89B3C] ${isLoggingIn ? "animate-spin" : ""}`} />
                  <span>{isLoggingIn ? "جاري التحقق من الرمز وتأمين الدخول..." : "تأكيد الرمز ودخول لوحة الإدارة 🔓"}</span>
                </button>

                {/* Resend and Switch Options */}
                <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={resendCooldown > 0 || isRequestingOtp}
                    className="text-[11px] text-[#5C1027] hover:underline font-bold disabled:text-stone-400 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `إعادة طلب رمز جديد بعد (${resendCooldown} ث)` : "إعادة إرسال رمز جديد عبر الواتساب 🔄"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequested(false);
                      setOtpInput("");
                      setLoginError("");
                      setLoginNotice("");
                    }}
                    className="text-[11px] text-[#7A6E65] hover:text-[#5C1027] hover:underline font-bold cursor-pointer"
                  >
                    تغيير بيانات الدخول ↩️
                  </button>
                </div>
              </form>
            )}

            {/* Back to Site Button */}
            <div className="pt-4 mt-4 border-t border-[#F0EAE1] w-full flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#7A6E65]">
                أدمن سيلبر المعتمد: <span dir="ltr" className="font-bold text-[#5C1027]">01284484868</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#7A6E65] hover:text-[#221B17] font-semibold cursor-pointer hover:underline"
              >
                العودة للموقع الرئيسي
              </button>
            </div>
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

              <div className="flex items-center gap-2 flex-wrap">
                {/* Real-Time Live Sync Status Badge */}
                <div 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                    isLiveConnected 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                      : isLiveSyncEnabled
                      ? "bg-amber-50 border-amber-300 text-amber-900"
                      : "bg-stone-100 border-stone-300 text-stone-600"
                  }`}
                  title={isLiveConnected ? "متصل بالخادم وتصلك الحجوزات والتعديلات فورياً لحظة بلحظة" : "جاري الاتصال أو المزامنة التلقائية"}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    {isLiveConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isLiveConnected ? "bg-emerald-600" : isLiveSyncEnabled ? "bg-amber-500 animate-pulse" : "bg-stone-400"
                    }`}></span>
                  </span>
                  <span className="font-black text-[11px]">
                    {isLiveConnected ? "مُحدّث لحظياً (مباشر)" : isLiveSyncEnabled ? "مزامنة لحظية..." : "مزامنة متوقفة"}
                  </span>
                  {lastSyncedTime && (
                    <span className="text-[10px] text-[#7A6E65] border-r border-[#E8DFD1] pr-1.5 mr-0.5 font-mono">
                      {lastSyncedTime.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  )}
                </div>

                {/* Sound Alert Toggle */}
                <button
                  type="button"
                  onClick={() => setSoundAlertsEnabled(prev => !prev)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                    soundAlertsEnabled 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100" 
                      : "bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200"
                  }`}
                  title={soundAlertsEnabled ? "تنبيه صوتي مفعل عند ورود حجز جديد (انقر للكتم)" : "التنبيه الصوتي مكتوم (انقر للتفعيل)"}
                >
                  {soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
                  <span className="hidden md:inline">{soundAlertsEnabled ? "صوت التنبيه" : "مكتوم"}</span>
                </button>

                {/* Live Sync Pause/Resume */}
                <button
                  type="button"
                  onClick={() => setIsLiveSyncEnabled(prev => !prev)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                    isLiveSyncEnabled
                      ? "bg-white border-[#E8DFD1] text-[#4A3E38] hover:bg-[#EFE8DD]"
                      : "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                  }`}
                  title={isLiveSyncEnabled ? "إيقاف المزامنة اللحظية مؤقتاً" : "استئناف المزامنة اللحظية المباشرة"}
                >
                  <Radio className={`w-3.5 h-3.5 ${isLiveSyncEnabled ? "text-emerald-600 animate-pulse" : "text-stone-400"}`} />
                  <span className="hidden lg:inline">{isLiveSyncEnabled ? "المزامنة نشطة" : "استئناف المباشر"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewPhoneSetting(registeredPhone || "01284484868");
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
                  onClick={() => {
                    fetchAuditLogs();
                    setIsAuditLogsOpen(true);
                  }}
                  className="p-2 rounded-xl bg-white border border-[#E8DFD1] hover:bg-[#EFE8DD] text-[#4A3E38] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="سجل الأمان وعمليات النظام (Audit Logs)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span className="hidden sm:inline">سجل الأمان 🛡️</span>
                </button>

                <button
                  type="button"
                  onClick={() => fetchBookings(true)}
                  className="p-2 rounded-xl bg-white border border-[#E8DFD1] hover:bg-[#EFE8DD] text-[#4A3E38] text-xs font-bold flex items-center gap-1.5"
                  title="تحديث فوري للبيانات من السيرفر"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBookings ? "animate-spin text-[#5C1027]" : "text-[#4A3E38]"}`} />
                  <span className="hidden sm:inline">تحديث</span>
                </button>

                <div
                  className="px-2.5 py-1.5 rounded-xl bg-[#5C1027]/10 border border-[#C89B3C]/50 text-[#5C1027] text-xs font-black flex items-center gap-1.5 shadow-2xs"
                  title={`رتبة الحساب: ${currentAdminRole} • الصلاحيات النشطة: ${currentAdminPerms.length > 0 ? currentAdminPerms.length + ' صلاحية' : 'كاملة'}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>{currentAdminRole}</span>
                </div>

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

            {/* LIVE INCOMING BOOKING TOAST BANNER */}
            {liveIncomingAlert && (
              <div className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950 font-bold shadow-lg animate-bounce-in shrink-0 no-print">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <BellRing className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#5C1027]">🔔 وصل حجز جديد للتو لحظياً!</span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {liveIncomingAlert.id}
                      </span>
                    </div>
                    <p className="text-emerald-900 text-xs mt-0.5">
                      العميل: <span className="font-black text-emerald-950">{liveIncomingAlert.customerName}</span> • عدد الوجبات: <span className="font-black text-[#5C1027]">{liveIncomingAlert.quantity} علبة</span> • المناسبة: {liveIncomingAlert.occasion} • الإجمالي: {liveIncomingAlert.amount.toLocaleString()} ج.م
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(liveIncomingAlert.id);
                      setLiveIncomingAlert(null);
                    }}
                    className="px-3.5 py-1.5 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>تحديد الحجز في الجدول</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveIncomingAlert(null)}
                    className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-200/60"
                    title="إغلاق التنبيه"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* KPI Summary Dashboard Bar */}
            <div className="bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#5C1027] text-white p-4 grid grid-cols-2 sm:grid-cols-6 gap-2.5 shrink-0 no-print">
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-[#F4EEDB]">عدد الحجوزات</div>
                <div className="text-xl font-black">{totalBookingsCount} حجز</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-[#F4EEDB]">إجمالي الوجبات</div>
                <div className="text-xl font-black text-[#C89B3C]">{totalBoxesCount.toLocaleString()} علبة</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-[#F4EEDB]">تكلفة الوجبات</div>
                <div className="text-xl font-black">{totalRevenue.toLocaleString()} ج</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-blue-200">مصاريف الشحن (الـ Admin)</div>
                <div className="text-xl font-black text-blue-200">{totalShippingFees.toLocaleString()} ج</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="text-[11px] text-emerald-300">مبلغ الحجز المحصل</div>
                <div className="text-xl font-black text-emerald-300">{totalDepositCollected.toLocaleString()} ج</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/15 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-amber-300">المتبقي للتحصيل</div>
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

                {filteredBookings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewBooking(filteredBookings[0])}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#5C1027] to-[#721832] text-white hover:brightness-110 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer border border-[#C89B3C]/50"
                    title="استعراض وتفحص نموذج الحجز الرسمي"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>استعراض نموذج الحجز 📄</span>
                  </button>
                )}

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
                  <option value="all">كافة حالات السداد والحجوزات</option>
                  <option value="website_orders">حجوزات واردة من الموقع / الواتساب 💬</option>
                  <option value="deposit_paid">تم سداد العربون</option>
                  <option value="fully_paid">تم سداد كامل المبلغ</option>
                  <option value="has_remaining">متبقي مبالغ للتحصيل</option>
                  <option value="pending_payment">بانتظار السداد</option>
                </select>

                {/* Sort Toggle */}
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  className="p-2 rounded-xl bg-white border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] flex items-center gap-1 cursor-pointer"
                  title="عكس اتجاه الترتيب"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{sortOrder === "asc" ? "تصاعدي" : "تنازلي"}</span>
                </button>
              </div>
            </div>

            {/* High-Security & Sole Admin Responsibility Notice Banner */}
            <div className="bg-[#FAF7F2] border-b border-[#E8DFD1] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5C1027] font-bold shrink-0 no-print">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C89B3C] shrink-0" />
                <span>استعراض ومراجعة الحجوزات الواردة من العملاء عبر الواتساب مسؤولية أدمن الموقع الوحيد المعتمد.</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#7A6E65]">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>جلسة موثقة برمز مؤقت (OTP) • هاتف المشروع: <strong className="font-mono text-[#5C1027]">{registeredPhone || "01284484868"}</strong></span>
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
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[90px] bg-[#430B1C]">تكلفة الوجبات</th>
                    <th className="p-2.5 border-r border-[#721832] font-black text-center min-w-[100px] bg-[#1E3A8A] text-blue-100">مصاريف الشحن (الـ Admin)</th>
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
                      <td colSpan={18} className="p-12 text-center text-[#7A6E65]">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-2xl bg-[#5C1027]/10 flex items-center justify-center text-[#5C1027]">
                            <FileSpreadsheet className="w-6 h-6 text-[#C89B3C]" />
                          </div>
                          <span className="font-black text-base text-[#221B17]">قاعدة بيانات الحجوزات نظيفة ومستعدة لاستقبال الحجوزات 📋</span>
                          <span className="text-xs text-[#7A6E65] leading-relaxed">
                            تم تنظيف وحذف جميع البيانات السابقة والوهمية. سيتم حفظ وتوثيق أي نموذج يملأه العميل ويرسله عبر واتساب تلقائياً هنا في قاعدة البيانات فورياً، كما يمكن للإدارة إضافة أي حجز وتعديله في أي وقت.
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenAddNew}
                            className="mt-2 px-4 py-2 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#C89B3C]" />
                            <span>+ إضافة حجز جديد من الإدارة</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b, idx) => {
                      const isNewLive = b.id === newlyAddedBookingId;
                      return (
                      <tr 
                        key={b.id} 
                        className={`transition-all ${
                          isNewLive 
                            ? "bg-amber-100/95 ring-2 ring-[#C89B3C] shadow-inner" 
                            : idx % 2 === 0 ? "bg-white hover:bg-[#FAF7F2]" : "bg-[#F8FAFC] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        {/* 1. Row Index */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-bold text-[#64748B] bg-[#F1F5F9]/50">
                          {idx + 1}
                        </td>

                        {/* 2. Booking ID */}
                        <td className="p-2 border-r border-[#E2E8F0] font-mono font-bold text-[#5C1027]">
                          <div className="flex items-center gap-1">
                            <span>{b.id}</span>
                            {isNewLive && (
                              <span className="bg-[#5C1027] text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-bounce inline-flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-[#C89B3C]" />
                                <span>جديد</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Customer Name (بيان نصي) */}
                        <td className="p-2 border-r border-[#E2E8F0] font-bold text-[#0F172A]">
                          <div>{b.customerName}</div>
                          {b.depositPaid === 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 mt-0.5">
                              <span>حجز مبدئي (WhatsApp)</span>
                            </span>
                          )}
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

                        {/* 7. Package Name & Customization */}
                        <td className="p-2 border-r border-[#E2E8F0] text-[#0F172A]">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-black text-[#C89B3C] bg-[#5C1027]/5 px-1.5 py-0.2 rounded text-[10px] border border-[#C89B3C]/30 shrink-0">
                              {b.packageCode}
                            </span>
                            {["Sale - 13", "Sale - 14", "Sale - 15", "Sale - 16", "Sale - 17", "Sale - 18"].includes(b.packageCode) ? (
                              <span className="font-bold text-[10px] text-amber-800 bg-amber-100 px-1 rounded border border-amber-300">
                                Box سندوتش
                              </span>
                            ) : (
                              <span className="font-bold text-[11px] text-[#5C1027]">وجبة الموقع</span>
                            )}
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
                          <div>{b.unitPrice} ج</div>
                          {b.unitDiscount && b.unitDiscount > 0 ? (
                            <div 
                              className="text-[9px] text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-black inline-block mt-0.5" 
                              title={`خصم إداري: ${b.unitDiscount} ج لكل علبة (إجمالي الوفر: ${b.totalDiscount || (b.unitDiscount * b.quantity)} ج)`}
                            >
                              خصم {b.unitDiscount} ج
                            </div>
                          ) : null}
                        </td>

                        {/* 10. Quantity (بيان رقمي) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-black text-[#0F172A] bg-amber-50/20">
                          {b.quantity}
                        </td>

                        {/* 11. Total Price (تكلفة الوجبات) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-black text-[#5C1027] bg-[#FAF7F2]">
                          {b.totalPrice.toLocaleString()} ج
                        </td>

                        {/* 12. Shipping Fee (مصاريف الشحن تعبأ من قبل الـ admin) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-bold text-blue-900 bg-blue-50/40">
                          {b.shippingFee && b.shippingFee > 0 ? (
                            <span className="font-mono font-black">{b.shippingFee.toLocaleString()} ج</span>
                          ) : (
                            <span className="text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded font-bold border border-blue-200" title="تعبأ وتحدد من قبل الأدمن">
                              0 ج (تحدد لاحقاً)
                            </span>
                          )}
                        </td>

                        {/* 13. Deposit Paid (مبلغ الحجز / العربون المسدد) */}
                        <td className="p-2 border-r border-[#E2E8F0] text-center font-black text-emerald-800 bg-emerald-50/40">
                          {b.depositPaid.toLocaleString()} ج
                        </td>

                        {/* 14. Remaining Amount (الباقي المستحق) */}
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewBooking(b)}
                              className="px-2.5 py-1 rounded-lg bg-[#5C1027] hover:bg-[#721832] text-white text-[11px] font-black shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="استعراض نموذج الحجز الرسمي لسيلبر"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                              <span>استعراض النموذج</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendVoucherWhatsApp(b)}
                              className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              title="متابعة الحجز على واتساب العميل"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(b)}
                              className="p-1 rounded-lg hover:bg-[#EFE8DD] text-[#5C1027] border border-[#E8DFD1]"
                              title="تعديل الحجز"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(b.id, b.customerName)}
                              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 border border-rose-200"
                              title="حذف الحجز من السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
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
                    <td className="p-2.5 border-r border-[#CBD5E1] text-center font-black text-blue-900 bg-blue-100/70">
                      {totalShippingFees.toLocaleString()} ج
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

      {/* OFFICIAL CELEBRE BOOKING VOUCHER PREVIEW MODAL */}
      {previewBooking && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto no-print">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-2 border-[#C89B3C]/50 overflow-hidden my-6 max-h-[94vh] flex flex-col">
            {/* Modal Top Bar */}
            <div className="px-6 py-3.5 bg-gradient-to-r from-[#FAF7F2] via-[#F4EEDB] to-[#FAF7F2] border-b border-[#E8DFD1] flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <CelebreLogo size="xs" showSlogan={false} />
                <div>
                  <h4 className="font-black text-base text-[#221B17]">
                    نموذج استعراض وتأكيد الحجز الرسمي
                  </h4>
                  <p className="text-[11px] text-[#7A6E65]">
                    سجل مبيعات سيلبر كاترنج • كود الحجز: <span className="font-mono font-bold text-[#5C1027]">{previewBooking.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(previewBooking);
                    setPreviewBooking(null);
                  }}
                  className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EFE8DD] border border-[#C89B3C] text-[#5C1027] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="تعديل هذا الحجز"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>تعديل الحجز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBooking(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] flex items-center justify-center text-[#221B17] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div id="printable-single-booking-voucher" className="overflow-y-auto p-5 sm:p-7 space-y-5 text-right bg-gradient-to-b from-[#FAF7F2]/40 to-white">
              {/* Official Header Banner on Voucher */}
              <div className="border-2 border-[#C89B3C]/40 rounded-2xl p-4 bg-white shadow-xs">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#F0EAE1] pb-3 text-center sm:text-right">
                  <div className="flex items-center gap-3">
                    <CelebreLogo size="sm" showSlogan={true} />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5C1027] text-white text-xs font-black shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>نموذج حجز معتمد • سيلبر كاترنج</span>
                    </div>
                    <div className="text-xs text-[#7A6E65] font-mono mt-1">
                      كود التعاقد: <strong className="text-[#5C1027] font-black">{previewBooking.id}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD1]">
                    <span className="text-[10px] text-[#7A6E65] block font-bold">تاريخ تحرير الحجز</span>
                    <span className="font-bold text-[#221B17]">
                      {new Date(previewBooking.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD1]">
                    <span className="text-[10px] text-[#7A6E65] block font-bold">تاريخ وتوقيت المناسبة</span>
                    <span className="font-bold text-[#5C1027]">
                      {previewBooking.eventDate} ({previewBooking.eventTime})
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD1]">
                    <span className="text-[10px] text-[#7A6E65] block font-bold">حالة الحجز</span>
                    <span className="font-black text-[#5C1027]">
                      {previewBooking.orderStatus === "confirmed" ? "مؤكد ومعتمد" : previewBooking.orderStatus === "in_preparation" ? "قيد التجهيز" : previewBooking.orderStatus === "delivered" ? "تم التسليم بنجاح" : "معلق"}
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD1]">
                    <span className="text-[10px] text-[#7A6E65] block font-bold">حالة سداد العربون</span>
                    <span className={`font-black ${previewBooking.paymentStatus === "fully_paid" ? "text-emerald-700" : "text-amber-800"}`}>
                      {previewBooking.paymentStatus === "fully_paid" ? "مسدد بالكامل ✓" : previewBooking.depositPaid > 0 ? `مسدد عربون (${previewBooking.depositPaid.toLocaleString()} ج)` : "في انتظار العربون"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Customer & Event Information */}
              <div className="bg-white border border-[#E8DFD1] rounded-2xl p-4 shadow-xs">
                <h5 className="font-black text-sm text-[#5C1027] border-b border-[#F0EAE1] pb-2 mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#C89B3C]" />
                  <span>1. بيانات العميل والمناسبة</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#7A6E65] block mb-0.5 font-bold">اسم صاحب المناسبة:</span>
                    <span className="font-black text-sm text-[#221B17]">{previewBooking.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6E65] block mb-0.5 font-bold">رقم الهاتف والتواصل:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#5C1027]" dir="ltr">{previewBooking.phone}</span>
                      <a
                        href={`tel:${previewBooking.phone}`}
                        className="px-2 py-0.5 rounded-md bg-[#5C1027] text-white text-[10px] font-bold inline-flex items-center gap-1 hover:bg-[#721832]"
                      >
                        <Phone className="w-3 h-3" />
                        <span>اتصال</span>
                      </a>
                      <a
                        href={`https://wa.me/${previewBooking.phone.replace(/[^0-9]/g, "").startsWith("0") ? "2" + previewBooking.phone.replace(/[^0-9]/g, "") : previewBooking.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded-md bg-[#25D366] text-white text-[10px] font-bold inline-flex items-center gap-1 hover:brightness-105"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>واتساب</span>
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#7A6E65] block mb-0.5 font-bold">نوع المناسبة:</span>
                    <span className="font-bold text-[#221B17]">{previewBooking.occasion}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6E65] block mb-0.5 font-bold">مكان الحفل والتسليم:</span>
                    <span className="font-bold text-[#221B17]">{previewBooking.deliveryAddress}</span>
                  </div>
                </div>
              </div>

              {/* 2. Package & Food Breakdown */}
              <div className="bg-white border border-[#E8DFD1] rounded-2xl p-4 shadow-xs">
                <h5 className="font-black text-sm text-[#5C1027] border-b border-[#F0EAE1] pb-2 mb-3 flex items-center gap-1.5">
                  <CelebreClocheIcon className="w-4 h-4 text-[#C89B3C]" />
                  <span>2. محتويات وتشكيلة وجبة الضيافة الرسمية</span>
                </h5>
                <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFD1] space-y-2 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#5C1027] bg-white border border-[#C89B3C]/50 px-2 py-0.5 rounded-md font-mono">
                        {previewBooking.packageCode}
                      </span>
                      <span className="font-black text-sm text-[#221B17]">{previewBooking.packageName}</span>
                    </div>
                    <span className="font-black text-[#5C1027] bg-white px-2.5 py-1 rounded-lg border border-[#E8DFD1]">
                      العدد المطلوب: {previewBooking.quantity} علبة
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E8DFD1] text-[11px] text-[#4A3E38] grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>المشروب المعتمد: <strong>{previewBooking.drinkOptionLabel || "عصير بخيرة مشمول"}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>نوع العلب: <strong>علب كرتونية مذهبة محكمة الإغلاق مع شوكة ومنديل معقم</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Financial Breakdown Table */}
              <div className="bg-white border border-[#E8DFD1] rounded-2xl p-4 shadow-xs">
                <h5 className="font-black text-sm text-[#5C1027] border-b border-[#F0EAE1] pb-2 mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#C89B3C]" />
                  <span>3. الحساب المالي والتعاقد</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFD1]">
                    <span className="text-[10px] text-[#7A6E65] block font-bold">سعر العلبة</span>
                    <span className="font-black text-sm text-[#221B17]">{previewBooking.unitPrice} ج</span>
                  </div>
                  <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFD1]">
                    <span className="text-[10px] text-[#7A6E65] block font-bold">عدد العلب</span>
                    <span className="font-black text-sm text-[#221B17]">{previewBooking.quantity} علبة</span>
                  </div>
                  <div className="p-2.5 bg-[#5C1027]/10 rounded-xl border border-[#5C1027]/20">
                    <span className="text-[10px] text-[#5C1027] block font-bold">تكلفة الوجبات</span>
                    <span className="font-black text-sm text-[#5C1027]">{previewBooking.totalPrice.toLocaleString()} ج</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[10px] text-blue-900 block font-bold">مصاريف الشحن</span>
                    <span className="font-black text-sm text-blue-800">{(previewBooking.shippingFee || 0).toLocaleString()} ج</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 block font-bold">العربون المسدد</span>
                    <span className="font-black text-sm text-emerald-700">{previewBooking.depositPaid.toLocaleString()} ج</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-amber-900 block font-bold">المتبقي للاستلام</span>
                    <span className="font-black text-base text-amber-800">{previewBooking.remainingAmount.toLocaleString()} ج</span>
                  </div>
                </div>
                <div className="mt-2 text-center text-xs font-black text-[#5C1027] bg-[#FAF7F2] p-2 rounded-xl border border-[#E8DFD1]">
                  إجمالي التعاقد الشامل (الوجبات + مصاريف الشحن): <strong className="font-mono text-base">{(previewBooking.totalPrice + (previewBooking.shippingFee || 0)).toLocaleString()} جنيه</strong>
                </div>
              </div>

              {/* 4. Notes & Guarantee Policy */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>تنبيه رسمي: التوصيل يحدد وتُعبأ مصاريفه بواسطة الـ Admin عند تأكيد الحجز.</span>
                </div>
                {previewBooking.phoneAgreementNotes && (
                  <p className="text-[11px] text-amber-900 pt-1 border-t border-amber-200">
                    <strong>ملاحظات الاتفاق:</strong> {previewBooking.phoneAgreementNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 bg-[#FAF7F2] border-t border-[#E8DFD1] flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(previewBooking);
                    setPreviewBooking(null);
                  }}
                  className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#EFE8DD] text-[#5C1027] border border-[#C89B3C] rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>تعديل مصاريف الشحن والبيانات</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-[#5C1027] hover:bg-[#721832] text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>طباعة نموذج الحجز</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendVoucherWhatsApp(previewBooking)}
                  className="px-3.5 py-2 bg-[#25D366] hover:brightness-105 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>إرسال النموذج لواتساب العميل</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewBooking(null)}
                className="px-4 py-2 bg-white hover:bg-[#EFE8DD] border border-[#E8DFD1] text-[#221B17] rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Package Selection from the 18 packages */}
              <div className="space-y-2 p-3 bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-[#5C1027]">
                    اختيار الوجبة من قائمة الموقع الرسمية ({CATERING_PACKAGES.length} وجبة):
                  </label>
                  <span className="text-[10px] text-[#7A6E65] font-bold">
                    يشمل الوجبات الرسمية (Sale 01-12) وساندوتش Box (Sale 13-18)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 border border-[#E8DFD1]/60 rounded-xl bg-white/70">
                  {CATERING_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handlePackageSelectInModal(pkg.saleCode)}
                      className={`p-2 rounded-xl border text-right transition-all relative ${
                        editingBooking.packageCode === pkg.saleCode
                          ? "bg-[#5C1027] text-white border-[#5C1027] shadow-xs"
                          : "bg-white text-[#221B17] border-[#E8DFD1] hover:bg-[#F3E7D3]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black text-[#C89B3C]">{pkg.saleCode}</span>
                        {pkg.category === "sandwich_box" && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                            editingBooking.packageCode === pkg.saleCode ? "bg-[#C89B3C] text-black" : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}>
                            Box سندوتش
                          </span>
                        )}
                      </div>
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

              {/* Admin Unit Discount Grant (صلاحية خصم الإدارة لكل وجبة) */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/90 border-2 border-amber-300 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-[#5C1027] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C89B3C]" />
                    <span>صلاحية منح خصم الإدارة على سعر الوجبة (مبلغ معين مثلاً جنية أو أكثر):</span>
                  </label>
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    خاص بالإدارة فقط (سري)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                      قيمة الخصم للوجبة الواحدة (جنيه):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={editingBooking.unitDiscount ?? 0}
                        onChange={(e) => handleDiscountChangeInModal(Number(e.target.value))}
                        placeholder="مثال: 1 أو 2 أو 5"
                        className="w-full text-center py-2 px-3 bg-white border-2 border-amber-400 rounded-xl text-sm font-black text-[#5C1027] focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-[#7A6E65] font-bold">ج.م</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1] text-center shadow-2xs">
                    <div className="text-[10px] text-[#7A6E65] font-semibold">سعر الوجبة بعد الخصم الإداري</div>
                    <div className="text-base font-black text-emerald-700">
                      {editingBooking.unitPrice} ج.م
                    </div>
                    {(editingBooking.unitDiscount ?? 0) > 0 && (
                      <div className="text-[10px] text-stone-400 line-through">
                        السعر قبل الخصم: {editingBooking.basePrice + (editingBooking.drinkPriceDelta || 0)} ج
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD1] text-center shadow-2xs">
                    <div className="text-[10px] text-[#7A6E65] font-semibold">إجمالي التخفيض الممنوح بالحجز</div>
                    <div className="text-base font-black text-[#5C1027]">
                      {((editingBooking.unitDiscount ?? 0) * editingBooking.quantity).toLocaleString()} ج.م
                    </div>
                    <div className="text-[10px] text-[#7A6E65]">
                      وفر للعميل على {editingBooking.quantity} علبة
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Shipping Fee Field (خانة مصاريف الشحن تعبأ من قبل الـ Admin) */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-blue-50/90 border-2 border-blue-300 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>خانة مصاريف الشحن والتوصيل (تعبأ وتحدد حصرياً من قِبل الـ Admin):</span>
                  </label>
                  <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                    إدارة المشروع
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-950 mb-1">
                      قيمة مصاريف الشحن (جنيه):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={editingBooking.shippingFee ?? 0}
                        onChange={(e) => handleShippingFeeChangeInModal(Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-center py-2 px-3 bg-white border-2 border-blue-400 rounded-xl text-base font-black text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-blue-800 font-bold">ج.م</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-blue-900 leading-relaxed font-semibold bg-white/70 p-2 rounded-xl border border-blue-200">
                    💡 يحددها أدمن الموقع بناءً على مكان وقاعة التسليم، وتُضاف تلقائياً إلى كامل مبلغ الحجز لاحتساب المتبقي عند الاستلام.
                  </div>
                </div>
              </div>

              {/* Quantity, Unit Price, Total, Shipping, Deposit & Remaining */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1]">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                    سعر العلبة:
                  </label>
                  <div className="text-sm font-black text-[#5C1027] bg-white p-2 rounded-xl border border-[#E8DFD1] text-center">
                    {editingBooking.unitPrice} ج
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                    العدد (علبة): *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingBooking.quantity}
                    onChange={(e) => handleQuantityChangeInModal(Number(e.target.value))}
                    className="w-full text-center py-2 bg-white border border-[#E8DFD1] rounded-xl text-sm font-black text-[#221B17] focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3E38] mb-1">
                    تكلفة الوجبات:
                  </label>
                  <div className="text-sm font-black text-[#221B17] bg-white p-2 rounded-xl border border-[#E8DFD1] text-center">
                    {editingBooking.totalPrice.toLocaleString()} ج
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">
                    مصاريف الشحن:
                  </label>
                  <div className="text-sm font-black text-blue-800 bg-blue-50 p-2 rounded-xl border border-blue-200 text-center">
                    {(editingBooking.shippingFee || 0).toLocaleString()} ج
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    العربون المسدد:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingBooking.depositPaid}
                    onChange={(e) => handleDepositChangeInModal(Number(e.target.value))}
                    className="w-full text-center py-2 bg-white border border-emerald-300 rounded-xl text-sm font-black text-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2 sm:col-span-5 pt-3 border-t border-[#E8DFD1] flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black text-[#4A3E38]">
                    إجمالي التعاقد شامل الشحن: <strong className="text-[#5C1027] font-mono font-black text-base">{(editingBooking.totalPrice + (editingBooking.shippingFee || 0)).toLocaleString()} ج</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#7A6E65]">المتبقي عند الاستلام:</span>
                    <div className="text-lg font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                      {editingBooking.remainingAmount.toLocaleString()} جنيه
                    </div>
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
      {/* Security Credentials Settings Modal (تغيير كلمة السر وتأمين الدخول) */}
      {isSecuritySettingsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden text-right">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5C1027]/10 flex items-center justify-center text-[#5C1027]">
                  <Settings className="w-4 h-4 text-[#C89B3C]" />
                </div>
                <h4 className="font-black text-sm text-[#221B17]">
                  أمان الحساب • تغيير كلمة السر وبيانات الدخول
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSecuritySettingsOpen(false);
                  setSecurityError("");
                  setSecurityNotice("");
                }}
                className="w-7 h-7 rounded-full bg-white border border-[#E8DFD1] flex items-center justify-center text-[#7A6E65] hover:text-[#221B17] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveSecuritySettings} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-semibold leading-relaxed">
                🛡️ <strong>تأمين حساب الأدمن:</strong> عند تغيير كلمة السر، لن يتم تسجيل الدخول إلا بكلمة السر الجديدة، وستحفظ بشكل دائم ومشفّر في قاعدة بيانات المشروع.
              </div>

              {securityError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{securityError}</span>
                </div>
              )}

              {securityNotice && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{securityNotice}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  كلمة السر الحالية (للتحقق):
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type={showSettingsPassword ? "text" : "password"}
                    dir="ltr"
                    value={currentPasswordSetting}
                    onChange={(e) => setCurrentPasswordSetting(e.target.value)}
                    placeholder="كلمة السر الحالية المسجلة"
                    className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#4A3E38]">
                    كلمة السر الجديدة: *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                    className="text-[11px] text-[#7A6E65] hover:text-[#5C1027] font-semibold cursor-pointer"
                  >
                    {showSettingsPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type={showSettingsPassword ? "text" : "password"}
                    dir="ltr"
                    value={newPasswordSetting}
                    onChange={(e) => setNewPasswordSetting(e.target.value)}
                    placeholder="أدخل كلمة السر الجديدة"
                    className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border-2 border-[#C89B3C]/50 rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  تأكيد كلمة السر الجديدة: *
                </label>
                <div className="relative">
                  <KeyRound className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type={showSettingsPassword ? "text" : "password"}
                    dir="ltr"
                    value={confirmPasswordSetting}
                    onChange={(e) => setConfirmPasswordSetting(e.target.value)}
                    placeholder="أعد إدخال كلمة السر الجديدة"
                    className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E38] mb-1">
                  رقم هاتف المشروع الرسمي لاستلام أكواد OTP:
                </label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-3 w-4 h-4 text-[#7A6E65]" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={newPhoneSetting || registeredPhone}
                    onChange={(e) => setNewPhoneSetting(e.target.value)}
                    placeholder="01284484868"
                    className="w-full pr-10 pl-3 py-2.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs font-bold text-[#221B17] text-right focus:outline-hidden focus:border-[#5C1027]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSecuritySettingsOpen(false);
                    setSecurityError("");
                    setSecurityNotice("");
                  }}
                  className="py-2.5 px-4 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#4A3E38] hover:bg-[#EFE8DD] cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSavingSecurity}
                  className="py-2.5 px-6 rounded-xl bg-[#5C1027] hover:bg-[#721832] text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#C89B3C]" />
                  <span>{isSavingSecurity ? "جاري الحفظ..." : "حفظ كلمة السر الجديدة 🔒"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Modal (سجل الأمان والعمليات) */}
      {isAuditLogsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden text-right flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#F0EAE1] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5C1027]/10 flex items-center justify-center text-[#5C1027]">
                  <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#221B17]">
                    سجل الأمان والعمليات (Audit Logs)
                  </h4>
                  <p className="text-[11px] text-[#7A6E65]">
                    توثيق فوري لكافة محاولات الدخول، التحقق الثنائي، وحفظ الحجوزات
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  className="p-1.5 rounded-lg border border-[#E8DFD1] hover:bg-[#EFE8DD] text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="تحديث السجل"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAuditLogs ? "animate-spin text-[#5C1027]" : "text-[#7A6E65]"}`} />
                  <span className="text-[11px]">تحديث</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuditLogsOpen(false)}
                  className="w-7 h-7 rounded-full bg-white border border-[#E8DFD1] flex items-center justify-center text-[#7A6E65] hover:text-[#221B17] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7A6E65]">
                  {isLoadingAuditLogs ? "جاري تحميل سجل الأمان..." : "لا توجد سجلات أمان مسجلة حالياً"}
                </div>
              ) : (
                auditLogs.map((log: any) => (
                  <div 
                    key={log.id} 
                    className="p-3 rounded-xl border border-[#E8DFD1] bg-[#FAF7F2] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-black text-[10px] ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          log.status === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          log.status === 'error' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}>
                          {log.event}
                        </span>
                        <span className="text-[11px] font-mono text-[#7A6E65]">
                          IP: {log.ip}
                        </span>
                      </div>
                      <p className="font-semibold text-[#221B17] text-xs">
                        {log.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#A89D93] shrink-0 font-mono" dir="ltr">
                      {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 bg-[#FAF7F2] border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#7A6E65] shrink-0">
              <span>إجمالي السجلات المسجلة: {auditLogs.length} عملية</span>
              <button
                type="button"
                onClick={() => setIsAuditLogsOpen(false)}
                className="py-1.5 px-4 rounded-xl bg-white border border-[#E8DFD1] font-bold hover:bg-[#EFE8DD] cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
