import React from "react";
import Dashboard from "../components/Dashboard";
import { Resident, Household, Business, FieldReport, AdministrativeForm, ActiveTab } from "../types";

export interface DashboardPageProps {
  residents: Resident[];
  households: Household[];
  businesses: Business[];
  reports: FieldReport[];
  forms: AdministrativeForm[];
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: any;
}

export default function DashboardPage(props: DashboardPageProps) {
  return <Dashboard {...props} />;
}

