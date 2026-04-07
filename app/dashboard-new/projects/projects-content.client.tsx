"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Download, Plus, Search, CalendarDays, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { PROJECTS_PAGE } from "@/lib/message";
import { ALL_SPACES, getSpaceNameById } from "@/lib/config/config";
import {
  normalizeProjectStatusForUi,
  PROJECT_STATUS_UI_SELECTABLE,
  type ProjectStatusUi,
} from "@/lib/config/project-status";
import type { Project } from "@/lib/types/project";
import {
  buildProjectsListCsv,
  filterProjectsForDateRange,
  getProjectsListCsvFilename,
} from "@/lib/services/project/project-list-csv.service";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const ProjectsWeekCalendar = dynamic(
  () =>
    import("./projects-week-calendar.client").then((m) => m.ProjectsWeekCalendar),
  { ssr: false },
);

const ProjectsList = dynamic(
  () => import("./projects-list").then((m) => m.ProjectsList),
  { ssr: false },
);

/** Subsequence fuzzy match: query chars appear in order in text. */
function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return true;
  let j = 0;
  for (let i = 0; i < t.length && j < q.length; i++) {
    if (t[i] === q[j]) j++;
  }
  return j === q.length;
}

function filterProjectsFuzzy(projects: Project[], query: string): Project[] {
  const q = query.trim();
  if (!q) return projects;
  return projects.filter((p) => {
    const fields = [
      p.customer,
      p.eventOrVenueUse,
      p.space,
      p.contactPerson,
    ].filter(Boolean);
    return fields.some((field) => fuzzyMatch(field, q));
  });
}

interface ProjectsContentProps {
  projects: Project[];
}

function parseDateToDateOnly(value: string | undefined | null): Date | null {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = dateOnly ? new Date(`${value}T12:00:00`) : new Date(value);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  return d;
}

function rentalToDateRange(
  rental: NonNullable<Project["rentals"]>[number],
): DateRange | null {
  const from = parseDateToDateOnly(rental.date);
  const to = parseDateToDateOnly(rental.endDate ?? rental.date);
  if (!from || !to) return null;
  if (from <= to) return { from, to };
  return { from: to, to: from };
}

function matchesSelectedDateRange(
  projectRange: DateRange,
  selectedRange: DateRange,
): boolean {
  if (!projectRange.from || !projectRange.to) return false;

  const pFrom = startOfDay(projectRange.from);
  const pTo = endOfDay(projectRange.to);

  const sFrom = selectedRange.from ? startOfDay(selectedRange.from) : null;
  const sTo = selectedRange.to ? endOfDay(selectedRange.to) : null;

  if (sFrom && sTo) {
    return pFrom <= sTo && sFrom <= pTo;
  }

  if (sFrom) {
    return pTo >= sFrom;
  }

  if (sTo) {
    return pFrom <= sTo;
  }

  return true;
}

function formatDateRangeLabel(range: DateRange | undefined): string {
  if (!range?.from && !range?.to) return "全部";
  const fmt = new Intl.DateTimeFormat("zh-TW", { dateStyle: "short" });
  if (range.from && range.to) return `${fmt.format(range.from)}–${fmt.format(range.to)}`;
  if (range.from) return `${fmt.format(range.from)} 起`;
  return "全部";
}

function summarizeSelected(count: number, emptyLabel: string): string {
  if (count <= 0) return emptyLabel;
  return `已選 ${count}`;
}

export function ProjectsContent({ projects }: ProjectsContentProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [listCsvPopoverOpen, setListCsvPopoverOpen] = React.useState(false);
  const [listCsvRange, setListCsvRange] = React.useState<
    DateRange | undefined
  >(() => {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  });

  const [selectedSpaceIds, setSelectedSpaceIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [selectedStatusValues, setSelectedStatusValues] = React.useState<
    Set<ProjectStatusUi>
  >(() => new Set());
  const [selectedContactPeople, setSelectedContactPeople] = React.useState<
    Set<string>
  >(() => new Set());
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >(undefined);

  const contactPersonOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      if (p.contactPerson) set.add(p.contactPerson);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "zh-TW", { sensitivity: "base" }),
    );
  }, [projects]);

  const filteredProjects = React.useMemo(() => {
    const searched = filterProjectsFuzzy(projects, searchQuery);

    const hasAnyFilter =
      selectedSpaceIds.size > 0 ||
      selectedStatusValues.size > 0 ||
      selectedContactPeople.size > 0 ||
      Boolean(selectedDateRange?.from || selectedDateRange?.to);

    if (!hasAnyFilter) return searched;

    const selectedSpaceNameSet =
      selectedSpaceIds.size > 0
        ? new Set(Array.from(selectedSpaceIds, (id) => getSpaceNameById(id)))
        : null;

    return searched.filter((project) => {
      // space
      if (selectedSpaceIds.size > 0) {
        const rentals = project.rentals;
        const matchViaRental =
          rentals?.some((r) =>
            r.spaceIds.some((sid) => selectedSpaceIds.has(sid)),
          ) ?? false;
        const matchViaProjectSpaceName = selectedSpaceNameSet
          ? selectedSpaceNameSet.has(project.space)
          : false;
        if (!matchViaRental && !matchViaProjectSpaceName) return false;
      }

      // status (normalized to UI)
      if (selectedStatusValues.size > 0) {
        const uiStatus = normalizeProjectStatusForUi(project.status);
        if (!uiStatus || !selectedStatusValues.has(uiStatus)) return false;
      }

      // contact person
      if (selectedContactPeople.size > 0) {
        if (!selectedContactPeople.has(project.contactPerson)) return false;
      }

      // date range (intersection)
      if (selectedDateRange?.from || selectedDateRange?.to) {
        const rentals = project.rentals;
        if (rentals?.length) {
          const anyIntersect = rentals.some((r) => {
            const rRange = rentalToDateRange(r);
            if (!rRange?.from || !rRange?.to) return false;
            return matchesSelectedDateRange(rRange, selectedDateRange);
          });
          if (!anyIntersect) return false;
        } else {
          const date = parseDateToDateOnly(project.date);
          if (!date) return false;
          const pRange: DateRange = { from: date, to: date };
          if (!matchesSelectedDateRange(pRange, selectedDateRange)) return false;
        }
      }

      return true;
    });
  }, [
    projects,
    searchQuery,
    selectedContactPeople,
    selectedDateRange,
    selectedSpaceIds,
    selectedStatusValues,
  ]);

  const searchInputId = "projects-search";
  const dropdownResultsLimit = 8;

  const anyFiltersActive =
    selectedSpaceIds.size > 0 ||
    selectedStatusValues.size > 0 ||
    selectedContactPeople.size > 0 ||
    Boolean(selectedDateRange?.from || selectedDateRange?.to);

  const canDownloadListCsv = React.useMemo(() => {
    const r = listCsvRange;
    if (!r?.from || !r?.to) return false;
    return startOfDay(r.to) >= startOfDay(r.from);
  }, [listCsvRange]);

  const handleResetListCsvMonth = React.useCallback(() => {
    const now = new Date();
    setListCsvRange({ from: startOfMonth(now), to: endOfMonth(now) });
  }, []);

  const handleDownloadListCsv = React.useCallback(() => {
    if (!listCsvRange?.from || !listCsvRange?.to || !canDownloadListCsv) return;
    const { from, to } = listCsvRange;
    const filtered = filterProjectsForDateRange(projects, { from, to });
    const csv = buildProjectsListCsv(filtered);
    const filename = getProjectsListCsvFilename({ from, to });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setListCsvPopoverOpen(false);
  }, [projects, listCsvRange, canDownloadListCsv]);

  return (
    <div className="flex-1 min-w-0 p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 新增專案 */}
          <Link href="/dashboard-new/projects/new">
            <Button
              variant="default"
              className="gap-2"
              aria-label={PROJECTS_PAGE.createNewProjectAria}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              {PROJECTS_PAGE.createNewProject}
            </Button>
          </Link>
          {/* 下載列表 CSV */}
          <Popover
            open={listCsvPopoverOpen}
            onOpenChange={setListCsvPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                aria-label={PROJECTS_PAGE.downloadListCsvAria}
              >
                <Download className="size-4 shrink-0" aria-hidden />
                {PROJECTS_PAGE.downloadListCsv}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-auto max-w-[min(calc(100vw-2rem),22rem)] p-0"
            >
              <div className="p-2 md:p-3 lg:p-4 space-y-3">
                <div>
                  <p className="font-medium text-sm">
                    {PROJECTS_PAGE.downloadListCsvPopoverTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {PROJECTS_PAGE.downloadListCsvPopoverDescription}
                  </p>
                </div>
                <Calendar
                  mode="range"
                  selected={listCsvRange}
                  onSelect={setListCsvRange}
                  numberOfMonths={1}
                  defaultMonth={listCsvRange?.from}
                  className="w-full"
                />
                {/* Footer Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {/* 重置月份 */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetListCsvMonth}
                    aria-label={PROJECTS_PAGE.downloadListCsvResetMonthAria}
                  >
                    {PROJECTS_PAGE.downloadListCsvResetMonth}
                  </Button>
                  {/* 確認下載 */}
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canDownloadListCsv}
                    onClick={handleDownloadListCsv}
                  >
                    {PROJECTS_PAGE.downloadListCsvConfirm}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* Search Bar */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverAnchor asChild>
            <div className="relative flex-1 max-w-xl w-full">
              <Label htmlFor={searchInputId} className="sr-only">
                {PROJECTS_PAGE.searchAriaLabel}
              </Label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <Input
                id={searchInputId}
                type="search"
                autoComplete="off"
                placeholder={PROJECTS_PAGE.searchPlaceholder}
                value={searchQuery}
                onChange={(e) =>
                  React.startTransition(() =>
                    setSearchQuery(e.target.value),
                  )
                }
                onFocus={() => setSearchOpen(true)}
                className="pl-9"
                aria-label={PROJECTS_PAGE.searchAriaLabel}
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="max-h-[min(20rem,var(--radix-popover-content-available-height))] w-(--radix-popover-trigger-width) overflow-y-auto p-1"
          >
            {filteredProjects.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground px-2">
                {searchQuery.trim()
                  ? PROJECTS_PAGE.searchNoResults
                  : PROJECTS_PAGE.emptyProjects}
              </div>
            ) : (
              <ul role="list" className="outline-hidden">
                {filteredProjects.slice(0, dropdownResultsLimit).map((project) => (
                  <li key={project.id} role="listitem">
                    <Link
                      href={`/dashboard-new/projects/${project.id}`}
                      className="block cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setSearchOpen(false)}
                    >
                      <span className="font-medium truncate block">
                        {project.eventOrVenueUse}
                      </span>
                      <span className="text-muted-foreground text-xs truncate block">
                        {project.customer}
                        {project.space ? ` · ${project.space}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>

        {/* Filters */}
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="專案篩選器"
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="size-3.5" aria-hidden />
            篩選
          </span>

          {/* 場域 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-label={`場域篩選（${summarizeSelected(selectedSpaceIds.size, "全部")}）`}
              >
                場域
                <span className="text-muted-foreground">
                  {summarizeSelected(selectedSpaceIds.size, "全部")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(22rem,90vw)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">場域</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSelectedSpaceIds(new Set())}
                  disabled={selectedSpaceIds.size === 0}
                >
                  清除
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-auto pr-1">
                {ALL_SPACES.map((space) => {
                  const checked = selectedSpaceIds.has(space.id);
                  return (
                    <label
                      key={space.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border border-border/60 px-2 py-2 text-sm hover:bg-accent/40",
                        checked && "bg-accent/30",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          setSelectedSpaceIds((prev) => {
                            const set = new Set(prev);
                            if (next) set.add(space.id);
                            else set.delete(space.id);
                            return set;
                          });
                        }}
                        aria-label={`選取場域：${space.name}`}
                      />
                      <span className="min-w-0 truncate">{space.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {space.floor}
                      </span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* 日期 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-label={`日期篩選（${formatDateRangeLabel(selectedDateRange)}）`}
              >
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
                日期
                <span className="text-muted-foreground">
                  {formatDateRangeLabel(selectedDateRange)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">日期</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSelectedDateRange(undefined)}
                  disabled={!selectedDateRange?.from && !selectedDateRange?.to}
                >
                  清除
                </Button>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setSelectedDateRange({ from: today, to: today });
                  }}
                >
                  今天
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    setSelectedDateRange({
                      from: startOfWeek(now, { weekStartsOn: 1 }),
                      to: endOfWeek(now, { weekStartsOn: 1 }),
                    });
                  }}
                >
                  本週
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    setSelectedDateRange({
                      from: startOfMonth(now),
                      to: endOfMonth(now),
                    });
                  }}
                >
                  本月
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDateRange(undefined)}
                >
                  全部
                </Button>
              </div>

              <div className="mt-2">
                <Calendar
                  mode="range"
                  selected={selectedDateRange}
                  onSelect={setSelectedDateRange}
                  numberOfMonths={1}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* 活動狀態 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-label={`活動狀態篩選（${summarizeSelected(selectedStatusValues.size, "全部")}）`}
              >
                活動狀態
                <span className="text-muted-foreground">
                  {summarizeSelected(selectedStatusValues.size, "全部")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(18rem,90vw)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">活動狀態</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSelectedStatusValues(new Set())}
                  disabled={selectedStatusValues.size === 0}
                >
                  清除
                </Button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {PROJECT_STATUS_UI_SELECTABLE.map((opt) => {
                  const uiValue = normalizeProjectStatusForUi(opt.value);
                  if (!uiValue) return null;
                  const checked = selectedStatusValues.has(uiValue);
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-center gap-2 rounded-md border border-border/60 px-2 py-2 text-sm hover:bg-accent/40",
                        checked && "bg-accent/30",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          setSelectedStatusValues((prev) => {
                            const set = new Set(prev);
                            if (next) set.add(uiValue);
                            else set.delete(uiValue);
                            return set;
                          });
                        }}
                        aria-label={`選取狀態：${PROJECTS_PAGE[opt.labelKey]}`}
                      />
                      <span className="min-w-0 truncate">
                        {PROJECTS_PAGE[opt.labelKey]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* 接洽人 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-label={`接洽人篩選（${summarizeSelected(selectedContactPeople.size, "全部")}）`}
              >
                接洽人
                <span className="text-muted-foreground">
                  {summarizeSelected(selectedContactPeople.size, "全部")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(18rem,90vw)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">接洽人</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSelectedContactPeople(new Set())}
                  disabled={selectedContactPeople.size === 0}
                >
                  清除
                </Button>
              </div>
              <div className="mt-2 flex flex-col gap-2 max-h-72 overflow-auto pr-1">
                {contactPersonOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    目前沒有可用的接洽人選項
                  </p>
                ) : (
                  contactPersonOptions.map((name) => {
                    const checked = selectedContactPeople.has(name);
                    return (
                      <label
                        key={name}
                        className={cn(
                          "flex items-center gap-2 rounded-md border border-border/60 px-2 py-2 text-sm hover:bg-accent/40",
                          checked && "bg-accent/30",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            setSelectedContactPeople((prev) => {
                              const set = new Set(prev);
                              if (next) set.add(name);
                              else set.delete(name);
                              return set;
                            });
                          }}
                          aria-label={`選取接洽人：${name}`}
                        />
                        <span className="min-w-0 truncate">{name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* 清除全部 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => {
              setSelectedSpaceIds(new Set());
              setSelectedStatusValues(new Set());
              setSelectedContactPeople(new Set());
              setSelectedDateRange(undefined);
            }}
            disabled={!anyFiltersActive}
            aria-label="清除所有篩選條件"
          >
            <X className="size-4" aria-hidden />
            清除全部
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="list"
        className="flex-1 flex flex-col items-center min-w-0"
      >
        <TabsList
          className="w-full md:max-w-md grid grid-cols-2"
          aria-label={PROJECTS_PAGE.tabsAriaLabel}
        >
          <TabsTrigger value="list">{PROJECTS_PAGE.tabListView}</TabsTrigger>
          <TabsTrigger value="week">{PROJECTS_PAGE.tabWeekView}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 min-w-0 w-full">
          <ProjectsList projects={filteredProjects} />
        </TabsContent>

        <TabsContent value="week" className="flex-1 min-w-0 w-full">
          <ProjectsWeekCalendar projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
