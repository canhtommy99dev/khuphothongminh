import React, { useState, useMemo, useEffect } from "react";
import { 
  ArrowLeft,
  Store, 
  MapPin, 
  Phone, 
  User, 
  Building, 
  Bed, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Maximize2, 
  Plus, 
  Download, 
  Printer, 
  Pencil, 
  Trash2, 
  Home, 
  Users, 
  Users2, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  History, 
  FileSpreadsheet, 
  UserCheck,
  Navigation
} from "lucide-react";
import { Business, InspectionLog, Resident, Household, TargetGisItem } from "../types";
import { getBusinessIndustryGroup, getSectorMeta } from "../components/business/businessConstants";
import { getTemporaryResidenceExpiryStatus, isResidentInAccommodation } from "../utils/householdRecognitionUtils";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { ViewingDocState } from "../components/business/BusinessDocumentModal";
import { supabase } from "../lib/supabase";

export interface BusinessDetailPageParams {
  id?: string;
  businessId?: string;
  [key: string]: string | undefined;
}

export interface BusinessDetailPageProps {
  /**
   * Route params object, e.g. { id: "CS-001" } or { businessId: "CS-001" }
   */
  params?: BusinessDetailPageParams;

  /**
   * Search / query params object or URLSearchParams
   */
  searchParams?: BusinessDetailPageParams | URLSearchParams;

  /**
   * Direct ID parameter
   */
  id?: string;

  /**
   * Direct businessId parameter
   */
  businessId?: string;

  /**
   * Direct business entity (optional if resolving via param)
   */
  business?: Business;

  /**
   * List of businesses to resolve by param id
   */
  businesses?: Business[];

  /**
   * Back navigation handler
   */
  onBack?: () => void;

  /**
   * Edit business handler
   */
  onEdit?: (b: Business) => void;

  /**
   * Delete business handler
   */
  onDelete?: (b: Business) => void;

  /**
   * Update status handler
   */
  onUpdateStatus?: (id: string, status: any) => void;

  /**
   * State updater for businesses
   */
  onUpdateBusinesses?: React.Dispatch<React.SetStateAction<Business[]>>;

  /**
   * List of residents
   */
  residents?: Resident[];

  /**
   * List of households
   */
  households?: Household[];

  /**
   * Document viewing handler
   */
  onViewDoc?: (doc: ViewingDocState) => void;

  /**
   * GIS map navigation handler
   */
  onNavigateToGis?: (item: TargetGisItem) => void;

  /**
   * Open add inspection modal
   */
  onOpenAddInspection?: () => void;

  /**
   * Open edit inspection modal
   */
  onOpenEditInspection?: (insp: InspectionLog) => void;

  /**
   * Delete inspection handler
   */
  onDeleteInspection?: (insp: InspectionLog) => void;

  /**
   * Open add change log modal
   */
  onOpenAddChangeLog?: () => void;

  /**
   * Export hostel residents to Excel
   */
  onExportHostelResidents?: (bus: Business, hostelResidents: Resident[]) => void;

  /**
   * Toast notification handler
   */
  showToast?: (msg: string, type: "success" | "info" | "error" | "warning") => void;

  /**
   * Function to get inspection logs
   */
  getBusinessInspections?: (b: Business) => InspectionLog[];

  /**
   * Function to check accommodation business
   */
  isAccommodationBusiness?: (b: Business) => boolean;
}

export default function BusinessDetailPage({
  params,
  searchParams,
  id,
  businessId,
  business: businessProp,
  businesses = [],
  onBack,
  onEdit,
  onDelete,
  onUpdateStatus,
  residents = [],
  households = [],
  onViewDoc,
  onNavigateToGis,
  onOpenAddInspection,
  onOpenEditInspection,
  onDeleteInspection,
  onOpenAddChangeLog,
  onExportHostelResidents,
  showToast,
  getBusinessInspections,
  isAccommodationBusiness
}: BusinessDetailPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // 1. Resolve ID parameter from props, params, searchParams, or browser URL
  const resolvedId = useMemo(() => {
    if (id) return id;
    if (businessId) return businessId;
    if (params?.id) return params.id;
    if (params?.businessId) return params.businessId;

    if (searchParams) {
      if (typeof searchParams === "object" && "get" in searchParams && typeof (searchParams as any).get === "function") {
        const queryVal = (searchParams as URLSearchParams).get("id") || (searchParams as URLSearchParams).get("businessId");
        if (queryVal) return queryVal;
      } else if (typeof searchParams === "object") {
        const queryVal = (searchParams as BusinessDetailPageParams).id || (searchParams as BusinessDetailPageParams).businessId;
        if (queryVal) return queryVal;
      }
    }

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get("id") || urlParams.get("businessId");
      if (qId) return qId;

      const pathSegments = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/");
      const bizIndex = pathSegments.indexOf("businesses");
      if (bizIndex !== -1 && pathSegments[bizIndex + 1]) {
        return pathSegments[bizIndex + 1];
      }
    }

    if (businessProp?.id) return businessProp.id;
    return null;
  }, [id, businessId, params, searchParams, businessProp]);

  // 2. Fetch or resolve business entity
  const [fetchedBusiness, setFetchedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);

  const business = useMemo(() => {
    if (businessProp && (!resolvedId || businessProp.id === resolvedId || businessProp.internalCode === resolvedId)) {
      return businessProp;
    }
    if (resolvedId && businesses && businesses.length > 0) {
      const match = businesses.find(b => b.id === resolvedId || b.internalCode === resolvedId);
      if (match) return match;
    }
    if (fetchedBusiness && (!resolvedId || fetchedBusiness.id === resolvedId || fetchedBusiness.internalCode === resolvedId)) {
      return fetchedBusiness;
    }
    if (businessProp) return businessProp;
    return null;
  }, [businessProp, resolvedId, businesses, fetchedBusiness]);

  useEffect(() => {
    if (!business && resolvedId) {
      setLoading(true);
      (async () => {
        try {
          const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .or(`id.eq.${resolvedId},internal_code.eq.${resolvedId}`)
            .maybeSingle();

          if (data && !error) {
            const row = data as any;
            const mapped: Business = {
              id: row.id,
              name: row.name,
              type: row.type || row.sector || "Thương mại & Dịch vụ",
              industryGroup: row.industry_group || row.sector || "Thương mại & Dịch vụ",
              owner: row.owner,
              address: row.address,
              phone: row.phone || "",
              licenseNumber: row.license_number || "",
              status: row.status || "Đang hoạt động",
              employeeCount: row.employee_count || 1,
              image: row.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500",
              coordinates: row.coordinates || (row.lat && row.lng ? `${row.lat}, ${row.lng}` : "10.7935, 106.7445"),
              safetyCertified: row.pccc_passed ?? true,
              internalCode: row.internal_code || `KP3-KD-${row.id.slice(0, 5)}`,
              soPhong: row.room_count,
              soTang: 1,
              soNguoiLuuTru: row.guest_count,
              dienTich: row.dien_tich || 100,
              loaiDat: row.loai_dat || "ODT",
              soThua: row.so_thua || "—",
              toBanDo: row.to_ban_do || "—",
            };
            setFetchedBusiness(mapped);
          }
        } catch (err) {
          console.error("Error fetching business by param id:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [business, resolvedId]);

  // Synchronize URL param in browser address bar
  useEffect(() => {
    if (typeof window !== "undefined" && business?.id) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("id") !== business.id) {
        url.searchParams.set("id", business.id);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [business?.id]);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("id") || url.searchParams.has("businessId")) {
        url.searchParams.delete("id");
        url.searchParams.delete("businessId");
        window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    }
  };

  // If loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ cơ sở kinh doanh theo mã param...</p>
      </div>
    );
  }

  // If not found
  if (!business) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-base font-bold text-foreground">Không tìm thấy cơ sở kinh doanh</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Không tìm thấy dữ liệu cơ sở kinh doanh {resolvedId ? (
            <>với mã định danh param: <strong className="font-mono text-foreground">{resolvedId}</strong></>
          ) : "tương ứng"}. Vui lòng kiểm tra lại đường dẫn hoặc quay về danh sách.
        </p>
        <Button
          type="button"
          onClick={handleBack}
          className="gap-2 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách</span>
        </Button>
      </div>
    );
  }

  const sectorGroup = getBusinessIndustryGroup(business);
  const sectorMeta = getSectorMeta(sectorGroup);
  const isAccom = isAccommodationBusiness ? isAccommodationBusiness(business) : Boolean(
    (business.soPhong && business.soPhong > 0) ||
    business.name?.toLowerCase().includes("nhà trọ") ||
    business.name?.toLowerCase().includes("nhà nghỉ") ||
    business.name?.toLowerCase().includes("homestay") ||
    business.sector?.toLowerCase().includes("lưu trú")
  );

  // Link household
  const getLinkedHousehold = (b: Business): Household | undefined => {
    if (b.linkedHouseholdCode) {
      const found = households.find(h => h.code.toLowerCase() === b.linkedHouseholdCode?.toLowerCase());
      if (found) return found;
    }
    if (b.address) {
      const found = households.find(h => b.address.toLowerCase().includes(h.address.toLowerCase()) || h.address.toLowerCase().includes(b.address.toLowerCase()));
      if (found) return found;
    }
    return undefined;
  };

  const getLinkedForeignResidents = (b: Business): Resident[] => {
    return (residents || []).filter(r => {
      const isForeign = r.nationality && r.nationality !== "Việt Nam";
      if (!isForeign) return false;
      if (r.workplace && b.name && r.workplace.toLowerCase().includes(b.name.toLowerCase())) return true;
      if (b.linkedHouseholdCode && r.householdId === b.linkedHouseholdCode) return true;
      return false;
    });
  };

  const stayingResidents = (residents || []).filter(r => isResidentInAccommodation(r, business));
  const actualCount = stayingResidents.length > 0 ? stayingResidents.length : (business.soNguoiLuuTru || 0);
  const inspections = getBusinessInspections ? getBusinessInspections(business) : (business.inspections || []);
  const linkedHh = getLinkedHousehold(business);

  const statusVariants: Record<string, "success" | "warning" | "destructive" | "default"> = {
    "Đang hoạt động": "success",
    "Tạm ngưng": "destructive",
    "Chờ duyệt": "warning",
    "Chuyển địa điểm": "default",
    "Chưa xác minh": "default"
  };

  return (
    <div id="business-detail-page" className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-3.5 px-4 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-1.5 font-medium cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </Button>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate font-medium">
            <span className="hover:text-foreground cursor-pointer" onClick={handleBack}>Cơ sở kinh doanh</span>
            <span>/</span>
            <span className="text-foreground font-semibold truncate">{business.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs cursor-pointer"
            title="In phiếu hồ sơ cơ sở"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">In phiếu</span>
          </Button>

          {onNavigateToGis && business.coordinates && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigateToGis({
                id: business.id,
                name: business.name,
                address: business.address,
                type: "business",
                coordinates: business.coordinates
              })}
              className="gap-1.5 text-xs cursor-pointer"
              title="Xem vị trí trên Bản đồ số GIS"
            >
              <Navigation size={13} className="text-primary" />
              <span className="hidden sm:inline">Bản đồ GIS</span>
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onEdit?.(business)}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Pencil size={13} />
            <span>Sửa hồ sơ</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete?.(business)}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Xóa</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 bg-card border-b border-border">
          <div className="flex flex-col md:flex-row items-start gap-5">
            {/* Avatar Photo */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-border shrink-0 shadow-xs group bg-muted">
              <img 
                src={business.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500"} 
                alt={business.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button 
                type="button"
                onClick={() => setViewingImage(business.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500")}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Xem ảnh lớn"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs font-semibold">
                  {business.licenseNumber || business.internalCode || "KP3-KD"}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs font-medium">
                  <span>{sectorMeta.icon}</span>
                  <span>{sectorMeta.name}</span>
                </Badge>
                <Badge variant={statusVariants[business.status] || "default"} className="gap-1.5 text-xs font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${business.status === "Đang hoạt động" ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-current"}`} />
                  <span>{business.status}</span>
                </Badge>
                {isAccom && (
                  <Badge variant="warning" className="gap-1 text-xs">
                    <Building size={12} /> Cơ sở lưu trú
                  </Badge>
                )}
                {business.safetyCertified && (
                  <Badge variant="success" className="gap-1 text-xs">
                    <ShieldCheck size={12} /> PCCC Đạt chuẩn
                  </Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                {business.name}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span className="truncate font-medium text-foreground" title={business.address}>
                    {business.address}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-muted-foreground shrink-0" />
                  <a href={`tel:${business.phone}`} className="font-mono text-foreground hover:text-primary transition-colors">
                    {business.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-muted-foreground shrink-0" />
                  <span>Chủ cơ sở: <strong className="text-foreground">{business.owner}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Quick-Switcher Bar */}
          <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">Chuyển trạng thái hoạt động:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(["Đang hoạt động", "Tạm ngưng", "Chờ duyệt"] as const).map((st) => (
                  <Button
                    key={st}
                    type="button"
                    size="xs"
                    variant={business.status === st ? "default" : "outline"}
                    onClick={() => onUpdateStatus(business.id, st)}
                    className="text-xs cursor-pointer"
                  >
                    {st}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Mã quản lý địa bàn: <strong className="font-mono text-foreground">{business.internalCode || `KP3-KD-${business.id.slice(0, 5)}`}</strong>
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-border bg-muted/20">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto h-10 bg-transparent p-0 gap-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-background data-[state=active]:border-border border border-transparent rounded-t-lg text-xs"
              >
                Tổng quan
              </TabsTrigger>
              <TabsTrigger 
                value="cadastral" 
                className="data-[state=active]:bg-background data-[state=active]:border-border border border-transparent rounded-t-lg text-xs"
              >
                Địa chính & Sổ đỏ
              </TabsTrigger>
              <TabsTrigger 
                value="accommodation" 
                className="data-[state=active]:bg-background data-[state=active]:border-border border border-transparent rounded-t-lg text-xs"
              >
                Lưu trú & Nhà trọ {isAccom && `(${actualCount})`}
              </TabsTrigger>
              <TabsTrigger 
                value="workers" 
                className="data-[state=active]:bg-background data-[state=active]:border-border border border-transparent rounded-t-lg text-xs"
              >
                Nhân sự ({business.employeeCount || 1})
              </TabsTrigger>
              <TabsTrigger 
                value="inspections" 
                className="data-[state=active]:bg-background data-[state=active]:border-border border border-transparent rounded-t-lg text-xs"
              >
                Kiểm tra ({inspections.length})
              </TabsTrigger>
              <TabsTrigger 
                value="changes" 
                className="data-[state=active]:bg-background data-[state=active]:border-border border border-transparent rounded-t-lg text-xs"
              >
                Biến động ({business.changeHistory?.length || 1})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 4. Tab Content Body */}
        <div className="p-5 sm:p-6 bg-card space-y-5">
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Store size={16} className="text-primary" />
                    Thông tin Pháp lý & Hoạt động
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Loại hình tổ chức</span>
                    <strong className="text-foreground text-xs block mt-0.5">{business.businessType || business.type}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Mã số thuế / Số GPKD</span>
                    <strong className="text-foreground font-mono text-xs block mt-0.5">{business.taxCode || business.licenseNumber}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Lĩnh vực hoạt động cụ thể</span>
                    <strong className="text-foreground text-xs block mt-0.5">{business.type}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Ngày bắt đầu hoạt động</span>
                    <strong className="text-foreground font-mono text-xs block mt-0.5">{business.startDate || "10/01/2021"}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border sm:col-span-2">
                    <span className="text-[10px] text-muted-foreground block font-medium">Nguồn xác minh dữ liệu</span>
                    <p className="text-foreground text-xs mt-0.5">
                      {business.verificationSource || "Khảo sát Tổ dân phố & Ban Điều hành Khu phố 3"} (phục vụ quản lý địa bàn hành chính tại chỗ)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Đại diện & Đầu mối */}
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck size={16} className="text-primary" />
                    Người đại diện & Đầu mối liên hệ địa phương
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Người đại diện / Chủ cơ sở</span>
                    <strong className="text-foreground text-xs block mt-0.5">{business.owner}</strong>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      SĐT: <strong className="font-mono text-foreground">{business.phone}</strong>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Người trực tiếp quản lý cơ sở tại chỗ</span>
                    <strong className="text-foreground text-xs block mt-0.5">{business.siteManager || business.owner}</strong>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      SĐT: <strong className="font-mono text-foreground">{business.siteManagerPhone || business.phone}</strong>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 sm:col-span-2">
                    <span className="text-xs font-semibold text-primary block mb-1">Đầu mối phối hợp khi KP3 tổ chức nhiệm vụ / tuyên truyền:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Họ và tên:</span>
                        <strong className="text-foreground">{business.focalPointName || business.owner}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">SĐT công vụ:</span>
                        <strong className="font-mono text-foreground">{business.focalPointPhone || business.phone}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Vai trò:</span>
                        <strong className="text-foreground">{business.focalPointRole || "Chủ cơ sở / Quản lý"}</strong>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liên kết Hộ dân KP3 */}
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Home size={16} className="text-primary" />
                      Liên kết Hộ dân Cư trú KP3
                    </CardTitle>
                    {linkedHh ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        MÃ HỘ: {linkedHh.code}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Chưa đối khớp mã hộ</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-xs">
                  {linkedHh ? (
                    <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="flex justify-between items-center">
                        <span>Chủ hộ: <strong className="text-foreground">{linkedHh.ownerName}</strong></span>
                        <Badge variant="secondary" className="text-[10px]">
                          {linkedHh.type || "Thường trú"} • {linkedHh.memberCount} nhân khẩu
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        Địa chỉ: <strong className="text-foreground">{linkedHh.address}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Cơ sở kinh doanh hoạt động tại địa điểm độc lập hoặc chưa liên kết sổ hộ khẩu.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: ĐỊA CHÍNH & SỔ ĐỎ */}
          {activeTab === "cadastral" && (
            <div className="space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-primary" />
                      Hồ sơ Địa chính & Thửa đất
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      GCN: {business.soGcn || "CH-098234"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Tờ bản đồ số</span>
                      <strong className="text-foreground font-mono text-sm block mt-0.5">Tờ {business.toBanDo || "272"}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Thửa đất số</span>
                      <strong className="text-foreground font-mono text-sm block mt-0.5">Thửa {business.soThua || "55"}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Diện tích khuôn viên</span>
                      <strong className="text-foreground text-sm block mt-0.5">{business.dienTich ? `${business.dienTich} m²` : "150 m²"}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Mục đích sử dụng</span>
                      <strong className="text-foreground text-sm block mt-0.5">{business.loaiDat || "ODT"}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Tệp hồ sơ Giấy chứng nhận QSDĐ (Sổ đỏ):</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {business.soDoFile ? `${business.soDoFile.name} (${business.soDoFile.size || "520 KB"})` : "Đã số hóa dữ liệu trích lục địa chính chuẩn xác"}
                      </p>
                    </div>
                    {business.soDoFile ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDoc({
                          title: "Giấy chứng nhận Quyền sử dụng đất (Sổ đỏ)",
                          businessName: business.name,
                          file: business.soDoFile!,
                          business: business
                        })}
                        className="gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText size={13} className="text-primary" />
                        <span>Xem Sổ đỏ</span>
                      </Button>
                    ) : (
                      <Badge variant="outline">Đã đồng bộ CSDL</Badge>
                    )}
                  </div>

                  {/* Coordinates & Navigation */}
                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block font-medium">Tọa độ định vị WGS-84</span>
                      <strong className="font-mono text-foreground text-xs">{business.coordinates || "10.7935, 106.7445"}</strong>
                    </div>
                    {business.coordinates && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.coordinates!)}`;
                          window.open(url, "_blank");
                        }}
                        className="gap-1.5 text-xs cursor-pointer shadow-2xs"
                      >
                        <MapPin size={13} className="text-primary" />
                        <span>Google Maps</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: LƯU TRÚ / KHÁCH TRỌ */}
          {activeTab === "accommodation" && (
            <div className="space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building size={16} className="text-amber-600" />
                        Cơ sở Lưu trú & Nhà trọ Cho thuê
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Thống kê quy mô phòng trọ và đối khớp cư dân tạm trú thực tế từ 11.632 nhân khẩu KP3
                      </p>
                    </div>
                    {stayingResidents.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onExportHostelResidents(business, stayingResidents)}
                        className="gap-1.5 text-xs cursor-pointer shadow-2xs"
                      >
                        <Download size={13} />
                        <span>Xuất Excel ({stayingResidents.length})</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Quy mô tầng</span>
                      <strong className="text-foreground text-sm block mt-0.5">{business.soTang || 3} tầng</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Tổng số phòng</span>
                      <strong className="text-foreground text-sm block mt-0.5">{business.soPhong || 12} phòng</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Khách lưu trú thực tế</span>
                      <strong className="text-emerald-600 text-sm block mt-0.5">{actualCount} người</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Giá thuê tham khảo</span>
                      <strong className="text-foreground text-xs block mt-0.5 truncate">{business.giaThueTrungBinh || "Thỏa thuận"}</strong>
                    </div>
                  </div>

                  {/* Residents Table */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted/40 border-b border-border flex justify-between items-center">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <Users size={14} className="text-primary" />
                        Danh sách Cư dân Lưu trú Thực tế ({stayingResidents.length})
                      </span>
                    </div>

                    {stayingResidents.length > 0 ? (
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-muted text-muted-foreground font-semibold sticky top-0 border-b border-border text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3">STT</th>
                              <th className="py-2.5 px-3">Họ và tên</th>
                              <th className="py-2.5 px-3">CCCD</th>
                              <th className="py-2.5 px-3">SĐT</th>
                              <th className="py-2.5 px-3">Quê quán (Thường trú gốc)</th>
                              <th className="py-2.5 px-3">Thời hạn tạm trú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-card">
                            {stayingResidents.map((res, idx) => {
                              const expStatus = getTemporaryResidenceExpiryStatus(res.temporaryExpDate);
                              return (
                                <tr key={res.id} className="hover:bg-muted/50 transition-colors">
                                  <td className="py-2.5 px-3 font-mono text-muted-foreground text-[10px]">{idx + 1}</td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-foreground text-xs">{res.fullName}</div>
                                    <div className="text-[10px] text-muted-foreground">({res.gender}, {res.birthDate})</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-medium">{res.cccd}</td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {res.phone ? (
                                      <a href={`tel:${res.phone}`} className="text-primary hover:underline flex items-center gap-0.5">
                                        <Phone size={10} /> {res.phone}
                                      </a>
                                    ) : "—"}
                                  </td>
                                  <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[180px]" title={res.permanentAddress || res.hometown || "—"}>
                                    {res.permanentAddress || res.hometown || "—"}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {expStatus.isWarning ? (
                                      <Badge variant="warning" className="gap-1 animate-pulse">
                                        <AlertTriangle size={10} /> {expStatus.label}
                                      </Badge>
                                    ) : expStatus.isExpired ? (
                                      <Badge variant="destructive" className="gap-1">
                                        <AlertCircle size={10} /> {expStatus.label}
                                      </Badge>
                                    ) : (
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        {res.temporaryExpDate ? expStatus.formattedDate : "Còn hạn"}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-xs text-muted-foreground">
                        Chưa phát hiện cư dân có địa chỉ đăng ký trùng khớp trong CSDL tạm trú.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: NHÂN SỰ & LAO ĐỘNG */}
          {activeTab === "workers" && (
            <div className="space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users2 size={16} className="text-primary" />
                      Quy mô & Cơ cấu Lao động
                    </CardTitle>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {business.employeeCount || 1} nhân sự
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Thường trú KP3</span>
                      <strong className="text-foreground text-lg font-bold block mt-0.5">
                        {business.localWorkersCount ?? Math.floor((business.employeeCount || 1) / 2)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">lao động</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Tạm trú tại chỗ</span>
                      <strong className="text-foreground text-lg font-bold block mt-0.5">
                        {business.temporaryWorkersCount ?? Math.ceil((business.employeeCount || 1) / 2)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">lao động</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Người nước ngoài</span>
                      <strong className={`text-lg font-bold block mt-0.5 ${
                        (business.foreignWorkersCount || (business.foreignWorkers?.length || 0)) > 0 
                          ? "text-destructive" 
                          : "text-muted-foreground"
                      }`}>
                        {business.foreignWorkersCount || (business.foreignWorkers?.length || 0)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">chuyên gia / LĐ</span>
                    </div>
                  </div>

                  {/* Foreign workers list */}
                  {(() => {
                    const linkedForeigners = business.foreignWorkers && business.foreignWorkers.length > 0 
                      ? business.foreignWorkers 
                      : getLinkedForeignResidents(business).map(r => ({
                          name: r.fullName,
                          nationality: r.nationality || "Nước ngoài",
                          passportOrCode: r.cccd,
                          position: r.occupation,
                          temporaryResidenceStatus: "Đã khai báo tạm trú" as const
                        }));

                    if (linkedForeigners.length > 0) {
                      return (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Globe size={14} className="text-primary" />
                            Danh sách Lao động / Chuyên gia Nước ngoài:
                          </span>
                          <div className="space-y-2">
                            {linkedForeigners.map((f, idx) => (
                              <div key={idx} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-2 text-xs">
                                <div>
                                  <strong className="text-foreground">{f.name}</strong>
                                  <span className="text-muted-foreground ml-1.5 font-medium">({f.nationality})</span>
                                  <div className="text-[10px] text-muted-foreground font-mono">
                                    Hộ chiếu: {f.passportOrCode} • Vị trí: <strong className="text-foreground">{f.position}</strong>
                                  </div>
                                </div>
                                <Badge variant="success" className="text-[10px]">
                                  ✓ {f.temporaryResidenceStatus}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="text-muted-foreground text-xs italic pt-1">
                        Cơ sở hiện không có lao động hoặc chuyên gia người nước ngoài.
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: PCCC & KIỂM TRA ĐỊNH KỲ */}
          {activeTab === "inspections" && (
            <div className="space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" />
                        An toàn PCCC & Lịch sử Kiểm tra Định kỳ
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Biên bản kiểm tra liên ngành, công an khu vực và an toàn phòng cháy chữa cháy
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onOpenAddInspection}
                      className="gap-1.5 text-xs cursor-pointer shadow-2xs"
                    >
                      <Plus size={14} />
                      <span>Thêm biên bản KT</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">Trạng thái an toàn PCCC cơ sở:</span>
                      {business.safetyCertified ? (
                        <Badge variant="success" className="gap-1 text-xs">
                          <ShieldCheck size={12} /> Đạt tiêu chuẩn an toàn PCCC
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <ShieldAlert size={12} /> Chưa đạt / Cần nhắc nhở kiểm tra
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Inspections list */}
                  <div className="space-y-2">
                    {inspections.length === 0 ? (
                      <div className="p-8 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                        Chưa có biên bản kiểm tra định kỳ nào được ghi nhận.
                      </div>
                    ) : (
                      inspections.map((insp) => (
                        <div key={insp.id} className="p-3.5 rounded-lg border border-border bg-card space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground text-xs">{insp.inspector}</span>
                            <div className="flex items-center gap-1.5">
                              <Badge 
                                variant={
                                  insp.result === "Đạt chuẩn" ? "success" :
                                  insp.result === "Cảnh cáo" ? "warning" : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {insp.result}
                              </Badge>
                              <span className="text-[10px] font-mono text-muted-foreground">{insp.date}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenEditInspection(insp)}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa biên bản"
                              >
                                <Pencil size={11} />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteInspection(insp)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="Xóa biên bản"
                              >
                                <Trash2 size={11} />
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground bg-muted/40 p-2.5 rounded text-[11px] leading-relaxed">{insp.note}</p>
                          {insp.recommendation && (
                            <div className="text-[11px] text-amber-800 bg-amber-500/10 p-2 rounded">
                              <strong>Yêu cầu khắc phục:</strong> {insp.recommendation}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 6: BIẾN ĐỘNG ĐỊA BÀN */}
          {activeTab === "changes" && (
            <div className="space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <History size={16} className="text-primary" />
                        Nhật ký Biến động Địa bàn ({business.changeHistory?.length || 1})
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Theo dõi lịch sử mở mới, chuyển địa điểm, thay đổi người đại diện hoặc ngành nghề
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onOpenAddChangeLog}
                      className="gap-1.5 text-xs cursor-pointer shadow-2xs"
                    >
                      <Plus size={14} />
                      <span>Ghi nhận biến động</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(business.changeHistory && business.changeHistory.length > 0 
                    ? business.changeHistory 
                    : [
                        {
                          id: `CHG-${business.id}-INIT`,
                          date: business.startDate || "12/03/2021",
                          type: "Mở mới" as const,
                          description: `Ghi nhận cơ sở bắt đầu hoạt động kinh doanh tại địa chỉ ${business.address}`,
                          recordedBy: "Bà Lê Thị Mai (Trưởng KP3)"
                        }
                      ]
                  ).map((chg) => (
                    <div key={chg.id} className="p-3.5 rounded-lg border border-border bg-card text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <Badge variant="outline" className="font-semibold">
                          {chg.type}
                        </Badge>
                        <span className="font-mono text-muted-foreground">{chg.date}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{chg.description}</p>
                      <span className="text-[10px] text-muted-foreground block pt-1">
                        Ghi nhận bởi: <strong>{chg.recordedBy}</strong>
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Lightbox photo viewer */}
      {viewingImage && (
        <div 
          onClick={() => setViewingImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={viewingImage} 
              alt="Enlarged preview" 
              className="max-h-[80vh] w-auto rounded-xl shadow-2xl object-contain border border-border"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setViewingImage(null)}
              className="mt-3 cursor-pointer"
            >
              Đóng ảnh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

