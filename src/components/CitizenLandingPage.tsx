import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Home } from "lucide-react";
import { AdministrativeForm, CommunityEvent, FieldReport, LocalNews } from "../types";
import CitizenFooter from "./landing/CitizenFooter";
import CitizenFormsSection from "./landing/CitizenFormsSection";
import CitizenHeader from "./landing/CitizenHeader";
import CitizenHero from "./landing/CitizenHero";
import CitizenLeadershipSection from "./landing/CitizenLeadershipSection";
import CitizenModals from "./landing/CitizenModals";
import CitizenNewsSection from "./landing/CitizenNewsSection";
import CitizenNoticesSection from "./landing/CitizenNoticesSection";
import CitizenQuickServices from "./landing/CitizenQuickServices";
import CitizenReflectionSection from "./landing/CitizenReflectionSection";
import CitizenScheduleSection from "./landing/CitizenScheduleSection";
import {
  LandingRoute,
  NAV_ITEMS,
  VERIFIED_LEADERSHIP
} from "./landing/landingConstants";

/* ==========================================================================
   CỔNG NGƯỜI DÂN — LANDING PAGE KHU PHỐ 3, PHƯỜNG AN PHÚ
   Nguyên tắc dữ liệu:
   - Hiển thị dữ liệu trực tiếp từ hệ thống quản lý Khu phố 3 (props).
   - Tự động đồng bộ các bài viết tin tức, thông báo khẩn do Cán bộ ban hành.
   - Kiến trúc tách module: Header, Hero, Services, Reflection, Forms, Notices,
     News, Leadership, Schedule, Footer, Modals.
   ========================================================================== */

export interface CitizenLandingPageProps {
  reports: FieldReport[];
  forms: AdministrativeForm[];
  events: CommunityEvent[];
  news?: LocalNews[];
  residents?: any[];
  households?: any[];
  businesses?: any[];
  onAddReport: (newReport: FieldReport) => void;
  /** Mở màn hình đăng nhập hiện hữu (LoginAndRegister) để vào Cổng cán bộ */
  onOpenStaffLogin?: () => void;
  onSwitchToCanBo?: () => void;
  onNavigateToTab: (tab: any) => void;
}

export default function CitizenLandingPage({
  reports,
  forms,
  events,
  news = [],
  residents,
  households,
  businesses,
  onAddReport,
  onOpenStaffLogin,
  onSwitchToCanBo,
  onNavigateToTab
}: CitizenLandingPageProps) {
  const handleOpenStaff = () => {
    if (onSwitchToCanBo) {
      onSwitchToCanBo();
    } else if (onOpenStaffLogin) {
      onOpenStaffLogin();
    }
  };

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Active page route based on NAV_ITEMS: "all" or specific route id
  const [activeRoute, setActiveRoute] = useState<LandingRoute>("all");

  // Sync activeRoute with URL hash (#reflection, #forms, etc.)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      const valid = NAV_ITEMS.some(n => n.id === hash);
      if (valid) {
        setActiveRoute(hash as LandingRoute);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (!hash || hash === "all") {
        setActiveRoute("all");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Global search
  const [portalSearch, setPortalSearch] = useState("");

  // Detail modals
  const [previewForm, setPreviewForm] = useState<AdministrativeForm | null>(null);
  const [eventDetail, setEventDetail] = useState<CommunityEvent | null>(null);
  const [newsDetail, setNewsDetail] = useState<LocalNews | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const goTo = (id: string) => {
    const isValidRoute = NAV_ITEMS.some(n => n.id === id);
    if (isValidRoute) {
      setActiveRoute(id as LandingRoute);
      window.location.hash = id;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setActiveRoute("all");
      if (window.location.hash) {
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentNavItem = useMemo(
    () => NAV_ITEMS.find(n => n.id === activeRoute),
    [activeRoute]
  );

  /* ------------------------------ Derived data ------------------------------ */

  // Lịch hoạt động: sự kiện sắp/đang diễn ra
  const upcomingEvents = useMemo(
    () => events.filter(e => e.status === "Sắp diễn ra" || e.status === "Đang diễn ra"),
    [events]
  );

  // Thông báo chính thức & tin khẩn: lấy từ danh sách news có isPinned hoặc Thông báo khẩn / Hành chính
  const displayNotices = useMemo(() => {
    if (news && news.length > 0) {
      const pinnedOrUrgent = news.filter(
        n => n.isPinned || n.category === "Thông báo khẩn" || n.category === "Hành chính"
      );
      return pinnedOrUrgent.length > 0 ? pinnedOrUrgent : news.slice(0, 4);
    }
    return [];
  }, [news]);

  // Tin tức cộng đồng: toàn bộ bài viết mới nhất do cán bộ đăng
  const displayNews = useMemo(() => {
    if (news && news.length > 0) return news;
    return [];
  }, [news]);

  // Tìm kiếm toàn cổng: biểu mẫu, hoạt động, tin tức, cán bộ
  const searchResults = useMemo(() => {
    const q = portalSearch.trim().toLowerCase();
    if (q.length < 2) return null;
    return {
      forms: forms
        .filter(f => f.title.toLowerCase().includes(q) || f.code.toLowerCase().includes(q))
        .slice(0, 5),
      events: events
        .filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
        .slice(0, 5),
      leaders: VERIFIED_LEADERSHIP.filter(
        l => l.name.toLowerCase().includes(q) || l.role.toLowerCase().includes(q)
      ),
      news: (news || [])
        .filter(n => n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q)))
        .slice(0, 5)
    };
  }, [portalSearch, forms, events, news]);

  /* ------------------------------- Handlers ------------------------------- */

  const handleDownloadForm = (form: AdministrativeForm) => {
    const blob = new Blob(["\uFEFF" + form.templateContent], {
      type: "application/msword;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.code}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Đã tải biểu mẫu ${form.code}`);
  };

  /* --------------------------------- Render --------------------------------- */

  return (
    <div className="min-h-screen bg-gov-light text-gov-text font-sans antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow"
      >
        Bỏ qua đến nội dung chính
      </a>

      {/* 1. Header (Navbar, Logo, Mobile Nav, Cổng cán bộ, Active Route indicator) */}
      <CitizenHeader activeRoute={activeRoute} onOpenStaff={handleOpenStaff} goTo={goTo} />

      {/* 2. Main content sections with route switching */}
      <main id="main-content" tabIndex={-1} className="outline-none">
        {/* Sub-page Breadcrumb & Header Banner when route !== "all" */}
        {activeRoute !== "all" && currentNavItem && (
          <div className="bg-gradient-to-r from-gov-navy via-[#0c407c] to-gov-blue text-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
                <button
                  onClick={() => goTo("all")}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Home size={13} aria-hidden="true" /> Trang chủ
                </button>
                <ChevronRight size={13} className="text-blue-300" aria-hidden="true" />
                <span className="text-white font-bold">{currentNavItem.label}</span>
              </nav>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{currentNavItem.label}</h1>
                  <p className="text-sm sm:text-base text-blue-100 mt-1 max-w-2xl">{currentNavItem.description}</p>
                </div>
                <button
                  onClick={() => goTo("all")}
                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all cursor-pointer backdrop-blur-xs"
                >
                  ← Về toàn bộ trang chủ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROUTE 0: TRANG CHỦ (Chỉ hiển thị Hero Banner & Tiện ích nhanh) */}
        {activeRoute === "all" ? (
          <>
            {/* Hero banner & Quy mô địa bàn KP3 */}
            <CitizenHero
              portalSearch={portalSearch}
              setPortalSearch={setPortalSearch}
              searchResults={searchResults}
              setPreviewForm={setPreviewForm}
              setEventDetail={setEventDetail}
              setNewsDetail={setNewsDetail}
              goTo={goTo}
              onNavigateToTab={onNavigateToTab}
              households={households}
              residents={residents}
              businesses={businesses}
            />

            {/* Tiện ích nhanh (id="services") — cổng điều hướng vào các chuyên mục */}
            <CitizenQuickServices
              formsCount={forms.length}
              goTo={goTo}
              onNavigateToTab={onNavigateToTab}
            />
          </>
        ) : (
          /* ROUTE CHUYÊN BIỆT: CHỈ RENDER PHÂN HỆ ĐƯỢC CHỌN */
          <div className="pb-16 min-h-[60vh]">
            {activeRoute === "services" && (
              <div className="pt-8">
                <CitizenQuickServices
                  formsCount={forms.length}
                  goTo={goTo}
                  onNavigateToTab={onNavigateToTab}
                />
              </div>
            )}

            {activeRoute === "reflection" && (
              <CitizenReflectionSection
                reports={reports}
                onAddReport={onAddReport}
                showToast={showToast}
              />
            )}

            {activeRoute === "forms" && (
              <CitizenFormsSection
                forms={forms}
                onNavigateToTab={onNavigateToTab}
                setPreviewForm={setPreviewForm}
                handleDownloadForm={handleDownloadForm}
              />
            )}

            {activeRoute === "notices" && (
              <CitizenNoticesSection
                displayNotices={displayNotices}
                setNewsDetail={setNewsDetail}
                goTo={goTo}
              />
            )}

            {activeRoute === "news" && (
              <CitizenNewsSection
                displayNews={displayNews}
                setNewsDetail={setNewsDetail}
                onNavigateToTab={onNavigateToTab}
              />
            )}

            {activeRoute === "leadership" && <CitizenLeadershipSection />}

            {activeRoute === "schedule" && (
              <CitizenScheduleSection
                upcomingEvents={upcomingEvents}
                setEventDetail={setEventDetail}
                onNavigateToTab={onNavigateToTab}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Footer (Thông tin, nguồn tin, bản quyền) */}
      <CitizenFooter onOpenStaff={handleOpenStaff} />

      {/* 4. Modals & Notifications */}
      <CitizenModals
        previewForm={previewForm}
        setPreviewForm={setPreviewForm}
        eventDetail={eventDetail}
        setEventDetail={setEventDetail}
        newsDetail={newsDetail}
        setNewsDetail={setNewsDetail}
        toast={toast}
        handleDownloadForm={handleDownloadForm}
      />
    </div>
  );
}
