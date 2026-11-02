import React from "react";
import EnterpriseManagement from "../components/EnterpriseManagement";
import { Business, Resident, Household, TargetGisItem } from "../types";

export interface EnterprisesPageProps {
  businesses: Business[];
  residents: Resident[];
  households: Household[];
  onToggleCertification: (id: string) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onUpdateBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  onNavigateToGis: (item: TargetGisItem) => void;
}

export default function EnterprisesPage(props: EnterprisesPageProps) {
  return <EnterpriseManagement {...props} />;
}

