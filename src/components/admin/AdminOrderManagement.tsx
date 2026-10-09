import React, { useState, useEffect } from "react";
import { 
  X, Lock, User, Key, ArrowRight, Plus, Search, Filter, 
  RefreshCw, Calendar, Phone, DollarSign, CheckCircle2, 
  AlertCircle, Clock, ShieldCheck, Eye, Sparkles, ChevronDown,
  Shield, MessageCircle, Truck, Package, TrendingUp, 
  AlertTriangle, FileText, Ban, Building2, Edit3, Check, Loader2,
  ExternalLink, Layers, Copy, Send,
  BarChart3, PieChart, Download, Printer, Users, Wallet
} from "lucide-react";
import { PublicMenuItem } from "../../types/publicMenu";
import { ExportService, ComprehensiveReportData } from "../../services/exportService.ts";

interface AdminOrderManagementProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: PublicMenuItem[];
}

export interface AdminOrderItem {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string;
  orderStatus: string;
  cancelReason?: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  customerNotes?: string;
  totalAmount: number;
  customerPaid: number;
  customerRemaining: number;
  supplierTotal: number;
  supplierPaid: number;
  supplierRemaining: number;
  distributorProfit: number;
  createdAt: string;
  menuCode: string;
  menuName: string;
  quantity: number;
  distributorUnitPrice: number;
  supplierUnitPrice: number;
}

export interface OrderDetailFull {
  order: any;
  customer: any;
  items: any[];
  options: any[];
  supplierOrders: any[];
  customerPayments: any[];
  supplierPayments: any[];
  auditLogs: any[];
  whatsapp: {
    customerMessage: string;
    supplierMessage: string;
    customerUpdateMessage?: string;
    supplierUpdateMessage?: string;
    customerLink: string;
    supplierLink: string;
    customerUpdateLink?: string;
    supplierUpdateLink?: string;
    hasApiCredentials?: boolean;
    lastMessageAt?: string | Date;
    lastMessageBy?: string;
    lastMessageType?: string;
    lastMessageRecipient?: string;
  };
}

const ALL_STATUSES = [
  { key: "PENDING_BOOKING", label: "حجز مبدئي", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "CONFIRMED", label: "مؤكد", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "SENT_TO_SUPPLIER", label: "أُرسل للمصنع", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { key: "IN_PRODUCTION", label: "قيد التجهيز", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { key: "READY", label: "جاهز للتسليم", color: "bg-teal-100 text-teal-800 border-teal-300" },
  { key: "DELIVERED", label: "تم التسليم", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { key: "COMPLETED", label: "مكتمل نهائياً", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "CANCELLED", label: "ملغي", color: "bg-red-100 text-red-800 border-red-300" },
];

export const AdminOrderManagement: React.FC<AdminOrderManagementProps> = ({
  isOpen,
  onClose,
  menuItems,
}) => {
  // Authentication states
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem("celebre_admin_token") || sessionStorage.getItem("celebre_admin_token") || "";
    } catch {
      return "";
    }
  });
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login Form states
  const [loginStep, setLoginStep] = useState<"credentials" | "otp">("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginUserId, setLoginUserId] = useState<number | null>(null);
  const [loginPhone, setLoginPhone] = useState("");
  const [otpWhatsappLink, setOtpWhatsappLink] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Orders list states
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal states
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetailFull | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create Order Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerName: "",
    phone: "",
    whatsapp: "",
    menuCode: menuItems[0]?.code || "Sale-01",
    quantity: 100,
    pickupDate: "",
    pickupTime: "المغرب 06:30 م",
    pickupLocation: "",
    notes: "",
    drinkOption: "included" as "included" | "exclude_juice" | "replace_pepsi",
    initialStatus: "CONFIRMED",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Order Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: "",
    phone: "",
    whatsapp: "",
    quantity: 100,
    pickupDate: "",
    pickupTime: "",
    pickupLocation: "",
    customerNotes: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Cancel Order Modal states
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Top Dashboard View Tab: dashboard vs orders vs payments vs reports
  const [dashboardTab, setDashboardTab] = useState<"dashboard" | "orders" | "payments" | "reports">("dashboard");

  // Executive Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loadingDashboardStats, setLoadingDashboardStats] = useState(false);

  // Comprehensive Reports Tab State
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [reportFromDate, setReportFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [reportToDate, setReportToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportBreakdownView, setReportBreakdownView] = useState<"saleCode" | "customer" | "supplier" | "paymentMethod">("saleCode");

  // Payment Record Modals
  const [isCustPayOpen, setIsCustPayOpen] = useState(false);
  const [custPayAmount, setCustPayAmount] = useState("");
  const [custPayMethod, setCustPayMethod] = useState<"INSTAPAY" | "CASH" | "BANK_TRANSFER" | "OTHER">("INSTAPAY");
  const [custPayStatus, setCustPayStatus] = useState<"PENDING_REVIEW" | "VERIFIED" | "REJECTED">("VERIFIED");
  const [custPayRef, setCustPayRef] = useState("");
  const [custPayNotes, setCustPayNotes] = useState("");
  const [custPayLoading, setCustPayLoading] = useState(false);

  const [isSupPayOpen, setIsSupPayOpen] = useState(false);
  const [supPayAmount, setSupPayAmount] = useState("");
  const [supPayMethod, setSupPayMethod] = useState("BANK_TRANSFER");
  const [supPayRef, setSupPayRef] = useState("");
  const [supPayNotes, setSupPayNotes] = useState("");
  const [supPayLoading, setSupPayLoading] = useState(false);

  // Edit Payment Modals
  const [isEditCustPayOpen, setIsEditCustPayOpen] = useState(false);
  const [editingCustPayment, setEditingCustPayment] = useState<{
    id: number;
    amount: string;
    method: "INSTAPAY" | "CASH" | "BANK_TRANSFER" | "OTHER";
    status: "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
    ref: string;
    notes: string;
  } | null>(null);

  const [isEditSupPayOpen, setIsEditSupPayOpen] = useState(false);
  const [editingSupPayment, setEditingSupPayment] = useState<{
    id: number;
    amount: string;
    method: string;
    ref: string;
    notes: string;
  } | null>(null);

  const [editPaymentLoading, setEditPaymentLoading] = useState(false);

  // Payments Tab State
  const [allCustPayments, setAllCustPayments] = useState<any[]>([]);
  const [allSupPayments, setAllSupPayments] = useState<any[]>([]);
  const [allPaymentAuditLogs, setAllPaymentAuditLogs] = useState<any[]>([]);
  const [loadingPaymentsTab, setLoadingPaymentsTab] = useState(false);
  const [paymentsSubTab, setPaymentsSubTab] = useState<"customer" | "supplier" | "audit">("customer");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");

  // WhatsApp Messaging Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [waActionType, setWaActionType] = useState<"CUSTOMER_MESSAGE" | "SUPPLIER_MESSAGE" | "CUSTOMER_UPDATE" | "SUPPLIER_UPDATE">("CUSTOMER_MESSAGE");
  const [waUpdateReason, setWaUpdateReason] = useState("");
  const [waDispatchLoading, setWaDispatchLoading] = useState(false);
  const [waDispatchResult, setWaDispatchResult] = useState<any>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const getHeaders = () => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-admin-token": token,
    };
  };

  // Check auth session on open
  useEffect(() => {
    if (token && isOpen) {
      fetch("/api/admin/auth/me", { headers: getHeaders() })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setAdminUser(data.user);
          } else {
            setToken("");
            try {
              localStorage.removeItem("celebre_admin_token");
              sessionStorage.removeItem("celebre_admin_token");
            } catch {}
          }
        })
        .catch(() => {
          setToken("");
        });
    }
  }, [token, isOpen]);

  // Load orders when authenticated
  const loadOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      let url = `/api/admin/orders?limit=200`;
      if (statusFilter !== "ALL") {
        url += `&status=${statusFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (token && isOpen) {
      loadOrders();
    }
  }, [token, isOpen, statusFilter, searchQuery]);

  // Load order detail
  const loadOrderDetail = async (id: number) => {
    setSelectedOrderId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setOrderDetail(data);
      }
    } catch (err) {
      console.error("Error fetching order detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Login Step 1: Submit Credentials
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "بيانات الدخول غير صحيحة");
      }

      if (data.needOtp || data.require2fa) {
        setLoginUserId(data.userId);
        setLoginPhone(data.phone || "");
        setOtpWhatsappLink(data.whatsappLink || "");
        setLoginStep("otp");
      }
    } catch (err: any) {
      setAuthError(err.message || "فشل تسجيل الدخول");
    } finally {
      setAuthLoading(false);
    }
  };

  // Login Step 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loginUserId, otp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "رمز التحقق OTP غير صحيح");
      }

      const newToken = data.token;
      setToken(newToken);
      setAdminUser(data.session);
      try {
        localStorage.setItem("celebre_admin_token", newToken);
        sessionStorage.setItem("celebre_admin_token", newToken);
      } catch {}
      setLoginStep("credentials");
    } catch (err: any) {
      setAuthError(err.message || "فشل التحقق من OTP");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    fetch("/api/admin/auth/logout", {
      method: "POST",
      headers: getHeaders(),
    }).catch(() => {});

    setToken("");
    setAdminUser(null);
    try {
      localStorage.removeItem("celebre_admin_token");
      sessionStorage.removeItem("celebre_admin_token");
    } catch {}
  };

  // Handle Status Change
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrderId) return;
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await loadOrderDetail(selectedOrderId);
        loadOrders();
      } else {
        alert(data.message || "فشل تحديث الحالة");
      }
    } catch (err) {
      alert("حدث خطأ أثناء تحديث الحالة");
    }
  };

  // Handle Create Order Submit
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل إنشاء الطلب");
      }

      setIsCreateOpen(false);
      loadOrders();
      if (data.orderId) {
        loadOrderDetail(data.orderId);
      }
    } catch (err: any) {
      setCreateError(err.message || "حدث خطأ");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal with current values
  const handleOpenEdit = () => {
    if (!orderDetail) return;
    const o = orderDetail.order;
    const c = orderDetail.customer;
    const firstItem = orderDetail.items[0];

    setEditForm({
      customerName: c?.fullName || "",
      phone: c?.phone || "",
      whatsapp: c?.whatsapp || "",
      quantity: firstItem?.quantity || 100,
      pickupDate: o?.pickupDate || "",
      pickupTime: o?.pickupTime || "",
      pickupLocation: o?.pickupLocation || "",
      customerNotes: o?.customerNotes || "",
    });
    setIsEditOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setEditLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تعديل الطلب");
      }

      setIsEditOpen(false);
      await loadOrderDetail(selectedOrderId);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "فشل التعديل");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Cancel Order Submit
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    if (!cancelReason.trim()) {
      alert("سبب الإلغاء مطلوب");
      return;
    }

    setCancelLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}/cancel`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ cancelReason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل إلغاء الطلب");
      }

      setIsCancelOpen(false);
      setCancelReason("");
      await loadOrderDetail(selectedOrderId);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "فشل إلغاء الطلب");
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle Customer Payment Creation
  const handleRecordCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setCustPayLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}/customer-payment`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          amount: parseFloat(custPayAmount),
          paymentMethod: custPayMethod,
          paymentStatus: custPayStatus,
          paymentReference: custPayRef,
          notes: custPayNotes || "دفعة موثقة عبر لوحة الأدمن",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تسجيل الدفعة");
      }

      setIsCustPayOpen(false);
      setCustPayAmount("");
      setCustPayRef("");
      setCustPayNotes("");
      setCustPayStatus("VERIFIED");
      await loadOrderDetail(selectedOrderId);
      loadOrders();
      loadAllPaymentsData();
    } catch (err: any) {
      alert(err.message || "فشل تسجيل دفعة العميل");
    } finally {
      setCustPayLoading(false);
    }
  };

  // Handle Edit Customer Payment
  const handleUpdateCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustPayment) return;
    setEditPaymentLoading(true);

    try {
      const res = await fetch(`/api/admin/customer-payments/${editingCustPayment.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          amount: parseFloat(editingCustPayment.amount),
          paymentMethod: editingCustPayment.method,
          paymentStatus: editingCustPayment.status,
          paymentReference: editingCustPayment.ref,
          notes: editingCustPayment.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تعديل دفعة العميل");
      }

      setIsEditCustPayOpen(false);
      setEditingCustPayment(null);
      if (selectedOrderId) {
        await loadOrderDetail(selectedOrderId);
      }
      loadOrders();
      loadAllPaymentsData();
    } catch (err: any) {
      alert(err.message || "فشل تعديل دفعة العميل");
    } finally {
      setEditPaymentLoading(false);
    }
  };

  // Handle Supplier Payment Creation
  const handleRecordSupplierPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setSupPayLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}/supplier-payment`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          amount: parseFloat(supPayAmount),
          paymentMethod: supPayMethod,
          reference: supPayRef,
          notes: supPayNotes || "تحويل للمصنع موثق عبر الأدمن",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تسجيل دفعة المصنع");
      }

      setIsSupPayOpen(false);
      setSupPayAmount("");
      setSupPayRef("");
      setSupPayNotes("");
      await loadOrderDetail(selectedOrderId);
      loadOrders();
      loadAllPaymentsData();
    } catch (err: any) {
      alert(err.message || "فشل تسجيل دفعة المصنع");
    } finally {
      setSupPayLoading(false);
    }
  };

  // Handle Edit Supplier Payment
  const handleUpdateSupplierPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupPayment) return;
    setEditPaymentLoading(true);

    try {
      const res = await fetch(`/api/admin/supplier-payments/${editingSupPayment.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          amount: parseFloat(editingSupPayment.amount),
          paymentMethod: editingSupPayment.method,
          reference: editingSupPayment.ref,
          notes: editingSupPayment.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تعديل دفعة المصنع");
      }

      setIsEditSupPayOpen(false);
      setEditingSupPayment(null);
      if (selectedOrderId) {
        await loadOrderDetail(selectedOrderId);
      }
      loadOrders();
      loadAllPaymentsData();
    } catch (err: any) {
      alert(err.message || "فشل تعديل دفعة المصنع");
    } finally {
      setEditPaymentLoading(false);
    }
  };

  // WhatsApp Messaging Handlers
  const handleOpenWhatsAppModal = (type: "CUSTOMER_MESSAGE" | "SUPPLIER_MESSAGE" | "CUSTOMER_UPDATE" | "SUPPLIER_UPDATE") => {
    setWaActionType(type);
    setWaUpdateReason("");
    setWaDispatchResult(null);
    setCopiedMessage(false);
    setIsWhatsAppModalOpen(true);
  };

  const handleDispatchWhatsApp = async () => {
    if (!selectedOrderId) return;
    setWaDispatchLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}/whatsapp/dispatch`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          action: waActionType,
          updateReason: waUpdateReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل إنشاء وإرسال رسالة واتساب");
      }
      setWaDispatchResult(data.result);
      if (data.result?.deepLink) {
        window.open(data.result.deepLink, "_blank", "noopener,noreferrer");
      }
      await loadOrderDetail(selectedOrderId);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "فشل مراسلة واتساب");
    } finally {
      setWaDispatchLoading(false);
    }
  };

  // Load all payments & payment audit logs for Payments Management tab
  const loadAllPaymentsData = async () => {
    if (!token) return;
    setLoadingPaymentsTab(true);
    try {
      const [custRes, supRes, auditRes] = await Promise.all([
        fetch("/api/admin/customer-payments", { headers: getHeaders() }),
        fetch("/api/admin/supplier-payments", { headers: getHeaders() }),
        fetch("/api/admin/payment-audit-logs", { headers: getHeaders() }),
      ]);
      const [custData, supData, auditData] = await Promise.all([
        custRes.json(),
        supRes.json(),
        auditRes.json(),
      ]);

      if (custData.success) setAllCustPayments(custData.payments || []);
      if (supData.success) setAllSupPayments(supData.payments || []);
      if (auditData.success) setAllPaymentAuditLogs(auditData.logs || []);
    } catch (err) {
      console.error("Error loading payment management data:", err);
    } finally {
      setLoadingPaymentsTab(false);
    }
  };

  // Load Executive Dashboard Stats
  const loadDashboardStats = async () => {
    if (!token) return;
    setLoadingDashboardStats(true);
    try {
      const res = await fetch("/api/admin/dashboard/stats", { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoadingDashboardStats(false);
    }
  };

  // Load Comprehensive Reports Data
  const loadComprehensiveReport = async (overridePeriod?: string, from?: string, to?: string) => {
    if (!token) return;
    setLoadingReport(true);
    try {
      const p = overridePeriod || reportPeriod;
      let url = `/api/admin/reports/comprehensive?period=${p}`;
      if (p === "custom") {
        url += `&from_date=${from || reportFromDate}&to_date=${to || reportToDate}`;
      }
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setComprehensiveReport(data);
      }
    } catch (err) {
      console.error("Error loading comprehensive report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Permissions Checks
  const canViewReports = adminUser?.role === "SUPER_ADMIN" || adminUser?.permissions?.includes("reports.view");
  const canExportReports = adminUser?.role === "SUPER_ADMIN" || adminUser?.permissions?.includes("reports.export");
  const canViewFactoryFinancials =
    adminUser?.role === "SUPER_ADMIN" ||
    adminUser?.permissions?.includes("prices.edit") ||
    adminUser?.permissions?.includes("supplier_payments.view");

  const [exportingFormat, setExportingFormat] = useState<"PDF" | "XLSX" | "JPG" | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState("");
  const [exportErrorMessage, setExportErrorMessage] = useState("");

  const buildExportData = (): ComprehensiveReportData | null => {
    if (!comprehensiveReport) return null;
    const periodLabelMap: Record<string, string> = {
      daily: "اليوم (Daily)",
      weekly: "الأسبوع (Weekly)",
      monthly: "الشهر (Monthly)",
      custom: "فترة مخصصة (Custom Range)",
    };

    return {
      title: `تقرير الأداء المالي والتشغيلي - ${periodLabelMap[comprehensiveReport.period] || comprehensiveReport.period}`,
      periodLabel: periodLabelMap[comprehensiveReport.period] || comprehensiveReport.period,
      startDate: comprehensiveReport.dateRange?.startDate,
      endDate: comprehensiveReport.dateRange?.endDate,
      generatedAt: new Date().toLocaleString("ar-EG"),
      generatedBy: adminUser?.fullName || adminUser?.username || "إدارة سيلبر",
      counts: comprehensiveReport.counts,
      financialSummary: comprehensiveReport.financialSummary,
      canViewFactory: Boolean(canViewFactoryFinancials && comprehensiveReport.canViewFactory !== false),
      orders: comprehensiveReport.orders || [],
      customerPayments: comprehensiveReport.customerPayments || [],
      supplierPayments: comprehensiveReport.supplierPayments || [],
      breakdowns: comprehensiveReport.breakdowns,
    };
  };

  const handleExport = async (format: "PDF" | "XLSX" | "JPG") => {
    if (!canExportReports) {
      setExportErrorMessage("عذراً، لا تملك صلاحية تصدير التقارير (تتطلب reports.export)");
      setTimeout(() => setExportErrorMessage(""), 4000);
      return;
    }
    if (!comprehensiveReport) {
      setExportErrorMessage("بيانات التقرير غير جاهزة حالياً للتصدير");
      setTimeout(() => setExportErrorMessage(""), 3000);
      return;
    }

    setExportingFormat(format);
    setExportErrorMessage("");
    setExportSuccessMessage("");

    try {
      const exportData = buildExportData();
      if (!exportData) throw new Error("تعذر تجهيز حزمة بيانات التقرير");

      const datePart = `${comprehensiveReport.dateRange?.startDate || "start"}_${comprehensiveReport.dateRange?.endDate || "end"}`;
      const fileName = `تقرير_سيلبر_${comprehensiveReport.period}_${datePart}`;

      if (format === "XLSX") {
        ExportService.exportComprehensiveToExcel(exportData, fileName);
      } else if (format === "PDF") {
        await ExportService.exportComprehensiveToPdf(exportData, fileName);
      } else if (format === "JPG") {
        await ExportService.exportComprehensiveToJpg(exportData, fileName);
      }

      // Log export event to audit logs on server
      fetch("/api/admin/reports/export-audit", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          format,
          period: comprehensiveReport.period,
          dateRange: comprehensiveReport.dateRange,
          title: exportData.title,
        }),
      }).catch(() => {});

      setExportSuccessMessage(`تم تصدير التقرير بصيغة ${format} بنجاح.`);
      setTimeout(() => setExportSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Export error:", err);
      setExportErrorMessage(err.message || "حدث خطأ أثناء تصدير التقرير، يرجى المحاولة مرة أخرى");
      setTimeout(() => setExportErrorMessage(""), 5000);
    } finally {
      setExportingFormat(null);
    }
  };

  useEffect(() => {
    if (token && isOpen) {
      if (dashboardTab === "dashboard") {
        loadDashboardStats();
      } else if (dashboardTab === "reports") {
        loadComprehensiveReport();
      } else if (dashboardTab === "payments") {
        loadAllPaymentsData();
      } else if (dashboardTab === "orders") {
        loadOrders();
      }
    }
  }, [token, isOpen, dashboardTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-7xl w-full h-[94vh] flex flex-col shadow-2xl border border-[#E8DFD1] overflow-hidden text-[#221B17]">
        {/* Top Header */}
        <div className="bg-[#1F1714] text-white px-6 py-4 flex items-center justify-between border-b border-[#362720]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#C89B3C]/20 border border-[#C89B3C]/40 text-[#C89B3C]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel',serif] font-black text-lg text-white tracking-wider">
                  CELEBRE ADMIN
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#721832] text-white">
                  Order Management
                </span>
              </div>
              <span className="text-xs text-[#D6C7B7]">
                إدارة الطلبات والحسابات المنفصلة (العميل • المصنع • الأرباح)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && adminUser && (
              <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <User className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span className="font-bold">{adminUser.username}</span>
                <span className="text-white/40">({adminUser.role})</span>
                <button
                  onClick={handleLogout}
                  className="mr-2 text-xs text-red-400 hover:text-red-300 font-bold underline"
                >
                  خروج
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* STATE 1: NOT AUTHENTICATED -> SHOW LOGIN */}
          {!token ? (
            <div className="min-h-full flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E8DFD1] shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-[#721832] text-[#C89B3C] flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-[#5C1027]">
                    تسجيل دخول إدارة سيليبر
                  </h3>
                  <p className="text-xs text-[#6B5E55]">
                    {loginStep === "credentials"
                      ? "أدخل اسم المستخدم وكلمة المرور للمتابعة للتحقق الثنائي"
                      : `أدخل رمز التحقق (OTP) المرسل إلى هاتف الإدارة (${loginPhone})`}
                  </p>
                </div>

                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {loginStep === "credentials" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#221B17] mb-1">
                        اسم المستخدم (Username)
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#721832] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#221B17] mb-1">
                        كلمة المرور (Password)
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#721832] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#721832] hover:bg-[#5C1027] text-white font-black text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {authLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#C89B3C]" />
                      ) : (
                        <>
                          <span>المتابعة إلى رمز التحقق OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#221B17] mb-1">
                        رمز OTP المكون من 6 أرقام
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-[#721832] focus:bg-white"
                      />
                    </div>

                    {otpWhatsappLink && (
                      <a
                        href={otpWhatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>فتح رسالة واتساب المستلمة</span>
                      </a>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLoginStep("credentials")}
                        className="px-4 py-2.5 rounded-xl border border-[#D6C7B7] text-xs font-bold"
                      >
                        رجوع
                      </button>
                      <button
                        type="submit"
                        disabled={authLoading || otp.length < 6}
                        className="flex-1 bg-[#721832] hover:bg-[#5C1027] text-white font-black text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>تأكيد الدخول</span>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* STATE 2: AUTHENTICATED -> ORDERS & PAYMENTS DASHBOARD */
            <div className="p-4 sm:p-6 space-y-6">
              {/* Top View Selector Tabs (Orders vs Payments) */}
              {/* Top View Selector Tabs: Dashboard, Orders, Payments, Reports */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DFD1] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* TAB 1: EXECUTIVE DASHBOARD */}
                  <button
                    onClick={() => {
                      setDashboardTab("dashboard");
                      loadDashboardStats();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all ${
                      dashboardTab === "dashboard"
                        ? "bg-[#721832] text-white shadow-md"
                        : "bg-white text-[#5C1027] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-[#C89B3C]" />
                    <span>لوحة القيادة (Dashboard)</span>
                    {dashboardStats?.todayOrdersCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C89B3C] text-black font-black">
                        اليوم: {dashboardStats.todayOrdersCount}
                      </span>
                    )}
                  </button>

                  {/* TAB 2: ORDERS MANAGEMENT */}
                  <button
                    onClick={() => {
                      setDashboardTab("orders");
                      loadOrders();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all ${
                      dashboardTab === "orders"
                        ? "bg-[#721832] text-white shadow-md"
                        : "bg-white text-[#5C1027] border border-[#E8DFD1] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <Package className="w-4 h-4 text-[#C89B3C]" />
                    <span>إدارة الطلبات (Orders)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10 font-mono font-bold">
                      {orders.length}
                    </span>
                  </button>

                  {/* TAB 3: PAYMENTS MANAGEMENT */}
                  <button
                    onClick={() => {
                      setDashboardTab("payments");
                      loadAllPaymentsData();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all ${
                      dashboardTab === "payments"
                        ? "bg-[#721832] text-white shadow-md"
                        : "bg-white text-emerald-800 border border-[#E8DFD1] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-[#C89B3C]" />
                    <span>إدارة المدفوعات (Payments)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                      {allCustPayments.length + allSupPayments.length}
                    </span>
                  </button>

                  {/* TAB 4: COMPREHENSIVE REPORTS */}
                  <button
                    onClick={() => {
                      setDashboardTab("reports");
                      loadComprehensiveReport();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all ${
                      dashboardTab === "reports"
                        ? "bg-[#721832] text-white shadow-md"
                        : "bg-white text-blue-900 border border-[#E8DFD1] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <PieChart className="w-4 h-4 text-[#C89B3C]" />
                    <span>التقارير التحليلية (Reports)</span>
                  </button>
                </div>

                <div className="text-[11px] text-[#6B5E55] hidden lg:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>نظام إدارة وحسابات كاترنج سيلبر RTL</span>
                  </span>
                </div>
              </div>

              {/* =========================================================================
                  VIEW 1: EXECUTIVE DASHBOARD (لوحة القيادة باللغة العربية RTL)
                  ========================================================================= */}
              {dashboardTab === "dashboard" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Executive Header & Refresh */}
                  <div className="bg-gradient-to-r from-[#5C1027] via-[#721832] to-[#1F1714] text-white p-5 rounded-3xl shadow-md border border-[#C89B3C]/30 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C89B3C] animate-pulse" />
                        <h2 className="text-lg sm:text-xl font-black text-[#F4EEDB]">لوحة القيادة التنفيذية والتشغيلية</h2>
                      </div>
                      <p className="text-xs text-[#E8DFD1]/80">
                        المتابعة اللحظية لطلبات اليوم، وحسابات العملاء، والتكاليف الفندقية للمصنع، وهامش أرباح سيليبر
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 text-xs font-mono text-[#C89B3C] font-bold">
                        {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </div>
                      <button
                        onClick={loadDashboardStats}
                        disabled={loadingDashboardStats}
                        className="bg-[#C89B3C] hover:bg-[#b58b34] text-[#1F1714] px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingDashboardStats ? "animate-spin" : ""}`} />
                        <span>تحديث فوري</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Status Counters (7 Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {/* 1. Today's Orders */}
                    <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border-2 border-[#C89B3C] shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-[#5C1027]">
                        <span>طلبات اليوم</span>
                        <Calendar className="w-4 h-4 text-[#C89B3C]" />
                      </div>
                      <div className="text-2xl font-black text-[#721832]">
                        {dashboardStats?.todayOrdersCount || 0}
                      </div>
                      <p className="text-[10px] text-[#8C6D28] font-bold">مجدولة لتاريخ اليوم</p>
                    </div>

                    {/* 2. Pending Booking */}
                    <div className="bg-white p-3.5 rounded-2xl border border-amber-300 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-amber-800">
                        <span>المبدئية</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-2xl font-black text-amber-700">
                        {dashboardStats?.pendingBookingCount || 0}
                      </div>
                      <p className="text-[10px] text-amber-800 font-semibold">بانتظار التأكيد</p>
                    </div>

                    {/* 3. Confirmed */}
                    <div className="bg-white p-3.5 rounded-2xl border border-blue-300 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-blue-800">
                        <span>المؤكدة</span>
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-blue-700">
                        {dashboardStats?.confirmedCount || 0}
                      </div>
                      <p className="text-[10px] text-blue-700 font-semibold">حجز معتمد</p>
                    </div>

                    {/* 4. In Production / Progress */}
                    <div className="bg-white p-3.5 rounded-2xl border border-purple-300 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-purple-800">
                        <span>قيد التنفيذ</span>
                        <Building2 className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-2xl font-black text-purple-700">
                        {dashboardStats?.inProgressCount || 0}
                      </div>
                      <p className="text-[10px] text-purple-700 font-semibold">بالمصنع أو التجهيز</p>
                    </div>

                    {/* 5. Ready */}
                    <div className="bg-white p-3.5 rounded-2xl border border-teal-300 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-teal-800">
                        <span>الجاهزة</span>
                        <Package className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="text-2xl font-black text-teal-700">
                        {dashboardStats?.readyCount || 0}
                      </div>
                      <p className="text-[10px] text-teal-700 font-semibold">جاهزة للتسليم</p>
                    </div>

                    {/* 6. Completed */}
                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-300 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-emerald-800">
                        <span>المكتملة</span>
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-emerald-700">
                        {dashboardStats?.completedCount || 0}
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold">تم التسليم بنجاح</p>
                    </div>

                    {/* 7. Cancelled */}
                    <div className="bg-white p-3.5 rounded-2xl border border-red-300 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-red-800">
                        <span>الملغاة</span>
                        <Ban className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="text-2xl font-black text-red-700">
                        {dashboardStats?.cancelledCount || 0}
                      </div>
                      <p className="text-[10px] text-red-700 font-semibold">ملغاة مع بيان السبب</p>
                    </div>
                  </div>

                  {/* Financial Metrics: Customer Side vs Supplier Side vs Celebre Gross Profit */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* 1. CUSTOMER SIDE (حسابات العميل) */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-[#221B17]">جانب حساب العميل</h3>
                            <p className="text-[10px] text-[#6B5E55]">CUSTOMER SIDE</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          مبيعات وتحصيل
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8DFD1]">
                          <span className="text-[11px] font-bold text-[#6B5E55] block">Customer Sales (إجمالي المبيعات)</span>
                          <div className="text-xl font-black text-[#5C1027] mt-0.5">
                            {(dashboardStats?.customerSales || 0).toLocaleString("ar-EG")}{" "}
                            <span className="text-xs font-bold">ج.م</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                            <span className="text-[11px] font-bold text-emerald-800 block">Customer Paid (المحصل)</span>
                            <div className="text-lg font-black text-emerald-700 mt-0.5">
                              {(dashboardStats?.customerPaid || 0).toLocaleString("ar-EG")}{" "}
                              <span className="text-[10px] font-bold">ج.م</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">
                              نسبة التحصيل: {dashboardStats?.customerSales > 0 ? ((dashboardStats.customerPaid / dashboardStats.customerSales) * 100).toFixed(1) : 0}%
                            </span>
                          </div>

                          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                            <span className="text-[11px] font-bold text-amber-800 block">Customer Remaining (المتبقي)</span>
                            <div className="text-lg font-black text-amber-700 mt-0.5">
                              {(dashboardStats?.customerRemaining || 0).toLocaleString("ar-EG")}{" "}
                              <span className="text-[10px] font-bold">ج.م</span>
                            </div>
                            <span className="text-[10px] text-amber-700 block mt-1 font-semibold">
                              مستحق طرف العملاء
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. SUPPLIER SIDE (حسابات المصنع) */}
                    <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-[#221B17]">جانب حساب المصنع والتوريد</h3>
                            <p className="text-[10px] text-[#6B5E55]">SUPPLIER SIDE</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                          تكاليف المصنع
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8DFD1]">
                          <span className="text-[11px] font-bold text-[#6B5E55] block">Supplier Cost (إجمالي تكلفة المصنع)</span>
                          <div className="text-xl font-black text-blue-900 mt-0.5">
                            {(dashboardStats?.supplierCost || 0).toLocaleString("ar-EG")}{" "}
                            <span className="text-xs font-bold">ج.م</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
                            <span className="text-[11px] font-bold text-blue-800 block">Supplier Paid (المسدد)</span>
                            <div className="text-lg font-black text-blue-700 mt-0.5">
                              {(dashboardStats?.supplierPaid || 0).toLocaleString("ar-EG")}{" "}
                              <span className="text-[10px] font-bold">ج.م</span>
                            </div>
                            <span className="text-[10px] text-blue-700 block mt-1 font-semibold">
                              نسبة السداد: {dashboardStats?.supplierCost > 0 ? ((dashboardStats.supplierPaid / dashboardStats.supplierCost) * 100).toFixed(1) : 0}%
                            </span>
                          </div>

                          <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200">
                            <span className="text-[11px] font-bold text-purple-800 block">Supplier Remaining (المتبقي)</span>
                            <div className="text-lg font-black text-purple-700 mt-0.5">
                              {(dashboardStats?.supplierRemaining || 0).toLocaleString("ar-EG")}{" "}
                              <span className="text-[10px] font-bold">ج.م</span>
                            </div>
                            <span className="text-[10px] text-purple-700 block mt-1 font-semibold">
                              مستحق للمصنع
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. CELEBRE GROSS PROFIT HERO */}
                    <div className="bg-gradient-to-br from-[#1F1714] via-[#2A1F1B] to-[#1F1714] text-white p-5 rounded-3xl border border-[#C89B3C]/50 shadow-md flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#C89B3C]/20 text-[#C89B3C] flex items-center justify-center font-bold">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-black text-sm text-[#F4EEDB]">أرباح سيليبر كاترنج</h3>
                              <p className="text-[10px] text-[#C89B3C]">CELEBRE GROSS PROFIT</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-[#C89B3C]/20 text-[#C89B3C] font-bold px-2 py-0.5 rounded-md border border-[#C89B3C]/30">
                            صافي الربح التشغيلي
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="text-3xl font-black text-[#C89B3C]">
                            {(dashboardStats?.celebreGrossProfit || 0).toLocaleString("ar-EG")}{" "}
                            <span className="text-sm font-bold text-white">ج.م</span>
                          </div>

                          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-[11px] space-y-1">
                            <div className="flex justify-between text-white/80 font-mono">
                              <span>معادلة الربح الصافي:</span>
                              <span className="text-[#C89B3C] font-bold">Customer Total - Supplier Total</span>
                            </div>
                            <div className="text-[10px] text-[#E8DFD1]/70 leading-relaxed">
                              ✓ حساب الأرباح مبني بدقة على فرق الأسعار المسجلة وقت إنشاء الطلب للطلبات النشطة (ولا يتم استخدام المدفوعات لحساب الربح).
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 text-white/80">
                        <span>هامش الربح الإجمالي:</span>
                        <span className="font-bold text-[#C89B3C] font-mono text-sm">
                          {dashboardStats?.customerSales > 0
                            ? `${((dashboardStats.celebreGrossProfit / dashboardStats.customerSales) * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Today's Orders Section */}
                  <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-2xs space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E8DFD1] pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#C89B3C]" />
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-[#221B17]">جدول تشغيل وتسليم طلبات اليوم</h3>
                          <p className="text-[11px] text-[#6B5E55]">الطلبات التي يحين موعدها في تاريخ اليوم للمتابعة والتنفيذ الفوري</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDashboardTab("orders")}
                          className="text-xs font-bold text-[#5C1027] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>عرض كل الطلبات</span>
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>
                    </div>

                    {dashboardStats?.todayOrders && dashboardStats.todayOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-[#FAF7F2] text-[#6B5E55] border-b border-[#E8DFD1]">
                              <th className="p-3">رقم الطلب</th>
                              <th className="p-3">العميل والهاتف</th>
                              <th className="p-3">الوقت والمكان</th>
                              <th className="p-3">إجمالي العميل</th>
                              <th className="p-3">إجمالي المصنع</th>
                              <th className="p-3">الربح</th>
                              <th className="p-3">الحالة</th>
                              <th className="p-3 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]">
                            {dashboardStats.todayOrders.map((o: any) => (
                              <tr key={o.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                                <td className="p-3 font-mono font-bold text-[#5C1027]">{o.orderNumber}</td>
                                <td className="p-3">
                                  <span className="font-bold text-[#221B17] block">{o.customerName || "عميل"}</span>
                                  <span className="text-[11px] text-[#6B5E55] font-mono">{o.customerPhone || "—"}</span>
                                </td>
                                <td className="p-3">
                                  <span className="block font-semibold text-[#221B17]">{o.pickupTime || "—"}</span>
                                  <span className="text-[10px] text-[#6B5E55] block truncate max-w-[160px]">{o.pickupLocation || "—"}</span>
                                </td>
                                <td className="p-3 font-bold text-[#221B17]">{o.totalAmount} ج.م</td>
                                <td className="p-3 font-bold text-blue-900">{o.supplierTotal} ج.م</td>
                                <td className="p-3 font-bold text-[#C89B3C]">{o.distributorProfit} ج.م</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    ALL_STATUSES.find((s) => s.key === o.orderStatus)?.color || "bg-gray-100 text-gray-800"
                                  }`}>
                                    {ALL_STATUSES.find((s) => s.key === o.orderStatus)?.label || o.orderStatus}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => loadOrderDetail(o.id)}
                                      className="bg-[#FAF7F2] hover:bg-[#E8DFD1] text-[#5C1027] px-2.5 py-1 rounded-lg text-xs font-bold border border-[#D6C7B7] cursor-pointer"
                                    >
                                      التفاصيل
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await loadOrderDetail(o.id);
                                        handleOpenWhatsAppModal("CUSTOMER_MESSAGE");
                                      }}
                                      className="bg-[#25D366] hover:bg-[#20ba59] text-white p-1 rounded-lg cursor-pointer"
                                      title="واتساب العميل"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-[#6B5E55] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#D6C7B7] space-y-2">
                        <Calendar className="w-8 h-8 text-[#C89B3C] mx-auto" />
                        <p className="font-bold text-sm">لا توجد طلبات مجدولة لتاريخ اليوم حتى الآن</p>
                        <p className="text-xs text-[#8C6D28]">يمكنك استعراض كافة الطلبات من تبويب "إدارة الطلبات" أو إنشاء حجز كاترنج جديد</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  VIEW 2: ORDERS MANAGEMENT TAB
                  ========================================================================= */}
              {dashboardTab === "orders" && (
                <div className="space-y-6">
                  {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                {/* Search & Status Filters */}
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث برقم الطلب، العميل، الهاتف، أو الوجبة..."
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl py-2 pr-9 pl-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#721832]"
                    />
                    <Search className="w-4 h-4 text-[#8C6D28] absolute right-3 top-2.5" />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl px-3 py-2 text-xs font-bold text-[#5C1027] focus:outline-none focus:ring-2 focus:ring-[#721832]"
                  >
                    <option value="ALL">جميع الحالات ({orders.length})</option>
                    {ALL_STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={loadOrders}
                    className="p-2 rounded-xl border border-[#D6C7B7] text-[#5C1027] hover:bg-[#FAF7F2] transition-colors"
                    title="تحديث البيانات"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingOrders ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCreateForm({
                        customerName: "",
                        phone: "",
                        whatsapp: "",
                        menuCode: menuItems[0]?.code || "Sale-01",
                        quantity: 100,
                        pickupDate: "",
                        pickupTime: "المغرب 06:30 م",
                        pickupLocation: "",
                        notes: "",
                        drinkOption: "included",
                        initialStatus: "CONFIRMED",
                      });
                      setIsCreateOpen(true);
                    }}
                    className="bg-gradient-to-r from-[#721832] to-[#5C1027] hover:from-[#5C1027] hover:to-[#430B1C] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-[#C89B3C]" />
                    <span>إنشاء طلب جديد</span>
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#FAF7F2] text-[#5C1027] font-black border-b border-[#E8DFD1]">
                      <tr>
                        <th className="p-3.5">رقم الطلب</th>
                        <th className="p-3.5">العميل والهاتف</th>
                        <th className="p-3.5">الوجبة والكمية</th>
                        <th className="p-3.5">الحالة</th>
                        <th className="p-3.5">جانب العميل (Customer)</th>
                        <th className="p-3.5">جانب المصنع (Supplier)</th>
                        <th className="p-3.5">صافي الربح (Profit)</th>
                        <th className="p-3.5">تاريخ الاستلام</th>
                        <th className="p-3.5 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DFD1]/60">
                      {loadingOrders ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-[#8C7D73]">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#721832]" />
                            <span>جاري تحميل الطلبات من قاعدة البيانات...</span>
                          </td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-[#8C7D73]">
                            لا توجد طلبات مسجلة مطابقة للبحث
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => {
                          const statusObj = ALL_STATUSES.find((s) => s.key === o.orderStatus) || {
                            label: o.orderStatus,
                            color: "bg-gray-100 text-gray-800 border-gray-300",
                          };

                          return (
                            <tr
                              key={o.id}
                              className="hover:bg-[#FAF7F2]/80 transition-colors cursor-pointer group"
                              onClick={() => loadOrderDetail(o.id)}
                            >
                              <td className="p-3.5 font-mono font-bold text-[#721832]">
                                {o.orderNumber}
                              </td>

                              <td className="p-3.5">
                                <div className="font-bold text-[#221B17]">{o.customerName}</div>
                                <div className="text-[11px] text-[#6B5E55] font-mono" dir="ltr">
                                  {o.customerPhone}
                                </div>
                              </td>

                              <td className="p-3.5">
                                <div className="font-bold text-[#5C1027]">
                                  {o.menuCode} ({o.quantity} وجبة)
                                </div>
                                <div className="text-[11px] text-[#6B5E55] line-clamp-1">{o.menuName}</div>
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black border ${statusObj.color}`}
                                >
                                  {statusObj.label}
                                </span>
                              </td>

                              {/* Customer Side */}
                              <td className="p-3.5">
                                <div className="font-bold text-[#221B17]">
                                  إجمالي: {o.totalAmount} ج
                                </div>
                                <div className="text-[11px] text-[#25D366] font-semibold">
                                  مدفوع: {o.customerPaid} ج
                                </div>
                                <div className="text-[11px] text-[#721832] font-semibold">
                                  متبقي: {o.customerRemaining} ج
                                </div>
                              </td>

                              {/* Supplier Side (Factory) */}
                              <td className="p-3.5">
                                <div className="font-bold text-[#4A3E38]">
                                  إجمالي: {o.supplierTotal} ج
                                </div>
                                <div className="text-[11px] text-blue-600 font-semibold">
                                  محوّل: {o.supplierPaid} ج
                                </div>
                                <div className="text-[11px] text-amber-700 font-semibold">
                                  متبقي: {o.supplierRemaining} ج
                                </div>
                              </td>

                              {/* Profit (Distributor Total - Supplier Total) */}
                              <td className="p-3.5">
                                <div className="font-black text-[#25D366] text-sm">
                                  +{o.distributorProfit} ج
                                </div>
                                <div className="text-[10px] text-[#8C6D28]">
                                  ({o.totalAmount > 0 ? ((o.distributorProfit / o.totalAmount) * 100).toFixed(1) : 0}%)
                                </div>
                              </td>

                              <td className="p-3.5 text-[#4A3E38]">
                                <div>{o.pickupDate}</div>
                                <div className="text-[11px] text-[#8C7D73]">{o.pickupTime}</div>
                              </td>

                              <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => loadOrderDetail(o.id)}
                                  className="p-1.5 rounded-lg border border-[#D6C7B7] hover:bg-[#721832] hover:text-white transition-all text-[#5C1027]"
                                  title="عرض التفاصيل الكاملة"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
                </div>
              )}

              {/* =========================================================================
                  VIEW 3: PAYMENTS MANAGEMENT (CUSTOMER & SUPPLIER SIDES)
                  ========================================================================= */}
              {dashboardTab === "payments" && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Verified Customer Payments */}
                    <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>مقبوضات العملاء المؤكدة</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          VERIFIED
                        </span>
                      </div>
                      <div className="text-2xl font-black text-emerald-700">
                        {allCustPayments
                          .filter((p) => p.paymentStatus === "VERIFIED")
                          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                          .toLocaleString("ar-EG")}{" "}
                        <span className="text-xs font-bold">ج.م</span>
                      </div>
                      <p className="text-[10px] text-[#6B5E55]">
                        المجموع المحسوب فعلياً في customer_paid
                      </p>
                    </div>

                    {/* 2. Pending Review Payments */}
                    <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>دفعات قيد المراجعة</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          PENDING
                        </span>
                      </div>
                      <div className="text-2xl font-black text-amber-700">
                        {allCustPayments
                          .filter((p) => p.paymentStatus === "PENDING_REVIEW")
                          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                          .toLocaleString("ar-EG")}{" "}
                        <span className="text-xs font-bold">ج.م</span>
                      </div>
                      <p className="text-[10px] text-[#6B5E55]">
                        بانتظار مراجعة الإدارة وتأكيدها كـ VERIFIED
                      </p>
                    </div>

                    {/* 3. Factory Supplier Payments */}
                    <div className="bg-white p-4 rounded-2xl border border-blue-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>مدفوعات المصانع (المورد)</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          SUPPLIER
                        </span>
                      </div>
                      <div className="text-2xl font-black text-blue-700">
                        {allSupPayments
                          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                          .toLocaleString("ar-EG")}{" "}
                        <span className="text-xs font-bold">ج.م</span>
                      </div>
                      <p className="text-[10px] text-[#6B5E55]">
                        إجمالي التحويلات المحسوبة في supplier_paid
                      </p>
                    </div>

                    {/* 4. Net Operating Cashflow */}
                    <div className="bg-gradient-to-br from-[#721832]/5 to-[#C89B3C]/10 p-4 rounded-2xl border-2 border-[#C89B3C]/30 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#721832]">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-[#C89B3C]" />
                          <span>صافي التحصيل المالي</span>
                        </span>
                        <span className="text-[10px] text-[#8C6D28] font-bold">NET CASH</span>
                      </div>
                      <div className="text-2xl font-black text-[#721832]">
                        {(
                          allCustPayments
                            .filter((p) => p.paymentStatus === "VERIFIED")
                            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) -
                          allSupPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                        ).toLocaleString("ar-EG")}{" "}
                        <span className="text-xs font-bold">ج.م</span>
                      </div>
                      <p className="text-[10px] text-[#6B5E55]">
                        المقبوض المؤكد من العملاء - المدفوع للمصنع
                      </p>
                    </div>
                  </div>

                  {/* Sub-tabs & Filter Controls */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Sub-tab buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPaymentsSubTab("customer")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                            paymentsSubTab === "customer"
                              ? "bg-emerald-700 text-white shadow-xs"
                              : "bg-[#FAF7F2] text-[#4A3E38] border border-[#E8DFD1] hover:bg-white"
                          }`}
                        >
                          دفعات العملاء ({allCustPayments.length})
                        </button>
                        <button
                          onClick={() => setPaymentsSubTab("supplier")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                            paymentsSubTab === "supplier"
                              ? "bg-blue-700 text-white shadow-xs"
                              : "bg-[#FAF7F2] text-[#4A3E38] border border-[#E8DFD1] hover:bg-white"
                          }`}
                        >
                          مدفوعات المصانع ({allSupPayments.length})
                        </button>
                        <button
                          onClick={() => setPaymentsSubTab("audit")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            paymentsSubTab === "audit"
                              ? "bg-[#721832] text-white shadow-xs"
                              : "bg-[#FAF7F2] text-[#4A3E38] border border-[#E8DFD1] hover:bg-white"
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5 text-[#C89B3C]" />
                          <span>سجل رقابة المدفوعات ({allPaymentAuditLogs.length})</span>
                        </button>
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={loadAllPaymentsData}
                        className="p-2 rounded-xl border border-[#D6C7B7] text-[#5C1027] hover:bg-[#FAF7F2] transition-colors"
                        title="تحديث بيانات المدفوعات"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingPaymentsTab ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {/* Filter bar for payments */}
                    {paymentsSubTab !== "audit" && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8DFD1]/60">
                        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                          <input
                            type="text"
                            value={paymentSearchQuery}
                            onChange={(e) => setPaymentSearchQuery(e.target.value)}
                            placeholder="بحث برقم الطلب، العميل، الهاتف، أو المرجع..."
                            className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl py-1.5 pr-8 pl-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#721832]"
                          />
                          <Search className="w-3.5 h-3.5 text-[#8C6D28] absolute right-2.5 top-2.5" />
                        </div>

                        {paymentsSubTab === "customer" && (
                          <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#5C1027]"
                          >
                            <option value="ALL">جميع الحالات</option>
                            <option value="VERIFIED">مؤكدة (VERIFIED)</option>
                            <option value="PENDING_REVIEW">قيد المراجعة (PENDING_REVIEW)</option>
                            <option value="REJECTED">مرفوضة (REJECTED)</option>
                          </select>
                        )}

                        <select
                          value={paymentMethodFilter}
                          onChange={(e) => setPaymentMethodFilter(e.target.value)}
                          className="bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#5C1027]"
                        >
                          <option value="ALL">جميع طرق الدفع</option>
                          <option value="INSTAPAY">إنستاباي (INSTAPAY)</option>
                          <option value="CASH">كاش باليد (CASH)</option>
                          <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                          <option value="OTHER">أخرى (OTHER)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* SUB-TAB 1: CUSTOMER PAYMENTS TABLE */}
                  {paymentsSubTab === "customer" && (
                    <div className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-[#FAF7F2] text-[#5C1027] font-black border-b border-[#E8DFD1]">
                            <tr>
                              <th className="p-3.5">#ID</th>
                              <th className="p-3.5">الطلب والعميل</th>
                              <th className="p-3.5">المبلغ</th>
                              <th className="p-3.5">طريقة الدفع</th>
                              <th className="p-3.5">حالة الدفعة</th>
                              <th className="p-3.5">الرقم المرجعي</th>
                              <th className="p-3.5">المستلم والملاحظات</th>
                              <th className="p-3.5">تاريخ السداد</th>
                              <th className="p-3.5 text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]/60">
                            {loadingPaymentsTab ? (
                              <tr>
                                <td colSpan={9} className="p-12 text-center text-[#8C7D73]">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#721832]" />
                                  <span>جاري تحميل سجلات دفعات العملاء...</span>
                                </td>
                              </tr>
                            ) : allCustPayments.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-12 text-center text-[#8C7D73]">
                                  لا توجد دفعات عملاء مسجلة حالياً
                                </td>
                              </tr>
                            ) : (
                              allCustPayments
                                .filter((p) => {
                                  if (paymentStatusFilter !== "ALL" && p.paymentStatus !== paymentStatusFilter) return false;
                                  if (paymentMethodFilter !== "ALL" && p.paymentMethod !== paymentMethodFilter) return false;
                                  if (paymentSearchQuery.trim()) {
                                    const q = paymentSearchQuery.toLowerCase();
                                    const matchOrder = p.orderNumber?.toLowerCase().includes(q);
                                    const matchName = p.customerName?.toLowerCase().includes(q);
                                    const matchPhone = p.customerPhone?.toLowerCase().includes(q);
                                    const matchRef = p.paymentReference?.toLowerCase().includes(q);
                                    const matchNotes = p.notes?.toLowerCase().includes(q);
                                    if (!matchOrder && !matchName && !matchPhone && !matchRef && !matchNotes) return false;
                                  }
                                  return true;
                                })
                                .map((cp) => (
                                  <tr key={cp.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                                    <td className="p-3.5 font-mono font-bold text-[#721832]">#{cp.id}</td>
                                    <td className="p-3.5">
                                      <button
                                        onClick={() => loadOrderDetail(cp.orderId)}
                                        className="font-mono font-black text-[#5C1027] hover:underline block text-left"
                                        title="فتح تفاصيل الطلب"
                                      >
                                        {cp.orderNumber || `طلب #${cp.orderId}`}
                                      </button>
                                      <div className="font-bold text-[#221B17] text-[11px] mt-0.5">{cp.customerName}</div>
                                      <div className="text-[10px] text-[#6B5E55] font-mono" dir="ltr">{cp.customerPhone}</div>
                                    </td>
                                    <td className="p-3.5 font-black text-emerald-700 text-sm">
                                      {cp.amount} ج.م
                                    </td>
                                    <td className="p-3.5">
                                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#FAF7F2] border border-[#D6C7B7]">
                                        {cp.paymentMethod}
                                      </span>
                                    </td>
                                    <td className="p-3.5">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                          cp.paymentStatus === "VERIFIED"
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                            : cp.paymentStatus === "PENDING_REVIEW"
                                            ? "bg-amber-100 text-amber-800 border-amber-300"
                                            : "bg-red-100 text-red-800 border-red-300"
                                        }`}
                                      >
                                        {cp.paymentStatus === "VERIFIED"
                                          ? "مؤكدة (VERIFIED)"
                                          : cp.paymentStatus === "PENDING_REVIEW"
                                          ? "قيد المراجعة"
                                          : "مرفوضة"}
                                      </span>
                                    </td>
                                    <td className="p-3.5 font-mono text-[11px] text-[#4A3E38]">
                                      {cp.paymentReference || "—"}
                                    </td>
                                    <td className="p-3.5 text-[11px]">
                                      <span className="font-semibold text-[#221B17] block">{cp.receivedBy}</span>
                                      <span className="text-[#8C7D73] block truncate max-w-[140px]">{cp.notes || ""}</span>
                                    </td>
                                    <td className="p-3.5 font-mono text-[11px] text-[#8C7D73]">
                                      {new Date(cp.paidAt || cp.createdAt).toLocaleString("ar-EG")}
                                    </td>
                                    <td className="p-3.5 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingCustPayment({
                                              id: cp.id,
                                              amount: String(cp.amount),
                                              method: cp.paymentMethod,
                                              status: cp.paymentStatus,
                                              ref: cp.paymentReference || "",
                                              notes: cp.notes || "",
                                            });
                                            setIsEditCustPayOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg border border-[#D6C7B7] hover:bg-emerald-50 text-emerald-700 font-bold transition-colors flex items-center gap-1"
                                          title="تعديل الدفعة"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>تعديل</span>
                                        </button>
                                        <button
                                          onClick={() => loadOrderDetail(cp.orderId)}
                                          className="p-1.5 rounded-lg border border-[#D6C7B7] hover:bg-[#FAF7F2] text-[#5C1027]"
                                          title="عرض الطلب"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: SUPPLIER PAYMENTS TABLE */}
                  {paymentsSubTab === "supplier" && (
                    <div className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-[#FAF7F2] text-[#5C1027] font-black border-b border-[#E8DFD1]">
                            <tr>
                              <th className="p-3.5">#ID</th>
                              <th className="p-3.5">الطلب والمصنع</th>
                              <th className="p-3.5">المبلغ المحول</th>
                              <th className="p-3.5">طريقة التحويل</th>
                              <th className="p-3.5">الرقم المرجعي</th>
                              <th className="p-3.5">المسجل والملاحظات</th>
                              <th className="p-3.5">تاريخ التحويل</th>
                              <th className="p-3.5 text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]/60">
                            {loadingPaymentsTab ? (
                              <tr>
                                <td colSpan={8} className="p-12 text-center text-[#8C7D73]">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#721832]" />
                                  <span>جاري تحميل سجلات دفعات المصنع...</span>
                                </td>
                              </tr>
                            ) : allSupPayments.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-12 text-center text-[#8C7D73]">
                                  لا توجد تحويلات مالية للمصانع مسجلة حالياً
                                </td>
                              </tr>
                            ) : (
                              allSupPayments
                                .filter((p) => {
                                  if (paymentMethodFilter !== "ALL" && p.paymentMethod !== paymentMethodFilter) return false;
                                  if (paymentSearchQuery.trim()) {
                                    const q = paymentSearchQuery.toLowerCase();
                                    const matchOrder = p.orderNumber?.toLowerCase().includes(q);
                                    const matchSupOrder = p.supplierOrderNumber?.toLowerCase().includes(q);
                                    const matchSupplier = p.supplierName?.toLowerCase().includes(q);
                                    const matchRef = p.reference?.toLowerCase().includes(q);
                                    const matchNotes = p.notes?.toLowerCase().includes(q);
                                    if (!matchOrder && !matchSupOrder && !matchSupplier && !matchRef && !matchNotes) return false;
                                  }
                                  return true;
                                })
                                .map((sp) => (
                                  <tr key={sp.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                                    <td className="p-3.5 font-mono font-bold text-blue-800">#{sp.id}</td>
                                    <td className="p-3.5">
                                      <button
                                        onClick={() => loadOrderDetail(sp.orderId)}
                                        className="font-mono font-black text-[#5C1027] hover:underline block text-left"
                                        title="فتح تفاصيل الطلب"
                                      >
                                        {sp.orderNumber || `طلب #${sp.orderId}`}
                                      </button>
                                      <div className="font-bold text-[#221B17] text-[11px] mt-0.5">
                                        {sp.supplierName || "المصنع المعتمد"}
                                      </div>
                                      <div className="text-[10px] text-[#8C7D73] font-mono">{sp.supplierOrderNumber}</div>
                                    </td>
                                    <td className="p-3.5 font-black text-blue-700 text-sm">
                                      {sp.amount} ج.م
                                    </td>
                                    <td className="p-3.5">
                                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#FAF7F2] border border-[#D6C7B7]">
                                        {sp.paymentMethod}
                                      </span>
                                    </td>
                                    <td className="p-3.5 font-mono text-[11px] text-[#4A3E38]">
                                      {sp.reference || "—"}
                                    </td>
                                    <td className="p-3.5 text-[11px]">
                                      <span className="font-semibold text-[#221B17] block">{sp.paidBy}</span>
                                      <span className="text-[#8C7D73] block truncate max-w-[140px]">{sp.notes || ""}</span>
                                    </td>
                                    <td className="p-3.5 font-mono text-[11px] text-[#8C7D73]">
                                      {new Date(sp.paidAt || sp.createdAt).toLocaleString("ar-EG")}
                                    </td>
                                    <td className="p-3.5 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingSupPayment({
                                              id: sp.id,
                                              amount: String(sp.amount),
                                              method: sp.paymentMethod,
                                              ref: sp.reference || "",
                                              notes: sp.notes || "",
                                            });
                                            setIsEditSupPayOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg border border-[#D6C7B7] hover:bg-blue-50 text-blue-700 font-bold transition-colors flex items-center gap-1"
                                          title="تعديل دفعة المصنع"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>تعديل</span>
                                        </button>
                                        <button
                                          onClick={() => loadOrderDetail(sp.orderId)}
                                          className="p-1.5 rounded-lg border border-[#D6C7B7] hover:bg-[#FAF7F2] text-[#5C1027]"
                                          title="عرض الطلب"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: PAYMENT AUDIT LOGS TABLE */}
                  {paymentsSubTab === "audit" && (
                    <div className="bg-white rounded-3xl border border-[#E8DFD1] shadow-sm overflow-hidden p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#5C1027]">
                          <Shield className="w-4 h-4 text-[#C89B3C]" />
                          <span>سجل رقابة وتدقيق المدفوعات (Payment Audit Log):</span>
                        </div>
                        <span className="text-[10px] text-[#8C7D73]">توثيق تلقائي لكل عملية إضافة أو تعديل مالي</span>
                      </div>

                      <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
                        {loadingPaymentsTab ? (
                          <div className="p-8 text-center text-[#8C7D73]">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#721832]" />
                            <span>جاري تحميل سجل التدقيق...</span>
                          </div>
                        ) : allPaymentAuditLogs.length === 0 ? (
                          <p className="text-xs text-center text-[#8C7D73] py-8">
                            لا توجد سجلات تدقيق مدفوعات مسجلة حتى الآن
                          </p>
                        ) : (
                          allPaymentAuditLogs.map((log: any) => (
                            <div key={log.id} className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFD1]/80 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-[#5C1027] flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4 text-emerald-600" />
                                  <span>{log.action}</span>
                                  <span className="text-[10px] text-[#8C7D73] font-mono">({log.entity} #{log.entityId})</span>
                                </span>
                                <span className="text-[10px] text-[#8C7D73] font-mono">
                                  {new Date(log.createdAt).toLocaleString("ar-EG")}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#4A3E38] flex items-center gap-3">
                                <span>المستخدم: <strong className="text-[#721832]">{log.userName}</strong></span>
                                {log.ip && <span className="text-[#8C7D73] font-mono">IP: {log.ip}</span>}
                              </div>
                              {log.newData && (
                                <div className="bg-white p-2.5 rounded-lg border border-[#E8DFD1] text-[11px] font-mono space-y-1">
                                  {log.newData.orderNumber && <div>رقم الطلب: <strong>{log.newData.orderNumber}</strong></div>}
                                  {log.newData.amount && <div>المبلغ: <strong>{log.newData.amount} ج.م</strong></div>}
                                  {log.newData.paymentMethod && <div>طريقة الدفع: <strong>{log.newData.paymentMethod}</strong></div>}
                                  {log.newData.paymentStatus && <div>الحالة: <strong className={log.newData.paymentStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}>{log.newData.paymentStatus}</strong></div>}
                                  {log.newData.newPaid !== undefined && <div>إجمالي المدفوع الجديد: <strong>{log.newData.newPaid} ج.م</strong></div>}
                                  {log.newData.newRemaining !== undefined && <div>المتبقي الجديد: <strong>{log.newData.newRemaining} ج.م</strong></div>}
                                  {log.oldData && (
                                    <div className="text-[#8C7D73] pt-1 border-t border-dashed border-[#D6C7B7]">
                                      {log.oldData.amount && <span>[المبلغ السابق: {log.oldData.amount} ج.م] </span>}
                                      {log.oldData.paymentStatus && <span>[الحالة السابقة: {log.oldData.paymentStatus}] </span>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  VIEW 4: COMPREHENSIVE REPORTS & ANALYTICS (التقارير التحليلية والمالية)
                  ========================================================================= */}
              {dashboardTab === "reports" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Report Controls Bar */}
                  <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DFD1] pb-3">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-[#C89B3C]" />
                        <div>
                          <h3 className="font-black text-base text-[#221B17]">التقارير التحليلية والمالية الشاملة (Reports)</h3>
                          <p className="text-xs text-[#6B5E55]">استخراج مؤشرات الأداء حسب الفترات الزمنية وتفكيك الحسابات</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. PDF Export */}
                        <button
                          onClick={() => handleExport("PDF")}
                          disabled={!canExportReports || exportingFormat !== null}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            !canExportReports
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-60"
                              : "bg-[#721832] hover:bg-[#5C1027] text-white"
                          }`}
                          title={!canExportReports ? "تتطلب صلاحية reports.export" : "تصدير تقرير PDF معتمد باللغة العربية"}
                        >
                          {exportingFormat === "PDF" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-[#C89B3C]" />
                          )}
                          <span>تصدير PDF (عربي RTL)</span>
                        </button>

                        {/* 2. Excel XLSX Export */}
                        <button
                          onClick={() => handleExport("XLSX")}
                          disabled={!canExportReports || exportingFormat !== null}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            !canExportReports
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-60"
                              : "bg-emerald-700 hover:bg-emerald-800 text-white"
                          }`}
                          title={!canExportReports ? "تتطلب صلاحية reports.export" : "تصدير 4 شيتات: Orders, Customer Payments, Supplier Payments, Summary"}
                        >
                          {exportingFormat === "XLSX" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>تصدير Excel (4 شيتات)</span>
                        </button>

                        {/* 3. WhatsApp JPG Export */}
                        <button
                          onClick={() => handleExport("JPG")}
                          disabled={!canExportReports || exportingFormat !== null}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            !canExportReports
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-60"
                              : "bg-[#25D366] hover:bg-[#20ba59] text-white"
                          }`}
                          title={!canExportReports ? "تتطلب صلاحية reports.export" : "تصدير صورة تقرير احترافية مناسبة لمشاركتها عبر WhatsApp"}
                        >
                          {exportingFormat === "JPG" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          )}
                          <span>صورة واتساب (JPG)</span>
                        </button>

                        {/* 4. Print */}
                        <button
                          onClick={() => window.print()}
                          className="bg-[#1F1714] hover:bg-[#362720] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#C89B3C]" />
                          <span>طباعة</span>
                        </button>
                      </div>
                    </div>

                    {/* Export Security & Success Feedback Banners */}
                    {!canExportReports && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 font-bold">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>تصدير التقارير مقيد: حسابك لا يملك صلاحية تصدير التقارير (reports.export). يمكنك المشاهدة فقط.</span>
                      </div>
                    )}

                    {exportSuccessMessage && (
                      <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 font-bold animate-fadeIn">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{exportSuccessMessage}</span>
                      </div>
                    )}

                    {exportErrorMessage && (
                      <div className="bg-red-50 border border-red-300 text-red-900 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 font-bold animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{exportErrorMessage}</span>
                      </div>
                    )}

                    {/* Period Selection Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#6B5E55]">الفترة الزمنية:</span>
                        {(["daily", "weekly", "monthly", "custom"] as const).map((p) => {
                          const labels: Record<string, string> = {
                            daily: "اليوم (Daily)",
                            weekly: "الأسبوع (Weekly)",
                            monthly: "الشهر (Monthly)",
                            custom: "فترة مخصصة (Custom Range)",
                          };
                          return (
                            <button
                              key={p}
                              onClick={() => {
                                setReportPeriod(p);
                                loadComprehensiveReport(p);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                reportPeriod === p
                                  ? "bg-[#721832] text-white shadow-xs"
                                  : "bg-[#FAF7F2] text-[#5C1027] hover:bg-[#E8DFD1]"
                              }`}
                            >
                              {labels[p]}
                            </button>
                          );
                        })}
                      </div>

                      {reportPeriod === "custom" && (
                        <div className="flex flex-wrap items-center gap-2 bg-[#FAF7F2] p-2 rounded-xl border border-[#E8DFD1]">
                          <span className="text-xs font-bold text-[#6B5E55]">من:</span>
                          <input
                            type="date"
                            value={reportFromDate}
                            onChange={(e) => setReportFromDate(e.target.value)}
                            className="bg-white border border-[#D6C7B7] rounded-lg px-2 py-1 text-xs font-mono"
                          />
                          <span className="text-xs font-bold text-[#6B5E55]">إلى:</span>
                          <input
                            type="date"
                            value={reportToDate}
                            onChange={(e) => setReportToDate(e.target.value)}
                            className="bg-white border border-[#D6C7B7] rounded-lg px-2 py-1 text-xs font-mono"
                          />
                          <button
                            onClick={() => loadComprehensiveReport("custom", reportFromDate, reportToDate)}
                            className="bg-[#721832] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#5C1027] cursor-pointer"
                          >
                            تطبيق الفترة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Period Executive Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFD1] space-y-1">
                      <span className="text-[11px] font-bold text-[#6B5E55] block">إجمالي طلبات الفترة</span>
                      <div className="text-xl font-black text-[#5C1027]">{comprehensiveReport?.counts?.total || 0}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-300 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 block">المكتملة (Completed)</span>
                      <div className="text-xl font-black text-emerald-700">{comprehensiveReport?.counts?.completed || 0}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-purple-300 space-y-1">
                      <span className="text-[11px] font-bold text-purple-800 block">قيد التنفيذ (In Progress)</span>
                      <div className="text-xl font-black text-purple-700">{comprehensiveReport?.counts?.inProgress || 0}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-amber-300 space-y-1">
                      <span className="text-[11px] font-bold text-amber-800 block">المبدئية (Pending)</span>
                      <div className="text-xl font-black text-amber-700">{comprehensiveReport?.counts?.pending || 0}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-red-300 space-y-1">
                      <span className="text-[11px] font-bold text-red-800 block">الملغاة (Cancelled)</span>
                      <div className="text-xl font-black text-red-700">{comprehensiveReport?.counts?.cancelled || 0}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-blue-300 space-y-1">
                      <span className="text-[11px] font-bold text-blue-800 block">المؤكدة والجاهزة</span>
                      <div className="text-xl font-black text-blue-700">
                        {(comprehensiveReport?.counts?.confirmed || 0) + (comprehensiveReport?.counts?.ready || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary Banner */}
                  <div className={`grid gap-4 ${canViewFactoryFinancials && comprehensiveReport?.canViewFactory !== false ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1]">
                      <span className="text-xs font-bold text-[#6B5E55] block">Customer Sales (إجمالي مبيعات العملاء)</span>
                      <div className="text-2xl font-black text-[#5C1027] mt-1">
                        {(comprehensiveReport?.financialSummary?.customerSales || 0).toLocaleString("ar-EG")} ج.م
                      </div>
                      <div className="flex justify-between text-[11px] text-[#6B5E55] mt-2 pt-2 border-t border-[#E8DFD1]">
                        <span>المحصل: <strong className="text-emerald-700 font-mono">{(comprehensiveReport?.financialSummary?.customerPaid || 0).toLocaleString("ar-EG")} ج.م</strong></span>
                        <span>المتبقي: <strong className="text-amber-700 font-mono">{(comprehensiveReport?.financialSummary?.customerRemaining || 0).toLocaleString("ar-EG")} ج.م</strong></span>
                      </div>
                    </div>

                    {canViewFactoryFinancials && comprehensiveReport?.canViewFactory !== false && comprehensiveReport?.financialSummary?.supplierCost !== null ? (
                      <>
                        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1]">
                          <span className="text-xs font-bold text-[#6B5E55] block">Supplier Cost (إجمالي تكلفة المصنع)</span>
                          <div className="text-2xl font-black text-blue-900 mt-1">
                            {(comprehensiveReport?.financialSummary?.supplierCost || 0).toLocaleString("ar-EG")} ج.م
                          </div>
                          <div className="flex justify-between text-[11px] text-[#6B5E55] mt-2 pt-2 border-t border-[#E8DFD1]">
                            <span>المسدد: <strong className="text-blue-700 font-mono">{(comprehensiveReport?.financialSummary?.supplierPaid || 0).toLocaleString("ar-EG")} ج.م</strong></span>
                            <span>المتبقي: <strong className="text-purple-700 font-mono">{(comprehensiveReport?.financialSummary?.supplierRemaining || 0).toLocaleString("ar-EG")} ج.م</strong></span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-[#1F1714] to-[#2A1F1B] text-white p-4 rounded-2xl border border-[#C89B3C]/50 shadow-xs">
                          <span className="text-xs font-bold text-[#C89B3C] block">Celebre Gross Profit (أرباح الفترة الصافية)</span>
                          <div className="text-2xl font-black text-[#C89B3C] mt-1">
                            {(comprehensiveReport?.financialSummary?.grossProfit || 0).toLocaleString("ar-EG")} ج.م
                          </div>
                          <span className="text-[10px] text-[#E8DFD1]/70 block mt-1">
                            ✓ معادلة الربح: Customer Total - Supplier Total (ولا تستخدم المدفوعات لحساب الربح)
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-dashed border-[#C89B3C] flex items-center justify-between text-xs text-[#6B5E55]">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#C89B3C] shrink-0" />
                          <span className="font-bold">بيانات تكاليف المصنع والتوريد وهوامش أرباح سيليبر محجوبة لحماية السرية المالية.</span>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-bold">صلاحية سرية</span>
                      </div>
                    )}
                  </div>

                  {/* 4 Multi-dimensional Breakdowns */}
                  <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DFD1] pb-3">
                      <h4 className="font-black text-sm text-[#221B17]">تفكيك وتحليل البيانات (Breakdowns)</h4>
                      <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD1]">
                        <button
                          onClick={() => setReportBreakdownView("saleCode")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            reportBreakdownView === "saleCode"
                              ? "bg-[#721832] text-white shadow-xs"
                              : "text-[#5C1027] hover:bg-[#E8DFD1]"
                          }`}
                        >
                          حسب كود الوجبة (Sale Code)
                        </button>
                        <button
                          onClick={() => setReportBreakdownView("customer")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            reportBreakdownView === "customer"
                              ? "bg-[#721832] text-white shadow-xs"
                              : "text-[#5C1027] hover:bg-[#E8DFD1]"
                          }`}
                        >
                          حسب العميل (Customer)
                        </button>
                        {canViewFactoryFinancials && comprehensiveReport?.canViewFactory !== false && (
                          <button
                            onClick={() => setReportBreakdownView("supplier")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              reportBreakdownView === "supplier"
                                ? "bg-[#721832] text-white shadow-xs"
                                : "text-[#5C1027] hover:bg-[#E8DFD1]"
                            }`}
                          >
                            حسب المصنع (Supplier)
                          </button>
                        )}
                        <button
                          onClick={() => setReportBreakdownView("paymentMethod")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            reportBreakdownView === "paymentMethod"
                              ? "bg-[#721832] text-white shadow-xs"
                              : "text-[#5C1027] hover:bg-[#E8DFD1]"
                          }`}
                        >
                          حسب طريقة الدفع (Payment Method)
                        </button>
                      </div>
                    </div>

                    {/* Breakdown 1: By Sale Code */}
                    {reportBreakdownView === "saleCode" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-[#FAF7F2] text-[#6B5E55] border-b border-[#E8DFD1]">
                              <th className="p-3">كود العرض</th>
                              <th className="p-3">اسم الوجبة</th>
                              <th className="p-3">عدد الطلبات</th>
                              <th className="p-3">إجمالي الكمية (علبة)</th>
                              <th className="p-3">مبيعات العملاء</th>
                              {canViewFactoryFinancials && comprehensiveReport?.canViewFactory !== false && (
                                <>
                                  <th className="p-3">تكلفة المصنع</th>
                                  <th className="p-3">الأرباح الصافية</th>
                                  <th className="p-3">نسبة الهامش</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]">
                            {(comprehensiveReport?.breakdowns?.bySaleCode || []).map((b: any) => {
                              const margin = b.customerSales > 0 && b.grossProfit !== null ? ((b.grossProfit / b.customerSales) * 100).toFixed(1) : "0";
                              return (
                                <tr key={b.code} className="hover:bg-[#FAF7F2]/60">
                                  <td className="p-3 font-mono font-bold text-[#5C1027]">{b.code}</td>
                                  <td className="p-3 font-bold text-[#221B17]">{b.name}</td>
                                  <td className="p-3 font-mono">{b.ordersCount}</td>
                                  <td className="p-3 font-mono font-bold">{b.totalQuantity}</td>
                                  <td className="p-3 font-bold text-[#221B17]">{b.customerSales?.toLocaleString("ar-EG")} ج.م</td>
                                  {canViewFactoryFinancials && comprehensiveReport?.canViewFactory !== false && (
                                    <>
                                      <td className="p-3 font-bold text-blue-900">{b.supplierCost !== null ? `${b.supplierCost?.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                                      <td className="p-3 font-black text-[#C89B3C]">{b.grossProfit !== null ? `${b.grossProfit?.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                                      <td className="p-3 font-mono text-emerald-700 font-bold">{margin}%</td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Breakdown 2: By Customer */}
                    {reportBreakdownView === "customer" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-[#FAF7F2] text-[#6B5E55] border-b border-[#E8DFD1]">
                              <th className="p-3">اسم العميل</th>
                              <th className="p-3">الهاتف</th>
                              <th className="p-3">عدد الطلبات</th>
                              <th className="p-3">إجمالي المبيعات</th>
                              <th className="p-3">المحصل</th>
                              <th className="p-3">المتبقي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]">
                            {(comprehensiveReport?.breakdowns?.byCustomer || []).map((c: any) => (
                              <tr key={c.customerId} className="hover:bg-[#FAF7F2]/60">
                                <td className="p-3 font-bold text-[#221B17]">{c.customerName}</td>
                                <td className="p-3 font-mono text-[#6B5E55]">{c.customerPhone}</td>
                                <td className="p-3 font-mono font-bold">{c.ordersCount}</td>
                                <td className="p-3 font-bold text-[#5C1027]">{c.customerSales?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="p-3 font-bold text-emerald-700">{c.customerPaid?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="p-3 font-bold text-amber-700">{c.customerRemaining?.toLocaleString("ar-EG")} ج.م</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Breakdown 3: By Supplier */}
                    {reportBreakdownView === "supplier" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-[#FAF7F2] text-[#6B5E55] border-b border-[#E8DFD1]">
                              <th className="p-3">المصنع / المورد</th>
                              <th className="p-3">الهاتف</th>
                              <th className="p-3">أوامر التوريد</th>
                              <th className="p-3">إجمالي التكلفة</th>
                              <th className="p-3">المسدد</th>
                              <th className="p-3">المتبقي للمصنع</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]">
                            {(comprehensiveReport?.breakdowns?.bySupplier || []).map((s: any) => (
                              <tr key={s.supplierId} className="hover:bg-[#FAF7F2]/60">
                                <td className="p-3 font-bold text-[#221B17]">{s.supplierName}</td>
                                <td className="p-3 font-mono text-[#6B5E55]">{s.phone}</td>
                                <td className="p-3 font-mono font-bold">{s.ordersCount}</td>
                                <td className="p-3 font-bold text-blue-900">{s.supplierTotal?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="p-3 font-bold text-emerald-700">{s.supplierPaid?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="p-3 font-bold text-purple-700">{s.supplierRemaining?.toLocaleString("ar-EG")} ج.م</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Breakdown 4: By Payment Method */}
                    {reportBreakdownView === "paymentMethod" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(comprehensiveReport?.breakdowns?.byPaymentMethod || []).map((m: any) => (
                            <div key={m.method} className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFD1] space-y-1">
                              <span className="text-xs font-bold text-[#6B5E55] block">{m.method}</span>
                              <div className="text-lg font-black text-emerald-700">{m.totalAmount?.toLocaleString("ar-EG")} ج.م</div>
                              <span className="text-[10px] text-[#8C6D28] font-bold block">{m.count} عملية مؤكدة</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            MODAL 1: ORDER FULL DETAILS (CUSTOMER SIDE, SUPPLIER SIDE, PROFIT, AUDIT)
            ========================================================================= */}
        {selectedOrderId && orderDetail && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFD1] flex flex-col">
              {/* Detail Header */}
              <div className="bg-gradient-to-r from-[#721832] to-[#5C1027] text-white p-5 rounded-t-3xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-[#C89B3C]">
                      {orderDetail.order.orderNumber}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 font-bold">
                      {ALL_STATUSES.find((s) => s.key === orderDetail.order.orderStatus)?.label || orderDetail.order.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-[#F4EEDB]">
                    تاريخ الإنشاء: {new Date(orderDetail.order.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEdit}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="تعديل بيانات الطلب"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsCancelOpen(true)}
                    className="p-2 rounded-xl bg-red-600/30 hover:bg-red-600 text-white transition-colors"
                    title="إلغاء الطلب"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Management Bar */}
              <div className="bg-white px-5 py-3 border-b border-[#E8DFD1] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5C1027]">
                  <Layers className="w-4 h-4 text-[#C89B3C]" />
                  <span>تغيير حالة الطلب:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ALL_STATUSES.map((st) => (
                    <button
                      key={st.key}
                      onClick={() => handleUpdateStatus(st.key)}
                      disabled={orderDetail.order.orderStatus === st.key}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        orderDetail.order.orderStatus === st.key
                          ? `${st.color} shadow-xs font-black ring-2 ring-[#721832]`
                          : "bg-[#FAF7F2] text-[#4A3E38] border-[#E8DFD1] hover:bg-white"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* FINANCIAL SIDES CARD (CUSTOMER SIDE vs SUPPLIER SIDE vs PROFIT) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. CUSTOMER SIDE */}
                  <div className="bg-white rounded-2xl p-4 border-2 border-emerald-500/30 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                      <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>CUSTOMER SIDE (حساب العميل)</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B5E55]">Distributor Price (سعر الوجبة):</span>
                        <span className="font-bold">{orderDetail.items[0]?.distributorUnitPrice || 0} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B5E55]">Customer Total (إجمالي العميل):</span>
                        <span className="font-black text-emerald-700">{orderDetail.order.totalAmount} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B5E55]">Customer Paid (المدفوع):</span>
                        <span className="font-bold text-emerald-600">{orderDetail.order.customerPaid} ج.م</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#E8DFD1]">
                        <span className="font-bold text-[#221B17]">Customer Remaining (المتبقي):</span>
                        <span className="font-black text-red-600">{orderDetail.order.customerRemaining} ج.م</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsCustPayOpen(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>تسجيل دفعة عميل (InstaPay / كاش)</span>
                    </button>
                  </div>

                  {/* 2. SUPPLIER SIDE */}
                  <div className="bg-white rounded-2xl p-4 border-2 border-blue-500/30 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                      <span className="text-xs font-black text-blue-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>SUPPLIER SIDE (حساب المصنع)</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B5E55]">Factory Price (سعر المصنع):</span>
                        <span className="font-bold">{orderDetail.items[0]?.supplierUnitPrice || 0} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B5E55]">Supplier Total (إجمالي المصنع):</span>
                        <span className="font-black text-blue-700">{orderDetail.order.supplierTotal} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B5E55]">Supplier Paid (المدفوع للمصنع):</span>
                        <span className="font-bold text-blue-600">{orderDetail.order.supplierPaid} ج.م</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#E8DFD1]">
                        <span className="font-bold text-[#221B17]">Supplier Remaining (المتبقي):</span>
                        <span className="font-black text-amber-700">{orderDetail.order.supplierRemaining} ج.م</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSupPayOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>تسجيل تحويل للمصنع</span>
                    </button>
                  </div>

                  {/* 3. PROFIT */}
                  <div className="bg-gradient-to-br from-[#721832]/5 to-[#C89B3C]/10 rounded-2xl p-4 border-2 border-[#C89B3C]/40 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                      <span className="text-xs font-black text-[#721832] flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#C89B3C]" />
                        <span>PROFIT (هامش ربح سيليبر)</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-[#E8DFD1] text-center">
                        <span className="text-[10px] text-[#6B5E55] block">المعادلة: Distributor Total - Supplier Total</span>
                        <span className="text-xl sm:text-2xl font-black text-[#721832] block mt-1">
                          {orderDetail.order.distributorProfit} ج.م
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#4A3E38] pt-1">
                        <span>نسبة الربح من المبيعات:</span>
                        <span className="font-bold text-[#721832]">
                          {orderDetail.order.totalAmount > 0
                            ? ((orderDetail.order.distributorProfit / orderDetail.order.totalAmount) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#8C6D28] bg-white/60 p-2 rounded-lg text-center font-bold">
                      حسابات منفصلة تماماً • لا يتم خلط دفعات العميل بالمصنع
                    </div>
                  </div>
                </div>

                {/* ORDER ITEMS & PRICE SNAPSHOTS */}
                <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                    <h4 className="font-black text-xs text-[#5C1027] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#C89B3C]" />
                      <span>تفاصيل الوجبات والأسعار المحفوظة (Price Snapshots at Order Time):</span>
                    </h4>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      محفوظة وقت الإنشاء ولا تتغير تلقائياً
                    </span>
                  </div>

                  <div className="divide-y divide-[#E8DFD1]">
                    {orderDetail.items.map((it: any) => (
                      <div key={it.id} className="py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-[#221B17]">
                            <span className="px-2 py-0.5 rounded bg-[#721832] text-white text-[10px] ml-1.5">{it.menuCode}</span>
                            <span>{it.menuName}</span>
                          </div>
                          <div className="text-[11px] text-[#6B5E55] mt-0.5">
                            الكمية: <strong className="text-[#5C1027]">{it.quantity} وجبة</strong> • تعديل المشروب: {it.customerAdjustment} ج.م
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-left font-mono">
                          <div>
                            <span className="text-[10px] text-[#6B5E55] block">Distributor Unit</span>
                            <span className="font-bold text-[#221B17]">{it.distributorUnitPrice} ج</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B5E55] block">Factory Unit</span>
                            <span className="font-bold text-[#4A3E38]">{it.supplierUnitPrice} ج</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B5E55] block">Item Profit</span>
                            <span className="font-black text-emerald-700">+{it.profit} ج</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* =========================================================================
                    PAYMENT HISTORY (CUSTOMER PAYMENTS & SUPPLIER PAYMENTS)
                    ========================================================================= */}
                <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DFD1] pb-3">
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-[#5C1027] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#C89B3C]" />
                        <span>سجل المدفوعات للطلب (Payment History)</span>
                      </h4>
                      <p className="text-[11px] text-[#6B5E55] mt-0.5">
                        توثيق يدوي كامل للدفعات المستلمة خارج الموقع دون أي بوابات دفع إلكترونية
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCustPayOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تسجيل دفعة عميل</span>
                      </button>
                      <button
                        onClick={() => setIsSupPayOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تحويل للمصنع</span>
                      </button>
                    </div>
                  </div>

                  {/* CUSTOMER PAYMENTS TABLE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>دفعات العميل (Customer Payments):</span>
                      </h5>
                      <span className="text-[10px] text-[#6B5E55]">
                        المؤكد (VERIFIED) فقط يُحسب في customer_paid
                      </span>
                    </div>

                    {orderDetail.customerPayments && orderDetail.customerPayments.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-[#E8DFD1]">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-[#FAF7F2] text-[#5C1027] font-bold border-b border-[#E8DFD1]">
                            <tr>
                              <th className="p-2">#ID</th>
                              <th className="p-2">المبلغ</th>
                              <th className="p-2">طريقة الدفع</th>
                              <th className="p-2">حالة الدفعة</th>
                              <th className="p-2">الرقم المرجعي</th>
                              <th className="p-2">تاريخ السداد</th>
                              <th className="p-2">المستلم والملاحظات</th>
                              <th className="p-2 text-center">إجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]/60">
                            {orderDetail.customerPayments.map((cp: any) => (
                              <tr key={cp.id} className="hover:bg-[#FAF7F2]/50">
                                <td className="p-2 font-mono font-bold text-[#721832]">#{cp.id}</td>
                                <td className="p-2 font-black text-emerald-700">{cp.amount} ج.م</td>
                                <td className="p-2">
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#FAF7F2] border border-[#D6C7B7]">
                                    {cp.paymentMethod}
                                  </span>
                                </td>
                                <td className="p-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-black text-[10px] border ${
                                      cp.paymentStatus === "VERIFIED"
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : cp.paymentStatus === "PENDING_REVIEW"
                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                        : "bg-red-100 text-red-800 border-red-300"
                                    }`}
                                  >
                                    {cp.paymentStatus === "VERIFIED"
                                      ? "مؤكدة (VERIFIED)"
                                      : cp.paymentStatus === "PENDING_REVIEW"
                                      ? "قيد المراجعة"
                                      : "مرفوضة"}
                                  </span>
                                </td>
                                <td className="p-2 font-mono text-[11px] text-[#4A3E38]">{cp.paymentReference || "—"}</td>
                                <td className="p-2 font-mono text-[11px] text-[#8C7D73]">
                                  {new Date(cp.paidAt || cp.createdAt).toLocaleString("ar-EG")}
                                </td>
                                <td className="p-2 text-[11px] text-[#4A3E38]">
                                  <span className="font-semibold block">{cp.receivedBy}</span>
                                  <span className="text-[#8C7D73] truncate max-w-[120px] block">{cp.notes || ""}</span>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => {
                                      setEditingCustPayment({
                                        id: cp.id,
                                        amount: String(cp.amount),
                                        method: cp.paymentMethod,
                                        status: cp.paymentStatus,
                                        ref: cp.paymentReference || "",
                                        notes: cp.notes || "",
                                      });
                                      setIsEditCustPayOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-emerald-50 text-emerald-700 border border-[#D6C7B7] text-xs font-bold flex items-center gap-1 mx-auto transition-colors"
                                    title="تعديل الدفعة وإعادة الاحتساب"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>تعديل</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-[#FAF7F2] p-3 rounded-xl border border-dashed border-[#D6C7B7] text-center text-[#8C7D73] text-xs">
                        لم يتم تسجيل أي دفعات من العميل بعد (الحساب معلق أو حجز مبدئي)
                      </div>
                    )}
                  </div>

                  {/* SUPPLIER PAYMENTS TABLE */}
                  <div className="space-y-2 pt-2 border-t border-[#E8DFD1]">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-blue-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>دفعات المصنع / المورد (Supplier Payments):</span>
                      </h5>
                      <span className="text-[10px] text-[#6B5E55]">
                        تُحسب في supplier_paid دون المساس بحساب العميل
                      </span>
                    </div>

                    {orderDetail.supplierPayments && orderDetail.supplierPayments.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-[#E8DFD1]">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-[#FAF7F2] text-[#5C1027] font-bold border-b border-[#E8DFD1]">
                            <tr>
                              <th className="p-2">#ID</th>
                              <th className="p-2">المبلغ المحول</th>
                              <th className="p-2">طريقة التحويل</th>
                              <th className="p-2">الرقم المرجعي</th>
                              <th className="p-2">تاريخ التحويل</th>
                              <th className="p-2">المسجل والملاحظات</th>
                              <th className="p-2 text-center">إجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DFD1]/60">
                            {orderDetail.supplierPayments.map((sp: any) => (
                              <tr key={sp.id} className="hover:bg-[#FAF7F2]/50">
                                <td className="p-2 font-mono font-bold text-blue-800">#{sp.id}</td>
                                <td className="p-2 font-black text-blue-700">{sp.amount} ج.م</td>
                                <td className="p-2">
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#FAF7F2] border border-[#D6C7B7]">
                                    {sp.paymentMethod}
                                  </span>
                                </td>
                                <td className="p-2 font-mono text-[11px] text-[#4A3E38]">{sp.reference || "—"}</td>
                                <td className="p-2 font-mono text-[11px] text-[#8C7D73]">
                                  {new Date(sp.paidAt || sp.createdAt).toLocaleString("ar-EG")}
                                </td>
                                <td className="p-2 text-[11px] text-[#4A3E38]">
                                  <span className="font-semibold block">{sp.paidBy}</span>
                                  <span className="text-[#8C7D73] truncate max-w-[120px] block">{sp.notes || ""}</span>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => {
                                      setEditingSupPayment({
                                        id: sp.id,
                                        amount: String(sp.amount),
                                        method: sp.paymentMethod,
                                        ref: sp.reference || "",
                                        notes: sp.notes || "",
                                      });
                                      setIsEditSupPayOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-blue-50 text-blue-700 border border-[#D6C7B7] text-xs font-bold flex items-center gap-1 mx-auto transition-colors"
                                    title="تعديل دفعة المصنع وإعادة الاحتساب"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>تعديل</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-[#FAF7F2] p-3 rounded-xl border border-dashed border-[#D6C7B7] text-center text-[#8C7D73] text-xs">
                        لم يتم تسجيل أي تحويل مالي للمصنع لهذا الطلب بعد
                      </div>
                    )}
                  </div>
                </div>

                {/* CUSTOMER & LOGISTICS DETAILS */}
                <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                  <h4 className="font-black text-xs text-[#5C1027] border-b border-[#E8DFD1] pb-2">
                    بيانات التواصل وموقع التسليم:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#6B5E55] block">العميل:</span>
                      <span className="font-bold text-[#221B17]">{orderDetail.customer?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[#6B5E55] block">الهاتف / WhatsApp:</span>
                      <span className="font-bold text-[#221B17]" dir="ltr">{orderDetail.customer?.phone}</span>
                    </div>
                    <div>
                      <span className="text-[#6B5E55] block">موعد وتاريخ الاستلام:</span>
                      <span className="font-bold text-[#221B17]">{orderDetail.order.pickupDate} ({orderDetail.order.pickupTime})</span>
                    </div>
                    <div>
                      <span className="text-[#6B5E55] block">مكان الاستلام:</span>
                      <span className="font-bold text-[#221B17]">{orderDetail.order.pickupLocation}</span>
                    </div>
                    {orderDetail.order.customerNotes && (
                      <div className="sm:col-span-2">
                        <span className="text-[#6B5E55] block">ملاحظات العميل:</span>
                        <span className="text-[#221B17]">{orderDetail.order.customerNotes}</span>
                      </div>
                    )}
                    {orderDetail.order.cancelReason && (
                      <div className="sm:col-span-2 bg-red-50 p-2.5 rounded-xl border border-red-200 text-red-800">
                        <span className="font-bold block">سبب الإلغاء المسجل:</span>
                        <span>{orderDetail.order.cancelReason}</span>
                      </div>
                    )}
                  </div>

                  {/* =========================================================================
                      WHATSAPP MESSAGING LAYER (OFFICIAL & DEEP LINK CAPABLE)
                      ========================================================================= */}
                  <div className="pt-3 border-t border-[#E8DFD1] space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                          <MessageCircle className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-[#221B17]">منظومة مراسلات واتساب (WhatsApp Messaging Layer)</h4>
                          <p className="text-[10px] text-[#6B5E55]">توليد الرسائل المعيارية مع الفصل التام لسرية الأسعار والحسابات</p>
                        </div>
                      </div>

                      {orderDetail.whatsapp.hasApiCredentials ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp Business API متصل</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold" title="لا تدعي المنظومة الإرسال التلقائي دون وجود API رسمي">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>وضع WhatsApp Deep Links (إرسال يدوي موثق)</span>
                        </span>
                      )}
                    </div>

                    {/* Last Message Tracking Record */}
                    <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD1] text-[11px] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[#5C1027]">
                        <Clock className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span className="font-bold">سجل آخر مراسلة:</span>
                        {orderDetail.order.lastMessageAt ? (
                          <span className="text-[#221B17]">
                            <span className="font-bold text-[#8C6D28]">{orderDetail.order.lastMessageType}</span>
                            {" "}بتاريخ{" "}
                            <span className="font-mono text-[10px]">{new Date(orderDetail.order.lastMessageAt).toLocaleString("ar-EG")}</span>
                            {" "}بواسطة:{" "}
                            <span className="font-bold">{orderDetail.order.lastMessageBy || "النظام"}</span>
                            {orderDetail.order.lastMessageRecipient && (
                              <span className="text-[#6B5E55]"> (إلى: {orderDetail.order.lastMessageRecipient})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[#8C6D28] italic">لم يتم إنشاء أو تسجيل أي مراسلة لهذا الطلب حتى الآن</span>
                        )}
                      </div>

                      {orderDetail.order.lastMessageAt && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                          موثق بالرقابة
                        </span>
                      )}
                    </div>

                    {/* The 4 WhatsApp Actions Required by Specification */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Action 1: Send Customer Message */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppModal("CUSTOMER_MESSAGE")}
                        className="bg-[#25D366] hover:bg-[#20ba59] text-white p-2.5 rounded-xl text-center transition-all shadow-xs flex flex-col items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span className="font-black text-xs">رسالة العميل</span>
                        <span className="text-[9px] opacity-90">تأكيد الحجز المبدئي</span>
                      </button>

                      {/* Action 2: Send Supplier Message */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppModal("SUPPLIER_MESSAGE")}
                        className="bg-[#1F1714] hover:bg-[#362720] text-white p-2.5 rounded-xl text-center transition-all shadow-xs flex flex-col items-center justify-center gap-1 border border-[#C89B3C]/30"
                      >
                        <Building2 className="w-4 h-4 text-[#C89B3C]" />
                        <span className="font-black text-xs">رسالة المصنع</span>
                        <span className="text-[9px] text-[#C89B3C]">أمر التشغيل والتوريد</span>
                      </button>

                      {/* Action 3: Send Customer Update */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppModal("CUSTOMER_UPDATE")}
                        className="bg-white hover:bg-emerald-50 text-[#128C7E] border border-[#25D366] p-2.5 rounded-xl text-center transition-all shadow-xs flex flex-col items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="font-black text-xs">تحديث العميل</span>
                        <span className="text-[9px] text-[#6B5E55]">تعديل حالة / دفعة</span>
                      </button>

                      {/* Action 4: Send Supplier Update */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppModal("SUPPLIER_UPDATE")}
                        className="bg-white hover:bg-amber-50 text-[#5C1027] border border-[#C89B3C] p-2.5 rounded-xl text-center transition-all shadow-xs flex flex-col items-center justify-center gap-1"
                      >
                        <Send className="w-4 h-4 text-[#C89B3C]" />
                        <span className="font-black text-xs">تحديث المصنع</span>
                        <span className="text-[9px] text-[#6B5E55]">تعديل تشغيل / حساب</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* AUDIT LOGS */}
                <div className="bg-white rounded-2xl p-4 border border-[#E8DFD1] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                    <h4 className="font-black text-xs text-[#5C1027] flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#C89B3C]" />
                      <span>سجل الرقابة والتعديلات (Audit Log):</span>
                    </h4>
                    <span className="text-[10px] text-[#8C6D28]">تتبع كامل مع اسم المستخدم والتوقيت</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {orderDetail.auditLogs && orderDetail.auditLogs.length > 0 ? (
                      orderDetail.auditLogs.map((log: any) => {
                        const isPaymentLog = log.action.includes("PAYMENT");
                        return (
                          <div
                            key={log.id}
                            className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                              isPaymentLog
                                ? "bg-emerald-50/70 border-emerald-200"
                                : "bg-[#FAF7F2] border-[#E8DFD1]/60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-black flex items-center gap-1 ${
                                isPaymentLog ? "text-emerald-900" : "text-[#5C1027]"
                              }`}>
                                {isPaymentLog && <DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
                                <span>{log.action}</span>
                              </span>
                              <span className="text-[10px] text-[#8C7D73] font-mono">
                                {new Date(log.createdAt).toLocaleString("ar-EG")}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#4A3E38] flex items-center gap-2">
                              <span>بواسطة: <strong className="text-[#721832]">{log.userName}</strong></span>
                              {log.ip && <span className="text-[#8C7D73] font-mono">({log.ip})</span>}
                            </div>
                            {log.newData && (
                              <div className="bg-white/80 p-2 rounded-lg border border-black/5 font-mono text-[10px] space-y-0.5">
                                {log.newData.amount && <div>المبلغ: <strong>{log.newData.amount} ج.م</strong></div>}
                                {log.newData.paymentMethod && <div>طريقة الدفع: <strong>{log.newData.paymentMethod}</strong></div>}
                                {log.newData.paymentStatus && <div>الحالة: <strong className={log.newData.paymentStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}>{log.newData.paymentStatus}</strong></div>}
                                {log.newData.newPaid !== undefined && <div>إجمالي المدفوع الجديد: <strong>{log.newData.newPaid} ج.م</strong></div>}
                                {log.newData.newRemaining !== undefined && <div>المتبقي الجديد: <strong>{log.newData.newRemaining} ج.م</strong></div>}
                                {log.oldData && (
                                  <div className="text-[#8C7D73] pt-0.5 border-t border-dashed border-[#D6C7B7]">
                                    {log.oldData.paymentStatus && <span>(الحالة السابقة: {log.oldData.paymentStatus}) </span>}
                                    {log.oldData.amount && <span>(المبلغ السابق: {log.oldData.amount} ج.م)</span>}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-[#8C7D73]">لا توجد تعديلات إضافية مسجلة</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: CREATE ORDER (ADMIN)
            ========================================================================= */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFD1] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
                <h3 className="font-black text-base text-[#5C1027] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#C89B3C]" />
                  <span>إنشاء طلب جديد من لوحة الإدارة</span>
                </h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-[#FAF7F2]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold border border-red-200">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">اسم العميل *</label>
                    <input
                      type="text"
                      required
                      value={createForm.customerName}
                      onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#721832]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">الهاتف *</label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-semibold text-right focus:outline-none focus:ring-2 focus:ring-[#721832]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">الوجبة *</label>
                    <select
                      value={createForm.menuCode}
                      onChange={(e) => setCreateForm({ ...createForm, menuCode: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-bold text-[#5C1027]"
                    >
                      {menuItems.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.code} - {m.name} ({m.distributorPrice} ج)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">الكمية *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={createForm.quantity}
                      onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">خيارات المشروب</label>
                  <select
                    value={createForm.drinkOption}
                    onChange={(e: any) => setCreateForm({ ...createForm, drinkOption: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-bold"
                  >
                    <option value="included">عصير بخيرة مشمول بالوجبة (0 ج)</option>
                    <option value="exclude_juice">استبعاد العصير (-5 ج للوجبة)</option>
                    <option value="replace_pepsi">استبدال بكانز بيبسي (+10 ج للوجبة)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">تاريخ الاستلام *</label>
                    <input
                      type="date"
                      required
                      value={createForm.pickupDate}
                      onChange={(e) => setCreateForm({ ...createForm, pickupDate: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">وقت الاستلام *</label>
                    <input
                      type="text"
                      required
                      value={createForm.pickupTime}
                      onChange={(e) => setCreateForm({ ...createForm, pickupTime: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">مكان الاستلام *</label>
                  <input
                    type="text"
                    required
                    value={createForm.pickupLocation}
                    onChange={(e) => setCreateForm({ ...createForm, pickupLocation: e.target.value })}
                    placeholder="المحافظة - القاعة / المسجد / العنوان"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">حالة الطلب المبدئية</label>
                  <select
                    value={createForm.initialStatus}
                    onChange={(e) => setCreateForm({ ...createForm, initialStatus: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-bold text-[#721832]"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#E8DFD1]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D6C7B7] font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-[#721832] hover:bg-[#5C1027] text-white font-black py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>حفظ وإنشاء الطلب وأمر التوريد</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: EDIT ORDER
            ========================================================================= */}
        {isEditOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-2">
                <h3 className="font-black text-sm text-[#5C1027] flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-[#C89B3C]" />
                  <span>تعديل تفاصيل الطلب (إعادة حساب مع الحفاظ على سعر الوحدة)</span>
                </h3>
                <button onClick={() => setIsEditOpen(false)}><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">اسم العميل</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">الهاتف</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 text-right"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">عدد الوجبات</label>
                    <input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">تاريخ الاستلام</label>
                    <input
                      type="date"
                      value={editForm.pickupDate}
                      onChange={(e) => setEditForm({ ...editForm, pickupDate: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">توقيت الاستلام</label>
                    <input
                      type="text"
                      value={editForm.pickupTime}
                      onChange={(e) => setEditForm({ ...editForm, pickupTime: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">مكان الاستلام</label>
                  <input
                    type="text"
                    value={editForm.pickupLocation}
                    onChange={(e) => setEditForm({ ...editForm, pickupLocation: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">ملاحظات</label>
                  <textarea
                    rows={2}
                    value={editForm.customerNotes}
                    onChange={(e) => setEditForm({ ...editForm, customerNotes: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#E8DFD1]">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded-xl font-bold">إلغاء</button>
                  <button type="submit" disabled={editLoading} className="flex-1 bg-[#721832] text-white font-bold py-2 rounded-xl">
                    {editLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "حفظ التعديلات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 4: CANCEL ORDER (WITH REASON)
            ========================================================================= */}
        {isCancelOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
              <div className="flex items-center gap-2 text-red-600 font-black text-sm border-b pb-2">
                <AlertTriangle className="w-5 h-5" />
                <span>إلغاء الطلب (تسجيل في سجل الرقابة)</span>
              </div>
              <p className="text-[#4A3E38]">
                يرجى كتابة سبب الإلغاء بالتفصيل لتوثيقه في Audit Log وتحديث حالة الطلب إلى CANCELLED.
              </p>
              <form onSubmit={handleCancelSubmit} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="مثال: اعتذار العميل لظروف خاصة / إلغاء حفل الزفاف..."
                  className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-semibold"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsCancelOpen(false)} className="px-4 py-2 border rounded-xl font-bold">تراجع</button>
                  <button type="submit" disabled={cancelLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2 rounded-xl">
                    {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "تأكيد إلغاء الطلب"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 5: RECORD CUSTOMER PAYMENT
            ========================================================================= */}
        {/* =========================================================================
            MODAL 5: RECORD CUSTOMER PAYMENT
            ========================================================================= */}
        {isCustPayOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-black text-sm text-emerald-800">تسجيل دفعة عميل جديدة</h3>
                  <span className="text-[10px] text-[#6B5E55]">دفع يدوي خارج الموقع (InstaPay / كاش / تحويل)</span>
                </div>
                <button onClick={() => setIsCustPayOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleRecordCustomerPayment} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ المدفوع (جنيه مصري) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={custPayAmount}
                    onChange={(e) => setCustPayAmount(e.target.value)}
                    placeholder="مثال: 1000"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-black text-emerald-700 text-base"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">طريقة الدفع *</label>
                    <select
                      value={custPayMethod}
                      onChange={(e: any) => setCustPayMethod(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-bold"
                    >
                      <option value="INSTAPAY">إنستاباي (INSTAPAY)</option>
                      <option value="CASH">كاش باليد (CASH)</option>
                      <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                      <option value="OTHER">أخرى (OTHER)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">حالة الدفعة *</label>
                    <select
                      value={custPayStatus}
                      onChange={(e: any) => setCustPayStatus(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-black text-emerald-800"
                    >
                      <option value="VERIFIED">مؤكدة (VERIFIED)</option>
                      <option value="PENDING_REVIEW">قيد المراجعة (PENDING_REVIEW)</option>
                      <option value="REJECTED">مرفوضة (REJECTED)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-800">
                  {custPayStatus === "VERIFIED"
                    ? "✓ سيتم احتساب الدفعة فوراً ضمن customer_paid وخصمها من المتبقي."
                    : "⚠️ لن تُحسب الدفعة ضمن customer_paid حتى يتم تأكيدها ومراجعتها."}
                </div>

                <div>
                  <label className="block font-bold mb-1">الرقم المرجعي / اسم المحوّل</label>
                  <input
                    type="text"
                    value={custPayRef}
                    onChange={(e) => setCustPayRef(e.target.value)}
                    placeholder="رقم مرجع إنستاباي أو إيصال التحويل"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={custPayNotes}
                    onChange={(e) => setCustPayNotes(e.target.value)}
                    placeholder="مثال: تم التأكيد عبر سكرين شوت واتساب"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button type="button" onClick={() => setIsCustPayOpen(false)} className="px-4 py-2 border rounded-xl font-bold">إلغاء</button>
                  <button type="submit" disabled={custPayLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl">
                    {custPayLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "توثيق الدفعة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 6: RECORD SUPPLIER PAYMENT
            ========================================================================= */}
        {isSupPayOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-black text-sm text-blue-800">تسجيل دفعة محولة للمصنع (Supplier)</h3>
                  <span className="text-[10px] text-[#6B5E55]">مستقل تماماً ولا يمس حساب العميل</span>
                </div>
                <button onClick={() => setIsSupPayOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleRecordSupplierPayment} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ المحول للمصنع (جنيه مصري) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={supPayAmount}
                    onChange={(e) => setSupPayAmount(e.target.value)}
                    placeholder="مثال: 1500"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-black text-blue-700 text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">طريقة التحويل للمصنع</label>
                  <select
                    value={supPayMethod}
                    onChange={(e) => setSupPayMethod(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-bold"
                  >
                    <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                    <option value="INSTAPAY">إنستاباي (INSTAPAY)</option>
                    <option value="CASH">كاش مباشر للمصنع (CASH)</option>
                    <option value="OTHER">أخرى (OTHER)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">الرقم المرجعي للتحويل</label>
                  <input
                    type="text"
                    value={supPayRef}
                    onChange={(e) => setSupPayRef(e.target.value)}
                    placeholder="رقم مرجع التحويل البنكي أو إيصال السداد"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ملاحظات التحويل</label>
                  <input
                    type="text"
                    value={supPayNotes}
                    onChange={(e) => setSupPayNotes(e.target.value)}
                    placeholder="مثال: دفعة تحت حساب التجهيز"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                  />
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <button type="button" onClick={() => setIsSupPayOpen(false)} className="px-4 py-2 border rounded-xl font-bold">إلغاء</button>
                  <button type="submit" disabled={supPayLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2 rounded-xl">
                    {supPayLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "توثيق دفعة المصنع"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 7: EDIT CUSTOMER PAYMENT
            ========================================================================= */}
        {isEditCustPayOpen && editingCustPayment && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-black text-sm text-[#721832] flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-[#C89B3C]" />
                    <span>تعديل دفعة عميل #{editingCustPayment.id} (Edit Payment)</span>
                  </h3>
                  <span className="text-[10px] text-[#6B5E55]">إعادة احتساب customer_paid وتسجيل في Audit Log</span>
                </div>
                <button onClick={() => setIsEditCustPayOpen(false)}><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleUpdateCustomerPayment} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ (جنيه مصري) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={editingCustPayment.amount}
                    onChange={(e) => setEditingCustPayment({ ...editingCustPayment, amount: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-black text-emerald-700 text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">طريقة الدفع *</label>
                    <select
                      value={editingCustPayment.method}
                      onChange={(e: any) => setEditingCustPayment({ ...editingCustPayment, method: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-bold"
                    >
                      <option value="INSTAPAY">إنستاباي (INSTAPAY)</option>
                      <option value="CASH">كاش باليد (CASH)</option>
                      <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                      <option value="OTHER">أخرى (OTHER)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">حالة الدفعة *</label>
                    <select
                      value={editingCustPayment.status}
                      onChange={(e: any) => setEditingCustPayment({ ...editingCustPayment, status: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-black text-emerald-800"
                    >
                      <option value="VERIFIED">مؤكدة (VERIFIED)</option>
                      <option value="PENDING_REVIEW">قيد المراجعة (PENDING_REVIEW)</option>
                      <option value="REJECTED">مرفوضة (REJECTED)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">الرقم المرجعي</label>
                  <input
                    type="text"
                    value={editingCustPayment.ref}
                    onChange={(e) => setEditingCustPayment({ ...editingCustPayment, ref: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">ملاحظات التعديل</label>
                  <input
                    type="text"
                    value={editingCustPayment.notes}
                    onChange={(e) => setEditingCustPayment({ ...editingCustPayment, notes: e.target.value })}
                    placeholder="سبب أو تفاصيل التعديل"
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                  />
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-800 text-[10px]">
                  سيتم فور الحفظ إعادة احتساب:
                  <div className="font-mono mt-0.5">customer_paid = SUM(verified payments)</div>
                  <div className="font-mono">customer_remaining = customer_total - customer_paid (بدون سالب)</div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button type="button" onClick={() => setIsEditCustPayOpen(false)} className="px-4 py-2 border rounded-xl font-bold">إلغاء</button>
                  <button type="submit" disabled={editPaymentLoading} className="flex-1 bg-[#721832] hover:bg-[#5C1027] text-white font-black py-2 rounded-xl">
                    {editPaymentLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "حفظ التعديلات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 8: EDIT SUPPLIER PAYMENT
            ========================================================================= */}
        {isEditSupPayOpen && editingSupPayment && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-black text-sm text-blue-800 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-[#C89B3C]" />
                    <span>تعديل دفعة المصنع #{editingSupPayment.id} (Edit Payment)</span>
                  </h3>
                  <span className="text-[10px] text-[#6B5E55]">إعادة احتساب supplier_paid للمصنع فقط</span>
                </div>
                <button onClick={() => setIsEditSupPayOpen(false)}><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleUpdateSupplierPayment} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ المحول (جنيه مصري) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={editingSupPayment.amount}
                    onChange={(e) => setEditingSupPayment({ ...editingSupPayment, amount: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 font-black text-blue-700 text-base"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">طريقة التحويل *</label>
                  <select
                    value={editingSupPayment.method}
                    onChange={(e: any) => setEditingSupPayment({ ...editingSupPayment, method: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-bold"
                  >
                    <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                    <option value="INSTAPAY">إنستاباي (INSTAPAY)</option>
                    <option value="CASH">كاش مباشر (CASH)</option>
                    <option value="OTHER">أخرى (OTHER)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">الرقم المرجعي</label>
                  <input
                    type="text"
                    value={editingSupPayment.ref}
                    onChange={(e) => setEditingSupPayment({ ...editingSupPayment, ref: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">ملاحظات التعديل</label>
                  <input
                    type="text"
                    value={editingSupPayment.notes}
                    onChange={(e) => setEditingSupPayment({ ...editingSupPayment, notes: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2"
                  />
                </div>

                <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-blue-800 text-[10px]">
                  سيتم فور الحفظ إعادة احتساب:
                  <div className="font-mono mt-0.5">supplier_paid = SUM(supplier payments)</div>
                  <div className="font-mono">supplier_remaining = supplier_total - supplier_paid (بدون سالب)</div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button type="button" onClick={() => setIsEditSupPayOpen(false)} className="px-4 py-2 border rounded-xl font-bold">إلغاء</button>
                  <button type="submit" disabled={editPaymentLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2 rounded-xl">
                    {editPaymentLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "حفظ التعديلات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            WHATSAPP MESSAGING DISPATCH & PREVIEW MODAL
            ========================================================================= */}
        {isWhatsAppModalOpen && orderDetail && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#C89B3C] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    waActionType.startsWith('CUSTOMER') ? 'bg-[#25D366]/20 text-[#128C7E]' : 'bg-[#1F1714] text-[#C89B3C]'
                  }`}>
                    {waActionType.startsWith('CUSTOMER') ? (
                      <MessageCircle className="w-5 h-5 fill-current" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[#221B17]">
                      {waActionType === 'CUSTOMER_MESSAGE' && 'رسالة العميل - تأكيد الحجز المبدئي'}
                      {waActionType === 'SUPPLIER_MESSAGE' && 'رسالة المصنع - أمر التشغيل والتوريد'}
                      {waActionType === 'CUSTOMER_UPDATE' && 'إرسال تحديث للعميل (حالة / سداد دفعة)'}
                      {waActionType === 'SUPPLIER_UPDATE' && 'إرسال تحديث للمصنع (تشغيل / تحويل مالي)'}
                    </h3>
                    <p className="text-[11px] text-[#6B5E55]">
                      الطلب: <span className="font-mono font-bold text-[#8C6D28]">{orderDetail.order.orderNumber}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#6B5E55]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recipient Details & Rules Badge */}
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8DFD1] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B5E55] font-bold">المستلم:</span>
                  <span className="font-black text-[#221B17]">
                    {waActionType.startsWith('CUSTOMER')
                      ? `${orderDetail.customer?.fullName || 'العميل'} (${orderDetail.customer?.phone || ''})`
                      : 'مصنع التجهيزات المركزي (01284484868)'}
                  </span>
                </div>

                <div className="text-[11px] p-2 rounded-xl bg-white border border-[#E8DFD1]">
                  {waActionType.startsWith('CUSTOMER') ? (
                    <div className="text-emerald-800 flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>قاعدة الخصوصية: الرسالة لا تتضمن نهائياً أسعار المصنع أو حساباته أو هامش الربح.</span>
                    </div>
                  ) : (
                    <div className="text-amber-900 flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-[#C89B3C] shrink-0" />
                      <span>قاعدة السرية: الرسالة لا تتضمن نهائياً سعر الموزع للعميل أو مدفوعات العميل أو هامش الربح.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Update Reason for Update Messages */}
              {(waActionType === 'CUSTOMER_UPDATE' || waActionType === 'SUPPLIER_UPDATE') && (
                <div>
                  <label className="block font-bold text-xs text-[#221B17] mb-1">
                    سبب أو تفاصيل التحديث (اختياري سيظهر في نص الرسالة):
                  </label>
                  <input
                    type="text"
                    placeholder={
                      waActionType === 'CUSTOMER_UPDATE'
                        ? 'مثال: تم تأكيد سداد دفعة 3000 ج.م / تم تغيير وقت الاستلام'
                        : 'مثال: تم تحويل دفعة 2000 ج.م لحساب المصنع / تعديل كمية التشغيل'
                    }
                    value={waUpdateReason}
                    onChange={(e) => setWaUpdateReason(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#D6C7B7] rounded-xl p-2.5 text-xs text-[#221B17]"
                  />
                </div>
              )}

              {/* Message Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-xs text-[#221B17] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>معاينة نص الرسالة الصادرة:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const msg =
                        waActionType === 'CUSTOMER_MESSAGE'
                          ? orderDetail.whatsapp.customerMessage
                          : waActionType === 'SUPPLIER_MESSAGE'
                          ? orderDetail.whatsapp.supplierMessage
                          : waActionType === 'CUSTOMER_UPDATE'
                          ? (waUpdateReason ? `📢 تفاصيل التحديث: ${waUpdateReason}\n\n` : '') + (orderDetail.whatsapp.customerUpdateMessage || orderDetail.whatsapp.customerMessage)
                          : (waUpdateReason ? `📢 تفاصيل التحديث: ${waUpdateReason}\n\n` : '') + (orderDetail.whatsapp.supplierUpdateMessage || orderDetail.whatsapp.supplierMessage);
                      navigator.clipboard.writeText(msg);
                      setCopiedMessage(true);
                      setTimeout(() => setCopiedMessage(false), 2000);
                    }}
                    className="text-[11px] font-bold text-[#8C6D28] hover:text-[#5C1027] flex items-center gap-1 bg-[#FAF7F2] px-2 py-1 rounded-lg border border-[#E8DFD1]"
                  >
                    {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMessage ? 'تم النسخ!' : 'نسخ النص'}</span>
                  </button>
                </div>

                <div className="bg-[#FAF7F2] border border-[#E8DFD1] p-3 rounded-2xl max-h-48 overflow-y-auto text-xs whitespace-pre-wrap font-sans text-[#221B17] leading-relaxed shadow-inner">
                  {waActionType === 'CUSTOMER_MESSAGE' && orderDetail.whatsapp.customerMessage}
                  {waActionType === 'SUPPLIER_MESSAGE' && orderDetail.whatsapp.supplierMessage}
                  {waActionType === 'CUSTOMER_UPDATE' && (
                    <>
                      {waUpdateReason && (
                        <span className="font-bold text-[#128C7E] block mb-1">
                          📢 تفاصيل التحديث: {waUpdateReason}
                        </span>
                      )}
                      {orderDetail.whatsapp.customerUpdateMessage || orderDetail.whatsapp.customerMessage}
                    </>
                  )}
                  {waActionType === 'SUPPLIER_UPDATE' && (
                    <>
                      {waUpdateReason && (
                        <span className="font-bold text-[#8C6D28] block mb-1">
                          📢 تفاصيل التحديث: {waUpdateReason}
                        </span>
                      )}
                      {orderDetail.whatsapp.supplierUpdateMessage || orderDetail.whatsapp.supplierMessage}
                    </>
                  )}
                </div>
              </div>

              {/* Mode Clarification Notice */}
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  عند الضغط، يتم توثيق العملية فورياً في قاعدة البيانات وسجل التدقيق (Audit Log)، وتسجيل اسم المسؤول والوقت، وتوليد رابط واتساب الآمن (WhatsApp Deep Link) لتوجيهك فوراً للتطبيق لإرسال الرسالة.
                </p>
              </div>

              {/* Dispatch Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#E8DFD1]">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-4 py-2.5 border border-[#D6C7B7] rounded-xl text-xs font-bold text-[#6B5E55] hover:bg-[#FAF7F2]"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  disabled={waDispatchLoading}
                  onClick={handleDispatchWhatsApp}
                  className={`flex-1 ${
                    waActionType.startsWith('CUSTOMER')
                      ? 'bg-[#25D366] hover:bg-[#20ba59]'
                      : 'bg-[#1F1714] hover:bg-[#362720]'
                  } text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all`}
                >
                  {waDispatchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>تجهيز وتسجيل الرابط وفتح واتساب الآن 📲</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
