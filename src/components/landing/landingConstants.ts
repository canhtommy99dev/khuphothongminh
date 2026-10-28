import React from "react";
import { FieldReport } from "../../types";

export const PUBLIC_CONTACT_EMAIL = "bdhkhupho3.ap@gmail.com";

/** Thông tin đã xác minh trong AGENTS.md — chỉ họ tên & chức danh, không có SĐT/ảnh. */
export const VERIFIED_LEADERSHIP = [
  { name: "Nguyễn Văn Hùng", role: "Bí thư Chi bộ", scope: "Chi bộ Khu phố 3" },
  { name: "Lê Thị Mai", role: "Trưởng Khu phố", scope: "Ban Điều hành Khu phố 3" },
  { name: "Đại úy Trần Quốc Hải", role: "Công an khu vực", scope: "Công an Phường An Phú (phụ trách địa bàn KP3)" }
];

export type LandingRoute =
  | "all"
  | "services"
  | "reflection"
  | "forms"
  | "notices"
  | "news"
  | "leadership"
  | "schedule";

export interface NavItem {
  id: LandingRoute;
  label: string;
  path: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "services", label: "Tiện ích", path: "/services", description: "Các dịch vụ công cộng & tiện ích số" },
  { id: "reflection", label: "Phản ánh", path: "/reflection", description: "Gửi phản ánh hiện trường & tra cứu hồ sơ" },
  { id: "forms", label: "Biểu mẫu", path: "/forms", description: "Kho biểu mẫu hành chính tải về" },
  { id: "notices", label: "Thông báo", path: "/notices", description: "Thông báo chính thức & khẩn từ Ban Điều Hành" },
  { id: "news", label: "Tin tức", path: "/news", description: "Bản tin đời sống, phong trào thi đua KP3" },
  { id: "leadership", label: "Cán bộ", path: "/leadership", description: "Cơ cấu thường trực Chi bộ, BĐH, CSKV" },
  { id: "schedule", label: "Lịch hoạt động", path: "/schedule", description: "Lịch sinh hoạt cộng đồng & tiếp dân" }
];

export const REPORT_CATEGORIES: { id: FieldReport["category"]; label: string }[] = [
  { id: "Rác thải", label: "Rác & môi trường" },
  { id: "Lấn chiếm lòng đường", label: "Lấn chiếm vỉa hè" },
  { id: "Tiếng ồn", label: "Tiếng ồn" },
  { id: "Hạ tầng đô thị", label: "Đèn, cống, hẻm" },
  { id: "An ninh trật tự", label: "An ninh trật tự" }
];

export const FORM_CATEGORIES = [
  "Tất cả",
  "Cư trú & Hộ khẩu",
  "Địa chính & Nhà ở",
  "Hộ kinh doanh",
  "Hộ tịch & Tư pháp",
  "An sinh xã hội",
  "Tổ dân phố & Chi bộ"
];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SUBMIT_COOLDOWN_MS = 60 * 1000;
export const MAX_SUBMISSIONS_PER_DAY = 5;
export const RATE_KEY = "kp3_report_submissions";

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

export function readSubmissionLog(): number[] {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return Array.isArray(arr) ? arr.filter(t => typeof t === "number" && t > dayAgo) : [];
  } catch {
    return [];
  }
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl text-sm font-bold text-white bg-gov-blue hover:bg-gov-navy active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-sm font-semibold text-gov-text bg-white border border-slate-200 hover:border-gov-blue hover:text-gov-blue transition-colors cursor-pointer";
export const inputCls =
  "w-full min-h-11 px-3.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-gov-blue aria-[invalid=true]:border-gov-danger";
