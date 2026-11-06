import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Home,
  Users,
  Plus,
  Save,
  MapPin,
  Sparkles,
  ShieldCheck,
  Building2,
  Compass,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Phone,
  CreditCard,
  Briefcase,
  Trash2,
  Clock,
  UserPlus,
  Check
} from "lucide-react";
import { Household, Resident } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Separator } from "../components/ui/separator";
import { navigate, ROUTES } from "../routes";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  decimalToDMS,
  parseCoordinates as parseGisCoords,
  generateDefaultCoordinatesForAddress
} from "../utils/gisUtils";

export interface TempMember {
  name: string;
  relation: string;
  cccd: string;
  birthYear: number;
  phone?: string;
  gender?: "Nam" | "Nữ";
  occupation?: string;
}

export interface AddHouseholdPageProps {
  households?: Household[];
  residents?: Resident[];
  currentUser?: any;
  onAdd?: (newHousehold: Household) => void;
  onUpdateHouseholds?: React.Dispatch<React.SetStateAction<Household[]>> | ((households: Household[]) => void);
  onUpdateResidents?: React.Dispatch<React.SetStateAction<Resident[]>> | ((residents: Resident[]) => void);
  onBack?: () => void;
  showToast?: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function AddHouseholdPage({
  households = [],
  residents = [],
  currentUser,
  onAdd,
  onUpdateHouseholds,
  onUpdateResidents,
  onBack,
  showToast
}: AddHouseholdPageProps) {
  // Navigation back handler
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD_HOUSEHOLDS);
    }
  };

  // Internal toast helper
  const notify = (msg: string, type: "success" | "info" | "error" | "warning" = "success") => {
    if (showToast) {
      showToast(msg, type);
    }
  };

  // Suggest next household code (e.g. HK-309 or similar)
  const suggestedCode = useMemo(() => {
    const existingCodes = households
      .map((h) => {
        const match = h.code.match(/HK-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n) && n > 0);

    const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 300;
    return `HK-${(maxCode + 1).toString().padStart(3, "0")}`;
  }, [households]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"basic" | "location" | "members" | "notes">("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states: Thông tin sổ & Chủ hộ
  const [code, setCode] = useState(suggestedCode);
  const [type, setType] = useState<"Thường trú" | "Tạm trú">("Thường trú");
  const [ownerName, setOwnerName] = useState("");
  const [ownerGender, setOwnerGender] = useState<"Nam" | "Nữ">("Nam");
  const [ownerBirthDate, setOwnerBirthDate] = useState("15/05/1980");
  const [ownerCccd, setOwnerCccd] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerOccupation, setOwnerOccupation] = useState("Kinh doanh tự do");

  // Form states: Địa chỉ & Tọa độ GIS
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [parsedGPS, setParsedGPS] = useState<{ lat: number; lng: number; formatted: string } | null>(null);

  // Form states: Thành viên cùng hộ
  const [members, setMembers] = useState<TempMember[]>([]);

  // Sub-form for adding member
  const [memName, setMemName] = useState("");
  const [memRelation, setMemRelation] = useState("Vợ");
  const [memCccd, setMemCccd] = useState("");
  const [memBirthYear, setMemBirthYear] = useState<number | "">("");
  const [memPhone, setMemPhone] = useState("");
  const [memGender, setMemGender] = useState<"Nam" | "Nữ">("Nữ");
  const [memOccupation, setMemOccupation] = useState("Thành viên gia đình");

  // Form states: Ghi chú tư pháp
  const [notes, setNotes] = useState("");
  const [recordingOfficer, setRecordingOfficer] = useState(currentUser?.name || "Cán bộ Tư pháp Hộ tịch KP3");
  const [registrationDate, setRegistrationDate] = useState(new Date().toLocaleDateString("vi-VN"));

  // Coordinate Input change live parser
  const handleCoordChange = (val: string) => {
    setCoordinates(val);
    if (!val) {
      setParsedGPS(null);
      return;
    }
    const parts = val.split(",");
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
        setParsedGPS({ lat, lng, formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        return;
      }
    }
    const parsed = parseGisCoords(val);
    if (parsed) {
      setParsedGPS({ lat: parsed.lat, lng: parsed.lng, formatted: `${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}` });
    } else {
      setParsedGPS(null);
    }
  };

  // Auto-detect coordinate from address
  const handleAutoDetectCoords = () => {
    if (!address) {
      notify("Vui lòng nhập địa chỉ trước khi tự động nhận diện tọa độ!", "warning");
      return;
    }
    const auto = generateDefaultCoordinatesForAddress(address, code || "HK-001");
    setCoordinates(auto.dms);
    const parsed = parseGisCoords(auto.dms);
    if (parsed) {
      setParsedGPS({ lat: parsed.lat, lng: parsed.lng, formatted: `${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}` });
    }
    notify(`Đã tự động tính toán tọa độ theo vị trí: ${auto.dms}`, "info");
  };

  // Add temp member to list
  const handleAddMember = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!memName.trim()) {
      notify("Vui lòng nhập họ và tên thành viên!", "error");
      return;
    }
    if (!memCccd.trim()) {
      notify("Vui lòng nhập số CCCD của thành viên!", "error");
      return;
    }
    if (!memBirthYear) {
      notify("Vui lòng nhập năm sinh của thành viên!", "error");
      return;
    }

    // Check duplicate CCCD in member list or owner
    if (memCccd.trim() === ownerCccd.trim()) {
      notify("Số CCCD của thành viên trùng với CCCD của Chủ hộ!", "error");
      return;
    }
    if (members.some((m) => m.cccd.trim() === memCccd.trim())) {
      notify("Số CCCD này đã được thêm vào danh sách thành viên!", "error");
      return;
    }

    const newM: TempMember = {
      name: memName.trim(),
      relation: memRelation,
      cccd: memCccd.trim(),
      birthYear: Number(memBirthYear),
      phone: memPhone.trim() || undefined,
      gender: memGender,
      occupation: memOccupation.trim()
    };

    setMembers([...members, newM]);
    setMemName("");
    setMemCccd("");
    setMemBirthYear("");
    setMemPhone("");
    notify(`Đã thêm thành viên: ${newM.name} (${newM.relation})`, "success");
  };

  // Remove member from list
  const handleRemoveMember = (idx: number) => {
    const target = members[idx];
    setMembers(members.filter((_, i) => i !== idx));
    notify(`Đã bỏ thành viên: ${target.name}`, "info");
  };

  // Submit complete household creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!code.trim()) {
      notify("Vui lòng nhập mã sổ hộ khẩu (HK-XXX)!", "error");
      setActiveTab("basic");
      return;
    }
    if (!ownerName.trim()) {
      notify("Vui lòng nhập họ và tên Chủ hộ!", "error");
      setActiveTab("basic");
      return;
    }
    if (!address.trim()) {
      notify("Vui lòng nhập địa chỉ đăng ký cư trú của hộ!", "error");
      setActiveTab("location");
      return;
    }

    const primaryOwnerCccd = ownerCccd.trim() || `079${Math.floor(100000000 + Math.random() * 900000000)}`;
    const finalCoordinates = parsedGPS ? parsedGPS.formatted : coordinates.trim();

    // Calculate birth year of owner
    let ownerYear = 1980;
    if (ownerBirthDate.includes("/")) {
      const parts = ownerBirthDate.split("/");
      if (parts.length === 3) {
        ownerYear = parseInt(parts[2], 10) || 1980;
      }
    } else if (ownerBirthDate.length === 4) {
      ownerYear = parseInt(ownerBirthDate, 10) || 1980;
    }

    setIsSubmitting(true);

    try {
      // 1. Build complete Household object
      const newHouseholdId = "H" + (households.length + 1).toString().padStart(3, "0");
      const householdCode = code.trim().toUpperCase();

      const newHousehold: Household = {
        id: newHouseholdId,
        code: householdCode,
        ownerName: ownerName.trim(),
        address: address.trim(),
        type,
        memberCount: members.length + 1,
        coordinates: finalCoordinates || undefined,
        members: [
          {
            name: ownerName.trim(),
            relation: "Chủ hộ",
            cccd: primaryOwnerCccd,
            birthYear: ownerYear,
            phone: ownerPhone.trim() || undefined
          },
          ...members.map((m) => ({
            name: m.name,
            relation: m.relation,
            cccd: m.cccd,
            birthYear: m.birthYear,
            phone: m.phone
          }))
        ]
      };

      // 2. Build Resident objects for owner and members
      const newResidents: Resident[] = [
        {
          id: "R" + Math.floor(1000 + Math.random() * 9000),
          fullName: ownerName.trim(),
          gender: ownerGender,
          birthDate: ownerBirthDate.trim(),
          cccd: primaryOwnerCccd,
          phone: ownerPhone.trim() || "N/A",
          status: type,
          occupation: ownerOccupation.trim() || "Kinh doanh tự do",
          address: address.trim(),
          householdId: householdCode,
          relationToOwner: "Chủ hộ",
          permanentAddress: type === "Thường trú" ? address.trim() : "",
          currentAddress: address.trim(),
          managementStatus: "Bình thường",
          joinDate: registrationDate
        },
        ...members.map((m) => ({
          id: "R" + Math.floor(1000 + Math.random() * 9000),
          fullName: m.name,
          gender: (m.gender || (m.relation === "Vợ" || m.relation === "Con gái" || m.relation === "Mẹ" ? "Nữ" : "Nam")) as "Nam" | "Nữ",
          birthDate: `01/01/${m.birthYear}`,
          cccd: m.cccd,
          phone: m.phone || "N/A",
          status: type,
          occupation: m.occupation || "Thành viên gia đình",
          address: address.trim(),
          householdId: householdCode,
          relationToOwner: m.relation,
          permanentAddress: type === "Thường trú" ? address.trim() : "",
          currentAddress: address.trim(),
          managementStatus: "Bình thường",
          joinDate: registrationDate
        }))
      ];

      // 3. Direct persist to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          // Insert Household row
          const { error: hErr } = await (supabase as any).from("households").insert([
            {
              id: newHousehold.id,
              code: newHousehold.code,
              owner_name: newHousehold.ownerName,
              address: newHousehold.address,
              member_count: newHousehold.memberCount,
              coordinates: newHousehold.coordinates || null,
              type: newHousehold.type
            }
          ]);
          if (hErr) {
            console.warn("Supabase insert household warning:", hErr);
          }

          // Insert Residents rows
          const residentRows = newResidents.map((r) => ({
            id: r.id,
            full_name: r.fullName,
            gender: r.gender,
            birth_date: r.birthDate,
            cccd: r.cccd,
            phone: r.phone,
            status: r.status,
            occupation: r.occupation,
            address: r.address,
            household_id: r.householdId,
            relation_to_owner: r.relationToOwner,
            permanent_address: r.permanentAddress || null,
            current_address: r.currentAddress || null,
            management_status: r.managementStatus || "Bình thường"
          }));

          const { error: rErr } = await (supabase as any).from("residents").insert(residentRows);
          if (rErr) {
            console.warn("Supabase insert residents warning:", rErr);
          }
        } catch (dbErr) {
          console.warn("Supabase DB exception:", dbErr);
        }
      }

      // 4. Update local state
      if (onAdd) {
        onAdd(newHousehold);
      } else if (onUpdateHouseholds) {
        if (typeof onUpdateHouseholds === "function") {
          (onUpdateHouseholds as any)((prev: Household[]) => [newHousehold, ...prev]);
        }
      }

      if (onUpdateResidents) {
        if (typeof onUpdateResidents === "function") {
          (onUpdateResidents as any)((prev: Resident[]) => [...newResidents, ...prev]);
        }
      }

      notify(`Lập Sổ Hộ Khẩu ${newHousehold.code} (${newHousehold.ownerName}) thành công!`, "success");

      // Redirect back to households list
      handleBack();
    } catch (err: any) {
      console.error("Lỗi khi lập sổ hộ khẩu:", err);
      notify(`Lỗi khi lưu sổ hộ khẩu: ${err?.message || "Đã xảy ra lỗi"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={15} />
            <span>Quay lại Danh Sách</span>
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="hover:text-slate-800 cursor-pointer" onClick={() => navigate(ROUTES.DASHBOARD)}>
              Cán bộ
            </span>
            <span>/</span>
            <span className="hover:text-slate-800 cursor-pointer" onClick={handleBack}>
              Sổ Hộ Khẩu
            </span>
            <span>/</span>
            <span className="font-semibold text-slate-900">Lập Sổ Mới</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={isSubmitting}
            className="text-xs font-semibold cursor-pointer"
          >
            Hủy bỏ
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSubmitting ? "Đang lưu..." : "Lưu & Khởi Tạo Sổ"}</span>
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="border-border bg-white shadow-xs rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="success" className="gap-1.5 px-3 py-1 font-semibold text-xs shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Chuẩn CSDL Quốc Gia 06
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground border-slate-200">
              Khu phố 3, Phường An Phú, TP. Hồ Chí Minh
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono font-semibold">
              Mã dự kiến: {code || "HK-XXX"}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Lập Sổ Hộ Khẩu Điện Tử Mới
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mt-1">
            Đăng ký thành lập hộ gia đình mới, chỉ định Chủ hộ đại diện, phân định cư trú, định vị tọa độ vệ tinh GIS
            và đồng bộ danh sách nhân khẩu trực tiếp vào cơ sở dữ liệu số Khu phố 3.
          </p>
        </div>
      </Card>

      {/* Main Tabs Form Navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex flex-wrap justify-start">
          <TabsTrigger value="basic" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
            <Home size={14} /> 1. Sổ & Chủ Hộ
          </TabsTrigger>
          <TabsTrigger value="location" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
            <MapPin size={14} /> 2. Địa Chỉ & Tọa Độ GIS
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
            <Users size={14} /> 3. Thành Viên Cùng Hộ ({members.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg text-xs font-bold gap-1.5 cursor-pointer">
            <FileText size={14} /> 4. Ghi Chú & Thụ Lý
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: THÔNG TIN SỔ & CHỦ HỘ */}
        <TabsContent value="basic" className="m-0 space-y-5 focus-visible:outline-none">
          <Card className="border-border bg-white shadow-2xs rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Home size={18} className="text-emerald-600" />
                <span>Thông Tin Định Danh Sổ Hộ Khẩu</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thiết lập mã số sổ hộ tịch và phân loại quy chế cư trú theo Luật Cư trú
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Mã số Sổ Hộ Khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    required
                    placeholder="HK-XXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono text-sm bg-white uppercase font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setCode(suggestedCode)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    title="Gợi ý mã số tiếp theo"
                  >
                    Gợi ý ({suggestedCode})
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Chuỗi ký tự nhận diện duy nhất của sổ hộ khẩu (Ví dụ: HK-301, HK-302...)
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Phân hệ Cư trú <span className="text-rose-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "Thường trú" | "Tạm trú")}
                  className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer font-medium"
                >
                  <option value="Thường trú">Thường trú (Hộ KT1, KT2 có nhà ở cố định)</option>
                  <option value="Tạm trú">Tạm trú (Hộ KT3, KT4, Thuê nhà trọ, Căn hộ)</option>
                </select>
                <span className="text-[11px] text-muted-foreground block">
                  Phân loại thường trú hoặc lưu trú tạm trú theo quy định quản lý nhân khẩu
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <span>Thông Tin Chủ Hộ Đại Diện</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thông tin cá nhân của người đứng tên chủ hộ trong Sổ hộ khẩu điện tử
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Họ và tên Chủ hộ <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Nguyễn Văn A"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="text-xs bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Giới tính</label>
                <select
                  value={ownerGender}
                  onChange={(e) => setOwnerGender(e.target.value as "Nam" | "Nữ")}
                  className="w-full h-9 px-3 border border-input rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Ngày tháng năm sinh</label>
                <div className="relative">
                  <Input
                    placeholder="15/05/1980"
                    value={ownerBirthDate}
                    onChange={(e) => setOwnerBirthDate(e.target.value)}
                    className="text-xs bg-white"
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Số CCCD gắn chip (12 số) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="079XXXXXXXXX"
                    value={ownerCccd}
                    onChange={(e) => setOwnerCccd(e.target.value)}
                    className="font-mono text-xs bg-white"
                  />
                  <CreditCard size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Số điện thoại liên hệ</label>
                <div className="relative">
                  <Input
                    placeholder="09XXXXXXXX"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="font-mono text-xs bg-white"
                  />
                  <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Nghề nghiệp / Lĩnh vực hoạt động</label>
              <div className="relative">
                <Input
                  placeholder="Ví dụ: Kinh doanh tự do, Kỹ sư phần mềm, Công nhân, Hưu trí..."
                  value={ownerOccupation}
                  onChange={(e) => setOwnerOccupation(e.target.value)}
                  className="text-xs bg-white"
                />
                <Briefcase size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setActiveTab("location")}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                <span>Tiếp tục: Địa chỉ & Tọa độ GIS</span>
                <span>→</span>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: ĐỊA CHỈ & TỌA ĐỘ GIS */}
        <TabsContent value="location" className="m-0 space-y-5 focus-visible:outline-none">
          <Card className="border-border bg-white shadow-2xs rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-600" />
                <span>Địa Chỉ Cư Trú & Tọa Độ Bản Đồ Số GIS</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Xác định chính xác vị trí hộ trên bản đồ số GIS Khu phố 3, Phường An Phú
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Địa chỉ Đăng ký cư trú cụ thể <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  required
                  placeholder="Ví dụ: 42/15 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs bg-white"
                />
                <MapPin size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Ghi rõ số nhà, tên đường, hẻm, tổ dân phố thuộc địa bàn Khu phố 3
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Tọa độ GIS Vệ tinh WGS-84 (Vĩ độ, Kinh độ)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAutoDetectCoords}
                  className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold cursor-pointer"
                >
                  <Sparkles size={12} className="text-emerald-600" />
                  <span>Tự động nhận diện từ địa chỉ</span>
                </Button>
              </div>

              <div className="relative">
                <Input
                  placeholder="Ví dụ: 10°56'13.2&quot;N 106°44'40.8&quot;E hoặc 10.936997, 106.744645"
                  value={coordinates}
                  onChange={(e) => handleCoordChange(e.target.value)}
                  className="font-mono text-xs bg-white pr-8"
                />
                <Compass size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>

              {parsedGPS && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Hệ WGS-84 hợp lệ: {parsedGPS.lat.toFixed(6)}, {parsedGPS.lng.toFixed(6)}</span>
                  </div>
                  <span className="font-mono text-[11px] bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                    {decimalToDMS(parsedGPS.lat, parsedGPS.lng)}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Street Presets */}
            <div className="space-y-2 p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Gợi ý phân khu tuyến đường nhanh tại KP3:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleCoordChange('10°56\'13.2"N 106°44\'40.7"E')}
                  className="p-2.5 text-left bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                >
                  <strong className="block text-slate-900 font-bold">Trục 42 Lương Định Của</strong>
                  <span className="text-[10px] text-muted-foreground font-mono">10.936997, 106.744645</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCoordChange('10°56\'16.1"N 106°44\'43.8"E')}
                  className="p-2.5 text-left bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                >
                  <strong className="block text-slate-900 font-bold">Hẻm 42 Lương Định Của</strong>
                  <span className="text-[10px] text-muted-foreground font-mono">10.937800, 106.745500</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCoordChange('10°56\'08.9"N 106°44\'48.5"E')}
                  className="p-2.5 text-left bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                >
                  <strong className="block text-slate-900 font-bold">Hẻm 18 Lương Định Của</strong>
                  <span className="text-[10px] text-muted-foreground font-mono">10.935800, 106.746800</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCoordChange('10°56\'12.5"N 106°44\'42.6"E')}
                  className="p-2.5 text-left bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                >
                  <strong className="block text-slate-900 font-bold">Khu Dân Cư Tổ Dân Phố 12 - 14</strong>
                  <span className="text-[10px] text-muted-foreground font-mono">10.936800, 106.744600</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("basic")}
                className="cursor-pointer"
              >
                ← Quay lại Sổ & Chủ Hộ
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setActiveTab("members")}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                <span>Tiếp tục: Thành viên cùng hộ</span>
                <span>→</span>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: THÀNH VIÊN CÙNG HỘ */}
        <TabsContent value="members" className="m-0 space-y-5 focus-visible:outline-none">
          <Card className="border-border bg-white shadow-2xs rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus size={18} className="text-emerald-600" />
                  <span>Danh Sách Nhân Khẩu Đăng Ký Cư Trú Cùng Hộ</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đăng ký các thành viên gia đình (Vợ/Chồng, con, cha/mẹ, anh chị em...)
                </p>
              </div>

              <Badge variant="secondary" className="font-mono text-xs font-bold self-start sm:self-auto">
                Tổng nhân khẩu: {members.length + 1} (1 Chủ hộ + {members.length} thành viên)
              </Badge>
            </div>

            {/* Sub-form: Add a member */}
            <div className="p-4 border border-border rounded-xl bg-slate-50/70 space-y-3.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                + Thêm thành viên mới vào sổ
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Họ và tên *</label>
                  <Input
                    placeholder="Nguyễn Thị B"
                    value={memName}
                    onChange={(e) => setMemName(e.target.value)}
                    className="text-xs bg-white h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Quan hệ với chủ hộ *</label>
                  <select
                    value={memRelation}
                    onChange={(e) => setMemRelation(e.target.value)}
                    className="w-full h-8 px-2.5 border border-input rounded-md text-xs bg-white cursor-pointer"
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

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Số CCCD gắn chip *</label>
                  <Input
                    placeholder="079XXXXXXXXX"
                    value={memCccd}
                    onChange={(e) => setMemCccd(e.target.value)}
                    className="font-mono text-xs bg-white h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Năm sinh *</label>
                  <Input
                    type="number"
                    placeholder="1995"
                    value={memBirthYear}
                    onChange={(e) => setMemBirthYear(e.target.value ? Number(e.target.value) : "")}
                    className="text-xs bg-white h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Giới tính</label>
                  <select
                    value={memGender}
                    onChange={(e) => setMemGender(e.target.value as "Nam" | "Nữ")}
                    className="w-full h-8 px-2.5 border border-input rounded-md text-xs bg-white cursor-pointer"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Số điện thoại</label>
                  <Input
                    placeholder="09XXXXXXXX"
                    value={memPhone}
                    onChange={(e) => setMemPhone(e.target.value)}
                    className="font-mono text-xs bg-white h-8"
                  />
                </div>

                <div className="space-y-1 flex items-end">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAddMember}
                    className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Thêm vào Sổ</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Danh sách nhân khẩu chính thức trong Sổ ({members.length + 1})
              </span>

              <Card className="border-border rounded-xl overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                      <TableHead className="w-[50px] font-bold text-slate-700">STT</TableHead>
                      <TableHead className="min-w-[160px] font-bold text-slate-700">Họ và Tên</TableHead>
                      <TableHead className="w-[120px] font-bold text-slate-700">Quan Hệ</TableHead>
                      <TableHead className="w-[140px] font-bold text-slate-700">Số CCCD</TableHead>
                      <TableHead className="w-[90px] font-bold text-slate-700">Năm Sinh</TableHead>
                      <TableHead className="w-[120px] font-bold text-slate-700">Điện Thoại</TableHead>
                      <TableHead className="text-right w-[80px] font-bold text-slate-700">Thao Tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Row 1: Chủ Hộ */}
                    <TableRow className="bg-emerald-50/30 font-medium">
                      <TableCell className="font-bold text-emerald-800">1</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ownerName || "(Chưa nhập tên chủ hộ)"}</span>
                          <Badge variant="success" className="text-[10px] font-bold">
                            Chủ hộ
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-800">Chủ hộ</TableCell>
                      <TableCell className="font-mono text-xs">{ownerCccd || "Tự động tạo"}</TableCell>
                      <TableCell>{ownerBirthDate || "1980"}</TableCell>
                      <TableCell className="font-mono text-xs">{ownerPhone || "Chưa có"}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground italic">Cố định</TableCell>
                    </TableRow>

                    {/* Member rows */}
                    {members.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold">{idx + 2}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{m.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {m.relation}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{m.cccd}</TableCell>
                        <TableCell>{m.birthYear}</TableCell>
                        <TableCell className="font-mono text-xs">{m.phone || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0 cursor-pointer"
                            title="Xóa thành viên"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div className="pt-2 flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("location")}
                className="cursor-pointer"
              >
                ← Quay lại Địa chỉ & GIS
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setActiveTab("notes")}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                <span>Tiếp tục: Ghi chú & Thụ lý</span>
                <span>→</span>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: GHI CHÚ & THỤ LÝ */}
        <TabsContent value="notes" className="m-0 space-y-5 focus-visible:outline-none">
          <Card className="border-border bg-white shadow-2xs rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                <span>Hồ Sơ Pháp Lý & Cán Bộ Thụ Lý</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ghi nhận nhật ký lập sổ và thông tin cán bộ phụ trách tư pháp hộ tịch
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Cán bộ thụ lý lập sổ</label>
                <Input
                  value={recordingOfficer}
                  onChange={(e) => setRecordingOfficer(e.target.value)}
                  className="text-xs bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Ngày lập sổ</label>
                <div className="relative">
                  <Input
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="text-xs bg-white"
                  />
                  <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Ghi chú tư pháp / Căn cứ pháp lý lập sổ
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập căn cứ quyết định tách hộ, hồ sơ nhà đất, giấy tờ pháp lý hoặc thông tin lưu ý..."
                className="w-full p-3 border border-input rounded-xl text-xs bg-white h-24 focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
              />
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Xác nhận thông tin trước khi hoàn tất</span>
              </div>
              <p className="text-xs text-emerald-950/80 leading-relaxed">
                Khi bấm <strong>"Lưu & Khởi Tạo Sổ"</strong>, hệ thống sẽ tự động tạo Sổ Hộ Khẩu mới mang mã{" "}
                <strong>{code || "HK-XXX"}</strong> với <strong>{members.length + 1} nhân khẩu</strong>, đồng thời bổ
                sung hồ sơ Chủ hộ <strong>{ownerName || "(Chưa có tên)"}</strong> và các thành viên vào Cơ sở dữ liệu Cư
                dân Khu phố 3.
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("members")}
                className="cursor-pointer"
              >
                ← Quay lại Thành viên
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Hủy bỏ
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSubmitting ? "Đang lưu..." : "Lưu & Khởi Tạo Sổ Hộ Khẩu"}</span>
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

