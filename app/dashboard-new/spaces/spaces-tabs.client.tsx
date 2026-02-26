"use client";

import * as React from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ALL_SPACES,
  SPACES_BY_FLOOR,
  type Space,
  type FloorKey,
} from "@/lib/config";
import { SPACES_PAGE } from "@/lib/message";
import { LayoutGrid, Building2 } from "lucide-react";

const TAB_VALUES = ["all", "3F", "4F", "5F"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function getSpacesForTab(value: TabValue): Space[] {
  if (value === "all") return ALL_SPACES;
  return SPACES_BY_FLOOR[value as FloorKey];
}

function SpaceCard({ space }: { space: Space }) {
  return (
    <li className="min-w-0 list-none">
      <Link href={`/dashboard-new/spaces/${space.name}`}>
        <Card className="transition-[box-shadow] hover:shadow-md motion-reduce:transition-none">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base line-clamp-2 min-w-0 flex-1">
                {space.name}
              </CardTitle>
              <Label
                asChild
                className="shrink-0 text-xs font-medium text-muted-foreground"
                aria-label="樓層"
              >
                <span>{space.floor}</span>
              </Label>
            </div>
          </CardHeader>
          {space.description ? (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {space.description}
              </p>
            </CardContent>
          ) : null}
        </Card>
      </Link>
    </li>
  );
}

function SpaceList({
  spaces,
  ariaLabel,
  sectionHeading,
}: {
  spaces: Space[];
  ariaLabel: string;
  sectionHeading: string;
}) {
  if (spaces.length === 0) {
    return (
      <section aria-label={ariaLabel}>
        <h2 className="text-lg font-semibold mb-4 text-balance">
          {sectionHeading}
        </h2>
        <p className="text-muted-foreground text-sm py-8 text-center">
          {SPACES_PAGE.emptyFloor}
        </p>
      </section>
    );
  }
  return (
    <section aria-label={ariaLabel}>
      <h2 className="text-lg font-semibold mb-4 text-balance">
        {sectionHeading}
      </h2>
      <ul
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {spaces.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </ul>
    </section>
  );
}

const TAB_LABELS: Record<TabValue, string> = {
  all: SPACES_PAGE.tabAll,
  "3F": SPACES_PAGE.tab3F,
  "4F": SPACES_PAGE.tab4F,
  "5F": SPACES_PAGE.tab5F,
};

const TAB_ARIA_LABELS: Record<TabValue, string> = {
  all: SPACES_PAGE.sectionAll,
  "3F": SPACES_PAGE.section3F,
  "4F": SPACES_PAGE.section4F,
  "5F": SPACES_PAGE.section5F,
};

export function SpacesTabs() {
  const [value, setValue] = React.useState<TabValue>("all");

  return (
    <div className="flex-1 p-6">
      <Tabs
        value={value}
        onValueChange={(v) => setValue(v as TabValue)}
        className="w-full"
      >
        <TabsList
          className="grid w-full max-w-md grid-cols-4"
          aria-label={SPACES_PAGE.tabsFilterAriaLabel}
        >
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            {TAB_LABELS.all}
          </TabsTrigger>
          <TabsTrigger value="3F" className="flex items-center gap-1.5">
            <Building2 className="size-4 shrink-0" aria-hidden />
            {TAB_LABELS["3F"]}
          </TabsTrigger>
          <TabsTrigger value="4F" className="flex items-center gap-1.5">
            <Building2 className="size-4 shrink-0" aria-hidden />
            {TAB_LABELS["4F"]}
          </TabsTrigger>
          <TabsTrigger value="5F" className="flex items-center gap-1.5">
            <Building2 className="size-4 shrink-0" aria-hidden />
            {TAB_LABELS["5F"]}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <SpaceList
            spaces={getSpacesForTab("all")}
            ariaLabel={TAB_ARIA_LABELS.all}
            sectionHeading={TAB_ARIA_LABELS.all}
          />
        </TabsContent>
        <TabsContent value="3F" className="mt-6">
          <SpaceList
            spaces={getSpacesForTab("3F")}
            ariaLabel={TAB_ARIA_LABELS["3F"]}
            sectionHeading={SPACES_PAGE.tab3F}
          />
        </TabsContent>
        <TabsContent value="4F" className="mt-6">
          <SpaceList
            spaces={getSpacesForTab("4F")}
            ariaLabel={TAB_ARIA_LABELS["4F"]}
            sectionHeading={SPACES_PAGE.tab4F}
          />
        </TabsContent>
        <TabsContent value="5F" className="mt-6">
          <SpaceList
            spaces={getSpacesForTab("5F")}
            ariaLabel={TAB_ARIA_LABELS["5F"]}
            sectionHeading={SPACES_PAGE.tab5F}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
