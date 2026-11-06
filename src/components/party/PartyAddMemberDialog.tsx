import React, { useState, useMemo, useEffect } from "react";
import {
  UserPlus,
  Search,
  CheckCircle2,
  UploadCloud,
  X,
  FileCheck,
  Calendar,
  ShieldCheck,
  Award,
  AlertCircle,
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Users
} from "lucide-react";
import { Resident, Association, AssociationMember } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../ui/dialog";

export interface PartyAddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssociation: Association | null;
  residents?: Resident[];
  customRoles: string[];
  onAddMember: (member: AssociationMember) => void;
  showToast?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export default function PartyAddMemberDialog({
  open,
  onOpenChange,
  selectedAssociation,
  residents = [],
  customRoles,
  onAddMember,
  showToast
}: PartyAddMemberDialogProps) {
  const [activeStepTab, setActiveStepTab] = useState<"step-resident" | "step-role">("step-resident");
  const [residentSearchTerm, setResidentSearchTerm] = useState("");
  const [residenceFilter, setResidenceFilter] = useState<"all" | "Thường trú" | "Tạm trú">("all");
  const [selectedResidentCccd, setSelectedResidentCccd] = useState("");
  const [memberRole, setMemberRole] = useState(customRoles[0] || "Hội viên");
  const [memberJoinDate, setMemberJoinDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [memberDecisionNumber, setMemberDecisionNumber] = useState("");
  const [memberDecisionDate, setMemberDecisionDate] = useState("");
  const [memberDecisionFile, setMemberDecisionFile] = useState<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  } | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStepTab("step-resident");
      setSelectedResidentCccd("");
      setMemberRole(customRoles[0] || "Hội viên");
      setMemberJoinDate(new Date().toISOString().split("T")[0]);
      setMemberDecisionNumber("");
      setMemberDecisionDate("");
      setMemberDecisionFile(null);
      setResidentSearchTerm("");
      setResidenceFilter("all");
    }
  }, [open, customRoles]);

  // Filtered residents from 11,632 population
  const filteredResidentsForPick = useMemo(() => {
    const kw = residentSearchTerm.trim().toLowerCase();
    return residents
      .filter((r) => {
        const matchSearch =
          !kw ||
          r.fullName.toLowerCase().includes(kw) ||
          r.cccd.includes(kw) ||
          (r.phone && r.phone.includes(kw)) ||
          r.address.toLowerCase().includes(kw);
        const matchType =
          residenceFilter === "all" || r.status === residenceFilter;
        return matchSearch && matchType;
      })
      .slice(0, 30);
  }, [residents, residentSearchTerm, residenceFilter]);

  const selectedResident = useMemo(() => {
    return residents.find((r) => r.cccd === selectedResidentCccd);
  }, [residents, selectedResidentCccd]);

  const handleSave = () => {
    if (!selectedAssociation) {
      showToast?.("Vui lòng chọn tổ chức đoàn thể trước khi thêm hội viên!", "error");
      return;
    }

    if (!selectedResidentCccd || !selectedResident) {
      showToast?.("Vui lòng tìm và chọn cư dân từ danh sách!", "error");
      setActiveStepTab("step-resident");
      return;
    }

    // Check duplicate membership in this association
    if (selectedAssociation.members.some((m) => m.cccd === selectedResidentCccd)) {
      showToast?.(
        `${selectedResident.fullName} đã là thành viên của ${selectedAssociation.name}!`,
        "warning"
      );
      return;
    }

    const newMember: AssociationMember = {
      id: `M_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      fullName: selectedResident.fullName,
      role: memberRole,
      cccd: selectedResident.cccd,
      phone: selectedResident.phone || "",
      birthDate: selectedResident.birthDate || "",
      joinDate: memberJoinDate || new Date().toISOString().split("T")[0],
      decisionNumber: memberDecisionNumber.trim() || undefined,
      decisionDate: memberDecisionDate || undefined,
      decisionFile: memberDecisionFile || undefined
    };

    onAddMember(newMember);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <UserPlus className="w-5 h-5" />
              </span>
              <span>Bổ Nhiệm Cán Bộ / Hội Viên Mới</span>
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
              {selectedAssociation?.name || "Tổ chức KP3"}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn cư dân từ CSDL 11.632 nhân khẩu KP3, thiết lập chức vụ và lưu trữ hồ sơ quyết định chuẩn hóa.
          </DialogDescription>
        </DialogHeader>

        {/* Step Tabs Navigation */}
        <Tabs
          value={activeStepTab}
          onValueChange={(val) => setActiveStepTab(val as "step-resident" | "step-role")}
          className="w-full pt-2"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
            <TabsTrigger value="step-resident" className="gap-2 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>1. Chọn Cư Dân ({selectedResident ? "Đã chọn" : "Chưa chọn"})</span>
            </TabsTrigger>
            <TabsTrigger value="step-role" className="gap-2 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>2. Chức Danh & Quyết Định Bổ Nhiệm</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RESIDENT PICKER */}
          <TabsContent value="step-resident" className="space-y-3 mt-3">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Gõ họ tên, số CCCD, SĐT hoặc địa chỉ..."
                  value={residentSearchTerm}
                  onChange={(e) => setResidentSearchTerm(e.target.value)}
                  className="pl-8 pr-[5px] text-xs h-8 px-[5px]"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(["all", "Thường trú", "Tạm trú"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setResidenceFilter(filter)}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer border ${
                      residenceFilter === filter
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    {filter === "all" ? "Tất cả" : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Resident Cards Grid */}
            <div className="max-h-60 overflow-y-auto border border-border rounded-xl p-2 space-y-1.5 bg-muted/20">
              {filteredResidentsForPick.map((res) => {
                const isPicked = res.cccd === selectedResidentCccd;
                const isAlreadyMember = selectedAssociation?.members.some((m) => m.cccd === res.cccd);

                return (
                  <div
                    key={res.cccd}
                    onClick={() => {
                      if (!isAlreadyMember) {
                        setSelectedResidentCccd(res.cccd);
                      }
                    }}
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs transition-all ${
                      isAlreadyMember
                        ? "opacity-50 cursor-not-allowed bg-muted/40 border-border"
                        : isPicked
                        ? "bg-emerald-100/90 dark:bg-emerald-950/60 border-emerald-500 shadow-xs cursor-pointer font-bold text-emerald-950 dark:text-emerald-100"
                        : "bg-card border-border hover:bg-muted/50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        {res.fullName
                          .split(" ")
                          .slice(-2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">
                            {res.fullName}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                            {res.status || "Thường trú"}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          CCCD: {res.cccd} {res.phone ? `• SĐT: ${res.phone}` : ""} • {res.address}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAlreadyMember ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Đã tham gia
                        </span>
                      ) : isPicked ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Đã chọn</span>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground">
                          Chọn
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredResidentsForPick.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs italic">
                  Không tìm thấy cư dân nào khớp với "{residentSearchTerm}"
                </div>
              )}
            </div>

            {/* Selected Resident Live Card */}
            {selectedResident ? (
              <Card className="bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 shadow-xs">
                <CardContent className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                      ✓ Cư dân được chọn bổ nhiệm:
                    </span>
                    <div className="font-bold text-foreground text-sm truncate">
                      {selectedResident.fullName}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      CCCD: {selectedResident.cccd} • Năm sinh: {selectedResident.birthDate || "N/A"}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Địa chỉ: {selectedResident.address}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setActiveStepTab("step-role")}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                  >
                    <span>Tiếp tục bước 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="p-3 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                Vui lòng nhấn chọn một cư dân từ danh sách trên để tiếp tục thiết lập chức danh.
              </div>
            )}
          </TabsContent>

          {/* TAB 2: ROLE & LEGAL DECISION */}
          <TabsContent value="step-role" className="space-y-4 mt-3 text-xs">
            {selectedResident && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60 border border-border text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedResident.fullName
                      .split(" ")
                      .slice(-2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-foreground">{selectedResident.fullName}</span>
                    <span className="text-muted-foreground font-mono text-[10px] ml-2">
                      (CCCD: {selectedResident.cccd})
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveStepTab("step-resident")}
                  className="h-6 text-[10px] text-emerald-700 hover:bg-emerald-50"
                >
                  Đổi người khác
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Chức vụ / Vai trò <span className="text-rose-500">*</span>
                </label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full text-xs h-8 px-[5px] bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {customRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Ngày tham gia / Bổ nhiệm
                </label>
                <Input
                  type="date"
                  value={memberJoinDate}
                  onChange={(e) => setMemberJoinDate(e.target.value)}
                  className="text-xs h-8 px-[5px]"
                />
              </div>
            </div>

            <Separator />

            {/* Legal Decision Inputs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Văn bản Quyết định Công nhận (Chuẩn NĐ 80/2021/NĐ-CP)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">Không bắt buộc</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Số Quyết định
                  </span>
                  <Input
                    type="text"
                    placeholder="Ví dụ: QĐ-08/UBND-AP hoặc QĐ-12/ĐU-AP"
                    value={memberDecisionNumber}
                    onChange={(e) => setMemberDecisionNumber(e.target.value)}
                    className="text-xs h-8 font-mono px-[5px]"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Ngày ký ban hành
                  </span>
                  <Input
                    type="date"
                    value={memberDecisionDate}
                    onChange={(e) => setMemberDecisionDate(e.target.value)}
                    className="text-xs h-8 px-[5px]"
                  />
                </div>
              </div>
            </div>

            {/* Upload Simulator */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                Tệp scan Quyết định số hóa
              </label>
              <div className="p-3 border border-dashed border-border rounded-xl text-center hover:bg-muted/30 transition-colors">
                {memberDecisionFile ? (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-medium truncate">{memberDecisionFile.fileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMemberDecisionFile(null)}
                      className="h-6 px-1 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      setMemberDecisionFile({
                        fileName: `QuyetDinh_${memberDecisionNumber || "BoNhiem"}.pdf`,
                        fileUrl: "#",
                        fileType: "application/pdf"
                      })
                    }
                    className="cursor-pointer text-muted-foreground hover:text-foreground space-y-1"
                  >
                    <UploadCloud className="w-6 h-6 mx-auto text-emerald-600" />
                    <div className="text-xs font-semibold">Tải lên tệp scan quyết định (.PDF, .JPG)</div>
                    <div className="text-[10px] text-muted-foreground">
                      Bấm để đính kèm bản số hóa phục vụ lưu trữ hồ sơ Đảng - Đoàn thể KP3
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Hủy bỏ
          </Button>

          {activeStepTab === "step-resident" ? (
            <Button
              variant="default"
              size="sm"
              disabled={!selectedResident}
              onClick={() => setActiveStepTab("step-role")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Hoàn tất & Bổ nhiệm</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
