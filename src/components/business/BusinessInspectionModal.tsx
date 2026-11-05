import React from "react";
import { X, FileCheck, Pencil, AlertTriangle, ShieldAlert, Plus, Trash2, History } from "lucide-react";
import { Business, InspectionLog, BusinessChangeLog } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface AddInspectionModalProps {
  open: boolean;
  business: Business | null;
  onClose: () => void;
  formInspDate: string;
  setFormInspDate: (v: string) => void;
  formInspResult: "Đạt chuẩn" | "Cảnh cáo" | "Không đạt" | "Yêu cầu khắc phục";
  setFormInspResult: (v: "Đạt chuẩn" | "Cảnh cáo" | "Không đạt" | "Yêu cầu khắc phục") => void;
  formInspInspector: string;
  setFormInspInspector: (v: string) => void;
  formInspNote: string;
  setFormInspNote: (v: string) => void;
  formInspRecommendation: string;
  setFormInspRecommendation: (v: string) => void;
  formInspPenalties: string;
  setFormInspPenalties: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddInspectionModal({
  open,
  business,
  onClose,
  formInspDate,
  setFormInspDate,
  formInspResult,
  setFormInspResult,
  formInspInspector,
  setFormInspInspector,
  formInspNote,
  setFormInspNote,
  formInspRecommendation,
  setFormInspRecommendation,
  formInspPenalties,
  setFormInspPenalties,
  onSubmit
}: AddInspectionModalProps) {
  if (!open || !business) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-background text-foreground rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="bg-card border-b border-border p-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
              <FileCheck size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Thêm Biên bản Kiểm tra định kỳ</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-xs">
                Cơ sở: {business.name}
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

        <form onSubmit={onSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Ngày kiểm tra <span className="text-destructive">*</span>
              </label>
              <Input 
                type="date"
                required
                value={formInspDate}
                onChange={(e) => setFormInspDate(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Kết quả đánh giá <span className="text-destructive">*</span>
              </label>
              <select
                value={formInspResult}
                onChange={(e) => setFormInspResult(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Đạt chuẩn">✅ Đạt chuẩn</option>
                <option value="Cảnh cáo">⚠️ Cảnh cáo</option>
                <option value="Yêu cầu khắc phục">🛠️ Yêu cầu khắc phục</option>
                <option value="Không đạt">❌ Không đạt</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground block">
              Đoàn / Đơn vị kiểm tra <span className="text-destructive">*</span>
            </label>
            <Input 
              type="text"
              required
              placeholder="Ví dụ: Đoàn kiểm tra liên ngành Phường An Phú"
              value={formInspInspector}
              onChange={(e) => setFormInspInspector(e.target.value)}
              className="text-xs"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground self-center">Gợi ý nhanh:</span>
              {[
                "Đoàn liên ngành Phường An Phú",
                "Cảnh sát PCCC & CNCH",
                "Trạm Y tế Phường An Phú",
                "Tổ QL Đô thị & Môi trường KP3",
                "Công an khu vực Phường"
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setFormInspInspector(sug)}
                  className="px-2 py-0.5 rounded text-[10px] bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground block">
              Nội dung kiểm tra & Hiện trạng ghi nhận <span className="text-destructive">*</span>
            </label>
            <textarea 
              required
              rows={3}
              placeholder="Ghi nhận hiện trạng cơ sở, các nội dung kiểm tra ATTP, PCCC, giấy phép, niêm yết giá..."
              value={formInspNote}
              onChange={(e) => setFormInspNote(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              Yêu cầu / Biện pháp khắc phục (nếu có)
            </label>
            <Input 
              type="text"
              placeholder="Ví dụ: Nạp sạc lại bình PCCC, thời hạn khắc phục 7 ngày..."
              value={formInspRecommendation}
              onChange={(e) => setFormInspRecommendation(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-destructive" />
              Hình thức xử lý / Mức phạt (nếu có)
            </label>
            <Input 
              type="text"
              placeholder="Ví dụ: Nhắc nhở, Cảnh cáo lần 1, Phạt VPHC 1.500.000đ..."
              value={formInspPenalties}
              onChange={(e) => setFormInspPenalties(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="gap-1.5"
            >
              <Plus size={14} />
              Lưu biên bản kiểm tra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditInspectionModalProps {
  open: boolean;
  business: Business | null;
  editingInspection: InspectionLog | null;
  onClose: () => void;
  formInspDate: string;
  setFormInspDate: (v: string) => void;
  formInspResult: "Đạt chuẩn" | "Cảnh cáo" | "Không đạt" | "Yêu cầu khắc phục";
  setFormInspResult: (v: "Đạt chuẩn" | "Cảnh cáo" | "Không đạt" | "Yêu cầu khắc phục") => void;
  formInspInspector: string;
  setFormInspInspector: (v: string) => void;
  formInspNote: string;
  setFormInspNote: (v: string) => void;
  formInspRecommendation: string;
  setFormInspRecommendation: (v: string) => void;
  formInspPenalties: string;
  setFormInspPenalties: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditInspectionModal({
  open,
  business,
  editingInspection,
  onClose,
  formInspDate,
  setFormInspDate,
  formInspResult,
  setFormInspResult,
  formInspInspector,
  setFormInspInspector,
  formInspNote,
  setFormInspNote,
  formInspRecommendation,
  setFormInspRecommendation,
  formInspPenalties,
  setFormInspPenalties,
  onSubmit
}: EditInspectionModalProps) {
  if (!open || !business || !editingInspection) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-background text-foreground rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="bg-card border-b border-border p-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
              <Pencil size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Chỉnh sửa Biên bản Kiểm tra</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-xs">
                Mã đợt: {editingInspection.id} • {business.name}
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

        <form onSubmit={onSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Ngày kiểm tra <span className="text-destructive">*</span>
              </label>
              <Input 
                type="date"
                required
                value={formInspDate}
                onChange={(e) => setFormInspDate(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Kết quả đánh giá <span className="text-destructive">*</span>
              </label>
              <select
                value={formInspResult}
                onChange={(e) => setFormInspResult(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Đạt chuẩn">✅ Đạt chuẩn</option>
                <option value="Cảnh cáo">⚠️ Cảnh cáo</option>
                <option value="Yêu cầu khắc phục">🛠️ Yêu cầu khắc phục</option>
                <option value="Không đạt">❌ Không đạt</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground block">
              Đoàn / Đơn vị kiểm tra <span className="text-destructive">*</span>
            </label>
            <Input 
              type="text"
              required
              value={formInspInspector}
              onChange={(e) => setFormInspInspector(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground block">
              Nội dung kiểm tra & Hiện trạng ghi nhận <span className="text-destructive">*</span>
            </label>
            <textarea 
              required
              rows={3}
              value={formInspNote}
              onChange={(e) => setFormInspNote(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              Yêu cầu / Biện pháp khắc phục
            </label>
            <Input 
              type="text"
              value={formInspRecommendation}
              onChange={(e) => setFormInspRecommendation(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-destructive" />
              Hình thức xử lý / Mức phạt
            </label>
            <Input 
              type="text"
              value={formInspPenalties}
              onChange={(e) => setFormInspPenalties(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="gap-1.5"
            >
              <Pencil size={14} />
              Cập nhật biên bản
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddChangeLogModalProps {
  open: boolean;
  business: Business | null;
  onClose: () => void;
  formChangeDate: string;
  setFormChangeDate: (v: string) => void;
  formChangeType: "Mở mới" | "Chuyển địa điểm" | "Thay đổi ngành nghề" | "Thay đổi người đại diện" | "Tạm ngừng" | "Hoạt động trở lại" | "Khác";
  setFormChangeType: (v: any) => void;
  formChangeDesc: string;
  setFormChangeDesc: (v: string) => void;
  formChangeRecordedBy: string;
  setFormChangeRecordedBy: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddChangeLogModal({
  open,
  business,
  onClose,
  formChangeDate,
  setFormChangeDate,
  formChangeType,
  setFormChangeType,
  formChangeDesc,
  setFormChangeDesc,
  formChangeRecordedBy,
  setFormChangeRecordedBy,
  onSubmit
}: AddChangeLogModalProps) {
  if (!open || !business) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-background text-foreground rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="bg-card border-b border-border p-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Ghi nhận Biến động cơ sở</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-xs">
                Cơ sở: {business.name}
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

        <form onSubmit={onSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Ngày biến động <span className="text-destructive">*</span>
              </label>
              <Input 
                type="date"
                required
                value={formChangeDate}
                onChange={(e) => setFormChangeDate(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Loại hình biến động <span className="text-destructive">*</span>
              </label>
              <select
                value={formChangeType}
                onChange={(e) => setFormChangeType(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Mở mới">Mở mới hoạt động</option>
                <option value="Chuyển địa điểm">Chuyển địa điểm kinh doanh</option>
                <option value="Thay đổi ngành nghề">Thay đổi ngành nghề</option>
                <option value="Thay đổi người đại diện">Thay đổi người đại diện</option>
                <option value="Tạm ngừng">Tạm ngừng kinh doanh</option>
                <option value="Hoạt động trở lại">Hoạt động trở lại</option>
                <option value="Khác">Biến động khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground block">
              Nội dung mô tả biến động <span className="text-destructive">*</span>
            </label>
            <textarea 
              required
              rows={3}
              placeholder="Chi tiết nội dung biến động địa bàn..."
              value={formChangeDesc}
              onChange={(e) => setFormChangeDesc(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground block">
              Người / Bộ phận ghi nhận
            </label>
            <Input 
              type="text"
              value={formChangeRecordedBy}
              onChange={(e) => setFormChangeRecordedBy(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="gap-1.5"
            >
              <Plus size={14} />
              Lưu biến động
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationDialog({
  open,
  title,
  description,
  onClose,
  onConfirm
}: DeleteDialogProps) {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-background text-foreground rounded-xl shadow-2xl border border-border w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4"
      >
        <div className="flex items-center gap-2.5 text-destructive">
          <Trash2 size={18} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
          >
            Xác nhận xóa
          </Button>
        </div>
      </div>
    </div>
  );
}
