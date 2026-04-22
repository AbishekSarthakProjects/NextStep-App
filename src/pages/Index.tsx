import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/animations/PageTransition";
import {
  opportunities,
  Opportunity,
  OpportunityCategory,
  OpportunityStatus,
  OpportunityType,
  verifiedDate,
} from "@/data/opportunities";

type DashboardTab =
  | "All"
  | "Internships"
  | "Scholarships"
  | "Competitions"
  | "Volunteer"
  | "Summer"
  | "Research"
  | "Resources";

const tabs: Array<{
  label: DashboardTab;
  helper: string;
  types?: OpportunityType[];
}> = [
  { label: "All", helper: "Full board" },
  { label: "Internships", helper: "Work roles", types: ["Internship"] },
  { label: "Scholarships", helper: "Funding", types: ["Scholarship"] },
  { label: "Competitions", helper: "Build + submit", types: ["Competition"] },
  { label: "Volunteer", helper: "Service", types: ["Volunteer"] },
  { label: "Summer", helper: "Programs", types: ["Summer Program"] },
  { label: "Research", helper: "Labs + papers", types: ["Research"] },
  { label: "Resources", helper: "Search tools", types: ["Resource"] },
];

const categoryOptions = [
  "All categories",
  "STEM",
  "Coding",
  "Business",
  "Leadership",
  "Community Service",
  "Arts",
  "Health",
  "College Prep",
  "Language",
  "Research",
  "Environment",
] as const;

const locationOptions = [
  "All locations",
  "Remote",
  "Atlanta",
  "Georgia",
  "National",
  "United States",
] as const;

const statusOptions = [
  "Any status",
  "Open",
  "Opens Soon",
  "Rolling",
  "Annual",
  "Closed",
] as const;

type CategoryFilter = (typeof categoryOptions)[number];
type LocationFilter = (typeof locationOptions)[number];
type StatusFilter = (typeof statusOptions)[number];

const today = new Date();
today.setHours(0, 0, 0, 0);

const parseDeadline = (deadline?: string) => {
  if (!deadline) return null;
  const [year, month, day] = deadline.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDeadline = (deadline?: string) => {
  const date = parseDeadline(deadline);

  if (!date) return "Varies";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const daysUntil = (deadline?: string) => {
  const date = parseDeadline(deadline);

  if (!date) return null;

  const milliseconds = date.getTime() - today.getTime();
  return Math.ceil(milliseconds / 86_400_000);
};

const getSearchText = (opportunity: Opportunity) =>
  [
    opportunity.title,
    opportunity.organization,
    opportunity.description,
    opportunity.longDescription,
    opportunity.location,
    opportunity.deadlineText,
    opportunity.status,
    opportunity.type,
    opportunity.audience,
    opportunity.cost,
    opportunity.sourceLabel,
    ...opportunity.categories,
    ...opportunity.goodFor,
  ]
    .join(" ")
    .toLowerCase();

const matchesLocation = (
  opportunity: Opportunity,
  selectedLocation: LocationFilter,
) => {
  if (selectedLocation === "All locations") return true;

  const location = opportunity.location.toLowerCase();

  if (selectedLocation === "Remote") return location.includes("remote");
  if (selectedLocation === "Atlanta") return location.includes("atlanta");
  if (selectedLocation === "Georgia") {
    return location.includes("ga") || location.includes("georgia");
  }
  if (selectedLocation === "National") return location.includes("national");

  return location.includes("united states");
};

const getStatusClass = (status: OpportunityStatus) => {
  if (status === "Open") return "bg-[#2f8f83] text-white";
  if (status === "Opens Soon") return "bg-[#f0c84b] text-[#151515]";
  if (status === "Rolling") return "bg-[#d9eee7] text-[#151515]";
  if (status === "Annual") return "bg-[#fbfcf6] text-[#151515]";
  return "bg-[#e7e2d8] text-[#5b5b55]";
};

const getDeadlineSignal = (opportunity: Opportunity) => {
  const remainingDays = daysUntil(opportunity.deadlineDate);

  if (opportunity.status === "Closed") return "Closed";
  if (remainingDays === null) return opportunity.status;
  if (remainingDays < 0) return "Past date";
  if (remainingDays === 0) return "Due today";
  if (remainingDays === 1) return "1 day";
  return `${remainingDays} days`;
};

const isActionable = (status: OpportunityStatus) =>
  status === "Open" || status === "Opens Soon" || status === "Rolling";

const StatTile = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="border-4 border-[#151515] bg-[#fbfcf6] p-4">
    <p className="font-mono text-[11px] font-bold uppercase text-[#5b5b55]">
      {label}
    </p>
    <p className="mt-4 text-4xl font-black leading-none text-[#151515]">
      {value}
    </p>
    <p className="mt-3 text-xs leading-relaxed text-[#3d3d38]">{helper}</p>
  </div>
);

const TabButton = ({
  label,
  helper,
  count,
  isActive,
  onClick,
}: {
  label: DashboardTab;
  helper: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    className={`min-w-[150px] border-r-4 border-[#151515] px-4 py-3 text-left transition active:translate-y-[1px] ${
      isActive ? "bg-[#151515] text-[#fbfcf6]" : "bg-[#fbfcf6] hover:bg-[#d9eee7]"
    }`}
  >
    <span className="block font-mono text-xs font-black uppercase">
      {label}
    </span>
    <span
      className={`mt-1 block text-[11px] leading-relaxed ${
        isActive ? "text-[#e7e2d8]" : "text-[#5b5b55]"
      }`}
    >
      {helper} / {count}
    </span>
  </button>
);

const SelectFilter = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) => (
  <label className="grid gap-2">
    <span className="font-mono text-[11px] font-bold uppercase text-[#5b5b55]">
      {label}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border-4 border-[#151515] bg-[#fbfcf6] px-3 py-3 text-sm font-bold text-[#151515] outline-none transition focus:ring-2 focus:ring-[#c94335]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const OpportunityRow = ({
  opportunity,
  isSelected,
  onSelect,
}: {
  opportunity: Opportunity;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(opportunity.id)}
    className={`group grid w-full grid-cols-1 text-left transition active:translate-y-[1px] lg:grid-cols-[164px_minmax(0,1fr)_136px] ${
      isSelected ? "bg-white" : "bg-[#fbfcf6] hover:bg-[#d9eee7]"
    }`}
  >
    <div className="relative min-h-36 overflow-hidden border-b-4 border-[#151515] lg:border-b-0 lg:border-r-4">
      <img
        src={opportunity.image}
        alt={`${opportunity.title} listing`}
        className="h-full min-h-36 w-full object-cover grayscale transition duration-500 group-hover:grayscale-0 group-hover:scale-105"
        loading="lazy"
      />
    </div>

    <div className="min-w-0 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="border-2 border-[#151515] px-2 py-1 font-mono text-[10px] font-black uppercase text-[#151515]">
          {opportunity.type}
        </span>
        <span
          className={`border-2 border-[#151515] px-2 py-1 font-mono text-[10px] font-black uppercase ${getStatusClass(
            opportunity.status,
          )}`}
        >
          {opportunity.status}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase text-[#5b5b55]">
          {opportunity.location}
        </span>
      </div>

      <h2 className="mt-4 text-2xl font-black leading-none text-[#151515]">
        {opportunity.title}
      </h2>
      <p className="mt-2 font-mono text-[11px] font-bold uppercase text-[#5b5b55]">
        {opportunity.organization}
      </p>
      <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-[#3d3d38]">
        {opportunity.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {opportunity.categories.slice(0, 4).map((category) => (
          <span
            key={category}
            className="border-2 border-[#bfc6bb] px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#5b5b55]"
          >
            {category}
          </span>
        ))}
      </div>
    </div>

    <div className="flex items-center justify-between gap-3 border-t-4 border-[#151515] p-4 lg:block lg:border-l-4 lg:border-t-0">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase text-[#5b5b55]">
          Deadline
        </p>
        <p className="mt-2 text-xl font-black leading-none text-[#151515]">
          {getDeadlineSignal(opportunity)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#3d3d38]">
          {formatDeadline(opportunity.deadlineDate)}
        </p>
      </div>
      <span className="border-2 border-[#151515] px-2 py-1 font-mono text-[10px] font-black uppercase text-[#151515] lg:mt-5 lg:inline-block">
        Source
      </span>
    </div>
  </button>
);

const DetailPanel = ({ opportunity }: { opportunity?: Opportunity }) => {
  if (!opportunity) {
    return (
      <aside className="border-4 border-[#151515] bg-[#fbfcf6] p-6">
        <p className="font-mono text-xs font-black uppercase text-[#5b5b55]">
          Nothing selected
        </p>
        <h2 className="mt-4 text-3xl font-black leading-none text-[#151515]">
          Widen the dashboard.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[#3d3d38]">
          Change tabs, remove a filter, or search a broader keyword to bring
          real opportunities back into view.
        </p>
      </aside>
    );
  }

  return (
    <aside className="border-4 border-[#151515] bg-[#fbfcf6]">
      <div className="border-b-4 border-[#151515]">
        <img
          src={opportunity.image}
          alt={`${opportunity.title} detail`}
          className="h-52 w-full object-cover grayscale"
          loading="lazy"
        />
      </div>

      <div className="space-y-6 p-5">
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`border-2 border-[#151515] px-2 py-1 font-mono text-[10px] font-black uppercase ${getStatusClass(
                opportunity.status,
              )}`}
            >
              {opportunity.status}
            </span>
            <span className="border-2 border-[#151515] px-2 py-1 font-mono text-[10px] font-black uppercase">
              {opportunity.type}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black leading-none text-[#151515]">
            {opportunity.title}
          </h2>
          <p className="mt-2 font-mono text-[11px] font-bold uppercase text-[#5b5b55]">
            {opportunity.organization}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-[#151515] p-3">
            <p className="font-mono text-[10px] font-black uppercase text-[#5b5b55]">
              Deadline
            </p>
            <p className="mt-2 text-sm font-black text-[#151515]">
              {opportunity.deadlineText}
            </p>
          </div>
          <div className="border-2 border-[#151515] p-3">
            <p className="font-mono text-[10px] font-black uppercase text-[#5b5b55]">
              Cost
            </p>
            <p className="mt-2 text-sm font-black text-[#151515]">
              {opportunity.cost}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[#3d3d38]">
          {opportunity.longDescription}
        </p>

        <div>
          <h3 className="border-b-2 border-[#151515] pb-2 font-mono text-xs font-black uppercase text-[#151515]">
            Who it fits
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#3d3d38]">
            {opportunity.audience}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="border-b-2 border-[#151515] pb-2 font-mono text-xs font-black uppercase text-[#151515]">
            Eligibility
          </h3>
          <ul className="space-y-2">
            {opportunity.eligibility.map((item) => (
              <li
                key={item}
                className="border-l-4 border-[#2f8f83] pl-3 text-sm leading-relaxed text-[#3d3d38]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="border-b-2 border-[#151515] pb-2 font-mono text-xs font-black uppercase text-[#151515]">
            What to prepare
          </h3>
          <ul className="space-y-2">
            {opportunity.requirements.map((item) => (
              <li
                key={item}
                className="border-l-4 border-[#c94335] pl-3 text-sm leading-relaxed text-[#3d3d38]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-4 border-[#151515] bg-[#d9eee7] p-4">
          <h3 className="font-mono text-xs font-black uppercase text-[#151515]">
            Why this matters
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#151515]">
            {opportunity.whyItMatters}
          </p>
        </div>

        <div>
          <h3 className="font-mono text-xs font-black uppercase text-[#151515]">
            Good for
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {opportunity.goodFor.map((interest) => (
              <span
                key={interest}
                className="border-2 border-[#151515] px-2 py-1 font-mono text-[10px] font-black uppercase text-[#151515]"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t-4 border-[#151515] pt-4">
          <p className="font-mono text-[10px] font-black uppercase text-[#5b5b55]">
            Verified from: {opportunity.sourceLabel}
          </p>
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block border-4 border-[#151515] bg-[#151515] px-5 py-4 text-center font-mono text-xs font-black uppercase text-[#fbfcf6] transition hover:bg-[#c94335] active:translate-y-[1px]"
          >
            Open official source
          </a>
        </div>
      </div>
    </aside>
  );
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("All");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All categories");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationFilter>("All locations");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("Any status");
  const [selectedId, setSelectedId] = useState(opportunities[0].id);

  const activeTabConfig = tabs.find((tab) => tab.label === activeTab) ?? tabs[0];

  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return opportunities
      .filter((opportunity) => {
        const matchesTab =
          !activeTabConfig.types ||
          activeTabConfig.types.includes(opportunity.type);
        const matchesSearch =
          normalizedQuery.length === 0 ||
          getSearchText(opportunity).includes(normalizedQuery);
        const matchesCategory =
          selectedCategory === "All categories" ||
          opportunity.categories.includes(
            selectedCategory as OpportunityCategory,
          );
        const matchesStatus =
          selectedStatus === "Any status" ||
          opportunity.status === (selectedStatus as OpportunityStatus);

        return (
          matchesTab &&
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesLocation(opportunity, selectedLocation)
        );
      })
      .sort((first, second) => {
        const firstDate = parseDeadline(first.deadlineDate);
        const secondDate = parseDeadline(second.deadlineDate);

        if (!firstDate && !secondDate) return first.title.localeCompare(second.title);
        if (!firstDate) return 1;
        if (!secondDate) return -1;

        return firstDate.getTime() - secondDate.getTime();
      });
  }, [
    activeTabConfig.types,
    query,
    selectedCategory,
    selectedLocation,
    selectedStatus,
  ]);

  const selectedOpportunity =
    filteredOpportunities.find((opportunity) => opportunity.id === selectedId) ??
    filteredOpportunities[0];

  const upcomingOpportunities = opportunities
    .filter((opportunity) => {
      const remaining = daysUntil(opportunity.deadlineDate);
      return remaining !== null && remaining >= 0 && isActionable(opportunity.status);
    })
    .sort((first, second) => {
      const firstRemaining = daysUntil(first.deadlineDate) ?? Number.MAX_SAFE_INTEGER;
      const secondRemaining = daysUntil(second.deadlineDate) ?? Number.MAX_SAFE_INTEGER;
      return firstRemaining - secondRemaining;
    })
    .slice(0, 3);

  const actionableCount = opportunities.filter((opportunity) =>
    isActionable(opportunity.status),
  ).length;
  const dueSoonCount = opportunities.filter((opportunity) => {
    const remaining = daysUntil(opportunity.deadlineDate);
    return remaining !== null && remaining >= 0 && remaining <= 45;
  }).length;
  const remoteCount = opportunities.filter((opportunity) =>
    opportunity.location.toLowerCase().includes("remote"),
  ).length;

  const tabCounts = tabs.reduce<Record<DashboardTab, number>>((counts, tab) => {
    counts[tab.label] = tab.types
      ? opportunities.filter((opportunity) => tab.types?.includes(opportunity.type))
          .length
      : opportunities.length;
    return counts;
  }, {} as Record<DashboardTab, number>);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("All categories");
    setSelectedLocation("All locations");
    setSelectedStatus("Any status");
    setActiveTab("All");
    setSelectedId(opportunities[0].id);
  };

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-[#f4f7ef] font-[Satoshi,Geist,ui-sans-serif,system-ui,sans-serif] text-[#151515]">
        <nav className="flex items-center justify-between border-b-4 border-[#151515] bg-[#f4f7ef] px-4 py-4 sm:px-6">
          <Link to="/" className="font-mono text-xl font-black text-[#151515]">
            NEXTSTEP*
          </Link>
          <div className="hidden gap-1 md:flex">
            <a
              href="#dashboard"
              className="border-2 border-[#151515] px-4 py-2 font-mono text-xs font-black uppercase text-[#151515] hover:bg-[#151515] hover:text-[#fbfcf6]"
            >
              Dashboard
            </a>
            <a
              href="#sources"
              className="border-2 border-[#151515] px-4 py-2 font-mono text-xs font-black uppercase text-[#151515] hover:bg-[#151515] hover:text-[#fbfcf6]"
            >
              Sources
            </a>
          </div>
        </nav>

        <main id="dashboard" className="mx-auto max-w-[1540px] p-4 sm:p-6">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <div className="border-4 border-[#151515] bg-[#fbfcf6] p-6 sm:p-8">
              <p className="font-mono text-xs font-black uppercase text-[#5b5b55]">
                Real opportunities / verified {verifiedDate}
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-none text-[#151515] sm:text-6xl lg:text-7xl">
                NextStep opportunity dashboard.
              </h1>
              <div className="mt-7 h-4 w-32 bg-[#c94335]" />
              <p className="mt-6 max-w-[70ch] text-base leading-relaxed text-[#3d3d38]">
                Search source-backed internships, scholarships, competitions,
                volunteer grants, summer programs, research options, and useful
                discovery tools without digging through random tabs.
              </p>
            </div>

            <div className="border-4 border-[#151515] bg-[#151515] p-5 text-[#fbfcf6]">
              <p className="font-mono text-xs font-black uppercase text-[#d9eee7]">
                Next deadlines
              </p>
              <div className="mt-5 space-y-4">
                {upcomingOpportunities.map((opportunity) => (
                  <button
                    key={opportunity.id}
                    type="button"
                    onClick={() => setSelectedId(opportunity.id)}
                    className="block w-full border-2 border-[#fbfcf6] p-3 text-left transition hover:bg-[#2f8f83] active:translate-y-[1px]"
                  >
                    <span className="font-mono text-[10px] font-black uppercase">
                      {getDeadlineSignal(opportunity)} /{" "}
                      {formatDeadline(opportunity.deadlineDate)}
                    </span>
                    <span className="mt-2 block text-xl font-black leading-none">
                      {opportunity.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Tracked"
              value={String(opportunities.length)}
              helper="Real entries with official source links."
            />
            <StatTile
              label="Actionable"
              value={String(actionableCount)}
              helper="Open, opening soon, or rolling resources."
            />
            <StatTile
              label="45-day radar"
              value={String(dueSoonCount)}
              helper="Upcoming dated deadlines from today."
            />
            <StatTile
              label="Remote"
              value={String(remoteCount)}
              helper="Programs or resources available online."
            />
          </section>

          <section className="mt-5 overflow-x-auto border-4 border-[#151515] bg-[#fbfcf6]">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.label}
                  label={tab.label}
                  helper={tab.helper}
                  count={tabCounts[tab.label]}
                  isActive={activeTab === tab.label}
                  onClick={() => setActiveTab(tab.label)}
                />
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-5 border-4 border-[#151515] bg-[#fbfcf6] p-4 lg:grid-cols-[minmax(260px,1.2fr)_repeat(3,minmax(160px,0.6fr))_auto]">
            <label className="grid gap-2">
              <span className="font-mono text-[11px] font-bold uppercase text-[#5b5b55]">
                Search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="NASA, coding, Atlanta, scholarship"
                className="w-full border-4 border-[#151515] bg-[#f4f7ef] px-4 py-3 text-sm font-bold text-[#151515] placeholder:text-[#7c7c73] outline-none transition focus:ring-2 focus:ring-[#c94335]"
              />
            </label>
            <SelectFilter
              label="Category"
              value={selectedCategory}
              options={categoryOptions}
              onChange={(value) => setSelectedCategory(value as CategoryFilter)}
            />
            <SelectFilter
              label="Location"
              value={selectedLocation}
              options={locationOptions}
              onChange={(value) => setSelectedLocation(value as LocationFilter)}
            />
            <SelectFilter
              label="Status"
              value={selectedStatus}
              options={statusOptions}
              onChange={(value) => setSelectedStatus(value as StatusFilter)}
            />
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full border-4 border-[#151515] bg-[#151515] px-5 py-3 font-mono text-xs font-black uppercase text-[#fbfcf6] transition hover:bg-[#c94335] active:translate-y-[1px]"
              >
                Reset
              </button>
            </div>
          </section>

          <section
            id="sources"
            className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"
          >
            <div className="border-4 border-[#151515] bg-[#fbfcf6]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-[#151515] bg-[#151515] px-4 py-3 text-[#fbfcf6]">
                <h2 className="font-mono text-xs font-black uppercase">
                  {activeTab} / {filteredOpportunities.length} results
                </h2>
                <p className="font-mono text-xs font-black uppercase">
                  Official links included
                </p>
              </div>

              {filteredOpportunities.length > 0 ? (
                <div className="divide-y-4 divide-[#151515]">
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityRow
                      key={opportunity.id}
                      opportunity={opportunity}
                      isSelected={selectedOpportunity?.id === opportunity.id}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8">
                  <p className="font-mono text-xs font-black uppercase text-[#5b5b55]">
                    No matching records
                  </p>
                  <h2 className="mt-4 text-4xl font-black leading-none text-[#151515]">
                    Clear one filter.
                  </h2>
                  <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-[#3d3d38]">
                    The dashboard is filtering real entries, so narrower
                    combinations can become empty fast.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-6 border-4 border-[#151515] bg-[#151515] px-5 py-3 font-mono text-xs font-black uppercase text-[#fbfcf6] transition hover:bg-[#c94335] active:translate-y-[1px]"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <div className="xl:sticky xl:top-6 xl:self-start">
              <DetailPanel opportunity={selectedOpportunity} />
            </div>
          </section>
        </main>
      </div>
    </PageTransition>
  );
};

export default Index;
