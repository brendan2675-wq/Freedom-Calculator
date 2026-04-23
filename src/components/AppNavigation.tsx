import { BarChart3, Home, PieChart, Target } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const AppNavigation = () => {
  const { pathname } = useLocation();
  const { role } = useAuth();
  const dashboardUrl = role === "adviser" ? "/adviser" : role === "agent" ? "/agent" : "/";
  const showStrategyTools = role !== "agent";
  const items = [
    { label: "Dashboard", url: dashboardUrl, icon: Home, activePaths: ["/", "/dashboard", "/adviser", "/agent"] },
    { label: "Portfolio", url: "/portfolio", icon: PieChart, activePaths: ["/portfolio"] },
    ...(showStrategyTools
      ? [
          { label: "PPOR Goal", url: "/ppor-goal", icon: Target, activePaths: ["/ppor-goal"] },
          { label: "Cashflow", url: "/cashflow", icon: BarChart3, activePaths: ["/cashflow"] },
        ]
      : []),
  ];

  const isActive = (paths: string[]) => paths.includes(pathname);

  return (
    <>
      <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-xl border border-accent/20 bg-accent/10 p-1 md:flex">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.activePaths);
          return (
            <Link
              key={item.label}
              to={item.url}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary-foreground/80 transition-all hover:bg-accent/15 hover:text-accent",
                active && "bg-accent text-accent-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Primary navigation" className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur md:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.activePaths);
          return (
            <Link
              key={item.label}
              to={item.url}
              className={cn(
                "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent",
                active && "bg-accent/10 text-accent",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} />
              <span className="text-[11px] leading-none">{item.label.replace("PPOR ", "")}</span>
            </Link>
          );
        })}
        <UserMenu variant="tab" />
      </nav>
    </>
  );
};

export default AppNavigation;