"use client";

import * as React from "react";
import { List, LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DisplayToggleProps {
  value: "list" | "card";
  onValueChange: (value: "list" | "card") => void;
  className?: string;
}

export function DisplayToggle({
  value,
  onValueChange,
  className,
}: DisplayToggleProps) {
  const isCardMode = value === "card";
  const Icon = isCardMode ? LayoutGrid : List;
  const displayText = isCardMode ? "卡片" : "列表";

  const handleToggle = (checked: boolean) => {
    onValueChange(checked ? "card" : "list");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2",
            className
          )}
        >
          <Switch checked={isCardMode} onCheckedChange={handleToggle} />
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{displayText}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>切換顯示模式</p>
      </TooltipContent>
    </Tooltip>
  );
}

