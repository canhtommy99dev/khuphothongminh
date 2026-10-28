import React from "react";
import {
  Briefcase,
  Calendar,
  Compass,
  FileText,
  Home,
  MapPin,
  MessageSquare,
  Search,
  Users
} from "lucide-react";
import { AdministrativeForm, CommunityEvent, LocalNews } from "../../types";
import { VERIFIED_LEADERSHIP } from "./landingConstants";

export interface CitizenHeroProps {
  portalSearch: string;
  setPortalSearch: (val: string) => void;
  searchResults: {
    forms: AdministrativeForm[];
    events: CommunityEvent[];
    leaders: typeof VERIFIED_LEADERSHIP;
    news: LocalNews[];
  } | null;
  setPreviewForm: (form: AdministrativeForm | null) => void;
  setEventDetail: (event: CommunityEvent | null) => void;
  setNewsDetail: (news: LocalNews | null) => void;
  goTo: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
  households?: any[];
  residents?: any[];
  businesses?: any[];
}

export default function CitizenHero({
  portalSearch,
  setPortalSearch,
  searchResults,
  setPreviewForm,
  setEventDetail,
  setNewsDetail,
  goTo,
  onNavigateToTab,
  households,
  residents,
  businesses
}: CitizenHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gov-navy via-[#0a4a8c] to-gov-blue text-white">
      <div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20 sm:pb-24 grid lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Slogan, Actions & Search */}
        <div className="lg:col-span-7 space-y-6 kp3-fade-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-blue-100">
            Khu phố 3 · Phường An Phú · TP. Hồ Chí Minh
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
            Kết nối người dân – Xây dựng khu phố văn minh
          </h1>
          <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-2xl">
            Gửi phản ánh hiện trường, tra cứu biểu mẫu hành chính, theo dõi hoạt động cộng đồng và thông tin liên hệ Ban Điều hành Khu phố 3 — ngay trên điện thoại.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => goTo("reflection")}
              className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl text-base font-bold bg-white text-gov-navy hover:bg-blue-50 shadow-lg transition-all cursor-pointer"
            >
              <MessageSquare size={18} aria-hidden="true" /> Phản ánh hiện trường
            </button>
            <button
              onClick={() => goTo("forms")}
              className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl text-base font-semibold bg-white/10 border border-white/30 hover:bg-white/20 transition-all cursor-pointer"
            >
              <FileText size={18} aria-hidden="true" /> Tra cứu biểu mẫu
            </button>
          </div>

          {/* Tìm kiếm toàn cổng */}
          <div className="relative max-w-xl">
            <label htmlFor="portal-search" className="sr-only">
              Tìm kiếm biểu mẫu, hoạt động, cán bộ
            </label>
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="portal-search"
              type="search"
              value={portalSearch}
              onChange={e => setPortalSearch(e.target.value)}
              placeholder="Tìm biểu mẫu, hoạt động, cán bộ…"
              className="w-full min-h-12 pl-11 pr-4 rounded-xl text-sm text-gov-text bg-white border-0 shadow-lg focus:outline-none"
            />
            {searchResults && (
              <div
                className="absolute left-0 right-0 mt-2 bg-white text-gov-text rounded-2xl shadow-2xl border border-slate-200 p-2 max-h-80 overflow-y-auto z-30"
                role="listbox"
                aria-label="Kết quả tìm kiếm"
              >
                {searchResults.forms.length +
                  searchResults.events.length +
                  searchResults.leaders.length +
                  searchResults.news.length ===
                0 ? (
                  <p className="p-3 text-sm text-slate-500">
                    Không tìm thấy kết quả cho “{portalSearch}”.
                  </p>
                ) : (
                  <>
                    {searchResults.forms.map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setPreviewForm(f);
                          setPortalSearch("");
                        }}
                        className="w-full min-h-11 text-left px-3 py-2 rounded-xl hover:bg-gov-light flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <FileText size={15} className="text-gov-blue shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {f.code} — {f.title}
                        </span>
                      </button>
                    ))}
                    {searchResults.events.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => {
                          setEventDetail(ev);
                          setPortalSearch("");
                        }}
                        className="w-full min-h-11 text-left px-3 py-2 rounded-xl hover:bg-gov-light flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Calendar size={15} className="text-gov-blue shrink-0" aria-hidden="true" />
                        <span className="truncate">{ev.title}</span>
                      </button>
                    ))}
                    {searchResults.news.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setNewsDetail(n);
                          setPortalSearch("");
                        }}
                        className="w-full min-h-11 text-left px-3 py-2 rounded-xl hover:bg-gov-light flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Compass size={15} className="text-teal-600 shrink-0" aria-hidden="true" />
                        <span className="truncate">Tin tức: {n.title}</span>
                      </button>
                    ))}
                    {searchResults.leaders.map(l => (
                      <button
                        key={l.name}
                        onClick={() => {
                          setPortalSearch("");
                          goTo("leadership");
                        }}
                        className="w-full min-h-11 text-left px-3 py-2 rounded-xl hover:bg-gov-light flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Users size={15} className="text-gov-blue shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {l.name} — {l.role}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quy mô địa bàn KP3 (Số liệu đã xác minh theo AGENTS.md) */}
        <div className="lg:col-span-5 kp3-fade-up [animation-delay:120ms]">
          <div className="rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-100">
              <Compass size={16} aria-hidden="true" /> Quy mô địa bàn Khu phố 3
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: <Home size={18} />,
                  value:
                    households?.length && households.length >= 100
                      ? households.length.toLocaleString("vi-VN")
                      : "488",
                  label: "Hộ gia đình"
                },
                {
                  icon: <Users size={18} />,
                  value:
                    residents?.length && residents.length >= 1000
                      ? residents.length.toLocaleString("vi-VN")
                      : "11.632",
                  label: "Nhân khẩu"
                },
                {
                  icon: <Briefcase size={18} />,
                  value:
                    businesses?.length && businesses.length >= 50
                      ? businesses.length.toLocaleString("vi-VN")
                      : "118",
                  label: "Cơ sở kinh doanh"
                }
              ].map(s => (
                <div key={s.label} className="rounded-2xl bg-white/10 p-3 text-center">
                  <span className="text-blue-200 flex justify-center" aria-hidden="true">
                    {s.icon}
                  </span>
                  <dd className="text-xl sm:text-2xl font-black mt-1">{s.value}</dd>
                  <dt className="text-[11px] text-blue-100">{s.label}</dt>
                </div>
              ))}
            </dl>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Địa bàn khép kín theo các trục đường Song Hành, Lương Định Của, Mai Chí Thọ.
            </p>
            <button
              onClick={() => onNavigateToTab("gis")}
              className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold cursor-pointer"
            >
              <MapPin size={16} aria-hidden="true" /> Xem bản đồ số địa bàn
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
