import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  FileDown,
} from "lucide-react";
import { DASHBOARD_NEW_LABELS } from "../message";

// Modern Admin Dashboard Navigation Configuration
// 現代化管理後台導航配置

export interface DashboardNewNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const dashboardNewNavigation: DashboardNewNavItem[] = [
  {
    href: "/dashboard-new",
    label: DASHBOARD_NEW_LABELS.overview,
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard-new/spaces",
    label: DASHBOARD_NEW_LABELS.spaces,
    icon: Building2,
  },
  {
    href: "/dashboard-new/projects",
    label: DASHBOARD_NEW_LABELS.projects,
    icon: FolderKanban,
  },
  {
    href: "/dashboard-new/users",
    label: DASHBOARD_NEW_LABELS.users,
    icon: Users,
  },
];

// Modern SaaS Color Palette
export const dashboardColors = {
  primary: {
    from: "oklch(0.65 0.25 270)", // Purple
    to: "oklch(0.70 0.20 320)", // Pink-Purple
  },
  accent: {
    electricBlue: "oklch(0.60 0.22 240)",
    neonGreen: "oklch(0.75 0.20 140)",
    cyberOrange: "oklch(0.70 0.22 50)",
    hotPink: "oklch(0.65 0.28 340)",
  },
} as const;
