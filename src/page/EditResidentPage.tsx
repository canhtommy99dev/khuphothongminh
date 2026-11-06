import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserCheck,
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
  Sparkles,
  Pencil
} from "lucide-react";
import { Resident, Household } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { navigate, ROUTES } from "../routes";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface EditResidentPageParams {
  id?: string;
}

export interface EditResidentPageProps {
  id?: string;
  resident?: Resident | null;
  residents?: Resident[];
  households?: Household[];
  onSave?: (updatedResident: Resident) => void;
  onBack?: () => void;
  showToast?: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function EditResidentPage({
  id,
  resident: initialResident,
  residents = [],
  households = [],
  onSave,
  onBack,
  showToast
}: EditResidentPageProps) {
  // Resolve current resident
  const [currentResident, setCurrentResident] = useState<Resident | null>(() => {
    if (initialResident) return initialResident;
    if (id) {
      return residents.find((r) => r.id === id || r.cccd === id) || null;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!currentResident && Boolean(id));

  // Form states
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"Nam" | "Nữ">("Nam");
  const [birthDate, setBirthDate] = useState("01/01/1990");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"Thường trú" | "Tạm trú" | "Tạm vắng">("Thường trú");
  const [ethnicity, setEthnicity] = useState("Kinh");
  const [religion, setReligion] = useState("Không");
  const [nationality, setNationality] = useState("Việt Nam");

  // Address & Household
  const [address, setAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [temporaryAddress, setTemporaryAddress] = useState("");
  const [hometown, setHometown] = useState("");
  const [householdId, setHouseholdId] = useState("");
  const [relationToOwner, setRelationToOwner] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");

  // Temporary Residence
  const [temporaryRegDate, setTemporaryRegDate] = useState("");
  const [temporaryExpDate, setTemporaryExpDate] = useState("");
  const [managementStatus, setManagementStatus] = useState("Bình thường");
  const [notes, setNotes] = useState("");

  // Career, Health & Social
  const [occupation, setOccupation] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [education, setEducation] = useState("12/12");
  const [maritalStatus, setMaritalStatus] = useState<"Độc thân" | "Đã kết hôn" | "Ly hôn" | "Góa">("Đã kết hôn");
  const [idIssueDate, setIdIssueDate] = useState("");
  const [idIssuePlace, setIdIssuePlace] = useState("");
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState("");
  const [militaryServiceStatus, setMilitaryServiceStatus] = useState("");
  const [policyGroup, setPolicyGroup] = useState("Bình thường");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Foreigner fields
  const [isForeigner, setIsForeigner] = useState(false);
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

  const populateFields = (res: Resident) => {
    setFullName(res.fullName || "");
    setGender(res.gender || "Nam");
    setBirthDate(res.birthDate || "01/01/1990");
    setCccd(res.cccd || "");
    setPhone(res.phone || "");
    setStatus(res.status || "Thường trú");
    setEthnicity(res.ethnicity || "Kinh");
    setReligion(res.religion || "Không");
    setNationality(res.nationality || "Việt Nam");

    setAddress(res.address || "");
    setPermanentAddress(res.permanentAddress || "");
    setTemporaryAddress(res.temporaryAddress || "");
    setHometown(res.hometown || "");
    setHouseholdId(res.householdId || "");
    setRelationToOwner(res.relationToOwner || "Thành viên");
    setFatherName(res.fatherName || "");
    setMotherName(res.motherName || "");

    setTemporaryRegDate(res.temporaryRegDate || "");
    setTemporaryExpDate(res.temporaryExpDate || "");
    setManagementStatus(res.managementStatus || "Bình thường");
    setNotes(res.notes || "");

    setOccupation(res.occupation || "");
    setWorkplace(res.workplace || "");
    setEducation(res.education || "12/12");
    setMaritalStatus((res.maritalStatus as any) || "Đã kết hôn");
    setIdIssueDate(res.idIssueDate || "");
    setIdIssuePlace(res.idIssuePlace || "");
    setHealthInsuranceNumber(res.healthInsuranceNumber || "");
    setMilitaryServiceStatus(res.militaryServiceStatus || "Đã hoàn thành");
    setPolicyGroup(res.policyGroup || "Bình thường");
    setEmergencyContact(res.emergencyContact || "");

    const foreign = Boolean(
      res.isForeigner ||
      (res.nationality && res.nationality !== "Việt Nam") ||
      res.passportNumber
    );
    setIsForeigner(foreign);
    setPassportNumber(res.passportNumber || "");
    setPassportExpiryDate(res.passportExpiryDate || "");
    setVisaOrCardType(res.visaOrCardType || "Thẻ tạm trú (TRC)");
    setVisaOrCardNumber(res.visaOrCardNumber || "");
    setVisaValidFrom(res.visaValidFrom || "");
    setVisaValidUntil(res.visaValidUntil || "");
    setTemporaryRegistrationCode(res.temporaryRegistrationCode || "");
    setTemporaryRegistrationDate(res.temporaryRegistrationDate || "");
    setTemporaryRegistrationStatus(res.temporaryRegistrationStatus || "Đã khai báo");
    setWorkPermitNumber(res.workPermitNumber || "");
    setSponsoringOrganization(res.sponsoringOrganization || "");
    setLandlordContact(res.landlordContact || "");
  };

  // If initial resident changes
  useEffect(() => {
    if (initialResident) {
      setCurrentResident(initialResident);
      populateFields(initialResident);
    }
  }, [initialResident]);

  // Fetch from Supabase if not found locally
  useEffect(() => {
    if (!currentResident && id) {
      const found = residents.find((r) => r.id === id || r.cccd === id);
      if (found) {
        setCurrentResident(found);
        populateFields(found);
        setIsLoading(false);
      } else if (isSupabaseConfigured && supabase) {
        setIsLoading(true);
        (supabase as any)
          .from("residents")
          .select("*")
          .or(`id.eq.${id},cccd.eq.${id}`)
          .maybeSingle()
          .then(({ data, error }: any) => {
            if (data && !error) {
              const mapped: Resident = {
                id: data.id,
                fullName: data.full_name || data.fullName,
                gender: data.gender || "Nam",
                birthDate: data.birth_date || data.birthDate || "",
                cccd: data.cccd || "",
                phone: data.phone || "",
                status: data.status || "Thường trú",
                occupation: data.occupation || "",
                address: data.address || "",
                householdId: data.household_id || data.householdId || "",
                relationToOwner: data.relation_to_owner || data.relationToOwner || "",
                ethnicity: data.ethnicity || "Kinh",
                religion: data.religion || "Không",
                nationality: data.nationality || "Việt Nam",
                hometown: data.hometown || "",
                permanentAddress: data.permanent_address || "",
                temporaryAddress: data.temporary_address || "",
                currentAddress: data.current_address || "",
                education: data.education || "",
                fatherName: data.father_name || "",
                motherName: data.mother_name || "",
                temporaryRegDate: data.temporary_reg_date || "",
                temporaryExpDate: data.temporary_exp_date || "",
                managementStatus: data.management_status || "Bình thường",
                maritalStatus: data.marital_status || "Đã kết hôn",
                workplace: data.workplace || "",
                idIssueDate: data.id_issue_date || "",
                idIssuePlace: data.id_issue_place || "",
                healthInsuranceNumber: data.health_insurance_number || "",
                militaryServiceStatus: data.military_service_status || "",
                policyGroup: data.policy_group || "Bình thường",
                emergencyContact: data.emergency_contact || "",
                notes: data.notes || ""
              };
              setCurrentResident(mapped);
              populateFields(mapped);
            }
            setIsLoading(false);
          });
      }
    }
  }, [id, currentResident, residents]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      notify("Vui lòng nhập Họ và Tên cư dân", "error");
      setActiveTab("basic");
      return;
    }

    const finalCccd = (cccd || passportNumber || "").trim();
    if (!finalCccd) {
      notify("Vui lòng nhập Số CCCD hoặc Số Hộ chiếu", "error");
      setActiveTab("basic");
      return;
    }

    setIsSubmitting(true);

    try {
      const targetId = currentResident?.id || id || `R${Date.now()}`;

      const updatedResident: Resident = {
        ...(currentResident || {}),
        id: targetId,
        fullName: fullName.trim(),
        gender,
        birthDate: birthDate.trim(),
        cccd: finalCccd,
        phone: phone.trim(),
        status,
        occupation: occupation.trim(),
        address: address.trim(),
        householdId: householdId.trim(),
        relationToOwner: relationToOwner.trim(),
        ethnicity: ethnicity.trim(),
        religion: religion.trim(),
        nationality: nationality.trim(),
        hometown: hometown.trim(),
        permanentAddress: permanentAddress.trim(),
        temporaryAddress: temporaryAddress.trim(),
        currentAddress: address.trim(),
        education: education.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        temporaryRegDate: temporaryRegDate.trim(),
        temporaryExpDate: temporaryExpDate.trim(),
        managementStatus: managementStatus.trim(),
        maritalStatus,
        workplace: workplace.trim(),
        idIssueDate: idIssueDate.trim(),
        idIssuePlace: idIssuePlace.trim(),
        healthInsuranceNumber: healthInsuranceNumber.trim(),
        militaryServiceStatus: militaryServiceStatus.trim(),
        policyGroup: policyGroup.trim(),
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
          const { error } = await (supabase as any)
            .from("residents")
            .update({
              full_name: updatedResident.fullName,
              gender: updatedResident.gender,
              birth_date: updatedResident.birthDate,
              cccd: updatedResident.cccd,
              phone: updatedResident.phone,
              status: updatedResident.status,
              occupation: updatedResident.occupation,
              address: updatedResident.address,
              household_id: updatedResident.householdId,
              relation_to_owner: updatedResident.relationToOwner,
              ethnicity: updatedResident.ethnicity,
              religion: updatedResident.religion,
              nationality: updatedResident.nationality,
              hometown: updatedResident.hometown,
              permanent_address: updatedResident.permanentAddress,
              temporary_address: updatedResident.temporaryAddress,
              current_address: updatedResident.currentAddress,
              education: updatedResident.education,
              father_name: updatedResident.fatherName,
              mother_name: updatedResident.motherName,
              temporary_reg_date: updatedResident.temporaryRegDate,
              temporary_exp_date: updatedResident.temporaryExpDate,
              management_status: updatedResident.managementStatus,
              marital_status: updatedResident.maritalStatus,
              workplace: updatedResident.workplace,
              id_issue_date: updatedResident.idIssueDate,
              id_issue_place: updatedResident.idIssuePlace,
              health_insurance_number: updatedResident.healthInsuranceNumber,
              military_service_status: updatedResident.militaryServiceStatus,
              policy_group: updatedResident.policyGroup,
              emergency_contact: updatedResident.emergencyContact,
              notes: updatedResident.notes
            })
            .eq("id", updatedResident.id);

          if (error) {
            console.warn("Supabase update error (falling back to local state):", error);
          }
        } catch (dbErr) {
          console.warn("Supabase exception:", dbErr);
        }
      }

      if (onSave) {
        onSave(updatedResident);
      }

      notify(`Cập nhật hồ sơ cư dân "${updatedResident.fullName}" thành công!`, "success");
      handleBack();
    } catch (err: any) {
      console.error("Update resident failed:", err);
      notify("Có lỗi xảy ra khi lưu thông tin cư dân", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin hồ sơ cư dân...</p>
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
              Cư dân & Nhân khẩu
            </button>
            <span>/</span>
            <span className="text-foreground font-semibold">Chỉnh sửa hồ sơ</span>
            <Badge
              variant="outline"
              className="font-mono text-[10px] py-0 px-1.5 border-blue-500/40 text-blue-700 bg-blue-50/50"
            >
              /edit_resident/{currentResident?.id || id}
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
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg inline-flex">
                <Pencil size={20} />
              </span>
              Chỉnh Sửa Hồ Sơ: {currentResident?.fullName || fullName || "Cư dân"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Cập nhật và hoàn thiện các trường dữ liệu định danh, nơi cư trú, thông tin cha mẹ và thời hạn tạm trú.
          </p>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
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
              const form = document.getElementById("edit-resident-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>{isSubmitting ? "Đang lưu..." : "Lưu Cập Nhật"}</span>
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="edit-resident-form" onSubmit={handleSubmit} className="space-y-6">
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
                  <div className="p-2 bg-blue-500/10 text-blue-700 rounded-lg">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                      Thông Tin Định Danh Công Dân
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Mã cư dân: <span className="font-mono font-bold text-slate-800">{currentResident?.id || id}</span>
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
                      placeholder="VD: NGUYỄN VĂN AN"
                      className="h-10 text-xs font-medium uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "Nam" | "Nữ")}
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
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
                      Số CCCD / Định danh (12 số) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={cccd}
                      onChange={(e) => setCccd(e.target.value)}
                      placeholder="079090001234"
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
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
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
                  <div className="p-2 bg-blue-500/10 text-blue-700 rounded-lg">
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
                  <div className="p-2 bg-blue-500/10 text-blue-700 rounded-lg">
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
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
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
                  <div className="p-2 bg-blue-500/10 text-blue-700 rounded-lg">
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
                      className="w-full h-10 px-3 text-xs rounded-md border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
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
                        onChange={(e) => setPassportNumber(e.target.value)}
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
              <Sparkles size={16} className="text-blue-600 shrink-0" />
              <span>
                Các thay đổi sẽ được cập nhật trực tiếp vào cơ sở dữ liệu Supabase và đồng bộ tự động toàn hệ thống.
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer gap-2"
              >
                <Save size={15} />
                <span>{isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

