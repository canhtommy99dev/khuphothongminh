import React from "react";
import {
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  Coins,
  Compass,
  FileText,
  MapPin,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { btnGhost } from "./landingConstants";

export interface CitizenQuickServicesProps {
  formsCount: number;
  goTo: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export default function CitizenQuickServices({
  formsCount,
  goTo,
  onNavigateToTab
}: CitizenQuickServicesProps) {
  const cards = [
    {
      id: "reflection",
      icon: <MessageSquare size={22} />,
      title: "Phản ánh hiện trường",
      desc: "Gửi phản ánh kèm ảnh, vị trí tới Ban Điều hành.",
      accent: "bg-gov-blue"
    },
    {
      id: "forms",
      icon: <FileText size={22} />,
      title: "Biểu mẫu & hướng dẫn",
      desc: `${formsCount} biểu mẫu hành chính tải về.`,
      accent: "bg-emerald-600"
    },
    {
      id: "leadership",
      icon: <ShieldCheck size={22} />,
      title: "Cơ cấu cán bộ",
      desc: "Thường trực Chi bộ, Ban Điều hành, CSKV.",
      accent: "bg-indigo-600"
    },
    {
      id: "notices",
      icon: <Bell size={22} />,
      title: "Thông báo",
      desc: "Thông báo đã duyệt, còn hiệu lực.",
      accent: "bg-amber-600"
    },
    {
      id: "news",
      icon: <Compass size={22} />,
      title: "Tin tức địa phương",
      desc: "Hoạt động cộng đồng đã diễn ra.",
      accent: "bg-teal-600"
    },
    {
      id: "schedule",
      icon: <Calendar size={22} />,
      title: "Lịch hoạt động",
      desc: "Sự kiện sắp và đang diễn ra.",
      accent: "bg-gov-danger"
    }
  ];

  return (
    <section
      id="services"
      tabIndex={-1}
      aria-labelledby="services-title"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 scroll-mt-24 outline-none"
    >
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5">
        <h2 id="services-title" className="text-lg font-black text-gov-navy">
          Tiện ích nhanh
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => goTo(card.id)}
              className="group text-left p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-gov-blue hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col sm:flex-row items-start gap-3 min-h-11"
            >
              <span
                className={`w-11 h-11 rounded-xl ${card.accent} text-white flex items-center justify-center shrink-0`}
                aria-hidden="true"
              >
                {card.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-bold text-sm sm:text-base text-gov-navy group-hover:text-gov-blue">
                  {card.title} <ChevronRight size={16} className="hidden sm:inline" aria-hidden="true" />
                </span>
                <span className="block text-xs sm:text-sm text-slate-500 mt-1 leading-snug">
                  {card.desc}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => onNavigateToTab("ai")} className={btnGhost}>
            <Bot size={16} aria-hidden="true" /> Trợ lý AI hỏi đáp thủ tục
          </button>
          <button onClick={() => onNavigateToTab("finance")} className={btnGhost}>
            <Coins size={16} aria-hidden="true" /> Quỹ khu phố & VietQR
          </button>
          <button onClick={() => onNavigateToTab("gis")} className={btnGhost}>
            <MapPin size={16} aria-hidden="true" /> Bản đồ số GIS
          </button>
        </div>
      </div>
    </section>
  );
}
