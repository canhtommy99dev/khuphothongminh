import React, { useMemo, useState } from "react";
import { ChevronRight, Download, Eye, FileText, Search } from "lucide-react";
import { AdministrativeForm } from "../../types";
import { EmptyState, SectionHeader } from "./LandingCommon";
import { FORM_CATEGORIES, btnGhost, btnPrimary, inputCls } from "./landingConstants";

export interface CitizenFormsSectionProps {
  forms: AdministrativeForm[];
  onNavigateToTab: (tab: any) => void;
  setPreviewForm: (form: AdministrativeForm | null) => void;
  handleDownloadForm: (form: AdministrativeForm) => void;
}

export default function CitizenFormsSection({
  forms,
  onNavigateToTab,
  setPreviewForm,
  handleDownloadForm
}: CitizenFormsSectionProps) {
  const [formCategory, setFormCategory] = useState("Tất cả");
  const [formQuery, setFormQuery] = useState("");

  const filteredForms = useMemo(() => {
    const q = formQuery.trim().toLowerCase();
    return forms.filter(
      f =>
        (formCategory === "Tất cả" || f.category === formCategory) &&
        (!q ||
          f.title.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q))
    );
  }, [forms, formCategory, formQuery]);

  return (
    <section id="forms" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 scroll-mt-24 outline-none">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5">
        <SectionHeader
          icon={<FileText size={20} />}
          title="Kho biểu mẫu"
          subtitle="Biểu mẫu công khai trong hệ thống. Bấm “Hướng dẫn” để xem hồ sơ cần chuẩn bị."
          action={
            <button onClick={() => onNavigateToTab("forms")} className={btnGhost}>
              Mở trang biểu mẫu đầy đủ <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative md:w-80">
            <label htmlFor="form-search" className="sr-only">
              Tìm biểu mẫu
            </label>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="form-search"
              type="search"
              value={formQuery}
              onChange={e => setFormQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc mã…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Lọc theo nhóm thủ tục">
            {FORM_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFormCategory(c)}
                aria-pressed={formCategory === c}
                className={`min-h-11 px-3 rounded-xl text-sm font-semibold whitespace-nowrap cursor-pointer ${
                  formCategory === c ? "bg-gov-navy text-white" : "bg-gov-light text-slate-700 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filteredForms.length === 0 ? (
          <EmptyState
            icon={<FileText size={22} />}
            title="Không có biểu mẫu phù hợp"
            description="Thử từ khóa khác hoặc chọn nhóm “Tất cả”."
            action={
              <button onClick={() => { setFormQuery(""); setFormCategory("Tất cả"); }} className={btnGhost}>
                Xoá bộ lọc
              </button>
            }
          />
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredForms.map(f => (
              <li
                key={f.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-gov-blue hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-gov-navy bg-blue-100 px-2 py-0.5 rounded">
                      {f.code}
                    </span>
                    <span className="text-slate-500">
                      {f.fileFormat} · {f.fileSize}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gov-navy line-clamp-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{f.description}</p>
                  <p className="text-xs text-slate-500">
                    Nơi tiếp nhận: <span className="text-gov-text">{f.issuingBody}</span>
                  </p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setPreviewForm(f)} className={`${btnGhost} flex-1`}>
                    <Eye size={16} aria-hidden="true" /> Hướng dẫn
                  </button>
                  <button onClick={() => handleDownloadForm(f)} className={`${btnPrimary} flex-1`}>
                    <Download size={16} aria-hidden="true" /> Tải về
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
