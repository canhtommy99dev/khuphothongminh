import React from "react";
import { ChevronRight, Clock, Compass, Users } from "lucide-react";
import { LocalNews } from "../../types";
import { EmptyState, SectionHeader } from "./LandingCommon";
import { btnGhost } from "./landingConstants";

export interface CitizenNewsSectionProps {
  displayNews: LocalNews[];
  setNewsDetail: (news: LocalNews | null) => void;
  onNavigateToTab: (tab: any) => void;
}

export default function CitizenNewsSection({
  displayNews,
  setNewsDetail,
  onNavigateToTab
}: CitizenNewsSectionProps) {
  return (
    <section id="news" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 scroll-mt-24 outline-none">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5">
        <SectionHeader
          icon={<Compass size={20} />}
          title="Tin tức & Đời sống Khu phố"
          subtitle="Cập nhật tin tức chính sách, phong trào thi đua và hoạt động cộng đồng Khu phố 3."
          action={
            <button onClick={() => onNavigateToTab("cultural")} className={btnGhost}>
              Xem sự kiện <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />
        {displayNews.length === 0 ? (
          <EmptyState
            icon={<Compass size={22} />}
            title="Chưa có tin hoạt động"
            description="Tin tức sẽ được cập nhật khi Ban Điều hành ghi nhận hoạt động đã diễn ra."
          />
        ) : (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayNews.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setNewsDetail(item)}
                  className="w-full h-full text-left rounded-2xl border border-slate-200 overflow-hidden hover:border-gov-blue hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="h-28 bg-gradient-to-br from-gov-navy to-gov-blue flex items-center justify-center text-white/80 relative"
                      aria-hidden="true"
                    >
                      <Users size={36} />
                      {item.isPinned && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-bold text-[10px] shadow">
                          Ghim
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-gov-navy bg-slate-100 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {item.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-gov-text line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 mt-2">
                    <span className="truncate max-w-[180px]">Tác giả: {item.author}</span>
                    <span className="text-gov-blue font-bold">Đọc tiếp →</span>
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
