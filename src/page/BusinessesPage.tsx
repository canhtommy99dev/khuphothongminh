import React from "react";
import BusinessManagement from "../components/BusinessManagement";
import { Business, Resident, Household, TargetGisItem } from "../types";

export interface BusinessesPageProps {
  businesses: Business[];
  residents: Resident[];
  households: Household[];
  onToggleCertification: (id: string) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onUpdateBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  onNavigateToGis: (item: TargetGisItem) => void;
}

export default function BusinessesPage(props: BusinessesPageProps) {
  return <BusinessManagement {...props} />;
}

