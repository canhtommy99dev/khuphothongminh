import React from "react";
import { ShieldAlert } from "lucide-react";
import HouseholdManagement from "../components/HouseholdManagement";
import { Household, Resident, TargetGisItem, ActiveTab } from "../types";

export interface HouseholdsPageProps {
  households: Household[];
  residents: Resident[];
  currentUser: any;
  residentPermissions: Record<string, boolean>;
  onAddHousehold: (household: Omit<Household, "id">) => void;
  onUpdateHouseholds: React.Dispatch<React.SetStateAction<Household[]>>;
  onUpdateResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  onNavigateToGis: (item: TargetGisItem) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export default function HouseholdsPage({
  households,
  residents,
  currentUser,
  residentPermissions,
  onAddHousehold,
  onUpdateHouseholds,
  onUpdateResidents,
  onNavigateToGis,
  setActiveTab
}: HouseholdsPageProps) {
  if (currentUser?.role === "nguoidan" && !residentPermissions.households) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Không có quyền tra cứu Sổ Hộ Khẩu</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Theo quy định bảo vệ thông tin cá nhân và an ninh dữ liệu, vai trò Cư dân không được phép tra cứu Sổ hộ khẩu điện tử & thông tin nhân khẩu của các hộ gia đình. Chức năng này chỉ dành riêng cho Cán bộ Quản lý.
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
    <HouseholdManagement 
      households={households} 
      onAddHousehold={onAddHousehold} 
      residents={residents}
      onUpdateHouseholds={onUpdateHouseholds}
      onUpdateResidents={onUpdateResidents}
      onNavigateToGis={onNavigateToGis}
    />
  );
}

