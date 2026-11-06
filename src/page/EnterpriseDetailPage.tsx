import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  Users2,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Pencil,
  Trash2,
  Home,
  Globe,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  History,
  Copy,
  ExternalLink,
  Navigation,
  Compass,
  Check,
  Plus,
  Camera,
  ImageIcon,
  Maximize2,
  HelpCircle,
  Share2,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import {
  Business,
  BusinessChangeLog,
  Resident,
  Household,
  ForeignWorker,
  TargetGisItem
} from "../types";
import {
  KP3_CENTER,
  decimalToDMS,
  parseCoordinates as parseGisCoords,
  getGoogleMapsDirectionUrl
} from "../utils/gisUtils";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Separator } from "../components/ui/separator";
import { navigate, ROUTES } from "../routes";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { isEnterpriseEntity, getEnterpriseScaleLabel } from "../components/EnterpriseManagement";

export interface EnterpriseDetailPageParams {
  id?: string;
  enterpriseId?: string;
  [key: string]: string | undefined;
}

export interface EnterpriseDetailPageProps {
  /**
   * Tham số ID truyền trực tiếp hoặc qua Route params
   */
  id?: string;
  enterpriseId?: string;
  params?: EnterpriseDetailPageParams;
  searchParams?: EnterpriseDetailPageParams | URLSearchParams;

  /**
   * Đối tượng Doanh nghiệp truyền trực tiếp (nếu có sẵn)
   */
  enterprise?: Business | null;

  /**
   * Danh mục doanh nghiệp trong bộ nhớ ứng dụng
   */
  businesses?: Business[];

  /**
   * Danh sách cư dân & hộ gia đình phục vụ đối chiếu
   */
  residents?: Resident[];
  households?: Household[];

  /**
   * Callback điều hướng quay lại
   */
  onBack?: () => void;

  /**
   * Callback chỉnh sửa & xóa
   */
  onEdit?: (ent: Business) => void;
  onDelete?: (ent: Business) => void;

  /**
   * Callback cập nhật trạng thái hoạt động & danh sách
   */
  onUpdateStatus?: (id: string, status: any) => void;
  onUpdateBusinesses?: React.Dispatch<React.SetStateAction<Business[]>> | ((businesses: Business[]) => void);

  /**
   * Dẫn đường bản đồ GIS
   */
  onNavigateToGis?: (item: TargetGisItem) => void;

  /**
   * Toast thông báo hệ thống
   */
  showToast?: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function EnterpriseDetailPage({
  id: idProp,
  enterpriseId: enterpriseIdProp,
  params,
  searchParams,
  enterprise: enterpriseProp,
  businesses = [],
  residents = [],
  households = [],
  onBack,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateBusinesses,
  onNavigateToGis,
  showToast: showToastProp
}: EnterpriseDetailPageProps) {
  // Toast fallback
  const showToast = (msg: string, type: "success" | "info" | "error" | "warning" = "info") => {
    if (showToastProp) {
      showToastProp(msg, type);
    } else {
      console.log(`[Toast ${type.toUpperCase()}]: ${msg}`);
    }
  };

  // 1. Phân giải ID doanh nghiệp từ Props, Params, SearchParams hoặc window.location
  const resolvedId = useMemo(() => {
    if (idProp) return idProp;
    if (enterpriseIdProp) return enterpriseIdProp;
    if (params?.id) return params.id;
    if (params?.enterpriseId) return params.enterpriseId;

    if (searchParams) {
      if (typeof searchParams === "object" && "get" in searchParams && typeof (searchParams as any).get === "function") {
        const queryVal = (searchParams as URLSearchParams).get("id") || (searchParams as URLSearchParams).get("enterpriseId");
        if (queryVal) return queryVal;
      } else if (typeof searchParams === "object") {
        const queryVal = (searchParams as EnterpriseDetailPageParams).id || (searchParams as EnterpriseDetailPageParams).enterpriseId;
        if (queryVal) return queryVal;
      }
    }

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get("id") || urlParams.get("enterpriseId");
      if (qId) return qId;

      const pathSegments = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/");
      const entIndex = pathSegments.indexOf("enterprises");
      if (entIndex !== -1 && pathSegments[entIndex + 1]) {
        return decodeURIComponent(pathSegments[entIndex + 1]);
      }
      const detIndex = pathSegments.indexOf("enterprise_detail");
      if (detIndex !== -1 && pathSegments[detIndex + 1]) {
        return decodeURIComponent(pathSegments[detIndex + 1]);
      }
    }

    if (enterpriseProp?.id) return enterpriseProp.id;
    return null;
  }, [idProp, enterpriseIdProp, params, searchParams, enterpriseProp]);

  // 2. Fetch hoặc đối chiếu đối tượng Doanh nghiệp
  const [fetchedEnterprise, setFetchedEnterprise] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);

  const enterprise = useMemo(() => {
    if (enterpriseProp && (!resolvedId || enterpriseProp.id === resolvedId || enterpriseProp.taxCode === resolvedId)) {
      return enterpriseProp;
    }
    if (fetchedEnterprise && (!resolvedId || fetchedEnterprise.id === resolvedId || fetchedEnterprise.taxCode === resolvedId)) {
      return fetchedEnterprise;
    }
    if (resolvedId && businesses.length > 0) {
      const matched = businesses.find(
        (b) =>
          String(b.id) === String(resolvedId) ||
          b.taxCode === resolvedId ||
          b.internalCode === resolvedId ||
          b.licenseNumber === resolvedId
      );
      if (matched) return matched;
    }
    return enterpriseProp || fetchedEnterprise || null;
  }, [enterpriseProp, fetchedEnterprise, resolvedId, businesses]);

  // Tải từ Supabase nếu chưa có trong bộ nhớ
  useEffect(() => {
    if (!enterprise && resolvedId && isSupabaseConfigured) {
      let isMounted = true;
      setLoading(true);

      const fetchDb = async () => {
        try {
          const { data, error } = await (supabase.from("businesses") as any)
            .select("*")
            .or(`id.eq.${resolvedId},tax_code.eq.${resolvedId},internal_code.eq.${resolvedId}`)
            .maybeSingle();

          if (error) {
            console.error("Lỗi khi tải hồ sơ doanh nghiệp:", error);
          } else if (data && isMounted) {
            const raw = data as any;
            const mapped: Business = {
              id: String(raw.id),
              name: raw.name || "Doanh nghiệp chưa đặt tên",
              type: raw.type || "Thương mại dịch vụ",
              address: raw.address || "Khu phố 3, Phường An Phú",
              owner: raw.owner || "Chưa cập nhật",
              phone: raw.phone || "",
              status: raw.status || "Đang hoạt động",
              licenseNumber: raw.license_number || "",
              taxCode: raw.tax_code || "",
              coordinates: raw.coordinates || "10.7935,106.7445",
              employeeCount: raw.employee_count || 5,
              safetyCertified: raw.safety_certified ?? true,
              pcccPassed: raw.pccc_passed ?? true,
              isAccommodation: raw.is_accommodation ?? false,
              soPhong: raw.room_count ?? 0,
              soNguoiLuuTru: raw.guest_count ?? 0,
              enterpriseScale: raw.scale,
              hasCamKetAnNinh: raw.has_cam_ket_an_ninh ?? true,
              legalRepresentative: raw.legal_representative || raw.owner,
              legalRepPhone: raw.legal_rep_phone || raw.phone,
              legalRepEmail: raw.legal_rep_email || "",
              businessType: raw.business_type || "Công ty TNHH",
              localWorkersCount: raw.local_workers_count,
              temporaryWorkersCount: raw.temporary_workers_count,
              foreignWorkersCount: raw.foreign_workers_count,
              siteManager: raw.site_manager || raw.owner,
              siteManagerPhone: raw.site_manager_phone || raw.phone,
              focalPointName: raw.focal_point_name || raw.owner,
              focalPointPhone: raw.focal_point_phone || raw.phone,
              focalPointRole: raw.focal_point_role || "Đại diện phối hợp",
              premisesType: raw.premises_type || "Văn phòng",
              premisesOwner: raw.premises_owner || "",
              premisesOwnerPhone: raw.premises_owner_phone || "",
              linkedHouseholdCode: raw.linked_household_code || "",
              startDate: raw.start_date || "01/01/2024",
              internalCode: raw.internal_code || `DN-KP3-${raw.id}`,
              streetArea: raw.street_area || "Mặt tiền Lương Định Của",
              image: raw.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
              images: raw.images || [],
              changeHistory: raw.change_history || [],
              foreignWorkers: raw.foreign_workers || [],
              supportNeeds: raw.support_needs || [],
              supportNotes: raw.support_notes || ""
            };
            setFetchedEnterprise(mapped);
          }
        } catch (err) {
          console.error("Lỗi kết nối Supabase:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchDb();

      return () => {
        isMounted = false;
      };
    }
  }, [enterprise, resolvedId]);

  // Tab con trong trang chi tiết
  const [activeTab, setActiveTab] = useState<"overview" | "labor" | "compliance" | "changes" | "support" | "gallery">("overview");

  // Copy helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Đã sao chép ${fieldName}: ${text}`, "success");
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Quay lại danh mục
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD_ENTERPRISES);
    }
  };

  // In hồ sơ
  const handlePrint = () => {
    window.print();
  };

  // Dẫn đường GIS
  const handleDirections = (ent: Business) => {
    if (onNavigateToGis) {
      onNavigateToGis({
        id: ent.id,
        name: ent.name,
        address: ent.address,
        coordinates: ent.coordinates || "10.7935,106.7445",
        type: "business",
        navigateRoute: true
      });
      showToast(`Đã mở vị trí ${ent.name} trên bản đồ GIS KP3!`, "info");
    } else {
      const coords = parseGisCoords(ent.coordinates) || KP3_CENTER;
      const gmapsUrl = getGoogleMapsDirectionUrl(coords.lat, coords.lng, ent.address);
      window.open(gmapsUrl, "_blank");
    }
  };

  // Modal Sửa hồ sơ
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInternalCode, setEditInternalCode] = useState("");
  const [editTaxCode, setEditTaxCode] = useState("");
  const [editBusinessType, setEditBusinessType] = useState("Công ty TNHH");
  const [editEnterpriseScale, setEditEnterpriseScale] = useState<any>("Siêu nhỏ (< 5 LĐ)");
  const [editType, setEditType] = useState("Thương mại dịch vụ");
  const [editStartDate, setEditStartDate] = useState("01/01/2024");
  const [editAddress, setEditAddress] = useState("");
  const [editStreetArea, setEditStreetArea] = useState("Mặt tiền Lương Định Của");
  const [editPremisesType, setEditPremisesType] = useState("Văn phòng");
  const [editPremisesOwner, setEditPremisesOwner] = useState("");
  const [editPremisesOwnerPhone, setEditPremisesOwnerPhone] = useState("");
  const [editLinkedHouseholdCode, setEditLinkedHouseholdCode] = useState("");
  const [editLegalRep, setEditLegalRep] = useState("");
  const [editLegalRepPhone, setEditLegalRepPhone] = useState("");
  const [editLegalRepEmail, setEditLegalRepEmail] = useState("");
  const [editSiteManager, setEditSiteManager] = useState("");
  const [editSiteManagerPhone, setEditSiteManagerPhone] = useState("");
  const [editFocalPointName, setEditFocalPointName] = useState("");
  const [editFocalPointPhone, setEditFocalPointPhone] = useState("");
  const [editFocalPointRole, setEditFocalPointRole] = useState("Đại diện phối hợp");
  const [editEmployeeCount, setEditEmployeeCount] = useState(5);
  const [editLocalWorkers, setEditLocalWorkers] = useState(2);
  const [editTemporaryWorkers, setEditTemporaryWorkers] = useState(3);
  const [editForeignWorkers, setEditForeignWorkers] = useState(0);
  const [editSupportNotes, setEditSupportNotes] = useState("");
  const [editSupportNeeds, setEditSupportNeeds] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<Business["status"]>("Đang hoạt động");
  const [editPcccPassed, setEditPcccPassed] = useState(true);
  const [editHasCamKet, setEditHasCamKet] = useState(true);

  // Mở modal Sửa
  const handleOpenEditModal = () => {
    if (!enterprise) return;
    setEditName(enterprise.name);
    setEditInternalCode(enterprise.internalCode || `DN-KP3-${enterprise.id}`);
    setEditTaxCode(enterprise.taxCode || "");
    setEditBusinessType(enterprise.businessType || "Công ty TNHH");
    setEditEnterpriseScale(getEnterpriseScaleLabel(enterprise));
    setEditType(enterprise.type || "Thương mại dịch vụ");
    setEditStartDate(enterprise.startDate || "01/01/2024");
    setEditAddress(enterprise.address);
    setEditStreetArea(enterprise.streetArea || "Mặt tiền Lương Định Của");
    setEditPremisesType(enterprise.premisesType || "Văn phòng");
    setEditPremisesOwner(enterprise.premisesOwner || "");
    setEditPremisesOwnerPhone(enterprise.premisesOwnerPhone || "");
    setEditLinkedHouseholdCode(enterprise.linkedHouseholdCode || "");
    setEditLegalRep(enterprise.legalRepresentative || enterprise.owner);
    setEditLegalRepPhone(enterprise.legalRepPhone || enterprise.phone);
    setEditLegalRepEmail(enterprise.legalRepEmail || "");
    setEditSiteManager(enterprise.siteManager || enterprise.owner);
    setEditSiteManagerPhone(enterprise.siteManagerPhone || enterprise.phone);
    setEditFocalPointName(enterprise.focalPointName || enterprise.owner);
    setEditFocalPointPhone(enterprise.focalPointPhone || enterprise.phone);
    setEditFocalPointRole(enterprise.focalPointRole || "Đại diện phối hợp");
    setEditEmployeeCount(enterprise.employeeCount || 5);
    setEditLocalWorkers(enterprise.localWorkersCount ?? Math.floor((enterprise.employeeCount || 5) / 2));
    setEditTemporaryWorkers(enterprise.temporaryWorkersCount ?? Math.ceil((enterprise.employeeCount || 5) / 2));
    setEditForeignWorkers(enterprise.foreignWorkersCount || (enterprise.foreignWorkers?.length || 0));
    setEditSupportNotes(enterprise.supportNotes || "");
    setEditSupportNeeds(enterprise.supportNeeds || []);
    setEditStatus(enterprise.status);
    setEditPcccPassed(enterprise.pcccPassed ?? true);
    setEditHasCamKet(enterprise.hasCamKetAnNinh ?? true);
    setShowEditModal(true);
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = async () => {
    if (!enterprise) return;
    if (!editName.trim()) {
      showToast("Vui lòng nhập tên công ty / doanh nghiệp!", "warning");
      return;
    }

    const updated: Business = {
      ...enterprise,
      name: editName.trim(),
      internalCode: editInternalCode.trim() || `DN-KP3-${enterprise.id}`,
      taxCode: editTaxCode.trim(),
      businessType: editBusinessType as any,
      enterpriseScale: editEnterpriseScale,
      type: editType.trim(),
      startDate: editStartDate,
      address: editAddress.trim(),
      streetArea: editStreetArea,
      premisesType: editPremisesType as any,
      premisesOwner: editPremisesOwner.trim(),
      premisesOwnerPhone: editPremisesOwnerPhone.trim(),
      linkedHouseholdCode: editLinkedHouseholdCode.trim(),
      legalRepresentative: editLegalRep.trim(),
      legalRepPhone: editLegalRepPhone.trim(),
      legalRepEmail: editLegalRepEmail.trim(),
      siteManager: editSiteManager.trim(),
      siteManagerPhone: editSiteManagerPhone.trim(),
      focalPointName: editFocalPointName.trim(),
      focalPointPhone: editFocalPointPhone.trim(),
      focalPointRole: editFocalPointRole.trim(),
      employeeCount: Number(editEmployeeCount) || 0,
      localWorkersCount: Number(editLocalWorkers) || 0,
      temporaryWorkersCount: Number(editTemporaryWorkers) || 0,
      foreignWorkersCount: Number(editForeignWorkers) || 0,
      supportNotes: editSupportNotes.trim(),
      supportNeeds: editSupportNeeds,
      status: editStatus,
      pcccPassed: editPcccPassed,
      hasCamKetAnNinh: editHasCamKet
    };

    setFetchedEnterprise(updated);

    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)((prev: Business[]) => {
          if (!Array.isArray(prev)) return [updated];
          return prev.map((b) => (b.id === updated.id ? updated : b));
        });
      }
    }

    // Đồng bộ Supabase
    if (isSupabaseConfigured) {
      try {
        await (supabase.from("businesses") as any)
          .update({
            name: updated.name,
            internal_code: updated.internalCode,
            tax_code: updated.taxCode,
            business_type: updated.businessType,
            scale: updated.enterpriseScale,
            type: updated.type,
            start_date: updated.startDate,
            address: updated.address,
            street_area: updated.streetArea,
            premises_type: updated.premisesType,
            premises_owner: updated.premisesOwner,
            premises_owner_phone: updated.premisesOwnerPhone,
            linked_household_code: updated.linkedHouseholdCode,
            legal_representative: updated.legalRepresentative,
            legal_rep_phone: updated.legalRepPhone,
            legal_rep_email: updated.legalRepEmail,
            site_manager: updated.siteManager,
            site_manager_phone: updated.siteManagerPhone,
            focal_point_name: updated.focalPointName,
            focal_point_phone: updated.focalPointPhone,
            focal_point_role: updated.focalPointRole,
            employee_count: updated.employeeCount,
            local_workers_count: updated.localWorkersCount,
            temporary_workers_count: updated.temporaryWorkersCount,
            foreign_workers_count: updated.foreignWorkersCount,
            support_notes: updated.supportNotes,
            support_needs: updated.supportNeeds,
            status: updated.status,
            pccc_passed: updated.pcccPassed,
            has_cam_ket_an_ninh: updated.hasCamKetAnNinh
          })
          .eq("id", updated.id);
      } catch (err) {
        console.error("Lỗi cập nhật CSDL Supabase:", err);
      }
    }

    setShowEditModal(false);
    showToast(`Đã cập nhật thành công hồ sơ ${updated.name}!`, "success");
  };

  // Modal Ghi nhận biến động
  const [showChangeLogModal, setShowChangeLogModal] = useState(false);
  const [changeType, setChangeType] = useState<BusinessChangeLog["type"]>("Thay đổi ngành nghề");
  const [changeDate, setChangeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [changeDesc, setChangeDesc] = useState("");
  const [changeRecordedBy, setChangeRecordedBy] = useState("Tổ công tác KP3");

  const handleSaveChangeLog = async () => {
    if (!enterprise) return;
    if (!changeDesc.trim()) {
      showToast("Vui lòng nhập nội dung biến động!", "warning");
      return;
    }

    const newLog: BusinessChangeLog = {
      id: `CHG-${Date.now()}`,
      date: changeDate,
      type: changeType,
      description: changeDesc.trim(),
      recordedBy: changeRecordedBy.trim() || "Cán bộ phụ trách kinh tế KP3"
    };

    const updatedLogs = [newLog, ...(enterprise.changeHistory || [])];
    const updated: Business = {
      ...enterprise,
      changeHistory: updatedLogs
    };

    setFetchedEnterprise(updated);

    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)((prev: Business[]) => {
          if (!Array.isArray(prev)) return [updated];
          return prev.map((b) => (b.id === updated.id ? updated : b));
        });
      }
    }

    if (isSupabaseConfigured) {
      try {
        await (supabase.from("businesses") as any)
          .update({
            change_history: updatedLogs
          })
          .eq("id", updated.id);
      } catch (err) {
        console.error("Lỗi lưu nhật ký biến động:", err);
      }
    }

    setShowChangeLogModal(false);
    setChangeDesc("");
    showToast("Đã ghi nhận biến động mới vào hồ sơ điện tử!", "success");
  };

  // Modal Ghim tọa độ GIS
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAddress, setPinAddress] = useState("");
  const [pinLat, setPinLat] = useState("");
  const [pinLng, setPinLng] = useState("");

  const handleOpenPinModal = () => {
    if (!enterprise) return;
    setPinAddress(enterprise.address);
    const coords = parseGisCoords(enterprise.coordinates) || KP3_CENTER;
    setPinLat(coords.lat.toFixed(6));
    setPinLng(coords.lng.toFixed(6));
    setShowPinModal(true);
  };

  const handleSavePin = async () => {
    if (!enterprise) return;
    const lat = parseFloat(pinLat);
    const lng = parseFloat(pinLng);
    if (isNaN(lat) || isNaN(lng) || lat < 10.7 || lat > 10.9 || lng < 106.6 || lng > 106.85) {
      showToast("Tọa độ không hợp lệ trong phạm vi Phường An Phú, TP. Thủ Đức!", "error");
      return;
    }

    const newCoordStr = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const updated: Business = {
      ...enterprise,
      coordinates: newCoordStr,
      address: pinAddress.trim() || enterprise.address
    };

    setFetchedEnterprise(updated);

    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)((prev: Business[]) => {
          if (!Array.isArray(prev)) return [updated];
          return prev.map((b) => (b.id === updated.id ? updated : b));
        });
      }
    }

    if (isSupabaseConfigured) {
      try {
        await (supabase.from("businesses") as any)
          .update({
            coordinates: newCoordStr,
            address: updated.address
          })
          .eq("id", updated.id);
      } catch (err) {
        console.error("Lỗi cập nhật tọa độ GIS:", err);
      }
    }

    setShowPinModal(false);
    showToast(`Đã đồng bộ tọa độ GIS WGS-84 cho ${updated.name}!`, "success");
  };

  // Quản lý Album ảnh
  const [viewingImagePreview, setViewingImagePreview] = useState<{ url: string; caption: string } | null>(null);

  const handleAddGalleryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!enterprise || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      const currentImages = enterprise.images || (enterprise.image ? [enterprise.image] : []);
      const updatedImages = [...currentImages, url];
      const updated: Business = {
        ...enterprise,
        images: updatedImages
      };

      setFetchedEnterprise(updated);

      if (onUpdateBusinesses) {
        if (typeof onUpdateBusinesses === "function") {
          (onUpdateBusinesses as any)((prev: Business[]) => {
            if (!Array.isArray(prev)) return [updated];
            return prev.map((b) => (b.id === updated.id ? updated : b));
          });
        }
      }

      if (isSupabaseConfigured) {
        try {
          await (supabase.from("businesses") as any)
            .update({ images: updatedImages })
            .eq("id", updated.id);
        } catch (err) {
          console.error("Lỗi lưu ảnh vào Supabase:", err);
        }
      }

      showToast("Đã thêm ảnh mới vào album doanh nghiệp!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveGalleryPhoto = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enterprise) return;
    const currentImages = enterprise.images || (enterprise.image ? [enterprise.image] : []);
    const updatedImages = currentImages.filter((_, i) => i !== index);
    const updated: Business = {
      ...enterprise,
      images: updatedImages
    };

    setFetchedEnterprise(updated);

    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)((prev: Business[]) => {
          if (!Array.isArray(prev)) return [updated];
          return prev.map((b) => (b.id === updated.id ? updated : b));
        });
      }
    }

    if (isSupabaseConfigured) {
      try {
        await (supabase.from("businesses") as any)
          .update({ images: updatedImages })
          .eq("id", updated.id);
      } catch (err) {
        console.error("Lỗi cập nhật ảnh Supabase:", err);
      }
    }

    showToast("Đã xóa ảnh khỏi album!", "info");
  };

  const handleChangeAvatarPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!enterprise || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      const updated: Business = {
        ...enterprise,
        image: url
      };

      setFetchedEnterprise(updated);

      if (onUpdateBusinesses) {
        if (typeof onUpdateBusinesses === "function") {
          (onUpdateBusinesses as any)((prev: Business[]) => {
            if (!Array.isArray(prev)) return [updated];
            return prev.map((b) => (b.id === updated.id ? updated : b));
          });
        }
      }

      if (isSupabaseConfigured) {
        try {
          await (supabase.from("businesses") as any)
            .update({ image: url })
            .eq("id", updated.id);
        } catch (err) {
          console.error("Lỗi cập nhật avatar:", err);
        }
      }

      showToast("Đã cập nhật ảnh đại diện doanh nghiệp!", "success");
    };
    reader.readAsDataURL(file);
  };

  // Thêm lao động nước ngoài
  const [showAddForeignWorkerModal, setShowAddForeignWorkerModal] = useState(false);
  const [fwName, setFwName] = useState("");
  const [fwNationality, setFwNationality] = useState("");
  const [fwPassport, setFwPassport] = useState("");
  const [fwPosition, setFwPosition] = useState("Chuyên gia kỹ thuật");
  const [fwStatus, setFwStatus] = useState<ForeignWorker["temporaryResidenceStatus"]>("Đã khai báo tạm trú");

  const handleSaveForeignWorker = async () => {
    if (!enterprise) return;
    if (!fwName.trim() || !fwNationality.trim() || !fwPassport.trim()) {
      showToast("Vui lòng nhập Họ tên, Quốc tịch và Số hộ chiếu!", "warning");
      return;
    }

    const newWorker: ForeignWorker = {
      name: fwName.trim(),
      nationality: fwNationality.trim(),
      passportOrCode: fwPassport.trim(),
      position: fwPosition.trim() || "Chuyên gia",
      temporaryResidenceStatus: fwStatus
    };

    const updatedWorkers = [...(enterprise.foreignWorkers || []), newWorker];
    const updated: Business = {
      ...enterprise,
      foreignWorkers: updatedWorkers,
      foreignWorkersCount: updatedWorkers.length
    };

    setFetchedEnterprise(updated);

    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)((prev: Business[]) => {
          if (!Array.isArray(prev)) return [updated];
          return prev.map((b) => (b.id === updated.id ? updated : b));
        });
      }
    }

    if (isSupabaseConfigured) {
      try {
        await (supabase.from("businesses") as any)
          .update({
            foreign_workers: updatedWorkers,
            foreign_workers_count: updatedWorkers.length
          })
          .eq("id", updated.id);
      } catch (err) {
        console.error("Lỗi lưu lao động nước ngoài:", err);
      }
    }

    setShowAddForeignWorkerModal(false);
    setFwName("");
    setFwNationality("");
    setFwPassport("");
    showToast(`Đã thêm lao động nước ngoài: ${newWorker.name}!`, "success");
  };

  const handleRemoveForeignWorker = async (index: number) => {
    if (!enterprise || !confirm("Bạn có chắc chắn muốn xóa hồ sơ lao động này?")) return;
    const updatedWorkers = (enterprise.foreignWorkers || []).filter((_, i) => i !== index);
    const updated: Business = {
      ...enterprise,
      foreignWorkers: updatedWorkers,
      foreignWorkersCount: updatedWorkers.length
    };

    setFetchedEnterprise(updated);

    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)((prev: Business[]) => {
          if (!Array.isArray(prev)) return [updated];
          return prev.map((b) => (b.id === updated.id ? updated : b));
        });
      }
    }

    if (isSupabaseConfigured) {
      try {
        await (supabase.from("businesses") as any)
          .update({
            foreign_workers: updatedWorkers,
            foreign_workers_count: updatedWorkers.length
          })
          .eq("id", updated.id);
      } catch (err) {
        console.error("Lỗi xóa lao động nước ngoài:", err);
      }
    }

    showToast("Đã xóa hồ sơ lao động nước ngoài!", "info");
  };

  // Xóa doanh nghiệp
  const handleDeleteEnterprise = async () => {
    if (!enterprise) return;
    if (!confirm(`XÁC NHẬN NGUY HIỂM: Bạn có chắc chắn muốn xóa toàn bộ hồ sơ của ${enterprise.name} khỏi hệ thống dữ liệu Khu phố 3?`)) {
      return;
    }

    if (onDelete) {
      onDelete(enterprise);
    }

    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)((prev: Business[]) => {
          if (!Array.isArray(prev)) return [];
          return prev.filter((b) => b.id !== enterprise.id);
        });
      }
    }

    if (isSupabaseConfigured) {
      try {
        await (supabase.from("businesses") as any).delete().eq("id", enterprise.id);
      } catch (err) {
        console.error("Lỗi xóa doanh nghiệp:", err);
      }
    }

    showToast(`Đã xóa vĩnh viễn hồ sơ doanh nghiệp ${enterprise.name}!`, "info");
    handleBack();
  };

  // Trường hợp đang tải hoặc không tìm thấy
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-semibold text-slate-700">Đang truy xuất hồ sơ doanh nghiệp số hóa KP3...</p>
        <span className="text-xs text-muted-foreground font-mono">ID: {resolvedId || "Không xác định"}</span>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy hồ sơ doanh nghiệp</h2>
        <p className="text-sm text-slate-600 max-w-md">
          Mã định danh hoặc hồ sơ doanh nghiệp <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">{resolvedId}</code> không tồn tại trên hệ thống hoặc đã được điều chuyển.
        </p>
        <Button onClick={handleBack} variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold cursor-pointer">
          <ArrowLeft size={16} /> Quay về danh mục Doanh nghiệp
        </Button>
      </div>
    );
  }

  const coords = parseGisCoords(enterprise.coordinates) || KP3_CENTER;
  const dmsString = decimalToDMS(coords.lat, coords.lng);
  const gallery = enterprise.images && enterprise.images.length > 0
    ? enterprise.images
    : enterprise.image
    ? [enterprise.image]
    : ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 print:bg-white print:p-0">
      {/* TOP HEADER: BREADCRUMBS & ACTION TOOLBAR */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumbs & Back */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 font-bold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={16} />
              <span>Danh mục Doanh nghiệp</span>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span>Cán bộ KP3</span>
              <span>/</span>
              <span>Hồ sơ Doanh nghiệp (DNNVV)</span>
              <span>/</span>
              <span className="font-bold text-slate-800 font-mono">{enterprise.internalCode || `DN-KP3-${enterprise.id}`}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
              title="In bản hồ sơ doanh nghiệp"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">In Hồ Sơ</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDirections(enterprise)}
              className="gap-1.5 text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-bold cursor-pointer"
            >
              <Navigation size={14} />
              <span>Dẫn đường GIS</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangeLogModal(true)}
              className="gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-100 font-bold cursor-pointer"
            >
              <History size={14} />
              <span className="hidden sm:inline">Ghi nhận Biến động</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditModal}
              className="gap-1.5 text-indigo-700 border-indigo-300 hover:bg-indigo-50 font-bold cursor-pointer"
            >
              <Pencil size={14} />
              <span>Sửa Hồ Sơ</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteEnterprise}
              className="gap-1.5 font-bold cursor-pointer"
              title="Xóa hồ sơ khỏi hệ thống"
            >
              <Trash2 size={14} />
              <span className="hidden md:inline">Xóa</span>
            </Button>
          </div>
        </div>
      </div>

      {/* IN VĂN BẢN HÀNH CHÍNH HEADER (Chỉ hiện khi In) */}
      <div className="hidden print:block text-center p-6 border-b border-black mb-6">
        <div className="flex justify-between items-start text-xs font-serif uppercase tracking-wider mb-4">
          <div>
            <p className="font-bold">UBND PHƯỜNG AN PHÚ</p>
            <p className="font-bold underline">BAN ĐIỀU HÀNH KHU PHỐ 3</p>
          </div>
          <div className="text-right">
            <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="italic">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>
        <h1 className="text-xl font-bold font-serif uppercase mt-4">
          HỒ SƠ QUẢN LÝ DOANH NGHIỆP ĐỊA BÀN KHU PHỐ 3
        </h1>
        <p className="text-xs font-serif italic mt-1">
          (Theo Luật Hỗ trợ Doanh nghiệp nhỏ và vừa 2017 & Nghị định 80/2021/NĐ-CP)
        </p>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* HERO IDENTITY BANNER (Navy Gradient) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/60 relative overflow-hidden print:border print:text-black print:bg-none print:p-4">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            {/* Avatar & Upload Camera */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-indigo-500/40 shadow-xl overflow-hidden border-2 border-indigo-400/80 bg-slate-800">
                <img
                  src={enterprise.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"}
                  alt={enterprise.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <label
                className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer print:hidden"
                title="Thay đổi ảnh đại diện"
              >
                <Camera size={20} className="text-indigo-300 mb-1" />
                <span className="text-[10px] font-bold">Đổi ảnh</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleChangeAvatarPhoto} />
              </label>
            </div>

            {/* Enterprise Details */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge
                  variant="outline"
                  onClick={() => handleCopy(enterprise.internalCode || `DN-KP3-${enterprise.id}`, "Mã nội bộ")}
                  className="font-mono text-xs font-bold border-indigo-400/60 text-indigo-200 bg-indigo-950/90 hover:bg-indigo-900 cursor-pointer transition-colors"
                  title="Nhấp để sao chép mã"
                >
                  {copiedField === "Mã nội bộ" ? "✓ Đã chép" : enterprise.internalCode || `DN-KP3-${enterprise.id}`}
                </Badge>

                {enterprise.taxCode && (
                  <Badge
                    variant="outline"
                    onClick={() => handleCopy(enterprise.taxCode || "", "Mã số thuế")}
                    className="font-mono text-xs font-bold border-amber-400/60 text-amber-300 bg-amber-950/80 hover:bg-amber-900 cursor-pointer transition-colors"
                    title="Nhấp để sao chép MST"
                  >
                    {copiedField === "Mã số thuế" ? "✓ Đã chép MST" : `MST: ${enterprise.taxCode}`}
                  </Badge>
                )}

                <Badge variant="outline" className="text-xs font-bold border-slate-600 text-slate-300 bg-slate-900/90">
                  <Briefcase size={12} className="mr-1 text-indigo-400" />
                  {enterprise.businessType || "Công ty TNHH"}
                </Badge>

                <Badge variant="info" className="font-bold text-xs">
                  {getEnterpriseScaleLabel(enterprise)}
                </Badge>

                <Badge
                  variant={
                    enterprise.status === "Đang hoạt động"
                      ? "success"
                      : enterprise.status === "Tạm ngưng"
                      ? "destructive"
                      : "warning"
                  }
                  className="font-bold text-xs"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 bg-current animate-pulse" />
                  {enterprise.status}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug print:text-black">
                {enterprise.name}
              </h1>

              {/* Address & Hot Actions */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-indigo-200">
                  <MapPin size={14} className="shrink-0 text-indigo-400" />
                  <span className="font-medium">{enterprise.address}</span>
                  <span className="text-slate-400">({enterprise.streetArea || "Lương Định Của"})</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <User size={14} className="shrink-0 text-indigo-400" />
                  <span>ĐDPL: </span>
                  <strong className="text-white print:text-black">{enterprise.legalRepresentative || enterprise.owner}</strong>
                </div>

                {enterprise.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={13} className="shrink-0 text-emerald-400" />
                    <a href={`tel:${enterprise.phone}`} className="font-mono text-emerald-300 hover:underline">
                      {enterprise.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* GIS Pin Box */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2 shrink-0 w-full sm:w-auto print:border-black">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Định vị WGS-84 GIS
              </span>
              <div className="font-mono text-xs font-bold text-indigo-300">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {dmsString}
              </p>
              <div className="flex items-center justify-center gap-1.5 pt-1 print:hidden">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleOpenPinModal}
                  className="bg-indigo-950/60 border-indigo-500/40 text-indigo-200 hover:bg-indigo-900 font-semibold cursor-pointer"
                >
                  <MapPin size={12} className="mr-1" /> Ghim lại
                </Button>
                <a
                  href={getGoogleMapsDirectionUrl(coords.lat, coords.lng, enterprise.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-md font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={11} /> Bản đồ
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 4 STATS METRIC CARDS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-border shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Lao Động</span>
              <Users2 size={16} className="text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{enterprise.employeeCount || 0}</span>
              <span className="text-xs text-muted-foreground font-medium">nhân sự</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
              <span>Thường trú: <strong className="text-emerald-700">{enterprise.localWorkersCount ?? Math.floor((enterprise.employeeCount || 0) / 2)}</strong></span>
              <span>Tạm trú: <strong className="text-blue-700">{enterprise.temporaryWorkersCount ?? Math.ceil((enterprise.employeeCount || 0) / 2)}</strong></span>
            </div>
          </Card>

          <Card className="p-4 bg-white border-border shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lao Động Nước Ngoài</span>
              <Globe size={16} className="text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700">
                {enterprise.foreignWorkersCount || (enterprise.foreignWorkers?.length || 0)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">chuyên gia / LĐ</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
              {enterprise.foreignWorkers && enterprise.foreignWorkers.length > 0
                ? `${enterprise.foreignWorkers.length} người có Work Permit`
                : "Chưa ghi nhận LĐ nước ngoài"}
            </div>
          </Card>

          <Card className="p-4 bg-white border-border shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mặt Bằng Hoạt Động</span>
              <Home size={16} className="text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-900 truncate">
                {enterprise.premisesType || "Văn phòng"}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
              {enterprise.linkedHouseholdCode ? (
                <span className="text-indigo-700 font-bold">Mã HK: {enterprise.linkedHouseholdCode}</span>
              ) : enterprise.premisesOwner ? (
                <span>Chủ mặt bằng: {enterprise.premisesOwner}</span>
              ) : (
                <span className="italic">Chính chủ sở hữu</span>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-white border-border shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tuân Thủ PCCC & ANTT</span>
              <ShieldCheck size={16} className="text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={enterprise.pcccPassed ? "success" : "destructive"} className="text-xs font-bold">
                {enterprise.pcccPassed ? "✓ Đạt chuẩn PCCC" : "⚠ Chưa thẩm duyệt"}
              </Badge>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Cam kết ANTT:</span>
              <strong className={enterprise.hasCamKetAnNinh ? "text-emerald-700" : "text-amber-700"}>
                {enterprise.hasCamKetAnNinh ? "Đã ký kết" : "Chưa hoàn tất"}
              </strong>
            </div>
          </Card>
        </div>

        {/* TABS CONTENT SYSTEM */}
        <div className="bg-white rounded-2xl border border-border shadow-2xs overflow-hidden">
          {/* Tabs Bar */}
          <div className="border-b border-border bg-slate-50/70 px-4 sm:px-6 flex flex-wrap gap-2 sm:gap-6 print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "overview" ? "text-indigo-700 font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building size={16} />
              <span>Tổng quan & Pháp lý</span>
              {activeTab === "overview" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("labor")}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "labor" ? "text-indigo-700 font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users2 size={16} />
              <span>Quản lý Lao động ({enterprise.employeeCount || 0})</span>
              {activeTab === "labor" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("compliance")}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "compliance" ? "text-indigo-700 font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={16} />
              <span>PCCC & An ninh trật tự</span>
              {activeTab === "compliance" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("changes")}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "changes" ? "text-indigo-700 font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History size={16} />
              <span>Nhật ký Biến động ({enterprise.changeHistory?.length || 0})</span>
              {activeTab === "changes" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "support" ? "text-indigo-700 font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HelpCircle size={16} />
              <span>Hỗ trợ & Đề xuất ({enterprise.supportNeeds?.length || 0})</span>
              {activeTab === "support" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === "gallery" ? "text-indigo-700 font-extrabold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon size={16} />
              <span>Album Ảnh ({gallery.length})</span>
              {activeTab === "gallery" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
            </button>
          </div>

          {/* TAB 1: OVERVIEW & LEGAL */}
          {activeTab === "overview" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thông tin pháp lý */}
                <Card className="border-border">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <FileText size={16} className="text-indigo-600" />
                      Thông Tin Đăng Ký Kinh Doanh & Thuế
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Tên pháp nhân:</span>
                      <strong className="text-slate-900 font-bold">{enterprise.name}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Mã nội bộ KP3:</span>
                      <span className="font-mono font-bold text-indigo-700">{enterprise.internalCode || `DN-KP3-${enterprise.id}`}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Mã số thuế quốc gia:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{enterprise.taxCode || "Chưa có"}</span>
                        {enterprise.taxCode && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleCopy(enterprise.taxCode || "", "Mã số thuế")}
                            className="p-1 h-auto text-slate-400 hover:text-slate-700"
                            title="Sao chép"
                          >
                            <Copy size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Loại hình tổ chức:</span>
                      <span className="font-semibold text-slate-800">{enterprise.businessType || "Công ty TNHH"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Ngành nghề kinh doanh chính:</span>
                      <span className="font-medium text-slate-800">{enterprise.type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Phân loại quy mô (NĐ 80/2021/NĐ-CP):</span>
                      <Badge variant="outline" className="font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                        {getEnterpriseScaleLabel(enterprise)}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Ngày bắt đầu hoạt động tại KP3:</span>
                      <span className="font-mono font-medium">{enterprise.startDate || "01/01/2024"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Người đại diện & Đầu mối */}
                <Card className="border-border">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <User size={16} className="text-indigo-600" />
                      Người Đại Diện & Cán Bộ Phối Hợp Địa Bàn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Đại diện pháp luật (Giám đốc):</span>
                      <strong className="text-slate-900 font-bold">{enterprise.legalRepresentative || enterprise.owner}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">SĐT người đại diện:</span>
                      <a href={`tel:${enterprise.legalRepPhone || enterprise.phone}`} className="font-mono font-bold text-indigo-600 hover:underline">
                        {enterprise.legalRepPhone || enterprise.phone || "Chưa cập nhật"}
                      </a>
                    </div>
                    {enterprise.legalRepEmail && (
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-muted-foreground">Email công vụ:</span>
                        <a href={`mailto:${enterprise.legalRepEmail}`} className="font-mono text-slate-700 hover:underline">
                          {enterprise.legalRepEmail}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Quản lý điều hành tại chỗ:</span>
                      <span className="font-semibold text-slate-800">{enterprise.siteManager || enterprise.owner}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">SĐT quản lý tại chỗ:</span>
                      <span className="font-mono text-slate-800">{enterprise.siteManagerPhone || enterprise.phone || "Chưa có"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Đầu mối phối hợp KP3:</span>
                      <strong className="text-emerald-700">
                        {enterprise.focalPointName || enterprise.owner} ({enterprise.focalPointRole || "Đại diện"})
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">SĐT liên hệ khẩn cấp KP3:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {enterprise.focalPointPhone || enterprise.phone || "Chưa cập nhật"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mặt bằng & Trụ sở địa chính */}
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <Home size={16} className="text-indigo-600" />
                    Mặt Bằng Trụ Sở & Hồ Sơ Địa Chính Tại Khu Phố 3
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground block">Địa chỉ trụ sở hoạt động:</span>
                    <strong className="text-slate-900 block">{enterprise.address}</strong>
                    <span className="text-xs text-indigo-600 font-medium">Tuyến: {enterprise.streetArea || "Lương Định Của"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground block">Loại hình mặt bằng:</span>
                    <strong className="text-slate-900 block">{enterprise.premisesType || "Văn phòng làm việc"}</strong>
                    <span className="text-xs text-slate-500">
                      {enterprise.premisesOwner ? `Thuê của: ${enterprise.premisesOwner}` : "Trụ sở thuộc sở hữu doanh nghiệp"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground block">Liên kết Sổ Hộ Khẩu:</span>
                    {enterprise.linkedHouseholdCode ? (
                      <div>
                        <strong className="text-indigo-700 block font-mono">Mã Sổ: {enterprise.linkedHouseholdCode}</strong>
                        <span className="text-xs text-emerald-600">Đã liên kết CSDL dân cư KP3</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-slate-500 italic block">Chưa liên kết hộ khẩu KP3</span>
                        <span className="text-[11px] text-muted-foreground">Có thể gán mã sổ hộ khẩu khi sửa hồ sơ</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: LABOR & HUMAN RESOURCES */}
          {activeTab === "labor" && (
            <div className="p-6 space-y-6">
              {/* Labor Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-50 border-slate-200 text-center">
                  <span className="text-xs text-muted-foreground block">Tổng lao động</span>
                  <strong className="text-2xl font-black text-slate-900">{enterprise.employeeCount || 0}</strong>
                </Card>
                <Card className="p-4 bg-emerald-50/60 border-emerald-200 text-center">
                  <span className="text-xs text-emerald-700 font-semibold block">LĐ Thường trú KP3</span>
                  <strong className="text-2xl font-black text-emerald-800">
                    {enterprise.localWorkersCount ?? Math.floor((enterprise.employeeCount || 0) / 2)}
                  </strong>
                </Card>
                <Card className="p-4 bg-blue-50/60 border-blue-200 text-center">
                  <span className="text-xs text-blue-700 font-semibold block">LĐ Tạm trú KP3</span>
                  <strong className="text-2xl font-black text-blue-800">
                    {enterprise.temporaryWorkersCount ?? Math.ceil((enterprise.employeeCount || 0) / 2)}
                  </strong>
                </Card>
                <Card className="p-4 bg-purple-50/60 border-purple-200 text-center">
                  <span className="text-xs text-purple-700 font-semibold block">Lao động Nước ngoài</span>
                  <strong className="text-2xl font-black text-purple-800">
                    {enterprise.foreignWorkersCount || (enterprise.foreignWorkers?.length || 0)}
                  </strong>
                </Card>
              </div>

              {/* Foreign Workers Table */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Globe size={16} className="text-purple-600" />
                      Danh Sách Lao Động Nước Ngoài Đăng Ký Làm Việc
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Theo dõi giấy phép lao động (Work Permit) và thời hạn thị thực / thẻ tạm trú của chuyên gia
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForeignWorkerModal(true)}
                    className="gap-1.5 text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 font-bold cursor-pointer print:hidden"
                  >
                    <Plus size={14} /> Thêm Lao Động Nước Ngoài
                  </Button>
                </div>

                {(!enterprise.foreignWorkers || enterprise.foreignWorkers.length === 0) ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <Globe size={28} className="mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600">
                      Doanh nghiệp hiện chưa có lao động là người nước ngoài làm việc tại trụ sở KP3.
                    </p>
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-12 text-center">STT</TableHead>
                          <TableHead>Họ và Tên</TableHead>
                          <TableHead>Quốc Tịch</TableHead>
                          <TableHead>Số Hộ Chiếu / Mã</TableHead>
                          <TableHead>Vị Trí / Chức Danh</TableHead>
                          <TableHead>Tình Trạng Tạm Trú</TableHead>
                          <TableHead className="w-16 text-right print:hidden">Xóa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enterprise.foreignWorkers.map((fw, idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-mono text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-slate-900">{fw.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold text-xs">
                                {fw.nationality}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-medium">{fw.passportOrCode}</TableCell>
                            <TableCell className="text-xs">{fw.position}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  fw.temporaryResidenceStatus === "Đã khai báo tạm trú"
                                    ? "success"
                                    : fw.temporaryResidenceStatus === "Đang làm thủ tục"
                                    ? "warning"
                                    : "destructive"
                                }
                                className="text-[11px]"
                              >
                                {fw.temporaryResidenceStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right print:hidden">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleRemoveForeignWorker(idx)}
                                className="text-rose-600 hover:bg-rose-50 p-1"
                                title="Xóa"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PCCC & ANTT */}
          {activeTab === "compliance" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PCCC */}
                <Card className="border-border">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      Điều Kiện An Toàn Phòng Cháy Chữa Cháy (PCCC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-muted-foreground">Tình trạng nghiệm thu PCCC:</span>
                      <Badge variant={enterprise.pcccPassed ? "success" : "destructive"} className="font-bold">
                        {enterprise.pcccPassed ? "✓ Đã nghiệm thu đạt chuẩn" : "⚠ Chưa thẩm duyệt PCCC"}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Trang bị phương tiện chữa cháy tại chỗ:</span>
                      <span className="font-semibold text-slate-800">Bình bọt CO2 & Bột chữa cháy ABC</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Lối thoát hiểm khẩn cấp:</span>
                      <span className="font-semibold text-emerald-700">Đảm bảo thông thoáng 100%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Kiểm tra định kỳ bởi Tổ PCCC KP3:</span>
                      <span className="font-mono text-slate-700">Đã kiểm tra 6 tháng gần nhất</span>
                    </div>
                  </CardContent>
                </Card>

                {/* ANTT */}
                <Card className="border-border">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <ShieldAlert size={16} className="text-indigo-600" />
                      An Ninh Trật Tự & Cam Kết Địa Bàn KP3
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-muted-foreground">Bản cam kết ANTT với Công an Phường:</span>
                      <Badge variant={enterprise.hasCamKetAnNinh ? "success" : "warning"} className="font-bold">
                        {enterprise.hasCamKetAnNinh ? "✓ Đã ký cam kết ANTT" : "Chưa hoàn tất cam kết"}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Công an khu vực phụ trách:</span>
                      <strong className="text-slate-900 font-bold">Đại úy Trần Quốc Hải</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-muted-foreground">Số điện thoại Trực ban Công an Phường:</span>
                      <a href="tel:02837442114" className="font-mono font-bold text-indigo-600 hover:underline">
                        028.3744.2114
                      </a>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Đóng góp Quỹ An ninh - Quốc phòng:</span>
                      <span className="text-emerald-700 font-semibold">Đã hoàn thành nghĩa vụ năm</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 4: CHANGE LOGS */}
          {activeTab === "changes" && (
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History size={16} className="text-indigo-600" />
                    Nhật Ký Biến Động Doanh Nghiệp & Lịch Sử Kiểm Tra
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ghi nhận thay đổi ĐKKD, biến động nhân sự, kết quả thanh kiểm tra của Đoàn liên ngành
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangeLogModal(true)}
                  className="gap-1.5 text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-bold cursor-pointer print:hidden"
                >
                  <Plus size={14} /> Ghi nhận biến động
                </Button>
              </div>

              {(!enterprise.changeHistory || enterprise.changeHistory.length === 0) ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <History size={28} className="mx-auto text-slate-400" />
                  <p className="text-xs font-semibold text-slate-600">
                    Chưa ghi nhận biến động chính thức nào kể từ ngày thành lập hoặc đăng ký hoạt động tại KP3.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enterprise.changeHistory.map((chg, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline" className="font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                          {chg.type}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> {chg.date}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{chg.description}</p>
                      <div className="text-[11px] text-muted-foreground pt-1 border-t border-slate-200/60">
                        Cán bộ ghi nhận: <strong className="text-slate-700">{chg.recordedBy}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUPPORT NEEDS */}
          {activeTab === "support" && (
            <div className="p-6 space-y-6">
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <HelpCircle size={16} className="text-indigo-600" />
                    Nhu Cầu Hỗ Trợ Từ Chính Quyền & Địa Phương
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Căn cứ chính sách hỗ trợ phát triển kinh tế tư nhân theo Luật Hỗ trợ Doanh nghiệp nhỏ và vừa
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">Các hạng mục cần hỗ trợ:</span>
                    {(!enterprise.supportNeeds || enterprise.supportNeeds.length === 0) ? (
                      <p className="text-xs text-muted-foreground italic">Doanh nghiệp chưa đăng ký nhu cầu hỗ trợ cụ thể.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {enterprise.supportNeeds.map((need, idx) => (
                          <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-800 border-amber-200">
                            ✓ {need}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {enterprise.supportNotes && (
                    <div className="pt-3 border-t border-slate-100 space-y-1">
                      <span className="text-xs font-bold text-slate-700 block">Kiến nghị / Khó khăn phản ánh:</span>
                      <p className="text-xs sm:text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                        {enterprise.supportNotes}
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                    <strong className="block font-bold">Kênh tiếp nhận hỗ trợ DN Khu phố 3:</strong>
                    <p>
                      Cán bộ phụ trách kinh tế KP3 định kỳ tổng hợp kiến nghị và chuyển tiếp UBND Phường An Phú, Chi cục Thuế TP. Thủ Đức để tháo gỡ khó khăn về mặt bằng, tuyển dụng lao động và thủ tục pháp lý.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 6: PHOTO GALLERY */}
          {activeTab === "gallery" && (
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon size={16} className="text-indigo-600" />
                    Album Ảnh Cơ Sở Doanh Nghiệp & Trụ Sở ({gallery.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ảnh chụp mặt tiền, văn phòng làm việc, biển hiệu và giấy phép kinh doanh
                  </p>
                </div>
                <label className="text-xs text-indigo-700 hover:text-indigo-800 font-bold cursor-pointer flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-200 transition-colors print:hidden">
                  <Plus size={14} /> Thêm ảnh vào album
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddGalleryPhoto} />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {gallery.map((imgUrl, i) => (
                  <div
                    key={i}
                    onClick={() => setViewingImagePreview({ url: imgUrl, caption: `${enterprise.name} - Ảnh ${i + 1}` })}
                    className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer shadow-2xs hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <img src={imgUrl} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 print:hidden">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => handleRemoveGalleryPhoto(i, e)}
                        className="text-white hover:bg-rose-600 p-1.5 rounded-lg"
                        title="Xóa ảnh"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {viewingImagePreview && (
        <Dialog open={!!viewingImagePreview} onOpenChange={() => setViewingImagePreview(null)}>
          <DialogContent className="max-w-3xl p-2 bg-slate-950 border-slate-800 text-white">
            <div className="relative">
              <img src={viewingImagePreview.url} alt={viewingImagePreview.caption} className="w-full max-h-[80vh] object-contain rounded-lg mx-auto" />
              <p className="text-center text-xs text-slate-300 mt-2 font-medium">{viewingImagePreview.caption}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG: SỬA HỒ SƠ DOANH NGHIỆP */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Hiệu Chỉnh Hồ Sơ Doanh Nghiệp: {enterprise.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật thông tin pháp lý, đầu mối liên hệ và mặt bằng trụ sở tại Khu phố 3
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Tên doanh nghiệp / Công ty (*):</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="font-bold block mb-1">Mã nội bộ KP3:</label>
                <Input value={editInternalCode} onChange={(e) => setEditInternalCode(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold block mb-1">Mã số thuế (MST):</label>
                <Input value={editTaxCode} onChange={(e) => setEditTaxCode(e.target.value)} />
              </div>
              <div>
                <label className="font-bold block mb-1">Loại hình DN:</label>
                <select
                  value={editBusinessType}
                  onChange={(e) => setEditBusinessType(e.target.value)}
                  className="w-full border border-input rounded-md px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="Công ty TNHH">Công ty TNHH</option>
                  <option value="Công ty Cổ phần">Công ty Cổ phần</option>
                  <option value="Doanh nghiệp tư nhân">Doanh nghiệp tư nhân</option>
                  <option value="Cơ sở kinh doanh khác">Cơ sở kinh doanh khác</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Quy mô lao động:</label>
                <select
                  value={editEnterpriseScale}
                  onChange={(e) => setEditEnterpriseScale(e.target.value)}
                  className="w-full border border-input rounded-md px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="Siêu nhỏ (< 5 LĐ)">Siêu nhỏ (&lt; 5 LĐ)</option>
                  <option value="Nhỏ (5 - 20 LĐ)">Nhỏ (5 - 20 LĐ)</option>
                  <option value="Vừa (20 - 50 LĐ)">Vừa (20 - 50 LĐ)</option>
                  <option value="Lớn (> 50 LĐ)">Lớn (&gt; 50 LĐ)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Địa chỉ trụ sở (*):</label>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              </div>
              <div>
                <label className="font-bold block mb-1">Tuyến đường:</label>
                <select
                  value={editStreetArea}
                  onChange={(e) => setEditStreetArea(e.target.value)}
                  className="w-full border border-input rounded-md px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="Mặt tiền Lương Định Của">Mặt tiền Lương Định Của</option>
                  <option value="Hẻm 42 Lương Định Của">Hẻm 42 Lương Định Của</option>
                  <option value="Mặt tiền Song Hành">Mặt tiền Song Hành</option>
                  <option value="Mặt tiền Mai Chí Thọ">Mặt tiền Mai Chí Thọ</option>
                  <option value="Đường nội bộ KP3">Đường nội bộ KP3</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold block mb-1">Đại diện pháp luật:</label>
                <Input value={editLegalRep} onChange={(e) => setEditLegalRep(e.target.value)} />
              </div>
              <div>
                <label className="font-bold block mb-1">SĐT Đại diện:</label>
                <Input value={editLegalRepPhone} onChange={(e) => setEditLegalRepPhone(e.target.value)} />
              </div>
              <div>
                <label className="font-bold block mb-1">Email công vụ:</label>
                <Input value={editLegalRepEmail} onChange={(e) => setEditLegalRepEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold block mb-1">Tổng lao động:</label>
                <Input
                  type="number"
                  value={editEmployeeCount}
                  onChange={(e) => setEditEmployeeCount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">LĐ Thường trú:</label>
                <Input
                  type="number"
                  value={editLocalWorkers}
                  onChange={(e) => setEditLocalWorkers(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">LĐ Tạm trú:</label>
                <Input
                  type="number"
                  value={editTemporaryWorkers}
                  onChange={(e) => setEditTemporaryWorkers(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">LĐ Nước ngoài:</label>
                <Input
                  type="number"
                  value={editForeignWorkers}
                  onChange={(e) => setEditForeignWorkers(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Trạng thái hoạt động:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full border border-input rounded-md px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                  <option value="Chờ duyệt">Chờ duyệt</option>
                  <option value="Chuyển địa điểm">Chuyển địa điểm</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Mã Sổ Hộ Khẩu liên kết (nếu có):</label>
                <Input
                  placeholder="Ví dụ: HK-001"
                  value={editLinkedHouseholdCode}
                  onChange={(e) => setEditLinkedHouseholdCode(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={editPcccPassed}
                  onChange={(e) => setEditPcccPassed(e.target.checked)}
                />
                <span>Đạt chuẩn an toàn PCCC</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={editHasCamKet}
                  onChange={(e) => setEditHasCamKet(e.target.checked)}
                />
                <span>Đã ký cam kết ANTT với Công an</span>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="default" size="sm" onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Lưu Thay Đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: GHI NHẬN BIẾN ĐỘNG */}
      <Dialog open={showChangeLogModal} onOpenChange={setShowChangeLogModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Ghi Nhận Biến Động Doanh Nghiệp
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thêm sự kiện thay đổi đăng ký kinh doanh, lao động hoặc kết quả kiểm tra
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold block mb-1">Loại biến động:</label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value as any)}
                className="w-full border border-input rounded-md px-2.5 py-1.5 text-xs bg-white"
              >
                <option value="Thay đổi ngành nghề">Thay đổi ngành nghề</option>
                <option value="Thay đổi người đại diện">Thay đổi người đại diện</option>
                <option value="Chuyển địa điểm">Chuyển địa điểm</option>
                <option value="Tạm ngừng">Tạm ngừng</option>
                <option value="Hoạt động trở lại">Hoạt động trở lại</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1">Ngày ghi nhận:</label>
              <Input type="date" value={changeDate} onChange={(e) => setChangeDate(e.target.value)} />
            </div>

            <div>
              <label className="font-bold block mb-1">Nội dung chi tiết (*):</label>
              <textarea
                rows={3}
                value={changeDesc}
                onChange={(e) => setChangeDesc(e.target.value)}
                placeholder="Nhập nội dung biến động hoặc biên bản kiểm tra..."
                className="w-full border border-input rounded-md p-2 text-xs bg-white"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Cán bộ / Tổ công tác ghi nhận:</label>
              <Input value={changeRecordedBy} onChange={(e) => setChangeRecordedBy(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowChangeLogModal(false)}>
              Hủy
            </Button>
            <Button variant="default" size="sm" onClick={handleSaveChangeLog} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Lưu Nhật Ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: GHIM TỌA ĐỘ GIS */}
      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Hiệu Chỉnh Tọa Độ GIS WGS-84
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nhập tọa độ thực tế đo đạc để hiển thị chuẩn xác trên bản đồ GIS Khu phố 3
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold block mb-1">Địa chỉ trụ sở:</label>
              <Input value={pinAddress} onChange={(e) => setPinAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold block mb-1">Vĩ độ (Latitude):</label>
                <Input value={pinLat} onChange={(e) => setPinLat(e.target.value)} placeholder="10.793500" />
              </div>
              <div>
                <label className="font-bold block mb-1">Kinh độ (Longitude):</label>
                <Input value={pinLng} onChange={(e) => setPinLng(e.target.value)} placeholder="106.744500" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Phạm vi hợp lệ Khu phố 3 An Phú: Vĩ độ [10.78 - 10.81], Kinh độ [106.73 - 106.76].
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowPinModal(false)}>
              Hủy
            </Button>
            <Button variant="default" size="sm" onClick={handleSavePin} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Cập Nhật Tọa Độ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: THÊM LAO ĐỘNG NƯỚC NGOÀI */}
      <Dialog open={showAddForeignWorkerModal} onOpenChange={setShowAddForeignWorkerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Đăng Ký Lao Động Nước Ngoài Mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nhập thông tin chuyên gia / lao động nước ngoài làm việc tại trụ sở doanh nghiệp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold block mb-1">Họ và tên (*):</label>
              <Input value={fwName} onChange={(e) => setFwName(e.target.value)} placeholder="Ví dụ: John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold block mb-1">Quốc tịch (*):</label>
                <Input value={fwNationality} onChange={(e) => setFwNationality(e.target.value)} placeholder="Ví dụ: Hàn Quốc, Mỹ..." />
              </div>
              <div>
                <label className="font-bold block mb-1">Số Hộ Chiếu / Mã định danh (*):</label>
                <Input value={fwPassport} onChange={(e) => setFwPassport(e.target.value)} placeholder="M12345678" />
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">Vị trí / Chức danh công tác:</label>
              <Input value={fwPosition} onChange={(e) => setFwPosition(e.target.value)} placeholder="Chuyên gia kỹ thuật / Giám đốc điều hành" />
            </div>
            <div>
              <label className="font-bold block mb-1">Tình trạng khai báo tạm trú:</label>
              <select
                value={fwStatus}
                onChange={(e) => setFwStatus(e.target.value as any)}
                className="w-full border border-input rounded-md px-2.5 py-1.5 text-xs bg-white"
              >
                <option value="Đã khai báo tạm trú">Đã khai báo tạm trú</option>
                <option value="Đang làm thủ tục">Đang làm thủ tục</option>
                <option value="Chưa khai báo">Chưa khai báo</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddForeignWorkerModal(false)}>
              Hủy
            </Button>
            <Button variant="default" size="sm" onClick={handleSaveForeignWorker} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              Thêm Lao Động
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
