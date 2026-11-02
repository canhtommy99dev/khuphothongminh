import React from "react";
import SocialWelfare from "../components/SocialWelfare";
import { WelfareRecipient, Resident } from "../types";

export interface WelfarePageProps {
  recipients: WelfareRecipient[];
  residents: Resident[];
  onUpdateStatus: (id: string, status: any) => void;
  onAddRecipient: (recipient: Omit<WelfareRecipient, "id">) => void;
  onDeleteRecipient: (id: string) => void;
}

export default function WelfarePage(props: WelfarePageProps) {
  return <SocialWelfare {...props} />;
}

