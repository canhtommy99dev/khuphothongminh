import React from "react";
import NeighborhoodFunds from "../components/NeighborhoodFunds";
import { FundContribution, Household } from "../types";

export interface FinancePageProps {
  contributions: FundContribution[];
  households: Household[];
  onAddContribution: (contribution: Omit<FundContribution, "id">) => void;
  onUpdateContributionStatus: (id: string, status: any) => void;
}

export default function FinancePage(props: FinancePageProps) {
  return <NeighborhoodFunds {...props} />;
}

