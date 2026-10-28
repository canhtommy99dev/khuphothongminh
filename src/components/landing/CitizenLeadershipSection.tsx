import React from "react";
import { Info, Mail, ShieldCheck } from "lucide-react";
import { SectionHeader } from "./LandingCommon";
import { PUBLIC_CONTACT_EMAIL, VERIFIED_LEADERSHIP, btnGhost } from "./landingConstants";

export default function CitizenLeadershipSection() {
  return (
    <section id="leadership" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 scroll-mt-24 outline-none">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5">
        <SectionHeader
          icon={<ShieldCheck size={20} />}
          title="Cơ cấu tổ chức & cán bộ"
          subtitle="Thường trực Ban điều hành Khu phố 3."
        />
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VERIFIED_LEADERSHIP.map(l => (
            <li key={l.name} className="p-5 rounded-2xl border border-slate-200 flex items-start gap-4">
              <span
                className="w-12 h-12 rounded-2xl bg-blue-100 text-gov-navy font-black flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                {l.name.split(" ").slice(-1)[0].charAt(0)}
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-gov-text">{l.name}</h3>
                <p className="text-sm font-semibold text-gov-blue">{l.role}</p>
                <p className="text-xs text-slate-500 mt-0.5">{l.scope}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="p-4 rounded-2xl bg-gov-light border border-slate-200 text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="flex items-start gap-2">
            <Info size={16} className="text-gov-blue shrink-0 mt-0.5" aria-hidden="true" />
            Số điện thoại, ảnh và lịch tiếp dân của từng cán bộ sẽ được bổ sung khi được phê duyệt công khai.
          </span>
          <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} className={`${btnGhost} shrink-0`}>
            <Mail size={16} aria-hidden="true" /> {PUBLIC_CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
