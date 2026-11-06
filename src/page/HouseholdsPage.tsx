import React, { useState, useMemo, useEffect } from "react";
import {
  Home,
  Users,
  Search,
  GitBranch,
  UserPlus,
  MapPin,
  ChevronRight,
  Plus,
  X,
  Trash2,
  AlertCircle,
  LayoutGrid,
  List,
  Edit3,
  Undo2,
  Sparkles,
  History,
  Navigation,
  ExternalLink,
  Check,
  Copy,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Compass,
  ArrowUpDown,
  Phone,
  BarChart3,
  FolderSync
} from "lucide-react";
import { Household, Resident, TargetGisItem, ActiveTab } from "../types";
import {
  decimalToDMS,
  parseCoordinates as parseGisCoords,
  generateDefaultCoordinatesForAddress,
  getGoogleMapsDirectionUrl
} from "../utils/gisUtils";
import * as XLSX from "xlsx";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Separator } from "../components/ui/separator";

// Sub-components
import HouseholdDashboard from "../components/household/HouseholdDashboard";
import HouseholdDuplicates from "../components/household/HouseholdDuplicates";
import HouseholdMemberProfile from "../components/household/HouseholdMemberProfile";
import HouseholdFamilyTree from "../components/household/HouseholdFamilyTree";
import HouseholdBusinesses from "../components/household/HouseholdBusinesses";
import HouseholdAutoRecognition from "../components/household/HouseholdAutoRecognition";
import { navigate, useCurrentPath, ROUTES } from "../routes";
import AddHouseholdPage from "./AddHouseholdPage";

export interface HouseholdsPageProps {
  households: Household[];
  residents: Resident[];
  currentUser: any;
  residentPermissions?: Record<string, boolean>;
  onAddHousehold?: (household: Household | Omit<Household, "id">) => void;
  onUpdateHouseholds?: React.Dispatch<React.SetStateAction<Household[]>> | ((households: Household[]) => void);
  onUpdateResidents?: React.Dispatch<React.SetStateAction<Resident[]>> | ((residents: Resident[]) => void);
  onNavigateToGis?: (item: TargetGisItem) => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

export default function HouseholdsPage({
  households = [],
  residents = [],
  currentUser,
  residentPermissions = {},
  onAddHousehold,
  onUpdateHouseholds,
  onUpdateResidents,
  onNavigateToGis,
  setActiveTab
}: HouseholdsPageProps) {
  // Routing Detection for Subpages
  const currentPath = useCurrentPath();

  const isAddHousehold =
    currentPath === "/add_household" ||
    currentPath === "/addhousehold" ||
    currentPath === "/dashboard/households/add" ||
    currentPath === "/dashboard/add_household" ||
    currentPath.endsWith("/add_household") ||
    currentPath.endsWith("/addhousehold") ||
    currentPath.endsWith("/households/add");

  // Navigation & Sub-views tabs
  const [activeTab, setActiveTabState] = useState<"list" | "recognition" | "dashboard" | "audit">("list");

  // Selected Household details tab
  const [detailTab, setDetailTab] = useState<"members" | "businesses" | "history">("members");

  // Core view states
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Tất cả" | "Thường trú" | "Tạm trú" | "Đã ghim GIS" | "Chưa ghim GIS">("Tất cả");
  const [showSoftDeleted, setShowSoftDeleted] = useState(false);

  // View switch: table or card
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showTreeDialog, setShowTreeDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showGisPinDialog, setShowGisPinDialog] = useState(false);

  // Profile View modal
  const [profileViewMember, setProfileViewMember] = useState<{ name: string; relation: string; cccd: string } | null>(null);

  // Live GPS coordinate parser state
  const [coordInput, setCoordInput] = useState("");
  const [parsedGPS, setParsedGPS] = useState<{ lat: number; lng: number; formatted: string } | null>(null);

  // GIS Coordinate Pinning state
  const [gisPinModalHousehold, setGisPinModalHousehold] = useState<Household | null>(null);
  const [gisPinInput, setGisPinInput] = useState("");

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Đã sao chép mã sổ: ${code}`, "info");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Creation form states
  const [newHCode, setNewHCode] = useState("");
  const [newHType, setNewHType] = useState<"Thường trú" | "Tạm trú">("Thường trú");
  const [newOwner, setNewOwner] = useState("");
  const [newOwnerCccd, setNewOwnerCccd] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [tempMembers, setTempMembers] = useState<{ name: string; relation: string; cccd: string; birthYear: number; phone?: string }[]>([]);

  // Member registration inside creation modal
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberCccd, setNewMemberCccd] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("Vợ");
  const [newMemberBirthYear, setNewMemberBirthYear] = useState<number | "">("");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  // Edit Household form states
  const [editAddress, setEditAddress] = useState("");
  const [editType, setEditType] = useState<"Thường trú" | "Tạm trú">("Thường trú");
  const [editOwner, setEditOwner] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Move member states
  const [moveTargetMember, setMoveTargetMember] = useState<{ name: string; cccd: string } | null>(null);
  const [moveTargetHCode, setMoveTargetHCode] = useState("");

  // Split household states
  const [splitSelectedCccds, setSplitSelectedCccds] = useState<string[]>([]);
  const [splitNewHCode, setSplitNewHCode] = useState("");
  const [splitNewOwner, setSplitNewOwner] = useState("");
  const [splitNewAddress, setSplitNewAddress] = useState("");
  const [splitNewCoordinates, setSplitNewCoordinates] = useState("");

  // Add Member into selected household
  const [addMemName, setAddMemName] = useState("");
  const [addMemCccd, setAddMemCccd] = useState("");
  const [addMemRelation, setAddMemRelation] = useState("Con trai");
  const [addMemBirthYear, setAddMemBirthYear] = useState<number | "">("");
  const [addMemPhone, setAddMemPhone] = useState("");

  // Responsive default layout: mobile uses cards
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);

  // Sync selected household if global list updates
  useEffect(() => {
    if (selectedHousehold) {
      const match = households.find((h) => h.id === selectedHousehold.id);
      if (match) {
        setSelectedHousehold(match);
      }
    }
  }, [households]);

  // Combined GPS parsing logic live
  const parseCoordinates = (input: string) => {
    if (!input) return null;
    const parts = input.split(",");
    if (parts.length === 2) {
      const p1 = parseFloat(parts[0].trim());
      const p2 = parseFloat(parts[1].trim());
      if (!isNaN(p1) && !isNaN(p2)) {
        let lat = p1;
        let lng = p2;
        if (p1 > 100 && p2 < 30) {
          lat = p2;
          lng = p1;
        }
        return { lat, lng, formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
      }
    }
    return null;
  };

  const handleCoordInputChange = (val: string) => {
    setCoordInput(val);
    const parsed = parseCoordinates(val);
    setParsedGPS(parsed);
  };

  // Helper update handlers
  const updateHouseholdsList = (newList: Household[]) => {
    if (onUpdateHouseholds) {
      if (typeof onUpdateHouseholds === "function") {
        (onUpdateHouseholds as any)(newList);
      }
    }
  };

  const updateResidentsList = (newList: Resident[]) => {
    if (onUpdateResidents) {
      if (typeof onUpdateResidents === "function") {
        (onUpdateResidents as any)(newList);
      }
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const active = households.filter((h) => !(h as any).deletedAt);
    const softDeleted = households.filter((h) => Boolean((h as any).deletedAt));
    const total = active.length;
    const thuongTru = active.filter((h) => (h.type || "Thường trú") === "Thường trú").length;
    const tamTru = active.filter((h) => h.type === "Tạm trú").length;
    const withGis = active.filter((h) => Boolean(h.coordinates && h.coordinates.trim().length > 0)).length;
    const totalMembersInHouseholds = active.reduce((acc, h) => acc + (h.members?.length || h.memberCount || 0), 0);
    const avgMembers = total > 0 ? (totalMembersInHouseholds / total).toFixed(1) : "0";

    return {
      total,
      softDeletedCount: softDeleted.length,
      thuongTru,
      thuongTruPct: total > 0 ? Math.round((thuongTru / total) * 100) : 0,
      tamTru,
      tamTruPct: total > 0 ? Math.round((tamTru / total) * 100) : 0,
      withGis,
      withGisPct: total > 0 ? Math.round((withGis / total) * 100) : 0,
      withoutGis: total - withGis,
      totalMembersInHouseholds,
      avgMembers
    };
  }, [households]);

  // Filter households by search, type, and soft-delete status
  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      const isDeleted = Boolean((h as any).deletedAt);
      if (showSoftDeleted !== isDeleted) return false;

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.ownerName.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.members.some((m) => m.name.toLowerCase().includes(q) || m.cccd.includes(q) || (m.phone && m.phone.includes(q)));

      let matchesType = true;
      if (typeFilter === "Thường trú") {
        matchesType = (h.type || "Thường trú") === "Thường trú";
      } else if (typeFilter === "Tạm trú") {
        matchesType = h.type === "Tạm trú";
      } else if (typeFilter === "Đã ghim GIS") {
        matchesType = Boolean(h.coordinates && h.coordinates.trim().length > 0);
      } else if (typeFilter === "Chưa ghim GIS") {
        matchesType = !h.coordinates || h.coordinates.trim().length === 0;
      }

      return matchesSearch && matchesType;
    });
  }, [households, searchTerm, typeFilter, showSoftDeleted]);

  // Paginated items
  const totalPages = Math.ceil(filteredHouseholds.length / itemsPerPage) || 1;
  const paginatedHouseholds = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHouseholds.slice(start, start + itemsPerPage);
  }, [filteredHouseholds, currentPage, itemsPerPage]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, showSoftDeleted, itemsPerPage]);

  // Handlers for Navigation to GIS
  const handleDirections = (h: Household) => {
    let coords = h.coordinates;
    if (!coords || !parseGisCoords(coords)) {
      const autoGeo = generateDefaultCoordinatesForAddress(h.address, h.code);
      coords = autoGeo.dms;
      const updated = households.map((item) => (item.id === h.id ? { ...item, coordinates: coords } : item));
      updateHouseholdsList(updated);
    }
    if (onNavigateToGis) {
      onNavigateToGis({
        id: h.id,
        type: "household",
        name: `Hộ ${h.ownerName} (${h.code})`,
        address: h.address,
        coordinates: coords,
        navigateRoute: true
      });
      showToast(`Đang chuyển hướng dẫn đường tới Hộ ${h.ownerName} (${h.code})...`, "info");
    }
  };

  const openPinModal = (h: Household) => {
    setGisPinModalHousehold(h);
    if (h.coordinates) {
      setGisPinInput(h.coordinates);
    } else {
      const auto = generateDefaultCoordinatesForAddress(h.address, h.code);
      setGisPinInput(auto.dms);
    }
    setShowGisPinDialog(true);
  };

  const handleSavePinCoordinates = (andNavigate: boolean = false) => {
    if (!gisPinModalHousehold) return;
    const finalCoord = gisPinInput.trim();
    if (!finalCoord) {
      showToast("Vui lòng nhập hoặc chọn tọa độ GIS!", "error");
      return;
    }

    const updated = households.map((h) => {
      if (h.id === gisPinModalHousehold.id) {
        return { ...h, coordinates: finalCoord };
      }
      return h;
    });

    updateHouseholdsList(updated);
    if (selectedHousehold && selectedHousehold.id === gisPinModalHousehold.id) {
      setSelectedHousehold({ ...selectedHousehold, coordinates: finalCoord });
    }

    const targetH = { ...gisPinModalHousehold, coordinates: finalCoord };
    setShowGisPinDialog(false);
    setGisPinModalHousehold(null);

    if (andNavigate && onNavigateToGis) {
      onNavigateToGis({
        id: targetH.id,
        type: "household",
        name: `Hộ ${targetH.ownerName} (${targetH.code})`,
        address: targetH.address,
        coordinates: finalCoord,
        navigateRoute: true
      });
      showToast(`Đã lưu và mở dẫn đường GIS Hộ ${targetH.ownerName}!`, "success");
    } else {
      showToast(`Đã đồng bộ tọa độ Hộ ${targetH.ownerName} (${finalCoord}) lên bản đồ GIS!`, "success");
    }
  };

  // Open & Close Detail
  const handleOpenDetailModal = (h: Household) => {
    setSelectedHousehold(h);
    setShowDetailDialog(true);
    setDetailTab("members");
  };

  // Add temp member to creation form
  const handleAddTempMember = () => {
    if (!newMemberName || !newMemberCccd || !newMemberBirthYear) {
      showToast("Vui lòng điền tên, CCCD và năm sinh thành viên!", "error");
      return;
    }
    setTempMembers([
      ...tempMembers,
      {
        name: newMemberName,
        relation: newMemberRelation,
        cccd: newMemberCccd,
        birthYear: Number(newMemberBirthYear),
        phone: newMemberPhone || undefined
      }
    ]);
    setNewMemberName("");
    setNewMemberCccd("");
    setNewMemberPhone("");
    setNewMemberBirthYear("");
    showToast(`Đã thêm tạm ${newMemberName} (${newMemberRelation})`, "info");
  };

  // Create Household
  const handleCreateHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHCode || !newOwner || !newAddress) {
      showToast("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", "error");
      return;
    }

    const primaryOwnerCccd = newOwnerCccd || `079${Math.floor(100000000 + Math.random() * 900000000)}`;
    const finalCoordinates = parsedGPS ? parsedGPS.formatted : coordInput;

    const newH: Household = {
      id: "H" + (households.length + 1).toString().padStart(3, "0"),
      code: newHCode.toUpperCase(),
      ownerName: newOwner,
      address: newAddress,
      type: newHType,
      memberCount: tempMembers.length + 1,
      coordinates: finalCoordinates || undefined,
      members: [
        {
          name: newOwner,
          relation: "Chủ hộ",
          cccd: primaryOwnerCccd,
          birthYear: 1980,
          phone: newOwnerPhone || "09XXXXXXXX"
        },
        ...tempMembers
      ]
    };

    if (onAddHousehold) {
      onAddHousehold(newH);
    } else {
      updateHouseholdsList([newH, ...households]);
    }

    // Synchronize into residents roster
    const newResidents: Resident[] = [
      {
        id: "R" + Math.floor(1000 + Math.random() * 9000),
        fullName: newOwner,
        gender: "Nam",
        birthDate: "15/05/1980",
        cccd: primaryOwnerCccd,
        phone: newOwnerPhone || "09XXXXXXXX",
        status: newHType,
        occupation: "Kinh doanh tự do",
        address: newAddress,
        householdId: newHCode.toUpperCase(),
        relationToOwner: "Chủ hộ",
        joinDate: new Date().toLocaleDateString("vi-VN")
      },
      ...tempMembers.map((m) => ({
        id: "R" + Math.floor(1000 + Math.random() * 9000),
        fullName: m.name,
        gender: (m.relation === "Vợ" || m.relation === "Con gái" ? "Nữ" : "Nam") as "Nam" | "Nữ",
        birthDate: `01/01/${m.birthYear}`,
        cccd: m.cccd,
        phone: m.phone || "N/A",
        status: newHType,
        occupation: "Thành viên",
        address: newAddress,
        householdId: newHCode.toUpperCase(),
        relationToOwner: m.relation,
        joinDate: new Date().toLocaleDateString("vi-VN")
      }))
    ];

    updateResidentsList([...residents, ...newResidents]);

    // Reset Form
    setShowAddDialog(false);
    setNewHCode("");
    setNewOwner("");
    setNewOwnerCccd("");
    setNewOwnerPhone("");
    setNewAddress("");
    setCoordInput("");
    setParsedGPS(null);
    setTempMembers([]);

    showToast(`Đã lập Sổ Hộ Khẩu mới: ${newH.code} - ${newH.ownerName}`, "success");
  };

  // Edit Household
  const startEditHousehold = () => {
    if (!selectedHousehold) return;
    setEditAddress(selectedHousehold.address);
    setEditType(selectedHousehold.type || "Thường trú");
    setEditOwner(selectedHousehold.ownerName);
    setEditNotes((selectedHousehold as any).notes || "");
    setCoordInput(selectedHousehold.coordinates || "");
    setParsedGPS(parseCoordinates(selectedHousehold.coordinates || ""));
    setShowEditDialog(true);
  };

  const handleSaveEditHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHousehold) return;

    const finalCoordinates = parsedGPS ? parsedGPS.formatted : coordInput;

    const updated = households.map((h) => {
      if (h.id === selectedHousehold.id) {
        const logs = (h as any).auditHistory || [];
        const newLog = {
          date: new Date().toLocaleString("vi-VN"),
          action: "Cập nhật thông tin sổ hộ khẩu",
          actor: currentUser?.name || "Cán bộ Tư pháp"
        };

        return {
          ...h,
          address: editAddress,
          type: editType,
          ownerName: editOwner,
          coordinates: finalCoordinates,
          notes: editNotes,
          auditHistory: [newLog, ...logs]
        };
      }
      return h;
    });

    updateHouseholdsList(updated);
    setShowEditDialog(false);
    showToast(`Đã cập nhật thông tin Sổ ${selectedHousehold.code}!`, "success");
  };

  // Add Member into selected household
  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHousehold || !addMemName || !addMemCccd || !addMemBirthYear) {
      showToast("Vui lòng nhập tên, CCCD và năm sinh!", "error");
      return;
    }

    const newM = {
      name: addMemName,
      relation: addMemRelation,
      cccd: addMemCccd,
      birthYear: Number(addMemBirthYear),
      phone: addMemPhone || undefined
    };

    const updatedHouseholds = households.map((h) => {
      if (h.id === selectedHousehold.id) {
        const audit = (h as any).auditHistory || [];
        const newLog = {
          date: new Date().toLocaleString("vi-VN"),
          action: `Nhập khẩu thêm thành viên: ${addMemName}`,
          actor: currentUser?.name || "Cán bộ Tư pháp"
        };

        return {
          ...h,
          members: [...h.members, newM],
          memberCount: h.members.length + 1,
          auditHistory: [newLog, ...audit]
        };
      }
      return h;
    });

    const newR: Resident = {
      id: "R" + Math.floor(1000 + Math.random() * 9000),
      fullName: addMemName,
      gender: (addMemRelation === "Vợ" || addMemRelation === "Con gái" ? "Nữ" : "Nam") as "Nam" | "Nữ",
      birthDate: `01/01/${addMemBirthYear}`,
      cccd: addMemCccd,
      phone: addMemPhone || "N/A",
      status: selectedHousehold.type || "Thường trú",
      occupation: "Thành viên",
      address: selectedHousehold.address,
      householdId: selectedHousehold.code,
      relationToOwner: addMemRelation,
      joinDate: new Date().toLocaleDateString("vi-VN")
    };

    updateHouseholdsList(updatedHouseholds);
    updateResidentsList([...residents, newR]);

    setShowAddMemberDialog(false);
    setAddMemName("");
    setAddMemCccd("");
    setAddMemBirthYear("");
    setAddMemPhone("");

    showToast(`Đã thêm thành viên ${addMemName} vào sổ ${selectedHousehold.code}!`, "success");
  };

  // Remove individual member from current household book
  const handleRemoveMember = (cccd: string) => {
    if (!selectedHousehold) return;
    const member = selectedHousehold.members.find((m) => m.cccd === cccd);
    if (!member) return;

    if (member.relation === "Chủ hộ") {
      showToast("Không thể xóa chủ hộ khỏi sổ! Hãy chỉ định chủ hộ mới trước.", "error");
      return;
    }

    if (!confirm(`Bạn chắc chắn muốn xóa thành viên ${member.name} khỏi sổ ${selectedHousehold.code}?`)) return;

    const updatedMembers = selectedHousehold.members.filter((m) => m.cccd !== cccd);
    const updatedHouseholds = households.map((h) => {
      if (h.id === selectedHousehold.id) {
        return {
          ...h,
          members: updatedMembers,
          memberCount: updatedMembers.length
        };
      }
      return h;
    });

    const updatedResidents = residents.map((r) => {
      if (r.cccd === cccd) {
        return {
          ...r,
          householdId: "N/A",
          relationToOwner: "Tự do"
        };
      }
      return r;
    });

    updateHouseholdsList(updatedHouseholds);
    updateResidentsList(updatedResidents);
    showToast(`Đã xóa thành viên ${member.name} khỏi sổ ${selectedHousehold.code}.`, "info");
  };

  // Soft Delete Household Book
  const handleSoftDeleteHousehold = (id: string) => {
    const target = households.find((h) => h.id === id);
    if (!target) return;

    if (target.members.length > 0) {
      showToast("Không thể xóa sổ khi vẫn còn thành viên cư ngụ! Hãy tách hoặc chuyển thành viên trước.", "error");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa (Lưu trữ) Sổ hộ khẩu ${target.code}?`)) return;

    const updated = households.map((h) => {
      if (h.id === id) {
        return {
          ...h,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.name || "Cán bộ Tư pháp"
        };
      }
      return h;
    });

    updateHouseholdsList(updated);
    setShowDetailDialog(false);
    showToast(`Đã chuyển Sổ ${target.code} vào thùng rác lưu trữ.`, "info");
  };

  // Restore Soft Deleted Household Book
  const handleRestoreHousehold = (id: string) => {
    const updated = households.map((h) => {
      if (h.id === id) {
        const copy = { ...h };
        delete (copy as any).deletedAt;
        delete (copy as any).deletedBy;
        return copy;
      }
      return h;
    });

    updateHouseholdsList(updated);
    setShowSoftDeleted(false);
    setShowDetailDialog(false);
    showToast("Khôi phục sổ hộ khẩu thành công!", "success");
  };

  // Move member (Chuyển hộ)
  const startMoveMember = (name: string, cccd: string) => {
    setMoveTargetMember({ name, cccd });
    setMoveTargetHCode(households.find((h) => h.id !== selectedHousehold?.id)?.code || "");
    setShowMoveDialog(true);
  };

  const handlePerformMoveMember = () => {
    if (!selectedHousehold || !moveTargetMember || !moveTargetHCode) return;

    const targetH = households.find((h) => h.code === moveTargetHCode);
    if (!targetH) {
      showToast("Sổ hộ khẩu đích không tồn tại!", "error");
      return;
    }

    const memberToMove = selectedHousehold.members.find((m) => m.cccd === moveTargetMember.cccd);
    if (!memberToMove) return;

    const updatedSourceMembers = selectedHousehold.members.filter((m) => m.cccd !== moveTargetMember.cccd);
    const updatedTargetMembers = [
      ...targetH.members,
      {
        ...memberToMove,
        relation: "Thành viên mới chuyển đến"
      }
    ];

    const updatedHouseholds = households.map((h) => {
      if (h.id === selectedHousehold.id) {
        return {
          ...h,
          members: updatedSourceMembers,
          memberCount: updatedSourceMembers.length
        };
      }
      if (h.id === targetH.id) {
        return {
          ...h,
          members: updatedTargetMembers,
          memberCount: updatedTargetMembers.length
        };
      }
      return h;
    });

    const updatedResidents = residents.map((r) => {
      if (r.cccd === moveTargetMember.cccd) {
        return {
          ...r,
          householdId: targetH.code,
          address: targetH.address,
          relationToOwner: "Thành viên mới chuyển đến"
        };
      }
      return r;
    });

    updateHouseholdsList(updatedHouseholds);
    updateResidentsList(updatedResidents);
    setShowMoveDialog(false);
    showToast(`Đã chuyển nhân khẩu ${moveTargetMember.name} sang Sổ ${targetH.code}!`, "success");
  };

  // Split household (Tách hộ)
  const startSplitHousehold = () => {
    setSplitSelectedCccds([]);
    setSplitNewHCode(`HK-${Math.floor(300 + Math.random() * 100)}`);
    setSplitNewAddress(selectedHousehold?.address || "");
    setSplitNewCoordinates(selectedHousehold?.coordinates || "");
    setShowSplitDialog(true);
  };

  const handlePerformSplitHousehold = () => {
    if (!selectedHousehold || splitSelectedCccds.length === 0 || !splitNewHCode || !splitNewOwner) {
      showToast("Vui lòng chọn thành viên tách và nhập mã sổ mới + chủ hộ mới!", "error");
      return;
    }

    const membersToSplit = selectedHousehold.members.filter((m) => splitSelectedCccds.includes(m.cccd));
    const newHMembers = membersToSplit.map((m) => ({
      ...m,
      relation: m.cccd === splitNewOwner ? "Chủ hộ" : "Thành viên tách hộ"
    }));

    const newH: Household = {
      id: "H" + (households.length + 1).toString().padStart(3, "0"),
      code: splitNewHCode.toUpperCase(),
      ownerName: selectedHousehold.members.find((m) => m.cccd === splitNewOwner)?.name || "Chưa xác định",
      address: splitNewAddress,
      type: selectedHousehold.type || "Thường trú",
      memberCount: newHMembers.length,
      coordinates: splitNewCoordinates || undefined,
      members: newHMembers
    };

    const updatedOriginalMembers = selectedHousehold.members.filter((m) => !splitSelectedCccds.includes(m.cccd));
    const updatedHouseholds = households.map((h) => {
      if (h.id === selectedHousehold.id) {
        return {
          ...h,
          members: updatedOriginalMembers,
          memberCount: updatedOriginalMembers.length
        };
      }
      return h;
    });

    updateHouseholdsList([...updatedHouseholds, newH]);

    const updatedResidents = residents.map((r) => {
      if (splitSelectedCccds.includes(r.cccd)) {
        return {
          ...r,
          householdId: splitNewHCode.toUpperCase(),
          address: splitNewAddress,
          relationToOwner: r.cccd === splitNewOwner ? "Chủ hộ" : "Thành viên tách hộ"
        };
      }
      return r;
    });

    updateResidentsList(updatedResidents);
    setShowSplitDialog(false);
    showToast(`Tách hộ tịch thành công! Sổ mới ${splitNewHCode.toUpperCase()} đã được tạo.`, "success");
  };

  const toggleSelectSplitMember = (cccd: string) => {
    if (splitSelectedCccds.includes(cccd)) {
      setSplitSelectedCccds(splitSelectedCccds.filter((c) => c !== cccd));
      if (splitNewOwner === cccd) setSplitNewOwner("");
    } else {
      setSplitSelectedCccds([...splitSelectedCccds, cccd]);
      if (!splitNewOwner) setSplitNewOwner(cccd);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredHouseholds.length === 0) {
      showToast("Không có dữ liệu sổ hộ khẩu để xuất Excel!", "error");
      return;
    }

    const dataRows = filteredHouseholds.map((h, index) => {
      const memberListStr = h.members.map((m) => `${m.name} (${m.relation} - ${m.birthYear})`).join("; ");

      return {
        "STT": index + 1,
        "Mã Sổ": h.code,
        "Chủ Hộ": h.ownerName,
        "Loại Cư Trú": h.type || "Thường trú",
        "Số Nhân Khẩu": h.members.length || h.memberCount || 0,
        "Địa Chỉ Cư Trú": h.address,
        "Tọa Độ GIS (WGS84)": h.coordinates || "Chưa ghim",
        "Danh Sách Thành Viên": memberListStr,
        "Ghi Chú": (h as any).notes || ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 45 },
      { wch: 25 },
      { wch: 55 },
      { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "So_Ho_Khau_KP3");
    const fileName = `So_Ho_Khau_KP3_AnPhu_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    showToast(`Đã xuất file Excel: ${fileName} (${filteredHouseholds.length} hộ)`, "success");
  };

  // Permission Denied Check
  if (currentUser?.role === "nguoidan" && !residentPermissions?.households) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full border-border shadow-md rounded-2xl overflow-hidden text-center p-8 space-y-5 bg-card">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldAlert size={34} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Không có quyền tra cứu Sổ Hộ Khẩu
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Theo quy định bảo vệ an toàn thông tin cá nhân và Nghị định 13/2023/NĐ-CP, vai trò Cư dân không được phép
              tra cứu thông tin nhân khẩu của các hộ gia đình khác. Chức năng này chỉ dành riêng cho Cán bộ Quản lý
              Ban Điều Hành Khu Phố 3.
            </p>
          </div>
          <Button
            variant="success"
            onClick={() => setActiveTab && setActiveTab("dashboard")}
            className="w-full font-bold shadow-xs cursor-pointer"
          >
            Quay về Cổng Dịch Vụ Cư Dân
          </Button>
        </Card>
      </div>
    );
  }

  // Subpage Route Rendering: Add Household Page
  if (isAddHousehold) {
    return (
      <AddHouseholdPage
        households={households}
        residents={residents}
        currentUser={currentUser}
        onAdd={(newH) => {
          if (onAddHousehold) {
            onAddHousehold(newH);
          } else if (onUpdateHouseholds) {
            if (typeof onUpdateHouseholds === "function") {
              (onUpdateHouseholds as any)((prev: Household[]) => [newH, ...prev]);
            }
          }
          navigate(ROUTES.DASHBOARD_HOUSEHOLDS);
        }}
        onUpdateHouseholds={onUpdateHouseholds}
        onUpdateResidents={onUpdateResidents}
        onBack={() => {
          navigate(ROUTES.DASHBOARD_HOUSEHOLDS);
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
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
                Sổ Hộ Khẩu Điện Tử Quốc Gia
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground border-slate-200">
                Khu phố 3, Phường An Phú, TP. Hồ Chí Minh
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono font-semibold">
                {stats.total.toLocaleString("vi-VN")} Hộ ({residents.length.toLocaleString("vi-VN")} nhân khẩu)
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sổ Quản Lý Hộ Gia Đình & Địa Bàn Dân Cư
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Hệ thống theo dõi sổ hộ khẩu điện tử, tự động phân tích cấu trúc gia đình, đồng bộ tọa độ GIS WGS-84,
              liên kết hộ kinh doanh nhà trọ và rà soát biến động cư trú thực tế.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-2 font-medium shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Xuất Excel ({filteredHouseholds.length})</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTabState("recognition")}
              className="gap-2 font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50/70 shadow-2xs cursor-pointer"
              title="Quét dữ liệu dân cư để tự động nhận diện chủ hộ và thành viên"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Tự Nhận Diện Hộ</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTabState("dashboard")}
              className="gap-2 font-medium text-indigo-700 border-indigo-200 hover:bg-indigo-50/70 shadow-2xs cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Thống Kê Thẻ</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(ROUTES.DASHBOARD_ADD_HOUSEHOLD)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
              title="Chuyển sang trang Lập Sổ Hộ Khẩu Mới (/dashboard/households/add)"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lập Sổ Mới</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Households */}
        <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng Hộ Gia Đình</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Home size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-slate-900">{stats.total}</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-medium">sổ</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Hoạt động: {stats.total}</span>
            {stats.softDeletedCount > 0 && (
              <span className="text-amber-600 font-medium">Thùng rác: {stats.softDeletedCount}</span>
            )}
          </div>
        </Card>

        {/* Card 2: Thường Trú */}
        <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hộ Thường Trú</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-slate-900">{stats.thuongTru}</span>
            <span className="text-xs text-blue-600 font-bold ml-2">({stats.thuongTruPct}%)</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            KT1 & KT2 thường trú gốc KP3
          </div>
        </Card>

        {/* Card 3: Tạm Trú */}
        <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hộ Tạm Trú</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-slate-900">{stats.tamTru}</span>
            <span className="text-xs text-amber-600 font-bold ml-2">({stats.tamTruPct}%)</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            KT3 & Nhà trọ lưu trú tạm
          </div>
        </Card>

        {/* Card 4: GIS Coordinates */}
        <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tọa Độ GIS</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-slate-900">{stats.withGis}</span>
            <span className="text-xs text-indigo-600 font-bold ml-2">({stats.withGisPct}%)</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Đã ghim số</span>
            {stats.withoutGis > 0 && <span className="text-amber-600">Còn {stats.withoutGis} chưa ghim</span>}
          </div>
        </Card>

        {/* Card 5: Quy mô nhân khẩu */}
        <Card className="border-border bg-white shadow-2xs rounded-xl p-4 transition-all hover:shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quy Mô Nhân Khẩu</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight text-slate-900">{stats.avgMembers}</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-medium">người/hộ</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {stats.totalMembersInHouseholds.toLocaleString("vi-VN")} thành viên đã ghép hộ
          </div>
        </Card>
      </div>

      {/* Main Module Tabs (shadcn UI Tabs) */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTabState(val as any)} className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="list" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
              <Home size={14} /> Sổ Hộ Khẩu ({filteredHouseholds.length})
            </TabsTrigger>
            <TabsTrigger value="recognition" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
              <Sparkles size={14} className="text-emerald-600" /> Tự Nhận Diện Hộ
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
              <BarChart3 size={14} className="text-indigo-600" /> Thống Kê Thẻ
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
              <FolderSync size={14} className="text-amber-600" /> Trùng Lặp & Gộp Sổ
            </TabsTrigger>
          </TabsList>
        </div>

        {/* SUBVIEW 1: RECOGNITION */}
        <TabsContent value="recognition" className="m-0 focus-visible:outline-none">
          <HouseholdAutoRecognition
            households={households}
            residents={residents}
            onUpdateHouseholds={updateHouseholdsList}
            onUpdateResidents={updateResidentsList}
            onSelectHousehold={(h) => {
              setSelectedHousehold(h);
              setActiveTabState("list");
              setShowDetailDialog(true);
            }}
          />
        </TabsContent>

        {/* SUBVIEW 2: DASHBOARD STATS */}
        <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
          <HouseholdDashboard households={households} residents={residents} />
        </TabsContent>

        {/* SUBVIEW 3: AUDIT DUPLICATES */}
        <TabsContent value="audit" className="m-0 focus-visible:outline-none">
          <HouseholdDuplicates
            households={households}
            residents={residents}
            onUpdateHouseholds={updateHouseholdsList}
            onUpdateResidents={updateResidentsList}
          />
        </TabsContent>

        {/* SUBVIEW 4: MAIN HOUSEHOLDS LIST & CARD VIEW */}
        <TabsContent value="list" className="m-0 space-y-4 focus-visible:outline-none">
          {/* Toolbar: Search, Filters, View Modes */}
          <Card className="border-border bg-white shadow-2xs rounded-xl p-3.5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Tìm theo chủ hộ, mã sổ (HK-XXX), địa chỉ, số CCCD thành viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 text-xs h-9 bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter Pills */}
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 gap-0.5">
                  {(["Tất cả", "Thường trú", "Tạm trú", "Đã ghim GIS", "Chưa ghim GIS"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTypeFilter(filter)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        typeFilter === filter
                          ? "bg-white text-slate-900 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Soft Delete Trash Toggle */}
                <Button
                  variant={showSoftDeleted ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setShowSoftDeleted(!showSoftDeleted)}
                  className="gap-1.5 h-8 text-xs font-medium cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>{showSoftDeleted ? "Thùng rác Sổ" : "Xem đã xóa"}</span>
                </Button>

                {/* View Mode Toggle: Table or Card Grid */}
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      viewMode === "table" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Xem dạng Bảng dữ liệu"
                  >
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      viewMode === "card" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Xem dạng Thẻ lưới"
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* TABLE VIEW */}
          {viewMode === "table" ? (
            <Card className="border-border bg-white shadow-2xs rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {showSoftDeleted ? "Sổ Hộ Khẩu Trong Thùng Rác" : "Danh Sách Sổ Hộ Khẩu Chính Thống"}
                  </span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {filteredHouseholds.length} kết quả
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-slate-200 rounded px-2 py-1 text-xs bg-white cursor-pointer font-medium"
                  >
                    <option value={10}>10</option>
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>hộ/trang</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="w-[120px] font-bold text-slate-700">Mã Sổ</TableHead>
                    <TableHead className="w-[200px] font-bold text-slate-700">Chủ Hộ & Nhân Khẩu</TableHead>
                    <TableHead className="w-[110px] font-bold text-slate-700">Phân Hệ</TableHead>
                    <TableHead className="min-w-[220px] font-bold text-slate-700">Địa Chỉ Cư Trú</TableHead>
                    <TableHead className="w-[170px] font-bold text-slate-700">Tọa Độ GIS</TableHead>
                    <TableHead className="min-w-[200px] font-bold text-slate-700">Nhân Khẩu Tiêu Biểu</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 w-[180px]">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHouseholds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                        <AlertCircle className="mx-auto text-slate-300 mb-2.5" size={32} />
                        <p className="text-sm font-medium">Không tìm thấy sổ hộ khẩu nào phù hợp bộ lọc</p>
                        <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc phân loại</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedHouseholds.map((h) => {
                      const hType = h.type || "Thường trú";
                      const isDeleted = Boolean((h as any).deletedAt);

                      return (
                        <TableRow
                          key={h.id}
                          onClick={() => handleOpenDetailModal(h)}
                          className="cursor-pointer transition-colors group hover:bg-slate-50/80"
                        >
                          {/* Mã Sổ */}
                          <TableCell className="font-mono text-xs font-bold">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                onClick={(e) => handleCopyCode(h.code, e)}
                                className="font-mono font-bold text-slate-800 bg-slate-50 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors cursor-pointer"
                                title="Nhấp để sao chép mã sổ"
                              >
                                {h.code}
                                {copiedCode === h.code ? (
                                  <Check size={11} className="ml-1 text-emerald-600" />
                                ) : (
                                  <Copy size={11} className="ml-1 opacity-40 group-hover:opacity-100" />
                                )}
                              </Badge>
                            </div>
                          </TableCell>

                          {/* Chủ Hộ */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                                  {h.ownerName.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm">
                                  {h.ownerName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground pl-9">
                                <Users size={12} className="text-slate-400 shrink-0" />
                                <span>{h.members.length || h.memberCount || 1} nhân khẩu</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Phân Hệ */}
                          <TableCell>
                            <Badge
                              variant={hType === "Tạm trú" ? "warning" : "success"}
                              className="text-[11px] font-bold"
                            >
                              {hType}
                            </Badge>
                          </TableCell>

                          {/* Địa Chỉ */}
                          <TableCell>
                            <div className="flex items-start gap-1.5 text-xs text-slate-700">
                              <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 leading-relaxed">{h.address}</span>
                            </div>
                          </TableCell>

                          {/* Tọa Độ GIS */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {h.coordinates ? (
                              <button
                                type="button"
                                onClick={() => openPinModal(h)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                                title={`Tọa độ: ${h.coordinates} (Bấm để sửa)`}
                              >
                                <Compass size={11} />
                                <span className="truncate max-w-[110px]">{h.coordinates}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPinModal(h)}
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Chưa ghim tọa độ. Bấm để thêm."
                              >
                                <Plus size={11} />
                                <span>+ Ghim GIS</span>
                              </button>
                            )}
                          </TableCell>

                          {/* Nhân Khẩu Tiêu Biểu */}
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {h.members.slice(0, 3).map((m, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    m.relation === "Chủ hộ"
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                  title={`${m.name} (${m.relation} - ${m.birthYear})`}
                                >
                                  {m.relation}: {m.name.split(" ").slice(-1)[0]}
                                </span>
                              ))}
                              {h.members.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                  +{h.members.length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Thao Tác Hành Động */}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="default"
                                size="xs"
                                onClick={() => handleDirections(h)}
                                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                title="Chỉ đường tới hộ trên bản đồ số GIS"
                              >
                                <Navigation size={12} />
                                <span className="hidden sm:inline">Dẫn đường</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleOpenDetailModal(h)}
                                className="gap-1 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                                title="Xem chi tiết Sổ Hộ Khẩu"
                              >
                                <span>Xem Sổ</span>
                                <ChevronRight size={12} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          ) : (
            /* CARD GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedHouseholds.length === 0 ? (
                <div className="col-span-full bg-white p-14 text-center rounded-2xl border border-border text-muted-foreground">
                  <AlertCircle className="mx-auto text-slate-300 mb-2.5" size={32} />
                  <p className="text-sm font-medium">Không tìm thấy sổ hộ khẩu nào phù hợp</p>
                </div>
              ) : (
                paginatedHouseholds.map((h) => {
                  const hType = h.type || "Thường trú";
                  return (
                    <Card
                      key={h.id}
                      onClick={() => handleOpenDetailModal(h)}
                      className="border-border bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer rounded-2xl p-4 flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            onClick={(e) => handleCopyCode(h.code, e)}
                            className="font-mono text-xs font-bold bg-slate-50 border-slate-300 text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                          >
                            {h.code}
                          </Badge>
                          <Badge
                            variant={hType === "Tạm trú" ? "warning" : "success"}
                            className="text-[10px] font-bold"
                          >
                            {hType}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                            Hộ: {h.ownerName}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{h.address}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            <Users size={11} className="text-slate-400" />
                            {h.members.length || h.memberCount || 1} nhân khẩu
                          </span>
                          {h.coordinates && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              <Compass size={10} /> GIS
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <Button
                            variant="default"
                            size="xs"
                            onClick={() => handleDirections(h)}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                            title="Dẫn đường GIS"
                          >
                            <Navigation size={11} />
                            <span>Dẫn đường</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => openPinModal(h)}
                            className="px-2 border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Ghim tọa độ GIS"
                          >
                            <MapPin size={11} />
                          </Button>
                        </div>

                        <span
                          onClick={() => handleOpenDetailModal(h)}
                          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Xem Sổ ➜
                        </span>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-muted-foreground">
                Hiển thị trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng cộng{" "}
                {filteredHouseholds.length} hộ gia đình)
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
                        currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
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
        </TabsContent>
      </Tabs>

      {/* MODAL CHI TIẾT SỔ HỘ KHẨU ĐIỆN TỬ (shadcn Dialog) */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        {selectedHousehold && (
          <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border-slate-700/60 shadow-2xl">
            {/* Header: Dark Navy Gradient & Household Identity */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-6 pt-6 pb-5 text-white relative border-b border-slate-800">
              <button
                type="button"
                onClick={() => setShowDetailDialog(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 text-emerald-300 flex items-center justify-center shadow-lg ring-4 ring-slate-800/80 mb-2.5">
                  <Home size={30} className="text-emerald-300" />
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Hộ: {selectedHousehold.ownerName}
                </h2>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 bg-emerald-950/80 font-mono">
                    SỔ HỘ KHẨU ĐIỆN TỬ
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 bg-emerald-950/80 font-mono font-bold">
                    {selectedHousehold.code}
                  </Badge>
                  <Badge
                    variant={selectedHousehold.type === "Tạm trú" ? "warning" : "info"}
                    className="font-bold"
                  >
                    {selectedHousehold.type || "Thường trú"}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700 font-semibold gap-1">
                    <Users size={12} className="text-emerald-400" />
                    <span>{selectedHousehold.members.length} nhân khẩu</span>
                  </Badge>
                </div>

                {/* Address, GPS and Navigation Bar */}
                <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-700/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full max-w-2xl text-left">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{selectedHousehold.address}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                      {selectedHousehold.coordinates ? (
                        <span>
                          Tọa độ GIS: <strong className="text-indigo-300 font-bold">{selectedHousehold.coordinates}</strong>
                        </span>
                      ) : (
                        <span className="text-amber-400 italic">Chưa ghim vị trí trên bản đồ GIS</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => {
                        handleDirections(selectedHousehold);
                        setShowDetailDialog(false);
                      }}
                      className="gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                      title="Dẫn đường trên bản đồ số GIS Khu phố 3"
                    >
                      <Navigation size={12} />
                      <span>Dẫn đường GIS</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => openPinModal(selectedHousehold)}
                      className="gap-1 bg-indigo-900/40 border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/60 font-semibold cursor-pointer"
                      title="Sửa tọa độ ghim trên bản đồ GIS"
                    >
                      <MapPin size={12} />
                      <span>{selectedHousehold.coordinates ? "Sửa tọa độ" : "Ghim tọa độ"}</span>
                    </Button>

                    {selectedHousehold.coordinates && (
                      <a
                        href={getGoogleMapsDirectionUrl(
                          parseGisCoords(selectedHousehold.coordinates)?.lat || 10.7935,
                          parseGisCoords(selectedHousehold.coordinates)?.lng || 106.7445,
                          selectedHousehold.address
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-md font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        title="Mở chỉ đường ngoài ứng dụng bằng Google Maps"
                      >
                        <ExternalLink size={11} />
                        <span>Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tabs header */}
            <div className="flex border-b border-border bg-white px-6 gap-6 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setDetailTab("members")}
                className={`py-3.5 transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "members" ? "text-emerald-700 font-extrabold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Users size={15} />
                <span>Thành viên nhân khẩu ({selectedHousehold.members.length})</span>
                {detailTab === "members" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600" />}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("businesses")}
                className={`py-3.5 transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "businesses" ? "text-indigo-700 font-extrabold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Home size={15} />
                <span>Hộ kinh doanh tại địa chỉ</span>
                {detailTab === "businesses" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("history")}
                className={`py-3.5 transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "history" ? "text-slate-900 font-extrabold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <History size={15} />
                <span>Nhật ký biến động</span>
                {detailTab === "history" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900" />}
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="max-h-[50vh] overflow-y-auto p-5 sm:p-6 bg-slate-50/60 space-y-4">
              {detailTab === "members" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Danh sách nhân khẩu đăng ký cư trú
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setShowDetailDialog(false);
                          setActiveTabState("recognition");
                        }}
                        className="gap-1 text-teal-700 border-teal-200 hover:bg-teal-50 cursor-pointer"
                        title="Tự động nhận diện chủ hộ và thành viên từ dữ liệu cư dân"
                      >
                        <Sparkles size={12} className="text-teal-600" /> Nhận diện từ Dân cư
                      </Button>
                      <Button
                        variant="default"
                        size="xs"
                        onClick={() => setShowAddMemberDialog(true)}
                        className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                      >
                        <UserPlus size={12} /> Thêm nhân khẩu
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedHousehold.members.map((m) => (
                      <Card
                        key={m.cccd}
                        className="p-4 bg-white hover:shadow-md border-border rounded-xl space-y-2.5 transition-all group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div
                            onClick={() => setProfileViewMember({ name: m.name, relation: m.relation, cccd: m.cccd })}
                            className="cursor-pointer group-hover:text-emerald-700 transition-colors"
                          >
                            <h4 className="font-bold text-slate-900 text-sm hover:underline">{m.name}</h4>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              Sinh năm: {m.birthYear} • CCCD: {m.cccd}
                            </p>
                          </div>
                          <Badge
                            variant={m.relation === "Chủ hộ" ? "success" : "secondary"}
                            className="text-[10px] font-bold shrink-0"
                          >
                            {m.relation}
                          </Badge>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {m.phone && m.phone !== "N/A" ? m.phone : "Chưa có SĐT"}
                          </span>
                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setProfileViewMember({ name: m.name, relation: m.relation, cccd: m.cccd })}
                              className="h-6 px-2 text-[11px] font-semibold cursor-pointer"
                            >
                              Hồ sơ
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => startMoveMember(m.name, m.cccd)}
                              className="h-6 px-2 text-[11px] font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                            >
                              Chuyển hộ
                            </Button>
                            {m.relation !== "Chủ hộ" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={startSplitHousehold}
                                  className="h-6 px-2 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                                >
                                  Tách hộ
                                </Button>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleRemoveMember(m.cccd)}
                                  className="h-6 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                                >
                                  Xóa
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === "businesses" && (
                <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
                  <HouseholdBusinesses household={selectedHousehold} residents={residents} />
                </div>
              )}

              {detailTab === "history" && (
                <div className="bg-white p-4 rounded-xl border border-border shadow-2xs space-y-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Nhật ký biến động và sửa đổi sổ
                  </span>
                  {((selectedHousehold as any).auditHistory || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">
                      Chưa ghi nhận biến động chính thức nào kể từ ngày lập sổ.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {((selectedHousehold as any).auditHistory || []).map((log: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-xs">
                          <History size={14} className="text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-slate-800 font-semibold">{log.action}</p>
                            <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                              {log.date} • Cán bộ: {log.actor}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 bg-white border-t border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowTreeDialog(true)}
                className="gap-2 bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold cursor-pointer"
              >
                <GitBranch size={15} />
                <span>Sơ đồ Cây Phả Hệ</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditHousehold}
                  className="gap-1.5 font-bold cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Sửa Sổ</span>
                </Button>

                {showSoftDeleted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreHousehold(selectedHousehold.id)}
                    className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold cursor-pointer"
                  >
                    <Undo2 size={13} />
                    <span>Khôi phục Sổ</span>
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleSoftDeleteHousehold(selectedHousehold.id)}
                    className="gap-1.5 font-bold cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Xóa Sổ</span>
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDetailDialog(false)}
                  className="font-bold cursor-pointer"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL LẬP SỔ HỘ KHẨU MỚI (shadcn Dialog) */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">Lập Sổ Hộ Khẩu Điện Tử Mới</h3>
              <p className="text-[10px] text-slate-300 mt-0.5">Số hóa Hộ tịch Cán bộ Khu phố 3</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDialog(false)}
              className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateHousehold} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Mã số Sổ Hộ Khẩu *</label>
                <Input
                  required
                  placeholder="HK-XXX"
                  value={newHCode}
                  onChange={(e) => setNewHCode(e.target.value)}
                  className="font-mono text-sm bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Loại cư trú *</label>
                <select
                  value={newHType}
                  onChange={(e) => setNewHType(e.target.value as "Thường trú" | "Tạm trú")}
                  className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="Thường trú">Thường trú (KT1, KT2)</option>
                  <option value="Tạm trú">Tạm trú (KT3, KT4)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Họ và tên Chủ hộ *</label>
                <Input
                  required
                  placeholder="Nguyễn Văn A"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Số CCCD Chủ hộ</label>
                <Input
                  placeholder="079XXXXXXXXX"
                  value={newOwnerCccd}
                  onChange={(e) => setNewOwnerCccd(e.target.value)}
                  className="font-mono text-xs bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Địa chỉ Đăng ký cư trú *</label>
              <Input
                required
                placeholder="Số nhà, đường Lương Định Của / Song Hành, Khu phố 3, An Phú"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">Tọa độ GPS WGS84</label>
                <button
                  type="button"
                  onClick={() => {
                    const auto = generateDefaultCoordinatesForAddress(newAddress || "Khu phố 3, An Phú", newHCode || "HK-001");
                    setCoordInput(auto.dms);
                    setParsedGPS(parseCoordinates(auto.dms));
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} className="text-emerald-600" /> Tự nhận diện từ địa chỉ
                </button>
              </div>
              <Input
                placeholder="Ví dụ: 10.936828, 106.743392 hoặc 10°56'13.2&quot;N 106°44'40.8&quot;E"
                value={coordInput}
                onChange={(e) => handleCoordInputChange(e.target.value)}
                className="font-mono text-xs bg-white"
              />
              {parsedGPS && (
                <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-mono">
                  ✓ Hệ WGS84 hợp lệ: {parsedGPS.lat}, {parsedGPS.lng}
                </div>
              )}
            </div>

            {/* Sub-members registration */}
            <div className="p-3.5 border border-border rounded-xl bg-slate-50 space-y-2.5">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Đăng ký thêm thành viên hộ
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Tên thành viên"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="text-xs bg-white h-8"
                />
                <Input
                  placeholder="Số CCCD"
                  value={newMemberCccd}
                  onChange={(e) => setNewMemberCccd(e.target.value)}
                  className="font-mono text-xs bg-white h-8"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newMemberRelation}
                  onChange={(e) => setNewMemberRelation(e.target.value)}
                  className="h-8 px-2 border border-input rounded-md text-xs bg-white cursor-pointer"
                >
                  <option value="Vợ">Vợ</option>
                  <option value="Chồng">Chồng</option>
                  <option value="Con trai">Con trai</option>
                  <option value="Con gái">Con gái</option>
                  <option value="Bố">Bố</option>
                  <option value="Mẹ">Mẹ</option>
                  <option value="Anh/Em trai">Anh/Em trai</option>
                  <option value="Chị/Em gái">Chị/Em gái</option>
                  <option value="Khác">Khác</option>
                </select>
                <Input
                  type="number"
                  placeholder="Năm sinh"
                  value={newMemberBirthYear}
                  onChange={(e) => setNewMemberBirthYear(e.target.value ? Number(e.target.value) : "")}
                  className="text-xs bg-white h-8"
                />
                <Input
                  placeholder="Số ĐT"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="font-mono text-xs bg-white h-8"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTempMember}
                className="w-full gap-1 text-xs font-bold cursor-pointer"
              >
                <Plus size={12} /> Thêm vào danh sách tạm
              </Button>

              {tempMembers.length > 0 && (
                <div className="space-y-1 border-t border-slate-200 pt-2 text-[11px]">
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">
                    Danh sách đăng ký ({tempMembers.length})
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {tempMembers.map((m, idx) => (
                      <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded-md flex justify-between items-center text-xs">
                        <span>
                          {m.name} ({m.relation}) - {m.birthYear}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTempMembers(tempMembers.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer text-[11px]"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(false)}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                Lập Sổ Hộ Khẩu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL SỬA THÔNG TIN SỔ HỘ KHẨU (shadcn Dialog) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        {selectedHousehold && (
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Chỉnh Sửa Thông Tin Sổ</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Mã Sổ: {selectedHousehold.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditDialog(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditHousehold} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Địa chỉ cư trú</label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Chủ hộ đại diện</label>
                  <select
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white cursor-pointer"
                  >
                    {selectedHousehold.members.map((m) => (
                      <option key={m.cccd} value={m.name}>
                        {m.name} ({m.relation})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Phân hệ cư trú</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as "Thường trú" | "Tạm trú")}
                    className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white cursor-pointer"
                  >
                    <option value="Thường trú">Thường trú</option>
                    <option value="Tạm trú">Tạm trú</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">GPS vệ tinh WGS84</label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = generateDefaultCoordinatesForAddress(editAddress || selectedHousehold.address, selectedHousehold.code);
                      setCoordInput(auto.dms);
                      setParsedGPS(parseCoordinates(auto.dms));
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} className="text-emerald-600" /> Tự nhận diện từ địa chỉ
                  </button>
                </div>
                <Input
                  placeholder="Dán hoặc chỉnh sửa tọa độ..."
                  value={coordInput}
                  onChange={(e) => handleCoordInputChange(e.target.value)}
                  className="font-mono text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Ghi chú biến động / Nguyên nhân thay đổi</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Nhập ghi chú biến động lưu trữ..."
                  className="w-full p-2.5 border border-input rounded-lg text-xs bg-white h-16 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(false)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL THÊM NHÂN KHẨU VÀO HỘ (shadcn Dialog) */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        {selectedHousehold && (
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Thêm Nhân Khẩu Vào Hộ Tịch</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Sổ HK: {selectedHousehold.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberDialog(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddNewMember} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Họ và tên thành viên *</label>
                <Input
                  required
                  placeholder="Nguyễn Văn B"
                  value={addMemName}
                  onChange={(e) => setAddMemName(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Số CCCD gắn chip *</label>
                  <Input
                    required
                    placeholder="079XXXXXXXXX"
                    value={addMemCccd}
                    onChange={(e) => setAddMemCccd(e.target.value)}
                    className="font-mono text-xs bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Năm sinh *</label>
                  <Input
                    type="number"
                    required
                    placeholder="1995"
                    value={addMemBirthYear}
                    onChange={(e) => setAddMemBirthYear(e.target.value ? Number(e.target.value) : "")}
                    className="text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Quan hệ với chủ hộ *</label>
                  <select
                    value={addMemRelation}
                    onChange={(e) => setAddMemRelation(e.target.value)}
                    className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white cursor-pointer"
                  >
                    <option value="Vợ">Vợ</option>
                    <option value="Chồng">Chồng</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Con gái">Con gái</option>
                    <option value="Bố">Bố</option>
                    <option value="Mẹ">Mẹ</option>
                    <option value="Anh/Em trai">Anh/Em trai</option>
                    <option value="Chị/Em gái">Chị/Em gái</option>
                    <option value="Cháu nội/ngoại">Cháu nội/ngoại</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Số điện thoại</label>
                  <Input
                    placeholder="09XXXXXXXX"
                    value={addMemPhone}
                    onChange={(e) => setAddMemPhone(e.target.value)}
                    className="font-mono text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMemberDialog(false)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Xác nhận Nhập khẩu
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL CHUYỂN HỘ TỊCH (shadcn Dialog) */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        {selectedHousehold && moveTargetMember && (
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Chuyển Hộ Tịch Nhân Khẩu</h3>
              <button
                type="button"
                onClick={() => setShowMoveDialog(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="leading-relaxed text-slate-700">
                Đang thực hiện chuyển nhân khẩu <strong>{moveTargetMember.name}</strong> (CCCD: {moveTargetMember.cccd})
                từ Sổ hộ khẩu <strong>{selectedHousehold.code}</strong> sang một Sổ hộ khẩu khác.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Lựa chọn Sổ hộ khẩu đích</label>
                <select
                  value={moveTargetHCode}
                  onChange={(e) => setMoveTargetHCode(e.target.value)}
                  className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white cursor-pointer"
                >
                  {households
                    .filter((h) => h.id !== selectedHousehold.id && !(h as any).deletedAt)
                    .map((h) => (
                      <option key={h.id} value={h.code}>
                        {h.code} - Hộ {h.ownerName} ({h.address})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMoveDialog(false)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handlePerformMoveMember}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Xác nhận chuyển hộ
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL TÁCH HỘ TỊCH (shadcn Dialog) */}
      <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
        {selectedHousehold && (
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Tách Hộ Tịch (Chia tách gia đình)</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Sổ nguồn: {selectedHousehold.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitDialog(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Tích chọn các thành viên muốn tách sổ *</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-border p-3 rounded-lg bg-slate-50">
                  {selectedHousehold.members
                    .filter((m) => m.relation !== "Chủ hộ")
                    .map((m) => (
                      <div key={m.cccd} className="flex items-center gap-2 select-none">
                        <input
                          type="checkbox"
                          id={`split-${m.cccd}`}
                          checked={splitSelectedCccds.includes(m.cccd)}
                          onChange={() => toggleSelectSplitMember(m.cccd)}
                          className="w-4 h-4 text-emerald-600 border-slate-300 rounded cursor-pointer"
                        />
                        <label htmlFor={`split-${m.cccd}`} className="text-slate-700 cursor-pointer font-medium">
                          {m.name} ({m.relation}) - Sinh {m.birthYear}
                        </label>
                      </div>
                    ))}
                  {selectedHousehold.members.filter((m) => m.relation !== "Chủ hộ").length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Sổ này không có thành viên phụ để tách!</p>
                  )}
                </div>
              </div>

              {splitSelectedCccds.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block">Mã số Sổ mới *</label>
                      <Input
                        value={splitNewHCode}
                        onChange={(e) => setSplitNewHCode(e.target.value)}
                        className="font-mono text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block">Chỉ định Chủ hộ mới *</label>
                      <select
                        value={splitNewOwner}
                        onChange={(e) => setSplitNewOwner(e.target.value)}
                        className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- Chọn chủ hộ mới --</option>
                        {selectedHousehold.members
                          .filter((m) => splitSelectedCccds.includes(m.cccd))
                          .map((m) => (
                            <option key={m.cccd} value={m.cccd}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Địa chỉ sổ mới đăng ký *</label>
                    <Input
                      value={splitNewAddress}
                      onChange={(e) => setSplitNewAddress(e.target.value)}
                      className="text-xs bg-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSplitDialog(false)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={splitSelectedCccds.length === 0}
                  onClick={handlePerformSplitHousehold}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  Xác nhận tách hộ tịch
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL GHIM & ĐỒNG BỘ TỌA ĐỘ GIS (shadcn Dialog) */}
      <Dialog open={showGisPinDialog} onOpenChange={setShowGisPinDialog}>
        {gisPinModalHousehold && (
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl text-emerald-300">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Ghim & Đồng Bộ Tọa Độ GIS</h3>
                  <p className="text-[11px] text-emerald-200/90 font-mono">
                    Hộ: {gisPinModalHousehold.ownerName} • {gisPinModalHousehold.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGisPinDialog(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                  Địa chỉ hộ cư trú:
                </span>
                <p className="font-bold text-slate-900 text-sm">{gisPinModalHousehold.address}</p>
                <span className="text-[11px] text-muted-foreground block">Khu phố 3, Phường An Phú, TP. Hồ Chí Minh</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Tọa độ GIS (DMS hoặc Thập phân):</label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = generateDefaultCoordinatesForAddress(
                        gisPinModalHousehold.address,
                        gisPinModalHousehold.code
                      );
                      setGisPinInput(auto.dms);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} className="text-emerald-600" /> Tự động nhận diện từ địa chỉ
                  </button>
                </div>

                <div className="relative">
                  <Input
                    value={gisPinInput}
                    onChange={(e) => setGisPinInput(e.target.value)}
                    placeholder="Ví dụ: 10°56'13.2&quot;N 106°44'40.8&quot;E hoặc 10.936997, 106.744645"
                    className="font-mono text-xs pr-8 bg-white"
                  />
                  <MapPin size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Quick Road / Alley presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Gợi ý tuyến đường nhanh tại KP3:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setGisPinInput('10°56\'13.2"N 106°44\'40.7"E')}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  >
                    <strong className="block text-slate-900">42 Lương Định Của</strong>
                    <span className="text-[10px] text-muted-foreground font-mono">10.936997, 106.744645</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGisPinInput('10°56\'16.1"N 106°44\'43.8"E')}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  >
                    <strong className="block text-slate-900">Hẻm 42 Lương Định Của</strong>
                    <span className="text-[10px] text-muted-foreground font-mono">10.937800, 106.745500</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGisPinInput('10°56\'08.9"N 106°44\'48.5"E')}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  >
                    <strong className="block text-slate-900">Hẻm 18 Lương Định Của</strong>
                    <span className="text-[10px] text-muted-foreground font-mono">10.935800, 106.746800</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGisPinInput('10°56\'12.5"N 106°44\'42.6"E')}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  >
                    <strong className="block text-slate-900">KDC TDP 12-14</strong>
                    <span className="text-[10px] text-muted-foreground font-mono">10.936800, 106.744600</span>
                  </button>
                </div>
              </div>

              {/* Status helper */}
              {gisPinInput && (() => {
                const parsed = parseGisCoords(gisPinInput);
                if (parsed) {
                  return (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Check size={13} className="text-emerald-600" />
                        <span>Hợp lệ: {parsed.lat.toFixed(6)}, {parsed.lng.toFixed(6)}</span>
                      </div>
                      <span className="font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded">
                        {decimalToDMS(parsed.lat, parsed.lng)}
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-amber-600 shrink-0" />
                      <span>Đang kiểm tra định dạng tọa độ. Vui lòng nhập chuẩn hoặc bấm nút tự nhận diện.</span>
                    </div>
                  );
                }
              })()}

              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGisPinDialog(false)}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSavePinCoordinates(false)}
                    className="font-bold cursor-pointer"
                  >
                    Lưu & Đồng bộ GIS
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => handleSavePinCoordinates(true)}
                    className="gap-1.5 bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold cursor-pointer shadow-sm"
                  >
                    <Navigation size={13} />
                    <span>Lưu & Dẫn đường ngay</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* SƠ ĐỒ CÂY PHẢ HỆ GIA ĐÌNH MODAL */}
      {showTreeDialog && selectedHousehold && (
        <HouseholdFamilyTree
          household={selectedHousehold}
          onClose={() => setShowTreeDialog(false)}
          onSelectMember={(name, relation, cccd) => {
            setProfileViewMember({ name, relation, cccd });
          }}
        />
      )}

      {/* CHI TIẾT PROFILE THÀNH VIÊN MODAL */}
      {profileViewMember && (
        <HouseholdMemberProfile
          resident={residents.find((r) => r.cccd === profileViewMember.cccd) || null}
          relation={profileViewMember.relation}
          onClose={() => setProfileViewMember(null)}
        />
      )}
    </div>
  );
}
