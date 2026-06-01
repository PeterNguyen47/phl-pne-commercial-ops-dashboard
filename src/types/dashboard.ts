export type AirportCode = "ALL" | "PHL" | "PNE";
export type AirportOnlyCode = "PHL" | "PNE";
export type SourceKind = "Public" | "Sample Internal" | "Derived";
export type StatusKind = "normal" | "warning" | "critical";
export type TrendKind = "up" | "down" | "flat";
export type Domain = "Ground Operations" | "Parking & Commercial" | "Contracts";
export type PeriodKey = "today" | "7d" | "30d";

export interface SourceReference {
  label: string;
  url: string;
  kind: SourceKind;
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

export interface OperationalEvent {
  id: string;
  airport: AirportOnlyCode;
  domain: Domain;
  severity: StatusKind;
  location: string;
  timestamp: string;
  impact: string;
  owner: string;
  source: SourceKind;
}

export interface ParkingLotMetric {
  id: string;
  airport: AirportOnlyCode;
  lot: string;
  product: string;
  capacity: number;
  occupied: number;
  revenue: number;
  yield: number;
  dwellTime: string;
  forecast: StatusKind;
  source: SourceKind;
}

export interface ContractMetric {
  id: string;
  airport: AirportCode;
  vendor: string;
  contractType: string;
  value: number;
  status: StatusKind;
  renewalDate: string;
  slaScore: number;
  risk: string;
  source: SourceKind;
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

export interface DomainRisk {
  domain: Domain;
  airport: AirportCode;
  score: number;
  status: StatusKind;
  driver: string;
  action: string;
  source: SourceKind;
}

export interface TrendPoint {
  label: string;
  phlRevenue: number;
  pneRevenue: number;
  revenueAtRisk: number;
  groundSla: number;
  contractRisk: number;
}

export interface DelayContributor {
  label: string;
  airport: AirportOnlyCode;
  minutes: number;
  events: number;
  source: SourceKind;
}

export interface StaffingMetric {
  area: string;
  airport: AirportOnlyCode;
  planned: number;
  actual: number;
  status: StatusKind;
}

export interface ProcurementStage {
  stage: string;
  count: number;
  value: number;
}
