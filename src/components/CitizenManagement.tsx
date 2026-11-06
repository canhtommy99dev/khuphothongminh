import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Phone, 
  Calendar, 
  MapPin, 
  CheckCircle,
  Briefcase,
  Printer,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  Check,
  LayoutGrid,
  List,
  Shield,
  Award,
  GraduationCap,
  Building2,
  ClipboardList,
  Eye,
  FileCheck,
  Heart,
  Home,
  CreditCard,
  UserCheck,
  Share2,
  Globe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  Navigation,
  Compass,
  Loader2,
  Database,
  MoreVertical,
  MoreHorizontal
} from "lucide-react";
import { Resident, TargetGisItem } from "../types";
import { generateDefaultCoordinatesForAddress, parseCoordinates as parseGisCoords } from "../utils/gisUtils";
import { getTemporaryResidenceExpiryStatus, parseAccommodationInfo } from "../utils/householdRecognitionUtils";
import * as XLSX from "xlsx";
import Pagination from "./Pagination";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

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

export const getVisaExpiryStatus = (validUntil?: string) => {
  if (!validUntil) return { status: "unknown", daysLeft: null, label: "Chưa rõ thời hạn", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  const parts = validUntil.split("/");
  if (parts.length !== 3) return { status: "unknown", daysLeft: null, label: validUntil, badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  const targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: "expired", daysLeft, label: `Đã hết hạn (${Math.abs(daysLeft)} ngày trước)`, badgeClass: "bg-rose-50 text-rose-700 border-rose-300 font-bold" };
  } else if (daysLeft <= 30) {
    return { status: "expiring_soon", daysLeft, label: `Sắp hết hạn (${daysLeft} ngày)`, badgeClass: "bg-amber-50 text-amber-800 border-amber-300 font-bold" };
  } else {
    return { status: "valid", daysLeft, label: `Còn hạn đến ${validUntil}`, badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300" };
  }
};

interface CitizenManagementProps {
  residents: Resident[];
  onAddResident: (newResident: Resident) => void;
  onDeleteResident: (id: string) => void;
  onUpdateResidents?: (residents: Resident[]) => void;
  onUpdateHouseholds?: (households: any[]) => void;
  households?: any[];
  onNavigateToGis?: (item: TargetGisItem) => void;
}

export default function CitizenManagement({ 
  residents, 
  onAddResident, 
  onDeleteResident,
  onUpdateResidents,
  onUpdateHouseholds,
  households = [],
  onNavigateToGis
}: CitizenManagementProps) {
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [temporaryExpiryFilter, setTemporaryExpiryFilter] = useState("Tất cả");
  const [genderFilter, setGenderFilter] = useState("Tất cả");
  const [policyFilter, setPolicyFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const itemsPerPage = 8;

  const handleDirections = (res: Resident) => {
    // Find household coordinates if available
    const hh = households.find(h => h.code === res.householdId || h.id === res.householdId);
    let coords = hh?.coordinates;
    if (!coords || !parseGisCoords(coords)) {
      const autoGeo = generateDefaultCoordinatesForAddress(res.address, res.id);
      coords = autoGeo.dms;
    }
    if (onNavigateToGis) {
      onNavigateToGis({
        id: res.id,
        type: "household",
        name: `${res.fullName} (${isForeignResident(res) ? (res.nationality || "Nước ngoài") : res.status})`,
        address: res.address,
        coordinates: coords,
        navigateRoute: true
      });
    }
  };

  // Foreign Resident Specific Sub-filters
  const [foreignNationalityFilter, setForeignNationalityFilter] = useState("Tất cả");
  const [foreignVisaTypeFilter, setForeignVisaTypeFilter] = useState("Tất cả");
  const [foreignExpiryFilter, setForeignExpiryFilter] = useState("Tất cả");

  // Print CT07 Certificate Modal State
  const [showCT07Modal, setShowCT07Modal] = useState(false);
  const [residentForCT07, setResidentForCT07] = useState<Resident | null>(null);

  // Print NA17 Foreign Resident Certificate Modal State
  const [showNA17Modal, setShowNA17Modal] = useState(false);
  const [residentForNA17, setResidentForNA17] = useState<Resident | null>(null);

  const handleOpenNA17 = (res: Resident) => {
    setResidentForNA17(res);
    setShowNA17Modal(true);
  };

  // Dropdown actions menu state for citizen rows
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Close dropdown menu on click outside
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveDropdownId(null);
    };
    if (activeDropdownId) {
      window.addEventListener("click", handleDocumentClick);
    }
    return () => {
      window.removeEventListener("click", handleDocumentClick);
    };
  }, [activeDropdownId]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);

  // Open and close detail modal
  const handleOpenDetailModal = (res: Resident) => {
    setSelectedResident(res);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
  };

  // Close detail modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDetailModal) {
        setShowDetailModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDetailModal]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleGenderFilterChange = (val: string) => {
    setGenderFilter(val);
    setCurrentPage(1);
  };

  const handlePolicyFilterChange = (val: string) => {
    setPolicyFilter(val);
    setCurrentPage(1);
  };

  // Excel & Paste Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [pastedRawText, setPastedRawText] = useState("");
  const [isUploadingToDb, setIsUploadingToDb] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");

  // Edit Mode state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showDetailModal || showModal || showImportModal || showCT07Modal || showNA17Modal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDetailModal, showModal, showImportModal, showCT07Modal, showNA17Modal]);

  // Modal active form tab
  const [formActiveTab, setFormActiveTab] = useState<"basic" | "residence" | "career" | "policy" | "foreigner">("basic");

  // Comprehensive Form State with all 26 fields + Foreign Resident Fields
  const initialFormState = {
    fullName: "",
    gender: "Nam" as "Nam" | "Nữ",
    birthDate: "",
    cccd: "",
    idIssueDate: "10/05/2021",
    idIssuePlace: "Cục Cảnh sát QLHC về TTXH",
    ethnicity: "Kinh",
    religion: "Không",
    nationality: "Việt Nam",
    hometown: "",
    phone: "",
    status: "Thường trú" as "Thường trú" | "Tạm trú" | "Tạm vắng",
    occupation: "",
    education: "Đại học",
    workplace: "",
    maritalStatus: "Đã kết hôn" as "Độc thân" | "Đã kết hôn" | "Ly hôn" | "Góa",
    address: "42/3 Lương Định Của, Phường An Phú",
    permanentAddress: "42/3 Lương Định Của, KP3, Phường An Phú, TP. Thủ Đức, TP.HCM",
    temporaryAddress: "42/3 Lương Định Của, KP3, Phường An Phú, TP. Thủ Đức, TP.HCM",
    householdId: "HK-301",
    relationToOwner: "Thành viên",
    healthInsuranceNumber: "",
    militaryServiceStatus: "Đã hoàn thành nghĩa vụ quân sự",
    policyGroup: "Bình thường",
    emergencyContact: "",
    notes: "",
    // Foreign resident fields
    isForeigner: false,
    passportNumber: "",
    passportExpiryDate: "",
    visaOrCardType: "Thẻ tạm trú (TRC)" as "Thẻ tạm trú (TRC)" | "Thẻ thường trú (PRC)" | "Thị thực LĐ" | "Thị thực ĐT" | "Thị thực TT" | "Miễn thị thực / E-Visa",
    visaOrCardNumber: "",
    visaValidFrom: "",
    visaValidUntil: "",
    temporaryRegistrationCode: "",
    temporaryRegistrationDate: "",
    temporaryRegistrationStatus: "Đã khai báo" as "Đã khai báo" | "Chờ xác nhận" | "Chưa khai báo" | "Hết hạn",
    workPermitNumber: "",
    sponsoringOrganization: "",
    landlordContact: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleEditClick = (res: Resident) => {
    setIsEditMode(true);
    setEditingResidentId(res.id);
    setFormActiveTab("basic");
    const isForeign = isForeignResident(res);
    setFormData({
      fullName: res.fullName || "",
      gender: res.gender || "Nam",
      birthDate: res.birthDate || "",
      cccd: res.cccd || "",
      idIssueDate: res.idIssueDate || "15/05/2021",
      idIssuePlace: res.idIssuePlace || "Cục Cảnh sát QLHC về TTXH",
      ethnicity: res.ethnicity || "Kinh",
      religion: res.religion || "Không",
      nationality: res.nationality || "Việt Nam",
      hometown: res.hometown || "",
      phone: res.phone === "N/A" ? "" : (res.phone || ""),
      status: res.status || "Thường trú",
      occupation: res.occupation === "Tự do" ? "" : (res.occupation || ""),
      education: res.education || "Đại học",
      workplace: res.workplace || "",
      maritalStatus: res.maritalStatus || "Đã kết hôn",
      address: res.address || "",
      permanentAddress: res.permanentAddress || res.address || "",
      temporaryAddress: res.temporaryAddress || res.address || "",
      householdId: res.householdId || "HK-301",
      relationToOwner: res.relationToOwner || "Thành viên",
      healthInsuranceNumber: res.healthInsuranceNumber || "",
      militaryServiceStatus: res.militaryServiceStatus || "Đã hoàn thành nghĩa vụ quân sự",
      policyGroup: res.policyGroup || "Bình thường",
      emergencyContact: res.emergencyContact || "",
      notes: res.notes || "",
      isForeigner: isForeign,
      passportNumber: res.passportNumber || (isForeign ? res.cccd : ""),
      passportExpiryDate: res.passportExpiryDate || "",
      visaOrCardType: res.visaOrCardType || "Thẻ tạm trú (TRC)",
      visaOrCardNumber: res.visaOrCardNumber || "",
      visaValidFrom: res.visaValidFrom || "",
      visaValidUntil: res.visaValidUntil || "",
      temporaryRegistrationCode: res.temporaryRegistrationCode || "",
      temporaryRegistrationDate: res.temporaryRegistrationDate || "",
      temporaryRegistrationStatus: res.temporaryRegistrationStatus || "Đã khai báo",
      workPermitNumber: res.workPermitNumber || "",
      sponsoringOrganization: res.sponsoringOrganization || "",
      landlordContact: res.landlordContact || ""
    });
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingResidentId(null);
    setFormActiveTab("basic");
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenAddForeignerModal = () => {
    setIsEditMode(false);
    setEditingResidentId(null);
    setFormActiveTab("foreigner");
    setFormData({
      ...initialFormState,
      isForeigner: true,
      status: "Tạm trú",
      nationality: "Hàn Quốc",
      ethnicity: "Hàn Quốc",
      religion: "Không",
      hometown: "Seoul, Hàn Quốc",
      idIssuePlace: "Cục Quản lý Xuất nhập cảnh Hàn Quốc",
      visaOrCardType: "Thẻ tạm trú (TRC)",
      temporaryRegistrationStatus: "Đã khai báo"
    });
    setShowModal(true);
  };

  const handleOpenCT07 = (res: Resident) => {
    setResidentForCT07(res);
    setShowCT07Modal(true);
  };

  // Download Sample Excel Template with full fields
  const downloadTemplate = () => {
    const headers = [
      {
        "Họ và Tên": "Nguyễn Văn Hùng",
        "Số CCCD": "079068001234",
        "Ngày cấp CCCD": "15/05/2021",
        "Nơi cấp CCCD": "Cục Cảnh sát QLHC về TTXH",
        "Giới tính": "Nam",
        "Ngày sinh": "15/04/1968",
        "Dân tộc": "Kinh",
        "Tôn giáo": "Không",
        "Quốc tịch": "Việt Nam",
        "Quê quán": "Nam Định",
        "Số điện thoại": "0903829112",
        "Diện cư trú": "Thường trú",
        "Trình độ học vấn": "Thạc sĩ Quản lý Nhà nước",
        "Nghề nghiệp": "Hưu trí / Bí thư chi bộ",
        "Nơi làm việc": "Chi bộ Khu phố 3, Phường An Phú",
        "Tình trạng hôn nhân": "Đã kết hôn",
        "Địa chỉ cư trú": "42/3 Lương Định Của, Phường An Phú",
        "Nơi thường trú gốc": "42/3 Lương Định Của, KP3, Phường An Phú, TP. Thủ Đức, TP.HCM",
        "Nơi ở hiện nay": "42/3 Lương Định Của, KP3, Phường An Phú, TP. Thủ Đức, TP.HCM",
        "Mã hộ khẩu": "HK-301",
        "Quan hệ với chủ hộ": "Chủ hộ",
        "Mã số BHYT": "HT279068001234",
        "Nghĩa vụ quân sự": "Sĩ quan dự bị / Đã hoàn thành",
        "Nhóm chính sách": "Đảng viên / Cán bộ hưu trí",
        "Người liên hệ khẩn cấp": "Trần Thị Lan (Vợ) - 0918345678",
        "Ghi chú": "Bí thư Chi bộ KP3, Đảng viên gương mẫu"
      },
      {
        "Họ và Tên": "Nguyễn Thị Ngọc",
        "Số CCCD": "079073005511",
        "Ngày cấp CCCD": "20/09/2021",
        "Nơi cấp CCCD": "Cục Cảnh sát QLHC về TTXH",
        "Giới tính": "Nữ",
        "Ngày sinh": "11/03/1973",
        "Dân tộc": "Kinh",
        "Tôn giáo": "Không",
        "Quốc tịch": "Việt Nam",
        "Quê quán": "Bình Định",
        "Số điện thoại": "0908123456",
        "Diện cư trú": "Thường trú",
        "Trình độ học vấn": "Dược sĩ Đại học",
        "Nghề nghiệp": "Dược sĩ / Chi ủy viên",
        "Nơi làm việc": "Nhà thuốc An Phú Care",
        "Tình trạng hôn nhân": "Đã kết hôn",
        "Địa chỉ cư trú": "18/2 Lương Định Của, Phường An Phú",
        "Nơi thường trú gốc": "18/2 Lương Định Của, KP3, Phường An Phú, TP. Thủ Đức, TP.HCM",
        "Nơi ở hiện nay": "18/2 Lương Định Của, KP3, Phường An Phú, TP. Thủ Đức, TP.HCM",
        "Mã hộ khẩu": "HK-304",
        "Quan hệ với chủ hộ": "Vợ",
        "Mã số BHYT": "DN479073005511",
        "Nghĩa vụ quân sự": "Không thuộc diện",
        "Nhóm chính sách": "Đảng viên / Chi ủy viên Chi bộ KP3",
        "Người liên hệ khẩn cấp": "Lê Văn Sơn (Chồng) - 0944112233",
        "Ghi chú": "Chi ủy viên, phụ trách an sinh"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh_sach_cu_dan_chuan_CSDL");
    XLSX.writeFile(workbook, "Mau_Danh_Sach_Dan_Cu_Thuong_Tru_KP3_Chuan_CSDL.xlsx");
  };

  // Export full residents to Excel
  const handleExportFullExcel = () => {
    const exportRows = residents.map((r, i) => ({
      "STT": i + 1,
      "Mã cư dân": r.id,
      "Họ và Tên": r.fullName,
      "Số CCCD": r.cccd,
      "Ngày cấp CCCD": r.idIssueDate || "15/05/2021",
      "Nơi cấp CCCD": r.idIssuePlace || "Cục Cảnh sát QLHC về TTXH",
      "Giới tính": r.gender,
      "Ngày sinh": r.birthDate,
      "Dân tộc": r.ethnicity || "Kinh",
      "Tôn giáo": r.religion || "Không",
      "Quốc tịch": r.nationality || "Việt Nam",
      "Quê quán": r.hometown || "",
      "Số điện thoại": r.phone || "",
      "Diện cư trú": r.status,
      "Trình độ học vấn": r.education || "12/12",
      "Nghề nghiệp": r.occupation || "",
      "Nơi làm việc": r.workplace || "",
      "Tình trạng hôn nhân": r.maritalStatus || "Đã kết hôn",
      "Địa chỉ cư trú": r.address,
      "Nơi thường trú gốc": r.permanentAddress || r.address,
      "Nơi ở hiện nay": r.temporaryAddress || r.address,
      "Mã hộ khẩu": r.householdId,
      "Quan hệ với chủ hộ": r.relationToOwner,
      "Mã số BHYT": r.healthInsuranceNumber || "",
      "Nghĩa vụ quân sự": r.militaryServiceStatus || "Đã hoàn thành",
      "Nhóm chính sách / Đoàn thể": r.policyGroup || "Bình thường",
      "Người liên hệ khẩn cấp": r.emergencyContact || "",
      "Ghi chú": r.notes || "",
      "Ngày đăng ký": r.joinDate || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "So_Bo_Quan_Ly_Dan_Cu_KP3");
    XLSX.writeFile(workbook, `Danh_Sach_Dan_Cu_Thuong_Tru_KP3_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export Foreign Residents List to Excel (Báo cáo Công an Phường & Lưu trữ)
  const handleExportForeignResidentsExcel = () => {
    const foreignList = residents.filter(r => isForeignResident(r));
    const exportRows = foreignList.map((r, i) => ({
      "STT": i + 1,
      "Mã cư dân": r.id,
      "Họ và Tên (Full Name)": r.fullName,
      "Quốc tịch (Nationality)": r.nationality || "Nước ngoài",
      "Số Hộ chiếu (Passport No.)": r.passportNumber || r.cccd,
      "Ngày hết hạn Hộ chiếu": r.passportExpiryDate || "",
      "Cơ quan cấp HC": r.idIssuePlace || "",
      "Giới tính": r.gender,
      "Ngày sinh": r.birthDate,
      "Số điện thoại tại VN": r.phone || "",
      "Loại thị thực / Cư trú": r.visaOrCardType || "Thẻ tạm trú (TRC)",
      "Số thẻ / Thị thực": r.visaOrCardNumber || "",
      "Thời hạn cư trú từ ngày": r.visaValidFrom || "",
      "Thời hạn cư trú đến ngày": r.visaValidUntil || "",
      "Mã khai báo tạm trú trực tuyến": r.temporaryRegistrationCode || "",
      "Ngày khai báo CA Phường": r.temporaryRegistrationDate || "",
      "Tình trạng khai báo": r.temporaryRegistrationStatus || "Đã khai báo",
      "Nghề nghiệp / Vị trí công tác": r.occupation || "",
      "Cơ quan / Doanh nghiệp bảo lãnh": r.sponsoringOrganization || r.workplace || "",
      "Số Giấy phép LĐ (GPLĐ)": r.workPermitNumber || "",
      "Địa chỉ cư trú tại KP3": r.temporaryAddress || r.address,
      "Chủ nhà / Cơ sở cho thuê": r.landlordContact || "",
      "Mã hộ liên kết": r.householdId,
      "Người liên hệ khẩn cấp": r.emergencyContact || "",
      "Ghi chú lưu trú": r.notes || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DS_Nguoi_Nuoc_Ngoai_KP3");
    XLSX.writeFile(workbook, `Danh_Sach_Nguoi_Nuoc_Ngoai_Tam_Tru_KP3_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Download NA17 Official Declaration as Word (.doc) file
  const handleDownloadNA17Doc = (res: Resident) => {
    const docContent = `
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / SOCIALIST REPUBLIC OF VIETNAM
Độc lập - Tự do - Hạnh phúc / Independence - Freedom - Happiness
--------------------------------------------------------------------------------
Mẫu NA17 ban hành kèm theo Thông tư số 53/2016/TT-BCA ngày 28/12/2016 của Bộ Công an

PHIẾU KHAI BÁO TẠM TRÚ CHO NGƯỜI NƯỚC NGOÀI
TEMPORARY RESIDENCE DECLARATION FOR FOREIGNERS

Kính gửi (To): Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh

1. Họ và tên / Full name (in capital letters): ${(res.fullName || "").toUpperCase()}
2. Giới tính / Sex: ${res.gender || "Nam"}
3. Ngày, tháng, năm sinh / Date of birth: ${res.birthDate || ""}
4. Quốc tịch / Nationality: ${res.nationality || "Nước ngoài"}
5. Số Hộ chiếu / Passport number: ${res.passportNumber || res.cccd || ""}
   - Có giá trị đến ngày / Expiry date: ${res.passportExpiryDate || "15/08/2028"}
   - Cơ quan cấp / Issuing authority: ${res.idIssuePlace || "Cục Quản lý Xuất nhập cảnh"}
6. Nghề nghiệp / Occupation: ${res.occupation || "Chuyên gia / Lao động nước ngoài"}
   - Nơi làm việc hoặc cơ quan bảo lãnh / Sponsoring company or organization: ${res.sponsoringOrganization || res.workplace || "Tự do"}
   - Số Giấy phép lao động / Work permit No.: ${res.workPermitNumber || "Miễn GPLĐ / Chưa cấp"}
7. Loại thị thực hoặc Thẻ cư trú / Visa or TRC:
   - Loại / Type: ${res.visaOrCardType || "Thẻ tạm trú (TRC)"}
   - Số hiệu / Number: ${res.visaOrCardNumber || "TRC-KR-2023-0941"}
   - Thời hạn cư trú / Validity: Từ ${res.visaValidFrom || "01/01/2023"} đến ${res.visaValidUntil || "31/12/2026"}
8. Địa chỉ tạm trú tại Việt Nam / Temporary residential address:
   - Địa chỉ: ${res.temporaryAddress || res.address || "42 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"}
   - Mã hộ liên kết: ${res.householdId || "HK-301"}
9. Mã số khai báo tạm trú trực tuyến (Cổng Dịch vụ công BCA):
   - Mã hồ sơ: ${res.temporaryRegistrationCode || "KBTT-AP-2024-ONLINE"}
   - Ngày khai báo: ${res.temporaryRegistrationDate || "15/01/2024"}
   - Tình trạng: ${res.temporaryRegistrationStatus || "Đã khai báo"}
10. Chủ cơ sở lưu trú / Người bảo lãnh cho thuê nhà / Host or Guarantor:
   - Họ tên & SĐT: ${res.landlordContact || "Ban Điều hành Khu phố 3 - 0903123456"}

TP. Thủ Đức, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}

NGƯỜI NƯỚC NGOÀI KHAI BÁO       CHỦ CƠ SỞ LƯU TRÚ       XÁC NHẬN CÔNG AN PHƯỜNG AN PHÚ
   (Ký, ghi rõ họ tên)         (Ký, ghi rõ họ tên)               (Ký, đóng dấu)
    `;
    const filename = `Mau_NA17_Khai_Bao_Tam_Tru_${(res.fullName || "NNN").replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    const blob = new Blob(["\uFEFF" + docContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic row mapper for Excel & Paste text
  const mapRawRowToResident = (row: any, idx: number) => {
    const findVal = (keys: string[]) => {
      const foundKey = Object.keys(row).find(k => 
        keys.some(key => k.toLowerCase().trim().replace(/_/g, " ") === key.toLowerCase().trim().replace(/_/g, " "))
      );
      return foundKey ? String(row[foundKey]).trim() : "";
    };

    const fullName = findVal(["Họ và Tên", "Ho va Ten", "fullName", "Họ tên", "Ho ten", "Tên", "Ten"]);
    const cccd = findVal(["Số CCCD", "So CCCD", "cccd", "CMND", "Số định danh", "So dinh danh", "Số CCCD/CMND"]);
    const idIssueDate = findVal(["Ngày cấp CCCD", "Ngay cap CCCD", "idIssueDate", "Ngày cấp", "Ngay cap"]);
    const idIssuePlace = findVal(["Nơi cấp CCCD", "Noi cap CCCD", "idIssuePlace", "Nơi cấp", "Noi cap"]);
    const genderStr = findVal(["Giới tính", "Gioi tinh", "gender", "Phái", "Phai"]);
    const birthDate = findVal(["Ngày sinh", "Ngay sinh", "birthDate", "Năm sinh", "Nam sinh", "Sinh nhật"]);
    const ethnicity = findVal(["Dân tộc", "Dan toc", "ethnicity"]);
    const religion = findVal(["Tôn giáo", "Ton giao", "religion"]);
    const nationality = findVal(["Quốc tịch", "Quoc tich", "nationality"]);
    const hometown = findVal(["Quê quán", "Que quan", "hometown", "Nguyên quán", "Nguyen quan"]);
    const phone = findVal(["Số điện thoại", "So dien thoai", "phone", "SĐT", "SDT", "Điện thoại", "Dien thoai"]);
    const statusStr = findVal(["Diện cư trú", "Dien cu tru", "status", "Trạng thái", "Trang thai", "Cư trú", "Cu tru"]);
    const education = findVal(["Trình độ học vấn", "Trinh do hoc van", "education", "Trình độ", "Học vấn"]);
    const occupation = findVal(["Nghề nghiệp", "Nghe nghiep", "occupation", "Công việc", "Cong viec"]);
    const workplace = findVal(["Nơi làm việc", "Noi lam viec", "workplace", "Cơ quan", "Đơn vị"]);
    const maritalStatusStr = findVal(["Tình trạng hôn nhân", "Tinh trang hon nhan", "maritalStatus", "Hôn nhân"]);
    const address = findVal(["Địa chỉ cư trú", "Địa chỉ", "Dia chi", "address", "Nơi ở", "Noi o"]);
    const permanentAddress = findVal([
      "ĐỊA CHỈ THƯỜNG TRÚ", "Địa chỉ thường trú", "Dia chi thuong tru",
      "Nơi thường trú gốc", "Nơi thường trú", "Noi thuong tru", "permanentAddress", "Hộ khẩu thường trú"
    ]);
    const currentAddressRaw = findVal([
      "CHỔ Ở HIỆN TẠI", "Chổ ở hiện tại", "Chỗ ở hiện tại", "Cho o hien tai",
      "ĐỊA CHỈ TẠM TRÚ", "Địa chỉ tạm trú", "Dia chi tam tru",
      "Nơi tạm trú", "Noi tam tru", "Nơi ở hiện nay", "temporaryAddress", "currentAddress"
    ]);
    const fatherName = findVal(["HỌ TÊN CHA", "Họ tên cha", "Ho ten cha", "Cha", "fatherName"]);
    const motherName = findVal(["HỌ TÊN MẸ", "Họ tên mẹ", "Ho ten me", "Mẹ", "motherName"]);
    const temporaryRegDate = findVal(["NGÀY ĐĂNG KÝ", "Ngày đăng ký", "Ngay dang ky", "temporaryRegDate"]);
    const temporaryExpDate = findVal(["NGÀY HẾT HẠN", "Ngày hết hạn", "Ngay het han", "temporaryExpDate"]);
    const managementStatus = findVal(["TÌNH TRẠNG QUẢN LÝ", "Tình trạng quản lý", "managementStatus", "Diện quản lý"]);
    const householdId = findVal(["MÃ HỘ KHẨU", "Mã hộ khẩu", "Ma ho khau", "householdId", "Mã hộ", "Ma ho", "Số hộ khẩu", "So ho khau"]);
    const relationToOwner = findVal(["Quan hệ với chủ hộ", "Quan he voi chu ho", "relationToOwner", "Quan hệ", "Quan he", "Quan hệ chủ hộ"]);
    const healthInsuranceNumber = findVal(["Mã số BHYT", "Ma so BHYT", "healthInsuranceNumber", "BHYT", "Thẻ BHYT"]);
    const militaryServiceStatus = findVal(["Nghĩa vụ quân sự", "Nghia vu quan su", "militaryServiceStatus", "NVQS"]);
    const policyGroup = findVal(["Nhóm chính sách", "Nhom chinh sach", "policyGroup", "Chính sách", "Đoàn thể", "Diện chính sách"]);
    const emergencyContact = findVal(["Người liên hệ khẩn cấp", "Liên hệ khẩn cấp", "emergencyContact"]);
    const notes = findVal(["Ghi chú", "Ghi chu", "notes", "NGÀY LẬP HỘ"]);

    // Parse Gender
    let gender: "Nam" | "Nữ" = "Nam";
    if (genderStr.toLowerCase() === "nữ" || genderStr.toLowerCase() === "nu" || genderStr.toLowerCase() === "female" || genderStr.toLowerCase() === "f") {
      gender = "Nữ";
    }

    // Auto-normalize CCCD 12 digits (pad leading zeroes if lost from Excel)
    let cleanCccd = cccd.replace(/\D/g, "");
    if (cleanCccd.length > 0 && cleanCccd.length <= 12) {
      cleanCccd = cleanCccd.padStart(12, "0");
    }

    // Auto-normalize Birth Date (supports Excel serial date, ISO, and DD/MM/YYYY)
    let formattedBirthDate = birthDate || "";
    if (birthDate) {
      const trimmed = String(birthDate).trim().replace(/\.0$/, "");
      if (/^\d{4,5}$/.test(trimmed)) {
        const valNum = parseInt(trimmed, 10);
        if (valNum >= 1900 && valNum <= 2100 && trimmed.length === 4) {
          formattedBirthDate = `01/01/${valNum}`;
        } else if (valNum >= 10000 && valNum <= 65000) {
          try {
            const dt = new Date(Math.round((valNum - 25569) * 86400 * 1000));
            if (!isNaN(dt.getTime())) {
              const d = String(dt.getUTCDate()).padStart(2, "0");
              const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
              const y = dt.getUTCFullYear();
              formattedBirthDate = `${d}/${m}/${y}`;
            }
          } catch {
            // fallback
          }
        }
      } else if (trimmed.includes("-") && trimmed.length >= 10) {
        const parts = trimmed.slice(0, 10).split("-");
        if (parts.length === 3) {
          formattedBirthDate = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        }
      }
    }

    // Parse Status
    let status: "Thường trú" | "Tạm trú" | "Tạm vắng" = "Thường trú";
    const lowerStatus = statusStr.toLowerCase();
    if (lowerStatus.includes("tạm trú") || lowerStatus === "tam tru" || lowerStatus.includes("temporary") || !!temporaryRegDate || !!temporaryExpDate) {
      status = "Tạm trú";
    } else if (lowerStatus.includes("tạm vắng") || lowerStatus === "tam vang" || lowerStatus.includes("absent")) {
      status = "Tạm vắng";
    }

    // Parse Marital
    let maritalStatus: "Độc thân" | "Đã kết hôn" | "Ly hôn" | "Góa" | undefined = undefined;
    if (maritalStatusStr.includes("Độc thân") || maritalStatusStr.includes("Doc than")) {
      maritalStatus = "Độc thân";
    } else if (maritalStatusStr.includes("Ly hôn") || maritalStatusStr.includes("Ly hon")) {
      maritalStatus = "Ly hôn";
    } else if (maritalStatusStr.includes("Góa") || maritalStatusStr.includes("Goa")) {
      maritalStatus = "Góa";
    } else if (maritalStatusStr.includes("kết hôn") || maritalStatusStr.includes("ket hon")) {
      maritalStatus = "Đã kết hôn";
    }

    // Địa chỉ thường trú và Chỗ ở hiện tại / Tạm trú
    let resolvedPermanent = permanentAddress || undefined;
    let resolvedCurrent = currentAddressRaw || address || undefined;
    let resolvedActiveAddress = resolvedCurrent || resolvedPermanent || "Khu phố 3, Phường An Phú";

    return {
      id: `TEMP-${idx}-${Date.now()}`,
      fullName: fullName || "",
      gender,
      birthDate: formattedBirthDate,
      cccd: cleanCccd || cccd,
      idIssueDate: idIssueDate || undefined,
      idIssuePlace: idIssuePlace || undefined,
      ethnicity: ethnicity || undefined,
      religion: religion || undefined,
      nationality: nationality || "Việt Nam",
      hometown: hometown || undefined,
      phone: phone || undefined,
      status,
      education: education || undefined,
      occupation: occupation || undefined,
      workplace: workplace || undefined,
      maritalStatus,
      address: resolvedActiveAddress,
      permanentAddress: resolvedPermanent,
      temporaryAddress: resolvedCurrent,
      currentAddress: resolvedCurrent,
      fatherName: fatherName || undefined,
      motherName: motherName || undefined,
      temporaryRegDate: temporaryRegDate || undefined,
      temporaryExpDate: temporaryExpDate || undefined,
      managementStatus: managementStatus || undefined,
      householdId: householdId || (status === "Tạm trú" ? "Tạm trú" : undefined),
      relationToOwner: relationToOwner || "Thành viên",
      healthInsuranceNumber: healthInsuranceNumber || undefined,
      militaryServiceStatus: militaryServiceStatus || undefined,
      policyGroup: policyGroup || undefined,
      emergencyContact: emergencyContact || undefined,
      notes: notes || undefined,
      isValid: !!fullName && !!cleanCccd && cleanCccd.length >= 9
    };
  };

  // Excel Parser Logic
  const handleExcelParse = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
          alert("Tệp tin Excel trống hoặc không đúng định dạng!");
          return;
        }

        const mapped = jsonData.map((row, idx) => mapRawRowToResident(row, idx));
        setParsedData(mapped);
        setImportFileName(file.name);
      } catch (err) {
        alert("Có lỗi xảy ra khi xử lý file Excel. Vui lòng kiểm tra lại định dạng!");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Raw Text / Paste Parser Logic (Tab-separated or Comma-separated)
  const handleParsePastedText = () => {
    const textareaEl = document.getElementById("raw-pasted-residents-textarea") as HTMLTextAreaElement | null;
    const textToParse = (pastedRawText || "").trim() || (textareaEl?.value || "").trim();
    if (!textToParse) {
      alert("Vui lòng dán danh sách hoặc bảng dữ liệu dân cư vào ô nhập!");
      return;
    }

    try {
      const lines = textToParse.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert("Dữ liệu cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu!");
        return;
      }

      // Check delimiter (tab or comma or semicolon)
      const firstLine = lines[0];
      const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
      const rows = lines.slice(1).map((line, idx) => {
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ""));
        const rowObj: any = {};
        headers.forEach((h, i) => {
          rowObj[h] = cols[i] !== undefined ? cols[i] : "";
        });
        return mapRawRowToResident(rowObj, idx);
      });

      setParsedData(rows);
      setImportFileName(`Dữ liệu vừa dán (${rows.length} cư dân)`);
    } catch (err) {
      alert("Lỗi khi phân tích dữ liệu dạng văn bản!");
      console.error(err);
    }
  };

  // Drag & Drop Helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      handleExcelParse(file);
    } else {
      alert("Chỉ chấp nhận tệp tin Excel (.xlsx, .xls) hoặc CSV!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleExcelParse(file);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("Không có dữ liệu cư dân hợp lệ nào để nhập!");
      return;
    }

    setIsUploadingToDb(true);
    setUploadStatusMsg("Đang chuẩn hóa và chuẩn bị đồng bộ vào Database...");

    try {
      if (isSupabaseConfigured && supabase) {
        // Chuẩn hóa dữ liệu tương thích schema Supabase PostgreSQL
        const dbPayload = validRows.map(row => {
          let birthDateIso: string | null = null;
          if (row.birthDate && row.birthDate.includes("/")) {
            const parts = row.birthDate.split("/");
            if (parts.length === 3) {
              const [d, m, y] = parts;
              if (y && m && d) birthDateIso = `${y.trim()}-${m.trim().padStart(2, '0')}-${d.trim().padStart(2, '0')}`;
            }
          } else if (row.birthDate && row.birthDate.includes("-")) {
            birthDateIso = row.birthDate.slice(0, 10);
          }

          const birthYear = birthDateIso ? parseInt(birthDateIso.slice(0, 4), 10) : null;
          const isElderly = birthYear ? (2026 - birthYear) >= 60 : false;

          return {
            full_name: (row.fullName || "").trim(),
            cccd: (row.cccd || "").trim(),
            gender: row.gender === "Nữ" ? "Nữ" : "Nam",
            birth_date: birthDateIso,
            phone: row.phone && row.phone !== "N/A" ? row.phone.trim() : null,
            address: (row.address || row.temporaryAddress || row.permanentAddress || "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh").trim(),
            permanent_address: row.permanentAddress?.trim() || null,
            current_address: (row.currentAddress || row.temporaryAddress || row.address)?.trim() || null,
            father_name: row.fatherName?.trim() || null,
            mother_name: row.motherName?.trim() || null,
            temporary_reg_date: row.temporaryRegDate?.trim() || null,
            temporary_exp_date: row.temporaryExpDate?.trim() || null,
            management_status: row.managementStatus?.trim() || null,
            household_code: row.householdId?.trim() || null,
            relation_to_owner: row.relationToOwner?.trim() || "Thành viên",
            status: row.status || "Thường trú",
            occupation: row.occupation?.trim() || null,
            workplace: row.workplace?.trim() || null,
            nationality: row.nationality?.trim() || "Việt Nam",
            is_party_member: false,
            is_policy_household: false,
            is_elderly: isElderly,
            is_poor_household: false
          };
        });

        // Chia lô 500 bản ghi và chạy song song (Concurrency x4) để tối ưu hiệu năng siêu tốc
        const BATCH_SIZE = 500;
        const CONCURRENCY = 4;
        const totalBatches: any[][] = [];
        for (let i = 0; i < dbPayload.length; i += BATCH_SIZE) {
          totalBatches.push(dbPayload.slice(i, i + BATCH_SIZE));
        }

        let insertedCount = 0;
        for (let i = 0; i < totalBatches.length; i += CONCURRENCY) {
          const chunk = totalBatches.slice(i, i + CONCURRENCY);
          await Promise.all(chunk.map(async (batch) => {
            const { error: upsertErr } = await (supabase as any).from('residents').upsert(batch, { onConflict: 'cccd' });
            if (upsertErr) {
              console.error("Supabase upsert error:", upsertErr);
              throw new Error(upsertErr.message);
            }
            insertedCount += batch.length;
            setUploadStatusMsg(`Đang ghi siêu tốc vào Supabase: ${Math.min(insertedCount, dbPayload.length)}/${dbPayload.length} hồ sơ (${Math.round((insertedCount / dbPayload.length) * 100)}%)...`);
          }));
        }

        // Cập nhật State giao diện 1 lần duy nhất để không làm đứng giao diện
        if (onUpdateResidents) {
          const newMap = new Map<string, Resident>(residents.map(r => [r.cccd, r]));
          validRows.forEach((row, i) => {
            newMap.set(row.cccd, {
              id: "R" + (residents.length + 1 + i).toString().padStart(3, "0"),
              fullName: row.fullName,
              gender: row.gender,
              birthDate: row.birthDate,
              cccd: row.cccd,
              idIssueDate: row.idIssueDate,
              idIssuePlace: row.idIssuePlace,
              ethnicity: row.ethnicity,
              religion: row.religion,
              nationality: row.nationality,
              hometown: row.hometown,
              phone: row.phone,
              status: row.status,
              education: row.education,
              occupation: row.occupation,
              workplace: row.workplace,
              maritalStatus: row.maritalStatus,
              address: row.address,
              permanentAddress: row.permanentAddress,
              temporaryAddress: row.temporaryAddress,
              currentAddress: row.currentAddress,
              fatherName: row.fatherName,
              motherName: row.motherName,
              temporaryRegDate: row.temporaryRegDate,
              temporaryExpDate: row.temporaryExpDate,
              managementStatus: row.managementStatus,
              householdId: row.householdId,
              relationToOwner: row.relationToOwner,
              healthInsuranceNumber: row.healthInsuranceNumber,
              militaryServiceStatus: row.militaryServiceStatus,
              policyGroup: row.policyGroup,
              emergencyContact: row.emergencyContact,
              notes: row.notes,
              avatar: `https://images.unsplash.com/photo-${1535713875002 + (i % 10)}?w=150`,
              joinDate: new Date().toLocaleDateString("vi-VN")
            });
          });
          onUpdateResidents(Array.from(newMap.values()));
        } else {
          validRows.forEach((row, i) => {
            onAddResident({
              id: "R" + (residents.length + 1 + i).toString().padStart(3, "0"),
              fullName: row.fullName,
              gender: row.gender,
              birthDate: row.birthDate,
              cccd: row.cccd,
              idIssueDate: row.idIssueDate,
              idIssuePlace: row.idIssuePlace,
              ethnicity: row.ethnicity,
              religion: row.religion,
              nationality: row.nationality,
              hometown: row.hometown,
              phone: row.phone,
              status: row.status,
              education: row.education,
              occupation: row.occupation,
              workplace: row.workplace,
              maritalStatus: row.maritalStatus,
              address: row.address,
              permanentAddress: row.permanentAddress,
              temporaryAddress: row.temporaryAddress,
              householdId: row.householdId,
              relationToOwner: row.relationToOwner,
              healthInsuranceNumber: row.healthInsuranceNumber,
              militaryServiceStatus: row.militaryServiceStatus,
              policyGroup: row.policyGroup,
              emergencyContact: row.emergencyContact,
              notes: row.notes,
              avatar: `https://images.unsplash.com/photo-${1535713875002 + (i % 10)}?w=150`,
              joinDate: new Date().toLocaleDateString("vi-VN")
            });
          });
        }

        alert(`✓ ĐỒNG BỘ SIÊU TỐC THÀNH CÔNG!\nĐã nạp ${insertedCount} hồ sơ cư dân vào Cơ sở dữ liệu Supabase PostgreSQL!`);
      } else {
        // Fallback khi offline hoặc chưa config Supabase
        validRows.forEach((row, i) => {
          onAddResident({
            id: "R" + (residents.length + 1 + i).toString().padStart(3, "0"),
            fullName: row.fullName,
            gender: row.gender,
            birthDate: row.birthDate,
            cccd: row.cccd,
            idIssueDate: row.idIssueDate,
            idIssuePlace: row.idIssuePlace,
            ethnicity: row.ethnicity,
            religion: row.religion,
            nationality: row.nationality,
            hometown: row.hometown,
            phone: row.phone,
            status: row.status,
            education: row.education,
            occupation: row.occupation,
            workplace: row.workplace,
            maritalStatus: row.maritalStatus,
            address: row.address,
            permanentAddress: row.permanentAddress,
            temporaryAddress: row.temporaryAddress,
            householdId: row.householdId,
            relationToOwner: row.relationToOwner,
            healthInsuranceNumber: row.healthInsuranceNumber,
            militaryServiceStatus: row.militaryServiceStatus,
            policyGroup: row.policyGroup,
            emergencyContact: row.emergencyContact,
            notes: row.notes,
            avatar: `https://images.unsplash.com/photo-${1535713875002 + (i % 10)}?w=150`,
            joinDate: new Date().toLocaleDateString("vi-VN")
          });
        });
        alert(`Đã lưu ${validRows.length} hồ sơ vào bộ nhớ cục bộ.`);
      }

      setShowImportModal(false);
      setParsedData([]);
      setImportFileName("");
      setPastedRawText("");
    } catch (err: any) {
      alert("Lỗi khi ghi dữ liệu vào Supabase Database: " + (err?.message || "Không thể kết nối máy chủ CSDL"));
    } finally {
      setIsUploadingToDb(false);
      setUploadStatusMsg("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCccd = formData.isForeigner ? (formData.passportNumber || formData.cccd) : formData.cccd;
    if (!formData.fullName || !finalCccd) {
      alert("Vui lòng điền đầy đủ Họ tên và số CCCD / Hộ chiếu bắt buộc!");
      return;
    }

    if (isEditMode && editingResidentId) {
      const oldRes = residents.find(r => r.id === editingResidentId);
      if (!oldRes) return;
      
      const updatedRes: Resident = {
        ...oldRes,
        fullName: formData.fullName,
        gender: formData.gender,
        birthDate: formData.birthDate || "01/01/1990",
        cccd: finalCccd,
        idIssueDate: formData.idIssueDate,
        idIssuePlace: formData.idIssuePlace,
        ethnicity: formData.ethnicity,
        religion: formData.religion,
        nationality: formData.nationality,
        hometown: formData.hometown,
        phone: formData.phone || "N/A",
        status: formData.status,
        education: formData.education,
        occupation: formData.occupation || "Tự do",
        workplace: formData.workplace,
        maritalStatus: formData.maritalStatus,
        address: formData.address,
        permanentAddress: formData.permanentAddress,
        temporaryAddress: formData.temporaryAddress,
        householdId: formData.householdId,
        relationToOwner: formData.relationToOwner,
        healthInsuranceNumber: formData.healthInsuranceNumber,
        militaryServiceStatus: formData.militaryServiceStatus,
        policyGroup: formData.policyGroup,
        emergencyContact: formData.emergencyContact,
        notes: formData.notes,
        isForeigner: formData.isForeigner,
        passportNumber: formData.passportNumber || (formData.isForeigner ? finalCccd : undefined),
        passportExpiryDate: formData.passportExpiryDate,
        visaOrCardType: formData.visaOrCardType,
        visaOrCardNumber: formData.visaOrCardNumber,
        visaValidFrom: formData.visaValidFrom,
        visaValidUntil: formData.visaValidUntil,
        temporaryRegistrationCode: formData.temporaryRegistrationCode,
        temporaryRegistrationDate: formData.temporaryRegistrationDate,
        temporaryRegistrationStatus: formData.temporaryRegistrationStatus,
        workPermitNumber: formData.workPermitNumber,
        sponsoringOrganization: formData.sponsoringOrganization,
        landlordContact: formData.landlordContact
      };

      // 1. Update residents state
      const updatedResidents = residents.map(r => r.id === editingResidentId ? updatedRes : r);
      if (onUpdateResidents) {
        onUpdateResidents(updatedResidents);
      }

      // 2. Synchronize to households
      if (onUpdateHouseholds && households) {
        let updatedHouseholds = [...households];

        if (oldRes.householdId !== formData.householdId) {
          // Remove from old household
          updatedHouseholds = updatedHouseholds.map(hh => {
            if (hh.code === oldRes.householdId) {
              const remainingMembers = hh.members.filter((m: any) => m.cccd !== oldRes.cccd);
              return {
                ...hh,
                memberCount: remainingMembers.length,
                members: remainingMembers
              };
            }
            return hh;
          });

          // Add to new household
          updatedHouseholds = updatedHouseholds.map(hh => {
            if (hh.code === formData.householdId) {
              const newMember = {
                name: formData.fullName,
                relation: formData.relationToOwner,
                cccd: finalCccd,
                phone: formData.phone || "N/A",
                birthYear: parseInt(formData.birthDate.split("/")[2]) || 1990
              };
              return {
                ...hh,
                memberCount: hh.memberCount + 1,
                members: [...hh.members, newMember]
              };
            }
            return hh;
          });
        } else {
          // Update member in place
          updatedHouseholds = updatedHouseholds.map(hh => {
            if (hh.code === formData.householdId) {
              const updatedMembers = hh.members.map((m: any) => {
                if (m.cccd === oldRes.cccd) {
                  return {
                    ...m,
                    name: formData.fullName,
                    relation: formData.relationToOwner,
                    cccd: finalCccd,
                    phone: formData.phone || "N/A",
                    birthYear: parseInt(formData.birthDate.split("/")[2]) || 1990
                  };
                }
                return m;
              });
              return {
                ...hh,
                members: updatedMembers
              };
            }
            return hh;
          });
        }
        onUpdateHouseholds(updatedHouseholds);
      }

      setSelectedResident(updatedRes);
      setShowModal(false);
      setIsEditMode(false);
      setEditingResidentId(null);
      setFormData(initialFormState);
      return;
    }

    const newRes: Resident = {
      id: "R" + (residents.length + 1).toString().padStart(3, "0"),
      fullName: formData.fullName,
      gender: formData.gender,
      birthDate: formData.birthDate || "01/01/1990",
      cccd: finalCccd,
      idIssueDate: formData.idIssueDate,
      idIssuePlace: formData.idIssuePlace,
      ethnicity: formData.ethnicity,
      religion: formData.religion,
      nationality: formData.nationality,
      hometown: formData.hometown,
      phone: formData.phone || "N/A",
      status: formData.status,
      education: formData.education,
      occupation: formData.occupation || "Tự do",
      workplace: formData.workplace,
      maritalStatus: formData.maritalStatus,
      address: formData.address,
      permanentAddress: formData.permanentAddress,
      temporaryAddress: formData.temporaryAddress,
      householdId: formData.householdId,
      relationToOwner: formData.relationToOwner,
      healthInsuranceNumber: formData.healthInsuranceNumber,
      militaryServiceStatus: formData.militaryServiceStatus,
      policyGroup: formData.policyGroup,
      emergencyContact: formData.emergencyContact,
      notes: formData.notes,
      isForeigner: formData.isForeigner,
      passportNumber: formData.passportNumber || (formData.isForeigner ? finalCccd : undefined),
      passportExpiryDate: formData.passportExpiryDate,
      visaOrCardType: formData.visaOrCardType,
      visaOrCardNumber: formData.visaOrCardNumber,
      visaValidFrom: formData.visaValidFrom,
      visaValidUntil: formData.visaValidUntil,
      temporaryRegistrationCode: formData.temporaryRegistrationCode,
      temporaryRegistrationDate: formData.temporaryRegistrationDate,
      temporaryRegistrationStatus: formData.temporaryRegistrationStatus,
      workPermitNumber: formData.workPermitNumber,
      sponsoringOrganization: formData.sponsoringOrganization,
      landlordContact: formData.landlordContact,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      joinDate: new Date().toLocaleDateString("vi-VN")
    };
    onAddResident(newRes);
    setSelectedResident(newRes);
    setShowModal(false);
    setFormData(initialFormState);
  };

  // Filter Logic with comprehensive field search (kể cả Hộ chiếu, Quốc tịch & Mã khai báo)
  const filteredResidents = residents.filter(res => {
    const isForeign = isForeignResident(res);
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      res.fullName.toLowerCase().includes(query) || 
      res.cccd.toLowerCase().includes(query) || 
      (res.passportNumber && res.passportNumber.toLowerCase().includes(query)) ||
      (res.nationality && res.nationality.toLowerCase().includes(query)) ||
      (res.temporaryRegistrationCode && res.temporaryRegistrationCode.toLowerCase().includes(query)) ||
      (res.visaOrCardNumber && res.visaOrCardNumber.toLowerCase().includes(query)) ||
      (res.sponsoringOrganization && res.sponsoringOrganization.toLowerCase().includes(query)) ||
      (res.workPermitNumber && res.workPermitNumber.toLowerCase().includes(query)) ||
      (res.phone && res.phone.includes(query)) ||
      (res.hometown && res.hometown.toLowerCase().includes(query)) ||
      (res.occupation && res.occupation.toLowerCase().includes(query)) ||
      (res.householdId && res.householdId.toLowerCase().includes(query)) ||
      (res.healthInsuranceNumber && res.healthInsuranceNumber.toLowerCase().includes(query)) ||
      (res.policyGroup && res.policyGroup.toLowerCase().includes(query));

    let matchesStatus = true;
    if (statusFilter === "Người nước ngoài") {
      if (!isForeign) return false;
      if (foreignNationalityFilter !== "Tất cả" && res.nationality !== foreignNationalityFilter) return false;
      if (foreignVisaTypeFilter !== "Tất cả" && res.visaOrCardType !== foreignVisaTypeFilter) return false;
      if (foreignExpiryFilter !== "Tất cả") {
        const expiryInfo = getVisaExpiryStatus(res.visaValidUntil);
        if (foreignExpiryFilter === "Sắp hết hạn" && expiryInfo.status !== "expiring_soon") return false;
        if (foreignExpiryFilter === "Còn hạn dài" && expiryInfo.status !== "valid") return false;
        if (foreignExpiryFilter === "Đã hết hạn" && expiryInfo.status !== "expired") return false;
      }
    } else if (statusFilter === "Tạm trú") {
      if (res.status !== "Tạm trú" || isForeign) return false;
      if (temporaryExpiryFilter !== "Tất cả") {
        const expStatus = getTemporaryResidenceExpiryStatus(res.temporaryExpDate);
        if (temporaryExpiryFilter === "Sắp hết hạn (< 30 ngày)" && !expStatus.isWarning) return false;
        if (temporaryExpiryFilter === "Đã hết hạn" && !expStatus.isExpired) return false;
        if (temporaryExpiryFilter === "Còn hạn dài" && (expStatus.isWarning || expStatus.isExpired)) return false;
      }
    } else if (statusFilter !== "Tất cả") {
      matchesStatus = res.status === statusFilter && !isForeign;
    }

    const matchesGender = genderFilter === "Tất cả" || res.gender === genderFilter;
    const matchesPolicy = policyFilter === "Tất cả" || (res.policyGroup && res.policyGroup.includes(policyFilter));

    return matchesSearch && matchesStatus && matchesGender && matchesPolicy;
  });

  // Calculate dynamic segment tab counts
  const foreignResidentsList = residents.filter(r => isForeignResident(r));
  const tamTruResidentsList = residents.filter(r => r.status === "Tạm trú" && !isForeignResident(r));
  const tamTruExpiringSoonCount = tamTruResidentsList.filter(r => getTemporaryResidenceExpiryStatus(r.temporaryExpDate).isWarning).length;
  const tamTruExpiredCount = tamTruResidentsList.filter(r => getTemporaryResidenceExpiryStatus(r.temporaryExpDate).isExpired).length;

  const tabCounts = {
    all: residents.length,
    thuongTru: residents.filter(r => r.status === "Thường trú" && !isForeignResident(r)).length,
    tamTru: tamTruResidentsList.length,
    tamVang: residents.filter(r => r.status === "Tạm vắng" && !isForeignResident(r)).length,
    foreigners: foreignResidentsList.length
  };

  // Foreign resident statistics for specialized dashboard
  const uniqueNationalities = Array.from(new Set(foreignResidentsList.map(r => r.nationality).filter(Boolean))) as string[];
  const trcCount = foreignResidentsList.filter(r => r.visaOrCardType === "Thẻ tạm trú (TRC)").length;
  const expiringSoonCount = foreignResidentsList.filter(r => getVisaExpiryStatus(r.visaValidUntil).status === "expiring_soon").length;
  const registeredPoliceCount = foreignResidentsList.filter(r => r.temporaryRegistrationStatus === "Đã khai báo" || Boolean(r.temporaryRegistrationCode)).length;

  // Pagination Logic
  const totalItems = filteredResidents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedResidents = filteredResidents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div id="citizen-management-view" className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sổ Quản lý Dân cư Khu phố</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Chuẩn CSDL Dân cư 06
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng <span className="font-semibold text-slate-800">{residents.length} nhân khẩu</span> • Tích hợp 26 trường thông tin định danh, cư trú, chính sách & bảo hiểm y tế
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button 
            id="btn-export-excel"
            onClick={handleExportFullExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer hover:shadow-sm"
            title="Xuất file Excel chứa đầy đủ 26 trường thông tin của toàn bộ nhân khẩu"
          >
            <Download size={15} className="text-slate-600" /> Xuất Excel ({residents.length})
          </button>
          <button 
            id="btn-import-excel"
            onClick={() => {
              setShowImportModal(true);
              setParsedData([]);
              setImportFileName("");
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-700 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer hover:shadow-sm hover:border-emerald-400"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" /> Nhập Excel / Dán bảng
          </button>
          <button 
            id="btn-add-resident"
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer hover:shadow-md"
          >
            <Plus size={15} /> Thêm Hồ sơ Cư dân Mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input 
            id="citizen-search-input"
            name="citizenSearch"
            type="text" 
            placeholder="Tìm theo họ tên, CCCD, SĐT, quê quán, nghề nghiệp, mã BHYT, chính sách..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>
        <div className="flex gap-2.5 flex-wrap items-center">
          {/* Residency Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Tất cả")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "Tất cả"
                  ? "bg-white text-slate-800 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              Tất cả ({tabCounts.all})
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Thường trú")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "Thường trú"
                  ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              Thường trú ({tabCounts.thuongTru})
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Tạm trú")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "Tạm trú"
                  ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <span>Tạm trú ({tabCounts.tamTru})</span>
              {tamTruExpiringSoonCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse" title={`Có ${tamTruExpiringSoonCount} cư dân tạm trú sắp hết hạn trước 1 tháng`}>
                  ⚠️ {tamTruExpiringSoonCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Tạm vắng")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "Tạm vắng"
                  ? "bg-white text-slate-700 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              Tạm vắng ({tabCounts.tamVang})
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Người nước ngoài")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "Người nước ngoài"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-purple-700 hover:text-purple-900 font-medium hover:bg-purple-50"
              }`}
            >
              <Globe size={13} className={statusFilter === "Người nước ngoài" ? "text-purple-200" : "text-purple-600"} />
              Người nước ngoài ({tabCounts.foreigners})
            </button>
          </div>

          {/* Temporary Residence Expiry Filter Dropdown */}
          {statusFilter === "Tạm trú" && (
            <select
              id="citizen-temporary-expiry-filter"
              value={temporaryExpiryFilter}
              onChange={(e) => {
                setTemporaryExpiryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-amber-50/90 text-amber-950 font-bold focus:outline-none focus:border-amber-500 shrink-0"
            >
              <option value="Tất cả">Thời hạn tạm trú: Tất cả ({tabCounts.tamTru})</option>
              <option value="Sắp hết hạn (< 30 ngày)">⚠️ Sắp hết hạn trước 1 tháng ({tamTruExpiringSoonCount})</option>
              <option value="Đã hết hạn">🚨 Đã hết hạn tạm trú ({tamTruExpiredCount})</option>
              <option value="Còn hạn dài">Còn hạn dài ({Math.max(0, tabCounts.tamTru - tamTruExpiringSoonCount - tamTruExpiredCount)})</option>
            </select>
          )}

          {/* Gender Filter */}
          <select 
            id="citizen-gender-filter"
            name="citizenGenderFilter"
            value={genderFilter}
            onChange={(e) => handleGenderFilterChange(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="Tất cả">Giới tính: Tất cả</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          {/* Policy / Organization Filter */}
          <select 
            id="citizen-policy-filter"
            name="citizenPolicyFilter"
            value={policyFilter}
            onChange={(e) => handlePolicyFilterChange(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="Tất cả">Diện chính sách: Tất cả</option>
            <option value="Đảng viên">Đảng viên</option>
            <option value="Người có công">Người có công / Thương binh</option>
            <option value="Người cao tuổi">Người cao tuổi</option>
            <option value="Hộ nghèo">Hộ nghèo / Hộ cận nghèo</option>
            <option value="Đoàn viên">Đoàn viên thanh niên</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Xem dạng Bảng"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "card" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Xem dạng Thẻ"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Temporary Residence Expiry Alert Banner */}
      {statusFilter === "Tạm trú" && (tamTruExpiringSoonCount > 0 || tamTruExpiredCount > 0) && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/90 to-orange-50 border border-amber-300 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle size={18} className="animate-pulse text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                  Cảnh báo Quản lý Cư trú: Cư dân Tạm trú Sắp hết hạn & Quá hạn
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  Trước 01 tháng (30 ngày)
                </span>
              </div>
              <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                Phát hiện <strong className="text-amber-950 font-black underline">{tamTruExpiringSoonCount} nhân khẩu</strong> sắp hết hạn tạm trú trong vòng 30 ngày tới và <strong className="text-rose-700 font-black">{tamTruExpiredCount} nhân khẩu</strong> đã hết hạn. Đề nghị cán bộ rà soát, thông báo cho chủ cơ sở lưu trú / nhà trọ và người tạm trú nộp hồ sơ gia hạn theo quy định Luật Cư trú.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setTemporaryExpiryFilter("Sắp hết hạn (< 30 ngày)");
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                temporaryExpiryFilter === "Sắp hết hạn (< 30 ngày)"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
              }`}
            >
              <span>Xem DS sắp hết hạn</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
                {tamTruExpiringSoonCount}
              </span>
            </button>
            {temporaryExpiryFilter !== "Tất cả" && (
              <button
                type="button"
                onClick={() => {
                  setTemporaryExpiryFilter("Tất cả");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              >
                Hiện tất cả
              </button>
            )}
          </div>
        </div>
      )}

      {/* Foreign Resident Intelligence & Compliance Panel */}
      {statusFilter === "Người nước ngoài" && (
        <div className="bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-purple-800/60 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-purple-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-400/30">
                  <Globe size={18} />
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Phân hệ Quản lý Cư dân Người nước ngoài (Foreign Residents Compliance)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  Luật 47/2014 & TT 53/2016-BCA
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Theo dõi hồ sơ lưu trú, Hộ chiếu, Thẻ tạm trú (TRC), Thị thực lao động, Giấy phép lao động & Liên thông khai báo trực tuyến Công an Phường An Phú
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleExportForeignResidentsExcel}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                title="Xuất file Excel danh sách người nước ngoài gửi Công an Phường & Lưu trữ"
              >
                <Download size={14} /> Xuất DS Công an ({foreignResidentsList.length})
              </button>
              <button
                type="button"
                onClick={handleOpenAddForeignerModal}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Thêm Người nước ngoài
              </button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
                <Globe size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-purple-200 font-medium">Tổng người nước ngoài</p>
                <p className="text-xl font-black text-white">{foreignResidentsList.length} <span className="text-xs font-normal text-purple-300">người</span></p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300 font-bold shrink-0">
                <Shield size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-purple-200 font-medium">Quốc gia & Vùng lãnh thổ</p>
                <p className="text-xl font-black text-white">{uniqueNationalities.length} <span className="text-xs font-normal text-purple-300">quốc gia</span></p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold shrink-0">
                <Award size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-purple-200 font-medium">Thẻ tạm trú (TRC) dài hạn</p>
                <p className="text-xl font-black text-white">{trcCount} <span className="text-xs font-normal text-purple-300">thẻ</span></p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                expiringSoonCount > 0 ? "bg-amber-500/30 text-amber-300" : "bg-emerald-500/30 text-emerald-300"
              }`}>
                {expiringSoonCount > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-purple-200 font-medium">Thời hạn lưu trú & Khai báo</p>
                <p className="text-xs font-bold text-white">
                  {expiringSoonCount > 0 ? `${expiringSoonCount} ca sắp hết hạn` : `${registeredPoliceCount}/${foreignResidentsList.length} đã cấp KBTT`}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-filter Bar for Foreigners */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
            <span className="text-purple-300 text-xs font-semibold flex items-center gap-1">
              <Filter size={13} /> Lọc chuyên sâu:
            </span>

            {/* Nationality Sub-filter */}
            <select
              value={foreignNationalityFilter}
              onChange={(e) => {
                setForeignNationalityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-purple-950/80 border border-purple-700 text-purple-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400 text-xs"
            >
              <option value="Tất cả">Quốc tịch: Tất cả ({uniqueNationalities.length})</option>
              {uniqueNationalities.map((nat) => (
                <option key={nat} value={nat}>{getCountryFlag(nat)} {nat}</option>
              ))}
            </select>

            {/* Visa Type Sub-filter */}
            <select
              value={foreignVisaTypeFilter}
              onChange={(e) => {
                setForeignVisaTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-purple-950/80 border border-purple-700 text-purple-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400 text-xs"
            >
              <option value="Tất cả">Loại thị thực / Cư trú: Tất cả</option>
              <option value="Thẻ tạm trú (TRC)">Thẻ tạm trú (TRC)</option>
              <option value="Thị thực LĐ">Thị thực Lao động (Visa LĐ)</option>
              <option value="Thị thực ĐT">Thị thực Đầu tư (Visa ĐT)</option>
              <option value="Miễn thị thực / E-Visa">Miễn thị thực / E-Visa</option>
            </select>

            {/* Expiry Sub-filter */}
            <select
              value={foreignExpiryFilter}
              onChange={(e) => {
                setForeignExpiryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-purple-950/80 border border-purple-700 text-purple-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400 text-xs"
            >
              <option value="Tất cả">Thời hạn cư trú: Tất cả</option>
              <option value="Còn hạn dài">Còn hạn dài (&gt; 30 ngày)</option>
              <option value="Sắp hết hạn">Sắp hết hạn (≤ 30 ngày)</option>
              <option value="Đã hết hạn">Đã quá hạn</option>
            </select>

            {(foreignNationalityFilter !== "Tất cả" || foreignVisaTypeFilter !== "Tất cả" || foreignExpiryFilter !== "Tất cả") && (
              <button
                type="button"
                onClick={() => {
                  setForeignNationalityFilter("Tất cả");
                  setForeignVisaTypeFilter("Tất cả");
                  setForeignExpiryFilter("Tất cả");
                  setCurrentPage(1);
                }}
                className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
              >
                Đặt lại bộ lọc NNN
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container: Toàn bộ chiều rộng cho danh sách cư dân */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden w-full">
        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-[280px]">Cư dân & Nhân thân</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Số CCCD / Mã BHYT</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Hộ khẩu & Địa chỉ thường trú</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Học vấn & Việc làm</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Diện cư trú & Chính sách</th>
                  <th className="py-3.5 px-4 text-center w-[70px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-slate-400">
                      Không tìm thấy cư dân nào phù hợp với bộ lọc hiện tại
                    </td>
                  </tr>
                ) : (
                  paginatedResidents.map((res) => {
                    const statusColors = {
                      "Thường trú": "bg-emerald-50 text-emerald-700 border-emerald-200",
                      "Tạm trú": "bg-amber-50 text-amber-700 border-amber-200",
                      "Tạm vắng": "bg-slate-100 text-slate-700 border-slate-300"
                    };
                    const isSelected = selectedResident?.id === res.id && showDetailModal;
                    const isForeign = isForeignResident(res);
                    const expiryInfo = isForeign ? getVisaExpiryStatus(res.visaValidUntil) : null;
                    const tamTruExpiry = (!isForeign && res.status === "Tạm trú") ? getTemporaryResidenceExpiryStatus(res.temporaryExpDate) : null;
                    const hostelInfo = parseAccommodationInfo(res.address || res.currentAddress || res.temporaryAddress);

                    return (
                      <tr 
                        key={res.id}
                        id={`resident-row-${res.id}`}
                        onClick={() => handleOpenDetailModal(res)}
                        className={`hover:bg-emerald-50/30 cursor-pointer transition-colors group ${
                          isSelected ? "bg-emerald-50/50" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img 
                                src={res.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                                alt={res.fullName} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 group-hover:border-emerald-400 transition-colors"
                                referrerPolicy="no-referrer"
                              />
                              {isForeign && (
                                <span className="absolute -bottom-1 -right-1 text-xs" title={`Quốc tịch: ${res.nationality}`}>
                                  {getCountryFlag(res.nationality)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-nowrap">
                                <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm whitespace-nowrap truncate hover:underline" title={res.fullName}>
                                  {res.fullName}
                                </span>
                                {isForeign && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                    {res.nationality || "Nước ngoài"}
                                  </span>
                                )}
                                {res.policyGroup?.includes("Đảng viên") && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Đảng viên"></span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                <span>{res.gender}</span>
                                <span>•</span>
                                <span>{res.birthDate}</span>
                                {isForeign ? (
                                  <span>• {res.nationality}</span>
                                ) : (
                                  res.ethnicity && <span>• {res.ethnicity}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isForeign ? (
                            <div>
                              <div className="font-mono text-xs font-bold text-purple-900 flex items-center gap-1">
                                <span className="text-[9px] px-1 bg-purple-100 text-purple-800 rounded font-sans font-bold">HC</span>
                                {res.passportNumber || res.cccd}
                              </div>
                              {res.passportExpiryDate && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Hạn HC: {res.passportExpiryDate}
                                </div>
                              )}
                              {res.temporaryRegistrationCode && (
                                <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-medium truncate max-w-[170px]" title={res.temporaryRegistrationCode}>
                                  CA: {res.temporaryRegistrationCode}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="font-mono text-xs font-bold text-slate-900">{res.cccd}</div>
                              {res.healthInsuranceNumber ? (
                                <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-medium">
                                  BHYT: {res.healthInsuranceNumber}
                                </div>
                              ) : res.idIssueDate ? (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Cấp: {res.idIssueDate}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-700 font-bold">
                              {res.householdId}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({res.relationToOwner})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate max-w-[280px] mt-0.5 flex items-center gap-1" title={res.address}>
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span>{hostelInfo.isHostel && hostelInfo.shortAddress ? hostelInfo.shortAddress : res.address}</span>
                          </div>
                          {hostelInfo.isHostel && (
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                                <Home size={9} className="text-amber-700" />
                                <span>{hostelInfo.hostelName}</span>
                              </span>
                              {hostelInfo.phone && (
                                <a 
                                  href={`tel:${hostelInfo.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-0.5 text-[9.5px] text-emerald-700 font-mono font-semibold hover:underline bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200"
                                  title="Gọi điện cho chủ nhà trọ"
                                >
                                  <Phone size={8.5} /> {hostelInfo.phone}
                                </a>
                              )}
                            </div>
                          )}
                          {isForeign && res.landlordContact && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[280px] mt-0.5 flex items-center gap-1">
                              <Home size={10} className="text-slate-400 shrink-0" />
                              <span>Chủ nhà: {res.landlordContact}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 truncate max-w-[190px]">{res.occupation || "Chưa cập nhật"}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[190px] mt-0.5">
                            {isForeign 
                              ? (res.sponsoringOrganization || res.workplace || "Cư trú tự do")
                              : `${res.education ? res.education : "Học vấn: Chưa cập nhật"}${res.workplace ? ` • ${res.workplace}` : ""}`}
                          </div>
                          {isForeign && res.workPermitNumber && (
                            <div className="text-[10px] text-blue-700 font-mono truncate max-w-[190px] mt-0.5">
                              GPLĐ: {res.workPermitNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isForeign ? (
                            <div className="space-y-1">
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                                {res.visaOrCardType || "Tạm trú"}
                              </span>
                              {expiryInfo && (
                                <div className={`text-[10px] px-2 py-0.5 rounded-md border font-mono truncate max-w-[160px] ${expiryInfo.badgeClass}`}>
                                  {expiryInfo.label}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[res.status]}`}>
                                  {res.status}
                                </span>
                                {res.policyGroup && res.policyGroup !== "Bình thường" && (
                                  <span className="text-[10px] font-semibold text-rose-600 truncate max-w-[140px]">
                                    {res.policyGroup}
                                  </span>
                                )}
                              </div>
                              {/* CẢNH BÁO HẾT HẠN TẠM TRÚ TRƯỚC 1 THÁNG / QUÁ HẠN */}
                              {tamTruExpiry && tamTruExpiry.status !== "unknown" && (
                                <div>
                                  {tamTruExpiry.isWarning ? (
                                    <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-mono font-bold bg-amber-100 text-amber-950 border-amber-400 shadow-xs animate-pulse" title={`Thời hạn tạm trú đến ngày ${tamTruExpiry.formattedDate}`}>
                                      <AlertTriangle size={11} className="text-amber-700 shrink-0" />
                                      <span>{tamTruExpiry.label}</span>
                                    </div>
                                  ) : tamTruExpiry.isExpired ? (
                                    <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-mono font-bold bg-rose-100 text-rose-900 border-rose-300 shadow-xs" title={`Thời hạn tạm trú đã hết ngày ${tamTruExpiry.formattedDate}`}>
                                      <AlertCircle size={11} className="text-rose-700 shrink-0" />
                                      <span>{tamTruExpiry.label}</span>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      Hạn: {tamTruExpiry.formattedDate}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center relative">
                          <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === res.id ? null : res.id);
                              }}
                              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                                activeDropdownId === res.id 
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs" 
                                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200"
                              }`}
                              title="Tùy chọn thao tác"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {activeDropdownId === res.id && (
                              <div 
                                className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenDetailModal(res);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <Eye size={14} className="text-emerald-600" />
                                  <span>Xem chi tiết hồ sơ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDirections(res);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <Navigation size={14} className="text-emerald-600" />
                                  <span>Chỉ đường GIS</span>
                                </button>

                                {isForeign ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenNA17(res);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                  >
                                    <FileText size={14} className="text-purple-600" />
                                    <span>In Mẫu NA17 (BCA)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenCT07(res);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                  >
                                    <Printer size={14} className="text-slate-600" />
                                    <span>In xác nhận CT07</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleEditClick(res);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <Edit2 size={14} className="text-blue-600" />
                                  <span>Sửa thông tin</span>
                                </button>

                                <div className="my-1 border-t border-slate-100"></div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    if (confirm(`Bạn có chắc muốn xóa hồ sơ cư dân ${res.fullName}?`)) {
                                      onDeleteResident(res.id);
                                      if (selectedResident?.id === res.id) setSelectedResident(null);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  <span>Xóa hồ sơ</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5 max-h-[640px] overflow-y-auto bg-slate-50/30">
            {filteredResidents.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400 col-span-full">
                Không tìm thấy cư dân nào phù hợp với bộ lọc hiện tại
              </div>
            ) : (
              paginatedResidents.map((res) => {
                const statusColors = {
                  "Thường trú": "bg-emerald-50 text-emerald-700 border-emerald-200",
                  "Tạm trú": "bg-amber-50 text-amber-700 border-amber-200",
                  "Tạm vắng": "bg-slate-100 text-slate-700 border-slate-300"
                };
                const isForeign = isForeignResident(res);
                const expiryInfo = isForeign ? getVisaExpiryStatus(res.visaValidUntil) : null;
                const tamTruExpiry = (!isForeign && res.status === "Tạm trú") ? getTemporaryResidenceExpiryStatus(res.temporaryExpDate) : null;
                const hostelInfo = parseAccommodationInfo(res.address || res.currentAddress || res.temporaryAddress);

                return (
                  <div 
                    key={res.id}
                    id={`resident-card-${res.id}`}
                    onClick={() => handleOpenDetailModal(res)}
                    className="p-4 rounded-2xl border border-slate-200/90 cursor-pointer transition-all flex flex-col justify-between gap-3.5 bg-white hover:shadow-md hover:border-emerald-300 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <img 
                          src={res.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                          alt={res.fullName} 
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 group-hover:border-emerald-400 transition-colors"
                          referrerPolicy="no-referrer"
                        />
                        {isForeign && (
                          <span className="absolute -bottom-1 -right-1 text-sm" title={`Quốc tịch: ${res.nationality}`}>
                            {getCountryFlag(res.nationality)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                            {res.fullName}
                          </h4>
                          {isForeign ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 bg-purple-50 text-purple-700 border-purple-200">
                              {res.visaOrCardType || "Tạm trú NNN"}
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusColors[res.status]}`}>
                              {res.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {res.gender} • {res.birthDate} • {isForeign ? res.nationality : (res.ethnicity || "Kinh")}
                        </p>
                        <p className="text-[11px] text-slate-800 mt-1 font-mono font-bold flex items-center justify-between">
                          <span>{isForeign ? `HC: ${res.passportNumber || res.cccd}` : `CCCD: ${res.cccd}`}</span>
                          <span className="text-slate-500 font-normal text-[10px] bg-slate-100 px-1.5 py-0.2 rounded">Hộ: {res.householdId}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2.5 border-t border-slate-100 text-[11px] space-y-1">
                      <div className="text-slate-600 truncate flex items-center gap-1.5">
                        <Briefcase size={12} className="text-slate-400 shrink-0" />
                        <span>{res.occupation || "Chưa cập nhật nghề nghiệp"} {isForeign && res.sponsoringOrganization ? `• ${res.sponsoringOrganization}` : (res.education ? `(${res.education})` : "")}</span>
                      </div>
                      <div className="text-slate-500 truncate flex items-center gap-1.5" title={res.address}>
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span>{hostelInfo.isHostel && hostelInfo.shortAddress ? hostelInfo.shortAddress : res.address}</span>
                      </div>
                      {hostelInfo.isHostel && (
                        <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                          <Home size={10} className="text-amber-600 shrink-0" />
                          <span className="truncate">{hostelInfo.hostelName} {hostelInfo.phone ? `(${hostelInfo.phone})` : ""}</span>
                        </div>
                      )}
                      {isForeign && expiryInfo && (
                        <div className="text-[10px] font-mono flex items-center gap-1 pt-0.5">
                          <span className={`px-2 py-0.5 rounded border ${expiryInfo.badgeClass}`}>
                            {expiryInfo.label}
                          </span>
                        </div>
                      )}
                      {tamTruExpiry && tamTruExpiry.status !== "unknown" && (
                        <div className="text-[10px] font-mono flex items-center gap-1 pt-0.5">
                          {tamTruExpiry.isWarning ? (
                            <span className="px-2 py-0.5 rounded border font-bold bg-amber-100 text-amber-950 border-amber-400 animate-pulse flex items-center gap-1">
                              <AlertTriangle size={10} className="text-amber-700" />
                              {tamTruExpiry.label}
                            </span>
                          ) : tamTruExpiry.isExpired ? (
                            <span className="px-2 py-0.5 rounded border font-bold bg-rose-100 text-rose-900 border-rose-300 flex items-center gap-1">
                              <AlertCircle size={10} className="text-rose-700" />
                              {tamTruExpiry.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              Hạn tạm trú: {tamTruExpiry.formattedDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[9px] font-semibold text-rose-600 truncate max-w-[110px]">
                        {isForeign ? (res.temporaryRegistrationCode ? `Đã KBTT CA` : "Chờ khai báo") : (res.policyGroup && res.policyGroup !== "Bình thường" ? res.policyGroup : "Dân cư phổ thông")}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenDetailModal(res)}
                          className="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye size={12} /> Chi tiết
                        </button>
                        <button 
                          onClick={() => handleDirections(res)}
                          className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-50 border border-emerald-200 cursor-pointer transition-colors"
                          title="Chỉ đường GIS đến nơi cư trú"
                        >
                          <Navigation size={12} />
                        </button>
                        {isForeign ? (
                          <button 
                            onClick={() => handleOpenNA17(res)}
                            className="p-1 text-purple-600 hover:text-purple-800 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                            title="In mẫu NA17"
                          >
                            <FileText size={13} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenCT07(res)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                            title="In mẫu CT07"
                          >
                            <Printer size={13} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditClick(res)}
                          className="p-1 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        
        <Pagination
          id="citizen-pagination"
          currentPage={activePage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MODAL CHI TIẾT CƯ DÂN CHÍNH GIỮA VIEWPORT (Chuẩn Reference Modal KP3) */}
      {showDetailModal && selectedResident && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleCloseDetailModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-resident-name"
        >
          <div 
            id="resident-detail-modal"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[480px] max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 relative"
          >
            {/* Header: Nền xanh navy đậm chuyển sắc nhẹ, căn giữa toàn bộ ảnh, tên và mã */}
            <div className="bg-gradient-to-b from-[#12233c] via-[#0f1f35] to-[#0a1626] text-white px-5 pt-6 pb-5 relative shrink-0 text-center shadow-inner">
              {/* Nút đóng ở góc trên bên phải */}
              <button 
                id="btn-close-detail-modal"
                onClick={handleCloseDetailModal}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-xs focus:outline-none focus:ring-2 focus:ring-white/40"
                title="Đóng (Esc)"
                aria-label="Đóng cửa sổ"
              >
                <X size={18} />
              </button>

              {/* Avatar tròn 72-80px căn giữa */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <img 
                    id="modal-resident-avatar"
                    src={selectedResident.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                    alt={selectedResident.fullName}
                    className="w-20 h-20 rounded-full border-3 border-white/90 shadow-lg object-cover bg-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  {selectedResident.policyGroup?.includes("Đảng viên") && (
                    <span 
                      className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold"
                      title="Đảng viên ĐCSVN"
                    >
                      ★
                    </span>
                  )}
                </div>
              </div>

              {/* Họ tên cư dân chữ trắng, đậm, căn giữa */}
              <h2 id="modal-resident-name" className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug px-4">
                {selectedResident.fullName}
              </h2>

              {/* Hai badge mã cư dân (xanh lá đậm) và mã hộ (xanh dương đậm) */}
              <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-600/40 shadow-2xs">
                  MÃ: {selectedResident.id}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-900/90 text-blue-200 border border-blue-600/40 shadow-2xs">
                  HỘ: {selectedResident.householdId}
                </span>
                {isForeignResident(selectedResident) ? (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-900/90 text-purple-200 border border-purple-600/50 shadow-2xs flex items-center gap-1">
                    <span>{getCountryFlag(selectedResident.nationality)}</span>
                    <span>{selectedResident.nationality}</span>
                  </span>
                ) : (
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border shadow-2xs ${
                    selectedResident.status === "Thường trú"
                      ? "bg-emerald-950/70 text-emerald-300 border-emerald-700/50"
                      : selectedResident.status === "Tạm trú"
                      ? "bg-amber-950/70 text-amber-300 border-amber-700/50"
                      : "bg-slate-800/80 text-slate-300 border-slate-600/50"
                  }`}>
                    {selectedResident.status}
                  </span>
                )}
              </div>
            </div>

            {/* Thân modal: Nền trắng xám rất nhạt, padding 14-16px, các thẻ thông tin tách biệt */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-100/70 text-xs">
              
              {/* THẺ 1: Thông tin định danh & CCCD / Hộ chiếu */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-xs">
                  <CreditCard size={15} className="text-emerald-700" />
                  <span>1. Thông tin định danh {isForeignResident(selectedResident) ? "& Hộ chiếu Quốc tế" : "& CCCD"}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 text-[11px]">
                      {isForeignResident(selectedResident) ? "Số Hộ chiếu (Passport No.):" : "Số định danh / CCCD:"}
                    </span>
                    <span className="font-mono font-bold text-slate-900 tracking-wider text-xs">
                      {isForeignResident(selectedResident) ? (selectedResident.passportNumber || selectedResident.cccd) : selectedResident.cccd}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Ngày cấp:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedResident.idIssueDate || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Nơi cấp:</span>
                      <span className="font-semibold text-slate-800 truncate block" title={selectedResident.idIssuePlace || "Chưa cập nhật"}>
                        {selectedResident.idIssuePlace || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Ngày sinh:</span>
                      <span className="font-semibold text-slate-800">{selectedResident.birthDate || "Chưa cập nhật"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Giới tính:</span>
                      <span className="font-semibold text-slate-800">{selectedResident.gender || "Chưa cập nhật"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 py-1 border-b border-slate-50">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Dân tộc:</span>
                      <span className="font-semibold text-slate-800">{selectedResident.ethnicity || "Chưa cập nhật"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Tôn giáo:</span>
                      <span className="font-semibold text-slate-800">{selectedResident.religion || "Chưa cập nhật"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Quốc tịch:</span>
                      <span className="font-semibold text-slate-800">{selectedResident.nationality || "Việt Nam"}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-500 text-[11px] block">Quê quán:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedResident.hometown || "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              {/* THẺ 2: Hộ khẩu & Nơi cư trú */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-xs">
                  <Home size={15} className="text-blue-700" />
                  <span>2. Hộ khẩu & Nơi cư trú</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 text-[11px]">Diện cư trú:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      selectedResident.status === "Thường trú"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedResident.status === "Tạm trú"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {selectedResident.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Mã số hộ khẩu:</span>
                      <span className="font-mono font-bold text-blue-700">
                        {selectedResident.householdId || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Quan hệ chủ hộ:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedResident.relationToOwner || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 border-b border-slate-50">
                    <span className="text-slate-500 text-[11px] block">Nơi thường trú gốc (Địa chỉ thường trú):</span>
                    <span className="font-medium text-slate-800 leading-snug">
                      {selectedResident.permanentAddress || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="py-1 border-b border-slate-50">
                    <span className="text-slate-500 text-[11px] block">Chỗ ở hiện tại / Tạm trú:</span>
                    <span className="font-medium text-slate-800 leading-snug">
                      {selectedResident.currentAddress || selectedResident.temporaryAddress || selectedResident.address || "Chưa cập nhật"}
                    </span>
                  </div>

                  {(selectedResident.status === "Tạm trú" || selectedResident.temporaryRegDate || selectedResident.temporaryExpDate) && (
                    <div className="space-y-2 py-1 border-b border-slate-50">
                      <div className="grid grid-cols-2 gap-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                        <div>
                          <span className="text-amber-800 text-[10px] block font-semibold">Ngày đăng ký tạm trú:</span>
                          <span className="font-medium text-slate-800 text-[11px]">
                            {selectedResident.temporaryRegDate || "Chưa cập nhật"}
                          </span>
                        </div>
                        <div>
                          <span className="text-amber-800 text-[10px] block font-semibold">Ngày hết hạn tạm trú:</span>
                          <span className="font-medium text-slate-800 text-[11px]">
                            {selectedResident.temporaryExpDate || "Chưa cập nhật"}
                          </span>
                        </div>
                      </div>

                      {/* CẢNH BÁO HẾT HẠN TẠM TRÚ TRƯỚC 01 THÁNG TRÊN MODAL */}
                      {(() => {
                        const expiry = getTemporaryResidenceExpiryStatus(selectedResident.temporaryExpDate);
                        if (expiry.status === "unknown") return null;
                        return (
                          <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                            expiry.isWarning 
                              ? "bg-amber-100 border-amber-400 text-amber-950 shadow-xs animate-pulse" 
                              : expiry.isExpired 
                              ? "bg-rose-100 border-rose-300 text-rose-950 shadow-xs" 
                              : "bg-emerald-50 border-emerald-200 text-emerald-900"
                          }`}>
                            {expiry.isWarning ? (
                              <AlertTriangle size={17} className="text-amber-700 shrink-0 mt-0.5" />
                            ) : expiry.isExpired ? (
                              <AlertCircle size={17} className="text-rose-700 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 text-[11px] leading-tight">
                              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                <span>{expiry.label}</span>
                                {expiry.isWarning && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-mono font-bold">
                                    Cảnh báo trước 30 ngày
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] opacity-90 mt-1 leading-normal">
                                {expiry.isWarning 
                                  ? "Cảnh báo trước 01 tháng: Cán bộ khu phố / CSKV cần liên hệ cơ sở lưu trú và cư dân hướng dẫn nộp hồ sơ gia hạn tạm trú trực tuyến trên Cổng Dịch vụ công." 
                                  : expiry.isExpired 
                                  ? "Đã quá hạn đăng ký tạm trú: Cần kiểm tra nơi ở hiện tại thực tế và nhắc nhở công dân hoặc lập biên bản xử lý theo Luật Cư trú." 
                                  : `Thời hạn cư trú hợp lệ đến ngày ${expiry.formattedDate}.`}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* KHỐI THÔNG TIN BÓC TÁCH NHÀ TRỌ / CƠ SỞ LƯU TRÚ QUẢN LÝ */}
                  {(() => {
                    const hostel = parseAccommodationInfo(selectedResident.currentAddress || selectedResident.temporaryAddress || selectedResident.address);
                    if (!hostel.isHostel) return null;
                    return (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                            <Home size={14} className="text-amber-700" />
                            Cơ sở Lưu trú / Nhà trọ Quản lý
                          </span>
                          <span className="text-[9.5px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            Liên kết CSKD
                          </span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-lg border border-amber-100 space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Tên cơ sở / Nhà trọ:</span>
                            <strong className="text-slate-900">{hostel.hostelName}</strong>
                          </div>
                          {hostel.owner && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Chủ nhà trọ:</span>
                              <strong className="text-slate-800">{hostel.owner}</strong>
                            </div>
                          )}
                          {hostel.phone && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Số điện thoại chủ trọ:</span>
                              <a 
                                href={`tel:${hostel.phone}`}
                                className="inline-flex items-center gap-1 text-emerald-700 font-mono font-bold hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                              >
                                <Phone size={10} /> {hostel.phone} (Gọi ngay)
                              </a>
                            </div>
                          )}
                          <div className="pt-1 border-t border-slate-100">
                            <span className="text-slate-500 block text-[10px]">Địa chỉ phòng trọ ghi nhận:</span>
                            <span className="font-medium text-slate-800">{hostel.address || selectedResident.address}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {selectedResident.managementStatus && (
                    <div className="py-1 border-b border-slate-50">
                      <span className="text-slate-500 text-[11px] block">Tình trạng quản lý:</span>
                      <span className="font-semibold text-emerald-800 text-[11px]">
                        {selectedResident.managementStatus}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">Định vị & Chỉ đường:</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleDirections(selectedResident);
                        setShowDetailModal(false);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Navigation size={12} />
                      Chỉ đường GIS KP3
                    </button>
                  </div>
                </div>
              </div>

              {/* THẺ 3: Học vấn, Việc làm & Gia đình */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-xs">
                  <GraduationCap size={15} className="text-amber-700" />
                  <span>3. Học vấn, Việc làm & Gia đình</span>
                </div>

                <div className="space-y-2">
                  {(selectedResident.fatherName || selectedResident.motherName) && (
                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50 bg-slate-50 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Họ tên cha:</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {selectedResident.fatherName || "Chưa cập nhật"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Họ tên mẹ:</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {selectedResident.motherName || "Chưa cập nhật"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Trình độ học vấn:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedResident.education || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Hôn nhân:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedResident.maritalStatus || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 border-b border-slate-50">
                    <span className="text-slate-500 text-[11px] block">Nghề nghiệp:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedResident.occupation || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-500 text-[11px] block">Nơi làm việc / Cơ quan:</span>
                    <span className="font-medium text-slate-800 leading-snug">
                      {selectedResident.workplace || "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              {/* THẺ 4: Chính sách, Y tế & Liên hệ */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-xs">
                  <Award size={15} className="text-rose-700" />
                  <span>4. Chính sách, Y tế & Liên hệ</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 text-[11px]">Diện chính sách / Đoàn thể:</span>
                    <span className="font-bold text-rose-700">
                      {selectedResident.policyGroup || "Dân cư phổ thông / Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Mã thẻ BHYT:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {selectedResident.healthInsuranceNumber || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Nghĩa vụ quân sự:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedResident.militaryServiceStatus || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 text-[11px]">Số điện thoại:</span>
                    <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      {selectedResident.phone && selectedResident.phone !== "N/A" ? selectedResident.phone : "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="py-1">
                    <span className="text-slate-500 text-[11px] block">Liên hệ khẩn cấp:</span>
                    <span className="font-medium text-slate-800">
                      {selectedResident.emergencyContact || "Chưa cập nhật"}
                    </span>
                  </div>

                  {selectedResident.notes && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-800">Ghi chú quản lý:</span>
                      <p className="text-[11px] italic mt-0.5">{selectedResident.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* THẺ 5 (DÀNH CHO NGƯỜI NƯỚC NGOÀI): Hồ sơ Thị thực & Tạm trú */}
              {isForeignResident(selectedResident) && (
                <div className="bg-white rounded-2xl p-3.5 border border-purple-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100 text-purple-900 font-bold text-xs">
                    <div className="flex items-center gap-2">
                      <Globe size={15} className="text-purple-600" />
                      <span>5. Hồ sơ Cư trú & Thị thực Người nước ngoài</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">
                      {getCountryFlag(selectedResident.nationality)} {selectedResident.nationality}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Số Hộ chiếu (Passport):</span>
                        <span className="font-mono font-bold text-purple-900 text-xs">
                          {selectedResident.passportNumber || selectedResident.cccd}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Ngày hết hạn Hộ chiếu:</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {selectedResident.passportExpiryDate || "Không thời hạn"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Loại thị thực / Cư trú:</span>
                        <span className="font-bold text-purple-700">
                          {selectedResident.visaOrCardType || "Thẻ tạm trú (TRC)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Số thẻ / Thị thực:</span>
                        <span className="font-mono text-slate-800">
                          {selectedResident.visaOrCardNumber || "TRC-VN"}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 border-b border-slate-50">
                      <span className="text-slate-500 text-[11px] block">Thời hạn cư trú hợp pháp:</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-semibold text-slate-800 font-mono">
                          Từ {selectedResident.visaValidFrom || selectedResident.joinDate || "01/01/2023"} đến {selectedResident.visaValidUntil || "31/12/2026"}
                        </span>
                        {(() => {
                          const exp = getVisaExpiryStatus(selectedResident.visaValidUntil);
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${exp.badgeClass}`}>
                              {exp.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Mã khai báo tạm trú CA Phường:</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {selectedResident.temporaryRegistrationCode || "KBTT-AP-2024-ONLINE"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Tình trạng khai báo:</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {selectedResident.temporaryRegistrationStatus || "Đã khai báo"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-50">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Giấy phép lao động (GPLĐ):</span>
                        <span className="font-mono text-slate-800">
                          {selectedResident.workPermitNumber || "Miễn GPLĐ / Chưa cấp"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Cơ quan / Đơn vị bảo lãnh:</span>
                        <span className="font-medium text-slate-800 truncate block" title={selectedResident.sponsoringOrganization || selectedResident.workplace}>
                          {selectedResident.sponsoringOrganization || selectedResident.workplace || "Tự do"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-slate-500 text-[11px] block">Chủ nhà / Cơ sở lưu trú cho thuê:</span>
                      <span className="font-medium text-slate-800">
                        {selectedResident.landlordContact || "Ban Điều hành Khu phố 3"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer hành động của Modal */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {isForeignResident(selectedResident) ? (
                  <button 
                    id="btn-modal-print-na17"
                    onClick={() => handleOpenNA17(selectedResident)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer hover:shadow-xs"
                  >
                    <FileText size={14} className="text-purple-700" /> In Mẫu NA17 (Khai báo tạm trú NNN)
                  </button>
                ) : (
                  <button 
                    id="btn-modal-print-ct07"
                    onClick={() => handleOpenCT07(selectedResident)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer hover:shadow-xs"
                  >
                    <Printer size={14} className="text-emerald-700" /> In Mẫu CT07
                  </button>
                )}
                <button
                  id="btn-modal-directions"
                  onClick={() => {
                    handleDirections(selectedResident);
                    setShowDetailModal(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Navigation size={13} /> Chỉ đường GIS
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  id="btn-modal-edit"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditClick(selectedResident);
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit2 size={13} /> Sửa
                </button>
                <button 
                  id="btn-modal-delete"
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa vĩnh viễn cư dân ${selectedResident.fullName}?`)) {
                      onDeleteResident(selectedResident.id);
                      setShowDetailModal(false);
                      setSelectedResident(null);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 size={13} /> Xóa
                </button>
                <button 
                  id="btn-modal-close-footer"
                  onClick={handleCloseDetailModal}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD & EDIT RESIDENT (Tabbed 4-Step Form) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="text-emerald-400" size={20} />
                <h3 className="font-bold text-sm sm:text-base">
                  {isEditMode ? `Cập nhật hồ sơ cư dân: ${formData.fullName}` : "Thêm mới hồ sơ cư dân (Chuẩn 26 trường CSDL)"}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setIsEditMode(false);
                  setEditingResidentId(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Step Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setFormActiveTab("basic")}
                className={`flex-1 py-3 px-2 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  formActiveTab === "basic" 
                    ? "border-emerald-600 text-emerald-700 bg-white font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <CreditCard size={14} /> 1. Định danh
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("residence")}
                className={`flex-1 py-3 px-2 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  formActiveTab === "residence" 
                    ? "border-emerald-600 text-emerald-700 bg-white font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Home size={14} /> 2. Cư trú & Hộ
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("career")}
                className={`flex-1 py-3 px-2 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  formActiveTab === "career" 
                    ? "border-emerald-600 text-emerald-700 bg-white font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <GraduationCap size={14} /> 3. Việc làm
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("policy")}
                className={`flex-1 py-3 px-2 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  formActiveTab === "policy" 
                    ? "border-emerald-600 text-emerald-700 bg-white font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Award size={14} /> 4. Chính sách
              </button>
              <button
                type="button"
                onClick={() => setFormActiveTab("foreigner")}
                className={`flex-1 py-3 px-2 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  formActiveTab === "foreigner" 
                    ? "border-purple-600 text-purple-700 bg-white font-bold" 
                    : formData.isForeigner
                    ? "border-transparent text-purple-600 hover:text-purple-800 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Globe size={14} className={formData.isForeigner ? "text-purple-600" : ""} /> 
                <span>5. Hộ chiếu & Thị thực</span>
                {formData.isForeigner && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* TAB 1: BASIC & IDENTITY */}
              {formActiveTab === "basic" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Foreigner Switch Toggle */}
                  <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Globe className="text-purple-600 shrink-0" size={18} />
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Là Người cư trú nước ngoài (Foreign Resident)</span>
                        <span className="text-[11px] text-slate-500 block">Sử dụng Hộ chiếu, theo dõi thị thực, thẻ tạm trú TRC & khai báo Công an Phường</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={formData.isForeigner}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            isForeigner: checked,
                            status: checked && formData.status === "Thường trú" ? "Tạm trú" : formData.status,
                            nationality: checked && formData.nationality === "Việt Nam" ? "Hàn Quốc" : formData.nationality
                          });
                          if (checked) {
                            setFormActiveTab("foreigner");
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Họ và Tên *</label>
                      <input 
                        type="text" 
                        name="fullName"
                        required
                        placeholder={formData.isForeigner ? "Park Min-ho, Johnathan Miller..." : "Nguyễn Văn A"}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">
                        {formData.isForeigner ? "Số Hộ chiếu (Passport No.) *" : "Số CCCD (12 số) *"}
                      </label>
                      <input 
                        type="text" 
                        name="cccd"
                        required
                        placeholder={formData.isForeigner ? "M89210452, UK55981240..." : "0790xxxxxxxx"}
                        value={formData.cccd}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            cccd: e.target.value,
                            passportNumber: formData.isForeigner ? e.target.value : formData.passportNumber
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Ngày cấp CCCD</label>
                      <input 
                        type="text" 
                        name="idIssueDate"
                        placeholder="15/05/2021"
                        value={formData.idIssueDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Nơi cấp CCCD</label>
                      <input 
                        type="text" 
                        name="idIssuePlace"
                        placeholder="Cục Cảnh sát QLHC về TTXH"
                        value={formData.idIssuePlace}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Giới tính</label>
                      <select 
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Ngày sinh</label>
                      <input 
                        type="text" 
                        name="birthDate"
                        placeholder="DD/MM/YYYY"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Dân tộc</label>
                      <input 
                        type="text" 
                        name="ethnicity"
                        placeholder="Kinh, Hoa..."
                        value={formData.ethnicity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Tôn giáo</label>
                      <input 
                        type="text" 
                        name="religion"
                        placeholder="Không, Phật giáo..."
                        value={formData.religion}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Quốc tịch</label>
                      <input 
                        type="text" 
                        name="nationality"
                        placeholder="Việt Nam"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Quê quán</label>
                      <input 
                        type="text" 
                        name="hometown"
                        placeholder="Tỉnh/Thành phố quê hương"
                        value={formData.hometown}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RESIDENCE & HOUSEHOLD */}
              {formActiveTab === "residence" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Diện cư trú *</label>
                      <select 
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="Thường trú">Thường trú</option>
                        <option value="Tạm trú">Tạm trú</option>
                        <option value="Tạm vắng">Tạm vắng</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Mã Hộ khẩu liên kết</label>
                      <input 
                        type="text" 
                        name="householdId"
                        placeholder="HK-301"
                        value={formData.householdId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Quan hệ với chủ hộ</label>
                      <input 
                        type="text" 
                        name="relationToOwner"
                        placeholder="Chủ hộ, Vợ, Con trai..."
                        value={formData.relationToOwner}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Địa chỉ cư trú hiện tại (Khu phố 3)</label>
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Nơi thường trú gốc (Địa chỉ trên sổ hộ khẩu)</label>
                    <input 
                      type="text" 
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Nơi ở hiện nay / Nơi tạm trú (Nếu khác)</label>
                    <input 
                      type="text" 
                      name="temporaryAddress"
                      value={formData.temporaryAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CAREER & EDUCATION */}
              {formActiveTab === "career" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Trình độ học vấn</label>
                      <input 
                        type="text" 
                        name="education"
                        placeholder="12/12, Đại học, Thạc sĩ..."
                        value={formData.education}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Tình trạng hôn nhân</label>
                      <select 
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Đã kết hôn">Đã kết hôn</option>
                        <option value="Độc thân">Độc thân</option>
                        <option value="Ly hôn">Ly hôn</option>
                        <option value="Góa">Góa</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Nghề nghiệp hiện nay</label>
                    <input 
                      type="text" 
                      name="occupation"
                      placeholder="Kỹ sư, Giáo viên, Kinh doanh, Cán bộ..."
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Nơi làm việc / Cơ quan công tác</label>
                    <input 
                      type="text" 
                      name="workplace"
                      placeholder="Tên công ty, trường học, cơ quan..."
                      value={formData.workplace}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: POLICY, HEALTH & CONTACT */}
              {formActiveTab === "policy" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Diện chính sách / Đoàn thể</label>
                      <input 
                        type="text" 
                        name="policyGroup"
                        placeholder="Đảng viên, Cựu chiến binh, Thương binh, Người cao tuổi..."
                        value={formData.policyGroup}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-semibold text-rose-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Mã số thẻ BHYT</label>
                      <input 
                        type="text" 
                        name="healthInsuranceNumber"
                        placeholder="DN479xxxxxxxxx"
                        value={formData.healthInsuranceNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Nghĩa vụ quân sự</label>
                      <input 
                        type="text" 
                        name="militaryServiceStatus"
                        placeholder="Đã hoàn thành, Sĩ quan dự bị, Tạm hoãn..."
                        value={formData.militaryServiceStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Số điện thoại liên lạc</label>
                      <input 
                        type="text" 
                        name="phone"
                        placeholder="09xxxxxxxx"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Người liên hệ khẩn cấp (Họ tên & SĐT)</label>
                    <input 
                      type="text" 
                      name="emergencyContact"
                      placeholder="Nguyễn Văn B (Cha) - 0903xxxxxx"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Ghi chú quản lý cư trú</label>
                    <textarea 
                      name="notes"
                      rows={2}
                      placeholder="Ghi chú thêm về nhân khẩu..."
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: FOREIGNER & VISA / RESIDENCE CARD */}
              {formActiveTab === "foreigner" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="text-purple-600" size={16} />
                      <span className="font-bold text-purple-900 text-xs">Hồ sơ Cư trú & Thị thực Người nước ngoài (Bộ Công an & QLXNC)</span>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">Luật 47/2014 & TT 53/2016</span>
                  </div>

                  {/* Nationality & Country Flag */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Quốc tịch (Nationality) *</label>
                      <div className="flex gap-2">
                        <select
                          name="nationality"
                          value={formData.nationality}
                          onChange={(e) => {
                            handleInputChange(e);
                            setFormData(prev => ({
                              ...prev,
                              nationality: e.target.value,
                              ethnicity: e.target.value
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-purple-500 font-medium"
                        >
                          <option value="Hàn Quốc">🇰🇷 Hàn Quốc (Republic of Korea)</option>
                          <option value="Vương quốc Anh">🇬🇧 Vương quốc Anh (United Kingdom)</option>
                          <option value="Nhật Bản">🇯🇵 Nhật Bản (Japan)</option>
                          <option value="Hoa Kỳ">🇺🇸 Hoa Kỳ (United States)</option>
                          <option value="Úc">🇦🇺 Úc (Australia)</option>
                          <option value="Đài Loan">🇹🇼 Đài Loan (Taiwan)</option>
                          <option value="Trung Quốc">🇨🇳 Trung Quốc (China)</option>
                          <option value="Pháp">🇫🇷 Pháp (France)</option>
                          <option value="Đức">🇩🇪 Đức (Germany)</option>
                          <option value="Singapore">🇸🇬 Singapore</option>
                          <option value="Canada">🇨🇦 Canada</option>
                          <option value="Nga">🇷🇺 Nga (Russia)</option>
                          <option value="Việt Nam">🇻🇳 Việt Nam</option>
                          <option value="Khác">🌍 Quốc gia khác</option>
                        </select>
                        <span className="w-10 h-9 flex items-center justify-center bg-slate-100 rounded-lg text-lg border border-slate-200 shrink-0">
                          {getCountryFlag(formData.nationality)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Số Hộ chiếu (Passport No.) *</label>
                      <input 
                        type="text" 
                        name="passportNumber"
                        placeholder="M89210452, UK55981240..."
                        value={formData.passportNumber}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            passportNumber: e.target.value,
                            cccd: e.target.value
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Passport Expiry & Issuing Authority */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Ngày hết hạn Hộ chiếu</label>
                      <input 
                        type="text" 
                        name="passportExpiryDate"
                        placeholder="DD/MM/YYYY"
                        value={formData.passportExpiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Cơ quan cấp Hộ chiếu</label>
                      <input 
                        type="text" 
                        name="idIssuePlace"
                        placeholder="Cục Quản lý Xuất nhập cảnh, Bộ Ngoại giao..."
                        value={formData.idIssuePlace}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Visa / Card Type & Number */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Loại thị thực / Thẻ cư trú</label>
                      <select 
                        name="visaOrCardType"
                        value={formData.visaOrCardType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-purple-500 font-semibold"
                      >
                        <option value="Thẻ tạm trú (TRC)">Thẻ tạm trú (TRC - Temporary Residence Card)</option>
                        <option value="Thẻ thường trú (PRC)">Thẻ thường trú (PRC - Permanent Residence Card)</option>
                        <option value="Thị thực LĐ">Thị thực Lao động (Visa LĐ)</option>
                        <option value="Thị thực ĐT">Thị thực Đầu tư (Visa ĐT)</option>
                        <option value="Thị thực TT">Thị thực Thăm thân (Visa TT)</option>
                        <option value="Miễn thị thực / E-Visa">Miễn thị thực / E-Visa</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Số thẻ / Số thị thực</label>
                      <input 
                        type="text" 
                        name="visaOrCardNumber"
                        placeholder="TRC-KR-2023-0941..."
                        value={formData.visaOrCardNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Validity range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Thời hạn từ ngày</label>
                      <input 
                        type="text" 
                        name="visaValidFrom"
                        placeholder="DD/MM/YYYY"
                        value={formData.visaValidFrom}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Thời hạn đến ngày (Hạn cư trú)</label>
                      <input 
                        type="text" 
                        name="visaValidUntil"
                        placeholder="DD/MM/YYYY"
                        value={formData.visaValidUntil}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-bold"
                      />
                    </div>
                  </div>

                  {/* Police Temporary Registration */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Mã khai báo CA Phường</label>
                      <input 
                        type="text" 
                        name="temporaryRegistrationCode"
                        placeholder="KBTT-AP-2024-xxxx"
                        value={formData.temporaryRegistrationCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Ngày khai báo</label>
                      <input 
                        type="text" 
                        name="temporaryRegistrationDate"
                        placeholder="DD/MM/YYYY"
                        value={formData.temporaryRegistrationDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Tình trạng khai báo</label>
                      <select 
                        name="temporaryRegistrationStatus"
                        value={formData.temporaryRegistrationStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Đã khai báo">Đã khai báo (Hợp pháp)</option>
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Chưa khai báo">Chưa khai báo</option>
                        <option value="Hết hạn">Hết hạn</option>
                      </select>
                    </div>
                  </div>

                  {/* Work permit & Sponsoring org */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Số Giấy phép LĐ (GPLĐ) / Miễn</label>
                      <input 
                        type="text" 
                        name="workPermitNumber"
                        placeholder="GPLĐ-2023-xxxx/SLĐTBXH"
                        value={formData.workPermitNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Cơ quan / Doanh nghiệp bảo lãnh</label>
                      <input 
                        type="text" 
                        name="sponsoringOrganization"
                        placeholder="Công ty TNHH..., Trường Quốc tế..."
                        value={formData.sponsoringOrganization}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Landlord Contact */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Chủ nhà / Cơ sở lưu trú cho thuê (Họ tên & SĐT)</label>
                    <input 
                      type="text" 
                      name="landlordContact"
                      placeholder="Nguyễn Văn A (Chủ nhà 42/3 LĐC) - 0903xxxxxx"
                      value={formData.landlordContact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Form Navigation & Submit */}
              <div className="pt-4 border-t border-slate-150 flex items-center justify-between">
                <div className="flex gap-2">
                  {formActiveTab !== "basic" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formActiveTab === "foreigner") setFormActiveTab("policy");
                        else if (formActiveTab === "policy") setFormActiveTab("career");
                        else if (formActiveTab === "career") setFormActiveTab("residence");
                        else if (formActiveTab === "residence") setFormActiveTab("basic");
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      Quay lại
                    </button>
                  )}
                  {formActiveTab !== (formData.isForeigner ? "foreigner" : "policy") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formActiveTab === "basic") setFormActiveTab("residence");
                        else if (formActiveTab === "residence") setFormActiveTab("career");
                        else if (formActiveTab === "career") setFormActiveTab("policy");
                        else if (formActiveTab === "policy" && formData.isForeigner) setFormActiveTab("foreigner");
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer font-semibold"
                    >
                      Tiếp theo
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowModal(false);
                      setIsEditMode(false);
                      setEditingResidentId(null);
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                  >
                    {isEditMode ? "Lưu thay đổi" : "Lưu vào Danh sách Cư dân"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORT EXCEL & RAW DATA PASTE */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={20} />
                <h3 className="font-bold text-sm sm:text-base">Tích hợp danh sách dân cư vào hệ thống</h3>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setParsedData([]);
                  setImportFileName("");
                  setPastedRawText("");
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Switcher: Upload File or Paste Raw Text */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setImportTab("file")}
                className={`flex-1 py-3 px-3 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  importTab === "file" 
                    ? "border-emerald-600 text-emerald-700 bg-white font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <UploadCloud size={15} /> Tải tệp Excel / CSV (.xlsx, .csv)
              </button>
              <button
                type="button"
                onClick={() => setImportTab("paste")}
                className={`flex-1 py-3 px-3 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  importTab === "paste" 
                    ? "border-emerald-600 text-emerald-700 bg-white font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileCheck size={15} /> Dán bảng dữ liệu trực tiếp (Copy & Paste)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {importTab === "file" ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] tracking-wide">
                          ⚡ TỐC ĐỘ CAO
                        </span>
                        <p className="font-bold text-slate-900 text-xs">Thuật toán phân tích thông minh Thường trú & Tạm trú:</p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Tự động nhận diện Cột H & J (Thường trú & Chỗ ở hiện tại), Cột G & J (Địa chỉ tạm trú & Thường trú gốc), Cha/Mẹ, Ngày đăng ký/Hết hạn.
                      </p>
                    </div>
                    <button 
                      onClick={downloadTemplate}
                      type="button"
                      className="flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Download size={13} /> Tải file mẫu (.xlsx)
                    </button>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                      isDragging ? "border-emerald-500 bg-emerald-500/5 scale-[0.99]" : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud size={42} className={`mb-2.5 transition-colors ${isDragging ? "text-emerald-500" : "text-slate-400"}`} />
                    {importFileName ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                          <CheckCircle size={15} /> Đã nạp: {importFileName}
                        </p>
                        <p className="text-[11px] text-slate-400">Kéo thả tệp khác để thay thế</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">Kéo và thả tệp Excel tại đây</p>
                        <p className="text-[11px] text-slate-400">hoặc nhấp chuột để chọn tệp từ máy tính (.xlsx, .xls, .csv)</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* PASTE TEXT TAB */
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800">Hướng dẫn dán bảng dữ liệu dân cư:</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bạn có thể copy trực tiếp các ô từ Excel/Google Sheets hoặc văn bản cách nhau bởi dấu Tab/Dấu phẩy và dán vào bên dưới.
                    </p>
                  </div>

                  <textarea
                    id="raw-pasted-residents-textarea"
                    name="rawPastedResidents"
                    rows={6}
                    value={pastedRawText}
                    onChange={(e) => setPastedRawText(e.target.value)}
                    placeholder={"Họ và Tên\tSố CCCD\tGiới tính\tNgày sinh\tDiện cư trú\tĐịa chỉ\tMã hộ\nNguyễn Văn An\t079090001111\tNam\t10/05/1990\tThường trú\t42/3 Lương Định Của\tHK-301"}
                    className="w-full p-3 font-mono text-[11px] border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/30"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                    >
                      <CheckCircle size={14} /> Phân tích dữ liệu vừa dán
                    </button>
                  </div>
                </div>
              )}

              {/* Parsed Data Preview Table */}
              {parsedData.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-600" />
                      Kết quả phân tích ({parsedData.length} nhân khẩu):
                    </h4>
                    <span className="text-[10px] text-slate-400">Dòng màu đỏ có thông tin thiếu hoặc sai CCCD</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="sticky top-0 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2 px-3">Họ và Tên</th>
                          <th className="py-2 px-3">Số CCCD</th>
                          <th className="py-2 px-3">Ngày sinh</th>
                          <th className="py-2 px-3">Quê quán</th>
                          <th className="py-2 px-3">Diện cư trú</th>
                          <th className="py-2 px-3">Mã hộ</th>
                          <th className="py-2 px-3 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.map((row) => (
                          <tr key={row.id} className={row.isValid ? "hover:bg-slate-50" : "bg-rose-50/50"}>
                            <td className="py-2 px-3 font-bold text-slate-800">
                              {row.fullName || <span className="text-rose-600 italic">Thiếu họ tên *</span>}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {row.cccd || <span className="text-rose-600 italic">Thiếu CCCD *</span>}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{row.birthDate}</td>
                            <td className="py-2 px-3 text-slate-600">{row.hometown || "-"}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {row.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 font-mono">{row.householdId}</td>
                            <td className="py-2 px-3 text-right">
                              {row.isValid ? (
                                <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                                  <Check size={12} /> Hợp lệ
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold flex items-center justify-end gap-1" title="CCCD tối thiểu 9 số">
                                  <AlertCircle size={12} /> Cần sửa
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center shrink-0">
              <div className="flex items-center gap-2 text-xs">
                {isSupabaseConfigured ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <Database size={13} className="text-emerald-600" />
                    Supabase PostgreSQL: Đã kết nối
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <AlertTriangle size={13} className="text-amber-600" />
                    Lưu trữ cục bộ (Offline)
                  </span>
                )}
                {isUploadingToDb && (
                  <span className="text-emerald-600 font-medium animate-pulse">
                    {uploadStatusMsg}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button 
                  type="button" 
                  disabled={isUploadingToDb}
                  onClick={() => {
                    setShowImportModal(false);
                    setParsedData([]);
                    setImportFileName("");
                    setPastedRawText("");
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-semibold disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  disabled={isUploadingToDb || parsedData.filter(r => r.isValid).length === 0}
                  onClick={handleConfirmImport}
                  className={`px-4 py-2 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isUploadingToDb || parsedData.filter(r => r.isValid).length === 0 
                      ? "bg-slate-400 cursor-not-allowed opacity-80" 
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer active:scale-95"
                  }`}
                >
                  {isUploadingToDb ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>{uploadStatusMsg || "Đang ghi vào Supabase..."}</span>
                    </>
                  ) : (
                    <>
                      <Database size={15} />
                      <span>Tích hợp vào Database ({parsedData.filter(r => r.isValid).length} hồ sơ hợp lệ)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL POLICE CT07 CERTIFICATE MODAL */}
      {showCT07Modal && residentForCT07 && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="text-emerald-400" size={18} />
                <h3 className="font-bold text-sm">Xem & In Giấy Xác Nhận Thông Tin Cư Trú (Mẫu CT07)</h3>
              </div>
              <button 
                onClick={() => setShowCT07Modal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* CT07 Sheet Preview */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-900 font-serif leading-relaxed bg-white">
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                <p className="text-[11px] font-semibold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-24 h-0.5 bg-slate-400 mx-auto mt-1"></div>
                <div className="pt-2 text-[10px] text-slate-500 font-sans">
                  Mẫu CT07 ban hành kèm theo Thông tư số 56/2021/TT-BCA ngày 15/5/2021 của Bộ Công an
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase tracking-tight text-slate-900">
                  XÁC NHẬN THÔNG TIN VỀ CƯ TRÚ
                </h2>
                <p className="text-xs text-slate-500 font-sans italic">Kính gửi: Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh</p>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <p><strong>1. Họ, chữ đệm và tên khai sinh:</strong> <span className="uppercase font-bold text-emerald-800">{residentForCT07.fullName}</span></p>
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>2. Ngày, tháng, năm sinh:</strong> {residentForCT07.birthDate}</p>
                  <p><strong>3. Giới tính:</strong> {residentForCT07.gender}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>4. Số định danh cá nhân / CCCD:</strong> <span className="font-mono font-bold">{residentForCT07.cccd}</span></p>
                  <p><strong>5. Dân tộc:</strong> {residentForCT07.ethnicity || "Kinh"} - <strong>Tôn giáo:</strong> {residentForCT07.religion || "Không"}</p>
                </div>
                <p><strong>6. Quốc tịch:</strong> {residentForCT07.nationality || "Việt Nam"}</p>
                <p><strong>7. Quê quán:</strong> {residentForCT07.hometown || "Chưa cập nhật"}</p>
                <p><strong>8. Nơi thường trú:</strong> {residentForCT07.permanentAddress || residentForCT07.address}</p>
                <p><strong>9. Nơi ở hiện tại:</strong> {residentForCT07.temporaryAddress || residentForCT07.address}</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>10. Mã số hộ khẩu:</strong> <span className="font-mono font-semibold">{residentForCT07.householdId}</span></p>
                  <p><strong>11. Quan hệ với chủ hộ:</strong> {residentForCT07.relationToOwner}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>12. Trình độ học vấn:</strong> {residentForCT07.education || "12/12"}</p>
                  <p><strong>13. Nghề nghiệp:</strong> {residentForCT07.occupation || "Tự do"}</p>
                </div>
                {residentForCT07.healthInsuranceNumber && (
                  <p><strong>14. Mã số BHYT / Y tế:</strong> <span className="font-mono">{residentForCT07.healthInsuranceNumber}</span></p>
                )}
                {residentForCT07.policyGroup && residentForCT07.policyGroup !== "Bình thường" && (
                  <p><strong>15. Diện chính sách / Đoàn thể:</strong> <span className="font-semibold text-rose-700">{residentForCT07.policyGroup}</span></p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-start text-xs font-sans">
                <div className="text-center space-y-1">
                  <p className="font-bold">NGƯỜI YÊU CẦU XÁC NHẬN</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                  <p className="font-semibold">{residentForCT07.fullName}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="italic text-[11px]">TP. Thủ Đức, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                  <p className="font-bold text-slate-900">CÔNG AN PHƯỜNG AN PHÚ</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký, đóng dấu)</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="px-2 py-1 border border-red-400 text-red-600 rounded text-[9px] font-bold uppercase rotate-[-6deg]">
                      ĐÃ XÁC NHẬN ĐIỆN TỬ
                    </span>
                  </div>
                  <p className="font-semibold">Trung tá Lê Văn Sơn</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowCT07Modal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Printer size={15} /> In Giấy Xác Nhận (Print)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: OFFICIAL POLICE NA17 DECLARATION FOR FOREIGN RESIDENTS */}
      {showNA17Modal && residentForNA17 && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-purple-950 text-white p-4 flex justify-between items-center shrink-0 border-b border-purple-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-purple-800/80 rounded-lg text-purple-200">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Phiếu Khai Báo Tạm Trú Cho Người Nước Ngoài (Mẫu NA17)
                  </h3>
                  <p className="text-[11px] text-purple-300">
                    Thông tư 53/2016/TT-BCA & Luật số 47/2014/QH13 • Bộ Công an & QLXNC
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowNA17Modal(false)}
                className="text-purple-300 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* NA17 Sheet Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-900 font-serif leading-relaxed bg-white">
              {/* Quốc hiệu & Tiêu ngữ */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / SOCIALIST REPUBLIC OF VIETNAM
                </h4>
                <p className="text-xs font-semibold text-slate-700">
                  Độc lập - Tự do - Hạnh phúc / Independence - Freedom - Happiness
                </p>
                <div className="w-28 h-0.5 bg-slate-400 mx-auto mt-1"></div>
                <div className="pt-2 text-[10px] text-slate-500 font-sans">
                  Mẫu NA17 ban hành kèm theo Thông tư số 53/2016/TT-BCA ngày 28/12/2016 của Bộ Công an
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                  PHIẾU KHAI BÁO TẠM TRÚ
                </h2>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 font-sans">
                  TEMPORARY RESIDENCE DECLARATION FOR FOREIGNERS
                </h3>
                <p className="text-xs text-slate-500 font-sans italic pt-1">
                  Kính gửi (To): Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh
                </p>
              </div>

              {/* Declaration Fields */}
              <div className="space-y-2.5 text-xs font-sans text-slate-800">
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-purple-900 font-bold block">
                      1. Họ và tên (chữ in hoa) / Full name (in capital letters):
                    </span>
                    <span className="text-sm font-black text-purple-950 uppercase tracking-wide">
                      {residentForNA17.fullName}
                    </span>
                  </div>
                  <span className="text-xl" title={`Quốc tịch: ${residentForNA17.nationality}`}>
                    {getCountryFlag(residentForNA17.nationality)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <strong>2. Giới tính / Sex:</strong> {residentForNA17.gender} ({residentForNA17.gender === "Nam" ? "Male" : "Female"})
                  </div>
                  <div>
                    <strong>3. Ngày sinh / Date of birth:</strong> {residentForNA17.birthDate}
                  </div>
                  <div>
                    <strong>4. Quốc tịch / Nationality:</strong> {residentForNA17.nationality || "Nước ngoài"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <strong>5. Hộ chiếu số / Passport No.:</strong>{" "}
                    <span className="font-mono font-bold text-slate-900">{residentForNA17.passportNumber || residentForNA17.cccd}</span>
                  </div>
                  <div>
                    <strong>Hạn đến / Valid until:</strong>{" "}
                    <span className="font-mono">{residentForNA17.passportExpiryDate || "15/08/2028"}</span>
                  </div>
                  <div>
                    <strong>Cơ quan cấp / Authority:</strong> {residentForNA17.idIssuePlace || "Cục Quản lý Xuất nhập cảnh"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <strong>6. Nghề nghiệp / Occupation:</strong> {residentForNA17.occupation || "Chuyên gia / Lao động nước ngoài"}
                  </div>
                  <div>
                    <strong>Cơ quan / Doanh nghiệp bảo lãnh:</strong> {residentForNA17.sponsoringOrganization || residentForNA17.workplace || "Tự do"}
                  </div>
                </div>

                {residentForNA17.workPermitNumber && (
                  <div className="text-xs">
                    <strong>Số Giấy phép lao động (GPLĐ) / Work permit No.:</strong>{" "}
                    <span className="font-mono text-blue-700">{residentForNA17.workPermitNumber}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>7. Thị thực hoặc Thẻ cư trú / Visa or Residence Card:</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                      {residentForNA17.visaOrCardType || "Thẻ tạm trú (TRC)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <strong>Số thẻ / Số thị thực:</strong>{" "}
                      <span className="font-mono font-semibold">{residentForNA17.visaOrCardNumber || "TRC-KR-2023-0941"}</span>
                    </div>
                    <div>
                      <strong>Thời hạn cư trú / Validity:</strong>{" "}
                      <span className="font-mono">Từ {residentForNA17.visaValidFrom || "01/01/2023"} đến {residentForNA17.visaValidUntil || "31/12/2026"}</span>
                    </div>
                  </div>
                  {(() => {
                    const exp = getVisaExpiryStatus(residentForNA17.visaValidUntil);
                    return (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                        <span className="text-slate-500">Tình trạng thời hạn:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${exp.badgeClass}`}>
                          {exp.label}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1 pt-1">
                  <p>
                    <strong>8. Địa chỉ cơ sở lưu trú tại Việt Nam / Temporary residential address:</strong>{" "}
                    <span className="text-slate-900">{residentForNA17.temporaryAddress || residentForNA17.address || "42 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mã hộ gia đình liên kết: <span className="font-mono font-semibold text-slate-700">{residentForNA17.householdId || "HK-301"}</span> ({residentForNA17.relationToOwner || "Người thuê trọ"})
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <strong>9. Mã hồ sơ khai báo trực tuyến (Cổng DVC):</strong>{" "}
                    <span className="font-mono font-bold text-emerald-700">
                      {residentForNA17.temporaryRegistrationCode || "KBTT-AP-2024-ONLINE"}
                    </span>
                  </div>
                  <div>
                    <strong>Ngày khai báo:</strong>{" "}
                    <span>{residentForNA17.temporaryRegistrationDate || "15/01/2024"} ({residentForNA17.temporaryRegistrationStatus || "Đã khai báo"})</span>
                  </div>
                </div>

                <div className="pt-1">
                  <p>
                    <strong>10. Chủ cơ sở lưu trú / Người bảo lãnh (Host / Landlord):</strong>{" "}
                    <span>{residentForNA17.landlordContact || "Ban Điều hành Khu phố 3 - 0903123456"}</span>
                  </p>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs font-sans">
                <div className="space-y-1">
                  <p className="font-bold text-[11px]">NGƯỜI NƯỚC NGOÀI</p>
                  <p className="text-[10px] text-slate-400 italic">Foreigner (Sign & Full name)</p>
                  <div className="h-16"></div>
                  <p className="font-semibold text-slate-800 text-[11px]">{residentForNA17.fullName}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-[11px]">CHỦ CƠ SỞ LƯU TRÚ</p>
                  <p className="text-[10px] text-slate-400 italic">Host / Landlord</p>
                  <div className="h-16"></div>
                  <p className="font-semibold text-slate-800 text-[11px]">
                    {residentForNA17.landlordContact ? residentForNA17.landlordContact.split("-")[0].trim() : "Chủ hộ"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="italic text-[10px] text-slate-500">
                    TP. Thủ Đức, {new Date().toLocaleDateString("vi-VN")}
                  </p>
                  <p className="font-bold text-[11px] text-slate-900">CÔNG AN PHƯỜNG AN PHÚ</p>
                  <p className="text-[10px] text-slate-400 italic">Xác nhận trực tuyến</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="px-2 py-1 border border-red-500 text-red-600 rounded text-[9px] font-bold uppercase rotate-[-4deg] bg-red-50/50">
                      ✓ ĐÃ TIẾP NHẬN ĐIỆN TỬ
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-[11px]">Trung tá Lê Văn Sơn</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowNA17Modal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-semibold"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadNA17Doc(residentForNA17)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg cursor-pointer text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} /> Tải Mẫu Word (.DOC)
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Printer size={15} /> In Phiếu Khai Báo (Print)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
