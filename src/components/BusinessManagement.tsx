import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  User,
  Phone,
  MapPin,
  FileText,
  Plus,
  AlertTriangle,
  X,
  LayoutGrid,
  List,
  Building,
  Bed,
  Download,
  Eye,
  Sparkles,
  RefreshCw,
  PieChart,
  TrendingUp,
  Store,
  Navigation,
  Pencil,
  Trash2,
  Upload
} from "lucide-react";
import { Business, BusinessFile, InspectionLog, BusinessChangeLog, Resident, Household, TargetGisItem } from "../types";
import Pagination from "./Pagination";
import * as XLSX from "xlsx";
import {
  isResidentInAccommodation,
  getTemporaryResidenceExpiryStatus,
  autoExtractHostelBusinesses
} from "../utils/householdRecognitionUtils";
import { supabase } from "../lib/supabase";

// shadcn/ui components
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "./ui/table";

// Subcomponents
import {
  INDUSTRY_SECTORS,
  getBusinessIndustryGroup,
  getSectorMeta,
  IndustrySectorDef
} from "./business/businessConstants";
import BusinessDetailPage from "../page/BusinessDetailPage";
import AddShowPage from "../page/AddShowPage";
import EditBusinessPage from "../page/EditBusinessPage";
import { navigate, useCurrentPath } from "../routes";
import BusinessDocumentModal, { ViewingDocState } from "./business/BusinessDocumentModal";
import {
  AddInspectionModal,
  EditInspectionModal,
  AddChangeLogModal,
  DeleteConfirmationDialog
} from "./business/BusinessInspectionModal";

// Re-export constants for external compatibility
export {
  INDUSTRY_SECTORS,
  getBusinessIndustryGroup,
  getSectorMeta
};
export type { IndustrySectorDef };

export interface BusinessManagementProps {
  businesses: Business[];
  residents: Resident[];
  households: Household[];
  onToggleCertification: (id: string) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onUpdateBusinesses?: React.Dispatch<React.SetStateAction<Business[]>>;
  onNavigateToGis?: (item: TargetGisItem) => void;
}

export default function BusinessManagement({
  businesses = [],
  residents = [],
  households = [],
  onToggleCertification,
  onUpdateStatus,
  onUpdateBusinesses,
  onNavigateToGis
}: BusinessManagementProps) {
  // Filters & View Mode
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState("Tất cả");
  const [establishmentFilter, setEstablishmentFilter] = useState<"all" | "household" | "accommodation" | "pccc-pass" | "pccc-fail" | "has-sodo">("all");
  const [pcccFilter, setPcccFilter] = useState("Tất cả");
  const [streetFilter, setStreetFilter] = useState("Tất cả");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Collapsible Industry Statistics
  const [showIndustryStats, setShowIndustryStats] = useState(false);

  const currentPath = useCurrentPath();
  const isAddShow = currentPath === "/addshow" || currentPath === "/dashboard/addshow" || currentPath.endsWith("/addshow");

  // Extract edit business ID if on edit route (/edit_bussiness/:params)
  const editMatch = currentPath.match(/^\/(?:dashboard\/)?edit_buss?iness\/([^/?#]+)/i);
  const editingBusinessId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const isEditBusiness = Boolean(editingBusinessId);

  // Modal States
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // Resolve business being edited
  const businessToEdit = useMemo(() => {
    if (editingBusinessId) {
      return businesses.find(b => b.id === editingBusinessId || b.internalCode === editingBusinessId) || editingBusiness;
    }
    return editingBusiness;
  }, [editingBusinessId, businesses, editingBusiness]);
  const [viewingDoc, setViewingDoc] = useState<ViewingDocState | null>(null);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);

  // Inspection & Change Log States
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [showEditInspectionModal, setShowEditInspectionModal] = useState(false);
  const [editingInspection, setEditingInspection] = useState<InspectionLog | null>(null);
  const [inspectionToDelete, setInspectionToDelete] = useState<InspectionLog | null>(null);
  const [showAddChangeLogModal, setShowAddChangeLogModal] = useState(false);

  // Form states for Inspection
  const [formInspDate, setFormInspDate] = useState("");
  const [formInspResult, setFormInspResult] = useState<"Đạt chuẩn" | "Cảnh cáo" | "Không đạt" | "Yêu cầu khắc phục">("Đạt chuẩn");
  const [formInspInspector, setFormInspInspector] = useState("");
  const [formInspNote, setFormInspNote] = useState("");
  const [formInspRecommendation, setFormInspRecommendation] = useState("");
  const [formInspPenalties, setFormInspPenalties] = useState("");

  // Form states for Change Log
  const [formChangeDate, setFormChangeDate] = useState("");
  const [formChangeType, setFormChangeType] = useState<"Mở mới" | "Chuyển địa điểm" | "Thay đổi ngành nghề" | "Thay đổi người đại diện" | "Tạm ngừng" | "Hoạt động trở lại" | "Khác">("Thay đổi ngành nghề");
  const [formChangeDesc, setFormChangeDesc] = useState("");
  const [formChangeRecordedBy, setFormChangeRecordedBy] = useState("Bí thư Chi bộ / Trưởng KP3");

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" | "info" } | null>(null);
  const [hostelToast, setHostelToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Auto-detect hostels state
  const [isDetectingHostels, setIsDetectingHostels] = useState(false);
  const [isSyncingHostels, setIsSyncingHostels] = useState(false);

  const showToast = (message: string, type: "success" | "warning" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const showHostelToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setHostelToast({ message, type });
    setTimeout(() => setHostelToast(null), 4000);
  };

  // Helper to detect accommodation business
  const isAccommodationBusiness = (b: Business): boolean => {
    if (b.isAccommodation) return true;
    const typeLower = (b.type || "").toLowerCase();
    const nameLower = (b.name || "").toLowerCase();
    return (
      typeLower.includes("nhà trọ") ||
      typeLower.includes("nhà nghỉ") ||
      typeLower.includes("khách sạn") ||
      typeLower.includes("homestay") ||
      typeLower.includes("lưu trú") ||
      nameLower.includes("nhà trọ") ||
      nameLower.includes("nhà nghỉ") ||
      nameLower.includes("khách sạn")
    );
  };

  // KPI Calculations
  const totalAccomCount = useMemo(() => businesses.filter(b => isAccommodationBusiness(b)).length, [businesses]);
  const totalRooms = useMemo(() => businesses.filter(b => isAccommodationBusiness(b)).reduce((acc, b) => acc + (b.soPhong || 0), 0), [businesses]);
  const totalSoDoFiles = useMemo(() => businesses.filter(b => Boolean(b.soDoFile)).length, [businesses]);
  const totalCertifiedPccc = useMemo(() => businesses.filter(b => b.safetyCertified).length, [businesses]);

  // Industry Sector Distribution Stats
  const sectorStats = useMemo(() => {
    const total = businesses.length || 1;
    return INDUSTRY_SECTORS.map(sec => {
      const secBusinesses = businesses.filter(b => getBusinessIndustryGroup(b) === sec.id);
      const count = secBusinesses.length;
      const percentage = (count / total) * 100;
      return {
        ...sec,
        count,
        percentage
      };
    }).sort((a, b) => b.count - a.count);
  }, [businesses]);

  const dominantSector = sectorStats[0];

  // Filter businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        b.name.toLowerCase().includes(term) ||
        b.owner.toLowerCase().includes(term) ||
        b.licenseNumber.toLowerCase().includes(term) ||
        b.address.toLowerCase().includes(term) ||
        (b.industryGroup && b.industryGroup.toLowerCase().includes(term)) ||
        (b.toBanDo && b.toBanDo.includes(term)) ||
        (b.soThua && b.soThua.includes(term)) ||
        (b.internalCode && b.internalCode.toLowerCase().includes(term)) ||
        (b.taxCode && b.taxCode.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // 2. Status filter
      if (statusFilter !== "Tất cả" && b.status !== statusFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter !== "Tất cả") {
        const bGroup = getBusinessIndustryGroup(b);
        if (bGroup !== categoryFilter) return false;
      }

      // 4. Establishment filter
      if (establishmentFilter === "household" && isAccommodationBusiness(b)) return false;
      if (establishmentFilter === "accommodation" && !isAccommodationBusiness(b)) return false;
      if (establishmentFilter === "pccc-pass" && !b.safetyCertified) return false;
      if (establishmentFilter === "pccc-fail" && b.safetyCertified) return false;
      if (establishmentFilter === "has-sodo" && !b.soDoFile) return false;

      // 5. PCCC filter
      if (pcccFilter === "Đạt chuẩn" && !b.safetyCertified) return false;
      if (pcccFilter === "Chưa đạt" && b.safetyCertified) return false;

      // 6. Street filter
      if (streetFilter !== "Tất cả") {
        if (streetFilter === "Mặt tiền Lương Định Của" && !b.address.toLowerCase().includes("lương định của")) return false;
        if (streetFilter === "Hẻm 42 Lương Định Của" && !b.address.toLowerCase().includes("42")) return false;
        if (streetFilter === "Hẻm 18 Lương Định Của" && !b.address.toLowerCase().includes("18")) return false;
      }

      return true;
    });
  }, [businesses, searchTerm, statusFilter, categoryFilter, establishmentFilter, pcccFilter, streetFilter]);

  // Paginated businesses
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBusinesses.slice(start, start + itemsPerPage);
  }, [filteredBusinesses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage) || 1;

  // Auto-detect Hostels from Residents
  const handleAutoDetectHostels = () => {
    setIsDetectingHostels(true);
    try {
      const extracted = autoExtractHostelBusinesses(residents, businesses);
      if (extracted.length === 0) {
        showHostelToast("Hệ thống đã nhận diện đầy đủ tất cả cơ sở trọ từ dữ liệu cư dân KP3!", "info");
        return;
      }
      const updated = [...businesses, ...extracted];
      if (onUpdateBusinesses) {
        onUpdateBusinesses(updated);
      }
      showHostelToast(`Đã tự động nhận diện và liên kết thành công ${extracted.length} cơ sở nhà trọ từ dữ liệu cư dân KP3!`, "success");
    } catch (err: any) {
      showHostelToast(`Lỗi nhận diện cơ sở trọ: ${err.message}`, "error");
    } finally {
      setIsDetectingHostels(false);
    }
  };

  // Sync Hostels to Supabase
  const handleSyncHostelsToSupabase = async () => {
    if (!supabase) {
      showHostelToast("Chưa kết nối CSDL Supabase", "error");
      return;
    }
    setIsSyncingHostels(true);
    try {
      const hostelsToSync = businesses.filter(b => isAccommodationBusiness(b));
      const rows = hostelsToSync.map(b => {
        const isValidUuid = b.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id);
        const item: any = {
          name: b.name,
          tax_code: b.taxCode || "",
          business_type: b.businessType || "Hộ kinh doanh",
          industry_group: b.industryGroup || "Lưu trú & Cho thuê",
          owner_name: b.owner,
          phone: b.phone,
          address: b.address,
          license_number: b.licenseNumber,
          status: b.status,
          safety_certified: b.safetyCertified,
          employee_count: b.employeeCount || 1,
          coordinates: b.coordinates,
          is_accommodation: true,
          room_count: b.soPhong || 0,
          guest_count: b.soNguoiLuuTru || 0,
          internal_code: b.internalCode || `HKD-KP3-${b.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 15)}`,
          image_url: b.image
        };
        if (isValidUuid) {
          item.id = b.id;
        }
        return item;
      });

      const { error } = await (supabase as any)
        .from("businesses")
        .upsert(rows, { onConflict: "internal_code" });

      if (error) throw error;
      showHostelToast(`Đã lưu vĩnh viễn ${hostelsToSync.length} cơ sở lưu trú vào CSDL Supabase!`, "success");
    } catch (err: any) {
      showHostelToast(`Lỗi đồng bộ Supabase: ${err.message}`, "error");
    } finally {
      setIsSyncingHostels(false);
    }
  };

  // Export CSV
  const handleExportBusinessesCsv = () => {
    if (businesses.length === 0) {
      showToast("Không có dữ liệu cơ sở kinh doanh để xuất file!", "warning");
      return;
    }

    const headers = [
      "Mã hồ sơ",
      "Tên cơ sở kinh doanh",
      "Loại hình",
      "Nhóm ngành nghề",
      "Chủ sở hữu / Đại diện",
      "Số điện thoại",
      "Địa chỉ",
      "Số Giấy phép KD / Mã số thuế",
      "Tờ bản đồ",
      "Số thửa",
      "Diện tích m2",
      "Loại đất",
      "Cơ sở lưu trú",
      "Số phòng",
      "Số tầng",
      "Số người lưu trú",
      "Đạt chuẩn PCCC",
      "Trạng thái hoạt động"
    ];

    const rows = businesses.map(b => [
      `"${b.internalCode || b.licenseNumber || ""}"`,
      `"${b.name || ""}"`,
      `"${b.businessType || b.type || ""}"`,
      `"${b.industryGroup || getBusinessIndustryGroup(b)}"`,
      `"${b.owner || ""}"`,
      `"${b.phone || ""}"`,
      `"${b.address || ""}"`,
      `"${b.taxCode || b.licenseNumber || ""}"`,
      `"${b.toBanDo || ""}"`,
      `"${b.soThua || ""}"`,
      `"${b.dienTich || ""}"`,
      `"${b.loaiDat || ""}"`,
      `"${isAccommodationBusiness(b) ? "Có" : "Không"}"`,
      `"${b.soPhong || 0}"`,
      `"${b.soTang || 0}"`,
      `"${b.soNguoiLuuTru || 0}"`,
      `"${b.safetyCertified ? "Đạt chuẩn" : "Chưa đạt"}"`,
      `"${b.status || ""}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Danh_sach_Co_so_Kinh_doanh_KP3_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất danh sách cơ sở kinh doanh KP3 thành công!", "success");
  };

  // Export Hostel Residents to Excel
  const handleExportHostelResidents = (bus: Business, hostelResidents: Resident[]) => {
    if (!hostelResidents || hostelResidents.length === 0) {
      showToast("Không có dữ liệu người lưu trú để xuất file!", "warning");
      return;
    }

    const exportRows = hostelResidents.map((r, i) => {
      const expStatus = getTemporaryResidenceExpiryStatus(r.temporaryExpDate);
      return {
        "STT": i + 1,
        "Họ và tên": r.fullName,
        "Giới tính": r.gender,
        "Ngày sinh": r.birthDate,
        "Số CCCD / Định danh": r.cccd,
        "Số điện thoại": r.phone || "Chưa cập nhật",
        "Nơi thường trú gốc (Quê quán)": r.permanentAddress || r.hometown || "Chưa cập nhật",
        "Chỗ ở hiện tại / Tạm trú": r.currentAddress || r.address,
        "Ngày đăng ký tạm trú": r.temporaryRegDate || "Chưa cập nhật",
        "Ngày hết hạn tạm trú": r.temporaryExpDate || "Chưa cập nhật",
        "Tình trạng thời hạn": expStatus.label,
        "Cơ sở lưu trú": bus.name,
        "Chủ cơ sở": bus.owner,
        "SĐT chủ cơ sở": bus.phone,
        "Địa chỉ cơ sở": bus.address
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_cu_dan_luu_tru");
    const fileName = `DS_LuuTru_${bus.name.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Sample default inspections
  const defaultSampleInspections: InspectionLog[] = [
    {
      id: "INSP-01",
      date: "05/06/2026",
      result: "Đạt chuẩn",
      inspector: "Đoàn liên ngành Phường An Phú",
      note: "Kiểm tra vệ sinh an toàn thực phẩm và điều kiện hoạt động. Cơ sở sạch sẽ, trang bị đủ bình chữa cháy CO2 và bột.",
      recommendation: "Tiếp tục duy trì vệ sinh định kỳ và lưu trữ hóa đơn nguyên liệu."
    },
    {
      id: "INSP-02",
      date: "15/04/2026",
      result: "Cảnh cáo",
      inspector: "Cảnh sát Phòng cháy Chữa cháy & CNCH",
      note: "Bình chữa cháy MFZ4 áp kế kim chỉ vạch đỏ hết hạn nạp. Lối thoát nạn phụ có để vật cản hàng hóa.",
      recommendation: "Yêu cầu nạp sạc lại bình chữa cháy và giải phóng hành lang thoát hiểm trong 7 ngày.",
      penalties: "Lập biên bản nhắc nhở, cảnh cáo lần 1"
    },
    {
      id: "INSP-03",
      date: "10/02/2026",
      result: "Đạt chuẩn",
      inspector: "Công an khu vực Phường An Phú",
      note: "Kiểm tra tạm trú cho nhân viên và khách lưu trú. Đầy đủ sổ sách và khai báo định danh VNeID theo quy định."
    }
  ];

  const getBusinessInspections = (b: Business | null): InspectionLog[] => {
    if (!b) return [];
    if (b.inspections && Array.isArray(b.inspections)) {
      return b.inspections;
    }
    return defaultSampleInspections.map((item, index) => ({
      ...item,
      id: `INSP-${b.id}-${index + 1}`
    }));
  };

  // Add / Edit / Delete Inspection Handlers
  const handleOpenAddInspection = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormInspDate(today);
    setFormInspInspector("Đoàn liên ngành Phường An Phú");
    setFormInspResult("Đạt chuẩn");
    setFormInspNote("");
    setFormInspRecommendation("");
    setFormInspPenalties("");
    setShowAddInspectionModal(true);
  };

  const handleSaveAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    if (!formInspInspector.trim()) {
      showToast("Vui lòng nhập tên Đoàn / Cán bộ kiểm tra!", "error");
      return;
    }
    if (!formInspNote.trim()) {
      showToast("Vui lòng nhập nội dung biên bản kiểm tra!", "error");
      return;
    }

    const [yyyy, mm, dd] = formInspDate.includes("-") ? formInspDate.split("-") : ["2026", "06", "05"];
    const displayDate = `${dd}/${mm}/${yyyy}`;

    const newInspection: InspectionLog = {
      id: `INSP-${selectedBusiness.id}-${Date.now().toString().slice(-4)}`,
      date: displayDate,
      result: formInspResult,
      inspector: formInspInspector.trim(),
      note: formInspNote.trim(),
      recommendation: formInspRecommendation.trim() || undefined,
      penalties: formInspPenalties.trim() || undefined
    };

    const currentList = getBusinessInspections(selectedBusiness);
    const updatedList = [newInspection, ...currentList];
    const updatedB: Business = {
      ...selectedBusiness,
      inspections: updatedList
    };

    setSelectedBusiness(updatedB);
    if (onUpdateBusinesses) {
      onUpdateBusinesses(businesses.map(b => b.id === selectedBusiness.id ? updatedB : b));
    }
    setShowAddInspectionModal(false);
    showToast("Đã thêm biên bản kiểm tra định kỳ mới thành công!", "success");
  };

  const handleOpenEditInspection = (inspect: InspectionLog) => {
    setEditingInspection(inspect);
    let dateVal = inspect.date;
    if (inspect.date.includes("/")) {
      const parts = inspect.date.split("/");
      if (parts.length === 3) {
        dateVal = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    setFormInspDate(dateVal);
    setFormInspInspector(inspect.inspector);
    setFormInspResult(inspect.result);
    setFormInspNote(inspect.note);
    setFormInspRecommendation(inspect.recommendation || "");
    setFormInspPenalties(inspect.penalties || "");
    setShowEditInspectionModal(true);
  };

  const handleSaveEditInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !editingInspection) return;
    if (!formInspInspector.trim()) {
      showToast("Vui lòng nhập tên Đoàn / Cán bộ kiểm tra!", "error");
      return;
    }
    if (!formInspNote.trim()) {
      showToast("Vui lòng nhập nội dung biên bản kiểm tra!", "error");
      return;
    }

    const [yyyy, mm, dd] = formInspDate.includes("-") ? formInspDate.split("-") : ["2026", "06", "05"];
    const displayDate = `${dd}/${mm}/${yyyy}`;

    const currentList = getBusinessInspections(selectedBusiness);
    const updatedList = currentList.map(item => {
      if (item.id === editingInspection.id) {
        return {
          ...item,
          date: displayDate || item.date,
          result: formInspResult,
          inspector: formInspInspector.trim(),
          note: formInspNote.trim(),
          recommendation: formInspRecommendation.trim() || undefined,
          penalties: formInspPenalties.trim() || undefined
        };
      }
      return item;
    });

    const updatedB: Business = {
      ...selectedBusiness,
      inspections: updatedList
    };

    setSelectedBusiness(updatedB);
    if (onUpdateBusinesses) {
      onUpdateBusinesses(businesses.map(b => b.id === selectedBusiness.id ? updatedB : b));
    }
    setShowEditInspectionModal(false);
    showToast("Đã cập nhật biên bản kiểm tra thành công!", "success");
  };

  const handleExecuteDeleteInspection = () => {
    if (!selectedBusiness || !inspectionToDelete) return;
    const currentList = getBusinessInspections(selectedBusiness);
    const updatedList = currentList.filter(item => item.id !== inspectionToDelete.id);
    const updatedB: Business = {
      ...selectedBusiness,
      inspections: updatedList
    };

    setSelectedBusiness(updatedB);
    if (onUpdateBusinesses) {
      onUpdateBusinesses(businesses.map(b => b.id === selectedBusiness.id ? updatedB : b));
    }
    setInspectionToDelete(null);
    showToast("Đã xóa biên bản kiểm tra thành công!", "success");
  };

  // Change Log Handlers
  const handleOpenAddChangeLog = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormChangeDate(today);
    setFormChangeType("Thay đổi ngành nghề");
    setFormChangeDesc("");
    setFormChangeRecordedBy("Bí thư Chi bộ / Trưởng KP3");
    setShowAddChangeLogModal(true);
  };

  const handleSaveChangeLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    if (!formChangeDesc.trim()) {
      showToast("Vui lòng nhập nội dung biến động!", "warning");
      return;
    }

    const [yyyy, mm, dd] = formChangeDate.includes("-") ? formChangeDate.split("-") : ["2026", "10", "10"];
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    const newLog: BusinessChangeLog = {
      id: `CHG-${selectedBusiness.id}-${Date.now().toString().slice(-4)}`,
      date: formattedDate,
      type: formChangeType,
      description: formChangeDesc.trim(),
      recordedBy: formChangeRecordedBy.trim() || "Ban Điều hành KP3"
    };

    const updatedLogs = [newLog, ...(selectedBusiness.changeHistory || [])];
    const updatedBusiness: Business = {
      ...selectedBusiness,
      changeHistory: updatedLogs
    };

    if (onUpdateBusinesses) {
      onUpdateBusinesses(businesses.map(b => b.id === selectedBusiness.id ? updatedBusiness : b));
    }
    setSelectedBusiness(updatedBusiness);
    setShowAddChangeLogModal(false);
    showToast("Đã ghi nhận biến động cơ sở kinh doanh thành công!", "success");
  };

  // Add / Edit / Delete Business Handlers
  const handleCreateBusiness = (newBusiness: Business) => {
    const updated = [newBusiness, ...businesses];
    if (onUpdateBusinesses) {
      onUpdateBusinesses(updated);
    }
    showToast(`Đã thêm mới cơ sở "${newBusiness.name}" thành công!`, "success");
  };

  const handleOpenEditModal = (b: Business) => {
    setEditingBusiness(b);
    navigate(`/edit_bussiness/${encodeURIComponent(b.id)}`);
  };

  const handleSaveEditBusiness = (updated: Business) => {
    const list = businesses.map(b => b.id === updated.id ? updated : b);
    if (onUpdateBusinesses) {
      onUpdateBusinesses(list);
    }
    if (selectedBusiness && selectedBusiness.id === updated.id) {
      setSelectedBusiness(updated);
    }
    showToast(`Đã cập nhật thông tin cơ sở "${updated.name}" thành công!`, "success");
  };

  const executeDeleteBusiness = (id: string) => {
    const updated = businesses.filter(b => b.id !== id);
    if (onUpdateBusinesses) {
      onUpdateBusinesses(updated);
    }
    if (selectedBusiness && selectedBusiness.id === id) {
      setSelectedBusiness(null);
      setShowDetailModal(false);
    }
    setBusinessToDelete(null);
    showToast("Đã xóa cơ sở kinh doanh thành công!", "success");
  };

  const handleOpenDetailModal = (b: Business) => {
    setSelectedBusiness(b);
    setShowDetailModal(true);
  };

  // Keep selectedBusiness in sync with businesses state
  const currentSelectedBusiness = useMemo(() => {
    if (!selectedBusiness || !showDetailModal) return null;
    return businesses.find(b => b.id === selectedBusiness.id) || selectedBusiness;
  }, [businesses, selectedBusiness, showDetailModal]);

  return (
    <div id="business-management-view" className="space-y-6 relative">
      {/* Toast hostel notification */}
      {hostelToast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold border transition-all animate-bounce ${
          hostelToast.type === "success"
            ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
            : hostelToast.type === "info"
            ? "bg-primary text-primary-foreground border-primary/20 shadow-primary/20"
            : "bg-destructive text-destructive-foreground border-destructive/20 shadow-destructive/20"
        }`}>
          <Sparkles size={16} />
          <span>{hostelToast.message}</span>
        </div>
      )}

      {isEditBusiness ? (
        <EditBusinessPage
          id={editingBusinessId || undefined}
          business={businessToEdit}
          businesses={businesses}
          households={households}
          onSave={(updated) => {
            handleSaveEditBusiness(updated);
            navigate("/dashboard/businesses");
          }}
          onBack={() => {
            navigate("/dashboard/businesses");
          }}
          showToast={showToast}
        />
      ) : isAddShow ? (
        <AddShowPage
          households={households}
          businesses={businesses}
          onAdd={handleCreateBusiness}
          onBack={() => {
            navigate("/dashboard/businesses");
          }}
          showToast={showToast}
        />
      ) : currentSelectedBusiness ? (
        <BusinessDetailPage
          business={currentSelectedBusiness}
          onBack={() => {
            setSelectedBusiness(null);
            setShowDetailModal(false);
          }}
          onEdit={(b) => handleOpenEditModal(b)}
          onDelete={(b) => setBusinessToDelete(b)}
          onUpdateStatus={(id, status) => {
            onUpdateStatus(id, status);
            setSelectedBusiness((prev) => prev && prev.id === id ? { ...prev, status } : prev);
          }}
          onUpdateBusinesses={onUpdateBusinesses}
          residents={residents}
          households={households}
          onViewDoc={(doc) => setViewingDoc(doc)}
          onNavigateToGis={onNavigateToGis}
          onOpenAddInspection={handleOpenAddInspection}
          onOpenEditInspection={handleOpenEditInspection}
          onDeleteInspection={(insp) => setInspectionToDelete(insp)}
          onOpenAddChangeLog={handleOpenAddChangeLog}
          onExportHostelResidents={handleExportHostelResidents}
          showToast={showToast}
          getBusinessInspections={getBusinessInspections}
          isAccommodationBusiness={isAccommodationBusiness}
        />
      ) : (
        <>
          {/* 1. Header Card (shadcn/ui layout) */}
      <Card className="border-border shadow-xs bg-card">
        <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <Store size={22} className="stroke-[2.5]" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Quản lý Cơ sở Kinh doanh KP3
              </h1>
              <Badge className="font-mono text-xs font-bold px-2.5 py-0.5 bg-slate-900 text-white border-none shadow-2xs">
                {businesses.length} cơ sở
              </Badge>
              <Badge variant="outline" className="text-[11px] font-bold border-amber-500/60 bg-amber-50 text-amber-950 gap-1.5 hidden sm:inline-flex shadow-2xs">
                <Building size={12} className="text-amber-700 stroke-[2.5]" />
                <span>108 cơ sở lưu trú</span>
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-2xl leading-relaxed">
              Quản lý mạng lưới cơ sở kinh doanh tại chỗ, hộ kinh doanh cá thể, cơ sở lưu trú / nhà trọ, an toàn PCCC và hồ sơ địa chính
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoDetectHostels}
              disabled={isDetectingHostels}
              className="flex-1 sm:flex-none gap-2 border border-amber-500/60 hover:border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-950 cursor-pointer shadow-xs font-bold transition-all"
              title="Quét đối chiếu 11.632 nhân khẩu tạm trú để tự động bóc tách và phân loại các cơ sở lưu trú, nhà trọ trên địa bàn"
            >
              <Sparkles size={14} className={`text-amber-600 stroke-[2.5] ${isDetectingHostels ? "animate-spin" : ""}`} />
              <span className="font-bold text-amber-950">{isDetectingHostels ? "Đang quét cư dân..." : "Tự nhận diện Nhà trọ"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncHostelsToSupabase}
              disabled={isSyncingHostels}
              className="flex-1 sm:flex-none gap-2 border border-blue-500/60 hover:border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-950 cursor-pointer shadow-xs font-bold transition-all"
              title="Đồng bộ danh sách cơ sở lưu trú & nhà trọ vào cơ sở dữ liệu Supabase PostgreSQL"
            >
              <Upload size={14} className={`text-blue-600 stroke-[2.5] ${isSyncingHostels ? "animate-spin" : ""}`} />
              <span className="font-bold text-blue-950">{isSyncingHostels ? "Đang lưu..." : "Lưu vào Supabase"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportBusinessesCsv}
              className="flex-1 sm:flex-none gap-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-900 cursor-pointer shadow-xs font-bold transition-all"
              title="Xuất file báo cáo danh sách cơ sở kinh doanh định dạng CSV"
            >
              <Download size={14} className="text-slate-700 stroke-[2.5]" />
              <span className="font-bold text-slate-900">Xuất CSV ({businesses.length})</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => navigate("/addshow")}
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm hover:shadow-md border border-emerald-500 cursor-pointer transition-all active:scale-[0.98]"
              title="Đăng ký cơ sở kinh doanh, hộ cá thể hoặc nhà trọ mới (chuyển sang trang /addshow)"
            >
              <Plus size={15} className="text-white stroke-[3]" />
              <span className="font-bold text-white tracking-wide">Đăng ký Cơ sở Mới</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. KPI Overview Bar (shadcn/ui metric cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Tổng cơ sở KD</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-slate-950">{businesses.length}</span>
                <span className="text-xs font-semibold text-slate-600">cơ sở</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Briefcase size={20} className="stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">Nhà trọ & Lưu trú</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-amber-950">{totalAccomCount}</span>
                <span className="text-xs text-amber-800 font-bold">({totalRooms} phòng)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Building size={20} className="stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Hồ sơ Sổ đỏ</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-slate-950">{totalSoDoFiles}</span>
                <span className="text-xs font-semibold text-slate-600">/ {businesses.length}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <FileText size={20} className="stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">Đạt chuẩn PCCC</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-emerald-950">{totalCertifiedPccc}</span>
                <span className="text-xs text-emerald-800 font-bold">cơ sở</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Industry Sectors Statistics (Collapsible shadcn Card) */}
      <Card className="shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <PieChart size={16} className="stroke-[2.5]" />
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Phân loại & Thống kê Ngành nghề Kinh doanh KP3
              </h2>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-800 border-slate-300">
                {sectorStats.filter(s => s.count > 0).length}/{INDUSTRY_SECTORS.length} nhóm ngành
              </Badge>
              {dominantSector && dominantSector.count > 0 && (
                <span className="text-xs text-slate-700 font-medium hidden md:inline">
                  (Nhiều nhất: <strong className="text-slate-950 font-bold">{dominantSector.icon} {dominantSector.shortName}</strong> - {dominantSector.count} cơ sở)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {categoryFilter !== "Tất cả" && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => { setCategoryFilter("Tất cả"); setCurrentPage(1); }}
                className="gap-1 text-xs"
              >
                <X size={12} />
                <span>Bỏ lọc: {categoryFilter}</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowIndustryStats(!showIndustryStats)}
              className="text-xs text-muted-foreground"
            >
              {showIndustryStats ? "Thu gọn ▲" : "Mở rộng ▼"}
            </Button>
          </div>
        </div>

        {showIndustryStats && (
          <CardContent className="p-4 space-y-3 bg-muted/20">
            {/* Segmented Distribution Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium flex items-center gap-1 text-foreground">
                  <TrendingUp size={13} className="text-primary" />
                  Cơ cấu tỷ trọng ngành nghề thương mại dịch vụ (100%)
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Nhấp vào từng nhóm ngành để lọc
                </span>
              </div>

              <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex border border-border p-0.5">
                {sectorStats.map((s) => {
                  if (s.count === 0) return null;
                  const isCurrent = categoryFilter === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(isCurrent ? "Tất cả" : s.id);
                        setCurrentPage(1);
                      }}
                      style={{ width: `${s.percentage}%` }}
                      className={`h-full transition-all cursor-pointer ${s.barColor} ${
                        isCurrent ? "ring-2 ring-primary ring-offset-1 z-10" : "hover:opacity-80"
                      }`}
                      title={`${s.name}: ${s.count} cơ sở (${s.percentage.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Chips filter */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Button
                type="button"
                variant={categoryFilter === "Tất cả" ? "default" : "outline"}
                size="xs"
                onClick={() => { setCategoryFilter("Tất cả"); setCurrentPage(1); }}
                className="gap-1.5 text-xs"
              >
                <span>Tất cả ngành nghề</span>
                <span className="text-[10px] opacity-75 font-mono">({businesses.length})</span>
              </Button>

              {sectorStats.map((s) => {
                const isCurrent = categoryFilter === s.id;
                return (
                  <Button
                    key={s.id}
                    type="button"
                    variant={isCurrent ? "default" : "outline"}
                    size="xs"
                    onClick={() => {
                      setCategoryFilter(isCurrent ? "Tất cả" : s.id);
                      setCurrentPage(1);
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <span>{s.icon}</span>
                    <span>{s.shortName}</span>
                    <Badge variant={isCurrent ? "secondary" : "outline"} className="text-[10px] px-1 py-0 font-mono">
                      {s.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 4. Establishment Segmented Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Store size={13} className="text-primary" /> Phân loại:
        </span>

        {[
          { id: "all", label: "Tất cả", count: businesses.length },
          { id: "household", label: "Hộ kinh doanh cá thể", count: businesses.filter(b => !isAccommodationBusiness(b)).length },
          { id: "accommodation", label: "Nhà trọ / Lưu trú", count: totalAccomCount },
          { id: "pccc-pass", label: "Đạt chuẩn PCCC", count: totalCertifiedPccc },
          { id: "pccc-fail", label: "Chưa đạt PCCC", count: businesses.length - totalCertifiedPccc },
          { id: "has-sodo", label: "Có hồ sơ Sổ đỏ", count: totalSoDoFiles }
        ].map((tab) => {
          const isActive = establishmentFilter === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => { setEstablishmentFilter(tab.id as any); setCurrentPage(1); }}
              className="gap-1.5 text-xs rounded-lg shrink-0"
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {tab.count}
              </span>
            </Button>
          );
        })}
      </div>

      {/* 5. Search & Filters Bar */}
      <Card className="shadow-2xs">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              id="business-search-input"
              name="businessSearchTerm"
              type="text"
              placeholder="Tìm theo tên cơ sở, chủ hộ, số GPKD, địa chỉ, Tờ BĐ, số Thửa..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              id="business-category-filter"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[140px] truncate"
            >
              <option value="Tất cả">Tất cả ngành nghề</option>
              {INDUSTRY_SECTORS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.icon} {sec.name}
                </option>
              ))}
            </select>

            {/* PCCC Filter */}
            <select
              id="business-pccc-filter"
              value={pcccFilter}
              onChange={(e) => { setPcccFilter(e.target.value); setCurrentPage(1); }}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Tất cả">Tất cả PCCC</option>
              <option value="Đạt chuẩn">Đạt chuẩn PCCC</option>
              <option value="Chưa đạt">Chưa đạt PCCC</option>
            </select>

            {/* Street Filter */}
            <select
              id="business-street-filter"
              value={streetFilter}
              onChange={(e) => { setStreetFilter(e.target.value); setCurrentPage(1); }}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Tất cả">Tất cả tuyến đường</option>
              <option value="Mặt tiền Lương Định Của">Mặt tiền Lương Định Của</option>
              <option value="Hẻm 42 Lương Định Của">Hẻm 42 Lương Định Của</option>
              <option value="Hẻm 18 Lương Định Của">Hẻm 18 Lương Định Của</option>
            </select>

            {/* Status Filter */}
            <select
              id="business-status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Tạm ngưng">Tạm ngưng</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border">
              <Button
                type="button"
                variant={viewMode === "card" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("card")}
                className="h-7 w-7 rounded-md"
                title="Xem dạng Lưới Thẻ"
              >
                <LayoutGrid size={14} />
              </Button>
              <Button
                type="button"
                variant={viewMode === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                className="h-7 w-7 rounded-md"
                title="Xem dạng Bảng Danh Sách"
              >
                <List size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Accommodation Alert Banner (When Accommodation Filter Active) */}
      {establishmentFilter === "accommodation" && (
        <Card className="border-amber-500/30 bg-amber-500/10 shadow-xs">
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <span>Hệ thống đã tự động nhận diện {totalAccomCount} cơ sở nhà trọ & lưu trú từ 11.632 cư dân</span>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-800 text-[10px]">
                    Đối soát CSDL thực tế
                  </Badge>
                </div>
                <div className="text-muted-foreground text-[11px] mt-0.5">
                  Tất cả các cơ sở trọ được trích xuất tự động từ địa chỉ tạm trú, nhận diện tên chủ trọ, số điện thoại, quy mô phòng và số người lưu trú thực tế.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoDetectHostels}
                disabled={isDetectingHostels}
                className="gap-1.5 text-xs"
              >
                <RefreshCw size={13} className={isDetectingHostels ? "animate-spin" : ""} />
                <span>Quét lại cư dân</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSyncHostelsToSupabase}
                disabled={isSyncingHostels}
                className="gap-1.5 text-xs"
              >
                <Upload size={13} className={isSyncingHostels ? "animate-spin" : ""} />
                <span>{isSyncingHostels ? "Đang lưu..." : "Lưu vào Supabase CSDL"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. Business Items Rendering */}
      {viewMode === "card" ? (
        /* Card Grid View (shadcn/ui Card style) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBusinesses.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground space-y-2">
              <Briefcase size={36} className="mx-auto text-muted-foreground/60" />
              <p>Không tìm thấy cơ sở kinh doanh nào phù hợp với bộ lọc</p>
            </div>
          ) : (
            paginatedBusinesses.map((b) => {
              const isAccom = isAccommodationBusiness(b);
              const sectorGroup = getBusinessIndustryGroup(b);
              const sectorMeta = getSectorMeta(sectorGroup);
              const isSelected = selectedBusiness?.id === b.id && showDetailModal;

              const statusVariant: "success" | "warning" | "destructive" =
                b.status === "Đang hoạt động" ? "success" :
                b.status === "Tạm ngưng" ? "destructive" : "warning";

              const staying = residents.filter(r => isResidentInAccommodation(r, b));
              const actualGuestCount = staying.length > 0 ? staying.length : (b.soNguoiLuuTru || 0);

              return (
                <Card
                  key={b.id}
                  id={`business-card-${b.id}`}
                  onClick={() => handleOpenDetailModal(b)}
                  className={`group transition-all duration-200 cursor-pointer flex flex-col justify-between hover:border-primary/50 hover:shadow-md overflow-hidden ${
                    isSelected ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border shadow-xs"
                  }`}
                >
                  {/* 1. Header (shadcn/ui CardHeader) */}
                  <CardHeader className="p-4 pb-3 space-y-2.5">
                    {/* Top: Category & Type Eyebrows + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <Badge
                          variant="secondary"
                          className="gap-1 text-[11px] font-medium hover:bg-secondary/80 transition-colors"
                          title={`Nhóm ngành nghề: ${sectorMeta.shortName}`}
                        >
                          <span>{sectorMeta.icon}</span>
                          <span className="truncate max-w-[130px]">{sectorMeta.shortName}</span>
                        </Badge>
                      </div>

                      <Badge
                        variant={statusVariant}
                        className="gap-1.5 text-[10.5px] font-medium shrink-0 shadow-2xs px-2 py-0.5 self-start"
                        title={`Trạng thái hoạt động: ${b.status}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === "Đang hoạt động"
                              ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                              : "bg-current"
                          }`}
                        />
                        <span>{b.status}</span>
                      </Badge>
                    </div>

                    {/* Facility Title & Address (Horizontal layout) */}
                 <div className="items-center justify-between gap-2 pt-0.5 min-w-0">
                      <CardTitle
                        className="text-[15px] font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1 tracking-tight flex-1 min-w-0"
                        title={b.name}
                      >
                        {b.name}
                      </CardTitle>
                      <CardDescription className="text-[11.5px] text-muted-foreground flex items-center gap-1 shrink-0 max-w-[80%] font-normal">
                        <MapPin size={12} className="shrink-0 text-primary/70" />
                        <span className="truncate" title={b.address}>
                          {b.address}
                        </span>
                      </CardDescription>
                    </div>
                  </CardHeader>

                  {/* 2. Main Body (shadcn/ui CardContent) */}
                  <CardContent className="p-4 pt-0 space-y-3 flex-1">
                    {/* Image Thumbnail */}
                    <div className="relative h-32 rounded-lg overflow-hidden bg-muted border border-border shadow-2xs">
                      <img
                        src={b.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500"}
                        alt={b.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* License number pill top-right */}
                      <div className="absolute top-2 right-2">
                        <span
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs border border-white/20"
                          title={`Số giấy phép / Mã nội bộ: ${b.licenseNumber || b.internalCode || "KP3-KD"}`}
                        >
                          {b.licenseNumber || b.internalCode || "KP3-KD"}
                        </span>
                      </div>

                      {/* Accommodation badge bottom-left */}
                      {isAccom && (
                        <div className="absolute bottom-2 left-2">
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-2xs"
                            title="Cơ sở có dịch vụ lưu trú / nhà trọ"
                          >
                            <Building size={11} /> Cơ sở lưu trú
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Accommodation details (if applicable) */}
                    {isAccom && (
                      <div className="py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-foreground flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                          <Bed size={14} className="text-amber-600 shrink-0" />
                          <span>{b.soPhong || 0} phòng</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{b.soTang || 0} tầng</span>
                        </div>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-800 font-semibold text-[10.5px]">
                          👥 {actualGuestCount} người
                        </Badge>
                      </div>
                    )}

                    {/* Cadastral (Địa chính) */}
                    <div className="bg-muted/40 py-2 px-2.5 rounded-lg border border-border flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-mono text-foreground font-medium whitespace-nowrap">
                        <span className="text-muted-foreground font-sans text-[10px]">ĐC:</span>
                        <span className="bg-background px-1.5 py-0.5 rounded border border-border text-[10.5px]">
                          Tờ {b.toBanDo || "—"}, Thửa {b.soThua || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap text-[11px]">
                        <span>{b.dienTich ? `${b.dienTich} m²` : "—"}</span>
                        <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0">
                          {b.loaiDat || "ODT"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>

                  {/* 3. Footer Actions (shadcn/ui CardFooter) */}
                  <CardFooter className="p-4 pt-2.5 border-t border-border flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1 flex-1">
                      <div className="w-5 h-5 rounded-full bg-muted border border-border text-foreground flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {b.owner ? b.owner.charAt(0) : "U"}
                      </div>
                      <span className="font-medium text-foreground truncate text-[11.5px]" title={b.owner}>
                        {b.owner}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {b.soDoFile ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingDoc({
                              title: "Hồ sơ Giấy chứng nhận QSDĐ (Sổ đỏ)",
                              businessName: b.name,
                              file: b.soDoFile!,
                              business: b
                            });
                          }}
                          className="h-6 px-2 text-[10px] gap-1 font-medium hover:bg-muted cursor-pointer"
                          title="Nhấp để xem tệp Sổ đỏ"
                        >
                          <FileText size={11} className="text-primary" />
                          <span>Sổ đỏ</span>
                        </Button>
                      ) : (
                        <span className="text-[9.5px] text-muted-foreground italic px-1">
                          Chưa sổ
                        </span>
                      )}

                      {b.safetyCertified && (
                        <Badge variant="success" className="text-[9.5px] px-1.5 py-0.2 gap-0.5 font-medium">
                          <ShieldCheck size={11} /> PCCC
                        </Badge>
                      )}

                      {onNavigateToGis && b.coordinates && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToGis({
                              id: b.id,
                              name: b.name,
                              address: b.address,
                              type: "business",
                              coordinates: b.coordinates
                            });
                          }}
                          className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer"
                          title="Xem vị trí trên Bản đồ số GIS KP3"
                        >
                          <Navigation size={12} />
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        /* Table View (shadcn/ui Table style) */
        <Card className="shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Cơ sở / Ngành nghề</TableHead>
                <TableHead>Chủ sở hữu & Liên hệ</TableHead>
                <TableHead>Đặc điểm Lưu trú</TableHead>
                <TableHead>Địa chính / Thửa đất</TableHead>
                <TableHead>Sổ đỏ & PCCC</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBusinesses.map((b) => {
                const isAccom = isAccommodationBusiness(b);
                const sectorGroup = getBusinessIndustryGroup(b);
                const sectorMeta = getSectorMeta(sectorGroup);
                const isSelected = selectedBusiness?.id === b.id && showDetailModal;

                const staying = residents.filter(r => isResidentInAccommodation(r, b));
                const actualGuestCount = staying.length > 0 ? staying.length : (b.soNguoiLuuTru || 0);

                const statusVariant: "success" | "warning" | "destructive" =
                  b.status === "Đang hoạt động" ? "success" :
                  b.status === "Tạm ngưng" ? "destructive" : "warning";

                return (
                  <TableRow
                    key={b.id}
                    onClick={() => handleOpenDetailModal(b)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-muted font-medium" : ""}`}
                  >
                    {/* Cột 1: Cơ sở / Ngành nghề */}
                    <TableCell className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0 shadow-2xs">
                          <img
                            src={b.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200"}
                            alt={b.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200";
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground text-xs hover:text-primary transition-colors line-clamp-1">{b.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant="secondary" className="text-[9.5px] px-1.5 py-0 gap-1 font-medium">
                              <span>{sectorMeta.icon}</span>
                              <span>{sectorMeta.shortName}</span>
                            </Badge>
                            <span className="font-mono text-muted-foreground text-[10px] bg-muted px-1 py-0.2 rounded border border-border">
                              {b.licenseNumber}
                            </span>
                            <span className="text-[10px] text-muted-foreground">• {b.type}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Cột 2: Chủ sở hữu & Liên hệ */}
                    <TableCell className="p-3.5 whitespace-nowrap">
                      <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                        <User size={13} className="text-muted-foreground" />
                        <span>{b.owner}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone size={11} className="text-muted-foreground" />
                        <span>{b.phone || "—"}</span>
                      </div>
                    </TableCell>

                    {/* Cột 3: Đặc điểm Lưu trú */}
                    <TableCell className="p-3.5 whitespace-nowrap">
                      {isAccom ? (
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-[10px] gap-1 font-medium border-amber-500/30 text-amber-800">
                            <Building size={11} /> {b.soPhong || 0} phòng / {b.soTang || 0} tầng
                          </Badge>
                          <div className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                            <span>👥 {actualGuestCount} người</span>
                            {staying.length > 0 && (
                              <Badge variant="success" className="text-[9px] px-1 py-0">
                                ✓ CSDL
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">Không lưu trú</span>
                      )}
                    </TableCell>

                    {/* Cột 4: Địa chính / Thửa đất */}
                    <TableCell className="p-3.5 whitespace-nowrap">
                      <div className="text-[11px] font-mono font-medium text-foreground">
                        Tờ {b.toBanDo || "—"} • Thửa {b.soThua || "—"}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <span>{b.dienTich ? `${b.dienTich} m²` : "—"}</span>
                        <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0">
                          {b.loaiDat || "ODT"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Cột 5: Sổ đỏ & PCCC */}
                    <TableCell className="p-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {b.soDoFile ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingDoc({
                                title: "Hồ sơ Giấy chứng nhận QSDĐ (Sổ đỏ)",
                                businessName: b.name,
                                file: b.soDoFile!,
                                business: b
                              });
                            }}
                            className="text-[9.5px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border border-border hover:bg-muted transition-colors cursor-pointer"
                          >
                            <FileText size={10} className="text-primary" />
                            <span>Sổ đỏ ({b.soDoFile.type.toUpperCase()})</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Chưa nộp sổ
                          </span>
                        )}

                        {b.safetyCertified && (
                          <Badge variant="success" className="text-[9.5px] px-1.5 py-0.2 gap-1 font-medium">
                            <ShieldCheck size={11} /> PCCC đạt
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Cột 6: Trạng thái */}
                    <TableCell className="p-3.5 text-center whitespace-nowrap">
                      <Badge variant={statusVariant} className="gap-1 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${b.status === "Đang hoạt động" ? "bg-emerald-500 animate-pulse" : "bg-current"}`} />
                        <span>{b.status}</span>
                      </Badge>
                    </TableCell>

                    {/* Cột 7: Thao tác */}
                    <TableCell className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => handleOpenDetailModal(b)}
                          className="gap-1 text-xs"
                          title="Xem chi tiết hồ sơ kinh doanh"
                        >
                          <Eye size={12} />
                          <span>Hồ sơ</span>
                        </Button>
                        {onNavigateToGis && b.coordinates && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onNavigateToGis({
                              id: b.id,
                              name: b.name,
                              address: b.address,
                              type: "business",
                              coordinates: b.coordinates
                            })}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Xem trên GIS Map"
                          >
                            <Navigation size={13} />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(b)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Sửa hồ sơ"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setBusinessToDelete(b)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Xóa cơ sở"
                        >
                          <Trash2 size={13} />
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
      <Pagination
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalItems={filteredBusinesses.length}
        itemsPerPage={itemsPerPage}
      />
        </>
      )}

      {/* Modals & Dialogs */}
      {/* 2. Document Preview Modal */}
      <BusinessDocumentModal
        viewingDoc={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onDownload={(file) => {
          const a = document.createElement("a");
          a.href = file.url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast(`Đang tải xuống ${file.name}`, "info");
        }}
        isAccommodationBusiness={isAccommodationBusiness}
      />

      {/* 5. Add Inspection Modal */}
      <AddInspectionModal
        open={showAddInspectionModal}
        business={selectedBusiness}
        onClose={() => setShowAddInspectionModal(false)}
        formInspDate={formInspDate}
        setFormInspDate={setFormInspDate}
        formInspResult={formInspResult}
        setFormInspResult={setFormInspResult}
        formInspInspector={formInspInspector}
        setFormInspInspector={setFormInspInspector}
        formInspNote={formInspNote}
        setFormInspNote={setFormInspNote}
        formInspRecommendation={formInspRecommendation}
        setFormInspRecommendation={setFormInspRecommendation}
        formInspPenalties={formInspPenalties}
        setFormInspPenalties={setFormInspPenalties}
        onSubmit={handleSaveAddInspection}
      />

      {/* 6. Edit Inspection Modal */}
      <EditInspectionModal
        open={showEditInspectionModal}
        business={selectedBusiness}
        editingInspection={editingInspection}
        onClose={() => {
          setShowEditInspectionModal(false);
          setEditingInspection(null);
        }}
        formInspDate={formInspDate}
        setFormInspDate={setFormInspDate}
        formInspResult={formInspResult}
        setFormInspResult={setFormInspResult}
        formInspInspector={formInspInspector}
        setFormInspInspector={setFormInspInspector}
        formInspNote={formInspNote}
        setFormInspNote={setFormInspNote}
        formInspRecommendation={formInspRecommendation}
        setFormInspRecommendation={setFormInspRecommendation}
        formInspPenalties={formInspPenalties}
        setFormInspPenalties={setFormInspPenalties}
        onSubmit={handleSaveEditInspection}
      />

      {/* 7. Add Change Log Modal */}
      <AddChangeLogModal
        open={showAddChangeLogModal}
        business={selectedBusiness}
        onClose={() => setShowAddChangeLogModal(false)}
        formChangeDate={formChangeDate}
        setFormChangeDate={setFormChangeDate}
        formChangeType={formChangeType}
        setFormChangeType={setFormChangeType}
        formChangeDesc={formChangeDesc}
        setFormChangeDesc={setFormChangeDesc}
        formChangeRecordedBy={formChangeRecordedBy}
        setFormChangeRecordedBy={setFormChangeRecordedBy}
        onSubmit={handleSaveChangeLog}
      />

      {/* 8. Delete Inspection Confirmation */}
      <DeleteConfirmationDialog
        open={Boolean(inspectionToDelete)}
        title="Xác nhận xóa biên bản kiểm tra"
        description={
          inspectionToDelete ? (
            <p>
              Bạn có chắc chắn muốn xóa biên bản kiểm tra ngày <strong>{inspectionToDelete.date}</strong> của đoàn <strong>{inspectionToDelete.inspector}</strong> không?
            </p>
          ) : null
        }
        onClose={() => setInspectionToDelete(null)}
        onConfirm={handleExecuteDeleteInspection}
      />

      {/* 9. Delete Business Confirmation */}
      <DeleteConfirmationDialog
        open={Boolean(businessToDelete)}
        title="Xác nhận xóa cơ sở kinh doanh"
        description={
          businessToDelete ? (
            <p>
              Bạn có chắc chắn muốn xóa cơ sở kinh doanh <strong className="text-foreground">{businessToDelete.name}</strong> (<span className="text-destructive font-mono font-semibold">{businessToDelete.licenseNumber}</span>) thuộc đại diện <strong className="text-foreground">{businessToDelete.owner}</strong> không?
            </p>
          ) : null
        }
        onClose={() => setBusinessToDelete(null)}
        onConfirm={() => businessToDelete && executeDeleteBusiness(businessToDelete.id)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              toast.type === "success" ? "bg-emerald-600" : toast.type === "warning" ? "bg-amber-600" : toast.type === "error" ? "bg-rose-600" : "bg-blue-600"
            }`}></span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
