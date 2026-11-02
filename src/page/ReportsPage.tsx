import React from "react";
import FieldReflections from "../components/FieldReflections";
import { FieldReport } from "../types";

export interface ReportsPageProps {
  reports: FieldReport[];
  onAddReport: (report: Omit<FieldReport, "id" | "createdAt">) => void;
  onUpdateReportStatus: (id: string, status: any, response?: string) => void;
  onUpdateReports: React.Dispatch<React.SetStateAction<FieldReport[]>>;
  currentUser: any;
}

export default function ReportsPage(props: ReportsPageProps) {
  return <FieldReflections {...props} />;
}

