import { UserCircle, LogOut, ChevronDown, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, logout, type Role } from "@/lib/auth";

const roleLabel: Record<Role, string> = {
  client: "Client",
  adviser: "Adviser",
  agent: "Agent",
};

const UserMenu = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const displayName = user?.name || "Guest";
  const displayEmail = user?.email || "";
  const displayRole = role ? roleLabel[role] : null;

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Clear all local demo data from this browser?\n\nThis will remove portfolio, PPOR, cashflow and onboarding data. Saved scenarios will be preserved. This cannot be undone."
      )
    ) {
      const savedScenarios = localStorage.getItem("saved-scenarios");
      localStorage.clear();
      if (savedScenarios) localStorage.setItem("saved-scenarios", savedScenarios);
      window.location.reload();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-accent border border-accent/20 hover:bg-accent/10 hover:border-accent/40 transition-all"
          aria-label="Account menu"
        >
          <UserCircle size={22} className="shrink-0" />
          <span className="hidden sm:inline text-xs md:text-sm font-medium max-w-[140px] truncate">
            {displayName}
          </span>
          <ChevronDown size={14} className="hidden sm:inline opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          {displayEmail && (
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          )}
          {displayRole && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
              {displayRole}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetData} className="cursor-pointer text-destructive focus:text-destructive">
          <RotateCcw size={14} className="mr-2" />
          Clear local data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut size={14} className="mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
