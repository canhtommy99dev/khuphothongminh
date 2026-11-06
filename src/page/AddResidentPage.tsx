import React, { useState } from "react";
import {
  ArrowLeft,
  UserCheck,
  Plus,
  Save,
  Globe,
  Home,
  Shield,
  FileText,
  Clock,
  Heart,
  Briefcase,
  AlertCircle,
  Building,
  CheckCircle2,
  Calendar,
  Phone,
  CreditCard,
  MapPin,
  Sparkles
} from "lucide-react";
import { Resident, Household } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { navigate, ROUTES } from "../routes";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface AddResidentPageProps {
  residents?: Resident[];
  households?: Household[];
  initialIsForeigner?: boolean;
  onAdd?: (newResident: Resident) => void;
  onBack?: () => void;
  showToast?: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function AddResidentPage({
  residents = [],
  households = [],
  initialIsForeigner = false,
  onAdd,
  onBack,
  showToast
}: AddResidentPageProps) {
  const [activeTab, setActiveTab] = useState(initialIsForeigner ? "foreigner" : "basic");
  const [isForeigner, setIsForeigner] = useState(initialIsForeigner);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - Basic Info
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"Nam" | "Nữ">("Nam");
  const [birthDate, setBirthDate] = useState("01/01/1990");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"Thường trú" | "Tạm trú" | "Tạm vắng">(
    initialIsForeigner ? "Tạm trú" : "Thường trú"
  );
  const [ethnicity, setEthnicity] = useState("Kinh");
  const [religion, setReligion] = useState("Không");
  const [nationality, setNationality] = useState(initialIsForeigner ? "Hàn Quốc" : "Việt Nam");

  // Address & Household
  const [address, setAddress] = useState("Khu phố 3, Phường An Phú, TP. Hồ Chí Minh");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [temporaryAddress, setTemporaryAddress] = useState("");
  const [hometown, setHometown] = useState("");
  const [householdId, setHouseholdId] = useState(households[0]?.code || "HK-001");
  const [relationToOwner, setRelationToOwner] = useState(initialIsForeigner ? "Khách trọ" : "Thành viên");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");

  // Temporary Residence
  const [temporaryRegDate, setTemporaryRegDate] = useState("");
  const [temporaryExpDate, setTemporaryExpDate] = useState("");
  const [managementStatus, setManagementStatus] = useState("Bình thường");
  const [notes, setNotes] = useState("");

  // Career, Health & Social
  const [occupation, setOccupation] = useState("Kinh doanh tự do");
  const [workplace, setWorkplace] = useState("");
  const [education, setEducation] = useState("12/12");
  const [maritalStatus, setMaritalStatus] = useState<"Độc thân" | "Đã kết hôn" | "Ly hôn" | "Góa">("Đã kết hôn");
  const [idIssueDate, setIdIssueDate] = useState("10/05/2021");
  const [idIssuePlace, setIdIssuePlace] = useState("Cục Cảnh sát QLHC về TTXH");
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState("");
  const [militaryServiceStatus, setMilitaryServiceStatus] = useState("Đã hoàn thành");
  const [policyGroup, setPolicyGroup] = useState("Bình thường");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Foreigner Specific Fields
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiryDate, setPassportExpiryDate] = useState("");
  const [visaOrCardType, setVisaOrCardType] = useState<
    "Thẻ tạm trú (TRC)" | "Thẻ thường trú (PRC)" | "Thị thực LĐ" | "Thị thực ĐT" | "Thị thực TT" | "Miễn thị thực / E-Visa"
  >("Thẻ tạm trú (TRC)");
  const [visaOrCardNumber, setVisaOrCardNumber] = useState("");
  const [visaValidFrom, setVisaValidFrom] = useState("");
  const [visaValidUntil, setVisaValidUntil] = useState("");
  const [temporaryRegistrationCode, setTemporaryRegistrationCode] = useState("");
  const [temporaryRegistrationDate, setTemporaryRegistrationDate] = useState("");
  const [temporaryRegistrationStatus, setTemporaryRegistrationStatus] = useState<
    "Đã khai báo" | "Chờ xác nhận" | "Chưa khai báo" | "Hết hạn"
  >("Đã khai báo");
  const [workPermitNumber, setWorkPermitNumber] = useState("");
  const [sponsoringOrganization, setSponsoringOrganization] = useState("");
  const [landlordContact, setLandlordContact] = useState("");

  const notify = (msg: string, type: "success" | "info" | "error" | "warning" = "success") => {
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
      navigate(ROUTES.DASHBOARD_RESIDENTS);
    }
  };

  const handleToggleForeigner = (checked: boolean) => {
    setIsForeigner(checked);
    if (checked) {
      setNationality("Hàn Quốc");
      setStatus("Tạm trú");
      setRelationToOwner("Khách trọ");
      setActiveTab("foreigner");
    } else {
      setNationality("Việt Nam");
      setStatus("Thường trú");
      setRelationToOwner("Thành viên");
      setActiveTab("basic");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      notify("Vui lòng nhập Họ và Tên cư dân", "error");
      setActiveTab("basic");
      return;
    }

    const finalCccd = (cccd || passportNumber || "").trim();
    if (!finalCccd) {
      notify(isForeigner ? "Vui lòng nhập Số Hộ chiếu" : "Vui lòng nhập Số CCCD / Định danh", "error");
      setActiveTab(isForeigner ? "foreigner" : "basic");
      return;
    }

    setIsSubmitting(true);

    try {
      const newId = "R" + (residents.length + 1).toString().padStart(5, "0");

      const newResident: Resident = {
        id: newId,
        fullName: fullName.trim(),
        gender,
        birthDate: birthDate.trim() || "01/01/1990",
        cccd: finalCccd,
        phone: phone.trim() || "Chưa cập nhật",
        status,
        occupation: occupation.trim() || "Tự do",
        address: address.trim(),
        householdId: householdId.trim() || "HK-001",
        relationToOwner: relationToOwner.trim() || "Thành viên",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        joinDate: new Date().toLocaleDateString("vi-VN"),
        ethnicity: ethnicity.trim() || "Kinh",
        religion: religion.trim() || "Không",
        nationality: nationality.trim() || "Việt Nam",
        hometown: hometown.trim(),
        permanentAddress: permanentAddress.trim() || address.trim(),
        temporaryAddress: temporaryAddress.trim() || address.trim(),
        currentAddress: address.trim(),
        education: education.trim() || "12/12",
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        temporaryRegDate: temporaryRegDate.trim(),
        temporaryExpDate: temporaryExpDate.trim(),
        managementStatus: managementStatus.trim() || "Bình thường",
        maritalStatus,
        workplace: workplace.trim(),
        idIssueDate: idIssueDate.trim(),
        idIssuePlace: idIssuePlace.trim(),
        healthInsuranceNumber: healthInsuranceNumber.trim(),
        militaryServiceStatus: militaryServiceStatus.trim(),
        policyGroup: policyGroup.trim() || "Bình thường",
        emergencyContact: emergencyContact.trim(),
        notes: notes.trim(),
        isForeigner,
        passportNumber: passportNumber.trim(),
        passportExpiryDate: passportExpiryDate.trim(),
        visaOrCardType: isForeigner ? visaOrCardType : undefined,
        visaOrCardNumber: visaOrCardNumber.trim(),
        visaValidFrom: visaValidFrom.trim(),
        visaValidUntil: visaValidUntil.trim(),
        temporaryRegistrationCode: temporaryRegistrationCode.trim(),
        temporaryRegistrationDate: temporaryRegistrationDate.trim(),
        temporaryRegistrationStatus: isForeigner ? temporaryRegistrationStatus : undefined,
        workPermitNumber: workPermitNumber.trim(),
        sponsoringOrganization: sponsoringOrganization.trim(),
        landlordContact: landlordContact.trim()
      };

      // Direct persist to Supabase PostgreSQL if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await (supabase as any).from("residents").insert([
            {
              id: newResident.id,
              full_name: newResident.fullName,
              gender: newResident.gender,
              birth_date: newResident.birthDate,
              cccd: newResident.cccd,
              phone: newResident.phone,
              status: newResident.status,
              occupation: newResident.occupation,
              address: newResident.address,
              household_id: newResident.householdId,
              relation_to_owner: newResident.relationToOwner,
              ethnicity: newResident.ethnicity,
              religion: newResident.religion,
              nationality: newResident.nationality,
              hometown: newResident.hometown,
              permanent_address: newResident.permanentAddress,
              temporary_address: newResident.temporaryAddress,
              current_address: newResident.currentAddress,
              education: newResident.education,
              father_name: newResident.fatherName,
              mother_name: newResident.motherName,
              temporary_reg_date: newResident.temporaryRegDate,
              temporary_exp_date: newResident.temporaryExpDate,
              management_status: newResident.managementStatus,
              marital_status: newResident.maritalStatus,
              workplace: newResident.workplace,
              id_issue_date: newResident.idIssueDate,
              id_issue_place: newResident.idIssuePlace,
              health_insurance_number: newResident.healthInsuranceNumber,
              military_service_status: newResident.militaryServiceStatus,
              policy_group: newResident.policyGroup,
              emergency_contact: newResident.emergencyContact,
              notes: newResident.notes
            }
          ]);

          if (error) {
            console.warn("Supabase insert error (falling back to local state):", error);
          }
        } catch (dbErr) {
          console.warn("Supabase exception:", dbErr);
        }
      }

      if (onAdd) {
        onAdd(newResident);
      }

      notify(
        isForeigner
          ? `Đã đăng ký cư dân nước ngoài "${newResident.fullName}" (${newResident.nationality}) thành công!`
          : `Đã thêm hồ sơ cư dân "${newResident.fullName}" thành công!`,
        "success"
      );

      handleBack();
    } catch (err: any) {
      console.error("Save resident failed:", err);
      notify("Có lỗi xảy ra khi tạo hồ sơ cư dân. Vui lòng kiểm tra lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
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
              Cư dân & Nhân khẩu
            </button>
            <span>/</span>
            <span className="text-foreground font-semibold">
              {isForeigner ? "Khai báo Người nước ngoài" : "Thêm Nhân Khẩu Mới"}
            </span>
            <Badge
              variant="outline"
              className="font-mono text-[10px] py-0 px-1.5 border-emerald-500/40 text-emerald-700 bg-emerald-50/50"
            >
              {isForeigner ? "/add_foreigner" : "/add_resident"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              title="Quay lại danh sách cư dân"
            >
              <ArrowLeft size={14} />
              <span>Quay lại</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className={`p-1.5 rounded-lg inline-flex ${isForeigner ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                {isForeigner ? <Globe size={20} /> : <UserCheck size={20} />}
              </span>
              {isForeigner ? "Khai Báo Cư Dân Nước Ngoài Mới" : "Tạo Lập Hồ Sơ Nhân Khẩu Mới"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Nhập thông tin định danh công dân hoặc người nước ngoài tạm trú theo chuẩn CSDL Quốc gia về Dân cư & Đề án 06.
          </p>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Người nước ngoài:</span>
            <button
              type="button"
              onClick={() => handleToggleForeigner(!isForeigner)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isForeigner ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isForeigner ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

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
              const form = document.getElementById("add-resident-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting}
            className={`gap-1.5 text-white font-bold shadow-sm cursor-pointer ${
              isForeigner ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Plus size={15} className="stroke-[3]" />
            <span>{isSubmitting ? "Đang lưu..." : isForeigner ? "Lưu Khai Báo" : "Lưu & Tạo Hồ Sơ"}</span>
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="add-resident-form" onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full justify-start overflow-x-auto gap-1">
            <TabsTrigger value="basic" className="rounded-lg text-xs font-semibold px-3.5 py-1.5 cursor-pointer gap-1.5">
              <UserCheck size={14} />
              <span>1. Định danh & Cơ bản</span>
            </TabsTrigger>
            <TabsTrigger value="address" className="rounded-lg text-xs font-semibold px-3.5 py-1.5 cursor-pointer gap-1.5">
              <Home size={14} />
              <span>2. Địa chỉ & Hộ khẩu</span>
            </TabsTrigger>
            <TabsTrigger value="temporary" className="rounded-lg text-xs font-semibold px-3.5 py-1.5 cursor-pointer gap-1.5">
              <Clock size={14} />
              <span>3. Tạm trú & Nhà trọ</span>
            </TabsTrigger>
            <TabsTrigger value="extra" className="rounded-lg text-xs font-semibold px-3.5 py-1.5 cursor-pointer gap-1.5">
              <Briefcase size={14} />
              <span>4. Đoàn thể & Y tế</span>
            </TabsTrigger>
            {isForeigner && (
              <TabsTrigger value="foreigner" className="rounded-lg text-xs font-semibold px-3.5 py-1.5 cursor-pointer gap-1.5 text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Globe size={14} />
                <span>5. Hồ sơ Người nước ngoài</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: BASIC INFO */}
          <TabsContent value="basic" className="space-y-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                      Thông Tin Định Danh Công Dân
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Họ tên, ngày sinh, giới tính và số định danh căn cước
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-800 block">
                      Họ và Tên Cư Dân <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: NGUYỄN VĂN AN hoặc JOHN DOE"
                      className="h-10 text-xs font-medium uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "Nam" | "Nữ")}
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">
                      Ngày sinh (DD/MM/YYYY) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="15/08/1990"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">
                      {isForeigner ? "Số Hộ Chiếu / Passport *" : "Số CCCD / Định danh (12 số) *"}
                    </label>
                    <Input
                      required
                      value={isForeigner ? (passportNumber || cccd) : cccd}
                      onChange={(e) => {
                        setCccd(e.target.value);
                        if (isForeigner) setPassportNumber(e.target.value);
                      }}
                      placeholder={isForeigner ? "M12345678" : "079090001234"}
                      className="h-10 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Số điện thoại liên hệ</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Diện cư trú</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Thường trú">Thường trú</option>
                      <option value="Tạm trú">Tạm trú</option>
                      <option value="Tạm vắng">Tạm vắng</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Quốc tịch</label>
                    <Input
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="Việt Nam, Hàn Quốc, Nhật Bản..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Dân tộc</label>
                    <Input
                      value={ethnicity}
                      onChange={(e) => setEthnicity(e.target.value)}
                      placeholder="Kinh, Tày, Hoa..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Tôn giáo</label>
                    <Input
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      placeholder="Không, Phật giáo, Công giáo..."
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ADDRESS & HOUSEHOLD */}
          <TabsContent value="address" className="space-y-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                    <Home size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                      Địa Chỉ Cư Trú & Sổ Hộ Khẩu
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Địa chỉ thực tế tại KP3, nơi thường trú gốc và phân bổ hộ gia đình
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-800 block">
                      Chỗ ở hiện nay tại Khu phố 3 <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số 17 Song Hành, KP3, Phường An Phú, TP. Thủ Đức"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-800 block">
                      Nơi thường trú gốc (ở quê quán theo CCCD)
                    </label>
                    <Input
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      placeholder="VD: Xã Hải Châu, Huyện Hải Hậu, Tỉnh Nam Định"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Quê quán</label>
                    <Input
                      value={hometown}
                      onChange={(e) => setHometown(e.target.value)}
                      placeholder="Quê quán nguyên quán"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">
                      Mã Sổ Hộ Khẩu Liên Kết (HK-xxx)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={householdId}
                        onChange={(e) => setHouseholdId(e.target.value)}
                        placeholder="HK-001"
                        className="h-10 text-xs font-mono font-semibold"
                      />
                      {households.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) setHouseholdId(e.target.value);
                          }}
                          className="h-10 px-2 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700"
                        >
                          <option value="">Chọn từ CSDL</option>
                          {households.slice(0, 50).map((h) => (
                            <option key={h.id || h.code} value={h.code}>
                              {h.code} - {h.ownerName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Quan hệ với chủ hộ</label>
                    <Input
                      value={relationToOwner}
                      onChange={(e) => setRelationToOwner(e.target.value)}
                      placeholder="Chủ hộ / Vợ / Con / Bố mẹ / Khách trọ..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Họ và Tên Cha</label>
                    <Input
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="NGUYỄN VĂN ..."
                      className="h-10 text-xs uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Họ và Tên Mẹ</label>
                    <Input
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="TRẦN THỊ ..."
                      className="h-10 text-xs uppercase"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: TEMPORARY RESIDENCE */}
          <TabsContent value="temporary" className="space-y-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                    <Clock size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                      Thời Hạn Tạm Trú & Cơ Sở Lưu Trú
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Theo dõi chu kỳ tạm trú, nhà trọ và cảnh báo gia hạn cho Công an khu vực
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Ngày đăng ký tạm trú</label>
                    <Input
                      value={temporaryRegDate}
                      onChange={(e) => setTemporaryRegDate(e.target.value)}
                      placeholder="15/01/2024"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Ngày hết hạn tạm trú</label>
                    <Input
                      value={temporaryExpDate}
                      onChange={(e) => setTemporaryExpDate(e.target.value)}
                      placeholder="15/01/2026"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-800 block">
                      Tình trạng quản lý tạm trú
                    </label>
                    <select
                      value={managementStatus}
                      onChange={(e) => setManagementStatus(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Bình thường">Bình thường (Đang lưu trú ổn định)</option>
                      <option value="Sắp hết hạn">Sắp hết hạn (Cần cảnh báo gia hạn)</option>
                      <option value="Đã chuyển đi">Đã chuyển đi</option>
                      <option value="Tạm vắng">Tạm vắng</option>
                      <option value="Cần rà soát an ninh">Cần rà soát an ninh</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-800 block">
                      Ghi chú cơ sở lưu trú / Chủ nhà trọ / Phòng số
                    </label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="VD: Nhà trọ Phạm Văn Bình (SĐT: 0913137155) Phòng 12..."
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: SOCIAL, CAREER & HEALTH */}
          <TabsContent value="extra" className="space-y-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                      Nghề Nghiệp, Y Tế & Chính Sách Xã Hội
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Hồ sơ việc làm, bảo hiểm y tế và diện đối tượng an sinh
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Nghề nghiệp</label>
                    <Input
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="Kỹ sư, Kinh doanh, Giáo viên..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Nơi làm việc / Cơ quan</label>
                    <Input
                      value={workplace}
                      onChange={(e) => setWorkplace(e.target.value)}
                      placeholder="Công ty TNHH An Phú..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Mã số thẻ BHYT</label>
                    <Input
                      value={healthInsuranceNumber}
                      onChange={(e) => setHealthInsuranceNumber(e.target.value)}
                      placeholder="DN4791234567890"
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Trình độ học vấn</label>
                    <Input
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="12/12, Đại học, Thạc sĩ..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Tình trạng hôn nhân</label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value as any)}
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Độc thân">Độc thân</option>
                      <option value="Đã kết hôn">Đã kết hôn</option>
                      <option value="Ly hôn">Ly hôn</option>
                      <option value="Góa">Góa</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Diện chính sách / Đoàn thể</label>
                    <Input
                      value={policyGroup}
                      onChange={(e) => setPolicyGroup(e.target.value)}
                      placeholder="Bình thường / Đảng viên / Gia đình chính sách..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Nghĩa vụ quân sự</label>
                    <Input
                      value={militaryServiceStatus}
                      onChange={(e) => setMilitaryServiceStatus(e.target.value)}
                      placeholder="Đã hoàn thành / Trong độ tuổi NVQS..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-800 block">
                      Liên hệ khẩn cấp (Họ tên & SĐT)
                    </label>
                    <Input
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="VD: Nguyễn Văn Nam (Anh ruột) - 0987654321"
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: FOREIGNER DETAILS */}
          {isForeigner && (
            <TabsContent value="foreigner" className="space-y-4">
              <Card className="border-blue-200 bg-blue-50/20 shadow-xs">
                <CardHeader className="p-4 sm:p-5 border-b border-blue-100 bg-blue-50/60">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                      <Globe size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                        Hồ Sơ Cư Trú Người Nước Ngoài (Xuất Nhập Cảnh)
                      </CardTitle>
                      <CardDescription className="text-xs text-blue-700">
                        Thông tin Hộ chiếu, Thẻ tạm trú (TRC), Thị thực và Khai báo tạm trú CA Phường
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">
                        Số Hộ chiếu (Passport No.) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required={isForeigner}
                        value={passportNumber}
                        onChange={(e) => {
                          setPassportNumber(e.target.value);
                          if (!cccd) setCccd(e.target.value);
                        }}
                        placeholder="M12345678"
                        className="h-10 text-xs font-mono font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">
                        Ngày hết hạn Hộ chiếu
                      </label>
                      <Input
                        value={passportExpiryDate}
                        onChange={(e) => setPassportExpiryDate(e.target.value)}
                        placeholder="20/12/2028"
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">Loại thị thực / Thẻ</label>
                      <select
                        value={visaOrCardType}
                        onChange={(e) => setVisaOrCardType(e.target.value as any)}
                        className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Thẻ tạm trú (TRC)">Thẻ tạm trú (TRC)</option>
                        <option value="Thẻ thường trú (PRC)">Thẻ thường trú (PRC)</option>
                        <option value="Thị thực LĐ">Thị thực LĐ (Lao động)</option>
                        <option value="Thị thực ĐT">Thị thực ĐT (Đầu tư)</option>
                        <option value="Thị thực TT">Thị thực TT (Thăm thân)</option>
                        <option value="Miễn thị thực / E-Visa">Miễn thị thực / E-Visa</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">Số Thẻ / Mã Thị Thực</label>
                      <Input
                        value={visaOrCardNumber}
                        onChange={(e) => setVisaOrCardNumber(e.target.value)}
                        placeholder="TRC-0792024..."
                        className="h-10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">Thời hạn từ ngày</label>
                      <Input
                        value={visaValidFrom}
                        onChange={(e) => setVisaValidFrom(e.target.value)}
                        placeholder="01/01/2024"
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">Thời hạn đến ngày</label>
                      <Input
                        value={visaValidUntil}
                        onChange={(e) => setVisaValidUntil(e.target.value)}
                        placeholder="01/01/2026"
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">
                        Mã khai báo tạm trú CA Phường
                      </label>
                      <Input
                        value={temporaryRegistrationCode}
                        onChange={(e) => setTemporaryRegistrationCode(e.target.value)}
                        placeholder="KB-AP-2024-0012"
                        className="h-10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">
                        Tình trạng khai báo
                      </label>
                      <select
                        value={temporaryRegistrationStatus}
                        onChange={(e) => setTemporaryRegistrationStatus(e.target.value as any)}
                        className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Đã khai báo">Đã khai báo</option>
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Chưa khai báo">Chưa khai báo</option>
                        <option value="Hết hạn">Hết hạn</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">
                        Số Giấy phép lao động (GPLĐ)
                      </label>
                      <Input
                        value={workPermitNumber}
                        onChange={(e) => setWorkPermitNumber(e.target.value)}
                        placeholder="GPLĐ-123456/SLĐTBXH"
                        className="h-10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-slate-800 block">
                        Cơ quan / Doanh nghiệp bảo lãnh
                      </label>
                      <Input
                        value={sponsoringOrganization}
                        onChange={(e) => setSponsoringOrganization(e.target.value)}
                        placeholder="Công ty TNHH Quốc tế An Phú..."
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 block">
                        Liên hệ chủ nhà / Ban quản lý
                      </label>
                      <Input
                        value={landlordContact}
                        onChange={(e) => setLandlordContact(e.target.value)}
                        placeholder="Nguyễn Văn A - 0909123456"
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Bottom Save Card Footer */}
        <Card className="border-border shadow-xs bg-slate-50/60">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <span>
                Hồ sơ mới sau khi lưu sẽ được mã hóa và cập nhật tự động vào CSDL Quốc gia và Sổ bộ địa bàn KP3.
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`text-white font-bold cursor-pointer gap-2 ${
                  isForeigner ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <Save size={15} />
                <span>{isSubmitting ? "Đang lưu..." : isForeigner ? "Lưu Khai Báo Người Nước Ngoài" : "Lưu & Hoàn Tất"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

