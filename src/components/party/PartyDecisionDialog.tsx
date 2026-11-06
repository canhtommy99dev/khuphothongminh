import React, { useState } from "react";
import {
  FileCheck,
  Printer,
  Download,
  Copy,
  Check,
  Calendar,
  Building2,
  ShieldCheck,
  Award,
  FileText,
  ExternalLink,
  Flag
} from "lucide-react";
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

export interface DecisionDocInfo {
  decisionNumber: string;
  decisionDate?: string;
  associationName: string;
  memberName: string;
  memberRole: string;
  memberCccd: string;
  fileInfo?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
}

export interface PartyDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: DecisionDocInfo | null;
}

export default function PartyDecisionDialog({
  open,
  onOpenChange,
  decision
}: PartyDecisionDialogProps) {
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState<"document" | "metadata">("document");

  if (!decision) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(decision.decisionNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <FileCheck className="w-5 h-5" />
              </span>
              <span>Văn Bản Quyết Định Bổ Nhiệm / Chuẩn Y</span>
            </DialogTitle>
            <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-300">
              {decision.decisionNumber}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Hồ sơ pháp lý điện tử lưu trữ theo quy chuẩn văn thư hành chính Nhà nước và Nghị định 80/2021/NĐ-CP.
          </DialogDescription>
        </DialogHeader>

        {/* View Mode Tabs */}
        <Tabs
          value={viewTab}
          onValueChange={(val) => setViewTab(val as "document" | "metadata")}
          className="w-full pt-1"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
            <TabsTrigger value="document" className="gap-2 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>Toàn Văn Quyết Định (Bản In A4)</span>
            </TabsTrigger>
            <TabsTrigger value="metadata" className="gap-2 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trích Lục Dữ Liệu & Tệp Đính Kèm</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OFFICIAL STATE DOCUMENT (A4 Format) */}
          <TabsContent value="document" className="mt-3">
            <div className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-xs text-foreground font-serif leading-relaxed text-xs sm:text-sm space-y-4">
              {/* Vietnam National Emblem & Header */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border text-center font-sans">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                    UBND PHƯỜNG AN PHÚ
                  </div>
                  <div className="text-[11px] font-bold uppercase text-foreground">
                    BAN ĐIỀU HÀNH KHU PHỐ 3
                  </div>
                  <div className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-bold pt-1">
                    Số: {decision.decisionNumber}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase text-foreground tracking-wider">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="text-xs font-semibold text-foreground underline decoration-1 underline-offset-4">
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="text-[10px] text-muted-foreground italic pt-1">
                    An Phú, ngày {decision.decisionDate || "15 tháng 01 năm 2024"}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-2 space-y-1 font-sans">
                <h3 className="text-base sm:text-lg font-bold uppercase text-foreground tracking-tight">
                  QUYẾT ĐỊNH
                </h3>
                <p className="text-xs font-semibold text-muted-foreground italic">
                  Về việc chuẩn y / công nhận chức danh đối với cán bộ, hội viên đoàn thể cơ sở
                </p>
              </div>

              {/* Legal Preamble */}
              <div className="space-y-1.5 text-xs text-muted-foreground italic">
                <p>
                  - Căn cứ Luật Tổ chức chính quyền địa phương ngày 19 tháng 6 năm 2015;
                </p>
                <p>
                  - Căn cứ Nghị định số 80/2021/NĐ-CP và Luật Thực hiện dân chủ ở cơ sở năm 2022;
                </p>
                <p>
                  - Xét đề nghị của Ban Chấp hành tổ chức: <strong>{decision.associationName}</strong>,
                </p>
              </div>

              <div className="text-center font-bold text-xs uppercase pt-1 tracking-wider">
                QUYẾT NGHỊ:
              </div>

              {/* Articles */}
              <div className="space-y-3 text-xs">
                <div>
                  <strong className="text-foreground">Điều 1.</strong> Nay chuẩn y và công nhận chức danh đối với nhân sự:
                  <div className="mt-2 ml-4 p-3 bg-muted/40 rounded-lg space-y-1.5 font-sans border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Họ và tên:</span>
                      <strong className="text-foreground text-sm">{decision.memberName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Số Căn cước công dân:</span>
                      <span className="font-mono font-bold text-foreground">{decision.memberCccd}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tổ chức sinh hoạt:</span>
                      <strong className="text-emerald-800 dark:text-emerald-300">{decision.associationName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Chức vụ bổ nhiệm:</span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                        {decision.memberRole}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <strong className="text-foreground">Điều 2.</strong> Đồng chí có tên tại Điều 1 có trách nhiệm thực hiện đầy đủ các nhiệm vụ, quyền hạn theo quy định của Điều lệ tổ chức và sự phân công của Ban điều hành cơ sở.
                </div>

                <div>
                  <strong className="text-foreground">Điều 3.</strong> Quyết định này có hiệu lực kể từ ngày ký. Ban điều hành Khu phố 3, Tổ chức {decision.associationName} và đồng chí <strong>{decision.memberName}</strong> chịu trách nhiệm thi hành Quyết định này./.
                </div>
              </div>

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-4 pt-6 text-xs font-sans">
                <div className="space-y-1 text-muted-foreground">
                  <div className="text-[10px] uppercase font-bold text-foreground">Nơi nhận:</div>
                  <div className="text-[10px]">- Như Điều 3;</div>
                  <div className="text-[10px]">- Đảng ủy, UBND phường An Phú (b/c);</div>
                  <div className="text-[10px]">- Lưu: VP Khu phố 3.</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-[11px] font-bold uppercase text-foreground">
                    TM. BAN ĐIỀU HÀNH KHU PHỐ 3
                  </div>
                  <div className="text-[10px] text-muted-foreground italic">Trưởng Ban</div>
                  <div className="h-12 flex items-center justify-center text-emerald-600 font-bold italic text-sm">
                    [Đã ký & Đóng dấu điện tử]
                  </div>
                  <div className="font-bold text-foreground text-xs">Nguyễn Trung Huy</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: METADATA & ATTACHMENTS */}
          <TabsContent value="metadata" className="mt-3 space-y-3">
            <Card className="shadow-xs border-border">
              <CardHeader className="p-3.5 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Thuộc tính Quyết định Bổ nhiệm</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Số Quyết định
                    </span>
                    <strong className="text-foreground font-mono">{decision.decisionNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Ngày ban hành
                    </span>
                    <strong className="text-foreground">{decision.decisionDate || "15/01/2020"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Tổ chức trực thuộc
                    </span>
                    <strong className="text-foreground">{decision.associationName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Chức danh chuẩn y
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-300">
                      {decision.memberRole}
                    </Badge>
                  </div>
                </div>

                {/* Textfield with 5px padding left & right */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Mã số Quyết định điện tử
                  </span>
                  <div className="flex gap-1.5">
                    <Input
                      readOnly
                      value={decision.decisionNumber}
                      className="text-xs h-8 font-mono px-[5px] bg-background"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyNumber}
                      className="h-8 px-2.5 text-xs shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Attached file section */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Bản scan văn bản gốc (.PDF số hóa):
                  </span>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-xs truncate">
                          {decision.fileInfo?.fileName || `QuyetDinh_${decision.decisionNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Đã ký số điện tử ban hành • Xác thực SHA-256 CSDL KP3
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="text-xs h-7 gap-1 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>Tải về</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyNumber}
            className="gap-1.5 text-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã chép số QĐ" : "Sao chép số QĐ"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Quyết định</span>
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
