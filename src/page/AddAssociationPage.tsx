import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  FolderPlus,
  Award,
  Users,
  UserCheck,
  ShieldCheck,
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Search,
  UploadCloud,
  FileCheck,
  Sparkles,
  Info,
  Phone,
  Home,
  Check,
  X
} from "lucide-react";
import { Association, AssociationMember, Resident } from "../types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { navigate, ROUTES } from "../routes";

export interface AddAssociationPageProps {
  residents?: Resident[];
  onCreateAssociation?: (assoc: Association) => void;
  onBack?: () => void;
  showToast?: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function AddAssociationPage({
  residents = [],
  onCreateAssociation,
  onBack,
  showToast: showToastProp
}: AddAssociationPageProps) {
  const showToast = (msg: string, type: "success" | "info" | "error" | "warning" = "info") => {
    if (showToastProp) {
      showToastProp(msg, type);
    } else {
      console.log(`[Toast ${type.toUpperCase()}]: ${msg}`);
    }
  };

  // 1. Thông tin Chi hội
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Association["category"]>("Đoàn thể nhân dân");
  const [description, setDescription] = useState("");
  const [customId, setCustomId] = useState("");

  // Tự sinh ID khi nhập tên
  const generatedId = useMemo(() => {
    if (customId.trim()) return customId.trim();
    if (!name.trim()) return `ASC_${Date.now()}`;
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toUpperCase()
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    return `ASC_${slug.slice(0, 16)}`;
  }, [name, customId]);

  // 2. Người đứng đầu (Leader)
  const [leaderSearch, setLeaderSearch] = useState("");
  const [selectedLeaderCccd, setSelectedLeaderCccd] = useState("");
  const [leaderRole, setLeaderRole] = useState("Chi hội trưởng");
  const [leaderPhone, setLeaderPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().split("T")[0]);

  // 3. Quyết định thành lập / Công nhận
  const [decisionNumber, setDecisionNumber] = useState("");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionIssuer, setDecisionIssuer] = useState("UBND Phường An Phú");
  const [decisionFile, setDecisionFile] = useState<{
    name: string;
    url: string;
    type: "image" | "pdf";
    size?: string;
  } | null>(null);

  // 4. Cơ chế hoạt động
  const [meetingFrequency, setMeetingFrequency] = useState("Định kỳ hàng tháng");
  const [meetingLocation, setMeetingLocation] = useState("Văn phòng Ban Điều Hành Khu phố 3");
  const [expectedMembersCount, setExpectedMembersCount] = useState(15);

  // Tìm kiếm cư dân làm người đứng đầu
  const filteredResidents = useMemo(() => {
    if (!leaderSearch.trim()) {
      return residents.slice(0, 8);
    }
    const term = leaderSearch.toLowerCase().trim();
    return residents
      .filter(
        (r) =>
          r.fullName.toLowerCase().includes(term) ||
          r.cccd.includes(term) ||
          (r.phone && r.phone.includes(term)) ||
          r.address.toLowerCase().includes(term)
      )
      .slice(0, 15);
  }, [residents, leaderSearch]);

  const selectedResident = useMemo(() => {
    if (!selectedLeaderCccd) return null;
    return residents.find((r) => r.cccd === selectedLeaderCccd) || null;
  }, [selectedLeaderCccd, residents]);

  // Cập nhật SĐT tự động khi chọn cư dân
  const handleSelectLeader = (r: Resident) => {
    setSelectedLeaderCccd(r.cccd);
    if (r.phone) {
      setLeaderPhone(r.phone);
    }
  };

  // Upload file quyết định
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isImg = file.type.startsWith("image/");

    if (!isPdf && !isImg) {
      showToast("Chỉ hỗ trợ tệp định dạng PDF hoặc hình ảnh (PNG, JPG)!", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDecisionFile({
        name: file.name,
        url: reader.result as string,
        type: isPdf ? "pdf" : "image",
        size: `${Math.round(file.size / 1024)} KB`
      });
      showToast(`Đã đính kèm văn bản: ${file.name}`, "success");
    };
    reader.readAsDataURL(file);
  };

  // Xử lý tạo Chi hội
  const handleSaveAssociation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Vui lòng nhập tên Chi hội / Tổ chức!", "warning");
      return;
    }

    if (!selectedLeaderCccd || !selectedResident) {
      showToast("Vui lòng chọn Người đứng đầu từ danh sách Cư dân!", "warning");
      return;
    }

    const leaderMember: AssociationMember = {
      id: `M_${Date.now()}`,
      fullName: selectedResident.fullName,
      role: leaderRole.trim() || "Chi hội trưởng",
      cccd: selectedResident.cccd,
      phone: leaderPhone.trim() || selectedResident.phone || "",
      birthDate: selectedResident.dateOfBirth || selectedResident.birthDate,
      joinDate: appointmentDate,
      decisionNumber: decisionNumber.trim() || undefined,
      decisionDate: decisionDate || undefined,
      decisionFile: decisionFile || undefined
    };

    const newAssoc: Association = {
      id: generatedId,
      name: name.trim(),
      category: category,
      description: description.trim() || `Tổ chức tự quản thuộc khối ${category} tại địa bàn Khu phố 3.`,
      leaderName: selectedResident.fullName,
      leaderCccd: selectedResident.cccd,
      members: [leaderMember]
    };

    if (onCreateAssociation) {
      onCreateAssociation(newAssoc);
    }

    showToast(`Đã thành lập thành công ${newAssoc.name}!`, "success");

    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD_PARTY);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.DASHBOARD_PARTY);
    }
  };

  // Badge Category Color
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "Chính trị - Xã hội":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Chính quyền cơ sở":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "An ninh - Quốc phòng":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Đoàn thể nhân dân":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Hội quần chúng":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Chính sách xã hội":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-teal-100 text-teal-800 border-teal-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 animate-in fade-in duration-200">
      {/* STICKY TOP HEADER */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 font-bold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={16} />
              <span>Quay lại Công tác Đảng</span>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span>Cán bộ KP3</span>
              <span>/</span>
              <span>Đoàn thể & Chi hội</span>
              <span>/</span>
              <span className="font-bold text-slate-800">Thành Lập Chi Hội Mới</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="font-medium text-slate-600 hover:bg-slate-100"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              form="add-association-form"
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>Lưu & Công Nhận Chi Hội</span>
            </Button>
          </div>
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/50 bg-emerald-950/80 font-mono text-xs">
                  Mặt trận & Ban Dân vận KP3
                </Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40 bg-amber-950/80 text-xs">
                  Thiết lập Tổ chức Cơ sở
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <FolderPlus size={28} className="text-emerald-400 shrink-0" />
                Thành Lập Chi Hội / Tổ Chức Đoàn Thể Mới
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tạo mới tổ chức tự quản cơ sở, bổ nhiệm nhân sự phụ trách từ cơ sở dữ liệu 11.632 cư dân và chuẩn hóa hồ sơ pháp lý theo Pháp lệnh Dân chủ cơ sở.
              </p>
            </div>

            <div className="bg-emerald-950/70 p-4 rounded-2xl border border-emerald-700/60 text-center shrink-0 w-full md:w-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                Mã định danh hệ thống
              </span>
              <div className="font-mono text-sm font-bold text-white mt-1">
                {generatedId}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Tự động chuẩn hóa theo quy chuẩn KP3</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORM & PREVIEW GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN FORM COLUMN (2 Cols) */}
          <form id="add-association-form" onSubmit={handleSaveAssociation} className="lg:col-span-2 space-y-6">
            {/* SECTION 1: THÔNG TIN CHI HỘI */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-emerald-600" />
                  1. Thông Tin Chi Hội & Phân Nhóm Đoàn Thể
                </CardTitle>
                <CardDescription className="text-xs">
                  Xác định tên gọi chính thức, phân loại chức năng và nhiệm vụ chính trị - xã hội tại địa bàn
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tên Chi hội / Tổ chức / Câu lạc bộ (*):
                  </label>
                  <Input
                    required
                    placeholder="Ví dụ: Chi hội Khuyến học KP3, Câu lạc bộ Cầu lông Sức Trẻ, Tổ Tự quản Môi trường..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Phân nhóm / Thể loại (*):
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full border border-input rounded-md px-3 py-2 text-xs sm:text-sm bg-white"
                    >
                      <option value="Đoàn thể nhân dân">Đoàn thể nhân dân (Phụ nữ, Thanh niên, CCB...)</option>
                      <option value="Chính trị - Xã hội">Chính trị - Xã hội (Chi bộ, Cảm tình Đảng...)</option>
                      <option value="Chính quyền cơ sở">Chính quyền cơ sở (Ban điều hành, Tổ dân phố...)</option>
                      <option value="An ninh - Quốc phòng">An ninh - Quốc phòng (Lực lượng ANTT, PCCC...)</option>
                      <option value="Hội quần chúng">Hội quần chúng (Khuyến học, Chữ thập đỏ, Dưỡng sinh...)</option>
                      <option value="Chính sách xã hội">Chính sách xã hội (Người có công, Hộ nghèo, Trẻ em...)</option>
                      <option value="Phong trào tự quản">Phong trào tự quản (Hòa giải, Môi trường, Camera...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Mã định danh nội bộ (ID):
                    </label>
                    <Input
                      placeholder={generatedId}
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mô tả chức năng & Tôn chỉ hoạt động:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả tóm tắt mục tiêu, đối tượng tập hợp và nhiệm vụ trọng tâm của tổ chức tại Khu phố 3..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-input rounded-md p-3 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: NGƯỜI ĐỨNG ĐẦU (LEADER) */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-600" />
                  2. Người Đứng Đầu / Phụ Trách Tổ Chức
                </CardTitle>
                <CardDescription className="text-xs">
                  Tra cứu và lựa chọn nhân sự từ CSDL dân cư KP3, phân công chức danh công tác
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs sm:text-sm">
                {/* Search Bar for Residents */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tìm kiếm cư dân làm Người đứng đầu (*):
                  </label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Tìm theo Họ tên, số CCCD, địa chỉ hoặc số điện thoại..."
                      value={leaderSearch}
                      onChange={(e) => setLeaderSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Candidate Selection List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                  {filteredResidents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Không tìm thấy cư dân phù hợp với từ khóa "{leaderSearch}"
                    </div>
                  ) : (
                    filteredResidents.map((r) => {
                      const isSelected = selectedLeaderCccd === r.cccd;
                      return (
                        <div
                          key={r.cccd}
                          onClick={() => handleSelectLeader(r)}
                          className={`p-2.5 px-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50 border-l-4 border-emerald-600" : "hover:bg-white"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 text-xs font-bold">{r.fullName}</strong>
                              <span className="font-mono text-[11px] text-slate-500">CCCD: {r.cccd}</span>
                              {r.residenceStatus && (
                                <Badge variant="outline" className="text-[10px] py-0">
                                  {r.residenceStatus}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {r.address} • Nghề nghiệp: {r.occupation || "Tự do"}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                                <Check size={12} />
                              </span>
                            ) : (
                              <Button variant="ghost" size="xs" className="text-xs text-slate-600 hover:text-emerald-700">
                                Chọn
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Leader Summary Box */}
                {selectedResident && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Đã chọn người đứng đầu
                      </span>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-slate-900">{selectedResident.fullName}</strong>
                        <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-300 font-mono text-[11px]">
                          {selectedResident.cccd}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        {selectedResident.address} {selectedResident.phone && `• SĐT: ${selectedResident.phone}`}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedLeaderCccd("")}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1 text-xs"
                    >
                      <X size={13} /> Đổi người khác
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Chức danh đứng đầu (*):
                    </label>
                    <Input
                      required
                      placeholder="Ví dụ: Chi hội trưởng, Chủ nhiệm, Bí thư..."
                      value={leaderRole}
                      onChange={(e) => setLeaderRole(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      SĐT liên hệ công vụ:
                    </label>
                    <Input
                      placeholder="Ví dụ: 0909123888"
                      value={leaderPhone}
                      onChange={(e) => setLeaderPhone(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Ngày bắt đầu nhiệm kỳ:
                    </label>
                    <Input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: PHÁP LÝ & QUYẾT ĐỊNH */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600" />
                  3. Hồ Sơ Quyết Định Thành Lập / Chuẩn Y
                </CardTitle>
                <CardDescription className="text-xs">
                  Cập nhật căn cứ pháp lý, số hiệu quyết định và đính kèm văn bản chứng thực
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Số Quyết định thành lập / chuẩn y:
                    </label>
                    <Input
                      placeholder="Ví dụ: QĐ-12/UBND-AP"
                      value={decisionNumber}
                      onChange={(e) => setDecisionNumber(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Ngày ban hành quyết định:
                    </label>
                    <Input
                      type="date"
                      value={decisionDate}
                      onChange={(e) => setDecisionDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Cơ quan ban hành quyết định:
                    </label>
                    <Input
                      value={decisionIssuer}
                      onChange={(e) => setDecisionIssuer(e.target.value)}
                      placeholder="UBND Phường An Phú"
                    />
                  </div>
                </div>

                {/* Upload Decision File */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Đính kèm tệp văn bản quyết định (PDF / Ảnh chụp):
                  </label>
                  {decisionFile ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <FileCheck size={20} className="text-emerald-600 shrink-0" />
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                            {decisionFile.name}
                          </strong>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {decisionFile.size} • Định dạng: {decisionFile.type.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setDecisionFile(null)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <X size={14} /> Xóa tệp
                      </Button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white hover:bg-emerald-50/30">
                      <UploadCloud size={28} className="text-slate-400" />
                      <div>
                        <span className="text-xs font-bold text-emerald-700 block">Nhấp để tải lên văn bản quyết định</span>
                        <span className="text-[11px] text-muted-foreground">Hỗ trợ tệp PDF, PNG, JPG (Dung lượng &lt; 10MB)</span>
                      </div>
                      <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SECTION 4: CƠ CHẾ HOẠT ĐỘNG */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-600" />
                  4. Phương Thức Sinh Hoạt & Kế Hoạch Hoạt Động
                </CardTitle>
                <CardDescription className="text-xs">
                  Kế hoạch tổ chức sinh hoạt định kỳ và dự kiến quy mô hội viên ban đầu
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Tần suất sinh hoạt:
                    </label>
                    <select
                      value={meetingFrequency}
                      onChange={(e) => setMeetingFrequency(e.target.value)}
                      className="w-full border border-input rounded-md px-3 py-2 text-xs sm:text-sm bg-white"
                    >
                      <option value="Định kỳ hàng tháng">Định kỳ hàng tháng</option>
                      <option value="Định kỳ mỗi quý (3 tháng/lần)">Định kỳ mỗi quý (3 tháng/lần)</option>
                      <option value="Mỗi 6 tháng">Mỗi 6 tháng</option>
                      <option value="Theo chuyên đề / Đột xuất">Theo chuyên đề / Đột xuất</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Địa điểm sinh hoạt thường xuyên:
                    </label>
                    <Input
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Dự kiến quy mô hội viên ban đầu:
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={expectedMembersCount}
                      onChange={(e) => setExpectedMembersCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* RIGHT COLUMN: LIVE PREVIEW & GUIDELINES (1 Col) */}
          <div className="space-y-6">
            {/* Live Preview Card */}
            <Card className="border-border shadow-md overflow-hidden bg-white sticky top-20">
              <CardHeader className="bg-slate-900 text-white p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-emerald-300 border-emerald-400/50 bg-emerald-950 font-mono text-[10px]">
                    Xem Trước Thẻ Chi Hội
                  </Badge>
                  <Sparkles size={14} className="text-amber-300" />
                </div>
                <CardTitle className="text-base font-black text-white pt-2 leading-snug">
                  {name.trim() || "Tên Chi Hội Chưa Đặt"}
                </CardTitle>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className={`text-xs font-bold ${getCategoryBadgeClass(category)}`}>
                    {category}
                  </Badge>
                  <span className="font-mono text-[11px] text-slate-300">
                    {generatedId}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Tôn chỉ & Nhiệm vụ:</span>
                  <p className="text-slate-800 italic line-clamp-3 mt-0.5">
                    {description.trim() || "Chưa có mô tả chi tiết nhiệm vụ."}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Người đứng đầu:</span>
                    <strong className="text-slate-900">
                      {selectedResident ? selectedResident.fullName : "Chưa chọn"}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Chức danh:</span>
                    <Badge variant="outline" className="font-bold text-indigo-700 bg-indigo-50 border-indigo-200 text-[11px]">
                      {leaderRole || "Chi hội trưởng"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Quy mô hội viên:</span>
                    <span className="font-bold text-slate-800">
                      1 lãnh đạo + {expectedMembersCount - 1} dự kiến
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sinh hoạt:</span>
                    <span className="font-medium text-slate-700">{meetingFrequency}</span>
                  </div>

                  {decisionNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Văn bản chuẩn y:</span>
                      <span className="font-mono font-bold text-emerald-800">{decisionNumber}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <strong className="text-slate-900 block font-bold">Quy chế tự quản KP3:</strong>
                  <p>
                    Ngay sau khi thành lập, Chi hội sẽ được tích hợp vào danh bạ tổ chức và Ma trận Đa vai trò để phối hợp cùng Ban Điều Hành KP3.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                <Button
                  type="submit"
                  form="add-association-form"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={16} />
                  <span>Lưu & Công Nhận Chi Hội</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="w-full text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Hủy bỏ thao tác
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

