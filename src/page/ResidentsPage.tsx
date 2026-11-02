import React from "react";
import { ShieldAlert } from "lucide-react";
import CitizenManagement from "../components/CitizenManagement";
import { Resident, Household, TargetGisItem, ActiveTab } from "../types";

export interface ResidentsPageProps {
  residents: Resident[];
  households: Household[];
  currentUser: any;
  residentPermissions: Record<string, boolean>;
  onAddResident: (resident: Omit<Resident, "id">) => void;
  onDeleteResident: (id: string) => void;
  onUpdateResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  onUpdateHouseholds: React.Dispatch<React.SetStateAction<Household[]>>;
  onNavigateToGis: (item: TargetGisItem) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export default function ResidentsPage({
  residents,
  households,
  currentUser,
  residentPermissions,
  onAddResident,
  onDeleteResident,
  onUpdateResidents,
  onUpdateHouseholds,
  onNavigateToGis,
  setActiveTab
}: ResidentsPageProps) {
  if (currentUser?.role === "nguoidan" && !residentPermissions.residents) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Không có quyền truy cập Nhân khẩu</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Theo quy định bảo vệ dữ liệu cư dân, vai trò Cư dân không được phép tra cứu danh bạ nhân khẩu. Quyền này chỉ dành riêng cho Cán bộ Quản lý địa bàn.
        </p>
        <button
          onClick={() => setActiveTab("dashboard")}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Quay về Cổng cư dân
        </button>
      </div>
    );
  }

  return (
    <CitizenManagement 
      residents={residents} 
      onAddResident={onAddResident} 
      onDeleteResident={onDeleteResident} 
      onUpdateResidents={onUpdateResidents}
      onUpdateHouseholds={onUpdateHouseholds}
      households={households}
      onNavigateToGis={onNavigateToGis}
    />
  );
}

