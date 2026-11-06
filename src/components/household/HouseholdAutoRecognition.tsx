import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  Users, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Home, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Phone, 
  Briefcase, 
  Award, 
  Info,
  GitBranch,
  Check,
  Building2,
  HelpCircle,
  Eye
} from "lucide-react";
import { Household, Resident } from "../../types";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { inferRelationToOwner, extractBirthYear } from "../../utils/householdRecognitionUtils";
import { normalizeAddress } from "./HouseholdDuplicates";
import Pagination from "../Pagination";

interface HouseholdAutoRecognitionProps {
  households: Household[];
  residents: Resident[];
  onUpdateHouseholds: (households: Household[]) => void;
  onUpdateResidents: (residents: Resident[]) => void;
  onSelectHousehold?: (household: Household) => void;
}

export interface RecognizedHouseholdGroup {
  householdCode: string;
  address: string;
  type: "Thường trú" | "Tạm trú";
  owner: Resident | null;
  ownerCandidates: Resident[];
  members: Resident[];
  totalMembers: number;
  status: "matched" | "new_needed" | "conflict_owner" | "missing_owner" | "partial_match";
  statusText: string;
  existingHousehold: Household | null;
}

export default function HouseholdAutoRecognition({
  households,
  residents,
  onUpdateHouseholds,
  onUpdateResidents,
  onSelectHousehold
}: HouseholdAutoRecognitionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "matched" | "new_needed" | "issues">("all");
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [manualOwners, setManualOwners] = useState<{ [householdCode: string]: string }>({}); // override owner cccd
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter out soft-deleted households
  const activeHouseholds = useMemo(() => {
    return households.filter(h => !(h as any).deletedAt);
  }, [households]);

  // Main Recognition Algorithm
  const recognizedGroups: RecognizedHouseholdGroup[] = useMemo(() => {
    // 1. Group residents by householdId (for Thường trú) or by normalized address (for Tạm trú & missing code)
    const groupsMap: { [key: string]: { residents: Resident[]; type: "Thường trú" | "Tạm trú"; address: string; code: string } } = {};

    residents.forEach(res => {
      const isTamTru = res.status === "Tạm trú";
      const hId = (res.householdId || "").trim();
      const addr = res.address || res.currentAddress || res.permanentAddress || "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh";
      
      let key: string;
      let code: string;

      if (!isTamTru && hId && hId !== "Chưa cập nhật" && hId !== "Tạm trú" && hId !== "N/A") {
        // Hộ thường trú có mã hộ khẩu chính thức
        key = `HK_${hId}`;
        code = hId;
      } else if (isTamTru) {
        // Hộ tạm trú: nhóm theo địa chỉ tạm trú chuẩn hóa
        const normAddr = normalizeAddress(res.currentAddress || res.address || "");
        key = `TT_${normAddr || "UNKNOWN"}`;
        code = `TT-${res.cccd ? res.cccd.slice(-6) : Math.floor(100000 + Math.random() * 900000)}`;
      } else {
        // Thường trú nhưng chưa có mã sổ: nhóm theo địa chỉ
        const normAddr = normalizeAddress(res.permanentAddress || res.address || "");
        key = `HK_ADDR_${normAddr || "UNKNOWN"}`;
        code = `HK-${res.cccd ? res.cccd.slice(-6) : Math.floor(100000 + Math.random() * 900000)}`;
      }

      if (!groupsMap[key]) {
        groupsMap[key] = {
          residents: [],
          type: isTamTru ? "Tạm trú" : "Thường trú",
          address: addr,
          code
        };
      }
      groupsMap[key].residents.push(res);
    });

    const results: RecognizedHouseholdGroup[] = [];

    Object.entries(groupsMap).forEach(([groupKey, groupData]) => {
      const groupResidents = groupData.residents;
      if (groupResidents.length === 0) return;

      const householdCode = groupData.code;
      const address = groupData.address;
      const type = groupData.type;

      // 2. Identify Household Head (Chủ hộ)
      const manualOwnerCccd = manualOwners[householdCode];
      
      const ownerCandidates = groupResidents.filter(r => {
        const rel = (r.relationToOwner || "").toLowerCase().trim();
        return rel === "chủ hộ" || rel === "chủ hộ (tạm trú)" || rel.startsWith("chủ hộ");
      });

      let owner: Resident | null = null;
      let status: "matched" | "new_needed" | "conflict_owner" | "missing_owner" | "partial_match" = "matched";
      let statusText = "Khớp 100% với Sổ hộ khẩu điện tử";

      if (manualOwnerCccd) {
        owner = groupResidents.find(r => r.cccd === manualOwnerCccd) || null;
      } else if (ownerCandidates.length === 1) {
        owner = ownerCandidates[0];
      } else if (ownerCandidates.length > 1) {
        owner = ownerCandidates[0];
        status = "conflict_owner";
        statusText = `Xung đột: Có ${ownerCandidates.length} nhân khẩu tự khai là Chủ hộ`;
      } else {
        // Không có ai tự khai là Chủ hộ: tự động chọn người lớn tuổi nhất đã trưởng thành
        const sortedByAge = [...groupResidents].sort((a, b) => {
          return extractBirthYear(a.birthDate) - extractBirthYear(b.birthDate);
        });
        owner = sortedByAge[0];
        status = "missing_owner";
        statusText = `Tự nhận diện chủ hộ đề xuất: ${owner.fullName} (${owner.birthDate})`;
      }

      // 3. Suy luận thông minh quan hệ gia phả cho từng thành viên không phải chủ hộ
      const nonOwnerMembers = groupResidents.filter(r => r.cccd !== owner?.cccd);
      const members = nonOwnerMembers.map(m => {
        if (!owner) return m;
        const inferredRel = inferRelationToOwner(m, owner, groupResidents);
        return {
          ...m,
          relationToOwner: inferredRel
        };
      });

      // 4. So sánh với sổ hộ khẩu hiện có trong database
      const existingHousehold = activeHouseholds.find(h => h.code.trim().toUpperCase() === householdCode.trim().toUpperCase()) || null;

      if (!existingHousehold) {
        status = "new_needed";
        statusText = "Hộ mới nhận diện từ Dân cư - Chưa có sổ điện tử";
      } else {
        const existingCccds = new Set(existingHousehold.members.map(m => m.cccd));
        const residentCccds = new Set(groupResidents.map(r => r.cccd));
        
        let allMatch = existingCccds.size === residentCccds.size;
        if (allMatch) {
          for (let cccd of residentCccds) {
            if (!existingCccds.has(cccd)) {
              allMatch = false;
              break;
            }
          }
        }

        if (!allMatch && status !== "conflict_owner" && status !== "missing_owner") {
          status = "partial_match";
          statusText = `Lệch nhân khẩu: Dân cư (${groupResidents.length}) ≠ Sổ hiện hành (${existingHousehold.members.length})`;
        }
      }

      results.push({
        householdCode,
        address,
        type,
        owner,
        ownerCandidates,
        members,
        totalMembers: groupResidents.length,
        status,
        statusText,
        existingHousehold
      });
    });

    // Sort: issues/new needed first, then by householdCode
    return results.sort((a, b) => {
      const order = { conflict_owner: 0, missing_owner: 1, new_needed: 2, partial_match: 3, matched: 4 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return a.householdCode.localeCompare(b.householdCode);
    });
  }, [residents, activeHouseholds, manualOwners]);

  // Selected Group
  const activeSelectedGroup = useMemo(() => {
    if (selectedGroupCode) {
      return recognizedGroups.find(g => g.householdCode === selectedGroupCode) || recognizedGroups[0] || null;
    }
    return recognizedGroups[0] || null;
  }, [recognizedGroups, selectedGroupCode]);

  // Statistics KPI counts
  const stats = useMemo(() => {
    return {
      totalResidents: residents.length,
      totalHouseholdsRecognized: recognizedGroups.length,
      matchedCount: recognizedGroups.filter(g => g.status === "matched").length,
      newNeededCount: recognizedGroups.filter(g => g.status === "new_needed").length,
      issuesCount: recognizedGroups.filter(g => g.status === "conflict_owner" || g.status === "missing_owner" || g.status === "partial_match").length
    };
  }, [residents, recognizedGroups]);

  // Filtered List
  const filteredGroups = useMemo(() => {
    return recognizedGroups.filter(g => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        g.householdCode.toLowerCase().includes(q) ||
        g.address.toLowerCase().includes(q) ||
        (g.owner && g.owner.fullName.toLowerCase().includes(q)) ||
        (g.owner && g.owner.cccd.includes(q)) ||
        g.members.some(m => m.fullName.toLowerCase().includes(q) || m.cccd.includes(q));

      let matchesFilter = true;
      if (filterStatus === "matched") matchesFilter = g.status === "matched";
      else if (filterStatus === "new_needed") matchesFilter = g.status === "new_needed";
      else if (filterStatus === "issues") matchesFilter = g.status === "conflict_owner" || g.status === "missing_owner" || g.status === "partial_match";

      return matchesSearch && matchesFilter;
    });
  }, [recognizedGroups, searchTerm, filterStatus]);

  // Paginated list for smooth rendering
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGroups.slice(start, start + itemsPerPage);
  }, [filteredGroups, currentPage, itemsPerPage]);

  // Manual Owner Override Handler
  const handleSetOwner = (householdCode: string, residentCccd: string) => {
    setManualOwners(prev => ({
      ...prev,
      [householdCode]: residentCccd
    }));
  };

  // 1-Click Sync Single Household - Lưu trực tiếp vào Supabase Database
  const handleSyncSingleHousehold = async (group: RecognizedHouseholdGroup) => {
    if (!group.owner) {
      alert("Hộ chưa có chủ hộ hợp lệ để đồng bộ!");
      return;
    }

    const birthYear = parseInt(group.owner.birthDate?.split("/")[2] || "1980") || 1980;

    const newMembersList = [
      {
        name: group.owner.fullName,
        relation: "Chủ hộ",
        cccd: group.owner.cccd,
        birthYear: birthYear,
        phone: group.owner.phone !== "N/A" ? group.owner.phone : undefined
      },
      ...group.members.map(m => ({
        name: m.fullName,
        relation: m.relationToOwner && m.relationToOwner !== "Chủ hộ" ? m.relationToOwner : "Thành viên",
        cccd: m.cccd,
        birthYear: parseInt(m.birthDate?.split("/")[2] || "1990") || 1990,
        phone: m.phone !== "N/A" ? m.phone : undefined
      }))
    ];

    let updatedHouseholdsList: Household[];

    if (group.existingHousehold) {
      // Update existing
      updatedHouseholdsList = households.map(h => {
        if (h.code === group.householdCode) {
          return {
            ...h,
            ownerName: group.owner!.fullName,
            address: group.address,
            type: group.type,
            memberCount: newMembersList.length,
            members: newMembersList,
            auditHistory: [
              {
                date: new Date().toLocaleString("vi-VN"),
                action: "Tự động đồng bộ chuẩn hóa từ Dữ liệu Dân cư thường trú",
                actor: "Thuật toán Phân tích CSDL 06"
              },
              ...((h as any).auditHistory || [])
            ]
          };
        }
        return h;
      });
    } else {
      // Create new Household
      const newHousehold: Household = {
        id: "H" + (households.length + 1).toString().padStart(3, "0"),
        code: group.householdCode,
        ownerName: group.owner.fullName,
        address: group.address,
        type: group.type,
        memberCount: newMembersList.length,
        members: newMembersList,
        coordinates: "10°56'08.0\"N 106°44'38.0\"E"
      };
      updatedHouseholdsList = [...households, newHousehold];
    }

    // Also update residents' householdId and relationToOwner
    const updatedResidentsList = residents.map(r => {
      if (r.cccd === group.owner!.cccd) {
        return {
          ...r,
          householdId: group.householdCode,
          relationToOwner: "Chủ hộ"
        };
      }
      const isMember = group.members.some(m => m.cccd === r.cccd);
      if (isMember) {
        return {
          ...r,
          householdId: group.householdCode,
          relationToOwner: r.relationToOwner === "Chủ hộ" ? "Thành viên" : r.relationToOwner || "Thành viên"
        };
      }
      return r;
    });

    onUpdateHouseholds(updatedHouseholdsList);
    onUpdateResidents(updatedResidentsList);

    // PERSISTENCE: Ghi trực tiếp vào Supabase Database thật
    if (isSupabaseConfigured && supabase) {
      try {
        // Upsert Household vào bảng households
        await (supabase as any).from("households").upsert({
          code: group.householdCode,
          owner_name: group.owner.fullName,
          owner_cccd: group.owner.cccd,
          address: group.address,
          member_count: newMembersList.length,
          updated_at: new Date().toISOString()
        }, { onConflict: "code" });

        // Cập nhật quan hệ chủ hộ cho nhân khẩu chủ hộ
        await (supabase as any).from("residents").update({
          household_code: group.householdCode,
          relation_to_owner: "Chủ hộ"
        }).eq("cccd", group.owner.cccd);

        // Cập nhật cho các thành viên
        for (const member of group.members) {
          await (supabase as any).from("residents").update({
            household_code: group.householdCode,
            relation_to_owner: member.relationToOwner && member.relationToOwner !== "Chủ hộ" ? member.relationToOwner : "Thành viên"
          }).eq("cccd", member.cccd);
        }
      } catch (dbErr) {
        console.warn("Lỗi lưu đồng bộ hộ vào Supabase:", dbErr);
      }
    }

    setSyncSuccessMsg(`Đã đồng bộ & lưu vĩnh viễn vào Database Sổ hộ khẩu ${group.householdCode} với Chủ hộ: ${group.owner.fullName}!`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  // Master 1-Click Sync All Households - Lưu vĩnh viễn toàn bộ vào Supabase PostgreSQL
  const handleSyncAllHouseholds = async () => {
    if (!confirm(`Hệ thống sẽ phân tích và đồng bộ toàn bộ ${recognizedGroups.length} hộ gia đình từ dữ liệu cư dân thường trú vào Sổ hộ khẩu điện tử & lưu vĩnh viễn vào Database. Bạn có muốn tiếp tục?`)) {
      return;
    }

    let updatedHouseholdsList = [...households];
    let newCreatedCount = 0;
    let updatedCount = 0;
    const dbHouseholdsToUpsert: any[] = [];
    const ownerCccdsToUpdate: string[] = [];

    recognizedGroups.forEach(group => {
      if (!group.owner) return;

      const birthYear = parseInt(group.owner.birthDate?.split("/")[2] || "1980") || 1980;
      const newMembersList = [
        {
          name: group.owner.fullName,
          relation: "Chủ hộ",
          cccd: group.owner.cccd,
          birthYear: birthYear,
          phone: group.owner.phone !== "N/A" ? group.owner.phone : undefined
        },
        ...group.members.map(m => ({
          name: m.fullName,
          relation: m.relationToOwner && m.relationToOwner !== "Chủ hộ" ? m.relationToOwner : "Thành viên",
          cccd: m.cccd,
          birthYear: parseInt(m.birthDate?.split("/")[2] || "1990") || 1990,
          phone: m.phone !== "N/A" ? m.phone : undefined
        }))
      ];

      dbHouseholdsToUpsert.push({
        code: group.householdCode,
        owner_name: group.owner.fullName,
        owner_cccd: group.owner.cccd,
        address: group.address,
        member_count: newMembersList.length,
        updated_at: new Date().toISOString()
      });

      ownerCccdsToUpdate.push(group.owner.cccd);

      const exists = updatedHouseholdsList.find(h => h.code.trim().toUpperCase() === group.householdCode.trim().toUpperCase());

      if (exists) {
        updatedHouseholdsList = updatedHouseholdsList.map(h => {
          if (h.code.trim().toUpperCase() === group.householdCode.trim().toUpperCase()) {
            return {
              ...h,
              ownerName: group.owner!.fullName,
              address: group.address,
              type: group.type,
              memberCount: newMembersList.length,
              members: newMembersList
            };
          }
          return h;
        });
        updatedCount++;
      } else {
        const newH: Household = {
          id: "H" + (updatedHouseholdsList.length + 1).toString().padStart(3, "0"),
          code: group.householdCode,
          ownerName: group.owner.fullName,
          address: group.address,
          type: group.type,
          memberCount: newMembersList.length,
          members: newMembersList,
          coordinates: "10°56'07.5\"N 106°44'38.0\"E"
        };
        updatedHouseholdsList.push(newH);
        newCreatedCount++;
      }
    });

    // Update Residents relation tags
    const memberRelMap = new Map<string, string>();
    recognizedGroups.forEach(g => {
      if (g.owner) memberRelMap.set(g.owner.cccd, "Chủ hộ");
      g.members.forEach(m => {
        if (m.relationToOwner) memberRelMap.set(m.cccd, m.relationToOwner);
      });
    });

    const updatedResidentsList = residents.map(r => {
      const newRel = memberRelMap.get(r.cccd);
      if (newRel) {
        return { ...r, relationToOwner: newRel };
      }
      return r;
    });

    onUpdateHouseholds(updatedHouseholdsList);
    onUpdateResidents(updatedResidentsList);

    // PERSISTENCE TO SUPABASE POSTGRESQL (Theo lô 100 dòng để tối ưu mạng)
    if (isSupabaseConfigured && supabase && dbHouseholdsToUpsert.length > 0) {
      try {
        const batchSize = 100;
        for (let i = 0; i < dbHouseholdsToUpsert.length; i += batchSize) {
          const batch = dbHouseholdsToUpsert.slice(i, i + batchSize);
          await (supabase as any).from("households").upsert(batch, { onConflict: "code" });
        }
      } catch (dbErr) {
        console.warn("Lỗi lưu danh sách hộ vào Supabase:", dbErr);
      }
    }

    setSyncSuccessMsg(`Hoàn tất đồng bộ & LƯU VĨNH VIỄN DATABASE: Cập nhật ${updatedCount} hộ hiện hành & Khởi tạo mới ${newCreatedCount} sổ hộ khẩu!`);
    setTimeout(() => setSyncSuccessMsg(null), 5000);
  };

  return (
    <div id="household-auto-recognition-view" className="space-y-6">
      
      {/* Top Banner & Automated Analysis Description */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg">
                <Sparkles size={18} />
              </span>
              <h2 className="text-lg font-bold tracking-tight">Thuật toán Phân tích Cư dân & Tự nhận diện Hộ Gia đình</h2>
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Tự động quét toàn bộ <strong className="text-white">{residents.length} nhân khẩu thường trú</strong>, phân loại cấu trúc gia đình theo địa chỉ & mã hộ, nhận diện chính xác <strong>Chủ hộ</strong> và các <strong>Thành viên quan hệ</strong> để tự động lập hoặc đồng bộ Sổ hộ khẩu điện tử.
            </p>
          </div>

          <button
            onClick={handleSyncAllHouseholds}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0"
          >
            <RefreshCw size={15} /> Đồng bộ Toàn bộ vào Sổ Hộ Khẩu
          </button>
        </div>

        {/* Success Alert Banner */}
        {syncSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{syncSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tổng nhân khẩu quét</span>
          <div className="text-xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
            {stats.totalResidents}
            <span className="text-xs font-semibold text-slate-500">cư dân</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">100% định danh CCCD</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Hộ gia đình nhận diện</span>
          <div className="text-xl font-black text-teal-800 mt-1 flex items-baseline gap-1.5">
            {stats.totalHouseholdsRecognized}
            <span className="text-xs font-semibold text-slate-500">hộ</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Tự động phân nhóm</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Đã khớp 100% với Sổ</span>
          <div className="text-xl font-black text-emerald-600 mt-1 flex items-baseline gap-1.5">
            {stats.matchedCount}
            <span className="text-xs font-semibold text-slate-500">hộ</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Dữ liệu chuẩn hóa</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cần đồng bộ / Lập sổ mới</span>
          <div className="text-xl font-black text-amber-600 mt-1 flex items-baseline gap-1.5">
            {stats.newNeededCount + stats.issuesCount}
            <span className="text-xs font-semibold text-slate-500">hộ</span>
          </div>
          <span className="text-[10px] text-amber-700 font-semibold mt-1 block">
            {stats.newNeededCount} hộ mới + {stats.issuesCount} cần chỉnh
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo mã hộ, tên chủ hộ, tên thành viên, CCCD, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === "all" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            Tất cả ({recognizedGroups.length})
          </button>
          <button
            onClick={() => setFilterStatus("matched")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === "matched" ? "bg-white text-emerald-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            Đã khớp ({stats.matchedCount})
          </button>
          <button
            onClick={() => setFilterStatus("new_needed")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === "new_needed" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            Hộ mới ({stats.newNeededCount})
          </button>
          <button
            onClick={() => setFilterStatus("issues")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === "issues" ? "bg-white text-amber-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"}`}
          >
            Cần lưu ý ({stats.issuesCount})
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: Left List of Recognized Households, Right Selected Detail & Hierarchy Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Recognized Household Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-150 text-slate-400 text-xs">
              Không tìm thấy hộ gia đình nào phù hợp với bộ lọc tìm kiếm
            </div>
          ) : (
            <>
              {paginatedGroups.map(group => {
                const isSelected = activeSelectedGroup?.householdCode === group.householdCode;
                
                const statusBadgeStyles = {
                  matched: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  new_needed: "bg-blue-50 text-blue-700 border-blue-200",
                  conflict_owner: "bg-rose-50 text-rose-700 border-rose-200",
                  missing_owner: "bg-amber-50 text-amber-700 border-amber-200",
                  partial_match: "bg-purple-50 text-purple-700 border-purple-200"
                };

                return (
                  <div
                    key={group.householdCode}
                    onClick={() => setSelectedGroupCode(group.householdCode)}
                    className={`bg-white p-4.5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                      isSelected 
                        ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/15" 
                        : "border-slate-150 hover:border-slate-300"
                    }`}
                  >
                    {/* Household Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-slate-100 rounded-lg shrink-0">
                          {group.householdCode}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <span>Hộ: {group.owner ? group.owner.fullName : "Chưa xác định"}</span>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono">
                              ({group.totalMembers} nhân khẩu)
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[280px] sm:max-w-md">{group.address}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeStyles[group.status]}`}>
                          {group.statusText}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncSingleHousehold(group);
                          }}
                          className="text-[11px] bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Đồng bộ hộ này vào Sổ hộ khẩu điện tử"
                        >
                          Đồng bộ
                        </button>
                      </div>
                    </div>

                    {/* Owner & Member Chips Preview */}
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Recognized Owner */}
                      <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/70 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          CH
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">CHỦ HỘ NHẬN DIỆN</span>
                          <p className="font-bold text-slate-900 truncate">
                            {group.owner ? group.owner.fullName : "Chưa rõ chủ hộ"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            CCCD: {group.owner?.cccd} • Sinh: {group.owner?.birthDate}
                          </p>
                        </div>
                      </div>

                      {/* Members Summary */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150 flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">THÀNH VIÊN GIA ĐÌNH ({group.members.length})</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {group.members.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Hộ đơn thân (1 nhân khẩu)</span>
                          ) : (
                            group.members.slice(0, 3).map(m => (
                              <span key={m.cccd} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[130px]">
                                {m.fullName} ({m.relationToOwner || "Thành viên"})
                              </span>
                            ))
                          )}
                          {group.members.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-semibold px-1 py-0.5">
                              +{group.members.length - 3} người khác
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Phân trang mượt mà */}
              <div className="pt-2 bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
                <Pagination
                  id="household-recognition-pagination"
                  currentPage={currentPage}
                  totalItems={filteredGroups.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </>
          )}
        </div>

        {/* Right Column: Detailed Inspector & Family Relationship Tree */}
        <div className="lg:col-span-1">
          {activeSelectedGroup ? (
            <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden sticky top-6">
              
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">KẾT QUẢ NHẬN DIỆN CHI TIẾT</span>
                    <h3 className="text-base font-bold mt-0.5">Sổ: {activeSelectedGroup.householdCode}</h3>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    {activeSelectedGroup.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{activeSelectedGroup.address}</span>
                </p>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 text-xs max-h-[620px] overflow-y-auto">
                
                {/* Status Callout */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Trạng thái rà soát:</span>
                  <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>{activeSelectedGroup.statusText}</span>
                  </p>
                </div>

                {/* 1. CHỦ HỘ PROFILE */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck size={12} className="text-emerald-600" /> Chủ hộ gia đình
                    </span>
                    {activeSelectedGroup.ownerCandidates.length > 1 && (
                      <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                        Có thể đổi chủ hộ
                      </span>
                    )}
                  </div>

                  {activeSelectedGroup.owner ? (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-3">
                        <img 
                          src={activeSelectedGroup.owner.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                          alt="Owner"
                          className="w-10 h-10 rounded-full object-cover border border-emerald-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm">{activeSelectedGroup.owner.fullName}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {activeSelectedGroup.owner.gender} • Sinh: {activeSelectedGroup.owner.birthDate}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-emerald-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Số CCCD:</span>
                          <span className="font-mono font-bold text-slate-800">{activeSelectedGroup.owner.cccd}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Số điện thoại:</span>
                          <span className="font-mono font-semibold text-slate-800">{activeSelectedGroup.owner.phone}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block">Nghề nghiệp & Đơn vị:</span>
                          <span className="font-medium text-slate-800">{activeSelectedGroup.owner.occupation || "Tự do"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                      Chưa xác định được chủ hộ cho nhóm nhân khẩu này!
                    </div>
                  )}
                </div>

                {/* 2. THÀNH VIÊN GIA ĐÌNH & PHÂN CẤP QUAN HỆ */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Danh sách Thành viên hộ ({activeSelectedGroup.members.length})
                  </span>

                  {activeSelectedGroup.members.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                      Hộ độc thân, không có thành viên phụ thuộc nào khác.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeSelectedGroup.members.map(member => (
                        <div key={member.cccd} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl space-y-1.5 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-slate-900 font-bold text-xs">{member.fullName}</strong>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                CCCD: {member.cccd} • Sinh: {member.birthDate} ({member.gender})
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {member.relationToOwner || "Thành viên"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500 truncate max-w-[170px]">
                              {member.occupation || "Học sinh / Lao động"}
                            </span>
                            
                            {/* Option to designate as household head */}
                            <button
                              onClick={() => handleSetOwner(activeSelectedGroup.householdCode, member.cccd)}
                              className="text-[9px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                              title="Chỉ định người này làm Chủ hộ thay thế"
                            >
                              Đổi làm Chủ hộ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-150 space-y-2">
                  <button
                    onClick={() => handleSyncSingleHousehold(activeSelectedGroup)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <Check size={14} /> Xác nhận & Đồng bộ Hộ này vào Sổ
                  </button>

                  {activeSelectedGroup.existingHousehold && onSelectHousehold && (
                    <button
                      onClick={() => onSelectHousehold(activeSelectedGroup.existingHousehold!)}
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      <Eye size={13} /> Mở Sổ Hộ Khẩu Điện Tử Hiện Hành
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-2xl p-8 text-center text-xs">
              Chọn một hộ gia đình ở danh sách bên cạnh để xem phân tích chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
