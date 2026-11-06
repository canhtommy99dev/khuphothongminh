import React, { useState, useMemo, useRef } from "react";
import {
  ShieldCheck,
  Users,
  UserPlus,
  Plus,
  X,
  Search,
  Trash2,
  Edit2,
  Award,
  Flame,
  Calendar,
  Heart,
  MapPin,
  PlusCircle,
  UserCheck,
  CheckCircle,
  FolderPlus,
  HelpCircle,
  FileSpreadsheet,
  Pencil,
  AlertTriangle,
  FileText,
  UploadCloud,
  Download,
  Eye,
  Paperclip,
  FileCheck,
  FileUp,
  File,
  Image as ImageIcon,
  ExternalLink,
  Printer,
  Sparkles,
  CheckSquare,
  Square,
  Layers,
  BadgeCheck,
  CheckCircle2,
  SlidersHorizontal,
  BookmarkPlus,
  Camera,
  LayoutGrid,
  List,
  Phone,
  Home,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  Building,
  Flag
} from "lucide-react";
import { Resident, PartyMember, Association, AssociationMember } from "../types";
import Pagination from "./Pagination";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { navigate, useCurrentPath, ROUTES } from "../routes";
import AddAssociationPage from "../page/AddAssociationPage";
import {
  TargetGroupConfig,
  TARGET_GROUPS,
  ASSOCIATION_CATEGORIES,
  DEFAULT_ASSOCIATIONS,
  getCategoryBadgeStyle,
  PartyAddMemberDialog,
  PartyMemberDetailDialog,
  PartyDecisionDialog,
  DecisionDocInfo
} from "./party";

export type { TargetGroupConfig };
export {
  TARGET_GROUPS,
  ASSOCIATION_CATEGORIES,
  DEFAULT_ASSOCIATIONS,
  getCategoryBadgeStyle,
  PartyAddMemberDialog,
  PartyMemberDetailDialog,
  PartyDecisionDialog
};

export interface PartyBranchProps {
  partyMembers?: PartyMember[];
  residents?: Resident[];
  onUpdatePartyMembers?: (members: PartyMember[]) => void;
  showToast?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export default function PartyBranch({
  partyMembers = [],
  residents = [],
  onUpdatePartyMembers,
  showToast: showToastProp
}: PartyBranchProps) {
  const currentPath = useCurrentPath();

  // Internal toast notification fallback
  const [internalToast, setInternalToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const showToast = (
    msg: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    if (showToastProp) {
      showToastProp(msg, type);
    } else {
      setInternalToast({ message: msg, type });
      setTimeout(() => setInternalToast(null), 3500);
    }
  };

  // Detect whether current URL points to Add Association subpage
  const isAddAssociationRoute = useMemo(() => {
    const clean = currentPath.replace(/^\/+|\/+$/g, "");
    return clean === "dashboard/party/add" || clean === "add_association";
  }, [currentPath]);

  // Main state: 22 Associations (Chi hội)
  const [associations, setAssociations] = useState<Association[]>(() => {
    try {
      const saved = localStorage.getItem("kp3_associations_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_ASSOCIATIONS;
  });

  // Save associations to localStorage whenever changed
  const saveAssociations = (updated: Association[]) => {
    setAssociations(updated);
    try {
      localStorage.setItem("kp3_associations_data", JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  // Selected association & filters
  const [selectedAssociationId, setSelectedAssociationId] = useState<string>("ASC_BDH");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Member filtering inside selected association
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("Tất cả");

  // View modes: "associations" vs "multi-role-matrix"
  const [activeViewMode, setActiveViewMode] = useState<"associations" | "multi-role-matrix">("associations");
  const [memberViewMode, setMemberViewMode] = useState<"card" | "list">("card");

  // Multi-role matrix filters
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixFilterCategory, setMatrixFilterCategory] = useState<string>("Tất cả");
  const [matrixPage, setMatrixPage] = useState(1);
  const matrixPerPage = 10;

  // Custom roles management
  const DEFAULT_ROLES = [
    "Chi hội trưởng",
    "Chi hội phó",
    "Ủy viên Ban chấp hành",
    "Bí thư Chi bộ",
    "Phó Bí thư Chi bộ",
    "Tổ trưởng",
    "Tổ phó",
    "Thư ký",
    "Hội viên",
    "Hội viên tích cực",
    "Hội viên nòng cốt",
    "Đội viên ANTT cơ sở",
    "Chiến sĩ Dân quân tự vệ",
    "Chỉ huy trưởng DQTV",
    "Hòa giải viên cơ sở",
    "Trưởng Ban điều hành",
    "Phó Ban điều hành",
    "Cán bộ Đoàn thanh niên",
    "Cán bộ Hội phụ nữ",
    "Cán bộ Hội Cựu chiến binh",
    "Cán bộ Hội Nông dân",
    "Cộng tác viên Dân số"
  ];

  const [customRoles, setCustomRoles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("kp3_association_roles");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_ROLES;
  });

  const [showRoleManagerModal, setShowRoleManagerModal] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState("");

  // Modals state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<AssociationMember | null>(null);

  const [showEditAssocModal, setShowEditAssocModal] = useState(false);
  const [assocToEdit, setAssocToEdit] = useState<Association | null>(null);
  const [editAssocName, setEditAssocName] = useState("");
  const [editAssocCategory, setEditAssocCategory] = useState<string>("");
  const [editAssocDesc, setEditAssocDesc] = useState("");
  const [editAssocLeaderName, setEditAssocLeaderName] = useState("");
  const [editAssocLeaderCccd, setEditAssocLeaderCccd] = useState("");

  const [assocToDelete, setAssocToDelete] = useState<Association | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<{ cccd: string; name: string } | null>(null);

  // Form states for Add Member
  const [selectedResidentCccd, setSelectedResidentCccd] = useState("");
  const [memberRole, setMemberRole] = useState("Hội viên");
  const [memberJoinDate, setMemberJoinDate] = useState("");
  const [memberDecisionNumber, setMemberDecisionNumber] = useState("");
  const [memberDecisionDate, setMemberDecisionDate] = useState("");
  const [memberDecisionFile, setMemberDecisionFile] = useState<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  } | null>(null);
  const [residentSearchTerm, setResidentSearchTerm] = useState("");

  // Form states for Edit Member
  const [editMemberRole, setEditMemberRole] = useState<string>("");
  const [editMemberJoinDate, setEditMemberJoinDate] = useState<string>("");
  const [editMemberDecisionNumber, setEditMemberDecisionNumber] = useState<string>("");
  const [editMemberDecisionDate, setEditMemberDecisionDate] = useState<string>("");
  const [editMemberDecisionFile, setEditMemberDecisionFile] = useState<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  } | null>(null);

  // View Decision Document Dialog state
  const [viewingDecisionDoc, setViewingDecisionDoc] = useState<{
    decisionNumber: string;
    decisionDate?: string;
    associationName: string;
    memberName: string;
    memberRole: string;
    memberCccd: string;
    fileInfo?: {
      fileName: string;
      fileUrl: string;
      fileType: string;
    };
  } | null>(null);

  // Member Profile Dossier Modal
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<AssociationMember | null>(null);

  // Quick Assign Modal State
  const [showQuickAssignModal, setShowQuickAssignModal] = useState(false);
  const [quickAssignTab, setQuickAssignTab] = useState<"by-resident" | "by-group">("by-resident");
  const [quickAssignResidentCccd, setQuickAssignResidentCccd] = useState<string>("");
  const [quickAssignGroupSelections, setQuickAssignGroupSelections] = useState<Record<string, { selected: boolean; role: string }>>({});
  const [quickAssignTargetGroupId, setQuickAssignTargetGroupId] = useState<string>("ASC_BDH");
  const [quickAssignSelectedResidentCccds, setQuickAssignSelectedResidentCccds] = useState<string[]>([]);
  const [quickAssignResidentSearch, setQuickAssignResidentSearch] = useState<string>("");

  // Currently selected Association object
  const selectedAssociation = useMemo(() => {
    return associations.find((a) => a.id === selectedAssociationId) || associations[0];
  }, [associations, selectedAssociationId]);

  // Filtered associations list for the left sidebar
  const filteredAssociations = useMemo(() => {
    return associations.filter((assoc) => {
      const matchSearch =
        assoc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assoc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assoc.leaderName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        categoryFilter === "Tất cả" || assoc.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [associations, searchTerm, categoryFilter]);

  // Paginated associations
  const paginatedAssociations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssociations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssociations, currentPage, itemsPerPage]);

  const totalAssocPages = Math.ceil(filteredAssociations.length / itemsPerPage) || 1;

  // Filtered members in selected association
  const filteredMembers = useMemo(() => {
    if (!selectedAssociation) return [];
    return selectedAssociation.members.filter((member) => {
      const matchSearch =
        member.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        member.cccd.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(memberSearchTerm)) ||
        (member.role && member.role.toLowerCase().includes(memberSearchTerm.toLowerCase()));
      const matchRole =
        memberRoleFilter === "Tất cả" || member.role === memberRoleFilter;
      return matchSearch && matchRole;
    });
  }, [selectedAssociation, memberSearchTerm, memberRoleFilter]);

  // Statistics
  const totalAssociationsCount = associations.length;

  const allMembersFlat = useMemo(() => {
    const map = new Map<string, AssociationMember>();
    associations.forEach((assoc) => {
      assoc.members.forEach((m) => {
        if (!map.has(m.cccd)) {
          map.set(m.cccd, m);
        }
      });
    });
    return Array.from(map.values());
  }, [associations]);

  const multiRoleSummary = useMemo(() => {
    const cccdMap: Record<string, { resident: Resident; roles: { groupName: string; role: string; groupId: string }[] }> = {};

    associations.forEach((assoc) => {
      assoc.members.forEach((m) => {
        if (!cccdMap[m.cccd]) {
          const res = residents.find((r) => r.cccd === m.cccd) || {
            id: m.id,
            fullName: m.fullName,
            cccd: m.cccd,
            phone: m.phone || "Chưa có SĐT",
            address: "Khu phố 3, Phường An Phú",
            birthDate: m.birthDate || "",
            gender: "Nam",
            residenceType: "Thường trú"
          };
          cccdMap[m.cccd] = {
            resident: res as Resident,
            roles: []
          };
        }
        cccdMap[m.cccd].roles.push({
          groupName: assoc.name,
          role: m.role,
          groupId: assoc.id
        });
      });
    });

    return Object.values(cccdMap).map((item) => ({
      ...item,
      rolesCount: item.roles.length
    }));
  }, [associations, residents]);

  const multiRoleCount = useMemo(() => {
    return multiRoleSummary.filter((item) => item.rolesCount > 1).length;
  }, [multiRoleSummary]);

  const totalDecisionsCount = useMemo(() => {
    let count = 0;
    associations.forEach((assoc) => {
      assoc.members.forEach((m) => {
        if (m.decisionNumber && m.decisionNumber.trim()) count++;
      });
    });
    return count;
  }, [associations]);

  // Filtered Multi-role Matrix list
  const filteredMultiRoleList = useMemo(() => {
    return multiRoleSummary.filter((item) => {
      const matchSearch =
        item.resident.fullName.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        item.resident.cccd.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        item.resident.phone?.includes(matrixSearch) ||
        item.roles.some(
          (r) =>
            r.groupName.toLowerCase().includes(matrixSearch.toLowerCase()) ||
            r.role.toLowerCase().includes(matrixSearch.toLowerCase())
        );

      let matchFilter = true;
      if (matrixFilterCategory === "Đa nhiệm (≥ 2 vai trò)") {
        matchFilter = item.rolesCount >= 2;
      } else if (matrixFilterCategory === "Có vai trò (≥ 1 vai trò)") {
        matchFilter = item.rolesCount >= 1;
      } else if (matrixFilterCategory === "Đảng viên") {
        matchFilter = item.roles.some((r) => r.groupName.toLowerCase().includes("đảng"));
      } else if (matrixFilterCategory === "Chính quyền") {
        matchFilter = item.roles.some((r) => r.groupName.toLowerCase().includes("điều hành") || r.groupName.toLowerCase().includes("tổ dân phố"));
      } else if (matrixFilterCategory === "Đoàn thể") {
        matchFilter = item.roles.some((r) =>
          ["phụ nữ", "thanh niên", "cựu chiến binh", "mặt trận", "nông dân"].some((kw) =>
            r.groupName.toLowerCase().includes(kw)
          )
        );
      }

      return matchSearch && matchFilter;
    });
  }, [multiRoleSummary, matrixSearch, matrixFilterCategory]);

  const paginatedMultiRoleList = useMemo(() => {
    const start = (matrixPage - 1) * matrixPerPage;
    return filteredMultiRoleList.slice(start, start + matrixPerPage);
  }, [filteredMultiRoleList, matrixPage, matrixPerPage]);

  const totalMatrixPages = Math.ceil(filteredMultiRoleList.length / matrixPerPage) || 1;

  // Filtered residents for Add Member resident picker
  const filteredResidentsForPick = useMemo(() => {
    if (!residentSearchTerm.trim()) return residents.slice(0, 15);
    const kw = residentSearchTerm.toLowerCase();
    return residents
      .filter(
        (r) =>
          r.fullName.toLowerCase().includes(kw) ||
          r.cccd.includes(kw) ||
          (r.phone && r.phone.includes(kw)) ||
          r.address.toLowerCase().includes(kw)
      )
      .slice(0, 20);
  }, [residents, residentSearchTerm]);

  // Handlers for Custom Roles
  const handleAddCustomRole = (newRoleName: string) => {
    const trimmed = newRoleName.trim();
    if (!trimmed) {
      showToast("Vui lòng nhập tên chức danh!", "error");
      return;
    }
    if (customRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      showToast("Chức danh này đã tồn tại trong danh mục!", "warning");
      return;
    }
    const updated = [trimmed, ...customRoles];
    setCustomRoles(updated);
    try {
      localStorage.setItem("kp3_association_roles", JSON.stringify(updated));
    } catch (e) {}
    setNewRoleInput("");
    showToast(`Đã thêm chức danh "${trimmed}" thành công!`, "success");
  };

  const handleEditCustomRole = (oldRole: string, newRole: string) => {
    const trimmed = newRole.trim();
    if (!trimmed || trimmed === oldRole) {
      setEditingRoleIndex(null);
      return;
    }
    const updated = customRoles.map((r) => (r === oldRole ? trimmed : r));
    setCustomRoles(updated);
    try {
      localStorage.setItem("kp3_association_roles", JSON.stringify(updated));
    } catch (e) {}

    // Update active members across associations
    const updatedAssocs = associations.map((a) => ({
      ...a,
      members: a.members.map((m) => (m.role === oldRole ? { ...m, role: trimmed } : m))
    }));
    saveAssociations(updatedAssocs);
    setEditingRoleIndex(null);
    showToast(`Đã đổi tên chức danh thành "${trimmed}"!`, "success");
  };

  const handleDeleteCustomRole = (roleToDelete: string) => {
    if (customRoles.length <= 1) {
      showToast("Phải giữ lại ít nhất 1 chức danh!", "error");
      return;
    }
    const updated = customRoles.filter((r) => r !== roleToDelete);
    setCustomRoles(updated);
    try {
      localStorage.setItem("kp3_association_roles", JSON.stringify(updated));
    } catch (e) {}
    showToast(`Đã xóa chức danh "${roleToDelete}"!`, "info");
  };

  // Handlers for Add Member
  const handleOpenAddMemberModal = () => {
    setShowAddMemberModal(true);
  };

  const handleSaveAddMember = (newMember: AssociationMember) => {
    if (!selectedAssociation) return;

    const updatedAssocs = associations.map((a) => {
      if (a.id === selectedAssociation.id) {
        return {
          ...a,
          members: [newMember, ...a.members]
        };
      }
      return a;
    });

    saveAssociations(updatedAssocs);
    setShowAddMemberModal(false);
    showToast(`Đã thêm ${newMember.fullName} vào ${selectedAssociation.name}!`, "success");
  };

  // Handlers for Edit Member
  const handleOpenEditMember = (member: AssociationMember) => {
    setEditingMember(member);
    setEditMemberRole(member.role);
    setEditMemberJoinDate(member.joinDate || "");
    setEditMemberDecisionNumber(member.decisionNumber || "");
    setEditMemberDecisionDate(member.decisionDate || "");
    setEditMemberDecisionFile(member.decisionFile || null);
    setShowEditMemberModal(true);
  };

  const handleSaveEditMember = () => {
    if (!editingMember || !selectedAssociation) return;

    const updatedAssocs = associations.map((a) => {
      if (a.id === selectedAssociation.id) {
        return {
          ...a,
          members: a.members.map((m) => {
            if (m.id === editingMember.id || m.cccd === editingMember.cccd) {
              return {
                ...m,
                role: editMemberRole,
                joinDate: editMemberJoinDate,
                decisionNumber: editMemberDecisionNumber,
                decisionDate: editMemberDecisionDate,
                decisionFile: editMemberDecisionFile || undefined
              };
            }
            return m;
          })
        };
      }
      return a;
    });

    saveAssociations(updatedAssocs);
    setShowEditMemberModal(false);
    setEditingMember(null);
    showToast(`Đã cập nhật thông tin thành viên ${editingMember.fullName}!`, "success");
  };

  // Handlers for Delete Member
  const handleDeleteMember = () => {
    if (!memberToDelete || !selectedAssociation) return;

    const updatedAssocs = associations.map((a) => {
      if (a.id === selectedAssociation.id) {
        return {
          ...a,
          members: a.members.filter((m) => m.cccd !== memberToDelete.cccd)
        };
      }
      return a;
    });

    saveAssociations(updatedAssocs);
    setMemberToDelete(null);
    showToast(`Đã xóa ${memberToDelete.name} khỏi ${selectedAssociation.name}!`, "info");
  };

  // Handlers for Edit Association
  const handleOpenEditAssoc = (assoc: Association) => {
    setAssocToEdit(assoc);
    setEditAssocName(assoc.name);
    setEditAssocCategory(assoc.category);
    setEditAssocDesc(assoc.description || "");
    setEditAssocLeaderName(assoc.leaderName || "");
    setEditAssocLeaderCccd(assoc.leaderCccd || "");
    setShowEditAssocModal(true);
  };

  const handleSaveEditAssoc = () => {
    if (!assocToEdit) return;
    if (!editAssocName.trim()) {
      showToast("Tên tổ chức không được để trống!", "error");
      return;
    }

    const updatedAssocs = associations.map((a) => {
      if (a.id === assocToEdit.id) {
        return {
          ...a,
          name: editAssocName.trim(),
          category: editAssocCategory,
          description: editAssocDesc.trim(),
          leaderName: editAssocLeaderName.trim(),
          leaderCccd: editAssocLeaderCccd.trim()
        };
      }
      return a;
    });

    saveAssociations(updatedAssocs);
    setShowEditAssocModal(false);
    setAssocToEdit(null);
    showToast(`Đã cập nhật thông tin "${editAssocName}" thành công!`, "success");
  };

  // Handlers for Delete Association
  const handleDeleteAssoc = () => {
    if (!assocToDelete) return;
    if (associations.length <= 1) {
      showToast("Không thể xóa toàn bộ chi hội!", "error");
      return;
    }

    const updated = associations.filter((a) => a.id !== assocToDelete.id);
    saveAssociations(updated);
    if (selectedAssociationId === assocToDelete.id) {
      setSelectedAssociationId(updated[0]?.id || "");
    }
    setAssocToDelete(null);
    showToast(`Đã giải thể / xóa tổ chức "${assocToDelete.name}"!`, "info");
  };

  // Quick Multi-role Assignment handlers
  const handleOpenQuickAssign = (residentCccd?: string) => {
    if (residentCccd) {
      setQuickAssignResidentCccd(residentCccd);
      const initialMap: Record<string, { selected: boolean; role: string }> = {};
      associations.forEach((assoc) => {
        const mem = assoc.members.find((m) => m.cccd === residentCccd);
        if (mem) {
          initialMap[assoc.id] = { selected: true, role: mem.role };
        } else {
          initialMap[assoc.id] = { selected: false, role: "Hội viên" };
        }
      });
      setQuickAssignGroupSelections(initialMap);
      setQuickAssignTab("by-resident");
    } else {
      setQuickAssignResidentCccd(residents[0]?.cccd || "");
      const initialMap: Record<string, { selected: boolean; role: string }> = {};
      associations.forEach((assoc) => {
        initialMap[assoc.id] = { selected: false, role: "Hội viên" };
      });
      setQuickAssignGroupSelections(initialMap);
      setQuickAssignTab("by-resident");
    }
    setShowQuickAssignModal(true);
  };

  const handleSaveQuickAssignByResident = () => {
    const resident = residents.find((r) => r.cccd === quickAssignResidentCccd);
    if (!resident) {
      showToast("Vui lòng chọn cư dân!", "error");
      return;
    }

    const updatedAssocs = associations.map((assoc) => {
      const cfg = quickAssignGroupSelections[assoc.id];
      const existingIndex = assoc.members.findIndex((m) => m.cccd === resident.cccd);

      if (cfg && cfg.selected) {
        if (existingIndex >= 0) {
          const updatedMembers = [...assoc.members];
          updatedMembers[existingIndex] = {
            ...updatedMembers[existingIndex],
            role: cfg.role
          };
          return { ...assoc, members: updatedMembers };
        } else {
          const newMem: AssociationMember = {
            id: `M_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            fullName: resident.fullName,
            role: cfg.role,
            cccd: resident.cccd,
            phone: resident.phone || "",
            birthDate: resident.birthDate || "",
            joinDate: new Date().toISOString().split("T")[0]
          };
          return { ...assoc, members: [newMem, ...assoc.members] };
        }
      } else {
        if (existingIndex >= 0) {
          return {
            ...assoc,
            members: assoc.members.filter((m) => m.cccd !== resident.cccd)
          };
        }
        return assoc;
      }
    });

    saveAssociations(updatedAssocs);
    setShowQuickAssignModal(false);
    showToast(`Đã cập nhật phân công đa vai trò cho ${resident.fullName}!`, "success");
  };

  // Export to Excel handlers
  const handleExportSelectedToExcel = () => {
    if (!selectedAssociation) return;
    const headers = [
      "Mã Chi hội",
      "Tên Chi hội/Tổ chức",
      "Phân nhóm",
      "STT",
      "Họ và tên",
      "Chức vụ/Vai trò",
      "Số CCCD",
      "Số điện thoại",
      "Năm sinh",
      "Ngày tham gia",
      "Số Quyết định",
      "Ngày ban hành QĐ"
    ];

    const rows = selectedAssociation.members.map((m, idx) => [
      selectedAssociation.id,
      selectedAssociation.name,
      selectedAssociation.category,
      idx + 1,
      m.fullName,
      m.role,
      `="${m.cccd}"`,
      `="${m.phone || "N/A"}"`,
      m.birthDate ? m.birthDate.split("/").pop() : "N/A",
      m.joinDate || "Chưa cập nhật",
      m.decisionNumber || "Chưa có",
      m.decisionDate || "N/A"
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DS_ChiHoi_${selectedAssociation.id}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất danh sách ${selectedAssociation.name} ra file Excel!`, "success");
  };

  const handleExportAllToExcel = () => {
    const headers = [
      "Mã Chi hội",
      "Tên Chi hội/Tổ chức",
      "Phân loại nhóm",
      "Người đứng đầu",
      "CCCD Người đứng đầu",
      "STT",
      "Họ tên Thành viên",
      "Chức vụ/Vai trò",
      "CCCD Thành viên",
      "SĐT Thành viên",
      "Năm sinh",
      "Ngày tham gia",
      "Số Quyết định"
    ];

    const rows: string[][] = [];
    associations.forEach((assoc) => {
      if (assoc.members.length === 0) {
        rows.push([
          assoc.id,
          assoc.name,
          assoc.category,
          assoc.leaderName || "Chưa cập nhật",
          `="${assoc.leaderCccd || "N/A"}"`,
          "0",
          "Chưa có hội viên",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-"
        ]);
      } else {
        assoc.members.forEach((m, idx) => {
          rows.push([
            assoc.id,
            assoc.name,
            assoc.category,
            assoc.leaderName || "Chưa cập nhật",
            `="${assoc.leaderCccd || "N/A"}"`,
            (idx + 1).toString(),
            m.fullName,
            m.role,
            `="${m.cccd}"`,
            `="${m.phone || "N/A"}"`,
            m.birthDate ? m.birthDate.split("/").pop() || "N/A" : "N/A",
            m.joinDate || "Chưa cập nhật",
            m.decisionNumber || "Chưa có"
          ]);
        });
      }
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TongHop_DoanThe_KP3_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất toàn bộ danh sách 22 Chi hội đoàn thể ra file Excel!`, "success");
  };

  const handleExportMultiRoleReport = () => {
    const headers = [
      "STT",
      "Họ và tên Cư dân",
      "Số CCCD",
      "Số điện thoại",
      "Địa chỉ",
      "Số tổ chức tham gia",
      "Chi tiết chức danh kiêm nhiệm",
      "Đánh giá"
    ];

    const rows = multiRoleSummary
      .filter((item) => item.rolesCount > 0)
      .map((item, idx) => {
        const details = item.roles.map((r) => `${r.groupName} (${r.role})`).join("; ");
        return [
          (idx + 1).toString(),
          item.resident.fullName,
          `="${item.resident.cccd}"`,
          `="${item.resident.phone || "N/A"}"`,
          item.resident.address,
          item.rolesCount.toString(),
          details,
          item.rolesCount > 1 ? "Cán bộ Đa nhiệm (Kiêm nhiệm)" : "Hội viên đơn nhiệm"
        ];
      });

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BaoCao_DaNhiem_DoanThe_KP3_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất báo cáo cán bộ kiêm nhiệm đa vai trò ra file Excel!`, "success");
  };

  // If URL routes directly to Add Association subpage, render AddAssociationPage
  if (isAddAssociationRoute) {
    return (
      <AddAssociationPage
        residents={residents}
        onCreateAssociation={(newAssoc) => {
          const updated = [newAssoc, ...associations];
          saveAssociations(updated);
          setSelectedAssociationId(newAssoc.id);
          showToast(`Đã thành lập tổ chức "${newAssoc.name}" thành công!`, "success");
          navigate(ROUTES.DASHBOARD_PARTY);
        }}
        onBack={() => {
          navigate(ROUTES.DASHBOARD_PARTY);
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {internalToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom duration-200 border ${
            internalToast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : internalToast.type === "error"
              ? "bg-rose-600 text-white border-rose-500"
              : internalToast.type === "warning"
              ? "bg-amber-600 text-white border-amber-500"
              : "bg-slate-800 text-white border-slate-700"
          }`}
        >
          {internalToast.type === "success" && <CheckCircle2 className="w-4 h-4" />}
          {internalToast.type === "error" && <AlertTriangle className="w-4 h-4" />}
          {internalToast.type === "warning" && <AlertTriangle className="w-4 h-4" />}
          {internalToast.type === "info" && <BookmarkPlus className="w-4 h-4" />}
          <span>{internalToast.message}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 md:p-6 shadow-xl border border-emerald-800/40">
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <ShieldCheck className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 font-semibold px-2.5 py-0.5">
                <Flag className="w-3 h-3 mr-1 text-emerald-300" /> Hệ thống Chính trị Cơ sở
              </Badge>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-200 border-amber-400/40 font-medium px-2 py-0.5">
                22 Chi hội & Lực lượng Tự quản
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Khối Đoàn Thể & Tổ Chức Chính Trị - Xã Hội</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Khu phố 3, Phường An Phú • Quản lý nhân sự Chi bộ Đảng, Ban điều hành, Mặt trận, Hội Phụ nữ, Đoàn Thanh niên, ANTT cơ sở và các tổ chức tự quản.
            </p>
          </div>

          {/* Action buttons on hero header */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenQuickAssign()}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-sm cursor-pointer"
              title="Mở nhanh bảng phân công đa vai trò cư dân"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-950" />
              <span>Phân công Đa vai trò</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoleManagerModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm cursor-pointer"
              title="Quản lý danh mục chức danh chi hội"
            >
              <Settings className="w-3.5 h-3.5 mr-1 text-emerald-300" />
              <span>Chức danh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllToExcel}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm cursor-pointer"
              title="Xuất toàn bộ danh sách 22 chi hội ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-300" />
              <span>Xuất Excel</span>
            </Button>

            {/* Elevated Button to Navigate to Add Association Page */}
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(ROUTES.DASHBOARD_ADD_ASSOCIATION)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer gap-1.5"
              title="Chuyển sang trang Lập Chi hội mới (/dashboard/party/add)"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Tạo Chi hội mới</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 KPI Analytic Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="hover:border-emerald-300 transition-colors shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">Tổng số Chi hội</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground tracking-tight">{totalAssociationsCount}</span>
              <span className="text-xs text-muted-foreground">tổ chức</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-1">Đầy đủ các khối đoàn thể</span>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 transition-colors shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">Nhân sự tham gia</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground tracking-tight">{allMembersFlat.length}</span>
              <span className="text-xs text-muted-foreground">cán bộ / hội viên</span>
            </div>
            <span className="text-[10px] text-blue-700 font-medium block mt-1">
              Chiếm {residents.length > 0 ? ((allMembersFlat.length / residents.length) * 100).toFixed(1) : "0"}% dân số KP3
            </span>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-300 transition-colors shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">Đa vai trò kiêm nhiệm</span>
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground tracking-tight">{multiRoleCount}</span>
              <span className="text-xs text-muted-foreground">cán bộ kiêm nhiệm</span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium block mt-1">Đảm nhận ≥ 2 vị trí đoàn thể</span>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-300 transition-colors shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">Hồ sơ có Quyết định</span>
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <FileCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground tracking-tight">{totalDecisionsCount}</span>
              <span className="text-xs text-muted-foreground">văn bản pháp lý</span>
            </div>
            <span className="text-[10px] text-purple-700 font-medium block mt-1">Đạt chuẩn Nghị định 80/2021/NĐ-CP</span>
          </CardContent>
        </Card>
      </div>

      {/* Main View Mode Selector: Tabs */}
      <Tabs
        value={activeViewMode}
        onValueChange={(val) => setActiveViewMode(val as "associations" | "multi-role-matrix")}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="associations" className="gap-2 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Danh sách Chi hội & Đoàn thể ({associations.length})</span>
            </TabsTrigger>
            <TabsTrigger value="multi-role-matrix" className="gap-2 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Ma trận Cư dân Đa vai trò ({multiRoleSummary.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeViewMode === "associations" && (
              <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setMemberViewMode("card")}
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                    memberViewMode === "card"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Chế độ Thẻ (Card View)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMemberViewMode("list")}
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                    memberViewMode === "list"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Chế độ Bảng danh sách (Table View)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: ASSOCIATIONS & MEMBERS VIEW */}
        <TabsContent value="associations" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: 22 Associations List */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-3">
              <Card className="shadow-xs">
                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Cơ cấu Chi hội</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-[11px] font-bold">
                      {filteredAssociations.length}/{associations.length}
                    </Badge>
                  </div>

                  {/* Search box for associations */}
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Tìm tên chi hội, chức năng, lãnh đạo..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-[5px] text-xs h-8 px-[5px]"
                    />
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {["Tất cả", ...ASSOCIATION_CATEGORIES].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat);
                          setCurrentPage(1);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer border ${
                          categoryFilter === cat
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-muted/70 text-muted-foreground border-transparent hover:bg-muted"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-2 space-y-1 max-h-[620px] overflow-y-auto">
                  {paginatedAssociations.map((assoc) => {
                    const isSelected = assoc.id === selectedAssociationId;
                    const catBadge = getCategoryBadgeStyle(assoc.category);

                    return (
                      <div
                        key={assoc.id}
                        onClick={() => {
                          setSelectedAssociationId(assoc.id);
                          setMemberSearchTerm("");
                          setMemberRoleFilter("Tất cả");
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 shadow-xs"
                            : "bg-card border-border/70 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${catBadge}`}>
                                {assoc.category}
                              </span>
                            </div>
                            <h3 className={`text-xs font-bold truncate ${isSelected ? "text-emerald-900 dark:text-emerald-300" : "text-foreground"}`}>
                              {assoc.name}
                            </h3>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <span>Trưởng ban:</span>
                              <strong className="text-foreground font-semibold truncate">
                                {assoc.leaderName || "Chưa phân công"}
                              </strong>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge
                              variant={isSelected ? "default" : "secondary"}
                              className={`text-[10px] font-bold ${isSelected ? "bg-emerald-600" : ""}`}
                            >
                              {assoc.members.length} người
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredAssociations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Không tìm thấy chi hội phù hợp
                    </div>
                  )}
                </CardContent>

                {totalAssocPages > 1 && (
                  <CardFooter className="p-2 border-t border-border flex items-center justify-between text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-7 px-2 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Trước
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      Trang {currentPage}/{totalAssocPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage >= totalAssocPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalAssocPages, p + 1))}
                      className="h-7 px-2 text-xs"
                    >
                      Sau <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Right Column: Selected Association Details & Members */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-4">
              {selectedAssociation && (
                <>
                  {/* Association Header Card */}
                  <Card className="shadow-xs border-border">
                    <CardHeader className="p-4 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeStyle(selectedAssociation.category)}`}>
                              {selectedAssociation.category}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              Mã: {selectedAssociation.id}
                            </Badge>
                          </div>
                          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                            {selectedAssociation.name}
                          </h2>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedAssociation.description || "Tổ chức đoàn thể trực thuộc Khu phố 3, Phường An Phú."}
                          </p>
                        </div>

                        {/* Top action buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleOpenAddMemberModal}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span> Thêm Hội viên</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportSelectedToExcel}
                            className="text-xs shadow-xs gap-1 cursor-pointer"
                            title="Xuất danh sách hội viên chi hội ra Excel"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Excel</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditAssoc(selectedAssociation)}
                            className="text-xs p-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Sửa thông tin chi hội"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssocToDelete(selectedAssociation)}
                            className="text-xs p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Giải thể / Xóa Chi hội này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Leader profile block */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-xl border border-border/60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                              Người đứng đầu / Chi hội trưởng
                            </span>
                            <div className="text-xs font-bold text-foreground truncate">
                              {selectedAssociation.leaderName || "Chưa cập nhật"}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              CCCD: {selectedAssociation.leaderCccd || "Chưa có"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                              Quy mô lực lượng
                            </span>
                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              {selectedAssociation.members.length} Cán bộ / Hội viên
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {selectedAssociation.members.filter((m) => m.decisionNumber).length} hồ sơ có Quyết định
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Members List Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
                    <div className="flex flex-1 items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Tìm hội viên theo tên, CCCD, SĐT, chức danh..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                          className="pl-8 pr-[5px] text-xs h-8 px-[5px]"
                        />
                      </div>

                      <select
                        value={memberRoleFilter}
                        onChange={(e) => setMemberRoleFilter(e.target.value)}
                        className="text-xs h-8 px-[5px] bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="Tất cả">Tất cả chức danh</option>
                        {Array.from(new Set(selectedAssociation.members.map((m) => m.role))).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-xs text-muted-foreground font-medium shrink-0">
                      Hiển thị <strong>{filteredMembers.length}</strong> / {selectedAssociation.members.length} hội viên
                    </div>
                  </div>

                  {/* Members Render: Card Mode vs Table Mode */}
                  {filteredMembers.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">Chưa có hội viên trong danh sách này</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        Tổ chức chưa có hội viên hoặc không có thành viên nào khớp với bộ lọc tìm kiếm.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAddMemberModal}
                        className="mt-4 gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Thêm hội viên đầu tiên </span>
                      </Button>
                    </Card>
                  ) : memberViewMode === "card" ? (
                    /* CARD VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredMembers.map((member) => {
                        const hasDecision = Boolean(member.decisionNumber);

                        return (
                          <Card
                            key={member.id}
                            className="shadow-xs hover:border-emerald-300 transition-all border-border"
                          >
                            <CardContent className="p-3.5 space-y-2.5">
                              {/* Member header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                                    {member.fullName
                                      .split(" ")
                                      .slice(-2)
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-foreground truncate">
                                      {member.fullName}
                                    </h4>
                                    <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50/70 border-emerald-200">
                                      {member.role}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedMemberForDetail(member)}
                                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                    title="Xem hồ sơ chi tiết"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEditMember(member)}
                                    className="w-7 h-7 text-muted-foreground hover:text-indigo-600"
                                    title="Sửa thông tin"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setMemberToDelete({ cccd: member.cccd, name: member.fullName })
                                    }
                                    className="w-7 h-7 text-muted-foreground hover:text-rose-600"
                                    title="Xóa khỏi tổ chức"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <Separator />

                              {/* Member info grid */}
                              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                <div className="text-muted-foreground">
                                  <span>CCCD: </span>
                                  <strong className="text-foreground font-mono">{member.cccd}</strong>
                                </div>
                                <div className="text-muted-foreground">
                                  <span>SĐT: </span>
                                  {member.phone ? (
                                    <a
                                      href={`tel:${member.phone}`}
                                      className="text-emerald-700 hover:underline font-mono"
                                    >
                                      {member.phone}
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">Chưa có</span>
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  <span>Năm sinh: </span>
                                  <span className="text-foreground">{member.birthDate || "Chưa có"}</span>
                                </div>
                                <div className="text-muted-foreground">
                                  <span>Tham gia: </span>
                                  <span className="text-foreground">{member.joinDate || "Chưa có"}</span>
                                </div>
                              </div>

                              {/* Legal Decision pill */}
                              {hasDecision ? (
                                <div
                                  onClick={() =>
                                    setViewingDecisionDoc({
                                      decisionNumber: member.decisionNumber || "",
                                      decisionDate: member.decisionDate,
                                      associationName: selectedAssociation.name,
                                      memberName: member.fullName,
                                      memberRole: member.role,
                                      memberCccd: member.cccd,
                                      fileInfo: member.decisionFile
                                    })
                                  }
                                  className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 cursor-pointer hover:bg-emerald-100/60 transition-colors"
                                  title="Nhấn để xem văn bản Quyết định pháp lý"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 font-mono truncate">
                                      QĐ: {member.decisionNumber}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-semibold text-emerald-700 underline shrink-0">
                                    Xem QĐ
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-muted-foreground/70 italic flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Chưa gắn Quyết định bổ nhiệm
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    /* TABLE VIEW */
                    <Card className="shadow-xs overflow-hidden border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-12 text-center text-xs">STT</TableHead>
                            <TableHead className="text-xs">Họ và tên</TableHead>
                            <TableHead className="text-xs">Chức danh</TableHead>
                            <TableHead className="text-xs font-mono">CCCD</TableHead>
                            <TableHead className="text-xs">Điện thoại</TableHead>
                            <TableHead className="text-xs">Ngày tham gia</TableHead>
                            <TableHead className="text-xs">Quyết định</TableHead>
                            <TableHead className="text-right text-xs">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.map((member, idx) => (
                            <TableRow key={member.id} className="text-xs hover:bg-muted/50">
                              <TableCell className="text-center font-medium text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-semibold text-foreground">
                                {member.fullName}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                                  {member.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-[11px] text-muted-foreground">
                                {member.cccd}
                              </TableCell>
                              <TableCell className="font-mono text-[11px]">
                                {member.phone ? (
                                  <a href={`tel:${member.phone}`} className="text-emerald-700 hover:underline">
                                    {member.phone}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-[11px] text-muted-foreground">
                                {member.joinDate || "-"}
                              </TableCell>
                              <TableCell>
                                {member.decisionNumber ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setViewingDecisionDoc({
                                        decisionNumber: member.decisionNumber || "",
                                        decisionDate: member.decisionDate,
                                        associationName: selectedAssociation.name,
                                        memberName: member.fullName,
                                        memberRole: member.role,
                                        memberCccd: member.cccd,
                                        fileInfo: member.decisionFile
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    <FileCheck className="w-3 h-3" />
                                    <span>{member.decisionNumber}</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedMemberForDetail(member)}
                                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                    title="Xem hồ sơ"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEditMember(member)}
                                    className="w-7 h-7 text-muted-foreground hover:text-indigo-600"
                                    title="Sửa"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setMemberToDelete({ cccd: member.cccd, name: member.fullName })
                                    }
                                    className="w-7 h-7 text-muted-foreground hover:text-rose-600"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: MULTI-ROLE CADRE MATRIX */}
        <TabsContent value="multi-role-matrix" className="mt-4 space-y-4">
          <Card className="shadow-xs border-border">
            <CardHeader className="p-4 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs">
                      Ma trận Cán bộ Kiêm nhiệm
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Bảng Tổng Hợp Cư Dân Tham Gia Đa Vai Trò Trong Khối Đoàn Thể
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Theo dõi danh sách cán bộ, cư dân đang đảm nhận từ 1 đến nhiều vị trí tại 22 chi hội, ban ngành thuộc KP3.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportMultiRoleReport}
                    className="text-xs gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Xuất Excel</span>
                  </Button>
                </div>
              </div>

              {/* Toolbar filters */}
              <div className="mt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-border">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Tìm theo tên cư dân, CCCD, chức vụ hoặc chi hội..."
                    value={matrixSearch}
                    onChange={(e) => {
                      setMatrixSearch(e.target.value);
                      setMatrixPage(1);
                    }}
                    className="pl-8 pr-[5px] text-xs h-8 px-[5px]"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    "Tất cả",
                    "Đa nhiệm (≥ 2 vai trò)",
                    "Có vai trò (≥ 1 vai trò)",
                    "Đảng viên",
                    "Chính quyền",
                    "Đoàn thể"
                  ].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setMatrixFilterCategory(filter);
                        setMatrixPage(1);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                        matrixFilterCategory === filter
                          ? "bg-amber-500 text-slate-950 font-bold border-amber-500"
                          : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center text-xs">STT</TableHead>
                    <TableHead className="text-xs">Cư dân / Cán bộ</TableHead>
                    <TableHead className="text-xs font-mono">CCCD</TableHead>
                    <TableHead className="text-xs">Điện thoại</TableHead>
                    <TableHead className="text-center text-xs">Số vai trò</TableHead>
                    <TableHead className="text-xs">Chi tiết chức danh kiêm nhiệm</TableHead>
                    <TableHead className="text-right text-xs">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMultiRoleList.map((item, idx) => {
                    const isMulti = item.rolesCount > 1;

                    return (
                      <TableRow key={item.resident.cccd} className="text-xs hover:bg-muted/50">
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {(matrixPage - 1) * matrixPerPage + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{item.resident.fullName}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                            {item.resident.address}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {item.resident.cccd}
                        </TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {item.resident.phone || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={isMulti ? "default" : "secondary"}
                            className={`text-[10px] font-bold ${
                              isMulti ? "bg-amber-500 hover:bg-amber-600 text-slate-950" : ""
                            }`}
                          >
                            {item.rolesCount} vai trò
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[420px]">
                            {item.roles.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted border border-border"
                              >
                                <strong className="text-foreground">{r.groupName}:</strong>
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{r.role}</span>
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenQuickAssign(item.resident.cccd)}
                            className="text-[11px] h-7 px-2.5 font-semibold text-amber-800 border-amber-300 hover:bg-amber-50"
                          >
                            <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
                            <span>Phân công</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {paginatedMultiRoleList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                        Không có dữ liệu phù hợp với bộ lọc tìm kiếm
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {totalMatrixPages > 1 && (
              <CardFooter className="p-3 border-t border-border flex items-center justify-between text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={matrixPage <= 1}
                  onClick={() => setMatrixPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Trước
                </Button>
                <span className="text-xs text-muted-foreground">
                  Trang {matrixPage} / {totalMatrixPages} ({filteredMultiRoleList.length} cư dân)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={matrixPage >= totalMatrixPages}
                  onClick={() => setMatrixPage((p) => Math.min(totalMatrixPages, p + 1))}
                  className="h-8 px-3 text-xs"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          DIALOG 1: ADD MEMBER TO ASSOCIATION (Extension Component)
         ========================================================================= */}
      <PartyAddMemberDialog
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        selectedAssociation={selectedAssociation}
        residents={residents}
        customRoles={customRoles}
        onAddMember={handleSaveAddMember}
        showToast={showToast}
      />

      {/* =========================================================================
          DIALOG 2: EDIT MEMBER (shadcn Dialog)
         ========================================================================= */}
      <Dialog open={showEditMemberModal} onOpenChange={setShowEditMemberModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-600" />
              <span>Chỉnh sửa thông tin hội viên</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật chức danh, số quyết định pháp lý và thời gian công tác của {editingMember?.fullName}.
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/60 border border-border">
                <div className="font-bold text-foreground text-sm">{editingMember.fullName}</div>
                <div className="text-muted-foreground font-mono text-[11px]">
                  CCCD: {editingMember.cccd} • SĐT: {editingMember.phone || "Chưa có"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Chức vụ / Vai trò</label>
                <select
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value)}
                  className="w-full text-xs h-8 px-[5px] bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {customRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Số Quyết định</label>
                  <Input
                    type="text"
                    value={editMemberDecisionNumber}
                    onChange={(e) => setEditMemberDecisionNumber(e.target.value)}
                    className="text-xs h-8 px-[5px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Ngày Quyết định</label>
                  <Input
                    type="date"
                    value={editMemberDecisionDate}
                    onChange={(e) => setEditMemberDecisionDate(e.target.value)}
                    className="text-xs h-8 px-[5px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Ngày tham gia</label>
                <Input
                  type="date"
                  value={editMemberJoinDate}
                  onChange={(e) => setEditMemberJoinDate(e.target.value)}
                  className="text-xs h-8 px-[5px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditMemberModal(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEditMember}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 3: VIEW DECISION DOCUMENT (Extension Component)
         ========================================================================= */}
      <PartyDecisionDialog
        open={Boolean(viewingDecisionDoc)}
        onOpenChange={(open) => !open && setViewingDecisionDoc(null)}
        decision={viewingDecisionDoc}
      />

      {/* =========================================================================
          DIALOG 4: MEMBER DETAIL DOSSIER (Extension Component)
         ========================================================================= */}
      <PartyMemberDetailDialog
        open={Boolean(selectedMemberForDetail)}
        onOpenChange={(open) => !open && setSelectedMemberForDetail(null)}
        member={selectedMemberForDetail}
        selectedAssociation={selectedAssociation}
        associations={associations}
        residents={residents}
        onEditMember={handleOpenEditMember}
        onViewDecision={(doc) => setViewingDecisionDoc(doc)}
      />

      {/* =========================================================================
          DIALOG 5: QUICK ASSIGN MULTI-ROLE (shadcn Dialog)
         ========================================================================= */}
      <Dialog open={showQuickAssignModal} onOpenChange={setShowQuickAssignModal}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Phân công Đa vai trò / Kiêm nhiệm Chi hội</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập đồng loạt các vai trò công tác cho cư dân trên toàn bộ 22 tổ chức đoàn thể.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Select resident */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                1. Chọn cư dân để phân bổ vai trò
              </label>
              <select
                value={quickAssignResidentCccd}
                onChange={(e) => {
                  const newCccd = e.target.value;
                  setQuickAssignResidentCccd(newCccd);
                  const initialMap: Record<string, { selected: boolean; role: string }> = {};
                  associations.forEach((assoc) => {
                    const mem = assoc.members.find((m) => m.cccd === newCccd);
                    if (mem) {
                      initialMap[assoc.id] = { selected: true, role: mem.role };
                    } else {
                      initialMap[assoc.id] = { selected: false, role: "Hội viên" };
                    }
                  });
                  setQuickAssignGroupSelections(initialMap);
                }}
                className="w-full text-xs h-9 px-[5px] bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {residents.slice(0, 50).map((r) => (
                  <option key={r.cccd} value={r.cccd}>
                    {r.fullName} (CCCD: {r.cccd}) - {r.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist of 22 Associations */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">
                  2. Chọn các tổ chức đoàn thể và chức danh
                </label>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Đã chọn:{" "}
                  <strong>
                    {(Object.values(quickAssignGroupSelections) as { selected: boolean; role: string }[]).filter((g) => g.selected).length}
                  </strong>{" "}
                  / {associations.length} tổ chức
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto border border-border rounded-xl p-2 space-y-1.5 bg-muted/20">
                {associations.map((assoc) => {
                  const current = quickAssignGroupSelections[assoc.id] || {
                    selected: false,
                    role: "Hội viên"
                  };

                  return (
                    <div
                      key={assoc.id}
                      className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                        current.selected
                          ? "bg-amber-50/70 border-amber-300"
                          : "bg-card border-border hover:bg-muted/40"
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={current.selected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setQuickAssignGroupSelections((prev) => ({
                              ...prev,
                              [assoc.id]: {
                                selected: checked,
                                role: current.role || "Hội viên"
                              }
                            }));
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-input"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-foreground truncate">
                            {assoc.name}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {assoc.category}
                          </span>
                        </div>
                      </label>

                      {current.selected && (
                        <div className="shrink-0 w-44">
                          <select
                            value={current.role}
                            onChange={(e) => {
                              const newRole = e.target.value;
                              setQuickAssignGroupSelections((prev) => ({
                                ...prev,
                                [assoc.id]: {
                                  selected: true,
                                  role: newRole
                                }
                              }));
                            }}
                            className="w-full text-[11px] h-7 px-[5px] bg-background border border-input rounded-md text-foreground"
                          >
                            {customRoles.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickAssignModal(false)}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveQuickAssignByResident}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold"
            >
              Lưu phân công
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 6: ROLE MANAGER (shadcn Dialog)
         ========================================================================= */}
      <Dialog open={showRoleManagerModal} onOpenChange={setShowRoleManagerModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Quản lý Danh mục Chức danh</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thêm, đổi tên hoặc xóa các chức danh sử dụng trong hệ thống chi hội.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Add new role */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nhập tên chức danh mới..."
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustomRole(newRoleInput);
                }}
                className="text-xs h-8 px-[5px]"
              />
              <Button
                size="sm"
                onClick={() => handleAddCustomRole(newRoleInput)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
              </Button>
            </div>

            {/* List of roles */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto border border-border rounded-xl p-2 bg-muted/20">
              {customRoles.map((role, idx) => (
                <div
                  key={role}
                  className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs"
                >
                  {editingRoleIndex === idx ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                      <Input
                        type="text"
                        value={editingRoleValue}
                        onChange={(e) => setEditingRoleValue(e.target.value)}
                        className="text-xs h-7 px-[5px]"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEditCustomRole(role, editingRoleValue)}
                        className="h-7 px-2 text-xs bg-emerald-600 text-white"
                      >
                        Lưu
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRoleIndex(null)}
                        className="h-7 px-2 text-xs"
                      >
                        Hủy
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">{role}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRoleIndex(idx);
                            setEditingRoleValue(role);
                          }}
                          className="w-6 h-6 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCustomRole(role)}
                          className="w-6 h-6 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowRoleManagerModal(false)}
              className="text-xs"
            >
              Hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 7: EDIT ASSOCIATION (shadcn Dialog)
         ========================================================================= */}
      <Dialog open={showEditAssocModal} onOpenChange={setShowEditAssocModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-600" />
              <span>Chỉnh sửa thông tin Chi hội</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật tên, khối phân loại và thông tin lãnh đạo chi hội.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Tên Chi hội / Tổ chức</label>
              <Input
                type="text"
                value={editAssocName}
                onChange={(e) => setEditAssocName(e.target.value)}
                className="text-xs h-8 px-[5px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Phân loại Khối</label>
              <select
                value={editAssocCategory}
                onChange={(e) => setEditAssocCategory(e.target.value)}
                className="w-full text-xs h-8 px-[5px] bg-background border border-input rounded-md text-foreground"
              >
                {ASSOCIATION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Mô tả chức năng</label>
              <Input
                type="text"
                value={editAssocDesc}
                onChange={(e) => setEditAssocDesc(e.target.value)}
                className="text-xs h-8 px-[5px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Họ tên Trưởng ban</label>
                <Input
                  type="text"
                  value={editAssocLeaderName}
                  onChange={(e) => setEditAssocLeaderName(e.target.value)}
                  className="text-xs h-8 px-[5px]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">CCCD Trưởng ban</label>
                <Input
                  type="text"
                  value={editAssocLeaderCccd}
                  onChange={(e) => setEditAssocLeaderCccd(e.target.value)}
                  className="text-xs h-8 px-[5px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditAssocModal(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEditAssoc}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DIALOG 8: CONFIRM DELETE MEMBER / ASSOC (shadcn Dialog)
         ========================================================================= */}
      <Dialog
        open={Boolean(memberToDelete || assocToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToDelete(null);
            setAssocToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Xác nhận thao tác xóa</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {memberToDelete
                ? `Bạn có chắc chắn muốn xóa "${memberToDelete.name}" khỏi danh sách hội viên không?`
                : assocToDelete
                ? `Bạn có chắc chắn muốn giải thể / xóa tổ chức "${assocToDelete.name}" không? Thao tác này không thể hoàn tác.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMemberToDelete(null);
                setAssocToDelete(null);
              }}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (memberToDelete) handleDeleteMember();
                if (assocToDelete) handleDeleteAssoc();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Đồng ý xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
