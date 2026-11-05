import React, { useState } from "react";
import { 
  X, 
  Store, 
  MapPin, 
  Phone, 
  User, 
  Building, 
  Bed, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Camera, 
  Maximize2, 
  Image as ImageIcon, 
  Plus, 
  Download, 
  Printer, 
  Pencil, 
  Trash2, 
  Home, 
  Users, 
  Users2, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  History, 
  FileSpreadsheet, 
  UserCheck 
} from "lucide-react";
import { Business, BusinessFile, InspectionLog, BusinessChangeLog, Resident, Household } from "../../types";
import { getBusinessIndustryGroup, getSectorMeta } from "./businessConstants";
import { getTemporaryResidenceExpiryStatus, isResidentInAccommodation } from "../../utils/householdRecognitionUtils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ViewingDocState } from "./BusinessDocumentModal";

interface BusinessDetailModalProps {
  open: boolean;
  selectedBusiness: Business | null;
  onClose: () => void;
  onEdit: (b: Business) => void;
  onDelete: (b: Business) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onUpdateBusinesses?: React.Dispatch<React.SetStateAction<Business[]>>;
  residents: Resident[];
  households: Household[];
  onViewDoc: (doc: ViewingDocState) => void;
  onOpenPinModal?: (b: Business) => void;
  onOpenAddInspection: () => void;
  onOpenEditInspection: (insp: InspectionLog) => void;
  onDeleteInspection: (insp: InspectionLog) => void;
  onOpenAddChangeLog: () => void;
  onExportHostelResidents: (bus: Business, hostelResidents: Resident[]) => void;
  showToast: (msg: string, type: "success" | "info" | "error" | "warning") => void;
  getBusinessInspections: (b: Business) => InspectionLog[];
  isAccommodationBusiness: (b: Business) => boolean;
}

export default function BusinessDetailModal({
  open,
  selectedBusiness,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateBusinesses,
  residents,
  households,
  onViewDoc,
  onOpenAddInspection,
  onOpenEditInspection,
  onDeleteInspection,
  onOpenAddChangeLog,
  onExportHostelResidents,
  showToast,
  getBusinessInspections,
  isAccommodationBusiness
}: BusinessDetailModalProps) {
  if (!open || !selectedBusiness) return null;

  const [activeTab, setActiveTab] = useState("overview");
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const sectorGroup = getBusinessIndustryGroup(selectedBusiness);
  const sectorMeta = getSectorMeta(sectorGroup);
  const isAccom = isAccommodationBusiness(selectedBusiness);

  // Link household
  const getLinkedHousehold = (b: Business): Household | undefined => {
    if (b.linkedHouseholdCode) {
      const found = households.find(h => h.code.toLowerCase() === b.linkedHouseholdCode?.toLowerCase());
      if (found) return found;
    }
    if (b.address) {
      const found = households.find(h => b.address.toLowerCase().includes(h.address.toLowerCase()) || h.address.toLowerCase().includes(b.address.toLowerCase()));
      if (found) return found;
    }
    return undefined;
  };

  const getLinkedForeignResidents = (b: Business): Resident[] => {
    return (residents || []).filter(r => {
      const isForeign = r.nationality && r.nationality !== "Việt Nam";
      if (!isForeign) return false;
      if (r.workplace && b.name && r.workplace.toLowerCase().includes(b.name.toLowerCase())) return true;
      if (b.linkedHouseholdCode && r.householdId === b.linkedHouseholdCode) return true;
      return false;
    });
  };

  const stayingResidents = (residents || []).filter(r => isResidentInAccommodation(r, selectedBusiness));
  const actualCount = stayingResidents.length > 0 ? stayingResidents.length : (selectedBusiness.soNguoiLuuTru || 0);
  const inspections = getBusinessInspections(selectedBusiness);
  const linkedHh = getLinkedHousehold(selectedBusiness);

  const statusVariants: Record<string, "success" | "warning" | "destructive" | "default"> = {
    "Đang hoạt động": "success",
    "Tạm ngưng": "destructive",
    "Chờ duyệt": "warning",
    "Chuyển địa điểm": "default",
    "Chưa xác minh": "default"
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="business-detail-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-background text-foreground rounded-xl shadow-2xl border border-border w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header Section */}
        <div className="bg-card border-b border-border p-5 relative shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Đóng (Esc)"
          >
            <X size={16} />
          </Button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar Photo */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-border shrink-0 shadow-2xs group bg-muted">
              <img 
                src={selectedBusiness.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400"} 
                alt={selectedBusiness.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button 
                type="button"
                onClick={() => setViewingImage(selectedBusiness.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400")}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                title="Xem ảnh lớn"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Info and Badges */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge variant="outline" className="font-mono text-xs font-semibold">
                  {selectedBusiness.licenseNumber || "KP3-KD"}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span>{sectorMeta.icon}</span>
                  <span>{sectorMeta.name}</span>
                </Badge>
                <Badge variant={statusVariants[selectedBusiness.status] || "default"} className="gap-1 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedBusiness.status === "Đang hoạt động" ? "bg-emerald-500 animate-pulse" : "bg-current"}`} />
                  <span>{selectedBusiness.status}</span>
                </Badge>
                {isAccom && (
                  <Badge variant="warning" className="gap-1 text-xs">
                    <Building size={11} /> Cơ sở lưu trú
                  </Badge>
                )}
                {selectedBusiness.safetyCertified && (
                  <Badge variant="success" className="gap-1 text-xs">
                    <ShieldCheck size={11} /> PCCC Đạt
                  </Badge>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug">
                {selectedBusiness.name}
              </h2>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span className="truncate max-w-sm">{selectedBusiness.address}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={12} className="shrink-0" />
                  <span>{selectedBusiness.phone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Header */}
          <div className="mt-4 pt-3 border-t border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto h-9">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="cadastral">Địa chính & Sổ đỏ</TabsTrigger>
                <TabsTrigger value="accommodation">
                  Lưu trú {isAccom && `(${actualCount})`}
                </TabsTrigger>
                <TabsTrigger value="workers">
                  Nhân sự ({selectedBusiness.employeeCount || 1})
                </TabsTrigger>
                <TabsTrigger value="inspections">
                  Kiểm tra ({inspections.length})
                </TabsTrigger>
                <TabsTrigger value="changes">
                  Biến động ({selectedBusiness.changeHistory?.length || 1})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs bg-muted/10">
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Store size={15} className="text-primary" />
                    Thông tin Pháp lý & Hoạt động
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Loại hình tổ chức</span>
                    <strong className="text-foreground text-xs block mt-0.5">{selectedBusiness.businessType || selectedBusiness.type}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Mã số thuế / Số GPKD</span>
                    <strong className="text-foreground font-mono text-xs block mt-0.5">{selectedBusiness.taxCode || selectedBusiness.licenseNumber}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Lĩnh vực hoạt động cụ thể</span>
                    <strong className="text-foreground text-xs block mt-0.5">{selectedBusiness.type}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Ngày bắt đầu hoạt động</span>
                    <strong className="text-foreground font-mono text-xs block mt-0.5">{selectedBusiness.startDate || "10/01/2021"}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border sm:col-span-2">
                    <span className="text-[10px] text-muted-foreground block font-medium">Nguồn xác minh dữ liệu</span>
                    <p className="text-foreground text-xs mt-0.5">
                      {selectedBusiness.verificationSource || "Khảo sát Tổ dân phố & Ban Điều hành Khu phố 3"} (phục vụ quản lý địa bàn hành chính tại chỗ)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Đại diện & Đầu mối */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck size={15} className="text-primary" />
                    Người đại diện & Đầu mối liên hệ địa phương
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Người đại diện / Chủ cơ sở</span>
                    <strong className="text-foreground text-xs block mt-0.5">{selectedBusiness.owner}</strong>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      SĐT: <strong className="font-mono text-foreground">{selectedBusiness.phone}</strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Người trực tiếp quản lý cơ sở tại chỗ</span>
                    <strong className="text-foreground text-xs block mt-0.5">{selectedBusiness.siteManager || selectedBusiness.owner}</strong>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      SĐT: <strong className="font-mono text-foreground">{selectedBusiness.siteManagerPhone || selectedBusiness.phone}</strong>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 sm:col-span-2">
                    <span className="text-xs font-semibold text-primary block mb-1">Đầu mối phối hợp khi KP3 tổ chức nhiệm vụ / tuyên truyền:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Họ và tên:</span>
                        <strong className="text-foreground">{selectedBusiness.focalPointName || selectedBusiness.owner}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">SĐT công vụ:</span>
                        <strong className="font-mono text-foreground">{selectedBusiness.focalPointPhone || selectedBusiness.phone}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Vai trò:</span>
                        <strong className="text-foreground">{selectedBusiness.focalPointRole || "Chủ cơ sở / Quản lý"}</strong>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liên kết Hộ dân KP3 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Home size={15} className="text-primary" />
                      Liên kết Hộ dân Cư trú KP3
                    </CardTitle>
                    {linkedHh ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        MÃ HỘ: {linkedHh.code}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Chưa đối khớp mã hộ</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-xs">
                  {linkedHh ? (
                    <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="flex justify-between items-center">
                        <span>Chủ hộ: <strong className="text-foreground">{linkedHh.ownerName}</strong></span>
                        <Badge variant="secondary" className="text-[10px]">
                          {linkedHh.type || "Thường trú"} • {linkedHh.memberCount} nhân khẩu
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        Địa chỉ: <strong className="text-foreground">{linkedHh.address}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Cơ sở kinh doanh hoạt động tại địa điểm độc lập hoặc chưa liên kết sổ hộ khẩu.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: ĐỊA CHÍNH & SỔ ĐỎ */}
          {activeTab === "cadastral" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileSpreadsheet size={15} className="text-primary" />
                      Hồ sơ Địa chính & Thửa đất
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      GCN: {selectedBusiness.soGcn || "CH-098234"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Tờ bản đồ số</span>
                      <strong className="text-foreground font-mono text-sm block mt-0.5">Tờ {selectedBusiness.toBanDo || "272"}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Thửa đất số</span>
                      <strong className="text-foreground font-mono text-sm block mt-0.5">Thửa {selectedBusiness.soThua || "55"}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Diện tích khuôn viên</span>
                      <strong className="text-foreground text-sm block mt-0.5">{selectedBusiness.dienTich ? `${selectedBusiness.dienTich} m²` : "150 m²"}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Mục đích sử dụng</span>
                      <strong className="text-foreground text-sm block mt-0.5">{selectedBusiness.loaiDat || "ODT"}</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Tệp hồ sơ Giấy chứng nhận QSDĐ (Sổ đỏ):</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {selectedBusiness.soDoFile ? `${selectedBusiness.soDoFile.name} (${selectedBusiness.soDoFile.size || "520 KB"})` : "Đã số hóa dữ liệu trích lục địa chính chuẩn xác"}
                      </p>
                    </div>
                    {selectedBusiness.soDoFile ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDoc({
                          title: "Giấy chứng nhận Quyền sử dụng đất (Sổ đỏ)",
                          businessName: selectedBusiness.name,
                          file: selectedBusiness.soDoFile!,
                          business: selectedBusiness
                        })}
                        className="gap-1.5"
                      >
                        <FileText size={13} />
                        <span>Xem Sổ đỏ</span>
                      </Button>
                    ) : (
                      <Badge variant="outline">Đã đồng bộ CSDL</Badge>
                    )}
                  </div>

                  {/* Coordinates & Navigation */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block font-medium">Tọa độ định vị WGS-84</span>
                      <strong className="font-mono text-foreground text-xs">{selectedBusiness.coordinates || "10.7935, 106.7445"}</strong>
                    </div>
                    {selectedBusiness.coordinates && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedBusiness.coordinates!)}`;
                          window.open(url, "_blank");
                        }}
                        className="gap-1.5 text-xs"
                      >
                        <MapPin size={13} />
                        <span>Google Maps</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: LƯU TRÚ / KHÁCH TRỌ */}
          {activeTab === "accommodation" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building size={15} className="text-amber-600" />
                        Cơ sở Lưu trú & Nhà trọ Cho thuê
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Thống kê quy mô phòng trọ và đối khớp cư dân tạm trú thực tế từ 11.632 nhân khẩu KP3
                      </p>
                    </div>
                    {stayingResidents.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onExportHostelResidents(selectedBusiness, stayingResidents)}
                        className="gap-1.5 text-xs"
                      >
                        <Download size={13} />
                        <span>Xuất Excel ({stayingResidents.length})</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Quy mô tầng</span>
                      <strong className="text-foreground text-sm block mt-0.5">{selectedBusiness.soTang || 3} tầng</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Tổng số phòng</span>
                      <strong className="text-foreground text-sm block mt-0.5">{selectedBusiness.soPhong || 12} phòng</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Khách lưu trú thực tế</span>
                      <strong className="text-emerald-600 text-sm block mt-0.5">{actualCount} người</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-muted-foreground block font-medium">Giá thuê tham khảo</span>
                      <strong className="text-foreground text-xs block mt-0.5 truncate">{selectedBusiness.giaThueTrungBinh || "Thỏa thuận"}</strong>
                    </div>
                  </div>

                  {/* Residents Table */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="p-2.5 bg-muted/40 border-b border-border flex justify-between items-center">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <Users size={14} className="text-primary" />
                        Danh sách Cư dân Lưu trú Thực tế ({stayingResidents.length})
                      </span>
                    </div>

                    {stayingResidents.length > 0 ? (
                      <div className="overflow-x-auto max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-muted text-muted-foreground font-semibold sticky top-0 border-b border-border text-[11px]">
                            <tr>
                              <th className="py-2 px-3">STT</th>
                              <th className="py-2 px-3">Họ và tên</th>
                              <th className="py-2 px-3">CCCD</th>
                              <th className="py-2 px-3">SĐT</th>
                              <th className="py-2 px-3">Quê quán (Thường trú gốc)</th>
                              <th className="py-2 px-3">Thời hạn tạm trú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-card">
                            {stayingResidents.map((res, idx) => {
                              const expStatus = getTemporaryResidenceExpiryStatus(res.temporaryExpDate);
                              return (
                                <tr key={res.id} className="hover:bg-muted/50 transition-colors">
                                  <td className="py-2 px-3 font-mono text-muted-foreground text-[10px]">{idx + 1}</td>
                                  <td className="py-2 px-3">
                                    <div className="font-semibold text-foreground text-xs">{res.fullName}</div>
                                    <div className="text-[10px] text-muted-foreground">({res.gender}, {res.birthDate})</div>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-medium">{res.cccd}</td>
                                  <td className="py-2 px-3 font-mono">
                                    {res.phone ? (
                                      <a href={`tel:${res.phone}`} className="text-primary hover:underline flex items-center gap-0.5">
                                        <Phone size={10} /> {res.phone}
                                      </a>
                                    ) : "—"}
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground truncate max-w-[160px]" title={res.permanentAddress || res.hometown || "—"}>
                                    {res.permanentAddress || res.hometown || "—"}
                                  </td>
                                  <td className="py-2 px-3">
                                    {expStatus.isWarning ? (
                                      <Badge variant="warning" className="gap-1 animate-pulse">
                                        <AlertTriangle size={10} /> {expStatus.label}
                                      </Badge>
                                    ) : expStatus.isExpired ? (
                                      <Badge variant="destructive" className="gap-1">
                                        <AlertCircle size={10} /> {expStatus.label}
                                      </Badge>
                                    ) : (
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        {res.temporaryExpDate ? expStatus.formattedDate : "Còn hạn"}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        Chưa phát hiện cư dân có địa chỉ đăng ký trùng khớp trong CSDL tạm trú.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: NHÂN SỰ & LAO ĐỘNG */}
          {activeTab === "workers" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users2 size={15} className="text-primary" />
                      Quy mô & Cơ cấu Lao động
                    </CardTitle>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {selectedBusiness.employeeCount || 1} nhân sự
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Thường trú KP3</span>
                      <strong className="text-foreground text-lg font-bold block mt-0.5">
                        {selectedBusiness.localWorkersCount ?? Math.floor((selectedBusiness.employeeCount || 1) / 2)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">lao động</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Tạm trú tại chỗ</span>
                      <strong className="text-foreground text-lg font-bold block mt-0.5">
                        {selectedBusiness.temporaryWorkersCount ?? Math.ceil((selectedBusiness.employeeCount || 1) / 2)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">lao động</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Người nước ngoài</span>
                      <strong className={`text-lg font-bold block mt-0.5 ${
                        (selectedBusiness.foreignWorkersCount || (selectedBusiness.foreignWorkers?.length || 0)) > 0 
                          ? "text-destructive" 
                          : "text-muted-foreground"
                      }`}>
                        {selectedBusiness.foreignWorkersCount || (selectedBusiness.foreignWorkers?.length || 0)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">chuyên gia / LĐ</span>
                    </div>
                  </div>

                  {/* Foreign workers list */}
                  {(() => {
                    const linkedForeigners = selectedBusiness.foreignWorkers && selectedBusiness.foreignWorkers.length > 0 
                      ? selectedBusiness.foreignWorkers 
                      : getLinkedForeignResidents(selectedBusiness).map(r => ({
                          name: r.fullName,
                          nationality: r.nationality || "Nước ngoài",
                          passportOrCode: r.cccd,
                          position: r.occupation,
                          temporaryResidenceStatus: "Đã khai báo tạm trú" as const
                        }));

                    if (linkedForeigners.length > 0) {
                      return (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Globe size={14} className="text-primary" />
                            Danh sách Lao động / Chuyên gia Nước ngoài:
                          </span>
                          <div className="space-y-2">
                            {linkedForeigners.map((f, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between gap-2 text-xs">
                                <div>
                                  <strong className="text-foreground">{f.name}</strong>
                                  <span className="text-muted-foreground ml-1.5 font-medium">({f.nationality})</span>
                                  <div className="text-[10px] text-muted-foreground font-mono">
                                    Hộ chiếu: {f.passportOrCode} • Vị trí: <strong className="text-foreground">{f.position}</strong>
                                  </div>
                                </div>
                                <Badge variant="success" className="text-[10px]">
                                  ✓ {f.temporaryResidenceStatus}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="text-muted-foreground text-xs italic pt-1">
                        Cơ sở hiện không có lao động hoặc chuyên gia người nước ngoài.
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: PCCC & KIỂM TRA ĐỊNH KỲ */}
          {activeTab === "inspections" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldCheck size={15} className="text-primary" />
                        An toàn PCCC & Lịch sử Kiểm tra Định kỳ
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Biên bản kiểm tra liên ngành, công an khu vực và an toàn phòng cháy chữa cháy
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onOpenAddInspection}
                      className="gap-1.5 text-xs"
                    >
                      <Plus size={14} />
                      <span>Thêm biên bản KT</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">Trạng thái an toàn PCCC cơ sở:</span>
                      {selectedBusiness.safetyCertified ? (
                        <Badge variant="success" className="gap-1 text-xs">
                          <ShieldCheck size={12} /> Đạt tiêu chuẩn an toàn PCCC
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <ShieldAlert size={12} /> Chưa đạt / Cần nhắc nhở kiểm tra
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Inspections list */}
                  <div className="space-y-2">
                    {inspections.length === 0 ? (
                      <div className="p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                        Chưa có biên bản kiểm tra định kỳ nào được ghi nhận.
                      </div>
                    ) : (
                      inspections.map((insp) => (
                        <div key={insp.id} className="p-3 rounded-lg border border-border bg-card space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground text-xs">{insp.inspector}</span>
                            <div className="flex items-center gap-1.5">
                              <Badge 
                                variant={
                                  insp.result === "Đạt chuẩn" ? "success" :
                                  insp.result === "Cảnh cáo" ? "warning" : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {insp.result}
                              </Badge>
                              <span className="text-[10px] font-mono text-muted-foreground">{insp.date}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenEditInspection(insp)}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Sửa biên bản"
                              >
                                <Pencil size={11} />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteInspection(insp)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                title="Xóa biên bản"
                              >
                                <Trash2 size={11} />
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground bg-muted/40 p-2 rounded text-[11px] leading-relaxed">{insp.note}</p>
                          {insp.recommendation && (
                            <div className="text-[10px] text-amber-800 bg-amber-500/10 p-1.5 rounded">
                              <strong>Yêu cầu khắc phục:</strong> {insp.recommendation}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 6: BIẾN ĐỘNG ĐỊA BÀN */}
          {activeTab === "changes" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <History size={15} className="text-primary" />
                        Nhật ký Biến động Địa bàn ({selectedBusiness.changeHistory?.length || 1})
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Theo dõi lịch sử mở mới, chuyển địa điểm, thay đổi người đại diện hoặc ngành nghề
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onOpenAddChangeLog}
                      className="gap-1.5 text-xs"
                    >
                      <Plus size={14} />
                      <span>Ghi nhận biến động</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(selectedBusiness.changeHistory && selectedBusiness.changeHistory.length > 0 
                    ? selectedBusiness.changeHistory 
                    : [
                        {
                          id: `CHG-${selectedBusiness.id}-INIT`,
                          date: selectedBusiness.startDate || "12/03/2021",
                          type: "Mở mới" as const,
                          description: `Ghi nhận cơ sở bắt đầu hoạt động kinh doanh tại địa chỉ ${selectedBusiness.address}`,
                          recordedBy: "Bà Lê Thị Mai (Trưởng KP3)"
                        }
                      ]
                  ).map((chg) => (
                    <div key={chg.id} className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <Badge variant="outline" className="font-semibold">
                          {chg.type}
                        </Badge>
                        <span className="font-mono text-muted-foreground">{chg.date}</span>
                      </div>
                      <p className="text-foreground leading-relaxed mt-1">{chg.description}</p>
                      <span className="text-[10px] text-muted-foreground block pt-1">
                        Ghi nhận bởi: <strong>{chg.recordedBy}</strong>
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Bar: Status Switcher & Action Buttons */}
        <div className="bg-card border-t border-border p-3.5 px-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Trạng thái:</span>
            {(["Đang hoạt động", "Tạm ngưng", "Chờ duyệt"] as const).map((st) => (
              <Button
                key={st}
                type="button"
                size="xs"
                variant={selectedBusiness.status === st ? "default" : "outline"}
                onClick={() => onUpdateStatus(selectedBusiness.id, st)}
                className="text-xs"
              >
                {st}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer size={13} />
              <span>In phiếu</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onEdit(selectedBusiness)}
              className="gap-1.5"
            >
              <Pencil size={13} />
              <span>Sửa hồ sơ</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(selectedBusiness)}
              className="gap-1.5"
            >
              <Trash2 size={13} />
              <span>Xóa</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>

        {/* Lightbox photo viewer */}
        {viewingImage && (
          <div 
            onClick={() => setViewingImage(null)}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xs cursor-pointer"
          >
            <div className="relative max-w-2xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img 
                src={viewingImage} 
                alt="Enlarged preview" 
                className="max-h-[80vh] w-auto rounded-xl shadow-2xl object-contain border border-border"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setViewingImage(null)}
                className="mt-3"
              >
                Đóng ảnh
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
