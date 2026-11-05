import React, { useState, useEffect } from "react";
import { X, Pencil, Store, MapPin, UserCheck, FileText, Building, ShieldCheck, Upload } from "lucide-react";
import { Business, BusinessFile, Household } from "../../types";
import { INDUSTRY_SECTORS } from "./businessConstants";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface BusinessEditModalProps {
  open: boolean;
  business: Business | null;
  onClose: () => void;
  onSave: (updatedBusiness: Business) => void;
  households: Household[];
  showToast: (msg: string, type: "success" | "info" | "error" | "warning") => void;
}

export default function BusinessEditModal({
  open,
  business,
  onClose,
  onSave,
  households,
  showToast
}: BusinessEditModalProps) {
  if (!open || !business) return null;

  // Basic Fields
  const [name, setName] = useState(business.name);
  const [type, setType] = useState(business.type);
  const [industryGroup, setIndustryGroup] = useState(business.industryGroup || "Dịch vụ ăn uống");
  const [owner, setOwner] = useState(business.owner);
  const [phone, setPhone] = useState(business.phone);
  const [address, setAddress] = useState(business.address);
  const [licenseNumber, setLicenseNumber] = useState(business.licenseNumber);
  const [status, setStatus] = useState(business.status);
  const [employeeCount, setEmployeeCount] = useState(business.employeeCount || 1);
  const [safetyCertified, setSafetyCertified] = useState(business.safetyCertified);
  const [coordinates, setCoordinates] = useState(business.coordinates || "10.7935, 106.7445");

  // SME Fields
  const [businessType, setBusinessType] = useState(business.businessType || "Hộ kinh doanh");
  const [taxCode, setTaxCode] = useState(business.taxCode || "");
  const [startDate, setStartDate] = useState(business.startDate || "");
  const [streetArea, setStreetArea] = useState(business.streetArea || "Mặt tiền Lương Định Của");
  const [premisesType, setPremisesType] = useState(business.premisesType || "Nhà phố");
  const [premisesOwner, setPremisesOwner] = useState(business.premisesOwner || "");
  const [linkedHouseholdCode, setLinkedHouseholdCode] = useState(business.linkedHouseholdCode || "");
  const [legalRepresentative, setLegalRepresentative] = useState(business.legalRepresentative || "");
  const [legalRepPhone, setLegalRepPhone] = useState(business.legalRepPhone || "");
  const [siteManager, setSiteManager] = useState(business.siteManager || "");
  const [siteManagerPhone, setSiteManagerPhone] = useState(business.siteManagerPhone || "");
  const [localWorkersCount, setLocalWorkersCount] = useState(business.localWorkersCount || 0);
  const [temporaryWorkersCount, setTemporaryWorkersCount] = useState(business.temporaryWorkersCount || 0);
  const [foreignWorkersCount, setForeignWorkersCount] = useState(business.foreignWorkersCount || 0);

  // Cadastral
  const [toBanDo, setToBanDo] = useState(business.toBanDo || "272");
  const [soThua, setSoThua] = useState(business.soThua || "55");
  const [dienTich, setDienTich] = useState(String(business.dienTich || "150"));
  const [loaiDat, setLoaiDat] = useState(business.loaiDat || "ODT");
  const [tenChuSuDung, setTenChuSuDung] = useState(business.tenChuSuDung || business.owner);
  const [soGcn, setSoGcn] = useState(business.soGcn || "CH-098234");
  const [soVaoSo, setSoVaoSo] = useState(business.soVaoSo || "CS-2023-112");

  // Accommodation
  const [isAccommodation, setIsAccommodation] = useState(Boolean(business.isAccommodation));
  const [soPhong, setSoPhong] = useState(business.soPhong || 10);
  const [soTang, setSoTang] = useState(business.soTang || 3);
  const [soNguoiLuuTru, setSoNguoiLuuTru] = useState(business.soNguoiLuuTru || 15);
  const [giaThueTrungBinh, setGiaThueTrungBinh] = useState(business.giaThueTrungBinh || "3.500.000 đ/tháng");

  // Files
  const [soDoFile, setSoDoFile] = useState<BusinessFile | undefined>(business.soDoFile);

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
    if (!name.trim() || !owner.trim() || !address.trim()) {
      showToast("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", "warning");
      return;
    }

    const updated: Business = {
      ...business,
      name: name.trim(),
      type: type.trim(),
      industryGroup,
      owner: owner.trim(),
      phone: phone.trim(),
      address: address.trim(),
      licenseNumber: licenseNumber.trim(),
      status,
      employeeCount: Number(employeeCount) || 1,
      safetyCertified,
      coordinates: coordinates || business.coordinates,
      taxCode: taxCode.trim(),
      businessType,
      startDate,
      streetArea,
      premisesType,
      premisesOwner: premisesOwner.trim(),
      linkedHouseholdCode: linkedHouseholdCode.trim(),
      legalRepresentative: legalRepresentative.trim() || owner.trim(),
      legalRepPhone: legalRepPhone.trim() || phone.trim(),
      siteManager: siteManager.trim(),
      siteManagerPhone: siteManagerPhone.trim(),
      localWorkersCount: Number(localWorkersCount) || 0,
      temporaryWorkersCount: Number(temporaryWorkersCount) || 0,
      foreignWorkersCount: Number(foreignWorkersCount) || 0,
      toBanDo,
      soThua,
      dienTich: Number(dienTich) || 100,
      loaiDat,
      tenChuSuDung: tenChuSuDung.trim() || owner.trim(),
      soGcn: soGcn.trim(),
      soVaoSo: soVaoSo.trim(),
      isAccommodation,
      soPhong: isAccommodation ? Number(soPhong) || 0 : undefined,
      soTang: isAccommodation ? Number(soTang) || 0 : undefined,
      soNguoiLuuTru: isAccommodation ? Number(soNguoiLuuTru) || 0 : undefined,
      giaThueTrungBinh: isAccommodation ? giaThueTrungBinh : undefined,
      soDoFile
    };

    onSave(updated);
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
              <Pencil size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Chỉnh sửa Hồ sơ Cơ sở Kinh doanh</h3>
              <p className="text-xs text-muted-foreground truncate max-w-md">
                Cơ sở: <strong>{business.name}</strong> • Mã GPKD: {business.licenseNumber}
              </p>
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
                <label className="font-medium text-foreground block">Tên Cơ sở Kinh doanh *</label>
                <Input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số Giấy phép KD / Mã đăng ký</label>
                <Input 
                  type="text" 
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Loại hình cơ sở *</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Hộ kinh doanh">Hộ kinh doanh cá thể</option>
                  <option value="Cơ sở kinh doanh khác">Cơ sở kinh doanh tại chỗ</option>
                  <option value="Doanh nghiệp tư nhân">Cơ sở tư nhân dịch vụ</option>
                  <option value="Công ty TNHH">Công ty TNHH</option>
                  <option value="Công ty Cổ phần">Công ty Cổ phần</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số lượng lao động tại cơ sở</label>
                <Input 
                  type="number" 
                  min="1"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground block">Mã số thuế (nếu có)</label>
                <Input 
                  type="text" 
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Nhóm ngành nghề phân loại *</label>
                <select
                  value={industryGroup}
                  onChange={(e) => {
                    setIndustryGroup(e.target.value);
                    if (e.target.value === "Lưu trú & Cho thuê") {
                      setIsAccommodation(true);
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
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Địa điểm & Mặt bằng */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <MapPin size={14} className="text-primary" />
              2. Địa điểm, Mặt bằng Kinh doanh & Tuyến đường
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-medium text-foreground block">Địa chỉ cơ sở kinh doanh *</label>
                <Input 
                  type="text" 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Tuyến đường / Phân khu *</label>
                <select
                  value={streetArea}
                  onChange={(e) => setStreetArea(e.target.value)}
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
                  value={premisesType}
                  onChange={(e) => setPremisesType(e.target.value as any)}
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
                  value={premisesOwner}
                  onChange={(e) => setPremisesOwner(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Mã hộ dân KP3 liên kết</label>
                <Input 
                  type="text" 
                  value={linkedHouseholdCode}
                  onChange={(e) => setLinkedHouseholdCode(e.target.value)}
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
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số điện thoại liên hệ *</label>
                <Input 
                  type="text" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Người quản lý trực tiếp tại chỗ</label>
                <Input 
                  type="text" 
                  value={siteManager}
                  onChange={(e) => setSiteManager(e.target.value)}
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
                  value={toBanDo}
                  onChange={(e) => setToBanDo(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số thửa đất *</label>
                <Input 
                  type="text" 
                  value={soThua}
                  onChange={(e) => setSoThua(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Diện tích (m²)</label>
                <Input 
                  type="number" 
                  value={dienTich}
                  onChange={(e) => setDienTich(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Loại đất</label>
                <Input 
                  type="text" 
                  value={loaiDat}
                  onChange={(e) => setLoaiDat(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Tên chủ sử dụng trên GCN</label>
                <Input 
                  type="text" 
                  value={tenChuSuDung}
                  onChange={(e) => setTenChuSuDung(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số phát hành GCN</label>
                <Input 
                  type="text" 
                  value={soGcn}
                  onChange={(e) => setSoGcn(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Số vào sổ cấp GCN</label>
                <Input 
                  type="text" 
                  value={soVaoSo}
                  onChange={(e) => setSoVaoSo(e.target.value)}
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
                  checked={isAccommodation}
                  onChange={(e) => setIsAccommodation(e.target.checked)}
                  className="rounded text-primary focus:ring-ring"
                />
                <span>Là cơ sở lưu trú / nhà trọ</span>
              </label>
            </div>

            {isAccommodation && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Số phòng trọ</label>
                  <Input 
                    type="number" 
                    min="1"
                    value={soPhong}
                    onChange={(e) => setSoPhong(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Số tầng</label>
                  <Input 
                    type="number" 
                    min="1"
                    value={soTang}
                    onChange={(e) => setSoTang(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Số người lưu trú</label>
                  <Input 
                    type="number" 
                    min="0"
                    value={soNguoiLuuTru}
                    onChange={(e) => setSoNguoiLuuTru(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">Giá thuê tham khảo</label>
                  <Input 
                    type="text" 
                    value={giaThueTrungBinh}
                    onChange={(e) => setGiaThueTrungBinh(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Trạng thái & PCCC */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              6. An toàn PCCC & Trạng thái Hoạt động
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground block">Trạng thái hoạt động *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
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
                    checked={safetyCertified}
                    onChange={(e) => setSafetyCertified(e.target.checked)}
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
                  <span>{soDoFile ? "Đổi tệp Sổ đỏ" : "Tải lên Sổ đỏ (PDF / Ảnh)"}</span>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], (fileObj) => {
                          setSoDoFile(fileObj);
                          showToast(`Đã đính kèm tệp ${fileObj.name}`, "success");
                        });
                      }
                    }} 
                  />
                </label>
                {soDoFile && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <FileText size={12} className="text-primary" />
                    <span>{soDoFile.name} ({soDoFile.size})</span>
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
              <Pencil size={16} />
              Cập nhật Hồ sơ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
