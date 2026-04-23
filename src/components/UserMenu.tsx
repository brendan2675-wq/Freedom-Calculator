import { UserCircle, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, logout, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const roleLabel: Record<Role, string> = {
  client: "Client",
  adviser: "Adviser",
  agent: "Agent",
};

type UserMenuProps = {
  variant?: "header" | "tab";
};

const UserMenu = ({ variant = "header" }: UserMenuProps) => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const displayName = user?.name || "Guest";
  const displayEmail = user?.email || "";
  const displayRole = role ? roleLabel[role] : null;

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "transition-all",
            variant === "tab"
              ? "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent/10 hover:text-accent"
              : "flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-accent border border-accent/20 hover:bg-accent/10 hover:border-accent/40",
          )}
          aria-label="Account menu"
        >
          <UserCircle size={variant === "tab" ? 19 : 22} className="shrink-0" />
          <span className={cn(variant === "tab" ? "block text-[11px] leading-none" : "hidden sm:inline text-xs md:text-sm font-medium max-w-[140px] truncate")}>
            {variant === "tab" ? "Account" : displayName}
          </span>
          <span className="hidden sm:inline text-xs md:text-sm font-medium max-w-[140px] truncate">
            {displayName}
          </span>
          <ChevronDown size={14} className={cn("hidden opacity-70", variant === "header" && "sm:inline")} />
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
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut size={14} className="mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
