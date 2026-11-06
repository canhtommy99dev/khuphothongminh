import React, { useState } from "react";
import {
  ArrowLeft,
  Store,
  MapPin,
  UserCheck,
  FileText,
  Building,
  ShieldCheck,
  Upload,
  Plus,
  X,
  Sparkles,
  Phone,
  Bed,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Business, BusinessFile, Household } from "../types";
import { INDUSTRY_SECTORS } from "../components/business/businessConstants";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { navigate, ROUTES } from "../routes";
import { supabase } from "../lib/supabase";

export interface AddShowPageProps {
  households?: Household[];
  businesses?: Business[];
  onAdd?: (newBusiness: Business) => void;
  onBack?: () => void;
  showToast?: (msg: string, type: "success" | "info" | "error" | "warning") => void;
}

export default function AddShowPage({
  households = [],
  businesses = [],
  onAdd,
  onBack,
  showToast
}: AddShowPageProps) {
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

  // Files & Submitting
  const [newSoDoFile, setNewSoDoFile] = useState<BusinessFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notify = (msg: string, type: "success" | "info" | "error" | "warning") => {
    if (showToast) {
      showToast(msg, type);
    } else {
      alert(msg);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/dashboard/businesses");
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newOwner.trim() || !newAddress.trim()) {
      notify("Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)", "warning");
      return;
    }

    setIsSubmitting(true);

    const generatedId = `bus-user-${Date.now()}`;
    const generatedInternalCode = `HKD-KP3-${Date.now().toString().slice(-4)}`;
    const generatedLicense = newTaxCode.trim() || `GP-KP3-${Date.now().toString().slice(-4)}`;

    const created: Business = {
      id: generatedId,
      internalCode: generatedInternalCode,
      name: newName.trim(),
      type: newType.trim(),
      industryGroup: newIndustryGroup,
      owner: newOwner.trim(),
      phone: newPhone.trim() || "0903000000",
      address: newAddress.trim(),
      licenseNumber: generatedLicense,
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

    // Try syncing directly to Supabase if configured
    try {
      if (supabase) {
        await (supabase as any).from("businesses").insert({
          id: created.id,
          internal_code: created.internalCode,
          name: created.name,
          tax_code: created.taxCode || created.licenseNumber,
          business_type: created.businessType,
          industry_group: created.industryGroup,
          owner_name: created.owner,
          phone: created.phone,
          address: created.address,
          license_number: created.licenseNumber,
          status: created.status,
          safety_certified: created.safetyCertified,
          employee_count: created.employeeCount,
          image_url: created.image,
          coordinates: created.coordinates,
          is_accommodation: created.isAccommodation,
          room_count: created.soPhong,
          guest_count: created.soNguoiLuuTru,
          pccc_passed: created.safetyCertified
        });
      }
    } catch (err) {
      console.warn("Lưu database Supabase ngầm (nếu có lỗi bảng sẽ lưu local state):", err);
    }

    if (onAdd) {
      onAdd(created);
    }

    notify(`Đã đăng ký cơ sở kinh doanh "${created.name}" thành công!`, "success");
    setIsSubmitting(false);

    // Navigate back to business management list
    handleBack();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>Cán bộ KP3</span>
            <span>/</span>
            <button 
              type="button" 
              onClick={handleBack} 
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Cơ sở Kinh doanh
            </button>
            <span>/</span>
            <span className="text-foreground font-semibold">Đăng ký mới</span>
            <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5 border-emerald-500/40 text-emerald-700 bg-emerald-50/50">
              /addshow
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              title="Quay lại danh sách cơ sở"
            >
              <ArrowLeft size={14} />
              <span>Quay lại</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg inline-flex">
                <Store size={20} />
              </span>
              Đăng ký Cơ sở Kinh doanh Mới
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Trang tạo lập hồ sơ cơ sở kinh doanh, hộ cá thể, nhà trọ và cập nhật hồ sơ địa chính trên địa bàn KP3
          </p>
        </div>

        {/* Quick actions top bar */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="text-xs font-semibold cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              const form = document.getElementById("add-show-business-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>{isSubmitting ? "Đang lưu..." : "Lưu & Đăng ký"}</span>
          </Button>
        </div>
      </div>

      {/* Main Form Form Grid */}
      <form id="add-show-business-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Thông tin cơ sở & ngành nghề */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                <Store size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  1. Thông tin Cơ sở Kinh doanh & Giấy phép
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tên hiệu kinh doanh, ngành nghề hoạt động và quy mô nhân sự
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Tên Cơ sở Kinh doanh / Hộ kinh doanh <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Hộ KD Phở Bò Nam Định, Quán Cà Phê Mộc, Nhà trọ Bình An..."
                  value={newName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewName(val);
                    if (/nhà trọ|nhà nghỉ|khách sạn|homestay|cho thuê phòng/i.test(val)) {
                      setNewIsAccommodation(true);
                      setNewIndustryGroup("Lưu trú & Cho thuê");
                    }
                  }}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số Giấy phép KD / Mã số thuế / Mã ĐKKD
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: GP-4102-098234 hoặc Mã số thuế"
                  value={newTaxCode}
                  onChange={(e) => setNewTaxCode(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Loại hình cơ sở <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newBusinessType}
                  onChange={(e) => setNewBusinessType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Hộ kinh doanh">Hộ kinh doanh cá thể</option>
                  <option value="Cơ sở kinh doanh khác">Cơ sở kinh doanh tại chỗ</option>
                  <option value="Doanh nghiệp tư nhân">Cơ sở tư nhân dịch vụ</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Quy mô cơ sở
                </label>
                <select
                  value={newEnterpriseScale}
                  onChange={(e) => setNewEnterpriseScale(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Siêu nhỏ (< 5 LĐ)">Siêu nhỏ (&lt; 5 lao động)</option>
                  <option value="Nhỏ (5 - 20 LĐ)">Nhỏ (5 - 20 lao động)</option>
                  <option value="Vừa (20 - 50 LĐ)">Vừa (20 - 50 lao động)</option>
                  <option value="Lớn (> 50 LĐ)">Lớn (&gt; 50 lao động)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số lượng lao động làm việc
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newEmployeeCount}
                  onChange={(e) => setNewEmployeeCount(Number(e.target.value) || 1)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Nhóm ngành nghề phân loại <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newIndustryGroup}
                  onChange={(e) => {
                    setNewIndustryGroup(e.target.value);
                    if (e.target.value === "Lưu trú & Cho thuê") {
                      setNewIsAccommodation(true);
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {INDUSTRY_SECTORS.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.icon} {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Lĩnh vực / Mặt hàng cụ thể <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Cơm tấm, Trà sữa, Tạp hóa tổng hợp..."
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Ngày bắt đầu hoạt động
                </label>
                <Input
                  type="text"
                  placeholder="01/01/2024"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Địa điểm, Mặt bằng & Liên kết Hộ */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-700 rounded-lg">
                <MapPin size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  2. Địa điểm, Mặt bằng Kinh doanh & Liên kết Địa bàn
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Địa chỉ thực tế tại KP3, tuyến đường phân khu và liên kết sổ hộ khẩu
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-slate-800 block">
                  Địa chỉ cơ sở kinh doanh <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Số nhà, hẻm, tên đường, KP3, P. An Phú"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Tuyến đường / Phân khu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStreetArea}
                  onChange={(e) => setNewStreetArea(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Mặt tiền Lương Định Của">Mặt tiền Lương Định Của</option>
                  <option value="Hẻm 42 Lương Định Của">Hẻm 42 Lương Định Của</option>
                  <option value="Hẻm 18 Lương Định Của">Hẻm 18 Lương Định Của</option>
                  <option value="Khu dân cư nội bộ KP3">Khu dân cư nội bộ KP3</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Loại mặt bằng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newPremisesType}
                  onChange={(e) => setNewPremisesType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Chủ sở hữu mặt bằng
                </label>
                <Input
                  type="text"
                  placeholder="Tên chủ nhà / người cho thuê"
                  value={newPremisesOwner}
                  onChange={(e) => setNewPremisesOwner(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Mã Sổ Hộ Khẩu KP3 liên kết
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: HK-001, HK-012..."
                  value={newLinkedHouseholdCode}
                  onChange={(e) => setNewLinkedHouseholdCode(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Tọa độ GIS không gian (Lat, Lng)
                </label>
                <Input
                  type="text"
                  placeholder="10.7935, 106.7445"
                  value={newCoordinates}
                  onChange={(e) => setNewCoordinates(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Đường dẫn ảnh đại diện (Image URL)
                </label>
                <Input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Người đại diện & Đầu mối */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-700 rounded-lg">
                <UserCheck size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  3. Người đại diện & Đầu mối Liên hệ Địa phương
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Thông tin chủ cơ sở, đại diện pháp lý và quản lý thường trực tại điểm
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Người đại diện / Chủ cơ sở <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Họ và tên chủ cơ sở"
                  value={newOwner}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewOwner(val);
                    if (!newLegalRep) setNewLegalRep(val);
                    if (!newTenChuSuDung) setNewTenChuSuDung(val);
                  }}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số điện thoại liên hệ <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="090xxxxxxx"
                  value={newPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPhone(val);
                    if (!newLegalRepPhone) setNewLegalRepPhone(val);
                  }}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Người quản lý trực tiếp tại chỗ
                </label>
                <Input
                  type="text"
                  placeholder="Họ tên người quản lý tại điểm"
                  value={newSiteManager}
                  onChange={(e) => setNewSiteManager(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Lao động thường trú địa phương
                </label>
                <Input
                  type="number"
                  min="0"
                  value={newLocalWorkers}
                  onChange={(e) => setNewLocalWorkers(Number(e.target.value) || 0)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Lao động tạm trú / Vãng lai
                </label>
                <Input
                  type="number"
                  min="0"
                  value={newTemporaryWorkers}
                  onChange={(e) => setNewTemporaryWorkers(Number(e.target.value) || 0)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Lao động nước ngoài
                </label>
                <Input
                  type="number"
                  min="0"
                  value={newForeignWorkersCount}
                  onChange={(e) => setNewForeignWorkersCount(Number(e.target.value) || 0)}
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Địa chính & Giấy chứng nhận QSDĐ */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 text-purple-700 rounded-lg">
                <FileText size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  4. Địa chính & Giấy chứng nhận QSDĐ (Sổ đỏ)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Thông tin tờ bản đồ, số thửa đất, diện tích và hồ sơ pháp lý bất động sản
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Tờ bản đồ số <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={newToBanDo}
                  onChange={(e) => setNewToBanDo(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số thửa đất <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={newSoThua}
                  onChange={(e) => setNewSoThua(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Diện tích khuôn viên (m²)
                </label>
                <Input
                  type="number"
                  value={newDienTich}
                  onChange={(e) => setNewDienTich(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Mục đích / Loại đất
                </label>
                <Input
                  type="text"
                  value={newLoaiDat}
                  onChange={(e) => setNewLoaiDat(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Tên chủ sử dụng trên GCN
                </label>
                <Input
                  type="text"
                  placeholder="Tên đứng tên sổ đỏ"
                  value={newTenChuSuDung}
                  onChange={(e) => setNewTenChuSuDung(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số phát hành GCN (Số sê-ri)
                </label>
                <Input
                  type="text"
                  placeholder="CH-098234..."
                  value={newSoGcn}
                  onChange={(e) => setNewSoGcn(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số vào sổ cấp GCN
                </label>
                <Input
                  type="text"
                  placeholder="CS-2023-112..."
                  value={newSoVaoSo}
                  onChange={(e) => setNewSoVaoSo(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>

            {/* File Upload Sổ đỏ */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="font-semibold text-slate-800 block">
                Đính kèm Hồ sơ Giấy chứng nhận QSDĐ (Sổ đỏ PDF / Hình ảnh)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors font-medium text-xs">
                  <Upload size={15} className="text-slate-600" />
                  <span>{newSoDoFile ? "Đổi tệp đính kèm Sổ đỏ" : "Tải lên tệp Sổ đỏ (PDF / Ảnh)"}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], (fileObj) => {
                          setNewSoDoFile(fileObj);
                          notify(`Đã đính kèm tệp ${fileObj.name}`, "success");
                        });
                      }
                    }}
                  />
                </label>
                {newSoDoFile && (
                  <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs bg-slate-50 border-slate-300">
                    <FileText size={14} className="text-primary" />
                    <span className="font-semibold text-slate-800">{newSoDoFile.name}</span>
                    <span className="text-slate-500 font-mono">({newSoDoFile.size})</span>
                    <button
                      type="button"
                      onClick={() => setNewSoDoFile(null)}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Cơ sở Lưu trú / Cho thuê Nhà trọ */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-amber-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-800 rounded-lg">
                  <Building size={18} />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                    5. Cơ sở Lưu trú / Cho thuê Nhà trọ
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Thông số quản lý phòng trọ, lưu lượng nhân khẩu tạm trú tại địa bàn
                  </CardDescription>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-900 bg-amber-100/70 hover:bg-amber-100 py-1.5 px-3 rounded-lg border border-amber-300/60 transition-colors">
                <input
                  type="checkbox"
                  checked={newIsAccommodation}
                  onChange={(e) => setNewIsAccommodation(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span>Là cơ sở lưu trú / nhà trọ cho thuê</span>
              </label>
            </div>
          </CardHeader>

          {newIsAccommodation ? (
            <CardContent className="p-4 sm:p-6 space-y-4 text-xs bg-amber-50/20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Số phòng trọ cho thuê
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newSoPhong}
                    onChange={(e) => setNewSoPhong(Number(e.target.value) || 0)}
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Số tầng lầu
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newSoTang}
                    onChange={(e) => setNewSoTang(Number(e.target.value) || 1)}
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Số người lưu trú dự kiến
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={newSoNguoiLuuTru}
                    onChange={(e) => setNewSoNguoiLuuTru(Number(e.target.value) || 0)}
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Giá thuê trung bình / tháng
                  </label>
                  <Input
                    type="text"
                    value={newGiaThue}
                    onChange={(e) => setNewGiaThue(e.target.value)}
                    className="h-10 text-xs bg-white"
                  />
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-4 sm:p-6 text-xs text-muted-foreground italic">
              Đánh dấu chọn "Là cơ sở lưu trú / nhà trọ cho thuê" ở góc trên nếu cơ sở này có phòng cho thuê để quản lý cư dân tạm trú.
            </CardContent>
          )}
        </Card>

        {/* Section 6: An toàn PCCC & Trạng thái Hoạt động */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                <ShieldCheck size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  6. An toàn PCCC & Trạng thái Hoạt động
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tiêu chuẩn thẩm duyệt phòng cháy chữa cháy và trạng thái giám sát
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Trạng thái hoạt động <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Đang hoạt động">✅ Đang hoạt động bình thường</option>
                  <option value="Tạm ngưng">⏸️ Tạm ngưng hoạt động</option>
                  <option value="Chờ duyệt">⏳ Chờ duyệt hồ sơ đăng ký</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer font-semibold p-3 border border-emerald-300/80 rounded-lg bg-emerald-50/40 hover:bg-emerald-50 text-emerald-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={newSafetyCertified}
                    onChange={(e) => setNewSafetyCertified(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Đã kiểm tra & Đạt tiêu chuẩn an toàn PCCC</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Action Bar */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg z-20">
          <div className="text-xs text-slate-500 hidden sm:block">
            Vui lòng kiểm tra kỹ các thông tin trước khi nhấn lưu vào cơ sở dữ liệu.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="text-xs font-semibold cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-sm cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>{isSubmitting ? "Đang xử lý đăng ký..." : "Đăng ký Cơ sở Kinh doanh"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

