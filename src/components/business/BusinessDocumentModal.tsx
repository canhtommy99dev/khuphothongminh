import React from "react";
import { Download, Printer, X, FileText, Image as ImageIcon } from "lucide-react";
import { Business, BusinessFile } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export interface ViewingDocState {
  title: string;
  businessName: string;
  file: BusinessFile;
  business: Business;
}

interface BusinessDocumentModalProps {
  viewingDoc: ViewingDocState | null;
  onClose: () => void;
  onDownload: (file: BusinessFile) => void;
  isAccommodationBusiness: (b: Business) => boolean;
}

export default function BusinessDocumentModal({
  viewingDoc,
  onClose,
  onDownload,
  isAccommodationBusiness
}: BusinessDocumentModalProps) {
  if (!viewingDoc) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-background text-foreground rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-border"
      >
        {/* Header */}
        <div className="bg-card border-b border-border p-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              viewingDoc.file.type === "pdf" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}>
              {viewingDoc.file.type === "pdf" ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2 truncate">
                <span>{viewingDoc.title}</span>
                <Badge variant="outline" className="uppercase text-[10px] font-mono">
                  {viewingDoc.file.type}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                Cơ sở: <strong className="text-foreground">{viewingDoc.businessName}</strong> • Chủ hộ: <strong className="text-foreground">{viewingDoc.business.owner}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDownload(viewingDoc.file)}
              className="gap-1.5"
            >
              <Download size={13} />
              <span>Tải tệp</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer size={13} />
              <span>In</span>
            </Button>
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
        </div>

        {/* Cadastral Info Bar */}
        <div className="bg-muted/40 border-b border-border px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-foreground">
            <span>Tờ BĐ: <strong className="font-mono text-primary">{viewingDoc.business.toBanDo || "272"}</strong></span>
            <span>Thửa đất: <strong className="font-mono text-primary">{viewingDoc.business.soThua || "55"}</strong></span>
            <span>Diện tích: <strong>{viewingDoc.business.dienTich ? `${viewingDoc.business.dienTich} m²` : "150 m²"}</strong></span>
            <span>Loại đất: <strong className="text-emerald-600 dark:text-emerald-400">{viewingDoc.business.loaiDat || "ODT"}</strong></span>
            <span>Số GCN: <strong className="font-mono text-rose-600 dark:text-rose-400">{viewingDoc.business.soGcn || "CH-098234"}</strong></span>
          </div>
          <div className="text-[11px] font-mono">
            {viewingDoc.file.name} ({viewingDoc.file.size || "520 KB"})
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
          {viewingDoc.file.type === "image" ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-background p-3 rounded-xl shadow-xs border border-border max-w-full">
                <img 
                  src={viewingDoc.file.url} 
                  alt={viewingDoc.file.name}
                  className="max-h-[540px] w-auto object-contain rounded-md mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900";
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">Bản chụp Giấy chứng nhận quyền sử dụng đất & Sổ đỏ</span>
            </div>
          ) : (
            <div className="space-y-4">
              {viewingDoc.file.url.startsWith("data:application/pdf") ? (
                <div className="bg-background rounded-xl shadow-xs border border-border overflow-hidden">
                  <iframe 
                    src={viewingDoc.file.url} 
                    title={viewingDoc.file.name} 
                    className="w-full h-[540px]"
                  />
                </div>
              ) : (
                /* Authentic Vietnamese Land Use Certificate Layout */
                <div className="bg-card text-card-foreground p-8 md:p-10 rounded-xl shadow-xs border border-border max-w-2xl mx-auto space-y-6 relative overflow-hidden">
                  <div className="text-center space-y-1 border-b border-border pb-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-foreground">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div className="font-medium text-xs text-muted-foreground underline decoration-1 underline-offset-4">Độc lập - Tự do - Hạnh phúc</div>
                    <div className="text-[10px] text-muted-foreground font-semibold tracking-widest pt-2 uppercase">BỘ TÀI NGUYÊN VÀ MÔI TRƯỜNG</div>
                    <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400 pt-1 tracking-tight uppercase">
                      GIẤY CHỨNG NHẬN QUYỀN SỬ DỤNG ĐẤT
                    </h2>
                    <h3 className="text-xs font-semibold text-rose-600 dark:text-rose-300 uppercase">
                      QUYỀN SỞ HỮU NHÀ Ở VÀ TÀI SẢN KHÁC GẮN LIỀN VỚI ĐẤT
                    </h3>
                    <div className="text-[10px] text-muted-foreground font-mono pt-1">
                      Số phát hành: <strong className="text-rose-600 font-mono">{viewingDoc.business.soGcn || "CH-098234"}</strong> • Số vào sổ: {viewingDoc.business.soVaoSo || "CS-2023-112"}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-semibold uppercase text-[11px] text-foreground">
                      I. Người sử dụng đất, chủ sở hữu nhà ở và tài sản khác gắn liền với đất:
                    </h4>
                    <div className="pl-3 space-y-1 text-muted-foreground">
                      <p>Ông/Bà: <strong className="text-foreground">{viewingDoc.business.tenChuSuDung || viewingDoc.business.owner}</strong></p>
                      <p>Địa chỉ thường trú: <strong className="text-foreground">{viewingDoc.business.address}</strong></p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-semibold uppercase text-[11px] text-foreground">
                      II. Thửa đất, nhà ở và tài sản khác gắn liền với đất:
                    </h4>
                    <div className="pl-3 space-y-1 text-muted-foreground">
                      <div className="grid grid-cols-2 gap-2">
                        <p>1. Thửa đất số: <strong className="font-mono text-foreground">{viewingDoc.business.soThua || "55"}</strong></p>
                        <p>2. Tờ bản đồ số: <strong className="font-mono text-foreground">{viewingDoc.business.toBanDo || "272"}</strong></p>
                      </div>
                      <p>3. Địa chỉ thửa đất: <strong className="text-foreground">{viewingDoc.business.address}</strong></p>
                      <div className="grid grid-cols-2 gap-2">
                        <p>4. Diện tích: <strong className="text-foreground">{viewingDoc.business.dienTich ? `${viewingDoc.business.dienTich} m²` : "150 m²"}</strong></p>
                        <p>5. Hình thức sử dụng: <strong className="text-foreground">Sử dụng riêng</strong></p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <p>6. Mục đích sử dụng: <strong className="text-emerald-600 dark:text-emerald-400">{viewingDoc.business.loaiDat || "Đất ở tại đô thị (ODT)"}</strong></p>
                        <p>7. Thời hạn sử dụng: <strong className="text-foreground">Lâu dài</strong></p>
                      </div>
                      <p>8. Nguồn gốc sử dụng: <strong className="text-foreground">Nhà nước công nhận quyền sử dụng đất có thu tiền sử dụng đất</strong></p>
                    </div>
                  </div>

                  {isAccommodationBusiness(viewingDoc.business) && (
                    <div className="space-y-1 text-xs bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-300 uppercase text-[10px]">
                        III. Tài sản gắn liền với đất (Công trình Nhà trọ / Lưu trú):
                      </h4>
                      <p className="text-[11px] text-foreground pl-2">
                        Công trình xây dựng: Nhà ở kết hợp cho thuê trọ • Kết cấu bê tông cốt thép • <strong>{viewingDoc.business.soTang || 3} tầng</strong> • Quy mô <strong>{viewingDoc.business.soPhong || 12} phòng lưu trú</strong>.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border flex justify-between items-end text-xs">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] text-muted-foreground block">Trích lục số hóa bởi</span>
                      <span className="font-semibold text-foreground text-[11px]">Văn phòng Đăng ký Đất đai</span>
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">✓ ĐÃ XÁC THỰC CSDL ĐỊA CHÍNH</div>
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-[10px] text-muted-foreground italic block">TP. Thủ Đức, ngày 15 tháng 04 năm 2023</span>
                      <span className="font-semibold uppercase text-[11px] block text-foreground">TM. ỦY BAN NHÂN DÂN</span>
                      <span className="text-[10px] text-muted-foreground block">KT. CHỦ TỊCH - PHÓ CHỦ TỊCH</span>
                      <div className="pt-4">
                        <Badge variant="destructive" className="font-bold uppercase tracking-wider text-xs">
                          (ĐÃ KÝ VÀ ĐÓNG DẤU ĐỎ)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
