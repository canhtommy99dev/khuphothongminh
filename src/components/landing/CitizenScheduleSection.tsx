import React from "react";
import { Calendar, ChevronRight, Clock, MapPin } from "lucide-react";
import { CommunityEvent } from "../../types";
import { EmptyState, SectionHeader } from "./LandingCommon";
import { btnGhost } from "./landingConstants";

export interface CitizenScheduleSectionProps {
  upcomingEvents: CommunityEvent[];
  setEventDetail: (event: CommunityEvent | null) => void;
  onNavigateToTab: (tab: any) => void;
}

export default function CitizenScheduleSection({
  upcomingEvents,
  setEventDetail,
  onNavigateToTab
}: CitizenScheduleSectionProps) {
  return (
    <section id="schedule" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24 outline-none">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5">
        <SectionHeader
          icon={<Calendar size={20} />}
          title="Lịch hoạt động"
          subtitle="Sự kiện sắp và đang diễn ra — cùng nguồn dữ liệu với phân hệ Tin tức & Sự kiện."
          action={
            <button onClick={() => onNavigateToTab("cultural")} className={btnGhost}>
              Xem đầy đủ <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />
        {upcomingEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar size={22} />}
            title="Chưa có lịch hoạt động sắp tới"
            description="Lịch sẽ hiển thị khi Ban Điều hành cập nhật sự kiện mới."
          />
        ) : (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map(ev => (
              <li key={ev.id}>
                <button
                  onClick={() => setEventDetail(ev)}
                  className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-gov-blue transition-colors cursor-pointer space-y-2"
                >
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      ev.status === "Đang diễn ra"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-gov-navy"
                    }`}
                  >
                    {ev.status}
                  </span>
                  <h3 className="font-bold text-sm text-gov-text line-clamp-2">{ev.title}</h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock size={13} className="text-gov-blue" aria-hidden="true" /> {ev.dateTime}
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin size={13} className="text-gov-danger" aria-hidden="true" />{" "}
                    <span className="truncate">{ev.location}</span>
                  </p>
                  <p className="text-xs text-slate-500">Phụ trách: {ev.organizer}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
