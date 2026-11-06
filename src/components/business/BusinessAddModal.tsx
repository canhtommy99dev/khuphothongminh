import React, { useState } from "react";
import { X, Plus, Store, MapPin, UserCheck, FileText, Building, Users, ShieldCheck, Camera, Upload, AlertCircle } from "lucide-react";
import { Business, BusinessFile, Household } from "../../types";
import { INDUSTRY_SECTORS } from "./businessConstants";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface BusinessAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newBusiness: Business) => void;
  households: Household[];
  showToast: (msg: string, type: "success" | "info" | "error" | "warning") => void;
}

export default function BusinessAddModal({
  open,
  onClose,
  onAdd,
  households,
  showToast
}: BusinessAddModalProps) {
  if (!open) return null;

  // Basic Fields
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Quán ăn / Dịch vụ ăn uống");
  const [newIndustryGroup, setNewIndustryGroup] = useState("Dịch vụ ăn uống");
  const [newOwner, setNewOwner] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("Khu phố 3, Phường An Phú, TP. Hồ Chí Minh");
  const [newTaxCode, setNewTaxCode] = useState("");
  const [newStatus, setNewStatus] = useState<"Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt">("Đang hoạt động");
  const [newEmployeeCount, setNewEmployeeCount] = useState(2);
  const [newSafetyCertified, setNewSafetyCertified] = useState(true);
  const [newImage, setNewImage] = useState("");
  const [newCoordinates, setNewCoordinates] = useState("10.7935, 106.7445");

  // SME Fields
  const [newBusinessType, setNewBusinessType] = useState<"Hộ kinh doanh" | "Cơ sở kinh doanh khác" | "Doanh nghiệp tư nhân">("Hộ kinh doanh");
  const [newEnterpriseScale, setNewEnterpriseScale] = useState<"Siêu nhỏ (< 5 LĐ)" | "Nhỏ (5 - 20 LĐ)" | "Vừa (20 - 50 LĐ)" | "Lớn (> 50 LĐ)">("Siêu nhỏ (< 5 LĐ)");
  const [newStartDate, setNewStartDate] = useState("01/01/2024");
  const [newStreetArea, setNewStreetArea] = useState("Mặt tiền Lương Định Của");
  const [newPremisesType, setNewPremisesType] = useState<"Nhà phố" | "Cửa hàng" | "Văn phòng" | "Nhà xưởng" | "Ki-ốt" | "Địa điểm thuê" | "Chung cư / Căn hộ">("Nhà phố");
  const [newPremisesOwner, setNewPremisesOwner] = useState("");
  const [newLinkedHouseholdCode, setNewLinkedHouseholdCode] = useState("");
  const [newLegalRep, setNewLegalRep] = useState("");
  const [newLegalRepPhone, setNewLegalRepPhone] = useState("");
  const [newSiteManager, setNewSiteManager] = useState("");
  const [newSiteManagerPhone, setNewSiteManagerPhone] = useState("");
  const [newLocalWorkers, setNewLocalWorkers] = useState(2);
  const [newTemporaryWorkers, setNewTemporaryWorkers] = useState(0);
  const [newForeignWorkersCount, setNewForeignWorkersCount] = useState(0);

  // Cadastral
  const [newToBanDo, setNewToBanDo] = useState("272");
  const [newSoThua, setNewSoThua] = useState("55");
  const [newDienTich, setNewDienTich] = useState("150");
  const [newLoaiDat, setNewLoaiDat] = useState("ODT");
  const [newTenChuSuDung, setNewTenChuSuDung] = useState("");
  const [newSoGcn, setNewSoGcn] = useState("CH-098234");
  const [newSoVaoSo, setNewSoVaoSo] = useState("CS-2023-112");

  // Accommodation
  const [newIsAccommodation, setNewIsAccommodation] = useState(false);
  const [newSoPhong, setNewSoPhong] = useState(10);
  const [newSoTang, setNewSoTang] = useState(3);
  const [newSoNguoiLuuTru, setNewSoNguoiLuuTru] = useState(15);
  const [newGiaThue, setNewGiaThue] = useState("3.500.000 đ/tháng");

  // Files
  const [newSoDoFile, setNewSoDoFile] = useState<BusinessFile | null>(null);

  const handleFileUpload = (file: File, callback: (fileObj: BusinessFile) => void) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const fileObj: BusinessFile = {
        name: file.name,
        url: dataUrl,
        type: isPdf ? "pdf" : "image",
        size: `${(file.size / 1024).toFixed(0)} KB`,
        uploadDate: new Date().toLocaleDateString("vi-VN")
      };
      callback(fileObj);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newOwner.trim() || !newAddress.trim()) {
      showToast("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", "warning");
      return;
    }

    const created: Business = {
      id: `bus-user-${Date.now()}`,
      internalCode: `HKD-KP3-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      type: newType.trim(),
      industryGroup: newIndustryGroup,
      owner: newOwner.trim(),
      phone: newPhone.trim() || "0903000000",
      address: newAddress.trim(),
      licenseNumber: newTaxCode.trim() || `GP-KP3-${Date.now().toString().slice(-4)}`,
      status: newStatus,
      employeeCount: Number(newEmployeeCount) || 1,
      safetyCertified: newSafetyCertified,
      image: newImage || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500",
      coordinates: newCoordinates || "10.7935, 106.7445",
      taxCode: newTaxCode.trim(),
      businessType: newBusinessType,
      enterpriseScale: newEnterpriseScale,
      startDate: newStartDate,
      streetArea: newStreetArea,
      premisesType: newPremisesType,
      premisesOwner: newPremisesOwner.trim(),
      linkedHouseholdCode: newLinkedHouseholdCode.trim(),
      legalRepresentative: newLegalRep.trim() || newOwner.trim(),
      legalRepPhone: newLegalRepPhone.trim() || newPhone.trim(),
      siteManager: newSiteManager.trim(),
      siteManagerPhone: newSiteManagerPhone.trim(),
      localWorkersCount: Number(newLocalWorkers) || 0,
      temporaryWorkersCount: Number(newTemporaryWorkers) || 0,
      foreignWorkersCount: Number(newForeignWorkersCount) || 0,
      toBanDo: newToBanDo,
      soThua: newSoThua,
      dienTich: Number(newDienTich) || 100,
      loaiDat: newLoaiDat,
      tenChuSuDung: newTenChuSuDung.trim() || newOwner.trim(),
      soGcn: newSoGcn.trim(),
      soVaoSo: newSoVaoSo.trim(),
      isAccommodation: newIsAccommodation,
      soPhong: newIsAccommodation ? Number(newSoPhong) || 0 : undefined,
      soTang: newIsAccommodation ? Number(newSoTang) || 0 : undefined,
      soNguoiLuuTru: newIsAccommodation ? Number(newSoNguoiLuuTru) || 0 : undefined,
      giaThueTrungBinh: newIsAccommodation ? newGiaThue : undefined,
      soDoFile: newSoDoFile || undefined
    };

    onAdd(created);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-background text-foreground rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="bg-card border-b border-border p-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Đăng ký Cơ sở / Hộ Kinh doanh Mới</h3>
              <p className="text-xs text-muted-foreground">Nhập thông tin cơ sở kinh doanh, nhà trọ và hồ sơ địa chính</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Thông tin cơ sở */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5">
              <Store size={14} className="text-primary" />
              1. Thông tin Cơ sở Kinh doanh & Giấy phép
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Tên Cơ sở Kinh doanh / Hộ kinh doanh *</label>
                <Input 
                  type="text" 
                  required
                  placeholder="Hộ KD Phở Bò, Quán Cà Phê, Nhà trọ..."
                  value={newName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewName(val);
                    if (/nhà trọ|nhà nghỉ|khách sạn|homestay/i.test(val)) {
                      setNewIsAccommodation(true);
                      setNewIndustryGroup("Lưu trú & Cho thuê");
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số Giấy phép KD / Mã đăng ký</label>
                <Input 
                  type="text" 
                  placeholder="GP-12345/AP hoặc số ĐKKD"
                  value={newTaxCode}
                  onChange={(e) => setNewTaxCode(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Loại hình cơ sở *</label>
                <select
                  value={newBusinessType}
                  onChange={(e) => setNewBusinessType(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Hộ kinh doanh">Hộ kinh doanh cá thể</option>
                  <option value="Cơ sở kinh doanh khác">Cơ sở kinh doanh tại chỗ</option>
                  <option value="Doanh nghiệp tư nhân">Cơ sở tư nhân dịch vụ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số lượng lao động tại cơ sở</label>
                <Input 
                  type="number" 
                  min="1"
                  value={newEmployeeCount}
                  onChange={(e) => setNewEmployeeCount(Number(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground block">Ngày bắt đầu hoạt động</label>
                <Input 
                  type="text" 
                  placeholder="01/01/2024"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Nhóm ngành nghề phân loại *</label>
                <select
                  value={newIndustryGroup}
                  onChange={(e) => {
                    setNewIndustryGroup(e.target.value);
                    if (e.target.value === "Lưu trú & Cho thuê") {
                      setNewIsAccommodation(true);
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {INDUSTRY_SECTORS.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.icon} {sec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Lĩnh vực / Loại hình cụ thể *</label>
                <Input 
                  type="text" 
                  required
                  placeholder="Quán ăn, Cà phê, Tạp hóa, Tiệm thuốc..."
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Địa điểm & Mặt bằng */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <MapPin size={14} className="text-primary" />
              2. Địa điểm, Mặt bằng Kinh doanh & Liên kết Địa bàn
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-medium text-foreground block">Địa chỉ cơ sở kinh doanh *</label>
                <Input 
                  type="text" 
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Tuyến đường / Phân khu *</label>
                <select
                  value={newStreetArea}
                  onChange={(e) => setNewStreetArea(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Mặt tiền Lương Định Của">Mặt tiền Lương Định Của</option>
                  <option value="Hẻm 42 Lương Định Của">Hẻm 42 Lương Định Của</option>
                  <option value="Hẻm 18 Lương Định Của">Hẻm 18 Lương Định Của</option>
                  <option value="Khu dân cư nội bộ KP3">Khu dân cư nội bộ KP3</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Loại mặt bằng *</label>
                <select
                  value={newPremisesType}
                  onChange={(e) => setNewPremisesType(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Nhà phố">Nhà phố</option>
                  <option value="Cửa hàng">Cửa hàng</option>
                  <option value="Văn phòng">Văn phòng</option>
                  <option value="Nhà xưởng">Nhà xưởng</option>
                  <option value="Ki-ốt">Ki-ốt</option>
                  <option value="Địa điểm thuê">Địa điểm thuê</option>
                  <option value="Chung cư / Căn hộ">Chung cư / Căn hộ</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Chủ sở hữu mặt bằng</label>
                <Input 
                  type="text" 
                  placeholder="Tên chủ nhà / chủ mặt bằng"
                  value={newPremisesOwner}
                  onChange={(e) => setNewPremisesOwner(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Mã hộ dân KP3 liên kết</label>
                <Input 
                  type="text" 
                  placeholder="HK-01, HK-02..."
                  value={newLinkedHouseholdCode}
                  onChange={(e) => setNewLinkedHouseholdCode(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Người đại diện */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <UserCheck size={14} className="text-primary" />
              3. Người đại diện & Đầu mối Liên hệ Địa phương
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Người đại diện / Chủ cơ sở *</label>
                <Input 
                  type="text" 
                  required
                  placeholder="Nguyễn Văn Bình"
                  value={newOwner}
                  onChange={(e) => {
                    setNewOwner(e.target.value);
                    if (!newLegalRep) setNewLegalRep(e.target.value);
                    if (!newTenChuSuDung) setNewTenChuSuDung(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số điện thoại liên hệ *</label>
                <Input 
                  type="text" 
                  required
                  placeholder="0903xxxxxx"
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value);
                    if (!newLegalRepPhone) setNewLegalRepPhone(e.target.value);
                  }}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Người quản lý trực tiếp tại chỗ</label>
                <Input 
                  type="text" 
                  placeholder="Tên quản lý trực tiếp"
                  value={newSiteManager}
                  onChange={(e) => setNewSiteManager(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Địa chính & Sổ đỏ */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <FileText size={14} className="text-primary" />
              4. Địa chính & Giấy chứng nhận QSDĐ (Sổ đỏ)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Tờ bản đồ số *</label>
                <Input 
                  type="text" 
                  value={newToBanDo}
                  onChange={(e) => setNewToBanDo(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số thửa đất *</label>
                <Input 
                  type="text" 
                  value={newSoThua}
                  onChange={(e) => setNewSoThua(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Diện tích (m²)</label>
                <Input 
                  type="number" 
                  value={newDienTich}
                  onChange={(e) => setNewDienTich(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Loại đất</label>
                <Input 
                  type="text" 
                  value={newLoaiDat}
                  onChange={(e) => setNewLoaiDat(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Tên chủ sử dụng trên GCN</label>
                <Input 
                  type="text" 
                  value={newTenChuSuDung}
                  onChange={(e) => setNewTenChuSuDung(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số phát hành GCN</label>
                <Input 
                  type="text" 
                  value={newSoGcn}
                  onChange={(e) => setNewSoGcn(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số vào sổ cấp GCN</label>
                <Input 
                  type="text" 
                  value={newSoVaoSo}
                  onChange={(e) => setNewSoVaoSo(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Cơ sở Lưu trú / Nhà trọ */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building size={14} className="text-amber-600" />
                5. Cơ sở Lưu trú / Cho thuê Nhà trọ
              </h4>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
                <input 
                  type="checkbox"
                  checked={newIsAccommodation}
                  onChange={(e) => setNewIsAccommodation(e.target.checked)}
                  className="rounded text-primary focus:ring-ring"
                />
                <span>Là cơ sở lưu trú / nhà trọ</span>
              </label>
            </div>

            {newIsAccommodation && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Số phòng trọ</label>
                  <Input 
                    type="number" 
                    min="1"
                    value={newSoPhong}
                    onChange={(e) => setNewSoPhong(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Số tầng</label>
                  <Input 
                    type="number" 
                    min="1"
                    value={newSoTang}
                    onChange={(e) => setNewSoTang(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Số người lưu trú</label>
                  <Input 
                    type="number" 
                    min="0"
                    value={newSoNguoiLuuTru}
                    onChange={(e) => setNewSoNguoiLuuTru(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Giá thuê tham khảo</label>
                  <Input 
                    type="text" 
                    value={newGiaThue}
                    onChange={(e) => setNewGiaThue(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Lao động & PCCC */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              6. An toàn PCCC & Trạng thái Hoạt động
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Trạng thái hoạt động *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Đang hoạt động">✅ Đang hoạt động</option>
                  <option value="Tạm ngưng">⏸️ Tạm ngưng</option>
                  <option value="Chờ duyệt">⏳ Chờ duyệt</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer font-medium p-2 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <input 
                    type="checkbox"
                    checked={newSafetyCertified}
                    onChange={(e) => setNewSafetyCertified(e.target.checked)}
                    className="rounded text-primary focus:ring-ring"
                  />
                  <span>Đã kiểm tra & đạt tiêu chuẩn an toàn PCCC</span>
                </label>
              </div>
            </div>

            {/* Upload Sổ đỏ File */}
            <div className="space-y-1.5 pt-1">
              <label className="font-medium text-foreground block">Hồ sơ Giấy chứng nhận QSDĐ (Sổ đỏ PDF / Hình ảnh)</label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border border-input bg-background hover:bg-muted text-foreground rounded-lg transition-colors font-medium text-xs">
                  <Upload size={14} />
                  <span>{newSoDoFile ? "Đổi tệp Sổ đỏ" : "Tải lên Sổ đỏ (PDF / Ảnh)"}</span>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], (fileObj) => {
                          setNewSoDoFile(fileObj);
                          showToast(`Đã đính kèm tệp ${fileObj.name}`, "success");
                        });
                      }
                    }} 
                  />
                </label>
                {newSoDoFile && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <FileText size={12} className="text-primary" />
                    <span>{newSoDoFile.name} ({newSoDoFile.size})</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              className="gap-1.5"
            >
              <Plus size={16} />
              Đăng ký Cơ sở Kinh doanh
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
