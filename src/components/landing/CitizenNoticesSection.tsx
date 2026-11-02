import React from "react";
import { Bell, Clock } from "lucide-react";
import { LocalNews } from "../../types";
import { EmptyState, SectionHeader } from "./LandingCommon";
import { btnGhost, Link, ROUTES } from "./landingConstants";

export interface CitizenNoticesSectionProps {
  displayNotices: LocalNews[];
  setNewsDetail: (news: LocalNews | null) => void;
  goTo?: (id: string) => void;
}

export default function CitizenNoticesSection({
  displayNotices,
  setNewsDetail,
  goTo
}: CitizenNoticesSectionProps) {
  return (
    <section id="notices" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 scroll-mt-24 outline-none">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5">
        <SectionHeader
          icon={<Bell size={20} />}
          title="Thông báo Khu phố"
          subtitle="Thông báo chỉ đạo, lịch tiếp dân và cảnh báo khẩn đã được Ban Điều hành phê duyệt."
        />
        {displayNotices.length === 0 ? (
          <EmptyState
            icon={<Bell size={22} />}
            title="Chưa có thông báo được công bố"
            description="Khi Ban Điều hành duyệt và công bố thông báo, nội dung sẽ hiển thị tại đây. Trong lúc chờ, bạn có thể xem các hoạt động cộng đồng."
            action={
              <Link to={ROUTES.SCHEDULE} className={btnGhost}>
                Xem lịch hoạt động
              </Link>
            }
          />
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {[...displayNotices]
              .sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned))
              .map(n => (
                <li key={n.id}>
                  <button
                    onClick={() => setNewsDetail(n)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 h-full hover:shadow-md ${
                      n.isPinned
                        ? "border-gov-danger/40 bg-red-50/30 hover:border-gov-danger"
                        : "border-slate-200 hover:border-gov-blue"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            n.isPinned ? "bg-red-100 text-gov-danger font-bold" : "bg-blue-100 text-gov-navy"
                          }`}
                        >
                          {n.isPinned ? "📌 Ưu tiên" : n.category}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                          <Clock size={11} /> {n.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {n.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {n.content}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                      <span className="truncate max-w-[200px]">
                        Nguồn: <strong className="text-slate-700">{n.author}</strong>
                      </span>
                      <span className="text-gov-blue font-bold flex items-center gap-0.5">Chi tiết →</span>
                    </div>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
