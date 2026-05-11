"use client";

/**
 * 專案列表載入中佔位：與 ProjectsList 外層版型一致，供歷史專案 bulk 載入時使用。
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROJECTS_LIST_COLUMNS } from "@/lib/config/projects-list-table";
import { cn } from "@/lib/utils";

const SKELETON_ROW_COUNT = 10;

export function ProjectsListSkeleton() {
  return (
    <section
      className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm [&_th]:p-4 [&_td]:p-4"
      aria-busy="true"
      aria-live="polite"
      aria-label="正在載入歷史專案"
    >
      <p className="sr-only">正在載入歷史專案</p>
      <div className="min-w-0 flex flex-col">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {PROJECTS_LIST_COLUMNS.map((column) => (
                  <TableHead
                    key={column.id}
                    scope="col"
                    className={cn(
                      "headerClassName" in column ? column.headerClassName : undefined,
                    )}
                  >
                    <Skeleton className="h-4 w-20 max-w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {PROJECTS_LIST_COLUMNS.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "cellClassName" in column ? column.cellClassName : undefined,
                      )}
                    >
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
          <Skeleton className="h-4 w-48" aria-hidden />
        </div>
      </div>
    </section>
  );
}
