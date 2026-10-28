import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function SectionHeader({
  icon,
  title,
  subtitle,
  action
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-gov-blue" aria-hidden="true">{icon}</span>
          <h2 className="text-lg sm:text-xl font-black text-gov-navy tracking-tight">{title}</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-10 px-6 text-center rounded-2xl border border-dashed border-slate-300 bg-gov-light space-y-3" role="status">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center" aria-hidden="true">
        {icon}
      </div>
      <h3 className="font-bold text-gov-text text-sm">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gov-light">
          <h3 className="font-bold text-gov-text text-base leading-snug">{title}</h3>
          <button ref={closeRef} onClick={onClose} aria-label="Đóng" className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto text-sm text-slate-700 space-y-4">{children}</div>
        {footer && <div className="p-4 border-t border-slate-100 bg-gov-light flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
