import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Printer,
  Pencil,
  Trash2,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  Check,
  LayoutGrid,
  List,
  Shield,
  ShieldAlert,
  Eye,
  FileText,
  Home,
  CreditCard,
  UserCheck,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Navigation,
  Sparkles,
  RefreshCw,
  Clock,
  Heart,
  Building2,
  Layers
} from "lucide-react";
import { Resident, Household, TargetGisItem, ActiveTab } from "../types";
import { generateDefaultCoordinatesForAddress, parseCoordinates as parseGisCoords } from "../utils/gisUtils";
import { getTemporaryResidenceExpiryStatus, parseAccommodationInfo } from "../utils/householdRecognitionUtils";
import * as XLSX from "xlsx";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Separator } from "../components/ui/separator";
import { navigate, useCurrentPath, ROUTES } from "../routes";
import AddResidentPage from "./AddResidentPage";
import EditResidentPage from "./EditResidentPage";
import ImportResidentsPage from "./ImportResidentsPage";
import ResidentDetailPage from "./ResidentDetailPage";

export interface ResidentsPageProps {
  residents: Resident[];
  households: Household[];
  currentUser: any;
  residentPermissions?: Record<string, boolean>;
  onAddResident?: (resident: Resident) => void;
  onDeleteResident?: (id: string) => void;
  onUpdateResidents?: React.Dispatch<React.SetStateAction<Resident[]>>;
  onUpdateHouseholds?: React.Dispatch<React.SetStateAction<Household[]>>;
  onNavigateToGis?: (item: TargetGisItem) => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

// Helpers for Foreign Resident Detection
export const isForeignResident = (r: Resident): boolean => {
  return r.isForeigner === true || (Boolean(r.nationality) && r.nationality !== "Việt Nam") || Boolean(r.passportNumber);
};

export const getCountryFlag = (nationality?: string): string => {
  if (!nationality) return "🇻🇳";
  const nat = nationality.toLowerCase();
  if (nat.includes("hàn quốc") || nat.includes("korea")) return "🇰🇷";
  if (nat.includes("anh") || nat.includes("uk") || nat.includes("britain")) return "🇬🇧";
  if (nat.includes("nhật") || nat.includes("japan")) return "🇯🇵";
  if (nat.includes("mỹ") || nat.includes("hoa kỳ") || nat.includes("usa") || nat.includes("united states")) return "🇺🇸";
  if (nat.includes("pháp") || nat.includes("france")) return "🇫🇷";
  if (nat.includes("đức") || nat.includes("germany")) return "🇩🇪";
  if (nat.includes("trung quốc") || nat.includes("china")) return "🇨🇳";
  if (nat.includes("đài loan") || nat.includes("taiwan")) return "🇹🇼";
  if (nat.includes("úc") || nat.includes("australia")) return "🇦🇺";
  if (nat.includes("singapore")) return "🇸🇬";
  if (nat.includes("nga") || nat.includes("russia")) return "🇷🇺";
  if (nat.includes("canada")) return "🇨🇦";
  if (nat.includes("việt nam") || nat.includes("vietnam")) return "🇻🇳";
  return "🌍";
};

// Initial state for new or edited resident
const initialFormResident: Omit<Resident, "id"> & { id?: string } = {
  fullName: "",
  gender: "Nam",
  birthDate: "01/01/1990",
  cccd: "",
  phone: "",
  status: "Thường trú",
  occupation: "Kinh doanh tự do",
  address: "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh",
  householdId: "HK-001",
  relationToOwner: "Chủ hộ",
  ethnicity: "Kinh",
  religion: "Không",
  nationality: "Việt Nam",
  hometown: "",
  permanentAddress: "",
  temporaryAddress: "",
  currentAddress: "",
  education: "12/12",
  fatherName: "",
  motherName: "",
  temporaryRegDate: "",
  temporaryExpDate: "",
  managementStatus: "Bình thường",
  maritalStatus: "Đã kết hôn",
  workplace: "",
  idIssueDate: "10/05/2021",
  idIssuePlace: "Cục Cảnh sát QLHC về TTXH",
  healthInsuranceNumber: "",
  militaryServiceStatus: "Đã hoàn thành",
  policyGroup: "Bình thường",
  emergencyContact: "",
  notes: "",
  isForeigner: false,
  passportNumber: "",
  passportExpiryDate: "",
  visaOrCardType: "Thẻ tạm trú (TRC)",
  visaOrCardNumber: "",
  visaValidFrom: "",
  visaValidUntil: "",
  temporaryRegistrationCode: "",
  temporaryRegistrationDate: "",
  temporaryRegistrationStatus: "Đã khai báo",
  workPermitNumber: "",
  sponsoringOrganization: "",
  landlordContact: ""
};

export default function ResidentsPage({
  residents = [],
  households = [],
  currentUser,
  residentPermissions = {},
  onAddResident,
  onDeleteResident,
  onUpdateResidents,
  onUpdateHouseholds,
  onNavigateToGis,
  setActiveTab
}: ResidentsPageProps) {
  // Routing Detection for Subpages
  const currentPath = useCurrentPath();

  const isAddResident =
    currentPath === "/add_resident" ||
    currentPath === "/addresident" ||
    currentPath === "/dashboard/residents/add" ||
    currentPath.endsWith("/add_resident") ||
    currentPath.endsWith("/addresident");

  const isAddForeigner =
    currentPath === "/add_foreigner" ||
    currentPath === "/dashboard/residents/add_foreigner" ||
    currentPath.endsWith("/add_foreigner");

  const isImportResidents =
    currentPath === "/import_residents" ||
    currentPath === "/importresidents" ||
    currentPath === "/dashboard/residents/import" ||
    currentPath.endsWith("/import_residents") ||
    currentPath.endsWith("/importresidents");

  const editMatch = currentPath.match(/^\/(?:dashboard\/residents\/edit|edit_resident)\/([^/?#]+)/i);
  const editingResidentId = editMatch ? decodeURIComponent(editMatch[1]) : null;
  const isEditResident = Boolean(editingResidentId);

  const residentToEdit = useMemo(() => {
    if (editingResidentId) {
      return residents.find((r) => r.id === editingResidentId || r.cccd === editingResidentId) || null;
    }
    return null;
  }, [editingResidentId, residents]);

  // Extract detail resident ID if on detail route (/resident_detail/:id or /dashboard/residents/:id)
  const detailMatch = currentPath.match(/^\/(?:dashboard\/residents\/|resident_detail\/)([^/?#]+)/i);
  const detailPathId =
    detailMatch && !["add", "import", "add_foreigner"].includes(detailMatch[1])
      ? decodeURIComponent(detailMatch[1])
      : null;
  const isDetailResident = Boolean(detailPathId);

  const residentForDetail = useMemo(() => {
    if (detailPathId) {
      return residents.find((r) => r.id === detailPathId || r.cccd === detailPathId) || null;
    }
    return null;
  }, [detailPathId, residents]);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // State: View Mode (Table / Card)
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // State: Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabFilter, setActiveTabFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [copiedCccd, setCopiedCccd] = useState<string | null>(null);

  // State: Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // State: Modals
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState("identity");

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formActiveTab, setFormActiveTab] = useState("basic");
  const [formData, setFormData] = useState<typeof initialFormResident>(initialFormResident);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State: CT-07 Modal
  const [showCT07Dialog, setShowCT07Dialog] = useState(false);
  const [residentForCT07, setResidentForCT07] = useState<Resident | null>(null);

  // State: Delete Confirm Modal
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null);

  // State: Import Modal
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [importParsedPreview, setImportParsedPreview] = useState<any[]>([]);

  // Copy CCCD helper
  const handleCopyCccd = (cccd: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(cccd);
    setCopiedCccd(cccd);
    showToast(`Đã sao chép số CCCD/Hộ chiếu: ${cccd}`, "info");
    setTimeout(() => setCopiedCccd(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = residents.length;
    let thuongTruCount = 0;
    let tamTruCount = 0;
    let foreignerCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let partyMemberCount = 0;
    let elderlyCount = 0;
    let childCount = 0;

    const currentYear = new Date().getFullYear();

    residents.forEach((r) => {
      if (r.status === "Thường trú") thuongTruCount++;
      if (r.status === "Tạm trú") tamTruCount++;
      if (isForeignResident(r)) foreignerCount++;
      if (r.gender === "Nam") maleCount++;
      if (r.gender === "Nữ") femaleCount++;

      if (r.policyGroup?.includes("Đảng viên")) partyMemberCount++;

      // Age calculation
      const birthYear = parseInt(r.birthDate?.split("/")[2] || "0", 10);
      if (birthYear > 0) {
        const age = currentYear - birthYear;
        if (age >= 60) elderlyCount++;
        if (age < 14) childCount++;
      }

      // Check temporary residence expiry
      if (r.status === "Tạm trú" && r.temporaryExpDate) {
        const expStatus = getTemporaryResidenceExpiryStatus(r.temporaryExpDate);
        if (expStatus.status === "expiring_soon") expiringSoonCount++;
        if (expStatus.status === "expired") expiredCount++;
      }
    });

    return {
      total,
      thuongTruCount,
      tamTruCount,
      foreignerCount,
      expiringSoonCount,
      expiredCount,
      maleCount,
      femaleCount,
      partyMemberCount,
      elderlyCount,
      childCount
    };
  }, [residents]);

  // Filtered resident list
  const filteredResidents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const currentYear = new Date().getFullYear();

    return residents.filter((r) => {
      // 1. Search Query
      if (query) {
        const matchName = r.fullName?.toLowerCase().includes(query);
        const matchCccd = r.cccd?.toLowerCase().includes(query);
        const matchPhone = r.phone?.toLowerCase().includes(query);
        const matchAddress = r.address?.toLowerCase().includes(query);
        const matchHometown = r.hometown?.toLowerCase().includes(query);
        const matchPermanent = r.permanentAddress?.toLowerCase().includes(query);
        const matchOccupation = r.occupation?.toLowerCase().includes(query);
        const matchBhyt = r.healthInsuranceNumber?.toLowerCase().includes(query);
        const matchPassport = r.passportNumber?.toLowerCase().includes(query);
        const matchHostel = r.notes?.toLowerCase().includes(query);

        if (
          !matchName &&
          !matchCccd &&
          !matchPhone &&
          !matchAddress &&
          !matchHometown &&
          !matchPermanent &&
          !matchOccupation &&
          !matchBhyt &&
          !matchPassport &&
          !matchHostel
        ) {
          return false;
        }
      }

      // 2. Tab Filter
      if (activeTabFilter === "thuongtru" && r.status !== "Thường trú") return false;
      if (activeTabFilter === "tamtru" && r.status !== "Tạm trú") return false;
      if (activeTabFilter === "foreigner" && !isForeignResident(r)) return false;
      if (activeTabFilter === "party" && !r.policyGroup?.includes("Đảng viên")) return false;

      if (activeTabFilter === "expiring_soon") {
        if (r.status !== "Tạm trú" || !r.temporaryExpDate) return false;
        const exp = getTemporaryResidenceExpiryStatus(r.temporaryExpDate);
        if (exp.status !== "expiring_soon") return false;
      }

      if (activeTabFilter === "expired") {
        if (r.status !== "Tạm trú" || !r.temporaryExpDate) return false;
        const exp = getTemporaryResidenceExpiryStatus(r.temporaryExpDate);
        if (exp.status !== "expired") return false;
      }

      // 3. Gender Filter
      if (genderFilter !== "all" && r.gender !== genderFilter) return false;

      // 4. Policy & Demographics Filter
      if (policyFilter !== "all") {
        const birthYear = parseInt(r.birthDate?.split("/")[2] || "0", 10);
        const age = birthYear > 0 ? currentYear - birthYear : 30;

        if (policyFilter === "elderly" && age < 60) return false;
        if (policyFilter === "children" && age >= 14) return false;
        if (policyFilter === "labor" && (age < 15 || age >= 60)) return false;
        if (policyFilter === "poor" && !r.policyGroup?.toLowerCase().includes("nghèo")) return false;
        if (policyFilter === "policy" && !r.policyGroup?.toLowerCase().includes("chính sách") && !r.policyGroup?.toLowerCase().includes("thương binh")) return false;
      }

      return true;
    });
  }, [residents, searchTerm, activeTabFilter, genderFilter, policyFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTabFilter, genderFilter, policyFilter, pageSize]);

  // Pagination calculation
  const totalItems = filteredResidents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedResidents = useMemo(() => {
    return filteredResidents.slice(startIndex, startIndex + pageSize);
  }, [filteredResidents, startIndex, pageSize]);

  // GIS Navigation handler
  const handleNavigateGis = (res: Resident) => {
    if (!onNavigateToGis) {
      showToast("Chức năng bản đồ GIS không khả dụng.", "info");
      return;
    }

    const matchedHousehold = households.find((h) => h.code === res.householdId || h.id === res.householdId);
    let coords = matchedHousehold?.coordinates;
    if (!coords || !parseGisCoords(coords)) {
      const autoGeo = generateDefaultCoordinatesForAddress(res.address, res.id);
      coords = autoGeo.dms;
    }

    onNavigateToGis({
      id: res.id,
      type: "household",
      name: `${res.fullName} (${res.status})`,
      address: res.address,
      coordinates: coords,
      navigateRoute: true
    });
  };

  // Open CT-07
  const handleOpenCT07 = (res: Resident) => {
    setResidentForCT07(res);
    setShowCT07Dialog(true);
  };

  // Open Detail Page
  const handleOpenDetail = (res: Resident) => {
    setSelectedResident(res);
    navigate(`/resident_detail/${encodeURIComponent(res.id)}`);
  };

  // Open Add Modal
  const handleOpenAddModal = (isForeigner: boolean = false) => {
    setIsEditing(false);
    setFormData({
      ...initialFormResident,
      isForeigner,
      nationality: isForeigner ? "Hàn Quốc" : "Việt Nam",
      status: isForeigner ? "Tạm trú" : "Thường trú"
    });
    setFormActiveTab(isForeigner ? "foreigner" : "basic");
    setShowFormDialog(true);
  };

  // Open Edit Modal / Page
  const handleOpenEditModal = (res: Resident) => {
    navigate(`/edit_resident/${encodeURIComponent(res.id)}`);
  };

  // Submit Add / Edit Form
  const handleSaveResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showToast("Vui lòng nhập họ và tên cư dân", "error");
      return;
    }
    if (!formData.cccd.trim() && !formData.passportNumber?.trim()) {
      showToast("Vui lòng nhập số CCCD hoặc Số hộ chiếu", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCccd = (formData.cccd || formData.passportNumber || "").trim();

      if (isEditing && formData.id) {
        // Edit mode
        const updatedResident: Resident = {
          ...formData,
          id: formData.id,
          cccd: finalCccd,
          fullName: formData.fullName.trim()
        } as Resident;

        // Persist to Supabase if configured
        if (isSupabaseConfigured && supabase) {
          const { error } = await (supabase as any)
            .from("residents")
            .update({
              full_name: updatedResident.fullName,
              gender: updatedResident.gender,
              birth_date: updatedResident.birthDate,
              cccd: updatedResident.cccd,
              phone: updatedResident.phone,
              status: updatedResident.status,
              occupation: updatedResident.occupation,
              address: updatedResident.address,
              household_id: updatedResident.householdId,
              relation_to_owner: updatedResident.relationToOwner,
              ethnicity: updatedResident.ethnicity,
              religion: updatedResident.religion,
              nationality: updatedResident.nationality,
              hometown: updatedResident.hometown,
              permanent_address: updatedResident.permanentAddress,
              temporary_address: updatedResident.temporaryAddress,
              current_address: updatedResident.currentAddress,
              education: updatedResident.education,
              father_name: updatedResident.fatherName,
              mother_name: updatedResident.motherName,
              temporary_reg_date: updatedResident.temporaryRegDate,
              temporary_exp_date: updatedResident.temporaryExpDate,
              management_status: updatedResident.managementStatus,
              marital_status: updatedResident.maritalStatus,
              workplace: updatedResident.workplace,
              id_issue_date: updatedResident.idIssueDate,
              id_issue_place: updatedResident.idIssuePlace,
              health_insurance_number: updatedResident.healthInsuranceNumber,
              military_service_status: updatedResident.militaryServiceStatus,
              policy_group: updatedResident.policyGroup,
              emergency_contact: updatedResident.emergencyContact,
              notes: updatedResident.notes
            })
            .eq("id", updatedResident.id);

          if (error) {
            console.warn("Supabase update error (falling back to local):", error);
          }
        }

        // Update local state
        if (onUpdateResidents) {
          onUpdateResidents((prev) => prev.map((r) => (r.id === updatedResident.id ? updatedResident : r)));
        }
        if (selectedResident?.id === updatedResident.id) {
          setSelectedResident(updatedResident);
        }

        showToast(`Cập nhật thông tin cư dân ${updatedResident.fullName} thành công!`);
      } else {
        // Add mode
        const newId = "R" + (residents.length + 1).toString().padStart(5, "0");
        const newResident: Resident = {
          ...formData,
          id: newId,
          cccd: finalCccd,
          fullName: formData.fullName.trim(),
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          joinDate: new Date().toLocaleDateString("vi-VN")
        } as Resident;

        // Persist to Supabase if configured
        if (isSupabaseConfigured && supabase) {
          const { error } = await (supabase as any).from("residents").insert([
            {
              id: newResident.id,
              full_name: newResident.fullName,
              gender: newResident.gender,
              birth_date: newResident.birthDate,
              cccd: newResident.cccd,
              phone: newResident.phone,
              status: newResident.status,
              occupation: newResident.occupation,
              address: newResident.address,
              household_id: newResident.householdId,
              relation_to_owner: newResident.relationToOwner,
              ethnicity: newResident.ethnicity,
              religion: newResident.religion,
              nationality: newResident.nationality,
              hometown: newResident.hometown,
              permanent_address: newResident.permanentAddress,
              temporary_address: newResident.temporaryAddress,
              current_address: newResident.currentAddress,
              education: newResident.education,
              father_name: newResident.fatherName,
              mother_name: newResident.motherName,
              temporary_reg_date: newResident.temporaryRegDate,
              temporary_exp_date: newResident.temporaryExpDate,
              management_status: newResident.managementStatus,
              marital_status: newResident.maritalStatus,
              workplace: newResident.workplace,
              id_issue_date: newResident.idIssueDate,
              id_issue_place: newResident.idIssuePlace,
              health_insurance_number: newResident.healthInsuranceNumber,
              military_service_status: newResident.militaryServiceStatus,
              policy_group: newResident.policyGroup,
              emergency_contact: newResident.emergencyContact,
              notes: newResident.notes
            }
          ]);

          if (error) {
            console.warn("Supabase insert error (falling back to local):", error);
          }
        }

        // Call callback or update state
        if (onAddResident) {
          onAddResident(newResident);
        } else if (onUpdateResidents) {
          onUpdateResidents((prev) => [newResident, ...prev]);
        }

        showToast(`Đã thêm cư dân mới: ${newResident.fullName}`);
      }

      setShowFormDialog(false);
    } catch (err: any) {
      console.error("Save resident failed:", err);
      showToast("Có lỗi xảy ra khi lưu thông tin cư dân", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and delete
  const handleConfirmDelete = async () => {
    if (!residentToDelete) return;
    const target = residentToDelete;

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await (supabase as any).from("residents").delete().eq("id", target.id);
        if (error) console.warn("Supabase delete warning:", error);
      }

      if (onDeleteResident) {
        onDeleteResident(target.id);
      } else if (onUpdateResidents) {
        onUpdateResidents((prev) => prev.filter((r) => r.id !== target.id));
      }

      showToast(`Đã xóa hồ sơ cư dân ${target.fullName}`, "info");
      setShowDeleteDialog(false);
      setResidentToDelete(null);
      if (selectedResident?.id === target.id) {
        setShowDetailDialog(false);
        setSelectedResident(null);
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      showToast("Không thể xóa cư dân. Vui lòng thử lại", "error");
    }
  };

  // Excel Export Full
  const handleExportExcel = () => {
    try {
      const rows = filteredResidents.map((r, idx) => ({
        "STT": idx + 1,
        "Mã cư dân": r.id,
        "Họ và Tên": r.fullName,
        "Số CCCD / Định danh": r.cccd,
        "Số Hộ chiếu": r.passportNumber || "",
        "Giới tính": r.gender,
        "Ngày sinh": r.birthDate,
        "Dân tộc": r.ethnicity || "Kinh",
        "Tôn giáo": r.religion || "Không",
        "Quốc tịch": r.nationality || "Việt Nam",
        "Số điện thoại": r.phone || "",
        "Diện cư trú": r.status,
        "Địa chỉ tại KP3": r.address,
        "Nơi thường trú gốc": r.permanentAddress || r.address,
        "Quê quán": r.hometown || "",
        "Mã hộ khẩu": r.householdId || "",
        "Quan hệ với chủ hộ": r.relationToOwner || "",
        "Họ tên cha": r.fatherName || "",
        "Họ tên mẹ": r.motherName || "",
        "Ngày đăng ký tạm trú": r.temporaryRegDate || "",
        "Ngày hết hạn tạm trú": r.temporaryExpDate || "",
        "Tình trạng quản lý": r.managementStatus || "Bình thường",
        "Nghề nghiệp": r.occupation || "",
        "Mã số BHYT": r.healthInsuranceNumber || "",
        "Diện chính sách": r.policyGroup || "Bình thường",
        "Ghi chú / Nhà trọ": r.notes || ""
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachCuDan_KP3");
      const filename = `Danh_Sach_Cu_Dan_KP3_AnPhu_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast(`Đã xuất thành công ${filteredResidents.length} cư dân ra file ${filename}`);
    } catch (err: any) {
      console.error("Export Excel error:", err);
      showToast("Xuất Excel thất bại", "error");
    }
  };

  // Import preview parser
  const handleProcessImport = () => {
    if (!importText.trim()) {
      showToast("Vui lòng dán dữ liệu hoặc tải file Excel", "error");
      return;
    }

    try {
      const lines = importText.trim().split("\n");
      const parsed: any[] = [];

      lines.forEach((line, idx) => {
        // Tab-separated or comma-separated
        const parts = line.includes("\t") ? line.split("\t") : line.split(",");
        if (parts.length >= 3) {
          const name = parts[0]?.trim() || `Cư dân Mới ${idx + 1}`;
          const cccd = parts[1]?.trim() || `0790${Math.floor(10000000 + Math.random() * 90000000)}`;
          const birthDate = parts[2]?.trim() || "01/01/1990";
          const gender = parts[3]?.trim().toLowerCase().includes("nữ") ? "Nữ" : "Nam";
          const address = parts[4]?.trim() || "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh";
          const status = parts[5]?.trim().toLowerCase().includes("tạm") ? "Tạm trú" : "Thường trú";

          parsed.push({
            fullName: name,
            cccd,
            birthDate,
            gender,
            address,
            status,
            phone: parts[6]?.trim() || "Chưa cập nhật",
            householdId: "HK-001",
            relationToOwner: "Thành viên"
          });
        }
      });

      if (parsed.length === 0) {
        showToast("Không tìm thấy dữ liệu hợp lệ từ văn bản đã dán", "error");
        return;
      }

      setImportParsedPreview(parsed);
      showToast(`Đã nhận diện thành công ${parsed.length} dòng dữ liệu`);
    } catch (err) {
      showToast("Lỗi khi phân tích dữ liệu nhập", "error");
    }
  };

  // Confirm batch import
  const handleConfirmImport = async () => {
    if (importParsedPreview.length === 0) return;

    try {
      const newItems: Resident[] = importParsedPreview.map((item, idx) => ({
        id: "R" + (residents.length + idx + 1).toString().padStart(5, "0"),
        fullName: item.fullName,
        gender: item.gender,
        birthDate: item.birthDate,
        cccd: item.cccd,
        phone: item.phone || "Chưa cập nhật",
        status: item.status,
        occupation: "Tự do",
        address: item.address,
        householdId: item.householdId,
        relationToOwner: item.relationToOwner,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        joinDate: new Date().toLocaleDateString("vi-VN")
      }));

      if (isSupabaseConfigured && supabase) {
        const rowsToInsert = newItems.map((r) => ({
          id: r.id,
          full_name: r.fullName,
          gender: r.gender,
          birth_date: r.birthDate,
          cccd: r.cccd,
          phone: r.phone,
          status: r.status,
          address: r.address,
          household_id: r.householdId,
          relation_to_owner: r.relationToOwner
        }));
        await (supabase as any).from("residents").insert(rowsToInsert);
      }

      if (onUpdateResidents) {
        onUpdateResidents((prev) => [...newItems, ...prev]);
      }

      showToast(`Đã nạp thành công ${newItems.length} cư dân vào hệ thống CSDL!`);
      setShowImportDialog(false);
      setImportText("");
      setImportParsedPreview([]);
    } catch (err: any) {
      console.error("Batch import error:", err);
      showToast("Lỗi khi lưu dữ liệu hàng loạt", "error");
    }
  };

  // Check role permission for "nguoidan"
  if (currentUser?.role === "nguoidan" && !residentPermissions?.residents) {
    return (
      <div className="p-6 max-w-xl mx-auto my-16">
        <Card className="border-amber-200/80 bg-linear-to-b from-amber-50/50 to-white shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Không có quyền truy cập Sổ Quản lý Dân cư
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 max-w-md mx-auto pt-2 leading-relaxed">
              Theo Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân và quy chế quản lý Khu phố 3,
              tài khoản Cư dân thông thường không được phép tra cứu danh bạ nhân khẩu.
              Chức năng này chỉ cấp quyền cho Cán bộ Quản lý địa bàn và Công an khu vực.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-6 pb-8">
            <Button
              onClick={() => setActiveTab && setActiveTab("dashboard")}
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              Quay về Cổng Dịch vụ Cư Dân
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Subpage Route Rendering: Resident Detail Page
  if (isDetailResident) {
    return (
      <ResidentDetailPage
        id={detailPathId || undefined}
        resident={residentForDetail}
        residents={residents}
        households={households}
        onBack={() => {
          navigate(ROUTES.DASHBOARD_RESIDENTS);
        }}
        onEdit={(r) => {
          navigate(`/edit_resident/${encodeURIComponent(r.id)}`);
        }}
        onNavigateToGis={onNavigateToGis}
        showToast={showToast}
      />
    );
  }

  // Subpage Route Rendering: Edit Resident Page
  if (isEditResident) {
    return (
      <EditResidentPage
        id={editingResidentId || undefined}
        resident={residentToEdit}
        residents={residents}
        households={households}
        onSave={(updated) => {
          if (onUpdateResidents) {
            onUpdateResidents((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          }
          navigate(ROUTES.DASHBOARD_RESIDENTS);
        }}
        onBack={() => {
          navigate(ROUTES.DASHBOARD_RESIDENTS);
        }}
        showToast={showToast}
      />
    );
  }

  // Subpage Route Rendering: Add Resident / Foreigner Page
  if (isAddResident || isAddForeigner) {
    return (
      <AddResidentPage
        residents={residents}
        households={households}
        initialIsForeigner={isAddForeigner}
        onAdd={(newResident) => {
          if (onAddResident) {
            onAddResident(newResident);
          } else if (onUpdateResidents) {
            onUpdateResidents((prev) => [newResident, ...prev]);
          }
          navigate(ROUTES.DASHBOARD_RESIDENTS);
        }}
        onBack={() => {
          navigate(ROUTES.DASHBOARD_RESIDENTS);
        }}
        showToast={showToast}
      />
    );
  }

  // Subpage Route Rendering: Import Residents Page
  if (isImportResidents) {
    return (
      <ImportResidentsPage
        residents={residents}
        households={households}
        onImport={(imported) => {
          if (onUpdateResidents) {
            onUpdateResidents((prev) => [...imported, ...prev]);
          }
          navigate(ROUTES.DASHBOARD_RESIDENTS);
        }}
        onBack={() => {
          navigate(ROUTES.DASHBOARD_RESIDENTS);
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-emerald-400 border-emerald-500/30"
              : toastMessage.type === "error"
              ? "bg-rose-900 text-rose-200 border-rose-500/40"
              : "bg-slate-900 text-slate-100 border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === "info" && <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <Card className="border-border bg-white shadow-xs rounded-2xl overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" className="gap-1.5 px-3 py-1 font-semibold text-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Chuẩn CSDL Quốc Gia 06
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground border-slate-200">
                Khu phố 3, Phường An Phú, TP. Hồ Chí Minh
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                {residents.length.toLocaleString("vi-VN")} nhân khẩu
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sổ Quản Lý Cư Dân & Định Danh Số
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Hệ thống theo dõi nhân khẩu thường trú, tạm trú, cư dân nước ngoài, phân tích thời hạn tạm trú tự động
              và hỗ trợ cấp giấy xác nhận cư trú CT-07 trực tuyến.
            </p>
          </div>

          {/* Action Buttons using shadcn UI */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-2 font-medium shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Xuất Excel ({filteredResidents.length})</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.IMPORT_RESIDENTS)}
              className="gap-2 font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50/60 shadow-2xs cursor-pointer"
              title="Chuyển sang trang nạp dữ liệu cư dân (/import_residents)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Nhập Dữ Liệu</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.ADD_FOREIGNER)}
              className="gap-2 font-medium text-blue-700 border-blue-200 hover:bg-blue-50/60 shadow-2xs cursor-pointer"
              title="Chuyển sang trang khai báo người nước ngoài (/add_foreigner)"
            >
              <Globe className="w-4 h-4 text-blue-600" />
              <span>+ Người Nước Ngoài</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(ROUTES.ADD_RESIDENT)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
              title="Chuyển sang trang thêm nhân khẩu mới (/add_resident)"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Nhân Khẩu</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards Grid using shadcn UI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Tổng nhân khẩu */}
        <Card className="rounded-xl border-border hover:border-slate-300 transition-all shadow-xs hover:shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tổng Nhân Khẩu</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.total.toLocaleString("vi-VN")}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span className="text-blue-600 font-semibold">{stats.maleCount} Nam</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">{stats.femaleCount} Nữ</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Thường trú */}
        <Card
          onClick={() => setActiveTabFilter(activeTabFilter === "thuongtru" ? "all" : "thuongtru")}
          className={`rounded-xl border-border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            activeTabFilter === "thuongtru" ? "ring-2 ring-emerald-500 bg-emerald-50/30" : "hover:border-emerald-300"
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Thường Trú</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-800">
              {stats.thuongTruCount.toLocaleString("vi-VN")}
            </div>
            <p className="mt-2 text-xs text-muted-foreground truncate">
              Hộ khẩu thường trú tại KP3
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Tạm trú */}
        <Card
          onClick={() => setActiveTabFilter(activeTabFilter === "tamtru" ? "all" : "tamtru")}
          className={`rounded-xl border-border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            activeTabFilter === "tamtru" ? "ring-2 ring-blue-500 bg-blue-50/30" : "hover:border-blue-300"
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tạm Trú / Lưu Trú</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-blue-700">
              {stats.tamTruCount.toLocaleString("vi-VN")}
            </div>
            <p className="mt-2 text-xs text-muted-foreground truncate">
              Nhà trọ, chung cư, khách trọ
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Cảnh báo tạm trú */}
        <Card
          onClick={() => setActiveTabFilter(activeTabFilter === "expiring_soon" ? "all" : "expiring_soon")}
          className={`rounded-xl border-border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            activeTabFilter === "expiring_soon" ? "ring-2 ring-amber-500 bg-amber-50/40" : "hover:border-amber-300"
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Cảnh Báo Hết Hạn</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-amber-700">
              {stats.expiringSoonCount}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium">
              <span className="text-amber-800">Sắp hết hạn ≤30 ngày</span>
              {stats.expiredCount > 0 && (
                <span className="text-rose-700 font-bold">({stats.expiredCount} quá hạn)</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Cư dân Nước Ngoài */}
        <Card
          onClick={() => setActiveTabFilter(activeTabFilter === "foreigner" ? "all" : "foreigner")}
          className={`rounded-xl border-border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            activeTabFilter === "foreigner" ? "ring-2 ring-indigo-500 bg-indigo-50/30" : "hover:border-indigo-300"
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">Người Nước Ngoài</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-indigo-700">
              {stats.foreignerCount}
            </div>
            <p className="mt-2 text-xs text-muted-foreground truncate">
              Khai báo tạm trú CA Phường
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Filter & Search Tooling Bar */}
      <Card className="border-border bg-white shadow-xs rounded-2xl">
        <div className="p-4 sm:p-5 space-y-4">
          {/* Search Input & View Toggle */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo họ tên, số CCCD / Hộ chiếu, số điện thoại, quê quán, địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-10 text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Secondary Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Gender selector */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Giới tính: Tất cả</option>
                <option value="Nam">Nam ({stats.maleCount})</option>
                <option value="Nữ">Nữ ({stats.femaleCount})</option>
              </select>

              {/* Policy selector */}
              <select
                value={policyFilter}
                onChange={(e) => setPolicyFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Độ tuổi & Chính sách: Tất cả</option>
                <option value="elderly">Người cao tuổi (≥60 tuổi: {stats.elderlyCount})</option>
                <option value="children">Trẻ em (&lt;14 tuổi: {stats.childCount})</option>
                <option value="labor">Độ tuổi lao động (15 - 59 tuổi)</option>
                <option value="poor">Hộ nghèo / Cận nghèo</option>
                <option value="policy">Gia đình chính sách / Người có công</option>
              </select>

              {/* View Mode Toggle Buttons */}
              <div className="flex items-center rounded-xl border border-slate-200 p-1 bg-slate-100/80 shadow-2xs">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setViewMode("table")}
                  className={`gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                    viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Chế độ bảng chi tiết"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bảng</span>
                </Button>
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setViewMode("card")}
                  className={`gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                    viewMode === "card" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Chế độ thẻ lưới"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thẻ</span>
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Primary Tabs Filter using shadcn UI Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <Tabs value={activeTabFilter} onValueChange={setActiveTabFilter} className="w-full sm:w-auto">
              <TabsList className="bg-slate-100 p-1 rounded-xl flex-wrap h-auto">
                <TabsTrigger value="all" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
                  Tất cả ({residents.length})
                </TabsTrigger>
                <TabsTrigger value="thuongtru" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
                  Thường trú ({stats.thuongTruCount})
                </TabsTrigger>
                <TabsTrigger value="tamtru" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
                  Tạm trú ({stats.tamTruCount})
                </TabsTrigger>
                <TabsTrigger
                  value="expiring_soon"
                  className="rounded-lg text-xs font-semibold px-3 py-1.5 text-amber-800 data-[state=active]:text-amber-900 cursor-pointer"
                >
                  ⚠️ Sắp hết hạn ({stats.expiringSoonCount})
                </TabsTrigger>
                {stats.expiredCount > 0 && (
                  <TabsTrigger
                    value="expired"
                    className="rounded-lg text-xs font-semibold px-3 py-1.5 text-rose-700 data-[state=active]:text-rose-900 cursor-pointer"
                  >
                    🚨 Quá hạn ({stats.expiredCount})
                  </TabsTrigger>
                )}
                <TabsTrigger value="foreigner" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
                  Người nước ngoài ({stats.foreignerCount})
                </TabsTrigger>
                <TabsTrigger value="party" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
                  Đảng viên ({stats.partyMemberCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Results count indicator */}
            <div className="text-xs text-muted-foreground font-medium">
              Hiển thị <span className="font-bold text-slate-800">{totalItems.toLocaleString("vi-VN")}</span> kết quả phù hợp
            </div>
          </div>
        </div>
      </Card>

      {/* Main Resident Listing: Table or Card */}
      {paginatedResidents.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-slate-200 p-12 text-center bg-slate-50/50">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy cư dân nào phù hợp</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc đang chọn.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setActiveTabFilter("all");
              setGenderFilter("all");
              setPolicyFilter("all");
            }}
            className="mt-4 gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Xóa toàn bộ bộ lọc</span>
          </Button>
        </Card>
      ) : viewMode === "table" ? (
        /* TABLE VIEW USING SHADCN TABLE */
        <Card className="rounded-2xl border-border bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-slate-50/80 border-b border-slate-200/80">
                <TableHead className="w-[280px] font-bold text-slate-700 py-3.5">
                  Nhân khẩu & Số CCCD / Hộ chiếu
                </TableHead>
                <TableHead className="w-[120px] font-bold text-slate-700">Ngày sinh & Giới tính</TableHead>
                <TableHead className="w-[240px] font-bold text-slate-700">Chỗ ở hiện tại tại KP3</TableHead>
                <TableHead className="w-[200px] font-bold text-slate-700">Thường trú gốc / Quê quán</TableHead>
                <TableHead className="w-[180px] font-bold text-slate-700">Tình trạng cư trú & Hạn</TableHead>
                <TableHead className="w-[130px] font-bold text-slate-700 text-right pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResidents.map((res) => {
                const isForeign = isForeignResident(res);
                const expiry =
                  res.status === "Tạm trú" && res.temporaryExpDate
                    ? getTemporaryResidenceExpiryStatus(res.temporaryExpDate)
                    : null;
                const accommodation = parseAccommodationInfo(res.address || res.currentAddress || res.notes);

                return (
                  <TableRow
                    key={res.id}
                    className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 cursor-pointer group"
                    onClick={() => handleOpenDetail(res)}
                  >
                    {/* Column 1: Citizen Name & CCCD */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar initials with gender color */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            res.gender === "Nữ"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isForeign ? getCountryFlag(res.nationality) : res.fullName?.charAt(0).toUpperCase()}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {res.fullName}
                            </span>
                            {isForeign && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50">
                                {res.nationality || "Nước ngoài"}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono font-medium text-slate-700">{res.cccd}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCccd(res.cccd, e)}
                              className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Sao chép số CCCD"
                            >
                              {copiedCccd === res.cccd ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {res.phone && res.phone !== "N/A" && res.phone !== "Chưa cập nhật" && (
                              <>
                                <span>•</span>
                                <span className="text-[11px] font-mono text-slate-500">{res.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 2: Birth Date & Gender */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5 text-xs">
                        <div className="font-medium text-slate-800">{res.birthDate}</div>
                        <Badge
                          variant={res.gender === "Nam" ? "secondary" : "outline"}
                          className={`text-[10px] px-1.5 py-0 font-medium ${
                            res.gender === "Nữ" ? "border-rose-200 text-rose-700 bg-rose-50" : ""
                          }`}
                        >
                          {res.gender}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Column 3: Current Address */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5 text-xs">
                        <div className="font-medium text-slate-800 line-clamp-1" title={res.address}>
                          {res.address}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          {res.householdId && (
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-slate-200">
                              Hộ: {res.householdId}
                            </Badge>
                          )}
                          {res.relationToOwner && (
                            <span className="text-slate-500">({res.relationToOwner})</span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 4: Permanent Address / Hometown */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5 text-xs">
                        <div
                          className="text-slate-700 font-medium line-clamp-1"
                          title={res.permanentAddress || res.hometown || "Chưa cập nhật"}
                        >
                          {res.permanentAddress || res.hometown || "Chưa cập nhật"}
                        </div>
                        {res.occupation && (
                          <div className="text-[11px] text-slate-500 truncate">{res.occupation}</div>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 5: Status & Expiry */}
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        {res.status === "Thường trú" ? (
                          <Badge variant="success" className="text-[11px] px-2 py-0.5 font-semibold">
                            Thường trú
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-[11px] px-2 py-0.5 font-semibold">
                            Tạm trú
                          </Badge>
                        )}

                        {/* Expiry Badge */}
                        {expiry && (
                          <div>
                            {expiry.status === "expired" ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-semibold gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{expiry.label}</span>
                              </Badge>
                            ) : expiry.status === "expiring_soon" ? (
                              <Badge
                                variant="warning"
                                className="text-[10px] px-1.5 py-0 font-semibold gap-1 animate-pulse"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>{expiry.label}</span>
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-slate-500 block truncate font-mono">
                                Hết hạn: {res.temporaryExpDate}
                              </span>
                            )}
                          </div>
                        )}

                        {accommodation?.hostelName && (
                          <div className="text-[10px] text-slate-500 truncate" title={accommodation.hostelName}>
                            🏠 {accommodation.hostelName}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 6: Action Buttons */}
                    <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetail(res)}
                          className="h-8 w-8 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleNavigateGis(res)}
                          className="h-8 w-8 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Định vị trên Bản đồ GIS"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenCT07(res)}
                          className="h-8 w-8 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                          title="In Giấy Xác Nhận Cư Trú (CT-07)"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(res)}
                          className="h-8 w-8 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setResidentToDelete(res);
                            setShowDeleteDialog(true);
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Xóa cư dân"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* CARD GRID VIEW USING SHADCN CARD */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedResidents.map((res) => {
            const isForeign = isForeignResident(res);
            const expiry =
              res.status === "Tạm trú" && res.temporaryExpDate
                ? getTemporaryResidenceExpiryStatus(res.temporaryExpDate)
                : null;
            const accommodation = parseAccommodationInfo(res.address || res.currentAddress || res.notes);

            return (
              <Card
                key={res.id}
                onClick={() => handleOpenDetail(res)}
                className="rounded-2xl border-border hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between bg-white group"
              >
                <CardHeader className="p-4 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                          res.gender === "Nữ"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isForeign ? getCountryFlag(res.nationality) : res.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {res.fullName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-mono">{res.cccd}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCccd(res.cccd, e)}
                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Sao chép số CCCD"
                          >
                            {copiedCccd === res.cccd ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={res.status === "Thường trú" ? "success" : "info"}
                      className="text-xs font-semibold shrink-0"
                    >
                      {res.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-muted-foreground">Sinh ngày & Giới tính:</span>
                    <span className="font-semibold text-slate-800">
                      {res.birthDate} ({res.gender})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-slate-800">{res.address}</span>
                    </div>

                    {res.permanentAddress && res.permanentAddress !== res.address && (
                      <div className="flex items-start gap-1.5 text-muted-foreground text-[11px]">
                        <Home className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">Gốc: {res.permanentAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Temporary Expiry Banner if applicable */}
                  {expiry && (
                    <div className="pt-1">
                      {expiry.status === "expired" ? (
                        <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{expiry.label}</span>
                        </div>
                      ) : expiry.status === "expiring_soon" ? (
                        <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 font-medium animate-pulse">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{expiry.label}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Hạn tạm trú: {res.temporaryExpDate}
                        </div>
                      )}
                    </div>
                  )}

                  {accommodation?.hostelName && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                      <span className="truncate">🏠 {accommodation.hostelName}</span>
                      {accommodation.phone && (
                        <a
                          href={`tel:${accommodation.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-700 font-mono font-medium hover:underline"
                        >
                          {accommodation.phone}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter
                  className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleOpenDetail(res)}
                    className="gap-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleNavigateGis(res)}
                      className="h-7 w-7 text-slate-600 hover:text-blue-700 rounded-md cursor-pointer"
                      title="Bản đồ GIS"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenCT07(res)}
                      className="h-7 w-7 text-slate-600 hover:text-amber-700 rounded-md cursor-pointer"
                      title="In CT-07"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditModal(res)}
                      className="h-7 w-7 text-slate-600 hover:text-indigo-700 rounded-md cursor-pointer"
                      title="Sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setResidentToDelete(res);
                        setShowDeleteDialog(true);
                      }}
                      className="h-7 w-7 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Bar using shadcn Button */}
      {totalPages > 1 && (
        <Card className="border-border bg-white p-3 rounded-2xl shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Hiển thị{" "}
              <span className="font-semibold text-slate-800">
                {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              trên tổng số <span className="font-semibold text-slate-800">{totalItems.toLocaleString("vi-VN")}</span> cư dân
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </Button>

              {/* Page numbers preview */}
              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-semibold text-slate-800">
                  Trang {validCurrentPage} / {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="gap-1 cursor-pointer"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>

              {/* Page size dropdown */}
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="ml-2 h-7 px-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer"
              >
                <option value={15}>15 / trang</option>
                <option value={30}>30 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* =========================================================================
          DIALOG 1: DETAILED RESIDENT MODAL (SHADCN UI DIALOG + TABS)
         ========================================================================= */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent
          className="max-w-3xl mx-auto max-h-[92vh] overflow-y-auto p-0 rounded-2xl"
          onClose={() => setShowDetailDialog(false)}
        >
          {selectedResident && (
            <div>
              {/* Header Profile Banner */}
              <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-lg ${
                        selectedResident.gender === "Nữ"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      }`}
                    >
                      {isForeignResident(selectedResident)
                        ? getCountryFlag(selectedResident.nationality)
                        : selectedResident.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">
                          {selectedResident.fullName}
                        </h2>
                        <Badge
                          variant={selectedResident.status === "Thường trú" ? "success" : "info"}
                          className="text-xs"
                        >
                          {selectedResident.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300">
                        <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md">
                          CCCD: {selectedResident.cccd}
                        </span>
                        <span>•</span>
                        <span>Sinh ngày: {selectedResident.birthDate}</span>
                        <span>•</span>
                        <span>{selectedResident.gender}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCT07(selectedResident)}
                      className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>In Mẫu CT-07</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleOpenEditModal(selectedResident);
                        setShowDetailDialog(false);
                      }}
                      className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs Content */}
              <div className="p-6">
                <Tabs value={detailActiveTab} onValueChange={setDetailActiveTab}>
                  <TabsList className="bg-slate-100 p-1 rounded-xl mb-4">
                    <TabsTrigger value="identity" className="rounded-lg text-xs font-semibold px-4 cursor-pointer">
                      Định danh & Nhân khẩu
                    </TabsTrigger>
                    <TabsTrigger value="residence" className="rounded-lg text-xs font-semibold px-4 cursor-pointer">
                      Cư trú & Hộ gia đình
                    </TabsTrigger>
                    <TabsTrigger value="hostel" className="rounded-lg text-xs font-semibold px-4 cursor-pointer">
                      Tạm trú & Nhà trọ
                    </TabsTrigger>
                    {isForeignResident(selectedResident) && (
                      <TabsTrigger value="foreigner" className="rounded-lg text-xs font-semibold px-4 cursor-pointer">
                        Người nước ngoài
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Tab 1: Identity */}
                  <TabsContent value="identity" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Số định danh cá nhân / CCCD</div>
                        <div className="text-sm font-bold font-mono text-slate-900">{selectedResident.cccd}</div>
                        <div className="text-slate-500 text-[11px]">
                          Cấp ngày: {selectedResident.idIssueDate || "15/05/2021"} • Nơi cấp: {selectedResident.idIssuePlace || "Cục Cảnh sát QLHC về TTXH"}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Số điện thoại liên hệ</div>
                        <div className="text-sm font-bold font-mono text-slate-900">
                          {selectedResident.phone || "Chưa cập nhật"}
                        </div>
                        <div className="text-slate-500 text-[11px]">Dân tộc: {selectedResident.ethnicity || "Kinh"} • Tôn giáo: {selectedResident.religion || "Không"}</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Quê quán gốc</div>
                        <div className="text-sm font-bold text-slate-900">{selectedResident.hometown || "Chưa cập nhật"}</div>
                        <div className="text-slate-500 text-[11px]">Quốc tịch: {selectedResident.nationality || "Việt Nam"}</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Trình độ học vấn & Nghề nghiệp</div>
                        <div className="text-sm font-bold text-slate-900">
                          {selectedResident.education || "12/12"} • {selectedResident.occupation || "Tự do"}
                        </div>
                        <div className="text-slate-500 text-[11px]">Nơi làm việc: {selectedResident.workplace || "Chưa cập nhật"}</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Tình trạng hôn nhân</div>
                        <div className="text-sm font-bold text-slate-900">{selectedResident.maritalStatus || "Chưa cập nhật"}</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Mã số thẻ BHYT</div>
                        <div className="text-sm font-bold font-mono text-slate-900">
                          {selectedResident.healthInsuranceNumber || "Chưa cập nhật"}
                        </div>
                        <div className="text-slate-500 text-[11px]">Nghĩa vụ quân sự: {selectedResident.militaryServiceStatus || "Đã hoàn thành"}</div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Residence */}
                  <TabsContent value="residence" className="space-y-4">
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Chỗ ở hiện tại tại KP3</div>
                        <div className="text-sm font-bold text-slate-900">{selectedResident.address}</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="text-slate-500 font-medium">Nơi thường trú gốc</div>
                        <div className="text-sm font-bold text-slate-900">
                          {selectedResident.permanentAddress || selectedResident.address}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Mã Sổ hộ khẩu điện tử</div>
                          <div className="text-sm font-bold font-mono text-emerald-800">
                            {selectedResident.householdId || "Chưa liên kết"}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Quan hệ với chủ hộ</div>
                          <div className="text-sm font-bold text-slate-900">
                            {selectedResident.relationToOwner || "Chưa xác định"}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Họ tên cha</div>
                          <div className="text-sm font-bold text-slate-900">{selectedResident.fatherName || "Chưa cập nhật"}</div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Họ tên mẹ</div>
                          <div className="text-sm font-bold text-slate-900">{selectedResident.motherName || "Chưa cập nhật"}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 3: Hostel / Temporary Exp */}
                  <TabsContent value="hostel" className="space-y-4">
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Ngày đăng ký tạm trú</div>
                          <div className="text-sm font-bold font-mono text-slate-900">
                            {selectedResident.temporaryRegDate || "Chưa cập nhật"}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Ngày hết hạn tạm trú</div>
                          <div className="text-sm font-bold font-mono text-slate-900">
                            {selectedResident.temporaryExpDate || "Chưa cập nhật"}
                          </div>
                        </div>
                      </div>

                      {/* Expiry Status */}
                      {selectedResident.temporaryExpDate && (
                        <div className="p-3 rounded-xl bg-slate-50 space-y-1.5">
                          <div className="text-slate-500 font-medium">Trạng thái thời hạn tạm trú</div>
                          <div>
                            {(() => {
                              const exp = getTemporaryResidenceExpiryStatus(selectedResident.temporaryExpDate);
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

                      {/* Accommodation Details */}
                      {(() => {
                        const acc = parseAccommodationInfo(selectedResident.currentAddress || selectedResident.temporaryAddress || selectedResident.address || selectedResident.notes);
                        return (
                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-600" />
                              <span>Thông tin Cơ sở Lưu trú / Nhà trọ</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500">Tên nhà trọ / Chủ trọ:</span>{" "}
                                <strong className="text-slate-900">{acc.hostelName || acc.owner || "Chưa cập nhật"}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500">SĐT Chủ nhà trọ:</span>{" "}
                                {acc.phone ? (
                                  <a href={`tel:${acc.phone}`} className="text-emerald-700 font-mono font-bold hover:underline">
                                    {acc.phone}
                                  </a>
                                ) : (
                                  <span className="text-slate-500">Chưa có</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </TabsContent>

                  {/* Tab 4: Foreigner details */}
                  {isForeignResident(selectedResident) && (
                    <TabsContent value="foreigner" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Quốc tịch</div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>{getCountryFlag(selectedResident.nationality)}</span>
                            <span>{selectedResident.nationality}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Số Hộ chiếu</div>
                          <div className="text-sm font-bold font-mono text-slate-900">
                            {selectedResident.passportNumber || selectedResident.cccd}
                          </div>
                          <div className="text-[11px] text-slate-500">Hạn hộ chiếu: {selectedResident.passportExpiryDate || "Chưa cập nhật"}</div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Loại thị thực / Thẻ cư trú</div>
                          <div className="text-sm font-bold text-slate-900">
                            {selectedResident.visaOrCardType || "Thẻ tạm trú (TRC)"}
                          </div>
                          <div className="text-[11px] text-slate-500">Thời hạn đến: {selectedResident.visaValidUntil || "Chưa cập nhật"}</div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                          <div className="text-slate-500 font-medium">Mã khai báo tạm trú trực tuyến CA Phường</div>
                          <div className="text-sm font-bold font-mono text-emerald-800">
                            {selectedResident.temporaryRegistrationCode || "Đã khai báo"}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>

              <DialogFooter className="bg-slate-50 p-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                  className="cursor-pointer"
                >
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 2: ADD / EDIT RESIDENT MODAL (SHADCN UI DIALOG + FORM)
         ========================================================================= */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent
          className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto p-0 rounded-2xl"
          onClose={() => setShowFormDialog(false)}
        >
          <form onSubmit={handleSaveResident}>
            <DialogHeader className="p-6 pb-4 border-b border-slate-200">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>{isEditing ? "Chỉnh Sửa Hồ Sơ Cư Dân" : "Thêm Hồ Sơ Nhân Khẩu Mới"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Điền đầy đủ thông tin định danh và cư trú theo chuẩn CSDL Quốc gia về Dân cư.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <Tabs value={formActiveTab} onValueChange={setFormActiveTab}>
                <TabsList className="bg-slate-100 p-1 rounded-xl mb-4 w-full justify-start overflow-x-auto">
                  <TabsTrigger value="basic" className="rounded-lg text-xs font-semibold px-3 cursor-pointer">
                    Cơ bản
                  </TabsTrigger>
                  <TabsTrigger value="address" className="rounded-lg text-xs font-semibold px-3 cursor-pointer">
                    Địa chỉ & Hộ khẩu
                  </TabsTrigger>
                  <TabsTrigger value="temporary" className="rounded-lg text-xs font-semibold px-3 cursor-pointer">
                    Tạm trú / Nhà trọ
                  </TabsTrigger>
                  <TabsTrigger value="extra" className="rounded-lg text-xs font-semibold px-3 cursor-pointer">
                    Đoàn thể & Y tế
                  </TabsTrigger>
                  {formData.isForeigner && (
                    <TabsTrigger value="foreigner" className="rounded-lg text-xs font-semibold px-3 cursor-pointer">
                      Người nước ngoài
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Tab: Basic info */}
                <TabsContent value="basic" className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Họ và Tên *</label>
                      <Input
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="VD: NGUYỄN VĂN AN"
                        className="h-9 text-xs uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Giới tính</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Nam" | "Nữ" })}
                        className="w-full h-9 px-3 text-xs rounded-md border border-slate-200 bg-white"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Ngày sinh (DD/MM/YYYY)</label>
                      <Input
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        placeholder="DD/MM/YYYY"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Số CCCD / Định danh *</label>
                      <Input
                        required
                        value={formData.cccd}
                        onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                        placeholder="12 chữ số CCCD"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="09xxxxxxxx"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Diện cư trú</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full h-9 px-3 text-xs rounded-md border border-slate-200 bg-white"
                      >
                        <option value="Thường trú">Thường trú</option>
                        <option value="Tạm trú">Tạm trú</option>
                        <option value="Tạm vắng">Tạm vắng</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Address & Household */}
                <TabsContent value="address" className="space-y-3.5">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Chỗ ở hiện nay tại Khu phố 3</label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Số nhà, tên đường, KP3, An Phú..."
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Nơi thường trú gốc (ở quê)</label>
                      <Input
                        value={formData.permanentAddress}
                        onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                        placeholder="Địa chỉ thường trú gốc theo CCCD..."
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Mã hộ khẩu (HK-xxx)</label>
                        <Input
                          value={formData.householdId}
                          onChange={(e) => setFormData({ ...formData, householdId: e.target.value })}
                          placeholder="HK-001"
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Quan hệ với chủ hộ</label>
                        <Input
                          value={formData.relationToOwner}
                          onChange={(e) => setFormData({ ...formData, relationToOwner: e.target.value })}
                          placeholder="Chủ hộ / Vợ / Con / Khách trọ..."
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Họ tên cha</label>
                        <Input
                          value={formData.fatherName}
                          onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                          placeholder="Họ tên cha"
                          className="h-9 text-xs uppercase"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Họ tên mẹ</label>
                        <Input
                          value={formData.motherName}
                          onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                          placeholder="Họ tên mẹ"
                          className="h-9 text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Temporary residency info */}
                <TabsContent value="temporary" className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Ngày đăng ký tạm trú</label>
                      <Input
                        value={formData.temporaryRegDate}
                        onChange={(e) => setFormData({ ...formData, temporaryRegDate: e.target.value })}
                        placeholder="DD/MM/YYYY"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Ngày hết hạn tạm trú</label>
                      <Input
                        value={formData.temporaryExpDate}
                        onChange={(e) => setFormData({ ...formData, temporaryExpDate: e.target.value })}
                        placeholder="DD/MM/YYYY"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">Ghi chú nhà trọ / Chủ trọ</label>
                      <Input
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="VD: Nhà trọ Phạm Văn Bình (SĐT: 0913137155) Phòng 12"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Extra / Social */}
                <TabsContent value="extra" className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Nghề nghiệp</label>
                      <Input
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        placeholder="Kinh doanh / Công nhân / Kỹ sư..."
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Mã BHYT</label>
                      <Input
                        value={formData.healthInsuranceNumber}
                        onChange={(e) => setFormData({ ...formData, healthInsuranceNumber: e.target.value })}
                        placeholder="Mã thẻ BHYT"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Diện chính sách / Đoàn thể</label>
                      <Input
                        value={formData.policyGroup}
                        onChange={(e) => setFormData({ ...formData, policyGroup: e.target.value })}
                        placeholder="Bình thường / Đảng viên / Thương binh..."
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Trình độ học vấn</label>
                      <Input
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        placeholder="12/12 / Đại học..."
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Foreigner */}
                {formData.isForeigner && (
                  <TabsContent value="foreigner" className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Quốc tịch</label>
                        <Input
                          value={formData.nationality}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          placeholder="Hàn Quốc / Nhật Bản / Mỹ..."
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Số Hộ chiếu</label>
                        <Input
                          value={formData.passportNumber}
                          onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                          placeholder="Số hộ chiếu"
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Loại thị thực / TRC</label>
                        <Input
                          value={formData.visaOrCardType}
                          onChange={(e) => setFormData({ ...formData, visaOrCardType: e.target.value as any })}
                          placeholder="Thẻ tạm trú (TRC) / Thị thực LĐ..."
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Mã khai báo CA Phường</label>
                        <Input
                          value={formData.temporaryRegistrationCode}
                          onChange={(e) => setFormData({ ...formData, temporaryRegistrationCode: e.target.value })}
                          placeholder="Mã số khai báo"
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormDialog(false)}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu Cập Nhật" : "Tạo Hồ Sơ Cư Dân"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 3: OFFICIAL POLICE CT-07 PRINT MODAL
         ========================================================================= */}
      <Dialog open={showCT07Dialog} onOpenChange={setShowCT07Dialog}>
        <DialogContent
          className="max-w-2xl mx-auto max-h-[92vh] overflow-y-auto p-0 rounded-2xl"
          onClose={() => setShowCT07Dialog(false)}
        >
          {residentForCT07 && (
            <div>
              <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <DialogTitle className="text-sm font-bold text-white">
                    Giấy Xác Nhận Thông Tin Về Cư Trú (Mẫu CT-07)
                  </DialogTitle>
                </div>
              </DialogHeader>

              {/* Printable Content */}
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

                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold uppercase tracking-tight text-slate-900">
                    XÁC NHẬN THÔNG TIN VỀ CƯ TRÚ
                  </h2>
                  <p className="text-xs text-slate-500 font-sans italic">
                    Kính gửi: Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh
                  </p>
                </div>

                <div className="space-y-2.5 text-xs font-sans">
                  <p>
                    <strong>1. Họ, chữ đệm và tên khai sinh:</strong>{" "}
                    <span className="uppercase font-bold text-emerald-800">{residentForCT07.fullName}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>2. Ngày, tháng, năm sinh:</strong> {residentForCT07.birthDate}
                    </p>
                    <p>
                      <strong>3. Giới tính:</strong> {residentForCT07.gender}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>4. Số định danh cá nhân / CCCD:</strong>{" "}
                      <span className="font-mono font-bold">{residentForCT07.cccd}</span>
                    </p>
                    <p>
                      <strong>5. Dân tộc:</strong> {residentForCT07.ethnicity || "Kinh"} -{" "}
                      <strong>Tôn giáo:</strong> {residentForCT07.religion || "Không"}
                    </p>
                  </div>
                  <p>
                    <strong>6. Quốc tịch:</strong> {residentForCT07.nationality || "Việt Nam"}
                  </p>
                  <p>
                    <strong>7. Quê quán:</strong> {residentForCT07.hometown || "Chưa cập nhật"}
                  </p>
                  <p>
                    <strong>8. Nơi thường trú:</strong>{" "}
                    {residentForCT07.permanentAddress || residentForCT07.address}
                  </p>
                  <p>
                    <strong>9. Nơi ở hiện tại:</strong>{" "}
                    {residentForCT07.temporaryAddress || residentForCT07.address}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>10. Mã số hộ khẩu:</strong>{" "}
                      <span className="font-mono font-semibold">{residentForCT07.householdId}</span>
                    </p>
                    <p>
                      <strong>11. Quan hệ với chủ hộ:</strong> {residentForCT07.relationToOwner}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>12. Trình độ học vấn:</strong> {residentForCT07.education || "12/12"}
                    </p>
                    <p>
                      <strong>13. Nghề nghiệp:</strong> {residentForCT07.occupation || "Tự do"}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-between items-start text-xs font-sans">
                  <div className="text-center space-y-1">
                    <p className="font-bold">NGƯỜI YÊU CẦU XÁC NHẬN</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                    <div className="h-16" />
                    <p className="font-semibold">{residentForCT07.fullName}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="italic text-[11px]">
                      TP. Thủ Đức, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{" "}
                      {new Date().getFullYear()}
                    </p>
                    <p className="font-bold text-slate-900">CÔNG AN PHƯỜNG AN PHÚ</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký, đóng dấu)</p>
                    <div className="h-16 flex items-center justify-center">
                      <span className="px-2.5 py-1 border border-red-500 text-red-600 rounded text-[9px] font-bold uppercase rotate-[-6deg]">
                        ĐÃ XÁC NHẬN ĐIỆN TỬ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowCT07Dialog(false)}
                  className="cursor-pointer"
                >
                  Đóng
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Văn Bản Ngay</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 4: SMART DATA IMPORT MODAL (SHADCN UI DIALOG)
         ========================================================================= */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent
          className="max-w-3xl mx-auto max-h-[90vh] overflow-y-auto p-0 rounded-2xl"
          onClose={() => setShowImportDialog(false)}
        >
          <DialogHeader className="p-6 pb-4 border-b border-slate-200">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Nạp Dữ Liệu Cư Dân Từ Excel Hoặc Dán Văn Bản</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dán các dòng từ bảng Excel (Họ tên, CCCD, Ngày sinh, Giới tính, Địa chỉ, Diện cư trú)
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Dán dữ liệu trực tiếp (Copy các hàng từ Excel/Google Sheets rồi paste vào đây):
              </label>
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Nguyễn Văn An&#9;079090001122&#9;15/08/1992&#9;Nam&#9;17 Song Hành&#9;Thường trú&#10;Trần Thị Mai&#9;079192003344&#9;20/11/1995&#9;Nữ&#9;25 Mai Chí Thọ&#9;Tạm trú"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Cấu trúc cột gợi ý: Họ tên [Tab] CCCD [Tab] Ngày sinh [Tab] Giới tính [Tab] Địa chỉ</span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleProcessImport}
                  className="gap-1 cursor-pointer font-semibold text-emerald-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Phân tích dữ liệu</span>
                </Button>
              </div>
            </div>

            {/* Preview table if parsed */}
            {importParsedPreview.length > 0 && (
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Xem trước ({importParsedPreview.length} cư dân nhận diện được):</span>
                  <Badge variant="success" className="text-[10px]">
                    Sẵn sàng lưu
                  </Badge>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs py-2">Họ tên</TableHead>
                        <TableHead className="text-xs py-2">CCCD</TableHead>
                        <TableHead className="text-xs py-2">Ngày sinh</TableHead>
                        <TableHead className="text-xs py-2">Giới tính</TableHead>
                        <TableHead className="text-xs py-2">Địa chỉ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importParsedPreview.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs py-1.5 font-bold">{row.fullName}</TableCell>
                          <TableCell className="text-xs py-1.5 font-mono">{row.cccd}</TableCell>
                          <TableCell className="text-xs py-1.5">{row.birthDate}</TableCell>
                          <TableCell className="text-xs py-1.5">{row.gender}</TableCell>
                          <TableCell className="text-xs py-1.5 truncate max-w-[150px]">{row.address}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {importParsedPreview.length > 10 && (
                  <p className="text-[11px] text-slate-500 text-center italic">
                    ...và {importParsedPreview.length - 10} dòng khác
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              disabled={importParsedPreview.length === 0}
              onClick={handleConfirmImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              Nạp {importParsedPreview.length} Cư Dân Vào CSDL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 5: DELETE CONFIRMATION MODAL
         ========================================================================= */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent
          className="max-w-md mx-auto p-6 rounded-2xl"
          onClose={() => setShowDeleteDialog(false)}
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa hồ sơ cư dân?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa cư dân{" "}
                <strong className="text-slate-900">{residentToDelete?.fullName}</strong> (CCCD:{" "}
                <span className="font-mono">{residentToDelete?.cccd}</span>) khỏi hệ thống quản lý?
                Hành động này sẽ cập nhật vào CSDL.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(false)}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="cursor-pointer"
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
