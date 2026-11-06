import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  UserCheck,
  Printer,
  Pencil,
  Trash2,
  Home,
  MapPin,
  Calendar,
  Phone,
  CreditCard,
  Building2,
  Globe,
  Briefcase,
  Heart,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Sparkles,
  ExternalLink,
  Navigation,
  FileText
} from "lucide-react";
import { Resident, Household, TargetGisItem } from "../types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { navigate, ROUTES } from "../routes";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getTemporaryResidenceExpiryStatus, parseAccommodationInfo } from "../utils/householdRecognitionUtils";
import { isForeignResident, getCountryFlag } from "./ResidentsPage";

export interface ResidentDetailPageParams {
  id?: string;
  residentId?: string;
  [key: string]: string | undefined;
}

export interface ResidentDetailPageProps {
  id?: string;
  residentId?: string;
  params?: ResidentDetailPageParams;
  searchParams?: ResidentDetailPageParams | URLSearchParams;
  resident?: Resident | null;
  residents?: Resident[];
  households?: Household[];
  onBack?: () => void;
  onEdit?: (res: Resident) => void;
  onDelete?: (res: Resident) => void;
  onNavigateToGis?: (item: TargetGisItem) => void;
  showToast?: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function ResidentDetailPage({
  id: idProp,
  residentId: residentIdProp,
  params,
  searchParams,
  resident: residentProp,
  residents = [],
  households = [],
  onBack,
  onEdit,
  onDelete,
  onNavigateToGis,
  showToast
}: ResidentDetailPageProps) {
  const [activeTab, setActiveTab] = useState("identity");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCT07Modal, setShowCT07Modal] = useState(false);

  // 1. Resolve ID parameter from props, params, searchParams, or browser URL
  const resolvedId = useMemo(() => {
    if (idProp) return idProp;
    if (residentIdProp) return residentIdProp;
    if (params?.id) return params.id;
    if (params?.residentId) return params.residentId;

    if (searchParams) {
      if (typeof searchParams === "object" && "get" in searchParams && typeof (searchParams as any).get === "function") {
        const queryVal = (searchParams as URLSearchParams).get("id") || (searchParams as URLSearchParams).get("residentId");
        if (queryVal) return queryVal;
      } else if (typeof searchParams === "object") {
        const queryVal = (searchParams as ResidentDetailPageParams).id || (searchParams as ResidentDetailPageParams).residentId;
        if (queryVal) return queryVal;
      }
    }

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get("id") || urlParams.get("residentId");
      if (qId) return qId;

      const pathSegments = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/");
      const resIndex = pathSegments.indexOf("residents");
      if (resIndex !== -1 && pathSegments[resIndex + 1]) {
        return decodeURIComponent(pathSegments[resIndex + 1]);
      }
      const detIndex = pathSegments.indexOf("resident_detail");
      if (detIndex !== -1 && pathSegments[detIndex + 1]) {
        return decodeURIComponent(pathSegments[detIndex + 1]);
      }
    }

    if (residentProp?.id) return residentProp.id;
    return null;
  }, [idProp, residentIdProp, params, searchParams, residentProp]);

  // 2. Fetch or resolve resident entity
  const [fetchedResident, setFetchedResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(false);

  const resident = useMemo(() => {
    if (residentProp && (!resolvedId || residentProp.id === resolvedId || residentProp.cccd === resolvedId)) {
      return residentProp;
    }
    if (resolvedId && residents && residents.length > 0) {
      const match = residents.find((r) => r.id === resolvedId || r.cccd === resolvedId);
      if (match) return match;
    }
    if (fetchedResident && (!resolvedId || fetchedResident.id === resolvedId || fetchedResident.cccd === resolvedId)) {
      return fetchedResident;
    }
    if (residentProp) return residentProp;
    return null;
  }, [residentProp, resolvedId, residents, fetchedResident]);

  useEffect(() => {
    if (!resident && resolvedId) {
      setLoading(true);
      (async () => {
        try {
          if (isSupabaseConfigured && supabase) {
            const { data, error } = await (supabase as any)
              .from("residents")
              .select("*")
              .or(`id.eq.${resolvedId},cccd.eq.${resolvedId}`)
              .maybeSingle();

            if (data && !error) {
              const mapped: Resident = {
                id: data.id,
                fullName: data.full_name || data.fullName,
                gender: data.gender || "Nam",
                birthDate: data.birth_date || data.birthDate || "",
                cccd: data.cccd || "",
                phone: data.phone || "",
                status: data.status || "Thường trú",
                occupation: data.occupation || "",
                address: data.address || "",
                householdId: data.household_id || data.householdId || "",
                relationToOwner: data.relation_to_owner || data.relationToOwner || "",
                ethnicity: data.ethnicity || "Kinh",
                religion: data.religion || "Không",
                nationality: data.nationality || "Việt Nam",
                hometown: data.hometown || "",
                permanentAddress: data.permanent_address || "",
                temporaryAddress: data.temporary_address || "",
                currentAddress: data.current_address || "",
                education: data.education || "",
                fatherName: data.father_name || "",
                motherName: data.mother_name || "",
                temporaryRegDate: data.temporary_reg_date || "",
                temporaryExpDate: data.temporary_exp_date || "",
                managementStatus: data.management_status || "Bình thường",
                maritalStatus: data.marital_status || "Đã kết hôn",
                workplace: data.workplace || "",
                idIssueDate: data.id_issue_date || "",
                idIssuePlace: data.id_issue_place || "",
                healthInsuranceNumber: data.health_insurance_number || "",
                militaryServiceStatus: data.military_service_status || "",
                policyGroup: data.policy_group || "Bình thường",
                emergencyContact: data.emergency_contact || "",
                notes: data.notes || ""
              };
              setFetchedResident(mapped);
            }
          }
        } catch (err) {
          console.warn("Fetch resident failed:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [resident, resolvedId]);

  const notify = (msg: string, type: "success" | "info" | "error" | "warning" = "info") => {
    if (showToast) {
      showToast(msg, type);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    notify(`Đã sao chép ${label}: ${text}`, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD_RESIDENTS);
    }
  };

  const handleGoEdit = () => {
    if (resident) {
      if (onEdit) {
        onEdit(resident);
      } else {
        navigate(`/edit_resident/${encodeURIComponent(resident.id)}`);
      }
    }
  };

  const handleGoGis = () => {
    if (!resident) return;
    const addressStr = resident.address || resident.currentAddress || "";
    if (onNavigateToGis) {
      onNavigateToGis({
        type: "custom",
        id: resident.id,
        name: resident.fullName,
        address: addressStr,
        coordinates: "10.7935, 106.7445",
        navigateRoute: true
      });
    } else {
      navigate(ROUTES.DASHBOARD_GIS);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ nhân khẩu...</p>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy thông tin cư dân</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Mã cư dân <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{resolvedId}</code> không tồn tại trên hệ thống hoặc đã được cập nhật sang mã mới.
        </p>
        <Button onClick={handleBack} variant="outline" size="sm" className="gap-2 cursor-pointer">
          <ArrowLeft size={14} />
          <span>Quay lại danh sách cư dân</span>
        </Button>
      </div>
    );
  }

  const isForeign = isForeignResident(resident);
  const expiry =
    resident.status === "Tạm trú" && resident.temporaryExpDate
      ? getTemporaryResidenceExpiryStatus(resident.temporaryExpDate)
      : null;
  const accommodation = parseAccommodationInfo(resident.address || resident.currentAddress || resident.notes);

  // Household members in same household
  const householdMembers = residents.filter(
    (r) => r.householdId && r.householdId === resident.householdId && r.id !== resident.id
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>Cán bộ KP3</span>
            <span>/</span>
            <button
              type="button"
              onClick={handleBack}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Cư dân & Nhân khẩu
            </button>
            <span>/</span>
            <span className="text-foreground font-semibold">Hồ sơ chi tiết</span>
            <Badge
              variant="outline"
              className="font-mono text-[10px] py-0 px-1.5 border-emerald-500/40 text-emerald-700 bg-emerald-50/50"
            >
              /resident_detail/{resident.id}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              title="Quay lại danh sách cư dân"
            >
              <ArrowLeft size={14} />
              <span>Quay lại</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className={`p-1.5 rounded-lg inline-flex ${isForeign ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                {isForeign ? <Globe size={20} /> : <UserCheck size={20} />}
              </span>
              Hồ Sơ: {resident.fullName}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Trang tra cứu thông tin định danh số, cây quan hệ hộ gia đình và quản lý thời hạn cư trú địa bàn KP3.
          </p>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGoGis}
            className="text-xs font-semibold gap-1.5 cursor-pointer text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            title="Định vị chỗ ở trên bản đồ số GIS"
          >
            <MapPin size={14} />
            <span>Bản đồ GIS</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCT07Modal(true)}
            className="text-xs font-semibold gap-1.5 cursor-pointer text-slate-800 hover:bg-slate-100 shadow-2xs"
            title="Xem và in biểu mẫu xác nhận cư trú CT-07 Bộ Công an"
          >
            <Printer size={14} />
            <span>In Mẫu CT-07</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGoEdit}
            className="text-xs font-bold gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            title="Chỉnh sửa hồ sơ cư dân này"
          >
            <Pencil size={14} />
            <span>Chỉnh Sửa Hồ Sơ</span>
          </Button>
        </div>
      </div>

      {/* Hero Profile Banner Card */}
      <Card className="border-border overflow-hidden rounded-2xl shadow-sm bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 text-white relative">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Initials with Gender/Foreigner Styling */}
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-3xl shrink-0 shadow-2xl border-2 ${
                resident.gender === "Nữ"
                  ? "bg-rose-500/20 text-rose-300 border-rose-400/40"
                  : isForeign
                  ? "bg-blue-500/20 text-blue-300 border-blue-400/40"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
              }`}
            >
              {isForeign ? getCountryFlag(resident.nationality) : resident.fullName?.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {resident.fullName}
                </h2>
                <Badge
                  variant={resident.status === "Thường trú" ? "success" : "info"}
                  className="text-xs font-semibold py-0.5 px-2.5"
                >
                  {resident.status}
                </Badge>
                {isForeign && (
                  <Badge variant="outline" className="text-xs border-blue-400/50 text-blue-300 bg-blue-500/10">
                    🌍 {resident.nationality || "Người nước ngoài"}
                  </Badge>
                )}
                {expiry && (
                  <Badge
                    variant={expiry.status === "expired" ? "destructive" : expiry.status === "expiring_soon" ? "warning" : "success"}
                    className="text-xs py-0.5 px-2.5"
                  >
                    {expiry.label}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white flex items-center gap-1.5">
                  <CreditCard size={12} className="text-slate-400" />
                  <span>{resident.cccd}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(resident.cccd, "CCCD")}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Sao chép số CCCD"
                  >
                    <Copy size={12} />
                  </button>
                </span>
                <span>•</span>
                <span>Sinh ngày: <strong className="text-white">{resident.birthDate}</strong></span>
                <span>•</span>
                <span>Giới tính: <strong className="text-white">{resident.gender}</strong></span>
                <span>•</span>
                <span>SĐT: <strong className="text-white font-mono">{resident.phone || "Chưa cập nhật"}</strong></span>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
                <MapPin size={13} className="text-emerald-400 shrink-0" />
                <span>{resident.address || "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"}</span>
              </p>
            </div>
          </div>

          {/* Quick Info Box in Banner */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0 space-y-2 text-xs w-full md:w-auto">
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Mã Cư Dân:</span>
              <span className="font-mono font-bold text-emerald-400">{resident.id}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Mã Sổ Hộ Khẩu:</span>
              <span className="font-mono font-bold text-white">{resident.householdId || "Chưa liên kết"}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Quan Hệ Với Chủ Hộ:</span>
              <span className="font-semibold text-white">{resident.relationToOwner || "Thành viên"}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tabs Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full justify-start overflow-x-auto gap-1">
          <TabsTrigger value="identity" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer gap-1.5">
            <UserCheck size={14} />
            <span>1. Định danh & Nhân khẩu học</span>
          </TabsTrigger>
          <TabsTrigger value="residence" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer gap-1.5">
            <Home size={14} />
            <span>2. Cư trú & Sổ Hộ Khẩu</span>
          </TabsTrigger>
          <TabsTrigger value="hostel" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer gap-1.5">
            <Clock size={14} />
            <span>3. Tạm trú & Cơ sở Lưu trú</span>
          </TabsTrigger>
          <TabsTrigger value="extra" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer gap-1.5">
            <Briefcase size={14} />
            <span>4. Đoàn thể & Y tế & Việc làm</span>
          </TabsTrigger>
          {isForeign && (
            <TabsTrigger value="foreigner" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer gap-1.5 text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Globe size={14} />
              <span>5. Người Nước Ngoài & Thị thực</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: IDENTITY */}
        <TabsContent value="identity" className="space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" />
                <span>Thông Tin Định Danh Cá Nhân (Bộ Công An Đề án 06)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Chi tiết dữ liệu căn cước công dân gắn chip hoặc hộ chiếu xuất nhập cảnh
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Số định danh cá nhân / CCCD</div>
                  <div className="text-sm font-bold font-mono text-slate-900 flex items-center justify-between">
                    <span>{resident.cccd}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(resident.cccd, "CCCD")}
                      className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Cấp ngày: {resident.idIssueDate || "15/05/2021"} • Nơi cấp: {resident.idIssuePlace || "Cục Cảnh sát QLHC về TTXH"}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Số điện thoại liên hệ</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {resident.phone && resident.phone !== "Chưa cập nhật" ? (
                      <a href={`tel:${resident.phone}`} className="text-emerald-700 hover:underline">
                        {resident.phone}
                      </a>
                    ) : (
                      "Chưa cập nhật"
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Dân tộc: <strong>{resident.ethnicity || "Kinh"}</strong> • Tôn giáo: <strong>{resident.religion || "Không"}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Quê quán gốc</div>
                  <div className="text-sm font-bold text-slate-900">{resident.hometown || "Chưa cập nhật"}</div>
                  <div className="text-slate-500 text-[11px]">Quốc tịch: {resident.nationality || "Việt Nam"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Trình độ học vấn & Nghề nghiệp</div>
                  <div className="text-sm font-bold text-slate-900">
                    {resident.education || "12/12"} • {resident.occupation || "Tự do"}
                  </div>
                  <div className="text-slate-500 text-[11px]">Nơi làm việc: {resident.workplace || "Chưa cập nhật"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Tình trạng hôn nhân</div>
                  <div className="text-sm font-bold text-slate-900">{resident.maritalStatus || "Đã kết hôn"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Mã số thẻ BHYT</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {resident.healthInsuranceNumber || "Chưa cập nhật"}
                  </div>
                  <div className="text-slate-500 text-[11px]">Nghĩa vụ quân sự: {resident.militaryServiceStatus || "Đã hoàn thành"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: RESIDENCE & HOUSEHOLD */}
        <TabsContent value="residence" className="space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Home size={18} className="text-emerald-600" />
                <span>Nơi Cư Trú & Hồ Sơ Sổ Hộ Khẩu Điện Tử</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Địa chỉ thực tế, nơi thường trú gốc và thành viên cùng hộ gia đình
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Chỗ ở hiện tại tại Khu phố 3</div>
                  <div className="text-sm font-bold text-slate-900">{resident.address}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Nơi thường trú gốc (ở quê quán theo CCCD)</div>
                  <div className="text-sm font-bold text-slate-900">
                    {resident.permanentAddress || resident.address}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Mã Sổ hộ khẩu điện tử</div>
                    <div className="text-sm font-bold font-mono text-emerald-800">
                      {resident.householdId || "Chưa liên kết"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Quan hệ với chủ hộ</div>
                    <div className="text-sm font-bold text-slate-900">
                      {resident.relationToOwner || "Thành viên"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Họ tên Cha</div>
                    <div className="text-sm font-bold text-slate-900 uppercase">{resident.fatherName || "Chưa cập nhật"}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Họ tên Mẹ</div>
                    <div className="text-sm font-bold text-slate-900 uppercase">{resident.motherName || "Chưa cập nhật"}</div>
                  </div>
                </div>
              </div>

              {/* Household Members list if present */}
              {householdMembers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="font-bold text-slate-800 text-xs mb-2 flex items-center justify-between">
                    <span>Thành viên cùng Sổ hộ khẩu ({resident.householdId}) ({householdMembers.length} người):</span>
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.DASHBOARD_HOUSEHOLDS)}
                      className="text-emerald-700 hover:underline text-[11px] font-semibold cursor-pointer"
                    >
                      Xem sổ hộ khẩu →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {householdMembers.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => navigate(`/resident_detail/${encodeURIComponent(m.id)}`)}
                        className="p-2.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-xl cursor-pointer transition-all hover:shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{m.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {m.relationToOwner} • {m.birthDate}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {m.gender}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: HOSTEL & TEMPORARY EXPIRY */}
        <TabsContent value="hostel" className="space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                <span>Thời Hạn Tạm Trú & Mạng Lưới Nhà Trọ KP3</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Thông tin cảnh báo hết hạn tạm trú và cơ sở kinh doanh phòng trọ
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Ngày đăng ký tạm trú</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {resident.temporaryRegDate || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Ngày hết hạn tạm trú</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {resident.temporaryExpDate || "Chưa cập nhật"}
                  </div>
                </div>
              </div>

              {/* Expiry Badge */}
              {resident.temporaryExpDate && (
                <div className="p-3.5 rounded-xl bg-slate-50 space-y-1.5">
                  <div className="text-slate-500 font-medium">Trạng thái thời hạn tạm trú (Công an Khu vực theo dõi):</div>
                  <div>
                    {(() => {
                      const exp = getTemporaryResidenceExpiryStatus(resident.temporaryExpDate);
                      if (exp.status === "expired") {
                        return (
                          <Badge variant="destructive" className="font-bold text-xs gap-1.5 py-1 px-3">
                            <AlertCircle className="w-4 h-4" />
                            <span>{exp.label}</span>
                          </Badge>
                        );
                      }
                      if (exp.status === "expiring_soon") {
                        return (
                          <Badge variant="warning" className="font-bold text-xs gap-1.5 py-1 px-3 animate-pulse">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{exp.label}</span>
                          </Badge>
                        );
                      }
                      return (
                        <Badge variant="success" className="font-bold text-xs gap-1.5 py-1 px-3">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{exp.label}</span>
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Accommodation info parsed */}
              <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/30 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Cơ sở Kinh doanh Nhà trọ / Nơi lưu trú</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Tên nhà trọ / Chủ trọ:</span>{" "}
                    <strong className="text-slate-900">{accommodation.hostelName || accommodation.owner || "Chưa cập nhật"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">SĐT Chủ nhà trọ:</span>{" "}
                    {accommodation.phone ? (
                      <a href={`tel:${accommodation.phone}`} className="text-emerald-700 font-mono font-bold hover:underline">
                        {accommodation.phone}
                      </a>
                    ) : (
                      <span className="text-slate-500">Chưa có</span>
                    )}
                  </div>
                </div>
                {resident.notes && (
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <span className="font-semibold">Ghi chú lưu trú:</span> {resident.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: SOCIAL, CAREER & HEALTH */}
        <TabsContent value="extra" className="space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase size={18} className="text-emerald-600" />
                <span>Nghề Nghiệp, Y Tế & Chính Sách An Sinh Xã Hội</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Nghề nghiệp</div>
                  <div className="text-sm font-bold text-slate-900">{resident.occupation || "Tự do"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Nơi làm việc / Cơ quan</div>
                  <div className="text-sm font-bold text-slate-900">{resident.workplace || "Chưa cập nhật"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Mã số BHYT</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{resident.healthInsuranceNumber || "Chưa cập nhật"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Trình độ học vấn</div>
                  <div className="text-sm font-bold text-slate-900">{resident.education || "12/12"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Diện chính sách / Đoàn thể</div>
                  <div className="text-sm font-bold text-slate-900">{resident.policyGroup || "Bình thường"}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 font-medium">Liên hệ khẩn cấp</div>
                  <div className="text-sm font-bold text-slate-900">{resident.emergencyContact || "Chưa cập nhật"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: FOREIGNER DETAILS */}
        {isForeign && (
          <TabsContent value="foreigner" className="space-y-4">
            <Card className="border-blue-200 bg-blue-50/20 shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-blue-100 bg-blue-50/60">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe size={18} className="text-blue-700" />
                  <span>Hồ Sơ Cư Trú Người Nước Ngoài (Cục Quản Lý Xuất Nhập Cảnh)</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-white rounded-xl space-y-1 border border-blue-100">
                    <div className="text-slate-500 font-medium">Số Hộ chiếu (Passport No.)</div>
                    <div className="text-sm font-bold font-mono text-blue-900 uppercase">
                      {resident.passportNumber || resident.cccd}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hết hạn: {resident.passportExpiryDate || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl space-y-1 border border-blue-100">
                    <div className="text-slate-500 font-medium">Loại thị thực / Thẻ cư trú</div>
                    <div className="text-sm font-bold text-slate-900">{resident.visaOrCardType || "Thẻ tạm trú (TRC)"}</div>
                    <div className="text-[11px] text-slate-500">
                      Số thẻ: {resident.visaOrCardNumber || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl space-y-1 border border-blue-100">
                    <div className="text-slate-500 font-medium">Thời hạn cư trú</div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {resident.visaValidFrom || "01/01/2024"} → {resident.visaValidUntil || "01/01/2026"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl space-y-1 border border-blue-100">
                    <div className="text-slate-500 font-medium">Mã khai báo tạm trú CA Phường</div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {resident.temporaryRegistrationCode || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl space-y-1 border border-blue-100">
                    <div className="text-slate-500 font-medium">Số Giấy phép lao động (GPLĐ)</div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {resident.workPermitNumber || "Chưa cập nhật"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl space-y-1 border border-blue-100">
                    <div className="text-slate-500 font-medium">Cơ quan / Doanh nghiệp bảo lãnh</div>
                    <div className="text-sm font-bold text-slate-900">
                      {resident.sponsoringOrganization || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* DIALOG: CT-07 POLICE CONFIRMATION SHEET */}
      <Dialog open={showCT07Modal} onOpenChange={setShowCT07Modal}>
        <DialogContent className="max-w-2xl mx-auto max-h-[92vh] overflow-y-auto p-0 rounded-2xl" onClose={() => setShowCT07Modal(false)}>
          <div>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">Giấy Xác Nhận Thông Tin Về Cư Trú (Mẫu CT-07)</span>
              </div>
            </div>

            <div id="ct07-print-sheet" className="p-8 space-y-5 text-slate-900 font-serif leading-relaxed bg-white">
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </h4>
                <p className="text-[11px] font-semibold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-24 h-0.5 bg-slate-400 mx-auto mt-1" />
                <div className="pt-2 text-[10px] text-slate-500 font-sans">
                  Mẫu CT07 ban hành kèm theo Thông tư số 56/2021/TT-BCA ngày 15/5/2021 của Bộ Công an
                </div>
              </div>

              <div className="text-center pt-2">
                <h3 className="text-base font-bold uppercase tracking-wide text-slate-900">
                  XÁC NHẬN THÔNG TIN VỀ CƯ TRÚ
                </h3>
                <p className="text-[11px] italic text-slate-600">
                  Kính gửi: Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <strong>1. Họ và tên:</strong> <span className="uppercase font-bold">{resident.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>2. Ngày, tháng, năm sinh:</strong> {resident.birthDate}
                  </div>
                  <div>
                    <strong>3. Giới tính:</strong> {resident.gender}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>4. Số định danh cá nhân / CCCD:</strong>{" "}
                    <span className="font-mono font-bold">{resident.cccd}</span>
                  </div>
                  <div>
                    <strong>5. Dân tộc:</strong> {resident.ethnicity || "Kinh"}
                  </div>
                </div>
                <div>
                  <strong>6. Nơi thường trú gốc:</strong> {resident.permanentAddress || resident.address}
                </div>
                <div>
                  <strong>7. Nơi ở hiện tại tại KP3:</strong> {resident.address}
                </div>
                <div>
                  <strong>8. Diện cư trú được xác nhận:</strong>{" "}
                  <span className="font-bold">{resident.status}</span> (Mã hộ: {resident.householdId || "HK-001"})
                </div>
                {resident.temporaryExpDate && (
                  <div>
                    <strong>9. Thời hạn tạm trú:</strong> Đến ngày {resident.temporaryExpDate}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700">NGƯỜI LẬP PHIẾU</p>
                  <p className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900">Ban Điều Hành KP3</p>
                </div>
                <div className="space-y-1">
                  <p className="italic text-slate-600 text-[11px]">
                    An Phú, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                  <p className="font-bold text-slate-800">TRƯỞNG CÔNG AN PHƯỜNG AN PHÚ</p>
                  <p className="text-[10px] italic text-slate-500">(Ký, đóng dấu xác nhận)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900">Đại úy Trần Quốc Hải</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setShowCT07Modal(false)} className="cursor-pointer">
                Đóng
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>In Bản Cứng CT-07</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
