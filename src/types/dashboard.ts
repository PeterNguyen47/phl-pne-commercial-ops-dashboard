export type AirportCode = "ALL" | "PHL" | "PNE";
export type AirportOnlyCode = "PHL" | "PNE";
export type SourceKind = "Public Source" | "Illustrative Model" | "Derived From Public";
export type StatusKind = "normal" | "warning" | "critical";
export type TrendKind = "up" | "down" | "flat";
export type PeriodKey = "today" | "7d" | "30d";

export type CommercialVertical =
  | "Parking"
  | "Ground Transportation"
  | "Concessions"
  | "Advertising"
  | "Property Development"
  | "Terminal Leases"
  | "Ground Leases"
  | "Air Cargo"
  | "Gate Utilization"
  | "Airline Schedules"
  | "Aviation Activity";

export type Domain = "Commercial BI" | "Revenue Verticals" | "Lease Governance" | "Data Strategy";

export interface SourceReference {
  label: string;
  url: string;
  kind: SourceKind;
  useCase: string;
}

export interface AirportProfile {
  code: AirportOnlyCode;
  name: string;
  role: string;
  focus: string;
  publicFacts: string[];
  source: SourceKind;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  target: string;
  delta: string;
  trend: TrendKind;
  status: StatusKind;
  source: SourceKind;
  airport: AirportCode;
}

export interface DomainRisk {
  domain: Domain;
  airport: AirportCode;
  score: number;
  status: StatusKind;
  driver: string;
  action: string;
  source: SourceKind;
}

export interface CommercialVerticalMetric {
  id: string;
  airport: AirportCode;
  vertical: CommercialVertical;
  publicSignal: string;
  currentVisibility: number;
  opportunity: string;
  internalDataNeeded: string;
  recommendedAction: string;
  status: StatusKind;
  source: SourceKind;
}

export interface DataAsset {
  id: string;
  airport: AirportCode;
  sourceName: string;
  owner: string;
  refreshCadence: string;
  qualityStatus: StatusKind;
  accessStatus: string;
  roleUseCase: string;
  source: SourceKind;
}

export interface AgreementRecord {
  id: string;
  airport: AirportCode;
  agreementType: string;
  tenantOrVendor: string;
  value: number;
  expiration: string;
  completeness: number;
  complianceFlag: StatusKind;
  recommendedAction: string;
  source: SourceKind;
}

export interface InsightItem {
  id: string;
  airport: AirportCode;
  title: string;
  publicObservation: string;
  businessQuestion: string;
  internalDataNeeded: string;
  recommendation: string;
  status: StatusKind;
  source: SourceKind;
}

export interface TrainingOrAdoptionItem {
  id: string;
  audience: string;
  skillGap: string;
  toolOrProcess: string;
  status: StatusKind;
  nextMilestone: string;
  source: SourceKind;
}

export interface RoadmapItem {
  id: string;
  phase: string;
  title: string;
  outcome: string;
  owner: string;
  status: StatusKind;
  source: SourceKind;
}

export interface TrendPoint {
  label: string;
  phlOpportunity: number;
  pneOpportunity: number;
  dataReadiness: number;
  agreementCompleteness: number;
  adoption: number;
}

export interface DecisionItem {
  id: string;
  airport: AirportCode;
  title: string;
  domain: Domain;
  severity: StatusKind;
  owner: string;
  dueDate: string;
  impact: string;
  recommendation: string;
  status: "New" | "In Review" | "Escalated" | "Approved";
  source: SourceKind;
}
