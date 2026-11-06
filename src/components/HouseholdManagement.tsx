import React from "react";
import HouseholdsPage from "../page/HouseholdsPage";
import { Household, Resident, TargetGisItem, ActiveTab } from "../types";

export interface HouseholdManagementProps {
  households: Household[];
  onAddHousehold: (newH: Household) => void;
  residents: Resident[];
  onUpdateHouseholds: (households: Household[]) => void;
  onUpdateResidents: (residents: Resident[]) => void;
  onNavigateToGis?: (item: TargetGisItem) => void;
  currentUser?: any;
  residentPermissions?: Record<string, boolean>;
  setActiveTab?: (tab: ActiveTab) => void;
}

export default function HouseholdManagement({
  households,
  onAddHousehold,
  residents = [],
  onUpdateHouseholds,
  onUpdateResidents,
  onNavigateToGis,
  currentUser = { role: "admin" },
  residentPermissions = { households: true },
  setActiveTab
}: HouseholdManagementProps) {
  return (
    <HouseholdsPage
      households={households}
      residents={residents}
      currentUser={currentUser}
      residentPermissions={residentPermissions}
      onAddHousehold={onAddHousehold}
      onUpdateHouseholds={onUpdateHouseholds}
      onUpdateResidents={onUpdateResidents}
      onNavigateToGis={onNavigateToGis}
      setActiveTab={setActiveTab}
    />
  );
}
