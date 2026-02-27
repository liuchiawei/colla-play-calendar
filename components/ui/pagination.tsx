"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Pagination = ({
  className,
  ...props
}: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="分頁導航"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"button">;

const PaginationLink = ({
  className,
  isActive,
  disabled,
  ...props
}: PaginationLinkProps) => (
  <Button
    aria-current={isActive ? "page" : undefined}
    variant={isActive ? "default" : "outline"}
    size="icon"
    className={cn(
      "size-9",
      isActive && "pointer-events-none",
      className
    )}
    disabled={disabled}
    {...props}
  />
);

const PaginationPrevious = ({
  className,
  text = "上一頁",
  ...props
}: React.ComponentProps<"button"> & { text?: string }) => (
  <Button
    aria-label="上一頁"
    variant="outline"
    size="default"
    className={cn("gap-1 px-3 size-9", className)}
    {...props}
  >
    <ChevronLeftIcon className="size-4" />
    <span className="hidden sm:inline">{text}</span>
  </Button>
);

const PaginationNext = ({
  className,
  text = "下一頁",
  ...props
}: React.ComponentProps<"button"> & { text?: string }) => (
  <Button
    aria-label="下一頁"
    variant="outline"
    size="default"
    className={cn("gap-1 px-3 size-9", className)}
    {...props}
  >
    <span className="hidden sm:inline">{text}</span>
    <ChevronRightIcon className="size-4" />
  </Button>
);

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex size-9 items-center justify-center", className)}
    {...props}
  >
    <span className="text-muted-foreground">⋯</span>
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
