import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  Filter,
  Save,
  Users,
  Copy,
  Table as TableIcon
} from "lucide-react";
import { Resident, Household } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { navigate, ROUTES } from "../routes";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import * as XLSX from "xlsx";

export interface ImportResidentsPageProps {
  residents?: Resident[];
  households?: Household[];
  onImport?: (importedResidents: Resident[]) => void;
  onBack?: () => void;
  showToast?: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

export default function ImportResidentsPage({
  residents = [],
  households = [],
  onImport,
  onBack,
  showToast
}: ImportResidentsPageProps) {
  const [importMethod, setImportMethod] = useState<"paste" | "file">("paste");
  const [importText, setImportText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [searchPreview, setSearchPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Sample data insertion
  const handleInsertSample = () => {
    const sample = [
      "Nguyễn Văn An\t079090001122\t15/08/1992\tNam\tSố 17 Song Hành, KP3, An Phú\tThường trú\t0912345678",
      "Trần Thị Mai\t079192003344\t20/11/1995\tNữ\tSố 25 Mai Chí Thọ, KP3, An Phú\tTạm trú\t0987654321",
      "Lê Hoàng Long\t079088005566\t10/04/1988\tNam\tPhòng 04 Nhà trọ Phạm Văn Bình, 17/A3 KP3\tTạm trú\t0909123888",
      "Phạm Thị Hương\t079196007788\t05/12/1996\tNữ\tSố 10 Lương Định Của, KP3, An Phú\tThường trú\t0933221100"
    ].join("\n");
    setImportText(sample);
    notify("Đã chèn 4 dòng dữ liệu mẫu!", "info");
  };

  // Process text parse
  const handleProcessText = () => {
    if (!importText.trim()) {
      notify("Vui lòng dán dữ liệu hoặc nhập văn bản", "error");
      return;
    }

    try {
      const lines = importText.trim().split("\n");
      const parsed: any[] = [];

      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        const parts = line.includes("\t") ? line.split("\t") : line.split(",");
        if (parts.length >= 2) {
          const name = parts[0]?.trim() || `Cư dân Mới ${idx + 1}`;
          const cccd = parts[1]?.trim() || `0790${Math.floor(10000000 + Math.random() * 90000000)}`;
          const birthDate = parts[2]?.trim() || "01/01/1990";
          const gender = parts[3]?.trim().toLowerCase().includes("nữ") ? "Nữ" : "Nam";
          const address = parts[4]?.trim() || "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh";
          const status = parts[5]?.trim().toLowerCase().includes("tạm") ? "Tạm trú" : "Thường trú";
          const phone = parts[6]?.trim() || "Chưa cập nhật";

          parsed.push({
            id: `TMP-${Date.now()}-${idx}`,
            fullName: name,
            cccd,
            birthDate,
            gender,
            address,
            status,
            phone,
            householdId: "HK-001",
            relationToOwner: status === "Thường trú" ? "Thành viên" : "Khách trọ"
          });
        }
      });

      if (parsed.length === 0) {
        notify("Không tìm thấy dữ liệu hợp lệ từ văn bản đã dán", "error");
        return;
      }

      setParsedPreview(parsed);
      notify(`Đã nhận diện thành công ${parsed.length} cư dân!`, "success");
    } catch (err) {
      console.error("Parse error:", err);
      notify("Lỗi khi phân tích dữ liệu nhập", "error");
    }
  };

  // Process Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length <= 1) {
          notify("File Excel không có dữ liệu", "error");
          return;
        }

        // Find header row or use index 0
        const header = data[0].map((h: any) => String(h || "").toLowerCase());
        const nameIdx = header.findIndex((h) => h.includes("họ") || h.includes("tên") || h.includes("name"));
        const cccdIdx = header.findIndex((h) => h.includes("cccd") || h.includes("định danh") || h.includes("cmt"));
        const birthIdx = header.findIndex((h) => h.includes("sinh") || h.includes("birth") || h.includes("ngày"));
        const genderIdx = header.findIndex((h) => h.includes("giới") || h.includes("gender") || h.includes("tính"));
        const addressIdx = header.findIndex((h) => h.includes("địa chỉ") || h.includes("nơi ở") || h.includes("address"));
        const statusIdx = header.findIndex((h) => h.includes("cư trú") || h.includes("trạng thái") || h.includes("status") || h.includes("diện"));
        const phoneIdx = header.findIndex((h) => h.includes("thoại") || h.includes("sđt") || h.includes("phone"));

        const parsed: any[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const name = nameIdx !== -1 ? String(row[nameIdx] || "").trim() : String(row[0] || "").trim();
          if (!name) continue;

          const cccd = cccdIdx !== -1 ? String(row[cccdIdx] || "").trim() : String(row[1] || "").trim();
          const birthDate = birthIdx !== -1 ? String(row[birthIdx] || "").trim() : "01/01/1990";
          const rawGender = genderIdx !== -1 ? String(row[genderIdx] || "").toLowerCase() : "";
          const gender = rawGender.includes("nữ") ? "Nữ" : "Nam";
          const address = addressIdx !== -1 ? String(row[addressIdx] || "").trim() : "Khu phố 3, An Phú";
          const rawStatus = statusIdx !== -1 ? String(row[statusIdx] || "").toLowerCase() : "";
          const status = rawStatus.includes("tạm") ? "Tạm trú" : "Thường trú";
          const phone = phoneIdx !== -1 ? String(row[phoneIdx] || "").trim() : "Chưa cập nhật";

          parsed.push({
            id: `XLS-${Date.now()}-${i}`,
            fullName: name,
            cccd: cccd || `0790${Math.floor(10000000 + Math.random() * 90000000)}`,
            birthDate,
            gender,
            address,
            status,
            phone,
            householdId: "HK-001",
            relationToOwner: status === "Thường trú" ? "Thành viên" : "Khách trọ"
          });
        }

        setParsedPreview(parsed);
        notify(`Đã nạp thành công ${parsed.length} cư dân từ file "${file.name}"!`, "success");
      } catch (err) {
        console.error("Excel parse error:", err);
        notify("Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Remove single row from preview
  const handleRemoveRow = (id: string) => {
    setParsedPreview((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all
  const handleClearPreview = () => {
    setParsedPreview([]);
    setImportText("");
    setSelectedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit Batch Import
  const handleSaveImport = async () => {
    if (parsedPreview.length === 0) {
      notify("Chưa có danh sách cư dân nào để lưu", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const newItems: Resident[] = parsedPreview.map((item, idx) => ({
        id: "R" + (residents.length + idx + 1).toString().padStart(5, "0"),
        fullName: item.fullName,
        gender: item.gender,
        birthDate: item.birthDate,
        cccd: item.cccd,
        phone: item.phone || "Chưa cập nhật",
        status: item.status,
        occupation: "Tự do",
        address: item.address,
        householdId: item.householdId,
        relationToOwner: item.relationToOwner,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        joinDate: new Date().toLocaleDateString("vi-VN"),
        managementStatus: "Bình thường"
      }));

      // Direct persist batch to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const rowsToInsert = newItems.map((r) => ({
            id: r.id,
            full_name: r.fullName,
            gender: r.gender,
            birth_date: r.birthDate,
            cccd: r.cccd,
            phone: r.phone,
            status: r.status,
            address: r.address,
            household_id: r.householdId,
            relation_to_owner: r.relationToOwner
          }));

          // Batch insert in chunks of 100 to avoid request size limits
          const chunkSize = 100;
          for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
            const chunk = rowsToInsert.slice(i, i + chunkSize);
            await (supabase as any).from("residents").insert(chunk);
          }
        } catch (dbErr) {
          console.warn("Supabase batch insert warning:", dbErr);
        }
      }

      if (onImport) {
        onImport(newItems);
      }

      notify(`Đã nạp và lưu thành công ${newItems.length} cư dân vào hệ thống!`, "success");
      handleBack();
    } catch (err) {
      console.error("Batch save error:", err);
      notify("Có lỗi khi lưu cư dân vào hệ thống", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter preview items
  const filteredPreview = parsedPreview.filter((item) => {
    if (!searchPreview.trim()) return true;
    const q = searchPreview.toLowerCase();
    return (
      item.fullName.toLowerCase().includes(q) ||
      item.cccd.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q)
    );
  });

  const thuongTruCount = parsedPreview.filter((p) => p.status === "Thường trú").length;
  const tamTruCount = parsedPreview.filter((p) => p.status === "Tạm trú").length;

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
            <span className="text-foreground font-semibold">Nạp dữ liệu hàng loạt</span>
            <Badge
              variant="outline"
              className="font-mono text-[10px] py-0 px-1.5 border-emerald-500/40 text-emerald-700 bg-emerald-50/50"
            >
              /import_residents
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
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg inline-flex">
                <FileSpreadsheet size={20} />
              </span>
              Nạp Dữ Liệu Cư Dân Từ Excel Hoặc Dán Văn Bản
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ import nhanh dữ liệu hàng loạt từ file Excel hoặc copy/paste bảng tính, tự động phân loại và chuẩn hóa.
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
            onClick={handleSaveImport}
            disabled={isSubmitting || parsedPreview.length === 0}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>
              {isSubmitting
                ? "Đang lưu..."
                : parsedPreview.length > 0
                ? `Lưu ${parsedPreview.length} Cư Dân Vào CSDL`
                : "Lưu Vào CSDL"}
            </span>
          </Button>
        </div>
      </div>

      {/* Input Methods Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                <Upload size={18} />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  Phương Thức Nhập Dữ Liệu
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Chọn dán trực tiếp từ bảng tính hoặc tải lên file Excel (.xlsx, .xls, .csv)
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setImportMethod("paste")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  importMethod === "paste"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dán văn bản / Bảng tính
              </button>
              <button
                type="button"
                onClick={() => setImportMethod("file")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  importMethod === "file"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tải lên tệp Excel
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {importMethod === "paste" ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700">
                  Dán các dòng từ bảng Excel (Họ tên, CCCD, Ngày sinh, Giới tính, Địa chỉ, Diện cư trú, SĐT):
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleInsertSample}
                  className="gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 cursor-pointer"
                >
                  <Copy size={12} />
                  <span>Dán mẫu thử nghiệm</span>
                </Button>
              </div>

              <textarea
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Nguyễn Văn An&#9;079090001122&#9;15/08/1992&#9;Nam&#9;17 Song Hành&#9;Thường trú&#9;0912345678&#10;Trần Thị Mai&#9;079192003344&#9;20/11/1995&#9;Nữ&#9;25 Mai Chí Thọ&#9;Tạm trú&#9;0987654321"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Cấu trúc đề xuất:</span>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-mono text-[10px]">
                    Họ tên [Tab] CCCD [Tab] Ngày sinh [Tab] Giới tính [Tab] Địa chỉ [Tab] Diện cư trú [Tab] SĐT
                  </code>
                </div>

                <Button
                  type="button"
                  onClick={handleProcessText}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-sm text-xs px-4"
                >
                  <Sparkles size={14} />
                  <span>Phân tích dữ liệu văn bản</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20 space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedFileName ? selectedFileName : "Bấm để chọn file hoặc kéo thả tệp Excel vào đây"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hỗ trợ định dạng .xlsx, .xls, .csv (tự động nhận diện tiêu đề cột)
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {parsedPreview.length > 0 && (
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                  <TableIcon size={18} />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Xem Trước Dữ Liệu Nhận Diện</span>
                    <Badge variant="success" className="text-xs font-mono">
                      {parsedPreview.length} Cư dân
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-emerald-700">{thuongTruCount} Thường trú</span>
                    <span>•</span>
                    <span className="font-semibold text-blue-700">{tamTruCount} Tạm trú</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    placeholder="Tìm trong kết quả..."
                    className="h-8 pl-8 text-xs bg-white"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearPreview}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 size={13} className="mr-1" />
                  <span>Xóa hết</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-2xs">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs py-2.5">STT</TableHead>
                    <TableHead className="text-xs py-2.5">Họ và Tên</TableHead>
                    <TableHead className="text-xs py-2.5">Số CCCD / Định danh</TableHead>
                    <TableHead className="text-xs py-2.5">Ngày sinh</TableHead>
                    <TableHead className="text-xs py-2.5">Giới tính</TableHead>
                    <TableHead className="text-xs py-2.5">Địa chỉ tại KP3</TableHead>
                    <TableHead className="text-xs py-2.5">Diện cư trú</TableHead>
                    <TableHead className="text-xs py-2.5">Số điện thoại</TableHead>
                    <TableHead className="w-12 text-center text-xs py-2.5">Xóa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPreview.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/80">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground py-2">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-900 py-2">
                        {item.fullName}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700 py-2">
                        {item.cccd}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 py-2">
                        {item.birthDate}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 py-2">
                        {item.gender}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 max-w-[200px] truncate py-2" title={item.address}>
                        {item.address}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={item.status === "Thường trú" ? "success" : "info"}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 py-2">
                        {item.phone}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Xóa dòng này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bottom Confirm Bar */}
            <div className="p-4 border-t border-border/80 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>
                  Sẵn sàng lưu {parsedPreview.length} cư dân mới vào CSDL Khu phố 3 An Phú.
                </span>
              </div>

              <Button
                type="button"
                onClick={handleSaveImport}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm text-xs gap-2"
              >
                <Save size={15} />
                <span>{isSubmitting ? "Đang tiến hành lưu..." : `Lưu Toàn Bộ (${parsedPreview.length} Cư Dân)`}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

