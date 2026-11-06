import React, { useState } from "react";
import {
  Eye,
  ShieldCheck,
  Calendar,
  Phone,
  Home,
  FileCheck,
  Layers,
  Award,
  Printer,
  Pencil,
  MapPin,
  User,
  Flag,
  FileText,
  BadgeCheck,
  Building,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { Resident, Association, AssociationMember } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
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
import { getCategoryBadgeStyle } from "./partyConstants";

export interface PartyMemberDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AssociationMember | null;
  selectedAssociation?: Association | null;
  associations?: Association[];
  residents?: Resident[];
  onEditMember?: (member: AssociationMember) => void;
  onViewDecision?: (decision: {
    decisionNumber: string;
    decisionDate?: string;
    associationName: string;
    memberName: string;
    memberRole: string;
    memberCccd: string;
    fileInfo?: any;
  }) => void;
}

export default function PartyMemberDetailDialog({
  open,
  onOpenChange,
  member,
  selectedAssociation,
  associations = [],
  residents = [],
  onEditMember,
  onViewDecision
}: PartyMemberDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "appointment" | "multi-role">("profile");

  if (!member) return null;

  // Find matching resident profile from 11,632 population
  const resident = residents.find((r) => r.cccd === member.cccd);

  // Find all associations this resident is currently participating in
  const participatedAssociations = associations.filter((assoc) =>
    assoc.members.some((m) => m.cccd === member.cccd)
  );

  const isMultiRole = participatedAssociations.length > 1;

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <Eye className="w-5 h-5" />
              </span>
              <span>Trích Lục Hồ Sơ Cán Bộ / Hội Viên Cơ Sở</span>
            </DialogTitle>
            {isMultiRole ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs">
                ★ Cán bộ Đa nhiệm ({participatedAssociations.length} vai trò)
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-xs">
                Hội viên
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Thông tin nhân thân trích xuất từ CSDL 11.632 cư dân KP3 và lịch sử bổ nhiệm đoàn thể.
          </DialogDescription>
        </DialogHeader>

        {/* Hero Cadre Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-slate-900 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {member.fullName
                .split(" ")
                .slice(-2)
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground truncate">
                  {member.fullName}
                </h3>
                <Badge variant="default" className="bg-emerald-600 text-[10px] font-bold">
                  {member.role}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Tổ chức: <strong className="text-foreground">{selectedAssociation?.name || "Khối đoàn thể KP3"}</strong>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Số CCCD: <strong className="text-foreground">{member.cccd}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEditMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEditMember(member);
                }}
                className="h-8 gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Sửa hồ sơ</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Dossier Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "profile" | "appointment" | "multi-role")}
          className="w-full pt-1"
        >
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1">
            <TabsTrigger value="profile" className="gap-1.5 text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>1. Nhân Thân & Cư Trú</span>
            </TabsTrigger>
            <TabsTrigger value="appointment" className="gap-1.5 text-xs font-semibold">
              <FileCheck className="w-3.5 h-3.5" />
              <span>2. Quyết Định Bổ Nhiệm</span>
            </TabsTrigger>
            <TabsTrigger value="multi-role" className="gap-1.5 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>3. Kiêm Nhiệm ({participatedAssociations.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DEMOGRAPHIC & RESIDENCE */}
          <TabsContent value="profile" className="mt-3 space-y-3">
            <Card className="shadow-xs border-border">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-xl">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Số điện thoại
                    </span>
                    {member.phone ? (
                      <a
                        href={`tel:${member.phone}`}
                        className="font-bold text-emerald-700 hover:underline font-mono text-xs flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{member.phone}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Chưa có</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Ngày / Năm sinh
                    </span>
                    <strong className="text-foreground font-semibold">
                      {member.birthDate || resident?.birthDate || "Chưa cập nhật"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Giới tính
                    </span>
                    <strong className="text-foreground font-semibold">
                      {resident?.gender || "Nam"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Tình trạng cư trú
                    </span>
                    <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                      {resident?.status || "Thường trú"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Chỗ ở hiện tại tại KP3:
                    </span>
                    <div className="text-foreground font-medium flex items-center gap-1.5 mt-0.5 p-2 bg-muted/30 rounded-lg">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{resident?.currentAddress || resident?.address || "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"}</span>
                    </div>
                  </div>

                  {resident?.permanentAddress && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Nơi thường trú gốc (Quê quán):
                      </span>
                      <div className="text-foreground text-xs p-2 bg-muted/20 rounded-lg">
                        {resident.permanentAddress}
                      </div>
                    </div>
                  )}

                  {resident?.householdId && (
                    <div className="p-2.5 rounded-lg border border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-emerald-600" />
                        <span>
                          Sổ hộ khẩu điện tử: <strong>{resident.householdId}</strong>
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Quan hệ: {resident.relationToOwner || "Thành viên"}
                      </Badge>
                    </div>
                  )}

                  {/* CCCD textfield with 5px padding */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Số CCCD / Mã Định Danh Cá Nhân (Khóa định danh CSDL)
                    </span>
                    <Input
                      readOnly
                      value={member.cccd}
                      className="text-xs h-8 font-mono px-[5px] bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: APPOINTMENT & LEGAL DECISION */}
          <TabsContent value="appointment" className="mt-3 space-y-3">
            <Card className="shadow-xs border-border">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Ngày tham gia tổ chức
                    </span>
                    <strong className="text-foreground font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{member.joinDate || "15/01/2020"}</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Tình trạng hoạt động
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Đang hoạt động tích cực</span>
                    </span>
                  </div>
                </div>

                {/* Legal Decision Box */}
                {member.decisionNumber ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 font-mono">
                          Quyết định số: {member.decisionNumber}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Ban hành ngày: {member.decisionDate || "15/01/2020"} • Chuẩn y chức danh
                        </div>
                      </div>
                    </div>

                    {onViewDecision && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          onViewDecision({
                            decisionNumber: member.decisionNumber || "",
                            decisionDate: member.decisionDate,
                            associationName: selectedAssociation?.name || "Tổ chức đoàn thể KP3",
                            memberName: member.fullName,
                            memberRole: member.role,
                            memberCccd: member.cccd,
                            fileInfo: member.decisionFile
                          });
                        }}
                        className="text-xs h-8 gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem toàn văn QĐ</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-muted/40 rounded-xl border border-dashed text-muted-foreground text-xs italic flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Hồ sơ này chưa được gắn số Quyết định chuẩn y chính thức.</span>
                  </div>
                )}

                {/* Decision Number textfield with 5px padding */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Mã số Quyết định Bổ nhiệm (Bản lưu CSDL)
                  </span>
                  <Input
                    readOnly
                    value={member.decisionNumber || "Chưa có quyết định"}
                    className="text-xs h-8 font-mono px-[5px] bg-background"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CROSS-ORGANIZATION MULTI-ROLE */}
          <TabsContent value="multi-role" className="mt-3 space-y-3">
            <Card className="shadow-xs border-border">
              <CardHeader className="p-3.5 pb-2">
                <CardTitle className="text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Các tổ chức đoàn thể đang cùng tham gia ({participatedAssociations.length})</span>
                  </span>
                  {isMultiRole && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">
                      Cán bộ Đa vai trò
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-3.5 pt-0 space-y-2">
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {participatedAssociations.map((assoc) => {
                    const assignedMember = assoc.members.find((m) => m.cccd === member.cccd);
                    const isCurrentAssoc = selectedAssociation?.id === assoc.id;

                    return (
                      <div
                        key={assoc.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                          isCurrentAssoc
                            ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/20"
                            : "bg-card border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryBadgeStyle(assoc.category)}`}>
                            {assoc.category}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              {assoc.name}
                            </span>
                            {isCurrentAssoc && (
                              <span className="text-[10px] text-emerald-700 font-bold block">
                                (Đang chọn xem)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Badge variant="outline" className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
                            {assignedMember?.role || "Hội viên"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}

                  {participatedAssociations.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-xs italic">
                      Chưa tham gia tổ chức đoàn thể nào
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintDossier}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In lý lịch trích lục</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
