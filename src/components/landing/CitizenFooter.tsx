import React from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { PUBLIC_CONTACT_EMAIL, ROUTES, Link } from "./landingConstants";

export interface CitizenFooterProps {
  onOpenStaff: () => void;
}

export default function CitizenFooter({ onOpenStaff }: CitizenFooterProps) {
  return (
    <footer className="bg-gov-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8 text-sm">
        {/* Column 1: Info & Contact */}
        <div className="space-y-3 md:col-span-1">
          <p className="font-black text-base">Khu phố 3 – Phường An Phú</p>
          <p className="text-blue-100/90">Đơn vị phụ trách nội dung: Ban Điều hành Khu phố 3.</p>
          <a
            href={`mailto:${PUBLIC_CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 min-h-11 text-blue-100 hover:text-white underline-offset-4 hover:underline"
          >
            <Mail size={16} aria-hidden="true" /> {PUBLIC_CONTACT_EMAIL}
          </a>
        </div>

        {/* Column 2: Data Sources */}
        <div className="space-y-3">
          <p className="font-bold text-blue-200 uppercase text-xs tracking-wider">Nguồn tin & dữ liệu</p>
          <p className="text-blue-100/90">
            Thông báo, lịch hoạt động, biểu mẫu và phản ánh hiển thị từ hệ thống quản lý nội bộ của Khu phố 3. Số liệu quy mô địa bàn do Ban Điều hành cung cấp.
          </p>
        </div>

        {/* Column 3: Data Protection & Staff Portal */}
        <div className="space-y-3">
          <p className="font-bold text-blue-200 uppercase text-xs tracking-wider">Bảo vệ dữ liệu</p>
          <p className="text-blue-100/90">
            Thông tin cá nhân trong phản ánh chỉ dùng cho mục đích tiếp nhận và xử lý, chỉ cán bộ có thẩm quyền được truy cập.
          </p>
          <Link
            to={ROUTES.DASHBOARD}
            onClick={onOpenStaff}
            className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold cursor-pointer"
            title="Đến Bảng Điều Hành Cán Bộ (/dashboard)"
          >
            <LockKeyhole size={16} aria-hidden="true" /> Cổng dành cho cán bộ
          </Link>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="border-t border-white/10 py-4 px-4 text-center text-xs text-blue-200">
        Cổng thông tin cộng đồng do Ban Điều hành Khu phố 3 vận hành · Không phải cổng thông tin điện tử chính thức của cơ quan nhà nước.
      </div>
    </footer>
  );
}
