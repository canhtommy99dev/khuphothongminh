import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  User,
  UserCheck,
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Printer,
  Download,
  List,
  LayoutGrid,
  TrendingUp,
  Briefcase,
  Sparkles,
  Building,
  Users2,
  Globe,
  HelpCircle,
  History,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Camera,
  Upload,
  Navigation,
  Compass,
  Check,
  ImageIcon,
  Maximize2
} from "lucide-react";
import {
  Business,
  BusinessChangeLog,
  Resident,
  Household,
  ForeignWorker,
  BusinessFile,
  TargetGisItem
} from "../types";
import {
  KP3_CENTER,
  decimalToDMS,
  parseCoordinates as parseGisCoords,
  generateDefaultCoordinatesForAddress,
  getGoogleMapsDirectionUrl
} from "../utils/gisUtils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table";
import { Separator } from "./ui/separator";
import EnterpriseDetailPage from "../page/EnterpriseDetailPage";
import AddShowPage from "../page/AddShowPage";
import { navigate, useCurrentPath, ROUTES } from "../routes";

export interface EnterpriseManagementProps {
  businesses: Business[];
  residents?: Resident[];
  households?: Household[];
  onToggleCertification: (id: string) => void;
  onUpdateStatus: (id: string, status: "Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt" | "Chuyển địa điểm" | "Chưa xác minh") => void;
  onUpdateBusinesses?: React.Dispatch<React.SetStateAction<Business[]>> | ((businesses: Business[]) => void);
  onNavigateToGis?: (item: TargetGisItem) => void;
}

// Helper to identify enterprises (DNNVV)
export const isEnterpriseEntity = (b: Business): boolean => {
  if (b.businessType) {
    if (["Công ty TNHH", "Công ty Cổ phần", "Doanh nghiệp tư nhân", "Cơ sở kinh doanh khác"].includes(b.businessType)) {
      return true;
    }
    if (b.businessType === "Hộ kinh doanh") return false;
  }
  const nameLower = (b.name || "").toLowerCase();
  const typeLower = (b.type || "").toLowerCase();
  return (
    nameLower.includes("công ty") ||
    nameLower.includes("tnhh") ||
    nameLower.includes("cổ phần") ||
    nameLower.includes("doanh nghiệp") ||
    nameLower.includes("nhà sách") ||
    typeLower.includes("công ty") ||
    (b.employeeCount && b.employeeCount >= 5 && !b.isAccommodation)
  );
};

export const getEnterpriseScaleLabel = (
  b: Business
): "Siêu nhỏ (< 5 LĐ)" | "Nhỏ (5 - 20 LĐ)" | "Vừa (20 - 50 LĐ)" | "Lớn (> 50 LĐ)" => {
  if (b.enterpriseScale) return b.enterpriseScale;
  const count = b.employeeCount || 1;
  if (count < 5) return "Siêu nhỏ (< 5 LĐ)";
  if (count <= 20) return "Nhỏ (5 - 20 LĐ)";
  if (count <= 50) return "Vừa (20 - 50 LĐ)";
  return "Lớn (> 50 LĐ)";
};

export default function EnterpriseManagement({
  businesses = [],
  residents = [],
  households = [],
  onToggleCertification,
  onUpdateStatus,
  onUpdateBusinesses,
  onNavigateToGis
}: EnterpriseManagementProps) {
  // Navigation tabs: Danh mục vs Báo cáo kinh tế địa bàn
  const [activeMainTab, setActiveMainTab] = useState<"list" | "economicReport">("list");

  // Subpage Route Detection
  const currentPath = useCurrentPath();
  const [viewingEnterpriseDetailId, setViewingEnterpriseDetailId] = useState<string | null>(null);

  const isAddEnterpriseRoute = useMemo(() => {
    const clean = currentPath.replace(/^\/+|\/+$/g, "");
    return (
      clean === "dashboard/enterprises/add" ||
      clean === "add_enterprise" ||
      clean === "addenterprise" ||
      (clean.startsWith("addshow") && clean.includes("enterprises"))
    );
  }, [currentPath]);

  const isEnterpriseDetailRoute = useMemo(() => {
    const clean = currentPath.replace(/^\/+|\/+$/g, "");
    if (isAddEnterpriseRoute || clean === "dashboard/enterprises/add") return false;
    return clean.startsWith("dashboard/enterprises/") || clean.startsWith("enterprise_detail");
  }, [currentPath, isAddEnterpriseRoute]);

  const detailPathId = useMemo(() => {
    if (!isEnterpriseDetailRoute) return null;
    const clean = currentPath.replace(/^\/+|\/+$/g, "");
    const segments = clean.split("/");
    if (clean.startsWith("dashboard/enterprises/")) {
      return segments[2] ? decodeURIComponent(segments[2]) : null;
    }
    if (clean.startsWith("enterprise_detail")) {
      return segments[1] ? decodeURIComponent(segments[1]) : null;
    }
    return null;
  }, [isEnterpriseDetailRoute, currentPath]);

  // Modals state
  const [selectedEnterprise, setSelectedEnterprise] = useState<Business | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailSubTab, setDetailSubTab] = useState<"overview" | "labor" | "changes" | "support" | "gallery">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangeLogModal, setShowChangeLogModal] = useState(false);
  const [viewingImagePreview, setViewingImagePreview] = useState<{ url: string; caption: string } | null>(null);

  // GIS Coordinate Pinning state
  const [gisPinModalEnterprise, setGisPinModalEnterprise] = useState<Business | null>(null);
  const [gisPinInput, setGisPinInput] = useState("");

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const showToast = (text: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("Tất cả");
  const [scaleFilter, setScaleFilter] = useState<string>("Tất cả");
  const [streetFilter, setStreetFilter] = useState<string>("Tất cả");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Change Log Form state
  const [changeType, setChangeType] = useState<BusinessChangeLog["type"]>("Khác");
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split("T")[0]);
  const [changeDesc, setChangeDesc] = useState("");
  const [changeRecorder, setChangeRecorder] = useState("Cán bộ quản lý kinh tế KP3");

  // Add Enterprise Form state
  const [newName, setNewName] = useState("");
  const [newInternalCode, setNewInternalCode] = useState("");
  const [newTaxCode, setNewTaxCode] = useState("");
  const [newBusinessType, setNewBusinessType] = useState<"Công ty TNHH" | "Công ty Cổ phần" | "Doanh nghiệp tư nhân" | "Cơ sở kinh doanh khác">("Công ty TNHH");
  const [newEnterpriseScale, setNewEnterpriseScale] = useState<"Siêu nhỏ (< 5 LĐ)" | "Nhỏ (5 - 20 LĐ)" | "Vừa (20 - 50 LĐ)" | "Lớn (> 50 LĐ)">("Nhỏ (5 - 20 LĐ)");
  const [newType, setNewType] = useState("Thương mại & Dịch vụ");
  const [newStartDate, setNewStartDate] = useState(new Date().toLocaleDateString("vi-VN"));
  const [newAddress, setNewAddress] = useState("");
  const [newStreetArea, setNewStreetArea] = useState("Mặt tiền Lương Định Của");
  const [newPremisesType, setNewPremisesType] = useState<"Văn phòng" | "Nhà phố" | "Cửa hàng" | "Nhà xưởng" | "Ki-ốt" | "Địa điểm thuê" | "Chung cư / Căn hộ">("Văn phòng");
  const [newPremisesOwner, setNewPremisesOwner] = useState("");
  const [newPremisesOwnerPhone, setNewPremisesOwnerPhone] = useState("");
  const [newLinkedHouseholdCode, setNewLinkedHouseholdCode] = useState("");
  const [newLegalRep, setNewLegalRep] = useState("");
  const [newLegalRepPhone, setNewLegalRepPhone] = useState("");
  const [newLegalRepEmail, setNewLegalRepEmail] = useState("");
  const [newSiteManager, setNewSiteManager] = useState("");
  const [newSiteManagerPhone, setNewSiteManagerPhone] = useState("");
  const [newFocalPointName, setNewFocalPointName] = useState("");
  const [newFocalPointPhone, setNewFocalPointPhone] = useState("");
  const [newFocalPointRole, setNewFocalPointRole] = useState("Đại diện phối hợp");
  const [newEmployeeCount, setNewEmployeeCount] = useState<number>(8);
  const [newLocalWorkers, setNewLocalWorkers] = useState<number>(3);
  const [newTemporaryWorkers, setNewTemporaryWorkers] = useState<number>(5);
  const [newForeignWorkersCount, setNewForeignWorkersCount] = useState<number>(0);
  const [newSupportNeeds, setNewSupportNeeds] = useState<string[]>([]);
  const [newSupportNotes, setNewSupportNotes] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newAdditionalImages, setNewAdditionalImages] = useState<string[]>([]);

  // Edit Enterprise Form state
  const [editName, setEditName] = useState("");
  const [editInternalCode, setEditInternalCode] = useState("");
  const [editTaxCode, setEditTaxCode] = useState("");
  const [editBusinessType, setEditBusinessType] = useState<"Công ty TNHH" | "Công ty Cổ phần" | "Doanh nghiệp tư nhân" | "Cơ sở kinh doanh khác">("Công ty TNHH");
  const [editEnterpriseScale, setEditEnterpriseScale] = useState<"Siêu nhỏ (< 5 LĐ)" | "Nhỏ (5 - 20 LĐ)" | "Vừa (20 - 50 LĐ)" | "Lớn (> 50 LĐ)">("Nhỏ (5 - 20 LĐ)");
  const [editType, setEditType] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStreetArea, setEditStreetArea] = useState("Mặt tiền Lương Định Của");
  const [editPremisesType, setEditPremisesType] = useState<"Văn phòng" | "Nhà phố" | "Cửa hàng" | "Nhà xưởng" | "Ki-ốt" | "Địa điểm thuê" | "Chung cư / Căn hộ">("Văn phòng");
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
  const [editFocalPointRole, setEditFocalPointRole] = useState("");
  const [editEmployeeCount, setEditEmployeeCount] = useState<number>(1);
  const [editLocalWorkers, setEditLocalWorkers] = useState<number>(0);
  const [editTemporaryWorkers, setEditTemporaryWorkers] = useState<number>(0);
  const [editForeignWorkersCount, setEditForeignWorkersCount] = useState<number>(0);
  const [editSupportNeeds, setEditSupportNeeds] = useState<string[]>([]);
  const [editSupportNotes, setEditSupportNotes] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);

  // Update business list wrapper
  const updateBusinessesList = (newList: Business[]) => {
    if (onUpdateBusinesses) {
      if (typeof onUpdateBusinesses === "function") {
        (onUpdateBusinesses as any)(newList);
      }
    }
  };

  // Base enterprise list
  const enterprises = useMemo(() => {
    return businesses.filter(isEnterpriseEntity);
  }, [businesses]);

  // Synchronize selected enterprise when data changes
  useEffect(() => {
    if (selectedEnterprise) {
      const updated = businesses.find((b) => b.id === selectedEnterprise.id);
      if (updated) setSelectedEnterprise(updated);
    }
  }, [businesses]);

  // Filtered Enterprises
  const filteredEnterprises = useMemo(() => {
    return enterprises.filter((item) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        item.name.toLowerCase().includes(searchLower) ||
        (item.internalCode || "").toLowerCase().includes(searchLower) ||
        (item.taxCode || "").toLowerCase().includes(searchLower) ||
        (item.legalRepresentative || item.owner || "").toLowerCase().includes(searchLower) ||
        (item.focalPointName || "").toLowerCase().includes(searchLower) ||
        item.address.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      if (typeFilter !== "Tất cả") {
        const itemType = item.businessType || "Công ty TNHH";
        if (itemType !== typeFilter) return false;
      }

      if (scaleFilter !== "Tất cả") {
        const scale = getEnterpriseScaleLabel(item);
        if (scale !== scaleFilter) return false;
      }

      if (streetFilter !== "Tất cả") {
        const street = item.streetArea || (item.address.includes("42") ? "Hẻm 42 Lương Định Của" : "Mặt tiền Lương Định Của");
        if (street !== streetFilter) return false;
      }

      if (statusFilter !== "Tất cả") {
        if (item.status !== statusFilter) return false;
      }

      return true;
    });
  }, [enterprises, searchTerm, typeFilter, scaleFilter, streetFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, scaleFilter, streetFilter, statusFilter, itemsPerPage]);

  // Pagination calculation
  const totalItems = filteredEnterprises.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedEnterprises = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnterprises.slice(start, start + itemsPerPage);
  }, [filteredEnterprises, currentPage, itemsPerPage]);

  // Statistics
  const tnhhCount = enterprises.filter((b) => b.businessType === "Công ty TNHH").length;
  const cpCount = enterprises.filter((b) => b.businessType === "Công ty Cổ phần").length;
  const dntnCount = enterprises.filter((b) => b.businessType === "Doanh nghiệp tư nhân").length;
  const otherCount = enterprises.filter(
    (b) => b.businessType === "Cơ sở kinh doanh khác" || (!b.businessType && isEnterpriseEntity(b))
  ).length;

  const totalEmployees = enterprises.reduce((sum, b) => sum + (b.employeeCount || 0), 0);
  const totalForeignWorkers = enterprises.reduce(
    (sum, b) => sum + (b.foreignWorkersCount || (b.foreignWorkers?.length || 0)),
    0
  );
  const totalSupportNeeds = enterprises.filter(
    (b) => (b.supportNeeds && b.supportNeeds.length > 0) || Boolean(b.supportNotes)
  ).length;

  const scaleMicro = enterprises.filter((b) => getEnterpriseScaleLabel(b) === "Siêu nhỏ (< 5 LĐ)").length;
  const scaleSmall = enterprises.filter((b) => getEnterpriseScaleLabel(b) === "Nhỏ (5 - 20 LĐ)").length;
  const scaleMedium = enterprises.filter((b) => getEnterpriseScaleLabel(b) === "Vừa (20 - 50 LĐ)").length;
  const scaleLarge = enterprises.filter((b) => getEnterpriseScaleLabel(b) === "Lớn (> 50 LĐ)").length;

  // GIS Navigation handler
  const handleDirections = (ent: Business) => {
    let coords = ent.coordinates;
    if (!coords || !parseGisCoords(coords)) {
      const autoGeo = generateDefaultCoordinatesForAddress(ent.address, ent.id);
      coords = autoGeo.dms;
      updateBusinessesList(businesses.map((b) => (b.id === ent.id ? { ...b, coordinates: coords } : b)));
    }
    if (onNavigateToGis) {
      onNavigateToGis({
        id: ent.id,
        type: "enterprise",
        name: ent.name,
        address: ent.address,
        coordinates: coords,
        navigateRoute: true
      });
      showToast(`Đang chuyển hướng dẫn đường tới ${ent.name}...`, "info");
    }
  };

  const openPinModal = (ent: Business) => {
    setGisPinModalEnterprise(ent);
    if (ent.coordinates) {
      setGisPinInput(ent.coordinates);
    } else {
      const auto = generateDefaultCoordinatesForAddress(ent.address, ent.id);
      setGisPinInput(auto.dms);
    }
  };

  const handleSavePinCoordinates = (andNavigate: boolean = false) => {
    if (!gisPinModalEnterprise) return;
    const finalCoord = gisPinInput.trim();
    if (!finalCoord) {
      showToast("Vui lòng nhập hoặc chọn tọa độ GIS!", "error");
      return;
    }

    const updated = { ...gisPinModalEnterprise, coordinates: finalCoord };
    updateBusinessesList(businesses.map((b) => (b.id === updated.id ? updated : b)));
    if (selectedEnterprise && selectedEnterprise.id === updated.id) {
      setSelectedEnterprise(updated);
    }
    setGisPinModalEnterprise(null);

    if (andNavigate && onNavigateToGis) {
      onNavigateToGis({
        id: updated.id,
        type: "enterprise",
        name: updated.name,
        address: updated.address,
        coordinates: finalCoord,
        navigateRoute: true
      });
      showToast(`Đã lưu và mở dẫn đường GIS ${updated.name}!`, "success");
    } else {
      showToast(`Đã đồng bộ tọa độ ${updated.name} lên bản đồ GIS!`, "success");
    }
  };

  // Open Detail Page
  const handleOpenDetailModal = (ent: Business) => {
    setSelectedEnterprise(ent);
    setViewingEnterpriseDetailId(ent.id);
    navigate(`/dashboard/enterprises/${encodeURIComponent(ent.id)}`);
  };

  // Điều hướng sang trang Chỉnh sửa hồ sơ tại src/page (EditBusinessPage)
  const handleOpenEditModal = (ent: Business) => {
    setSelectedEnterprise(ent);
    navigate(`/edit_bussiness/${encodeURIComponent(ent.id)}`);
  };

  // Handle Update Business Status
  const handleChangeStatus = (status: Business["status"]) => {
    if (!selectedEnterprise) return;
    onUpdateStatus(selectedEnterprise.id, status);
    showToast(`Đã cập nhật trạng thái doanh nghiệp: ${status}`, "success");
  };

  // Handle Delete Enterprise
  const handleDeleteEnterprise = () => {
    if (!selectedEnterprise) return;
    if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ doanh nghiệp "${selectedEnterprise.name}" khỏi hệ thống?`)) {
      updateBusinessesList(businesses.filter((b) => b.id !== selectedEnterprise.id));
      setShowDetailModal(false);
      showToast("Đã xóa hồ sơ doanh nghiệp thành công", "success");
    }
  };

  // Handle Create Enterprise
  const handleCreateEnterprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast("Vui lòng nhập tên doanh nghiệp!", "warning");
      return;
    }

    const nextId = "B" + (businesses.length + 1).toString().padStart(3, "0");
    const code = newInternalCode.trim() || `DN-KP3-${nextId}`;

    const newEnt: Business = {
      id: nextId,
      internalCode: code,
      name: newName.trim(),
      taxCode: newTaxCode.trim() || "03" + Math.floor(10000000 + Math.random() * 90000000),
      businessType: newBusinessType,
      enterpriseScale: newEnterpriseScale,
      type: newType.trim() || "Dịch vụ thương mại",
      industryGroup: "Kinh doanh & Dịch vụ",
      owner: newLegalRep.trim() || "Chưa cập nhật",
      phone: newLegalRepPhone.trim() || "0900000000",
      address: newAddress.trim() || "Lương Định Của, Phường An Phú",
      licenseNumber: `GP-DN-${nextId}/AP`,
      status: "Đang hoạt động",
      startDate: newStartDate,
      verificationSource: "Ban Điều hành & Chi bộ KP3 ghi nhận",
      streetArea: newStreetArea,
      premisesType: newPremisesType,
      premisesOwner: newPremisesOwner.trim(),
      premisesOwnerPhone: newPremisesOwnerPhone.trim(),
      linkedHouseholdCode: newLinkedHouseholdCode.trim(),
      legalRepresentative: newLegalRep.trim() || "Chưa cập nhật",
      legalRepPhone: newLegalRepPhone.trim(),
      legalRepEmail: newLegalRepEmail.trim(),
      siteManager: newSiteManager.trim(),
      siteManagerPhone: newSiteManagerPhone.trim(),
      focalPointName: newFocalPointName.trim() || newLegalRep.trim(),
      focalPointPhone: newFocalPointPhone.trim() || newLegalRepPhone.trim(),
      focalPointRole: newFocalPointRole.trim(),
      employeeCount: newEmployeeCount || 1,
      localWorkersCount: newLocalWorkers,
      temporaryWorkersCount: newTemporaryWorkers,
      foreignWorkersCount: newForeignWorkersCount,
      supportNeeds: newSupportNeeds,
      supportNotes: newSupportNotes.trim(),
      safetyCertified: true,
      image: newImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      images:
        newAdditionalImages.length > 0
          ? newImage
            ? [newImage, ...newAdditionalImages]
            : newAdditionalImages
          : newImage
          ? [newImage]
          : [],
      changeHistory: [
        {
          id: `CHG-${nextId}-INIT`,
          date: new Date().toLocaleDateString("vi-VN"),
          type: "Mở mới",
          description: `Ghi nhận thành lập & đăng ký hoạt động doanh nghiệp trên địa bàn KP3`,
          recordedBy: "Cán bộ quản trị địa bàn"
        }
      ]
    };

    updateBusinessesList([newEnt, ...businesses]);
    setShowAddModal(false);
    showToast(`Đã thêm mới doanh nghiệp "${newEnt.name}" thành công!`, "success");

    // Reset fields
    setNewName("");
    setNewInternalCode("");
    setNewTaxCode("");
    setNewAddress("");
    setNewLegalRep("");
    setNewLegalRepPhone("");
    setNewLegalRepEmail("");
    setNewSiteManager("");
    setNewFocalPointName("");
    setNewFocalPointPhone("");
    setNewSupportNeeds([]);
    setNewSupportNotes("");
    setNewImage("");
    setNewAdditionalImages([]);
  };

  // Handle Update Enterprise
  const handleUpdateEnterprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnterprise) return;

    const finalImage = editImage || selectedEnterprise.image;
    const finalImages =
      editImages.length > 0
        ? editImages
        : finalImage
        ? [finalImage]
        : selectedEnterprise.images || [];

    const updated: Business = {
      ...selectedEnterprise,
      name: editName.trim(),
      internalCode: editInternalCode.trim(),
      taxCode: editTaxCode.trim(),
      businessType: editBusinessType,
      enterpriseScale: editEnterpriseScale,
      type: editType.trim(),
      startDate: editStartDate,
      address: editAddress.trim(),
      streetArea: editStreetArea,
      premisesType: editPremisesType,
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
      employeeCount: editEmployeeCount,
      localWorkersCount: editLocalWorkers,
      temporaryWorkersCount: editTemporaryWorkers,
      foreignWorkersCount: editForeignWorkersCount,
      supportNeeds: editSupportNeeds,
      supportNotes: editSupportNotes.trim(),
      image: finalImage,
      images: finalImages
    };

    updateBusinessesList(businesses.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedEnterprise(updated);
    setShowEditModal(false);
    showToast(`Đã cập nhật hồ sơ doanh nghiệp "${updated.name}" thành công!`, "success");
  };

  // Direct change avatar photo
  const handleChangeAvatarPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEnterprise || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newImg = reader.result as string;
      const existingImages = selectedEnterprise.images || (selectedEnterprise.image ? [selectedEnterprise.image] : []);
      const updatedImages = existingImages.includes(newImg) ? existingImages : [newImg, ...existingImages];
      const updated: Business = {
        ...selectedEnterprise,
        image: newImg,
        images: updatedImages
      };
      updateBusinessesList(businesses.map((b) => (b.id === selectedEnterprise.id ? updated : b)));
      setSelectedEnterprise(updated);
      showToast("Đã cập nhật ảnh đại diện doanh nghiệp!", "success");
    };
    reader.readAsDataURL(file);
  };

  // Direct upload photo to gallery
  const handleAddGalleryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEnterprise || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newImg = reader.result as string;
      const existing = selectedEnterprise.images || (selectedEnterprise.image ? [selectedEnterprise.image] : []);
      const updatedImages = [...existing, newImg];
      const updated: Business = {
        ...selectedEnterprise,
        images: updatedImages
      };
      updateBusinessesList(businesses.map((b) => (b.id === selectedEnterprise.id ? updated : b)));
      setSelectedEnterprise(updated);
      showToast("Đã thêm ảnh vào album cơ sở!", "success");
    };
    reader.readAsDataURL(file);
  };

  // Remove photo from gallery
  const handleRemoveGalleryPhoto = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedEnterprise) return;
    const existing = selectedEnterprise.images || (selectedEnterprise.image ? [selectedEnterprise.image] : []);
    const updatedImages = existing.filter((_, idx) => idx !== indexToRemove);
    const updated: Business = {
      ...selectedEnterprise,
      images: updatedImages,
      image: selectedEnterprise.image === existing[indexToRemove] ? updatedImages[0] || "" : selectedEnterprise.image
    };
    updateBusinessesList(businesses.map((b) => (b.id === selectedEnterprise.id ? updated : b)));
    setSelectedEnterprise(updated);
    showToast("Đã xóa ảnh khỏi album!", "success");
  };

  // Save Change Log
  const handleSaveChangeLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnterprise) return;
    if (!changeDesc.trim()) {
      showToast("Vui lòng nhập nội dung biến động!", "warning");
      return;
    }

    const [yyyy, mm, dd] = changeDate.includes("-") ? changeDate.split("-") : ["2026", "10", "10"];
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    const newLog: BusinessChangeLog = {
      id: `CHG-${selectedEnterprise.id}-${Date.now().toString().slice(-4)}`,
      date: formattedDate,
      type: changeType,
      description: changeDesc.trim(),
      recordedBy: changeRecorder.trim() || "Cán bộ KP3"
    };

    const updatedHistory = [newLog, ...(selectedEnterprise.changeHistory || [])];
    const updated: Business = {
      ...selectedEnterprise,
      changeHistory: updatedHistory,
      status:
        changeType === "Tạm ngừng"
          ? "Tạm ngưng"
          : changeType === "Hoạt động trở lại"
          ? "Đang hoạt động"
          : selectedEnterprise.status
    };

    updateBusinessesList(businesses.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedEnterprise(updated);
    setShowChangeLogModal(false);
    setChangeDesc("");
    showToast("Đã ghi nhận biến động doanh nghiệp thành công!", "success");
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = [
      "Mã nội bộ",
      "Tên Doanh nghiệp",
      "Mã số thuế",
      "Loại hình tổ chức",
      "Quy mô lao động (NĐ 80)",
      "Lĩnh vực hoạt động",
      "Địa chỉ trụ sở",
      "Tuyến đường",
      "Loại mặt bằng",
      "Người đại diện pháp luật",
      "SĐT đại diện",
      "Email công vụ",
      "Người quản lý tại chỗ",
      "Đầu mối phối hợp địa phương",
      "SĐT đầu mối công vụ",
      "Lao động thường trú",
      "Lao động tạm trú",
      "Lao động nước ngoài",
      "Trạng thái hoạt động",
      "Nhu cầu hỗ trợ",
      "Kiến nghị khó khăn"
    ];

    const rows = enterprises.map((b) => [
      `"${b.internalCode || `DN-KP3-${b.id}`}"`,
      `"${b.name.replace(/"/g, '""')}"`,
      `"${b.taxCode || ""}"`,
      `"${b.businessType || "Công ty TNHH"}"`,
      `"${getEnterpriseScaleLabel(b)}"`,
      `"${b.type}"`,
      `"${b.address.replace(/"/g, '""')}"`,
      `"${b.streetArea || (b.address.includes("42") ? "Hẻm 42 Lương Định Của" : "Mặt tiền Lương Định Của")}"`,
      `"${b.premisesType || "Văn phòng"}"`,
      `"${b.legalRepresentative || b.owner}"`,
      `"${b.legalRepPhone || b.phone}"`,
      `"${b.legalRepEmail || ""}"`,
      `"${b.siteManager || b.owner}"`,
      `"${b.focalPointName || b.owner}"`,
      `"${b.focalPointPhone || b.phone}"`,
      b.localWorkersCount ?? Math.floor((b.employeeCount || 2) / 2),
      b.temporaryWorkersCount ?? Math.ceil((b.employeeCount || 2) / 2),
      b.foreignWorkersCount || (b.foreignWorkers?.length || 0),
      `"${b.status}"`,
      `"${(b.supportNeeds || []).join("; ")}"`,
      `"${(b.supportNotes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_Doanh_nghiep_DNNVV_KP3_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất file báo cáo doanh nghiệp KP3 thành công!", "success");
  };

  // SUBPAGE ROUTE RENDERING: ADD ENTERPRISE PAGE (src/page/AddShowPage)
  if (isAddEnterpriseRoute) {
    return (
      <AddShowPage
        households={households}
        businesses={businesses}
        onAdd={(newBusiness) => {
          updateBusinessesList([newBusiness, ...businesses]);
          showToast(`Đã thêm mới doanh nghiệp "${newBusiness.name}" thành công!`, "success");
          navigate(ROUTES.DASHBOARD_ENTERPRISES);
        }}
        onBack={() => {
          navigate(ROUTES.DASHBOARD_ENTERPRISES);
        }}
        showToast={showToast}
      />
    );
  }

  // SUBPAGE ROUTE RENDERING: ENTERPRISE DETAIL PAGE
  if (isEnterpriseDetailRoute || viewingEnterpriseDetailId) {
    const targetId = detailPathId || viewingEnterpriseDetailId;
    const targetEnterprise =
      selectedEnterprise?.id === targetId || selectedEnterprise?.taxCode === targetId
        ? selectedEnterprise
        : (enterprises.find(
            (b) =>
              b.id === targetId ||
              b.taxCode === targetId ||
              b.internalCode === targetId
          ) || selectedEnterprise);

    return (
      <EnterpriseDetailPage
        id={targetId || undefined}
        enterprise={targetEnterprise}
        businesses={businesses}
        residents={residents}
        households={households}
        onBack={() => {
          setViewingEnterpriseDetailId(null);
          setSelectedEnterprise(null);
          navigate(ROUTES.DASHBOARD_ENTERPRISES);
        }}
        onEdit={(ent) => {
          handleOpenEditModal(ent);
        }}
        onDelete={(ent) => {
          setSelectedEnterprise(ent);
          handleDeleteEnterprise();
        }}
        onUpdateStatus={onUpdateStatus}
        onUpdateBusinesses={onUpdateBusinesses}
        onNavigateToGis={onNavigateToGis}
        showToast={showToast}
      />
    );
  }

  return (
    <div id="enterprise-management-view" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-emerald-400 border-emerald-500/30"
              : toastMessage.type === "error"
              ? "bg-rose-900 text-rose-200 border-rose-500/40"
              : toastMessage.type === "warning"
              ? "bg-amber-900 text-amber-200 border-amber-500/40"
              : "bg-slate-900 text-slate-100 border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {toastMessage.type === "info" && <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <Card className="border-border bg-white shadow-xs rounded-2xl overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" className="gap-1.5 px-3 py-1 font-semibold text-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Quản Trị Doanh Nghiệp & DNNVV
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground border-slate-200">
                Khu phố 3, Phường An Phú, TP. Hồ Chí Minh
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono font-semibold">
                {enterprises.length} Doanh nghiệp • {totalEmployees} Lao động
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Quản Lý Doanh Nghiệp & Tổ Chức Kinh Tế
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Theo dõi hồ sơ pháp lý, mã số thuế (MST), người đại diện, đầu mối công vụ, lực lượng lao động và phân loại
              quy mô theo Nghị định 80/2021/NĐ-CP trên địa bàn Khu phố 3.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 font-medium shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Download size={14} className="text-slate-600" />
              <span>Xuất Báo Cáo CSV ({enterprises.length})</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(ROUTES.DASHBOARD_ADD_ENTERPRISE)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm cursor-pointer"
              title="Chuyển sang trang tạo lập hồ sơ doanh nghiệp mới (/dashboard/enterprises/add)"
            >
              <Plus size={14} />
              <span>+ Thêm Doanh Nghiệp</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Subsystem Tabs (shadcn UI Tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMainTab("list")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMainTab === "list" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Building2 size={14} className={activeMainTab === "list" ? "text-indigo-600" : "text-slate-400"} />
            <span>Danh mục Doanh nghiệp & DNNVV</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeMainTab === "list" ? "bg-indigo-50 text-indigo-700" : "bg-slate-200 text-slate-600"
              }`}
            >
              {enterprises.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("economicReport")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMainTab === "economicReport"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText size={14} className={activeMainTab === "economicReport" ? "text-white" : "text-slate-400"} />
            <span>Báo cáo Kinh tế Địa bàn & Biến động</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeMainTab === "economicReport" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              Bí thư / Trưởng KP
            </span>
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground hidden lg:flex items-center gap-1.5">
          <Sparkles size={13} className="text-indigo-600" />
          <span>Theo dõi độc lập tổ chức kinh tế, MST, đầu mối công vụ & NĐ 80/2021/NĐ-CP</span>
        </div>
      </div>

      {/* VIEW 1: DANH MỤC DOANH NGHIỆP & HỒ SƠ */}
      {activeMainTab === "list" ? (
        <div className="space-y-5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng Doanh Nghiệp</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-slate-900">{enterprises.length}</span>
                <span className="text-xs text-muted-foreground ml-1.5 font-medium">đơn vị</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">100% có hồ sơ cơ sở</div>
            </Card>

            <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Công ty TNHH</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-blue-900">{tnhhCount}</span>
                <span className="text-xs text-blue-600 font-bold ml-1.5">
                  ({((tnhhCount / (enterprises.length || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Công nghệ, Dịch vụ, Nha khoa</div>
            </Card>

            <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cổ phần & DNTN</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-teal-900">{cpCount + dntnCount}</span>
                <span className="text-xs text-teal-700 font-bold ml-1.5">cơ sở</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Giáo dục, Tân dược, Kỹ thuật</div>
            </Card>

            <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lực Lượng Lao Động</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users2 size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-purple-950">{totalEmployees}</span>
                <span className="text-xs text-purple-700 font-bold ml-1.5">({totalForeignWorkers} NN)</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Thường trú, tạm trú & người nước ngoài</div>
            </Card>

            <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đề Xuất Hỗ Trợ</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HelpCircle size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-amber-950">{totalSupportNeeds}</span>
                <span className="text-xs text-amber-700 font-bold ml-1.5">doanh nghiệp</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Kiến nghị PCCC, An ninh, Môi trường</div>
            </Card>
          </div>

          {/* Search & Filter Toolbar */}
          <Card className="border-border bg-white shadow-2xs rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="enterprise-search-input"
                  name="enterpriseSearchTerm"
                  type="text"
                  placeholder="Tìm theo tên doanh nghiệp, mã nội bộ (DN-KP3-XXX), MST, đại diện pháp luật, địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 text-xs h-9 bg-slate-50/50 border-slate-200 focus:bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === "card" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Xem dạng thẻ"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === "table" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Xem dạng bảng"
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Loại hình DN
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full h-8 px-2.5 border border-input rounded-md bg-white text-slate-700 font-medium text-xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả loại hình</option>
                  <option value="Công ty TNHH">Công ty TNHH</option>
                  <option value="Công ty Cổ phần">Công ty Cổ phần</option>
                  <option value="Doanh nghiệp tư nhân">Doanh nghiệp tư nhân</option>
                  <option value="Cơ sở kinh doanh khác">Cơ sở khác</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Quy mô LĐ (NĐ 80)
                </label>
                <select
                  value={scaleFilter}
                  onChange={(e) => setScaleFilter(e.target.value)}
                  className="w-full h-8 px-2.5 border border-input rounded-md bg-white text-slate-700 font-medium text-xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả quy mô</option>
                  <option value="Siêu nhỏ (< 5 LĐ)">Siêu nhỏ (&lt; 5 LĐ)</option>
                  <option value="Nhỏ (5 - 20 LĐ)">Nhỏ (5 - 20 LĐ)</option>
                  <option value="Vừa (20 - 50 LĐ)">Vừa (20 - 50 LĐ)</option>
                  <option value="Lớn (> 50 LĐ)">Lớn (&gt; 50 LĐ)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Tuyến đường
                </label>
                <select
                  value={streetFilter}
                  onChange={(e) => setStreetFilter(e.target.value)}
                  className="w-full h-8 px-2.5 border border-input rounded-md bg-white text-slate-700 font-medium text-xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả tuyến đường</option>
                  <option value="Mặt tiền Lương Định Của">Mặt tiền Lương Định Của</option>
                  <option value="Hẻm 42 Lương Định Của">Hẻm 42 Lương Định Của</option>
                  <option value="Hẻm 18 Lương Định Của">Hẻm 18 Lương Định Của</option>
                  <option value="Khu dân cư nội bộ KP3">KDC nội bộ KP3</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-8 px-2.5 border border-input rounded-md bg-white text-slate-700 font-medium text-xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="Chờ duyệt">Chờ duyệt</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                  <option value="Chuyển địa điểm">Chuyển địa điểm</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Results Display */}
          {filteredEnterprises.length === 0 ? (
            <Card className="border-border bg-white shadow-2xs rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Không tìm thấy doanh nghiệp phù hợp</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Thử điều chỉnh lại bộ lọc tìm kiếm hoặc thêm mới hồ sơ doanh nghiệp vừa và nhỏ trên địa bàn KP3.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("Tất cả");
                  setScaleFilter("Tất cả");
                  setStreetFilter("Tất cả");
                  setStatusFilter("Tất cả");
                }}
                className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Đặt lại toàn bộ bộ lọc
              </button>
            </Card>
          ) : viewMode === "card" ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedEnterprises.map((ent) => {
                const scale = getEnterpriseScaleLabel(ent);
                const foreigners = ent.foreignWorkersCount || (ent.foreignWorkers?.length || 0);

                return (
                  <Card
                    key={ent.id}
                    onClick={() => handleOpenDetailModal(ent)}
                    className="border-border bg-white shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative h-36 bg-slate-100 overflow-hidden">
                        <img
                          src={ent.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"}
                          alt={ent.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center text-[10px] font-bold">
                          <span className="font-mono bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md border border-white/20">
                            {ent.internalCode || `DN-KP3-${ent.id}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              ent.status === "Đang hoạt động"
                                ? "bg-emerald-500 text-white"
                                : ent.status === "Chờ duyệt"
                                ? "bg-amber-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {ent.status}
                          </span>
                        </div>

                        {/* Bottom Name on image */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                          <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">
                            {ent.businessType || "Công ty TNHH"}
                          </span>
                          <h3 className="font-bold text-sm leading-snug line-clamp-1 text-white">{ent.name}</h3>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 space-y-2.5 text-xs">
                        {/* MST & Scale */}
                        <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-100">
                          <span className="text-muted-foreground font-mono">
                            MST: <strong className="text-slate-800">{ent.taxCode || "Đang xác minh"}</strong>
                          </span>
                          <Badge variant="outline" className="font-semibold text-indigo-700 bg-indigo-50 border-indigo-200 text-[10px]">
                            {scale}
                          </Badge>
                        </div>

                        {/* Representatives */}
                        <div className="space-y-1 text-slate-600">
                          <div className="flex items-center gap-1.5 truncate">
                            <User size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">
                              ĐDPL: <strong className="text-slate-800">{ent.legalRepresentative || ent.owner}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-[11px]">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <span className="font-mono">{ent.legalRepPhone || ent.phone || "Chưa có SĐT"}</span>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-1.5 text-slate-500 text-[11px] pt-1">
                          <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{ent.address}</span>
                        </div>

                        {/* Employees Micro-stat */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            <Users2 size={11} className="text-slate-500" />
                            {ent.employeeCount || 1} LĐ
                          </span>
                          {foreigners > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md">
                              <Globe size={10} /> {foreigners} NN
                            </span>
                          )}
                          {ent.coordinates && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                              <Compass size={10} /> GIS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div
                      className="p-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => handleDirections(ent)}
                          className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                          title="Dẫn đường GIS"
                        >
                          <Navigation size={11} />
                          <span>Dẫn đường</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openPinModal(ent)}
                          className="px-2 border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          title="Ghim tọa độ GIS"
                        >
                          <MapPin size={11} />
                        </Button>
                      </div>

                      <span
                        onClick={() => handleOpenDetailModal(ent)}
                        className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        Hồ sơ ➜
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <Card className="border-border bg-white shadow-2xs rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Danh Sách Doanh Nghiệp Địa Bàn KP3
                  </span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {filteredEnterprises.length} đơn vị
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-slate-200 rounded px-2 py-1 text-xs bg-white cursor-pointer font-medium"
                  >
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>doanh nghiệp/trang</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="w-[180px] font-bold text-slate-700">Mã & Doanh Nghiệp</TableHead>
                    <TableHead className="w-[120px] font-bold text-slate-700">Mã Số Thuế</TableHead>
                    <TableHead className="w-[140px] font-bold text-slate-700">Quy Mô & Lĩnh Vực</TableHead>
                    <TableHead className="min-w-[200px] font-bold text-slate-700">Trụ Sở & Tuyến Đường</TableHead>
                    <TableHead className="min-w-[160px] font-bold text-slate-700">Đại Diện / Đầu Mối</TableHead>
                    <TableHead className="w-[110px] font-bold text-slate-700">Lao Động</TableHead>
                    <TableHead className="w-[120px] font-bold text-slate-700">Tọa Độ GIS</TableHead>
                    <TableHead className="w-[110px] font-bold text-slate-700">Trạng Thái</TableHead>
                    <TableHead className="text-right w-[140px] font-bold text-slate-700">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEnterprises.map((ent) => {
                    const scale = getEnterpriseScaleLabel(ent);
                    const foreigners = ent.foreignWorkersCount || (ent.foreignWorkers?.length || 0);

                    return (
                      <TableRow
                        key={ent.id}
                        onClick={() => handleOpenDetailModal(ent)}
                        className="cursor-pointer transition-colors group hover:bg-slate-50/80"
                      >
                        {/* Name & Code */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground block">
                              {ent.internalCode || `DN-KP3-${ent.id}`}
                            </span>
                            <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-xs line-clamp-1">
                              {ent.name}
                            </span>
                            <span className="text-[10px] text-indigo-600 block">{ent.businessType || "Công ty TNHH"}</span>
                          </div>
                        </TableCell>

                        {/* Tax Code */}
                        <TableCell className="font-mono text-xs font-semibold text-slate-700">
                          {ent.taxCode || "Chưa có"}
                        </TableCell>

                        {/* Scale & Type */}
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700">
                              {scale}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground block truncate">{ent.type}</span>
                          </div>
                        </TableCell>

                        {/* Address */}
                        <TableCell>
                          <div className="flex items-start gap-1.5 text-xs text-slate-700">
                            <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{ent.address}</span>
                          </div>
                        </TableCell>

                        {/* Representative */}
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <span className="font-semibold text-slate-900 block truncate">
                              {ent.legalRepresentative || ent.owner}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground block">
                              {ent.legalRepPhone || ent.phone || "Chưa có SĐT"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Labor */}
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <span className="font-bold text-slate-900">{ent.employeeCount || 1} LĐ</span>
                            {foreigners > 0 && (
                              <span className="text-[10px] font-bold text-purple-700 block">+{foreigners} NN</span>
                            )}
                          </div>
                        </TableCell>

                        {/* GIS */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {ent.coordinates ? (
                            <button
                              type="button"
                              onClick={() => openPinModal(ent)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                              title={ent.coordinates}
                            >
                              <Compass size={11} />
                              <span className="truncate max-w-[80px]">{ent.coordinates}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPinModal(ent)}
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              <Plus size={11} />
                              <span>Ghim GIS</span>
                            </button>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant={
                              ent.status === "Đang hoạt động"
                                ? "success"
                                : ent.status === "Chờ duyệt"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-[10px] font-bold"
                          >
                            {ent.status}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="default"
                              size="xs"
                              onClick={() => handleDirections(ent)}
                              className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                              title="Dẫn đường GIS"
                            >
                              <Navigation size={11} />
                              <span className="hidden sm:inline">Dẫn đường</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenDetailModal(ent)}
                              className="gap-1 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                              title="Xem chi tiết hồ sơ"
                            >
                              <span>Hồ sơ</span>
                              <ChevronRight size={11} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-muted-foreground">
                Hiển thị trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng cộng{" "}
                {filteredEnterprises.length} doanh nghiệp)
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="text-xs h-8 cursor-pointer disabled:opacity-40"
                >
                  Trước
                </Button>

                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                  let pageNum = idx + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + idx;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                  }
                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 text-xs font-bold p-0 cursor-pointer ${
                        currentPage === pageNum ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="text-xs h-8 cursor-pointer disabled:opacity-40"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: BÁO CÁO KINH TẾ ĐỊA BÀN & BIẾN ĐỘNG DOANH NGHIỆP KP3 */
        <div id="enterprise-report-view" className="space-y-6">
          {/* Executive Header Banner */}
          <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <FileText size={20} />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Báo cáo Tình hình Hoạt động Kinh tế & Biến động Doanh nghiệp KP3
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Dành cho Cấp ủy Chi bộ, Trưởng khu phố và Cán bộ phụ trách địa bàn • Cập nhật: Năm 2026
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 font-semibold">
                    ✓ Phục vụ công tác địa bàn KP3
                  </Badge>
                  <span>•</span>
                  <span>Không thay thế hệ thống đăng ký doanh nghiệp, thuế hoặc lao động chuyên ngành</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
                  title="In báo cáo dạng A4 / PDF"
                >
                  <Printer size={14} /> In Báo Cáo
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleExportCSV}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                  title="Xuất file CSV báo cáo toàn diện"
                >
                  <Download size={14} /> Xuất File CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveMainTab("list")}
                  className="gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer"
                >
                  <List size={14} /> Danh Mục Doanh Nghiệp
                </Button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Tổng doanh nghiệp</span>
                <strong className="text-lg font-black text-white block mt-0.5">{enterprises.length}</strong>
                <span className="text-[10px] text-emerald-400 font-semibold">100% có hồ sơ địa bàn</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-indigo-500/40">
                <span className="text-[10px] text-indigo-300 block uppercase font-bold">Công ty TNHH</span>
                <strong className="text-lg font-black text-indigo-200 block mt-0.5">{tnhhCount}</strong>
                <span className="text-[10px] text-indigo-300">
                  {((tnhhCount / (enterprises.length || 1)) * 100).toFixed(0)}% cơ cấu
                </span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-teal-500/40">
                <span className="text-[10px] text-teal-300 block uppercase font-bold">Cổ phần & DNTN</span>
                <strong className="text-lg font-black text-teal-200 block mt-0.5">{cpCount + dntnCount}</strong>
                <span className="text-[10px] text-teal-300">đơn vị độc lập</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-purple-500/40">
                <span className="text-[10px] text-purple-300 block uppercase font-bold">Tổng lao động</span>
                <strong className="text-lg font-black text-purple-200 block mt-0.5">{totalEmployees}</strong>
                <span className="text-[10px] text-purple-300">{totalForeignWorkers} nhân sự nước ngoài</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-amber-500/40">
                <span className="text-[10px] text-amber-300 block uppercase font-bold">Có đề xuất hỗ trợ</span>
                <strong className="text-lg font-black text-amber-200 block mt-0.5">{totalSupportNeeds}</strong>
                <span className="text-[10px] text-amber-300">đề xuất tự nguyện</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 block uppercase font-bold">Đang hoạt động</span>
                <strong className="text-lg font-black text-emerald-200 block mt-0.5">
                  {enterprises.filter((e) => e.status === "Đang hoạt động").length}
                </strong>
                <span className="text-[10px] text-emerald-300">ổn định địa bàn</span>
              </div>
            </div>
          </Card>

          {/* Section 1: Phân bổ Loại hình & Quy mô */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1.1 Phân bổ loại hình */}
            <Card className="border-border bg-white shadow-2xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Building2 size={16} />
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    1. Phân bổ Loại hình Tổ chức Doanh nghiệp
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">{enterprises.length} đơn vị</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Công ty TNHH", count: tnhhCount, color: "bg-indigo-600", desc: "Dịch vụ công nghệ, thương mại, nha khoa" },
                  { label: "Công ty Cổ phần", count: cpCount, color: "bg-blue-600", desc: "Giáo dục mầm non, dịch vụ kỹ thuật" },
                  { label: "Doanh nghiệp tư nhân", count: dntnCount, color: "bg-teal-600", desc: "Hiệu thuốc tân dược, cơ sở độc lập" },
                  { label: "Cơ sở kinh doanh khác", count: otherCount, color: "bg-purple-600", desc: "Chi nhánh, văn phòng giao dịch tại chỗ" }
                ].map((item, idx) => {
                  const pct = ((item.count / (enterprises.length || 1)) * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-[11px]">{item.desc}</span>
                          <strong className="font-mono text-slate-900">
                            {item.count} DN ({pct}%)
                          </strong>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(4, Number(pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 1.2 Phân bổ quy mô lao động */}
            <Card className="border-border bg-white shadow-2xs rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                    <Users2 size={16} />
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    2. Phân loại theo Quy mô Lao động
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Theo NĐ 80/2021/NĐ-CP</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Siêu nhỏ (&lt; 5 LĐ)</span>
                    <Badge variant="success" className="font-mono text-xs font-bold">
                      {scaleMicro} DN
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Hiệu thuốc, văn phòng đại diện nhỏ</p>
                  <div className="text-[10px] font-bold text-slate-400 pt-1">
                    Chiếm {((scaleMicro / (enterprises.length || 1)) * 100).toFixed(0)}% tổng số DN
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-900">Nhỏ (5 - 20 LĐ)</span>
                    <Badge variant="info" className="font-mono text-xs font-bold">
                      {scaleSmall} DN
                    </Badge>
                  </div>
                  <p className="text-[11px] text-indigo-700">Mầm non, công ty dịch vụ IT, nha khoa</p>
                  <div className="text-[10px] font-bold text-indigo-400 pt-1">
                    Chiếm {((scaleSmall / (enterprises.length || 1)) * 100).toFixed(0)}% tổng số DN
                  </div>
                </div>

                <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-teal-900">Vừa (20 - 50 LĐ)</span>
                    <Badge variant="outline" className="font-mono text-xs font-bold border-teal-300 text-teal-700">
                      {scaleMedium} DN
                    </Badge>
                  </div>
                  <p className="text-[11px] text-teal-700">Doanh nghiệp công nghệ, phân phối lớn</p>
                  <div className="text-[10px] font-bold text-teal-400 pt-1">
                    Chiếm {((scaleMedium / (enterprises.length || 1)) * 100).toFixed(0)}% tổng số DN
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Lớn (&gt; 50 LĐ)</span>
                    <Badge variant="secondary" className="font-mono text-xs font-bold">
                      {scaleLarge} DN
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Tập đoàn, trụ sở vùng</p>
                  <div className="text-[10px] font-bold text-slate-400 pt-1">
                    Chiếm {((scaleLarge / (enterprises.length || 1)) * 100).toFixed(0)}% tổng số DN
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL THÊM DOANH NGHIỆP MỚI (shadcn Dialog) */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">Thêm Mới Hồ Sơ Doanh Nghiệp (DNNVV)</h3>
              <p className="text-[10px] text-slate-300 mt-0.5">Địa bàn Khu phố 3, Phường An Phú</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateEnterprise} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tên Doanh nghiệp *</label>
                <Input
                  required
                  placeholder="Công ty TNHH..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Mã số thuế (MST)</label>
                <Input
                  placeholder="03XXXXXXXX"
                  value={newTaxCode}
                  onChange={(e) => setNewTaxCode(e.target.value)}
                  className="font-mono text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Loại hình tổ chức</label>
                <select
                  value={newBusinessType}
                  onChange={(e) => setNewBusinessType(e.target.value as any)}
                  className="w-full h-9 px-2.5 border border-input rounded-md text-xs bg-white cursor-pointer"
                >
                  <option value="Công ty TNHH">Công ty TNHH</option>
                  <option value="Công ty Cổ phần">Công ty Cổ phần</option>
                  <option value="Doanh nghiệp tư nhân">Doanh nghiệp tư nhân</option>
                  <option value="Cơ sở kinh doanh khác">Cơ sở kinh doanh khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Quy mô lao động (NĐ 80)</label>
                <select
                  value={newEnterpriseScale}
                  onChange={(e) => setNewEnterpriseScale(e.target.value as any)}
                  className="w-full h-9 px-2.5 border border-input rounded-md text-xs bg-white cursor-pointer"
                >
                  <option value="Siêu nhỏ (< 5 LĐ)">Siêu nhỏ (&lt; 5 LĐ)</option>
                  <option value="Nhỏ (5 - 20 LĐ)">Nhỏ (5 - 20 LĐ)</option>
                  <option value="Vừa (20 - 50 LĐ)">Vừa (20 - 50 LĐ)</option>
                  <option value="Lớn (> 50 LĐ)">Lớn (&gt; 50 LĐ)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Địa chỉ trụ sở tại KP3 *</label>
              <Input
                required
                placeholder="Số nhà, đường Lương Định Của..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="text-xs bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Người đại diện pháp luật</label>
                <Input
                  placeholder="Họ và tên..."
                  value={newLegalRep}
                  onChange={(e) => setNewLegalRep(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Số điện thoại đại diện</label>
                <Input
                  placeholder="09XXXXXXXX"
                  value={newLegalRepPhone}
                  onChange={(e) => setNewLegalRepPhone(e.target.value)}
                  className="font-mono text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tổng lao động</label>
                <Input
                  type="number"
                  value={newEmployeeCount}
                  onChange={(e) => setNewEmployeeCount(Number(e.target.value))}
                  className="text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">LĐ Thường trú</label>
                <Input
                  type="number"
                  value={newLocalWorkers}
                  onChange={(e) => setNewLocalWorkers(Number(e.target.value))}
                  className="text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">LĐ Nước ngoài</label>
                <Input
                  type="number"
                  value={newForeignWorkersCount}
                  onChange={(e) => setNewForeignWorkersCount(Number(e.target.value))}
                  className="text-xs bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
              >
                Thêm Doanh Nghiệp
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL SỬA DOANH NGHIỆP (shadcn Dialog) */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        {selectedEnterprise && (
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Chỉnh Sửa Hồ Sơ Doanh Nghiệp</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">{selectedEnterprise.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateEnterprise} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Tên Doanh nghiệp</label>
                  <Input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Mã số thuế (MST)</label>
                  <Input
                    value={editTaxCode}
                    onChange={(e) => setEditTaxCode(e.target.value)}
                    className="font-mono text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Địa chỉ trụ sở</label>
                <Input
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Đại diện pháp luật</label>
                  <Input
                    value={editLegalRep}
                    onChange={(e) => setEditLegalRep(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Số điện thoại</label>
                  <Input
                    value={editLegalRepPhone}
                    onChange={(e) => setEditLegalRepPhone(e.target.value)}
                    className="font-mono text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL GHI NHẬN BIẾN ĐỘNG (shadcn Dialog) */}
      <Dialog open={showChangeLogModal} onOpenChange={setShowChangeLogModal}>
        {selectedEnterprise && (
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Ghi Nhận Biến Động Doanh Nghiệp</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">{selectedEnterprise.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeLogModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveChangeLog} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Loại biến động</label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value as any)}
                  className="w-full h-9 px-2.5 border border-input rounded-md text-xs bg-white cursor-pointer"
                >
                  <option value="Mở mới">Mở mới / Thành lập</option>
                  <option value="Đổi tên">Đổi tên / Tái cơ cấu</option>
                  <option value="Tạm ngừng">Tạm ngừng hoạt động</option>
                  <option value="Hoạt động trở lại">Hoạt động trở lại</option>
                  <option value="Chuyển địa điểm">Chuyển địa điểm</option>
                  <option value="Thay đổi đại diện">Thay đổi đại diện pháp luật</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Ngày ghi nhận</label>
                <Input
                  type="date"
                  value={changeDate}
                  onChange={(e) => setChangeDate(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nội dung chi tiết biến động *</label>
                <textarea
                  required
                  placeholder="Ghi rõ lý do tạm ngừng, quyết định chuyển trụ sở, thông tin đại diện mới..."
                  value={changeDesc}
                  onChange={(e) => setChangeDesc(e.target.value)}
                  className="w-full p-2.5 border border-input rounded-lg text-xs bg-white h-20 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangeLogModal(false)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Lưu Biến Động
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL GHIM TỌA ĐỘ GIS (shadcn Dialog) */}
      <Dialog open={Boolean(gisPinModalEnterprise)} onOpenChange={(open) => !open && setGisPinModalEnterprise(null)}>
        {gisPinModalEnterprise && (
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-r from-indigo-800 via-blue-800 to-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-indigo-300" />
                <h3 className="font-black text-sm text-white">Ghim Tọa Độ GIS Doanh Nghiệp</h3>
              </div>
              <button
                type="button"
                onClick={() => setGisPinModalEnterprise(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Trụ sở:</span>
                <p className="font-bold text-slate-900 text-xs mt-0.5">{gisPinModalEnterprise.address}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tọa độ GIS (DMS hoặc Thập phân):</label>
                <Input
                  placeholder="Ví dụ: 10°56'13.2&quot;N 106°44'40.8&quot;E hoặc 10.936997, 106.744645"
                  value={gisPinInput}
                  onChange={(e) => setGisPinInput(e.target.value)}
                  className="font-mono text-xs bg-white"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGisPinModalEnterprise(null)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleSavePinCoordinates(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Lưu Tọa Độ
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* LIGHTBOX PREVIEW MODAL */}
      <Dialog open={Boolean(viewingImagePreview)} onOpenChange={(open) => !open && setViewingImagePreview(null)}>
        {viewingImagePreview && (
          <DialogContent className="max-w-3xl p-2 bg-slate-950 border-slate-800 text-white">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2 pt-1">
                <span className="text-xs font-bold text-slate-300">{viewingImagePreview.caption}</span>
                <button
                  type="button"
                  onClick={() => setViewingImagePreview(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-black">
                <img src={viewingImagePreview.url} alt="Phóng to" className="max-h-[68vh] w-auto object-contain" />
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
