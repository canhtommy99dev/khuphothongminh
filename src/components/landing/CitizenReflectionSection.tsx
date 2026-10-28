import React, { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Inbox,
  LocateFixed,
  MapPin,
  Send,
  Shield,
  X
} from "lucide-react";
import { FieldReport } from "../../types";
import { EmptyState } from "./LandingCommon";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_SUBMISSIONS_PER_DAY,
  RATE_KEY,
  REPORT_CATEGORIES,
  SUBMIT_COOLDOWN_MS,
  btnGhost,
  btnPrimary,
  inputCls,
  readSubmissionLog
} from "./landingConstants";

export interface CitizenReflectionSectionProps {
  reports: FieldReport[];
  onAddReport: (newReport: FieldReport) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export default function CitizenReflectionSection({
  reports,
  onAddReport,
  showToast
}: CitizenReflectionSectionProps) {
  const [repCategory, setRepCategory] = useState<FieldReport["category"]>("Rác thải");
  const [repTitle, setRepTitle] = useState("");
  const [repLocation, setRepLocation] = useState("");
  const [repDescription, setRepDescription] = useState("");
  const [repAnonymous, setRepAnonymous] = useState(false);
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repImage, setRepImage] = useState("");
  const [repConsent, setRepConsent] = useState(false);
  const [repHoneypot, setRepHoneypot] = useState("");
  const [repErrors, setRepErrors] = useState<Record<string, string>>({});
  const [repLoading, setRepLoading] = useState(false);
  const [repSubmittedId, setRepSubmittedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const recentReports = reports.slice(0, 3);

  const handleImageChange = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setRepErrors(prev => ({ ...prev, image: "Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WebP." }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setRepErrors(prev => ({ ...prev, image: "Dung lượng ảnh tối đa 5 MB." }));
      return;
    }
    setRepErrors(prev => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });
    const reader = new FileReader();
    reader.onload = () => setRepImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      showToast("Thiết bị không hỗ trợ định vị vị trí.", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setRepLocation(`Tọa độ [${lat}, ${lng}] — Khu phố 3, An Phú`);
        setRepErrors(prev => {
          const copy = { ...prev };
          delete copy.location;
          return copy;
        });
      },
      () => {
        setLocating(false);
        showToast("Không lấy được toạ độ GPS. Vui lòng nhập địa chỉ.", "error");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const validateReport = (): boolean => {
    const errors: Record<string, string> = {};
    if (!repTitle.trim()) errors.title = "Vui lòng nhập tiêu đề phản ánh.";
    else if (repTitle.trim().length < 6) errors.title = "Tiêu đề cần ít nhất 6 ký tự.";

    if (!repLocation.trim()) errors.location = "Vui lòng nhập vị trí phản ánh.";
    else if (repLocation.trim().length < 4) errors.location = "Địa điểm quá ngắn.";

    if (!repDescription.trim()) errors.description = "Vui lòng mô tả chi tiết sự việc.";
    else if (repDescription.trim().length < 15) errors.description = "Nội dung cần ít nhất 15 ký tự.";

    if (!repAnonymous) {
      if (!repName.trim()) errors.name = "Vui lòng nhập họ tên.";
      if (!repPhone.trim()) errors.phone = "Vui lòng nhập số điện thoại liên hệ.";
      else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(repPhone.trim().replace(/\s/g, ""))) {
        errors.phone = "Số điện thoại chưa hợp lệ (10 số, bắt đầu bằng 03/05/07/08/09).";
      }
    }

    if (!repConsent) errors.consent = "Bạn cần đồng ý với điều khoản sử dụng thông tin.";

    setRepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (repHoneypot) return;
    if (!validateReport()) return;

    const log = readSubmissionLog();
    const now = new Date();
    if (log.length > 0) {
      const last = log[log.length - 1];
      if (now.getTime() - last < SUBMIT_COOLDOWN_MS) {
        showToast("Bạn vừa gửi phản ánh. Vui lòng chờ 1 phút trước khi gửi tiếp.", "error");
        return;
      }
    }
    if (log.length >= MAX_SUBMISSIONS_PER_DAY) {
      showToast("Bạn đã gửi đủ số lượt phản ánh trong ngày (5 lượt).", "error");
      return;
    }

    setRepLoading(true);
    const id = `PA-${Date.now().toString().slice(-6)}`;
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} ${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;
    const reporterName = repAnonymous ? "Cư dân (Ẩn danh)" : repName.trim();

    const newReport: FieldReport = {
      id,
      title: repTitle.trim(),
      category: repCategory,
      reporterName,
      reporterPhone: repAnonymous ? "" : repPhone.trim(),
      reportedAt: now.toLocaleString("vi-VN", { hour12: false }).replace(/\//g, "-"),
      location: repLocation.trim(),
      coordinates: { x: 50, y: 50 },
      description: repDescription.trim(),
      status: "Đã tiếp nhận",
      beforeImage: repImage || undefined,
      timeline: [
        {
          time: timeStr,
          title: "Tiếp nhận phản ánh từ Cổng người dân",
          description: `Phản ánh được gửi qua Cổng người dân${repAnonymous ? " (chế độ ẩn danh)" : ""}.`,
          actor: reporterName
        }
      ]
    };

    try {
      onAddReport(newReport);
      localStorage.setItem(RATE_KEY, JSON.stringify([...log, now.getTime()]));
      setRepSubmittedId(id);
      setRepTitle("");
      setRepLocation("");
      setRepDescription("");
      setRepImage("");
      setRepConsent(false);
      showToast(`Đã gửi phản ánh. Mã hồ sơ: ${id}`);
    } catch {
      showToast("Gửi phản ánh không thành công. Vui lòng thử lại.", "error");
    } finally {
      setRepLoading(false);
    }
  };

  return (
    <section id="reflection" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 scroll-mt-24 outline-none">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gov-navy to-gov-blue p-5 sm:p-8 text-white">
          <h2 className="text-xl sm:text-2xl font-black">Phản ánh hiện trường</h2>
          <p className="text-sm sm:text-base text-blue-100 mt-1 max-w-2xl">
            Vệ sinh môi trường, lấn chiếm vỉa hè, tiếng ồn, hạ tầng hay an ninh trật tự — phản ánh được chuyển vào hệ thống tiếp nhận của Ban Điều hành Khu phố 3.
          </p>
        </div>

        <div className="p-5 sm:p-8 space-y-8">
          {repSubmittedId ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3" role="status" aria-live="polite">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" aria-hidden="true" />
              <h3 className="text-lg font-bold text-emerald-900">Đã gửi phản ánh thành công</h3>
              <p className="text-sm text-slate-600">Vui lòng lưu mã hồ sơ để tra cứu khi cần:</p>
              <p className="inline-block px-4 py-2 rounded-xl bg-white border border-emerald-300 font-mono font-bold text-emerald-800">
                {repSubmittedId}
              </p>
              <div>
                <button onClick={() => setRepSubmittedId(null)} className={btnPrimary}>
                  Gửi phản ánh khác
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} noValidate className="space-y-6">
              {/* honeypot */}
              <input
                id="rep-honeypot"
                name="honeypot"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={repHoneypot}
                onChange={e => setRepHoneypot(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              <fieldset>
                <legend className="text-sm font-bold text-gov-text mb-2">
                  1. Nhóm vấn đề <span className="text-gov-danger">*</span>
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {REPORT_CATEGORIES.map(c => (
                    <label
                      key={c.id}
                      className={`min-h-12 flex items-center justify-center text-center px-3 rounded-xl border text-sm font-semibold cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gov-blue ${
                        repCategory === c.id
                          ? "bg-gov-navy text-white border-gov-navy"
                          : "bg-white text-slate-700 border-slate-300 hover:border-gov-blue"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rep-category"
                        value={c.id}
                        checked={repCategory === c.id}
                        onChange={() => setRepCategory(c.id)}
                        className="sr-only"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="rep-title" className="text-sm font-bold block">
                    2. Tiêu đề <span className="text-gov-danger">*</span>
                  </label>
                  <input
                    id="rep-title"
                    value={repTitle}
                    onChange={e => setRepTitle(e.target.value)}
                    maxLength={150}
                    aria-invalid={!!repErrors.title}
                    aria-describedby="rep-title-err"
                    className={inputCls}
                    placeholder="VD: Rác tồn đọng đầu hẻm chưa thu gom"
                  />
                  {repErrors.title && <p id="rep-title-err" className="text-xs text-gov-danger">{repErrors.title}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="rep-location" className="text-sm font-bold block">
                    3. Vị trí <span className="text-gov-danger">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="rep-location"
                      value={repLocation}
                      onChange={e => setRepLocation(e.target.value)}
                      aria-invalid={!!repErrors.location}
                      aria-describedby="rep-location-err"
                      className={inputCls}
                      placeholder="Số nhà, hẻm, tuyến đường"
                    />
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className={`${btnGhost} shrink-0 px-3`}
                      aria-label="Dùng vị trí hiện tại"
                      title="Dùng vị trí hiện tại"
                    >
                      <LocateFixed size={18} className={locating ? "animate-pulse" : ""} />
                    </button>
                  </div>
                  {repErrors.location && <p id="rep-location-err" className="text-xs text-gov-danger">{repErrors.location}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="rep-desc" className="text-sm font-bold block">
                  4. Nội dung phản ánh <span className="text-gov-danger">*</span>
                </label>
                <textarea
                  id="rep-desc"
                  rows={4}
                  value={repDescription}
                  onChange={e => setRepDescription(e.target.value)}
                  maxLength={2000}
                  aria-invalid={!!repErrors.description}
                  aria-describedby="rep-desc-err rep-desc-count"
                  className={`${inputCls} py-3`}
                  placeholder="Mô tả thời điểm, mức độ ảnh hưởng…"
                />
                <div className="flex justify-between text-xs">
                  <span id="rep-desc-err" className="text-gov-danger">{repErrors.description}</span>
                  <span id="rep-desc-count" className="text-slate-400">{repDescription.length}/2000</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-bold block">5. Ảnh hiện trường (tuỳ chọn · JPG/PNG/WebP · tối đa 5 MB)</span>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="rep-image-file" className={`${btnGhost} border-dashed cursor-pointer`}>
                    <Camera size={18} aria-hidden="true" /> Chọn ảnh
                    <input
                      id="rep-image-file"
                      name="repImageFile"
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                      capture="environment"
                      className="sr-only"
                      aria-label="Chọn hoặc chụp ảnh hiện trường"
                      onChange={e => handleImageChange(e.target.files?.[0])}
                    />
                  </label>
                  {repImage && (
                    <div className="flex items-center gap-2 p-1.5 bg-gov-light rounded-xl border border-slate-200">
                      <img src={repImage} alt="Ảnh hiện trường đã chọn" className="w-12 h-12 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setRepImage("")}
                        className="min-w-11 min-h-11 flex items-center justify-center text-slate-500 hover:text-gov-danger cursor-pointer"
                        aria-label="Xoá ảnh"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {repErrors.image && <p className="text-xs text-gov-danger">{repErrors.image}</p>}
              </div>

              <fieldset className="p-4 rounded-2xl bg-gov-light border border-slate-200 space-y-3">
                <legend className="text-sm font-bold px-1">6. Chế độ gửi</legend>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { v: false, t: "Có thông tin liên hệ", d: "Cán bộ có thể liên hệ xác minh và báo kết quả." },
                    { v: true, t: "Ẩn danh", d: "Không lưu họ tên, số điện thoại. Không nhận được phản hồi." }
                  ].map(o => (
                    <label
                      key={String(o.v)}
                      className={`p-3 rounded-xl border cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gov-blue ${
                        repAnonymous === o.v ? "border-gov-blue bg-white" : "border-slate-200 bg-white/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rep-mode"
                        checked={repAnonymous === o.v}
                        onChange={() => setRepAnonymous(o.v)}
                        className="sr-only"
                      />
                      <span className="font-semibold text-sm block">{o.t}</span>
                      <span className="text-xs text-slate-500">{o.d}</span>
                    </label>
                  ))}
                </div>
                {!repAnonymous && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rep-name" className="sr-only">Họ và tên</label>
                      <input
                        id="rep-name"
                        value={repName}
                        onChange={e => setRepName(e.target.value)}
                        autoComplete="name"
                        aria-invalid={!!repErrors.name}
                        placeholder="Họ và tên *"
                        className={inputCls}
                      />
                      {repErrors.name && <p className="text-xs text-gov-danger mt-1">{repErrors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="rep-phone" className="sr-only">Số điện thoại</label>
                      <input
                        id="rep-phone"
                        type="tel"
                        inputMode="numeric"
                        value={repPhone}
                        onChange={e => setRepPhone(e.target.value)}
                        autoComplete="tel"
                        aria-invalid={!!repErrors.phone}
                        placeholder="Số điện thoại *"
                        className={inputCls}
                      />
                      {repErrors.phone && <p className="text-xs text-gov-danger mt-1">{repErrors.phone}</p>}
                    </div>
                  </div>
                )}
              </fieldset>

              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 space-y-2">
                <p className="text-sm font-bold text-gov-navy flex items-center gap-2">
                  <Shield size={16} aria-hidden="true" /> Thông tin về quyền riêng tư
                </p>
                <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                  <li>Thông tin chỉ dùng để tiếp nhận, xác minh và xử lý phản ánh này.</li>
                  <li>Chỉ cán bộ có thẩm quyền trong hệ thống được xem họ tên, số điện thoại.</li>
                  <li>Không chụp rõ mặt người khác hoặc giấy tờ cá nhân trong ảnh gửi kèm.</li>
                </ul>
                <label className="flex items-start gap-2 pt-1 text-sm cursor-pointer min-h-11">
                  <input
                    id="rep-consent"
                    name="repConsent"
                    type="checkbox"
                    checked={repConsent}
                    onChange={e => setRepConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-gov-blue"
                    aria-invalid={!!repErrors.consent}
                    aria-label="Tôi đã đọc và đồng ý với điều khoản sử dụng thông tin phản ánh"
                  />
                  <span>
                    Tôi đã đọc và đồng ý với cách sử dụng thông tin nêu trên. <span className="text-gov-danger">*</span>
                  </span>
                </label>
                {repErrors.consent && <p className="text-xs text-gov-danger">{repErrors.consent}</p>}
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={repLoading} className={btnPrimary}>
                  <Send size={16} aria-hidden="true" /> {repLoading ? "Đang gửi…" : "Gửi phản ánh"}
                </button>
              </div>
            </form>
          )}

          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-gov-text">Phản ánh gần đây trong hệ thống</h3>
            {recentReports.length === 0 ? (
              <EmptyState icon={<Inbox size={22} />} title="Chưa có phản ánh" description="Các phản ánh đã tiếp nhận sẽ hiển thị tại đây." />
            ) : (
              <ul className="grid md:grid-cols-3 gap-3">
                {recentReports.map(r => (
                  <li key={r.id} className="p-4 rounded-2xl bg-gov-light border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gov-navy bg-blue-100 px-2 py-0.5 rounded">{r.category}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === "Đã giải quyết" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="font-semibold text-sm line-clamp-1">{r.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={12} aria-hidden="true" /> <span className="truncate">{r.location}</span>
                    </p>
                    <p className="text-xs text-slate-400">{r.reportedAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
