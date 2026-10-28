import React from "react";
import { CheckCircle2, Download, Info } from "lucide-react";
import { AdministrativeForm, CommunityEvent, LocalNews } from "../../types";
import { Modal } from "./LandingCommon";
import { btnGhost, btnPrimary } from "./landingConstants";

export interface CitizenModalsProps {
  previewForm: AdministrativeForm | null;
  setPreviewForm: (f: AdministrativeForm | null) => void;
  eventDetail: CommunityEvent | null;
  setEventDetail: (e: CommunityEvent | null) => void;
  newsDetail: LocalNews | null;
  setNewsDetail: (n: LocalNews | null) => void;
  toast: { msg: string; type: "success" | "error" } | null;
  handleDownloadForm: (form: AdministrativeForm) => void;
}

export default function CitizenModals({
  previewForm,
  setPreviewForm,
  eventDetail,
  setEventDetail,
  newsDetail,
  setNewsDetail,
  toast,
  handleDownloadForm
}: CitizenModalsProps) {
  return (
    <>
      {/* 1. Modal Preview Biểu mẫu */}
      {previewForm && (
        <Modal
          title={`${previewForm.code} — ${previewForm.title}`}
          onClose={() => setPreviewForm(null)}
          footer={
            <>
              <button onClick={() => setPreviewForm(null)} className={btnGhost}>
                Đóng
              </button>
              <button
                onClick={() => {
                  handleDownloadForm(previewForm);
                  setPreviewForm(null);
                }}
                className={btnPrimary}
              >
                <Download size={16} aria-hidden="true" /> Tải biểu mẫu
              </button>
            </>
          }
        >
          <p>{previewForm.description}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gov-light">
            <div>
              <dt className="text-xs text-slate-500">Nơi tiếp nhận</dt>
              <dd className="font-semibold">{previewForm.issuingBody}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Thời gian giải quyết</dt>
              <dd className="font-semibold">{previewForm.processingTime}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Lệ phí</dt>
              <dd className="font-semibold">{previewForm.fee}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Định dạng</dt>
              <dd className="font-semibold">
                {previewForm.fileFormat} · {previewForm.fileSize}
              </dd>
            </div>
          </dl>
          {previewForm.requiredDocuments.length > 0 && (
            <div>
              <p className="font-bold mb-2">Hồ sơ cần chuẩn bị</p>
              <ul className="list-disc pl-5 space-y-1">
                {previewForm.requiredDocuments.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}

      {/* 2. Modal Chi tiết Sự kiện / Lịch hoạt động */}
      {eventDetail && (
        <Modal
          title={eventDetail.title}
          onClose={() => setEventDetail(null)}
          footer={
            <button onClick={() => setEventDetail(null)} className={btnPrimary}>
              Đóng
            </button>
          }
        >
          <dl className="grid sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gov-light">
            <div>
              <dt className="text-xs text-slate-500">Thời gian</dt>
              <dd className="font-semibold">{eventDetail.dateTime}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Trạng thái</dt>
              <dd className="font-semibold">{eventDetail.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Địa điểm</dt>
              <dd className="font-semibold">{eventDetail.location}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Đơn vị phụ trách</dt>
              <dd className="font-semibold">{eventDetail.organizer}</dd>
            </div>
          </dl>
          <p className="leading-relaxed">{eventDetail.description}</p>
        </Modal>
      )}

      {/* 3. Modal Chi tiết Tin tức / Thông báo */}
      {newsDetail && (
        <Modal
          title={newsDetail.title}
          onClose={() => setNewsDetail(null)}
          footer={
            <button onClick={() => setNewsDetail(null)} className={btnPrimary}>
              Đóng
            </button>
          }
        >
          <dl className="grid sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gov-light text-xs">
            <div>
              <dt className="text-slate-500">Chuyên mục</dt>
              <dd className="font-semibold text-gov-navy">{newsDetail.category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Ngày công bố</dt>
              <dd className="font-semibold">{newsDetail.date}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Cơ quan ban hành / Tác giả</dt>
              <dd className="font-semibold text-gov-navy">{newsDetail.author}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Tình trạng</dt>
              <dd className="font-semibold text-emerald-700">
                {newsDetail.isPinned ? "📌 Thông báo ưu tiên" : "Bản tin chính thức"}
              </dd>
            </div>
          </dl>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line p-4 rounded-2xl bg-white border border-slate-200">
            {newsDetail.content}
          </div>
        </Modal>
      )}

      {/* 4. Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[60] px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${
            toast.type === "success" ? "bg-gov-navy" : "bg-gov-danger"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <Info size={18} aria-hidden="true" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  );
}
