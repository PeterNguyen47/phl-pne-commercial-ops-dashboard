import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  Fuel,
  Gauge,
  Landmark,
  ListChecks,
  MapPin,
  Plane,
  Radar,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  airportMatches,
  airportProfiles,
  contractMetrics,
  decisionItems,
  delayContributors,
  domainRisks,
  executiveKpis,
  operationalEvents,
  parkingLots,
  procurementStages,
  severityRank,
  sourceReferences,
  staffingMetrics,
  trendData,
} from "./data/dashboardData";
import type {
  AirportCode,
  ContractMetric,
  DecisionItem,
  DomainRisk,
  KpiMetric,
  OperationalEvent,
  ParkingLotMetric,
  PeriodKey,
  SourceKind,
  StatusKind,
} from "./types/dashboard";

type ViewKey = "cockpit" | "ground" | "parking" | "contracts";
type SeverityFilter = "all" | StatusKind;

const airportOptions: Array<{ label: string; value: AirportCode; icon: LucideIcon }> = [
  { label: "PHL + PNE", value: "ALL", icon: Building2 },
  { label: "PHL", value: "PHL", icon: Plane },
  { label: "PNE", value: "PNE", icon: Fuel },
];

const periodOptions: Array<{ label: string; value: PeriodKey }> = [
  { label: "Today", value: "today" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
];

const severityOptions: Array<{ label: string; value: SeverityFilter; icon: LucideIcon }> = [
  { label: "All", value: "all", icon: Filter },
  { label: "Critical", value: "critical", icon: ShieldAlert },
  { label: "Watch", value: "warning", icon: AlertTriangle },
];

const viewTabs: Array<{ label: string; value: ViewKey; icon: LucideIcon }> = [
  { label: "Executive Cockpit", value: "cockpit", icon: Gauge },
  { label: "Ground Operations", value: "ground", icon: Radar },
  { label: "Parking & Commercial", value: "parking", icon: Car },
  { label: "Contracts & Actions", value: "contracts", icon: Briefcase },
];

const statusText: Record<StatusKind, string> = {
  normal: "On track",
  warning: "Watch",
  critical: "Action",
};

const statusColors: Record<StatusKind, string> = {
  normal: "#25805a",
  warning: "#b76500",
  critical: "#b42318",
};

function formatCurrency(value: number) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }

  return `$${Math.round(value / 1000)}K`;
}

function sourceClass(source: SourceKind) {
  return source.toLowerCase().replace(/\s+/g, "-");
}

function SourceBadge({ source }: { source: SourceKind }) {
  return <span className={`source-badge ${sourceClass(source)}`}>{source}</span>;
}

function StatusPill({ status }: { status: StatusKind }) {
  const Icon = status === "critical" ? ShieldAlert : status === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <span className={`status-pill ${status}`}>
      <Icon aria-hidden="true" size={14} />
      {statusText[status]}
    </span>
  );
}

function TrendMark({ metric }: { metric: KpiMetric }) {
  if (metric.trend === "up") {
    return (
      <span className="trend up">
        <ArrowUpRight aria-hidden="true" size={15} />
        {metric.delta}
      </span>
    );
  }

  if (metric.trend === "down") {
    return (
      <span className="trend down">
        <ArrowDownRight aria-hidden="true" size={15} />
        {metric.delta}
      </span>
    );
  }

  return <span className="trend flat">{metric.delta}</span>;
}

function filterByAirport<T extends { airport: AirportCode }>(items: T[], selectedAirport: AirportCode) {
  return items.filter((item) => airportMatches(item.airport, selectedAirport));
}

function filterEvents(items: OperationalEvent[], selectedAirport: AirportCode, severity: SeverityFilter) {
  return items
    .filter((item) => selectedAirport === "ALL" || item.airport === selectedAirport)
    .filter((item) => severity === "all" || item.severity === severity)
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

function filterParking(items: ParkingLotMetric[], selectedAirport: AirportCode) {
  return items.filter((item) => selectedAirport === "ALL" || item.airport === selectedAirport);
}

function filterDecisions(items: DecisionItem[], selectedAirport: AirportCode, severity: SeverityFilter) {
  return filterByAirport(items, selectedAirport)
    .filter((item) => severity === "all" || item.severity === severity)
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

function filterContracts(items: ContractMetric[], selectedAirport: AirportCode, severity: SeverityFilter) {
  return filterByAirport(items, selectedAirport)
    .filter((item) => severity === "all" || item.status === severity)
    .sort((a, b) => severityRank[a.status] - severityRank[b.status]);
}

function getChartData(period: PeriodKey, selectedAirport: AirportCode) {
  return trendData[period].map((point) => {
    const commercialRevenue =
      selectedAirport === "PHL"
        ? point.phlRevenue
        : selectedAirport === "PNE"
          ? point.pneRevenue
          : point.phlRevenue + point.pneRevenue;
    const revenueAtRisk =
      selectedAirport === "PHL"
        ? Math.round(point.revenueAtRisk * 0.86)
        : selectedAirport === "PNE"
          ? Math.round(point.revenueAtRisk * 0.14)
          : point.revenueAtRisk;

    return {
      ...point,
      commercialRevenue,
      revenueAtRisk,
    };
  });
}

function getParkingSummary(lots: ParkingLotMetric[]) {
  const capacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
  const occupied = lots.reduce((sum, lot) => sum + lot.occupied, 0);
  const revenue = lots.reduce((sum, lot) => sum + lot.revenue, 0);
  const utilization = capacity === 0 ? 0 : Math.round((occupied / capacity) * 100);

  return { capacity, occupied, revenue, utilization };
}

function App() {
  const [selectedView, setSelectedView] = useState<ViewKey>("cockpit");
  const [selectedAirport, setSelectedAirport] = useState<AirportCode>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const isCompact = useCompactViewport();

  const scopedKpis = useMemo(
    () => filterByAirport(executiveKpis[selectedPeriod], selectedAirport),
    [selectedAirport, selectedPeriod],
  );
  const scopedRisks = useMemo(
    () => filterByAirport(domainRisks, selectedAirport).sort((a, b) => a.score - b.score),
    [selectedAirport],
  );
  const scopedEvents = useMemo(
    () => filterEvents(operationalEvents, selectedAirport, severityFilter),
    [selectedAirport, severityFilter],
  );
  const scopedParking = useMemo(
    () =>
      filterParking(parkingLots, selectedAirport).filter(
        (lot) => severityFilter === "all" || lot.forecast === severityFilter,
      ),
    [selectedAirport, severityFilter],
  );
  const scopedContracts = useMemo(
    () => filterContracts(contractMetrics, selectedAirport, severityFilter),
    [selectedAirport, severityFilter],
  );
  const scopedDecisions = useMemo(
    () => filterDecisions(decisionItems, selectedAirport, severityFilter),
    [selectedAirport, severityFilter],
  );
  const chartData = useMemo(() => getChartData(selectedPeriod, selectedAirport), [selectedAirport, selectedPeriod]);
  const parkingSummary = useMemo(() => getParkingSummary(scopedParking), [scopedParking]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Plane size={22} />
          </div>
          <div>
            <p className="eyebrow">Philadelphia Department of Aviation</p>
            <h1>Commercial Operations Executive Dashboard</h1>
          </div>
        </div>

        <div className="toolbar" aria-label="Dashboard filters">
          <SegmentedControl
            label="Airport"
            options={airportOptions}
            value={selectedAirport}
            onChange={setSelectedAirport}
          />
          <div className="segmented compact" aria-label="Period">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={selectedPeriod === option.value ? "active" : ""}
                onClick={() => setSelectedPeriod(option.value)}
              >
                <CalendarDays aria-hidden="true" size={15} />
                {option.label}
              </button>
            ))}
          </div>
          <SegmentedControl
            label="Severity"
            options={severityOptions}
            value={severityFilter}
            onChange={setSeverityFilter}
          />
        </div>
      </header>

      <section className="airport-context" aria-label="Airport profiles">
        {airportProfiles
          .filter((profile) => selectedAirport === "ALL" || profile.code === selectedAirport)
          .map((profile) => (
            <article className="profile-card" key={profile.code}>
              <div className="profile-heading">
                <span className="airport-code">{profile.code}</span>
                <div>
                  <h2>{profile.name}</h2>
                  <p>{profile.role}</p>
                </div>
              </div>
              <p className="profile-focus">{profile.focus}</p>
              <div className="fact-row">
                {profile.publicFacts.slice(0, 2).map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
              </div>
              <SourceBadge source={profile.source} />
            </article>
          ))}
      </section>

      <nav className="view-tabs" aria-label="Dashboard views">
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              className={selectedView === tab.value ? "active" : ""}
              onClick={() => setSelectedView(tab.value)}
            >
              <Icon aria-hidden="true" size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main>
        {selectedView === "cockpit" && (
          <ExecutiveCockpit
            kpis={scopedKpis}
            risks={scopedRisks}
            events={scopedEvents}
            decisions={scopedDecisions}
            chartData={chartData}
            parkingSummary={parkingSummary}
            isCompact={isCompact}
          />
        )}
        {selectedView === "ground" && (
          <GroundOperations
            selectedAirport={selectedAirport}
            events={scopedEvents}
            chartData={chartData}
            severityFilter={severityFilter}
            isCompact={isCompact}
          />
        )}
        {selectedView === "parking" && (
          <ParkingCommercial
            lots={scopedParking}
            chartData={chartData}
            decisions={scopedDecisions}
            isCompact={isCompact}
          />
        )}
        {selectedView === "contracts" && (
          <ContractsActions contracts={scopedContracts} decisions={scopedDecisions} isCompact={isCompact} />
        )}
      </main>

      <footer className="source-library">
        <div>
          <p className="eyebrow">Data Provenance</p>
          <h2>Public anchors and sample internal operating data</h2>
        </div>
        <div className="source-links">
          {sourceReferences.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              <FileText aria-hidden="true" size={15} />
              {source.label}
              <ExternalLink aria-hidden="true" size={13} />
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

function useCompactViewport() {
  const [isCompact, setIsCompact] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 820px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 820px)");
    const handleChange = () => setIsCompact(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isCompact;
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: T; icon: LucideIcon }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" aria-label={label}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            title={option.label}
            className={value === option.value ? "active" : ""}
            onClick={() => onChange(option.value)}
          >
            <Icon aria-hidden="true" size={15} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ExecutiveCockpit({
  kpis,
  risks,
  events,
  decisions,
  chartData,
  parkingSummary,
  isCompact,
}: {
  kpis: KpiMetric[];
  risks: DomainRisk[];
  events: OperationalEvent[];
  decisions: DecisionItem[];
  chartData: Array<{ label: string; commercialRevenue: number; revenueAtRisk: number; groundSla: number; contractRisk: number }>;
  parkingSummary: { capacity: number; occupied: number; revenue: number; utilization: number };
  isCompact: boolean;
}) {
  return (
    <div className="view-stack">
      <section className="metric-grid">
        {kpis.map((metric) => (
          <article className={`metric-card ${metric.status}`} key={metric.id}>
            <div className="metric-topline">
              <SourceBadge source={metric.source} />
              <StatusPill status={metric.status} />
            </div>
            <h2>{metric.label}</h2>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-target">Target {metric.target}</div>
            <TrendMark metric={metric} />
          </article>
        ))}
      </section>

      <section className="dashboard-grid two-one">
        <article className="panel">
          <PanelHeading
            icon={TrendingUp}
            title="Commercial Exposure"
            meta={`${formatCurrency(parkingSummary.revenue)} scoped parking and aviation asset revenue`}
          />
          <div className="chart-frame tall">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 32, bottom: 16, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={isCompact ? 1 : 0}
                  tickMargin={8}
                  height={32}
                />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(value: number) => `$${value}K`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="commercialRevenue"
                  name="Commercial revenue"
                  fill="#dce8f7"
                  stroke="#275d92"
                  strokeWidth={2}
                />
                <Bar dataKey="revenueAtRisk" name="Revenue at risk" fill="#b42318" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={Target} title="Domain Risk" meta="Lowest score receives executive attention first" />
          <div className="risk-list">
            {risks.map((risk) => (
              <div className="risk-row" key={`${risk.airport}-${risk.domain}`}>
                <div className="risk-score" style={{ color: statusColors[risk.status] }}>
                  {risk.score}
                </div>
                <div>
                  <div className="row-title">
                    {risk.domain} <span>{risk.airport}</span>
                  </div>
                  <p>{risk.driver}</p>
                  <strong>{risk.action}</strong>
                </div>
                <SourceBadge source={risk.source} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid equal">
        <ExecutiveExceptions events={events} />
        <DecisionWorklist decisions={decisions} />
      </section>
    </div>
  );
}

function GroundOperations({
  selectedAirport,
  events,
  chartData,
  severityFilter,
  isCompact,
}: {
  selectedAirport: AirportCode;
  events: OperationalEvent[];
  chartData: Array<{ label: string; groundSla: number }>;
  severityFilter: SeverityFilter;
  isCompact: boolean;
}) {
  const scopedDelay = delayContributors.filter((item) => selectedAirport === "ALL" || item.airport === selectedAirport);
  const scopedStaffing = staffingMetrics.filter((item) => selectedAirport === "ALL" || item.airport === selectedAirport);

  return (
    <div className="view-stack">
      <section className="dashboard-grid equal">
        <article className="panel">
          <PanelHeading icon={Activity} title="Ground Ops SLA" meta="Turn, ramp, baggage, and airfield service performance" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 32, bottom: 16, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={isCompact ? 1 : 0}
                  tickMargin={8}
                  height={32}
                />
                <YAxis domain={[80, 100]} tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Area
                  type="monotone"
                  dataKey="groundSla"
                  name="SLA compliance"
                  stroke="#25805a"
                  fill="#d9eee5"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={Clock3} title="Delay Contributors" meta="Minutes and event count by operating driver" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopedDelay} layout="vertical" margin={{ top: 6, right: 24, bottom: 0, left: 58 }}>
                <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={130} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="minutes" name="Minutes" fill="#275d92" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="dashboard-grid two-one">
        <article className="panel">
          <PanelHeading icon={Users} title="Staffing Coverage" meta="Planned vs actual coverage by operating group" />
          <div className="staffing-list">
            {scopedStaffing.map((item) => {
              const coverage = Math.round((item.actual / item.planned) * 100);
              return (
                <div className="staff-row" key={item.area}>
                  <div>
                    <div className="row-title">
                      {item.area} <span>{item.airport}</span>
                    </div>
                    <p>
                      {item.actual} of {item.planned} planned positions
                    </p>
                  </div>
                  <div className="coverage">
                    <span>{coverage}%</span>
                    <div className="progress-track">
                      <div className={item.status} style={{ width: `${coverage}%` }} />
                    </div>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={AlertTriangle} title="Operational Alerts" meta={`${severityFilter === "all" ? "All" : statusText[severityFilter]} severity`} />
          <AlertList events={events} />
        </article>
      </section>
    </div>
  );
}

function ParkingCommercial({
  lots,
  chartData,
  decisions,
  isCompact,
}: {
  lots: ParkingLotMetric[];
  chartData: Array<{ label: string; commercialRevenue: number; revenueAtRisk: number }>;
  decisions: DecisionItem[];
  isCompact: boolean;
}) {
  const summary = getParkingSummary(lots);
  const pieData = lots.map((lot) => ({
    name: lot.lot,
    value: lot.occupied,
    status: lot.forecast,
  }));
  const commercialDecisions = decisions.filter((item) => item.domain === "Parking & Commercial");

  return (
    <div className="view-stack">
      <section className="summary-strip">
        <SummaryTile icon={Car} label="Scoped capacity" value={summary.capacity.toLocaleString()} source="Sample Internal" />
        <SummaryTile icon={Gauge} label="Utilization" value={`${summary.utilization}%`} source="Derived" />
        <SummaryTile icon={Landmark} label="Revenue" value={formatCurrency(summary.revenue)} source="Sample Internal" />
        <SummaryTile icon={AlertTriangle} label="Commercial decisions" value={String(commercialDecisions.length)} source="Derived" />
      </section>

      <section className="dashboard-grid equal">
        <article className="panel">
          <PanelHeading icon={TrendingUp} title="Revenue Yield" meta="Scoped parking, hangar, apron, and aviation asset revenue" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 32, bottom: 16, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={isCompact ? 1 : 0}
                  tickMargin={8}
                  height={32}
                />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(value: number) => `$${value}K`} />
                <Area
                  type="monotone"
                  dataKey="commercialRevenue"
                  name="Commercial revenue"
                  stroke="#275d92"
                  fill="#dce8f7"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="revenueAtRisk"
                  name="Revenue at risk"
                  stroke="#b42318"
                  fill="#f4d6d2"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={BarChart3} title="Occupancy Mix" meta="Occupied inventory by product" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={statusColors[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="lot-grid">
        {lots.map((lot) => {
          const utilization = Math.round((lot.occupied / lot.capacity) * 100);
          return (
            <article className={`lot-card ${lot.forecast}`} key={lot.id}>
              <div className="metric-topline">
                <span className="airport-code small">{lot.airport}</span>
                <StatusPill status={lot.forecast} />
              </div>
              <h2>{lot.lot}</h2>
              <p>{lot.product}</p>
              <div className="lot-stat">
                <strong>{utilization}%</strong>
                <span>
                  {lot.occupied.toLocaleString()} / {lot.capacity.toLocaleString()}
                </span>
              </div>
              <div className="progress-track">
                <div className={lot.forecast} style={{ width: `${Math.min(utilization, 100)}%` }} />
              </div>
              <dl>
                <div>
                  <dt>Revenue</dt>
                  <dd>{formatCurrency(lot.revenue)}</dd>
                </div>
                <div>
                  <dt>Yield</dt>
                  <dd>${lot.yield.toFixed(lot.yield > 1000 ? 0 : 1)}</dd>
                </div>
                <div>
                  <dt>Dwell</dt>
                  <dd>{lot.dwellTime}</dd>
                </div>
              </dl>
              <SourceBadge source={lot.source} />
            </article>
          );
        })}
      </section>

      {commercialDecisions.length > 0 && (
        <section className="panel">
          <PanelHeading icon={ListChecks} title="Revenue Leakage Actions" meta="Parking and commercial actions ranked by urgency" />
          <DecisionRows decisions={commercialDecisions} />
        </section>
      )}
    </div>
  );
}

function ContractsActions({
  contracts,
  decisions,
  isCompact,
}: {
  contracts: ContractMetric[];
  decisions: DecisionItem[];
  isCompact: boolean;
}) {
  const contractDecisions = decisions.filter((item) => item.domain === "Contracts");

  return (
    <div className="view-stack">
      <section className="dashboard-grid two-one">
        <article className="panel">
          <PanelHeading icon={Briefcase} title="Vendor Health" meta="Renewal urgency, SLA score, and exposure" />
          <div className="contract-table" role="table" aria-label="Contract risk table">
            <div className="contract-header" role="row">
              <span>Vendor</span>
              <span>Value</span>
              <span>SLA</span>
              <span>Status</span>
            </div>
            {contracts.map((contract) => (
              <div className="contract-row" role="row" key={contract.id}>
                <div>
                  <div className="row-title">
                    {contract.vendor} <span>{contract.airport}</span>
                  </div>
                  <p>{contract.contractType}</p>
                  <small>Renewal {contract.renewalDate}</small>
                </div>
                <strong>{formatCurrency(contract.value)}</strong>
                <div className="sla-cell">
                  <span>{contract.slaScore}%</span>
                  <div className="progress-track">
                    <div className={contract.status} style={{ width: `${contract.slaScore}%` }} />
                  </div>
                </div>
                <StatusPill status={contract.status} />
                <p className="contract-risk">{contract.risk}</p>
                <SourceBadge source={contract.source} />
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={Wrench} title="Procurement Pipeline" meta="Open value by stage" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={procurementStages} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  interval={isCompact ? 1 : 0}
                  angle={isCompact ? 0 : -24}
                  textAnchor={isCompact ? "middle" : "end"}
                  height={isCompact ? 44 : 70}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number, name) => (name === "value" ? formatCurrency(value) : value)} />
                <Bar dataKey="value" name="Value" fill="#275d92" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="panel">
        <PanelHeading icon={ListChecks} title="Contract Decision Queue" meta="Executive approvals and owner accountability" />
        <DecisionRows decisions={contractDecisions.length > 0 ? contractDecisions : decisions} />
      </section>
    </div>
  );
}

function ExecutiveExceptions({ events }: { events: OperationalEvent[] }) {
  return (
    <article className="panel">
      <PanelHeading icon={AlertTriangle} title="Today&apos;s Exceptions" meta={`${events.length} visible items`} />
      <AlertList events={events} />
    </article>
  );
}

function AlertList({ events }: { events: OperationalEvent[] }) {
  if (events.length === 0) {
    return <div className="empty-state">No matching exceptions for the current filters.</div>;
  }

  return (
    <div className="alert-list">
      {events.map((event) => (
        <div className="alert-row" key={event.id}>
          <div className={`severity-rail ${event.severity}`} />
          <div>
            <div className="row-title">
              {event.location} <span>{event.airport}</span>
            </div>
            <p>{event.impact}</p>
            <div className="row-meta">
              <span>
                <Clock3 aria-hidden="true" size={14} />
                {event.timestamp}
              </span>
              <span>
                <Users aria-hidden="true" size={14} />
                {event.owner}
              </span>
              <SourceBadge source={event.source} />
            </div>
          </div>
          <StatusPill status={event.severity} />
        </div>
      ))}
    </div>
  );
}

function DecisionWorklist({ decisions }: { decisions: DecisionItem[] }) {
  return (
    <article className="panel">
      <PanelHeading icon={ListChecks} title="Decision Worklist" meta={`${decisions.length} scoped actions`} />
      <DecisionRows decisions={decisions} />
    </article>
  );
}

function DecisionRows({ decisions }: { decisions: DecisionItem[] }) {
  if (decisions.length === 0) {
    return <div className="empty-state">No matching decisions for the current filters.</div>;
  }

  return (
    <div className="decision-list">
      {decisions.map((decision) => (
        <div className="decision-row" key={decision.id}>
          <div className={`severity-rail ${decision.severity}`} />
          <div>
            <div className="row-title">
              {decision.title} <span>{decision.airport}</span>
            </div>
            <p>{decision.recommendation}</p>
            <div className="row-meta">
              <span>
                <Briefcase aria-hidden="true" size={14} />
                {decision.domain}
              </span>
              <span>
                <Users aria-hidden="true" size={14} />
                {decision.owner}
              </span>
              <span>
                <CalendarDays aria-hidden="true" size={14} />
                {decision.dueDate}
              </span>
              <SourceBadge source={decision.source} />
            </div>
          </div>
          <div className="decision-impact">
            <strong>{decision.impact}</strong>
            <span>{decision.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelHeading({ icon: Icon, title, meta }: { icon: LucideIcon; title: string; meta: string }) {
  return (
    <div className="panel-heading">
      <div className="panel-title">
        <Icon aria-hidden="true" size={18} />
        <h2>{title}</h2>
      </div>
      <p>{meta}</p>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  source,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  source: SourceKind;
}) {
  return (
    <article className="summary-tile">
      <Icon aria-hidden="true" size={20} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <SourceBadge source={source} />
    </article>
  );
}

export default App;
