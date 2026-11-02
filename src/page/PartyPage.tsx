import React from "react";
import PartyBranch from "../components/PartyBranch";
import { PartyMember, Resident } from "../types";

export interface PartyPageProps {
  partyMembers: PartyMember[];
  residents: Resident[];
}

export default function PartyPage(props: PartyPageProps) {
  return <PartyBranch {...props} />;
}

