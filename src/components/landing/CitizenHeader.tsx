import React, { useState } from "react";
import { Building2, LockKeyhole, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./landingConstants";

export interface CitizenHeaderProps {
  activeRoute?: string;
  onOpenStaff: () => void;
  goTo: (id: string) => void;
}

export default function CitizenHeader({
  activeRoute = "all",
  onOpenStaff,
  goTo
}: CitizenHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    goTo(id);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo (Shadcn style: clean, modern, crisp) */}
        <button
          onClick={() => handleNavClick("all")}
          className="flex items-center gap-2.5 text-left cursor-pointer group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg p-1 -ml-1 transition-opacity hover:opacity-90"
          aria-label="Về trang chủ Cổng Cư dân số"
        >
          <div
            className="w-9 h-9 rounded-lg bg-gov-navy text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform"
            aria-hidden="true"
          >
            <Building2 size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
              Khu phố 3 – Phường An Phú
            </span>
            <span className="text-[11px] text-slate-500 font-normal hidden sm:block whitespace-nowrap">
              Cổng thông tin cộng đồng & tiện ích số
            </span>
          </div>
        </button>

        {/* Desktop Navigation (Shadcn/ui NavigationMenu style: flat-tone, single line, no wrap) */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-1 xl:gap-1.5"
        >
          {/* Nút Trang chủ */}
          <button
            onClick={() => handleNavClick("all")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer select-none ${
              activeRoute === "all"
                ? "bg-slate-100 text-slate-950 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
            }`}
          >
            Trang chủ
          </button>

          {/* Các mục điều hướng */}
          {NAV_ITEMS.map(item => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer select-none ${
                  isActive
                    ? "bg-slate-100 text-slate-950 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
                }`}
                title={item.description}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right action area: Shadcn Button Outline & Mobile Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenStaff}
            className="hidden sm:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-2xs hover:bg-slate-100 hover:text-slate-900 h-9 px-3.5 cursor-pointer text-slate-700"
          >
            <LockKeyhole size={14} className="text-slate-500" aria-hidden="true" />
            <span>Cổng dành cho cán bộ</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="lg:hidden inline-flex items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 p-2 border border-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Shadcn/ui Sheet style) */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg space-y-3"
        >
          <nav aria-label="Điều hướng di động" className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleNavClick("all")}
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium text-left cursor-pointer transition-colors ${
                activeRoute === "all"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Trang chủ
            </button>
            {NAV_ITEMS.map(item => {
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium text-left cursor-pointer transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStaff();
              }}
              className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-gov-navy text-white hover:bg-gov-navy/90 h-10 px-4 cursor-pointer"
            >
              <LockKeyhole size={15} aria-hidden="true" />
              <span>Cổng dành cho cán bộ</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
