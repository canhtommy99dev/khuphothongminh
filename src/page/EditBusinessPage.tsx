import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Store,
  MapPin,
  UserCheck,
  FileText,
  Building,
  ShieldCheck,
  Upload,
  Pencil,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  Bed,
  History
} from "lucide-react";
import { Business, BusinessFile, Household } from "../types";
import { INDUSTRY_SECTORS } from "../components/business/businessConstants";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { navigate, ROUTES } from "../routes";
import { supabase } from "../lib/supabase";

export interface EditBusinessPageParams {
  id?: string;
  params?: string;
  [key: string]: string | undefined;
}

export interface EditBusinessPageProps {
  params?: EditBusinessPageParams;
  id?: string;
  business?: Business | null;
  businesses?: Business[];
  households?: Household[];
  onSave?: (updatedBusiness: Business) => void;
  onBack?: () => void;
  showToast?: (msg: string, type: "success" | "info" | "error" | "warning") => void;
}

export default function EditBusinessPage({
  params,
  id: idProp,
  business: businessProp,
  businesses = [],
  households = [],
  onSave,
  onBack,
  showToast
}: EditBusinessPageProps) {
  // 1. Resolve ID from props, params, or browser URL (/edit_bussiness/:params or /edit_business/:params)
  const resolvedId = useMemo(() => {
    if (idProp) return idProp;
    if (params?.id) return params.id;
    if (params?.params) return params.params;

    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/(?:dashboard\/)?edit_buss?iness\/([^/?#]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get("id") || urlParams.get("params");
      if (qId) return qId;
    }

    if (businessProp?.id) return businessProp.id;
    return null;
  }, [idProp, params, businessProp]);

  // 2. Fetch or resolve business entity
  const [fetchedBusiness, setFetchedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);

  const targetBusiness = useMemo(() => {
    if (businessProp && (!resolvedId || businessProp.id === resolvedId || businessProp.internalCode === resolvedId)) {
      return businessProp;
    }
    if (resolvedId && businesses && businesses.length > 0) {
      const match = businesses.find(b => b.id === resolvedId || b.internalCode === resolvedId);
      if (match) return match;
    }
    if (fetchedBusiness && (!resolvedId || fetchedBusiness.id === resolvedId || fetchedBusiness.internalCode === resolvedId)) {
      return fetchedBusiness;
    }
    if (businessProp) return businessProp;
    return null;
  }, [businessProp, resolvedId, businesses, fetchedBusiness]);

  useEffect(() => {
    if (!targetBusiness && resolvedId) {
      setLoading(true);
      (async () => {
        try {
          if (supabase) {
            const { data, error } = await (supabase as any)
              .from("businesses")
              .select("*")
              .or(`id.eq.${resolvedId},internal_code.eq.${resolvedId}`)
              .maybeSingle();

            if (data && !error) {
              const row = data as any;
              const mapped: Business = {
                id: row.id,
                name: row.name,
                type: row.type || row.sector || "Thương mại & Dịch vụ",
                industryGroup: row.industry_group || row.sector || "Thương mại & Dịch vụ",
                owner: row.owner || row.owner_name || "",
                address: row.address,
                phone: row.phone || "",
                licenseNumber: row.license_number || "",
                status: row.status || "Đang hoạt động",
                employeeCount: row.employee_count || 1,
                image: row.image || row.image_url || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500",
                coordinates: row.coordinates || (row.lat && row.lng ? `${row.lat}, ${row.lng}` : "10.7935, 106.7445"),
                safetyCertified: row.pccc_passed ?? row.safety_certified ?? true,
                internalCode: row.internal_code || `KP3-KD-${row.id.slice(0, 5)}`,
                soPhong: row.room_count,
                soTang: 1,
                soNguoiLuuTru: row.guest_count,
                dienTich: row.dien_tich || 100,
                loaiDat: row.loai_dat || "ODT",
                soThua: row.so_thua || "—",
                toBanDo: row.to_ban_do || "—",
                isAccommodation: Boolean(row.is_accommodation)
              };
              setFetchedBusiness(mapped);
            }
          }
        } catch (err) {
          console.error("Error fetching business by id in EditBusinessPage:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [targetBusiness, resolvedId]);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [industryGroup, setIndustryGroup] = useState("Dịch vụ ăn uống");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [status, setStatus] = useState<"Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt">("Đang hoạt động");
  const [employeeCount, setEmployeeCount] = useState(1);
  const [safetyCertified, setSafetyCertified] = useState(true);
  const [coordinates, setCoordinates] = useState("10.7935, 106.7445");
  const [image, setImage] = useState("");

  // SME Fields
  const [businessType, setBusinessType] = useState<"Hộ kinh doanh" | "Cơ sở kinh doanh khác" | "Doanh nghiệp tư nhân">("Hộ kinh doanh");
  const [enterpriseScale, setEnterpriseScale] = useState<"Siêu nhỏ (< 5 LĐ)" | "Nhỏ (5 - 20 LĐ)" | "Vừa (20 - 50 LĐ)" | "Lớn (> 50 LĐ)">("Siêu nhỏ (< 5 LĐ)");
  const [taxCode, setTaxCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [streetArea, setStreetArea] = useState("Mặt tiền Lương Định Của");
  const [premisesType, setPremisesType] = useState<"Nhà phố" | "Cửa hàng" | "Văn phòng" | "Nhà xưởng" | "Ki-ốt" | "Địa điểm thuê" | "Chung cư / Căn hộ">("Nhà phố");
  const [premisesOwner, setPremisesOwner] = useState("");
  const [linkedHouseholdCode, setLinkedHouseholdCode] = useState("");
  const [legalRepresentative, setLegalRepresentative] = useState("");
  const [legalRepPhone, setLegalRepPhone] = useState("");
  const [siteManager, setSiteManager] = useState("");
  const [siteManagerPhone, setSiteManagerPhone] = useState("");
  const [localWorkersCount, setLocalWorkersCount] = useState(0);
  const [temporaryWorkersCount, setTemporaryWorkersCount] = useState(0);
  const [foreignWorkersCount, setForeignWorkersCount] = useState(0);

  // Cadastral
  const [toBanDo, setToBanDo] = useState("272");
  const [soThua, setSoThua] = useState("55");
  const [dienTich, setDienTich] = useState("150");
  const [loaiDat, setLoaiDat] = useState("ODT");
  const [tenChuSuDung, setTenChuSuDung] = useState("");
  const [soGcn, setSoGcn] = useState("CH-098234");
  const [soVaoSo, setSoVaoSo] = useState("CS-2023-112");

  // Accommodation
  const [isAccommodation, setIsAccommodation] = useState(false);
  const [soPhong, setSoPhong] = useState(10);
  const [soTang, setSoTang] = useState(3);
  const [soNguoiLuuTru, setSoNguoiLuuTru] = useState(15);
  const [giaThueTrungBinh, setGiaThueTrungBinh] = useState("3.500.000 đ/tháng");

  // Files
  const [soDoFile, setSoDoFile] = useState<BusinessFile | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when targetBusiness is loaded
  useEffect(() => {
    if (targetBusiness) {
      setName(targetBusiness.name || "");
      setType(targetBusiness.type || "");
      setIndustryGroup(targetBusiness.industryGroup || "Dịch vụ ăn uống");
      setOwner(targetBusiness.owner || "");
      setPhone(targetBusiness.phone || "");
      setAddress(targetBusiness.address || "");
      setLicenseNumber(targetBusiness.licenseNumber || "");
      setStatus(targetBusiness.status as any || "Đang hoạt động");
      setEmployeeCount(targetBusiness.employeeCount || 1);
      setSafetyCertified(targetBusiness.safetyCertified ?? true);
      setCoordinates(targetBusiness.coordinates || "10.7935, 106.7445");
      setImage(targetBusiness.image || "");

      setBusinessType(targetBusiness.businessType as any || "Hộ kinh doanh");
      setEnterpriseScale(targetBusiness.enterpriseScale as any || "Siêu nhỏ (< 5 LĐ)");
      setTaxCode(targetBusiness.taxCode || "");
      setStartDate(targetBusiness.startDate || "01/01/2024");
      setStreetArea(targetBusiness.streetArea || "Mặt tiền Lương Định Của");
      setPremisesType(targetBusiness.premisesType as any || "Nhà phố");
      setPremisesOwner(targetBusiness.premisesOwner || "");
      setLinkedHouseholdCode(targetBusiness.linkedHouseholdCode || "");
      setLegalRepresentative(targetBusiness.legalRepresentative || targetBusiness.owner || "");
      setLegalRepPhone(targetBusiness.legalRepPhone || targetBusiness.phone || "");
      setSiteManager(targetBusiness.siteManager || "");
      setSiteManagerPhone(targetBusiness.siteManagerPhone || "");
      setLocalWorkersCount(targetBusiness.localWorkersCount || 0);
      setTemporaryWorkersCount(targetBusiness.temporaryWorkersCount || 0);
      setForeignWorkersCount(targetBusiness.foreignWorkersCount || 0);

      setToBanDo(targetBusiness.toBanDo || "272");
      setSoThua(targetBusiness.soThua || "55");
      setDienTich(String(targetBusiness.dienTich || "150"));
      setLoaiDat(targetBusiness.loaiDat || "ODT");
      setTenChuSuDung(targetBusiness.tenChuSuDung || targetBusiness.owner || "");
      setSoGcn(targetBusiness.soGcn || "CH-098234");
      setSoVaoSo(targetBusiness.soVaoSo || "CS-2023-112");

      setIsAccommodation(Boolean(targetBusiness.isAccommodation));
      setSoPhong(targetBusiness.soPhong || 10);
      setSoTang(targetBusiness.soTang || 3);
      setSoNguoiLuuTru(targetBusiness.soNguoiLuuTru || 15);
      setGiaThueTrungBinh(targetBusiness.giaThueTrungBinh || "3.500.000 đ/tháng");
      setSoDoFile(targetBusiness.soDoFile);
    }
  }, [targetBusiness]);

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

    if (!name.trim() || !owner.trim() || !address.trim()) {
      notify("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", "warning");
      return;
    }

    if (!targetBusiness) return;

    setIsSubmitting(true);

    const updated: Business = {
      ...targetBusiness,
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
      coordinates: coordinates || targetBusiness.coordinates,
      image: image || targetBusiness.image,
      taxCode: taxCode.trim(),
      businessType,
      enterpriseScale,
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

    // Sync to Supabase table if available
    try {
      if (supabase) {
        await (supabase as any)
          .from("businesses")
          .update({
            name: updated.name,
            tax_code: updated.taxCode || updated.licenseNumber,
            business_type: updated.businessType,
            industry_group: updated.industryGroup,
            owner_name: updated.owner,
            phone: updated.phone,
            address: updated.address,
            license_number: updated.licenseNumber,
            status: updated.status,
            safety_certified: updated.safetyCertified,
            employee_count: updated.employeeCount,
            image_url: updated.image,
            coordinates: updated.coordinates,
            is_accommodation: updated.isAccommodation,
            room_count: updated.soPhong,
            guest_count: updated.soNguoiLuuTru,
            pccc_passed: updated.safetyCertified,
            dien_tich: updated.dienTich,
            loai_dat: updated.loaiDat,
            so_thua: updated.soThua,
            to_ban_do: updated.toBanDo
          })
          .eq("id", updated.id);
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ Supabase khi cập nhật cơ sở:", err);
    }

    if (onSave) {
      onSave(updated);
    }

    notify(`Đã cập nhật thông tin cơ sở "${updated.name}" thành công!`, "success");
    setIsSubmitting(false);

    handleBack();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ cơ sở kinh doanh theo mã param...</p>
      </div>
    );
  }

  // Not found state
  if (!targetBusiness) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-base font-bold text-foreground">Không tìm thấy cơ sở kinh doanh để chỉnh sửa</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Không tìm thấy hồ sơ cơ sở kinh doanh {resolvedId ? (
            <>với mã param định danh: <strong className="font-mono text-foreground">{resolvedId}</strong></>
          ) : "tương ứng"}. Vui lòng kiểm tra lại liên kết hoặc quay lại danh sách.
        </p>
        <Button
          type="button"
          onClick={handleBack}
          className="gap-2 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh mục cơ sở</span>
        </Button>
      </div>
    );
  }

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
            <span className="text-foreground font-semibold">Chỉnh sửa</span>
            <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5 border-blue-500/40 text-blue-700 bg-blue-50/50">
              /edit_bussiness/{targetBusiness.id}
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
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg inline-flex">
                <Pencil size={20} />
              </span>
              Chỉnh sửa Cơ sở Kinh doanh: <span className="text-blue-700">{targetBusiness.name}</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Mã định danh: <strong className="font-mono text-slate-800">{targetBusiness.internalCode || targetBusiness.id}</strong> • Giấy phép: <strong className="font-mono text-slate-800">{targetBusiness.licenseNumber}</strong>
          </p>
        </div>

        {/* Quick action buttons on top */}
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
            onClick={() => {
              const form = document.getElementById("edit-business-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
          >
            <Pencil size={15} />
            <span>{isSubmitting ? "Đang lưu..." : "Cập nhật Hồ sơ"}</span>
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="edit-business-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Thông tin cơ sở & ngành nghề */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-700 rounded-lg">
                <Store size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  1. Thông tin Cơ sở Kinh doanh & Giấy phép
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Cập nhật tên hiệu kinh doanh, ngành nghề hoạt động và mã đăng ký
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số Giấy phép KD / Mã đăng ký
                </label>
                <Input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
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
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Hộ kinh doanh">Hộ kinh doanh cá thể</option>
                  <option value="Cơ sở kinh doanh khác">Cơ sở kinh doanh tại chỗ</option>
                  <option value="Doanh nghiệp tư nhân">Cơ sở tư nhân dịch vụ</option>
                  <option value="Công ty TNHH">Công ty TNHH</option>
                  <option value="Công ty Cổ phần">Công ty Cổ phần</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Quy mô cơ sở
                </label>
                <select
                  value={enterpriseScale}
                  onChange={(e) => setEnterpriseScale(e.target.value as any)}
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
                  Số lượng lao động tại cơ sở
                </label>
                <Input
                  type="number"
                  min="1"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value) || 1)}
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
                  value={industryGroup}
                  onChange={(e) => {
                    setIndustryGroup(e.target.value);
                    if (e.target.value === "Lưu trú & Cho thuê") {
                      setIsAccommodation(true);
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
                  Lĩnh vực / Loại hình cụ thể <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Mã số thuế (nếu có)
                </label>
                <Input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Địa điểm & Mặt bằng */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-700 rounded-lg">
                <MapPin size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  2. Địa điểm, Mặt bằng Kinh doanh & Tuyến đường
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Địa chỉ thực tế tại KP3 và liên kết mã hộ gia đình
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Tuyến đường / Phân khu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={streetArea}
                  onChange={(e) => setStreetArea(e.target.value)}
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
                  value={premisesType}
                  onChange={(e) => setPremisesType(e.target.value as any)}
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
                  value={premisesOwner}
                  onChange={(e) => setPremisesOwner(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Mã hộ dân KP3 liên kết
                </label>
                <Input
                  type="text"
                  value={linkedHouseholdCode}
                  onChange={(e) => setLinkedHouseholdCode(e.target.value)}
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
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Đường dẫn ảnh đại diện
                </label>
                <Input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
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
                  Chủ cơ sở, đại diện pháp lý và người quản lý tại điểm
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
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Người quản lý trực tiếp tại chỗ
                </label>
                <Input
                  type="text"
                  value={siteManager}
                  onChange={(e) => setSiteManager(e.target.value)}
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
                  value={localWorkersCount}
                  onChange={(e) => setLocalWorkersCount(Number(e.target.value) || 0)}
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
                  value={temporaryWorkersCount}
                  onChange={(e) => setTemporaryWorkersCount(Number(e.target.value) || 0)}
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
                  value={foreignWorkersCount}
                  onChange={(e) => setForeignWorkersCount(Number(e.target.value) || 0)}
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
                  Tờ bản đồ, số thửa, diện tích và tệp hồ sơ đính kèm
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Tờ bản đồ số *
                </label>
                <Input
                  type="text"
                  value={toBanDo}
                  onChange={(e) => setToBanDo(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số thửa đất *
                </label>
                <Input
                  type="text"
                  value={soThua}
                  onChange={(e) => setSoThua(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Diện tích (m²)
                </label>
                <Input
                  type="number"
                  value={dienTich}
                  onChange={(e) => setDienTich(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Loại đất
                </label>
                <Input
                  type="text"
                  value={loaiDat}
                  onChange={(e) => setLoaiDat(e.target.value)}
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
                  value={tenChuSuDung}
                  onChange={(e) => setTenChuSuDung(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số phát hành GCN
                </label>
                <Input
                  type="text"
                  value={soGcn}
                  onChange={(e) => setSoGcn(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Số vào sổ cấp GCN
                </label>
                <Input
                  type="text"
                  value={soVaoSo}
                  onChange={(e) => setSoVaoSo(e.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>

            {/* Upload Sổ đỏ File */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="font-semibold text-slate-800 block">
                Hồ sơ Giấy chứng nhận QSDĐ (Sổ đỏ PDF / Hình ảnh)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors font-medium text-xs">
                  <Upload size={15} className="text-slate-600" />
                  <span>{soDoFile ? "Đổi tệp Sổ đỏ" : "Tải lên Sổ đỏ (PDF / Ảnh)"}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], (fileObj) => {
                          setSoDoFile(fileObj);
                          notify(`Đã đính kèm tệp ${fileObj.name}`, "success");
                        });
                      }
                    }}
                  />
                </label>
                {soDoFile && (
                  <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs bg-slate-50 border-slate-300">
                    <FileText size={14} className="text-primary" />
                    <span className="font-semibold text-slate-800">{soDoFile.name}</span>
                    <span className="text-slate-500 font-mono">({soDoFile.size})</span>
                    <button
                      type="button"
                      onClick={() => setSoDoFile(undefined)}
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
                    Thông số quản lý phòng trọ và nhân khẩu lưu trú
                  </CardDescription>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-900 bg-amber-100/70 hover:bg-amber-100 py-1.5 px-3 rounded-lg border border-amber-300/60 transition-colors">
                <input
                  type="checkbox"
                  checked={isAccommodation}
                  onChange={(e) => setIsAccommodation(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span>Là cơ sở lưu trú / nhà trọ cho thuê</span>
              </label>
            </div>
          </CardHeader>

          {isAccommodation ? (
            <CardContent className="p-4 sm:p-6 space-y-4 text-xs bg-amber-50/20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Số phòng trọ
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={soPhong}
                    onChange={(e) => setSoPhong(Number(e.target.value) || 0)}
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Số tầng
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={soTang}
                    onChange={(e) => setSoTang(Number(e.target.value) || 1)}
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Số người lưu trú
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={soNguoiLuuTru}
                    onChange={(e) => setSoNguoiLuuTru(Number(e.target.value) || 0)}
                    className="h-10 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 block">
                    Giá thuê tham khảo
                  </label>
                  <Input
                    type="text"
                    value={giaThueTrungBinh}
                    onChange={(e) => setGiaThueTrungBinh(e.target.value)}
                    className="h-10 text-xs bg-white"
                  />
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-4 sm:p-6 text-xs text-muted-foreground italic">
              Đánh dấu chọn "Là cơ sở lưu trú / nhà trọ cho thuê" ở góc trên nếu cơ sở này có phòng trọ cho thuê.
            </CardContent>
          )}
        </Card>

        {/* Section 6: An toàn PCCC & Trạng thái */}
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
                  Tiêu chuẩn thẩm duyệt PCCC và trạng thái giám sát
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Đang hoạt động">✅ Đang hoạt động bình thường</option>
                  <option value="Tạm ngưng">⏸️ Tạm ngưng hoạt động</option>
                  <option value="Chờ duyệt">⏳ Chờ duyệt hồ sơ</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer font-semibold p-3 border border-emerald-300/80 rounded-lg bg-emerald-50/40 hover:bg-emerald-50 text-emerald-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={safetyCertified}
                    onChange={(e) => setSafetyCertified(e.target.checked)}
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
            Cơ sở: <strong>{targetBusiness.name}</strong> • Vui lòng kiểm tra lại thông tin trước khi nhấn lưu cập nhật.
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
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-sm cursor-pointer"
            >
              <Pencil size={16} />
              <span>{isSubmitting ? "Đang lưu cập nhật..." : "Cập nhật Hồ sơ Cơ sở"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

